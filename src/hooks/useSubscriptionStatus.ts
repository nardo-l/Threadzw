import { useSubscription } from '../context/SubscriptionContext';

export const useSubscriptionStatus = () => {
  const { subscription, daysRemaining, currentPlan, isAtProductLimit } = useSubscription();

  const isActive = subscription?.status === 'active';
  const isCancelled = subscription?.status === 'cancelled';
  const isExpired = subscription?.status === 'expired';
  const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;
  const isFullPlan = currentPlan === 'shop';
  const isMonthly = subscription?.billing_cycle === 'monthly' || true; // Default to monthly now
  const isAnnual = subscription?.billing_cycle === 'annual';
  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-ZW', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : null;

  return {
    isActive,
    isCancelled,
    isExpired,
    isExpiringSoon,
    isFullPlan,
    isMonthly,
    isAnnual,
    daysRemaining,
    renewalDate,
    isAtProductLimit,
    currentPlan,
  };
};
