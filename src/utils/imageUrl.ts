// src/utils/imageUrl.ts
import { SUPABASE_URL } from '../lib/supabase';

const getBaseSupabaseUrl = (): string => {
  let val = SUPABASE_URL || '';
  if (!val) {
    val = (import.meta.env?.VITE_SUPABASE_URL) || "https://dxfnoswvuhqvhyofcain.supabase.co";
  }
  if (val.endsWith('/')) {
    val = val.slice(0, -1);
  }
  return val;
};

const STORAGE_BASE = `${getBaseSupabaseUrl()}/storage/v1/object/public`;

export const getImageUrl = (
  path: string | null | undefined, 
  bucket = 'shop-images'
): string | null => {
  if (!path) return null;
  
  let finalPath = path.trim();

  // Rewrite legacy project references if they occur
  if (finalPath.includes('oadahfyoxfbisqqdtttz.supabase.co')) {
    const activeBase = getBaseSupabaseUrl();
    finalPath = finalPath.replace(/https:\/\/oadahfyoxfbisqqdtttz\.supabase\.co/gi, activeBase);
  }

  // Already a full URL
  if (finalPath.startsWith('http')) return finalPath;
  
  // Path with bucket prefix
  if (finalPath.startsWith('shop-images/')) {
    return `${STORAGE_BASE}/${finalPath}`;
  }
  
  // Relative path
  return `${STORAGE_BASE}/${bucket}/${finalPath}`;
};

export const getShopLogoUrl = (shop: any): string | null => {
  if (!shop?.logo_url) return null;
  return getImageUrl(shop.logo_url);
};

export const getShopBannerUrl = (shop: any): string | null => {
  if (!shop?.banner_url) return null;
  return getImageUrl(shop.banner_url);
};

export const getProductImageUrl = (
  product: any, 
  index = 0
): string | null => {
  if (!product?.images) return null;
  
  const images = Array.isArray(product.images)
    ? product.images
    : [product.images];
  
  const image = images[index] || images[0];
  if (!image) return null;
  
  return getImageUrl(image);
};

// Add cache buster after upload:
export const bustCache = (url: string | null): string | null => {
  if (!url) return null;
  return `${url}?t=${Date.now()}`;
};
