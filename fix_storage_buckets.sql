-- =========================================================================
-- SUPABASE MIGRATION SCRIPT: FIX STORAGE BUCKETS & RLS POLICIES
-- =========================================================================
-- This script fixes the "new row violates row-level security policy" errors
-- when uploading files (profile avatars, shop logos, banners, product images,
-- shop stories, and application-branding assets).
-- 
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard.
-- 2. Navigate to the "SQL Editor" on the left sidebar.
-- 3. Paste this entire script into a new query window.
-- 4. Click the "Run" button at the bottom right.
-- =========================================================================

-- ====================================
-- 1. CREATE ALL REQUIRED STATIC BUCKETS
-- ====================================

-- Ensure the 'storage' schema has buckets initialized
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('shop-avatars', 'shop-avatars', true),
  ('shop-banners', 'shop-banners', true),
  ('product-images', 'product-images', true),
  ('shop-stories', 'shop-stories', true),
  ('app-assets', 'app-assets', true),
  ('community-cards', 'community-cards', true)
ON CONFLICT (id) DO UPDATE 
SET public = true;


-- ====================================
-- 2. RESET EXISTING CONFLICTING STORAGE POLICIES
-- ====================================

-- Drop all standard select policies to prevent duplicate definitions
DROP POLICY IF EXISTS "avatars: public read" ON storage.objects;
DROP POLICY IF EXISTS "shop-banners: public read" ON storage.objects;
DROP POLICY IF EXISTS "shop-avatars: public read" ON storage.objects;
DROP POLICY IF EXISTS "product-images: public read" ON storage.objects;
DROP POLICY IF EXISTS "shop-stories: public read" ON storage.objects;
DROP POLICY IF EXISTS "community_cards_public_read" ON storage.objects;
DROP POLICY IF EXISTS "app-assets: public read" ON storage.objects;

-- Drop all standard insert/update/delete policies to clear RLS paths
DROP POLICY IF EXISTS "avatars: owner upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars: owner update" ON storage.objects;
DROP POLICY IF EXISTS "avatars: owner delete" ON storage.objects;

DROP POLICY IF EXISTS "shop-banners: owner upload" ON storage.objects;
DROP POLICY IF EXISTS "shop-banners: owner update" ON storage.objects;
DROP POLICY IF EXISTS "shop-banners: owner delete" ON storage.objects;

DROP POLICY IF EXISTS "shop-avatars: owner upload" ON storage.objects;
DROP POLICY IF EXISTS "shop-avatars: owner update" ON storage.objects;
DROP POLICY IF EXISTS "shop-avatars: owner delete" ON storage.objects;

DROP POLICY IF EXISTS "product-images: owner upload" ON storage.objects;
DROP POLICY IF EXISTS "product-images: owner update" ON storage.objects;
DROP POLICY IF EXISTS "product-images: owner delete" ON storage.objects;

DROP POLICY IF EXISTS "shop-stories: owner upload" ON storage.objects;
DROP POLICY IF EXISTS "shop-stories: owner delete" ON storage.objects;

DROP POLICY IF EXISTS "community_cards_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "community_cards_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "community_cards_auth_delete" ON storage.objects;


-- ====================================
-- 3. CREATE STABLE, ROBUST RLS POLICIES
-- ====================================

-- POLICY 1: Public SELECT (Read) Access
-- Allows any guest visitor to load images in the catalog, banner, logos, etc.
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT TO public 
USING (
  bucket_id IN (
    'avatars', 
    'shop-avatars', 
    'shop-banners', 
    'product-images', 
    'shop-stories', 
    'app-assets', 
    'community-cards'
  )
);

-- POLICY 2: Authenticated INSERT (Upload) Access
-- Allows any logged-in vendor or user to upload assets to any of these buckets.
-- Keeps uploads safe by checking auth.uid() is active.
CREATE POLICY "Authenticated Upload Access" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id IN (
    'avatars', 
    'shop-avatars', 
    'shop-banners', 
    'product-images', 
    'shop-stories', 
    'app-assets', 
    'community-cards'
  )
);

-- POLICY 3: Authenticated UPDATE (Modify) Access
-- Allows logged-in owners or sellers to overwrite existing images (using upsert)
CREATE POLICY "Authenticated Update Access" 
ON storage.objects FOR UPDATE TO authenticated 
USING (
  bucket_id IN (
    'avatars', 
    'shop-avatars', 
    'shop-banners', 
    'product-images', 
    'shop-stories', 
    'app-assets', 
    'community-cards'
  )
);

-- POLICY 4: Authenticated DELETE Access
-- Allows logged-in sellers to delete their product images or avatars
CREATE POLICY "Authenticated Delete Access" 
ON storage.objects FOR DELETE TO authenticated 
USING (
  bucket_id IN (
    'avatars', 
    'shop-avatars', 
    'shop-banners', 
    'product-images', 
    'shop-stories', 
    'app-assets', 
    'community-cards'
  )
);


-- ====================================
-- 4. FORCE SYSTEM REFRESH
-- ====================================
NOTIFY pgrst, 'reload schema';
