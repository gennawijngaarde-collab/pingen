-- ============================================================================
-- GenX — security hardening & scale readiness
-- Applied to production on 2026-09-26. Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Least privilege on tables
--    The app never talks to the database as `anon` (every query carries a user
--    JWT), and no client ever needs TRUNCATE / REFERENCES / TRIGGER.
-- ----------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM authenticated;

-- Internal job table: server-only.
REVOKE ALL ON public.scheduled_jobs FROM authenticated;

-- Analytics rows are produced by the server, users only read them.
REVOKE INSERT, UPDATE, DELETE ON public.pin_analytics FROM authenticated;

-- Billing state is owned by Stripe (webhook / confirm endpoint with service role).
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM authenticated;

-- ----------------------------------------------------------------------------
-- 2. profiles: users may only edit their display data.
--    plan / counters are set by the server (service role) or by triggers.
-- ----------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
GRANT INSERT (id, full_name, avatar_url, updated_at) ON public.profiles TO authenticated;
GRANT UPDATE (full_name, avatar_url, updated_at) ON public.profiles TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. The dashboard view leaked every user's stats (views bypass RLS unless
--    security_invoker is on).
-- ----------------------------------------------------------------------------
ALTER VIEW public.user_dashboard_stats SET (security_invoker = true);
REVOKE ALL ON public.user_dashboard_stats FROM anon, authenticated;
GRANT SELECT ON public.user_dashboard_stats TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. Functions: nothing callable by anon; counters are server/trigger only.
-- ----------------------------------------------------------------------------
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reset_monthly_pin_count() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_pin_count(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_pin_limit(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ----------------------------------------------------------------------------
-- 5. Plan limits
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_pin_limit(p_plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'starter'  THEN 10
    WHEN 'pro'      THEN 100
    WHEN 'business' THEN 2147483647
    ELSE 10
  END;
$$;

-- Server-enforced monthly pin quota. Also keeps profiles.pins_created_this_month
-- accurate (self-healing: recomputed from real rows on every insert, so no
-- monthly reset job is required).
CREATE OR REPLACE FUNCTION public.enforce_pin_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_limit integer;
  v_count integer;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.user_id;
  v_limit := public.plan_pin_limit(COALESCE(v_plan, 'starter'));

  SELECT count(*) INTO v_count
  FROM public.pins
  WHERE user_id = NEW.user_id
    AND created_at >= date_trunc('month', now());

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'PIN_LIMIT_REACHED: monthly pin limit (%) reached for plan %', v_limit, COALESCE(v_plan, 'starter')
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.profiles
  SET pins_created_this_month = v_count + 1,
      updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_pin_quota() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS pins_enforce_quota ON public.pins;
CREATE TRIGGER pins_enforce_quota
  BEFORE INSERT ON public.pins
  FOR EACH ROW EXECUTE FUNCTION public.enforce_pin_quota();

CREATE OR REPLACE FUNCTION public.recount_pins_this_month()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET pins_created_this_month = (
        SELECT count(*) FROM public.pins
        WHERE user_id = OLD.user_id AND created_at >= date_trunc('month', now())
      ),
      updated_at = now()
  WHERE id = OLD.user_id;
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.recount_pins_this_month() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS pins_recount_after_delete ON public.pins;
CREATE TRIGGER pins_recount_after_delete
  AFTER DELETE ON public.pins
  FOR EACH ROW EXECUTE FUNCTION public.recount_pins_this_month();

-- ----------------------------------------------------------------------------
-- 6. pinterest_accounts_connected maintained by trigger (was client-written)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_pinterest_account_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  UPDATE public.profiles
  SET pinterest_accounts_connected = (
        SELECT count(*) FROM public.pinterest_accounts
        WHERE user_id = v_user AND COALESCE(is_active, true)
      ),
      updated_at = now()
  WHERE id = v_user;
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_pinterest_account_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS pinterest_accounts_sync_count ON public.pinterest_accounts;
CREATE TRIGGER pinterest_accounts_sync_count
  AFTER INSERT OR UPDATE OF is_active OR DELETE ON public.pinterest_accounts
  FOR EACH ROW EXECUTE FUNCTION public.sync_pinterest_account_count();

-- Backfill.
UPDATE public.profiles p
SET pinterest_accounts_connected = (
  SELECT count(*) FROM public.pinterest_accounts a
  WHERE a.user_id = p.id AND COALESCE(a.is_active, true)
);

-- ----------------------------------------------------------------------------
-- 7. Publishing lock: several publishers can run concurrently (GitHub cron,
--    Vercel cron, in-app publisher of every user). A pin must be claimed
--    before it is sent to Pinterest so it is never published twice.
-- ----------------------------------------------------------------------------
ALTER TABLE public.pins ADD COLUMN IF NOT EXISTS locked_at timestamptz;

-- Users edit their pin content, but never identity/lock columns.
REVOKE UPDATE ON public.pins FROM authenticated;
GRANT UPDATE (
  title, description, image_url, link, board_id, board_name, status,
  scheduled_at, published_at, pinterest_pin_id, hashtags, alt_text,
  retry_count, error_message, updated_at
) ON public.pins TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_pins_for_publishing(p_ids uuid[])
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.pins
  SET locked_at = now()
  WHERE id = ANY (p_ids)
    AND status IN ('scheduled', 'failed', 'draft')
    AND user_id = COALESCE(auth.uid(), user_id)
    AND (locked_at IS NULL OR locked_at < now() - interval '3 minutes')
  RETURNING id;
$$;
REVOKE EXECUTE ON FUNCTION public.claim_pins_for_publishing(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_pins_for_publishing(uuid[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.release_pin_lock(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.pins
  SET locked_at = NULL
  WHERE id = p_id
    AND user_id = COALESCE(auth.uid(), user_id);
$$;
REVOKE EXECUTE ON FUNCTION public.release_pin_lock(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_pin_lock(uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 8. AI usage quotas (per user, per day, per plan) — consumed by the server
--    with the caller's JWT so auth.uid() is the caller.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, day)
);
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_usage FROM anon, authenticated;
DROP POLICY IF EXISTS "Users can view own usage" ON public.api_usage;
CREATE POLICY "Users can view own usage" ON public.api_usage FOR SELECT USING (auth.uid() = user_id);
GRANT SELECT ON public.api_usage TO authenticated;

CREATE OR REPLACE FUNCTION public.plan_daily_quota(p_plan text, p_kind text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_kind
    WHEN 'ai_text' THEN CASE p_plan WHEN 'business' THEN 1000 WHEN 'pro' THEN 200 ELSE 30 END
    WHEN 'ai_image' THEN CASE p_plan WHEN 'business' THEN 400 WHEN 'pro' THEN 100 ELSE 15 END
    WHEN 'publish' THEN CASE p_plan WHEN 'business' THEN 2000 WHEN 'pro' THEN 300 ELSE 60 END
    ELSE 100
  END;
$$;

CREATE OR REPLACE FUNCTION public.consume_quota(p_kind text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_plan text;
  v_limit integer;
  v_count integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000';
  END IF;

  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_user;
  v_limit := public.plan_daily_quota(COALESCE(v_plan, 'starter'), p_kind);

  INSERT INTO public.api_usage (user_id, kind, day, count)
  VALUES (v_user, p_kind, (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (user_id, kind, day)
  DO UPDATE SET count = public.api_usage.count + 1, updated_at = now()
  RETURNING count INTO v_count;

  IF v_count > v_limit THEN
    -- Undo the increment so the counter stays meaningful.
    UPDATE public.api_usage SET count = count - 1
    WHERE user_id = v_user AND kind = p_kind AND day = (now() AT TIME ZONE 'utc')::date;
    RETURN jsonb_build_object('allowed', false, 'used', v_limit, 'limit', v_limit, 'plan', COALESCE(v_plan, 'starter'));
  END IF;

  RETURN jsonb_build_object('allowed', true, 'used', v_count, 'limit', v_limit, 'plan', COALESCE(v_plan, 'starter'));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_quota(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_quota(text) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 9. Signup notification anti-abuse: the public notify endpoint may only send
--    an email for an account that really was created in the last 15 minutes.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.signup_recently_created(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(p_email)
      AND created_at > now() - interval '15 minutes'
  );
$$;
REVOKE EXECUTE ON FUNCTION public.signup_recently_created(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.signup_recently_created(text) TO service_role;

-- ----------------------------------------------------------------------------
-- 10. Billing integrity
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_key ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription ON public.subscriptions(stripe_subscription_id);

-- ----------------------------------------------------------------------------
-- 11. Indexes for the hot paths at scale
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pins_due ON public.pins(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_pins_user_created ON public.pins(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pins_user_status ON public.pins(user_id, status);

-- ----------------------------------------------------------------------------
-- 12. Pin images live in Storage (bucket `pin-images`, public read), not as
--     300 KB base64 blobs inside the pins table. Each user writes only to
--     their own folder (<user_id>/...).
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pin-images', 'pin-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "pin images are publicly readable" ON storage.objects;
CREATE POLICY "pin images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pin-images');

DROP POLICY IF EXISTS "users upload to their own pin folder" ON storage.objects;
CREATE POLICY "users upload to their own pin folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pin-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users update their own pin images" ON storage.objects;
CREATE POLICY "users update their own pin images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'pin-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users delete their own pin images" ON storage.objects;
CREATE POLICY "users delete their own pin images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pin-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- 13. Data integrity guards users could previously bypass
-- ----------------------------------------------------------------------------
ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_title_length;
ALTER TABLE public.pins ADD CONSTRAINT pins_title_length CHECK (char_length(title) BETWEEN 1 AND 200);
ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_description_length;
ALTER TABLE public.pins ADD CONSTRAINT pins_description_length CHECK (description IS NULL OR char_length(description) <= 2000);
ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_image_url_https;
ALTER TABLE public.pins ADD CONSTRAINT pins_image_url_https CHECK (image_url ~* '^(https://|data:image/)');
ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_link_http;
ALTER TABLE public.pins ADD CONSTRAINT pins_link_http CHECK (link IS NULL OR link = '' OR link ~* '^https?://');
