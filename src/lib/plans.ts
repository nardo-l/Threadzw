// THREADZW PRICING: $2.99/month | 14-day trial — do not change without updating all instances
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
  // THREADZW PRICING: $2.99/month | 14-day trial — do not change without updating all instances
  return 2.99;
};

export const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;


