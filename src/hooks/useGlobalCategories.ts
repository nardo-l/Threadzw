import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface GlobalCategory {
  id: string;
  name: string;
  cover_image_url: string | null;
  visible: boolean;
  sort_order: number;
}

export const useGlobalCategories = () => {
  const [categories, setCategories] = useState<GlobalCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('global_categories')
        .select('*')
        .eq('visible', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching global categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, refreshCategories: fetchCategories };
};
