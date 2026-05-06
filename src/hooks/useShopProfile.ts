import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useShopProfile = (shopHandle: string | undefined) => {
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShopProfile = async () => {
    if (!shopHandle) return;
    setLoading(true);
    setError(null);
    try {
      const { data: shopData, error: shopErr } = await supabase
        .from('shops')
        .select('*')
        .eq('handle', shopHandle)
        .eq('is_live', true)
        .maybeSingle();

      if (shopErr) throw shopErr;
      setShop(shopData);

      const { data: prods, error: prodsErr } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (prodsErr) throw prodsErr;
      setProducts(prods || []);
    } catch (err) {
      console.error('Error fetching shop profile:', err);
      setError('Could not load this shop');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (shopHandle) {
      fetchShopProfile();
    }
  }, [shopHandle]);

  return { shop, products, loading, error, refetch: fetchShopProfile };
};
