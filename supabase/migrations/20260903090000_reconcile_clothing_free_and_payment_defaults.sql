-- Reconcile the live clothing plan with the production contract.
-- Free: 9 active products, no visitor/interest quota, no payment required.
-- Premium: $9 USD one-time lifetime access.
-- Legacy payment tables remain read-only historical storage.

ALTER TABLE public.shops
  ALTER COLUMN product_limit SET DEFAULT 9;

UPDATE public.shops
SET
  product_limit = CASE WHEN lower(coalesce(plan, 'free')) IN ('premium','pro') THEN NULL ELSE 9 END,
  payment_required = false,
  payment_status = CASE WHEN lower(coalesce(plan, 'free')) IN ('premium','pro') THEN 'paid' ELSE 'free' END,
  premium_status = CASE WHEN lower(coalesce(plan, 'free')) IN ('premium','pro') THEN 'active' ELSE 'inactive' END
WHERE lower(coalesce(page_type, 'clothing')) IN ('clothing','fashion','apparel','boutique');

ALTER TABLE public.subscriptions
  ALTER COLUMN amount SET DEFAULT 9,
  ALTER COLUMN currency SET DEFAULT 'USD',
  ALTER COLUMN billing_cycle SET DEFAULT 'none',
  ALTER COLUMN provider SET DEFAULT 'nardopay',
  ALTER COLUMN status SET DEFAULT 'pending';

CREATE OR REPLACE FUNCTION public.fn_enforce_product_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_shop public.shops%ROWTYPE;
  v_product_count integer;
  v_limit integer;
  v_page_type text;
  v_plan text;
BEGIN
  SELECT * INTO v_shop FROM public.shops WHERE id = NEW.shop_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHOP_NOT_FOUND';
  END IF;

  v_page_type := lower(coalesce(v_shop.page_type, 'clothing'));
  v_plan := lower(coalesce(v_shop.plan, 'free'));

  IF v_page_type IN ('clothing','fashion','apparel','boutique')
     AND v_plan IN ('pro','premium') THEN
    RETURN NEW;
  END IF;

  IF v_page_type IN ('clothing','fashion','apparel','boutique') THEN
    v_limit := 9;
  ELSE
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_product_count FROM public.products
    WHERE shop_id = NEW.shop_id AND is_published = TRUE;

    IF NEW.is_published = TRUE AND v_product_count >= v_limit THEN
      RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='PRODUCT_LIMIT_REACHED',
        DETAIL=format('Free accounts can have a maximum of %s active products.',v_limit);
    END IF;
  ELSE
    SELECT COUNT(*) INTO v_product_count FROM public.products
    WHERE shop_id=NEW.shop_id AND is_published=TRUE AND id<>NEW.id;

    IF v_product_count >= v_limit AND NEW.is_published=TRUE AND OLD.is_published=FALSE THEN
      RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='PRODUCT_LIMIT_REACHED',
        DETAIL=format('Free accounts can have a maximum of %s active products.',v_limit);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON TABLE public.shop_payments IS 'LEGACY: historical payment records only; current premium flow uses subscriptions + payment_events + NardoPay.';
COMMENT ON TABLE public.shop_plans IS 'LEGACY: historical plan records only; current premium flow uses subscriptions + payment_events + NardoPay.';
