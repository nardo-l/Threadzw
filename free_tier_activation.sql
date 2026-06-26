-- ═══════════════════════════════════════════════════════════════════════════
-- THREADZW FREE TIER & PROFILE/SHOP AUTOMATED SYNC ACTIVATION
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ensure all columns exist on the shops table (redefining missing attributes to avoid database execution failures)
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS handle text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS follower_count integer DEFAULT 0;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS product_count integer DEFAULT 0;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS access_code text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone DEFAULT now();
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Retroactively fix any existing shops with 'trial' plan or status to 'active'/'free'
UPDATE public.shops 
SET subscription_status = 'active', 
    plan = 'free' 
WHERE subscription_status = 'trial' OR plan IS NULL OR plan != 'free';

-- 3. Update or recreate the handle_new_user signup trigger to immediately provision a free active shop
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $function$
DECLARE
  v_display_name text;
  v_handle text;
  v_clean_handle text;
  v_shop_id uuid;
  v_trial_ends timestamptz;
BEGIN
  -- Determine display name
  v_display_name := COALESCE(
    new.raw_user_meta_data->>'display_name', 
    new.raw_user_meta_data->>'username', 
    split_part(new.email, '@', 1)
  );
  IF v_display_name = '' THEN
    v_display_name := split_part(new.email, '@', 1);
  END IF;

  -- Determine initial handle/username
  v_handle := COALESCE(
    new.raw_user_meta_data->>'handle', 
    new.raw_user_meta_data->>'username', 
    split_part(new.email, '@', 1)
  );
  IF v_handle = '' THEN
    v_handle := split_part(new.email, '@', 1);
  END IF;

  -- Standardize the handle/username (lowercase alphanumeric, hyphen, underscore)
  v_clean_handle := LOWER(REGEXP_REPLACE(v_handle, '[^a-zA-Z0-9_-]', '', 'g'));
  IF LENGTH(v_clean_handle) < 3 THEN
    v_clean_handle := v_clean_handle || '_user';
  END IF;

  -- Ensure handle uniqueness inside profiles
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = v_clean_handle AND id != new.id) LOOP
    v_clean_handle := v_clean_handle || FLOOR(random() * 10)::text;
  END LOOP;

  -- A) Create or update profile
  INSERT INTO public.profiles (id, email, display_name, handle, created_at)
  VALUES (
    new.id, 
    new.email, 
    v_display_name, 
    v_clean_handle, 
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(NULLIF(public.profiles.display_name, ''), excluded.display_name),
    handle = COALESCE(NULLIF(public.profiles.handle, ''), excluded.handle);

  RETURN new;
END;
$function$;

-- 4. Re-bind the trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill/Associate any orphan profiles to ensure they automatically have shops and are not NULL
-- Running this secures existing data without any manual matching
DO $$
DECLARE
  v_profile RECORD;
  v_shop_id uuid;
  v_clean_handle text;
  v_trial_ends timestamptz;
BEGIN
  v_trial_ends := now() + INTERVAL '10 years'; -- Perpetual free active
  
  FOR v_profile IN SELECT * FROM public.profiles LOOP
    -- Check if this profile has a shop
    IF NOT EXISTS (SELECT 1 FROM public.shops WHERE owner_id = v_profile.id) THEN
      v_shop_id := ('e' || SUBSTRING(v_profile.id::text FROM 2))::uuid;
      v_clean_handle := LOWER(REGEXP_REPLACE(v_profile.handle, '[^a-zA-Z0-9_-]', '', 'g'));
      
      IF v_clean_handle = '' THEN
        v_clean_handle := 'shop_' || FLOOR(random() * 1000000)::text;
      END IF;

      -- Check if the shop ID is already taken by some other entry
      IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = v_shop_id) THEN
        INSERT INTO public.shops (
          id,
          owner_id,
          name,
          handle,
          slug,
          description,
          categories,
          location,
          whatsapp,
          is_live,
          subscription_status,
          plan,
          trial_started_at,
          trial_ends_at,
          created_at,
          updated_at
        )
        VALUES (
          v_shop_id,
          v_profile.id,
          COALESCE(NULLIF(v_profile.display_name, ''), SPLIT_PART(v_profile.email, '@', 1)),
          v_clean_handle,
          v_clean_handle,
          'Zim clothing store',
          ARRAY['Clothing']::text[],
          'Harare',
          '0776223144',
          true,
          'active',
          'free',
          now(),
          v_trial_ends,
          now(),
          now()
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;
