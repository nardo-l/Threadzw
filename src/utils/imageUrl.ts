// src/utils/imageUrl.ts

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public`;

export const getImageUrl = (
  path: string | null | undefined, 
  bucket = 'shop-images'
): string | null => {
  if (!path) return null;
  
  // Already a full URL
  if (path.startsWith('http')) return path;
  
  // Path with bucket prefix
  if (path.startsWith('shop-images/')) {
    return `${STORAGE_BASE}/${path}`;
  }
  
  // Relative path
  return `${STORAGE_BASE}/${bucket}/${path}`;
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
