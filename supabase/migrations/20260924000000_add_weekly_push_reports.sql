-- ThreadZW push notification lifecycle additions
-- Adds an opt-out flag for the weekly merchant report.
ALTER TABLE IF EXISTS public.notification_preferences
  ADD COLUMN IF NOT EXISTS weekly_report_enabled BOOLEAN NOT NULL DEFAULT TRUE;
