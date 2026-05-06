import React, { useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';

export const SessionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, setSessionExpired } = useInventory();

  useEffect(() => {
    // In a real app, this would check the Supabase session
    // For this mock, we'll simulate a check on window focus
    const checkSession = () => {
      if (isAuthenticated) {
        // Simulate a 5% chance of session expiry on focus for demo purposes
        // In reality, you'd check if (supabase.auth.getSession() === null)
        const isStillValid = Math.random() > 0.05;
        if (!isStillValid) {
          // setSessionExpired(true); // Commented out to avoid random annoyance during testing
        }
      }
    };

    window.addEventListener('focus', checkSession);
    return () => window.removeEventListener('focus', checkSession);
  }, [isAuthenticated, setSessionExpired]);

  return <>{children}</>;
};
