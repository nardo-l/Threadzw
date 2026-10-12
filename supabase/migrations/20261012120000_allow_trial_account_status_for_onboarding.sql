-- The onboarding RPC starts a 3-day trial using account_status = 'trial'.
-- Permit that status while preserving the existing account-status values.
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_account_status_check;

ALTER TABLE public.shops
  ADD CONSTRAINT shops_account_status_check
  CHECK (account_status = ANY (ARRAY[
    'free'::text,
    'trial'::text,
    'pending_payment'::text,
    'active'::text,
    'rejected'::text
  ]));
