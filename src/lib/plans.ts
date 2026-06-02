// THREADZW PRICING: $5/month | 3-day trial — do not change without updating all instances
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
      recurring: 5.00,     // $5/month after
    },
    maxProducts: Infinity,
    featuredDays: 3,
  },
};

export const getPlanAmount = (plan: string, billingCycle: string, isFirstPeriod: boolean) => {
  // THREADZW PRICING: $5/month | 3-day trial — do not change without updating all instances
  return 5.00;
};

export const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;

