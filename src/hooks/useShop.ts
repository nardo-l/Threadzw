import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { withTimeout } from '../lib/withTimeout';

const SHOP_REQUEST_TIMEOUT_MS = 15000;

export const useShop = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [shop, setShop] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShop, setHasShop] = useState(false);
  
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const hasFetchedRef = useRef(false);
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
      hasFetchedRef.current = false;
      return;
    }
    console.log("[SHOP] authLoading is false and user is active. Fetching shop...");
    fetchShop(false);
  }, [user, authLoading, isOnboarding]);

  const readCachedShop = () => {
    if (!user?.id) return null;
    try {
      const raw = localStorage.getItem(`shop_${user.id}`);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (!cached?.id || cached.owner_id && cached.owner_id !== user.id) return null;
      return {
        ...cached,
        page_type: cached.page_type || 'clothing',
        template_id: cached.template_id || null,
        page_config: cached.page_config || {},
      };
    } catch (cacheErr) {
      console.warn('[SHOP] Could not read cached shop:', cacheErr);
      return null;
    }
  };

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

      // Skip if already fetched and not forced
      if (!force && hasFetchedRef.current && lastFetchedUserIdRef.current === user.id) {
        console.log("[SHOP] fetchShop early return: already fetched for current user.");
        return;
      }

      didStartFetch = true;
      isFetchingRef.current = true;
      lastFetchedUserIdRef.current = user.id;

      console.log("[SHOP] fetch start...");
      const tShop0 = performance.now();
      const { data, error } = await withTimeout(
        supabase
          .from('shops')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        SHOP_REQUEST_TIMEOUT_MS,
        'SHOP_LOAD'
      );
      const tShop1 = performance.now();
      console.log(`[SHOP] fetch completion. Query returned in ${(tShop1 - tShop0).toFixed(2)}ms. Data:`, data, "Error:", error);

      if (error) {
        console.error("[SHOP] fetch errors:", error);

        // A failed/blocked/timeout query is not proof that the user has no shop.
        // Prefer the last known-good shop so a dashboard refresh cannot send an
        // existing merchant back to the beginning of onboarding.
        const cachedShop = readCachedShop();
        if (cachedShop) {
          console.warn('[SHOP] Using cached shop after database load failure.');
          setShop(cachedShop);
          setHasShop(true);
        } else {
          // Keep the previous shop state if one exists. Only mark no-shop when we
          // have positively confirmed an empty database result below.
          console.warn('[SHOP] No cached shop available after database load failure; preserving current shop state.');
        }
      } else if (!data) {
        // A null result can happen during auth/RLS propagation. If this browser
        // already has a known shop, preserve it rather than restarting onboarding.
        const cachedShop = readCachedShop();
        if (cachedShop) {
          console.warn('[SHOP] Database returned no shop; using existing cached shop.');
          setShop(cachedShop);
          setHasShop(true);
        } else {
          console.log("[SHOP] fetch completion: no shop found for user.");
          setHasShop(false);
          setShop(null);
        }
      } else {
        console.log("[SHOP] fetch completion: shop data found. Setting states.");
        const normalizedShop = {
          ...data,
          page_type: data.page_type || 'clothing',
          template_id: data.template_id || null,
          page_config: data.page_config || {},
        };
        setHasShop(true);
        setShop(normalizedShop);
        
        // Sync local storage cache with the real database record to make sure IDs match perfectly
        try {
          if (data.id) {
            console.log("[SHOP] Syncing shop to local storage cache under key:", `shop_${user.id}`);
            localStorage.setItem(`shop_${user.id}`, JSON.stringify(normalizedShop));
          }
        } catch (cacheErr) {
          console.warn('[SHOP] Error syncing fetched shop to cache:', cacheErr);
        }
      }
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('[SHOP] fetch errors:', err);
      const cachedShop = readCachedShop();
      if (cachedShop) {
        setShop(cachedShop);
        setHasShop(true);
      }
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
    hasFetchedRef.current = false;
    await fetchShop(true);
  };

  const isLoading = loading || (!!user && lastFetchedUserIdRef.current !== user.id);
  console.log("[SHOP] Derived isLoading evaluation. loading state:", loading, "hasUser:", !!user, "lastFetchedUserIdRef:", lastFetchedUserIdRef.current, "userId:", user?.id, "Result (isLoading):", isLoading);

  return { shop, loading: isLoading, hasShop, refreshShop, authLoading, setShop, setHasShop, setLoading };
};
