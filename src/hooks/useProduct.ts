import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useProduct = (productId: string | undefined) => {
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*, shop:shops(*)')
        .eq('id', productId)
        .maybeSingle();

      if (prodErr) throw prodErr;

      if (prodData) {
        setProduct(prodData);

        const { data: relData, error: relErr } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', prodData.shop_id)
          .neq('id', productId)
          .limit(4);

        if (!relErr && relData) {
          setRelatedProducts(relData);
        }
      }
    } catch (err: any) {
      console.error('Error fetching product in useProduct hook:', err);
      setError(err.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const toggleLike = async () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setProduct((p: any) => {
      if (!p) return p;
      return { ...p, like_count: (p.like_count || 0) + (newLiked ? 1 : -1) };
    });
  };

  const toggleSave = async () => {
    const newSaved = !isSaved;
    setIsSaved(newSaved);
  };

  return { product, relatedProducts, isLiked, isSaved, loading, error, toggleLike, toggleSave, refetch: fetchProduct };
};
