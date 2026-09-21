-- Permanent Clothing Free plan: remove trial/pending-payment gating and allow 3 active products.
-- Free access is time-unlimited. Premium remains unlimited after payment verification.
-- There is no visitor or interest-event quota on the Free plan.

ALTER TABLE public.shops
  ALTER COLUMN product_limit SET DEFAULT 3;

UPDATE public.shops
SET
  product_limit = CASE
    WHEN lower(coalesce(plan, 'free')) IN ('pro', 'premium') THEN NULL
    WHEN payment_verification_status = 'pending' OR account_status = 'pending_payment' THEN 10
    ELSE 3
  END,
  payment_required = CASE
    WHEN lower(coalesce(plan, 'free')) IN ('pro', 'premium') THEN payment_required
    ELSE false
  END
WHERE lower(coalesce(page_type, 'clothing')) IN ('clothing', 'fashion', 'apparel', 'boutique', 'storefront');

CREATE OR REPLACE FUNCTION public.get_shop_product_limit(target_shop_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_page_type text;
BEGIN
  SELECT
    lower(coalesce(plan, 'free')),
    lower(coalesce(page_type, 'clothing'))
  INTO v_plan, v_page_type
  FROM public.shops
  WHERE id = target_shop_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_page_type IN ('clothing', 'fashion', 'apparel', 'boutique', 'storefront') THEN
    IF v_plan IN ('pro', 'premium') THEN
      RETURN NULL;
    END IF;
    RETURN 9;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_enforce_product_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop public.shops%ROWTYPE;
  v_product_count integer;
  v_limit integer;
  v_page_type text;
  v_plan text;
BEGIN
  SELECT * INTO v_shop
  FROM public.shops
  WHERE id = NEW.shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHOP_NOT_FOUND';
  END IF;

  v_page_type := lower(coalesce(v_shop.page_type, 'clothing'));
  v_plan := lower(coalesce(v_shop.plan, 'free'));

  IF v_page_type IN ('clothing', 'fashion', 'apparel', 'boutique', 'storefront') THEN
    IF v_plan IN ('pro', 'premium') THEN
      RETURN NEW;
    END IF;
    v_limit := CASE WHEN v_shop.payment_verification_status = 'pending' OR v_shop.account_status = 'pending_payment' THEN 10 ELSE 3 END;;
  ELSE
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_product_count
  FROM public.products
  WHERE shop_id = NEW.shop_id
    AND is_published = TRUE
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF NEW.is_published = TRUE AND v_product_count >= v_limit THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'PRODUCT_LIMIT_REACHED',
      DETAIL = format('Free accounts can have a maximum of %s active products.', v_limit);
  END IF;

  RETURN NEW;
END;
$$;
