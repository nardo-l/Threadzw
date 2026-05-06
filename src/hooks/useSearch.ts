import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useInventory } from '../context/InventoryContext';

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
  const { toggleLike, toggleSave, likedProductIds, savedProductIds } = useInventory();
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
      let productQuery = supabase
        .from('products')
        .select('*, shop:shops(*)')
        .eq('status', 'active');

      if (query) {
        productQuery = productQuery.ilike('name', `%${query}%`);
      }

      if (filters.category && filters.category.length > 0) {
        productQuery = productQuery.in('category', filters.category);
      }
      if (filters.condition && filters.condition.length > 0) {
        productQuery = productQuery.in('condition', filters.condition);
      }
      if (filters.minPrice) productQuery = productQuery.gte('price', filters.minPrice);
      if (filters.maxPrice) productQuery = productQuery.lte('price', filters.maxPrice);
      if (filters.inStockOnly) productQuery = productQuery.gt('total_stock', 0);

      switch (filters.sortBy) {
        case 'price_asc': productQuery = productQuery.order('price', { ascending: true }); break;
        case 'price_desc': productQuery = productQuery.order('price', { ascending: false }); break;
        case 'popular': productQuery = productQuery.order('like_count', { ascending: false }); break;
        default: productQuery = productQuery.order('created_at', { ascending: false });
      }

      const shopQuery = supabase
        .from('shops')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

      const [pRes, sRes] = await Promise.all([productQuery, shopQuery]);

      if (pRes.error) throw pRes.error;
      if (sRes.error) throw sRes.error;

      setProducts(pRes.data || []);
      setShops(sRes.data || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query, JSON.stringify(filters)]);

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
    toggleLike,
    toggleSave,
    likedProductIds,
    savedProductIds
  };
};
