export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug?: string;
  category: string;
  description: string;
  location?: string | null;
  whatsapp_number?: string;
  instagram: string;
  avatar_url?: string;
  logo_url?: string;
  banner_url: string;
  plan: 'trial' | 'active' | 'expired';
  trial_started_at: string;
  trial_ends_at: string;
  trial_start?: string | null;
  trial_end?: string | null;
  subscription_status: 'trial' | 'active' | 'locked' | 'pending_verification' | 'pending_payment' | 'expired';
  subscription_start?: string | null;
  subscription_end?: string | null;
  access_code: string;
  code_expires_at: string;
  monthly_price: number;
  is_active: boolean;
  product_count: number;
  follower_count?: number;
  total_sales: number;
  view_count: number;
  created_at: string;
  manual_lock?: boolean;
  manual_lock_reason?: string | null;
  manual_lock_date?: string | null;
  manual_lock_by?: string | null;
  payment_overdue_flagged?: boolean;
  payment_overdue_since?: string | null;
  setup_complete?: boolean | null;
  setup_completed_at?: string | null;
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
  is_featured?: boolean;
  status?: string;
  collection?: string | null;
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
  avatar_url: string;
  created_at: string;
}

export interface Sale {
  id: string;
  shop_id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  original_price: number;
  discount_amount: number;
  final_price: number;
  payment_method: 'cash' | 'ecocash' | 'innbucks' | 'whatsapp';
  channel: 'walk-in' | 'whatsapp' | 'instagram' | 'other';
  notes?: string | null;
  created_at: string;
  voided: boolean;
  offlinePending?: boolean;
}

export enum NotificationType {
  DAILY_SUMMARY = 'daily_summary',
  NEW_ORDER = 'new_order',
  NEW_WHATSAPP_CLICK = 'new_whatsapp_click',
  VISITOR_MILESTONE = 'visitor_milestone',
  TRIAL_EXPIRING = 'trial_expiring',
  SUBSCRIPTION_ACTIVE = 'subscription_active',
  ANNOUNCEMENT = 'announcement',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
}
