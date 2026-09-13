-- Finalize the current ThreadZW clothing payment flow.
-- Free: 0 products. Pending payment: up to 9. Approved Premium: unlimited.
-- NardoPay return/webhooks do not activate Premium; approval is authoritative.

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
  SELECT * INTO v_shop FROM public.shops WHERE id = NEW.shop_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHOP_NOT_FOUND'; END IF;

  v_page_type := lower(coalesce(v_shop.page_type, 'clothing'));
  v_plan := lower(coalesce(v_shop.plan, 'free'));

  IF v_page_type IN ('clothing','fashion','apparel','boutique') AND v_plan IN ('pro','premium')
     AND lower(coalesce(v_shop.account_status,'')) = 'active' THEN
    RETURN NEW;
  END IF;

  IF v_page_type IN ('clothing','fashion','apparel','boutique') THEN
    IF lower(coalesce(v_shop.account_status,'')) = 'pending_payment'
       OR lower(coalesce(v_shop.payment_verification_status,'')) = 'pending' THEN
      v_limit := 9;
    ELSE
      v_limit := 0;
    END IF;
  ELSE
    v_limit := coalesce(v_shop.product_limit, 0);
  END IF;

  SELECT COUNT(*) INTO v_product_count FROM public.products
  WHERE shop_id = NEW.shop_id AND is_published = TRUE AND (TG_OP = 'INSERT' OR id <> NEW.id);

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

CREATE OR REPLACE FUNCTION public.create_shop_from_onboarding(p_shop jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_shop public.shops;
  requested_name text := nullif(trim(p_shop->>'name'), '');
  base_slug text := lower(trim(both '-' from regexp_replace(coalesce(p_shop->>'slug',''), '[^a-zA-Z0-9]+', '-', 'g')));
  final_slug text;
  n integer := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  IF requested_name IS NULL THEN RAISE EXCEPTION 'SHOP_NAME_REQUIRED'; END IF;
  IF base_slug = '' THEN base_slug := 'shop'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.shops WHERE slug = final_slug) LOOP
    n := n + 1; final_slug := base_slug || '-' || n;
  END LOOP;

  IF EXISTS (SELECT 1 FROM public.shops WHERE owner_id = uid) THEN
    RAISE EXCEPTION 'SHOP_ALREADY_EXISTS';
  END IF;

  INSERT INTO public.shops (
    owner_id,name,slug,description,bio,whatsapp_number,city,page_type,
    is_active,storefront_published,setup_completed,onboarding_completed,
    plan,premium_status,product_limit,account_status,payment_required,
    payment_status,payment_verification_status
  ) VALUES (
    uid,requested_name,final_slug,coalesce(p_shop->>'description',''),p_shop->>'bio',
    p_shop->>'whatsapp_number',p_shop->>'city','clothing',false,false,true,true,
    'free','inactive',0,'free',true,'unpaid','none'
  ) RETURNING id INTO new_shop;
  RETURN new_shop.id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_shop_from_onboarding(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_shop_from_onboarding(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_threadzw_payment(shop_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); s public.shops; sub public.subscriptions; now_ts timestamptz := now();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT * INTO s FROM public.shops WHERE id=shop_uuid AND owner_id=uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_SHOP'; END IF;
  IF s.plan IN ('premium','pro') AND s.account_status='active' THEN RAISE EXCEPTION 'ALREADY_SUBSCRIBED'; END IF;

  UPDATE public.shops SET account_status='pending_payment',subscription_status='pending',product_limit=9,
    payment_required=true,payment_status='pending',payment_verification_status='pending',
    payment_submitted_at=coalesce(payment_submitted_at,now_ts),is_active=false,storefront_published=false,
    published_at=null,updated_at=now_ts WHERE id=s.id;

  INSERT INTO public.subscriptions(profile_id,shop_id,owner_id,category,plan,amount,currency,billing_cycle,provider,status,created_at,updated_at)
  VALUES(uid,s.id,uid,'clothing','premium',9,'USD','none','nardopay','pending',now_ts,now_ts)
  ON CONFLICT (profile_id) DO UPDATE SET shop_id=excluded.shop_id,owner_id=excluded.owner_id,category='clothing',plan='premium',amount=9,currency='USD',billing_cycle='none',provider='nardopay',status='pending',updated_at=now_ts
  RETURNING * INTO sub;

  RETURN jsonb_build_object('subscription_id',sub.id,'url','https://threadzw.nardopay.com/pay/threadzwmonthlysubscriptions','redirect_url','https://threadzw.vercel.app/subscription/success','amount',9,'currency','USD','billing_cycle','none');
END;
$$;
REVOKE ALL ON FUNCTION public.start_threadzw_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_threadzw_payment(uuid) TO authenticated;
