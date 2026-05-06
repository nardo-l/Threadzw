import { supabase } from './supabase';

export type ShopStatus = 
  | 'no_shop'
  | 'trial_active'
  | 'trial_paid_pending_code'
  | 'expired_no_payment'
  | 'expired_paid_pending_code'
  | 'subscription_active'
  | 'subscription_expired';

export const getShopState = (shop: any): ShopStatus => {
  if (!shop) return 'no_shop';
  
  const now = Date.now();
  const trialEnd = shop.trial_ends_at
    ? new Date(shop.trial_ends_at).getTime()
    : 0;
  const trialActive = now < trialEnd;
  
  const codeExpired = shop.code_expires_at
    ? now > new Date(shop.code_expires_at).getTime()
    : false;
  
  // STATE 1 — Trial active, no payment submitted
  if (trialActive && shop.subscription_status === 'trial') {
    return 'trial_active';
  }
  
  // STATE 2 — Trial active, payment made but no code yet
  if (trialActive && shop.subscription_status === 'pending_payment') {
    return 'trial_paid_pending_code';
  }
  
  // STATE 3 — Trial expired, no payment made
  if (!trialActive && shop.subscription_status === 'trial') {
    // Auto expire the shop in background if needed (client side detection)
    return 'expired_no_payment';
  }
  
  // STATE 4 — Trial expired, payment made but no code yet
  if (!trialActive && shop.subscription_status === 'pending_payment') {
    return 'expired_paid_pending_code';
  }
  
  // STATE 5 — Active subscription, code entered and valid
  if (shop.subscription_status === 'active' && shop.is_live && !codeExpired) {
    return 'subscription_active';
  }
  
  // STATE 6 — Subscription expired
  if (shop.subscription_status === 'active' && codeExpired) {
    return 'subscription_expired';
  }
  
  if (shop.subscription_status === 'expired') {
    return shop.access_code ? 'expired_paid_pending_code' : 'expired_no_payment';
  }
  
  return 'trial_active';
};
