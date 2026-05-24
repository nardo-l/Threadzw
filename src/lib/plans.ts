export interface PlanDetails {
  name: string;
  monthly: {
    firstMonth: number;
    recurring: number;
  };
  annual: {
    amount: number;
  };
  maxProducts: number;
  featuredDays: number;
}

export const PLANS: Record<string, PlanDetails> = {
  shop: {
    name: 'Thread ZW Shop',
    monthly: {
      firstMonth: 0.00,    // Trial
      recurring: 9.00,     // $9/month after
    },
    annual: {
      amount: 27.00,       // $9/month x 3 months
    },
    maxProducts: Infinity,
    featuredDays: 5,
  },
};

export const getPlanAmount = (plan: string, billingCycle: string, isFirstPeriod: boolean) => {
  const p = PLANS[plan] || PLANS.shop;
  if (!p) return 0;
  if (billingCycle === 'annual') return p.annual?.amount || 18.00;
  return isFirstPeriod ? p.monthly.firstMonth : p.monthly.recurring;
};

export const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;
