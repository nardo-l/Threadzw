// src/utils/shopUrl.ts

const BASE_URL = 
  import.meta.env.VITE_APP_URL
  || 'https://threadzw.vercel.app';

export const getShopUrl = (slug: string | null | undefined): string => {
  if (!slug) {
    console.warn("[getShopUrl] Warning: Expected a valid slug string, but received:", slug);
    return '';
  }
  const clean = slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
  
  if (!clean) return '';
  return `/shop/${clean}`;
};

export const getAbsoluteShopUrl = (slug: string | null | undefined): string => {
  const relPath = getShopUrl(slug);
  if (!relPath) return '';
  return `${BASE_URL}${relPath}`;
};
