import { supabase } from './supabase';

export interface Shop {
  id: string;
  name: string;
  handle: string;
  slug?: string;
  whatsapp_number: string;
  whatsapp?: string;
  is_live: boolean;
  subscription_status: string;
  trial_ends_at?: string;
  description?: string;
  categories?: string[];
  location?: string;
  instagram?: string;
  banner_url?: string;
  logo_url?: string;
  manual_lock?: boolean;
  manual_lock_reason?: string | null;
  payment_overdue_flagged?: boolean;
  [key: string]: any;
}

export const demoShopRecord: Shop = {
  id: 'demo-shop',
  owner_id: 'demo-owner',
  name: 'Kure Streetwear',
  handle: 'demo',
  slug: 'demo',
  whatsapp: '263776223144',
  whatsapp_number: '263776223144',
  is_live: true,
  subscription_status: 'active',
  trial_ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10).toISOString(), // 10 years in future
  description: 'Zim clothing store - built for the ones chasing more.',
  categories: ['Clothing', 'Streetwear'],
  location: 'Harare',
  instagram: 'kure.zw',
  logo_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80',
  banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  manual_lock: false,
  payment_overdue_flagged: false,
  created_at: new Date().toISOString()
};

export async function getShops(): Promise<Shop[]> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*');
    
    let list = data || [];
    
    const hasDemo = list.some((s: any) => s.id === 'demo-shop' || s.handle === 'demo' || s.slug === 'demo');
    if (!hasDemo) {
      list = [...list, demoShopRecord];
    } else {
      list = list.map((s: any) => {
        if (s.id === 'demo-shop' || s.handle === 'demo' || s.slug === 'demo') {
          return {
            ...s,
            id: 'demo-shop',
            handle: 'demo',
            name: 'Kure Streetwear',
            whatsapp: '263776223144',
            whatsapp_number: '263776223144',
            subscription_status: 'active'
          };
        }
        return s;
      });
    }
    return list;
  } catch (err) {
    console.error('getShops fetch failed, falling back to local fallback:', err);
    return [demoShopRecord];
  }
}
