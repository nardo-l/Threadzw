create or replace function public.create_shop_from_onboarding(p_shop jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_shop_id uuid;
  v_name text := nullif(trim(p_shop->>'name'),'');
  v_slug text := nullif(trim(p_shop->>'slug'),'');
  v_city text := nullif(trim(p_shop->>'city'),'');
  v_phone text := nullif(trim(p_shop->>'whatsapp_number'),'');
  v_bio text := nullif(trim(p_shop->>'bio'),'');
begin
  if v_user is null then raise exception 'UNAUTHORIZED'; end if;
  if v_name is null then raise exception 'SHOP_NAME_REQUIRED'; end if;
  if v_city is null then raise exception 'SHOP_CITY_REQUIRED'; end if;
  if v_phone is null then raise exception 'WHATSAPP_REQUIRED'; end if;
  if v_slug is null then v_slug := 'shop-' || substr(replace(v_user::text,'-',''),1,12); end if;

  select id into v_shop_id from public.shops where owner_id = v_user limit 1;

  if v_shop_id is null then
    insert into public.shops (owner_id,name,slug,category,description,bio,whatsapp_number,city,location,page_type,template_id,is_active,storefront_published,setup_completed,onboarding_completed,setup_step,plan,premium_status,product_limit,account_status,payment_required,payment_status,payment_verification_status)
    values (v_user,v_name,v_slug,'Streetwear & Fashion',coalesce(nullif(trim(p_shop->>'description'),''),v_name || ' official storefront on ThreadZW.'),v_bio,v_phone,v_city,v_city,'clothing','urban',false,false,true,true,8,'free','inactive',0,'free',true,'unpaid','none')
    returning id into v_shop_id;
  else
    update public.shops set name=v_name,slug=v_slug,category='Streetwear & Fashion',description=coalesce(nullif(trim(p_shop->>'description'),''),v_name || ' official storefront on ThreadZW.'),bio=v_bio,whatsapp_number=v_phone,city=v_city,location=v_city,page_type='clothing',template_id='urban',is_active=false,storefront_published=false,setup_completed=true,onboarding_completed=true,setup_step=8,plan='free',premium_status='inactive',product_limit=0,account_status='free',payment_required=true,payment_status='unpaid',payment_verification_status='none',updated_at=now() where id=v_shop_id;
  end if;
  return v_shop_id;
end;
$$;

revoke all on function public.create_shop_from_onboarding(jsonb) from public;
grant execute on function public.create_shop_from_onboarding(jsonb) to authenticated;
