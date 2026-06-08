// src/utils/trialTimer.ts
import { SUBSCRIPTION } from '../constants/subscription';

export const calculateDaysRemaining = (
  endDate: string | Date | null | undefined
): number => {
  if (!endDate) return 0;
  
  const now = new Date();
  const end = new Date(endDate);
  
  if (end <= now) return 0;
  
  const msRemaining = end.getTime() - now.getTime();
  
  // Ceil so last partial day = 1 day
  return Math.ceil(
    msRemaining / (1000 * 60 * 60 * 24)
  );
};

export const calculateTrialStatus = (shop: any) => {
  const now = new Date();
  
  // Active paid subscription
  if (
    shop.subscription_end_date &&
    new Date(shop.subscription_end_date) > now
  ) {
    return {
      status: SUBSCRIPTION.STATUS.ACTIVE,
      daysRemaining: calculateDaysRemaining(
        shop.subscription_end_date
      ),
      expiryDate: shop.subscription_end_date,
      hasAccess: true,
      isLocked: false
    };
  }
  
  // Trial running
  const shopTrialEnd = shop.trial_end_date || shop.trial_ends_at || shop.trial_end;
  if (
    shopTrialEnd &&
    new Date(shopTrialEnd) > now
  ) {
    const days = calculateDaysRemaining(
      shopTrialEnd
    );
    return {
      status: SUBSCRIPTION.STATUS.TRIAL,
      daysRemaining: days,
      expiryDate: shopTrialEnd,
      hasAccess: true,
      isLocked: false,
      isUrgent: days <= SUBSCRIPTION.URGENT_DAYS,
      isCritical: days <= SUBSCRIPTION.CRITICAL_DAYS,
      label: SUBSCRIPTION.getDaysLabel(days)
    };
  }
  
  // Suspended
  if (shop.manual_lock === true) {
    return {
      status: SUBSCRIPTION.STATUS.SUSPENDED,
      daysRemaining: 0,
      hasAccess: false,
      isLocked: true
    };
  }
  
  // Expired
  return {
    status: SUBSCRIPTION.STATUS.EXPIRED,
    daysRemaining: 0,
    expiryDate: shopTrialEnd,
    hasAccess: false,
    isLocked: true
  };
};
