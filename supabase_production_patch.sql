-- ═══════════════════════════════════════════════════════════════════════════
-- PRODUCTION DATABASE RECONCILIATION & PERFORMANCE SYSTEM (DIRECT SEQUENTIAL ENGINE)
-- ═══════════════════════════════════════════════════════════════════════════
-- Target Database: Supabase PostgreSQL (PostgREST Compliant)
-- Purpose:
--   1. Strict Type Corrections: Direct type casts to resolve text/UUID mismatch (error 42804/42883)
--   2. Delete Dummy/Draft Data: Purges placeholder products and unowned shops (with dynamic existence checks)
--   3. Shop Detail Integrity: Ensures proper image hosting buckets are configured
--   4. Reactive Triggers: Auto-propagates and preserves latest updates seamlessly
--   5. Real-Time Analytics: Tracks view counts, sales, and automated inventory sync
-- ═══════════════════════════════════════════════════════════════════════════

-- --------------------------------------------------------------------------
-- PHASE 1: DROP CONSTRAINTS AND FOREIGN KEYS SAFELY (DISSOLVE HIERARCHY)
-- --------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.products DROP CONSTRAINT IF EXISTS products_shop_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.products DROP CONSTRAINT IF EXISTS products_pkey CASCADE;
ALTER TABLE IF EXISTS public.shops DROP CONSTRAINT IF EXISTS shops_pkey CASCADE;
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_shop_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_pkey CASCADE;

-- Optional/Extended Tables - Dropped Safely
ALTER TABLE IF EXISTS public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_shop_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.stories DROP CONSTRAINT IF EXISTS stories_shop_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.likes DROP CONSTRAINT IF EXISTS likes_shop_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.likes DROP CONSTRAINT IF EXISTS likes_product_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.saves DROP CONSTRAINT IF EXISTS saves_shop_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.saves DROP CONSTRAINT IF EXISTS saves_product_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.follows DROP CONSTRAINT IF EXISTS follows_shop_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.reviews DROP CONSTRAINT IF EXISTS reviews_shop_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.payments DROP CONSTRAINT IF EXISTS payments_shop_id_fkey CASCADE;


-- --------------------------------------------------------------------------
-- PHASE 2: PURGE DUMMY DATA AND UNOWNED SHOPS WITH RESILIENT DYNAMIC SQL
-- --------------------------------------------------------------------------
DO $$
BEGIN
  -- Likes Purge (Dynamic check)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
    EXECUTE 'DELETE FROM public.likes WHERE shop_id::text = ''da7da7da-7da7-4da7-bda7-da7da7da7da7'' OR shop_id::text IN (SELECT id::text FROM public.shops WHERE handle = ''demo'' OR owner_id IS NULL)';
  END IF;

  -- Saves Purge (Dynamic check)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saves') THEN
    EXECUTE 'DELETE FROM public.saves WHERE product_id::text IN (SELECT id::text FROM public.products WHERE shop_id::text = ''da7da7da-7da7-4da7-bda7-da7da7da7da7'' OR shop_id::text IN (SELECT id::text FROM public.shops WHERE handle = ''demo'' OR owner_id IS NULL))';
  END IF;

  -- Subscriptions Purge (Dynamic check)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'DELETE FROM public.subscriptions WHERE shop_id::text = ''da7da7da-7da7-4da7-bda7-da7da7da7da7'' OR shop_id::text IN (SELECT id::text FROM public.shops WHERE handle = ''demo'' OR owner_id IS NULL)';
  END IF;

  -- Stories Purge (Dynamic check)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories') THEN
    EXECUTE 'DELETE FROM public.stories WHERE shop_id::text = ''da7da7da-7da7-4da7-bda7-da7da7da7da7'' OR shop_id::text IN (SELECT id::text FROM public.shops WHERE handle = ''demo'' OR owner_id IS NULL)';
  END IF;
END;
$$;

-- Core Tables Purge (Always safe to compile directly)
DELETE FROM public.products WHERE shop_id::text = 'da7da7da-7da7-4da7-bda7-da7da7da7da7' OR shop_id::text IN (SELECT id::text FROM public.shops WHERE handle = 'demo' OR owner_id IS NULL);
DELETE FROM public.orders WHERE shop_id::text = 'da7da7da-7da7-4da7-bda7-da7da7da7da7' OR shop_id::text IN (SELECT id::text FROM public.shops WHERE handle = 'demo' OR owner_id IS NULL);

-- Terminate dummy, pilot handles, and unowned test shops
DELETE FROM public.shops WHERE id::text = 'da7da7da-7da7-4da7-bda7-da7da7da7da7' OR handle = 'demo' OR owner_id IS NULL;

-- Remove products that became unlinked from active registered shops
DELETE FROM public.products WHERE shop_id IS NULL OR shop_id::text NOT IN (SELECT id::text FROM public.shops);


-- --------------------------------------------------------------------------
-- PHASE 3: SANITIZE INCOMPATIBLE STRINGS PRIOR TO CASTING (ALIGNMENT PREP)
-- --------------------------------------------------------------------------
-- Ensure IDs are valid UUID structures; if not, re-assign dynamic keys
UPDATE public.shops 
SET id = gen_random_uuid() 
WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE public.products 
SET id = gen_random_uuid() 
WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Nullify invalid UUID formats inside foreign key columns so casting doesn't fail
UPDATE public.products 
SET shop_id = NULL 
WHERE shop_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE public.orders 
SET shop_id = NULL 
WHERE shop_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE public.orders 
SET product_id = NULL 
WHERE product_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Resilient field sanitation for Optional Tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saves') THEN
    EXECUTE 'UPDATE public.saves SET product_id = NULL WHERE product_id::text !~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
    EXECUTE 'UPDATE public.likes SET shop_id = NULL WHERE shop_id::text !~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''';
    EXECUTE 'UPDATE public.likes SET product_id = NULL WHERE product_id::text !~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories') THEN
    EXECUTE 'UPDATE public.stories SET shop_id = NULL WHERE shop_id::text !~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'UPDATE public.subscriptions SET shop_id = NULL WHERE shop_id::text !~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''';
  END IF;
END;
$$;


-- --------------------------------------------------------------------------
-- PHASE 4: RESTRUCTURE DATA TYPES NATIVELY (EXPLICIT DIRECT CASTING)
-- --------------------------------------------------------------------------
-- Convert Core Primary Keys to uuid
ALTER TABLE public.shops ALTER COLUMN id TYPE uuid USING id::uuid;
ALTER TABLE public.products ALTER COLUMN id TYPE uuid USING id::uuid;
ALTER TABLE public.orders ALTER COLUMN id TYPE uuid USING id::uuid;

-- Convert Core Foreign Keys and relational pointers to uuid
ALTER TABLE public.products ALTER COLUMN shop_id TYPE uuid USING shop_id::uuid;
ALTER TABLE public.orders ALTER COLUMN shop_id TYPE uuid USING shop_id::uuid;
ALTER TABLE public.orders ALTER COLUMN product_id TYPE uuid USING product_id::uuid;

-- Convert Optional Foreign Keys and relational pointers to uuid
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saves') THEN
    EXECUTE 'ALTER TABLE public.saves ALTER COLUMN product_id TYPE uuid USING product_id::uuid';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
    EXECUTE 'ALTER TABLE public.likes ALTER COLUMN shop_id TYPE uuid USING shop_id::uuid';
    EXECUTE 'ALTER TABLE public.likes ALTER COLUMN product_id TYPE uuid USING product_id::uuid';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories') THEN
    EXECUTE 'ALTER TABLE public.stories ALTER COLUMN shop_id TYPE uuid USING shop_id::uuid';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'ALTER TABLE public.subscriptions ALTER COLUMN shop_id TYPE uuid USING shop_id::uuid';
  END IF;
END;
$$;


-- --------------------------------------------------------------------------
-- PHASE 5: RESTORE PRIMARY & FOREIGN KEY CONSTRAINTS WITH CASCADING SETTINGS
-- --------------------------------------------------------------------------
-- Re-establish Primary Keys
ALTER TABLE public.shops ADD CONSTRAINT shops_pkey PRIMARY KEY (id);
ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

-- Re-establish Foreign Keys with cascades for Core tables
ALTER TABLE public.products 
  ADD CONSTRAINT products_shop_id_fkey 
  FOREIGN KEY (shop_id) 
  REFERENCES public.shops(id) 
  ON DELETE CASCADE;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_shop_id_fkey 
  FOREIGN KEY (shop_id) 
  REFERENCES public.shops(id) 
  ON DELETE CASCADE;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE SET NULL;

-- Dynamic registration of constraint cascades on optional tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shops') THEN
      BEGIN
        EXECUTE 'ALTER TABLE public.likes ADD CONSTRAINT likes_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE';
      EXCEPTION WHEN duplicate_object THEN
        -- Ignore if already present
      END;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saves') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
      BEGIN
        EXECUTE 'ALTER TABLE public.saves ADD CONSTRAINT saves_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE';
      EXCEPTION WHEN duplicate_object THEN
        -- Ignore if already present
      END;
    END IF;
  END IF;
END;
$$;


-- --------------------------------------------------------------------------
-- PHASE 6: AUTOMATED LAST UPDATED PROPAGATION (UPDATED_AT TRIGGERS)
-- --------------------------------------------------------------------------
-- Trigger Function
CREATE OR REPLACE FUNCTION public.set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure updated_at columns exist
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Rebind triggers
DROP TRIGGER IF EXISTS tr_shops_updated_at ON public.shops;
CREATE TRIGGER tr_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_column();

DROP TRIGGER IF EXISTS tr_products_updated_at ON public.products;
CREATE TRIGGER tr_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_column();

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_column();


-- --------------------------------------------------------------------------
-- PHASE 7: REAL-TIME ANALYTICS CLOCK (VIEWS & VISITS TRACKER)
-- --------------------------------------------------------------------------
-- Ensure tracking columns exist
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- RPC increment function for product views
CREATE OR REPLACE FUNCTION public.increment_product_view_count(product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET view_count = coalesce(view_count, 0) + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC increment function for shop views
CREATE OR REPLACE FUNCTION public.increment_shop_view_count(shop_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.shops
  SET view_count = coalesce(view_count, 0) + 1
  WHERE id = shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --------------------------------------------------------------------------
-- PHASE 8: AUTOMATED REAL-TIME STOCK INVENTORY SYNCHRONIZATION
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_sizes jsonb;
  v_new_sizes jsonb;
  v_total int;
  v_size_record jsonb;
  v_new_qty int;
BEGIN
  -- Fetch existing sizes list and current stock count
  SELECT sizes, total_stock
  INTO v_sizes, v_total
  FROM public.products
  WHERE id = NEW.product_id;
  
  -- If sizes list is empty or undefined, reduce general count
  IF v_sizes IS NULL OR v_sizes = '[]'::jsonb THEN
    UPDATE public.products
    SET total_stock = greatest(0, coalesce(total_stock, 0) - coalesce(NEW.quantity, 1))
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  
  v_new_sizes := '[]'::jsonb;
  
  -- Deduct quantity for matching sizes
  FOR v_size_record IN
    SELECT * FROM jsonb_array_elements(v_sizes)
  LOOP
    IF v_size_record->>'size' = NEW.size THEN
      v_new_qty := greatest(0, coalesce((v_size_record->>'quantity')::int, 0) - coalesce(NEW.quantity, 1));
      v_new_sizes := v_new_sizes || jsonb_build_object('size', v_size_record->>'size', 'quantity', v_new_qty);
    ELSE
      v_new_sizes := v_new_sizes || v_size_record;
    END IF;
  END LOOP;
  
  -- Gather cumulative total
  SELECT coalesce(sum((s->>'quantity')::int), 0)
  INTO v_total
  FROM jsonb_array_elements(v_new_sizes) AS s;
  
  -- Perform core update
  UPDATE public.products
  SET sizes = v_new_sizes, total_stock = v_total
  WHERE id = NEW.product_id;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Stock synchronizer encountered warning for product %: %', NEW.product_id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to react automatically on orders placement
DROP TRIGGER IF EXISTS on_sale_recorded ON public.orders;
CREATE TRIGGER on_sale_recorded
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_sale();

-- Recalc existing size stocks to guarantee immediate data consistency
UPDATE public.products
SET total_stock = (
  SELECT coalesce(sum((s->>'quantity')::int), 0)
  FROM jsonb_array_elements(coalesce(sizes, '[]'::jsonb)) AS s
)
WHERE sizes IS NOT NULL AND sizes != '[]'::jsonb;


-- --------------------------------------------------------------------------
-- PHASE 9: RELIABLE SYSTEM BUCKETS PROVISIONING
-- --------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
SELECT 'product-images', 'product-images', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images');

INSERT INTO storage.buckets (id, name, public)
SELECT 'shop-banners', 'shop-banners', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'shop-banners');

INSERT INTO storage.buckets (id, name, public)
SELECT 'shop-avatars', 'shop-avatars', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'shop-avatars');


-- --------------------------------------------------------------------------
-- PHASE 10: REAL-TIME SCHEMA BROADCAST
-- --------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
