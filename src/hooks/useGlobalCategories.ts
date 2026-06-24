import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface GlobalCategory {
  id: string;
  name: string;
  cover_image_url: string | null;
  visible: boolean;
  sort_order: number;
}

const FALLBACK_CATEGORIES: GlobalCategory[] = [
  { id: 'cat-1', name: 'Streetwear', cover_image_url: 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=400&q=80', visible: true, sort_order: 1 },
  { id: 'cat-2', name: 'Thrift', cover_image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80', visible: true, sort_order: 2 },
  { id: 'cat-3', name: 'Luxury', cover_image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80', visible: true, sort_order: 3 },
  { id: 'cat-4', name: 'Sportswear', cover_image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80', visible: true, sort_order: 4 },
  { id: 'cat-5', name: 'Vintage', cover_image_url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80', visible: true, sort_order: 5 },
  { id: 'cat-6', name: 'Accessories', cover_image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80', visible: true, sort_order: 6 }
];

export const useGlobalCategories = () => {
  const [categories, setCategories] = useState<GlobalCategory[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('global_categories')
        .select('*')
        .eq('visible', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories(FALLBACK_CATEGORIES);
      }
    } catch (err) {
      console.error('Error fetching global categories, using fallbacks:', err);
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, refreshCategories: fetchCategories };
};
