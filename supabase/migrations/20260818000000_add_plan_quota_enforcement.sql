-- ====================================================================
-- Phase 5.5 Migration: Database-Level Quota & Plan Enforcement
-- Enforces active listing limits on products and vehicles via PostgreSQL triggers
-- ====================================================================

-- 1. Product Quota Enforcement Function (Clothing Sellers)
-- Rules:
--   - Clothing Free/Trial: Max 9 active products
--   - Clothing Pro: Unlimited active products
--   - General Sellers: Retains existing general functionality (unrestricted)
--   - Inactive products (is_published = false, draft, paused, archived, deleted) do not count
CREATE OR REPLACE FUNCTION public.fn_enforce_product_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shop RECORD;
    v_active_count INTEGER;
    v_is_new_active BOOLEAN;
    v_is_clothing BOOLEAN;
    v_is_pro BOOLEAN;
BEGIN
    -- Determine if the incoming row state is active/published
    v_is_new_active := (NEW.is_published IS TRUE) 
                       AND (NEW.status IS NULL OR LOWER(NEW.status) NOT IN ('draft', 'paused', 'archived', 'deleted'));

    -- If the product is not active/published, no active quota limit applies
    IF NOT v_is_new_active THEN
        RETURN NEW;
    END IF;

    -- Concurrency Protection: Acquire an exclusive row-level lock on the shop record
    -- for the duration of this transaction to prevent concurrent race-condition quota bypasses
    SELECT id, page_type, plan INTO v_shop
    FROM public.shops
    WHERE id = NEW.shop_id
    FOR UPDATE;

    -- If shop not found, allow insert/update to proceed or let foreign key handle it
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Determine category (clothing/storefront vs general/vehicles)
    v_is_clothing := LOWER(COALESCE(v_shop.page_type, 'clothing')) IN ('clothing', 'storefront');
    
    -- Determine plan tier (pro/premium vs free)
    v_is_pro := LOWER(COALESCE(v_shop.plan, 'free')) IN ('pro', 'premium');

    -- Only enforce clothing product quota for clothing sellers on Free plan
    IF v_is_clothing AND NOT v_is_pro THEN
        -- Count existing active products for this shop (excluding current product on UPDATE)
        SELECT COUNT(*)
        INTO v_active_count
        FROM public.products
        WHERE shop_id = NEW.shop_id
          AND (TG_OP = 'INSERT' OR id != NEW.id)
          AND is_published IS TRUE
          AND (status IS NULL OR LOWER(status) NOT IN ('draft', 'paused', 'archived', 'deleted'));

        -- Free/trial plan limit is 9 active products
        IF v_active_count >= 9 THEN
            RAISE EXCEPTION 'PRODUCT_LIMIT_REACHED: Free trial allows a maximum of 9 products. Upgrade to Pro for unlimited products.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Helper RPC: confirm_shop_payment
CREATE OR REPLACE FUNCTION public.confirm_shop_payment(
    target_shop_id UUID,
    target_payment_reference TEXT,
    target_transaction_id TEXT,
    target_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.shops
    SET 
        plan = 'pro',
        product_limit = NULL,
        payment_status = 'paid',
        payment_amount = target_amount,
        payment_currency = 'USD',
        payment_reference = target_payment_reference,
        payment_required = false,
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = target_shop_id;

    INSERT INTO public.shop_payments (
        shop_id,
        amount,
        currency,
        provider,
        payment_reference,
        status,
        created_at,
        paid_at
    )
    VALUES (
        target_shop_id,
        target_amount,
        'USD',
        'nardopay',
        target_payment_reference,
        'paid',
        NOW(),
        NOW()
    )
    ON CONFLICT (shop_id) DO UPDATE
    SET 
        amount = target_amount,
        status = 'paid',
        payment_reference = target_payment_reference,
        paid_at = NOW(),
        updated_at = NOW();

    RETURN jsonb_build_object('success', true, 'shop_id', target_shop_id, 'plan', 'pro');
END;
$$;

-- Helper RPC: shop_has_paid
CREATE OR REPLACE FUNCTION public.shop_has_paid(target_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_paid BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.shops
        WHERE id = target_shop_id
          AND (plan = 'pro' OR (payment_status = 'paid' AND payment_amount >= 9.00))
    ) INTO v_has_paid;

    IF v_has_paid THEN
        RETURN TRUE;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.shop_payments
        WHERE shop_id = target_shop_id
          AND status = 'paid'
          AND amount >= 9.00
    ) INTO v_has_paid;

    RETURN v_has_paid;
END;
$$;

-- 2. Vehicle Quota Enforcement Function (Vehicle Sellers)
-- Rules:
--   - Vehicle Free: Max 1 active vehicle (available, reserved)
--   - Vehicle Pro: Max 20 active vehicles (available, reserved)
--   - Sold vehicles do NOT count toward active quota
CREATE OR REPLACE FUNCTION public.fn_enforce_vehicle_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shop RECORD;
    v_active_count INTEGER;
    v_is_new_active BOOLEAN;
    v_is_vehicles_category BOOLEAN;
    v_is_pro BOOLEAN;
    v_max_active INTEGER;
BEGIN
    -- Determine if the incoming vehicle state is active (available or reserved count; sold does not)
    v_is_new_active := LOWER(COALESCE(NEW.status, 'available')) IN ('available', 'reserved');

    -- If vehicle is marked sold or other inactive state, no active quota limit applies
    IF NOT v_is_new_active THEN
        RETURN NEW;
    END IF;

    -- Concurrency Protection: Acquire an exclusive row-level lock on the shop record
    -- for the duration of this transaction to prevent concurrent race-condition quota bypasses
    SELECT id, page_type, plan INTO v_shop
    FROM public.shops
    WHERE id = NEW.shop_id
    FOR UPDATE;

    -- If shop not found, let foreign key constraint handle it
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Determine category
    v_is_vehicles_category := LOWER(COALESCE(v_shop.page_type, 'clothing')) = 'vehicles';

    -- Determine plan tier (pro/premium vs free)
    v_is_pro := LOWER(COALESCE(v_shop.plan, 'free')) IN ('pro', 'premium');

    -- Only enforce vehicle quota for vehicle dealerships
    IF v_is_vehicles_category THEN
        v_max_active := CASE WHEN v_is_pro THEN 20 ELSE 1 END;

        -- Count existing active vehicles for this shop (excluding current vehicle on UPDATE)
        SELECT COUNT(*)
        INTO v_active_count
        FROM public.vehicles
        WHERE shop_id = NEW.shop_id
          AND (TG_OP = 'INSERT' OR id != NEW.id)
          AND LOWER(COALESCE(status, 'available')) IN ('available', 'reserved');

        IF v_active_count >= v_max_active THEN
            IF v_is_pro THEN
                RAISE EXCEPTION 'Vehicle Pro plan limit reached: maximum % active vehicles.', v_max_active
                    USING ERRCODE = 'check_violation';
            ELSE
                RAISE EXCEPTION 'Vehicle Free plan limit reached: maximum 1 active vehicle. Upgrade to Vehicle Pro to list up to 20 active vehicles.'
                    USING ERRCODE = 'check_violation';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Attach Triggers to products and vehicles tables
DROP TRIGGER IF EXISTS trg_enforce_product_quota ON public.products;
CREATE TRIGGER trg_enforce_product_quota
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_enforce_product_quota();

DROP TRIGGER IF EXISTS trg_enforce_vehicle_quota ON public.vehicles;
CREATE TRIGGER trg_enforce_vehicle_quota
    BEFORE INSERT OR UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_enforce_vehicle_quota();
