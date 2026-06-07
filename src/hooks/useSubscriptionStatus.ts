import { useSubscription } from '../context/SubscriptionContext';

export const useSubscriptionStatus = () => {
  const { subscription, daysRemaining, currentPlan, isAtProductLimit } = useSubscription();

  const isActive = subscription?.status === 'active';
  const isCancelled = false;
  const isExpired = subscription?.status === 'expired';
  const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;
  const isFullPlan = currentPlan === 'shop';
  const isMonthly = true; // Default to monthly now
  const isAnnual = false;
  const renewalDate = subscription?.expiryDate
    ? new Date(subscription.expiryDate).toLocaleDateString('en-ZW', {
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
