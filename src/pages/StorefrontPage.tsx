// src/pages/StorefrontPage.tsx
import React, { 
  useState, 
  useEffect, 
  useMemo,
  useCallback,
  useRef
} from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ShopLogo, 
  ProductImage,
  resolveImageUrl,
  ImageWithSkeleton,
  ShopBanner
} from '../components/ui/ShopImage';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { getAppOrigin } from '../utils/shopUrl';
import { 
  Search, 
  Menu, 
  X, 
  Share2, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  ShoppingBag, 
  Check,
  ChevronRight,
  Filter,
  Info,
  Calendar,
  MessageCircle,
  Instagram,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  Mail,
  ShieldCheck,
  Truck,
  RotateCcw,
  FileText
} from 'lucide-react';

const showToast = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg)
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
  sneakers: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
  hoodies: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80',
  caps: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80',
  accessories: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80',
  tees: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80',
  shirts: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80',
  outerwear: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80'
};

const getCategoryCover = (catName: string, customUrl?: string | null): string => {
  if (customUrl) {
    const resolved = resolveImageUrl(customUrl);
    if (resolved) return resolved;
  }
  const nameLower = catName.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_FALLBACKS)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return val;
    }
  }
  return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80';
};

const formatWhatsAppNumber = (num: string): string => {
  let clean = num.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '263' + clean.substring(1);
  } else if (clean.length === 9 && (clean.startsWith('77') || clean.startsWith('71') || clean.startsWith('73') || clean.startsWith('78'))) {
    clean = '263' + clean;
  }
  return clean;
};

// Cart Item layout
interface CartItem {
  id: string; // unique item id based on product, size, and color
  product: any;
  size: string;
  color: string;
  quantity: number;
}

export const StorefrontPage: React.FC = () => {
  const { slug, productId: routeProductId, categoryId: routeCategoryId } = useParams<{ slug: string; productId?: string; categoryId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Shop, Products & Categories States
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart State (Persisted)
  const [cart, setCart] = useState<CartItem[]>([]);

  // Search Filter Query
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Category State Filter (Sticky Category on Homepage)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // URL Query Parameters mapping to Overlays
  const activeOverlay = searchParams.get('overlay');
  const overlayId = searchParams.get('id');
  const policyType = searchParams.get('type');

  // Swipe gesture mock/state for simple tracking
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null);

  // Load cart from localStorage based on shop id
  useEffect(() => {
    if (shop?.id) {
      const stored = localStorage.getItem(`threadzw_cart_${shop.id}`);
      if (stored) {
        try {
          setCart(JSON.parse(stored));
        } catch (_) {}
      }
      const searches = localStorage.getItem(`threadzw_searches_${shop.id}`);
      if (searches) {
        try {
          setRecentSearches(JSON.parse(searches));
        } catch (_) {}
      }
    }
  }, [shop?.id]);

  // Save cart modifications
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    if (shop?.id) {
      localStorage.setItem(`threadzw_cart_${shop.id}`, JSON.stringify(newCart));
    }
  };

  // Add Item to Cart
  const addToCart = (product: any, size: string, color: string) => {
    const itemUniqueId = `${product.id}-${size}-${color}`;
    const existingIdx = cart.findIndex(item => item.id === itemUniqueId);

    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      saveCart(updated);
    } else {
      const item: CartItem = {
        id: itemUniqueId,
        product,
        size,
        color,
        quantity: 1
      };
      saveCart([...cart, item]);
    }
    showToast.success(`Added ${product.name} to Cart`);
  };

  // Update Cart Quantity
  const updateCartQuantity = (itemId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.id === itemId) {
        const nextQty = item.quantity + delta;
        return { ...item, quantity: nextQty > 0 ? nextQty : 1 };
      }
      return item;
    });
    saveCart(updated);
  };

  // Remove Item from Cart
  const removeCartItem = (itemId: string) => {
    const updated = cart.filter(item => item.id !== itemId);
    saveCart(updated);
    showToast.success('Item removed from cart');
  };

  // Cart Subtotal
  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [cart]);

  // Extract immutable shop ID and slug from pathname or routes
  const { pathShopId, pathSlug } = useMemo(() => {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    
    let slugAndIdStr = slug || '';
    let isSFormat = false;

    if (parts.length > 0) {
      if (parts[0] === 's') {
        isSFormat = true;
        slugAndIdStr = parts[1] || '';
      } else if (parts[0] === 'shop' || parts[0] === 'store') {
        slugAndIdStr = parts[1] || '';
      } else {
        slugAndIdStr = parts[0] || '';
      }
    }

    try {
      slugAndIdStr = decodeURIComponent(slugAndIdStr);
    } catch (_) {}

    let extractedId: string | null = null;
    let extractedSlug: string | null = null;

    if (isSFormat || parts[0] === 'shop' || parts[0] === 'store') {
      extractedId = slugAndIdStr;
    } else if (slugAndIdStr.includes('--')) {
      const idx = slugAndIdStr.lastIndexOf('--');
      extractedSlug = slugAndIdStr.substring(0, idx);
      extractedId = slugAndIdStr.substring(idx + 2);
    } else {
      extractedSlug = slugAndIdStr;
    }

    if (extractedId) {
      extractedId = extractedId.trim();
    }
    if (extractedSlug) {
      extractedSlug = extractedSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    }

    return { pathShopId: extractedId, pathSlug: extractedSlug };
  }, [location.pathname, slug]);

  // Clean and parse Slug for resilient URL lookup
  const cleanSlug = useMemo(() => {
    if (pathSlug) return pathSlug;
    const activeSlug = slug || (window.location.pathname.toLowerCase().replace(/\/$/, '').endsWith('/demo') ? 'demo' : null);
    if (!activeSlug) return null;
    let decoded = activeSlug;
    try {
      decoded = decodeURIComponent(activeSlug);
    } catch (_) {}
    return decoded
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_-]/g, '');
  }, [slug, pathSlug]);

  // Helper to open / close URL-based overlays
  const openOverlay = useCallback((overlayName: string, id?: string, extraParams?: Record<string, string>) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('overlay', overlayName);
    if (id) {
      nextParams.set('id', id);
    } else {
      nextParams.delete('id');
    }
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => nextParams.set(k, v));
    } else {
      nextParams.delete('type');
    }
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  const closeOverlay = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('overlay');
    nextParams.delete('id');
    nextParams.delete('type');
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  // Route support for products routing mapping
  useEffect(() => {
    if (routeProductId) {
      openOverlay('product', routeProductId);
    }
    if (routeCategoryId) {
      setActiveCategoryFilter(routeCategoryId);
    }
  }, [routeProductId, routeCategoryId, openOverlay]);

  // Persistent shop lookup
  const loadStorefront = useCallback(async () => {
    // Reset any previously active store state immediately to avoid showing unrelated/cached shops
    setShop(null);
    setProducts([]);

    if (!pathShopId && !pathSlug && !cleanSlug) {
      setError('not_found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let shopData = null;
      let uuidProduct = null;

      // Check if direct product routing UUID is provided
      const checkProductId = routeProductId || searchParams.get('id');
      if (checkProductId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(checkProductId.trim())) {
        try {
          const { data: dbProd } = await supabase
            .from('products')
            .select('*')
            .eq('id', checkProductId.trim())
            .maybeSingle();

          if (dbProd) {
            uuidProduct = dbProd;
            if (dbProd.shop_id) {
              const { data: dbShop } = await supabase
                .from('shops')
                .select('*')
                .eq('id', dbProd.shop_id)
                .maybeSingle();

              if (dbShop) {
                shopData = dbShop;
              }
            }
          }
        } catch (_) {}
      }

      // If id is not explicitly a separate product mapping, fallback to parsed slug or handle
      const rawId = pathShopId ? pathShopId.trim() : (pathSlug || cleanSlug || '').trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
      const isMalformed = rawId && !isUUID && (rawId.includes('-') || rawId.length === 36 || /^[0-9a-f-]{30,40}$/i.test(rawId));

      // 8. Validation logging for malformed UUIDs
      if (isMalformed) {
        console.warn('[Storefront Diagnostics] Malformed UUID pattern detected for incoming store lookup:', rawId);
      }

      // Query strictly by immutable ID first if available
      if (!shopData && rawId) {
        if (isUUID) {
          try {
            const { data, error: queryErr } = await supabase
              .from('shops')
              .select('*')
              .eq('id', rawId)
              .maybeSingle();
            
            if (queryErr) {
              console.error('[Storefront Diagnostics] Error querying store by ID:', queryErr);
            }
            if (data) shopData = data;
          } catch (err) {
            console.error('[Storefront Diagnostics] Exception during store ID query:', err);
          }
        } else {
          // Fallback to fetch by slug or handle if not a UUID format
          try {
            const { data: byHandle } = await supabase
              .from('shops')
              .select('*')
              .eq('handle', rawId.toLowerCase())
              .maybeSingle();
            
            if (byHandle) {
              shopData = byHandle;
            } else {
              const { data: bySlug } = await supabase
                .from('shops')
                .select('*')
                .eq('slug', rawId.toLowerCase())
                .maybeSingle();
              if (bySlug) shopData = bySlug;
            }
          } catch (err) {
            console.error('[Storefront Diagnostics] Exception during store slug fallback query:', err);
          }
        }
      }

      // 5. Log incoming store ID and database query result
      console.log('[Storefront Diagnostics] Storefront lookup diagnostics:', {
        incomingStoreId: rawId || 'none',
        isUUID,
        isMalformed,
        databaseQueryResult: shopData ? { id: shopData.id, name: shopData.name, slug: shopData.slug, handle: shopData.handle } : 'no_matching_store_found'
      });

      console.log("Stores returned:", shopData ? [shopData] : []);
      console.log("Store count:", shopData ? 1 : 0);

      // Verify store exists. If store does not exist, show "Store Not Found"
      if (!shopData) {
        console.warn('[Storefront Diagnostics] No matching shop record found in database. Showing Store Not Found.');
        setError('not_found');
        setLoading(false);
        setShop(null);
        return;
      }

      setShop(shopData);

      // Load products belonging to shop
      let productList: any[] = [];
      try {
        const { data: productsData, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopData.id);
        
        if (prodErr) {
          console.error('[Storefront Diagnostics] Error loading products for store:', prodErr);
        }
        productList = productsData || [];
      } catch (err) {
        console.error('[Storefront Diagnostics] Exception loading products:', err);
      }

      // 5. Log number of products found
      console.log('[Storefront Diagnostics] Products query result:', {
        storeId: shopData.id,
        numberOfProductsFound: productList.length
      });

      // Sort logic
      productList = [...productList].sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      if (uuidProduct && !productList.some(p => p.id === uuidProduct.id)) {
        productList.push(uuidProduct);
      }
      productList = productList.filter(p => p.is_published !== false);
      setProducts(productList);

      // Categories
      let fetchedCategories: any[] = [];
      try {
        const { data: catData } = await supabase
          .from('global_categories')
          .select('*')
          .eq('visible', true)
          .order('sort_order', { ascending: true });
        if (catData) fetchedCategories = catData;
      } catch (_) {}

      // Filter category names mapping with local active products
      const activeCategoryNames = new Set(productList.map(p => p.category?.trim().toLowerCase()).filter(Boolean));
      let matchedCategories = fetchedCategories.filter(cat => 
        cat.visible && activeCategoryNames.has(cat.name?.trim().toLowerCase())
      );

      setCategories(matchedCategories);
    } catch (err) {
      console.error(err);
      setError('not_found');
    } finally {
      setLoading(false);
    }
  }, [cleanSlug, slug, pathShopId, pathSlug, routeProductId, searchParams, location.pathname, navigate]);

  useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  // Handle Swipe-down mock layout
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartY !== null) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - swipeStartY;
      if (diff > 120) {
        closeOverlay();
        setSwipeStartY(null);
      }
    }
  };

  // Categories count computation
  const getProductCountForCategory = (categoryName: string) => {
    return products.filter(p => p.category?.trim().toLowerCase() === categoryName.trim().toLowerCase()).length;
  };

  // Filtered Products for homepage rendering
  const displayedProducts = useMemo(() => {
    let list = products;
    if (activeCategoryFilter !== 'all') {
      list = products.filter(p => p.category?.trim().toLowerCase() === activeCategoryFilter.trim().toLowerCase());
    }
    if (searchQuery.trim()) {
      list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())));
    }
    return list;
  }, [products, activeCategoryFilter, searchQuery]);

  // Product categories partitioning
  const featuredProducts = useMemo(() => {
    return displayedProducts.filter(p => p.is_featured);
  }, [displayedProducts]);

  const newArrivals = useMemo(() => {
    return displayedProducts.filter(p => !p.is_featured);
  }, [displayedProducts]);

  const bestSellers = useMemo(() => {
    // Top 4 active pieces
    return displayedProducts.slice(0, 4);
  }, [displayedProducts]);

  // Fetch product for Product Detail overlay
  const selectedProduct = useMemo(() => {
    if (activeOverlay === 'product' && overlayId) {
      return products.find(p => p.id === overlayId);
    }
    return null;
  }, [activeOverlay, overlayId, products]);

  // WhatsApp checkout string generation
  const handleCartCheckoutWhatsApp = () => {
    if (cart.length === 0 || !shop) return;
    const rawNum = shop.whatsapp_number || '+263777123456';
    const cleanPhone = formatWhatsAppNumber(rawNum);

    let itemsText = `Yo *${shop.name}*, I would like to order details:\n\n`;
    cart.forEach((item, idx) => {
      itemsText += `📦 *[${idx + 1}] ${item.product.name}*\n`;
      itemsText += `   Attributes: Size - ${item.size} | Colour - ${item.color || 'Default'}\n`;
      itemsText += `   Quantity: ${item.quantity} x $${item.product.price}\n\n`;
    });

    itemsText += `🔗 Shop Link: ${getAppOrigin()}/shop/${shop.slug || 'demo'}\n`;
    itemsText += `💵 *Subtotal: $${cartSubtotal} USD*\n\n`;
    itemsText += `Please initiate instructions for shipping/delivery instructions. Thank you!`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(itemsText)}`;
    window.open(waUrl, '_blank');
  };

  // Add search tags to recent
  const addSearchQueryToRecent = (val: string) => {
    if (!val.trim()) return;
    const cleanVal = val.trim();
    const updated = [cleanVal, ...recentSearches.filter(s => s !== cleanVal)].slice(0, 5);
    setRecentSearches(updated);
    if (shop?.id) {
      localStorage.setItem(`threadzw_searches_${shop.id}`, JSON.stringify(updated));
    }
  };

  // Custom styling constants
  const greenHighlight = '#C6FF00';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center font-sans tracking-widest gap-4">
        <div className="w-12 h-12 rounded-full border border-t-2 border-t-[#C6FF00] border-white/10 animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 animate-pulse">
          Loading ThreadZW Boutique
        </span>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 text-center font-sans gap-4">
        <ShoppingBag className="w-16 h-16 text-[#C6FF00] opacity-80" />
        <h1 className="text-xl font-black uppercase tracking-widest font-sans">Store Not Found</h1>
        <p className="text-zinc-400 text-xs max-w-xs leading-relaxed">
          This store may have been removed or the link is invalid.
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-6 px-6 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-[0.15em] rounded-full hover:bg-[#C6FF00] hover:text-black transition-all cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex justify-center font-sans">
      {/* Centered Mobile Frame container on desktop */}
      <div className="w-full max-w-[480px] bg-[#000000] min-h-screen flex flex-col relative border-x border-white/[0.06] shadow-2xl relative select-none">
        
        {/* -------------------------------------------------------------
            BASE SCREEN HEADER
            ------------------------------------------------------------- */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md px-5 py-3.5 flex items-center justify-between border-b border-white/[0.04]">
          <button 
            type="button" 
            onClick={() => openOverlay('menu')}
            className="p-1 text-zinc-300 hover:text-[#C6FF00] transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-6 h-6 stroke-[2]" />
          </button>

          <span className="font-black text-sm uppercase tracking-[0.25em] font-sans text-white">
            {shop.name}
          </span>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => openOverlay('search')}
              className="p-1.5 text-zinc-300 hover:text-[#C6FF00] transition-colors cursor-pointer"
              title="Search products"
            >
              <Search className="w-5.5 h-5.5 stroke-[2]" />
            </button>
            
            <button 
              type="button" 
              onClick={() => openOverlay('cart')}
              className="p-1.5 text-zinc-300 hover:text-[#C6FF00] transition-colors cursor-pointer relative"
              title="View Cart"
            >
              <ShoppingBag className="w-5.5 h-5.5 stroke-[2]" />
              {cart.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-[#C6FF00] text-black text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* -------------------------------------------------------------
            BASE MAIN VIEW (SCROLLABLE HOME)
            ------------------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto pb-12">
          
          {/* Shop Hero Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-4"
          >
            <div className="bg-[#111111]/90 rounded-[20px] border border-white/[0.06] overflow-hidden p-2.5 shadow-lg relative">
              {/* Short Banner */}
              <div className="relative h-20 rounded-[14px] overflow-hidden bg-zinc-950">
                <ShopBanner shop={shop} height="100%" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              </div>

              {/* Business Identity */}
              <div className="flex items-center gap-3.5 px-1.5 pt-3 pb-0.5">
                {/* Logo */}
                <div className="w-13 h-13 rounded-full border border-white/[0.1] shadow-md bg-black overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <ShopLogo shop={shop} size="100%" className="w-full h-full rounded-full object-cover" />
                </div>

                <div className="space-y-0.5 min-w-0 flex-1 text-left">
                  <h2 onClick={() => openOverlay('info')} className="text-sm font-black uppercase tracking-wide font-sans text-white hover:text-[#C6FF00] transition-colors cursor-pointer truncate">
                    {shop.name}
                  </h2>
                  <p className="text-zinc-400 text-[10px] leading-tight truncate">
                    {shop.description || 'Nulla Clothing Official Storefront'}
                  </p>
                  
                  {/* Status & Location as a single line matching the sketch */}
                  <div className="flex items-center gap-2 pt-0.5 text-[8px] uppercase font-bold tracking-wider text-zinc-500 font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
                      Online
                    </span>
                    <span>●</span>
                    <span className="flex items-center gap-0.5 text-zinc-300">
                      <MapPin className="w-2.5 h-2.5 text-[#C6FF00] inline" />
                      {shop.city || 'Bulawayo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Side-by-Side Products Grid */}
          <div className="px-4">
            {displayedProducts.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 space-y-2">
                <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto" />
                <p className="text-xs uppercase tracking-widest font-mono">No garment pieces found</p>
                {searchQuery && <p className="text-[10px] text-zinc-650">Try clearing custom search queries.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {displayedProducts.map((p, idx) => (
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    key={`product-${p.id || idx}`}
                    onClick={() => openOverlay('product', p.id)}
                    className="bg-[#111111]/40 border border-white/[0.04] rounded-[16px] overflow-hidden group hover:border-[#C6FF00]/25 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="aspect-[3/4] bg-zinc-950 w-full overflow-hidden relative">
                      <ProductImage product={p} index={0} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                      {p.original_price && p.original_price > p.price && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[7px] font-bold uppercase px-1 py-0.5 rounded">
                          Sale
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2.5 space-y-0.5 text-left border-t border-white/[0.02]">
                      <h4 className="text-[11px] font-bold uppercase truncate text-zinc-200 group-hover:text-white transition-colors">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-[#C6FF00] font-mono">${p.price}</span>
                        {p.original_price && p.original_price > p.price && (
                          <span className="text-[9px] text-zinc-500 line-through font-mono">${p.original_price}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </main>

        {/* -------------------------------------------------------------
            OVERLAYS SYSTEM USING FRAMER MOTION & ROUTER PORTALS
            ------------------------------------------------------------- */}
        <AnimatePresence mode="wait">
          
          {/* 1. MORE MENU OVERLAY */}
          {activeOverlay === 'menu' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end"
              onClick={closeOverlay}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[480px] bg-[#111111] rounded-t-[24px] border-t border-white/[0.08] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                {/* Swipe Handle Pill */}
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3.5 mb-2 cursor-pointer" onClick={closeOverlay} />

                <div className="px-5 pb-5 flex items-center justify-between border-b border-white/[0.05]">
                  <span className="text-[10px] font-extrabold uppercase tracking-[2px] text-zinc-500">Navigation Guide</span>
                  <button type="button" onClick={closeOverlay} className="p-1 hover:bg-white/5 rounded-full text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Menu items layout */}
                <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
                  
                  {/* Shop info item */}
                  <div 
                    onClick={() => openOverlay('info')}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00]">
                        <Info className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-extrabold">Shop Info & Story</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>

                  {/* Categories overlay trigger */}
                  <div 
                    onClick={() => openOverlay('category')}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00]">
                        <Filter className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-extrabold">Curated Collections</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>

                  {/* Shipping & Delivery policy */}
                  <div 
                    onClick={() => openOverlay('policy', undefined, { type: 'shipping' })}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-300">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-extrabold text-zinc-300">Shipping & Delivery</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-550" />
                  </div>

                  {/* Returns Policy */}
                  <div 
                    onClick={() => openOverlay('policy', undefined, { type: 'returns' })}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-300">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-extrabold text-zinc-300">Returns & Refunds</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-550" />
                  </div>

                  {/* Contact policy option */}
                  <div 
                    onClick={() => openOverlay('policy', undefined, { type: 'contact' })}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-300">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-extrabold text-zinc-300">Contact Us</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-550" />
                  </div>

                  {/* T&C */}
                  <div 
                    onClick={() => openOverlay('policy', undefined, { type: 'terms' })}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Terms & Conditions</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>

                  {/* Privacy */}
                  <div 
                    onClick={() => openOverlay('policy', undefined, { type: 'privacy' })}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Privacy Policy</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>

                </div>

                {/* Footer credit */}
                <div className="p-5 border-t border-white/[0.05] bg-black/40 text-center space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500">ThreadZW Luxury Workspace</span>
                  <div className="text-[10px] text-zinc-400">Powered by Digital Boutique</div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* 2. SEARCH OVERLAY */}
          {activeOverlay === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col justify-end"
              onClick={closeOverlay}
            >
              <motion.div
                initial={{ y: '100%', scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: '100%', scale: 0.98 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[480px] bg-[#111111] rounded-t-[24px] border-t border-white/[0.08] shadow-2xl overflow-hidden h-[95vh] flex flex-col"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                {/* Search Header Input bar */}
                <div className="p-4 flex items-center gap-2 border-b border-white/[0.05]">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addSearchQueryToRecent(searchQuery);
                        }
                      }}
                      placeholder="Search streetwear, tees, apparel..."
                      className="w-full text-xs font-semibold uppercase font-mono bg-[#1a1a1a] border border-white/[0.06] focus:border-[#C6FF00] focus:ring-0 outline-none outline-0 rounded-full pl-10 pr-8 py-3.5 text-white placeholder-zinc-500"
                      autoFocus
                    />
                    {searchQuery && (
                      <button 
                        type="button" 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={closeOverlay}
                    className="text-xs uppercase tracking-widest font-black text-white hover:text-[#C6FF00] transition-colors px-2.5 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* Search results scroll display */}
                <div className="p-5 overflow-y-auto space-y-6 flex-1 scrollbar-none">
                  
                  {/* Recent Searches */}
                  {!searchQuery && recentSearches.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center select-none">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-[1.5px] text-zinc-500">Recent Searches</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setRecentSearches([]);
                            localStorage.removeItem(`threadzw_searches_${shop.id}`);
                          }}
                          className="text-[9px] uppercase font-bold text-zinc-400 hover:text-[#C6FF00]"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term, i) => (
                          <div
                            key={`recent-${i}`}
                            onClick={() => setSearchQuery(term)}
                            className="bg-white/[0.04] border border-white/[0.06] hover:border-white/20 hover:text-white transition-all text-xs font-medium px-3.5 py-1.5 rounded-full text-zinc-300 cursor-pointer flex items-center gap-1"
                          >
                            <span>{term}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular items catalog */}
                  {!searchQuery && (
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-[1.5px] text-zinc-500 block">Popular products</span>
                      <div className="space-y-2.5">
                        {products.slice(0, 3).map((p, idx) => (
                          <div
                            key={`popular-${p.id || idx}`}
                            onClick={() => openOverlay('product', p.id)}
                            className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-all"
                          >
                            <div className="w-12 h-16 bg-[#000] rounded-md overflow-hidden flex-shrink-0">
                              <ProductImage product={p} index={0} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow">
                              <h4 className="text-xs font-bold uppercase truncate text-white">{p.name}</h4>
                              <span className="text-xs font-black text-[#C6FF00] font-mono">${p.price}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-500 mr-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live Matching grid displaying search items */}
                  {searchQuery && (
                    <div className="space-y-3.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-[1.5px] text-zinc-500 block">
                        Matching garments ({displayedProducts.length})
                      </span>

                      {displayedProducts.length === 0 ? (
                        <div className="py-12 text-center text-zinc-500 text-xs font-mono uppercase">
                          No items match your input query
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 pb-8">
                          {displayedProducts.map((p, idx) => (
                            <div
                              key={`search-res-${p.id || idx}`}
                              onClick={() => {
                                addSearchQueryToRecent(searchQuery);
                                openOverlay('product', p.id);
                              }}
                              className="bg-black/60 border border-white/[0.04] rounded-xl overflow-hidden cursor-pointer hover:border-white/20 transition-all flex flex-col justify-between"
                            >
                              <div className="aspect-[3/4] bg-zinc-950">
                                <ProductImage product={p} index={0} className="w-full h-full object-cover" />
                              </div>
                              <div className="p-3">
                                <h4 className="text-[11px] font-bold uppercase truncate text-zinc-100">{p.name}</h4>
                                <span className="text-xs font-black text-[#C6FF00] font-mono">${p.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            </motion.div>
          )}

          {/* 3. CART OVERLAY */}
          {activeOverlay === 'cart' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col justify-end"
              onClick={closeOverlay}
            >
              <motion.div
                initial={{ y: '100%', scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: '100%', scale: 0.98 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[480px] bg-[#111111] rounded-t-[24px] border-t border-white/[0.08] shadow-2xl h-[90vh] flex flex-col"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                {/* Handle bar */}
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3.5 mb-2 cursor-pointer" onClick={closeOverlay} />

                <div className="px-5 pb-5 flex items-center justify-between border-b border-white/[0.05]">
                  <h3 className="text-sm font-black uppercase tracking-[1.5px] text-white">Your Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</h3>
                  <button type="button" onClick={closeOverlay} className="p-1 hover:bg-white/5 rounded-full text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cart items list */}
                <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-none">
                  {cart.length === 0 ? (
                    <div className="py-24 text-center text-zinc-500 space-y-3">
                      <ShoppingBag className="w-12 h-12 mx-auto text-zinc-700 animate-bounce" />
                      <p className="text-xs font-mono uppercase tracking-widest leading-relaxed">No drops added to cart yet</p>
                      <button 
                        type="button" 
                        onClick={closeOverlay}
                        className="px-5 py-2.5 bg-white text-black text-[9px] font-black uppercase tracking-wider rounded-full hover:bg-[#C6FF00]"
                      >
                        Browse Releases
                      </button>
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div
                        key={`cart-item-${item.id || idx}`}
                        className="flex gap-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 items-center hover:border-white/[0.08]"
                      >
                        <div className="w-16 h-20 bg-zinc-950 rounded-lg overflow-hidden flex-shrink-0">
                          <ProductImage product={item.product} index={0} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-grow space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold uppercase truncate text-white">{item.product.name}</h4>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                            Size: {item.size} {item.color ? `| Color: ${item.color}` : ''}
                          </span>
                          <span className="text-xs font-black text-[#C6FF00] font-mono block">${item.product.price}</span>
                        </div>

                        {/* Quantity management UI */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button 
                            type="button" 
                            onClick={() => removeCartItem(item.id)}
                            className="p-1 text-zinc-500 hover:text-red-500 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-white/[0.06] rounded-lg px-2 py-1">
                            <button 
                              type="button" 
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="text-zinc-400 hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-extrabold w-4 text-center">{item.quantity}</span>
                            <button 
                              type="button" 
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="text-zinc-400 hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotal summary section */}
                {cart.length > 0 && (
                  <div className="p-5 border-t border-white/[0.06] bg-[#161616] space-y-4">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-zinc-400 uppercase tracking-widest text-xs">Subtotal</span>
                      <span className="text-xl font-black text-white font-mono">${cartSubtotal} USD</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCartCheckoutWhatsApp}
                      className="w-full py-4 bg-[#C6FF00] text-black font-extrabold text-xs uppercase tracking-[2px] rounded-xl hover:opacity-90 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#C6FF00]/10 font-sans"
                    >
                      <MessageCircle className="w-4 h-4 font-extrabold fill-current" />
                      Checkout on WhatsApp
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* 4. CATEGORY OVERLAY */}
          {activeOverlay === 'category' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col justify-end"
              onClick={closeOverlay}
            >
              <motion.div
                initial={{ y: '100%', scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: '100%', scale: 0.98 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[480px] bg-[#111111] rounded-t-[24px] border-t border-white/[0.08] shadow-2xl h-[85vh] flex flex-col"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3.5 mb-2 cursor-pointer" onClick={closeOverlay} />

                <div className="px-5 pb-5 flex items-center justify-between border-b border-white/[0.05]">
                  <h3 className="text-sm font-black uppercase tracking-[1.5px] text-white">Collections Directory</h3>
                  <button type="button" onClick={closeOverlay} className="p-1 hover:bg-white/5 rounded-full text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-3 overflow-y-auto flex-1 scrollbar-none select-none">
                  {/* Option: all */}
                  <div
                    onClick={() => {
                      setActiveCategoryFilter('all');
                      closeOverlay();
                    }}
                    className="flex justify-between items-center p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-2xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center border border-white/10 text-[#C6FF00]">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs uppercase font-extrabold tracking-widest">All Curated Pieces</h4>
                        <span className="text-[10px] text-zinc-400 font-mono">{products.length} Garments</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                  </div>

                  {categories.map((cat: any, idx: number) => {
                    const count = getProductCountForCategory(cat.name);
                    const cover = getCategoryCover(cat.name, cat.cover_image_url);

                    return (
                      <div
                        key={`cat-info-${cat.id || cat.name || idx}`}
                        onClick={() => {
                          setActiveCategoryFilter(cat.name);
                          closeOverlay();
                        }}
                        className="flex justify-between items-center p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-[#ffffff]/[0.05] rounded-2xl cursor-pointer transition-all gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 overflow-hidden">
                            <ImageWithSkeleton
                              src={cover}
                              alt={cat.name}
                              skeletonType="product"
                              className="w-full h-full object-cover grayscale brightness-90"
                            />
                          </div>
                          <div>
                            <h4 className="text-xs uppercase font-extrabold tracking-widest text-[#C6FF00]">{cat.name}</h4>
                            <span className="text-[10px] text-zinc-400 font-mono">{count} Items Listed</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* 5. PRODUCT DETAIL OVERLAY */}
          {activeOverlay === 'product' && selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col justify-end"
              onClick={closeOverlay}
            >
              <ProductOverlayBody
                product={selectedProduct}
                shop={shop}
                allProducts={products}
                onClose={closeOverlay}
                onSelectProduct={(id) => openOverlay('product', id)}
                onAddToCart={addToCart}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
              />
            </motion.div>
          )}

          {/* 6. SHOP INFO OVERLAY */}
          {activeOverlay === 'info' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col justify-end"
              onClick={closeOverlay}
            >
              <motion.div
                initial={{ y: '100%', scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: '100%', scale: 0.98 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[480px] bg-[#111111] rounded-t-[24px] border-t border-white/[0.08] shadow-2xl h-[85vh] flex flex-col"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3.5 mb-2 cursor-pointer" onClick={closeOverlay} />

                <div className="px-5 pb-5 flex items-center justify-between border-b border-white/[0.05]">
                  <h3 className="text-sm font-black uppercase tracking-[1.5px] text-white">Boutique Story & Info</h3>
                  <button type="button" onClick={closeOverlay} className="p-1 hover:bg-white/5 rounded-full text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Info scroll box */}
                <div className="p-5 overflow-y-auto space-y-6 flex-1 scrollbar-none">
                  
                  {/* Shop presentation card */}
                  <div className="relative h-28 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 select-none">
                    <ShopBanner shop={shop} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="absolute inset-0 flex items-center p-4 gap-3">
                      <div className="w-14 h-14 rounded-full border border-[#C6FF00] p-0.5 overflow-hidden flex-shrink-0 bg-black">
                        <ShopLogo shop={shop} size="100%" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold uppercase text-white leading-tight">{shop.name}</h4>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-[#C6FF00]">Boutique Hub</span>
                      </div>
                    </div>
                  </div>

                  {/* About Text */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-[1.5px] text-zinc-550">About Us</span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans mt-1">
                      {shop.description || 'Curated designer streetwear collections constructed for enthusiasts of top-tier aesthetics.'}
                    </p>
                  </div>

                  {/* Operational indicators mapping */}
                  <div className="space-y-3.5 pt-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-[1.5px] text-zinc-550 block">Operational Coordinates</span>
                    
                    {/* Location coordinates */}
                    {shop.city && (
                      <div className="flex gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                        <MapPin className="w-5 h-5 text-[#C6FF00] shrink-0" />
                        <div>
                          <span className="text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 block">Hub Location</span>
                          <span className="text-xs font-semibold text-white">{shop.suburb ? `${shop.suburb}, ${shop.city}` : shop.city}</span>
                        </div>
                      </div>
                    )}

                    {/* Operational hours */}
                    <div className="flex gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                      <Clock className="w-5 h-5 text-[#C6FF00] shrink-0" />
                      <div>
                        <span className="text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 block">Operating Hours</span>
                        <span className="text-xs font-semibold text-white">{(shop.opening_hours || 'Mon-Sat 9am - 6pm')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interact socials section */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-[1.5px] text-zinc-500 block">Contact & Channels</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      
                      {shop.instagram && (
                        <a
                          href={`https://instagram.com/${shop.instagram.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] text-pink-400 font-sans"
                        >
                          <Instagram className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-500 block">Instagram</span>
                            <span className="text-[10px] font-extrabold truncate block text-zinc-200">@{shop.instagram.replace(/^@/, '')}</span>
                          </div>
                        </a>
                      )}

                      {(shop.whatsapp_number || shop.whatsapp) && (
                        <a
                          href={`https://wa.me/${formatWhatsAppNumber(shop.whatsapp_number || shop.whatsapp || '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] text-emerald-400 font-sans"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-500 block">WhatsApp</span>
                            <span className="text-[10px] font-extrabold truncate block text-zinc-200">Chat & Order</span>
                          </div>
                        </a>
                      )}

                    </div>
                  </div>

                  {/* share block action */}
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = getAppOrigin() + `/shop/${shop.slug}`;
                      if (navigator.share) {
                        navigator.share({
                          title: shop.name,
                          url: shareUrl
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        showToast.success('Store link copied to clipboard');
                      }
                    }}
                    className="w-full py-3.5 bg-white text-black font-extrabold text-[10px] uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-zinc-200"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Brand Link
                  </button>

                </div>
              </motion.div>
            </motion.div>
          )}

          {/* 7. POLICY DETAIL DIALOG OVERLAY */}
          {activeOverlay === 'policy' && policyType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col justify-end"
              onClick={closeOverlay}
            >
              <motion.div
                initial={{ y: '100%', scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: '100%', scale: 0.98 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[480px] bg-[#111111] rounded-t-[24px] border-t border-white/[0.08] shadow-2xl max-h-[75vh] flex flex-col"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3.5 mb-2 cursor-pointer" onClick={closeOverlay} />

                <div className="px-5 pb-5 flex items-center justify-between border-b border-white/[0.05]">
                  <h3 className="text-sm font-black uppercase tracking-[1.5px] text-white">
                    {policyType === 'shipping' ? 'Shipping & Delivery' :
                     policyType === 'returns' ? 'Returns & Refunds' :
                     policyType === 'contact' ? 'Contact Directory' :
                     policyType === 'terms' ? 'Terms of Use' : 'Privacy Protection'}
                  </h3>
                  <button type="button" onClick={() => openOverlay('menu')} className="p-1 hover:bg-white/5 rounded-full text-zinc-400 cursor-pointer">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* Inner Policy Content container */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1 scrollbar-none text-zinc-300 text-xs leading-relaxed">
                  
                  {policyType === 'shipping' && (
                    <div className="space-y-3.5">
                      <span className="text-[10.5px] uppercase tracking-[1.5px] font-mono text-[#C6FF00] font-bold block">Zimbabwe Logistics</span>
                      <p>
                        {shop.shipping_policy || 'Our boutique provides high-efficiency dispatch solutions ensuring security. Orders within Bulawayo are ready for standard showroom pickup within 2 hours. Deliveries inside Harare and other cities occur via fast overnight Pax or certified private courier services.'}
                      </p>
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 block mb-1">Standard Shipping Timeframes:</span>
                        <ul className="list-disc pl-4 space-y-1.5 font-mono text-[10px]">
                          <li>Bulawayo Pickups: Same Day (Free)</li>
                          <li>Harare Delivery: 24 - 48 Hours ($5)</li>
                          <li>Nationwide Zimbabwe: 48 Hours ($7)</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {policyType === 'returns' && (
                    <div className="space-y-3.5">
                      <span className="text-[10.5px] uppercase tracking-[1.5px] font-mono text-[#C6FF00] font-bold block">Apparel Exchanging Policies</span>
                      <p>
                        {shop.return_policy || 'Due to the exclusive nature of our drops and releases, returns are processed within 3 days solely for store catalog credit or structural size exchanges. The apparel items must remain entirely unworn, complete with custom labels and labels preserved.'}
                      </p>
                      <p>
                        Contact us directly on WhatsApp to coordinate an exchange request with details of your order handles.
                      </p>
                    </div>
                  )}

                  {policyType === 'contact' && (
                    <div className="space-y-4 font-sans select-none">
                      <span className="text-[10.5px] uppercase tracking-[1.5px] font-mono text-[#C6FF00] font-bold block text-left">Connect with our agents</span>
                      <p>Feel free to reach out to us using any of our registered boutique channels, or order directly.</p>
                      
                      <div className="space-y-2">
                        {/* WhatsApp contact detail */}
                        {(shop.whatsapp_number || shop.whatsapp) && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                            <div>
                              <span className="text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 block">WhatsApp Direct Helpline</span>
                              <a 
                                href={`https://wa.me/${formatWhatsAppNumber(shop.whatsapp_number || shop.whatsapp || '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold font-mono text-emerald-400 hover:underline"
                              >
                                {shop.whatsapp_number || shop.whatsapp}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Instagram channel detail */}
                        {shop.instagram && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <Instagram className="w-5 h-5 text-pink-400 shrink-0" />
                            <div>
                              <span className="text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 block">Instagram DM & Updates</span>
                              <a 
                                href={`https://instagram.com/${shop.instagram.replace(/^@/, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-pink-400 hover:underline"
                              >
                                @{shop.instagram.replace(/^@/, '')}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Email coordinate */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <Mail className="w-5 h-5 text-sky-400 shrink-0" />
                          <div>
                            <span className="text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 block">Email Support Channel</span>
                            <span className="text-xs font-bold text-zinc-200">contact-support@{shop.id ? shop.id.substring(0,6) : 'gmail'}.com</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {policyType === 'terms' && (
                    <div className="space-y-3">
                      <span className="text-[10.5px] uppercase tracking-[1.5px] font-mono text-[#C6FF00] font-bold block">Terms of Service</span>
                      <p>
                        {shop.terms_conditions || 'By accessing and transactions via our boutique, you acknowledge and agree that drops are highly limited. Reselling or distributing catalog materials without permission is prohibited.'}
                      </p>
                      <p>
                        Garments remain under legal warranties as authentic ThreadZW certified designs.
                      </p>
                    </div>
                  )}

                  {policyType === 'privacy' && (
                    <div className="space-y-3">
                      <span className="text-[10.5px] uppercase tracking-[1.5px] font-mono text-[#C6FF00] font-bold block">Privacy Policy</span>
                      <p>
                        {shop.privacy_policy || 'Your privacy coordinates are securely kept. WhatsApp messaging details, transaction subtotals, physical addresses, and delivery arrangements are encrypted and strictly prohibited from selling or sharing.'}
                      </p>
                    </div>
                  )}

                </div>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
};

// -------------------------------------------------------------
// HELPER COMPONENT: PRODUCT OVERLAY BODY
// -------------------------------------------------------------
interface ProductOverlayBodyProps {
  product: any;
  shop: any;
  allProducts: any[];
  onClose: () => void;
  onSelectProduct: (id: string) => void;
  onAddToCart: (product: any, size: string, color: string) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
}

const ProductOverlayBody: React.FC<ProductOverlayBodyProps> = ({
  product,
  shop,
  allProducts,
  onClose,
  onSelectProduct,
  onAddToCart,
  handleTouchStart,
  handleTouchMove
}) => {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const images = useMemo(() => {
    if (Array.isArray(product?.images)) return product.images;
    if (product?.images) return [product.images];
    return [];
  }, [product]);

  const sizesList = useMemo<string[]>(() => {
    if (!product?.sizes) return ['S', 'M', 'L', 'XL'];
    if (Array.isArray(product.sizes)) {
      const parsed = product.sizes.map((s: any) => typeof s === 'string' ? s : s?.size || s?.size_label || s).filter(Boolean);
      return Array.from(new Set(parsed)) as string[];
    }
    return ['S', 'M', 'L', 'XL'];
  }, [product]);

  const coloursList = useMemo<string[]>(() => {
    const list = product?.colours || product?.colors;
    if (Array.isArray(list)) {
      return list.map((c: any) => typeof c === 'string' ? c.trim() : '').filter(Boolean);
    }
    return [];
  }, [product]);

  const isSoldOut = useMemo(() => {
    return product?.status === 'sold_out' || product?.total_stock <= 0;
  }, [product]);

  const isSizeOutOfStock = useCallback((sz: string) => {
    if (isSoldOut) return true;
    if (Array.isArray(product?.sizes)) {
      const sizeObj = product.sizes.find((s: any) => {
        const repr = typeof s === 'string' ? s : s?.size || s?.size_label;
        return repr === sz;
      });
      if (sizeObj && typeof sizeObj === 'object') {
        return (sizeObj.quantity ?? 0) <= 0;
      }
    }
    return false;
  }, [product, isSoldOut]);

  // Set default size & colour values
  useEffect(() => {
    if (sizesList.length > 0) {
      const firstInStock = sizesList.find(sz => !isSizeOutOfStock(sz));
      setSelectedSize(firstInStock || sizesList[0]);
    }
    if (coloursList.length > 0) {
      setSelectedColor(coloursList[0]);
    } else {
      setSelectedColor('');
    }
    setActiveImgIdx(0);
  }, [product, sizesList, coloursList, isSizeOutOfStock]);

  const relatedProducts = useMemo(() => {
    return allProducts
      .filter((p: any) => p.id !== product.id && (p.category_id === product.category_id || p.category === product.category))
      .slice(0, 4);
  }, [allProducts, product]);

  const handleOrderOnWhatsApp = () => {
    const whatsappNum = shop.whatsapp || shop.phone || '+263771234567';
    let clean = whatsappNum.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '263' + clean.substring(1);
    } else if (clean.length === 9 && (clean.startsWith('77') || clean.startsWith('71') || clean.startsWith('73') || clean.startsWith('78'))) {
      clean = '263' + clean;
    }
    const textMsg = `Hi ${shop.name}, I would like to order the ${product.name}${selectedSize ? ` (Size ${selectedSize})` : ''}${selectedColor ? `, Color ${selectedColor}` : ''}.`;
    const whatsappUrl = `https://wa.me/${clean}?text=${encodeURIComponent(textMsg)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ y: '100%', scale: 0.98 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ y: '100%', scale: 0.98 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-[480px] bg-[#0A0A0A] rounded-t-[24px] border-t border-white/[0.08] shadow-2xl h-[92vh] flex flex-col relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Notch handle bar */}
      <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3.5 mb-2 cursor-pointer" onClick={onClose} />

      {/* Absolute floating close button */}
      <button 
        type="button" 
        onClick={onClose} 
        className="absolute top-4 right-4 z-[60] bg-black/70 hover:bg-[#C6FF00] hover:text-black p-2 rounded-full border border-white/10 text-white cursor-pointer transition-all"
        title="Close Detail"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Main image details scroll area */}
      <div className="overflow-y-auto flex-1 p-5 space-y-5 scrollbar-none pb-24 select-none">
        
        {/* Horizontal photo gallery */}
        <div className="space-y-2.5">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-white/[0.05] relative">
            <ProductImage product={product} index={activeImgIdx} className="w-full h-full object-cover" />
            
            {product.original_price && product.original_price > product.price && (
              <span className="absolute top-3.5 left-3.5 bg-red-600 border border-white/15 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}% Drop
              </span>
            )}
            
            {isSoldOut && (
              <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-500 text-xs font-black uppercase tracking-[0.2em]">
                Sold Out apparel
              </span>
            )}
          </div>

          {/* Dots Indicator for image indexes */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 pt-1">
              {images.map((_: any, idx: number) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  onClick={() => setActiveImgIdx(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeImgIdx === idx ? 'bg-[#C6FF00] w-4' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Title, Category & Price */}
        <div className="space-y-1 text-left">
          <span className="text-[9px] uppercase font-mono tracking-widest text-[#C6FF00] block">
            {product.category || 'Curated drop'}
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-white leading-tight">
            {product.name}
          </h2>
          <div className="flex items-baseline gap-2.5 pt-1 select-none">
            <span className="text-lg font-black text-white font-mono">${product.price} USD</span>
            {product.original_price && (
              <span className="text-zinc-500 font-mono text-xs line-through">${product.original_price}</span>
            )}
          </div>
        </div>

        {/* Sizes Selector */}
        {sizesList.length > 0 && (
          <div className="space-y-2 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[1.5px] text-zinc-500 block">Select size:</span>
            <div className="flex flex-wrap gap-2">
              {sizesList.map((sz: string, idx: number) => {
                const isOutOf = isSizeOutOfStock(sz);
                return (
                  <button
                    key={`size-${sz}-${idx}`}
                    type="button"
                    disabled={isOutOf}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                      selectedSize === sz 
                        ? 'bg-[#C6FF00] text-black border-[#C6FF00]' 
                        : isOutOf
                          ? 'bg-[#1a1a1a] text-zinc-650 border-white/[0.04] opacity-30 line-through cursor-not-allowed'
                          : 'bg-[#1a1a1a] text-zinc-200 border-white/[0.06] hover:border-zinc-500'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Colors Selector */}
        {coloursList.length > 0 && (
          <div className="space-y-2 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[1.5px] text-zinc-500 block">Select colour:</span>
            <div className="flex flex-wrap gap-2">
              {coloursList.map((col: string, idx: number) => (
                <button
                  key={`color-${col}-${idx}`}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono tracking-wider border transition-all cursor-pointer ${
                    selectedColor === col
                      ? 'bg-[#C6FF00]/10 text-[#C6FF00] border-[#C6FF00]'
                      : 'bg-[#1a1a1a] text-zinc-300 border-white/[0.06] hover:border-zinc-500'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="border-t border-white/[0.05] pt-4 text-left">
            <span className="text-[10px] uppercase font-mono tracking-[1.5px] text-zinc-500 block mb-1.5">Garment Narrative</span>
            <p className="text-zinc-300 text-xs leading-relaxed font-sans font-light whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* Similar curation listing carousel */}
        {relatedProducts.length > 0 && (
          <div className="pt-4 border-t border-white/[0.05] space-y-3.5">
            <span className="text-[10.5px] uppercase font-mono tracking-[1px] text-zinc-400 block text-left">Matching Curations</span>
            <div className="grid grid-cols-2 gap-3 pb-8 select-none">
              {relatedProducts.map((relProduct: any, idx: number) => (
                <div
                  key={`related-${relProduct.id || idx}`}
                  onClick={() => onSelectProduct(relProduct.id)}
                  className="bg-black/40 border border-white/[0.04] rounded-xl overflow-hidden cursor-pointer transition-all hover:border-white/20 flex flex-col justify-between"
                >
                  <div className="aspect-[3/4] bg-zinc-950">
                    <ProductImage product={relProduct} index={0} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 text-left">
                    <h4 className="text-[11px] font-bold uppercase truncate text-zinc-200">{relProduct.name}</h4>
                    <span className="text-xs font-black text-[#C6FF00] font-mono">${relProduct.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Floating Order on WhatsApp CTA at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.05] bg-[#121212] z-50">
        <button
          type="button"
          disabled={isSoldOut}
          onClick={handleOrderOnWhatsApp}
          className={`w-full py-4 text-xs tracking-[2px] font-black uppercase rounded-xl transition-all block flex items-center justify-center gap-2 cursor-pointer ${
            isSoldOut 
              ? 'bg-[#1a1a1a] text-zinc-600 border border-white/[0.04]' 
              : 'bg-[#C6FF00] text-black hover:opacity-90 shadow-lg shadow-[#C6FF00]/10'
          }`}
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.636 1.451l11.002-.008c5.448 0 9.873-4.385 9.877-9.761.002-2.606-1.01-5.057-2.85-6.898-1.84-1.841-4.283-2.855-6.883-2.856C12.015 1 7.579 5.39 7.575 9.769c-.001 1.67.442 3.178 1.286 4.621l-.283.509-4.217 1.245 1.282-4.148z"/>
          </svg>
          {isSoldOut ? 'Sold Out apparel' : 'Order on WhatsApp'}
        </button>
      </div>

    </motion.div>
  );
};
