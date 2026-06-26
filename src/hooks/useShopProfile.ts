import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useShopProfile = (shopHandle: string | undefined) => {
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShopProfile = async () => {
    if (!shopHandle) return;
    setLoading(true);
    try {
      // Find shop by slug/handle or ID
      const { data: shopData, error: shopErr } = await supabase
        .from('shops')
        .select('*')
        .or(`handle.eq.${shopHandle},slug.eq.${shopHandle},id.eq.${shopHandle}`)
        .maybeSingle();

      if (shopErr) throw shopErr;

      if (shopData) {
        setShop(shopData);

        // Fetch products for this shop
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopData.id);

        if (!prodErr && prodData) {
          const mapped = prodData.map(p => {
            const sizesArray = Array.isArray(p.sizes) ? p.sizes.map((s: any) => {
              if (typeof s === 'string') return { size: s, quantity: 1 };
              return { size: s?.size || s?.size_label || s, quantity: s?.quantity || 1 };
            }) : [];
            return {
              ...p,
              sizes: sizesArray,
              is_published: p.is_published ?? true,
              total_stock: sizesArray.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
            };
          });
          setProducts(mapped);
        }
      }
    } catch (err: any) {
      console.error('Error fetching shop profile in useShopProfile hook:', err);
      setError(err.message || 'Failed to load shop profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopProfile();
  }, [shopHandle]);

  return { shop, products, loading, error, refetch: fetchShopProfile };
};
