import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { getShopStatus } from '../utils/shopStatus';
import { 
  ArrowLeft, Share2, MapPin, Package, Clock, 
  X, ShoppingBag, ArrowRight, Upload, Map,
  Search, ChevronLeft, ChevronRight, Eye, Image as ImageIcon
} from 'lucide-react';

// Custom white WhatsApp icon path for design specifications
const WhatsAppIcon = ({ size = 18, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M17.472 14.382c-.368-.18-2.163-1.07-2.5-1.192-.333-.125-.577-.184-.817.184-.24.368-.934 1.192-1.144 1.438-.21.244-.417.27-.785.092-1.42-.71-2.47-1.31-3.32-2.766-.226-.39.226-.362.648-1.2.073-.146.036-.272-.018-.38-.054-.11-.482-1.162-.663-1.597-.174-.42-.37-.362-.507-.369-.13-.007-.28-.009-.43-.009-.15 0-.396.056-.604.28-.208.225-.792.775-.792 1.888s.81 2.195.922 2.348c.11.15 1.593 2.435 3.86 3.414.54.233.96.372 1.288.477.544.172 1.037.147 1.428.09.435-.065 1.332-.544 1.52-.1.9-.187.356-.347.534-.347.18 0 .324-.09.24-.265zM12.004 2c-5.518 0-10 4.482-10 10 0 1.764.462 3.486 1.333 5.01L2 22l5.12-1.332c1.478.805 3.14 1.233 4.88 1.233 5.518 0 10-4.482 10-10S17.52 2 12.004 2zm0 18c-1.53 0-3.033-.404-4.352-1.166l-.313-.186-3.23.84.856-3.147-.205-.326C4.015 14.88 3.5 13.12 3.5 11.25c0-4.687 3.813-8.5 8.5-8.5s8.5 3.813 8.5 8.5-3.813 8.5-8.5 8.5z"/>
  </svg>
);

// Map common color names to HEX for the product details color picker circles
const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff3b30',
  blue: '#007aff',
  green: '#34c759',
  yellow: '#ffcc00',
  grey: '#8e8e93',
  gray: '#8e8e93',
  brown: '#a25621',
  pink: '#ff2d55',
  purple: '#5856d6',
  orange: '#ff9500',
  beige: '#f5f5dc',
  cream: '#fffdd0',
  khaki: '#f0e68c',
  navy: '#000080',
  charcoal: '#36454f'
};

const getColorHex = (colorName: string) => {
  const normalized = colorName.trim().toLowerCase();
  return COLOR_MAP[normalized] || normalized;
};

// Format WhatsApp to standard 263 dialer format
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

  // Core Data States
  const [shop, setShop] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [logoAccent, setLogoAccent] = useState('#e11d48'); // Default pink/rose outline from screenshot

  // Dynamic Logo Accent Color Extractor Logic
  useEffect(() => {
    const logoUrl = shop?.logo_url || shop?.avatar_url;
    if (!logoUrl) {
      setLogoAccent('#e11d48');
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
        canvas.width = 30;
        canvas.height = 30;
        ctx.drawImage(img, 0, 0, 30, 30);
        const imgData = ctx.getImageData(0, 0, 30, 30).data;
        
        let vibrantColor = '';
        let maxVibrancy = -1;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i+1];
          const b = imgData[i+2];
          const a = imgData[i+3];

          if (a < 200) continue; // skip transparent/semi-transparent pixels

          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const diff = maxVal - minVal;
          
          // Skip neutral grays/whites/blacks
          if (diff > 25 && maxVal < 245 && minVal > 15) {
            const vibrancy = diff + (maxVal / 2);
            if (vibrancy > maxVibrancy) {
              maxVibrancy = vibrancy;
              vibrantColor = `rgb(${r},${g},${b})`;
            }
          }
        }

        if (vibrantColor) {
          setLogoAccent(vibrantColor);
        } else {
          setLogoAccent('#e11d48');
        }
      } catch (err) {
        setLogoAccent('#e11d48');
      }
    };
    img.onerror = () => {
      setLogoAccent('#e11d48');
    };
  }, [shop]);

  // Filter and Interactive UI States
  const [activeCategory, setActiveCategory] = useState<any>({ id: 'all', name: 'All' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeGridProducts, setActiveGridProducts] = useState<any[]>([]);

  // Product Selection Details Popup Overlay State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [descExpanded, setDescExpanded] = useState<boolean>(false);

  // Shop Info Details Popup Overlay State
  const [showVisitPopup, setShowVisitPopup] = useState<boolean>(false);

  // Customer Custom Demand Request Drawer Option State
  const [showDemandDrawer, setShowDemandDrawer] = useState<boolean>(false);
  const [customerWhatsApp, setCustomerWhatsApp] = useState<string>('');
  const [demandDesc, setDemandDesc] = useState<string>('');
  const [demandImageFile, setDemandImageFile] = useState<File | null>(null);
  const [demandImageUrl, setDemandImageUrl] = useState<string>('');
  const [isUploadingDemand, setIsUploadingDemand] = useState<boolean>(false);

  // Custom UI notification Toast definition triggered internally
  const [customToastMsg, setCustomToastMsg] = useState<string | null>(null);

  // Ref container hooks for scrolling
  const detailHeaderRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentSlug) {
      loadStorefrontData();
    }
  }, [currentSlug]);

  const triggerLocalToast = (msg: string) => {
    setCustomToastMsg(msg);
    setTimeout(() => {
      setCustomToastMsg(null);
    }, 2800);
  };

  const loadStorefrontData = async () => {
    setLoading(true);
    try {
      let handleClean = currentSlug.replace(/^@/, '').trim().toLowerCase();
      if (!handleClean) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // 1. QUERY CORE SHOP DATA
      const { data: shopRecord, error: shopErr } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', handleClean)
        .maybeSingle();

      let targetShop = shopRecord;
      if (!targetShop) {
        // Fallback to check if handle is indexed
        const { data: fallbackShop } = await supabase
          .from('shops')
          .select('*')
          .ilike('handle', handleClean)
          .maybeSingle();
        targetShop = fallbackShop;
      }

      if (!targetShop) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setShop(targetShop);
      document.title = `${targetShop.name} — Storefront`;

      // Increment total layout view telemetry passively
      try {
        await supabase
          .from('shops')
          .update({ view_count: (targetShop.view_count || 0) + 1 })
          .eq('id', targetShop.id);
      } catch (_) {}

      // 2. QUERY CATEGORIES FOR DYNAMIC STRIP FILTERING
      const { data: categoryRecords } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', targetShop.id)
        .order('sort_order', { ascending: true });

      const loadedCats = categoryRecords || [];
      // Combine with predefined empty default lists if empty
      setCategories(loadedCats);

      // 3. QUERY PRODUCTS
      const { data: productRecords } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', targetShop.id)
        .neq('status', 'deleted')
        .order('is_published', { ascending: false })
        .order('created_at', { ascending: false });

      const mappedProducts = (productRecords || []).map((p: any) => {
        let imgs: string[] = [];
        if (Array.isArray(p.images)) {
          imgs = p.images.filter(Boolean);
        } else if (typeof p.images === 'string' && p.images.trim()) {
          imgs = [p.images.trim()];
        }

        // Standardize local lists
        return {
          ...p,
          images: imgs,
          colors: p.colours || p.colors || [],
          sizes: p.sizes || []
        };
      });

      setProducts(mappedProducts);
      setActiveGridProducts(mappedProducts);

    } catch (err) {
      console.error("Failed loading ThreadZW Storefront info:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Synchronously filters the products display layer when active category or search string changes
  useEffect(() => {
    if (!products.length) return;

    let filtered = [...products];

    // Search query constraint
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(p => p.name?.toLowerCase().includes(q));
    }

    // Category highlight constraint
    if (activeCategory && activeCategory.id !== 'all') {
      filtered = filtered.filter(p => {
        const matchesId = p.category_id === activeCategory.id;
        const matchesTextStr = p.category?.toLowerCase() === activeCategory.name?.toLowerCase();
        return matchesId || matchesTextStr;
      });
    }

    setActiveGridProducts(filtered);
  }, [activeCategory, searchQuery, products]);

  // File picker handler code inside uploader area
  const handleDemandFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDemandImageFile(file);
    setIsUploadingDemand(true);

    try {
      // Create a temporary object URL to represent upload status locally
      const localUrl = URL.createObjectURL(file);
      setDemandImageUrl(localUrl);

      // Attempt actual upload to Supabase storage area if possible
      const timestamp = Date.now();
      const cleanFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const path = `demands/${shop?.id || 'public'}/${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(path, file, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('products')
          .getPublicUrl(path);
        if (publicData?.publicUrl) {
          setDemandImageUrl(publicData.publicUrl);
        }
      }
    } catch (err) {
      console.warn("Storage upload failed, falling back to local object URL state:", err);
    } finally {
      setIsUploadingDemand(false);
    }
  };

  // Submit Demand logic
  const handleDemandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandDesc.trim()) {
      triggerLocalToast("Please enter a description first");
      return;
    }

    try {
      // 1. Insert demand query record to Supabase
      const requestPayload = {
        shop_id: shop?.id,
        image_url: demandImageUrl,
        description: demandDesc.trim(),
        customer_whatsapp: customerWhatsApp.trim() || null,
        created_at: new Date().toISOString()
      };

      await supabase
        .from('demand_requests')
        .insert(requestPayload);

      // 2. Open WhatsApp direct communication with the seller
      const wsMessage = `Hi ${shop?.name},\n\nI uploaded a custom design request on your ThreadZW store.\nI am looking for: ${demandDesc.trim()}${customerWhatsApp ? `\nMy phone: ${customerWhatsApp}` : ''}\n\nCan you notify me if this is available?`;
      const encoded = encodeURIComponent(wsMessage);
      const sellerNum = formatWA(shop?.whatsapp || shop?.whatsapp_number);
      
      const whatsappUrl = `https://wa.me/${sellerNum}?text=${encoded}`;
      
      triggerLocalToast("Request submitted successfully!");
      
      // Delayed close and redirect link trigger
      setTimeout(() => {
        setShowDemandDrawer(false);
        setDemandDesc('');
        setCustomerWhatsApp('');
        setDemandImageFile(null);
        setDemandImageUrl('');
        window.open(whatsappUrl, '_blank');
      }, 1200);

    } catch (err) {
      console.error(err);
      triggerLocalToast("Could not send request");
    }
  };

  // Submit WhatsApp product order code
  const handleOrderOnWhatsApp = () => {
    if (!selectedProduct) return;

    // Validate size selection if sizes exist
    const hasSizes = Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.filter(Boolean).length > 0;
    if (hasSizes && !selectedSize) {
      triggerLocalToast("Select a size first");
      return;
    }

    const orderText = `Hi ${shop?.name || 'there'},\n\nI would like to order:\n\nProduct: ${selectedProduct.name}\nSize: ${selectedSize || 'N/A'}\nColour: ${selectedColor || 'N/A'}\n\nIs this available?`;
    const buyerNum = formatWA(shop?.whatsapp || shop?.whatsapp_number);
    const orderUrl = `https://wa.me/${buyerNum}?text=${encodeURIComponent(orderText)}`;
    
    window.open(orderUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-black">
        <div className="w-10 h-10 border-4 border-black border-t-[#c8ff00] rounded-full animate-spin mb-4" />
        <p className="text-sm font-black uppercase tracking-wider">Loading shopfront...</p>
      </div>
    );
  }

  if (notFound || !shop) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center text-black">
        <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mb-6">
          <Package className="text-zinc-400" size={32} />
        </div>
        <h2 className="text-2xl font-black tracking-tight uppercase mb-2">Shop Not Found</h2>
        <p className="text-sm text-zinc-500 max-w-xs mb-6">We could not retrieve the store details. It might have been deleted or moved.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-3.5 bg-black text-white font-black text-xs uppercase tracking-widest rounded-[10px] active:scale-95 transition-transform"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Calculate opening status strings
  const openScheduleText = shop.hours || "Mon-Sat 9am-6pm";
  const mapDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.location || 'Harare'} Zimbabwe`)}`;

  // Default initial representations of category strip
  const categoriesStrip = [{ id: 'all', name: 'All' }, ...categories];  return (
    <div className="min-h-screen bg-[#050508] flex justify-center selection:bg-[#E11D48] selection:text-white text-white">
      {/* Dynamic Slide-down alert toast notification */}
      <AnimatePresence>
        {customToastMsg && (
          <motion.div 
            initial={{ translateY: -100, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-[380px]"
          >
            <div className="bg-[#121214] text-white px-5 py-4 rounded-[12px] shadow-2xl flex items-center justify-between border border-white/5">
              <span className="text-xs font-black uppercase tracking-wider">{customToastMsg}</span>
              <button onClick={() => setCustomToastMsg(null)} className="text-zinc-500 hover:text-white p-1">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="public_screen_wrapper" className="w-full max-w-[430px] min-h-screen bg-black relative flex flex-col shadow-2xl border-x border-white/[0.04]">
        
        {/* ==================== HERO / BANNER SECTION ==================== */}
        <section className="relative">
          {/* Banner image */}
          <div className="w-full h-[220px] overflow-hidden relative bg-[#09090b]">
            {/* Floating Back arrow - overlays the top left of the banner exactly like the screenshot */}
            <button
              onClick={() => window.history.back()}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white z-50 hover:bg-black/60 transition-all border border-white/10 active:scale-95 cursor-pointer"
              title="Go back"
            >
              <ArrowLeft size={18} />
            </button>

            {shop.banner_url ? (
              <img 
                src={shop.banner_url} 
                alt={`${shop.name} cover banner`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
                <span className="text-zinc-500 text-xs font-black uppercase tracking-widest">welcome to store</span>
              </div>
            )}
            
            {/* Dark gradient overlay for modern depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Logo Row with Follow & Share buttons - exact overlapping mechanics */}
          <div className="px-4 -mt-[45px] relative z-20 flex items-end justify-between">
            {/* Logo circle */}
            <div className="w-[90px] h-[90px] rounded-full border-[4px] border-black bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
              {shop.logo_url || shop.avatar_url ? (
                <img 
                  src={shop.logo_url || shop.avatar_url} 
                  alt={`${shop.name} logo`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-extrabold text-2xl tracking-tight">
                  {shop.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Share & Follow actions on the right side - exactly like screenshot */}
            <div className="flex items-center gap-2 mb-1">
              {/* Search icon button */}
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="Search products"
              >
                <Search size={18} />
              </button>

              {/* Share Button representing the exact screenshot shape */}
              <button 
                onClick={() => {
                  const link = `${window.location.origin}/shop/${shop.slug || shop.handle}`;
                  if (navigator.share) {
                    navigator.share({
                      title: shop.name,
                      text: `Shop premium wear from ${shop.name} online!`,
                      url: link
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(link);
                    triggerLocalToast("Store URL copied to clipboard");
                  }
                }}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="Share store link"
              >
                <Share2 size={18} />
              </button>

              {/* Follow Button using the dynamic accent extracted color */}
              <button
                onClick={() => {
                  triggerLocalToast("Following store!");
                }}
                style={{ borderColor: logoAccent, color: logoAccent }}
                className="px-5 h-10 border rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center cursor-pointer hover:bg-white/[0.02] active:scale-95 transition-all"
              >
                Follow
              </button>
            </div>
          </div>
        </section>

        {/* ==================== SEARCH BAR ==================== */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-black border-b border-white/[0.04]"
            >
              <div className="p-4 pt-4">
                <div className="relative flex items-center">
                  <input 
                    type="text"
                    className="w-full bg-zinc-900 border-none rounded-[12px] py-3.5 pl-11 pr-10 text-[14px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-500 placeholder:font-normal"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute left-4 text-zinc-500">
                    <Search size={16} />
                  </div>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 text-zinc-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== SHOP INFORMATION BLOCK ==================== */}
        <section className="bg-black pt-4">
          <div className="px-4">
            {/* Title Profile label with high weighting */}
            <h2 className="text-[24px] font-[900] text-white tracking-[-0.5px] leading-tight flex items-center gap-1.5">
              {shop.name}
            </h2>
            <p className="text-[13px] text-zinc-500 font-bold mt-1 tracking-wide">
              @{shop.slug || shop.handle || 'oldlanddressing'} • {shop.location || 'Bulawayo'}
            </p>

            {/* Accent tags row from mockup */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span 
                style={{ borderColor: `${logoAccent}33`, color: logoAccent, backgroundColor: `${logoAccent}0a` }}
                className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
              >
                {shop.category || 'General Store'}
              </span>

              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/5 bg-zinc-900/60 text-zinc-400">
                <MapPin size={10} className="text-zinc-600" />
                {shop.location || 'Bulawayo'}
              </span>
            </div>

            {/* Bio description text block */}
            {shop.description && (
              <p className="text-[13.5px] text-zinc-400 leading-relaxed font-semibold mt-4 text-left">
                {shop.description}
              </p>
            )}
          </div>

          {/* ==================== STATS RECORD CARD ==================== */}
          <div className="px-4 mt-5">
            <div className="bg-[#0b0b0d] border border-white/[0.04] p-4 rounded-[16px] grid grid-cols-3 text-center shadow-lg">
              {/* Box 1 */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-[21px] font-[900] text-white leading-none">0</span>
                <span className="text-[10px] text-zinc-500 font-black uppercase mt-1.5 tracking-wider">Followers</span>
              </div>
              
              {/* Divider Middle Box */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-y-1 left-0 w-[1px] bg-white/[0.06]" />
                <div className="flex flex-col items-center justify-center w-full">
                  <span className="text-[21px] font-[900] text-white leading-none">{products.length}</span>
                  <span className="text-[10px] text-zinc-500 font-black uppercase mt-1.5 tracking-wider">Products</span>
                </div>
                <div className="absolute inset-y-1 right-0 w-[1px] bg-white/[0.06]" />
              </div>

              {/* Box 3 */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-[21px] font-[900] text-white leading-none">4.9</span>
                <span className="text-[10px] text-zinc-500 font-black uppercase mt-1.5 tracking-wider">Rating</span>
              </div>
            </div>
          </div>

          {/* ==================== KEY DETAILS ROW CARDS ==================== */}
          <div className="px-4 mt-3 space-y-2">
            {/* Geo Pin */}
            <div className="bg-[#0b0b0d] border border-white/[0.04] p-4 rounded-[14px] flex items-center gap-3.5 shadow-md">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-white/5 shrink-0" style={{ color: logoAccent }}>
                <MapPin size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] text-zinc-300 font-bold block truncate">
                  {shop.location || "Bulawayo, Zimbabwe"}
                </span>
              </div>
            </div>

            {/* Live Clock Open Indicator */}
            <div className="bg-[#0b0b0d] border border-white/[0.04] p-4 rounded-[14px] flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-white/5 shrink-0" style={{ color: logoAccent }}>
                  <Clock size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[13px] text-zinc-300 font-bold block truncate">
                    {openScheduleText}
                  </span>
                </div>
              </div>

              <span className="flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Open
              </span>
            </div>
          </div>

          {/* ==================== ACTION TRIGGERS ==================== */}
          <div className="px-4 mt-4 grid grid-cols-2 gap-2.5">
            <a 
              href={`https://wa.me/${formatWA(shop.whatsapp || shop.whatsapp_number)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white rounded-[12px] py-4 text-[13.5px] font-[900] text-center flex items-center justify-center gap-2 tracking-wide cursor-pointer hover:brightness-105 active:scale-95 transition-all shadow-lg"
            >
              <WhatsAppIcon size={16} />
              <span>Chat on WhatsApp</span>
            </a>

            <button 
              onClick={() => setShowVisitPopup(true)}
              className="bg-zinc-900 text-white rounded-[12px] py-4 text-[13.5px] font-[900] text-center flex items-center justify-center gap-2 cursor-pointer transition-all border border-white/5 active:scale-95 hover:bg-zinc-850"
            >
              <MapPin size={14} style={{ color: logoAccent }} />
              <span>Visit Shop</span>
            </button>
          </div>
        </section>

        {/* ==================== HORIZONTAL CATEGORY SQUARE CARDS strip ==================== */}
        <section className="py-5 border-t border-white/[0.04] mt-5">
          <div className="px-4 pb-3 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-zinc-500 tracking-[1.5px] uppercase">
              Shop Categories
            </h3>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none snap-x snap-mandatory">
            {categoriesStrip.map((item) => {
              const isSelected = activeCategory.id === item.id;
              const firstLetter = item.name.slice(0, 1).toUpperCase();

              return (
                <div 
                  key={item.id}
                  onClick={() => setActiveCategory(item)}
                  className="flex flex-col items-center gap-2 cursor-pointer shrink-0 snap-start"
                >
                  <div className="relative">
                    {/* SQUARE Category Highlight card */}
                    <div 
                      style={{
                        borderColor: isSelected ? logoAccent : 'transparent',
                        boxShadow: isSelected ? `0 0 14px ${logoAccent}40` : 'none'
                      }}
                      className={`w-[72px] h-[72px] rounded-[12px] flex items-center justify-center transition-all border-2 overflow-hidden bg-[#0d0d0f] ${
                        isSelected ? 'scale-105' : 'border-white/5'
                      }`}
                    >
                      {item.cover_image_url ? (
                        <img 
                          src={item.cover_image_url} 
                          alt={`${item.name} cover`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                          <span className="text-white font-[950] text-[22px] tracking-tight">{firstLetter}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] max-w-[72px] truncate text-center font-extrabold tracking-wide ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================== PRODUCT SQUARE CARD LISTING GRID ==================== */}
        <section className="px-4 py-5 flex-1 border-t border-white/[0.04] bg-black">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[16px] font-[900] text-white uppercase tracking-tight">
              {activeCategory.name === 'All' ? 'All Products' : activeCategory.name}
            </h3>
            <span className="text-[12px] font-bold text-zinc-500">
              {activeGridProducts.length} items
            </span>
          </div>

          {activeGridProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={36} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-[13px] font-bold text-zinc-500">Nothing here yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {activeGridProducts.map((prod) => {
                const thumb = prod.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80';
                const isSoldOut = prod.total_stock <= 0;

                return (
                  <div 
                    key={prod.id}
                    onClick={() => {
                      setSelectedProduct(prod);
                      setActiveImageIdx(0);
                      setSelectedSize('');
                      setSelectedColor('');
                      setDescExpanded(false);
                    }}
                    className="group cursor-pointer flex flex-col relative"
                  >
                    {/* Exact Aspect-Square card frame */}
                    <div className="w-full aspect-square rounded-[12px] border border-white/[0.04] bg-[#0b0b0d] overflow-hidden relative shrink-0">
                      <img 
                        src={thumb} 
                        alt={prod.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />

                      {isSoldOut ? (
                        <div className="absolute top-2 left-2 rounded-[6px] px-2 py-0.5 text-[9px] font-black tracking-widest uppercase bg-black/80 text-zinc-500 border border-white/5 z-10">
                          SOLD OUT
                        </div>
                      ) : (
                        prod.tag && prod.tag !== 'None' && (
                          <div 
                            style={{ backgroundColor: logoAccent }}
                            className="absolute top-2 left-2 rounded-[6px] px-2 py-0.5 text-[9px] font-black tracking-widest uppercase text-white shadow-md z-10"
                          >
                            {prod.tag}
                          </div>
                        )
                      )}

                      {/* Floating overlay price badge */}
                      <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-[8px] text-[12px] font-black border border-white/5 text-white">
                        ${prod.price}
                      </div>
                    </div>

                    {/* Captions below */}
                    <div className="pt-2 px-1 text-left flex-1 flex flex-col justify-between">
                      <h4 className="text-[13px] font-bold text-zinc-200 leading-tight tracking-tight line-clamp-1 group-hover:text-white transition-colors">
                        {prod.name}
                      </h4>
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mt-0.5">
                        {prod.category || "Curated"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* ==================== DEMAND DISCOVERY SHORTCUT BANNER ==================== */}
          <div className="mt-14 pt-8 border-t border-white/[0.04] text-center pb-6">
            <h4 className="text-[13.5px] font-black text-white tracking-tight uppercase mb-0.5">
              Looking for something specific?
            </h4>
            <p className="text-[12px] font-bold text-zinc-500 mb-4">
              Let us know what you want and we will source it.
            </p>

            <button 
              onClick={() => setShowDemandDrawer(true)}
              className="w-full bg-zinc-900 text-white border border-white/5 py-4 px-5 rounded-[12px] font-bold text-[13.5px] flex items-center justify-center gap-2 hover:bg-zinc-850 cursor-pointer transition-colors"
            >
              <Upload size={15} />
              <span>Upload What You Want</span>
            </button>
          </div>
        </section>

        {/* Footer info brand watermarked */}
        <footer className="py-6 bg-black text-center mt-auto border-t border-white/[0.04]">
          <span className="text-[9px] font-mono tracking-widest text-zinc-600 font-extrabold uppercase">
            Powered by ThreadZW
          </span>
        </footer>

        {/* ==================== PRODUCT FEATURE DETAILS BOTTOM DRAWER ==================== */}
        <AnimatePresence>
          {selectedProduct && (
            <>
              {/* Backdrop dimming overlay */}
              <div 
                className="fixed inset-y-0 inset-x-0 max-w-[430px] mx-auto bg-black/80 z-[200] transition-opacity"
                onClick={() => setSelectedProduct(null)}
              />

              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#0c0c0e] text-white rounded-t-[20px] z-[210] flex flex-col overflow-y-auto max-h-[92vh] shadow-2xl border-t border-white/5"
              >
                {/* Header */}
                <div className="sticky top-0 bg-[#0c0c0e] border-b border-white/5 px-4 py-3.5 flex items-center justify-between z-10" ref={detailHeaderRef}>
                  <button 
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedSize('');
                      setSelectedColor('');
                    }}
                    className="w-[38px] h-[38px] rounded-[10px] bg-zinc-900 border border-white/5 text-white flex items-center justify-center"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  
                  <span className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase">Product details</span>

                  <button 
                    onClick={() => {
                      const link = `${window.location.origin}/shop/${shop.slug}/product/${selectedProduct.id}`;
                      navigator.clipboard.writeText(link);
                      triggerLocalToast("Product page link copied");
                    }}
                    className="w-[38px] h-[38px] rounded-[10px] bg-zinc-900 border border-white/5 text-white flex items-center justify-center"
                  >
                    <Share2 size={18} />
                  </button>
                </div>

                {/* Sub Image Slider Gallery */}
                <div className="relative bg-zinc-950 shrink-0">
                  <div 
                    ref={galleryRef}
                    className="w-full aspect-square overflow-x-auto flex scroll-snap-x scroll-snap-mandatory scrollbar-none"
                    onScroll={() => {
                      if (galleryRef.current) {
                        const width = galleryRef.current.clientWidth;
                        const scrollLeft = galleryRef.current.scrollLeft;
                        const page = Math.round(scrollLeft / width);
                        if (page !== activeImageIdx) setActiveImageIdx(page);
                      }
                    }}
                  >
                    {selectedProduct.images.length > 0 ? (
                      selectedProduct.images.map((img: string, i: number) => (
                        <div key={i} className="w-full aspect-square shrink-0 scroll-snap-align-start flex items-center justify-center">
                          <img src={img} alt={`${selectedProduct.name} main-${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))
                    ) : (
                      <div className="w-full aspect-square bg-zinc-900 flex items-center justify-center">
                        <ImageIcon size={44} className="text-zinc-700" />
                      </div>
                    )}
                  </div>

                  {/* Dot sliders indicator */}
                  {selectedProduct.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                      {selectedProduct.images.map((_: any, i: number) => {
                        const isCurrent = activeImageIdx === i;
                        return (
                          <div 
                            key={i} 
                            style={{ 
                              width: isCurrent ? '18px' : '6px',
                              backgroundColor: isCurrent ? logoAccent : '#52525b'
                            }}
                            className="h-[6px] rounded-full transition-all duration-300"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Small thumbnail strip below slider indicators */}
                {selectedProduct.images.length > 1 && (
                  <div className="px-4 py-3 bg-[#0c0c0e] flex gap-2 overflow-x-auto border-b border-white/5">
                    {selectedProduct.images.map((img: string, i: number) => {
                      const isActive = activeImageIdx === i;
                      return (
                        <img 
                          key={i}
                          src={img}
                          alt="thumbnail navigation"
                          onClick={() => {
                            setActiveImageIdx(i);
                            if (galleryRef.current) {
                              const width = galleryRef.current.clientWidth;
                              galleryRef.current.scrollTo({ left: width * i, behavior: 'smooth' });
                            }
                          }}
                          className={`w-14 h-14 rounded-[8px] object-cover border-2 cursor-pointer shrink-0 transition-colors ${
                            isActive ? 'border-white' : 'border-transparent'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Main Product info contents area */}
                <div className="p-4 flex-1 pb-32 bg-[#0c0c0e]">
                  
                  {/* Name and pricing metrics */}
                  <div className="mb-4">
                    <h3 className="text-[22px] font-[900] text-white leading-tight tracking-tight">
                      {selectedProduct.name}
                    </h3>
                    <div className="text-[26px] font-black mt-2" style={{ color: logoAccent }}>
                      ${selectedProduct.price}
                    </div>
                  </div>

                  <hr className="border-white/5 my-5" />

                  {/* COLOR SELECTION CONTROLS */}
                  {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-[10px] font-black tracking-[1.5px] text-zinc-500 uppercase mb-3">
                        COLOUR
                      </h4>
                      <div className="flex items-center gap-3 flex-wrap">
                        {selectedProduct.colors.map((c: string) => {
                          const isSelectedColor = selectedColor.trim().toLowerCase() === c.trim().toLowerCase();
                          const hex = getColorHex(c);

                          return (
                            <button 
                              key={c}
                              onClick={() => setSelectedColor(c)}
                              style={{ backgroundColor: hex }}
                              className={`w-8 h-8 rounded-full border border-black/40 cursor-pointer relative transition-all ${
                                isSelectedColor ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg' : ''
                              }`}
                              title={c}
                            >
                              {/* White color fallback dot helper for visibility selection state */}
                              {isSelectedColor && (
                                <span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white border border-black/20" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      
                      {selectedColor && (
                        <div className="text-[10px] font-black text-white uppercase mt-2">
                          Selected: {selectedColor}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SIZE SELECTION CONTROLS */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-[10px] font-black tracking-[1.5px] text-zinc-500 uppercase mb-3">
                        SIZE
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedProduct.sizes.map((sz: string) => {
                          const isSelectedSize = selectedSize === sz;
                          
                          return (
                            <button 
                              key={sz}
                              onClick={() => setSelectedSize(sz)}
                              style={{ 
                                backgroundColor: isSelectedSize ? logoAccent : '#1a1a1e',
                                color: isSelectedSize ? 'white' : '#d4d4d8',
                                borderColor: isSelectedSize ? logoAccent : 'transparent'
                              }}
                              className={`h-11 min-w-[52px] px-3.5 rounded-[8px] text-[13.5px] font-black uppercase transition-all border cursor-pointer hover:border-zinc-700 active:scale-95`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* DESCRIPTION CONTROL */}
                  {selectedProduct.description && (
                    <div className="mb-8">
                      <h4 className="text-[10px] font-black tracking-[1.5px] text-zinc-500 uppercase mb-3">
                        DESCRIPTION
                      </h4>
                      <p className="text-[13.5px] text-zinc-400 leading-[1.6] whitespace-pre-line font-medium">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* STICKY DETAIL BOTTOM ACTIONS */}
                <div className="sticky bottom-0 left-0 right-0 bg-[#0c0c0e] border-t border-white/5 p-4 flex gap-2.5 z-20">
                  <button 
                    onClick={handleOrderOnWhatsApp}
                    className="flex-1 bg-[#25D366] text-white py-4 px-3 rounded-[12px] font-black text-[14px] flex items-center justify-center gap-2 transition-transform duration-150 active:scale-95 shadow-lg cursor-pointer"
                  >
                    <WhatsAppIcon size={18} />
                    <span>Order on WhatsApp</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedProduct(null);
                      setShowVisitPopup(true);
                    }}
                    className="w-[110px] bg-zinc-900 text-white border border-white/5 py-4 rounded-[12px] font-black text-[13.5px] flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer hover:bg-zinc-850"
                  >
                    <MapPin size={14} style={{ color: logoAccent }} />
                    <span>Visit Shop</span>
                  </button>
                </div>

              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ==================== VISIT SHOP / CONTACT DETAILS DRAWER popup ==================== */}
        <AnimatePresence>
          {showVisitPopup && (
            <>
              {/* Dimmed Backdrop */}
              <div 
                className="fixed inset-y-0 inset-x-0 max-w-[430px] mx-auto bg-black/80 z-[250] transition-opacity"
                onClick={() => setShowVisitPopup(false)}
              />

              {/* Visit shop bottom sheet drawer */}
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#0c0c0e] text-white rounded-t-[20px] z-[260] px-5 pt-6 pb-10 flex flex-col shadow-2xl border-t border-white/5"
              >
                {/* Action Handle */}
                <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-5" />

                {/* Shop logo profile row */}
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {shop.logo_url || shop.avatar_url ? (
                      <img src={shop.logo_url || shop.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-black text-xs uppercase">{shop.name.slice(0, 2)}</span>
                    )}
                  </div>
                  <h3 className="text-[17px] font-black text-white">
                    {shop.name}
                  </h3>
                </div>

                {/* Contact Information directories list */}
                <div className="flex flex-col mb-6">
                  {/* Location Row */}
                  <div className="flex items-center gap-3.5 py-4 border-b border-white/5">
                    <MapPin size={18} className="text-zinc-500 shrink-0" />
                    <span className="text-[14px] text-zinc-300 font-bold block truncate">
                      {shop.location || "Bulawayo, Zimbabwe"}
                    </span>
                  </div>

                  {/* Operational Window */}
                  <div className="flex items-center gap-3.5 py-4 border-b border-white/5">
                    <Clock size={18} className="text-zinc-500 shrink-0" />
                    <span className="text-[14px] text-zinc-300 font-bold block truncate">
                      {openScheduleText}
                    </span>
                  </div>

                  {/* Delivery conditions mapping info */}
                  <div className="flex items-center gap-3.5 py-4 border-b border-white/5">
                    <Package size={18} className="text-zinc-500 shrink-0" />
                    <span className="text-[14px] text-zinc-300 font-semibold block">
                      Harare & Bulawayo pickup or prompt door delivery options.
                    </span>
                  </div>
                </div>

                {/* Redirection mapper trigger buttons */}
                <button 
                  onClick={() => window.open(mapDirectionsUrl, '_blank')}
                  className="w-full bg-[#25D366] text-white font-black rounded-[12px] text-[14.5px] py-4 flex items-center justify-center gap-2 transition-transform duration-150 active:scale-95 cursor-pointer hover:brightness-105 shadow-md"
                >
                  <Map size={18} />
                  <span>Get Directions</span>
                </button>

                <button 
                  onClick={() => setShowVisitPopup(false)}
                  className="w-full text-center text-zinc-500 hover:text-white font-black text-[11px] uppercase mt-4 py-2 cursor-pointer tracking-widest transition-colors block"
                >
                  Close
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ==================== DEMAND DISCOVERY DRAWER ==================== */}
        <AnimatePresence>
          {showDemandDrawer && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-y-0 inset-x-0 max-w-[430px] mx-auto bg-black/85 z-[280]"
                onClick={() => setShowDemandDrawer(false)}
              />

              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#0c0c0e] text-white rounded-t-[20px] z-[290] p-6 flex flex-col shadow-3xl border-t border-white/5"
              >
                <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-5" />

                <h3 className="text-[16px] font-[900] text-white uppercase tracking-tight mb-4">
                  What are you looking for?
                </h3>

                <form onSubmit={handleDemandSubmit} className="space-y-4">
                  
                  {/* Photo picker zone frame */}
                  <div>
                    <label className="block text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-2">
                      UPLOAD PHOTO
                    </label>

                    <div 
                      onClick={() => document.getElementById('demand_image_picker_field')?.click()}
                      className="border-2 border-dashed border-zinc-800 rounded-[14px] py-8 text-center bg-zinc-950 cursor-pointer overflow-hidden max-h-[160px] flex flex-col items-center justify-center relative hover:bg-zinc-900 transition-colors"
                    >
                      {demandImageUrl ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                          <img src={demandImageUrl} alt="user uploaded query item" className="w-full h-full object-contain" />
                          <div className="absolute bottom-2 right-2 bg-black/75 rounded px-2.5 py-1 text-[9px] text-white uppercase font-black tracking-widest">
                            Change Photo
                          </div>
                        </div>
                      ) : (
                        <>
                          <ImageIcon size={28} className="text-zinc-600 mx-auto" />
                          <span className="text-[12px] font-bold text-zinc-500 mt-2 block">
                            Upload picture of item you want
                          </span>
                        </>
                      )}
                    </div>

                    <input 
                      id="demand_image_picker_field"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDemandFileChange}
                    />
                  </div>

                  {/* Descriptive text query wrapper */}
                  <div>
                    <label className="block text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-2">
                      DESCRIPTION
                    </label>
                    <textarea 
                      placeholder="Describe what you want..."
                      rows={3}
                      value={demandDesc}
                      onChange={(e) => setDemandDesc(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-[10px] p-3.5 text-[13.5px] text-white focus:outline-none focus:border-zinc-500 font-semibold placeholder-zinc-700"
                      required
                    />
                  </div>

                  {/* Contact WhatsApp input */}
                  <div>
                    <label className="block text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-2">
                      YOUR WHATSAPP NUMBER
                    </label>
                    <input 
                      type="tel"
                      placeholder="+263 your number"
                      value={customerWhatsApp}
                      onChange={(e) => setCustomerWhatsApp(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-[10px] p-3.5 text-[13.5px] text-white focus:outline-none focus:border-zinc-500 font-semibold placeholder-zinc-700"
                    />
                    <span className="text-[10px] font-bold text-zinc-500 block mt-1.5">
                      So the shop can contact you directly.
                    </span>
                  </div>

                  {/* Submit element */}
                  <div className="pt-2 flex gap-2.5">
                    <button 
                      type="button"
                      onClick={() => setShowDemandDrawer(false)}
                      className="flex-1 bg-zinc-900 text-white py-4 rounded-[12px] text-[13.5px] font-black active:scale-95 cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button 
                      type="submit"
                      disabled={isUploadingDemand}
                      className="flex-1 bg-white text-black py-4 rounded-[12px] text-[13.5px] font-[900] cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isUploadingDemand ? 'Processing...' : 'Send Request'}
                    </button>
                  </div>

                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );

  // Quick helper to locate first active index
  function idxOfProduct(id: string) {
    return activeGridProducts.findIndex(p => p.id === id);
  }
};
