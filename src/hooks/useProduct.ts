import { useState, useEffect } from 'react';
import { mockProducts, mockShop } from '../data/mockData';

export const useProduct = (productId: string | undefined) => {
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const fetchProduct = () => {
    if (!productId) return;
    const found = mockProducts.find(p => p.id === productId);
    if (found) {
      const sizesArray = Object.entries(found.stock || {}).map(([size, quantity]) => ({
        size,
        quantity: quantity as number
      }));
      const mappedShop = {
        id: mockShop.id,
        name: mockShop.name,
        handle: 'kure',
        avatar_url: mockShop.logo_url,
        logo_url: mockShop.logo_url,
        whatsapp_number: mockShop.whatsapp_number,
        location: mockShop.location
      };
      
      const mapped = {
        ...found,
        sizes: sizesArray,
        shop: mappedShop,
        shop_id: mockShop.id,
        like_count: 54,
        save_count: 28,
        view_count: 140
      };
      setProduct(mapped);

      const related = mockProducts
        .filter(p => p.id !== productId)
        .slice(0, 4)
        .map(p => {
          const sz = Object.entries(p.stock || {}).map(([size, quantity]) => ({
            size,
            quantity: quantity as number
          }));
          return {
            ...p,
            sizes: sz,
            shop_id: mockShop.id
          };
        });
      setRelatedProducts(related);
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
      return { ...p, like_count: p.like_count + (newLiked ? 1 : -1) };
    });
  };

  const toggleSave = async () => {
    const newSaved = !isSaved;
    setIsSaved(newSaved);
  };

  return { product, relatedProducts, isLiked, isSaved, loading, error, toggleLike, toggleSave, refetch: fetchProduct };
};
