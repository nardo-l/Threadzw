export type SellerCategory = 'clothing' | 'vehicles' | 'general';
export type SellerPlan = 'free' | 'premium';
export type PlanType = SellerPlan;

/**
 * Transitional PageType:
 * Includes all active SellerCategory values ('clothing', 'vehicles', 'general'),
 * the legacy default 'storefront', plus transitional legacy bio types
 * ('service', 'creator', 'professional', 'community') to guarantee zero breaking changes.
 */
export type PageType =
  | SellerCategory
  | 'storefront'
  | 'service'
  | 'creator'
  | 'professional'
  | 'community';

export interface SellerCategoryFeatures {
  sizes?: boolean;
  colors?: boolean;
  variants?: boolean;
  vehicleSpecs?: boolean;
  customSections?: boolean;
}

export interface SellerCategoryConfig {
  id: SellerCategory;
  label: string;
  description: string;
  icon: string;
  listingType: 'product' | 'vehicle' | 'standard';
  badgeLabel?: string;
  supportedFeatures: SellerCategoryFeatures;
  defaultCategoryName?: string;
}

export interface BioLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  is_active?: boolean;
}

export interface CustomSection {
  id: string;
  type: string;
  title?: string;
  content?: any;
}

export interface SocialLinks {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
}

export interface PageConfig {
  theme?: string;
  primary_color?: string;
  secondary_color?: string;
  bio_links?: BioLink[];
  custom_sections?: CustomSection[];
  social_links?: SocialLinks;
  working_hours?: string;
  booking_url?: string;
  tip_jar_enabled?: boolean;
  featured_media_url?: string;
  event_details?: {
    date?: string;
    location?: string;
    rsvp_url?: string;
  };
  [key: string]: any;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug?: string;
  category: string;
  description: string;
  location?: string | null;
  city?: string | null;
  whatsapp_number?: string;
  whatsapp?: string;
  phone?: string;
  handle?: string;
  hours?: string;
  delivery_info?: string;
  instagram: string;
  avatar_url?: string;
  logo_url?: string;
  banner_url: string;
  is_active: boolean;
  product_count: number;
  follower_count?: number;
  total_sales: number;
  view_count: number;
  created_at: string;
  plan?: SellerPlan | string;
  plan_type?: string;
  product_limit?: number | null;
  vehicle_limit?: number | null;
  subscription_status?: string;
  premium_status?: string;
  payment_status?: string;
  payment_required?: boolean;
  payment_reference?: string;
  payment_amount?: number;
  payment_currency?: string;
  paid_at?: string | null;
  lifetime_unique_visits?: number;
  lifetime_interest_events?: number;
  usage_quota_exceeded?: boolean;

  // New Link-in-Bio Page Architecture Fields
  page_type?: PageType;
  template_id?: string | null;
  page_config?: PageConfig;
}

export type Page = Shop;

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

// ==========================================
// PHASE 4: VEHICLE SALES SYSTEM TYPES
// ==========================================

export type VehicleStatus = 'available' | 'reserved' | 'sold';

export type VehicleFuelType = 
  | 'petrol' 
  | 'diesel' 
  | 'hybrid' 
  | 'electric' 
  | 'lpg' 
  | 'cng' 
  | 'other';

export type VehicleTransmission = 
  | 'automatic' 
  | 'manual' 
  | 'semi_automatic' 
  | 'cvt' 
  | 'other';

export type VehicleBodyType = 
  | 'suv' 
  | 'sedan' 
  | 'hatchback' 
  | 'pickup' 
  | 'coupe' 
  | 'truck' 
  | 'van' 
  | 'wagon' 
  | 'convertible' 
  | 'motorcycle' 
  | 'other';

export type VehicleCondition = 
  | 'brand_new' 
  | 'foreign_used' 
  | 'locally_used' 
  | 'certified_pre_owned';

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  image_url: string;
  sort_order: number;
  created_at?: string;
}

export interface Vehicle {
  id: string;
  shop_id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileage?: number | null;
  mileage_unit?: 'km' | 'mi';
  fuel_type?: VehicleFuelType | null;
  transmission?: VehicleTransmission | null;
  engine?: string | null;
  body_type?: VehicleBodyType | null;
  condition?: VehicleCondition | null;
  colour?: string | null;
  location?: string | null;
  description?: string | null;
  status: VehicleStatus;
  is_featured?: boolean;
  view_count?: number;
  created_at: string;
  updated_at?: string;
  images?: VehicleImage[];
  primary_image?: string;
}

export interface VehicleFilters {
  search?: string;
  make?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  status?: VehicleStatus | 'all';
  fuel_type?: VehicleFuelType | 'all';
  transmission?: VehicleTransmission | 'all';
  condition?: VehicleCondition | 'all';
  body_type?: VehicleBodyType | 'all';
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc';
}

// ==========================================
// PHASE 6A: SUBSCRIPTION & PAYMENT TYPES
// ==========================================

export type SubscriptionStatus =
  | 'inactive'
  | 'pending'
  | 'active'
  | 'past_due'
  | 'grace_period'
  | 'cancelled'
  | 'expired';

export type BillingCycle = 'none' | 'monthly' | 'yearly';

export type PaymentEventType =
  | 'payment.completed'
  | 'subscription.renewed'
  | 'subscription.trial_started'
  | 'subscription.renew_failed'
  | 'subscription.cancelled';

export interface Subscription {
  id: string;
  shop_id: string;
  owner_id: string;
  category: SellerCategory;
  plan: SellerPlan;
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  provider: 'nardopay' | string;
  nardopay_link_id?: string | null;
  nardopay_link_code?: string | null;
  nardopay_subscription_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  grace_period_end?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  shop_id?: string | null;
  subscription_id?: string | null;
  owner_id?: string | null;
  provider: 'nardopay' | string;
  event_type: PaymentEventType;
  provider_event_id?: string | null;
  link_code?: string | null;
  nardopay_subscription_id?: string | null;
  amount?: number | null;
  currency?: string | null;
  payload: Record<string, any>;
  signature_verified: boolean;
  processed: boolean;
  processed_at?: string | null;
  processing_error?: string | null;
  created_at: string;
}



