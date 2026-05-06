import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useShops = (searchQuery = '', filters: any = {}) => {
  const [shops, setShops] = useState<any[]>([]);
  const [newShops, setNewShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShops = async () => {
    setLoading(true);
    setError(null);
    
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Request timed out');
      }
    }, 12000);

    try {
      let query = supabase
        .from('shops')
        .select('*')
        .eq('is_live', true)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,handle.ilike.%${searchQuery}%`);
      }

      if (filters.category) {
        query = query.contains('categories', [filters.category]);
      }

      if (filters.area) {
        query = query.eq('location', filters.area);
      }

      const { data, error } = await query;
      if (error) throw error;

      setShops(data || []);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      setNewShops((data || []).filter(s => new Date(s.created_at) >= weekAgo));
    } catch (err) {
      console.error('Error fetching shops:', err);
      setError('Failed to load shops');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [searchQuery, JSON.stringify(filters)]);

  return { shops, newShops, loading, error, refetch: fetchShops };
};
