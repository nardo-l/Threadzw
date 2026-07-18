import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useShops = (searchQuery = '', filters: any = {}) => {
  const [shops, setShops] = useState<any[]>([]);
  const [newShops, setNewShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryErr } = await supabase
        .from('shops')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (queryErr) throw queryErr;

      const rawShops = data || [];
      
      // Filter out demo/mock shops
      const liveShops = rawShops.filter(s => {
        const idLower = (s.id || '').toLowerCase();
        const handleLower = (s.handle || '').toLowerCase();
        const nameLower = (s.name || '').toLowerCase();
        
        return idLower !== 'demo-shop' && 
               idLower !== 'shop-001' &&
               handleLower !== 'demo' && 
               !nameLower.includes('demo');
      });

      // Search Query filter
      const filtered = liveShops.filter(shop => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (shop.name || '').toLowerCase().includes(q) ||
               (shop.description || '').toLowerCase().includes(q) ||
               (shop.location || '').toLowerCase().includes(q) ||
               (shop.handle || '').toLowerCase().includes(q) ||
               (shop.slug || '').toLowerCase().includes(q);
      });

      setShops(filtered);

      // New shops (e.g. up to 3 most recently created ones)
      setNewShops(liveShops.slice(0, 3));
    } catch (err: any) {
      console.error('[useShops] Error fetching live shops:', err);
      setError(err?.message || 'Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  return { shops, newShops, loading, error, refetch: fetchShops };
};
