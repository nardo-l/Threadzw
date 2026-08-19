-- Migration: Update shops table page_type constraint to support new Seller Categories
-- Non-destructive update supporting: clothing, vehicles, general, plus transitional types: storefront, service, creator, professional, community

-- 1. Alter default value of page_type to 'clothing'
ALTER TABLE shops ALTER COLUMN page_type SET DEFAULT 'clothing';

-- 2. Drop existing check constraint and recreate with new seller categories + transitional backward-compatibility types
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'shops_page_type_check'
    ) THEN
        ALTER TABLE shops DROP CONSTRAINT shops_page_type_check;
    END IF;

    ALTER TABLE shops ADD CONSTRAINT shops_page_type_check
    CHECK (page_type IN ('clothing', 'vehicles', 'general', 'storefront', 'service', 'creator', 'professional', 'community'));
END $$;
