// src/utils/shopUrl.ts

const PRODUCTION_ORIGIN = 'https://threadzw.vercel.app';

export const getAppHost = (): string => {
  if (typeof window === 'undefined') {
    return 'threadzw.vercel.app';
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return window.location.host;
  }

  return 'threadzw.vercel.app';
};

export const getAppOrigin = (): string => {
  if (typeof window === 'undefined') {
    return PRODUCTION_ORIGIN;
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return window.location.origin;
  }

  // Storefront links should always point to the production ThreadZW app,
  // even when the dashboard happens to be open on a Vercel preview URL.
  return PRODUCTION_ORIGIN;
};

export const getShopUrl = (slug: string | null | undefined, id?: string | null | undefined): string => {
  const publicId = slug?.trim() || id?.trim();
  if (!publicId || ['demo', 'demo-shop', 'demo-owner'].includes(publicId)) {
    throw new Error('Cannot generate shop URL: a public shop slug or valid shop id is required');
  }
  return `/shop/${publicId}`;
};

export const getAbsoluteShopUrl = (slug: string | null | undefined, id?: string | null | undefined): string => {
  return `${getAppOrigin()}${getShopUrl(slug, id)}`;
};
