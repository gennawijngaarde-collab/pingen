-- Pin limits: Pro 150 / Business 600 per month.
-- Trial reminder: store Stripe trial_end so the daily cron can email 2 days before.

CREATE OR REPLACE FUNCTION public.plan_pin_limit(p_plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_plan
    WHEN 'starter'  THEN 5
    WHEN 'pro'      THEN 150
    WHEN 'business' THEN 600
    ELSE 5
  END;
$$;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_end timestamptz,
  ADD COLUMN IF NOT EXISTS trial_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_used_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end
  ON public.subscriptions (trial_end)
  WHERE trial_end IS NOT NULL AND trial_reminder_sent_at IS NULL;

-- Recipients whose trial ends in ~2 days (36–60h window) and have not been emailed yet.
CREATE OR REPLACE FUNCTION public.trial_reminders_due()
RETURNS TABLE (user_id uuid, email text, plan text, trial_end timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.user_id, u.email, s.plan, s.trial_end
  FROM public.subscriptions s
  JOIN auth.users u ON u.id = s.user_id
  WHERE s.trial_end IS NOT NULL
    AND s.trial_reminder_sent_at IS NULL
    AND s.status IN ('active', 'past_due')
    AND s.trial_end > (now() + interval '36 hours')
    AND s.trial_end <= (now() + interval '60 hours')
    AND u.email IS NOT NULL
    AND u.deleted_at IS NULL
  LIMIT 50;
$$;

REVOKE EXECUTE ON FUNCTION public.trial_reminders_due() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trial_reminders_due() TO service_role;
