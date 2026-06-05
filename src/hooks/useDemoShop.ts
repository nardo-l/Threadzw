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

        // Retrieve screenshots uploaded directly to the 'shop-images' storage bucket
        let bucketShots: DemoScreenshot[] = [];
        try {
          const { data: files, error: storageError } = await supabase.storage
            .from('shop-images')
            .list('', { sortBy: { column: 'name', order: 'asc' } });
          
          if (!storageError && files && files.length > 0) {
            // Remove utility / hidden files
            const filteredFiles = files.filter(file => file.name && !file.name.startsWith('.'));
            bucketShots = filteredFiles.map((file, idx) => {
              const { data: { publicUrl } } = supabase.storage
                .from('shop-images')
                .getPublicUrl(file.name);
              
              return {
                id: file.id || `bucket-${file.name}-${idx}`,
                image_url: publicUrl,
                caption: file.name.split('.')[0] || 'Screenshot',
                sort_order: idx
              };
            });
          }
        } catch (bucketErr) {
          console.warn('Error reading from shop-images bucket in useDemoShop:', bucketErr);
        }

        // Combine database table shots and storage bucket shots
        const combinedShots: DemoScreenshot[] = [];
        const seenUrls = new Set<string>();

        if (shots && shots.length > 0) {
          shots.forEach((s: any) => {
            if (s.image_url) {
              combinedShots.push(s);
              seenUrls.add(s.image_url);
            }
          });
        }

        bucketShots.forEach((bs) => {
          if (!seenUrls.has(bs.image_url)) {
            combinedShots.push(bs);
            seenUrls.add(bs.image_url);
          }
        });

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
        setScreenshots(combinedShots);
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
