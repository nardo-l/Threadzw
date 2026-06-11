-- ====================================================================
-- THREADZW SUBSCRIPTION SYSTEM MIGRATION (corrected for shops.id as TEXT and legacy support)
-- Run this entire migration in Supabase SQL editor
-- ====================================================================

-- ================================================
-- STEP 1: Create subscription status enum
-- ================================================

DO $$ BEGIN
  CREATE TYPE subscription_status_enum AS ENUM (
    'trial',
    'active', 
    'expired',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- STEP 2: Create subscription_plans table
-- Future-proof for multiple tiers/providers
-- ================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  name text NOT NULL,
  -- e.g. "ThreadZW Pro"
  slug text UNIQUE NOT NULL,
  -- e.g. "pro"
  price_usd numeric(10,2) NOT NULL,
  billing_days integer NOT NULL DEFAULT 28,
  -- billing cycle in days
  trial_days integer NOT NULL DEFAULT 28,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Insert default plan
INSERT INTO subscription_plans (
  name,
  slug,
  price_usd,
  billing_days,
  trial_days,
  features
)
VALUES (
  'ThreadZW Pro',
  'pro',
  7.00,
  28,
  28,
  '[
    "Unlimited Products",
    "Product Categories",
    "WhatsApp Ordering",
    "Analytics",
    "Custom Shop Link",
    "Demand Discovery"
  ]'
)
ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- STEP 3: Add subscription columns to shops table
-- ================================================

-- Subscription status: safely convert existing text field if present
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'shops' 
    AND column_name = 'subscription_status' 
    AND data_type = 'text'
  ) THEN
    -- Temporarily drop default to clean up type
    ALTER TABLE shops ALTER COLUMN subscription_status DROP DEFAULT;
    -- Alter column type using text values mapped to enum
    ALTER TABLE shops ALTER COLUMN subscription_status TYPE subscription_status_enum 
      USING subscription_status::text::subscription_status_enum;
    -- Reapply default
    ALTER TABLE shops ALTER COLUMN subscription_status SET DEFAULT 'trial'::subscription_status_enum;
  ELSIF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'shops' 
    AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE shops ADD COLUMN subscription_status subscription_status_enum DEFAULT 'trial'::subscription_status_enum;
  END IF;
END $$;

-- Trial dates
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS 
  trial_start_date timestamptz
  DEFAULT now();

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  trial_end_date timestamptz
  DEFAULT (now() + interval '28 days');

-- Subscription dates
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  subscription_start_date timestamptz;

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  subscription_end_date timestamptz;

-- Billing
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  next_billing_date timestamptz;

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  last_payment_date timestamptz;

-- Payment provider (scalable for future)
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  payment_provider text;
  -- 'nardopay' | 'manual' | 'ecocash_direct'

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  payment_reference text;
  -- Provider transaction reference

-- Plan reference
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  plan_id uuid REFERENCES 
    subscription_plans(id);

-- Admin lock (separate from subscription)
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  manual_lock boolean DEFAULT false;

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  manual_lock_reason text;

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  suspended_at timestamptz;

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS
  suspended_by uuid;

-- ================================================
-- STEP 4: Create subscription_events table
-- Full audit log of every status change
-- ================================================

CREATE TABLE IF NOT EXISTS 
subscription_events (
  id uuid DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  shop_id text REFERENCES shops(id) 
    ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  -- 'trial_started' | 'trial_expired' |
  -- 'subscription_activated' |
  -- 'subscription_expired' |
  -- 'subscription_cancelled' |
  -- 'payment_received' |
  -- 'suspended' | 'unsuspended' |
  -- 'admin_override'
  previous_status subscription_status_enum,
  new_status subscription_status_enum,
  payment_provider text,
  payment_reference text,
  payment_amount numeric(10,2),
  notes text,
  created_by uuid,
  -- null = system, uuid = admin user
  created_at timestamptz DEFAULT now()
);

-- Index for fast shop lookups
CREATE INDEX IF NOT EXISTS 
  subscription_events_shop_id_idx
  ON subscription_events(shop_id);

CREATE INDEX IF NOT EXISTS
  subscription_events_created_at_idx
  ON subscription_events(created_at DESC);

-- ================================================
-- STEP 5: Create payment_records table
-- Ready for NardoPay and other providers
-- ================================================

CREATE TABLE IF NOT EXISTS payment_records (
  id uuid DEFAULT gen_random_uuid() 
    PRIMARY KEY,
  shop_id text REFERENCES shops(id) 
    ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES 
    subscription_plans(id),
  
  -- Payment details
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_provider text NOT NULL,
  -- 'nardopay' | 'manual' | 'ecocash_direct'
  
  -- Provider data
  provider_payment_id text,
  provider_session_id text,
  provider_status text,
  
  -- Internal status
  status text DEFAULT 'pending',
  -- 'pending' | 'completed' | 'failed' | 'refunded'
  
  -- Billing period this payment covers
  period_start timestamptz,
  period_end timestamptz,
  
  -- Manual payment fields
  manual_whatsapp text,
  manual_ecocash_number text,
  admin_verified_by uuid,
  admin_verified_at timestamptz,
  unlock_code text,
  unlock_code_used_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS
  payment_records_shop_id_idx
  ON payment_records(shop_id);

CREATE INDEX IF NOT EXISTS
  payment_records_status_idx
  ON payment_records(status);

-- ================================================
-- STEP 6: Backfill existing shops
-- ================================================

-- Set trial dates safely, handling presence or absence of legacy columns dynamically
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'shops' 
    AND column_name = 'trial_started_at'
  ) THEN
    EXECUTE '
      UPDATE shops
      SET 
        trial_start_date = COALESCE(trial_start_date, trial_started_at, created_at, now()),
        trial_end_date = COALESCE(trial_end_date, trial_ends_at, created_at + interval ''28 days'', now() + interval ''28 days'')
    ';
  ELSE
    UPDATE shops
    SET 
      trial_start_date = COALESCE(trial_start_date, created_at, now()),
      trial_end_date = COALESCE(trial_end_date, created_at + interval '28 days', now() + interval '28 days');
  END IF;
END $$;

UPDATE shops
SET
  subscription_status = CASE
    WHEN manual_lock = true THEN 'suspended'::subscription_status_enum
    WHEN subscription_end_date > now() THEN 'active'::subscription_status_enum
    WHEN trial_end_date > now() THEN 'trial'::subscription_status_enum
    ELSE 'expired'::subscription_status_enum
  END
WHERE subscription_status IS NULL;

-- ================================================
-- STEP 7: Core subscription functions
-- ================================================

-- Function: get subscription data for a shop
CREATE OR REPLACE FUNCTION 
get_subscription_data(p_shop_id text)
RETURNS jsonb AS $$
DECLARE
  v_shop shops%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_now timestamptz := now();
  v_days_remaining integer := 0;
  v_status subscription_status_enum;
  v_expiry_date timestamptz;
BEGIN
  SELECT * INTO v_shop 
  FROM shops WHERE id = p_shop_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', 'Shop not found'
    );
  END IF;

  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_shop.plan_id
     OR slug = 'pro'
  LIMIT 1;

  -- Determine current status dynamically
  IF v_shop.manual_lock = true THEN
    v_status := 'suspended';
    v_expiry_date := NULL;
    v_days_remaining := 0;
    
  ELSIF v_shop.subscription_end_date IS NOT NULL AND v_shop.subscription_end_date > v_now THEN
    v_status := 'active';
    v_expiry_date := v_shop.subscription_end_date;
    v_days_remaining := CEIL(
      EXTRACT(EPOCH FROM (
        v_shop.subscription_end_date - v_now
      )) / 86400
    );
    
  ELSIF COALESCE(v_shop.trial_end_date, v_shop.trial_ends_at, v_shop.trial_end) > v_now THEN
    v_status := 'trial';
    v_expiry_date := COALESCE(v_shop.trial_end_date, v_shop.trial_ends_at, v_shop.trial_end);
    v_days_remaining := CEIL(
      EXTRACT(EPOCH FROM (
        COALESCE(v_shop.trial_end_date, v_shop.trial_ends_at, v_shop.trial_end) - v_now
      )) / 86400
    );
    
  ELSE
    v_status := 'expired';
    v_expiry_date := COALESCE(
      v_shop.subscription_end_date,
      v_shop.trial_end_date
    );
    v_days_remaining := 0;
  END IF;

  RETURN jsonb_build_object(
    'shop_id', p_shop_id,
    'status', v_status,
    'days_remaining', v_days_remaining,
    'expiry_date', v_expiry_date,
    'trial_start_date', v_shop.trial_start_date,
    'trial_end_date', v_shop.trial_end_date,
    'subscription_start_date', v_shop.subscription_start_date,
    'subscription_end_date', v_shop.subscription_end_date,
    'next_billing_date', v_shop.next_billing_date,
    'last_payment_date', v_shop.last_payment_date,
    'payment_provider', v_shop.payment_provider,
    'plan_name', COALESCE(v_plan.name, 'ThreadZW Pro'),
    'plan_price', COALESCE(v_plan.price_usd, 7.00),
    'plan_billing_days', COALESCE(v_plan.billing_days, 28),
    'has_full_access', (v_status IN ('trial', 'active')),
    'is_locked', (v_status IN ('expired', 'suspended')),
    'can_be_renewed', (v_status IN ('expired', 'trial')),
    'manual_lock', COALESCE(v_shop.manual_lock, false)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: activate subscription
CREATE OR REPLACE FUNCTION
activate_subscription(
  p_shop_id text,
  p_payment_provider text,
  p_payment_reference text DEFAULT NULL,
  p_payment_amount numeric DEFAULT 7.00,
  p_billing_days integer DEFAULT 28,
  p_admin_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_shop shops%ROWTYPE;
  v_now timestamptz := now();
  v_sub_start timestamptz;
  v_sub_end timestamptz;
  v_plan_id uuid;
BEGIN
  SELECT * INTO v_shop 
  FROM shops WHERE id = p_shop_id
  FOR UPDATE; -- Lock row
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Shop not found'
    );
  END IF;

  -- Subscription starts now
  v_sub_start := v_now;
  v_sub_end := v_now + (p_billing_days || ' days')::interval;

  -- Get plan ID
  SELECT id INTO v_plan_id
  FROM subscription_plans
  WHERE slug = 'pro';

  -- Update shop
  UPDATE shops SET
    subscription_status = 'active',
    subscription_start_date = v_sub_start,
    subscription_end_date = v_sub_end,
    next_billing_date = v_sub_end,
    last_payment_date = v_now,
    payment_provider = p_payment_provider,
    payment_reference = p_payment_reference,
    plan_id = v_plan_id,
    manual_lock = false
  WHERE id = p_shop_id;

  -- Create payment record
  INSERT INTO payment_records (
    shop_id,
    plan_id,
    amount,
    payment_provider,
    provider_payment_id,
    status,
    period_start,
    period_end,
    admin_verified_by,
    admin_verified_at
  ) VALUES (
    p_shop_id,
    v_plan_id,
    p_payment_amount,
    p_payment_provider,
    p_payment_reference,
    'completed',
    v_sub_start,
    v_sub_end,
    p_admin_id,
    CASE WHEN p_admin_id IS NOT NULL THEN v_now ELSE NULL END
  );

  -- Log event
  INSERT INTO subscription_events (
    shop_id,
    event_type,
    previous_status,
    new_status,
    payment_provider,
    payment_reference,
    payment_amount,
    created_by
  ) VALUES (
    p_shop_id,
    'subscription_activated',
    v_shop.subscription_status,
    'active',
    p_payment_provider,
    p_payment_reference,
    p_payment_amount,
    p_admin_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_start', v_sub_start,
    'subscription_end', v_sub_end,
    'next_billing_date', v_sub_end,
    'days_active', p_billing_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: check and expire subscriptions
CREATE OR REPLACE FUNCTION
expire_subscriptions()
RETURNS jsonb AS $$
DECLARE
  v_expired_count integer := 0;
  v_shop shops%ROWTYPE;
BEGIN
  -- Expire trial shops
  FOR v_shop IN
    SELECT * FROM shops
    WHERE subscription_status = 'trial'
    AND trial_end_date < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE shops SET
      subscription_status = 'expired'
    WHERE id = v_shop.id;

    INSERT INTO subscription_events (
      shop_id,
      event_type,
      previous_status,
      new_status,
      notes
    ) VALUES (
      v_shop.id,
      'trial_expired',
      'trial',
      'expired',
      'Auto-expired by system'
    );

    v_expired_count := v_expired_count + 1;
  END LOOP;

  -- Expire active subscriptions
  FOR v_shop IN
    SELECT * FROM shops
    WHERE subscription_status = 'active'
    AND subscription_end_date < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE shops SET
      subscription_status = 'expired'
    WHERE id = v_shop.id;

    INSERT INTO subscription_events (
      shop_id,
      event_type,
      previous_status,
      new_status,
      notes
    ) VALUES (
      v_shop.id,
      'subscription_expired',
      'active',
      'expired',
      'Auto-expired by system'
    );

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'expired_count', v_expired_count,
    'run_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: suspend shop (admin only)
CREATE OR REPLACE FUNCTION
suspend_shop(
  p_shop_id text,
  p_admin_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_shop shops%ROWTYPE;
BEGIN
  SELECT * INTO v_shop
  FROM shops WHERE id = p_shop_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Shop not found'
    );
  END IF;

  UPDATE shops SET
    subscription_status = 'suspended',
    manual_lock = true,
    manual_lock_reason = p_reason,
    suspended_at = now(),
    suspended_by = p_admin_id
  WHERE id = p_shop_id;

  INSERT INTO subscription_events (
    shop_id,
    event_type,
    previous_status,
    new_status,
    notes,
    created_by
  ) VALUES (
    p_shop_id,
    'suspended',
    v_shop.subscription_status,
    'suspended',
    p_reason,
    p_admin_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'suspended_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: unsuspend shop (admin only)
CREATE OR REPLACE FUNCTION
unsuspend_shop(
  p_shop_id text,
  p_admin_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_shop shops%ROWTYPE;
  v_restore_status subscription_status_enum;
BEGIN
  SELECT * INTO v_shop
  FROM shops WHERE id = p_shop_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Shop not found'
    );
  END IF;

  -- Determine what status to restore to
  IF v_shop.subscription_end_date > now() THEN
    v_restore_status := 'active';
  ELSIF v_shop.trial_end_date > now() THEN
    v_restore_status := 'trial';
  ELSE
    v_restore_status := 'expired';
  END IF;

  UPDATE shops SET
    subscription_status = v_restore_status,
    manual_lock = false,
    manual_lock_reason = NULL,
    suspended_at = NULL,
    suspended_by = NULL
  WHERE id = p_shop_id;

  INSERT INTO subscription_events (
    shop_id,
    event_type,
    previous_status,
    new_status,
    notes,
    created_by
  ) VALUES (
    p_shop_id,
    'unsuspended',
    'suspended',
    v_restore_status,
    'Unsuspended by admin',
    p_admin_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'restored_status', v_restore_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: start trial for new shop
CREATE OR REPLACE FUNCTION
start_trial(p_shop_id text)
RETURNS jsonb AS $$
DECLARE
  v_now timestamptz := now();
  v_trial_end timestamptz := now() + interval '28 days';
BEGIN
  UPDATE shops SET
    subscription_status = 'trial',
    trial_start_date = v_now,
    trial_end_date = v_trial_end,
    -- support legacy columns as fallback
    trial_started_at = v_now,
    trial_ends_at = v_trial_end
  WHERE id = p_shop_id;

  INSERT INTO subscription_events (
    shop_id,
    event_type,
    previous_status,
    new_status,
    notes
  ) VALUES (
    p_shop_id,
    'trial_started',
    NULL,
    'trial',
    '28-day free trial started'
  );

  RETURN jsonb_build_object(
    'success', true,
    'trial_start', v_now,
    'trial_end', v_trial_end,
    'trial_days', 28
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-start trial on shop creation
CREATE OR REPLACE FUNCTION
trigger_start_trial()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subscription_status := 'trial'::subscription_status_enum;
  NEW.trial_start_date := now();
  NEW.trial_end_date := now() + interval '28 days';
  
  -- Sychronize legacy columns to ensure no background crash with previous frontend code
  BEGIN
    NEW.trial_started_at := now();
    NEW.trial_ends_at := now() + interval '28 days';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_shop_created ON shops;

CREATE TRIGGER on_shop_created
BEFORE INSERT ON shops
FOR EACH ROW
EXECUTE FUNCTION trigger_start_trial();

-- ================================================
-- STEP 8: RLS Policies
-- ================================================

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Shops: owner reads own subscription data
DROP POLICY IF EXISTS "owner_read_own_subscription" ON shops;
CREATE POLICY "owner_read_own_subscription"
ON shops FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- subscription_events: owner reads own events
DROP POLICY IF EXISTS "owner_read_own_events" ON subscription_events;
CREATE POLICY "owner_read_own_events"
ON subscription_events FOR SELECT
TO authenticated
USING (
  shop_id IN (
    SELECT id FROM shops
    WHERE owner_id = auth.uid()
  )
);

-- payment_records: owner reads own records
DROP POLICY IF EXISTS "owner_read_own_payments" ON payment_records;
CREATE POLICY "owner_read_own_payments"
ON payment_records FOR SELECT
TO authenticated
USING (
  shop_id IN (
    SELECT id FROM shops
    WHERE owner_id = auth.uid()
  )
);

-- subscription_plans: public read
DROP POLICY IF EXISTS "public_read_plans" ON subscription_plans;
CREATE POLICY "public_read_plans"
ON subscription_plans FOR SELECT
TO public USING (is_active = true);

-- Admin full access
DROP POLICY IF EXISTS "admin_full_access_events" ON subscription_events;
CREATE POLICY "admin_full_access_events"
ON subscription_events FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "admin_full_access_payments" ON payment_records;
CREATE POLICY "admin_full_access_payments"
ON payment_records FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "admin_full_access_shops" ON shops;
CREATE POLICY "admin_full_access_shops"
ON shops FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
