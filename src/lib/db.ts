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

export async function getShops(): Promise<Shop[]> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getShops fetch failed:', err);
    return [];
  }
}
