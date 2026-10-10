-- Start the standard 3-day unlimited trial when a merchant completes onboarding.
-- The existing product-access trigger permits product changes while this trial is
-- active and switches the shop to view-only access after expiry / pending payment.
CREATE OR REPLACE FUNCTION public.create_shop_from_onboarding(p_shop jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid();
  new_shop public.shops;
  requested_name text := nullif(trim(p_shop->>'name'),'');
  base_slug text := lower(trim(both '-' from regexp_replace(coalesce(p_shop->>'slug',''),'[^a-zA-Z0-9]+','-','g')));
  final_slug text;
  n integer := 0;
  trial_start timestamptz := now();
begin
  if uid is null then raise exception 'UNAUTHORIZED'; end if;
  if requested_name is null then raise exception 'SHOP_NAME_REQUIRED'; end if;
  if base_slug='' then base_slug:='shop'; end if;
  final_slug:=base_slug;

  while exists(select 1 from public.shops where slug=final_slug) loop
    n:=n+1;
    final_slug:=base_slug||'-'||n;
  end loop;

  if exists(select 1 from public.shops where owner_id=uid) then raise exception 'SHOP_ALREADY_EXISTS'; end if;

  insert into public.shops(
    owner_id,name,slug,description,bio,whatsapp_number,city,page_type,
    is_active,storefront_published,setup_completed,onboarding_completed,
    plan,premium_status,product_limit,account_status,payment_required,
    payment_status,payment_verification_status,subscription_status,
    trial_started_at,trial_ends_at,paid_at
  )
  values(
    uid,requested_name,final_slug,coalesce(p_shop->>'description',''),p_shop->>'bio',
    p_shop->>'whatsapp_number',p_shop->>'city','clothing',
    true,true,true,true,
    'free','inactive',0,'trial',false,
    'unpaid',null,'trial',
    trial_start,trial_start + interval '3 days',null
  )
  returning * into new_shop;

  return new_shop.id;
end;
$function$;
