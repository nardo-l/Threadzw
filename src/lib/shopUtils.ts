import { supabase } from './supabase';
import { getShopStatus, parseDate } from '../utils/shopStatus';

export type ShopStatus = 
  | 'no_shop'
  | 'trial_active'
  | 'trial_paid_pending_code'
  | 'expired_no_payment'
  | 'expired_paid_pending_code'
  | 'subscription_active'
  | 'subscription_expired';

export const getShopState = (shop: any, claims?: any[]): ShopStatus => {
  if (!shop) return 'no_shop';
  
  const statusObj = getShopStatus(shop, claims);
  
  if (statusObj.status === 'trial') {
    return 'trial_active';
  }
  if (statusObj.status === 'active') {
    return 'subscription_active';
  }
  if (statusObj.status === 'pending_verification') {
    // If trial is still running according to dates
    const trialEndVal = shop.trial_end || shop.trial_ends_at;
    const now = new Date();
    const parsedTrialEnd = parseDate(trialEndVal);
    const trialActive = parsedTrialEnd && parsedTrialEnd > now;
    return trialActive ? 'trial_paid_pending_code' : 'expired_paid_pending_code';
  }
  
  return 'expired_no_payment';
};
