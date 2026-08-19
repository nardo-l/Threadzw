-- Phase 1 Migration: Add Link-in-Bio Page Architecture columns to shops table

-- 1. Add page_type column with default 'storefront'
ALTER TABLE shops ADD COLUMN IF NOT EXISTS page_type text DEFAULT 'storefront';

-- Add check constraint for allowed page types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'shops_page_type_check'
    ) THEN
        ALTER TABLE shops ADD CONSTRAINT shops_page_type_check
        CHECK (page_type IN ('storefront', 'service', 'creator', 'professional', 'community'));
    END IF;
END $$;

-- 2. Add template_id column
ALTER TABLE shops ADD COLUMN IF NOT EXISTS template_id text DEFAULT NULL;

-- 3. Add page_config JSONB column defaulting to empty JSON object
ALTER TABLE shops ADD COLUMN IF NOT EXISTS page_config jsonb DEFAULT '{}'::jsonb;

-- 4. Ensure all existing shops have page_type = 'storefront' and page_config = '{}' if null
UPDATE shops SET page_type = 'storefront' WHERE page_type IS NULL;
UPDATE shops SET page_config = '{}'::jsonb WHERE page_config IS NULL;
