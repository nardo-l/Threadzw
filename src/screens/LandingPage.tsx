// src/screens/LandingPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ShoppingBag, 
  Check, 
  MessageCircle, 
  Package, 
  Sliders, 
  Share2, 
  MapPin, 
  Smartphone, 
  Star, 
  ChevronDown, 
  ExternalLink,
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Store,
  RefreshCw
} from 'lucide-react';
import { trackLandingPageView } from '../lib/analytics';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onStartFree: () => void;
  onLoginSuccess: () => void;
}

const DEFAULT_DEMO_SHOPS = [
  {
    id: 'urbankicks',
    name: 'Urban Kicks HRE',
    slug: 'urbankicks',
    category: 'Sneakers',
    banner_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80',
    logo_url: null,
    location: 'Harare CBD'
  },
  {
    id: 'vintageplug',
    name: 'Vintage Plug BYO',
    slug: 'vintageplug',
    category: 'Thrift & Vintage',
    banner_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
    logo_url: null,
    location: 'Bulawayo'
  },
  {
    id: 'dripdistrict',
    name: 'Drip District',
    slug: 'dripdistrict',
    category: 'Drip & Streetwear',
    banner_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
    logo_url: null,
    location: 'Avondale'
  },
  {
    id: 'sneakercorner',
    name: 'Sneaker Corner',
    slug: 'sneakercorner',
    category: 'Sneakers',
    banner_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    logo_url: null,
    location: 'Harare'
  }
];

const DEFAULT_HERO_BG = 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/ChatGPT%20Image%20Aug%204,%202026,%2012_58_11%20PM.png';

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree }) => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [dbShops, setDbShops] = useState<any[]>([]);
  const [dbShopsCount, setDbShopsCount] = useState<number>(0);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(true);
  const [heroBgUrl, setHeroBgUrl] = useState<string>(DEFAULT_HERO_BG);

  useEffect(() => {
    trackLandingPageView();
  }, []);

  // Fetch Hero Background dynamically from bucket 'landing page background' or 'landing-page-background'
  useEffect(() => {
    async function fetchHeroBg() {
      try {
        const bucketNames = ['landing page background', 'landing-page-background'];
        for (const bucket of bucketNames) {
          const { data: files, error } = await supabase.storage
            .from(bucket)
            .list('', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });

          if (!error && files && files.length > 0) {
            const imageFile = files.find(f => f.name && !f.name.startsWith('.') && !f.name.endsWith('/'));
            if (imageFile) {
              const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(imageFile.name);
              if (urlData?.publicUrl) {
                setHeroBgUrl(urlData.publicUrl);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.log('Using default hero background image:', err);
      }
    }

    fetchHeroBg();
  }, []);

  useEffect(() => {
    async function fetchSupabaseShops() {
      setIsLoadingShops(true);
      try {
        const { data, count, error } = await supabase
          .from('shops')
          .select('id, name, slug, description, logo_url, banner_url, location, category, categories, is_active, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(8);

        if (!error && data && data.length > 0) {
          setDbShops(data);
          if (count !== null && count > 0) {
            setDbShopsCount(count);
          } else {
            setDbShopsCount(data.length);
          }
        }
      } catch (err) {
        console.error('Error loading Supabase shops for LandingPage:', err);
      } finally {
        setIsLoadingShops(false);
      }
    }

    fetchSupabaseShops();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Combine real Supabase shops with fallback demos to ensure 4 cards minimum
  const displayShops = React.useMemo(() => {
    if (dbShops.length >= 4) {
      return dbShops.slice(0, 4);
    }
    const combined = [...dbShops];
    for (const demo of DEFAULT_DEMO_SHOPS) {
      if (combined.length >= 4) break;
      if (!combined.some(s => s.slug === demo.slug)) {
        combined.push(demo);
      }
    }
    return combined;
  }, [dbShops]);

  // Brand logos / trusted names list
  const trustedBrands = React.useMemo(() => {
    if (dbShops.length > 0) {
      const names = dbShops.map(s => s.name).filter(Boolean);
      while (names.length < 6) {
        const fallback = DEFAULT_DEMO_SHOPS[names.length % DEFAULT_DEMO_SHOPS.length].name;
        if (!names.includes(fallback)) names.push(fallback);
        else names.push(`Store ${names.length + 1}`);
      }
      return names.slice(0, 6);
    }
    return ['Urban Kicks', 'Drip District', 'Vintage Plug', 'Sneaker Corner', 'Thrift Plug', 'Street Select'];
  }, [dbShops]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#FFFFFF] font-sans antialiased selection:bg-[#C6FF00] selection:text-black overflow-x-hidden">
      
      {/* BACKGROUND DECORATIVE GLOWS & SILHOUETTE PATTERNS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#C6FF00]/10 blur-[140px] rounded-full" />
        <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] bg-[#C6FF00]/5 blur-[120px] rounded-full" />
        <div className="absolute top-[70%] left-[-10%] w-[600px] h-[600px] bg-[#C6FF00]/5 blur-[150px] rounded-full" />
        
        {/* Faint Grid Overlay */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
        />
      </div>

      {/* ============================================================ */}
      {/* NAVIGATION HEADER */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1 cursor-pointer group"
          >
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-zinc-200 transition-colors">
              THREAD
            </span>
            <span className="text-2xl font-black tracking-tight text-[#C6FF00] drop-shadow-[0_0_12px_rgba(198,255,0,0.4)]">
              ZW
            </span>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#examples" className="hover:text-white transition-colors">Live Stores</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-black tracking-wider text-zinc-300 hover:text-white uppercase transition-colors px-3 py-2 cursor-pointer"
            >
              LOGIN
            </button>
            <button
              onClick={onStartFree}
              className="bg-[#C6FF00] hover:bg-[#b5eb00] text-black text-xs font-black px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-md shadow-[#C6FF00]/20 tracking-wider uppercase active:scale-95 hover:scale-105"
            >
              GET STARTED
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* HERO SECTION WITH DYNAMIC BUCKET BACKGROUND */}
      {/* ============================================================ */}
      <section className="relative z-10 pt-12 pb-24 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden rounded-3xl border border-zinc-800/80 my-2 shadow-2xl">
        
        {/* HERO DYNAMIC BACKGROUND IMAGE FROM BUCKET (landing-page-background) */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat filter blur-[2px] scale-105 transition-all duration-700 pointer-events-none"
          style={{ backgroundImage: `url(${heroBgUrl})` }}
        />

        {/* Semi-transparent dark layer */}
        <div className="absolute inset-0 z-[1] bg-black/60 pointer-events-none" />

        {/* Black gradient from left to right: left 45% solid black for headline readability, right fades into shop view */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-[#050505] via-[#050505]/95 sm:via-[#050505]/80 lg:via-[#050505]/65 to-transparent pointer-events-none" />

        {/* Top and Bottom smooth edge fades */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-[#050505]/70 via-transparent to-[#050505]/80 pointer-events-none" />

        {/* Subtle Lime Radial Glow behind phone mockup on right */}
        <div className="absolute top-1/2 right-0 lg:right-[5%] -translate-y-1/2 w-[380px] sm:w-[500px] h-[380px] sm:h-[500px] bg-[#C6FF00]/22 rounded-full blur-[110px] pointer-events-none z-[3]" />

        {/* HERO CONTENT CONTAINER */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* LEFT COLUMN: Headline & CTA Buttons */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white"
            >
              Build Your Shop. <br />
              Show Your Stock. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C6FF00] via-[#d4ff33] to-[#85B800] drop-shadow-[0_0_25px_rgba(198,255,0,0.3)]">
                Get Orders.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-zinc-300 text-base sm:text-xl font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0 pt-2"
            >
              Create a professional online shop for your drip shop, thrift store or sneaker business in under 5 minutes. Share one link and receive orders directly on WhatsApp.
            </motion.p>

            {/* Primary CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button
                onClick={onStartFree}
                className="w-full sm:w-auto h-14 px-8 bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer active:scale-95 shadow-xl shadow-[#C6FF00]/25 hover:scale-105"
              >
                <span>CREATE MY SHOP</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </motion.div>

            {/* Micro Trust Badges below buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs font-bold text-zinc-400"
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#C6FF00]" />
                <span>Limited Free Tier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#C6FF00]" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#C6FF00]" />
                <span>Setup in Under 5 Minutes</span>
              </div>
            </motion.div>

          </div>

          {/* RIGHT COLUMN: Phone Mockup (~40% of hero width on desktop) & 4 Floating Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center mt-10 lg:mt-0">
            
            {/* Phone Mockup Container */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="w-full max-w-[320px] sm:max-w-[360px] bg-zinc-950 rounded-[44px] border-[8px] border-zinc-800 shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden relative z-20"
            >
              {/* Phone Screen Inner Content */}
              <div className="bg-black relative rounded-[36px] overflow-hidden flex flex-col items-center">
                {/* Dynamic Notch Bar */}
                <div className="absolute top-2 z-10 w-28 h-4 bg-zinc-900/90 backdrop-blur-xs rounded-full mx-auto flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-800" />
                </div>

                <img 
                  src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/Screenshot_2026-07-31-11-08-03-715_com.android.chrome.jpg" 
                  alt="Shop Preview on Phone" 
                  className="w-full h-auto object-cover rounded-[32px] block" 
                />
              </div>
            </motion.div>

            {/* FLOATING CARD 1: Top Left - New WhatsApp Order */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="hidden sm:flex absolute top-4 left-[-20px] lg:left-[-35px] z-30 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-3 rounded-2xl shadow-2xl items-center gap-3 w-56 sm:w-60"
            >
              <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold text-[#25D366] uppercase tracking-wider">New WhatsApp Order</div>
                <div className="text-xs font-bold text-white truncate">Nike Dunk Low (Size 9)</div>
                <div className="text-[10px] text-zinc-400">Tawanda • $120</div>
              </div>
            </motion.div>

            {/* FLOATING CARD 2: Bottom Left - Your Shop Link */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="hidden sm:flex absolute bottom-8 left-[-15px] lg:left-[-25px] z-30 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-3 rounded-2xl shadow-2xl items-center gap-3 w-52 sm:w-56"
            >
              <div className="w-9 h-9 rounded-xl bg-[#C6FF00]/20 border border-[#C6FF00]/40 flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4 text-[#C6FF00]" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold text-[#C6FF00] uppercase tracking-wider">Your Custom Link</div>
                <div className="text-xs font-mono font-bold text-white">threadzw.com/kicks</div>
                <div className="text-[10px] text-zinc-400">Share on IG & Bio</div>
              </div>
            </motion.div>

            {/* FLOATING CARD 3: Top Right - Customer Rating */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="hidden sm:flex absolute top-10 right-[-20px] lg:right-[-30px] z-30 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-3 rounded-2xl shadow-2xl items-center gap-3 w-52 sm:w-56"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider">Customer Rating</div>
                <div className="text-xs font-black text-white">4.9 / 5.0 Rating</div>
                <div className="text-[10px] text-zinc-400">87 happy buyers</div>
              </div>
            </motion.div>

            {/* FLOATING CARD 4: Bottom Right - Weekly Orders */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="hidden sm:flex absolute bottom-12 right-[-15px] lg:right-[-25px] z-30 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-3 rounded-2xl shadow-2xl items-center gap-3 w-52 sm:w-56"
            >
              <div className="w-9 h-9 rounded-xl bg-[#C6FF00]/20 border border-[#C6FF00]/40 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-[#C6FF00]" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold text-[#C6FF00] uppercase tracking-wider">Weekly Orders</div>
                <div className="text-xs font-black text-white">247 Orders Sent</div>
                <div className="text-[10px] text-zinc-400">Direct on WhatsApp</div>
              </div>
            </motion.div>

          </div>

        </div>

      </section>

      {/* ============================================================ */}
      {/* TRUSTED ZIMBABWEAN STORES BANNER */}
      {/* ============================================================ */}
      <section className="border-y border-zinc-900 bg-zinc-950/60 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">
            TRUSTED BY ZIMBABWE’S TOP DRIP & THRIFT SHOPS
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-center opacity-70">
            {trustedBrands.map((name, i) => (
              <div 
                key={`${name}-${i}`}
                className="py-2.5 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-sm font-black tracking-tight text-zinc-300 hover:text-[#C6FF00] hover:border-[#C6FF00]/40 transition-colors cursor-pointer truncate"
                onClick={() => navigate('/shops')}
              >
                {name}
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-500 font-semibold pt-2">
            +{dbShopsCount > 0 ? dbShopsCount : '50'} active Zimbabwean reseller stores connected on ThreadZW 🇿🇼
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PROBLEM SECTION (TWO LARGE COLUMNS) */}
      {/* ============================================================ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono font-bold text-[#C6FF00] uppercase tracking-widest">
            STILL SELLING LIKE THIS?
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Stop losing customers to complicated buying experiences.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Column: Old Way (Selling Only Through WhatsApp) */}
          <div className="bg-zinc-950 rounded-3xl p-8 lg:p-10 border border-red-900/30 relative overflow-hidden space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/50 border border-red-800/40 text-red-400 text-xs font-black uppercase tracking-wider">
              <span>Selling Only Through WhatsApp</span>
              <span>❌</span>
            </div>

            <h3 className="text-2xl font-extrabold text-white">The Slow, Frustrating Way</h3>

            <ul className="space-y-4 pt-2">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">✕</span>
                <div>
                  <p className="text-sm font-bold text-white">Customers ask "Price?" 100 times a day</p>
                  <p className="text-xs text-zinc-400 mt-0.5">You waste hours typing prices over and over again.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">✕</span>
                <div>
                  <p className="text-sm font-bold text-white">Sending pictures one by one</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Sending 20 photos per customer clutters chats and wastes bundle bandwidth.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">✕</span>
                <div>
                  <p className="text-sm font-bold text-white">Products disappear after 24 hours</p>
                  <p className="text-xs text-zinc-400 mt-0.5">WhatsApp status updates vanish, meaning new buyers miss your inventory.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">✕</span>
                <div>
                  <p className="text-sm font-bold text-white">No proper catalogue</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Buyers can't filter by sneaker size or clothing category.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Right Column: ThreadZW Way */}
          <div className="bg-zinc-900/80 rounded-3xl p-8 lg:p-10 border border-[#C6FF00]/40 relative overflow-hidden space-y-6 shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#C6FF00]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C6FF00]/20 border border-[#C6FF00]/40 text-[#C6FF00] text-xs font-black uppercase tracking-wider">
              <span>With ThreadZW Pro</span>
              <span>⚡</span>
            </div>

            <h3 className="text-2xl font-extrabold text-white">The Modern 24/7 Storefront</h3>

            <ul className="space-y-4 pt-2">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#C6FF00] text-black font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <div>
                  <p className="text-sm font-bold text-white">Beautiful online storefront</p>
                  <p className="text-xs text-zinc-300 mt-0.5">Your entire catalog presented cleanly with prices, sizes, and photos.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#C6FF00] text-black font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <div>
                  <p className="text-sm font-bold text-white">Customers browse themselves</p>
                  <p className="text-xs text-zinc-300 mt-0.5">Buyers select their exact sneaker size or hoodie color on their own.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#C6FF00] text-black font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <div>
                  <p className="text-sm font-bold text-white">Orders arrive formatted on WhatsApp</p>
                  <p className="text-xs text-zinc-300 mt-0.5">Receive clear order messages with exact product names, sizes, and totals.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#C6FF00] text-black font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <div>
                  <p className="text-sm font-bold text-white">One link for Instagram, TikTok & Bio</p>
                  <p className="text-xs text-zinc-300 mt-0.5">Build a high-value brand image that sets you apart from competitors.</p>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS (3 STEPS) */}
      {/* ============================================================ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono font-bold text-[#C6FF00] uppercase tracking-widest">
            SIMPLE SETUP
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            How ThreadZW Works
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-zinc-950 rounded-3xl p-8 border border-zinc-800 space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#C6FF00] text-black font-black text-lg flex items-center justify-center shadow-md">
              01
            </div>
            <h3 className="text-xl font-extrabold text-white">Create Your Shop</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sign up in seconds, pick your custom shop handle (e.g. threadzw.com/yourshop) and add your logo and banner.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-950 rounded-3xl p-8 border border-zinc-800 space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#C6FF00] text-black font-black text-lg flex items-center justify-center shadow-md">
              02
            </div>
            <h3 className="text-xl font-extrabold text-white">Upload Products</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload photos of your sneakers, thrift drops or streetwear items. Set prices, available sizes and stock quantities.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-950 rounded-3xl p-8 border border-zinc-800 space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#C6FF00] text-black font-black text-lg flex items-center justify-center shadow-md">
              03
            </div>
            <h3 className="text-xl font-extrabold text-white">Share & Get Orders</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Put your shop link in your Instagram, TikTok and WhatsApp bio. Customers browse and send structured orders to your WhatsApp.
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* LIVE STORES (EXAMPLES GRID FROM SUPABASE) */}
      {/* ============================================================ */}
      <section id="examples" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono font-bold text-[#C6FF00] uppercase tracking-widest">
            LIVE STOREFRONTS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Stores Built With ThreadZW
          </h2>
          <p className="text-zinc-400 text-sm">
            See how real reseller brands across Zimbabwe present their stock and receive orders on WhatsApp.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayShops.map((shop, index) => {
            const fallbackBanner = DEFAULT_DEMO_SHOPS[index % DEFAULT_DEMO_SHOPS.length].banner_url;
            const bannerSrc = shop.banner_url || fallbackBanner;
            const categoryLabel = shop.category || (Array.isArray(shop.categories) && shop.categories[0]) || 'Sneakers & Drip';

            return (
              <div 
                key={shop.id || shop.slug || index}
                className="bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden hover:border-[#C6FF00]/50 transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="h-44 bg-zinc-900 relative overflow-hidden">
                  <img 
                    src={bannerSrc} 
                    alt={shop.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-[#C6FF00] font-bold text-[10px] px-2.5 py-1 rounded-full border border-zinc-800">
                    {categoryLabel}
                  </span>
                  {shop.logo_url && (
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full border border-zinc-800 bg-black overflow-hidden shadow-md">
                      <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white truncate">{shop.name}</h3>
                    <p className="text-xs font-mono text-zinc-400 truncate">threadzw.com/{shop.slug}</p>
                    {shop.location && (
                      <p className="text-[11px] text-zinc-500 font-medium mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C6FF00]" />
                        <span>{shop.location}</span>
                      </p>
                    )}
                  </div>

                  <button 
                    onClick={() => navigate(`/${shop.slug}`)}
                    className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-[#C6FF00] hover:text-black text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Store</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Directory Navigation Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/shops')}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-extrabold text-white hover:border-[#C6FF00]/40 transition-all cursor-pointer shadow-xl group"
          >
            <Store className="w-4 h-4 text-[#C6FF00]" />
            <span>Explore All Stores in Shop Directory</span>
            <ArrowRight className="w-4 h-4 text-[#C6FF00] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURES (2x3 GRID WITH OUTLINED ICONS) */}
      {/* ============================================================ */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono font-bold text-[#C6FF00] uppercase tracking-widest">
            BUILT FOR RESELLERS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Everything You Need To Sell More Drip
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-4 hover:border-[#C6FF00]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#C6FF00]">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">WhatsApp Ordering</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Orders go straight to your WhatsApp with product name, size, quantity & total pre-calculated.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-4 hover:border-[#C6FF00]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#C6FF00]">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Unlimited Products</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              List as many sneakers, thrift tees or hoodies as you want. No artificial limits or extra fees.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-4 hover:border-[#C6FF00]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#C6FF00]">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Inventory Management</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Keep track of sizes (UK 6 to UK 12), color options, stock levels & mark items sold out in one click.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-4 hover:border-[#C6FF00]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#C6FF00]">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Custom Shop Link</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Get your own clean link (threadzw.com/yourshop) to put in your Instagram, TikTok & WhatsApp bio.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-4 hover:border-[#C6FF00]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#C6FF00]">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Store Location</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Show customers where your physical store or pickup point is located in Harare, Bulawayo or Mutare.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-4 hover:border-[#C6FF00]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#C6FF00]">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Mobile Optimised</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ultra-fast storefront that loads instantly on mobile data and looks like a high-end native app.
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* PRICING (ONE SINGLE CARD) */}
      {/* ============================================================ */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono font-bold text-[#C6FF00] uppercase tracking-widest">
            AFFORDABLE PRICING
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            One Simple Plan
          </h2>
          <p className="text-zinc-400 text-sm">
            Everything you need to run your online storefront for less than the cost of a coffee.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="bg-zinc-950 rounded-3xl p-8 sm:p-12 border-2 border-[#C6FF00]/50 shadow-[0_20px_60px_rgba(198,255,0,0.1)] relative overflow-hidden text-center space-y-8">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C6FF00] text-black font-extrabold text-xs uppercase tracking-wider">
              <span>Limited Free Tier</span>
            </div>

            <div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-6xl font-black text-white tracking-tight">$0</span>
                <span className="text-zinc-400 font-bold text-lg">/ free forever</span>
              </div>
              <p className="text-xs font-extrabold text-[#C6FF00] mt-2">Zero Monthly Subscription Fees</p>
            </div>

            <div className="space-y-3.5 text-left border-y border-zinc-800/80 py-6">
              {[
                'Up to 3 Active Products & Categories',
                'WhatsApp Ordering Integration',
                'Inventory & Size Variant Tracking',
                'Custom Shop Link (threadzw.app/shop/yourshop)',
                'Recent Activity & Analytics Dashboard',
                'Instant Storefront Publishing'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-xs font-bold text-zinc-200">
                  <div className="w-5 h-5 rounded-full bg-[#C6FF00] text-black flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onStartFree}
              className="w-full h-14 bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-sm rounded-2xl transition-all cursor-pointer shadow-lg shadow-[#C6FF00]/20 active:scale-95 uppercase tracking-wider"
            >
              Get Started for Free
            </button>

            <p className="text-[11px] text-zinc-500 font-medium">
              No credit card required. Setup takes less than 5 minutes.
            </p>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TESTIMONIALS (3 CARDS) */}
      {/* ============================================================ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono font-bold text-[#C6FF00] uppercase tracking-widest">
            TESTIMONIALS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            What Shop Owners Say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Review 1 */}
          <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex gap-1 text-[#C6FF00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C6FF00]" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                "ThreadZW changed the game for my sneaker business. Customers can now browse all sizes and order instantly without asking for prices 50 times a day."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden font-black text-xs text-white flex items-center justify-center shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                  alt="Tawanda" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Tawanda</h4>
                <p className="text-[10px] text-zinc-500 font-mono">Owner, Urban Kicks Harare</p>
              </div>
            </div>
          </div>

          {/* Review 2 */}
          <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex gap-1 text-[#C6FF00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C6FF00]" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                "I got 17 orders in my first week! Best decision I made for my thrift store. Sharing one link on TikTok doubled my sales."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden font-black text-xs text-white flex items-center justify-center shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80" 
                  alt="Ruvimbo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Ruvimbo</h4>
                <p className="text-[10px] text-zinc-500 font-mono">Owner, Thrift Plug Bulawayo</p>
              </div>
            </div>
          </div>

          {/* Review 3 */}
          <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex gap-1 text-[#C6FF00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C6FF00]" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                "Finally, a platform made specifically for Zimbabwean resellers. It looks super professional and WhatsApp ordering is seamless."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden font-black text-xs text-white flex items-center justify-center shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" 
                  alt="Blessing" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Blessing</h4>
                <p className="text-[10px] text-zinc-500 font-mono">Owner, Drip Select Mutare</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ SECTION (ACCORDION) */}
      {/* ============================================================ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10 border-t border-zinc-900">
        <div className="text-center mb-16 space-y-3">
          <span className="text-xs font-mono font-bold text-[#C6FF00] uppercase tracking-widest">
            QUESTIONS & ANSWERS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Do my customers need an app to view my shop?",
              a: "No! Your shop opens instantly in any browser (Chrome, Safari, WhatsApp browser, TikTok browser) on any phone without downloading any app."
            },
            {
              q: "How long does setup take?",
              a: "Under 5 minutes. You just add your shop name, logo, upload your sneakers or clothes with prices and sizes, and your link is live."
            },
            {
              q: "Do customers pay online or on WhatsApp?",
              a: "Orders arrive directly on WhatsApp so you can collect payment via EcoCash, USD Cash on Delivery, InnBucks, or Zipit—exactly how you already operate in Zimbabwe."
            },
            {
              q: "Can I list different sizes for sneakers and clothing?",
              a: "Yes! Full size variant support (e.g. UK 6 to UK 12 for sneakers, S to XXL for clothing) with custom stock tracking."
            },
            {
              q: "Can I put my shop link on Instagram and TikTok?",
              a: "Yes! Put your threadzw.com/yourshop link in your bio on Instagram, TikTok, Facebook, and WhatsApp."
            },
            {
              q: "How does the pricing for ThreadZW work?",
              a: "ThreadZW offers a limited free trial allowing merchants to run their online storefront completely free with up to 9 products, WhatsApp ordering, and zero monthly fees."
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-6 text-left font-extrabold text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer hover:text-[#C6FF00] transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-[#C6FF00] transition-transform duration-200 shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-6 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900/60 pt-4">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* FINAL CTA SECTION */}
      {/* ============================================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-[40px] border border-[#C6FF00]/40 p-10 sm:p-16 text-center space-y-8 relative overflow-hidden shadow-[0_30px_100px_rgba(198,255,0,0.15)]">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#C6FF00]/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-6xl font-black text-white tracking-tight">
              Ready To Sell More?
            </h2>
            <p className="text-zinc-300 text-sm sm:text-base font-medium leading-relaxed">
              Join Zimbabwe's fastest-growing platform for drip shops, thrift stores and sneaker businesses.
            </p>
          </div>

          <div className="relative z-10">
            <button
              onClick={onStartFree}
              className="px-10 h-16 bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-black text-base rounded-2xl inline-flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer shadow-2xl shadow-[#C6FF00]/30 hover:scale-105 active:scale-95 uppercase tracking-wider"
            >
              <span>CREATE MY SHOP</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer className="border-t border-zinc-900 bg-[#050505] py-12 text-center relative z-10">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl font-black tracking-tight text-white">THREAD</span>
            <span className="text-xl font-black tracking-tight text-[#C6FF00]">ZW</span>
          </div>
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
            ThreadZW Storefront Engine • Harare, Zimbabwe 🇿🇼
          </p>
          <p className="text-[11px] text-zinc-600">
            © {new Date().getFullYear()} ThreadZW. Built specifically for Zimbabwean drip shops, thrift stores & sneaker resellers.
          </p>
        </div>
      </footer>

    </div>
  );
};
