-- ThreadZW clothing-only payment/plan cleanup
-- Free: unlimited products; 50 lifetime unique visits; 10 lifetime interests.
-- Premium: $9 one-off lifetime access.
-- NardoPay signed webhook is the only Premium activation authority.

UPDATE public.shops SET plan = 'premium'
WHERE LOWER(COALESCE(plan, 'free')) = 'pro';

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'premium'));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_billing_cycle_check
  CHECK (billing_cycle IN ('none', 'monthly', 'yearly'));

-- Remove the obsolete clothing product-count gate. Free clothing products are unlimited.
CREATE OR REPLACE FUNCTION public.fn_enforce_product_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_product_quota ON public.products;
CREATE TRIGGER trg_enforce_product_quota
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_product_quota();
