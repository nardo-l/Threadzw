-- The subscriptions table is unique per profile, not necessarily per shop.
-- Reuse a legacy subscription row for the owner during admin approval instead of
-- failing on a profile uniqueness conflict.
CREATE OR REPLACE FUNCTION public.fn_threadzw_sync_subscription_after_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz;
BEGIN
  IF lower(coalesce(NEW.page_type, 'clothing')) IN ('clothing','fashion','apparel','boutique')
     AND lower(coalesce(NEW.plan, '')) IN ('pro','premium')
     AND lower(coalesce(NEW.account_status, '')) = 'active'
     AND lower(coalesce(NEW.payment_verification_status, '')) IN ('verified','approved')
     AND (
       lower(coalesce(OLD.plan, '')) NOT IN ('pro','premium')
       OR lower(coalesce(OLD.account_status, '')) <> 'active'
       OR lower(coalesce(OLD.payment_verification_status, '')) NOT IN ('verified','approved')
       OR lower(coalesce(OLD.payment_status, '')) <> 'paid'
     ) THEN
    v_start := COALESCE(CASE
      WHEN NEW.payment_verified_at IS DISTINCT FROM OLD.payment_verified_at THEN NEW.payment_verified_at
      WHEN NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN NEW.paid_at
      ELSE now()
    END, now());

    UPDATE public.subscriptions
    SET owner_id = NEW.owner_id,
        shop_id = NEW.id,
        category = 'clothing',
        plan = 'premium',
        status = 'active',
        amount = 1.59,
        currency = 'USD',
        billing_cycle = 'monthly',
        provider = 'nardopay',
        current_period_start = v_start,
        current_period_end = v_start + interval '1 month',
        updated_at = now()
    WHERE shop_id = NEW.id OR profile_id = NEW.owner_id;

    IF NOT FOUND THEN
      INSERT INTO public.subscriptions (
        profile_id, owner_id, shop_id, category, plan, amount, currency,
        billing_cycle, provider, status, current_period_start, current_period_end,
        created_at, updated_at
      ) VALUES (
        NEW.owner_id, NEW.owner_id, NEW.id, 'clothing', 'premium', 1.59, 'USD',
        'monthly', 'nardopay', 'active', v_start, v_start + interval '1 month',
        now(), now()
      )
      ON CONFLICT (profile_id) DO UPDATE
      SET owner_id = EXCLUDED.owner_id,
          shop_id = EXCLUDED.shop_id,
          category = 'clothing',
          plan = 'premium',
          amount = 1.59,
          currency = 'USD',
          billing_cycle = 'monthly',
          provider = 'nardopay',
          status = 'active',
          current_period_start = EXCLUDED.current_period_start,
          current_period_end = EXCLUDED.current_period_end,
          updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
