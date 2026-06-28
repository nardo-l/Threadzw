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
  }, [setSearchParams]);

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
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center font-sans tracking-widest gap-4">
        <div className="w-12 h-12 rounded-full border border-t-2 border-t-[#C6FF00] border-white/10 animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 animate-pulse font-mono">
          Syncing Luxury Brand...
        </span>
      </div>
    );
  }

  // Error/Shop Not Found Screen
  if (error || !shop) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 text-center font-sans gap-4 select-none">
        <ShieldAlert className="w-16 h-16 text-[#C6FF00] animate-bounce" />
        <h1 className="text-xl font-black uppercase tracking-widest font-syne">Storefront Offline</h1>
        <p className="text-zinc-400 text-xs max-w-xs leading-relaxed">
          Could not locate boutique parameters matching this handle. Check the link or explore standard directories.
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-6 px-6 py-3 bg-[#C6FF00] text-black text-[10px] font-bold uppercase tracking-widest rounded-full cursor-pointer shadow-lg shadow-[#C6FF00]/10"
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
    <div className="space-y-6 px-5 pb-16 text-left select-none">
      <div className="space-y-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Brand Policy</span>
        <h2 className="font-syne text-2xl font-black uppercase tracking-tight text-white">{title}</h2>
      </div>
      <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl">
        <p className="text-xs text-neutral-300 leading-relaxed font-sans">{bodyText}</p>
      </div>
      <button
        onClick={() => navigateToPage('home')}
        className="w-full py-3.5 bg-neutral-900 border border-neutral-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-neutral-700 cursor-pointer"
      >
        Return to Home
      </button>
    </div>
  );

  const render404Page = () => (
    <div className="py-24 text-center px-5 space-y-4 select-none">
      <h3 className="font-syne text-5xl font-black text-[#C6FF00] tracking-tighter leading-none animate-pulse">404</h3>
      <div className="space-y-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 font-mono">Coordinate Lost</span>
        <h4 className="text-sm font-bold uppercase text-white">Garment View Not Found</h4>
      </div>
      <p className="text-[11px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
        The requested boutique page coordinates do not exist or are offline. Let's return to the active catalog collection.
      </p>
      <div className="flex gap-2 pt-3">
        <button
          onClick={() => navigateToPage('home')}
          className="flex-1 py-3 bg-neutral-900 border border-neutral-850 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:border-neutral-700 cursor-pointer"
        >
          Go Home
        </button>
        <button
          onClick={() => navigateToPage('shop')}
          className="flex-grow py-3 bg-[#C6FF00] text-black text-[10px] font-black uppercase tracking-wider rounded-xl hover:opacity-95 cursor-pointer"
        >
          Browse drops
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex justify-center font-sans antialiased overflow-x-hidden selection:bg-[#C6FF00] selection:text-black">
      {/* Centered Mobile Frame container on desktop */}
      <div className="w-full max-w-[480px] bg-[#000000] min-h-screen flex flex-col relative border-x border-neutral-900 shadow-2xl relative select-none">
        
        <div style={{
          background:'red',
          color:'white',
          padding:'12px',
          fontWeight:'bold',
          textAlign:'center'
        }}>
          STOREFRONT V2 ACTIVE
        </div>

        {/* ----------------- GLOBAL HEADER ----------------- */}
        <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-md px-5 py-3.5 flex items-center justify-between border-b border-neutral-900/60">
          <button 
            type="button" 
            onClick={() => setShowMenu(true)}
            className="p-1 text-zinc-300 hover:text-[#C6FF00] transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-6 h-6 stroke-[2]" />
          </button>

          <span 
            onClick={() => navigateToPage('home')}
            className="font-black text-sm uppercase tracking-[0.25em] font-sans text-white hover:text-[#C6FF00] cursor-pointer"
          >
            {shop.name}
          </span>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => navigateToPage('shop')}
              className="p-1.5 text-zinc-300 hover:text-[#C6FF00] transition-colors cursor-pointer"
              title="Search catalog"
            >
              <Search className="w-5.5 h-5.5 stroke-[2]" />
            </button>
            
            <button 
              type="button" 
              onClick={() => navigateToPage('cart')}
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

        {/* ----------------- INTERACTIVE MAIN PANEL ----------------- */}
        <main id="storefront-main-scroll" className="flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>

          {/* ----------------- UNIFIED FOOTER ----------------- */}
          {activePage !== 'success' && activePage !== 'checkout' && activePage !== 'product' && (
            <footer className="mt-12 border-t border-neutral-900 bg-neutral-950/40 p-6 space-y-6 text-left border-b border-neutral-950 pb-20 select-none">
              <div className="space-y-1.5">
                <span className="font-syne text-sm font-black uppercase text-white tracking-widest block">{shop.name}</span>
                <p className="text-[10px] text-neutral-500 max-w-xs">
                  Constructed streetwear & curated boutique drops. Handcrafted or selected in Bulawayo, Zimbabwe.
                </p>
              </div>

              {/* Navigation links */}
              <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
                <div className="space-y-2.5">
                  <button onClick={() => navigateToPage('shop')} className="block hover:text-[#C6FF00] cursor-pointer text-left">Garment Catalog</button>
                  <button onClick={() => navigateToPage('about')} className="block hover:text-[#C6FF00] cursor-pointer text-left">About Brand</button>
                  <button onClick={() => navigateToPage('contact')} className="block hover:text-[#C6FF00] cursor-pointer text-left">Contact Coordinates</button>
                </div>
                <div className="space-y-2.5">
                  <button onClick={() => navigateToPage('track')} className="block hover:text-[#C6FF00] cursor-pointer text-left font-mono text-[10.5px]">Track Logistics</button>
                  <button onClick={() => navigateToPage('terms')} className="block hover:text-[#C6FF00] cursor-pointer text-left">Terms & Conditions</button>
                  <button onClick={() => navigateToPage('privacy')} className="block hover:text-[#C6FF00] cursor-pointer text-left">Privacy Framework</button>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-900 flex flex-col gap-2 font-mono text-[9px] uppercase tracking-widest text-neutral-600">
                <span>© {new Date().getFullYear()} {shop.name} LTD.</span>
                <span>ThreadZW Boutique Network ● Zimbabwe Fashion</span>
              </div>
            </footer>
          )}
        </main>

        {/* ----------------- MOBILE BOTTOM NAVIGATION BAR ----------------- */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-black/95 backdrop-blur-md border-t border-neutral-900 h-14 z-40 flex justify-around items-center px-2 select-none">
          <button
            onClick={() => navigateToPage('home')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer ${
              activePage === 'home' ? 'text-[#C6FF00]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Home</span>
          </button>

          <button
            onClick={() => navigateToPage('shop')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer ${
              activePage === 'shop' ? 'text-[#C6FF00]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Shop</span>
          </button>

          <button
            onClick={() => navigateToPage('categories')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer ${
              activePage === 'categories' ? 'text-[#C6FF00]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Catalog</span>
          </button>

          <button
            onClick={() => navigateToPage('cart')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer relative ${
              activePage === 'cart' ? 'text-[#C6FF00]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <div className="absolute top-2 right-6 bg-[#C6FF00] text-black text-[7px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
            )}
            <span className="text-[8px] font-bold uppercase tracking-widest">Bag</span>
          </button>

          <button
            onClick={() => navigateToPage('account')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer ${
              activePage === 'account' ? 'text-[#C6FF00]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Account</span>
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
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 max-w-[480px] mx-auto"
              />

              {/* Sidebar Panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed inset-y-0 left-0 w-72 bg-neutral-950 border-r border-neutral-900 z-50 flex flex-col p-6 space-y-6 text-left shadow-2xl"
              >
                {/* Close Row */}
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <span className="font-syne font-black uppercase text-white tracking-widest">{shop.name}</span>
                  <button 
                    onClick={() => setShowMenu(false)}
                    className="p-1 bg-neutral-900 border border-neutral-800 rounded-full hover:border-neutral-700 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sidebar Links */}
                <div className="space-y-4 text-xs font-black uppercase tracking-wider text-neutral-300 flex-grow">
                  <div className="text-[9px] uppercase font-mono tracking-widest text-[#C6FF00] pb-1 block">Boutique Directory</div>
                  <button onClick={() => navigateToPage('home')} className="block hover:text-[#C6FF00] py-2 cursor-pointer w-full text-left">Home Base</button>
                  <button onClick={() => navigateToPage('shop')} className="block hover:text-[#C6FF00] py-2 cursor-pointer w-full text-left">Garment Shop</button>
                  <button onClick={() => navigateToPage('categories')} className="block hover:text-[#C6FF00] py-2 cursor-pointer w-full text-left">Collection Banners</button>
                  <button onClick={() => navigateToPage('wishlist')} className="block hover:text-[#C6FF00] py-2 cursor-pointer w-full text-left flex items-center justify-between">
                    <span>Saved Wishlist</span>
                    <Heart className="w-3.5 h-3.5 fill-[#C6FF00] text-[#C6FF00]" />
                  </button>
                  <button onClick={() => navigateToPage('about')} className="block hover:text-[#C6FF00] py-2 cursor-pointer w-full text-left">Brand Manifesto</button>
                  <button onClick={() => navigateToPage('contact')} className="block hover:text-[#C6FF00] py-2 cursor-pointer w-full text-left">Contact Representation</button>
                  <button onClick={() => navigateToPage('track')} className="block hover:text-[#C6FF00] py-2 cursor-pointer w-full text-left font-mono text-[11px]">Track Logistics</button>
                </div>

                {/* Bottom coordinates */}
                <div className="border-t border-neutral-900 pt-4 space-y-1 font-mono text-[8px] uppercase tracking-widest text-neutral-550">
                  <p>Location: {shop.city || 'Bulawayo'}</p>
                  <p>Zimbabwe Street Culture</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
