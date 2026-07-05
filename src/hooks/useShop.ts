import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useShop = () => {
  const { user, loading: authLoading } = useAuth();
  const [shop, setShop] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShop, setHasShop] = useState(false);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setShop(null);
      setHasShop(false);
      setLoading(false);
      return;
    }
    fetchShop();
  }, [user, authLoading]);

  const fetchShop = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();

      console.log("AUTH USER OBJECT:", authData.user);
      console.log("AUTH USER ID:", authData.user?.id);

      const { data: sessionData } = await supabase.auth.getSession();

      console.log("SESSION:", sessionData.session);
      console.log("SESSION USER ID:", sessionData.session?.user?.id);

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
      setLoading(false);
    }
  };

  const refreshShop = () => fetchShop();

  return { shop, loading, hasShop, refreshShop, authLoading };
};
