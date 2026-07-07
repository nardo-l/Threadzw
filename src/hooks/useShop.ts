import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useShop = () => {
  const { user, loading: authLoading } = useAuth();
  const [shop, setShop] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShop, setHasShop] = useState(false);
  
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setShop(null);
      setHasShop(false);
      setLoading(false);
      lastFetchedUserIdRef.current = null;
      return;
    }
    fetchShop(false);
  }, [user, authLoading]);

  const fetchShop = async (force = false) => {
    if (!user) return;

    // Skip if already fetched/fetching and not forced
    if (!force && lastFetchedUserIdRef.current === user.id && shop !== null) {
      return;
    }

    // Skip automatic fetch during signup onboarding to avoid useless query returning null
    const path = window.location.pathname.toLowerCase();
    const isOnboarding = path === '/signup' || path === '/onboarding';
    const hasCompletedOnboarding = localStorage.getItem('threadzw_onboarding_complete') === 'true';
    if (!force && isOnboarding && !hasCompletedOnboarding) {
      setHasShop(false);
      setShop(null);
      setLoading(false);
      return;
    }

    if (isFetchingRef.current && !force) {
      return;
    }

    setLoading(true);
    isFetchingRef.current = true;
    lastFetchedUserIdRef.current = user.id;

    try {
      console.log("HOOK USER ID:", user.id);
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      console.log("Returned shop:", data);
      console.log("Returned error:", error);

      if (error || !data) {
        setHasShop(false);
        setShop(null);
      } else {
        setHasShop(true);
        setShop(data);
        
        // Sync local storage cache with the real database record to make sure IDs match perfectly
        try {
          if (data.id) {
            localStorage.setItem(`shop_${user.id}`, JSON.stringify(data));
          }
        } catch (cacheErr) {
          console.warn('Error syncing fetched shop to cache:', cacheErr);
        }
      }
    } catch (err) {
      console.error('Error fetching shop:', err);
      setHasShop(false);
      setShop(null);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const refreshShop = async () => {
    await fetchShop(true);
  };

  const isLoading = loading || (!!user && lastFetchedUserIdRef.current !== user.id);

  return { shop, loading: isLoading, hasShop, refreshShop, authLoading, setShop, setHasShop, setLoading };
};
