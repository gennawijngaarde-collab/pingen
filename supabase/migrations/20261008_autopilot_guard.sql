-- Autopilot hard stop.
-- The autopilot on/off state lives in auth.users.raw_user_meta_data->'autopilot'.
-- Pins tag their origin, and the database refuses autopilot-generated pins when
-- the account's autopilot is off — whatever client (stale tab, old bundle,
-- concurrent device) attempts the insert.

ALTER TABLE public.pins
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_source_check;
ALTER TABLE public.pins
  ADD CONSTRAINT pins_source_check CHECK (source IN ('manual', 'autopilot', 'autopilot_manual', 'bulk'));

CREATE INDEX IF NOT EXISTS idx_pins_user_source_status ON public.pins (user_id, source, status);

CREATE OR REPLACE FUNCTION public.autopilot_enabled_for(p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((raw_user_meta_data -> 'autopilot' ->> 'enabled')::boolean, false)
  FROM auth.users
  WHERE id = p_user;
$$;
REVOKE EXECUTE ON FUNCTION public.autopilot_enabled_for(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.autopilot_enabled_for(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.block_disabled_autopilot_pins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source = 'autopilot' AND NOT COALESCE(public.autopilot_enabled_for(NEW.user_id), false) THEN
    RAISE EXCEPTION 'AUTOPILOT_DISABLED: autopilot is switched off for this account'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pins_block_disabled_autopilot ON public.pins;
CREATE TRIGGER pins_block_disabled_autopilot
  BEFORE INSERT ON public.pins
  FOR EACH ROW EXECUTE FUNCTION public.block_disabled_autopilot_pins();
