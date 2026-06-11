// src/utils/shopUrl.ts

const BASE_URL = 
  import.meta.env.VITE_APP_URL
  || 'https://threadzw.vercel.app';

export const getShopUrl = (slug: string): string => {
  if (!slug) return '';
  const clean = slug
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${BASE_URL}/shop/${clean}`;
};
