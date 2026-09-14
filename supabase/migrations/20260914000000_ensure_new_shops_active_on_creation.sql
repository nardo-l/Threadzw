-- New ThreadZW shops are live immediately after onboarding.
-- Payment status still controls product entitlements and Premium activation.
-- Keep this function SECURITY DEFINER so onboarding can create the shop safely.

CREATE OR REPLACE FUNCTION public.create_shop_from_onboarding(p_shop jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  new_shop public.shops;
  requested_name text := nullif(trim(p_shop->>'name'),'');
  base_slug text := lower(trim(both '-' from regexp_replace(coalesce(p_shop->>'slug',''),'[^a-zA-Z0-9]+','-','g')));
  final_slug text;
  n integer := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  IF requested_name IS NULL THEN RAISE EXCEPTION 'SHOP_NAME_REQUIRED'; END IF;
  IF base_slug='' THEN base_slug:='shop'; END IF;
  final_slug:=base_slug;

  WHILE EXISTS(SELECT 1 FROM public.shops WHERE slug=final_slug) LOOP
    n:=n+1;
    final_slug:=base_slug||'-'||n;
  END LOOP;

  IF EXISTS(SELECT 1 FROM public.shops WHERE owner_id=uid) THEN RAISE EXCEPTION 'SHOP_ALREADY_EXISTS'; END IF;

  INSERT INTO public.shops(
    owner_id,name,slug,description,bio,whatsapp_number,city,page_type,
    is_active,storefront_published,setup_completed,onboarding_completed,
    plan,premium_status,product_limit,account_status,payment_required,
    payment_status,payment_verification_status
  )
  VALUES(
    uid,requested_name,final_slug,coalesce(p_shop->>'description',''),p_shop->>'bio',
    p_shop->>'whatsapp_number',p_shop->>'city','clothing',
    true,true,true,true,
    'free','inactive',0,'active',true,
    'unpaid','none'
  )
  RETURNING id INTO new_shop;

  RETURN new_shop.id;
END;
$function$;
