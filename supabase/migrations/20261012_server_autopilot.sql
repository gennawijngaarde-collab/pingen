-- Server-side autopilot
-- The cron (GitHub Actions every 5 min / Vercel daily) now generates autopilot
-- pins for every enabled account, so users no longer need an open dashboard.
-- Everything here is callable by the service role only.

-- 1. Quota consumption on behalf of a given user ------------------------------
CREATE OR REPLACE FUNCTION public.consume_quota_for(p_user uuid, p_kind text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_day_limit integer;
  v_month_limit integer;
  v_global_cap integer;
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_count integer;
  v_month_used integer;
  v_global_used integer;
BEGIN
  IF p_user IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000';
  END IF;

  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user;
  v_plan := COALESCE(v_plan, 'starter');
  v_day_limit := public.plan_daily_quota(v_plan, p_kind);
  v_month_limit := public.plan_monthly_quota(v_plan, p_kind);

  SELECT daily_cap INTO v_global_cap FROM public.app_limits WHERE kind = p_kind;
  IF v_global_cap IS NOT NULL THEN
    SELECT COALESCE(SUM(count), 0) INTO v_global_used FROM public.api_usage WHERE kind = p_kind AND day = v_today;
    IF v_global_used >= v_global_cap THEN
      RETURN jsonb_build_object('allowed', false, 'scope', 'global', 'used', v_global_used, 'limit', v_global_cap, 'plan', v_plan);
    END IF;
  END IF;

  SELECT COALESCE(SUM(count), 0) INTO v_month_used
  FROM public.api_usage
  WHERE user_id = p_user AND kind = p_kind AND day >= date_trunc('month', v_today)::date;
  IF v_month_used >= v_month_limit THEN
    RETURN jsonb_build_object('allowed', false, 'scope', 'month', 'used', v_month_used, 'limit', v_month_limit, 'plan', v_plan);
  END IF;

  INSERT INTO public.api_usage (user_id, kind, day, count)
  VALUES (p_user, p_kind, v_today, 1)
  ON CONFLICT (user_id, kind, day)
  DO UPDATE SET count = public.api_usage.count + 1, updated_at = now()
  RETURNING count INTO v_count;

  IF v_count > v_day_limit THEN
    UPDATE public.api_usage SET count = count - 1 WHERE user_id = p_user AND kind = p_kind AND day = v_today;
    RETURN jsonb_build_object('allowed', false, 'scope', 'day', 'used', v_day_limit, 'limit', v_day_limit, 'plan', v_plan);
  END IF;

  RETURN jsonb_build_object(
    'allowed', true, 'scope', 'day', 'used', v_count, 'limit', v_day_limit, 'plan', v_plan,
    'monthUsed', v_month_used + 1, 'monthLimit', v_month_limit
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_quota_for(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_quota_for(uuid, text) TO service_role;

-- The user-facing RPC becomes a thin wrapper (same behaviour as before).
CREATE OR REPLACE FUNCTION public.consume_quota(p_kind text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000';
  END IF;
  RETURN public.consume_quota_for(auth.uid(), p_kind);
END;
$$;

-- 2. Accounts the cron must serve -------------------------------------------
CREATE OR REPLACE FUNCTION public.autopilot_accounts()
RETURNS TABLE (user_id uuid, plan text, settings jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id,
         COALESCE(p.plan, 'starter'),
         u.raw_user_meta_data->'autopilot'
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE (u.raw_user_meta_data->'autopilot'->>'enabled') = 'true'
    AND u.deleted_at IS NULL
    AND (u.banned_until IS NULL OR u.banned_until < now())
    AND public.plan_autopilot_daily(COALESCE(p.plan, 'starter')) > 0;
$$;
REVOKE EXECUTE ON FUNCTION public.autopilot_accounts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.autopilot_accounts() TO service_role;

-- 3. Per-user lease so two overlapping cron runs never generate the same slot --
CREATE TABLE IF NOT EXISTS public.autopilot_leases (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  leased_until timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.autopilot_leases ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service role (bypasses RLS) touches this table.

CREATE OR REPLACE FUNCTION public.claim_autopilot_lease(p_user uuid, p_seconds integer DEFAULT 120)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok boolean;
BEGIN
  INSERT INTO public.autopilot_leases (user_id, leased_until)
  VALUES (p_user, now() + make_interval(secs => GREATEST(p_seconds, 10)))
  ON CONFLICT (user_id) DO UPDATE
    SET leased_until = EXCLUDED.leased_until, updated_at = now()
    WHERE public.autopilot_leases.leased_until < now()
  RETURNING true INTO v_ok;
  RETURN COALESCE(v_ok, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_autopilot_lease(p_user uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.autopilot_leases SET leased_until = now(), updated_at = now() WHERE user_id = p_user;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_autopilot_lease(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_autopilot_lease(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_autopilot_lease(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_autopilot_lease(uuid) TO service_role;
