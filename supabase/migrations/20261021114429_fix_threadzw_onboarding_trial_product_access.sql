-- Keep onboarding aligned with the 3-day unlimited trial introduced in
-- 20261009000000_threadzw_three_day_trial_monthly_pro.sql.
-- Also persist optional shop profile fields from the current onboarding UI.
CREATE OR REPLACE FUNCTION public.create_shop_from_onboarding(p_shop jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  uid uuid := auth.uid();
  new_shop public.shops;
  requested_name text := nullif(trim(p_shop->>'name'),'');
  base_slug text := lower(trim(both '-' from regexp_replace(coalesce(p_shop->>'slug',''),'[^a-zA-Z0-9]+','-','g')));
  final_slug text;
  requested_city text := nullif(trim(p_shop->>'city'),'');
  requested_phone text := nullif(trim(p_shop->>'whatsapp_number'),'');
  requested_logo text := nullif(trim(p_shop->>'logo_url'),'');
  requested_categories text[];
  n integer := 0;
  trial_start timestamptz := now();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  IF requested_name IS NULL THEN RAISE EXCEPTION 'SHOP_NAME_REQUIRED'; END IF;
  IF requested_city IS NULL THEN RAISE EXCEPTION 'SHOP_CITY_REQUIRED'; END IF;
  IF requested_phone IS NULL THEN RAISE EXCEPTION 'WHATSAPP_REQUIRED'; END IF;

  IF base_slug = '' THEN
    base_slug := lower(trim(both '-' from regexp_replace(requested_name,'[^a-zA-Z0-9]+','-','g')));
  END IF;
  IF base_slug = '' THEN base_slug := 'shop'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.shops WHERE slug = final_slug) LOOP
    n := n + 1;
    final_slug := base_slug || '-' || n;
  END LOOP;

  IF EXISTS (SELECT 1 FROM public.shops WHERE owner_id = uid) THEN
    RAISE EXCEPTION 'SHOP_ALREADY_EXISTS';
  END IF;

  SELECT COALESCE(array_agg(DISTINCT trim(value)), '{}'::text[])
    INTO requested_categories
  FROM jsonb_array_elements_text(
    CASE WHEN jsonb_typeof(p_shop->'categories') = 'array'
      THEN p_shop->'categories' ELSE '[]'::jsonb END
  ) AS values(value)
  WHERE trim(value) <> '';

  INSERT INTO public.shops(
    owner_id, name, slug, description, bio, whatsapp_number, city, location,
    logo_url, categories, category, page_type, template_id,
    is_active, storefront_published, setup_completed, onboarding_completed, setup_step,
    plan, premium_status, product_limit, account_status, payment_required,
    payment_status, payment_verification_status, subscription_status,
    trial_started_at, trial_ends_at, paid_at
  )
  VALUES(
    uid, requested_name, final_slug,
    COALESCE(NULLIF(trim(p_shop->>'description'),''), requested_name || ' official storefront on ThreadZW.'),
    NULLIF(trim(p_shop->>'bio'),''),
    requested_phone, requested_city, requested_city,
    requested_logo, requested_categories,
    COALESCE(requested_categories[1], 'Streetwear & Fashion'),
    'clothing', COALESCE(NULLIF(trim(p_shop->>'template_id'),''),'urban'),
    true, true, true, true, 8,
    'free', 'inactive', NULL, 'trial', false,
    'unpaid', 'none', 'trial',
    trial_start, trial_start + interval '3 days', NULL
  )
  RETURNING * INTO new_shop;

  RETURN new_shop.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_shop_from_onboarding(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.create_shop_from_onboarding(jsonb) TO authenticated;
