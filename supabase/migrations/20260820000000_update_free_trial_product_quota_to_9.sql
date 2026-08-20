-- ====================================================================
-- Phase 5.6 Migration: Update Free/Trial Product Quota to 9 Products
-- ====================================================================

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
