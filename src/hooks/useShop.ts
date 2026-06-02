import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useShop = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShop, setHasShop] = useState(false);

  useEffect(() => {
    if (!user) {
      setShop(null);
      setHasShop(false);
      setLoading(false);
      return;
    }
    fetchShop();
  }, [user]);

  const fetchShop = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error || !data) {
        setHasShop(false);
        setShop(null);
      } else {
        setHasShop(true);
        setShop(data);
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

  return { shop, loading, hasShop, refreshShop };
};
