import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export interface SearchFilters {
  category?: string[];
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  area?: string;
  inStockOnly?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}

export const useSearch = (query: string, filters: SearchFilters = {}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async () => {
    if (!query && Object.keys(filters).length === 0) {
      setProducts([]);
      setShops([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let pQuery = supabase.from('products').select('*, shop:shops(*)');
      
      if (query) {
        pQuery = pQuery.ilike('name', `%${query}%`);
      }

      if (filters.category && filters.category.length > 0) {
        pQuery = pQuery.in('category', filters.category);
      }

      if (filters.minPrice !== undefined) {
        pQuery = pQuery.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        pQuery = pQuery.lte('price', filters.maxPrice);
      }

      const pRes = await pQuery;

      let sQuery = supabase.from('shops').select('*');
      if (query) {
        sQuery = sQuery.ilike('name', `%${query}%`);
      }
      const sRes = await sQuery;

      if (pRes.error) throw pRes.error;
      if (sRes.error) throw sRes.error;

      setProducts(pRes.data || []);
      setShops(sRes.data || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Error searching database');
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [performSearch]);

  const results = useMemo(() => ({
    products,
    shops
  }), [products, shops]);

  return {
    results,
    loading,
    error,
    refetch: performSearch,
  };
};
