// src/screens/LandingPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Plus, 
  Share2, 
  Smartphone, 
  Check, 
  ArrowRight, 
  Upload, 
  Sparkles, 
  ChevronRight, 
  Lock, 
  TrendingUp,
  Instagram,
  Eye,
  Zap,
  Globe,
  MessageCircle,
  HelpCircle,
  Clock
} from 'lucide-react';

interface LandingPageProps {
  onStartFree: () => void;
  onLoginSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree, onLoginSuccess }) => {
  const navigate = useNavigate();
  
  // Selection state for premium badge categories which highlight specific interactive mockups
  const [activeBadge, setActiveBadge] = useState<string>('Fashion brands');
  
  // Simulated Interactive Shop Maker state
  const [stageStep, setStageStep] = useState<number>(0);
  const [typedTitle, setTypedTitle] = useState<string>('');
  const [typedPrice, setTypedPrice] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80'
  );

  // Simulated Shop Storefront product bank
  const [simulatedProducts, setSimulatedProducts] = useState<any[]>([
    {
      id: 'p1',
      title: 'Heavyweight Zipper Hoodie',
      price: '$45.00',
      category: 'Jackets & Hoodies',
      img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'p2',
      title: 'Boxy Classic Tee',
      price: '$22.00',
      category: 'Essentials',
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'p3',
      title: 'Street Culture Sneakers',
      price: '$95.00',
      category: 'Footwear',
      img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80'
    }
  ]);

  // Demo products for the auto-scrolling track
  const autoScrollDemoyProducts = [
    { name: "Vintage Denim Jacket", price: "$35", img: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=300&q=80", shop: "VintageZW" },
    { name: "Heavy Cargo Pants", price: "$28", img: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&w=300&q=80", shop: "HypeStore.zw" },
    { name: "Retro Run Sneakers", price: "$110", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80", shop: "SoleSource" },
    { name: "Graphic Heavy Tee", price: "$20", img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=300&q=80", shop: "Origin.studio" },
    { name: "Oversized Knit Sweater", price: "$40", img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80", shop: "Archive.zw" },
    { name: "Acid Wash Crewneck", price: "$32", img: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80", shop: "StreetLab.zw" },
  ];

  // Simulated live WhatsApp order toast state inside the floating storefront
  const [waToast, setWaToast] = useState<string | null>(null);

  // Trigger continuous auto-animation of the product builder inside the landing page
  useEffect(() => {
    let timer1: any, timer2: any, timer3: any, timer4: any, timer5: any;

    const runSimulationLoop = () => {
      setStageStep(0);
      setTypedTitle('');
      setTypedPrice('');
      setIsPublishing(false);
      setIsPublished(false);

      // Select distinct photo depending on active badge
      let targetColorTee = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80';
      if (activeBadge === 'Thrift stores') {
        targetColorTee = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=600&q=80';
      } else if (activeBadge === 'Sneaker sellers') {
        targetColorTee = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80';
      } else if (activeBadge === 'Boutiques') {
        targetColorTee = 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80';
      }
      setSelectedPhoto(targetColorTee);

      // Step 1: Type product name
      timer1 = setTimeout(() => {
        setStageStep(1);
        let titleText = activeBadge === 'Sneaker sellers' ? 'Retro Racer V2' : 
                         activeBadge === 'Thrift stores' ? 'Vintage Leather Coat' : 
                         activeBadge === 'Boutiques' ? 'Linen Drape Dress' : 'Acid Wash Boxy Tee';
        
        let curr = '';
        let i = 0;
        const intervalTitle = setInterval(() => {
          if (i < titleText.length) {
            curr += titleText[i];
            setTypedTitle(curr);
            i++;
          } else {
            clearInterval(intervalTitle);
          }
        }, 60);
      }, 1000);

      // Step 2: Type price
      timer2 = setTimeout(() => {
        setStageStep(2);
        let priceText = activeBadge === 'Sneaker sellers' ? '$120.00' : 
                        activeBadge === 'Thrift stores' ? '$45.00' : 
                        activeBadge === 'Boutiques' ? '$85.00' : '$25.00';
        
        let curr = '';
        let i = 0;
        const intervalPrice = setInterval(() => {
          if (i < priceText.length) {
            curr += priceText[i];
            setTypedPrice(curr);
            i++;
          } else {
            clearInterval(intervalPrice);
          }
        }, 80);
      }, 3000);

      // Step 3: Trigger Publish
      timer3 = setTimeout(() => {
        setStageStep(3);
        setIsPublishing(true);
      }, 5000);

      // Step 4: Add to Storefront
      timer4 = setTimeout(() => {
        setIsPublishing(false);
        setIsPublished(true);
        
        const newProduct = {
          id: 'temp-' + Date.now(),
          title: activeBadge === 'Sneaker sellers' ? 'Retro Racer V2' : 
                 activeBadge === 'Thrift stores' ? 'Vintage Leather Coat' : 
                 activeBadge === 'Boutiques' ? 'Linen Drape Dress' : 'Acid Wash Boxy Tee',
          price: activeBadge === 'Sneaker sellers' ? '$120.00' : 
                 activeBadge === 'Thrift stores' ? '$45.00' : 
                 activeBadge === 'Boutiques' ? '$85.00' : '$25.00',
          category: activeBadge === 'Sneaker sellers' ? 'Sneakers' : 
                    activeBadge === 'Thrift stores' ? 'Vintage Outerwear' : 
                    activeBadge === 'Boutiques' ? 'Luxury Dress' : 'New Tee',
          img: targetColorTee
        };

        setSimulatedProducts(prev => {
          const base = prev.filter(p => !p.id.startsWith('temp-'));
          return [newProduct, ...base];
        });
      }, 6500);
    };

    runSimulationLoop();

    // Loop interval
    const mainLoop = setInterval(() => {
      runSimulationLoop();
    }, 12000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearInterval(mainLoop);
    };
  }, [activeBadge]);

  // Click handler to trigger simulated WhatsApp order inside the preview
  const handleSimulateOrder = (prodName: string) => {
    setWaToast(`📲 WhatsApp: "Hi, I am interested in ordering '${prodName}'!"`);
    setTimeout(() => {
      setWaToast(null);
    }, 3800);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#f4f4f5] overflow-x-hidden font-sans relative selection:bg-[#c8ff00] selection:text-black">
      
      {/* Background radial soft light gradient - ThreadZW Subtle Green Glow */}
      <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_top,rgba(200,255,0,0.06),transparent_55%)] pointer-events-none z-0" />
      <div className="absolute top-[800px] left-[-300px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(200,255,0,0.02),transparent_70%)] pointer-events-none z-0" />
      <div className="absolute bottom-[300px] right-[-300px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(200,255,0,0.02),transparent_70%)] pointer-events-none z-0" />

      {/* HEADER NAVBAR */}
      <nav className="sticky top-0 w-full z-50 bg-[#070708]/85 backdrop-blur-md border-b border-zinc-900/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo brand linked to landing */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <img 
              src="https://4htrv9mv32e5k648.public.blob.vercel-storage.com/file_000000009c74724684851106c3e2946c.png" 
              alt="ThreadZW Logo" 
              referrerPolicy="no-referrer"
              className="h-7 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200"
            >
              Log in
            </button>
            <button
              onClick={onStartFree}
              className="relative group overflow-hidden px-4 py-2 bg-zinc-900 border border-zinc-800 text-sm font-extrabold text-white rounded-lg transition-transform hover:scale-102 active:scale-98"
            >
              <span className="relative z-10 flex items-center gap-1">
                Start Free
                <ChevronRight className="w-3.5 h-3.5 text-[#c8ff00]" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </button>
          </div>
        </div>
      </nav>

      {/* FREE BETA BANNER TRACK */}
      <div className="w-full bg-[#0a0a0c] border-b border-zinc-900 py-2.5 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-center text-xs text-zinc-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-pulse" />
          <span>Zimbabwe's Fashion Hub: Run your storefront free of charges during Beta.</span>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-12 text-center relative z-10">
        
        {/* Soft tag above header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-zinc-900/60 backdrop-blur border border-zinc-800/80 rounded-full px-3.5 py-1.5 mb-6 hover:border-zinc-700 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#c8ff00]" />
          <span className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase font-mono">
            ThreadZW Storefront Platform
          </span>
        </motion.div>

        {/* Major Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-white max-w-3xl mx-auto"
        >
          Build your fashion <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#c8ff00]">store in minutes.</span>
        </motion.h1>

        {/* Subheadline description */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-base sm:text-lg text-zinc-400 max-w-lg mx-auto mt-6"
        >
          Create a professional online shop for your clothing brand.
        </motion.p>

        {/* Dynamic CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto"
        >
          <button
            onClick={onStartFree}
            className="w-full sm:w-auto px-8 py-4 bg-[#c8ff00] text-black font-extrabold text-base rounded-xl hover:bg-[#b8ea00] active:scale-95 transition-all shadow-[0_4px_24px_rgba(200,255,0,0.2)] flex items-center justify-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 pointer-events-none" />
          </button>

          <button
            onClick={() => {
              window.open('/shop/demo', '_blank');
            }}
            className="w-full sm:w-auto px-6 py-4 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-sm rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            <span>View Demo Shop</span>
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </motion.div>

        {/* Zimbabwe Flag micro banner supporting text */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="text-xs text-zinc-500 mt-4 tracking-wide font-medium"
        >
          Built for Zimbabwean fashion businesses 🇿🇼
        </motion.p>

      </section>

      {/* SECTION 2: PREMIUM CATEGORY BADGES */}
      <section className="max-w-6xl mx-auto px-6 py-8 border-t border-b border-zinc-900 bg-zinc-950/20 relative z-10">
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-bold text-zinc-500 font-mono tracking-widest uppercase mb-4 text-center">
            Optimized for local apparel specialists
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {[
              'Fashion brands',
              'Thrift stores',
              'Sneaker sellers',
              'Boutiques'
            ].map((badge) => {
              const isActive = activeBadge === badge;
              return (
                <button
                  key={badge}
                  onClick={() => setActiveBadge(badge)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all duration-300 ${
                    isActive
                      ? 'bg-white/10 text-[#c8ff00] border-[#c8ff00]/40 shadow-[0_0_15px_rgba(200,255,0,0.06)] scale-102 font-bold'
                      : 'bg-zinc-900/30 text-zinc-400 border-zinc-900 hover:border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-ping" />}
                    {badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3 & INTERACTIVE PLAYGROUND DOCK */}
      {/* Dynamic side-by-side merchant dashboard vs buyer storefront demo */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT: Mini explanatory columns + Value breakdown */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-center gap-2 text-[#c8ff00] text-xs font-bold tracking-widest uppercase mb-2 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>Zero Latency Operations</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Instantly transform uploads into a custom store.
              </h2>
            </div>

            {/* Staggered cards explaining: Create, Add, Share */}
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  title: "1. Create your shop",
                  description: "Establish your custom handle, set your brand layout, styling background, logo, and active WhatsApp phone number.",
                  icon: Smartphone
                },
                {
                  id: 2,
                  title: "2. Add products",
                  description: "Upload detailed shots, customized sizing parameters, price lists, and toggle catalog categorizations instantly.",
                  icon: Plus
                },
                {
                  id: 3,
                  title: "3. Share your link",
                  description: "Secure your ready URL (e.g., threadzw.vercel.app/shop/hype) on Instagram, Tik Tok, and WhatsApp statuses.",
                  icon: Share2
                }
              ].map((step) => {
                const IconComponent = step.icon;
                return (
                  <div 
                    key={step.id}
                    className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all group duration-300"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:bg-[#c8ff00] group-hover:text-black transition-colors shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                          {step.title}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1 lines-relaxed leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Live Sandbox Showcase (Dashboard Auto-Publisher vs Customer Phone Live Feed) */}
          <div className="lg:col-span-7 bg-[#0b0c0e] rounded-3xl p-6 border border-zinc-900 relative shadow-2xl overflow-hidden min-h-[500px]">
            
            {/* Visual background indicator pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c8ff00]/[0.015] rounded-full blur-2xl" />

            {/* Sandbox Title / Interactive Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono text-zinc-400">
                  Live Simulator Playroom
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-600 bg-zinc-950 rounded px-2 py-0.5 border border-zinc-900">
                ACTIVE CONFIGURATION: {activeBadge.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Simulated Seller Dashboard Block (Columns 1-6) */}
              <div className="md:col-span-6 bg-[#0e1013] border border-zinc-800/80 rounded-2xl p-4 self-stretch flex flex-col justify-between min-h-[400px]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <span className="text-[#c8ff00]">▲</span> Creator Terminal
                    </span>
                    <span className="text-[9px] text-[#c8ff00] font-mono bg-[#c8ff00]/10 px-2 py-0.5 rounded-full border border-[#c8ff00]/10">
                      Merchant view
                    </span>
                  </div>

                  {/* Creator Form */}
                  <div className="space-y-3 pt-1">
                    
                    {/* Simulated Image Uploader */}
                    <div className="border border-dashed border-zinc-900 rounded-xl p-3 bg-zinc-950/80 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                      <img 
                        src={selectedPhoto} 
                        alt="Product upload template" 
                        className="absolute inset-0 w-full h-full object-cover brightness-[0.2]" 
                      />
                      <div className="relative z-10 flex flex-col items-center py-2">
                        <Upload className="w-4 h-4 text-[#c8ff00] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[9.5px] text-zinc-400 font-semibold">Image locked to {activeBadge}</span>
                      </div>
                    </div>

                    {/* Title input field */}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-1 font-mono">Product Name</label>
                      <div className="h-9 px-3 bg-zinc-950 border border-zinc-900 rounded-lg flex items-center text-xs font-medium text-white">
                        {typedTitle || <span className="text-zinc-600">e.g. Graphic Hoodie</span>}
                        {stageStep === 1 && <span className="w-1.5 h-3.5 bg-[#c8ff00] ml-1 animate-pulse" />}
                      </div>
                    </div>

                    {/* Price Input field */}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-1 font-mono">Price (USD)</label>
                      <div className="h-9 px-3 bg-zinc-950 border border-zinc-900 rounded-lg flex items-center text-xs font-semibold text-zinc-300">
                        {typedPrice || <span className="text-zinc-600">$0.00</span>}
                        {stageStep === 2 && <span className="w-1.5 h-3.5 bg-[#c8ff00] ml-1 animate-pulse" />}
                      </div>
                    </div>

                    {/* Category Selection mock */}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-1 font-mono">Active Catalog Section</label>
                      <div className="h-8 px-2 bg-zinc-950/60 border border-zinc-900 rounded-lg flex items-center text-[10px] text-zinc-400 justify-between">
                        <span>{activeBadge === 'Thrift stores' ? 'Vintage Selection' : activeBadge === 'Sneaker sellers' ? 'Footwear catalog' : 'New Collection'}</span>
                        <span className="text-[8px] text-zinc-600">▼</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Publish Action button */}
                <div className="pt-4">
                  <button 
                    disabled
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                      isPublishing 
                        ? 'bg-[#c8ff00]/15 text-[#c8ff00] border border-[#c8ff00]/20'
                        : isPublished
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {isPublishing ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-t-transparent border-[#c8ff00] animate-spin" />
                        Deploying entity to node...
                      </>
                    ) : isPublished ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Live on catalog!
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Draft Product
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Simulated Customer Storefront (Columns 7-12) */}
              {/* iPhone floating mockup interface representation */}
              <div className="md:col-span-6 bg-black border-4 border-zinc-800 rounded-[2.5rem] shadow-3xl overflow-hidden relative min-h-[400px] flex flex-col justify-between">
                
                {/* iPhone Notch speaker line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-800 rounded-b-xl z-30 flex items-center justify-center">
                  <div className="w-10 h-1 bg-zinc-900 rounded-full" />
                </div>

                {/* Store Header bar */}
                <div className="bg-[#0b0b0c] pt-7 pb-2 px-3 border-b border-zinc-900 z-10">
                  <div className="flex items-center gap-1.5 justify-center mb-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#c8ff00]/20 flex items-center justify-center border border-[#c8ff00]/20">
                      <span className="text-[10px] text-[#c8ff00] font-black italic">T</span>
                    </div>
                    <span className="text-[10.5px] uppercase tracking-widest font-mono text-zinc-400 font-bold">
                      ThreadZW store
                    </span>
                  </div>
                  
                  {/* Category slider animation simulated representation */}
                  <div className="flex gap-1 overflow-x-hidden pt-1.5 pb-0.5 justify-center">
                    {['All', 'Essential', activeBadge === 'Sneaker sellers' ? 'Footwear' : 'Featured'].map((cat, clickI) => (
                      <span 
                        key={cat} 
                        className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          clickI === 0 ? 'bg-[#c8ff00] text-black' : 'bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Screen content area showing published products and scroll list */}
                <div className="flex-1 bg-black p-3 space-y-3 overflow-y-auto max-h-[260px] custom-small-scroll relative">
                  
                  {/* Simulated interactive live WhatsApp order overlay toast */}
                  <AnimatePresence>
                    {waToast && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-2 left-2 right-2 bg-[#c8ff00] text-black text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-xl z-40 flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3 h-3 text-black shrink-0" />
                        <span className="truncate">{waToast}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* List of Simulated Storefront Apparel Items */}
                  <div className="grid grid-cols-2 gap-2">
                    {simulatedProducts.map((p) => (
                      <motion.div
                        layoutId={`grid-${p.id}`}
                        key={p.id}
                        className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden p-1.5 flex flex-col justify-between"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 mb-1">
                          <img src={p.img} alt={p.title} className="w-full h-full object-cover" />
                          <span className="absolute top-1 left-1 bg-black/60 text-[#c8ff00] text-[7.5px] font-mono px-1 rounded">
                            {p.category}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-[9px] font-bold text-white truncate">{p.title}</h5>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[9.5px] font-extrabold text-[#c8ff00] font-mono">{p.price}</span>
                            <button
                              onClick={() => handleSimulateOrder(p.title)}
                              className="bg-zinc-900 hover:bg-[#c8ff00] hover:text-black hover:scale-105 active:scale-95 transition-all text-zinc-400 p-1 rounded text-[7px] font-extrabold uppercase mt-0.5"
                            >
                              Order
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                </div>

                {/* iPhone home bar mock */}
                <div className="bg-[#0b0b0c] border-t border-zinc-900/60 p-2 flex justify-center items-center">
                  <div className="w-16 h-1 bg-zinc-700 rounded-full" />
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: STOREFRONT CATALOG CAROUSEL / SHOWCASE */}
      <section className="bg-[#090a0d] border-t border-b border-zinc-900/80 py-20 px-6 relative overflow-hidden z-10">
        
        {/* Soft decorative blurred background spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-[radial-gradient(circle,rgba(200,255,0,0.015),transparent_70%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center mb-12">
          <p className="text-[10px] font-extrabold text-[#c8ff00] tracking-widest font-mono uppercase mb-2">
            STREET CATALOG PREVIEW
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-2">
            Your customers see this.
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            A clean, responsive directory catalog designed to load in seconds even on limited bandwidth.
          </p>
        </div>

        {/* Marquee-style sliding track of products */}
        <div className="relative w-full overflow-hidden py-4">
          
          {/* Fading side absolute overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#090a0d] to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#090a0d] to-transparent z-20 pointer-events-none" />

          {/* Endless loop scrolling track container */}
          <div className="flex gap-4 w-max animate-infinite-scroll">
            
            {/* Repeated twice for flawless endless looping */}
            {[...autoScrollDemoyProducts, ...autoScrollDemoyProducts].map((p, idx) => (
              <div 
                key={idx}
                className="w-56 shrink-0 bg-zinc-950 border border-zinc-900 rounded-2xl p-2 bg-gradient-to-br from-zinc-950 to-zinc-900/60 hover:scale-102 transition-transform duration-300 group"
              >
                <div className="aspect-[4/5] rounded-xl overflow-hidden bg-zinc-900 mb-2 relative">
                  <img 
                    src={p.img} 
                    alt={p.name} 
                    className="w-full h-full object-cover brightness-[0.9] group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur border border-white/5 rounded-lg px-2 py-0.5 text-[8.5px] text-zinc-400 text-sans font-mono">
                    @{p.shop}
                  </div>
                </div>

                <div className="px-1 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">
                    ThreadZW item
                  </span>
                  <h4 className="text-xs text-zinc-200 font-bold truncate group-hover:text-white transition-colors">
                    {p.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-extrabold text-[#c8ff00] font-mono">{p.price}</span>
                    <span className="text-[9px] uppercase tracking-widest text-[#c8ff00] font-bold border border-[#c8ff00]/10 px-1.5 py-0.5 bg-[#c8ff00]/5 rounded font-mono">
                      Available
                    </span>
                  </div>
                </div>
              </div>
            ))}

          </div>

        </div>

      </section>

      {/* METICULOUS VISUAL VALUE COMPARISONS (Why ThreadZW?) */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 relative z-10">
        
        <div className="text-center mb-12">
          <p className="text-[10px] font-extrabold text-[#c8ff00] tracking-widest uppercase font-mono mb-2">
            OPERATIONAL EXCELLENCE
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Zimbabwe's First Optimized Fashion Gateway
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Legacy Instagram selling system analysis */}
          <div className="p-8 rounded-2xl bg-[#0d0c0e] border border-zinc-900 hover:border-red-950/40 transition-colors duration-300">
            <span className="text-[9px] font-bold tracking-widest uppercase font-mono text-zinc-500 bg-zinc-950 border border-zinc-900 px-3 py-1 rounded-full">
              Traditional IG Sales Model
            </span>
            <h3 className="text-xl font-bold text-zinc-300 mt-4 mb-6">
              DMs, chaos, and lost transactions.
            </h3>
            
            <div className="space-y-4">
              {[
                { title: 'No price tags', desc: 'Sellers force customers to "DM for price", causing friction and loss of immediate customer interest.' },
                { title: 'Slow response times', desc: 'Potential clients have to wait hours or days for size checks and catalogs, losing purchase intent.' },
                { title: 'Scattered payment instructions', desc: 'No structured checkout or systematic WhatsApp bridge leads to transaction confusion.' }
              ].map((p, clickI) => (
                <div key={clickI} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-950/50 border border-red-900/60 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] text-red-500 font-bold">✕</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-300">{p.title}</h5>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ThreadZW Optimized Model */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900/30 border border-zinc-900/90 hover:border-[#c8ff00]/20 transition-all duration-300 relative overflow-hidden group">
            
            {/* Absolute accent highlight */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#c8ff00]/[0.01] rounded-full blur-xl pointer-events-none" />

            <span className="text-[9px] font-bold tracking-widest uppercase font-mono text-[#c8ff00] bg-[#c8ff00]/10 border border-[#c8ff00]/10 px-3 py-1 rounded-full">
              The ThreadZW Gateway
            </span>
            <h3 className="text-xl font-bold text-white mt-4 mb-6">
              Instant browsing and seamless checkouts.
            </h3>
            
            <div className="space-y-4">
              {[
                { title: 'Unrestricted transparency', desc: 'Customers see active sizes, categorization tags, and precise pricing up front without DMs.' },
                { title: 'Pre-filled WhatsApp carts', desc: 'Customers lock their catalog choices and tap to instantly send pre-formatted order details to your phone.' },
                { title: 'High resolution portfolios', desc: 'Beautiful display cards showcasing clothing with interactive zoom and crisp mobile delivery.' }
              ].map((p, clickI) => (
                <div key={clickI} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#c8ff00]/10 border border-[#c8ff00]/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-[#c8ff00]" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{p.title}</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </section>

      {/* SECTION 5: FINAL CTA ACTION PANEL */}
      <section className="max-w-6xl mx-auto px-6 py-20 relative z-10">
        <div className="w-full bg-gradient-to-br from-zinc-950 to-zinc-900/60 rounded-3xl p-8 md:p-14 border border-zinc-900/80 text-center relative overflow-hidden">
          
          {/* Subtle green ambient spot */}
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(200,255,0,0.04),transparent_60%)] pointer-events-none" />

          {/* Subtitle / badge */}
          <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-ping" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono">
              Free during beta phase
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-widest text-[#f4f4f5] max-w-2xl mx-auto leading-tight">
            Start building today.
          </h2>
          
          <p className="text-zinc-400 text-sm md:text-base max-w-md mx-auto mt-4 leading-relaxed">
            Take your business entity live on our global fashion node. Upload unlimited garments. No configuration required.
          </p>

          <div className="mt-8">
            <button
              onClick={onStartFree}
              className="px-8 py-4 bg-[#c8ff00] hover:bg-[#b8ea00] active:scale-95 transition-all text-black font-extrabold text-base rounded-xl shadow-[0_4px_24px_rgba(200,255,0,0.25)] flex items-center justify-center gap-2 mx-auto uppercase tracking-wide duration-200"
            >
              Create Your Shop
              <ArrowRight className="w-4 h-4 pointer-events-none" />
            </button>
          </div>

          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-6">
            Instant deployment • No card credentials required • Zimbabwe Fashion Marketplace.
          </p>
        </div>
      </section>

      {/* DETAILED FAQ BLOCK */}
      <section className="max-w-3xl mx-auto px-6 pb-20 relative z-10">
        <h3 className="text-xl font-bold uppercase tracking-widest font-mono text-zinc-300 text-center mb-8 flex items-center justify-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#c8ff00]" />
          Frequently Asked Questions
        </h3>
        
        <div className="space-y-3">
          {[
            {
              q: "Is ThreadZW really free?",
              a: "Yes. Our platform is currently 100% free with no registration costs, fee percentages, or subscription rates. This lets you setup shops, test design configurations, and collect orders at zero cost during our launch."
            },
            {
              q: "Do customer transactions happen inside the app?",
              a: "ThreadZW creates a structured mobile directory. When customers select garments, sizes, and quantities, the app wraps the final choice details and bridges them straight to your WhatsApp. You handle final EcoCash mobile transfers, bank wires, or cash payments directly with the customer."
            },
            {
              q: "Can I customise my shop's styling layout?",
              a: "Absolutely. Through your custom Seller Dashboard, you can design your matching logo, set up background banners, choose cover images for your specific categories, catalog pricing, and order layouts easily."
            },
            {
              q: "Is any credit card/payment signup required?",
              a: "No credit cards, physical payment signups, or authorization deposits are requested. Simply register your phone entity, verify, and start publishing products immediately."
            }
          ].map((item, i) => (
            <div 
              key={i}
              className="bg-zinc-950/60 border border-zinc-905 rounded-xl p-5 hover:border-zinc-800 transition-colors"
            >
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span className="text-[#c8ff00] font-mono">Q.</span> {item.q}
              </h4>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#040405] border-t border-zinc-900/80 py-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col items-center md:items-start gap-2">
            <img 
              src="https://4htrv9mv32e5k648.public.blob.vercel-storage.com/file_000000009c74724684851106c3e2946c.png" 
              alt="ThreadZW Logo" 
              referrerPolicy="no-referrer"
              className="h-6 w-auto object-contain" 
            />
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider mt-1">
              Zimbabwe's Professional Fashion Node © {new Date().getFullYear()}
            </p>
          </div>

          <div className="flex gap-4 text-xs text-zinc-500 font-medium font-mono uppercase tracking-[0.15em]">
            {['Terms', 'Privacy', 'Contact'].map(link => (
              <span 
                key={link} 
                className="hover:text-white transition-colors duration-200 cursor-pointer"
              >
                {link}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* Infinitely sliding track custom CSS styles injection */}
      <style>{`
        @keyframes infinite-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-50% - 1.5rem));
          }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll 35s linear infinite;
        }
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
        .custom-small-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-small-scroll::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-small-scroll::-webkit-scrollbar-thumb {
          background: #c8ff00;
          border-radius: 99px;
        }
      `}</style>

    </div>
  );
};
