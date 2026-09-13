CREATE OR REPLACE FUNCTION public.fn_enforce_product_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  IF v_page_type IN ('clothing','fashion','apparel','boutique') AND v_plan IN ('pro','premium') THEN
    RETURN NEW;
  END IF;

  IF v_page_type IN ('clothing','fashion','apparel','boutique') THEN
    IF lower(coalesce(v_shop.account_status,'')) = 'pending_payment'
       OR lower(coalesce(v_shop.payment_verification_status,'')) = 'pending' THEN
      v_limit := 9;
    ELSE
      v_limit := 0;
    END IF;
  ELSIF lower(coalesce(v_shop.account_status,'')) = 'active' THEN
    RETURN NEW;
  ELSE
    v_limit := coalesce(v_shop.product_limit, 0);
  END IF;

  SELECT COUNT(*) INTO v_product_count
  FROM public.products
  WHERE shop_id = NEW.shop_id
    AND is_published = TRUE
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF TG_OP = 'INSERT' AND v_limit = 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PRODUCT_LIMIT_REACHED', DETAIL = 'Subscribe for $9 once-off to start adding products.';
  END IF;

  IF NEW.is_published = TRUE AND v_product_count >= v_limit THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PRODUCT_LIMIT_REACHED', DETAIL = format('Your current account allows a maximum of %s active products.', v_limit);
  END IF;

  IF lower(coalesce(v_shop.account_status,'')) = 'pending_payment'
     OR lower(coalesce(v_shop.payment_verification_status,'')) = 'pending' THEN
    NEW.created_during_pending_payment := true;
  END IF;

  RETURN NEW;
END;
$$;
