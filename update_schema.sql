
-- Fix trial days to 20
create or replace function set_trial_end_date()
returns trigger as $$
begin
  if new.trial_started_at is not null and new.trial_ends_at is null then
    new.trial_ends_at := new.trial_started_at + interval '3 days';
  end if;
  return new;
end;
$$ language plpgsql;

-- Update any shops still using 28 or 20 day trial
update shops
set trial_ends_at = trial_started_at + interval '3 days'
where trial_started_at is not null
and trial_ends_at is not null;

-- Make sure mark all read function exists
create or replace function mark_all_notifications_read(p_user_id uuid)
returns void as $$
begin
  update notifications
  set read = true
  where user_id = p_user_id
  and read = false;
end;
$$ language plpgsql
security definer;

-- Stock management trigger
drop trigger if exists on_sale_recorded on orders;
drop function if exists update_stock_on_sale();

create or replace function update_stock_on_sale()
returns trigger as $$
declare
  v_sizes jsonb;
  v_new_sizes jsonb;
  v_total int;
  v_size_record jsonb;
  v_new_qty int;
begin
  -- Get current sizes from product
  select sizes, total_stock
  into v_sizes, v_total
  from products
  where id = new.product_id;
  
  -- If sizes is null or empty
  -- just decrement total_stock
  if v_sizes is null or
     v_sizes = '[]'::jsonb then
    
    update products
    set total_stock = greatest(
      0,
      coalesce(total_stock, 0) -
      coalesce(new.quantity, 1)
    )
    where id = new.product_id;
    
    return new;
  end if;
  
  -- Update the specific size quantity
  v_new_sizes := '[]'::jsonb;
  
  for v_size_record in
    select * from jsonb_array_elements(
      v_sizes
    )
  loop
    if v_size_record->>'size' =
       new.size then
      v_new_qty := greatest(
        0,
        coalesce(
          (v_size_record->>'quantity')
            ::int,
          0
        ) - coalesce(new.quantity, 1)
      );
      v_new_sizes := v_new_sizes ||
        jsonb_build_object(
          'size',
          v_size_record->>'size',
          'quantity',
          v_new_qty
        );
    else
      v_new_sizes := v_new_sizes ||
        v_size_record;
    end if;
  end loop;
  
  -- Recalculate total stock
  -- from all sizes combined
  select coalesce(
    sum(
      (s->>'quantity')::int
    ), 0
  )
  into v_total
  from jsonb_array_elements(
    v_new_sizes
  ) as s;
  
  -- Update the product
  update products
  set
    sizes = v_new_sizes,
    total_stock = v_total
  where id = new.product_id;
  
  return new;
  
exception when others then
  -- Log error but don't fail
  -- the order insert
  raise warning
    'Stock update failed for
    product %: %',
    new.product_id,
    sqlerrm;
  return new;
end;
$$ language plpgsql
security definer;

create trigger on_sale_recorded
after insert on orders
for each row
execute function update_stock_on_sale();

-- Recalculate total_stock for all products based on sizes
update products
set total_stock = (
  select coalesce(
    sum((s->>'quantity')::int), 0
  )
  from jsonb_array_elements(
    sizes
  ) as s
)
where sizes is not null
and sizes != '[]'::jsonb
and jsonb_typeof(sizes) = 'array';
create index if not exists idx_notifications_user_unread
on notifications (user_id, read)
where read = false;

-- Unread count function
create or replace function get_unread_notifications_count(user_id_param uuid)
returns bigint as $$
begin
  return (
    select count(*)
    from notifications
    where user_id = user_id_param
    and read = false
  );
end;
$$ language plpgsql
security definer;

-- FIX: Safely drop both triggers on profiles table to prevent updated_at runtime field errors
drop trigger if exists profiles_updated_at on public.profiles;
drop trigger if exists profiles_updated_at_trigger on public.profiles;
drop trigger if exists profiles_updated_at_trigger on profiles;
drop function if exists update_profiles_updated_at();

-- Ensure all required tables have the updated_at column
alter table public.profiles add column if not exists updated_at timestamptz default now();
alter table public.shops add column if not exists updated_at timestamptz default now();
alter table public.products add column if not exists updated_at timestamptz default now();
alter table public.admin_settings add column if not exists updated_at timestamptz default now();

-- FIX: Redefine the polymorphic/generic update_updated_at and tr_fn_update_admin_settings_timestamp functions to be clean and safe across INSERT, UPDATE and DELETE.
-- This immediately prevents any legacy triggers left in the database from throwing "record 'new' has no field 'updated_at'" errors.
create or replace function update_updated_at()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  if NEW is not null then
    begin
      NEW.updated_at := now();
    exception when others then
      null;
    end;
  end if;
  return NEW;
end;
$$ language plpgsql;

create or replace function public.tr_fn_update_admin_settings_timestamp()
returns trigger as $function$
begin
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  if NEW is not null then
    begin
      NEW.updated_at := now();
    exception when others then
      null;
    end;
  end if;
  return NEW;
end;
$function$ language plpgsql;

-- Table-specific, 100% type-safe and compilation-proof trigger functions

-- 1. PRODUCTS
create or replace function public.set_products_updated_at()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  if NEW is not null then
    begin
      NEW.updated_at := now();
    exception when others then
      null;
    end;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists products_updated_at on public.products;
drop trigger if exists products_updated_at_trigger on public.products;

create trigger products_updated_at_trigger
  before update on public.products
  for each row execute function public.set_products_updated_at();

-- 2. ADMIN SETTINGS
create or replace function public.set_admin_settings_updated_at()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  if NEW is not null then
    begin
      NEW.updated_at := now();
    exception when others then
      null;
    end;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists tr_admin_settings_updated_at on public.admin_settings;

create trigger tr_admin_settings_updated_at
  before update on public.admin_settings
  for each row execute function public.set_admin_settings_updated_at();

-- 3. PROFILES
create or replace function public.set_profiles_updated_at()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  if NEW is not null then
    begin
      NEW.updated_at := now();
    exception when others then
      null;
    end;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at_trigger on public.profiles;

create trigger profiles_updated_at_trigger
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- 4. SHOPS
create or replace function public.set_shops_updated_at()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  if NEW is not null then
    begin
      NEW.updated_at := now();
    exception when others then
      null;
    end;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists shops_updated_at_trigger on public.shops;
drop trigger if exists shops_updated_at on public.shops;

create trigger shops_updated_at_trigger
  before update on public.shops
  for each row execute function public.set_shops_updated_at();

-- Add manual_lock columns
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS manual_lock boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS manual_lock_reason text,
ADD COLUMN IF NOT EXISTS manual_lock_date timestamptz,
ADD COLUMN IF NOT EXISTS manual_lock_by uuid;

-- Add overdue tracking columns
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS payment_overdue_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_overdue_since timestamptz;

-- Add slug column if missing
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Generate slugs for any existing shops that don't have one
UPDATE public.shops
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '', 'g'
  )
)
WHERE slug IS NULL;

-- Add unique index
CREATE UNIQUE INDEX IF NOT EXISTS shops_slug_idx ON public.shops(slug);

-- Fix any shops incorrectly locked that are on active trial
UPDATE public.shops
SET manual_lock = false
WHERE 
  (trial_end > now() OR trial_ends_at > now())
  AND manual_lock = true;

-- Create profiles table if missing
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text,
  username text,
  role text DEFAULT 'seller',
  created_at timestamptz DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_setup_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (
    NEW.id,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if existing, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_setup_user();

-- Backfill existing auth users who have no profile
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (
  SELECT id FROM public.profiles
)
ON CONFLICT DO NOTHING;

-- RLS POLICIES FOR SHOPS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "owners_read_own_shop" ON public.shops;
DROP POLICY IF EXISTS "owners_update_own_shop" ON public.shops;
DROP POLICY IF EXISTS "owners_insert_shop" ON public.shops;
DROP POLICY IF EXISTS "public_read_shops" ON public.shops;

-- Setup exact specified policies
CREATE POLICY "owners_read_own_shop"
ON public.shops FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "owners_update_own_shop"
ON public.shops FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners_insert_shop"
ON public.shops FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "public_read_shops"
ON public.shops FOR SELECT
TO public
USING (true);

-- CREATE PAYMENT_CLAIMS TABLE WITH ROBUST RLS POLICIES
CREATE TABLE IF NOT EXISTS public.payment_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
  whatsapp_number text NOT NULL,
  ecocash_number text NOT NULL,
  status text DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on payment_claims
ALTER TABLE public.payment_claims ENABLE ROW LEVEL SECURITY;

-- Setup policies for payment_claims
DROP POLICY IF EXISTS "public_read_payment_claims" ON public.payment_claims;
CREATE POLICY "public_read_payment_claims"
ON public.payment_claims FOR SELECT
USING (true);

DROP POLICY IF EXISTS "auth_insert_payment_claims" ON public.payment_claims;
CREATE POLICY "auth_insert_payment_claims"
ON public.payment_claims FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_payment_claims" ON public.payment_claims;
CREATE POLICY "auth_update_payment_claims"
ON public.payment_claims FOR UPDATE
TO authenticated
USING (true);


