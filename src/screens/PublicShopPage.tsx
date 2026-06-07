import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { parseShopConfig } from '../utils/configHelper';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Share2, MapPin, Package, Clock, 
  X, ShoppingBag, ArrowRight, Upload, Map,
  Search, Eye, Heart, Info, Phone, Copy, Check, Grid, 
  Trash2, Plus, MessageSquare, Star, Sparkles, CheckCircle2
} from 'lucide-react';
import { 
  DEFAULT_MOCK_PRODUCTS, 
  DEFAULT_MOCK_CATEGORIES, 
  MOCK_REVIEWS_PRESETS, 
  getZimbabweDirections, 
  WHATSAPP_MESSAGE_TEMPLATES, 
  getColorHex 
} from '../utils/storefrontData';

// Custom white WhatsApp icon path for design specifications
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

export const PublicShopPage: React.FC<{ handle?: string }> = ({ handle }) => {
  const { shopSlug } = useParams<{ shopSlug?: string }>();
  const currentSlug = shopSlug || handle || '';
  const { showToast } = useToast();

  // Core Storefront Data
  const [shop, setShop] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [logoAccent, setLogoAccent] = useState('#c8ff00'); // Neon lime accent fallback

  // State Views
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'categories' | 'wishlist' | 'info'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Advanced Filter Settings
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'recent' | 'priceAsc' | 'priceDesc' | 'bestsellers'>('recent');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [priceMax, setPriceMax] = useState<number>(100);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Interactive Overlays
  const [showDirections, setShowDirections] = useState(false);
  const [showWhatsAppContact, setShowWhatsAppContact] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDemandDrawer, setShowDemandDrawer] = useState(false);
  
  // Custom Demand upload
  const [demandDesc, setDemandDesc] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [demandImageUrl, setDemandImageUrl] = useState('');
  const [isUploadingDemand, setIsUploadingDemand] = useState(false);
  
  // Local persistence Wishlist Basket
  const [wishlist, setWishlist] = useState<any[]>([]);
  
  // High fidelity review manager
  const [reviews, setReviews] = useState<Record<string, {name: string, rating: number, text: string, date: string}[]>>({});
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComments, setNewReviewComments] = useState('');

  // Toast notifier
  const [innerToast, setInnerToast] = useState<string | null>(null);

  const triggerLocalToast = (msg: string) => {
    setInnerToast(msg);
    setTimeout(() => setInnerToast(null), 2500);
  };

  // Init Wishlist & Reviews on Load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wishlist_twdzw');
      if (stored) setWishlist(JSON.parse(stored));
    } catch (_) {}
    setReviews(MOCK_REVIEWS_PRESETS);
  }, []);

  const saveWishlist = (updatedList: any[]) => {
    setWishlist(updatedList);
    try {
      localStorage.setItem('wishlist_twdzw', JSON.stringify(updatedList));
    } catch (_) {}
  };

  const toggleWishlist = (prod: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const exists = wishlist.some(item => item.id === prod.id);
    if (exists) {
      const filtered = wishlist.filter(item => item.id !== prod.id);
      saveWishlist(filtered);
      triggerLocalToast("Item removed from Wishlist");
    } else {
      const newItem = {
        ...prod,
        selectedColor: prod.colours?.[0] || prod.colors?.[0] || 'Default',
        selectedSize: prod.sizes?.[0] || 'One Size'
      };
      saveWishlist([...wishlist, newItem]);
      triggerLocalToast("Added to Wishlist!");
    }
  };

  // Read Core logo accent
  useEffect(() => {
    if (!shop) return;
    const logoUrl = shop.logo_url || shop.avatar_url;
    if (!logoUrl) {
      setLogoAccent('#c8ff00');
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = logoUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 10;
        canvas.height = 10;
        ctx.drawImage(img, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;
        let rSum=0, gSum=0, bSum=0;
        for (let i = 0; i < data.length; i += 4) {
          rSum += data[i]; gSum += data[i+1]; bSum += data[i+2];
        }
        const rAvg = Math.round(rSum / 25);
        const gAvg = Math.round(gSum / 25);
        const bAvg = Math.round(bSum / 25);
        setLogoAccent(`rgb(${rAvg}, ${gAvg}, ${bAvg})`);
      } catch (_) {
        setLogoAccent('#c8ff00');
      }
    };
    img.onerror = () => setLogoAccent('#c8ff00');
  }, [shop?.logo_url, shop?.avatar_url]);

  // Load Storefront Layout Elements
  useEffect(() => {
    if (currentSlug) {
      loadStorefrontData();
    }
  }, [currentSlug]);

  const loadStorefrontData = async () => {
    setLoading(true);
    try {
      let cleanSlug = currentSlug.replace(/^@/, '').trim().toLowerCase();
      if (!cleanSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Query core database shop
      const { data: dbShop, error } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();

      let shopResult = dbShop;
      if (!shopResult) {
        const { data: altShop } = await supabase
          .from('shops')
          .select('*')
          .ilike('handle', cleanSlug)
          .maybeSingle();
        shopResult = altShop;
      }

      if (!shopResult) {
        // Create demo shop mock if testing details or fallback
        if (cleanSlug === 'demo' || cleanSlug === 'threadzw') {
          shopResult = {
            id: 'mock-shop-uuid',
            name: "ThreadZW Concept Store",
            slug: "demo",
            handle: "demo",
            location: "Harare, Zimbabwe",
            description: "Premium Zimbabwean high-fashion incubator and collaborative streetwear project. Experience local luxury styles curated ethically in Harare & Bulawayo.",
            whatsapp: "263776223144",
            logo_url: "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?auto=format&fit=crop&w=150&q=80",
            banner_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
            hours: "Mon-Sat 8:30am - 6pm",
            category: "Streetwear Atelier"
          };
        } else {
          // If they requested any custom shop handle (including 'byostreetwear'), let's dynamically auto-generate a beautiful mock shop brand!
          // This ensures all custom shop links work fluidly and look extremely realistic.
          const cleanName = cleanSlug
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase()); // e.g. 'byostreetwear' -> 'Byostreetwear'
          
          shopResult = {
            id: 'mock-shop-' + cleanSlug,
            owner_id: 'mock-owner-' + cleanSlug,
            name: cleanName.includes('Shop') || cleanName.includes('Brand') || cleanName.includes('Streetwear') || cleanName.includes('Store') ? cleanName : `${cleanName} Streetwear`,
            slug: cleanSlug,
            handle: cleanSlug,
            location: "Harare, Zimbabwe",
            description: `Welcome to ${cleanName}! We offer premium local and high-quality contemporary streetwear styles curated ethically. Chasing the finest premium fits.`,
            whatsapp: "263776223144",
            whatsapp_number: "263776223144",
            logo_url: "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?auto=format&fit=crop&w=150&q=80",
            banner_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
            hours: "Mon-Sat 8:30am - 6pm",
            category: "Streetwear Atelier"
          };
        }
      }

      setShop(shopResult);
      document.title = `${shopResult.name} — Storefront`;

      // Passive telemetry tracking
      try {
        await supabase
          .from('shops')
          .update({ view_count: (shopResult.view_count || 0) + 1 })
          .eq('id', shopResult.id);
      } catch (_) {}

      // Get categories list
      const { data: dbCats } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shopResult.id)
        .order('sort_order', { ascending: true });

      setCategories(dbCats && dbCats.length > 0 ? dbCats : DEFAULT_MOCK_CATEGORIES.filter(c => c.id !== 'all'));

      // Get products list
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

      const isDemoStore = shopResult.id === 'demo-shop' || shopResult.id === 'mock-shop-uuid' || cleanSlug === 'demo';
      setProducts(mapped.length > 0 ? mapped : (isDemoStore ? DEFAULT_MOCK_PRODUCTS : []));

    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter Catalog lists
  const getFilteredProducts = () => {
    let list = [...products];

    // Search matches
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }

    // Tab tag filter
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    // Sort options
    if (sortOption === 'priceAsc') {
      list.sort((a,b) => Number(a.price) - Number(b.price));
    } else if (sortOption === 'priceDesc') {
      list.sort((a,b) => Number(b.price) - Number(a.price));
    } else if (sortOption === 'bestsellers') {
      list = list.filter(p => p.tag === 'Best Seller' || p.is_featured);
    }

    // Price Filter Max Constraint
    list = list.filter(p => Number(p.price) <= priceMax);

    return list;
  };

  const handleCustomDemandUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDemand(true);
    const localUrl = URL.createObjectURL(file);
    setDemandImageUrl(localUrl);
    setTimeout(() => {
      setIsUploadingDemand(false);
      triggerLocalToast("Photo processed successfully!");
    }, 1000);
  };

  const handleCustomRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandDesc.trim()) {
      triggerLocalToast("Please write a quick description");
      return;
    }
    const orderTxt = `Hi ${shop?.name},\n\nI have submitted a custom design request on ThreadZW shop for you:\n\nLooking for: ${demandDesc}\nWhatsApp: ${customerWhatsApp || "N/A"}\n\nCan you notify me about options and pricing?`;
    window.open(`https://wa.me/${formatWA(shop?.whatsapp)}?text=${encodeURIComponent(orderTxt)}`, '_blank');
    setShowDemandDrawer(false);
    setDemandDesc('');
    setDemandImageUrl('');
  };

  const handleDetailOrderWhatsApp = (prod: any) => {
    const text = `Hi ${shop?.name},\n\nI would like to order this item:\n\nProduct: ${prod.name}\nSize: ${selectedSize || 'Standard'}\nColor: ${selectedColor || 'Standard'}\nPrice: $${prod.price}\n\nIs this currently available for collection or delivery?`;
    window.open(`https://wa.me/${formatWA(shop?.whatsapp)}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleWishlistCheckout = () => {
    if (wishlist.length === 0) return;
    let text = `Hi ${shop?.name},\n\nI would like to order my selected Wishlist items:\n\n`;
    wishlist.forEach((w, idx) => {
      text += `${idx + 1}. ${w.name} - ${w.selectedSize || 'One size'} / ${w.selectedColor || 'Default'} - $${w.price}\n`;
    });
    const total = wishlist.reduce((acc, curr) => acc + Number(curr.price), 0);
    text += `\nTotal Subtotal: $${total}\n\nAre these items available?`;
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
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-white">
        <div className="w-12 h-12 border-4 border-[#c8ff00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">ThreadZW Secure Sync</p>
      </div>
    );
  }

  if (notFound || !shop) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
          <Package className="text-zinc-500" size={32} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Shop Not Found</h2>
        <p className="text-zinc-400 text-sm max-w-xs mb-6">Could not locate the requested store. Check the URL handle and try again.</p>
        <button onClick={() => window.location.href = '/'} className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest rounded-full transition-transform active:scale-95">
          Return Home
        </button>
      </div>
    );
  }

  const newArrivals = products.slice(0, 4);
  const bestSellers = products.filter(p => p.tag === 'Best Seller' || p.is_featured);
  const directionsData = getZimbabweDirections(shop.location || "Harare", shop.name);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex justify-center selection:bg-[#c8ff00] selection:text-black">
      {/* Toast popup */}
      <AnimatePresence>
        {innerToast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-4 z-[999] px-4 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-full flex items-center gap-2 shadow-2xl">
            <CheckCircle2 size={16} className="text-[#c8ff00]" />
            <span className="text-xs font-mono lowercase tracking-wide font-semibold">{innerToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="public_screen_wrapper" className="w-full max-w-[430px] min-h-screen bg-zinc-950 border-x border-zinc-900 flex flex-col relative pb-20">
        
        {/* ===================== HEADER BAR ===================== */}
        <header className="sticky top-0 bg-zinc-950/90 backdrop-blur-md z-50 border-b border-zinc-900 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-sm text-[#c8ff00]">{shop.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight leading-none text-white">{shop.name}</h1>
              <span className="text-[10px] text-zinc-500 font-mono lower">{shop.category || 'Incubator'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowShareModal(true)} className="p-2 bg-zinc-900 border border-zinc-800 hover:text-[#c8ff00] text-zinc-400 rounded-lg transition-all" title="Share shop">
              <Share2 size={15} />
            </button>
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 bg-zinc-900 border border-zinc-800 hover:text-[#c8ff00] text-zinc-400 rounded-lg transition-all" title="Search catalog">
              <Search size={15} />
            </button>
            <button onClick={() => setShowWhatsAppContact(true)} className="p-2 bg-emerald-950 border border-emerald-900/60 text-emerald-400 rounded-lg" title="Template contacts">
              <WhatsAppIcon size={14} />
            </button>
          </div>
        </header>

        {/* ===================== NAV SEARCH EXPANDABLE ===================== */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-zinc-900/40 border-b border-zinc-900 overflow-hidden px-4 py-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTab !== 'catalog') setActiveTab('catalog');
                  }}
                  placeholder="type clothing, footwear..." 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-10 text-xs font-mono text-white focus:outline-none focus:border-[#c8ff00]"
                />
                <Search size={14} className="absolute left-3.5 top-3.5 text-zinc-500" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3.5 text-zinc-500">
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== VIEWS SWITCHER ===================== */}
        <main className="flex-1">
          
          {/* 1. HOME VIEW */}
          {activeTab === 'home' && (
            <div className="animate-fadeIn">
              
              {/* Cover Hero Banner */}
              <div className="relative h-44 w-full bg-zinc-900 overflow-hidden border-b border-zinc-900">
                {shop.banner_url ? (
                  <img src={shop.banner_url} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-zinc-950 to-zinc-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <span className="px-2 py-0.5 bg-[#c8ff00] text-black rounded-full font-mono font-black text-[9px] uppercase tracking-wider">Verified Atelier</span>
                  <p className="text-zinc-400 text-xs font-semibold mt-1.5 leading-snug">{shop.description || 'Welcome to curating fashion excellence'}</p>
                </div>
              </div>

              {/* Quick Details Chips */}
              <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-zinc-900 scrollbar-none">
                <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800 shrink-0 text-[10px] font-mono font-semibold text-zinc-300">
                  <MapPin size={10} className="text-[#c8ff00]" />
                  <span>{shop.location || 'ZW'}</span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800 shrink-0 text-[10px] font-mono font-semibold text-zinc-300">
                  <Clock size={10} className="text-[#c8ff00]" />
                  <span>{shop.hours || 'Mon-Sat'}</span>
                </div>
                <button onClick={() => setShowDirections(true)} className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-full shrink-0 text-[10px] font-mono text-[#c8ff00] font-black uppercase">
                  <span>Pin Map</span>
                  <ArrowRight size={10} />
                </button>
              </div>

              {/* Action Buttons center */}
              <div className="grid grid-cols-2 gap-2.5 p-4 border-b border-zinc-900">
                <button onClick={() => setShowWhatsAppContact(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <WhatsAppIcon size={14} />
                  <span>Interactive WhatsApp</span>
                </button>
                <button onClick={() => setShowDirections(true)} className="bg-zinc-100 hover:bg-zinc-200 text-black py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <MapPin size={12} />
                  <span>Visit Shop Info</span>
                </button>
              </div>

              {/* NEW ARRIVALS */}
              <div className="py-5 border-b border-zinc-900">
                <div className="px-4 mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#c8ff00]" />
                    <span>Fall Drop Arrivals</span>
                  </h3>
                  <button onClick={() => { setActiveCategory('all'); setActiveTab('catalog'); }} className="text-[10px] font-mono text-[#c8ff00]">VIEW ALL</button>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none">
                  {newArrivals.map((p) => (
                    <div key={p.id} onClick={() => { setSelectedProduct(p); setActiveImageIdx(0); setSelectedColor(''); setSelectedSize(''); }} className="w-36 shrink-0 cursor-pointer group">
                      <div className="aspect-[4/5] bg-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden relative">
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <button onClick={(e) => toggleWishlist(p, e)} className="absolute top-2.5 right-2.5 w-7 h-7 bg-zinc-950/80 rounded-full flex items-center justify-center border border-zinc-900">
                          <Heart size={11} className={wishlist.some(item => item.id === p.id) ? "fill-[#c8ff00] text-[#c8ff00]" : "text-white"} />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-100 truncate mt-2.5 px-0.5 leading-tight uppercase">{p.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1 px-0.5 font-mono text-[11px]">
                        <span className="text-[#c8ff00] font-bold">${p.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FEATURED / BEST SELLERS */}
              <div className="py-5 bg-zinc-900/30 border-b border-zinc-900">
                <div className="px-4 mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Hot & Best Sellers</h3>
                  <span className="text-[10px] font-mono text-zinc-500">COVETED</span>
                </div>
                <div className="grid grid-cols-2 gap-3.5 px-4">
                  {bestSellers.map((p) => (
                    <div key={p.id} onClick={() => { setSelectedProduct(p); setActiveImageIdx(0); setSelectedColor(''); setSelectedSize(''); }} className="cursor-pointer flex flex-col group text-left">
                      <div className="aspect-[4/5] bg-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden relative">
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 animate-fadeIn" />
                        <span className="absolute top-2.5 left-2.5 bg-[#c8ff00] text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full font-mono">HOT</span>
                        <button onClick={(e) => toggleWishlist(p, e)} className="absolute top-2.5 right-2.5 w-7 h-7 bg-zinc-950/85 rounded-full flex items-center justify-center border border-zinc-900">
                          <Heart size={11} className={wishlist.some(item => item.id === p.id) ? "fill-[#c8ff00] text-[#c8ff00]" : "text-zinc-400"} />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-100 truncate mt-2.5 px-0.5 leading-tight uppercase">{p.name}</h4>
                      <div className="flex items-center justify-between mt-1 px-0.5 font-mono text-[11px]">
                        <span className="text-[#c8ff00] font-bold">${p.price}</span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{p.category || 'Release'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DEMAND FORM PREVIEW LINK */}
              <div className="p-4">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
                  <h4 className="text-xs font-bold uppercase text-[#c8ff00] mb-1">Custom Sizing Request?</h4>
                  <p className="text-[11px] text-zinc-400 font-semibold mb-3">Upload a photo of any outfit and we will customize it for you.</p>
                  <button onClick={() => setShowDemandDrawer(true)} className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95">
                    <Upload size={12} />
                    <span>UPLOAD CUSTOM PHOTO</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* 2. CATALOG VIEW */}
          {activeTab === 'catalog' && (
            <div className="p-4 animate-fadeIn">
              
              {/* Category selector strip */}
              <div className="flex gap-1.5 overflow-x-auto pb-3.5 scrollbar-none border-b border-zinc-900">
                <button 
                  onClick={() => setActiveCategory('all')} 
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase border transition-all shrink-0 ${activeCategory === 'all' ? 'bg-[#c8ff00] text-zinc-950 border-[#c8ff00] font-bold' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
                >
                  All ({(products.length)})
                </button>
                {DEFAULT_MOCK_CATEGORIES.filter(c => c.id !== 'all').map((cat) => {
                  const itemsCount = products.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length;
                  return (
                    <button 
                      key={cat.id} 
                      onClick={() => setActiveCategory(cat.name)} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase border transition-all shrink-0 ${activeCategory.toLowerCase() === cat.name.toLowerCase() ? 'bg-[#c8ff00] text-zinc-950 border-[#c8ff00] font-bold' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
                    >
                      {cat.name} {itemsCount > 0 ? `(${itemsCount})` : ''}
                    </button>
                  );
                })}
              </div>

              {/* Filtering summary bar with sort options */}
              <div className="flex items-center justify-between py-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{getFilteredProducts().length} items found</span>
                <div className="flex items-center gap-2">
                  <select 
                    value={sortOption} 
                    onChange={(e: any) => setSortOption(e.target.value)} 
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] py-1 px-1.5 rounded focus:outline-none focus:border-[#c8ff00] font-mono"
                  >
                    <option value="recent">Latest Drop</option>
                    <option value="priceAsc">Price: Low-High</option>
                    <option value="priceDesc">Price: High-Low</option>
                    <option value="bestsellers">Bestsellers First</option>
                  </select>
                  <button onClick={() => setShowFiltersDrawer(true)} className="p-1 px-2 border border-zinc-800 bg-zinc-900 rounded text-[10px] font-mono text-zinc-300">Filters</button>
                </div>
              </div>

              {/* Products list grid */}
              {products.length === 0 ? (
                <div id="empty-storefront-welcome" className="py-14 px-5 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 backdrop-blur-sm shadow-inner mt-2">
                  <div className="w-12 h-12 bg-[#c8ff00]/10 border border-[#c8ff00]/15 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <ShoppingBag className="text-[#c8ff00]" size={20} />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2">Garment Catalog Incoming</h3>
                  <p className="font-sans text-[11px] text-zinc-400 max-w-xs mx-auto mb-5 leading-relaxed">
                    Welcome to <span className="text-white font-bold">{shop?.name || "our shop"}</span>! We are busy preparing our curated garment catalog. Stay tuned for our upcoming drops or place a custom garment request.
                  </p>
                  
                  <div className="flex flex-col gap-2 max-w-xs mx-auto">
                    <button 
                      id="btn-demand-custom"
                      onClick={() => setShowDemandDrawer(true)}
                      className="w-full py-2.5 bg-[#c8ff00] hover:bg-[#b0df00] text-black font-extrabold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
                    >
                      <Plus size={14} /> Request Custom Design
                    </button>
                    {shop?.whatsapp && (
                      <a 
                        id="btn-contact-whatsapp"
                        href={`https://wa.me/${formatWA(shop.whatsapp)}?text=${encodeURIComponent(`Hi ${shop.name || "there"}, I am visiting your ThreadZW store and would like to inquire about upcoming apparel drops & custom fittings!`)}`}
                        target="_blank"
                        rel="noreferrer"
                        referrerPolicy="no-referrer"
                        className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-extrabold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare size={13} /> Inquire About Drops
                      </a>
                    )}
                  </div>
                </div>
              ) : getFilteredProducts().length === 0 ? (
                <div className="py-20 text-center border border-dashed border-zinc-900 rounded-2xl">
                  <Package className="mx-auto text-zinc-600 mb-2" size={24} />
                  <p className="font-mono text-[10px] text-zinc-500">No matched designs. Reset filters or queries.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {getFilteredProducts().map((p) => (
                    <div key={p.id} onClick={() => { setSelectedProduct(p); setActiveImageIdx(0); setSelectedColor(''); setSelectedSize(''); }} className="group cursor-pointer flex flex-col text-left">
                      <div className="aspect-[4/5] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-900 relative">
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-250" />
                        {p.original_price && (
                          <span className="absolute top-2.5 left-2.5 bg-white text-zinc-950 font-mono font-black text-[8px] px-2 py-0.5 rounded uppercase">Save {Math.round((1 - (p.price / p.original_price)) * 100)}%</span>
                        )}
                        <button onClick={(e) => toggleWishlist(p, e)} className="absolute top-2.5 right-2.5 w-7 h-7 bg-zinc-950/90 rounded-full flex items-center justify-center border border-zinc-850">
                          <Heart size={11} className={wishlist.some(item => item.id === p.id) ? "fill-[#c8ff00] text-[#c8ff00]" : "text-zinc-400"} />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-200 mt-2.5 px-0.5 truncate leading-tight uppercase">{p.name}</h4>
                      <div className="flex items-center justify-between mt-1 px-0.5 font-mono text-[11px]">
                        <span className="text-[#c8ff00] font-bold">${p.price}</span>
                        {p.original_price && (
                          <span className="text-[10px] text-zinc-500 line-through">${p.original_price}</span>
                        )}
                      </div>
                      <p className="text-[9px] text-[#c8ff00] font-mono uppercase bg-[#c8ff00]/5 border border-[#c8ff00]/10 px-1.5 py-0.5 rounded inline-block w-fit mt-1.5 ml-0.5">{p.category}</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* 3. CATEGORIES VIEW */}
          {activeTab === 'categories' && (
            <div className="p-4 animate-fadeIn">
              <div className="mb-4">
                <span className="text-[9px] font-mono text-[#c8ff00] uppercase font-bold tracking-widest block">Featured Wear</span>
                <h3 className="text-base font-black uppercase tracking-tight">Browse Categories</h3>
              </div>
              
              <div className="space-y-2">
                {DEFAULT_MOCK_CATEGORIES.map((cat) => {
                  const itemsCount = products.filter(p => !cat.id || cat.id === 'all' ? true : p.category?.toLowerCase() === cat.name.toLowerCase()).length;
                  return (
                    <div 
                      key={cat.id} 
                      onClick={() => {
                        setActiveCategory(cat.id === 'all' ? 'all' : cat.name);
                        setActiveTab('catalog');
                      }}
                      className="flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                          <Grid size={14} className="text-[#c8ff00]" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide text-zinc-100">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500">{itemsCount} pieces</span>
                        <ArrowRight size={12} className="text-zinc-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. WISHLIST VIEW */}
          {activeTab === 'wishlist' && (
            <div className="p-4 animate-fadeIn">
              <div className="mb-5">
                <span className="text-[9px] font-mono text-[#c8ff00] uppercase font-bold tracking-widest block">Client Cart</span>
                <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-1.5">
                  <ShoppingBag size={15} />
                  <span>My Wishlist Basket</span>
                </h3>
              </div>

              {wishlist.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-zinc-900 rounded-2xl">
                  <ShoppingBag className="mx-auto text-zinc-700 mb-3" size={28} />
                  <p className="text-xs text-zinc-400 font-bold mb-4">Your basket list is empty.</p>
                  <button onClick={() => setActiveTab('catalog')} className="px-5 py-2.5 bg-zinc-100 text-black text-[10px] font-black uppercase tracking-wider rounded-lg">
                    Discover Products
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pb-32">
                  {wishlist.map((item) => (
                    <div key={item.id} className="flex gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 relative">
                      <div className="w-16 h-20 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-zinc-850">
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-left flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-tight line-clamp-1">{item.name}</h4>
                          <span className="text-[10px] text-[#c8ff00] font-mono block mt-1">${item.price}</span>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="px-1.5 py-0.5 bg-zinc-800 text-[8px] font-mono text-zinc-400 rounded">Size: {item.selectedSize}</span>
                            <span className="px-1.5 py-0.5 bg-zinc-800 text-[8px] font-mono text-zinc-400 rounded">Color: {item.selectedColor}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => toggleWishlist(item)} className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 p-1" title="Remove item">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-zinc-900">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-4">
                      <span>Subtotal Itemcount ({wishlist.length})</span>
                      <span className="text-white font-bold">${wishlist.reduce((acc, curr) => acc + Number(curr.price), 0)}</span>
                    </div>
                    
                    <button onClick={handleWishlistCheckout} className="w-full bg-[#c8ff00] text-black py-4 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
                      <WhatsAppIcon size={14} />
                      <span>CHECKOUT VIA WHATSAPP</span>
                    </button>
                    <p className="text-[10px] font-mono text-zinc-500 text-center mt-2.5 leading-relaxed">No direct payment needed here. We will finalize colors, mock size checks and delivery terms directly on secure chat.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. SHOP INFO VIEW */}
          {activeTab === 'info' && (
            <div className="p-4 text-left animate-fadeIn">
              <div className="mb-4">
                <span className="text-[9px] font-mono text-[#c8ff00] uppercase font-bold tracking-widest block">About Atelier</span>
                <h3 className="text-base font-black uppercase tracking-tight">Shop Information</h3>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 space-y-4 font-semibold text-xs text-zinc-300">
                <div className="flex justify-between py-1 border-b border-zinc-900/70">
                  <span className="text-zinc-500">Official Brand Name</span>
                  <span className="text-white font-bold">{shop.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-900/70">
                  <span className="text-zinc-500">Corporate Founder</span>
                  <span className="text-white font-mono">ThreadZW Collective</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-900/70">
                  <span className="text-zinc-500">Contact Number</span>
                  <span className="text-emerald-400 font-mono">+{formatWA(shop.whatsapp)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-900/70">
                  <span className="text-zinc-500">Hours Opened</span>
                  <span className="text-white">{shop.hours || 'Mon-Sat 8:30am - 6pm'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-900/70">
                  <span className="text-zinc-500">Zimbabwe Headquarters</span>
                  <span className="text-white truncate max-w-[180px]">{shop.location || 'Harare'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">Company mission statement</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">{shop.description || 'Dedicated to supporting local streetwear businesses'}</p>
                </div>
              </div>

              <div className="mt-5 border border-zinc-900 bg-zinc-900/20 p-4 rounded-xl text-center">
                <MapPin className="mx-auto text-zinc-600 mb-2" size={20} />
                <h4 className="text-xs font-bold text-white uppercase mb-1">Step-by-Step Directions</h4>
                <p className="text-[11px] text-zinc-500 mb-3.5">We are situated right next to major transport and shopping complexes.</p>
                <button onClick={() => setShowDirections(true)} className="w-full bg-zinc-100 text-zinc-900 py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1">
                  <Map size={12} />
                  <span>GET DIRECTIONS PATH</span>
                </button>
              </div>
            </div>
          )}

        </main>

        {/* ===================== BOTTOM NAVIGATION TABBAR ===================== */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-zinc-950 border-t border-zinc-900 py-2 px-3 flex items-center justify-around z-[100]">
          <button onClick={() => { setActiveTab('home'); setSearchOpen(false); }} className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'home' ? 'text-[#c8ff00]' : 'text-zinc-500'}`}>
            <Map size={15} />
            <span className="font-mono">Home</span>
          </button>
          
          <button onClick={() => { setActiveTab('catalog'); setSearchOpen(false); }} className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'catalog' ? 'text-[#c8ff00]' : 'text-zinc-500'}`}>
            <Grid size={15} />
            <span className="font-mono">Catalog</span>
          </button>

          <button onClick={() => { setActiveTab('categories'); setSearchOpen(false); }} className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'categories' ? 'text-[#c8ff00]' : 'text-zinc-500'}`}>
            <Package size={15} />
            <span className="font-mono">Categories</span>
          </button>

          <button onClick={() => { setActiveTab('wishlist'); setSearchOpen(false); }} className={`flex flex-col items-center gap-1 text-[10px] font-bold relative ${activeTab === 'wishlist' ? 'text-[#c8ff00]' : 'text-zinc-500'}`}>
            <Heart size={15} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white font-mono font-black text-[8px] h-4 w-4 rounded-full flex items-center justify-center shrink-0 border border-zinc-950">{wishlist.length}</span>
            )}
            <span className="font-mono">Wishlist</span>
          </button>

          <button onClick={() => { setActiveTab('info'); setSearchOpen(false); }} className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'info' ? 'text-[#c8ff00]' : 'text-zinc-500'}`}>
            <Info size={15} />
            <span className="font-mono">Info</span>
          </button>
        </nav>        {/* ===================== LAYOUT POPUPS & DRAWERS (ANIMATED OVERLAYS) ===================== */}

        {/* 1. PRODUCT DETAILS MODAL (SCREEN 3) */}
        <AnimatePresence>
          {selectedProduct && (
            <>
              <div className="fixed inset-0 max-w-[430px] mx-auto bg-black/80 z-[200]" onClick={() => setSelectedProduct(null)} />
              <motion.div 
                initial={{ y: '100%' }} 
                animate={{ y: 0 }} 
                exit={{ y: '100%' }} 
                transition={{ type: 'spring', damping: 25 }} 
                className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-zinc-950 text-white rounded-t-[32px] z-[201] border-t border-zinc-900 flex flex-col h-[92vh] max-h-[92vh] overflow-y-auto pb-32 scrollbar-none"
              >
                
                {/* Image Section - Pinned & prominent at top */}
                <div className="relative w-full aspect-[4/5] bg-zinc-900/60 overflow-hidden shrink-0 border-b border-zinc-900 group select-none">
                  <img 
                    src={selectedProduct.images[activeImageIdx] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80'} 
                    alt="Details" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Backdrop shadows overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/35 z-10" />

                  {/* Floating Transparent overlay Header */}
                  <div className="absolute top-0 left-0 right-0 px-4 py-4 flex items-center justify-between z-30">
                    <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 bg-black/60 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md text-white hover:bg-black/80 active:scale-90 transition-all">
                      <ArrowLeft size={16} />
                    </button>
                    <span className="text-[10px] font-mono tracking-widest font-black uppercase bg-black/60 border border-white/5 py-1.5 px-4 rounded-full backdrop-blur-md text-[#c8ff00]">{shop.name || "Storefront Catalog"}</span>
                    <button onClick={() => toggleWishlist(selectedProduct)} className="w-10 h-10 bg-black/60 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/80 active:scale-90 transition-all">
                      <Heart size={15} className={wishlist.some(i => i.id === selectedProduct.id) ? "fill-[#c8ff00] text-[#c8ff00]" : "text-white"} />
                    </button>
                  </div>

                  {/* Simple image swiper controls inside carousel */}
                  {selectedProduct.images.length > 1 && (
                    <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between items-center pointer-events-none z-20">
                      <button 
                        onClick={() => setActiveImageIdx(prev => prev > 0 ? prev - 1 : selectedProduct.images.length - 1)} 
                        className="w-9 h-9 rounded-full bg-black/70 border border-zinc-800/85 pointer-events-auto flex items-center justify-center text-white active:scale-90 hover:bg-black transition-all font-bold text-sm"
                      >
                        &larr;
                      </button>
                      <button 
                        onClick={() => setActiveImageIdx(prev => prev < selectedProduct.images.length - 1 ? prev + 1 : 0)} 
                        className="w-9 h-9 rounded-full bg-black/70 border border-zinc-800/85 pointer-events-auto flex items-center justify-center text-white active:scale-90 hover:bg-black transition-all font-bold text-sm"
                      >
                        &rarr;
                      </button>
                    </div>
                  )}

                  {/* Thumbnail pagination selector indicators */}
                  {selectedProduct.images.length > 1 && (
                    <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-20">
                      {selectedProduct.images.map((_: any, idx: number) => (
                        <button 
                          key={idx} 
                          onClick={() => setActiveImageIdx(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIdx === idx ? 'w-6 bg-[#c8ff00]' : 'w-1.5 bg-white/40'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Info & Details Section (Translucent / Solid sheet) */}
                <div className="w-full bg-zinc-950 flex flex-col relative z-10">
                  
                  {/* scroll components */}
                  <div className="p-5 text-left space-y-5">
                    
                    {/* Floating mini images gallery at the top of scroll */}
                    {selectedProduct.images.length > 1 && (
                      <div className="flex gap-2.5 overflow-x-auto pb-3.5 scrollbar-none border-b border-zinc-900">
                        {selectedProduct.images.map((img: string, i: number) => (
                          <button 
                            key={i} 
                            onClick={() => setActiveImageIdx(i)} 
                            className={`w-14 h-16 rounded-xl overflow-hidden cursor-pointer border-2 shrink-0 transition-all ${activeImageIdx === i ? 'border-[#c8ff00] scale-102 ring-2 ring-[#c8ff00]/15' : 'border-zinc-800 hover:border-zinc-700'}`} 
                          >
                            <img src={img} className="w-full h-full object-cover" alt="Thumb" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest text-[#c8ff00] uppercase font-bold">{selectedProduct.category}</span>
                      {selectedProduct.original_price && (
                        <span className="text-[9px] font-mono bg-white text-zinc-950 font-black px-2 py-0.5 rounded uppercase">Save {Math.round((1 - (selectedProduct.price / selectedProduct.original_price)) * 100)}%</span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black uppercase text-white leading-tight tracking-tight">{selectedProduct.name}</h3>
                      <div className="flex items-baseline gap-2.5 mt-1.5">
                        <span className="text-2xl font-mono font-black text-[#c8ff00]">${selectedProduct.price}</span>
                        {selectedProduct.original_price && (
                          <span className="text-sm font-mono text-zinc-500 line-through">${selectedProduct.original_price}</span>
                        )}
                      </div>
                    </div>

                    <hr className="border-zinc-900" />

                    {/* Colours Selector */}
                    {selectedProduct.colours && selectedProduct.colours.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2 font-black">Available Colors</span>
                        <div className="flex gap-2.5">
                          {selectedProduct.colours.map((c: string) => (
                            <button 
                              key={c} 
                              onClick={() => setSelectedColor(c)}
                              style={{ backgroundColor: getColorHex(c) }}
                              className={`w-8 h-8 rounded-full border border-zinc-900 transition-all ${selectedColor === c ? 'ring-2 ring-[#c8ff00] ring-offset-2 ring-offset-zinc-950 scale-105' : 'hover:scale-102'}`}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sizes Selector */}
                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2 font-black">Available Sizes</span>
                        <div className="flex gap-2 flex-wrap">
                          {selectedProduct.sizes.map((sz: string) => (
                            <button 
                              key={sz} 
                              onClick={() => setSelectedSize(sz)} 
                              className={`px-4 py-2 border rounded-xl text-xs font-mono uppercase transition-all ${selectedSize === sz ? 'bg-[#c8ff00] text-black border-[#c8ff00] font-black shadow-md' : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'}`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description text */}
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5 font-black">Details</span>
                      <p className="text-[12px] text-zinc-400 font-semibold leading-relaxed font-sans">{selectedProduct.description || "Curated premium clothes styled with local aesthetics."}</p>
                    </div>

                    <hr className="border-zinc-900" />

                    {/* PRODUCT REVIEWS ENGINE (SCREEN 13) */}
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-3 font-black">Product Feedback</span>
                      
                      <div className="space-y-3 mb-4">
                        {(reviews[selectedProduct.id] || []).map((rev, rIdx) => (
                          <div key={rIdx} className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-xs text-zinc-200">{rev.name}</span>
                              <span className="text-[8px] font-mono text-zinc-500">{rev.date}</span>
                            </div>
                            <div className="flex gap-0.5 mb-2">
                              {[1,2,3,4,5].map(st => (
                                <Star key={st} size={9} className={st <= rev.rating ? "fill-[#c8ff00] text-[#c8ff00]" : "text-zinc-700"} />
                              ))}
                            </div>
                            <p className="text-[11px] text-zinc-400 font-semibold leading-normal">{rev.text}</p>
                          </div>
                        ))}
                        {(reviews[selectedProduct.id] || []).length === 0 && (
                          <p className="text-[10px] font-mono text-zinc-650 italic">No review comments left yet on this piece.</p>
                        )}
                      </div>

                      {/* Review submit form */}
                      <form onSubmit={(e) => handleWriteReviewSubmit(e, selectedProduct.id)} className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-900 text-left space-y-3">
                        <span className="text-[10px] font-mono text-[#c8ff00] uppercase block font-black">Add Your Review</span>
                        <input 
                          type="text" 
                          placeholder="Your Name" 
                          value={newReviewName} 
                          onChange={(e) => setNewReviewName(e.target.value)}
                          className="w-full bg-zinc-955 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#c8ff00]" 
                          required
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-500">Rating:</span>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(st => (
                              <button key={st} type="button" onClick={() => setNewReviewRating(st)} className="p-0.5">
                                <Star size={14} className={st <= newReviewRating ? "fill-[#c8ff00] text-[#c8ff00]" : "text-zinc-600"} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea 
                          placeholder="Write comments..." 
                          rows={2} 
                          value={newReviewComments} 
                          onChange={(e) => setNewReviewComments(e.target.value)}
                          className="w-full bg-zinc-955 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c8ff00]" 
                          required
                        />
                        <button type="submit" className="w-full py-2.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors">Submit Review</button>
                      </form>
                    </div>

                  </div>
                </div>

                {/* Sticky Detail bottom checkout buttons - Always pinned at bottom of viewport */}
                <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-zinc-950/95 backdrop-blur-md border-t border-zinc-900 p-4 grid grid-cols-2 gap-3 z-40">
                  <button 
                    onClick={() => handleDetailOrderWhatsApp(selectedProduct)} 
                    className="bg-zinc-900 hover:bg-[#c8ff00]/10 hover:border-[#c8ff00] border border-zinc-800 py-3.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-white"
                  >
                    <WhatsAppIcon size={14} />
                    <span className="uppercase tracking-widest text-[9px]">Chat on WhatsApp</span>
                  </button>
                  <button 
                    onClick={() => { setSelectedProduct(null); setShowDirections(true); }} 
                    className="bg-[#c8ff00] hover:bg-[#b0df00] text-black py-3.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
                  >
                    <MapPin size={12} />
                    <span className="uppercase tracking-widest text-[9px]">Pin Shop Route</span>
                  </button>
                </div>

              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 2. VISIT SHOP DIRECTIONS DRAWER (SCREEN 8) */}
        <AnimatePresence>
          {showDirections && (
            <>
              <div className="fixed inset-0 max-w-[430px] mx-auto bg-black/80 z-[250]" onClick={() => setShowDirections(false)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-zinc-950 text-white rounded-t-2xl z-[261] p-5 border-t border-zinc-900 text-left flex flex-col">
                <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-4" />
                
                <h3 className="text-sm font-black uppercase text-white mb-2 flex items-center gap-1.5">
                  <MapPin size={16} className="text-[#c8ff00]" />
                  <span>Physical Store directions</span>
                </h3>

                <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-3.5 space-y-3.5 mb-5 font-semibold text-xs text-zinc-300">
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Physical Address Coordinate</span>
                    <p className="text-white font-bold">{directionsData.address}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Primary Landmark</span>
                    <p className="text-zinc-100">{directionsData.landmark}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-1">Walking Path directions</span>
                    <p className="text-[11px] text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed">{directionsData.stepByStep}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${directionsData.address}\n\nLandmark: ${directionsData.landmark}\n\nDirections:\n${directionsData.stepByStep}`);
                      triggerLocalToast("Directions copied successfully");
                    }} 
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Copy size={12} />
                    <span>Copy Route text block</span>
                  </button>
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.location || 'Harare'} Zimbabwe`)}`, '_blank')}
                    className="w-full py-3 bg-[#c8ff00] text-black rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Map size={14} />
                    <span>Open in Google Maps</span>
                  </button>
                </div>

                <button onClick={() => setShowDirections(false)} className="text-zinc-400 hover:text-white font-mono text-[9px] uppercase tracking-widest text-center mt-4">Dismiss directions</button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 3. INTERACTIVE WHATSAPP MESSENGER TEMPLATES (SCREEN 9) */}
        <AnimatePresence>
          {showWhatsAppContact && (
            <>
              <div className="fixed inset-0 max-w-[430px] mx-auto bg-black/80 z-[250]" onClick={() => setShowWhatsAppContact(false)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-zinc-950 text-white rounded-t-2xl z-[261] border-t border-zinc-900 text-left flex flex-col overflow-hidden pb-4">
                
                {/* Simulated Green WhatsApp Header */}
                <div className="bg-emerald-900 border-b border-emerald-800 px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                      {shop.logo_url ? <img src={shop.logo_url} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">{shop.name} helpline</h4>
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Online & Active Helper
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setShowWhatsAppContact(false)} className="text-emerald-350 hover:text-white p-1">
                    <X size={15} />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <p className="text-[11px] text-zinc-400 font-semibold">Tap any quick inquiry template down below. We will prefills your WhatsApp messenger thread instantly to get rapid assistance!</p>
                  
                  <div className="space-y-2">
                    {WHATSAPP_MESSAGE_TEMPLATES.map((tpl) => (
                      <button 
                        key={tpl.id} 
                        onClick={() => {
                          const num = formatWA(shop.whatsapp);
                          const url = `https://wa.me/${num}?text=${encodeURIComponent(tpl.text)}`;
                          window.open(url, '_blank');
                        }}
                        className="w-full text-left p-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 rounded-xl flex items-center justify-between group active:scale-99 transition-all"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#c8ff00] block mb-0.5">{tpl.title}</span>
                          <p className="text-[11px] text-zinc-300 font-semibold italic">"{tpl.text}"</p>
                        </div>
                        <ArrowRight size={13} className="text-zinc-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>

                  <a href={`https://wa.me/${formatWA(shop.whatsapp)}?text=Hi!+Curious+about+your+ThreadZW+catalog+pieces`} target="_blank" rel="noreferrer" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                    <WhatsAppIcon size={14} />
                    <span>Open direct custom chat helpline</span>
                  </a>
                </div>

              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 4. SHARE STORE MODAL (SCREEN 12) */}
        <AnimatePresence>
          {showShareModal && (
            <>
              <div className="fixed inset-0 max-w-[430px] mx-auto bg-black/85 z-[250]" onClick={() => setShowShareModal(false)} />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed inset-0 m-auto max-w-[360px] h-fit bg-zinc-900 border border-zinc-800 rounded-2xl z-[261] p-5 text-center flex flex-col shadow-2xl">
                
                <CheckCircle2 size={36} className="mx-auto text-[#c8ff00] mb-3" />
                <h3 className="text-sm font-black uppercase text-white">Share secure storefront</h3>
                <p className="text-[11px] text-zinc-400 font-semibold mt-1 mb-4 leading-relaxed">Let friends discover local streetwear designs on secure platforms.</p>

                <div className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono text-zinc-400 select-all truncate max-w-[200px]">{window.location.origin}/shop/{shop.slug}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/shop/${shop.slug}`);
                      triggerLocalToast("Store URL Link copied!");
                    }} 
                    className="p-2 bg-[#c8ff00] text-black rounded" 
                    title="Copy URL"
                  >
                    <Copy size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => window.open(`https://wa.me/?text=Check+out+this+amazing+storefront+on+ThreadZW:+${encodeURIComponent(`${window.location.origin}/shop/${shop.slug}`)}`, '_blank')} className="py-2.5 bg-zinc-950 border border-zinc-800 hover:text-emerald-400 rounded-lg text-xs font-mono font-semibold">WhatsApp Share</button>
                  <button onClick={() => window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/shop/${shop.slug}`)}`, '_blank')} className="py-2.5 bg-zinc-950 border border-zinc-800 hover:text-blue-400 rounded-lg text-xs font-mono font-semibold">Facebook Post</button>
                </div>

                <button onClick={() => setShowShareModal(false)} className="text-zinc-500 hover:text-white uppercase font-mono text-[9px] mt-4 tracking-widest">Close panel</button>

              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 5. UPLOAD CUSTOM DESIGN FORM DRAWER */}
        <AnimatePresence>
          {showDemandDrawer && (
            <>
              <div className="fixed inset-0 max-w-[430px] mx-auto bg-black/80 z-[280]" onClick={() => setShowDemandDrawer(false)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-zinc-950 text-white rounded-t-2xl z-[281] p-5 border-t border-zinc-900 text-left flex flex-col">
                <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-4" />
                
                <h3 className="text-sm font-bold uppercase text-white mb-1.5">Custom Sizing Design</h3>
                <p className="text-[11px] text-zinc-400 font-semibold mb-4 leading-relaxed">Let local designers check material sourcing options and tailors pricing constraints on WhatsApp!</p>

                <form onSubmit={handleCustomRequestSubmit} className="space-y-4">
                  <div>
                    <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Upload visual crop</span>
                    <div 
                      onClick={() => document.getElementById('demand-input-files')?.click()}
                      className="border-2 border-dashed border-zinc-800 bg-zinc-900/40 rounded-xl py-6 text-center cursor-pointer hover:bg-zinc-900 transition-colors relative h-28 flex flex-col justify-center items-center"
                    >
                      {demandImageUrl ? (
                        <div className="absolute inset-0">
                          <img src={demandImageUrl} alt="Query" className="w-full h-full object-contain p-2" />
                        </div>
                      ) : (
                        <>
                          <Plus size={16} className="text-zinc-600 mx-auto" />
                          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">Pick visual item layout picture</span>
                        </>
                      )}
                    </div>
                    <input id="demand-input-files" type="file" accept="image/*" onChange={handleCustomDemandUpload} className="hidden" />
                  </div>

                  <div>
                    <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Describe your parameters</span>
                    <textarea 
                      placeholder="e.g. looking for this cargo pocket utility setup styled in medium, black cotton fleece fabric." 
                      rows={2} 
                      value={demandDesc} 
                      onChange={(e) => setDemandDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#c8ff00] font-sans"
                      required
                    />
                  </div>

                  <div>
                    <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Your whatsapp number</span>
                    <input 
                      type="tel" 
                      placeholder="+263 7..." 
                      value={customerWhatsApp} 
                      onChange={(e) => setCustomerWhatsApp(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#c8ff00] font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button type="button" onClick={() => setShowDemandDrawer(false)} className="py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg font-bold text-xs">Cancel</button>
                    <button type="submit" disabled={isUploadingDemand} className="py-3 bg-[#c8ff00] text-black rounded-lg font-bold text-xs disabled:opacity-50">
                      {isUploadingDemand ? 'Processing...' : 'Submit Request'}
                    </button>
                  </div>
                </form>

              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 6. ADVANCED FILTERS SYSTEM DRAWER */}
        <AnimatePresence>
          {showFiltersDrawer && (
            <>
              <div className="fixed inset-0 max-w-[430px] mx-auto bg-black/80 z-[250]" onClick={() => setShowFiltersDrawer(false)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-zinc-950 text-white rounded-t-2xl z-[261] p-5 border-t border-zinc-900 text-left flex flex-col">
                <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-4" />
                
                <h3 className="text-sm font-black uppercase text-white mb-1.5 flex items-center justify-between">
                  <span>Advanced Storefront Filters</span>
                  <button onClick={() => { setPriceMax(100); setActiveCategory('all'); }} className="text-[10px] font-mono text-[#c8ff00] uppercase">Reset All</button>
                </h3>

                <div className="space-y-4 my-4 font-semibold text-xs">
                  <div>
                    <span className="text-zinc-500 block mb-2 font-mono text-[9px] uppercase">Selector category</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {['all', ...DEFAULT_MOCK_CATEGORIES.filter(c => c.id !== 'all').map(c => c.name)].map((catName) => (
                        <button 
                          key={catName} 
                          type="button" 
                          onClick={() => setActiveCategory(catName)}
                          className={`px-3 py-1 text-[10px] font-mono rounded border uppercase ${activeCategory.toLowerCase() === catName.toLowerCase() ? 'bg-[#c8ff00] text-black border-[#c8ff00] font-bold' : 'bg-zinc-900 text-zinc-400 border-zinc-850'}`}
                        >
                          {catName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2">
                      <span className="uppercase">Maximum Retail Price</span>
                      <span className="text-white font-bold">${priceMax} USD</span>
                    </div>
                    <input 
                      type="range" 
                      min={10} 
                      max={120} 
                      value={priceMax} 
                      onChange={(e) => setPriceMax(Number(e.target.value))}
                      className="w-full accent-[#c8ff00]"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-zinc-600 mt-1">
                      <span>$10</span>
                      <span>$120+</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => setShowFiltersDrawer(false)} className="w-full py-3.5 bg-zinc-100 text-black rounded-xl font-bold text-xs uppercase tracking-wider text-center active:scale-95">Apply Selected Options</button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
