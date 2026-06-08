// src/utils/shopUrl.ts

export const getShopUrl = (slug: string): string => {
  if (!slug) return '';
  
  // Clean slug before using in URL
  const cleanSlug = slug
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  const baseUrl = 
    import.meta.env.VITE_APP_URL 
    || window.location.origin
    || 'https://threadzw.vercel.app';
  
  return `${baseUrl}/shop/${cleanSlug}`;
};
