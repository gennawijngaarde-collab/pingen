-- Supabase security advisor follow-ups.

-- Pin search_path on SECURITY DEFINER / trigger helpers (prevents search_path hijacking).
ALTER FUNCTION public.reset_monthly_pin_count() SET search_path = public;
ALTER FUNCTION public.increment_pin_count(uuid) SET search_path = public;
ALTER FUNCTION public.check_pin_limit(uuid) SET search_path = public;
ALTER FUNCTION public.plan_pin_limit(text) SET search_path = public;
ALTER FUNCTION public.plan_daily_quota(text, text) SET search_path = public;

-- Event-trigger helper: only Postgres needs to call it.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
