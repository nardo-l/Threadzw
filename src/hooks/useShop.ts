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
    console.log("[FORENSIC-SHOP-HOOK] useEffect triggered. authLoading:", authLoading, "hasUser:", !!user, "userId:", user?.id, "isOnboarding:", isOnboarding);
    if (authLoading) {
      console.log("[FORENSIC-SHOP-HOOK] authLoading is true, setting loading to true and returning.");
      setLoading(true);
      return;
    }
    if (!user) {
      console.log("[FORENSIC-SHOP-HOOK] user is null, resetting shop state and setting loading to false.");
      setShop(null);
      setHasShop(false);
      setLoading(false);
      lastFetchedUserIdRef.current = null;
      return;
    }
    console.log("[FORENSIC-SHOP-HOOK] authLoading is false and user is active. Fetching shop...");
    fetchShop(false);
  }, [user, authLoading, isOnboarding]);

  const fetchShop = async (force = false) => {
    if (!user) {
      console.log("[FORENSIC-SHOP-HOOK] fetchShop called but user is null. Returning.");
      return;
    }

    console.log(`[FORENSIC-SHOP-HOOK] fetchShop initiated. Force: ${force}, lastFetchedUserId: "${lastFetchedUserIdRef.current}", currentUserId: "${user.id}", shopExist: ${!!shop}`);

    // Skip if already fetched/fetching and not forced
    if (!force && lastFetchedUserIdRef.current === user.id && shop !== null) {
      console.log("[FORENSIC-SHOP-HOOK] fetchShop SKIP: already fetched for this user and shop is not null.");
      return;
    }

    // Skip automatic fetch during signup onboarding to avoid useless query returning null
    const hasCompletedOnboarding = localStorage.getItem('threadzw_onboarding_complete') === 'true';
    console.log("[FORENSIC-SHOP-HOOK] Checking onboarding skip condition. isOnboarding:", isOnboarding, "hasCompletedOnboarding:", hasCompletedOnboarding);
    if (!force && isOnboarding && !hasCompletedOnboarding) {
      console.log("[FORENSIC-SHOP-HOOK] fetchShop SKIP: isOnboarding and onboarding is not complete.");
      setHasShop(false);
      setShop(null);
      setLoading(false);
      lastFetchedUserIdRef.current = user.id;
      return;
    }

    if (isFetchingRef.current && !force) {
      console.log("[FORENSIC-SHOP-HOOK] fetchShop SKIP: already in-flight fetching and force is false.");
      return;
    }

    console.log("[FORENSIC-SHOP-HOOK] Setting loading to true and isFetchingRef to true.");
    setLoading(true);
    isFetchingRef.current = true;
    lastFetchedUserIdRef.current = user.id;

    try {
      console.log("[FORENSIC-SHOP-HOOK] Running shops query for owner_id:", user.id);
      const tShop0 = performance.now();
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      const tShop1 = performance.now();
      console.log(`[FORENSIC-SHOP-HOOK] Query returned in ${(tShop1 - tShop0).toFixed(2)}ms. Data:`, data, "Error:", error);

      if (error) {
        console.error("[FORENSIC-SHOP-HOOK] Query returned error:", error);
        setHasShop(false);
        setShop(null);
      } else if (!data) {
        console.log("[FORENSIC-SHOP-HOOK] Query returned null (no shop found for this user).");
        setHasShop(false);
        setShop(null);
      } else {
        console.log("[FORENSIC-SHOP-HOOK] Query returned shop data. Setting states.");
        setHasShop(true);
        setShop(data);
        
        // Sync local storage cache with the real database record to make sure IDs match perfectly
        try {
          if (data.id) {
            console.log("[FORENSIC-SHOP-HOOK] Syncing shop to local storage cache under key:", `shop_${user.id}`);
            localStorage.setItem(`shop_${user.id}`, JSON.stringify(data));
          }
        } catch (cacheErr) {
          console.warn('[FORENSIC-SHOP-HOOK] Error syncing fetched shop to cache:', cacheErr);
        }
      }
    } catch (err) {
      console.error('[FORENSIC-SHOP-HOOK] Exception caught during fetchShop:', err);
      setHasShop(false);
      setShop(null);
    } finally {
      console.log("[FORENSIC-SHOP-HOOK] fetchShop finally block. Setting isFetchingRef to false and loading to false.");
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const refreshShop = async () => {
    console.log("[FORENSIC-SHOP-HOOK] refreshShop called.");
    await fetchShop(true);
  };

  const isLoading = loading || (!!user && lastFetchedUserIdRef.current !== user.id);
  console.log("[FORENSIC-SHOP-HOOK] Derived isLoading evaluation. loading state:", loading, "hasUser:", !!user, "lastFetchedUserIdRef:", lastFetchedUserIdRef.current, "userId:", user?.id, "Result (isLoading):", isLoading);

  return { shop, loading: isLoading, hasShop, refreshShop, authLoading, setShop, setHasShop, setLoading };
};
