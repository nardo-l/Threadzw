-- ====================================================================
-- Phase 5.5 Migration: Database-Level Quota & Plan Enforcement
-- Enforces active listing limits on products and vehicles via PostgreSQL triggers
-- ====================================================================

-- 1. Product Quota Enforcement Function (Clothing Sellers)
-- Rules:
--   - Clothing Free: Max 2 active products
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

        -- Free clothing limit is 2 active products
        IF v_active_count >= 2 THEN
            RAISE EXCEPTION 'Clothing Free plan limit reached: maximum 2 active products. Upgrade to Clothing Pro for unlimited active products.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    RETURN NEW;
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
