// src/components/ui/ShopImage.tsx
import React, { useState } from 'react';
import { SUPABASE_URL } from '../../lib/supabase';

const getBaseStorageUrl = (): string => {
  let val = SUPABASE_URL || '';
  if (!val) {
    val = (import.meta.env?.VITE_SUPABASE_URL) || "https://dxfnoswvuhqvhyofcain.supabase.co";
  }
  if (val.endsWith('/')) {
    val = val.slice(0, -1);
  }
  return `${val}/storage/v1/object/public`;
};

export const resolveImageUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  
  const baseStorage = getBaseStorageUrl();
  let finalUrl = url.trim();

  // Log raw input and base details for pipeline tracking
  console.log('[IMAGE PIPELINE] Resolving image URL:', {
    rawInput: url,
    activeBase: SUPABASE_URL,
    storageEndpoint: baseStorage
  });

  // Rewrite legacy project references dynamically if they occur in database records or defaults
  if (finalUrl.includes('oadahfyoxfbisqqdtttz.supabase.co')) {
    console.warn('[IMAGE PIPELINE] Detected legacy project ID "oadahfyoxfbisqqdtttz", rewriting to active Supabase URL');
    const cleanBase = SUPABASE_URL ? SUPABASE_URL.replace(/\/$/, '') : "https://dxfnoswvuhqvhyofcain.supabase.co";
    finalUrl = finalUrl.replace(/https:\/\/oadahfyoxfbisqqdtttz\.supabase\.co/gi, cleanBase);
  }

  if (finalUrl.startsWith('http')) {
    return finalUrl;
  }
  if (finalUrl.startsWith('//')) {
    return `https:${finalUrl}`;
  }

  // Dynamic bucket matching for relative references
  let bucket = 'shop-images';
  if (finalUrl.includes('avatar') || finalUrl.includes('logo')) {
    bucket = 'shop-avatars';
  } else if (finalUrl.includes('banner')) {
    bucket = 'shop-banners';
  } else if (finalUrl.includes('product')) {
    bucket = 'product-images';
  }

  const resolved = `${baseStorage}/${bucket}/${finalUrl}`;
  console.log('[IMAGE PIPELINE] Resolved relative path:', {
    bucket,
    relative: finalUrl,
    resolved
  });
  
  return resolved;
};

export const getGlobalImageUrl = (url: string | null | undefined, type: 'logo' | 'banner' | 'product'): string => {
  const resolved = resolveImageUrl(url);
  if (resolved) return resolved;

  if (type === 'logo') return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80'; // abstract placeholder
  if (type === 'banner') return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'; // clean storefront
  return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80'; // apparel rack
};

interface ShopLogoProps {
  shop?: any;
  url?: string | null;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export const ShopLogo: React.FC<ShopLogoProps> = ({ 
  shop, 
  url,
  size = 48,
  className = '',
  style: extraStyle = {},
  alt
}) => {
  const [imgError, setImgError] = useState(false);
  
  const rawUrl = url || shop?.logo_url || shop?.avatar_url;
  const logoUrl = resolveImageUrl(rawUrl);
  const showImage = logoUrl && !imgError;

  const initials = (shop?.name || '?')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const numericSize = typeof size === 'number' ? size : parseInt(size as string) || 48;

  if (showImage) {
    return (
      <img
        src={`${logoUrl}?t=${
          shop?.updated_at 
            ? new Date(shop.updated_at).getTime() 
            : ''
        }`}
        alt={alt || shop?.name || 'Shop logo'}
        onError={() => setImgError(true)}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: numericSize * 0.22,
          objectFit: 'cover',
          display: 'block',
          backgroundColor: '#f0f0f0',
          ...extraStyle
        }}
        referrerPolicy="no-referrer"
      />
    );
  }

  // If we originally had an explicit className, let's render a simpler styled rounded initials div
  return (
    <div 
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: numericSize * 0.22,
        background: '#c8ff00',
        color: '#000000',
        fontWeight: 900,
        fontSize: numericSize * 0.33,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontStyle: 'normal',
        ...extraStyle
      }}
    >
      {initials}
    </div>
  );
};

interface ShopBannerProps {
  shop?: any;
  url?: string | null;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export const ShopBanner: React.FC<ShopBannerProps> = ({ 
  shop,
  url,
  height = 200,
  className = '',
  style: extraStyle = {},
  alt
}) => {
  const [imgError, setImgError] = useState(false);
  
  const rawUrl = url || shop?.banner_url;
  const bannerUrl = resolveImageUrl(rawUrl);
  const showImage = bannerUrl && !imgError;

  if (showImage) {
    return (
      <img
        src={`${bannerUrl}?t=${
          shop?.updated_at
            ? new Date(shop.updated_at).getTime()
            : ''
        }`}
        alt={alt || `${shop?.name || ''} banner`}
        onError={() => setImgError(true)}
        className={className}
        style={{
          width: '100%',
          height,
          objectFit: 'cover',
          display: 'block',
          backgroundColor: '#f0f0f0',
          ...extraStyle
        }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div 
      className={className}
      style={{
        width: '100%',
        height,
        background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...extraStyle
      }}
    >
      <svg 
        width="32" height="32"
        viewBox="0 0 24 24" 
        fill="none"
        stroke="#cccccc" 
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
};

interface ProductImageProps {
  product?: any;
  url?: string | null;
  index?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  product,
  url,
  index = 0,
  width = '100%',
  height = 200,
  className = '',
  style: extraStyle = {},
  alt
}) => {
  const [imgError, setImgError] = useState(false);

  const images = Array.isArray(product?.images)
    ? product.images
    : product?.images
      ? [product.images]
      : [];

  const rawUrl = url || images[index] || images[0];
  const imageUrl = resolveImageUrl(rawUrl);
  const showImage = imageUrl && !imgError;

  if (showImage) {
    return (
      <img
        src={imageUrl}
        alt={alt || product?.name || 'Product'}
        onError={() => setImgError(true)}
        className={className}
        style={{
          width,
          height,
          objectFit: 'cover',
          display: 'block',
          backgroundColor: '#f8f8f8',
          ...extraStyle
        }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div 
      className={className}
      style={{
        width,
        height,
        background: '#f8f8f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...extraStyle
      }}
    >
      <svg
        width="28" height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#cccccc"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
};
