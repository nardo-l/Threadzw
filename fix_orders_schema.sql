-- COPY AND RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR --

-- 1. Ensure all columns exist on the orders table
do $$
begin
    -- Essential columns for the modern orders system
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='channel') then
        alter table public.orders add column channel text default 'in_store' check (channel in ('in_store', 'whatsapp'));
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='listed_price') then
        alter table public.orders add column listed_price numeric(10,2);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='product_name') then
        alter table public.orders add column product_name text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='is_negotiated') then
        alter table public.orders add column is_negotiated boolean default false;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='owner_id') then
        alter table public.orders add column owner_id uuid references auth.users(id);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='shop_id') then
        alter table public.orders add column shop_id uuid references public.shops(id);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='total_price') then
        alter table public.orders add column total_price numeric(10,2);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='items') then
        alter table public.orders add column items jsonb;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='buyer_id') then
        alter table public.orders add column buyer_id uuid references auth.users(id);
    end if;
end $$;

-- 2. Force PostgREST to reload the schema cache
-- This is the MOST IMPORTANT part if you are getting "Could not find column in schema cache"
notify pgrst, 'reload schema';

-- 3. If the error still persists, run this block to manually "touch" the table schema
comment on table public.orders is 'Table for recording shop sales and customer orders';
