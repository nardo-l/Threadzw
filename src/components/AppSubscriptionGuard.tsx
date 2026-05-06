import React, { useEffect } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { Paywall } from '../screens/Paywall';

export const AppSubscriptionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { fetchShopAndSubscription, showRenewalPaywall, paywallType } = useSubscription();

  useEffect(() => {
    if (user) {
      // Check subscription status every time app comes to foreground or user changes
      fetchShopAndSubscription();
    }
  }, [user]);

  useEffect(() => {
    // Also check when window regains focus
    const handleFocus = () => {
      if (user) fetchShopAndSubscription();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  return (
    <>
      {children}
      {showRenewalPaywall && paywallType === 'expired' && <Paywall />}
    </>
  );
};
