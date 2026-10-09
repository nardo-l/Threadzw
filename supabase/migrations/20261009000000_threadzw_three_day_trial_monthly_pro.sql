-- ThreadZW clothing subscription model: 3-day unlimited trial, then paid monthly Pro.
-- A shop is never on a permanent free tier. Trial expiry and pending payment are
-- view-only states; payment approval is the only route to monthly Pro access.

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

ALTER TABLE public.subscriptions
  ALTER COLUMN amount SET DEFAULT 1.59,
  ALTER COLUMN billing_cycle SET DEFAULT 'monthly';

-- Existing non-Pro clothing accounts do not receive a fresh trial merely because
-- this migration is deployed: their original shop creation date determines expiry.
UPDATE public.shops
SET trial_started_at = COALESCE(trial_started_at, created_at, now()),
    trial_ends_at = COALESCE(trial_ends_at, COALESCE(created_at, now()) + interval '3 days')
WHERE lower(coalesce(page_type, 'clothing')) IN ('clothing','fashion','apparel','boutique')
  AND lower(coalesce(plan, 'free')) NOT IN ('pro','premium')
  AND lower(coalesce(account_status, '')) <> 'pending_payment';

UPDATE public.shops
SET account_status = 'expired',
    subscription_status = 'expired',
    payment_required = true,
    payment_status = COALESCE(NULLIF(payment_status, ''), 'unpaid'),
    product_limit = 0,
    updated_at = now()
WHERE lower(coalesce(page_type, 'clothing')) IN ('clothing','fashion','apparel','boutique')
  AND lower(coalesce(plan, 'free')) NOT IN ('pro','premium')
  AND trial_ends_at <= now()
  AND lower(coalesce(account_status, '')) <> 'pending_payment';

CREATE OR REPLACE FUNCTION public.fn_threadzw_initialize_clothing_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(coalesce(NEW.page_type, 'clothing')) IN ('clothing','fashion','apparel','boutique')
     AND lower(coalesce(NEW.plan, 'free')) NOT IN ('pro','premium')
     AND NEW.trial_started_at IS NULL
     AND NEW.trial_ends_at IS NULL THEN
    NEW.trial_started_at := now();
    NEW.trial_ends_at := now() + interval '3 days';
    NEW.plan := 'free';
    NEW.account_status := 'trial';
    NEW.subscription_status := 'trial';
    NEW.payment_required := true;
    NEW.payment_status := 'unpaid';
    NEW.payment_verification_status := 'none';
    NEW.product_limit := NULL;
    NEW.is_active := true;
    NEW.storefront_published := true;
    NEW.published_at := COALESCE(NEW.published_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_threadzw_initialize_clothing_trial ON public.shops;
CREATE TRIGGER trg_threadzw_initialize_clothing_trial
BEFORE INSERT ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.fn_threadzw_initialize_clothing_trial();

-- Product writes are allowed only during the 3-day trial or during a valid Pro
-- period. Existing storefront products remain readable while the shop is view-only.
CREATE OR REPLACE FUNCTION public.fn_enforce_threadzw_paid_product_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id uuid;
  v_shop public.shops%ROWTYPE;
  v_period_end timestamptz;
  v_has_pro boolean := false;
  v_trial_active boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_shop_id := OLD.shop_id;
  ELSE
    v_shop_id := NEW.shop_id;
  END IF;

  SELECT * INTO v_shop
  FROM public.shops
  WHERE id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHOP_NOT_FOUND';
  END IF;

  IF lower(coalesce(v_shop.page_type, 'clothing')) NOT IN ('clothing','fashion','apparel','boutique') THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT current_period_end INTO v_period_end
  FROM public.subscriptions
  WHERE shop_id = v_shop_id
    AND lower(coalesce(status, '')) = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  v_has_pro := lower(coalesce(v_shop.plan, '')) IN ('pro','premium')
    AND lower(coalesce(v_shop.account_status, '')) = 'active'
    AND (v_period_end IS NULL OR v_period_end > now());

  v_trial_active := v_shop.trial_ends_at IS NOT NULL
    AND v_shop.trial_ends_at > now()
    AND lower(coalesce(v_shop.account_status, '')) IN ('trial','free')
    AND lower(coalesce(v_shop.payment_verification_status, 'none')) NOT IN ('pending','rejected');

  IF NOT v_has_pro AND NOT v_trial_active THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'SHOP_VIEW_ONLY',
      DETAIL = 'Your 3-day trial has ended or payment is awaiting verification. Submit payment and wait for admin approval to edit products.';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_product_quota ON public.products;
DROP TRIGGER IF EXISTS trg_threadzw_paid_product_access ON public.products;
CREATE TRIGGER trg_threadzw_paid_product_access
BEFORE INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_threadzw_paid_product_access();

-- Admin approval remains authoritative. When the admin activates Pro, record a
-- one-month entitlement from the approval timestamp.
CREATE OR REPLACE FUNCTION public.fn_threadzw_start_paid_month_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz;
BEGIN
  IF lower(coalesce(NEW.page_type, 'clothing')) IN ('clothing','fashion','apparel','boutique')
     AND lower(coalesce(NEW.plan, '')) IN ('pro','premium')
     AND lower(coalesce(NEW.account_status, '')) = 'active'
     AND (
       lower(coalesce(NEW.payment_verification_status, '')) IN ('verified','approved')
       OR lower(coalesce(NEW.payment_status, '')) = 'paid'
       OR lower(coalesce(OLD.account_status, '')) <> 'active'
     ) THEN
    v_start := CASE
      WHEN NEW.payment_verified_at IS DISTINCT FROM OLD.payment_verified_at THEN NEW.payment_verified_at
      WHEN NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN NEW.paid_at
      ELSE now()
    END;
    NEW.plan := 'pro';
    NEW.account_status := 'active';
    NEW.subscription_status := 'active';
    NEW.payment_required := false;
    NEW.payment_status := 'paid';
    NEW.payment_verification_status := 'verified';
    NEW.payment_verified_at := COALESCE(NEW.payment_verified_at, v_start);
    NEW.paid_at := COALESCE(NEW.paid_at, v_start);
    NEW.product_limit := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_threadzw_start_paid_month_on_approval ON public.shops;
CREATE TRIGGER trg_threadzw_start_paid_month_on_approval
BEFORE UPDATE OF plan, account_status, payment_status, payment_verification_status ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.fn_threadzw_start_paid_month_on_approval();

CREATE OR REPLACE FUNCTION public.fn_threadzw_sync_subscription_after_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz;
BEGIN
  IF lower(coalesce(NEW.page_type, 'clothing')) IN ('clothing','fashion','apparel','boutique')
     AND lower(coalesce(NEW.plan, '')) IN ('pro','premium')
     AND lower(coalesce(NEW.account_status, '')) = 'active'
     AND lower(coalesce(NEW.payment_verification_status, '')) IN ('verified','approved')
     AND (
       lower(coalesce(OLD.plan, '')) NOT IN ('pro','premium')
       OR lower(coalesce(OLD.account_status, '')) <> 'active'
       OR lower(coalesce(OLD.payment_verification_status, '')) NOT IN ('verified','approved')
       OR lower(coalesce(OLD.payment_status, '')) <> 'paid'
     ) THEN
    v_start := CASE
      WHEN NEW.payment_verified_at IS DISTINCT FROM OLD.payment_verified_at THEN NEW.payment_verified_at
      WHEN NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN NEW.paid_at
      ELSE now()
    END;

    UPDATE public.subscriptions
    SET plan = 'premium',
        status = 'active',
        amount = 1.59,
        currency = 'USD',
        billing_cycle = 'monthly',
        current_period_start = v_start,
        current_period_end = v_start + interval '1 month',
        updated_at = now()
    WHERE shop_id = NEW.id;

    IF NOT FOUND THEN
      INSERT INTO public.subscriptions (
        profile_id, owner_id, shop_id, category, plan, amount, currency,
        billing_cycle, provider, status, current_period_start, current_period_end,
        created_at, updated_at
      ) VALUES (
        NEW.owner_id, NEW.owner_id, NEW.id, 'clothing', 'premium', 1.59, 'USD',
        'monthly', 'nardopay', 'active', v_start, v_start + interval '1 month',
        now(), now()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_threadzw_sync_subscription_after_approval ON public.shops;
CREATE TRIGGER trg_threadzw_sync_subscription_after_approval
AFTER UPDATE OF plan, account_status, payment_status, payment_verification_status ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.fn_threadzw_sync_subscription_after_approval();
