/*
 * THREADZW SUBSCRIPTION CONSTANTS
 * Free trial: 7 days
 * Subscription: 28 days per period
 * Price: $7/month
 * 
 * DO NOT change these values without 
 * updating ALL instances across the app.
 * Search for "THREADZW SUBSCRIPTION"
 * to find every reference.
 */

export const TRIAL_DAYS = 7;
export const SUBSCRIPTION_DAYS = 28;
export const SUBSCRIPTION_PRICE = 7;

export interface ShopStatusResult {
  status: 'trial' | 'active' | 'pending_verification' | 'expired';
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
  return {
    status: 'active',
    isLive: true,
    label: 'Free Beta Active',
    daysLeft: 999
  };
};
