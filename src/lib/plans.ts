// THREADZW PRICING: $2.99/month | 7-day trial (Single Source of Truth)
export const FREE_TRIAL_DAYS = 7;

export interface PlanDetails {
  name: string;
  monthly: {
    firstMonth: number;
    recurring: number;
  };
  maxProducts: number;
  featuredDays: number;
}

export const PLANS: Record<string, PlanDetails> = {
  shop: {
    name: 'Thread ZW Shop',
    monthly: {
      firstMonth: 0.00,    // Trial
      recurring: 2.99,     // $2.99/month after
    },
    maxProducts: Infinity,
    featuredDays: 28,
  },
};

export const getPlanAmount = (plan: string, billingCycle: string, isFirstPeriod: boolean) => {
  // THREADZW PRICING: $2.99/month | 7-day trial
  return 2.99;
};

export const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;



