-- Preserve previously activated legacy Pro shops that predate monthly expiry fields.
-- They remain active as grandfathered entitlements; all new approvals receive a month end.
UPDATE public.subscriptions sub
SET status = 'active',
    updated_at = now()
FROM public.shops s
WHERE s.id = sub.shop_id
  AND lower(coalesce(s.plan, '')) IN ('pro','premium')
  AND lower(coalesce(s.account_status, '')) = 'active'
  AND sub.current_period_end IS NULL
  AND lower(coalesce(sub.status, '')) IN ('trial','inactive','pending');
