import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useShop = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [shop, setShop] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShop, setHasShop] = useState(false);
  
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const path = location.pathname.toLowerCase();
  const isOnboarding = path === '/signup' || path === '/onboarding';

  useEffect(() => {
    console.log("[SHOP] useEffect triggered. authLoading:", authLoading, "hasUser:", !!user, "userId:", user?.id, "isOnboarding:", isOnboarding);
    if (authLoading) {
      console.log("[SHOP] authLoading is true, setting loading to true and returning.");
      setLoading(true);
      return;
    }
    if (!user) {
      console.log("[SHOP] user is null, resetting shop state and setting loading to false.");
      setShop(null);
      setHasShop(false);
      setLoading(false);
      lastFetchedUserIdRef.current = null;
      return;
    }
    console.log("[SHOP] authLoading is false and user is active. Fetching shop...");
    fetchShop(false);
  }, [user, authLoading, isOnboarding]);

  const fetchShop = async (force = false) => {
    console.log("[SHOP] loading start. force:", force);
    setLoading(true);
    let didStartFetch = false;

    try {
      if (!user) {
        console.log("[SHOP] fetchShop early return: no authenticated user or missing session.");
        return;
      }

      if (isFetchingRef.current && !force) {
        console.log("[SHOP] fetchShop early return: fetch already in progress.");
        return;
      }

      // Mark that this specific execution started the actual fetch operation
      didStartFetch = true;
      isFetchingRef.current = true;
      lastFetchedUserIdRef.current = user.id;

      // Skip automatic fetch during signup onboarding to avoid useless query returning null
      const hasCompletedOnboarding = localStorage.getItem('threadzw_onboarding_complete') === 'true';
      console.log("[SHOP] Checking onboarding skip condition. isOnboarding:", isOnboarding, "hasCompletedOnboarding:", hasCompletedOnboarding);
      if (!force && isOnboarding && !hasCompletedOnboarding) {
        console.log("[SHOP] fetchShop early return: isOnboarding and onboarding is not complete.");
        setHasShop(false);
        setShop(null);
        return;
      }

      // Skip if already fetched and not forced
      if (!force && lastFetchedUserIdRef.current === user.id && shop !== null) {
        console.log("[SHOP] fetchShop early return: already fetched for current user and shop is not null (cached shop reuse).");
        return;
      }

      console.log("[SHOP] fetch start...");
      const tShop0 = performance.now();
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      const tShop1 = performance.now();
      console.log(`[SHOP] fetch completion. Query returned in ${(tShop1 - tShop0).toFixed(2)}ms. Data:`, data, "Error:", error);

      if (error) {
        console.error("[SHOP] fetch errors:", error);
        setHasShop(false);
        setShop(null);
      } else if (!data) {
        console.log("[SHOP] fetch completion: no shop found for user.");
        setHasShop(false);
        setShop(null);
      } else {
        console.log("[SHOP] fetch completion: shop data found. Setting states.");
        setHasShop(true);
        setShop(data);
        
        // Sync local storage cache with the real database record to make sure IDs match perfectly
        try {
          if (data.id) {
            console.log("[SHOP] Syncing shop to local storage cache under key:", `shop_${user.id}`);
            localStorage.setItem(`shop_${user.id}`, JSON.stringify(data));
          }
        } catch (cacheErr) {
          console.warn('[SHOP] Error syncing fetched shop to cache:', cacheErr);
        }
      }
    } catch (err) {
      console.error('[SHOP] fetch errors:', err);
      setHasShop(false);
      setShop(null);
    } finally {
      console.log("[SHOP] loading finish");
      if (didStartFetch) {
        isFetchingRef.current = false;
      }
      setLoading(false);
    }
  };

  const refreshShop = async () => {
    console.log("[SHOP] refreshShop called.");
    await fetchShop(true);
  };

  const isLoading = loading || (!!user && lastFetchedUserIdRef.current !== user.id);
  console.log("[SHOP] Derived isLoading evaluation. loading state:", loading, "hasUser:", !!user, "lastFetchedUserIdRef:", lastFetchedUserIdRef.current, "userId:", user?.id, "Result (isLoading):", isLoading);

  return { shop, loading: isLoading, hasShop, refreshShop, authLoading, setShop, setHasShop, setLoading };
};
