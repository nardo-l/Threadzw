-- Prevent editing shop settings after the 3-day trial or while payment is pending.
-- Public storefront reads and analytics counters remain available; backend/admin
-- service-role updates can still verify payments and maintain subscription state.
CREATE OR REPLACE FUNCTION public.fn_enforce_threadzw_shop_view_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_period_end timestamptz;
  v_subscription_status text;
  v_has_subscription boolean := false;
  v_has_pro boolean := false;
  v_trial_active boolean := false;
  v_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  IF v_role = 'service_role' OR v_role = 'supabase_admin' THEN
    RETURN NEW;
  END IF;

  SELECT status, current_period_end
    INTO v_subscription_status, v_period_end
  FROM public.subscriptions
  WHERE shop_id = OLD.id
  ORDER BY created_at DESC
  LIMIT 1;
  v_has_subscription := FOUND;

  v_has_pro := lower(coalesce(OLD.plan, '')) IN ('pro','premium')
    AND lower(coalesce(OLD.account_status, '')) = 'active'
    AND (
      NOT v_has_subscription
      OR (
        lower(coalesce(v_subscription_status, '')) = 'active'
        AND (v_period_end IS NULL OR v_period_end > now())
      )
    );

  v_trial_active := OLD.trial_ends_at IS NOT NULL
    AND OLD.trial_ends_at > now()
    AND lower(coalesce(OLD.account_status, '')) IN ('trial','free')
    AND lower(coalesce(OLD.payment_verification_status, 'none')) NOT IN ('pending','rejected');

  IF NOT v_has_pro AND NOT v_trial_active THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'SHOP_VIEW_ONLY',
      DETAIL = 'Your 3-day trial has ended or payment is awaiting verification. Your storefront remains online, but shop settings cannot be edited until payment is approved.';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_threadzw_shop_view_only_guard ON public.shops;
CREATE TRIGGER trg_threadzw_shop_view_only_guard
BEFORE UPDATE OF name, slug, description, bio, whatsapp_number, city, location,
  logo_url, banner_url, page_config, template_id, is_active, storefront_published, page_type
ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_threadzw_shop_view_only();
