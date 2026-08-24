-- Threadzw / NardoPay webhook idempotency
-- Run once in the Supabase SQL editor after confirming there are no duplicate provider_event_id values.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.payment_events
    WHERE provider_event_id IS NOT NULL
    GROUP BY provider_event_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create unique index: duplicate non-null provider_event_id values exist';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS payment_events_provider_event_id_uidx
  ON public.payment_events (provider_event_id)
  WHERE provider_event_id IS NOT NULL;
