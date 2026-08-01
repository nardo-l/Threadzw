// src/pages/ShopDirectoryPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { trackMapOpen } from '../lib/analytics';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Store, 
  MapPin, 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  Check, 
  X, 
  Filter, 
  RefreshCw
} from 'lucide-react';

interface ShopRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  location: string;
  category: string;
  categories: string[];
  product_count: number;
  rating: number;
  reviews_count: number;
  is_verified: boolean;
  follower_count?: number;
  created_at: string;
}

// Curated high-fashion cover images from Unsplash when shop has no custom banner
const FASHION_BANNERS = [
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=800&q=80'
];

const DEFAULT_CATEGORIES = [
  'Streetwear',
  'Thrift',
  'Sneakers',
  "Women's Fashion",
  'Accessories',
  'Formal Wear',
  'Bags & Backpacks',
  'Hats & Caps'
];

const DEFAULT_CITIES = [
  'Harare',
  'Bulawayo',
  'Mutare',
  'Gweru',
  'Chitungwiza',
  'Masvingo',
  'Kwekwe'
];

export const ShopDirectoryPage: React.FC = () => {
  const navigate = useNavigate();

  // DB and example shops states
  const [dbShops, setDbShops] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Failed logo tracking map for graceful fallback
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});

  // Live Statistics state calculated directly from Supabase
  const [liveStats, setLiveStats] = useState({
    shopsCount: 0,
    productsCount: 0,
    citiesCount: 0
  });

  // Per-shop product counts mapping
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedCats, setSelectedCats] = useState<string[]>(['All']);
  const [selectedCities, setSelectedCities] = useState<string[]>(['All']);
  const [sortBy, setSortBy] = useState<string>('Popular');

  // Debounce search query input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sidebar expand/collapse triggers
  const [showAllCats, setShowAllCats] = useState<boolean>(false);
  const [showAllCities, setShowAllCities] = useState<boolean>(false);

  // Mobile menu control
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // SEO updates
  useEffect(() => {
    document.title = "Shops on ThreadZW | Zimbabwe Fashion Stores";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Browse clothing brands, sneaker stores, thrift shops and streetwear businesses from across Zimbabwe.");
    }
  }, []);

  // Fetch real shops and live statistics from Supabase using explicit column selection
  const fetchLiveShopsAndStats = async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      // 1. Fetch real shops with ONLY required columns (No select('*'))
      const { data: shopsData, error: shopsErr } = await supabase
        .from('shops')
        .select('id, name, slug, description, logo_url, banner_url, location, address, category, categories, is_active, created_at')
        .order('created_at', { ascending: false });

      if (shopsErr) {
        throw shopsErr;
      }

      const rawShops = shopsData || [];

      // 2. Fetch product-shop relations in a single lightweight query to count products per shop
      const { data: productsData, error: productsErr } = await supabase
        .from('products')
        .select('id, shop_id');

      if (productsErr) {
        // Non-fatal warning handled gracefully
      }

      const rawProducts = productsData || [];
      const countsMap: Record<string, number> = {};
      rawProducts.forEach((p: any) => {
        if (p.shop_id) {
          countsMap[p.shop_id] = (countsMap[p.shop_id] || 0) + 1;
        }
      });
      setProductCounts(countsMap);

      // 3. Compute distinct cities from live shop locations efficiently
      const distinctCities = new Set<string>();
      rawShops.forEach((s: any) => {
        const cityStr = (s.location || s.address || '').trim();
        if (cityStr) {
          distinctCities.add(cityStr);
        }
      });

      // 4. Update live statistics
      setLiveStats({
        shopsCount: rawShops.length,
        productsCount: rawProducts.length,
        citiesCount: Math.max(distinctCities.size, rawShops.length > 0 ? 1 : 0)
      });

      setDbShops(rawShops);
    } catch (err: any) {
      console.error('Supabase fetch error:', err);
      setDbError(err?.message || 'Failed to retrieve active shops.');
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveShopsAndStats();
  }, []);

  // Consolidate live records into ShopRecord schema
  const allShops = useMemo(() => {
    return dbShops.map((s, idx) => {
      const categoryStr = s.category || (Array.isArray(s.categories) && s.categories[0]) || 'Streetwear';
      const cityStr = (s.location || s.address || 'Harare').trim() || 'Harare';
      const countFromProducts = productCounts[s.id] !== undefined 
        ? productCounts[s.id] 
        : 0;

      return {
        id: s.id,
        name: s.name || 'Unnamed Shop',
        slug: s.slug || s.id,
        description: s.description || 'Active ThreadZW storefront brand.',
        logo_url: s.logo_url || null,
        banner_url: s.banner_url || FASHION_BANNERS[idx % FASHION_BANNERS.length],
        location: cityStr,
        category: categoryStr,
        categories: Array.isArray(s.categories) && s.categories.length > 0 ? s.categories : [categoryStr],
        product_count: countFromProducts,
        rating: 5.0,
        reviews_count: countFromProducts > 0 ? Math.min(countFromProducts * 2 + 3, 20) : 0,
        is_verified: s.is_active !== false,
        created_at: s.created_at || new Date().toISOString()
      };
    });
  }, [dbShops, productCounts]);

  // Dynamically augment filter categories and cities from database records
  const sidebarCategories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    allShops.forEach(s => {
      if (s.category) set.add(s.category);
      if (s.categories) s.categories.forEach(c => set.add(c));
    });
    return Array.from(set);
  }, [allShops]);

  const sidebarCities = useMemo(() => {
    const set = new Set(DEFAULT_CITIES);
    allShops.forEach(s => {
      if (s.location) set.add(s.location);
    });
    return Array.from(set);
  }, [allShops]);

  // Filtering Logic against debounced query
  const filteredShops = useMemo(() => {
    return allShops.filter(shop => {
      // 1. Search Query against Shop name, Description, Category, City (location), Slug
      const query = debouncedSearchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        shop.name.toLowerCase().includes(query) ||
        shop.description.toLowerCase().includes(query) ||
        shop.location.toLowerCase().includes(query) ||
        shop.category.toLowerCase().includes(query) ||
        shop.slug.toLowerCase().includes(query);

      // 2. Category Filter
      const matchesCategory = selectedCats.includes('All') || 
        selectedCats.some(c => {
          const catLower = c.toLowerCase();
          return shop.category.toLowerCase() === catLower || 
                 shop.categories.some(tag => tag.toLowerCase() === catLower);
        });

      // 3. City Filter
      const matchesCity = selectedCities.includes('All') || 
        selectedCities.some(city => shop.location.toLowerCase() === city.toLowerCase());

      return matchesSearch && matchesCategory && matchesCity;
    });
  }, [allShops, debouncedSearchQuery, selectedCats, selectedCities]);

  // Sorting Logic
  const sortedAndFilteredShops = useMemo(() => {
    const list = [...filteredShops];
    if (sortBy === 'Popular') {
      list.sort((a, b) => b.product_count - a.product_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'Newest') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'Most Products') {
      list.sort((a, b) => b.product_count - a.product_count);
    } else if (sortBy === 'Alphabetical') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'Highest Rated') {
      list.sort((a, b) => b.rating - a.rating || b.product_count - a.product_count);
    }
    return list;
  }, [filteredShops, sortBy]);

  // Pagination bounds
  const totalPages = Math.ceil(sortedAndFilteredShops.length / itemsPerPage);
  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredShops.slice(start, start + itemsPerPage);
  }, [sortedAndFilteredShops, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedCats, selectedCities, sortBy]);

  // Filter toggle helpers
  const handleCategoryToggle = (cat: string) => {
    if (cat === 'All') {
      setSelectedCats(['All']);
    } else {
      let next = selectedCats.filter(c => c !== 'All');
      if (next.includes(cat)) {
        next = next.filter(c => c !== cat);
      } else {
        next.push(cat);
      }
      if (next.length === 0) {
        setSelectedCats(['All']);
      } else {
        setSelectedCats(next);
      }
    }
  };

  const handleCityToggle = (city: string) => {
    if (city === 'All') {
      setSelectedCities(['All']);
    } else {
      let next = selectedCities.filter(c => c !== 'All');
      if (next.includes(city)) {
        next = next.filter(c => c !== city);
      } else {
        next.push(city);
      }
      if (next.length === 0) {
        setSelectedCities(['All']);
      } else {
        setSelectedCities(next);
      }
    }
  };

  // Routing navigation helper with slug/id validation
  const handleVisitShop = (shop: ShopRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const validTarget = shop.slug?.trim() || shop.id?.trim();
    if (validTarget) {
      if (shop.id) {
        trackMapOpen(shop.id).catch(() => {});
      }
      navigate(`/shop/${validTarget}`);
    }
  };

  // Custom Checkbox sub-component
  const CustomCheckbox: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
    <div 
      onClick={onChange}
      className="flex items-center gap-3 cursor-pointer select-none group text-sm text-zinc-700 hover:text-black py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded"
      tabIndex={0}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
    >
      <div 
        className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${
          checked 
            ? 'bg-black border-black text-[#BEF715]' 
            : 'border-zinc-300 bg-white group-hover:border-zinc-400'
        }`}
      >
        {checked && <Check size={13} className="stroke-[3]" />}
      </div>
      <span className={`transition-colors text-xs font-semibold ${checked ? 'text-black' : 'text-zinc-600 group-hover:text-black'}`}>
        {label}
      </span>
    </div>
  );

  // Logo Typography fallback styling
  const getLogoFallbackStyle = (name: string) => {
    const colors = [
      'bg-zinc-900 text-[#bef715]',
      'bg-[#bef715] text-black',
      'bg-zinc-100 text-black border border-zinc-200',
      'bg-zinc-950 text-white'
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return `font-sans font-black text-xs uppercase ${colors[sum % colors.length]}`;
  };

  // Nav actions
  const handleNavClick = (target: string) => {
    if (target === 'shops') {
      setSearchQuery('');
      setSelectedCats(['All']);
      setSelectedCities(['All']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'categories') {
      const el = document.getElementById('marketplace-body');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'new') {
      setSortBy('Newest');
      const el = document.getElementById('marketplace-body');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'about') {
      const el = document.getElementById('bottom-cta');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-zinc-900 flex flex-col font-sans select-none overflow-x-hidden selection:bg-[#BEF715] selection:text-black antialiased">
      
      {/* 1. STICKY BLACK HEADER */}
      <header className="sticky top-0 z-50 w-full h-18 bg-[#000000] text-white flex items-center border-b border-zinc-900 shadow-md">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 cursor-pointer select-none active:opacity-90 hover:opacity-95 transition-opacity"
            role="button"
            aria-label="ThreadZW Home"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/'); }}
          >
            <span className="text-xl font-black tracking-tighter uppercase font-sans">
              THREAD<span className="text-[#BEF715]">ZW</span>
            </span>
          </div>

          {/* Search bar inside header */}
          <div className="hidden md:flex items-center relative w-80 lg:w-[400px] h-10 bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 text-xs font-medium text-white transition-all focus-within:border-[#BEF715]/40">
            <input 
              type="text" 
              placeholder="Search shops, products or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search stores, products or locations"
              className="w-full bg-transparent border-none text-white placeholder-zinc-500 focus:outline-none focus:ring-0 text-xs py-2 pr-8"
            />
            <Search size={15} className="absolute right-4 text-zinc-500 pointer-events-none" />
          </div>

          {/* Nav Items */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <button 
              onClick={() => handleNavClick('shops')} 
              className={`hover:text-white transition-colors cursor-pointer ${searchQuery === '' && selectedCats.includes('All') && selectedCities.includes('All') ? 'text-[#BEF715]' : ''}`}
            >
              Shops
            </button>
            <button 
              onClick={() => handleNavClick('categories')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Categories
            </button>
            <button 
              onClick={() => handleNavClick('new')} 
              className={`hover:text-white transition-colors cursor-pointer ${sortBy === 'Newest' ? 'text-[#BEF715]' : ''}`}
            >
              New Arrivals
            </button>
            <button 
              onClick={() => handleNavClick('about')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-4 text-zinc-400">
            <button 
              onClick={() => navigate('/login')}
              className="p-2 hover:text-white transition-colors cursor-pointer relative"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={18} className="stroke-[2.5]" />
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="p-1 px-3 py-1.5 rounded-md border border-zinc-800 text-xs font-bold text-white uppercase tracking-wider hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer"
              aria-label="Login"
            >
              LOGIN
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO AREA WITH ZIMBABWE VECTOR MAP OUTLINE */}
      <section className="relative w-full bg-[#FFFFFF] border-b border-[#ECECEC] py-12 md:py-16 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Detail */}
          <div className="md:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 border border-[#ECECEC] rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <Sparkles size={11} className="text-[#BEF715] fill-current" />
              <span>THE DIRECTORY</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-[1.05] uppercase">
                Shops on ThreadZW
              </h1>
              <p className="text-base text-zinc-500 leading-relaxed max-w-xl font-normal">
                Discover fashion brands, creative designers, thrift curators and premium streetwear labels from across Zimbabwe. Built for local creator culture.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200/60 rounded-full text-xs font-bold text-zinc-600">
                <span>🇿🇼 Built in Zimbabwe</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200/60 rounded-full text-xs font-bold text-zinc-600">
                <span>⚡ Instant Storefronts</span>
              </div>
            </div>
          </div>

          {/* Right Map Visual */}
          <div className="md:col-span-5 flex justify-center md:justify-end relative">
            <div className="relative w-72 h-72 rounded-2xl bg-zinc-50/60 border border-[#ECECEC] flex items-center justify-center p-6 shadow-sm overflow-hidden group">
              
              {/* Subtle grid pattern background */}
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-60" />
              
              {/* Map Outline SVG of Zimbabwe */}
              <svg 
                viewBox="0 0 200 200" 
                className="w-56 h-56 text-zinc-200 fill-zinc-100/40 stroke-zinc-300 stroke-1.5 transition-colors duration-500 group-hover:text-zinc-300/40"
                aria-label="Zimbabwe map illustration"
              >
                <path d="M 90,40 L 112,42 L 138,50 L 152,65 L 165,85 L 158,112 L 140,135 L 122,152 L 100,165 L 75,160 L 55,145 L 42,120 L 38,92 L 50,70 L 72,55 Z" />
                <line x1="120" y1="70" x2="65" y2="125" className="stroke-dashed stroke-zinc-300 stroke-[1] stroke-dasharray-[2]" />
                <line x1="120" y1="70" x2="148" y2="95" className="stroke-dashed stroke-zinc-300 stroke-[1]" />
              </svg>

              {/* Pulsing Indicators for key cities */}
              <div className="absolute top-[35%] left-[60%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BEF715] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-black border-2 border-white shadow"></span>
                </span>
                <span className="bg-black text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded shadow mt-1 uppercase scale-90">Harare</span>
              </div>

              <div className="absolute top-[62%] left-[32%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BEF715] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-black border-2 border-white shadow"></span>
                </span>
                <span className="bg-black text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded shadow mt-1 uppercase scale-90">Byo</span>
              </div>

              <div className="absolute top-[48%] left-[74%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BEF715] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-black border-2 border-white shadow"></span>
                </span>
                <span className="bg-black text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded shadow mt-1 uppercase scale-90">Mutare</span>
              </div>

              <div className="absolute bottom-4 left-4 bg-[#BEF715] text-black text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                🇿🇼 Made in Zimbabwe
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FOUR BENTO STATISTICS CARDS (Calculated Live from Supabase / Skeleton Loading) */}
      <section className="w-full py-10 bg-zinc-50/40 border-b border-[#ECECEC]">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            
            {dbLoading ? (
              /* Skeleton Bento Stat Cards */
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#ECECEC] p-5 rounded-[20px] shadow-xs flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-14 bg-zinc-200 rounded" />
                    <div className="h-3 w-16 bg-zinc-100 rounded" />
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Card 1: Shops */}
                <div className="bg-white border border-[#ECECEC] p-5 rounded-[20px] shadow-xs flex items-center gap-4 transition-all hover:shadow-md hover:border-zinc-300">
                  <div className="w-12 h-12 rounded-xl bg-[#bef715]/10 text-black flex items-center justify-center text-xl shadow-xs shrink-0">
                    🏪
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-black leading-none">
                      {liveStats.shopsCount}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Shops</span>
                  </div>
                </div>

                {/* Card 2: Products */}
                <div className="bg-white border border-[#ECECEC] p-5 rounded-[20px] shadow-xs flex items-center gap-4 transition-all hover:shadow-md hover:border-zinc-300">
                  <div className="w-12 h-12 rounded-xl bg-[#bef715]/10 text-black flex items-center justify-center text-xl shadow-xs shrink-0">
                    🛍️
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-black leading-none">
                      {liveStats.productsCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Products</span>
                  </div>
                </div>

                {/* Card 3: Cities */}
                <div className="bg-white border border-[#ECECEC] p-5 rounded-[20px] shadow-xs flex items-center gap-4 transition-all hover:shadow-md hover:border-zinc-300">
                  <div className="w-12 h-12 rounded-xl bg-[#bef715]/10 text-black flex items-center justify-center text-xl shadow-xs shrink-0">
                    📍
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-black leading-none">
                      {liveStats.citiesCount}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Cities</span>
                  </div>
                </div>

                {/* Card 4: Built By Zimbabweans */}
                <div className="bg-white border border-[#ECECEC] p-5 rounded-[20px] shadow-xs flex items-center gap-4 transition-all hover:shadow-md hover:border-zinc-300">
                  <div className="w-12 h-12 rounded-xl bg-[#bef715]/10 text-black flex items-center justify-center text-xl shadow-xs shrink-0">
                    👥
                  </div>
                  <div>
                    <span className="block text-md font-black text-black leading-none uppercase tracking-tight py-0.5">Built By</span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Zimbabweans</span>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </section>

      {/* 4. MAIN TWO-COLUMN LAYOUT (Filters + Shops Grid) */}
      <section id="marketplace-body" className="w-full py-12 bg-white">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* LEFT FILTER SIDEBAR (Desktop) */}
            <aside className="hidden lg:block lg:col-span-1 space-y-6">
              <div className="sticky top-24 bg-white border border-[#ECECEC] rounded-[24px] p-6 space-y-6 shadow-xs">
                
                {/* Header title */}
                <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC]">
                  <span className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                    <Filter size={15} />
                    Filters
                  </span>
                  {(selectedCats.length > 1 || !selectedCats.includes('All') || selectedCities.length > 1 || !selectedCities.includes('All')) && (
                    <button 
                      onClick={() => { setSelectedCats(['All']); setSelectedCities(['All']); }}
                      className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-widest cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Categories Checkbox block */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">Categories</h4>
                  <div className="space-y-1">
                    <CustomCheckbox 
                      checked={selectedCats.includes('All')} 
                      onChange={() => handleCategoryToggle('All')} 
                      label="All Categories" 
                    />
                    
                    {sidebarCategories.slice(0, showAllCats ? sidebarCategories.length : 5).map(cat => (
                      <CustomCheckbox 
                        key={cat}
                        checked={selectedCats.includes(cat)} 
                        onChange={() => handleCategoryToggle(cat)} 
                        label={cat} 
                      />
                    ))}

                    {sidebarCategories.length > 5 && (
                      <button 
                        onClick={() => setShowAllCats(!showAllCats)}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-zinc-400 hover:text-black uppercase tracking-wider pt-1.5 focus:outline-none cursor-pointer"
                      >
                        {showAllCats ? (
                          <>Show Less <ChevronUp size={12} className="stroke-[2.5]" /></>
                        ) : (
                          <>Show More <ChevronDown size={12} className="stroke-[2.5]" /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Cities Checkbox block */}
                <div className="space-y-3.5 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">Cities</h4>
                  <div className="space-y-1">
                    <CustomCheckbox 
                      checked={selectedCities.includes('All')} 
                      onChange={() => handleCityToggle('All')} 
                      label="All Cities" 
                    />
                    
                    {sidebarCities.slice(0, showAllCities ? sidebarCities.length : 5).map(city => (
                      <CustomCheckbox 
                        key={city}
                        checked={selectedCities.includes(city)} 
                        onChange={() => handleCityToggle(city)} 
                        label={city} 
                      />
                    ))}

                    {sidebarCities.length > 5 && (
                      <button 
                        onClick={() => setShowAllCities(!showAllCities)}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-zinc-400 hover:text-black uppercase tracking-wider pt-1.5 focus:outline-none cursor-pointer"
                      >
                        {showAllCities ? (
                          <>Show Less <ChevronUp size={12} className="stroke-[2.5]" /></>
                        ) : (
                          <>Show More <ChevronDown size={12} className="stroke-[2.5]" /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </aside>

            {/* RIGHT SIDE: INTERACTIVE MARKETPLACE GRID */}
            <main className="lg:col-span-3 space-y-6">
              
              {/* TOP CONTROLS AND SEARCH */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#ECECEC]">
                
                {/* Embedded Search input */}
                <div className="relative w-full sm:w-72 h-10 bg-zinc-50 border border-zinc-200 rounded-lg px-4 text-xs font-medium text-zinc-900 focus-within:border-zinc-400 transition-all flex items-center">
                  <input 
                    type="text" 
                    placeholder="Search shops, categories or cities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Filter stores by name, category, or city"
                    className="w-full bg-transparent border-none text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-0 text-xs py-2 pr-8 text-ellipsis"
                  />
                  <Search size={14} className="absolute right-4 text-zinc-400 pointer-events-none" />
                </div>

                {/* Sort / Mobile filters bar */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  
                  {/* Mobile Filters Trigger */}
                  <button 
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden h-10 px-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-700 hover:text-black flex items-center gap-2 cursor-pointer"
                    aria-label="Open mobile filter options"
                  >
                    <Filter size={14} />
                    Filters
                  </button>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">Sort:</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort shops list"
                      className="h-10 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-400 cursor-pointer"
                    >
                      <option value="Popular">Popular</option>
                      <option value="Newest">Newest</option>
                      <option value="Most Products">Most Products</option>
                      <option value="Alphabetical">Alphabetical</option>
                      <option value="Highest Rated">Highest Rated</option>
                    </select>
                  </div>

                </div>

              </div>

              {/* GRID CARDS AREA */}
              <div className="space-y-8">
                {dbLoading ? (
                  /* Skeleton Shop Cards Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="bg-white border border-[#ECECEC] rounded-[24px] overflow-hidden animate-pulse">
                        <div className="aspect-[16/9] w-full bg-zinc-100" />
                        <div className="px-5 pb-5 pt-3 space-y-4">
                          <div className="flex items-center gap-3.5 -mt-8 relative z-10">
                            <div className="w-14 h-14 rounded-full bg-zinc-200 border-3 border-white shadow shrink-0" />
                            <div className="pt-8 space-y-2 flex-1">
                              <div className="h-4 w-28 bg-zinc-200 rounded" />
                              <div className="h-3 w-20 bg-zinc-100 rounded" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 w-full bg-zinc-100 rounded" />
                            <div className="h-3 w-3/4 bg-zinc-100 rounded" />
                          </div>
                          <div className="h-10 w-full bg-zinc-100 rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : dbError ? (
                  /* Real DB Error State */
                  <div className="py-12 px-6 bg-red-50 border border-red-200 rounded-[20px] text-center space-y-4">
                    <p className="text-xs text-red-600 font-bold tracking-wide">{dbError}</p>
                    <button
                      onClick={fetchLiveShopsAndStats}
                      className="px-5 py-2.5 bg-black text-white text-xs font-extrabold rounded-lg hover:opacity-90 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw size={12} className="animate-spin" />
                      Retry Connection
                    </button>
                  </div>
                ) : paginatedShops.length === 0 ? (
                  /* Empty State */
                  <div className="py-16 text-center space-y-5 px-6 border border-dashed border-zinc-200 rounded-[24px]">
                    <div className="w-16 h-16 mx-auto rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 border border-zinc-100">
                      <Store size={28} className="stroke-[1.5]" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-md font-black text-zinc-850 tracking-tight uppercase">
                        {allShops.length === 0 ? 'No Shops Live Yet' : 'No Matching Stores'}
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                        {allShops.length === 0 
                          ? 'There are currently no active stores registered in the database. Be the first brand to launch!'
                          : "We couldn't find any stores matching your current search or filter parameters."}
                      </p>
                    </div>
                    {allShops.length === 0 ? (
                      <button 
                        onClick={() => navigate('/signup')}
                        className="px-5 py-2.5 bg-[#BEF715] text-black hover:bg-[#a6df0c] text-xs font-black uppercase rounded-full transition-all cursor-pointer"
                      >
                        Start Your Shop
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setSelectedCats(['All']); setSelectedCities(['All']); setSearchQuery(''); }}
                        className="px-5 py-2.5 bg-black text-[#BEF715] hover:text-white text-xs font-black uppercase rounded-full transition-all cursor-pointer"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                ) : (
                  /* List Grid with Smooth Fade-in */
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {paginatedShops.map((shop, i) => {
                      const logoHasFailed = failedLogos[shop.id];
                      return (
                        <div 
                          key={shop.id}
                          onClick={(e) => handleVisitShop(shop, e)}
                          className="group bg-white border border-[#ECECEC] rounded-[24px] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-zinc-350 [content-visibility:auto]"
                        >
                          
                          {/* 1. Cover Banner Image (Aspect 16/9 with fallback) */}
                          <div className="relative aspect-[16/9] w-full bg-zinc-100 overflow-hidden border-b border-[#ECECEC]">
                            <img 
                              src={shop.banner_url || FASHION_BANNERS[i % FASHION_BANNERS.length]} 
                              alt={`${shop.name} Fashion Banner`}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = FASHION_BANNERS[i % FASHION_BANNERS.length];
                              }}
                              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                            
                            {/* Overlay Gradient Edge */}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>

                          {/* 2. Logo Overlap Frame & Details */}
                          <div className="relative px-5 pb-5">
                            <div className="flex items-start gap-3.5 -mt-6 relative z-10">
                              
                              {/* Circle Overlapping Logo */}
                              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-black border-3 border-white shadow overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {shop.logo_url && !logoHasFailed ? (
                                  <img 
                                    src={shop.logo_url} 
                                    alt={`${shop.name} Logo`}
                                    loading="lazy"
                                    decoding="async"
                                    referrerPolicy="no-referrer"
                                    onError={() => {
                                      setFailedLogos(prev => ({ ...prev, [shop.id]: true }));
                                    }}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className={`w-full h-full flex items-center justify-center uppercase leading-none ${getLogoFallbackStyle(shop.name)}`}>
                                    {shop.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>

                              {/* Title details */}
                              <div className="pt-7 flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3 className="text-sm font-black text-black group-hover:text-black transition-colors truncate">
                                    {shop.name}
                                  </h3>
                                  {shop.is_verified && (
                                    <span className="shrink-0 text-[#BEF715] bg-black text-[7px] font-black tracking-widest px-1 rounded uppercase">ZIM</span>
                                  )}
                                </div>

                                {/* Category • City */}
                                <div className="text-[10px] font-bold text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span className="uppercase tracking-wide text-zinc-500">{shop.category}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-zinc-400">
                                    <MapPin size={9} className="text-zinc-300" />
                                    {shop.location}
                                  </span>
                                </div>
                              </div>

                            </div>

                            {/* Description text */}
                            <p className="mt-4 text-xs text-zinc-500 leading-relaxed font-normal line-clamp-2 min-h-10">
                              {shop.description}
                            </p>

                            {/* Ratings & products count */}
                            <div className="mt-4 flex items-center justify-between text-xs py-2.5 border-y border-zinc-100 font-bold">
                              <div className="flex items-center gap-1 text-black">
                                <Star size={12} className="text-yellow-400 fill-current" />
                                <span>{shop.rating.toFixed(1)}</span>
                                {shop.reviews_count > 0 && (
                                  <span className="text-zinc-400 font-normal">({shop.reviews_count})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-zinc-500 font-bold">
                                <span>{shop.product_count} Products</span>
                              </div>
                            </div>

                            {/* Primary Button */}
                            <button 
                              onClick={(e) => handleVisitShop(shop, e)}
                              className="w-full mt-4 h-11 bg-[#000000] hover:bg-[#111111] text-[#BEF715] hover:text-white rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-black"
                              aria-label={`Visit store ${shop.name}`}
                            >
                              <span>Visit Shop</span>
                              <ArrowRight size={13} className="stroke-[3] transition-transform group-hover:translate-x-1" />
                            </button>

                          </div>

                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="pt-10 flex items-center justify-center gap-2 select-none">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-700 hover:text-black hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-zinc-50 disabled:hover:text-zinc-700 disabled:cursor-not-allowed transition-all cursor-pointer"
                      aria-label="Previous page"
                    >
                      ← Prev
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          aria-label={`Page ${pageNum}`}
                          className={`w-9 h-9 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-black text-[#BEF715] border border-black shadow-sm' 
                              : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-black'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-700 hover:text-black hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-zinc-50 disabled:hover:text-zinc-700 disabled:cursor-not-allowed transition-all cursor-pointer"
                      aria-label="Next page"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>

            </main>

          </div>
        </div>
      </section>

      {/* 6. BOTTOM FULL-WIDTH CTA */}
      <section id="bottom-cta" className="w-full bg-[#FFFFFF] border-t border-[#ECECEC] py-14">
        <div className="w-full max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 bg-zinc-50 border border-[#ECECEC] p-8 md:p-12 rounded-[24px]">
          
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <div className="flex justify-center md:justify-start">
              <span className="text-3xl">🏪</span>
            </div>
            <h2 className="text-2xl font-black text-black tracking-tight leading-none uppercase">
              Are you a brand or store?
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed font-normal">
              Join the fastest-growing local clothing platform. ThreadZW makes it incredibly easy to launch your customized store, load collections, handle WhatsApp ordering systems, and grow your local fashion business.
            </p>
          </div>

          <button 
            onClick={() => navigate('/signup')}
            className="w-full md:w-auto shrink-0 h-14 bg-[#BEF715] hover:bg-[#a6df0c] text-black font-extrabold text-sm rounded-full px-8 flex items-center justify-center gap-2 shadow transition-all cursor-pointer active:scale-98 tracking-wider uppercase"
            aria-label="Start your shop on ThreadZW"
          >
            <span>Start Your Shop</span>
            <ArrowRight size={16} className="stroke-[2.5]" />
          </button>

        </div>
      </section>

      {/* INTERACTIVE MOBILE FILTERS BOTTOM DRAWER SHEET */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            
            {/* Bottom Sheet drawer */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[24px] z-50 max-h-[85vh] flex flex-col overflow-hidden pb-8 shadow-xl border-t border-zinc-200"
            >
              {/* Drawer header */}
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 select-none">
                <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Filter size={13} />
                  Mobile Filters
                </span>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-zinc-400 hover:text-black focus:outline-none cursor-pointer"
                  aria-label="Close mobile filters"
                >
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>

              {/* Scrollable Filters Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                
                {/* Mobile Categories Block */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">Categories</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <CustomCheckbox 
                      checked={selectedCats.includes('All')} 
                      onChange={() => handleCategoryToggle('All')} 
                      label="All Categories" 
                    />
                    
                    {sidebarCategories.map(cat => (
                      <CustomCheckbox 
                        key={cat}
                        checked={selectedCats.includes(cat)} 
                        onChange={() => handleCategoryToggle(cat)} 
                        label={cat} 
                      />
                    ))}
                  </div>
                </div>

                {/* Mobile Cities Block */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">Cities</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <CustomCheckbox 
                      checked={selectedCities.includes('All')} 
                      onChange={() => handleCityToggle('All')} 
                      label="All Cities" 
                    />
                    
                    {sidebarCities.map(city => (
                      <CustomCheckbox 
                        key={city}
                        checked={selectedCities.includes(city)} 
                        onChange={() => handleCityToggle(city)} 
                        label={city} 
                      />
                    ))}
                  </div>
                </div>

              </div>

              {/* Apply/Close drawer footer */}
              <div className="px-6 pt-4 border-t border-zinc-100 flex items-center gap-3">
                <button 
                  onClick={() => { setSelectedCats(['All']); setSelectedCities(['All']); }}
                  className="flex-1 h-12 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                >
                  Reset
                </button>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 h-12 bg-black text-[#BEF715] text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
