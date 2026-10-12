-- Reliable 5-minute trigger for the automation endpoint.
--
-- GitHub Actions `schedule` is heavily throttled (observed: one run every 3–7 h)
-- and Vercel Hobby allows a single daily cron. pg_cron + pg_net run inside the
-- Supabase project, every minute if needed, at no extra cost.
--
-- The bearer token lives in Supabase Vault under `genx_cron_secret` and must
-- equal the Vercel `CRON_SECRET` env var. Rotate both together:
--   select vault.update_secret((select id from vault.secrets where name = 'genx_cron_secret'), '<new>');

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper so the job definitions stay short and the secret is read at run time.
CREATE OR REPLACE FUNCTION public.call_automation_endpoint(p_task text DEFAULT 'publish')
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret text;
  v_url text := 'https://www.pingenx.io/api/cron/publish-scheduled-pins';
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'genx_cron_secret';
  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'vault secret genx_cron_secret is missing';
  END IF;
  IF p_task = 'autopilot' THEN
    v_url := v_url || '?task=autopilot';
  END IF;
  RETURN net.http_post(
    url := v_url,
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.call_automation_endpoint(text) FROM PUBLIC, anon, authenticated;

-- Idempotent (re)scheduling.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('genx-publish-due-pins', 'genx-autopilot');
SELECT cron.schedule('genx-publish-due-pins', '*/5 * * * *',   $$SELECT public.call_automation_endpoint('publish')$$);
SELECT cron.schedule('genx-autopilot',        '2-59/5 * * * *', $$SELECT public.call_automation_endpoint('autopilot')$$);

-- Keep the run history small.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'genx-cron-housekeeping';
SELECT cron.schedule('genx-cron-housekeeping', '15 3 * * *',
  $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'$$);
