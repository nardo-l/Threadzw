// src/screens/PublicShopPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { parseShopConfig } from '../utils/configHelper';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, MapPin, Package, Clock, X, ShoppingBag, 
  Search, Eye, Heart, Info, Phone, Copy, Check, Grid, 
  Plus, Minus, Star, Menu, MessageSquare, ChevronDown
} from 'lucide-react';
import { 
  DEFAULT_MOCK_CATEGORIES, 
  MOCK_REVIEWS_PRESETS, 
  getZimbabweDirections, 
  WHATSAPP_MESSAGE_TEMPLATES, 
  getColorHex 
} from '../utils/storefrontData';
import { 
  getImageUrl, 
  getShopLogoUrl, 
  getShopBannerUrl, 
  getProductImageUrl 
} from '../utils/imageUrl';
import { ShopLogo, ShopBanner, ProductImage } from '../components/ui/ShopImage';

// Custom white SVG WhatsApp icon
const WhatsAppIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.368-.18-2.163-1.07-2.5-1.192-.333-.125-.577-.184-.817.184-.24.368-.934 1.192-1.144 1.438-.21.244-.417.27-.785.092-1.42-.71-2.47-1.31-3.32-2.766-.226-.39.226-.362.648-1.2.073-.146.036-.272-.018-.38-.054-.11-.482-1.162-.663-1.597-.174-.42-.37-.362-.507-.369-.13-.007-.28-.009-.43-.009-.15 0-.396.056-.604.28-.208.225-.792.775-.792 1.888s.81 2.195.922 2.348c.11.15 1.593 2.435 3.86 3.414.54.233.96.372 1.288.477.544.172 1.037.147 1.428.09.435-.065 1.332-.544 1.52-.1.9-.187.356-.347.534-.347.18 0 .324-.09.24-.265zM12.004 2c-5.518 0-10 4.482-10 10 0 1.764.462 3.486 1.333 5.01L2 22l5.12-1.332c1.478.805 3.14 1.233 4.88 1.233 5.518 0 10-4.482 10-10S17.52 2 12.004 2zm0 18c-1.53 0-3.033-.404-4.352-1.166l-.313-.186-3.23.84.856-3.147-.205-.326C4.015 14.88 3.5 13.12 3.5 11.25c0-4.687 3.813-8.5 8.5-8.5s8.5 3.813 8.5 8.5-3.813 8.5-8.5 8.5z"/>
  </svg>
);

const formatWA = (num: string) => {
  if (!num) return '263776223144';
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('263')) return cleaned;
  if (cleaned.startsWith('0')) return '263' + cleaned.slice(1);
  return '263' + (cleaned || '776223144');
};

interface CartItem {
  product: any;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export const PublicShopPage: React.FC<{ handle?: string }> = ({ handle }) => {
  const { shopSlug } = useParams<{ shopSlug?: string }>();
  const navigate = useNavigate();
  const currentSlug = shopSlug || handle || '';
  const { showToast } = useToast();

  // Core Data State
  const [shop, setShop] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Layout View Tabs: 'home' | 'categories' | 'contact' | 'visit' | 'wishlist' | 'info'
  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'contact' | 'visit' | 'wishlist' | 'info'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Filters & Product Overlay
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'recent' | 'priceAsc' | 'priceDesc'>('recent');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Cart & Checkout Flow
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({
    fullName: '',
    phone: '',
    city: 'Harare',
    address: '',
    notes: ''
  });

  // Overlays state
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [reviews, setReviews] = useState<Record<string, any[]>>({});
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComments, setNewReviewComments] = useState('');

  // Inner toast helper
  const [innerToast, setInnerToast] = useState<string | null>(null);
  const triggerLocalToast = (msg: string) => {
    setInnerToast(msg);
    setTimeout(() => setInnerToast(null), 2000);
  };

  // Pre-load data, cart, and reviews on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart_twdzw');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (_) {}
    setReviews(MOCK_REVIEWS_PRESETS);
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('cart_twdzw', JSON.stringify(newCart));
    } catch (_) {}
  };

  const getCartCount = () => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  };

  const addToCart = (product: any, qty = 1) => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      triggerLocalToast("Please select a size");
      return;
    }
    const colorVal = selectedColor || product.colours?.[0] || product.colors?.[0] || 'Standard';
    const sizeVal = selectedSize || product.sizes?.[0] || 'One Size';

    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && 
              item.selectedSize === sizeVal && 
              item.selectedColor === colorVal
    );

    let updatedCart = [...cart];
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += qty;
    } else {
      updatedCart.push({
        product,
        quantity: qty,
        selectedSize: sizeVal,
        selectedColor: colorVal
      });
    }

    saveCart(updatedCart);
    triggerLocalToast("Added to Cart!");
  };

  const updateCartQty = (idx: number, change: number) => {
    let updated = [...cart];
    updated[idx].quantity += change;
    if (updated[idx].quantity <= 0) {
      updated.splice(idx, 1);
    }
    saveCart(updated);
  };

  // Synchronize loading database data
  useEffect(() => {
    if (currentSlug) {
      fetchStorefrontData();
    }
  }, [currentSlug]);

  const fetchStorefrontData = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      let cleanSlug = currentSlug.replace(/^@/, '').trim().toLowerCase();
      cleanSlug = cleanSlug.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

      if (!cleanSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Query core Supabase database
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

      // Use empty list if empty, do not use presets
      setProducts(mapped);

    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Products filters & listings logic
  const getCatalogProducts = () => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }

    if (activeCategory !== 'all') {
      list = list.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    if (sortOption === 'priceAsc') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOption === 'priceDesc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return list;
  };

  // WhatsApp Order Prefills generator
  const handlePlaceWhatsAppOrder = () => {
    if (!deliveryDetails.fullName.trim() || !deliveryDetails.phone.trim() || !deliveryDetails.address.trim()) {
      triggerLocalToast("Please fill all required coordinates");
      return;
    }

    const cleanedNo = formatWA(shop.whatsapp);
    let message = `Hi ${shop.name},\n\nI want to place an order coordinates:\n\n`;
    
    let totalValue = 0;
    cart.forEach((item, idx) => {
      const priceVal = Number(item.product.price);
      const subtotal = priceVal * item.quantity;
      totalValue += subtotal;
      message += `${idx + 1}. ${item.product.name}\n   Size: ${item.selectedSize}\n   Color: ${item.selectedColor}\n   Qty: ${item.quantity} x $${priceVal.toFixed(2)}\n   Subtotal: $${subtotal.toFixed(2)}\n\n`;
    });

    message += `----------------------------\n`;
    message += `Total Order: $${totalValue.toFixed(2)} USD\n\n`;
    message += `Customer coordinates:\n`;
    message += `- Name: ${deliveryDetails.fullName}\n`;
    message += `- Phone: ${deliveryDetails.phone}\n`;
    message += `- City: ${deliveryDetails.city}\n`;
    message += `- Address/Directions: ${deliveryDetails.address}\n`;
    if (deliveryDetails.notes.trim()) {
      message += `- Notes: ${deliveryDetails.notes}\n`;
    }

    message += `\nThank you! Please confirm availability.`;

    // Clear cart and redirect
    saveCart([]);
    setCheckoutMode(false);
    setCartOpen(false);
    window.open(`https://wa.me/${cleanedNo}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDetailOrderWhatsApp = (prod: any) => {
    const text = `Hi ${shop?.name},\n\nI would like to order this item:\n\nProduct: ${prod.name}\nSize: ${selectedSize || 'Standard'}\nColor: ${selectedColor || 'Standard'}\nPrice: $${prod.price}\n\nIs this currently available for collection or delivery?`;
    window.open(`https://wa.me/${formatWA(shop?.whatsapp)}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleWriteReviewSubmit = (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComments.trim()) {
      triggerLocalToast("All fields are required");
      return;
    }
    const currentReviews = reviews[productId] || [];
    const updated = [
      {
        name: newReviewName,
        rating: newReviewRating,
        text: newReviewComments,
        date: "Today"
      },
      ...currentReviews
    ];
    setReviews({ ...reviews, [productId]: updated });
    setNewReviewName('');
    setNewReviewComments('');
    triggerLocalToast("Review added live!");
  };

  if (loading) {
    return (
      <div className="bg-[#000000] text-white min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">SYNCING STOREFRONT...</span>
      </div>
    );
  }

  if (notFound || !shop) {
    return (
      <div className="bg-[#000000] text-white min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <Package size={40} className="text-zinc-600 mb-4" />
        <h1 className="text-xl font-bold uppercase tracking-wide mb-2">Shop Not Found</h1>
        <p className="text-zinc-500 text-xs mb-6 max-w-xs leading-relaxed">We could not pull details for this store. Check your web handle coordinates and try once more.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-all rounded-none"
        >
          Return Home
        </button>
      </div>
    );
  }

  const directionsData = getZimbabweDirections(shop.location || 'Harare', shop.name);

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black">
      
      {/* 430px Centered Mobile Canvas Frame conforming to design system requirements */}
      <div className="max-w-[430px] mx-auto min-h-screen bg-[#000000] border-x border-zinc-900 pb-20 relative flex flex-col shadow-2xl">
        
        {/* ================= HEADER NAVIGATION ================= */}
        <header className="sticky top-0 left-0 right-0 h-16 bg-[#000000] border-b border-zinc-900 px-4 flex items-center justify-between z-40 select-none">
          {/* Hamburger Menu (Left) */}
          <button 
            id="mobile-menu-hamburger"
            onClick={() => setMenuDrawerOpen(true)}
            className="p-1 items-center justify-center hover:opacity-75 active:scale-95 transition-all text-white"
          >
            <Menu size={20} />
          </button>

          {/* Centered Logo (Strict stationary center behavior requested) */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center select-none pointer-events-none">
            {shop.logo_url ? (
              <ShopLogo 
                shop={shop}
                name={shop.name}
                url={shop.logo_url} 
                alt="Logo" 
                className="h-9 w-auto max-w-[120px] object-contain rounded-none filter invert contrast-200"
              />
            ) : (
              <span className="font-mono text-xs font-black tracking-[0.14em] uppercase border border-white px-2.5 py-1">
                {shop.name.slice(0, 16)}
              </span>
            )}
          </div>

          {/* Right Header Controls (Search & Cart) */}
          <div className="flex items-center gap-3.5">
            <button 
              id="header-search-toggle"
              onClick={() => setSearchOpen(!searchOpen)} 
              className="p-1 text-white hover:opacity-75 transition-all"
            >
              <Search size={18} />
            </button>
            <button 
              id="header-cart-toggle"
              onClick={() => setCartOpen(true)} 
              className="p-1 text-white hover:opacity-75 transition-all relative"
            >
              <ShoppingBag size={18} />
              {getCartCount() > 0 && (
                <div className="absolute -top-1 -right-1 bg-white text-black font-mono font-bold text-[8px] h-3.5 w-3.5 rounded-full flex items-center justify-center border border-black">
                  {getCartCount()}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Search Line Drawer */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#000000] border-b border-zinc-900 px-4 py-3 text-left overflow-hidden"
            >
              <div className="flex gap-2 bg-zinc-950 p-2.5 border border-zinc-900">
                <Search size={15} className="text-zinc-500 mt-0.5" />
                <input 
                  type="text"
                  placeholder="SEARCH PRODUCTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-xs font-mono tracking-wider focus:outline-none placeholder-zinc-650 uppercase"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white p-0.5">
                    <X size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= MAIN CONTENT SPACE ================= */}
        <main className="flex-1 w-full text-left scrollbar-none px-4 py-4 space-y-8">
          
          {/* A. HOME VIEW (LAND DIRECTLY ON PRODUCTS, NO HERO BANNERS) */}
          {activeTab === 'home' && (
            <div className="space-y-10 animate-fade">
              
              {/* Row 1: New Arrivals Drop */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline border-b border-zinc-900 pb-2">
                  <h2 className="font-mono text-xs font-black uppercase tracking-wider">NEW ARRIVALS</h2>
                  <button 
                    onClick={() => { setActiveTab('categories'); setActiveCategory('all'); }}
                    className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>VIEW ALL</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                  {getCatalogProducts().slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} onClick={() => { setSelectedProduct(product); setActiveImageIdx(0); setSelectedSize(''); }} />
                  ))}
                </div>
              </div>

              {/* Row 2: Top Picks Drop */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline border-b border-zinc-900 pb-2">
                  <h2 className="font-mono text-xs font-black uppercase tracking-wider">TOP PICKS</h2>
                  <button 
                    onClick={() => { setActiveTab('categories'); setActiveCategory('all'); }}
                    className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>VIEW ALL</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                  {getCatalogProducts().slice().reverse().slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} onClick={() => { setSelectedProduct(product); setActiveImageIdx(0); setSelectedSize(''); }} />
                  ))}
                </div>
              </div>

              {/* Row 3: All Featured Drops */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline border-b border-zinc-900 pb-2">
                  <h2 className="font-mono text-xs font-black uppercase tracking-wider">FEATURED PRODUCTS</h2>
                  <button 
                    onClick={() => { setActiveTab('categories'); setActiveCategory('all'); }}
                    className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>VIEW ALL</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                  {getCatalogProducts().slice(2, 6).map((product) => (
                    <ProductCard key={product.id} product={product} onClick={() => { setSelectedProduct(product); setActiveImageIdx(0); setSelectedSize(''); }} />
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* B. CATEGORIES/CATALOG VIEW GRID */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-fade">
              
              {/* Category selector row */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none border-b border-zinc-900">
                <button 
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase border text-center transition-all shrink-0 ${
                    activeCategory === 'all' 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent text-zinc-500 border-zinc-900 hover:text-white hover:border-zinc-850'
                  }`}
                >
                  ALL ITEMS
                </button>
                {categories.map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase border text-center transition-all shrink-0 ${
                      activeCategory.toLowerCase() === cat.name.toLowerCase() 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-zinc-500 border-zinc-900 hover:text-white hover:border-zinc-850'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Sorter triggers */}
              <div className="flex justify-between items-center text-xs text-zinc-400 border-b border-zinc-950 pb-2 bg-zinc-950 p-2 border border-zinc-900 select-none">
                <div className="flex items-center gap-1 text-[10px] font-mono tracking-wider text-zinc-500">
                  <span>SORT:</span>
                  <select 
                    value={sortOption} 
                    onChange={(e: any) => setSortOption(e.target.value)}
                    className="bg-transparent text-white font-mono focus:outline-none uppercase border-none hover:text-zinc-200 cursor-pointer text-[10px] tracking-tight"
                  >
                    <option value="recent">RECENT RELEASES</option>
                    <option value="priceAsc">PRICE: LOW TO HIGH</option>
                    <option value="priceDesc">PRICE: HIGH TO LOW</option>
                  </select>
                </div>
                <span className="font-mono text-[9px] tracking-widest text-[#ffffff] font-extrabold uppercase">
                  {getCatalogProducts().length} PRODUCTS
                </span>
              </div>

              {/* 2 per row product grid conforming strictly to pixel specification */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                {getCatalogProducts().map((product) => (
                  <ProductCard key={product.id} product={product} onClick={() => { setSelectedProduct(product); setActiveImageIdx(0); setSelectedSize(''); }} />
                ))}
              </div>

              {getCatalogProducts().length === 0 && (
                <div className="py-20 text-center border border-zinc-900">
                  <span className="font-mono text-zinc-650 text-xs uppercase block mb-1">NO PIECES MATCHED</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">TAP ANOTHER CATEGORY COORDINATE</span>
                </div>
              )}

            </div>
          )}

          {/* C. WHATSAPP LIVE ASSISTANT VIEW */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-fade">
              <div className="border border-zinc-900 p-6 space-y-4 rounded-none">
                <span className="font-mono text-[9px] font-black tracking-widest text-emerald-400 uppercase">DIRECT DISPATCH CHANNEL</span>
                <h3 className="text-sm font-bold uppercase tracking-wider block">WHATSAPP HELPLINE</h3>
                
                <p className="text-zinc-400 text-xs leading-relaxed font-sans font-medium">
                  Have inquiries about specific custom streetwear creations, shipping speeds, or sizing assistance? Chat with local support directly.
                </p>

                <div className="bg-zinc-950 border border-zinc-900 p-4 space-y-3 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-zinc-900 pb-2 text-zinc-400">
                    <span>WHATSAPP SUPPORT:</span>
                    <span className="text-white">+{formatWA(shop.whatsapp)}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-2 text-zinc-400">
                    <span>BUSINESS STATUS:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      ONLINE NOW
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>HOURS:</span>
                    <span className="text-white">{shop.hours || 'Mon-Sat 8:30am - 6pm'}</span>
                  </div>
                </div>

                <button 
                  onClick={() => window.open(`https://wa.me/${formatWA(shop.whatsapp)}?text=${encodeURIComponent("Hi " + shop.name + ", looking for assistance concerning your collections!")}`, '_blank')}
                  className="w-full py-4.5 bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-none transition-transform active:scale-95 shadow-xl hover:bg-emerald-600"
                >
                  <WhatsAppIcon size={14} />
                  <span>START CHAT CONVERSATION</span>
                </button>
              </div>

              {/* Zimbabwe Quick Messaging templates drops */}
              <div className="space-y-3">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block">QUICK ENQUIRIES TEMPLATES</span>
                <div className="space-y-2 select-none">
                  {[
                    "Is your store open today for collections?",
                    "Do you deliver to Bulawayo or Mutare?",
                    "I want to send physical coordinates for custom tailoring."
                  ].map((tpl, i) => (
                    <button 
                      key={i}
                      onClick={() => window.open(`https://wa.me/${formatWA(shop.whatsapp)}?text=${encodeURIComponent("Hi " + shop.name + ", " + tpl)}`, '_blank')}
                      className="w-full text-left p-3.5 bg-zinc-950 border border-zinc-900 text-xs font-mono text-zinc-300 rounded-none hover:bg-zinc-900 transition-all flex justify-between items-center"
                    >
                      <span>"{tpl}"</span>
                      <ArrowLeft className="rotate-180 text-zinc-650" size={12} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* D. LOCAL STORE VISIT & DIRECTIONS (ZIMBABWE PRESETS CO-ORDINATES) */}
          {activeTab === 'visit' && (
            <div className="space-y-6 animate-fade">
              
              <div className="border border-zinc-800 p-5 space-y-4">
                <div className="flex items-center gap-2 text-[#ffffff]">
                  <MapPin size={18} />
                  <h3 className="font-mono text-xs font-black uppercase tracking-wider">{shop.name} HQ</h3>
                </div>

                <div className="space-y-4 bg-zinc-950 border border-zinc-900 p-4.5 font-mono text-xs text-zinc-400">
                  <div>
                    <span className="text-zinc-650 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">PHYSICAL HEADQUARTERS</span>
                    <span className="text-white font-bold block">{directionsData.address}</span>
                  </div>
                  <hr className="border-zinc-900" />
                  <div>
                    <span className="text-zinc-650 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">ESTABLISHED LANDMARK</span>
                    <span className="text-zinc-200 block">{directionsData.landmark}</span>
                  </div>
                  <hr className="border-zinc-900" />
                  <div>
                    <span className="text-zinc-650 block text-[9px] uppercase tracking-wider font-extrabold mb-1">LOCAL STEP-BY-STEP DIRECTIONS</span>
                    <p className="text-[11px] text-zinc-300 leading-relaxed font-sans font-medium whitespace-pre-wrap">{directionsData.stepByStep}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${directionsData.address}\nLandmark: ${directionsData.landmark}\nDirections: ${directionsData.stepByStep}`);
                      triggerLocalToast("Directions Copied!");
                    }}
                    className="flex-1 py-3 bg-zinc-950 border border-zinc-900 text-zinc-300 hover:text-white font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
                  >
                    <Copy size={11} />
                    <span>COPY DETAILS</span>
                  </button>

                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.location || 'Harare'} Zimbabwe`)}`, '_blank')}
                    className="flex-1 py-3 bg-white text-black font-semibold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-zinc-200 transition-all"
                  >
                    <MapPin size={11} />
                    <span>GOOGLE MAPS</span>
                  </button>
                </div>
              </div>

              {/* Minimal Clean Grid Map Segment (Visual Blueprint conformant to anti-ai-slop rules) */}
              <div className="border border-zinc-900 p-5 bg-zinc-950 flex flex-col items-center justify-center relative min-h-[160px]">
                <div className="absolute inset-0 bg-[radial-gradient(#1c1c1c_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                <MapPin size={24} className="text-[#ffffff] relative z-10 mb-2 stroke-[1.5]" />
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest relative z-10 block mb-1">SECURE ESTABLISHMENT ROADMAP</span>
                <span className="text-[11px] text-white font-bold relative z-15 uppercase tracking-[0.08em]">{shop.location || "HARARE CENTER, ZIMBABWE"}</span>
              </div>

            </div>
          )}

          {/* E. INFORMATION PAGE / STORE POLICIES SIMPLE LISTS */}
          {activeTab === 'info' && (
            <div className="space-y-6 animate-fade">
              <div className="border border-zinc-900 p-5 space-y-4">
                <span className="font-mono text-[9px] font-black text-zinc-500 uppercase tracking-widest block">CURATED BRAND DETAILS</span>
                <h3 className="text-sm font-bold uppercase tracking-wider block">ABOUT {shop.name.toUpperCase()}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans font-medium">
                  {shop.description || "Premium bespoke clothing designed with local materials. Supporting sustainable independent Harare tailoring."}
                </p>
              </div>

              {/* Standard List Accordions styled minimally in B&W */}
              <div className="space-y-2 font-mono">
                {[
                  { title: "SHIPPING & DISPATCH SPEEDS", desc: "Local collection is available from our Harare address coordinates instantly during work hours. Nationwide courier parcels dispatch on Mon & Thurs each week via local courier services ($5-10 depend on suburb)." },
                  { title: "RETURNS & REFUNDS CHARTER", desc: "No returns on tailored products. Shop-bought garments are eligible for size exchanges within 48 hours in pristine, sellable conditions with physical tag labels fully intact." },
                  { title: "LOCAL PAYMENTS METHODS", desc: "Due to localization rules, we collect standard USD cash at pick up or coordinate directly via WhatsApp for Zimbabwean electronic transfers (Ecocash/Zipit)." },
                  { title: "STORE CONCEPTS POLICIES", desc: "Each item is strictly limited to prevent excessive high street repetition. Handcrafted tailored street styles are processed within 3-5 standard working schedules." }
                ].map((item, i) => (
                  <details key={i} className="group border border-zinc-900 bg-zinc-950 cursor-pointer select-none">
                    <summary className="p-4 flex items-center justify-between text-[11px] font-bold text-white uppercase tracking-wider hover:bg-zinc-900 transition-colors">
                      <span>{item.title}</span>
                      <ChevronDown size={12} className="text-zinc-500 group-open:rotate-180 transition-all" />
                    </summary>
                    <div className="px-4 pb-4 pt-1.5 text-left text-zinc-400 font-sans text-xs font-medium leading-relaxed border-t border-zinc-900/60">
                      {item.desc}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* ===================== BOTTOM NAVIGATION TABBAR ===================== */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-black border-t border-zinc-900 py-3.5 px-2.5 flex items-center justify-around z-30 select-none">
          <button 
            id="tab-home"
            onClick={() => { setActiveTab('home'); }} 
            className={`flex flex-col items-center gap-1 hover:opacity-100 transition-all ${activeTab === 'home' ? 'text-white' : 'text-zinc-600'}`}
          >
            <Grid size={15} />
            <span className="font-mono text-[9px] uppercase tracking-wider">HOME</span>
          </button>
          
          <button 
            id="tab-categories"
            onClick={() => { setActiveTab('categories'); }} 
            className={`flex flex-col items-center gap-1 hover:opacity-100 transition-all ${activeTab === 'categories' ? 'text-white' : 'text-zinc-600'}`}
          >
            <Package size={15} />
            <span className="font-mono text-[9px] uppercase tracking-wider">DROPS</span>
          </button>

          <button 
            id="tab-whatsapp"
            onClick={() => { setActiveTab('contact'); }} 
            className={`flex flex-col items-center gap-1 hover:opacity-100 transition-all ${activeTab === 'contact' ? 'text-white' : 'text-zinc-600'}`}
          >
            <WhatsAppIcon size={14} className={activeTab === 'contact' ? 'text-emerald-400' : 'text-zinc-600'} />
            <span className="font-mono text-[9px] uppercase tracking-wider">WHATSAPP</span>
          </button>

          <button 
            id="tab-info"
            onClick={() => { setActiveTab('info'); }} 
            className={`flex flex-col items-center gap-1 hover:opacity-100 transition-all ${activeTab === 'info' ? 'text-white' : 'text-zinc-600'}`}
          >
            <Info size={15} />
            <span className="font-mono text-[9px] uppercase tracking-wider">INFO</span>
          </button>
        </nav>

        {/* =========================== INTERACTIVE OVERLAYS & DRAWERS =========================== */}

        {/* 1. LEFT HAMBURGER MENU DRAWER */}
        <AnimatePresence>
          {menuDrawerOpen && (
            <>
              {/* Dim backdrop */}
              <div className="fixed inset-0 bg-black/85 max-w-[430px] mx-auto z-[200]" onClick={() => setMenuDrawerOpen(false)} />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.22 }}
                className="fixed top-0 bottom-0 left-0 w-[285px] max-w-[70vw] bg-[#000000] border-r border-zinc-900 z-[201] p-6 text-left flex flex-col justify-between"
              >
                <div className="space-y-10">
                  {/* Title identity */}
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest">{shop.name.slice(0, 18)}</span>
                    <button onClick={() => setMenuDrawerOpen(false)} className="text-zinc-500 hover:text-white p-0.5">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Complete requested drawer paths list */}
                  <div className="flex flex-col space-y-4.5 font-mono text-xs font-bold uppercase tracking-wider select-none">
                    <button 
                      onClick={() => { setActiveTab('home'); setMenuDrawerOpen(false); }}
                      className={`text-left py-1 hover:text-white transition-colors ${activeTab === 'home' ? 'text-white pl-2 border-l border-white' : 'text-zinc-550'}`}
                    >
                      HOME
                    </button>
                    <button 
                      onClick={() => { setActiveTab('categories'); setActiveCategory('all'); setMenuDrawerOpen(false); }}
                      className={`text-left py-1 hover:text-white transition-colors ${activeTab === 'categories' ? 'text-white pl-2 border-l border-white' : 'text-zinc-550'}`}
                    >
                      TOP PICKS
                    </button>
                    <button 
                      onClick={() => { setActiveTab('categories'); setActiveCategory('all'); setMenuDrawerOpen(false); }}
                      className="text-left py-1 text-zinc-550 hover:text-white transition-colors"
                    >
                      NEW ARRIVALS
                    </button>
                    <button 
                      onClick={() => { setActiveTab('categories'); setMenuDrawerOpen(false); }}
                      className={`text-left py-1 hover:text-white transition-colors ${activeTab === 'categories' && activeCategory !== 'all' ? 'text-white pl-2 border-l border-white' : 'text-zinc-550'}`}
                    >
                      CATEGORIES
                    </button>
                    <button 
                      onClick={() => { setActiveTab('categories'); setMenuDrawerOpen(false); }}
                      className="text-left py-1 text-zinc-550 hover:text-white transition-colors"
                    >
                      COLLECTIONS
                    </button>
                    <button 
                      onClick={() => { setActiveTab('categories'); setMenuDrawerOpen(false); }}
                      className="text-left py-1 text-zinc-550 hover:text-white transition-colors"
                    >
                      ACCESSORIES
                    </button>
                    <button 
                      onClick={() => { setActiveTab('info'); setMenuDrawerOpen(false); }}
                      className={`text-left py-1 hover:text-white transition-colors ${activeTab === 'info' ? 'text-white pl-2 border-l border-white' : 'text-zinc-550'}`}
                    >
                      ABOUT US
                    </button>
                    <button 
                      onClick={() => { setActiveTab('contact'); setMenuDrawerOpen(false); }}
                      className={`text-left py-1 hover:text-white transition-colors ${activeTab === 'contact' ? 'text-white pl-2 border-l border-white' : 'text-zinc-550'}`}
                    >
                      CONTACT US
                    </button>
                    <button 
                      onClick={() => { setActiveTab('info'); setMenuDrawerOpen(false); }}
                      className="text-left py-1 text-zinc-550 hover:text-white transition-colors"
                    >
                      STORE POLICIES
                    </button>
                  </div>
                </div>

                {/* Footnotes */}
                <div className="font-mono text-[8px] text-zinc-650 tracking-wider">
                  &copy; {new Date().getFullYear()} THREAD_ZW SYSTEM.<br />
                  CURATING LOCAL DESIGNSETHICALLY.
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 2. PRODUCT DETAILS DRAWER MODAL */}
        <AnimatePresence>
          {selectedProduct && (
            <>
              {/* Backing overlay */}
              <div className="fixed inset-0 bg-black/90 max-w-[430px] mx-auto z-[150]" onClick={() => setSelectedProduct(null)} />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 180 }}
                className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#000000] border-t border-zinc-900 rounded-t-[20px] z-[151] flex flex-col h-[88vh] overflow-y-auto pb-24 scrollbar-none"
              >
                <div className="p-4 shrink-0 flex justify-between items-center bg-[#000000] sticky top-0 border-b border-zinc-900/60 z-20">
                  <button onClick={() => setSelectedProduct(null)} className="p-1 hover:opacity-75 transition-all text-white flex items-center gap-1 font-mono text-[10px] tracking-widest font-black uppercase">
                    <ArrowLeft size={16} />
                    <span>CLOSE</span>
                  </button>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#ffffff] font-extrabold bg-[#000000]">
                    {selectedProduct.category || "GARMENT DETAIL"}
                  </span>
                  <div className="w-6 h-6" /> {/* Spacer */}
                </div>

                {/* Primary Photo display */}
                <div className="w-full aspect-[4/5] bg-zinc-950 border-b border-zinc-900 group relative">
                  <ProductImage 
                    url={selectedProduct.images?.[activeImageIdx] || selectedProduct.images?.[activeImageIdx]} 
                    alt="Garment view" 
                    className="w-full h-full object-cover rounded-none"
                  />
                  {selectedProduct.original_price && (
                    <div className="absolute bottom-4 left-4 bg-white text-black font-mono font-black text-[9px] px-2.5 py-1 uppercase tracking-wider">
                      SALE DETECTED
                    </div>
                  )}
                </div>

                {/* Text and selects area */}
                <div className="px-5 py-6 text-left space-y-6">
                  
                  {/* Thumbnail pagination selector indicators */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
                      {selectedProduct.images.map((imgUrl: string, idx: number) => {
                        const resolvedUrl = getImageUrl(imgUrl) || imgUrl;
                        return (
                          <button 
                            key={idx} 
                            onClick={() => setActiveImageIdx(idx)}
                            className={`w-14 h-16 bg-zinc-950 border shrink-0 overflow-hidden ${
                              activeImageIdx === idx ? 'border-white brightness-110' : 'border-zinc-900 brightness-50 hover:brightness-100 transition-all'
                            }`}
                          >
                            <ProductImage url={resolvedUrl || undefined} className="w-full h-full object-cover" alt="Garment sample" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h1 className="text-xl font-bold uppercase tracking-wider text-white select-none">
                      {selectedProduct.name}
                    </h1>
                    <div className="flex items-baseline gap-2.5 font-mono select-none">
                      <span className="text-lg font-black text-white">${selectedProduct.price}</span>
                      {selectedProduct.original_price && (
                        <span className="text-xs text-zinc-500 line-through">${selectedProduct.original_price}</span>
                      )}
                    </div>
                  </div>

                  <hr className="border-zinc-900" />

                  {/* SIZES MATRIX (Clean grid with square borders) */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="space-y-3">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 font-extrabold block">SELECT SIZE</span>
                      <div className="grid grid-cols-5 gap-2 select-none">
                        {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
                          const isAvailable = selectedProduct.sizes.includes(sz);
                          const isSelected = selectedSize === sz;
                          return (
                            <button
                              key={sz}
                              disabled={!isAvailable}
                              onClick={() => setSelectedSize(sz)}
                              className={`py-3.5 border font-mono text-[11px] font-bold text-center transition-all ${
                                !isAvailable 
                                  ? 'border-zinc-950 text-zinc-800 cursor-not-allowed line-through' 
                                  : isSelected
                                    ? 'bg-white text-black border-white' 
                                    : 'bg-transparent text-white border-zinc-900 hover:border-zinc-700'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* COLORS MATRIX */}
                  {selectedProduct.colours && selectedProduct.colours.length > 0 && (
                    <div className="space-y-3">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 font-extrabold block">Garment color shade</span>
                      <div className="flex gap-2.5 select-none text-xs">
                        {selectedProduct.colours.map((col: string) => (
                          <button 
                            key={col}
                            onClick={() => setSelectedColor(col)}
                            className={`px-3 py-1.5 border font-mono text-[10px] uppercase transition-all ${
                              selectedColor === col 
                                ? 'bg-white text-black border-white font-bold' 
                                : 'bg-transparent text-zinc-400 border-zinc-900 hover:text-white'
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 font-extrabold block">Description details</span>
                    <p className="text-zinc-400 text-xs leading-relaxed font-sans font-medium">
                      {selectedProduct.description || "Ethically handcrafted item styled in Zimbabwe. Pristine lines, breathable weave weights."}
                    </p>
                  </div>

                  <hr className="border-zinc-900" />

                  {/* REVIEWS DISPATCH CONTAINER */}
                  <div className="space-y-4">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 font-extrabold block">Garment Feedback ledger</span>
                    
                    <div className="space-y-3.5 select-all">
                      {(reviews[selectedProduct.id] || []).map((rev, rIdx) => (
                        <div key={rIdx} className="p-4 bg-zinc-950 border border-zinc-900 text-left space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-xs text-zinc-200">{rev.name}</span>
                            <span className="font-mono text-[8.5px] text-zinc-600">{rev.date || 'Review Ledger'}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(st => (
                              <Star key={st} size={8.5} className={st <= rev.rating ? "fill-white text-white" : "text-zinc-800"} />
                            ))}
                          </div>
                          <p className="text-zinc-400 text-[11px] leading-normal font-medium font-sans">{rev.text}</p>
                        </div>
                      ))}
                      {(reviews[selectedProduct.id] || []).length === 0 && (
                        <span className="text-[10px] font-mono text-zinc-700 italic block">No feedback entries processed for this piece yet.</span>
                      )}
                    </div>

                    <form onSubmit={(e) => handleWriteReviewSubmit(e, selectedProduct.id)} className="bg-zinc-950 p-4 border border-zinc-900 space-y-3 text-left">
                      <span className="font-mono text-[9px] uppercase text-[#ffffff] font-extrabold tracking-widest block">Submit anonymous entry</span>
                      <input 
                        type="text" 
                        placeholder="ENTER NAME..." 
                        value={newReviewName} 
                        onChange={(e) => setNewReviewName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 p-2.5 text-xs font-mono text-white focus:outline-none placeholder-zinc-750 uppercase" 
                        required
                      />
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[9px] text-zinc-550 uppercase">Score rating:</span>
                        <div className="flex gap-1.5">
                          {[1,2,3,4,5].map(n => (
                            <button type="button" key={n} onClick={() => setNewReviewRating(n)} className="p-0.5">
                              <Star size={12} className={n <= newReviewRating ? "fill-white text-white" : "text-zinc-800"} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea 
                        placeholder="Garment review details..." 
                        rows={2} 
                        value={newReviewComments} 
                        onChange={(e) => setNewReviewComments(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 p-2.5 text-xs text-white focus:outline-none placeholder-zinc-700" 
                        required
                      />
                      <button 
                        type="submit" 
                        className="w-full py-2.5 bg-white text-black font-semibold text-[10px] uppercase tracking-wider transition-colors hover:bg-zinc-200"
                      >
                        SUBMIT DISPATCH REVIEW
                      </button>
                    </form>
                  </div>

                </div>

                {/* Sticky product buttons Conforming strictly to "Order on WhatsApp" visual guideline */}
                <div className="sticky bottom-0 left-0 right-0 bg-[#000000] border-t border-zinc-900 p-4 grid grid-cols-2 gap-3.5 z-30">
                  <button 
                    onClick={() => handleDetailOrderWhatsApp(selectedProduct)}
                    className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 py-4 px-3 rounded-none font-bold text-xs flex items-center justify-center gap-2 text-white active:scale-95 transition-transform"
                  >
                    <WhatsAppIcon size={13} className="text-emerald-400" />
                    <span className="font-mono text-[9.5px] uppercase tracking-widest text-emerald-400">WHATSAPP DIRECT</span>
                  </button>
                  <button 
                    onClick={() => addToCart(selectedProduct)}
                    className="bg-white hover:bg-zinc-200 text-black py-4 px-3 rounded-none font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-lg"
                  >
                    <ShoppingBag size={13} className="stroke-[2.2]" />
                    <span className="font-mono text-[9.5px] uppercase tracking-widest font-black">ADD TO CART</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 3. RIGHT CART DRAWER SLIDE */}
        <AnimatePresence>
          {cartOpen && (
            <>
              <div className="fixed inset-0 bg-black/85 max-w-[430px] mx-auto z-[150]" onClick={() => setCartOpen(false)} />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed top-0 bottom-0 right-0 w-[350px] max-w-[85vw] bg-[#000000] border-l border-zinc-900 z-[151] flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b border-zinc-900/80 shrink-0 select-none">
                  <div className="flex items-center gap-2 text-white font-mono font-black text-[10px] tracking-widest uppercase">
                    <ShoppingBag size={15} />
                    <span>CART SELECTIONS</span>
                  </div>
                  <button onClick={() => { setCartOpen(false); setCheckoutMode(false); }} className="text-zinc-500 hover:text-white p-0.5">
                    <X size={16} />
                  </button>
                </div>

                {/* Sub Body (Cart Items / Checkout Form toggle) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  
                  {!checkoutMode ? (
                    /* A. View Cart items List */
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-3 bg-zinc-950 border border-zinc-900 p-3 relative text-left">
                          <div className="w-16 h-20 bg-zinc-900 border border-zinc-900 overflow-hidden shrink-0">
                            <ProductImage 
                              url={item.product.images?.[0] || item.product.images?.[0]} 
                              alt="Cart item" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-0.5 font-mono">
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-bold text-white block truncate uppercase">{item.product.name}</span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[10px] font-black text-white">${item.product.price}</span>
                                <span className="text-[9px] text-zinc-550 lowercase tracking-tighter">Size: {item.selectedSize}</span>
                              </div>
                            </div>

                            {/* Quantity buttons */}
                            <div className="flex items-center gap-2 select-none">
                              <button onClick={() => updateCartQty(idx, -1)} className="w-6 h-6 border border-zinc-900 flex items-center justify-center hover:border-zinc-700 font-mono text-zinc-500 hover:text-white font-bold">&minus;</button>
                              <span className="text-xs text-white font-bold font-mono">{item.quantity}</span>
                              <button onClick={() => updateCartQty(idx, 1)} className="w-6 h-6 border border-zinc-900 flex items-center justify-center hover:border-zinc-700 font-mono text-zinc-500 hover:text-white font-bold">&plus;</button>
                            </div>
                          </div>

                          {/* Delete */}
                          <button 
                            onClick={() => {
                              let copy = [...cart];
                              copy.splice(idx, 1);
                              saveCart(copy);
                            }}
                            className="absolute top-2 right-2 text-zinc-650 hover:text-white p-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {cart.length === 0 && (
                        <div className="py-20 text-center border border-zinc-900/60 font-mono select-none">
                          <ShoppingBag size={18} className="mx-auto text-zinc-700 mb-2 stroke-[1.2]" />
                          <span className="text-[10px] text-zinc-600 uppercase tracking-widest block font-extrabold mb-1">Your cart is empty</span>
                          <span className="text-[8.5px] text-zinc-500 uppercase tracking-wide">Coordinates catalog and select fine drops first.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* B. Checkout Form: Conforms strictly to Deliveries Specification */
                    <div className="space-y-4 text-left font-mono text-xs text-zinc-400">
                      
                      <div className="flex items-center gap-1 text-white uppercase font-bold border-b border-zinc-900 pb-1.5">
                        <MapPin size={13} className="text-emerald-400" />
                        <span className="text-[10px] tracking-widest">DISPATCH COORDINATES</span>
                      </div>

                      <div className="space-y-3.5 pt-1.5">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Recipient Full name *</span>
                          <input 
                            type="text" 
                            placeholder="e.g. John Doe"
                            value={deliveryDetails.fullName}
                            onChange={(e) => setDeliveryDetails({ ...deliveryDetails, fullName: e.target.value })}
                            className="w-full bg-[#000000] border border-zinc-900 p-2.5 text-xs text-white uppercase focus:outline-none placeholder-zinc-750"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Phone number *</span>
                          <div className="flex border border-zinc-900 overflow-hidden bg-black">
                            <span className="bg-zinc-950 px-2.5 py-2.5 text-xs text-zinc-500 border-r border-zinc-900 select-none">+263</span>
                            <input 
                              type="tel" 
                              placeholder="77 622 3144"
                              value={deliveryDetails.phone}
                              onChange={(e) => setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })}
                              className="w-full bg-[#000000] p-2.5 text-xs text-white focus:outline-none placeholder-zinc-600"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Select City *</span>
                          <select 
                            value={deliveryDetails.city}
                            onChange={(e) => setDeliveryDetails({ ...deliveryDetails, city: e.target.value })}
                            className="w-full bg-[#000000] border border-zinc-900 p-2.5 text-xs text-white focus:outline-none uppercase"
                          >
                            <option value="Harare">Harare</option>
                            <option value="Bulawayo">Bulawayo</option>
                            <option value="Mutare">Mutare</option>
                            <option value="Gweru">Gweru</option>
                            <option value="Victoria Falls">Victoria Falls</option>
                            <option value="Other Zim Suburb">Other Zimbabwe Suburb</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Deliveries address or Landmark directions *</span>
                          <textarea 
                            rows={3}
                            placeholder="e.g. Near OK Mart, turn right at Total garage, 3rd shop on left."
                            value={deliveryDetails.address}
                            onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                            className="w-full bg-[#000000] border border-zinc-900 p-2.5 text-xs text-white focus:outline-none placeholder-zinc-700"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Special Order Notes (Optional)</span>
                          <input 
                            type="text" 
                            placeholder="e.g. Tailor fit shoulders or gift wraps"
                            value={deliveryDetails.notes}
                            onChange={(e) => setDeliveryDetails({ ...deliveryDetails, notes: e.target.value })}
                            className="w-full bg-[#000000] border border-zinc-900 p-2.5 text-xs text-white focus:outline-none placeholder-zinc-750"
                          />
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Sub Total Footer Checkout Actions */}
                {cart.length > 0 && (
                  <div className="p-4 bg-zinc-950 border-t border-zinc-900 font-mono space-y-3.5 shrink-0 select-none">
                    
                    {/* Cart Order Summary Values */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-zinc-500">
                        <span>SUBTOTAL PIECES:</span>
                        <span className="text-white hover:underline">
                          {cart.reduce((acc, curr) => acc + curr.quantity, 0)} Items
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>DELIVERY COST:</span>
                        <span className="text-white font-semibold">CALCULATED AT DISPATCH</span>
                      </div>
                      <hr className="border-zinc-900 my-1" />
                      <div className="flex justify-between text-white font-bold">
                        <span>ORDER CALCULATED TOTAL:</span>
                        <span className="text-[#ffffff] text-sm">${
                          cart.reduce((acc, curr) => acc + (Number(curr.product.price) * curr.quantity), 0).toFixed(2)
                        } USD</span>
                      </div>
                    </div>

                    {/* Navigation Actions buttons */}
                    {!checkoutMode ? (
                      <button 
                        onClick={() => setCheckoutMode(true)}
                        className="w-full py-4.5 bg-white text-black font-semibold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-zinc-200 transition-all rounded-none"
                      >
                        <span>CONFIRM CHECKOUT DETAILS</span>
                        <ChevronDown className="-rotate-90" size={13} />
                      </button>
                    ) : (
                      <div className="mt-2 space-y-2.5">
                        <button 
                          onClick={handlePlaceWhatsAppOrder}
                          className="w-full py-4.5 bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-600 transition-transform active:scale-95 rounded-none"
                        >
                          <WhatsAppIcon size={14} />
                          <span>PLACE ORDER VIA WHATSAPP</span>
                        </button>
                        <button 
                          onClick={() => setCheckoutMode(false)}
                          className="w-full text-center hover:underline text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-widest block pt-1"
                        >
                          &larr; Return to Cart edit
                        </button>
                      </div>
                    )}

                  </div>
                )}

              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Global Inner Notification Banner */}
        <AnimatePresence>
          {innerToast && (
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black font-mono text-[9.5px] font-black uppercase px-4 py-2.5 border border-black z-[300] tracking-wider text-center flex items-center gap-2 shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
            >
              <Check size={11} className="stroke-[3]" />
              <span>{innerToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// ======================== SUB-COMPONENT: PRODUCT SEED CARD ========================

interface ProductCardProps {
  product: any;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer select-none text-left space-y-2 flex flex-col justify-between h-full bg-[#000000]"
    >
      {/* Visual Product Box with Black overlay */}
      <div className="w-full aspect-[4/5] bg-zinc-950 border border-zinc-900 overflow-hidden relative shrink-0">
        <ProductImage 
          url={product.images?.[0] || product.images?.[0]} 
          alt="Garment card"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 rounded-none brightness-[0.88] group-hover:brightness-100" 
        />
        
        {/* Anti AI Slop simple Sales badge */}
        {product.original_price && (
          <div className="absolute bottom-2.5 left-2.5 bg-[#000000] border border-zinc-800 text-white font-mono font-bold text-[8px] px-2 py-0.5 rounded-none uppercase tracking-wide">
            Sale
          </div>
        )}
      </div>

      {/* Info details */}
      <div className="space-y-1">
        <span className="font-sans text-[11px] font-medium tracking-normal text-zinc-105 block leading-tight truncate group-hover:text-[#ffffff] transition-colors uppercase">
          {product.name}
        </span>
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-[12px] font-black text-[#ffffff]">${product.price}</span>
          {product.original_price && (
            <span className="text-[9px] text-zinc-600 line-through">${product.original_price}</span>
          )}
        </div>
      </div>
    </div>
  );
};
