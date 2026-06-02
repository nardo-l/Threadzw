import { useState, useEffect } from 'react';
import { mockShop } from '../data/mockData';

export const useShops = (searchQuery = '', filters: any = {}) => {
  const [shops, setShops] = useState<any[]>([]);
  const [newShops, setNewShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const mapped = {
      id: mockShop.id,
      name: mockShop.name,
      handle: 'kure',
      categories: ['Streetwear', 'Tops', 'Bottoms'],
      description: mockShop.tagline || mockShop.about,
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
    setShops([mapped]);
    setNewShops([mapped]);
  }, [searchQuery]);

  return { shops, newShops, loading, error, refetch: async () => {} };
};
