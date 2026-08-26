-- ThreadZW production notification-schema repair
-- Target project: zuashdquiorcwvyvqucm
-- Run this in the Supabase SQL editor for the project used by threadzw.vercel.app.
-- Review the statements before execution. This migration is designed to be repeatable.

BEGIN;

-- Dashboard notification-permission onboarding state.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notifications_prompted boolean NOT NULL DEFAULT false;

-- Preference fields read and written by the notification routes and scheduler.
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS setup_reminders_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT true;

-- In-app notification destination used by the inbox and push payload.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS target_url text NOT NULL DEFAULT '/dashboard';

-- Scheduler claim/idempotency fields.
ALTER TABLE public.notification_deliveries
  ADD COLUMN IF NOT EXISTS delivery_key text,
  ADD COLUMN IF NOT EXISTS profile_id uuid,
  ADD COLUMN IF NOT EXISTS slot text,
  ADD COLUMN IF NOT EXISTS local_date date,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS push_sent_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Preserve compatibility with the scheduler:
-- evening summaries can have a NULL shop_id for merchants with multiple shops,
-- and failed deliveries set sent_at back to NULL.
ALTER TABLE public.notification_deliveries
  ALTER COLUMN shop_id DROP NOT NULL,
  ALTER COLUMN sent_at DROP NOT NULL;

-- Populate newly added fields for any legacy delivery rows before enforcing
-- delivery-key uniqueness. Legacy rows are intentionally marked as legacy so
-- they cannot collide with a new scheduler claim key.
UPDATE public.notification_deliveries
SET
  delivery_key = COALESCE(delivery_key, 'legacy:' || id::text),
  local_date = COALESCE(local_date, notification_date),
  slot = COALESCE(slot, 'legacy'),
  attempts = COALESCE(attempts, 1),
  updated_at = COALESCE(updated_at, created_at, now()),
  profile_id = COALESCE(profile_id, (
    SELECT s.owner_id
    FROM public.shops s
    WHERE s.id = notification_deliveries.shop_id
  ))
WHERE delivery_key IS NULL
   OR local_date IS NULL
   OR slot IS NULL
   OR profile_id IS NULL;

-- New scheduler claims are keyed by local date, slot, profile, and message type.
-- This partial unique index is safe for legacy rows because they received unique
-- legacy:<delivery-id> keys above.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_deliveries_delivery_key
  ON public.notification_deliveries (delivery_key)
  WHERE delivery_key IS NOT NULL;

-- Lookup indexes used by the scheduler and dashboard diagnostics.
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_profile_date
  ON public.notification_deliveries (profile_id, local_date DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_profile_created
  ON public.notifications (profile_id, created_at DESC);

COMMIT;

-- After running, re-run the verification query below. It should return all
-- required columns with zero missing rows.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'profiles' AND column_name = 'notifications_prompted') OR
    (table_name = 'notification_preferences' AND column_name IN ('setup_reminders_enabled', 'push_enabled')) OR
    (table_name = 'notifications' AND column_name = 'target_url') OR
    (table_name = 'notification_deliveries' AND column_name IN ('delivery_key', 'profile_id', 'slot', 'local_date', 'attempts', 'last_attempt_at', 'push_sent_count', 'updated_at'))
  )
ORDER BY table_name, column_name
LIMIT 50;
