-- A pending renewal must not be mistaken for a legacy subscription with no expiry.
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
  v_subscription_status text;
  v_has_subscription boolean := false;
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

  SELECT status, current_period_end
    INTO v_subscription_status, v_period_end
  FROM public.subscriptions
  WHERE shop_id = v_shop_id
  ORDER BY created_at DESC
  LIMIT 1;
  v_has_subscription := FOUND;

  v_has_pro := lower(coalesce(v_shop.plan, '')) IN ('pro','premium')
    AND lower(coalesce(v_shop.account_status, '')) = 'active'
    AND (
      NOT v_has_subscription
      OR (
        lower(coalesce(v_subscription_status, '')) = 'active'
        AND (v_period_end IS NULL OR v_period_end > now())
      )
    );

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
