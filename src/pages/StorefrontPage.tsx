// src/pages/StorefrontPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ShoppingBag, Search, Home, Grid, Heart, User, ShieldAlert, ArrowRight, MapPin, Copy, Clock, Truck, MessageSquare, Map, Compass, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { parseShopConfig } from '../utils/configHelper';
import { 
  trackStoreView, 
  trackProductView, 
  trackWishlistAdd, 
  trackCategoryClick, 
  trackSearchUsage 
} from '../lib/analytics';


// Modular Page Components
import { StorefrontHome } from '../components/storefront/StorefrontHome';
import { StorefrontShop } from '../components/storefront/StorefrontShop';
import { StorefrontProductDetail } from '../components/storefront/StorefrontProductDetail';
import { StorefrontCategories } from '../components/storefront/StorefrontCategories';
import { StorefrontCart } from '../components/storefront/StorefrontCart';
import { StorefrontCheckout } from '../components/storefront/StorefrontCheckout';
import { StorefrontOrderSuccess } from '../components/storefront/StorefrontOrderSuccess';
import { StorefrontTrackOrder } from '../components/storefront/StorefrontTrackOrder';
import { StorefrontAccount } from '../components/storefront/StorefrontAccount';
import { StorefrontWishlist } from '../components/storefront/StorefrontWishlist';
import { StorefrontAbout } from '../components/storefront/StorefrontAbout';
import { StorefrontContact } from '../components/storefront/StorefrontContact';
import { CartItem, StorefrontPageType } from '../components/storefront/types';
import { ShopLogo } from '../components/ui/ShopImage';

export const StorefrontPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Shop & product data states
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart & Wishlist persistence states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [savedAddress, setSavedAddress] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'harare' | 'nationwide'>('pickup');
  const [lastOrder, setLastOrder] = useState<any>(null);

  // Hamburger menu toggler
  const [showMenu, setShowMenu] = useState(false);

  // Location sheet toggler
  const [showLocationSheet, setShowLocationSheet] = useState(false);

  // Check if location info is configured
  const hasLocationInfo = useMemo(() => {
    return !!(shop?.location?.trim() || shop?.landmark?.trim() || shop?.directions?.trim());
  }, [shop]);

  // Compute active page from URL search params (?page=home)
  const activePage = useMemo<StorefrontPageType>(() => {
    const pageVal = searchParams.get('page') as StorefrontPageType;
    if (!pageVal) return 'home';
    
    const validPages: StorefrontPageType[] = [
      'home', 'shop', 'product', 'categories', 'cart', 'checkout', 
      'success', 'track', 'account', 'wishlist', 'about', 'contact', 
      'terms', 'privacy'
    ];
    return validPages.includes(pageVal) ? pageVal : '404';
  }, [searchParams]);

  // Traffic logging database integration helpers
  const logStorefrontVisit = async (shopId: string, ownerId: string) => {
    try {
      const lastLogged = sessionStorage.getItem(`threadzw_visit_logged_${shopId}`);
      if (lastLogged) return;
      sessionStorage.setItem(`threadzw_visit_logged_${shopId}`, 'true');

      const customerId = localStorage.getItem('boutique_customer_id') || 'cust_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('boutique_customer_id', customerId);

      let source = 'Direct Link';
      
      const pageVal = searchParams.get('page');
      const prodVal = searchParams.get('prod_id') || searchParams.get('product_id') || searchParams.get('product');
      
      if (prodVal || pageVal === 'product') {
        source = 'Shared Product Link';
      } else {
        const ref = document.referrer || '';
        if (ref.includes('google') || ref.includes('bing') || ref.includes('yahoo')) {
          source = 'Search';
        }
      }

      const visitPayload = {
        shop_id: shopId,
        owner_id: ownerId,
        product_name: 'Visit Log',
        size: 'None',
        quantity: 0,
        sale_price: 0,
        total_price: 0,
        status: 'visit',
        source: source,
        customer_identifier: customerId,
        created_at: new Date().toISOString()
      };

      let payload: any = { ...visitPayload };
      for (let attempt = 0; attempt < 10; attempt++) {
        const { error } = await supabase.from('orders').insert([payload]);
        if (!error) break;
        const errMsg = error.message || '';
        const match = errMsg.match(/column "([^"]+)" of relation "orders" does not exist/) || 
                      errMsg.match(/column "([^"]+)" does not exist/);
        if (match && match[1]) {
          delete payload[match[1]];
        } else {
          break;
        }
      }
    } catch (_) {}
  };

  const logInteractiveVisit = async (shopId: string, ownerId: string, source: string) => {
    try {
      const key = `zw_source_logged_${shopId}_${source}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, 'true');

      const customerId = localStorage.getItem('boutique_customer_id') || 'cust_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('boutique_customer_id', customerId);

      const visitPayload = {
        shop_id: shopId,
        owner_id: ownerId,
        product_name: 'Visit Log',
        size: 'None',
        quantity: 0,
        sale_price: 0,
        total_price: 0,
        status: 'visit',
        source: source,
        customer_identifier: customerId,
        created_at: new Date().toISOString()
      };

      let payload: any = { ...visitPayload };
      for (let attempt = 0; attempt < 10; attempt++) {
        const { error } = await supabase.from('orders').insert([payload]);
        if (!error) break;
        const errMsg = error.message || '';
        const match = errMsg.match(/column "([^"]+)" of relation "orders" does not exist/) || 
                      errMsg.match(/column "([^"]+)" does not exist/);
        if (match && match[1]) {
          delete payload[match[1]];
        } else {
          break;
        }
      }
    } catch (_) {}
  };

  // Navigate helper maintaining slug structure
  const navigateToPage = useCallback((pageName: StorefrontPageType, params?: Record<string, string>) => {
    console.log(`[ROUTE TRANSITION] Transitioning page from '${activePage}' to '${pageName}'`, params || {});
    
    // Dynamic traffic source click tracking
    if (shop) {
      if (pageName === 'categories') {
        logInteractiveVisit(shop.id, shop.owner_id, 'Categories');
      } else if (pageName === 'home' || pageName === 'shop') {
        logInteractiveVisit(shop.id, shop.owner_id, 'Homepage');
      }
    }

    const nextParams = new URLSearchParams();
    nextParams.set('page', pageName);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) nextParams.set(k, v);
      });
    }
    setSearchParams(nextParams);
    setShowMenu(false);
    // Scroll to top of inner main container
    const mainEl = document.getElementById('storefront-main-scroll');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage, setSearchParams, shop]);

  // Back navigation dispatcher
  const handleBackNavigation = () => {
    if (activePage === 'product') navigateToPage('shop');
    else if (activePage === 'checkout') navigateToPage('cart');
    else if (activePage === 'success') navigateToPage('home');
    else if (activePage === 'wishlist') navigateToPage('account');
    else navigateToPage('home');
  };

  // Fetch shop metadata & inventories
  const loadStorefront = useCallback(async () => {
    if (!slug) {
      setError('not_found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let cleanSlug = slug.replace(/^@/, '').trim().toLowerCase();
      cleanSlug = cleanSlug.replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');

      if (!cleanSlug) {
        setError('not_found');
        setLoading(false);
        return;
      }

      // Query core Supabase database by slug
      let { data: dbShop, error: shopErr1 } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (shopErr1) {
        console.error("Supabase Error querying shops by slug:", shopErr1);
        throw shopErr1;
      }

      let shopResult = dbShop;
      if (!shopResult) {
        // Fallback search by ID
        const { data: shopById, error: shopErr3 } = await supabase
          .from('shops')
          .select('*')
          .eq('id', slug)
          .maybeSingle();

        if (shopErr3) {
          console.error("Supabase Error querying shops by ID:", shopErr3);
          throw shopErr3;
        }
        shopResult = shopById;
      }

      if (!shopResult) {
        setError('not_found');
        setLoading(false);
        return;
      }

      // Check if the shop is active and has a valid subscription
      const isTrialValid = shopResult.subscription_status === 'trial' && 
        (!shopResult.trial_ends_at || new Date(shopResult.trial_ends_at) > new Date());
      const isSubscriptionValid = shopResult.subscription_status === 'active' || isTrialValid;

      if (!shopResult.is_active || !isSubscriptionValid) {
        setError('not_found');
        setLoading(false);
        return;
      }

      if (shopResult) {
        const { description: plainDesc, config } = parseShopConfig(shopResult.description || '');
        shopResult = {
          ...shopResult,
          description: plainDesc,
          ...config
        };
      }

      setShop(shopResult);
      document.title = `${shopResult.name} | Storefront`;

      // Generate dynamic categories from the shop metadata (shopResult.categories or shopResult.category)
      const shopCats = Array.isArray(shopResult.categories)
        ? shopResult.categories.map((cat: string, index: number) => ({
            id: `cat-${index}`,
            name: cat,
            sort_order: index
          }))
        : shopResult.category
          ? [{ id: 'cat-0', name: shopResult.category, sort_order: 0 }]
          : [];
      
      setCategories(shopCats);

      // Fetch dynamic products
      const { data: dbProducts, error: prodsErr } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopResult.id);

      if (prodsErr) {
        console.error("Supabase Error querying products:", prodsErr);
        throw prodsErr;
      }

      const mapped = (dbProducts || []).map((p: any) => ({
        ...p,
        images: p.images ? (Array.isArray(p.images) ? p.images.filter(Boolean) : [p.images].filter(Boolean)) : (p.image_url ? [p.image_url] : []),
        colours: p.colours || p.colors || [],
        sizes: Array.isArray(p.sizes) ? p.sizes.map((s: any) => typeof s === 'object' ? s.size : s) : [],
        total_stock: p.stock !== undefined ? p.stock : (p.total_stock || 0)
      }));

      setProducts(mapped);

      // Sync local storage Cart
      const storedCart = localStorage.getItem(`threadzw_cart_${shopResult.id}`);
      if (storedCart) {
        try { setCart(JSON.parse(storedCart)); } catch (_) {}
      } else {
        setCart([]);
      }

      // Sync local storage Wishlist
      const storedWishlist = localStorage.getItem(`threadzw_wishlist_${shopResult.id}`);
      if (storedWishlist) {
        try { setWishlist(JSON.parse(storedWishlist)); } catch (_) {}
      } else {
        setWishlist([]);
      }

      // Sync saved address
      const storedAddress = localStorage.getItem(`threadzw_address_${shopResult.id}`);
      if (storedAddress) {
        setSavedAddress(storedAddress);
      } else {
        setSavedAddress('');
      }

      // Log initial storefront entry visit
      logStorefrontVisit(shopResult.id, shopResult.owner_id);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Fetch shop metadata & inventories on mount or slug change
  useEffect(() => {
    loadStorefront();
  }, [slug, loadStorefront]);

  // Redesigned Funnel Analytics Event Tracker
  useEffect(() => {
    if (!shop?.id) return;

    if (activePage === 'home' || activePage === 'shop') {
      const q = searchParams.get('q') || searchParams.get('search') || '';
      if (q.trim()) {
        trackSearchUsage(shop.id, q);
      } else {
        const urlRef = searchParams.get('ref') || undefined;
        trackStoreView(shop.id, urlRef);
      }
    } else if (activePage === 'product') {
      const prodId = searchParams.get('productId');
      if (prodId) {
        const prod = products.find(p => p.id === prodId);
        trackProductView(shop.id, prodId, prod?.name || 'Listing Item');
      }
    } else if (activePage === 'categories') {
      trackCategoryClick(shop.id, searchParams.get('category') || 'All Categories');
    }
  }, [activePage, searchParams, shop?.id, products]);

  // Save Cart to local storage helper
  const handleSaveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    if (shop?.id) {
      localStorage.setItem(`threadzw_cart_${shop.id}`, JSON.stringify(newCart));
    }
  };

  // Add Item to Cart
  const handleAddToCart = (product: any, size: string, color: string) => {
    const itemUniqueId = `${product.id}-${size}-${color}`;
    const existingIdx = cart.findIndex(item => item.id === itemUniqueId);

    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      handleSaveCart(updated);
    } else {
      const item: CartItem = {
        id: itemUniqueId,
        product,
        size,
        color,
        quantity: 1
      };
      handleSaveCart([...cart, item]);
    }
    toast.success(`Added ${product.name} to Cart`);
  };

  // Direct add from wishlist (No explicit size prompts - defaults to first size option)
  const handleAddToCartDirectly = (product: any) => {
    const sizes = Array.isArray(product?.sizes) 
      ? product.sizes.map((s: any) => typeof s === 'string' ? s : s?.size || s?.size_label).filter(Boolean)
      : ['S', 'M', 'L', 'XL'];
    const defaultSize = sizes[0] || 'M';
    handleAddToCart(product, defaultSize, '');
  };

  // Update quantity
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.id === itemId) {
        const nextQty = item.quantity + delta;
        return { ...item, quantity: nextQty > 0 ? nextQty : 1 };
      }
      return item;
    });
    handleSaveCart(updated);
  };

  // Remove from cart
  const handleRemoveCartItem = (itemId: string) => {
    const updated = cart.filter(item => item.id !== itemId);
    handleSaveCart(updated);
    toast.success('Removed from cart');
  };

  // Share shop utility
  const handleShareShop = async () => {
    if (!shop) return;
    const url = `https://threadzw.vercel.app/shop/${shop.id.trim()}?page=home`;
    const title = `${shop.name} | ThreadZW Storefront`;
    const text = `Check out the latest clothing collections from ${shop.name} on ThreadZW! 🛍️✨`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        toast.success('Shop link shared!');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.log('Error using navigator.share:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Shop link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy. Copy the page URL from the address bar.');
    }
  };

  // Wishlist toggle
  const handleToggleWishlist = (productId: string) => {
    let updated = [...wishlist];
    if (updated.includes(productId)) {
      updated = updated.filter(id => id !== productId);
      toast.success('Removed from wishlist');
    } else {
      updated.push(productId);
      toast.success('Added to wishlist');
      // Track wishlist action
      if (shop?.id) {
        const prod = products.find(p => p.id === productId);
        trackWishlistAdd(shop.id, productId, prod?.name || 'Listing');
      }
    }
    setWishlist(updated);
    if (shop?.id) {
      localStorage.setItem(`threadzw_wishlist_${shop.id}`, JSON.stringify(updated));
    }
  };

  // Saved Address updater
  const handleSaveAddress = (address: string) => {
    setSavedAddress(address);
    if (shop?.id) {
      localStorage.setItem(`threadzw_address_${shop.id}`, address);
    }
  };

  const handleClearCart = () => {
    handleSaveCart([]);
  };

  // Loading Screen (High Fidelity Boutique Skeleton)
  if (loading) {
    const renderActiveSkeleton = () => {
      if (activePage === 'home') {
        return (
          <div className="flex-grow space-y-8 pb-20 overflow-y-auto">
            {/* Hero banner placeholder */}
            <div className="relative pb-6 border-b border-zinc-100/50">
              <div className="h-44 w-full shimmer-bg" />
              <div className="flex flex-col items-center -mt-12 relative z-10 px-4">
                <div className="w-24 h-24 rounded-full border-4 border-white shimmer-bg" />
                <div className="h-5 w-36 bg-zinc-200 rounded mt-3.5 shimmer-bg" />
                <div className="h-3.5 w-24 bg-zinc-150 rounded mt-1.5 shimmer-bg" />
                <div className="h-3 w-56 bg-zinc-150 rounded mt-2.5 shimmer-bg" />
              </div>
            </div>

            {/* Highlight card placeholders */}
            <div className="space-y-3 px-5">
              <div className="h-4 w-28 bg-zinc-200 rounded shimmer-bg" />
              <div className="flex gap-3 overflow-x-hidden">
                {[1, 2, 3].map(i => (
                  <div key={i} className="shrink-0 w-[180px] p-4 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-2.5">
                    <div className="w-8 h-8 rounded-xl bg-zinc-200 shimmer-bg" />
                    <div className="h-3 w-20 bg-zinc-200 shimmer-bg" />
                    <div className="h-2 w-32 bg-zinc-150 shimmer-bg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Product grid placeholders */}
            <div className="px-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-zinc-200 rounded shimmer-bg" />
                <div className="h-3 w-16 bg-zinc-150 rounded shimmer-bg" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-2 space-y-3">
                    <div className="aspect-[4/5] rounded-xl bg-zinc-150/60 shimmer-bg" />
                    <div className="space-y-1.5 p-1">
                      <div className="h-2 w-10 bg-zinc-200 rounded shimmer-bg" />
                      <div className="h-3 w-28 bg-zinc-200 rounded shimmer-bg" />
                      <div className="h-3.5 w-16 bg-zinc-350/50 rounded mt-2 shimmer-bg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      if (activePage === 'shop') {
        return (
          <div className="flex-grow space-y-6 pb-20 overflow-y-auto px-5 pt-4">
            {/* Search bar placeholder */}
            <div className="h-11 w-full rounded-xl border border-zinc-100 bg-zinc-50 shimmer-bg" />

            {/* Filter chip placeholders */}
            <div className="flex gap-2.5 overflow-x-hidden py-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 w-20 rounded-full bg-zinc-100 border border-zinc-150/50 shrink-0 shimmer-bg" />
              ))}
            </div>

            {/* Product card placeholders */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-24 bg-zinc-200 rounded shimmer-bg" />
                <div className="h-3.5 w-16 bg-zinc-150 rounded shimmer-bg" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-2 space-y-3">
                    <div className="aspect-[4/5] rounded-xl bg-zinc-150/60 shimmer-bg" />
                    <div className="space-y-1.5 p-1">
                      <div className="h-2 w-10 bg-zinc-200 rounded shimmer-bg" />
                      <div className="h-3 w-28 bg-zinc-200 rounded shimmer-bg" />
                      <div className="h-3.5 w-14 bg-zinc-350/50 rounded mt-2 shimmer-bg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      if (activePage === 'product') {
        return (
          <div className="flex-grow space-y-6 pb-24 overflow-y-auto">
            {/* Large image placeholder */}
            <div className="aspect-[4/5] w-full bg-zinc-100 shimmer-bg relative" />

            {/* Product Details Skeleton */}
            <div className="px-5 space-y-5">
              {/* Title & category placeholder */}
              <div className="space-y-2">
                <div className="h-3 w-20 bg-zinc-200 rounded shimmer-bg" />
                <div className="h-6 w-3/4 bg-zinc-200 rounded shimmer-bg" />
                <div className="h-6 w-1/2 bg-zinc-200 rounded shimmer-bg" />
              </div>

              {/* Price placeholder */}
              <div className="h-7 w-28 bg-zinc-300 rounded-md shimmer-bg" />

              {/* Divider */}
              <div className="border-t border-zinc-100" />

              {/* Size & Color selector placeholders */}
              <div className="space-y-3">
                <div className="h-3 w-24 bg-zinc-200 rounded shimmer-bg" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-10 w-12 rounded-xl border border-zinc-100 bg-zinc-50 shimmer-bg" />
                  ))}
                </div>
              </div>

              {/* Description placeholders */}
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full bg-zinc-150 rounded shimmer-bg" />
                <div className="h-3 w-5/6 bg-zinc-150 rounded shimmer-bg" />
              </div>
            </div>

            {/* Floating/sticky CTA placeholder */}
            <div className="fixed bottom-24 left-4 right-4 max-w-[448px] mx-auto bg-white/95 p-3.5 border border-zinc-100 rounded-2xl shadow-lg z-30">
              <div className="h-12 w-full rounded-xl bg-zinc-300 shimmer-bg" />
            </div>
          </div>
        );
      }

      // Default fallback layout skeleton
      return (
        <div className="flex-grow space-y-8 pb-20 overflow-y-auto px-5 pt-4 animate-fade-in">
          <div className="h-6 w-40 bg-zinc-200 rounded shimmer-bg" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-50 border border-zinc-100 p-5 rounded-2xl space-y-3">
                <div className="h-4 w-1/3 bg-zinc-200 rounded shimmer-bg" />
                <div className="h-3 w-full bg-zinc-150 rounded shimmer-bg" />
                <div className="h-3 w-4/5 bg-zinc-150 rounded shimmer-bg" />
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-white text-zinc-900 font-sans flex flex-col select-none max-w-[480px] mx-auto border-x border-zinc-100/50 relative shadow-2xs">
        {/* Style block containing premium shimmer-bg style and animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer-sweep {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .shimmer-bg {
            background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 37%, #f4f4f5 63%);
            background-size: 200% 100%;
            animation: shimmer-sweep 1.4s ease-in-out infinite;
          }
        ` }} />

        {/* Skeleton Top Header bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-zinc-100 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-150/50 shimmer-bg" />
            <div className="h-4 w-28 bg-zinc-200 rounded shimmer-bg" />
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-100 shimmer-bg" />
        </div>

        {/* Dynamic Content area */}
        {renderActiveSkeleton()}

        {/* Footer Navigation Bar Skeleton matching floating bottom bar dimensions exactly */}
        <div className="fixed bottom-4 left-4 right-4 max-w-[448px] mx-auto bg-white/95 backdrop-blur-md border border-zinc-150/80 h-16 rounded-2xl z-40 flex justify-between items-center px-6 select-none shadow-lg">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-1.5 w-12">
              <div className="w-5 h-5 rounded-full bg-zinc-150/80 shimmer-bg animate-pulse" />
              <div className="h-2 w-8 bg-zinc-150/60 rounded shimmer-bg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error/Shop Not Found Screen
  if (error || !shop) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-6 text-center font-sans gap-4 select-none">
        <ShieldAlert className="w-12 h-12 text-green-600 animate-bounce" />
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">Storefront Offline</h1>
        <p className="text-zinc-500 text-xs max-w-xs leading-relaxed break-all">
          {error !== 'not_found' && error ? `Error: ${error}` : "Could not locate boutique parameters matching this handle. Check the link or explore standard directories."}
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-4 px-6 py-2.5 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 transition-colors cursor-pointer shadow-sm"
        >
          Return Home
        </button>
      </div>
    );
  }

  // RENDER DYNAMIC PAGE
  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return (
          <StorefrontHome
            shop={shop}
            products={products}
            categories={categories}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onNavigateToPage={navigateToPage}
            onAddToCartDirectly={handleAddToCartDirectly}
            onShareShop={handleShareShop}
          />
        );
      case 'shop':
        return (
          <StorefrontShop
            shop={shop}
            products={products}
            categories={categories}
            onNavigateToPage={navigateToPage}
            initialCategory={searchParams.get('category') || 'all'}
            initialSort={searchParams.get('sort') || 'newest'}
          />
        );
      case 'product':
        const prod = products.find(p => p.id === searchParams.get('productId'));
        if (!prod) return render404Page();
        return (
          <StorefrontProductDetail
            product={prod}
            shop={shop}
            allProducts={products}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onNavigateToPage={navigateToPage}
            onBack={handleBackNavigation}
          />
        );
      case 'categories':
        return (
          <StorefrontCategories
            products={products}
            categories={categories}
            onNavigateToPage={navigateToPage}
          />
        );
      case 'cart':
        return (
          <StorefrontCart
            shop={shop}
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveCartItem}
            onNavigateToPage={navigateToPage}
            shippingMethod={shippingMethod}
            onChangeShippingMethod={setShippingMethod}
          />
        );
      case 'checkout':
        return (
          <StorefrontCheckout
            shop={shop}
            cart={cart}
            shippingMethod={shippingMethod}
            onNavigateToPage={navigateToPage}
            onClearCart={handleClearCart}
            onSetLastOrder={setLastOrder}
            onBack={handleBackNavigation}
          />
        );
      case 'success':
        return (
          <StorefrontOrderSuccess
            shop={shop}
            lastOrder={lastOrder}
            onNavigateToPage={navigateToPage}
          />
        );
      case 'track':
        return (
          <StorefrontTrackOrder
            shop={shop}
            onNavigateToPage={navigateToPage}
            initialOrderRef={searchParams.get('orderRef') || ''}
          />
        );
      case 'account':
        return (
          <StorefrontAccount
            shop={shop}
            onNavigateToPage={navigateToPage}
            savedAddress={savedAddress}
            onSaveAddress={handleSaveAddress}
          />
        );
      case 'wishlist':
        return (
          <StorefrontWishlist
            shop={shop}
            products={products}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onAddToCartDirectly={handleAddToCartDirectly}
            onNavigateToPage={navigateToPage}
          />
        );
      case 'about':
        return (
          <StorefrontAbout
            shop={shop}
            onNavigateToPage={navigateToPage}
          />
        );
      case 'contact':
        return (
          <StorefrontContact
            shop={shop}
          />
        );
      case 'terms':
        return renderPolicyPage('Terms & Conditions', 'Every order represents a binding commitment to our bespoke tailoring coordinates. Standard dispatch takes up to 7 business logistics days. Exchanges are permitted within 48 hours in original condition tags intact.');
      case 'privacy':
        return renderPolicyPage('Privacy Framework', 'Your delivery details, physical coordinates, and phone references are secured within our local database. No data is shared with external advertising agents.');
      case '404':
      default:
        return render404Page();
    }
  };

  const renderPolicyPage = (title: string, bodyText: string) => (
    <div className="space-y-6 px-5 pb-16 text-left select-none bg-white min-h-screen pt-6">
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-green-600 font-sans">Brand Policy</span>
        <h2 className="font-sans text-xl font-bold tracking-tight text-zinc-900">{title}</h2>
      </div>
      <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-2xl">
        <p className="text-sm text-zinc-600 leading-relaxed font-sans">{bodyText}</p>
      </div>
      <button
        onClick={() => navigateToPage('home')}
        className="w-full py-3 bg-zinc-100 border border-zinc-200 text-zinc-850 text-xs font-semibold rounded-xl hover:bg-zinc-200 cursor-pointer transition-colors"
      >
        Return to Home
      </button>
    </div>
  );

  const render404Page = () => (
    <div className="py-24 text-center px-5 space-y-4 select-none bg-white min-h-screen">
      <h3 className="font-sans text-5xl font-extrabold text-green-600 tracking-tighter leading-none">404</h3>
      <div className="space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 font-sans">Page Not Found</span>
        <h4 className="text-sm font-bold text-zinc-900">This view does not exist</h4>
      </div>
      <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
        The requested boutique page coordinates do not exist or are offline. Let's return to the active catalog collection.
      </p>
      <div className="flex gap-2 pt-3">
        <button
          onClick={() => navigateToPage('home')}
          className="flex-1 py-2.5 bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl hover:bg-zinc-200 cursor-pointer transition-colors"
        >
          Go Home
        </button>
        <button
          onClick={() => navigateToPage('shop')}
          className="flex-grow py-2.5 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 cursor-pointer transition-colors"
        >
          Browse Shop
        </button>
      </div>
    </div>
  );

  return (
    <div className="storefront-root min-h-screen bg-zinc-50 text-zinc-900 flex justify-center font-sans antialiased overflow-x-hidden selection:bg-[#bef715] selection:text-black">
      {/* Centered Mobile Frame container on desktop */}
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col relative border-x border-zinc-200/60 shadow-xl relative select-none">
        
        {/* THREADZW BRAND GREEN BANNER */}
        <div 
          onClick={() => navigate('/')}
          className="bg-[#bef715] hover:opacity-90 text-black py-1.5 px-4 text-[10px] font-bold tracking-wider uppercase text-center cursor-pointer transition-all flex items-center justify-center gap-1 select-none font-sans"
        >
          <span>Powered by ThreadZW 💚</span>
        </div>

        {/* ----------------- GLOBAL HEADER ----------------- */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b border-zinc-100">
          <button 
            type="button" 
            onClick={() => setShowMenu(true)}
            className="w-8 h-8 rounded-full border border-zinc-200/50 bg-zinc-50 overflow-hidden cursor-pointer flex items-center justify-center transition-transform hover:scale-105"
            title="Open Menu"
          >
            <ShopLogo shop={shop} size={32} className="w-full h-full object-cover rounded-full" />
          </button>

          <span 
            onClick={() => navigateToPage('home')}
            className="font-bold text-base tracking-tight font-sans text-zinc-900 hover:text-zinc-700 cursor-pointer"
          >
            {shop.name}
          </span>

          <div className="flex items-center gap-1.5">
            <button 
              type="button" 
              onClick={handleShareShop}
              className="p-1.5 text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer"
              title="Share Shop"
            >
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button 
              type="button" 
              onClick={() => navigateToPage('shop')}
              className="p-1.5 text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer"
              title="Search catalog"
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
            </button>
            
            <button 
              type="button" 
              onClick={() => navigateToPage('cart')}
              className="p-1.5 text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer relative"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              {cart.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-[#bef715] text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* ----------------- INTERACTIVE MAIN PANEL ----------------- */}
        <main id="storefront-main-scroll" className="flex-1 overflow-y-auto pb-24 bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>

          {/* ----------------- UNIFIED FOOTER ----------------- */}
          {activePage !== 'success' && activePage !== 'checkout' && activePage !== 'product' && (
            <footer className="mt-12 border-t border-zinc-100 bg-zinc-50/50 p-6 space-y-6 text-left border-b border-zinc-100 pb-20 select-none">
              <div className="space-y-1">
                <span className="text-sm font-bold text-zinc-900 block">{shop.name}</span>
                <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                  Zimbabwe's easiest shop link. Friendly, clean, and mobile-first. Powered by ThreadZW.
                </p>
              </div>

              {/* Navigation links */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-600">
                <div className="space-y-2.5">
                  <button onClick={() => navigateToPage('shop')} className="block hover:text-green-600 cursor-pointer text-left">Browse Shop</button>
                  <button onClick={() => navigateToPage('about')} className="block hover:text-green-600 cursor-pointer text-left">About Brand</button>
                  <button onClick={() => navigateToPage('contact')} className="block hover:text-green-600 cursor-pointer text-left">Contact Us</button>
                </div>
                <div className="space-y-2.5">
                  <button onClick={() => navigateToPage('track')} className="block hover:text-green-600 cursor-pointer text-left">Track Order</button>
                  <button onClick={() => navigateToPage('terms')} className="block hover:text-green-600 cursor-pointer text-left">Terms & Conditions</button>
                  <button onClick={() => navigateToPage('privacy')} className="block hover:text-green-600 cursor-pointer text-left">Privacy Policy</button>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex flex-col gap-1 text-[10px] text-zinc-400">
                <span>© {new Date().getFullYear()} {shop.name}. All rights reserved.</span>
                <span>Powered by ThreadZW 💚</span>
              </div>
            </footer>
          )}
        </main>

        {/* ----------------- MOBILE BOTTOM NAVIGATION BAR ----------------- */}
        <nav className="fixed bottom-4 left-4 right-4 max-w-[448px] mx-auto bg-white/95 backdrop-blur-md border border-zinc-150/80 h-16 rounded-2xl z-40 flex justify-between items-center px-3 select-none shadow-lg">
          <button
            onClick={() => navigateToPage('home')}
            className={`flex flex-col items-center justify-center flex-grow h-full gap-0.5 cursor-pointer transition-colors ${
              activePage === 'home' ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600 font-medium'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
            {activePage === 'home' && <div className="w-1 h-1 rounded-full bg-[#bef715]" />}
          </button>

          <button
            onClick={() => navigateToPage('shop')}
            className={`flex flex-col items-center justify-center flex-grow h-full gap-0.5 cursor-pointer transition-colors ${
              activePage === 'shop' ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600 font-medium'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px]">Shop</span>
            {activePage === 'shop' && <div className="w-1 h-1 rounded-full bg-[#bef715]" />}
          </button>

          <button
            onClick={() => navigateToPage('cart')}
            className={`flex flex-col items-center justify-center flex-grow h-full gap-0.5 cursor-pointer relative transition-colors ${
              activePage === 'cart' ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600 font-medium'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <div className="absolute top-1 right-5 bg-[#bef715] text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
            )}
            <span className="text-[10px]">Cart</span>
            {activePage === 'cart' && <div className="w-1 h-1 rounded-full bg-[#bef715] mt-0.5" />}
          </button>

          <button
            onClick={() => navigateToPage('account')}
            className={`flex flex-col items-center justify-center flex-grow h-full gap-0.5 cursor-pointer transition-colors ${
              activePage === 'account' ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600 font-medium'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Account</span>
            {activePage === 'account' && <div className="w-1 h-1 rounded-full bg-[#bef715]" />}
          </button>
        </nav>

        {/* ----------------- LOCATION BOTTOM SHEET ----------------- */}
        <AnimatePresence>
          {showLocationSheet && hasLocationInfo && (
            <>
              {/* Backdrop covering the mobile bounds container with premium blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLocationSheet(false)}
                className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 rounded-2xl cursor-pointer"
              />

              {/* Slide-up premium panel with spring animation & iOS-inspired drag down to close */}
              <motion.div
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.15}
                onDragEnd={(e, info) => {
                  if (info.offset.y > 120) {
                    setShowLocationSheet(false);
                  }
                }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                className="absolute inset-x-0 bottom-0 max-h-[85%] bg-white rounded-t-[32px] border-t border-zinc-150/80 shadow-2xl z-50 flex flex-col pb-6 overflow-hidden text-left"
              >
                {/* Drag handle block */}
                <div className="w-full pt-3 pb-2 flex justify-center cursor-row-resize select-none shrink-0">
                  <div className="w-12 h-1.5 bg-zinc-200/80 hover:bg-zinc-300 rounded-full transition-colors" />
                </div>

                {/* Header Section */}
                <div className="px-5 pb-4 border-b border-zinc-100/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0 shadow-sm border border-green-100/50">
                      <MapPin className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 font-sans tracking-tight leading-tight">{shop.name}</h3>
                      <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest leading-none mt-1">Visit Storefront & Directions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLocationSheet(false)}
                    className="p-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer flex items-center justify-center"
                    title="Close Details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable details */}
                <div className="p-5 space-y-5 overflow-y-auto font-sans text-xs flex-1">
                  
                  <div className="space-y-4">
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3.5 text-left w-full">
                      {/* 📍 Address */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm shrink-0">📍</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Address</span>
                          <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shop.shop_address || shop.location || shop.town || 'Bulawayo CBD'}</span>
                        </div>
                      </div>

                      {/* 📍 Building */}
                      {(shop.building_name) && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm shrink-0">📍</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Building</span>
                            <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shop.building_name}</span>
                          </div>
                        </div>
                      )}

                      {/* 🏢 Floor */}
                      {(shop.floor) && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm shrink-0">🏢</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Floor</span>
                            <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shop.floor}</span>
                          </div>
                        </div>
                      )}

                      {/* 🚪 Shop Number */}
                      {(shop.shop_number) && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm shrink-0">🚪</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Shop Number</span>
                            <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shop.shop_number}</span>
                          </div>
                        </div>
                      )}

                      {/* 📌 Landmark */}
                      {(shop.landmark) && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm shrink-0">📌</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Landmark</span>
                            <span className="text-xs font-semibold text-zinc-900 font-sans break-words block">{shop.landmark}</span>
                          </div>
                        </div>
                      )}

                      {/* 🧭 Directions (Most prominent) */}
                      {(shop.directions) && (
                        <div className="bg-white border-2 border-green-200/80 rounded-xl p-3 shadow-xs mt-3 flex items-start gap-3">
                          <span className="text-base shrink-0 mt-0.5">🧭</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-extrabold text-green-700 uppercase tracking-wider block font-mono">Directions</span>
                            <p className="text-xs font-bold text-zinc-950 font-sans mt-0.5 leading-relaxed break-words whitespace-pre-wrap">
                              {shop.directions}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trading Hours */}
                  <div className="space-y-1.5 px-1 pt-1">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest block">Trading Hours</span>
                    <div className="flex items-center gap-2.5 text-zinc-700 font-medium">
                      <Clock className="w-4 h-4 text-green-600 shrink-0" />
                      <p className="leading-none text-xs">{shop.hours || "Monday - Saturday: 8:30 AM - 6:00 PM (Closed Sundays)"}</p>
                    </div>
                  </div>

                  {/* Delivery Availability */}
                  <div className="space-y-1.5 px-1">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest block">Delivery & Shipping</span>
                    <div className="flex items-start gap-2.5 text-zinc-700 bg-green-50/30 border border-green-100/40 p-3 rounded-xl">
                      <Truck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-green-700 uppercase tracking-wider block">Availability</span>
                        <p className="text-zinc-650 leading-relaxed font-sans font-medium text-[11px]">
                          {shop.delivery_info?.trim() || `Showroom pickup available in ${shop.city || 'Zimbabwe'}. Secured nationwide courier shipping & door delivery options are calculated during checkout.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick helper tip */}
                  <div className="bg-zinc-50 rounded-xl p-3 text-[10px] text-zinc-450 leading-normal flex items-start gap-2">
                    <span className="text-zinc-400">💡</span>
                    <span>Feel free to swipe this panel down or tap the outer shadow at any time to return to browsing.</span>
                  </div>

                  {/* Actions mapping links */}
                  {shop.whatsapp && (
                    <div className="pt-2">
                      <a
                        href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hi, I'm interested in visiting your shop. Could I get more details on visiting your physical showroom?`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white text-center rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm hover:shadow-md uppercase tracking-wider"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Enquire via WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ----------------- HAMBURGER SLIDE-IN MENU ----------------- */}
        <AnimatePresence>
          {showMenu && (
            <>
              {/* Overlay Backdrop shadow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMenu(false)}
                className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs z-50 max-w-[480px] mx-auto"
              />

              {/* Sidebar Panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed inset-y-0 left-0 w-72 bg-white border-r border-zinc-100 z-50 flex flex-col p-6 space-y-6 text-left shadow-2xl"
              >
                {/* Close Row */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <span className="font-bold text-base tracking-tight text-zinc-900">{shop.name}</span>
                  <button 
                    onClick={() => setShowMenu(false)}
                    className="p-1.5 bg-zinc-50 border border-zinc-150 rounded-full hover:bg-zinc-100 text-zinc-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sidebar Links */}
                <div className="space-y-4 text-xs font-semibold text-zinc-600 flex-grow">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-green-600 pb-1 block">Menu Directory</div>
                  <button onClick={() => navigateToPage('home')} className="block hover:text-green-600 py-2 cursor-pointer w-full text-left border-b border-zinc-50">Home</button>
                  <button onClick={() => navigateToPage('shop')} className="block hover:text-green-600 py-2 cursor-pointer w-full text-left border-b border-zinc-50">Shop</button>
                  <button onClick={() => navigateToPage('categories')} className="block hover:text-green-600 py-2 cursor-pointer w-full text-left border-b border-zinc-50">Categories</button>
                  <button onClick={() => navigateToPage('wishlist')} className="block hover:text-green-600 py-2 cursor-pointer w-full text-left flex items-center justify-between border-b border-zinc-50">
                    <span>Wishlist</span>
                    <Heart className="w-4 h-4 text-green-600" />
                  </button>
                  <button onClick={() => navigateToPage('about')} className="block hover:text-green-600 py-2 cursor-pointer w-full text-left border-b border-zinc-50">About Brand</button>
                  <button onClick={() => navigateToPage('contact')} className="block hover:text-green-600 py-2 cursor-pointer w-full text-left">Contact Us</button>
                </div>

                {/* Bottom coordinates */}
                <div className="border-t border-zinc-100 pt-4 space-y-1 text-xs text-zinc-400">
                  <p>Location: {shop.city || shop.location || (shop.id?.startsWith('shop-') ? 'Available Online' : 'Harare')}, Zimbabwe</p>
                  <p>Powered by ThreadZW 💚</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
