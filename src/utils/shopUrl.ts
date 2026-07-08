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
  if (!id || id === 'demo' || id === 'demo-shop' || id === 'demo-owner') {
    throw new Error("Cannot generate shop URL: shop.id is missing or invalid");
  }
  console.log("SHOP ID:", id);
  return `/shop/${id.trim()}?page=home`;
};

export const getAbsoluteShopUrl = (slug: string | null | undefined, id?: string | null | undefined): string => {
  if (!id || id === 'demo' || id === 'demo-shop' || id === 'demo-owner') {
    throw new Error("Cannot generate shop URL: shop.id is missing or invalid");
  }
  console.log("SHOP ID:", id);
  return `https://threadzw.vercel.app/shop/${id.trim()}?page=home`;
};

