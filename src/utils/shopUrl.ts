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
  const publicId = slug?.trim() || id?.trim();
  if (!publicId || ['demo', 'demo-shop', 'demo-owner'].includes(publicId)) {
    throw new Error('Cannot generate shop URL: a public shop slug or valid shop id is required');
  }
  return `/shop/${publicId}?page=home`;
};

export const getAbsoluteShopUrl = (slug: string | null | undefined, id?: string | null | undefined): string => {
  return `${getAppOrigin()}${getShopUrl(slug, id)}`;
};

