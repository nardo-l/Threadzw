CREATE OR REPLACE FUNCTION public.get_shop_product_limit(target_shop_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT lower(coalesce(account_status, 'free')) INTO v_status
  FROM public.shops WHERE id = target_shop_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  CASE v_status
    WHEN 'active' THEN RETURN NULL;
    WHEN 'pending_payment' THEN RETURN 9;
    ELSE RETURN 0;
  END CASE;
END;
$$;
