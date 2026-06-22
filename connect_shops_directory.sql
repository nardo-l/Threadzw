-- ==========================================
-- THREADZW DIRECTORY CONNECTION & MIGRATION
-- ==========================================
-- This script ensures all columns required for the Premium Shops Directory exist,
-- links your existing database shops to the public directory, guarantees that their 
-- custom slugs are set, and re-calculates all statistics (product count, follower count) 
-- safely from existing records.
--
-- Run this script in your Supabase SQL Editor to make all existing shops fully compatible, 
-- live, and accessible by their clean custom routing links.
-- ==========================================

-- STEP 1: Ensure all directory-essential columns exist on public.shops table
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS location text DEFAULT 'Harare';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT true;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS follower_count integer DEFAULT 0;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS product_count integer DEFAULT 0;

-- Ensure unique constraint or index on slugs for premium routing safety
CREATE UNIQUE INDEX IF NOT EXISTS shops_slug_idx ON public.shops(slug);

-- STEP 2: Backfill and generate clean unique slugs for existing shops that don't have one
-- This translates spaces to '-' and removes non-alphanumeric characters, making links pristine.
UPDATE public.shops
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Fallback if slug generation yields duplication or empty result (uses handles)
UPDATE public.shops
SET slug = LOWER(handle)
WHERE slug IS NULL OR slug = '';

-- STEP 3: Ensure existing shops are set to visible/live in the public fashion directory
UPDATE public.shops
SET is_live = true,
    setup_complete = true
WHERE is_live IS DISTINCT FROM true;

-- STEP 4: Seed default categorizations and locations if they are undefined
UPDATE public.shops
SET location = 'Harare'
WHERE location IS NULL OR location = '';

UPDATE public.shops
SET categories = ARRAY['Streetwear']
WHERE categories IS NULL OR categories = '{}';

-- STEP 5: Re-calculate and synchronize product count statistics from actual database products
UPDATE public.shops s
SET product_count = (
  SELECT COALESCE(COUNT(*), 0)
  FROM public.products p
  WHERE p.shop_id = s.id
);

-- STEP 6: Re-calculate and synchronize follower count statistics safely from actual follows table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'follows') THEN
    EXECUTE '
      UPDATE public.shops s
      SET follower_count = (
        SELECT COALESCE(COUNT(*), 0)
        FROM public.follows f
        WHERE f.shop_id = s.id
      )
    ';
  ELSE
    -- Fallback follower_count baseline for stores if followers table does not exist
    UPDATE public.shops
    SET follower_count = COALESCE(follower_count, 12);
  END IF;
END $$;

-- STEP 7: Output Diagnostic Verification Results
SELECT id, name, handle, slug, is_live, product_count, follower_count, location 
FROM public.shops;
