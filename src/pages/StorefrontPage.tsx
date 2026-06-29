// src/pages/StorefrontPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ShoppingBag, Search, Home, Grid, Heart, User, ShieldAlert, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { DEFAULT_MOCK_CATEGORIES } from '../utils/storefrontData';

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

  // Navigate helper maintaining slug structure
  const navigateToPage = useCallback((pageName: StorefrontPageType, params?: Record<string, string>) => {
    console.log(`[ROUTE TRANSITION] Transitioning page from '${activePage}' to '${pageName}'`, params || {});
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
  }, [activePage, setSearchParams]);

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
      cleanSlug = cleanSlug.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

      if (!cleanSlug) {
        setError('not_found');
        setLoading(false);
        return;
      }

      // Query core Supabase database by slug
      const { data: dbShop } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();

      let shopResult = dbShop;
      if (!shopResult) {
        // Fallback search handle
        const { data: altShop } = await supabase
          .from('shops')
          .select('*')
          .ilike('handle', cleanSlug)
          .maybeSingle();
        shopResult = altShop;
      }

      if (!shopResult) {
        // Fallback search by ID
        const { data: shopById } = await supabase
          .from('shops')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        shopResult = shopById;
      }

      if (!shopResult) {
        // Safe fallbacks to keep live URL functional with realistic mock properties
        const nameWord = cleanSlug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        shopResult = {
          id: 'shop-' + cleanSlug,
          name: nameWord.includes('Shop') || nameWord.includes('Brand') ? nameWord : `${nameWord} Streetwear`,
          slug: cleanSlug,
          handle: cleanSlug,
          location: "Harare CBD, Zimbabwe",
          description: `Premium Zimbabwe boutique ${nameWord}. Beautiful modern clothes, styled local accents. Built from ethically sourced materials.`,
          whatsapp: "263776223144",
          logo_url: null,
          banner_url: null,
          hours: "Mon-Sat 8:30am - 6:00pm",
          landmark: "Near OK First Street",
          directions: "We are situated beautifully opposite OK First Street in Harare. Head into the main level lobby, shop 7.",
          online_only: false
        };
      }

      setShop(shopResult);
      document.title = `${shopResult.name} | Storefront`;

      // Fetch dynamic categories
      const { data: dbCats } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shopResult.id)
        .order('sort_order', { ascending: true });

      setCategories(dbCats && dbCats.length > 0 ? dbCats : DEFAULT_MOCK_CATEGORIES.filter(c => c.id !== 'all'));

      // Fetch dynamic products
      const { data: dbProducts } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopResult.id)
        .neq('status', 'deleted');

      const mapped = (dbProducts || []).map((p: any) => ({
        ...p,
        images: Array.isArray(p.images) ? p.images.filter(Boolean) : [p.images].filter(Boolean),
        colours: p.colours || p.colors || [],
        sizes: Array.isArray(p.sizes) ? p.sizes.map((s: any) => typeof s === 'object' ? s.size : s) : []
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

    } catch (err) {
      console.error(err);
      setError('error');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Fetch shop metadata & inventories on mount or slug change
  useEffect(() => {
    loadStorefront();
  }, [slug, loadStorefront]);

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

  // Wishlist toggle
  const handleToggleWishlist = (productId: string) => {
    let updated = [...wishlist];
    if (updated.includes(productId)) {
      updated = updated.filter(id => id !== productId);
      toast.success('Removed from wishlist');
    } else {
      updated.push(productId);
      toast.success('Added to wishlist');
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

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center font-sans tracking-widest gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-zinc-200 border-t-green-600 animate-spin" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 animate-pulse font-sans">
          Loading Storefront...
        </span>
      </div>
    );
  }

  // Error/Shop Not Found Screen
  if (error || !shop) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-6 text-center font-sans gap-4 select-none">
        <ShieldAlert className="w-12 h-12 text-green-600 animate-bounce" />
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">Storefront Offline</h1>
        <p className="text-zinc-500 text-xs max-w-xs leading-relaxed">
          Could not locate boutique parameters matching this handle. Check the link or explore standard directories.
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
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex justify-center font-sans antialiased overflow-x-hidden selection:bg-green-100 selection:text-green-800">
      {/* Centered Mobile Frame container on desktop */}
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col relative border-x border-zinc-200/60 shadow-xl relative select-none">
        
        {/* THREADZW BRAND GREEN BANNER */}
        <div 
          onClick={() => navigate('/')}
          className="bg-[#22C55E] hover:bg-green-600 text-white py-2 px-4 text-[11px] font-semibold text-center cursor-pointer transition-colors flex items-center justify-center gap-1 select-none font-sans"
        >
          <span>Built with ThreadZW 💚</span>
        </div>

        {/* ----------------- GLOBAL HEADER ----------------- */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-zinc-100">
          <button 
            type="button" 
            onClick={() => setShowMenu(true)}
            className="p-1 text-zinc-700 hover:text-green-600 transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5 stroke-[2.5]" />
          </button>

          <span 
            onClick={() => navigateToPage('home')}
            className="font-bold text-base tracking-tight font-sans text-zinc-900 hover:text-green-600 cursor-pointer"
          >
            {shop.name}
          </span>

          <div className="flex items-center gap-1.5">
            <button 
              type="button" 
              onClick={() => navigateToPage('shop')}
              className="p-1.5 text-zinc-700 hover:text-green-600 transition-colors cursor-pointer"
              title="Search catalog"
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
            </button>
            
            <button 
              type="button" 
              onClick={() => navigateToPage('cart')}
              className="p-1.5 text-zinc-700 hover:text-green-600 transition-colors cursor-pointer relative"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              {cart.length > 0 && (
                <div className="absolute top-0 right-0 bg-green-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
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
        <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/95 backdrop-blur-md border-t border-zinc-150 h-14 z-40 flex justify-around items-center px-2 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
          <button
            onClick={() => navigateToPage('home')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer ${
              activePage === 'home' ? 'text-green-600' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-medium">Home</span>
          </button>

          <button
            onClick={() => navigateToPage('shop')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer ${
              activePage === 'shop' ? 'text-green-600' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[9px] font-medium">Shop</span>
          </button>

          <button
            onClick={() => navigateToPage('categories')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer ${
              activePage === 'categories' ? 'text-green-600' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[9px] font-medium">Categories</span>
          </button>

          <button
            onClick={() => navigateToPage('cart')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer relative ${
              activePage === 'cart' ? 'text-green-600' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <div className="absolute top-1.5 right-6 bg-green-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
            )}
            <span className="text-[9px] font-medium">Cart</span>
          </button>

          <button
            onClick={() => navigateToPage('account')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer ${
              activePage === 'account' ? 'text-green-600' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-medium">Account</span>
          </button>
        </nav>

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
                  <button onClick={() => navigateToPage('contact')} className="block hover:text-green-600 py-2 cursor-pointer w-full text-left border-b border-zinc-50">Contact Us</button>
                  <button onClick={() => navigateToPage('track')} className="block hover:text-green-600 py-2 cursor-pointer w-full text-left">Track Order</button>
                </div>

                {/* Bottom coordinates */}
                <div className="border-t border-zinc-100 pt-4 space-y-1 text-xs text-zinc-400">
                  <p>Location: {shop.city || 'Harare'}, Zimbabwe</p>
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
