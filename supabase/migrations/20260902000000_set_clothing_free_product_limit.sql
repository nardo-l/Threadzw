-- Clothing Free product quota: 9 active products.
-- Premium clothing stores remain unlimited.

CREATE OR REPLACE FUNCTION public.fn_enforce_clothing_product_quota()
RETURNS TRIGGER AS $$
DECLARE
  shop_plan TEXT;
  active_count INTEGER;
BEGIN
  SELECT COALESCE(plan, 'free') INTO shop_plan
  FROM public.shops
  WHERE id = NEW.shop_id;

  IF COALESCE(shop_plan, 'free') IN ('premium', 'pro') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_published = false OR COALESCE(NEW.status, '') IN ('draft', 'paused', 'archived') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO active_count
  FROM public.products p
  JOIN public.shops s ON s.id = p.shop_id
  WHERE p.shop_id = NEW.shop_id
    AND COALESCE(s.page_type, 'clothing') IN ('clothing', 'storefront')
    AND p.id <> NEW.id
    AND COALESCE(p.is_published, true) = true
    AND COALESCE(p.status, '') NOT IN ('draft', 'paused', 'archived');

  IF active_count >= 9 THEN
    RAISE EXCEPTION 'CLOTHING_FREE_PRODUCT_LIMIT: Free clothing shops can have up to 9 active products. Upgrade to Premium for unlimited products.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_clothing_product_quota ON public.products;
CREATE TRIGGER trg_enforce_clothing_product_quota
BEFORE INSERT OR UPDATE OF shop_id, is_published, status ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_clothing_product_quota();
