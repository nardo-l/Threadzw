-- =========================================================================
-- DATABASE MIGRATION SCRIPT: FIX UNIQUE CONSTRAINTS & CORE PRIMARY KEY DEFAULTS
-- =========================================================================
-- This script:
-- 1. Corrects any missing or broken DEFAULT values in primary keys by replacing
--    extension-dependent 'uuid_generate_v4()' with native 'gen_random_uuid()'.
-- 2. Clean-deduplicates records for tables utilizing 'upsert' pattern.
-- 3. Sets up core UNIQUE constraints which are required as conflict targets.
-- =========================================================================

-- ==========================================
-- 1. UPGRADE ALL PRIMARY KEY ID DEFAULTS
-- ==========================================

-- Modern native UUID generator prevents failure if uuid-ossp extension is disabled
ALTER TABLE public.shops ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.subscriptions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.likes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.saves ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.follows ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.best_dresser_entries ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.reviews ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.stories ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.style_cards ALTER COLUMN id SET DEFAULT gen_random_uuid();


-- ==========================================
-- 2. DEDUPLICATE & ENSURE "SHOPS" UNIQUE CONSTRAINT
-- ==========================================

-- Clean up any duplicate records (keeping the latest shop per owner)
DELETE FROM public.shops a USING public.shops b
WHERE a.created_at < b.created_at AND a.owner_id = b.owner_id;

-- Add the unique constraint on owner_id
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_owner_id_key;
ALTER TABLE public.shops ADD CONSTRAINT shops_owner_id_key UNIQUE (owner_id);


-- ==========================================
-- 3. INITIALIZE & DEDUPLICATE "MUSIFY_LEADERBOARD"
-- ==========================================

CREATE TABLE IF NOT EXISTS public.musify_leaderboard (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  handle text,
  avatar_url text,
  artist_name text,
  score integer,
  best_percentage integer,
  max_streak integer,
  difficulty text,
  created_at timestamptz DEFAULT now()
);

-- Clean up duplicate rows (keeping the latest score per user per artist)
DELETE FROM public.musify_leaderboard a USING public.musify_leaderboard b
WHERE a.created_at < b.created_at AND a.user_id = b.user_id AND a.artist_name = b.artist_name;

-- Add the unique constraint on (user_id, artist_name)
ALTER TABLE public.musify_leaderboard DROP CONSTRAINT IF EXISTS musify_leaderboard_user_artist_key;
ALTER TABLE public.musify_leaderboard ADD CONSTRAINT musify_leaderboard_user_artist_key UNIQUE (user_id, artist_name);

-- Setup RLS Policies for Leaderboard
ALTER TABLE public.musify_leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view musify leaderboard" ON public.musify_leaderboard;
DROP POLICY IF EXISTS "Users can manage own leaderboard rows completely" ON public.musify_leaderboard;

CREATE POLICY "Anyone can view musify leaderboard" ON public.musify_leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can manage own leaderboard rows completely" ON public.musify_leaderboard FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 4. INITIALIZE & DEDUPLICATE "MUSIFY_TRACKS_CACHE"
-- ==========================================

CREATE TABLE IF NOT EXISTS public.musify_tracks_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_name text NOT NULL,
  tracks jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clean up duplicates
DELETE FROM public.musify_tracks_cache a USING public.musify_tracks_cache b
WHERE a.created_at < b.created_at AND lower(a.artist_name) = lower(b.artist_name);

-- Add unique constraint on artist_name
ALTER TABLE public.musify_tracks_cache DROP CONSTRAINT IF EXISTS musify_tracks_cache_artist_name_key;
ALTER TABLE public.musify_tracks_cache ADD CONSTRAINT musify_tracks_cache_artist_name_key UNIQUE (artist_name);

-- Setup RLS Policies for Tracks Cache
ALTER TABLE public.musify_tracks_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view musify tracks cache" ON public.musify_tracks_cache;
DROP POLICY IF EXISTS "Anyone can manage tracks cache" ON public.musify_tracks_cache;

CREATE POLICY "Anyone can view musify tracks cache" ON public.musify_tracks_cache FOR SELECT USING (true);
CREATE POLICY "Anyone can manage tracks cache" ON public.musify_tracks_cache FOR ALL USING (true);


-- ==========================================
-- 5. INITIALIZE & DEDUPLICATE "MUSIFY_ARTIST_CACHE"
-- ==========================================

CREATE TABLE IF NOT EXISTS public.musify_artist_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_query text NOT NULL,
  artist_name text,
  artist_image text,
  tracks jsonb DEFAULT '[]'::jsonb,
  cached_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Clean up duplicates
DELETE FROM public.musify_artist_cache a USING public.musify_artist_cache b
WHERE a.created_at < b.created_at AND lower(a.artist_query) = lower(b.artist_query);

-- Add unique constraint on artist_query
ALTER TABLE public.musify_artist_cache DROP CONSTRAINT IF EXISTS musify_artist_cache_artist_query_key;
ALTER TABLE public.musify_artist_cache ADD CONSTRAINT musify_artist_cache_artist_query_key UNIQUE (artist_query);

-- Setup RLS Policies for Artist Cache
ALTER TABLE public.musify_artist_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view musify artist cache" ON public.musify_artist_cache;
DROP POLICY IF EXISTS "Anyone can manage musify artist cache" ON public.musify_artist_cache;

CREATE POLICY "Anyone can view musify artist cache" ON public.musify_artist_cache FOR SELECT USING (true);
CREATE POLICY "Anyone can manage musify artist cache" ON public.musify_artist_cache FOR ALL USING (true);


-- ==========================================
-- 6. INITIALIZE & DEDUPLICATE "PERSONALITY_RESULTS"
-- ==========================================

CREATE TABLE IF NOT EXISTS public.personality_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_type text,
  drip_score integer,
  fit_score integer,
  sauce_score integer,
  answers text[],
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Clean up duplicates
DELETE FROM public.personality_results a USING public.personality_results b
WHERE a.created_at < b.created_at AND a.user_id = b.user_id;

-- Add unique constraint on user_id
ALTER TABLE public.personality_results DROP CONSTRAINT IF EXISTS personality_results_user_id_key;
ALTER TABLE public.personality_results ADD CONSTRAINT personality_results_user_id_key UNIQUE (user_id);

-- Setup RLS Policies for Personality Results
ALTER TABLE public.personality_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view personality results" ON public.personality_results;
DROP POLICY IF EXISTS "Users can manage own personality results" ON public.personality_results;

CREATE POLICY "Anyone can view personality results" ON public.personality_results FOR SELECT USING (true);
CREATE POLICY "Users can manage own personality results" ON public.personality_results FOR ALL USING (auth.uid() = user_id);
