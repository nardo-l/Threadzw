/*
 * THREADZW SUBSCRIPTION CONSTANTS
 * Free trial: 3 days (72 hours)
 * Subscription: 28 days per period
 * Price: $5/month
 * 
 * DO NOT change these values without 
 * updating ALL instances across the app.
 * Search for "THREADZW SUBSCRIPTION"
 * to find every reference.
 */

export const TRIAL_DAYS = 3;
export const SUBSCRIPTION_DAYS = 28;
export const SUBSCRIPTION_PRICE = 5;

export interface ShopStatusResult {
  status: 'trial' | 'active' | 'pending_verification' | 'locked';
  isLive: boolean;
  label: string;
  daysLeft: number;
  hoursLeft?: number;
  trialEnds?: string;
  claimId?: string;
  submittedAt?: string;
}

export const parseDate = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  
  // Try direct parsing
  let d = new Date(dateVal);
  if (!isNaN(d.getTime())) return d;
  
  // Try cleaning format for strict browser engines (e.g. mobile Safari)
  try {
    let str = String(dateVal).trim();
    // Replace space between Date and Time with 'T'
    if (str.includes(' ') && !str.includes('T')) {
      const parts = str.split(' ');
      if (parts.length >= 2) {
        str = parts[0] + 'T' + parts.slice(1).join(' ');
      }
    }
    // Remove space before timezone offset (e.g. " +00:00" -> "+00:00")
    str = str.replace(/\s+([+-]\d+)/, '$1');
    d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  } catch (_) {}
  
  return null;
};

export const getShopStatus = (shop: any, claims?: any[]): ShopStatusResult => {
  if (!shop) {
    return {
      status: 'locked',
      isLive: false,
      label: 'Locked',
      daysLeft: 0
    };
  }

  const now = new Date();

  // 1. Awaiting code entry (Admin approved, code emitted)
  if (shop.subscription_status === 'awaiting_code_entry') {
    return {
      status: 'locked',
      isLive: false,
      label: 'Awaiting Code Entry',
      daysLeft: 0
    };
  }

  // 1.5. Active paid subscription
  const parsedSubEnd = parseDate(shop.subscription_end || shop.subscription_ends_at || shop.current_period_end);
  if (parsedSubEnd && parsedSubEnd > now) {
    return {
      status: 'active',
      isLive: true,
      label: 'Active',
      daysLeft: Math.ceil(
        (parsedSubEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    };
  }

  // 2. Free trial running
  let trialEndVal = shop.trial_end || shop.trial_ends_at;
  const trialStart = shop.trial_started_at || shop.trial_start || shop.created_at;

  // High-res resiliency fallback logic
  if (trialStart) {
    const trialStartDate = parseDate(trialStart);
    if (trialStartDate) {
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const computedEndDate = new Date(trialStartDate.getTime() + threeDaysInMs);

      const parsedTrialEnd = parseDate(trialEndVal);
      if (computedEndDate > now && (!parsedTrialEnd || parsedTrialEnd < computedEndDate)) {
        trialEndVal = computedEndDate.toISOString();
      }
    }
  }

  const finalTrialEnd = parseDate(trialEndVal);
  if (finalTrialEnd && finalTrialEnd > now) {
    const hoursLeft = Math.ceil(
      (finalTrialEnd.getTime() - now.getTime()) / (1000 * 60 * 60)
    );
    const daysLeft = Math.ceil(hoursLeft / 24);

    return {
      status: 'trial',
      isLive: true,
      label: 'Free Trial',
      daysLeft,
      hoursLeft,
      trialEnds: finalTrialEnd.toISOString()
    };
  }

  // 3. Pending payment verification
  const pendingClaim = claims?.find(c => c.status === 'pending');
  if (pendingClaim || shop.subscription_status === 'pending_verification') {
    return {
      status: 'pending_verification',
      isLive: true,
      label: 'Awaiting Verification',
      claimId: pendingClaim?.id,
      submittedAt: pendingClaim?.submitted_at,
      daysLeft: 0
    };
  }

  // 4. Locked — trial expired, no subscription, no pending claim
  return {
    status: 'locked',
    isLive: false,
    label: 'Locked',
    daysLeft: 0
  };
};
