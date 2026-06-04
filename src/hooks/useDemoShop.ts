import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DemoShop {
  id?: string;
  name: string;
  handle: string;
  banner_url?: string;
  logo_url?: string;
  description?: string;
  location?: string;
  instagram?: string;
  whatsapp?: string;
  categories?: string[];
  [key: string]: any;
}

export interface DemoProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image_url: string;
  in_stock: boolean;
  sort_order: number;
  categories?: string[];
  description?: string;
  [key: string]: any;
}

export interface DemoScreenshot {
  id: string;
  image_url: string;
  caption?: string;
  sort_order: number;
  [key: string]: any;
}

export const useDemoShop = () => {
  const [demoShop, setDemoShop] = useState<DemoShop | null>(null);
  const [demoProducts, setDemoProducts] = useState<DemoProduct[]>([]);
  const [screenshots, setScreenshots] = useState<DemoScreenshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemo = async () => {
      try {
        // Fetch demo shop info
        const { data: shop } = await supabase
          .from('demo_shop')
          .select('*')
          .maybeSingle();

        // Fetch demo products
        const { data: products } = await supabase
          .from('demo_products')
          .select('*')
          .eq('in_stock', true)
          .order('sort_order', { ascending: true });

        // Fetch screenshots
        const { data: shots } = await supabase
          .from('demo_screenshots')
          .select('*')
          .order('sort_order', { ascending: true });

        if (shop) {
          setDemoShop({
            ...shop,
            id: 'demo-shop',
            name: 'Kure Streetwear',
            handle: 'demo',
            whatsapp: '263776223144',
            description: 'Zim clothing store - built for the ones chasing more.'
          });
        } else {
          setDemoShop({
            id: 'demo-shop',
            name: 'Kure Streetwear',
            handle: 'demo',
            description: 'Zim clothing store - built for the ones chasing more.',
            location: 'Harare',
            whatsapp: '263776223144'
          });
        }
        setDemoProducts(products || []);
        setScreenshots(shots || []);
      } catch (err) {
        console.error('Demo shop fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDemo();
  }, []);

  return { 
    demoShop, 
    demoProducts, 
    screenshots, 
    loading 
  };
};
