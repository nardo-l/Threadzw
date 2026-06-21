// src/utils/shopUrl.ts

export const getAppHost = (): string => {
  if (typeof window === 'undefined') {
    return 'threadzw.vercel.app';
  }
  return window.location.host;
};

export const getAppOrigin = (): string => {
  if (typeof window === 'undefined') {
    return 'https://threadzw.vercel.app';
  }
  return window.location.origin;
};

export const getShopUrl = (slug: string | null | undefined, id?: string | null | undefined): string => {
  if (id) {
    return `/shop/${id.trim()}`;
  }
  if (!slug) {
    return '/shop/demo';
  }
  const clean = slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
  return `/shop/${clean}`;
};

export const getAbsoluteShopUrl = (slug: string | null | undefined, id?: string | null | undefined): string => {
  const storeId = id ? id.trim() : (slug || 'demo').trim();
  return `https://threadzw.vercel.app/shop/${storeId}`;
};

