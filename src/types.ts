export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  handle: string;
  category: string;
  description: string;
  town: string;
  location?: string;
  whatsapp: string;
  instagram: string;
  avatar_url?: string;
  logo_url?: string;
  banner_url: string;
  plan: 'trial' | 'active' | 'expired';
  trial_started_at: string;
  trial_ends_at: string;
  subscription_status: 'trial' | 'pending_payment' | 'active' | 'expired';
  access_code: string;
  code_expires_at: string;
  monthly_price: number;
  is_live: boolean;
  product_count: number;
  total_sales: number;
  view_count: number;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  sizes: { size: string; quantity: number }[];
  category: string;
  is_published: boolean;
  view_count: number;
  save_count: number;
  total_stock: number;
  created_at: string;
}

export interface Order {
  id: string;
  shop_id: string;
  product_id: string;
  size: string;
  quantity: number;
  sale_price: number;
  channel: 'in_store' | 'whatsapp' | 'instagram';
  created_at: string;
}

export interface Payment {
  id: string;
  shop_id: string;
  owner_id: string;
  whatsapp_number: string;
  amount: number;
  status: 'pending' | 'verified' | 'code_sent' | 'activated' | 'rejected';
  access_code: string;
  code_expires_at: string;
  submitted_at: string;
  activated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string;
  town: string;
  whatsapp_number: string;
  onboarding_complete: boolean;
  created_at: string;
}
