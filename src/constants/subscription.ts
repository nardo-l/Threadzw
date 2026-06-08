// src/constants/subscription.ts

export interface SubscriptionConfig {
  TRIAL_DAYS: number;
  BILLING_DAYS: number;
  PRICE_USD: number;
  CURRENCY: string;
  PLAN_NAME: string;
  STATUS: {
    TRIAL: string;
    ACTIVE: string;
    EXPIRED: string;
    SUSPENDED: string;
  };
  URGENT_DAYS: number;
  CRITICAL_DAYS: number;
  getDaysLabel: (days: number) => string;
  TRIAL_MS: number;
  BILLING_MS: number;
}

export const SUBSCRIPTION: SubscriptionConfig = {
  TRIAL_DAYS: 28,
  BILLING_DAYS: 28,
  PRICE_USD: 7,
  CURRENCY: 'USD',
  PLAN_NAME: 'ThreadZW Pro',

  STATUS: {
    TRIAL: 'trial',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    SUSPENDED: 'suspended'
  },

  // Urgency thresholds for banner colors
  URGENT_DAYS: 7,
  CRITICAL_DAYS: 3,

  // Trial end messaging
  getDaysLabel: (days: number) => {
    if (days <= 0) return 'Trial ended';
    if (days === 1) return 'Last day of trial';
    if (days <= 3) return `Trial ends in ${days} days`;
    return `${days} days remaining`;
  },

  // Milliseconds for JS date math
  TRIAL_MS: 28 * 24 * 60 * 60 * 1000,
  BILLING_MS: 28 * 24 * 60 * 60 * 1000,
};
