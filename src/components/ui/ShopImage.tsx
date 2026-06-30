// src/components/ui/ShopImage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { SUPABASE_URL } from '../../lib/supabase';
import { ImageIcon } from 'lucide-react';

// Monkey-patch URL.createObjectURL once at the global level to keep track of any image preview blobs created in the active session
if (typeof window !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL && !(window as any).__patched_create_object_url) {
  (window as any).__patched_create_object_url = true;
  if (!(window as any).__active_blobs) {
    (window as any).__active_blobs = new Set<string>();
  }
  const originalCreateObjectURL = URL.createObjectURL;
  URL.createObjectURL = function(obj: any) {
    const url = originalCreateObjectURL(obj);
    if ((window as any).__active_blobs) {
      (window as any).__active_blobs.add(url);
    }
    return url;
  };
}

export const isStaleBlobUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('blob:')) {
    if (typeof window !== 'undefined' && (window as any).__active_blobs) {
      return !(window as any).__active_blobs.has(trimmed);
    }
    return true; // No track record in server-side mock renders
  }
  return false;
};

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

export const resolveImageUrl = (url: string | null | undefined, type?: 'logo' | 'banner' | 'product'): string | null => {
  if (!url || url.trim() === '') return null;
  
  let finalUrl = url.trim();

  // Instantly discard any stale blob URLs from previous browser sessions to prevent showing empty grey boxes
  if (isStaleBlobUrl(finalUrl)) {
    console.warn(`[IMAGE PIPELINE] Stale blob URL detected from prior session: ${finalUrl}. Treating as null.`);
    return null;
  }

  // If URL starts with http:// or https://, check if it's already a full Supabase storage URL or a normal URL
  if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
    const activeBaseUrl = SUPABASE_URL ? SUPABASE_URL.trim().replace(/\/$/, '') : "https://dxfnoswvuhqvhyofcain.supabase.co";
    if (finalUrl.includes('.supabase.co/')) {
      const match = finalUrl.match(/https?:\/\/[a-z0-9-]+\.supabase\.co/i);
      if (match && match[0].toLowerCase() !== activeBaseUrl.toLowerCase()) {
        finalUrl = finalUrl.replace(match[0], activeBaseUrl);
      }
    }
    return finalUrl;
  }

  // If URL starts with /, ./, ../, return unchanged
  if (finalUrl.startsWith('/') || finalUrl.startsWith('./') || finalUrl.startsWith('../')) {
    return finalUrl;
  }

  const baseStorage = getBaseStorageUrl();

  // Strip any existing bucket prefix to avoid double prefix or incorrect bucket mapping
  const buckets = ['shop-images', 'product-images', 'shop-banners', 'shop-avatars', 'avatars'];
  let cleanPath = finalUrl;
  let detectedBucket = null;
  for (const b of buckets) {
    if (finalUrl.startsWith(`${b}/`)) {
      cleanPath = finalUrl.substring(b.length + 1);
      detectedBucket = b;
      break;
    }
  }

  // Now resolve strictly based on type or detectedBucket
  let targetBucket = detectedBucket || 'shop-images';
  if (!detectedBucket) {
    if (type === 'product') {
      targetBucket = 'product-images';
    } else if (type === 'logo') {
      targetBucket = 'shop-avatars';
    } else if (type === 'banner') {
      targetBucket = 'shop-banners';
    } else {
      // Fallback if no type is provided (should generally be avoided as explicit type parameters are passed)
      if (finalUrl.includes('avatar') || finalUrl.includes('logo')) {
        targetBucket = 'shop-avatars';
      } else if (finalUrl.includes('banner')) {
        targetBucket = 'shop-banners';
      } else if (finalUrl.includes('/') || finalUrl.includes('product') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(finalUrl)) {
        targetBucket = 'product-images';
      }
    }
  }

  return `${baseStorage}/${targetBucket}/${cleanPath}`;
};

// Returns a premium typographic background style based deterministically on a name (pastel gradient)
const getDeterministicColor = (text: string) => {
  if (!text) return 'from-zinc-50 to-zinc-100 text-zinc-700 border-zinc-200/60';
  const char = text.trim().charAt(0).toUpperCase();
  const code = char.charCodeAt(0);
  const palettes = [
    'from-rose-50 to-rose-100/70 text-rose-700 border-rose-200/50',
    'from-amber-50 to-amber-100/70 text-amber-800 border-amber-200/50',
    'from-emerald-50 to-emerald-100/70 text-emerald-800 border-emerald-200/50',
    'from-sky-50 to-sky-100/70 text-sky-800 border-sky-200/50',
    'from-violet-50 to-violet-100/70 text-violet-800 border-violet-200/50',
  ];
  return palettes[code % palettes.length];
};

interface ImageWithSkeletonProps {
  srcs?: (string | null | undefined)[]; // Try loading these sources in sequence
  src: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  skeletonType: 'logo' | 'banner' | 'product';
  logoSize?: number;
  fallbackText?: string;
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  srcs,
  src,
  alt,
  className = '',
  style: extraStyle = {},
  skeletonType,
  logoSize = 48,
  fallbackText = ''
}) => {
  const [currentSrcIdx, setCurrentSrcIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failedAll, setFailedAll] = useState(false);

  // Normalize all candidate sources into a clean array of non-empty strings
  const candidateSrcs = useMemo(() => {
    const list: string[] = [];
    if (srcs) {
      srcs.forEach(s => {
        if (s && s.trim() && !list.includes(s.trim())) {
          list.push(s.trim());
        }
      });
    }
    if (src && src.trim() && !list.includes(src.trim())) {
      list.push(src.trim());
    }
    return list;
  }, [srcs, src]);

  const serializedSrcs = useMemo(() => {
    return candidateSrcs.join(',');
  }, [candidateSrcs]);

  useEffect(() => {
    setCurrentSrcIdx(0);
    setLoaded(false);
    setFailedAll(candidateSrcs.length === 0);
  }, [serializedSrcs]);

  const activeSrc = candidateSrcs[currentSrcIdx] || null;

  // If all candidate URLs failed to load (or none were provided), render our premium typographic fallback placeholder
  if (failedAll || !activeSrc) {
    const letter = fallbackText ? fallbackText.trim().charAt(0).toUpperCase() : 'T';
    const colorClass = getDeterministicColor(fallbackText || alt || 'T');

    if (skeletonType === 'logo') {
      const numericSize = typeof logoSize === 'number' ? logoSize : 48;
      return (
        <div 
          className={`flex items-center justify-center font-black border font-sans select-none shadow-3xs bg-gradient-to-br ${colorClass} ${className}`}
          style={{
            width: extraStyle.width || logoSize,
            height: extraStyle.height || logoSize,
            borderRadius: extraStyle.borderRadius || `${numericSize * 0.22}px`,
            fontSize: `${Math.max(12, numericSize * 0.38)}px`,
            ...extraStyle
          }}
        >
          {letter}
        </div>
      );
    }

    if (skeletonType === 'banner') {
      return (
        <div 
          className={`relative border flex flex-col justify-center items-center overflow-hidden font-sans select-none bg-gradient-to-br ${colorClass} ${className}`}
          style={{
            width: extraStyle.width || '100%',
            height: extraStyle.height || 180,
            ...extraStyle
          }}
        >
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-4xl font-black tracking-widest">{letter}</span>
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase opacity-70">
              {fallbackText || alt || 'Boutique Banner'}
            </span>
          </div>
          {/* Subtle grid lines inside modern banner placeholder */}
          <div className="absolute inset-0 grid grid-cols-3 gap-4 p-4 opacity-[0.03] pointer-events-none">
            <div className="border border-dashed border-zinc-900 rounded-lg"></div>
            <div className="border border-dashed border-zinc-900 rounded-lg"></div>
            <div className="border border-dashed border-zinc-900 rounded-lg"></div>
          </div>
        </div>
      );
    }

    // Product Placeholder (Typographic letter)
    return (
      <div 
        className={`relative border flex flex-col justify-center items-center overflow-hidden font-sans select-none bg-gradient-to-br ${colorClass} ${className}`}
        style={{
          width: extraStyle.width || '100%',
          height: extraStyle.height || '100%',
          ...extraStyle
        }}
      >
        <span className="text-6xl font-black tracking-tight">{letter}</span>
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase opacity-70 mt-2.5 truncate max-w-[80%] text-center">
          {fallbackText || alt || 'Garment'}
        </span>
        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1 pointer-events-none opacity-20">
          <div className="h-1.5 w-2/3 bg-current rounded-full opacity-40"></div>
          <div className="h-1 w-1/3 bg-current rounded-full opacity-30"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-zinc-50" 
      style={{ 
        width: extraStyle.width, 
        height: extraStyle.height,
        borderRadius: extraStyle.borderRadius || extraStyle.borderTopLeftRadius
      }}
    >
      {/* Background Loader visible while actively loading */}
      {!loaded && (
        <div 
          className="absolute inset-0 animate-pulse bg-zinc-50 flex items-center justify-center z-10"
          style={{ borderRadius: extraStyle.borderRadius }}
        >
          {skeletonType === 'logo' ? (
            <div className="w-[85%] h-[85%] rounded-full bg-zinc-100/40 border border-zinc-200/10"></div>
          ) : (
            <ImageIcon size={18} className="text-zinc-300 animate-pulse" />
          )}
        </div>
      )}

      <img
        src={activeSrc}
        alt={alt}
        onLoad={() => {
          setLoaded(true);
          setFailedAll(false);
        }}
        onError={() => {
          // Try next source in candidate list
          if (currentSrcIdx < candidateSrcs.length - 1) {
            setCurrentSrcIdx(prev => prev + 1);
          } else {
            setFailedAll(true);
          }
        }}
        className={`${className} ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-300`}
        style={{
          ...extraStyle,
          width: '100%',
          height: '100%',
        }}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};

interface ShopLogoProps {
  shop?: any;
  name?: string;
  url?: string | null;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

const getStableDailyCacheBuster = (): string => {
  if (typeof window === 'undefined') return '1';
  if (!(window as any).__daily_cache_buster) {
    (window as any).__daily_cache_buster = new Date().toDateString().replace(/\s/g, '-');
  }
  return (window as any).__daily_cache_buster;
};

const getSafeBusterValue = (updatedAt: any): string => {
  if (!updatedAt) return getStableDailyCacheBuster();
  const dateObj = new Date(updatedAt);
  const time = dateObj.getTime();
  if (isNaN(time)) return getStableDailyCacheBuster();
  return String(time);
};

export const ShopLogo: React.FC<ShopLogoProps> = ({ 
  shop, 
  name,
  url,
  size = 48,
  className = '',
  style: extraStyle = {},
  alt
}) => {
  const rawUrl = url || shop?.logo_url || shop?.avatar_url;
  const logoUrl = resolveImageUrl(rawUrl, 'logo');
  const numericSize = typeof size === 'number' ? size : parseInt(size as string) || 48;

  const candidateSrcs = useMemo(() => {
    const list: string[] = [];
    const buster = getSafeBusterValue(shop?.updated_at || shop?.created_at);
    if (logoUrl) {
      list.push(`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${buster}`);
      list.push(logoUrl);
    }
    // Static fallback of last resort
    list.push('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80');
    return list;
  }, [logoUrl, shop]);

  return (
    <ImageWithSkeleton
      srcs={candidateSrcs}
      src={candidateSrcs[0]}
      alt={alt || name || shop?.name || 'Shop logo'}
      className={className}
      skeletonType="logo"
      logoSize={numericSize}
      fallbackText={name || shop?.name || alt || 'S'}
      style={{
        width: size,
        height: size,
        borderRadius: numericSize * 0.22,
        objectFit: 'cover',
        display: 'block',
        ...extraStyle
      }}
    />
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
  const rawUrl = url || shop?.banner_url;
  const bannerUrl = resolveImageUrl(rawUrl, 'banner');
  const logoUrl = resolveImageUrl(shop?.logo_url || shop?.avatar_url, 'logo');

  const candidateSrcs = useMemo(() => {
    const list: string[] = [];
    const buster = getSafeBusterValue(shop?.updated_at || shop?.created_at);
    if (bannerUrl) {
      list.push(`${bannerUrl}${bannerUrl.includes('?') ? '&' : '?'}t=${buster}`);
      list.push(bannerUrl);
    }
    if (logoUrl) {
      list.push(`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${buster}`);
      list.push(logoUrl);
    }
    list.push('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80');
    return list;
  }, [bannerUrl, logoUrl, shop]);

  return (
    <ImageWithSkeleton
      srcs={candidateSrcs}
      src={candidateSrcs[0]}
      alt={alt || `${shop?.name || ''} banner`}
      className={className}
      skeletonType="banner"
      fallbackText={shop?.name || 'B'}
      style={{
        width: '100%',
        height,
        objectFit: 'cover',
        display: 'block',
        ...extraStyle
      }}
    />
  );
};

interface ProductImageProps {
  product?: any;
  shop?: any;
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
  shop,
  url,
  index = 0,
  width = '100%',
  height = 200,
  className = '',
  style: extraStyle = {},
  alt
}) => {
  const images = useMemo(() => {
    if (Array.isArray(product?.images)) return product.images;
    if (product?.images) return [product.images];
    return [];
  }, [product]);

  const rawUrl = url || images[index] || images[0];
  const imageUrl = resolveImageUrl(rawUrl, 'product');
  const logoUrl = resolveImageUrl(shop?.logo_url || shop?.avatar_url, 'logo');

  const candidateSrcs = useMemo(() => {
    const list: string[] = [];
    const buster = getSafeBusterValue(product?.updated_at || product?.created_at);

    // 1. Primary Product Image
    if (imageUrl) {
      list.push(`${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${buster}`);
      list.push(imageUrl);
    }

    // 2. Secondary Product Images
    if (Array.isArray(product?.images)) {
      product.images.forEach((img: any, idx: number) => {
        if (idx !== index) {
          const fallbackImgUrl = resolveImageUrl(img, 'product');
          if (fallbackImgUrl) {
            list.push(`${fallbackImgUrl}${fallbackImgUrl.includes('?') ? '&' : '?'}t=${buster}`);
            list.push(fallbackImgUrl);
          }
        }
      });
    }

    // 3. Shop Banner Fallback
    const bannerUrl = resolveImageUrl(shop?.banner_url, 'banner');
    if (bannerUrl) {
      list.push(`${bannerUrl}${bannerUrl.includes('?') ? '&' : '?'}t=${buster}`);
      list.push(bannerUrl);
    }

    // 4. Shop Logo Fallback
    if (logoUrl) {
      list.push(`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${buster}`);
      list.push(logoUrl);
    }

    // 5. Hardcoded Apparel Unsplash fallback
    list.push('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80');

    return list;
  }, [imageUrl, logoUrl, shop, product, index]);

  return (
    <ImageWithSkeleton
      srcs={candidateSrcs}
      src={candidateSrcs[0]}
      alt={alt || product?.name || 'Product catalog item'}
      className={className}
      skeletonType="product"
      fallbackText={product?.name || 'P'}
      style={{
        width,
        height,
        objectFit: 'cover',
        display: 'block',
        ...extraStyle
      }}
    />
  );
};
