-- ThreadZW clothing payment-state model:
-- free = cannot add products; pending_payment = up to 9; premium = unlimited.

ALTER TABLE public.shops
  ALTER COLUMN product_limit SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.fn_enforce_product_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  IF v_page_type IN ('clothing', 'fashion', 'apparel', 'boutique') AND v_plan IN ('pro', 'premium') THEN
    RETURN NEW;
  END IF;

  IF v_page_type IN ('clothing', 'fashion', 'apparel', 'boutique') THEN
    IF v_shop.payment_verification_status = 'pending' OR v_shop.account_status = 'pending_payment' THEN
      v_limit := 9;
    ELSE
      v_limit := 0;
    END IF;
  ELSIF lower(coalesce(v_shop.account_status, '')) = 'active' THEN
    RETURN NEW;
  ELSE
    v_limit := coalesce(v_shop.product_limit, 0);
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_product_count FROM public.products WHERE shop_id = NEW.shop_id AND is_published = TRUE;
    IF NEW.is_published = TRUE AND v_product_count >= v_limit THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PRODUCT_LIMIT_REACHED', DETAIL = format('Your current account allows a maximum of %s active products.', v_limit);
    END IF;
  ELSE
    SELECT COUNT(*) INTO v_product_count FROM public.products WHERE shop_id = NEW.shop_id AND is_published = TRUE AND id <> NEW.id;
    IF v_product_count >= v_limit AND NEW.is_published = TRUE AND OLD.is_published = FALSE THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PRODUCT_LIMIT_REACHED', DETAIL = format('Your current account allows a maximum of %s active products.', v_limit);
    END IF;
  END IF;

  IF v_shop.account_status = 'pending_payment' OR v_shop.payment_verification_status = 'pending' THEN
    NEW.created_during_pending_payment := true;
  END IF;

  RETURN NEW;
END;
$function$;

UPDATE public.shops
SET product_limit = 0
WHERE lower(coalesce(page_type, 'clothing')) IN ('clothing','fashion','apparel','boutique')
  AND lower(coalesce(plan, 'free')) NOT IN ('premium','pro')
  AND coalesce(account_status, 'free') <> 'pending_payment'
  AND coalesce(payment_verification_status, '') <> 'pending';

UPDATE public.shops
SET product_limit = 9
WHERE lower(coalesce(page_type, 'clothing')) IN ('clothing','fashion','apparel','boutique')
  AND (coalesce(account_status, '') = 'pending_payment' OR coalesce(payment_verification_status, '') = 'pending')
  AND lower(coalesce(plan, 'free')) NOT IN ('premium','pro');

UPDATE public.shops
SET product_limit = NULL,
    payment_required = false,
    payment_status = 'paid',
    payment_verification_status = 'approved',
    premium_status = 'active',
    account_status = 'active'
WHERE lower(coalesce(plan, 'free')) IN ('premium','pro')
  AND lower(coalesce(page_type, 'clothing')) IN ('clothing','fashion','apparel','boutique');
