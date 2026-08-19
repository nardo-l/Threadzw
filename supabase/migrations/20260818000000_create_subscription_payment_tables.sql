-- ====================================================================
-- Phase 6A Migration: Payment & Subscription Database Architecture
-- Creates public.subscriptions and public.payment_events tables for NardoPay
-- ====================================================================

-- 1. Create reusable updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create public.subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('clothing', 'vehicles', 'general')),
    plan TEXT NOT NULL CHECK (plan IN ('free', 'pro')),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (
        status IN ('inactive', 'pending', 'active', 'past_due', 'grace_period', 'cancelled', 'expired')
    ),
    provider TEXT NOT NULL DEFAULT 'nardopay',
    nardopay_link_id TEXT NULL,
    nardopay_link_code TEXT NULL,
    nardopay_subscription_id TEXT NULL,
    current_period_start TIMESTAMPTZ NULL,
    current_period_end TIMESTAMPTZ NULL,
    grace_period_end TIMESTAMPTZ NULL,
    cancelled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create public.payment_events table
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NULL REFERENCES public.shops(id) ON DELETE SET NULL,
    subscription_id UUID NULL REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    owner_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'nardopay',
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'payment.completed',
            'subscription.renewed',
            'subscription.trial_started',
            'subscription.renew_failed',
            'subscription.cancelled'
        )
    ),
    provider_event_id TEXT NULL,
    link_code TEXT NULL,
    nardopay_subscription_id TEXT NULL,
    amount NUMERIC(12, 2) NULL CHECK (amount IS NULL OR amount >= 0),
    currency TEXT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature_verified BOOLEAN NOT NULL DEFAULT false,
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMPTZ NULL,
    processing_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Idempotency: Unique index on provider_event_id (when present)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_provider_event_id_unique 
    ON public.payment_events (provider_event_id) 
    WHERE provider_event_id IS NOT NULL;

-- 5. Subscriptions Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_id 
    ON public.subscriptions(shop_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_id 
    ON public.subscriptions(owner_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
    ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_category 
    ON public.subscriptions(category);

CREATE INDEX IF NOT EXISTS idx_subscriptions_nardopay_sub_id 
    ON public.subscriptions(nardopay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_nardopay_link_code 
    ON public.subscriptions(nardopay_link_code);

CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end 
    ON public.subscriptions(current_period_end);

-- 6. Partial Unique Index: Prevent duplicate active subscriptions per category for a shop
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_unique 
    ON public.subscriptions(shop_id, category) 
    WHERE status IN ('active', 'past_due', 'grace_period');

-- 7. Payment Events Indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_shop_id 
    ON public.payment_events(shop_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_subscription_id 
    ON public.payment_events(subscription_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_owner_id 
    ON public.payment_events(owner_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_event_type 
    ON public.payment_events(event_type);

CREATE INDEX IF NOT EXISTS idx_payment_events_created_at 
    ON public.payment_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_events_provider_event_id 
    ON public.payment_events(provider_event_id);

-- 8. Trigger for automatic updated_at on subscriptions table
DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 9. Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies on subscriptions
-- Sellers can SELECT their own subscriptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Allow sellers to view own subscriptions'
    ) THEN
        CREATE POLICY "Allow sellers to view own subscriptions"
        ON public.subscriptions FOR SELECT
        USING (owner_id = auth.uid());
    END IF;
END $$;

-- Note: No client INSERT, UPDATE, or DELETE policies exist for subscriptions.
-- Subscription mutations are restricted exclusively to privileged backend / webhook service roles.

-- 11. RLS Policies on payment_events
-- Sellers can SELECT their own payment events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'payment_events' AND policyname = 'Allow sellers to view own payment events'
    ) THEN
        CREATE POLICY "Allow sellers to view own payment events"
        ON public.payment_events FOR SELECT
        USING (owner_id = auth.uid());
    END IF;
END $$;

-- Note: No client INSERT, UPDATE, or DELETE policies exist for payment_events.
-- Payment event insertion and processing are restricted exclusively to privileged backend / webhook service roles.
