// THREADZW PRICING: Limited Free Tier
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
    name: 'Limited Free Tier',
    monthly: {
      firstMonth: 0.00,
      recurring: 0.00,
    },
    maxProducts: 3,
    featuredDays: 0,
  },
};

export const getPlanAmount = (plan: string, billingCycle: string, isFirstPeriod: boolean) => {
  return 0.00;
};

export const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;
