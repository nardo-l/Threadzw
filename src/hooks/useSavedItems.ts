import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useSavedItems = () => {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedItems = useCallback(async () => {
    if (!user) {
      setSavedItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('saves')
        .select('*, product:products(*)')
        .eq('user_id', user.id);

      if (err) throw err;
      setSavedItems(data?.map(item => item.product).filter(Boolean) || []);
    } catch (err: any) {
      console.error('Error fetching saved items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedItems();
  }, [fetchSavedItems]);

  return { savedItems, loading, error, refetch: fetchSavedItems };
};
