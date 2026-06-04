import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { getShopStatus, parseDate } from '../utils/shopStatus';
import { 
  ArrowLeft, Share2, MapPin, Package, Clock, MessageCircle, 
  Check, X, ShieldCheck, ShoppingBag, ArrowRight,
  Instagram, Search, ChevronLeft, ChevronRight, Store, ExternalLink, Phone, Eye
} from 'lucide-react';

// Helper to extract dominant saturated color using a canvas sampler
const extractVibrantColor = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 30;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#c8ff00');
          return;
        }
        ctx.drawImage(img, 0, 0, 30, 30);
        const data = ctx.getImageData(0, 0, 30, 30).data;
        
        let bestColor = '#c8ff00';
        let maxSaturation = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          if (a < 220) continue; // highly opaque only
          
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          if (max < 40 || min > 220) continue; // skip pure white/black
          
          const saturation = max === 0 ? 0 : delta / max;
          const luminance = (max + min) / 255 / 2;
          
          if (saturation > maxSaturation && luminance > 0.25 && luminance < 0.75) {
            maxSaturation = saturation;
            bestColor = `rgb(${r}, ${g}, ${b})`;
          }
        }
        resolve(bestColor);
      } catch (err) {
        resolve('#c8ff00');
      }
    };
    img.onerror = () => {
      resolve('#c8ff00');
    };
    img.src = imageUrl;
  });
};

// Map color names to Hex beautifully for the color picker
const getColorHex = (colorName: string) => {
  const lower = colorName.toLowerCase();
  const map: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    grey: '#808080',
    gray: '#6b7280',
    brown: '#78350f',
    pink: '#f472b6',
    purple: '#a855f7',
    orange: '#f97316',
    beige: '#f5f5dc',
    cream: '#fffdd0',
    navy: '#1e3a8a',
    khaki: '#c3b091',
    olive: '#556b2f',
  };
  return map[lower] || lower;
};

// Format business/trading hours gracefully
const getDisplayHours = (shopObj: any) => {
  if (!shopObj) return null;
  if (shopObj.hours && shopObj.hours.trim()) return shopObj.hours.trim();
  if (shopObj.opening_hours && shopObj.opening_hours.trim()) return shopObj.opening_hours.trim();
  if (shopObj.trading_hours) {
    try {
      const parsed = typeof shopObj.trading_hours === 'string' 
        ? JSON.parse(shopObj.trading_hours) 
        : shopObj.trading_hours;
      const entries = Object.entries(parsed)
        .filter(([_, h]: [string, any]) => h && h.isOpen)
        .map(([day, h]: [string, any]) => {
          const from = h.from || h.openTime || '';
          const to = h.to || h.closeTime || '';
          return `${day}: ${from} - ${to}`;
        });
      if (entries.length > 0) return entries.join(', ');
    } catch (e) {
      console.warn('Failed to parse trading_hours:', e);
    }
  }
  return null;
};

interface PublicShopPageProps {
  handle: string;
}

export const PublicShopPage: React.FC<PublicShopPageProps> = ({ handle }) => {
  const { shopSlug } = useParams<{ shopSlug?: string }>();
  const currentSlug = shopSlug || handle;

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accent, setAccent] = useState('#c8ff00');
  
  // Navigation & interaction states
  const [viewMode, setViewMode] = useState<'landing' | 'browse'>('landing');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [descExpanded, setDescExpanded] = useState(false);
  
  // Filter & Search states
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Bottom sheet states
  const [showVisitPopup, setShowVisitPopup] = useState(false);
  
  const productsSectionRef = useRef<HTMLDivElement>(null);
  const scrollStripRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchShop();
  }, [currentSlug]);

  // Extract dynamic accent color once shop data is loaded
  useEffect(() => {
    const loadDynamicColor = async () => {
      if (!shop) return;
      if (shop.banner_url) {
        const clr = await extractVibrantColor(shop.banner_url);
        setAccent(clr);
      } else if (shop.logo_url) {
        const clr = await extractVibrantColor(shop.logo_url);
        setAccent(clr);
      }
    };
    loadDynamicColor();
  }, [shop]);

  const fetchShop = async () => {
    setLoading(true);
    try {
      let cleanHandle = (currentSlug || '').replace(/^@/, '').trim().toLowerCase();
      if (!cleanHandle) {
        const pathParts = window.location.pathname.split('/');
        const shopIdx = pathParts.findIndex(p => p === 'shop' || p === 'store');
        if (shopIdx !== -1 && pathParts[shopIdx + 1]) {
          cleanHandle = pathParts[shopIdx + 1].replace(/^@/, '').trim().toLowerCase();
        }
      }

      if (!cleanHandle) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      let isDemoShop = cleanHandle === 'demo';
      let shopData: any = null;

      if (isDemoShop) {
        try {
          // Try fetching from public 'shops' table where slug is 'demo' first
          const { data: physicalShop, error: physicalErr } = await supabase
            .from('shops')
            .select('*')
            .eq('slug', 'demo')
            .maybeSingle();

          if (physicalShop) {
            shopData = {
              ...physicalShop,
              isDemo: true,
              handle: 'demo',
              slug: 'demo',
              whatsapp_number: physicalShop.whatsapp || '263776223144',
              logo_url: physicalShop.logo_url || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80',
              banner_url: physicalShop.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
            };
          } else {
            // Fallback to legacy demo_shop custom table
            const { data } = await supabase
              .from('demo_shop')
              .select('*')
              .maybeSingle();
            if (data) {
              shopData = {
                ...data,
                id: 'demo-shop',
                name: 'Kure Streetwear',
                isDemo: true,
                handle: 'demo',
                slug: 'demo',
                description: 'Zim clothing store - built for the ones chasing more.',
                is_live: true,
                whatsapp: data.whatsapp || '263776223144',
                whatsapp_number: data.whatsapp || '263776223144',
                logo_url: data.logo_url || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80',
                banner_url: data.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
              };
            } else {
              shopData = {
                id: 'demo-shop',
                name: 'Kure Streetwear',
                handle: 'demo',
                slug: 'demo',
                description: 'Zim clothing store - built for the ones chasing more.',
                location: 'Harare',
                isDemo: true,
                is_live: true,
                whatsapp: '263776223144',
                whatsapp_number: '263776223144',
                logo_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80',
                banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
              };
            }
          }
        } catch (dbErr) {
          console.warn("Supabase demo shop fetch failed", dbErr);
          shopData = {
            id: 'demo-shop',
            name: 'Kure Streetwear',
            handle: 'demo',
            slug: 'demo',
            description: 'Zim clothing store - built for the ones chasing more.',
            location: 'Harare',
            isDemo: true,
            is_live: true,
            whatsapp: '263776223144',
            whatsapp_number: '263776223144',
            logo_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80',
            banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
          };
        }
      } else {
        // 1. Fetch from Supabase (by slug, falling back to handle)
        try {
          let { data, error } = await supabase
            .from('shops')
            .select('*')
            .eq('slug', cleanHandle)
            .maybeSingle();

          if (error || !data) {
            const { data: fallbackData } = await supabase
              .from('shops')
              .select('*')
              .ilike('handle', cleanHandle)
              .maybeSingle();
            data = fallbackData;
          }

          if (data) {
            shopData = data;
          }
        } catch (dbErr) {
          console.warn("Supabase fetch failed", dbErr);
        }
      }

      if (!shopData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setShop(shopData);
      document.title = `${shopData.name} — Online Store`;

      // Fetch payment claims for status check
      let claimsData: any[] = [];
      if (!isDemoShop) {
        try {
          const { data, error } = await supabase
            .from('payment_claims')
            .select('*')
            .eq('shop_id', shopData.id);
          if (!error && data) {
            claimsData = data;
          }
        } catch (dbClaimsErr) {
          console.warn("Supabase claims fetch failed", dbClaimsErr);
        }
      }
      setClaims(claimsData);

      // 2. Fetch products of the loaded shop from Supabase
      let productsData: any[] = [];
      if (isDemoShop) {
        try {
          // Try fetching from the real products table first if we have a real shop ID
          const realShopId = shopData?.id || 'da7da7da-7da7-4da7-bda7-da7da7da7da7';
          const { data: realProds, error: realProdsErr } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', realShopId)
            .neq('status', 'deleted');

          if (!realProdsErr && realProds && realProds.length > 0) {
            productsData = realProds.map((nt: any) => {
              let ft: string[] = [];
              if (Array.isArray(nt.images)) {
                ft = nt.images.filter(Boolean);
              } else if (typeof nt.images === 'string' && nt.images.trim()) {
                ft = [nt.images.trim()];
              }
              return {
                ...nt,
                images: ft,
                colors: nt.colours || nt.colors || []
              };
            });
          }
        } catch (dbRealProdsErr) {
          console.warn("Supabase physical products fetch for demo failed", dbRealProdsErr);
        }

        if (productsData.length === 0) {
          try {
            const { data, error } = await supabase
              .from('demo_products')
              .select('*')
              .eq('in_stock', true)
              .order('sort_order', { ascending: true });

            if (!error && data) {
              productsData = data.map((p: any) => {
                let imgs: string[] = [];
                if (p.image_url) {
                  imgs = [p.image_url];
                }
                return {
                  ...p,
                  images: imgs,
                  colors: p.colors || [],
                  sizes: p.sizes || [],
                  total_stock: p.in_stock ? 99 : 0,
                  status: 'active'
                };
              });
            }
          } catch (dbProdsErr) {
            console.warn("Supabase demo products fetch failed", dbProdsErr);
          }
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', shopData.id)
            .neq('status', 'deleted')
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false });

          if (!error && data) {
            productsData = data.map((p: any) => {
              let imgs: string[] = [];
              if (Array.isArray(p.images)) {
                imgs = p.images.filter(Boolean);
              } else if (typeof p.images === 'string' && p.images.trim()) {
                imgs = [p.images.trim()];
              }
              return {
                ...p,
                images: imgs,
                colors: p.colours || p.colors || []
              };
            });
          }
        } catch (dbProdsErr) {
          console.warn("Supabase products fetch failed", dbProdsErr);
        }
      }

      setProducts(productsData);

      // Save/increment view count if available
      if (!isDemoShop) {
        try {
          await supabase
            .from('shops')
            .update({ view_count: (shopData.view_count || 0) + 1 })
            .eq('id', shopData.id);
        } catch (_) {}
      }

    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getShopOfflineStatus = () => {
    if (!shop) return false;

    // Only hide if manually locked by admin
    if (shop.manual_lock === true) {
      return true;
    }
    // Otherwise ALWAYS show
    return false;
  };

  const shopIsOffline = getShopOfflineStatus();

  // Format WhatsApp number cleanly
  const formatWA = (num: string) => {
    if (!num) return '263776223144';
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('263')) return cleaned;
    if (cleaned.startsWith('0')) return '263' + cleaned.slice(1);
    return '263' + cleaned;
  };

  const handleWhatsAppDirect = () => {
    if (shop?.isDemo) {
      const demoMsg = "Hi! I am viewing Kure Streetwear. I want to create my own shop like this.";
      window.open(`https://wa.me/263776223144?text=${encodeURIComponent(demoMsg)}`, '_blank');
      return;
    }
    const phone = formatWA(shop?.whatsapp || shop?.whatsapp_number);
    const text = `Hi ${shop?.name}! I saw your shop on ThreadZW and would love to enquire about your products.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // WhatsApp prefilled order system format
  const handleOrderCheckout = () => {
    if (shop?.isDemo) {
      const demoMsg = "Hi! I am viewing Kure Streetwear. I want to create my own shop like this.";
      window.open(`https://wa.me/263776223144?text=${encodeURIComponent(demoMsg)}`, '_blank');
      return;
    }
    if (!selectedProduct) return;
    
    const sizesAvailable = selectedProduct.sizes || [];
    if (sizesAvailable.length > 0 && !selectedSize) {
      showToast('Select a size first', 'error');
      return;
    }

    const shopPhone = formatWA(shop?.whatsapp || shop?.whatsapp_number);
    const msg = `Hi! I'd like to order:

Product: ${selectedProduct.name}
Size: ${selectedSize || 'N/A'}
Color: ${selectedColor || 'N/A'}

Is this available?`;

    window.open(`https://wa.me/${shopPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleVisitDirections = () => {
    if (shop?.google_maps_url || shop?.google_maps_link) {
      window.open(shop.google_maps_url || shop.google_maps_link, '_blank');
      return;
    }
    const address = [
      shop?.landmark || shop?.physical_address,
      shop?.suburb,
      shop?.city || shop?.town,
      'Zimbabwe'
    ].filter(Boolean).join(', ');
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  // 🏪 LOADING SCREEN
  if (loading) {
    return (
      <div style={{
        background: '#0a0a0a',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid rgba(200,255,0,0.15)',
          borderTop: '3px solid #c8ff00',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'sans-serif'
        }}>
          Loading shop...
        </p>
      </div>
    );
  }

  // 🏪 NOT FOUND SCREEN
  if (notFound || !shop) {
    return (
      <div style={{
        background: '#0a0a0a',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '0 24px',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: 48 }}>👻</span>
        <h2 style={{
          color: '#ffffff',
          fontSize: 22,
          fontWeight: 900,
          margin: 0,
          fontFamily: 'sans-serif'
        }}>
          Shop not found.
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 14,
          margin: 0,
          fontFamily: 'sans-serif'
        }}>
          This link may have moved or the shop no longer exists.
        </p>
      </div>
    );
  }

  // 🔒 OFFLINE / LOCKED SCREEN
  if (shopIsOffline) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center font-sans max-w-[430px] mx-auto border-x border-[#1a1a1a]">
        <div className="text-[64px] mb-4 select-none leading-none">
          🔒
        </div>
        <div className="text-xl font-bold text-white mb-2 tracking-tight">
          This shop is temporarily offline.
        </div>
        <p className="text-white/50 text-sm leading-relaxed max-w-xs">
          Check back soon.
        </p>
      </div>
    );
  }

  // Categories & Filtering
  const availableCategories = [
    'All',
    ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))
  ];

  const categoryEmojiMap: Record<string, string> = {
    All: '🛍️',
    Tops: '👕',
    Bottoms: '👖',
    Hoodies: '🧥',
    Sneakers: '👟',
    Accessories: '💍',
    'New Drop': '🔥'
  };

  const filteredProducts = products.filter(p => {
    if (activeCategory === 'All') return true;
    const categoryLower = p.category?.toLowerCase() || '';
    const activeLower = activeCategory.toLowerCase();
    return categoryLower === activeLower;
  });

  const searchResults = searchQuery
    ? products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setActiveImageIdx(0);
    setDescExpanded(false);
    
    const available = product.sizes || [];
    if (available.length > 0) {
      const inStock = available.filter((s: any) => s.quantity > 0);
      if (inStock.length === 1) {
        setSelectedSize(inStock[0].size);
      } else {
        setSelectedSize('');
      }
    } else {
      setSelectedSize('');
    }

    const cols = product.colors || [];
    if (cols.length > 0) {
      setSelectedColor(cols[0]);
    } else {
      setSelectedColor('');
    }
  };

  // Convert ambient accent color safely to rgba for custom hero gradient overlay
  const getHeroGradient = (color: string) => {
    if (color.startsWith('rgb(')) {
      return `linear-gradient(to bottom, ${color.replace('rgb(', 'rgba(').replace(')', ', 0.2)')} 0%, rgba(0,0,0,0.5) 50%, #0a0a0a 100%)`;
    }
    return `linear-gradient(to bottom, ${color}33 0%, rgba(0,0,0,0.5) 50%, #0a0a0a 100%)`;
  };

  // Pre-prepared list of tags for products to increase excitement
  const getProductTag = (p: any, idx: number) => {
    const totalStock = p.sizes?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
    if (totalStock === 0) return 'SOLD OUT';
    
    if (p.is_featured) return 'NEW DROP';
    
    // Stagger other visual chips
    const list = ['LIMITED', 'BEST SELLER', 'NEW DROP'];
    return list[idx % list.length];
  };

  // Gather all actual images from the products of this shop
  const getLandingImages = () => {
    const images: { src: string; name: string }[] = [];
    if (products && products.length > 0) {
      products.forEach((p) => {
        if (p.images && p.images.length > 0) {
          p.images.forEach((img: string) => {
            if (img && !images.some(x => x.src === img)) {
              images.push({ src: img, name: p.name });
            }
          });
        }
      });
    }
    return images;
  };

  // Dedicated Auto-Scrolling Center-Enlarged Product Carousel
  const LandingCarousel: React.FC<{ items: { src: string; name: string }[] }> = ({ items }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
      if (items.length <= 1) return;
      const timer = setInterval(() => {
        setIndex((prev) => (prev + 1) % items.length);
      }, 3500); // Elegant 3.5s auto-scroll rate
      return () => clearInterval(timer);
    }, [items.length]);

    if (items.length === 0) {
      return (
        <div className="relative w-full h-[320px] flex flex-col items-center justify-center p-8 border border-white/5 rounded-3xl bg-white/[0.01] backdrop-blur-sm">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-[#c8ff00]" style={{ color: accent }}>
            <ShoppingBag size={24} />
          </div>
          <p className="text-white/80 font-bold text-sm text-center tracking-tight">Original Catalog Pending</p>
          <p className="text-white/45 text-xs text-center mt-2.5 max-w-[240px] leading-relaxed">
            Stay tuned! This shop will be uploading its premium selection of custom inventory shortly.
          </p>
        </div>
      );
    }

    return (
      <div className="relative w-full h-[340px] flex items-center justify-center overflow-hidden py-4">
        {items.map((item, i) => {
          // Find distance relative to center item
          let diff = i - index;
          if (diff < -Math.floor(items.length / 2)) {
            diff += items.length;
          } else if (diff > Math.floor(items.length / 2)) {
            diff -= items.length;
          }

          const isVisible = Math.abs(diff) <= 1;

          // Animations variables: Center is big (scale-1.18), left/right side are smaller
          let x = 0;
          let scale = 0.8;
          let opacity = 0.25;
          let zIndex = 11;

          if (diff === 0) {
            x = 0;
            scale = 1.18;
            opacity = 1;
            zIndex = 30;
          } else if (diff === -1) {
            x = -135;
            scale = 0.8;
            opacity = 0.45;
            zIndex = 20;
          } else if (diff === 1) {
            x = 135;
            scale = 0.8;
            opacity = 0.45;
            zIndex = 20;
          }

          return (
            <motion.div
              key={`${item.src}-${i}`}
              className="absolute flex flex-col items-center"
              initial={false}
              animate={{
                x,
                scale,
                opacity: isVisible ? opacity : 0,
                zIndex,
              }}
              transition={{
                type: 'spring',
                stiffness: 110,
                damping: 20,
              }}
            >
              <div 
                className="aspect-square w-[230px] rounded-[36px] overflow-hidden border-2 shadow-2xl relative transition-all duration-500"
                style={{
                  borderColor: diff === 0 ? accent : 'rgba(255, 255, 255, 0.05)',
                  boxShadow: diff === 0 ? `0 20px 40px -10px ${accent}35` : 'none'
                }}
              >
                <img
                  src={item.src}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  alt={item.name}
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (viewMode === 'landing') {
    const realImages = getLandingImages();
    let carouselItems = [...realImages];

    // Ensure we duplicate enough items to handle left/right continuous wrapping nicely
    let displayItems = [...carouselItems];
    if (displayItems.length === 1) {
      displayItems = [displayItems[0], displayItems[0], displayItems[0]];
    } else if (displayItems.length === 2) {
      displayItems = [displayItems[0], displayItems[1], displayItems[0], displayItems[1]];
    }

    return (
      <div className="h-screen w-full max-w-[430px] mx-auto bg-[#0a0a0a] text-white flex flex-col justify-between p-6 overflow-hidden border-x border-[#1a1a1a] shadow-2xl relative select-none">
        {shop?.isDemo && (
          <div style={{
            background: 'rgba(200,255,0,0.1)',
            borderBottom: '1px solid rgba(200,255,0,0.2)',
            padding: '8px 16px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '-24px',
            marginLeft: '-24px',
            marginRight: '-24px'
          }} className="z-20">
            <Eye size={14} color="#c8ff00" />
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#c8ff00',
              letterSpacing: '0.5px'
            }}>You are viewing a demo shop</span>
          </div>
        )}
        
        {/* Background ambient lighting */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-[#c8ff00]/10 to-transparent pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom, ${accent}15 0%, transparent 100%)` }} />
        
        {/* TOP BRAND HEADER */}
        <div className="flex flex-col items-center mt-6 z-10">
          <div className="relative">
            {shop.logo_url ? (
              <img 
                src={shop.logo_url} 
                className="w-20 h-20 rounded-full border-2 border-white/10 object-cover shadow-2xl" 
                alt={shop.name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-white/10 bg-[#111111] flex items-center justify-center font-black text-xl uppercase shadow-2xl" style={{ color: accent }}>
                {shop.name?.substring(0, 2)}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-[#0a0a0a]"></span>
            </span>
          </div>

          <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-4 text-center leading-tight">
            {shop.name}
          </h1>
          <p className="text-white/40 text-[10px] font-extrabold tracking-[0.2em] text-center uppercase mt-1">
            @{shop.handle}
          </p>
        </div>

        {/* MIDDLE PRODUCT PREVIEW CAROUSEL */}
        <div className="my-auto py-4 z-10 w-full flex items-center justify-center">
          <LandingCarousel items={displayItems} />
        </div>

        {/* BOTTOM ABOUT INFO + CTA */}
        <div className="mb-6 space-y-5 z-10 w-full">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 w-full">
            <span className="text-[9px] font-black uppercase tracking-widest block mb-1 text-center font-mono" style={{ color: accent }}>
              ABOUT OUR SHOP
            </span>
            <p className="text-white/70 text-xs font-semibold text-center leading-relaxed font-sans line-clamp-3">
              {shop.description || 'Welcome to our shop! Feel free to browse through our exclusive collections.'}
            </p>
          </div>

          <button 
            onClick={() => setViewMode('browse')}
            className="w-full h-14 text-black font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
            style={{ 
              backgroundColor: accent,
              boxShadow: `0 10px 25px -5px ${accent}40`
            }}
            onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            <span>Browse Shop</span>
            <ArrowRight size={15} className="stroke-[2.5]" />
          </button>

          <footer className="text-center pt-1">
            <span className="text-[10px] font-semibold tracking-wider text-white/20 uppercase">
              Powered by ThreadZW 🇿🇼
            </span>
          </footer>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans max-w-[430px] mx-auto border-x border-[#1a1a1a] shadow-2xl relative overflow-x-hidden">
      {shop?.isDemo && (
        <div style={{
          background: 'rgba(200,255,0,0.1)',
          borderBottom: '1px solid rgba(200,255,0,0.2)',
          padding: '8px 16px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }} className="z-20">
          <Eye size={14} color="#c8ff00" />
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#c8ff00',
            letterSpacing: '0.5px'
          }}>You are viewing a demo shop</span>
        </div>
      )}

      {/* SECTION 1 — HERO */}
      <section className="relative h-screen w-full flex flex-col justify-between overflow-hidden">
        {/* Full screen Background Banner Image */}
        <div className="absolute inset-0 z-0">
          {shop.banner_url ? (
            <img 
              src={shop.banner_url} 
              className="w-full h-full object-cover select-none" 
              alt={shop.name}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div 
              style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' }}
              className="w-full h-full"
            />
          )}
          {/* Dynamic sampled ambient gradient overlay */}
          <div 
            style={{ background: getHeroGradient(accent) }}
            className="absolute inset-0 transition-all duration-700 pointer-events-none" 
          />
        </div>

        {/* Floating Top Bar */}
        <div className="relative z-10 px-5 pt-6 flex justify-between items-center pointer-events-auto">
          {/* Back Home Button & Shop Logo Left */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setViewMode('landing')}
              className="w-10 h-10 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer focus:outline-none"
              title="Back to Welcome Page"
            >
              <ArrowLeft size={18} />
            </button>
            {shop.logo_url ? (
              <img 
                src={shop.logo_url} 
                className="w-10 h-10 rounded-xl border-2 border-white/15 object-cover" 
                alt={shop.name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl border-2 border-white/15 bg-[#111111] flex items-center justify-center font-black text-xs uppercase text-[#c8ff00]">
                {shop.name?.substring(0, 2)}
              </div>
            )}
          </div>

          {/* Search trigger Right */}
          <button 
            onClick={() => setSearchOpen(true)}
            className="w-10 h-10 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer focus:outline-none"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Hero Bottom Content */}
        <div className="relative z-10 px-5 pb-12 w-full mt-auto">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 mb-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c864]" />
            <span className="text-[10px] font-extrabold tracking-[0.15em] text-white">OPEN NOW</span>
          </div>

          {/* Shop Name */}
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-1.5 [text-shadow:0_2px_15px_rgba(0,0,0,0.6)]">
            {shop.name}
          </h1>

          {/* Tagline */}
          <p className="text-sm font-medium text-white/60 mb-5 leading-normal">
            {shop.tagline || 'Curated boutique collection.'}
          </p>

          {/* Two CTA Buttons */}
          <div className="flex gap-2.5 w-full">
            <button 
              onClick={() => productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 py-3.5 bg-[#c8ff00] text-black font-black text-[13px] tracking-wide uppercase rounded-[10px] active:scale-[0.98] transition-transform cursor-pointer text-center"
            >
              Explore Store →
            </button>
            <button 
              onClick={handleWhatsAppDirect}
              className="flex-1 py-3.5 bg-white/10 backdrop-blur-md border border-white/15 text-white font-bold text-[13px] rounded-[10px] active:scale-[0.98] transition-all cursor-pointer text-center"
            >
              💬 WhatsApp
            </button>
          </div>
        </div>

        {/* Bouncing scroll indicator */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes bounceIndicator {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
          `}} />
          <span 
            style={{ animation: 'bounceIndicator 1.8s infinite ease-in-out' }}
            className="text-white/30 text-lg font-bold"
          >
            ↓
          </span>
        </div>
      </section>

      {/* SECTION 2 — FEATURED PRODUCTS (Horizontal Scroll) */}
      {products.length > 0 && (
        <section className="pt-7 bg-[#0a0a0a]">
          {/* Section Header */}
          <div className="px-5 pb-4 flex justify-between items-center">
            <span className="text-[11px] font-extrabold tracking-[0.18em] text-white/35">NEW IN</span>
            <button 
              onClick={() => productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[13px] font-bold text-[#c8ff00] cursor-pointer"
            >
              See all →
            </button>
          </div>

          {/* Horizontal Strip */}
          <div 
            ref={scrollStripRef}
            className="flex gap-3.5 overflow-x-auto px-5 pb-3 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
          >
            {products.slice(0, 6).map((p, idx) => {
              const tag = getProductTag(p, idx);
              return (
                <div 
                  key={`featured-${p.id}`}
                  onClick={() => handleProductSelect(p)}
                  className="min-w-[200px] w-[200px] bg-[#111111] rounded-2xl overflow-hidden snap-start cursor-pointer group flex-shrink-0"
                >
                  {/* Image wrapper */}
                  <div className="h-60 relative overflow-hidden bg-zinc-900 flex items-center justify-center">
                    {p.images && p.images.length > 0 && p.images[0] ? (
                      <img 
                        src={p.images[0]} 
                        className="w-full h-full object-cover transition-transform duration-300 group-active:scale-[1.03]" 
                        alt={p.name}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#161616] flex items-center justify-center text-3xl select-none">
                        👕
                      </div>
                    )}

                    {/* Tag badge top-left */}
                    <div 
                      className={`absolute top-2.5 left-2.5 text-[9px] font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-[6px] ${
                        tag === 'SOLD OUT' 
                          ? 'bg-white/15 text-white/50' 
                          : tag === 'LIMITED' 
                          ? 'bg-white text-black' 
                          : tag === 'BEST SELLER' 
                          ? 'bg-[#eab308] text-black' 
                          : 'bg-[#c8ff00] text-black'
                      }`}
                    >
                      {tag}
                    </div>

                    {/* Gradient Overlay bottom of image */}
                    <div className="absolute inset-x-0 bottom-0 h-[60px] bg-gradient-to-t from-[#111111] to-transparent" />
                  </div>

                  {/* Text Details Section */}
                  <div className="p-3 pb-4">
                    <h3 className="text-sm font-extrabold text-white truncate mb-1.5 tracking-tight group-hover:text-[#c8ff00] transition-colors">
                      {p.name}
                    </h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[15px] font-black text-[#c8ff00]">${p.price}</span>
                      {/* Arrow Quick CTA */}
                      <div className="w-8 h-8 rounded-lg bg-[#c8ff00] text-black flex items-center justify-center font-black text-sm group-hover:translate-x-1 transition-transform">
                        →
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 3 — CATEGORIES */}
      {availableCategories.length > 0 && (
        <section className="pt-7 bg-[#0a0a0a]">
          <div className="px-5 pb-4">
            <span className="text-[11px] font-extrabold tracking-[0.18em] text-white/35 uppercase">SHOP BY</span>
          </div>

          <div 
            className="flex gap-2.5 overflow-x-auto px-5 scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {availableCategories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={`cat-${cat}`}
                  onClick={() => {
                    setActiveCategory(cat);
                  }}
                  className={`min-w-[100px] h-14 flex items-center justify-center gap-2 px-4 rounded-xl border transition-all cursor-pointer select-none focus:outline-none ${
                    isActive 
                      ? 'bg-[#c8ff00]/8 border-[#c8ff00] text-[#c8ff00]' 
                      : 'bg-[#111111] border-white/5 text-white/70 hover:border-white/10'
                  }`}
                >
                  <span className="text-lg">{categoryEmojiMap[cat] || '🛍️'}</span>
                  <span className="text-[13px] font-bold whitespace-nowrap">{cat}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 4 — FULL PRODUCT GRID */}
      <section ref={productsSectionRef} className="pt-8 pb-4 bg-[#0a0a0a]">
        {/* Header Title & Items info */}
        <div className="px-5 pb-4 flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            {activeCategory === 'All' ? 'All Products' : activeCategory}
          </h2>
          <span className="text-[13px] text-white/35 font-semibold">
            {filteredProducts.length} items
          </span>
        </div>

        {products.length === 0 ? (
          <div className="py-12 px-5 text-center flex flex-col items-center justify-center">
            <span className="text-[40px] select-none">📦</span>
            <p className="text-white/35 text-sm mt-3 font-semibold">
              No products yet.
            </p>
            <p className="text-white/20 text-xs mt-1">
              Check back soon.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 px-5 text-center flex flex-col items-center justify-center">
            <span className="text-[40px] select-none">📦</span>
            <p className="text-white/35 text-sm mt-3 font-semibold">
              No products matching this category.
            </p>
          </div>
        ) : (
          /* Smooth animated block update */
          <motion.div 
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="w-full flex flex-col"
          >
            {/* FIRST Product - Full Width Feature Spotlight Card */}
            {filteredProducts.slice(0, 1).map((p, idx) => {
              const tag = getProductTag(p, idx);
              return (
                <div 
                  key={`featured-spotlight-${p.id}`}
                  onClick={() => handleProductSelect(p)}
                  className="w-[calc(100%-40px)] mx-5 mb-5 h-[300px] rounded-2xl overflow-hidden relative cursor-pointer group flex items-center justify-center"
                >
                  {/* Image full layer */}
                  {p.images && p.images.length > 0 && p.images[0] ? (
                    <img 
                      src={p.images[0]} 
                      className="absolute inset-0 w-full h-full object-cover select-none transition-transform duration-300 group-active:scale-[1.02]" 
                      alt={p.name}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-[#161616] flex items-center justify-center text-5xl select-none">
                      👕
                    </div>
                  )}

                  {/* Gradient bottom shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

                  {/* Tag top left */}
                  <div 
                    className={`absolute top-4 left-4 text-[9px] font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-[6px] ${
                      tag === 'SOLD OUT' 
                        ? 'bg-white/15 text-white/50' 
                        : 'bg-[#c8ff00] text-black'
                    }`}
                  >
                    {tag}
                  </div>

                  {/* Bottom Text layer */}
                  <div className="absolute bottom-0 inset-x-0 p-4 pb-5 flex flex-col pointer-events-none">
                    <h3 className="text-xl font-black uppercase text-white tracking-tight mb-1">
                      {p.name}
                    </h3>
                    <span className="text-lg font-black text-[#c8ff00]">
                      ${p.price}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* REST Products - 2 Column Clean Uniform Grid */}
            {filteredProducts.length > 1 && (
              <div className="px-5 grid grid-cols-2 gap-3 pb-4">
                {filteredProducts.slice(1).map((p, idx) => {
                  return (
                    <div 
                      key={`grid-${p.id}`}
                      onClick={() => handleProductSelect(p)}
                      className="bg-[#111111] rounded-2xl overflow-hidden cursor-pointer group"
                    >
                      {/* aspect 3/4 Image header */}
                      <div className="aspect-[3/4] relative overflow-hidden bg-zinc-900 flex items-center justify-center">
                        {p.images && p.images.length > 0 && p.images[0] ? (
                          <img 
                            src={p.images[0]} 
                            className="w-full h-full object-cover select-none transition-transform duration-300 group-active:scale-[1.03]" 
                            alt={p.name}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#161616] flex items-center justify-center text-3xl select-none">
                            👕
                          </div>
                        )}
                      </div>

                      {/* Summary contents below */}
                      <div className="p-3.5 pb-4">
                        <h4 className="text-[13px] font-extrabold text-white leading-normal line-clamp-2 tracking-tight mb-2 group-hover:text-[#c8ff00] transition-colors">
                          {p.name}
                        </h4>
                        <span className="text-[15px] font-black text-[#c8ff00] block mt-auto">
                          ${p.price}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* SECTION 5 — ABOUT THE SHOP */}
      <section className="mx-5 my-7 bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
        {/* Banner header strips */}
        <div className="h-20 bg-zinc-900 relative">
          {shop.banner_url ? (
            <img 
              src={shop.banner_url} 
              className="w-full h-full object-cover opacity-50 select-none" 
              alt="header"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div 
              style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' }}
              className="w-full h-full opacity-50"
            />
          )}
        </div>

        {/* Content body padding */}
        <div className="px-4.5 pb-5 pt-3">
          {/* Logo overlaps banner header */}
          <div className="flex gap-3 mb-3.5 items-start">
            {shop.logo_url ? (
              <img 
                src={shop.logo_url} 
                className="w-12 h-12 rounded-full border-2 border-white/10 object-cover mt-[-24px] bg-[#111]" 
                alt="logo"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-white/10 bg-[#111111] mt-[-24px] flex items-center justify-center font-black text-xs text-[#c8ff00]">
                {shop.name?.split(' ').filter(Boolean).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'SZ'}
              </div>
            )}
            <div>
              <h3 className="text-[18px] font-black text-white tracking-tight mt-1">{shop.name}</h3>
              <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase block mt-0.5">
                @{shop.handle}
              </span>
            </div>
          </div>

          <p className="text-sm font-medium text-white/60 leading-relaxed mb-4.5">
            {shop.description || shop.about_text || 'Welcome to our shop! Feel free to browse through our exclusive collections.'}
          </p>

          {/* Location info list */}
          <div className="border-t border-white/5 mb-5">
            {(shop.location || shop.landmark || shop.physical_address || shop.suburb || shop.city) && (
              <div className="flex items-center gap-3 py-3 border-b border-white/5 text-[13px] text-white/65">
                <span className="text-base select-none">📍</span>
                <span className="font-medium truncate">
                  {[shop.location || shop.landmark || shop.physical_address, shop.suburb, shop.city].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {getDisplayHours(shop) && (
              <div className="flex items-center gap-3 py-3 border-b border-white/5 text-[13px] text-white/65">
                <span className="text-base select-none">🕐</span>
                <span className="font-semibold">{getDisplayHours(shop)}</span>
              </div>
            )}

            <div className="flex items-center gap-3 py-3 border-b border-white/5 text-[13px] text-white/65">
              <span className="text-base select-none">📦</span>
              <span className="font-medium">Collection & Nationwide Courier Delivery</span>
            </div>

            {shop.instagram && (
              <button 
                onClick={() => window.open(`https://instagram.com/${shop.instagram.replace('@', '')}`, '_blank')}
                className="w-full flex items-center gap-3 py-3 text-[13px] text-white/65 hover:text-[#c8ff00] transition-colors focus:outline-none"
              >
                <Instagram size={14} className="text-white/40 group-hover:text-[#c8ff00]" />
                <span className="font-semibold select-none group-hover:underline">@{shop.instagram.replace('@', '')}</span>
              </button>
            )}
          </div>

          {/* CTA Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button 
              onClick={handleWhatsAppDirect}
              className="py-3 bg-[#25D366] text-white font-extrabold text-[13px] rounded-[10px] active:scale-[0.98] transition-transform cursor-pointer text-center"
            >
              💬 Order on WhatsApp
            </button>

            <button 
              onClick={() => setShowVisitPopup(true)}
              className="py-3 bg-white/5 border border-white/10 text-white font-bold text-[13px] rounded-[10px] active:scale-[0.98] transition-all cursor-pointer text-center"
            >
              📍 Visit Shop
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 6 — FOOTER */}
      <footer className="pt-6 pb-12 text-center bg-black">
        <a 
          href="https://threadzw.vercel.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block text-[12px] font-medium tracking-wide text-white/20 hover:text-white/40 transition-colors cursor-pointer"
        >
          Powered by <span className="text-white/25 hover:text-white/45 font-semibold">ThreadZW 🇿🇼</span>
        </a>
      </footer>

      {/* SEARCH OVERLAY SCREEN */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 top-0 bottom-0 max-w-[430px] mx-auto bg-[#0a0a0aw] bg-black/95 backdrop-blur-2xl z-50 flex flex-col"
          >
            {/* Search Header input bar */}
            <div className="p-4 flex gap-3 items-center border-b border-white/5 bg-[#0a0a0a]/90">
              <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-[10px] px-3.5 focus-within:border-[#c8ff00] transition-colors">
                <Search size={16} className="text-white/30 mr-2.5" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..." 
                  autoFocus
                  className="w-full h-11 bg-transparent border-none text-white placeholder-white/30 text-sm focus:outline-none focus:ring-0"
                />
              </div>

              {/* Close Button */}
              <button 
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="w-11 h-11 rounded-[10px] bg-white/5 border border-white/5 flex items-center justify-center text-white active:scale-95 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Search result area scroll container */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
              {searchQuery ? (
                searchResults.length === 0 ? (
                  <div className="text-center py-20 text-white/35 text-sm">
                    Nothing found for '{searchQuery}'
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {searchResults.map((p) => {
                      return (
                        <div 
                          key={`search-${p.id}`}
                          onClick={() => {
                            setSearchOpen(false);
                            handleProductSelect(p);
                          }}
                          className="bg-[#111111] rounded-2xl overflow-hidden cursor-pointer"
                        >
                          <div className="aspect-[3/4] bg-zinc-900">
                            <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400'} className="w-full h-full object-cover" alt={p.name} referrerPolicy="no-referrer" />
                          </div>
                          <div className="p-3">
                            <h4 className="text-[13px] font-extrabold text-white truncate">{p.name}</h4>
                            <span className="text-sm font-black text-[#c8ff00] block mt-1">${p.price}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-24 text-white/20 text-xs uppercase tracking-[0.2em] font-extrabold">
                  Type to start searching...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VISIT SHOP DIALOG SHEET */}
      <AnimatePresence>
        {showVisitPopup && (
          <>
            {/* Overlay tint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVisitPopup(false)}
              className="fixed inset-0 bg-black/70 z-50 transition-opacity"
            />
            
            {/* Slide-Up container sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#161616] border-t border-white/10 rounded-t-[20px] z-50 p-6 pb-9 shadow-2xl"
            >
              {/* Handle bar anchor */}
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-6" />

              {/* Header logo shop */}
              <div className="flex items-center gap-3.5 mb-6">
                {shop.logo_url ? (
                  <img src={shop.logo_url} className="w-12 h-12 rounded-full border border-white/10 object-cover" alt="shop logo" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-full border border-white/10 bg-[#111] flex items-center justify-center text-white font-black uppercase text-sm">
                    {shop.name?.substring(0, 2)}
                  </div>
                )}
                <div>
                  <h4 className="font-extrabold text-white text-[17px] tracking-tight">{shop.name}</h4>
                  <p className="text-white/35 text-[11px] font-bold tracking-[0.05em] uppercase">📍 SHOP DETAILS & LANDMARK</p>
                </div>
              </div>

              {/* Data boxes */}
              <div className="bg-[#111111] border border-white/5 rounded-xl p-4.5 space-y-4 mb-7">
                <div>
                  <span className="text-[10px] text-white/30 font-black uppercase tracking-widest block mb-1">📍 Physical Address</span>
                  <p className="text-white text-sm font-semibold leading-relaxed">
                    {[shop.location || shop.landmark || shop.physical_address, shop.suburb, shop.city].filter(Boolean).join(', ') || 'Cnr Sam Nujoma & Jason Moyo Ave, Harare, Zimbabwe'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-white/30 font-black uppercase tracking-widest block mb-1">🕐 Opening Hours</span>
                  <p className="text-white text-sm font-semibold leading-relaxed">
                    {shop.hours || 'Mon - Sat: 8:00 AM - 5:30 PM'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-white/30 font-black uppercase tracking-widest block mb-1">📦 Collection Instructions</span>
                  <p className="text-white text-sm font-medium leading-relaxed">
                    {shop.pickup_info || 'Immediate collection from our downtown Harare location, or select nationwide express bus delivery.'}
                  </p>
                </div>
              </div>

              {/* Directions Trigger CTA */}
              <button
                onClick={handleVisitDirections}
                className="w-full py-4 bg-[#c8ff00] text-black font-black uppercase text-sm tracking-wider rounded-[10px] transition-transform active:scale-[0.98] cursor-pointer text-center"
              >
                🗺️ Get Directions
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PRODUCT DETAIL SLIDE-UP OVERLAY PAGE */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-40 bg-[#0a0a0a] overflow-y-auto max-w-[430px] mx-auto pb-24"
          >
            {/* Header control buttons */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer focus:outline-none"
              >
                <ArrowLeft size={18} />
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: selectedProduct.name,
                      text: `Check out ${selectedProduct.name} at ${shop.name}! Explore premium collections.`,
                      url: window.location.href
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('Link copied to clipboard! 🔗', 'success');
                  }
                }}
                className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer focus:outline-none"
              >
                <Share2 size={16} />
              </button>
            </div>

            {/* IMAGE GALERY */}
            <div className="relative h-[420px] overflow-hidden bg-[#111111]">
              <div 
                className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory h-full"
                style={{ scrollbarWidth: 'none' }}
                onScroll={(e) => {
                  const width = e.currentTarget.clientWidth;
                  const scrollLeft = e.currentTarget.scrollLeft;
                  const index = Math.round(scrollLeft / width);
                  if (index !== activeImageIdx) {
                    setActiveImageIdx(index);
                  }
                }}
              >
                {(selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : ['https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600']).map((img: string, i: number) => (
                  <div key={`${selectedProduct.id}-img-${i}`} className="min-w-full h-full snap-start select-none">
                    <img src={img} className="w-full h-full object-cover" alt="product gallery" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>

              {/* Pagination Dots */}
              {((selectedProduct.images && selectedProduct.images.length > 1) ? selectedProduct.images : []).length > 1 && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                  {selectedProduct.images.map((_: any, idx: number) => {
                    const isActive = idx === activeImageIdx;
                    return (
                      <div
                        key={`dot-${idx}`}
                        style={{
                          width: isActive ? '20px' : '6px',
                          backgroundColor: isActive ? '#c8ff00' : 'rgba(255, 255, 255, 0.3)',
                          height: '6px',
                          borderRadius: '3px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Ambient atmospheric bottom gradient shadow */}
              <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
            </div>

            {/* PRODUCT METADATA */}
            <div className="px-5 pt-3">
              {selectedProduct.tag && (
                <div className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded bg-[#c8ff00] text-black mb-3.5 select-none">
                  {selectedProduct.tag}
                </div>
              )}

              <h2 className="text-[26px] font-black uppercase tracking-tight text-white leading-tight mb-1.5">
                {selectedProduct.name}
              </h2>

              <div className="text-[30px] font-black text-[#c8ff00] mb-6">
                ${selectedProduct.price}
              </div>

              {/* Optional Color dots block */}
              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div className="mb-6">
                  <span className="text-[10px] font-black tracking-widest text-white/35 block mb-2 uppercase">COLOUR</span>
                  <div className="flex items-center gap-3">
                    {selectedProduct.colors.map((c: string) => {
                      const isSelected = selectedColor === c;
                      return (
                        <button
                          key={`col-${c}`}
                          onClick={() => setSelectedColor(c)}
                          className={`w-8 h-8 rounded-full cursor-pointer transition-all focus:outline-none ${
                            isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: getColorHex(c) }}
                        />
                      );
                    })}
                  </div>
                  {selectedColor && (
                    <span className="text-xs font-semibold text-white/50 block mt-2 capitalize">Selected: {selectedColor}</span>
                  )}
                </div>
              )}

              {/* Size Selector Box container */}
              <div className="mb-6">
                <span className="text-[10px] font-black tracking-widest text-white/35 block mb-2 uppercase">SELECT SIZE</span>
                <div className="flex flex-wrap gap-2.5">
                  {(selectedProduct.sizes && selectedProduct.sizes.length > 0 
                    ? selectedProduct.sizes 
                    : [{ size: 'FREE', quantity: 99 }]
                  ).map((sz: any) => {
                    const isAvailable = sz.quantity > 0;
                    const isSelected = selectedSize === sz.size;

                    if (!isAvailable) {
                      return (
                        <div
                          key={`sz-sold-${sz.size}`}
                          className="min-w-[52px] h-[52px] flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.05] text-white/20 font-black text-sm select-none line-through"
                        >
                          {sz.size}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={`sz-${sz.size}`}
                        onClick={() => setSelectedSize(sz.size)}
                        className={`min-w-[52px] h-[52px] px-3 flex items-center justify-center rounded-xl font-black text-sm transition-all focus:outline-none cursor-pointer ${
                          isSelected 
                            ? 'bg-[#c8ff00]/10 border-2 border-[#c8ff00] text-[#c8ff00]'
                            : 'bg-white/[0.06] border-1.5 border-white/[0.12] text-white hover:border-white/30'
                        }`}
                      >
                        {sz.size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expanded Description layout */}
              {selectedProduct.description && (
                <div className="border-t border-white/5 pt-5 mb-6">
                  <span className="text-[10px] font-black tracking-widest text-white/35 block mb-2 uppercase">DESCRIPTION</span>
                  <div className={`text-sm text-white/60 leading-relaxed font-medium ${descExpanded ? '' : 'line-clamp-2'}`}>
                    {selectedProduct.description}
                  </div>
                  {selectedProduct.description.length > 80 && (
                    <button
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="text-white text-xs font-bold mt-2 hover:text-[#c8ff00] transition-colors focus:outline-none"
                    >
                      {descExpanded ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* STICKY BOTTOM BUTTON PANEL */}
            <div className="sticky bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent z-10 flex gap-2.5">
              <button
                onClick={handleOrderCheckout}
                className="flex-1 py-4 bg-[#c8ff00] text-black font-black text-sm tracking-wider uppercase rounded-[10px] transition-transform active:scale-[0.98] hover:bg-[#b5e600] shadow-xl shadow-[#c8ff00]/5 cursor-pointer text-center focus:outline-none"
              >
                💬 Order on WhatsApp
              </button>

              <button
                onClick={() => setShowVisitPopup(true)}
                className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm tracking-wider uppercase rounded-[10px] transition-all active:scale-[0.98] cursor-pointer text-center focus:outline-none"
              >
                📍 Visit Shop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export const StorefrontPage = PublicShopPage;

