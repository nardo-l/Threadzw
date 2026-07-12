// src/pages/ShopDirectoryPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useInventory } from '../context/InventoryContext';
import { 
  Store, 
  Search as SearchIcon, 
  SlidersHorizontal,
  MapPin, 
  ShoppingBag, 
  Users, 
  Star, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Wifi,
  Battery,
  Layers,
  ShoppingBag as BagIcon,
  Tag,
  Share2,
  Bookmark,
  ChevronRight,
  Plus
} from 'lucide-react';

interface ShopRecord {
  id: string;
  name: string;
  handle: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  location: string | null;
  is_live: boolean;
  is_verified: boolean;
  categories: string[] | null;
  follower_count: number;
  product_count: number;
  created_at: string;
}

// Curated high-fashion curated Unsplash cover images based on shop categories to look premium
const FASHION_BANNERS = [
  'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=800&q=80', // Streetwear jacket
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80', // Vintage apparel
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80', // Premium studio
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80', // High-end boutique
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80', // Editorial model
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80'  // Minimal pose
];

// Helper to get a stable banner image based on shop ID string hashing
const getStableShopImages = (shopId: string, customLogo: string | null, customBanner: string | null, index: number) => {
  // Generate a hash code from the ID
  let sum = 0;
  for (let i = 0; i < shopId.length; i++) {
    sum += shopId.charCodeAt(i);
  }
  
  const bannerIndex = sum % FASHION_BANNERS.length;
  const bannerUrl = customBanner || FASHION_BANNERS[bannerIndex];

  // If no custom logo, we create a gorgeous brand typographic style
  const colors = [
    { bg: 'bg-[#bef715]', text: 'text-black', brand: 'border-white/10' },
    { bg: 'bg-zinc-900', text: 'text-[#bef715]', brand: 'border-[#bef715]/40' },
    { bg: 'bg-white', text: 'text-black', brand: 'border-zinc-805' },
    { bg: 'bg-[#1a1a1a]', text: 'text-white', brand: 'border-white/20' }
  ];
  
  const colorSet = colors[sum % colors.length];

  return {
    banner: bannerUrl,
    colorSet
  };
};

export const ShopDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<ShopRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Categories list
  const categoriesList = [
    'All',
    'Streetwear',
    'Thrift',
    'Luxury',
    'Sportswear',
    'Vintage',
    'Accessories'
  ];

  const fetchShops = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[ShopDirectory] Querying published stores from Supabase...');
      const { data, error: queryError } = await supabase
        .from('shops')
        .select(`
          id,
          name,
          handle,
          slug,
          description,
          logo_url,
          banner_url,
          location,
          is_live,
          is_verified,
          categories,
          follower_count,
          product_count,
          created_at
        `)
        .eq('is_live', true)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      const rawShops = data || [];
      setShops(rawShops);
    } catch (err: any) {
      console.error('[ShopDirectory] Failed loading directory stores:', err);
      setError(err?.message || 'Failed to retrieve directory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // Filter based on both Search Query & Category Pills
  const filteredShops = shops.filter(shop => {
    // 1. Search Query filter
    const matchesQuery = !searchQuery.trim() || 
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.handle || '').toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Category Pill filter
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      const shopCats = shop.categories || [];
      const tagLower = selectedCategory.toLowerCase();
      
      // Match if category array includes selected category
      const hasDirectTag = shopCats.some(c => c.toLowerCase() === tagLower);
      
      // Secondary fallback matches in description or name
      const hasDescriptionMatch = (shop.description || '').toLowerCase().includes(tagLower);
      const hasNameMatch = shop.name.toLowerCase().includes(tagLower);

      matchesCategory = hasDirectTag || hasDescriptionMatch || hasNameMatch;
    }

    return matchesQuery && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex justify-center items-start selection:bg-black selection:text-[#bef715] antialiased font-sans">
      
      {/* Immersive Phone Outer Frame Wrapper on Desktop Viewports */}
      <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col justify-between relative shadow-2xl border-x border-zinc-200 overflow-hidden">
        
        {/* iOS Top Notch & Ambient Status Bar */}
        <div className="w-full h-11 bg-zinc-50 border-b border-zinc-200/50 flex items-center justify-between px-6 select-none z-50">
          <span className="text-xs font-bold tracking-tight text-zinc-855 select-none">9:41</span>
          
          {/* Simulated iOS Dynamic Notch Sensor */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[110px] h-[24px] bg-black border border-zinc-800 rounded-full hidden xs:block z-50" />
          
          <div className="flex items-center gap-1.5 text-zinc-800">
            <Wifi size={13} className="stroke-2 text-zinc-800" />
            <span className="text-[10px] font-black tracking-tighter">5G</span>
            <Battery size={20} className="text-zinc-800" />
          </div>
        </div>

        {/* Sticky Header */}
        <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 py-3.5 px-5 flex items-center justify-between z-40 float-none">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1 cursor-pointer select-none active:opacity-80 transition-opacity"
          >
            <span className="text-[19px] font-black tracking-tighter text-zinc-905 font-sans">
              THREAD<span style={{ color: '#000000', fontFamily: 'var(--font-sans)', fontWeight: 900 }}>ZW</span>
            </span>
          </div>

          {/* Clean whitespace + Action icons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchShops()} 
              className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 active:scale-90 transition-transform"
              title="Refresh Directory"
            >
              <Sparkles size={16} className="text-[#a1df00] fill-current" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              style={{ color: '#000000', fontFamily: 'var(--font-sans)', borderColor: 'rgba(0, 0, 0, 0.15)' }}
              className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest bg-zinc-100 hover:bg-zinc-200 border rounded-md active:scale-95 transition-all text-black"
            >
              Seller hub
            </button>
          </div>
        </header>

        {/* Main Public Directory Body */}
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-20 space-y-7 bg-white">
          
          {/* Hero Section */}
          <section className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 py-1 px-3 rounded-full text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
              <span>🇿🇼 ZIMBABWE FASHION DIRECTORY</span>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-3xl font-black tracking-tight leading-none text-zinc-900">
                Discover Zimbabwe's Best Fashion Brands
              </h1>
              <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                Browse clothing brands, thrift stores and streetwear labels all in one place.
              </p>
            </div>
          </section>

          {/* Search Bar Block */}
          <section className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <SearchIcon className="text-zinc-400" size={16} />
            </div>
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-full text-xs text-zinc-900 placeholder-zinc-400 font-medium focus:outline-none focus:border-zinc-400 transition-all text-ellipsis"
            />
          </section>

          {/* Category Pills (Horizontal scrolling) */}
          <section className="relative">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5">
              {categoriesList.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-extrabold tracking-wide transition-all ${
                      isActive 
                        ? 'bg-zinc-950 text-[#bef715] shadow-sm font-black' 
                        : 'bg-zinc-100 border border-zinc-200/60 text-zinc-700 hover:bg-zinc-200/50'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Shops Grid */}
          <div className="space-y-8 pt-2">
            {loading ? (
              /* Loading Immersive State */
              <div className="py-24 flex flex-col items-center justify-center space-y-3 bg-white">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-zinc-200 rounded-full" />
                  <div className="absolute inset-0 border-2 border-t-zinc-900 rounded-full animate-spin" />
                </div>
                <p className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase">
                  Loading Local Creator Directory...
                </p>
              </div>
            ) : error ? (
              /* Error State */
              <div className="py-12 px-5 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4">
                <p className="text-xs text-red-600 font-semibold">{error}</p>
                <button
                  onClick={fetchShops}
                  className="px-4 py-2 bg-zinc-900 text-white text-xs font-black rounded-full"
                >
                  Retry Load
                </button>
              </div>
            ) : filteredShops.length === 0 ? (
              /* EMPTY STATE: Only display if directory returns zero records */
              <div className="py-12 text-center space-y-5 px-4 bg-white">
                {/* SVG Fashion Illustration Icon directly inline for aesthetic vibe */}
                <div className="w-24 h-24 mx-auto rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400">
                  <Store size={40} className="stroke-[1.5]" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight">No Stores Yet</h3>
                  <p className="text-xs text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                    Be the first brand to launch on ThreadZW. Create your store instantly and load clothes.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-3 bg-zinc-950 text-[#bef715] hover:text-white text-xs font-extrabold rounded-full hover:bg-black transition-all active:scale-95 inline-flex items-center gap-1.5"
                >
                  Create Store
                  <Plus size={14} className="stroke-[3]" />
                </button>
              </div>
            ) : (
              /* Stores Found */
              <div className="space-y-10">
                {filteredShops.map((shop, i) => {
                  const { banner, colorSet } = getStableShopImages(shop.id, shop.logo_url, shop.banner_url, i);
                  const displayCategory = shop.categories && shop.categories.length > 0 
                    ? shop.categories[0] 
                    : (shop.description || '').toLowerCase().includes('thrift') ? 'Thrift' : 'Streetwear';

                   return (
                    <div 
                      key={shop.id}
                      onClick={() => navigate(`/shop/${shop.slug || shop.id}`)}
                      className="group block space-y-4 cursor-pointer active:scale-[0.99] transition-all duration-300"
                    >
                      {/* Cover Image Banner (16:9 Aspect Ratio) */}
                      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
                        <img 
                          src={banner} 
                          alt={`${shop.name} Fashion Banner`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                        />
                        
                        {/* Overlay Gradient Edge */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>

                      {/* Header Stack: Overlapping Circular Logo */}
                      <div className="relative px-2.5 bg-white">
                        
                        {/* Logo and title container */}
                        <div className="flex items-start gap-4 -mt-10 relative z-10">
                          {/* Circular Logo overlapping banner */}
                          <div className="w-16 h-16 rounded-full border-[3px] border-white bg-white flex-shrink-0 overflow-hidden flex items-center justify-center shadow-md">
                            {shop.logo_url ? (
                              <img 
                                src={shop.logo_url} 
                                alt={`${shop.name} Avatar`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center font-black text-xs tracking-wider uppercase ${colorSet.bg} ${colorSet.text}`}>
                                {shop.name.slice(0, 3)}
                              </div>
                            )}
                          </div>

                          {/* Shop Text Info container */}
                          <div className="pt-8 min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h2 className="text-md font-extrabold tracking-tight text-zinc-900 group-hover:text-black transition-colors truncate">
                                {shop.name}
                              </h2>
                              {shop.is_verified && (
                                <CheckCircle2 size={13} className="text-[#659900] fill-current stroke-[3]" />
                              )}
                            </div>

                            {/* Location & Category Header badges */}
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                              <span className="flex items-center gap-0.5 text-zinc-500">
                                <MapPin size={10} className="text-zinc-400" />
                                {shop.location || 'Harare'}
                              </span>
                              <span>•</span>
                              <span className="bg-zinc-100 border border-zinc-200/60 uppercase tracking-wider text-[8px] text-zinc-500 px-1.5 py-0.5 rounded">
                                {displayCategory}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="mt-3.5 text-xs text-zinc-650 leading-relaxed font-medium line-clamp-2">
                          {shop.description || 'Premium independent fashion brand specializing in luxury garments and curated streetwear.'}
                        </p>

                        {/* Stats Row inside elegant white cards */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="bg-zinc-50/80 border border-zinc-100 p-2.5 rounded-xl text-center">
                            <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Products</span>
                            <span className="font-mono text-xs font-black text-zinc-800">{shop.product_count || 0}</span>
                          </div>
                          <div className="bg-zinc-50/80 border border-zinc-100 p-2.5 rounded-xl text-center">
                            <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Followers</span>
                            <span className="font-mono text-xs font-black text-zinc-800">{shop.follower_count || 0}</span>
                          </div>
                        </div>

                        {/* Full Width CTA Button */}
                        <button className="w-full mt-4 bg-zinc-950 hover:bg-black text-[#bef715] py-3.5 px-6 rounded-full text-xs font-black tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                          <span>Visit Store</span>
                          <ArrowRight size={13} className="stroke-[3] group-hover:translate-x-1 transition-transform" />
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Global Simulated Tab Navigation bar to look exactly like a native phone app */}
        <div className="absolute bottom-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 flex items-center justify-around px-4 z-40 select-none">
          <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center gap-0.5 text-zinc-400 hover:text-zinc-900 transition-colors">
            <Layers size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-0.5 text-zinc-950 hover:text-black font-extrabold font-sans">
            <BagIcon size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Shops</span>
          </button>
          
          {/* Accent Create Button Circle */}
          <button 
            onClick={() => navigate('/signup')} 
            className="w-10 h-10 rounded-full bg-zinc-950 text-[#bef715] -translate-y-3 shadow-lg flex items-center justify-center hover:bg-black hover:text-[#bef715] active:scale-95 transition-all outline-none"
          >
            <Plus size={18} className="stroke-[3]" />
          </button>

          <button onClick={() => navigate('/login')} className="flex flex-col items-center justify-center gap-0.5 text-zinc-400 hover:text-zinc-900 transition-colors">
             <Bookmark size={16} />
             <span className="text-[8px] font-bold uppercase tracking-wider">Saved</span>
          </button>
          <button onClick={() => navigate('/login')} className="flex flex-col items-center justify-center gap-0.5 text-zinc-400 hover:text-zinc-900 transition-colors">
            <Users size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Profile</span>
          </button>
        </div>

        {/* iPhone Simulated Home Bar indicator line */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-300 rounded-full z-50 pointer-events-none select-none hidden xs:block" />

      </div>

    </div>
  );
};
