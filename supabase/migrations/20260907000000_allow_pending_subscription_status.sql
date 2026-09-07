-- The current one-time Premium checkout creates a subscription row in `pending`
-- state before NardoPay returns the hosted checkout link.
-- Keep legacy `trial` rows valid while allowing the current lifecycle states.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_status_check
CHECK (
  status = ANY (
    ARRAY[
      'trial'::text,
      'pending'::text,
      'active'::text,
      'past_due'::text,
      'grace_period'::text,
      'expired'::text,
      'cancelled'::text
    ]
  )
);
