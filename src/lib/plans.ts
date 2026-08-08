// THREADZW PRICING: $49 / once off (Lifetime Access)
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
    name: 'Thread ZW Lifetime Store',
    monthly: {
      firstMonth: 49.00,  // $49 once off
      recurring: 0.00,   // $0 recurring
    },
    maxProducts: Infinity,
    featuredDays: 365,
  },
};

export const getPlanAmount = (plan: string, billingCycle: string, isFirstPeriod: boolean) => {
  // THREADZW PRICING: $49 once off
  return 49.00;
};

export const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;




