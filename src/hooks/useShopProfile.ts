import { useState, useEffect } from 'react';
import { mockShop, mockProducts } from '../data/mockData';

export const useShopProfile = (shopHandle: string | undefined) => {
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const fetchShopProfile = () => {
    const mappedShop = {
      id: mockShop.id,
      name: mockShop.name,
      handle: shopHandle || 'kure',
      categories: ['Streetwear', 'Tops', 'Bottoms'],
      description: mockShop.tagline || mockShop.about,
      about: mockShop.about,
      location: mockShop.location,
      whatsapp: mockShop.whatsapp_number,
      whatsapp_number: mockShop.whatsapp_number,
      instagram: mockShop.instagram,
      is_online_only: false,
      logo_url: mockShop.logo_url,
      banner_url: mockShop.banner_url,
      is_verified: true,
      is_live: true,
      subscription_status: mockShop.subscription_status,
      trial_ends_at: mockShop.trial_end,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setShop(mappedShop);

    const mappedProducts = mockProducts.map(p => {
      const sizesArray = Object.entries(p.stock || {}).map(([size, quantity]) => ({
        size,
        quantity: quantity as number
      }));
      return {
        ...p,
        sizes: sizesArray,
        shop_id: mockShop.id,
        is_published: p.visible,
        total_stock: sizesArray.reduce((sum, item) => sum + item.quantity, 0)
      };
    });
    setProducts(mappedProducts);
  };

  useEffect(() => {
    fetchShopProfile();
  }, [shopHandle]);

  return { shop, products, loading, error, refetch: fetchShopProfile };
};
