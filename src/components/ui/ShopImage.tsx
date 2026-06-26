// src/components/ui/ShopImage.tsx
import React, { useState, useEffect } from 'react';
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

export const resolveImageUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  
  let finalUrl = url.trim();

  // Instantly discard any stale blob URLs from previous browser sessions to prevent showing empty grey boxes
  if (isStaleBlobUrl(finalUrl)) {
    console.warn(`[IMAGE PIPELINE] Stale blob URL detected from prior session: ${finalUrl}. Treating as null.`);
    return null;
  }

  // If URL starts with http:// or https://, return unchanged
  if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
    return finalUrl;
  }

  // If URL starts with /, ./, ../, return unchanged
  if (finalUrl.startsWith('/') || finalUrl.startsWith('./') || finalUrl.startsWith('../')) {
    return finalUrl;
  }

  const baseStorage = getBaseStorageUrl();
  const activeBaseUrl = SUPABASE_URL ? SUPABASE_URL.trim().replace(/\/$/, '') : "https://dxfnoswvuhqvhyofcain.supabase.co";

  // Rewrite any legacy or mismatched .supabase.co subdomains to use the active project URL
  if (finalUrl.includes('.supabase.co/')) {
    const match = finalUrl.match(/https?:\/\/[a-z0-9-]+\.supabase\.co/i);
    if (match && match[0].toLowerCase() !== activeBaseUrl.toLowerCase()) {
      console.log(`[IMAGE PIPELINE] Rewriting host ${match[0]} to active host ${activeBaseUrl}`);
      finalUrl = finalUrl.replace(match[0], activeBaseUrl);
    }
  }

  if (finalUrl.startsWith('http') || finalUrl.startsWith('blob:') || finalUrl.startsWith('data:')) {
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
  } else if (finalUrl.includes('/') || finalUrl.includes('product') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(finalUrl)) {
    bucket = 'product-images';
  }

  const resolved = `${baseStorage}/${bucket}/${finalUrl}`;
  return resolved;
};

export const getGlobalImageUrl = (url: string | null | undefined, type: 'logo' | 'banner' | 'product'): string => {
  const resolved = resolveImageUrl(url);
  if (resolved) return resolved;

  if (type === 'logo') return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80'; // abstract placeholder
  if (type === 'banner') return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'; // clean storefront
  return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80'; // apparel rack
};

interface ImageWithSkeletonProps {
  src: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  skeletonType: 'logo' | 'banner' | 'product';
  logoSize?: number;
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  src,
  alt,
  className = '',
  style: extraStyle = {},
  skeletonType,
  logoSize = 48
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Rely on the browser's native onLoad and onError events to handle loading states rather than an aggressive 3s timeout
  useEffect(() => {
    // Reset state if source changes
    setLoaded(false);
    setFailed(false);
  }, [src]);

  // If no source is given, or if resolving failed or timed out, render the beautiful skeleton directly
  if (!src || failed) {
    if (skeletonType === 'logo') {
      return (
        <div 
          className={`animate-pulse bg-[#121212] border border-white/[0.04] flex items-center justify-center relative overflow-hidden ${className}`}
          style={{
            width: extraStyle.width || logoSize,
            height: extraStyle.height || logoSize,
            borderRadius: extraStyle.borderRadius || (typeof logoSize === 'number' ? logoSize * 0.22 : '22%'),
            ...extraStyle
          }}
        >
          <div className="w-[85%] h-[85%] rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.02]">
            <span className="text-[9px] font-black tracking-wider text-white/10 font-mono">TZW</span>
          </div>
        </div>
      );
    }

    if (skeletonType === 'banner') {
      return (
        <div 
          className={`animate-pulse bg-[#121212] border border-white/[0.04] flex flex-col justify-center items-center relative overflow-hidden ${className}`}
          style={{
            width: extraStyle.width || '100%',
            height: extraStyle.height || 180,
            ...extraStyle
          }}
        >
          <div className="flex flex-col items-center gap-1.5 opacity-[0.08]">
            <ImageIcon size={22} className="text-white" />
            <span className="text-[9px] font-black tracking-widest text-white font-mono">STUDIO BANNER</span>
          </div>
          {/* Subtle grid lines inside modern banner skeleton */}
          <div className="absolute inset-0 grid grid-cols-3 gap-4 p-4 opacity-[0.02] pointer-events-none">
            <div className="border border-dashed border-white rounded-lg"></div>
            <div className="border border-dashed border-white rounded-lg"></div>
            <div className="border border-dashed border-white rounded-lg"></div>
          </div>
        </div>
      );
    }

    // Default: product image skeleton
    return (
      <div 
        className={`animate-pulse bg-[#121212] border border-white/[0.04] flex flex-col justify-center items-center relative overflow-hidden ${className}`}
        style={{
          width: extraStyle.width || '100%',
          height: extraStyle.height || '100%',
          ...extraStyle
        }}
      >
        <div className="flex flex-col items-center gap-1.5 opacity-[0.08]">
          <ImageIcon size={18} className="text-white" />
          <span className="text-[8px] font-black tracking-wider text-white font-mono">STYLING_CATALOG</span>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1 pointer-events-none opacity-[0.03]">
          <div className="h-1.5 w-2/3 bg-white rounded"></div>
          <div className="h-1 w-1/3 bg-white rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#121212]" 
      style={{ 
        width: extraStyle.width, 
        height: extraStyle.height,
        borderRadius: extraStyle.borderRadius || extraStyle.borderTopLeftRadius
      }}
    >
      {/* Background Skeleton visible while actively buffering */}
      {!loaded && (
        <div 
          className="absolute inset-0 animate-pulse bg-[#121212] flex items-center justify-center z-10"
          style={{ borderRadius: extraStyle.borderRadius }}
        >
          {skeletonType === 'logo' ? (
            <div className="w-[85%] h-[85%] rounded-full bg-white/[0.03] border border-white/[0.02]"></div>
          ) : (
            <ImageIcon size={18} className="text-white/5 animate-pulse" />
          )}
        </div>
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-300`}
        style={{
          ...extraStyle,
          width: '100%',
          height: '100%',
        }}
        referrerPolicy="no-referrer"
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
  const logoUrl = resolveImageUrl(rawUrl);
  const numericSize = typeof size === 'number' ? size : parseInt(size as string) || 48;

  const srcWithBust = (logoUrl && !logoUrl.startsWith('blob:') && !logoUrl.startsWith('data:') && !logoUrl.includes('unsplash.com'))
    ? `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${getSafeBusterValue(shop?.updated_at || shop?.created_at)}`
    : logoUrl;

  console.log("LOGO URL:", shop?.logo_url);
  console.log("LOGO URL FROM DB:", shop?.logo_url);
  console.log("IMAGE SRC:", srcWithBust);

  return (
    <ImageWithSkeleton
      src={srcWithBust}
      alt={alt || name || shop?.name || 'Shop logo'}
      className={className}
      skeletonType="logo"
      logoSize={numericSize}
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
  const bannerUrl = resolveImageUrl(rawUrl);
  
  const srcWithBust = (bannerUrl && !bannerUrl.startsWith('blob:') && !bannerUrl.startsWith('data:') && !bannerUrl.includes('unsplash.com'))
    ? `${bannerUrl}${bannerUrl.includes('?') ? '&' : '?'}t=${getSafeBusterValue(shop?.updated_at || shop?.created_at)}`
    : bannerUrl;

  return (
    <ImageWithSkeleton
      src={srcWithBust}
      alt={alt || `${shop?.name || ''} banner`}
      className={className}
      skeletonType="banner"
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
  const images = Array.isArray(product?.images)
    ? product.images
    : product?.images
      ? [product.images]
      : [];

  const rawUrl = url || images[index] || images[0];
  const imageUrl = resolveImageUrl(rawUrl);

  const srcWithBust = (imageUrl && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:') && !imageUrl.includes('unsplash.com'))
    ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${getSafeBusterValue(product?.updated_at || product?.created_at)}`
    : imageUrl;

  return (
    <ImageWithSkeleton
      src={srcWithBust}
      alt={alt || product?.name || 'Product catalog item'}
      className={className}
      skeletonType="product"
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
