-- Pricing v2: cost-bounded quotas.
--
-- Fixed costs (Vercel Pro + Supabase Pro ≈ 42 €/month) and variable AI costs
-- (≈ 0.07 $ per generated image) require every plan to have a hard monthly
-- ceiling. Daily caps remain as burst protection; a global daily image cap
-- protects the AI budget whatever the number of users.
--
--             Pins/month  AI images/month  AI texts/month  Autopilot
--  starter       5             5               20          no
--  pro         100           100              300          3 pins/day
--  business    300           300             1000          5 pins/day

-- ---------------------------------------------------------------------------
-- Monthly pin quota
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_pin_limit(p_plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_plan
    WHEN 'starter'  THEN 5
    WHEN 'pro'      THEN 100
    WHEN 'business' THEN 300
    ELSE 5
  END;
$$;

-- ---------------------------------------------------------------------------
-- AI / publish quotas: daily burst caps + monthly ceilings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_daily_quota(p_plan text, p_kind text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_kind
    WHEN 'ai_text'  THEN CASE p_plan WHEN 'business' THEN 150 WHEN 'pro' THEN 60  ELSE 10 END
    WHEN 'ai_image' THEN CASE p_plan WHEN 'business' THEN 40  WHEN 'pro' THEN 15  ELSE 3  END
    WHEN 'publish'  THEN CASE p_plan WHEN 'business' THEN 300 WHEN 'pro' THEN 120 ELSE 30 END
    ELSE 50
  END;
$$;

CREATE OR REPLACE FUNCTION public.plan_monthly_quota(p_plan text, p_kind text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_kind
    WHEN 'ai_text'  THEN CASE p_plan WHEN 'business' THEN 1000 WHEN 'pro' THEN 300 ELSE 20 END
    WHEN 'ai_image' THEN CASE p_plan WHEN 'business' THEN 300  WHEN 'pro' THEN 100 ELSE 5  END
    WHEN 'publish'  THEN CASE p_plan WHEN 'business' THEN 3000 WHEN 'pro' THEN 1200 ELSE 100 END
    ELSE 500
  END;
$$;

-- Global daily caps (budget guard across all users). Service role edits only.
CREATE TABLE IF NOT EXISTS public.app_limits (
  kind text PRIMARY KEY,
  daily_cap integer NOT NULL CHECK (daily_cap >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_limits FROM PUBLIC, anon, authenticated;
INSERT INTO public.app_limits (kind, daily_cap) VALUES
  ('ai_image', 400),   -- ≈ 28 $/day worst case
  ('ai_text', 3000)
ON CONFLICT (kind) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_api_usage_kind_day ON public.api_usage (kind, day);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_kind_day ON public.api_usage (user_id, kind, day);

CREATE OR REPLACE FUNCTION public.consume_quota(p_kind text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_plan text;
  v_day_limit integer;
  v_month_limit integer;
  v_global_cap integer;
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_count integer;
  v_month_used integer;
  v_global_used integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000';
  END IF;

  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_user;
  v_plan := COALESCE(v_plan, 'starter');
  v_day_limit := public.plan_daily_quota(v_plan, p_kind);
  v_month_limit := public.plan_monthly_quota(v_plan, p_kind);

  -- Global budget guard (checked before counting so a saturated day never increments).
  SELECT daily_cap INTO v_global_cap FROM public.app_limits WHERE kind = p_kind;
  IF v_global_cap IS NOT NULL THEN
    SELECT COALESCE(SUM(count), 0) INTO v_global_used FROM public.api_usage WHERE kind = p_kind AND day = v_today;
    IF v_global_used >= v_global_cap THEN
      RETURN jsonb_build_object('allowed', false, 'scope', 'global', 'used', v_global_used, 'limit', v_global_cap, 'plan', v_plan);
    END IF;
  END IF;

  -- Monthly ceiling (cost control).
  SELECT COALESCE(SUM(count), 0) INTO v_month_used
  FROM public.api_usage
  WHERE user_id = v_user AND kind = p_kind AND day >= date_trunc('month', v_today)::date;
  IF v_month_used >= v_month_limit THEN
    RETURN jsonb_build_object('allowed', false, 'scope', 'month', 'used', v_month_used, 'limit', v_month_limit, 'plan', v_plan);
  END IF;

  -- Daily burst cap.
  INSERT INTO public.api_usage (user_id, kind, day, count)
  VALUES (v_user, p_kind, v_today, 1)
  ON CONFLICT (user_id, kind, day)
  DO UPDATE SET count = public.api_usage.count + 1, updated_at = now()
  RETURNING count INTO v_count;

  IF v_count > v_day_limit THEN
    UPDATE public.api_usage SET count = count - 1 WHERE user_id = v_user AND kind = p_kind AND day = v_today;
    RETURN jsonb_build_object('allowed', false, 'scope', 'day', 'used', v_day_limit, 'limit', v_day_limit, 'plan', v_plan);
  END IF;

  RETURN jsonb_build_object(
    'allowed', true, 'scope', 'day', 'used', v_count, 'limit', v_day_limit, 'plan', v_plan,
    'monthUsed', v_month_used + 1, 'monthLimit', v_month_limit
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_quota(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_quota(text) TO authenticated, service_role;

-- Read-only usage summary for the dashboard (own data only).
CREATE OR REPLACE FUNCTION public.my_quota_usage()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH p AS (SELECT COALESCE(plan, 'starter') AS plan FROM public.profiles WHERE id = auth.uid()),
  m AS (
    SELECT kind, SUM(count)::int AS used FROM public.api_usage
    WHERE user_id = auth.uid() AND day >= date_trunc('month', (now() AT TIME ZONE 'utc')::date)::date
    GROUP BY kind
  )
  SELECT jsonb_build_object(
    'plan', (SELECT plan FROM p),
    'aiImage', jsonb_build_object('used', COALESCE((SELECT used FROM m WHERE kind = 'ai_image'), 0),
                                  'limit', public.plan_monthly_quota((SELECT plan FROM p), 'ai_image')),
    'aiText',  jsonb_build_object('used', COALESCE((SELECT used FROM m WHERE kind = 'ai_text'), 0),
                                  'limit', public.plan_monthly_quota((SELECT plan FROM p), 'ai_text')),
    'pins',    jsonb_build_object('used', (SELECT pins_created_this_month FROM public.profiles WHERE id = auth.uid()),
                                  'limit', public.plan_pin_limit((SELECT plan FROM p)))
  );
$$;
REVOKE EXECUTE ON FUNCTION public.my_quota_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_quota_usage() TO authenticated;

-- ---------------------------------------------------------------------------
-- Autopilot: paid plans only, capped per day
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_autopilot_daily(p_plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_plan WHEN 'business' THEN 5 WHEN 'pro' THEN 3 ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION public.block_disabled_autopilot_pins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_cap integer;
  v_today integer;
BEGIN
  IF NEW.source <> 'autopilot' THEN
    RETURN NEW;
  END IF;
  IF NOT COALESCE(public.autopilot_enabled_for(NEW.user_id), false) THEN
    RAISE EXCEPTION 'AUTOPILOT_DISABLED: autopilot is switched off for this account' USING ERRCODE = 'check_violation';
  END IF;

  SELECT COALESCE(plan, 'starter') INTO v_plan FROM public.profiles WHERE id = NEW.user_id;
  v_cap := public.plan_autopilot_daily(COALESCE(v_plan, 'starter'));
  IF v_cap = 0 THEN
    RAISE EXCEPTION 'AUTOPILOT_REQUIRES_PRO: autopilot is available on Pro and Business plans' USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*) INTO v_today FROM public.pins
  WHERE user_id = NEW.user_id AND source = 'autopilot' AND created_at >= date_trunc('day', now() AT TIME ZONE 'utc');
  IF v_today >= v_cap THEN
    RAISE EXCEPTION 'AUTOPILOT_DAILY_LIMIT: % autopilot pins per day on plan %', v_cap, v_plan USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
