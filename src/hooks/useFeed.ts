import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useFeed = (activeCategory = 'all') => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [featuredProduct, setFeaturedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      // Try fetching with shop join first
      let { data, error } = await supabase
        .from('products')
        .select('*, shop:shops(id,name,handle,logo_url,is_live)')
        .eq('is_published', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      // Fallback: If shop join fails, fetch products alone
      if (error) {
        console.warn('Products fetch with shop join failed, trying without join:', error.message);
        const fallback = await supabase
          .from('products')
          .select('*')
          .eq('is_published', true)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (fallback.error) throw fallback.error;
        data = fallback.data;
      }
      
      console.log('Products fetch result:', data?.length || 0, 'items');
      setProducts(data || []);
    } catch (err) {
      console.error('fetchProducts caught:', err);
      throw err;
    }
  };

  const fetchStories = async () => {
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24);
      
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,images,is_published,created_at,shop:shops(id,name,handle,logo_url,is_live)')
        .gte('created_at', cutoff.toISOString())
        .eq('is_published', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('fetchStories error:', error.message);
        setStories([]);
        return;
      }

      const shopMap: Record<string, any> = {};
      data?.forEach(p => {
        const shop = Array.isArray(p.shop) ? p.shop[0] : p.shop;
        if (!shop?.id || !shop?.is_live) return;
        if (!shopMap[shop.id]) {
          shopMap[shop.id] = { shop, products: [] };
        }
        shopMap[shop.id].products.push(p);
      });
      setStories(Object.values(shopMap));
    } catch (err) {
      console.error('fetchStories caught:', err);
      setStories([]);
    }
  };

  const fetchFeaturedProduct = async () => {
    // Since is_featured is not in the schema, we'll pick the latest published product or omit
    const { data } = await supabase
      .from('products')
      .select('*, shop:shops(id,name,handle,logo_url,is_live)')
      .eq('is_published', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setFeaturedProduct(data);
  };

  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);
    
    const timeoutId = setTimeout(() => {
      if (loadingRef.current) {
        setLoading(false);
        setError('Request timed out. Please try again.');
      }
    }, 12000);

    try {
      await Promise.all([fetchProducts(), fetchStories(), fetchFeaturedProduct()]);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load feed');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [activeCategory]);

  return { products, stories, featuredProduct, loading, error, refetch: fetchFeed };
};
