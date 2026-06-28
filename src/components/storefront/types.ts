// src/components/storefront/types.ts

export interface CartItem {
  id: string; // unique item id: product.id + size + color
  product: any;
  size: string;
  color: string;
  quantity: number;
}

export interface StorefrontOrder {
  id?: string;
  shop_id: string;
  owner_id: string;
  product_name: string;
  size: string;
  quantity: number;
  sale_price: number;
  channel: string;
  order_reference: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  customer_name: string;
  customer_whatsapp: string;
  delivery_address?: string;
  note?: string;
  created_at?: string;
}

export type StorefrontPageType = 
  | 'home' 
  | 'shop' 
  | 'product' 
  | 'categories' 
  | 'cart' 
  | 'checkout' 
  | 'success' 
  | 'track' 
  | 'account' 
  | 'wishlist' 
  | 'about' 
  | 'contact' 
  | 'terms' 
  | 'privacy' 
  | '404';
