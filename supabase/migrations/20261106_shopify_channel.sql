-- Shopify channel, additive only.
-- SaaS rows stay on auth.users / subscriptions (Stripe). Shopify shops never
-- write those billing columns. New tables are service-role only: the embedded
-- app calls Vercel, which verifies the Shopify session, then uses the service
-- role. The anon key used by the GenX SPA cannot read shop rows.

-- ---------------------------------------------------------------------------
-- Shops
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shopify_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain text NOT NULL,
  shop_gid text,
  status text NOT NULL DEFAULT 'installed' CHECK (status IN ('installed', 'uninstalled')),
  -- AES-GCM payload produced by the API. No plaintext Shopify token.
  access_token_enc text,
  token_key_version smallint NOT NULL DEFAULT 1,
  scopes text,
  installed_at timestamptz NOT NULL DEFAULT now(),
  uninstalled_at timestamptz,
  -- Optional link when the merchant also has a GenX login. Deleting that
  -- login must not uninstall the shop.
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shopify_shops_domain_lowercase CHECK (shop_domain = lower(shop_domain))
);

CREATE UNIQUE INDEX IF NOT EXISTS shopify_shops_domain_key ON public.shopify_shops (shop_domain);

ALTER TABLE public.shopify_shops ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shopify_shops FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Shopify Billing. Distinct from public.subscriptions (Stripe).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shopify_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL UNIQUE REFERENCES public.shopify_shops(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'none',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'frozen', 'cancelled', 'expired')),
  shopify_charge_gid text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shopify_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shopify_subscriptions FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Product snapshot used to draft pins. Not a live catalog.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shopify_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shopify_shops(id) ON DELETE CASCADE,
  product_gid text NOT NULL,
  title text NOT NULL,
  handle text,
  image_url text,
  product_url text,
  product_status text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, product_gid)
);

CREATE INDEX IF NOT EXISTS idx_shopify_products_shop ON public.shopify_products (shop_id);

ALTER TABLE public.shopify_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shopify_products FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pinterest connection owned by the shop, not by a GenX user.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_pinterest_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL UNIQUE REFERENCES public.shopify_shops(id) ON DELETE CASCADE,
  pinterest_user_id text NOT NULL,
  username text NOT NULL,
  access_token_enc text NOT NULL,
  refresh_token_enc text,
  token_key_version smallint NOT NULL DEFAULT 1,
  token_expires_at timestamptz,
  boards jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_pinterest_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shop_pinterest_accounts FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Quotas for the shop. public.api_usage stays per GenX user.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_api_usage (
  shop_id uuid NOT NULL REFERENCES public.shopify_shops(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('ai_text', 'ai_image', 'publish')),
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shop_id, kind, day)
);

ALTER TABLE public.shop_api_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shop_api_usage FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Webhook idempotency, including the mandatory GDPR topics.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shopify_webhook_events (
  webhook_id text PRIMARY KEY,
  shop_domain text NOT NULL,
  topic text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shopify_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shopify_webhook_events FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pins: a row belongs to a GenX user, a Shopify shop, or both.
-- Existing SaaS rows keep their user_id and a null shop_id.
-- ---------------------------------------------------------------------------
ALTER TABLE public.pins
  ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shopify_shops(id) ON DELETE CASCADE;

ALTER TABLE public.pins
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

ALTER TABLE public.pins ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_owner_check;
ALTER TABLE public.pins
  ADD CONSTRAINT pins_owner_check CHECK (user_id IS NOT NULL OR shop_id IS NOT NULL);

ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_source_check;
ALTER TABLE public.pins
  ADD CONSTRAINT pins_source_check CHECK (source IN ('manual', 'autopilot', 'autopilot_manual', 'bulk', 'shopify'));

CREATE INDEX IF NOT EXISTS idx_pins_shop_status ON public.pins (shop_id, status);

-- The SPA session cannot attach a pin to a shop (that would also skip the SaaS quota).
-- A shop pin cannot enter the publisher queue without an explicit approval.
CREATE OR REPLACE FUNCTION public.block_unapproved_shop_pins()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.shop_id IS NOT NULL THEN
    RAISE EXCEPTION 'SHOP_PIN_FORBIDDEN: shop pins are written by the Shopify app'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.shop_id IS NOT NULL
     AND NEW.status IN ('scheduled', 'published')
     AND NEW.approved_at IS NULL THEN
    RAISE EXCEPTION 'SHOP_PIN_NOT_APPROVED: a Shopify pin cannot be scheduled or published before explicit approval'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pins_block_unapproved_shop ON public.pins;
CREATE TRIGGER pins_block_unapproved_shop
  BEFORE INSERT OR UPDATE OF status, approved_at, shop_id ON public.pins
  FOR EACH ROW EXECUTE FUNCTION public.block_unapproved_shop_pins();

-- Shop-only pins do not consume the GenX monthly pin quota.
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
  IF NEW.shop_id IS NOT NULL AND NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.user_id;
  v_limit := public.plan_pin_limit(COALESCE(v_plan, 'starter'));

  SELECT count(*) INTO v_count
  FROM public.pins
  WHERE user_id = NEW.user_id
    AND shop_id IS NULL
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

CREATE OR REPLACE FUNCTION public.recount_pins_this_month()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.profiles
  SET pins_created_this_month = (
        SELECT count(*) FROM public.pins
        WHERE user_id = OLD.user_id
          AND shop_id IS NULL
          AND created_at >= date_trunc('month', now())
      ),
      updated_at = now()
  WHERE id = OLD.user_id;
  RETURN NULL;
END;
$$;

-- Service role can claim an approved shop pin. A signed-in GenX user cannot.
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
    AND (locked_at IS NULL OR locked_at < now() - interval '3 minutes')
    AND (
      (shop_id IS NULL AND user_id = COALESCE(auth.uid(), user_id))
      OR (
        auth.uid() IS NULL
        AND shop_id IS NOT NULL
        AND approved_at IS NOT NULL
        AND status = 'scheduled'
      )
    )
  RETURNING id;
$$;

CREATE OR REPLACE FUNCTION public.release_pin_lock(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.pins
  SET locked_at = NULL
  WHERE id = p_id
    AND (
      (shop_id IS NULL AND user_id = COALESCE(auth.uid(), user_id))
      OR (auth.uid() IS NULL AND shop_id IS NOT NULL)
    );
$$;
