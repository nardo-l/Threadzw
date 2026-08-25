-- ThreadZW merchant notification system
-- Run this migration in the existing Supabase project before enabling the GitHub Actions scheduler.

-- The notifications table already exists in the live project. Add a server-generated
-- deduplication key so retries cannot create duplicate inbox rows.
ALTER TABLE IF EXISTS public.notifications
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe_key_unique
  ON public.notifications (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- Keep browser subscriptions idempotent when the same device re-registers.
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_profile_endpoint_unique
  ON public.push_subscriptions (profile_id, endpoint);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  profile_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'Africa/Harare',
  setup_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  daily_summary_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_key TEXT NOT NULL UNIQUE,
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('midday', 'evening')),
  local_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'sent', 'failed')),
  push_sent_count INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 1,
  error_message TEXT NULL,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_timezone
  ON public.notification_preferences (timezone);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_profile_date
  ON public.notification_deliveries (profile_id, local_date DESC);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status_attempt
  ON public.notification_deliveries (status, last_attempt_at);

CREATE OR REPLACE FUNCTION public.handle_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_notification_updated_at();

DROP TRIGGER IF EXISTS trg_notification_deliveries_updated_at ON public.notification_deliveries;
CREATE TRIGGER trg_notification_deliveries_updated_at
  BEFORE UPDATE ON public.notification_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.handle_notification_updated_at();

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Merchants can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Merchants can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can create own notification preferences" ON public.notification_preferences;
CREATE POLICY "Merchants can create own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can view own notification deliveries" ON public.notification_deliveries;
CREATE POLICY "Merchants can view own notification deliveries"
  ON public.notification_deliveries FOR SELECT
  USING (profile_id = auth.uid());

-- Scheduled writes use the Supabase service-role client. No client write policy is
-- granted for deliveries, which prevents merchants from forging sent-state records.
