import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useProduct = (productId: string | undefined) => {
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, shop:shops(*)')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      setProduct(data);

      // Increment view count
      await supabase.rpc('increment_view_count', { product_id: productId });
      // Note: If RPC doesn't exist, we can use update, but RPC is safer for atomic increments.
      // The PDF says: await supabase.from('products').update({ view_count: (data.view_count || 0) + 1 }).eq('id', productId)
      // I'll follow the PDF logic for simplicity if RPC is not guaranteed.
      // Actually, let's stick to the PDF exactly.
      await supabase.from('products').update({ view_count: (data.view_count || 0) + 1 }).eq('id', productId);

      // Check liked / saved
      if (user) {
        const [likeR, saveR] = await Promise.all([
          supabase.from('likes').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle(),
          supabase.from('saves').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle()
        ]);
        setIsLiked(!!likeR.data);
        setIsSaved(!!saveR.data);
      }

      const { data: related } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', data.shop_id)
        .eq('status', 'active')
        .neq('id', productId)
        .limit(4);
      
      setRelatedProducts(related || []);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Could not load this product');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const toggleLike = async () => {
    if (!user || !product || !productId) return;
    
    const newLiked = !isLiked;
    setIsLiked(newLiked); // optimistic
    setProduct((p: any) => ({ ...p, like_count: (p.like_count || 0) + (newLiked ? 1 : -1) }));

    const { error } = newLiked
      ? await supabase.from('likes').insert({ user_id: user.id, product_id: productId })
      : await supabase.from('likes').delete().eq('user_id', user.id).eq('product_id', productId);

    if (error) {
      // rollback
      setIsLiked(!newLiked);
      setProduct((p: any) => ({ ...p, like_count: (p.like_count || 0) + (newLiked ? -1 : 1) }));
    }
  };

  const toggleSave = async () => {
    if (!user || !productId) return;
    
    const newSaved = !isSaved;
    setIsSaved(newSaved); // optimistic

    const { error } = newSaved
      ? await supabase.from('saves').insert({ user_id: user.id, product_id: productId })
      : await supabase.from('saves').delete().eq('user_id', user.id).eq('product_id', productId);

    if (error) {
      // rollback
      setIsSaved(!newSaved);
    }
  };

  return { product, relatedProducts, isLiked, isSaved, loading, error, toggleLike, toggleSave, refetch: fetchProduct };
};
