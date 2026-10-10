-- Keep trial and paid access server-authoritative. Merchants must not be able
-- to extend trials, self-activate Pro, or clear a pending payment from the client.
CREATE OR REPLACE FUNCTION public.fn_protect_threadzw_entitlement_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  IF v_role = 'service_role' OR v_role = 'supabase_admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
    OR NEW.account_status IS DISTINCT FROM OLD.account_status
    OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
    OR NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at
    OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
    OR NEW.payment_required IS DISTINCT FROM OLD.payment_required
    OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.payment_verification_status IS DISTINCT FROM OLD.payment_verification_status
    OR NEW.payment_submitted_at IS DISTINCT FROM OLD.payment_submitted_at
    OR NEW.payment_verified_at IS DISTINCT FROM OLD.payment_verified_at
    OR NEW.payment_verified_by IS DISTINCT FROM OLD.payment_verified_by
    OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
    OR NEW.product_limit IS DISTINCT FROM OLD.product_limit
  THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'ENTITLEMENT_SERVER_MANAGED',
      DETAIL = 'Trial, Pro, and payment status can only be changed by ThreadZW trusted backend/admin operations.';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_threadzw_protect_entitlement_fields ON public.shops;
CREATE TRIGGER trg_threadzw_protect_entitlement_fields
BEFORE UPDATE OF plan, account_status, subscription_status, trial_started_at, trial_ends_at,
  payment_required, payment_status, payment_verification_status, payment_submitted_at,
  payment_verified_at, payment_verified_by, paid_at, product_limit
ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.fn_protect_threadzw_entitlement_fields();
