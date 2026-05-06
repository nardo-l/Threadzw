import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  Store, 
  TrendingUp, 
  Users, 
  Package, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Instagram, 
  MessageCircle,
  Rocket,
  ChevronDown,
  Copy,
  LayoutGrid,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInventory } from '../context/InventoryContext';
import { useSubscription } from '../context/SubscriptionContext';
import { toast } from 'sonner';

import { SHOP_CATEGORIES, ZIMBABWE_TOWNS } from '../constants';

const AREAS = ZIMBABWE_TOWNS;

const INSPIRATION_CHIPS = [
  "Specialising in authentic sneakers",
  "Best prices in Harare",
  "Deadstock and pre-loved items",
  "DM for custom orders"
];

export const SellerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { setShopDraft, shopDraft } = useInventory();
  const { setPaywallType } = useSubscription();
  
  // Logic state moves to component level for better visibility
  const [phase, setPhase] = useState<'A' | 'B'>(() => {
    // Check if user already has a draft, if so skip Phase A
    try {
      const localDraftRaw = localStorage.getItem('thread_shop_draft');
      if (localDraftRaw && localDraftRaw !== 'undefined' && localDraftRaw !== 'null') {
        return 'B';
      }
    } catch (e) {}
    return 'A';
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const prevHandle = useRef('');
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  // Form State
  const [formData, setFormData] = useState(() => {
    const defaults = {
      name: '',
      handle: '',
      logoUrl: '',
      bannerUrl: '',
      categories: [],
      description: '',
      area: '',
      landmark: '',
      directions: '',
      onlineOnly: false,
      deliveryInfo: '',
      whatsapp: '',
      instagram: '',
      tradingHours: {
        Mon: { isOpen: true, from: '09:00', to: '18:00' },
        Tue: { isOpen: true, from: '09:00', to: '18:00' },
        Wed: { isOpen: true, from: '09:00', to: '18:00' },
        Thu: { isOpen: true, from: '09:00', to: '18:00' },
        Fri: { isOpen: true, from: '09:00', to: '18:00' },
        Sat: { isOpen: true, from: '09:00', to: '18:00' },
        Sun: { isOpen: false, from: '09:00', to: '18:00' },
      }
    };

    try {
      const localDraftRaw = localStorage.getItem('thread_shop_draft');
      let activeDraft = shopDraft;
      
      if (!activeDraft && localDraftRaw && localDraftRaw !== 'undefined') {
        activeDraft = JSON.parse(localDraftRaw);
      }

      if (activeDraft && typeof activeDraft === 'object') {
        return {
          ...defaults,
          ...activeDraft,
          categories: Array.isArray(activeDraft.categories) ? activeDraft.categories : [],
          tradingHours: (activeDraft.tradingHours && typeof activeDraft.tradingHours === 'object') 
            ? { ...defaults.tradingHours, ...activeDraft.tradingHours } 
            : defaults.tradingHours
        };
      }
    } catch (e) {
      console.error('Error initializing onboarding form data:', e);
    }
    
    return defaults;
  });

  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [showAreaSheet, setShowAreaSheet] = useState(false);

  // Sync shopDraft with local storage/context only on specific changes or unmount
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShopDraft(formData);
    }, 1000); // Debounce sync to context
    return () => clearTimeout(timeout);
  }, [formData, setShopDraft]);

  // Handle Availability Mock
  useEffect(() => {
    if (!formData.handle) {
      setHandleStatus('idle');
      return;
    }
    setHandleStatus('checking');
    const timer = setTimeout(() => {
      if (['solekinghr', 'urbanthread'].includes(formData.handle.toLowerCase())) {
        setHandleStatus('taken');
      } else {
        setHandleStatus('available');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.handle]);

  useEffect(() => {
    console.log('SellerOnboarding mounted, phase:', phase, 'currentStep:', currentStep);
  }, [phase, currentStep]);

  const handleBack = () => {
    if (phase === 'B' && currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (phase === 'B' && currentStep === 1) {
      setPhase('A');
      setCurrentSlide(5);
    } else if (phase === 'A' && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    } else {
      navigate(-1);
    }
  };

  const handleNextSlide = () => {
    if (currentSlide < 5) {
      setCurrentSlide(currentSlide + 1);
    } else {
      startPhaseB();
    }
  };

  const startPhaseB = () => {
    console.log('Transitioning to Phase B...');
    setIsTransitioning(true);
    setTimeout(() => {
      setPhase('B');
      setIsTransitioning(false);
      setCurrentSlide(0); // Reset slide for good measure
    }, 500);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (cat: string) => {
    const currentCats = formData.categories || [];
    const newCats = currentCats.includes(cat)
      ? currentCats.filter((c: string) => c !== cat)
      : [...currentCats, cat];
    updateFormData('categories', newCats);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStart.current - touchEnd.current > 50) {
      handleNextSlide();
    }
    if (touchEnd.current - touchStart.current > 50 && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (isTransitioning) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 animate-bounce">
          <Rocket size={40} />
        </div>
        <h1 className="text-4xl font-syne font-bold text-white mb-2">Almost ready!</h1>
        <p className="text-muted font-sans max-w-[240px]">Setting up your shop's dashboard and branding...</p>
        <div className="mt-8 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    );
  }

  if (phase === 'A') {
    const slides = [
      {
        title: "Sell to",
        highlight: "Zimbabwe.",
        body: "Your shop gets discovered by thousands of buyers across Harare, Bulawayo, and beyond. No marketing needed.",
        bg: "radial-gradient(circle at center, rgba(247, 37, 133, 0.05) 0%, transparent 70%)",
        visual: (
          <div className="bg-card p-4 rounded-card border border-white/5 shadow-2xl flex gap-3">
            <div className="flex-1 bg-elevated rounded-xl p-2 flex flex-col gap-2">
              <div className="h-20 bg-gradient-to-br from-primary/20 to-purple/20 rounded-lg shimmer relative overflow-hidden">
                <span className="absolute top-1 left-1 bg-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white">NEW</span>
              </div>
              <div className="h-2 w-12 bg-white/10 rounded-full" />
              <div className="h-2 w-8 bg-white/5 rounded-full" />
            </div>
            <div className="flex-1 bg-elevated rounded-xl p-2 flex flex-col gap-2">
              <div className="h-20 bg-gradient-to-br from-primary/20 to-purple/20 rounded-lg shimmer relative overflow-hidden">
                <span className="absolute top-1 left-1 bg-amber text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white">HOT</span>
              </div>
              <div className="h-2 w-12 bg-white/10 rounded-full" />
              <div className="h-2 w-8 bg-white/5 rounded-full" />
            </div>
          </div>
        )
      },
      {
        title: "Open in",
        highlight: "2 Minutes.",
        body: "Name your shop, pick your category, and you're live. No website. No tech skills. Just hustle.",
        bg: "radial-gradient(circle at bottom right, rgba(114, 9, 183, 0.1) 0%, transparent 70%)",
        visual: (
          <div className="bg-card p-6 rounded-card border border-primary/20 shadow-2xl flex flex-col gap-4">
            <div className="w-full h-40 border-2 border-primary/30 rounded-3xl p-4 flex flex-col gap-3">
              <div className="h-8 w-full bg-white/5 rounded-lg border border-white/10 flex items-center px-3">
                <span className="text-[10px] text-muted">Shop Name</span>
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-primary/20 rounded-full border border-primary/30" />
                <div className="h-6 w-16 bg-white/5 rounded-full border border-white/10" />
              </div>
              <div className="mt-auto h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full" />
              </div>
            </div>
            <div className="text-[10px] font-mono text-primary text-center">thread.zw/yourshop</div>
          </div>
        )
      },
      {
        title: "Know Your",
        highlight: "Numbers.",
        body: "See exactly what's selling, when it's selling, and what customers are searching for but can't find.",
        bg: "radial-gradient(circle at top left, rgba(74, 222, 128, 0.05) 0%, transparent 70%)",
        visual: (
          <div className="bg-card p-5 rounded-card border border-white/5 shadow-2xl flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 p-2 rounded-lg flex flex-col items-center">
                <span className="text-[8px] text-muted uppercase">Revenue</span>
                <span className="text-xs font-bold text-gold">$1,240</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg flex flex-col items-center">
                <span className="text-[8px] text-muted uppercase">Orders</span>
                <span className="text-xs font-bold text-green">34</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg flex flex-col items-center">
                <span className="text-[8px] text-muted uppercase">Views</span>
                <span className="text-xs font-bold text-blue">428</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-12 px-2">
              {[4, 7, 5, 8, 6, 9, 7].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/40 rounded-t-sm" style={{ height: `${h * 10}%` }} />
              ))}
            </div>
            <div className="bg-green/10 text-green text-[8px] font-bold px-2 py-1 rounded-full self-end">↑ 18% this week</div>
          </div>
        )
      },
      {
        title: "Let Others",
        highlight: "Sell For You.",
        body: "Enable affiliates and let students, influencers, and hustlers sell your products. You set the commission. They do the work.",
        bg: "radial-gradient(circle at center, rgba(114, 9, 183, 0.05) 0%, transparent 70%)",
        visual: (
          <div className="relative h-48 flex items-center justify-center">
            <div className="bg-card p-4 rounded-card border border-primary/30 shadow-2xl z-10">
              <div className="flex items-center gap-2">
                <span className="text-lg">👟</span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    SoleKing HRE <Check size={10} className="text-primary" />
                  </div>
                  <div className="text-[8px] text-muted font-mono">thread.zw/solekinghr</div>
                </div>
              </div>
            </div>
            {/* Dotted lines and avatars */}
            <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center text-lg">👤</div>
            <div className="absolute bottom-4 left-12 w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center text-lg">👤</div>
            <div className="absolute top-12 right-4 w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center text-lg">👤</div>
            <div className="absolute top-1/2 right-1/4 bg-amber text-black text-[8px] font-bold px-2 py-1 rounded-full z-20">Commission: 10%</div>
          </div>
        )
      },
      {
        title: "Stock That",
        highlight: "Makes Sense.",
        body: "Mark items sold in seconds. Buyers always see what's available in real time. No more 'is this still available?' messages.",
        bg: "radial-gradient(circle at bottom left, rgba(251, 191, 36, 0.05) 0%, transparent 70%)",
        visual: (
          <div className="bg-card p-5 rounded-card border border-white/5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
              <span className="text-xs font-mono text-white">UK 8</span>
              <span className="text-[10px] text-green flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green" /> In Stock (3)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-amber/30">
              <span className="text-xs font-mono text-white">UK 9</span>
              <span className="text-[10px] text-amber flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber" /> Only 2 left</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
              <span className="text-xs font-mono text-white">UK 10</span>
              <span className="text-[10px] text-red flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red" /> Last 1!</span>
            </div>
            <button className="w-full py-2 bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20 mt-2">Mark as Sold</button>
          </div>
        )
      },
      {
        title: "Your Shop.",
        highlight: "Your Brand.",
        body: "Your own shop link — thread.zw/yourshop — and a storefront that looks professional from day one.",
        bg: "linear-gradient(135deg, #f72585, #7209b7)",
        visual: (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1 text-2xl font-mono text-white">
                <span>thread.zw/</span>
                <span className="font-pacifico text-3xl">yourshop</span>
                <div className="w-0.5 h-8 bg-white animate-pulse" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-card border border-white/20 w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">🏪</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">Your Shop Name</div>
                  <div className="text-[10px] text-white/60">0 products · 0 followers</div>
                </div>
                <div className="px-4 py-1.5 bg-white text-black text-[10px] font-bold rounded-full">Follow</div>
              </div>
            </div>
          </div>
        )
      }
    ];

    const slide = slides[currentSlide] || slides[0] || { bg: '#0d0d0d', visual: null, title: '', highlight: '', body: '' };

    return (
      <div 
        className="flex flex-col min-h-screen relative overflow-hidden"
        style={{ background: (slide.bg && slide.bg.includes('gradient')) ? slide.bg : '#0d0d0d' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <header className="p-6 flex justify-between items-center z-20">
          <button 
            onClick={() => currentSlide > 0 ? setCurrentSlide(currentSlide - 1) : navigate(-1)}
            className="text-white/70"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="w-6" /> {/* Spacer instead of skip */}
        </header>

        {/* Content */}
        <main className="flex-1 flex flex-col px-8 pt-12 z-10">
          <div className="h-1/2 flex items-center justify-center">
            <motion.div 
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-xs"
            >
              {slide.visual}
            </motion.div>
          </div>

          <div className="h-1/2 flex flex-col pt-8">
            <motion.div
              key={`text-${currentSlide}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2"
            >
              <span className="text-base font-sans text-white">{slide.title}</span>
              <h2 className={`text-[42px] font-pacifico leading-none ${currentSlide === 5 ? 'text-white' : 'text-primary'}`}>
                {slide.highlight}
              </h2>
              <p className={`text-sm leading-relaxed mt-4 ${currentSlide === 5 ? 'text-white/80' : 'text-muted'}`}>
                {slide.body}
              </p>
              {currentSlide === 3 && (
                <div className="mt-2 inline-block self-start px-2 py-0.5 border border-amber/30 text-amber text-[8px] font-mono uppercase tracking-widest rounded-full">
                  Coming in V2
                </div>
              )}
            </motion.div>

            <div className="mt-auto pb-12 flex flex-col gap-8">
              {/* Progress Dots */}
              <div className="flex justify-center gap-2">
                {slides.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'
                    }`} 
                  />
                ))}
              </div>

              <button 
                onClick={handleNextSlide}
                className={`w-full py-4 rounded-pill font-bold shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  currentSlide === 5 ? 'bg-white text-black font-syne' : 'bg-primary text-white font-sans'
                }`}
              >
                {currentSlide === 5 ? 'Set Up My Shop' : 'Next'} <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData('bannerUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // PHASE B - SHOP SETUP FORM
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-pacifico text-white">Identity</h1>
              <p className="text-sm text-muted">Set up your shop's visual brand</p>
            </div>

            {/* Banner & Logo Unit */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                {/* Banner */}
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                  <div className={`w-full h-[140px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden ${
                    formData.bannerUrl ? 'border-primary' : 'border-primary/40 bg-primary/5'
                  }`}>
                    {formData.bannerUrl ? (
                      <img src={formData.bannerUrl || undefined} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <LayoutGrid size={20} />
                        </div>
                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Shop Banner</span>
                      </>
                    )}
                  </div>
                </label>

                {/* Logo (Overlapping) */}
                <div className="absolute -bottom-10 left-6">
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <div className={`w-20 h-20 rounded-full border-4 border-background flex flex-col items-center justify-center gap-1 transition-all overflow-hidden shadow-xl ${
                      formData.logoUrl ? 'border-primary' : 'border-primary/40 bg-elevated'
                    }`}>
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl || undefined} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="text-primary" size={20} />
                          <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Logo</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
              <div className="mt-10 flex flex-col gap-1">
                <p className="text-[10px] font-mono text-muted uppercase tracking-widest">This is how your shop header will look</p>
                {!formData.logoUrl && <p className="text-[10px] text-primary font-bold">Add your shop photo to continue</p>}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest ml-1">Shop Name</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 40);
                      updateFormData('name', val);
                      if (!formData.handle || formData.handle === prevHandle.current) {
                        const handle = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        updateFormData('handle', handle);
                        prevHandle.current = handle;
                      }
                    }}
                    placeholder="e.g. SoleKing HRE"
                    className="w-full bg-elevated border border-white/5 rounded-input p-4 text-white focus:border-primary outline-none transition-all"
                  />
                  <span className="absolute right-4 top-4 text-[10px] font-mono text-muted">{formData.name.length}/40</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest ml-1">Your shop link</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-primary font-mono text-sm">thread.zw/</div>
                  <input 
                    type="text"
                    value={formData.handle}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      updateFormData('handle', val);
                    }}
                    className="w-full bg-elevated border border-white/5 rounded-input p-4 pl-24 text-white focus:border-primary outline-none transition-all font-mono text-sm"
                  />
                  <div className="absolute right-4">
                    {handleStatus === 'checking' && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                    {handleStatus === 'available' && <Check size={18} className="text-green" />}
                    {handleStatus === 'taken' && <X size={18} className="text-red" />}
                  </div>
                </div>
              </div>
            </div>

            <button 
              disabled={!formData.name || !formData.logoUrl || handleStatus !== 'available'}
              onClick={() => setCurrentStep(2)}
              className="mt-auto w-full py-4 bg-primary text-white font-bold rounded-pill shadow-xl disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
            >
              Continue →
            </button>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-10 duration-500">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-pacifico text-white">What do you sell?</h1>
              <p className="text-sm text-muted">Select all that apply</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {SHOP_CATEGORIES.map(cat => {
                const isSelected = (formData.categories || []).includes(cat.label);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.label)}
                    className={`px-6 py-3 rounded-pill border transition-all flex items-center gap-2 ${
                      isSelected ? 'bg-primary border-primary text-white' : 'bg-card border-white/10 text-muted'
                    }`}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Describe your shop</label>
                <div className="relative">
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value.slice(0, 300))}
                    placeholder="Tell buyers what you sell, what makes your shop special, where you're based..."
                    className="w-full bg-elevated border border-white/5 rounded-input p-4 text-white focus:border-primary outline-none transition-all resize-none"
                  />
                  <span className="absolute right-4 bottom-4 text-[10px] font-mono text-muted">{formData.description.length}/300</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Inspiration</span>
                <div className="flex flex-wrap gap-2">
                  {INSPIRATION_CHIPS.map(chip => (
                    <button
                      key={chip}
                      onClick={() => updateFormData('description', (formData.description + ' ' + chip).trim().slice(0, 300))}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-light hover:bg-white/10 transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              disabled={(formData.categories || []).length === 0}
              onClick={() => setCurrentStep(3)}
              className="mt-auto w-full py-4 bg-primary text-white font-bold rounded-pill shadow-xl disabled:opacity-50 transition-all active:scale-95"
            >
              Continue →
            </button>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-10 duration-500 pb-12">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-pacifico text-white">Where are you?</h1>
              <p className="text-sm text-muted">Buyers use this to find and visit your shop</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-card rounded-card border border-white/5">
              <span className="text-sm font-medium text-white">My shop is online only</span>
              <button 
                onClick={() => updateFormData('onlineOnly', !formData.onlineOnly)}
                className={`w-12 h-6 rounded-full transition-all relative ${formData.onlineOnly ? 'bg-primary' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.onlineOnly ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {formData.onlineOnly ? (
              <div className="flex flex-col gap-2 animate-in fade-in duration-500">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Delivery Information</label>
                <textarea 
                  rows={3}
                  value={formData.deliveryInfo}
                  onChange={(e) => updateFormData('deliveryInfo', e.target.value)}
                  placeholder="Describe how you deliver — e.g. CountryWide delivery via Pathfinder Couriers. Pay on WhatsApp first."
                  className="w-full bg-elevated border border-white/5 rounded-input p-4 text-white focus:border-primary outline-none transition-all resize-none"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Area</label>
                  <button 
                    onClick={() => setShowAreaSheet(true)}
                    className="w-full bg-elevated border border-white/5 rounded-input p-4 text-white flex items-center justify-between"
                  >
                    <span>{formData.area || 'Select Area'}</span>
                    <ChevronDown size={18} className="text-muted" />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Landmark / Address</label>
                  <input 
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => updateFormData('landmark', e.target.value.slice(0, 100))}
                    placeholder="e.g. Eastlea Shopping Centre, Shop 14"
                    className="w-full bg-elevated border border-white/5 rounded-input p-4 text-white focus:border-primary outline-none transition-all"
                  />
                  <span className="text-[8px] font-mono text-muted uppercase">Short description of your exact location</span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-muted uppercase tracking-widest">How to get there</label>
                  <div className="relative">
                    <textarea 
                      rows={5}
                      value={formData.directions}
                      onChange={(e) => updateFormData('directions', e.target.value.slice(0, 500))}
                      placeholder="Give step-by-step directions from a nearby landmark. e.g. From Eastlea roundabout head south on Samora Machel, turn left at Shell garage..."
                      className="w-full bg-elevated border border-white/5 rounded-input p-4 text-white focus:border-primary outline-none transition-all resize-none"
                    />
                    <span className="absolute right-4 bottom-4 text-[10px] font-mono text-muted">{formData.directions.length}/500</span>
                  </div>
                  <span className="text-[8px] font-mono text-muted italic">The more detail the better — this replaces Google Maps for your customers</span>
                </div>

                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Trading Hours</label>
                  <div className="flex flex-col gap-3">
                    {Object.entries(formData.tradingHours || {}).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white w-12">{day}</span>
                        <div className="flex items-center gap-4">
                          {hours.isOpen ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                value={hours.from} 
                                onChange={(e) => {
                                  const newHours = { ...formData.tradingHours, [day]: { ...hours, from: e.target.value } };
                                  updateFormData('tradingHours', newHours);
                                }}
                                className="w-16 bg-elevated border border-white/5 rounded-lg p-2 text-xs text-center focus:border-primary outline-none" 
                              />
                              <span className="text-muted">-</span>
                              <input 
                                type="text" 
                                value={hours.to} 
                                onChange={(e) => {
                                  const newHours = { ...formData.tradingHours, [day]: { ...hours, to: e.target.value } };
                                  updateFormData('tradingHours', newHours);
                                }}
                                className="w-16 bg-elevated border border-white/5 rounded-lg p-2 text-xs text-center focus:border-primary outline-none" 
                              />
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-muted uppercase">Closed</span>
                          )}
                          <button 
                            onClick={() => {
                              const newHours = { ...formData.tradingHours, [day]: { ...hours, isOpen: !hours.isOpen } };
                              updateFormData('tradingHours', newHours);
                            }}
                            className={`w-10 h-5 rounded-full relative transition-all ${hours.isOpen ? 'bg-primary' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hours.isOpen ? 'left-5.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button 
              disabled={formData.onlineOnly ? !formData.deliveryInfo : (!formData.area || !formData.landmark || !formData.directions)}
              onClick={() => setCurrentStep(4)}
              className="mt-auto w-full py-4 bg-primary text-white font-bold rounded-pill shadow-xl disabled:opacity-50 transition-all active:scale-95"
            >
              Continue →
            </button>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-10 duration-500">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-pacifico text-white">How can buyers reach you?</h1>
              <p className="text-sm text-muted">This is how customers will contact you about orders</p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest flex items-center gap-1">
                  WhatsApp Number <span className="text-red">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-muted font-mono text-sm">+263</div>
                  <input 
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => updateFormData('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="771 234 567"
                    className="w-full bg-elevated border border-white/5 rounded-input p-4 pl-16 text-white focus:border-primary outline-none transition-all font-mono"
                  />
                </div>
                <span className="text-[8px] font-mono text-muted uppercase">Buyers will use this to enquire about your products</span>
              </div>

              {formData.whatsapp.length === 9 && (
                <div className="bg-elevated p-4 rounded-card border-l-4 border-green flex gap-4 animate-in fade-in duration-500">
                  <MessageCircle className="text-green flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-white font-medium italic">"Hi, I'm interested in [product] from Thread ZW. Is it available?"</p>
                    <span className="text-[8px] font-mono text-muted uppercase">This is what buyers will see when they tap WhatsApp</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Instagram Handle</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-muted font-mono text-sm">@</div>
                  <input 
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => updateFormData('instagram', e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="yourshopname"
                    className="w-full bg-elevated border border-white/5 rounded-input p-4 pl-10 text-white focus:border-primary outline-none transition-all font-mono"
                  />
                </div>
                <span className="text-[8px] font-mono text-muted uppercase">Optional — shown on your shop profile</span>
              </div>
            </div>

            <button 
              disabled={formData.whatsapp.length !== 9}
              onClick={() => setCurrentStep(5)}
              className="mt-auto w-full py-4 bg-primary text-white font-bold rounded-pill shadow-xl disabled:opacity-50 transition-all active:scale-95"
            >
              Continue →
            </button>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-10 duration-500 pb-12">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-pacifico text-white">Your shop is ready</h1>
              <p className="text-sm text-muted">This is exactly how buyers will see your shop</p>
            </div>

            {/* Shop Preview */}
            <div className="bg-card rounded-card overflow-hidden border border-white/5 flex flex-col">
              <div className="h-24 gradient-pink-purple relative">
                <div className="absolute -bottom-6 left-6 w-16 h-16 bg-primary rounded-2xl border-4 border-card flex items-center justify-center text-3xl">
                  🏪
                </div>
              </div>
              <div className="pt-8 px-6 pb-6 flex flex-col gap-4">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-pacifico text-white">{formData.name}</h2>
                  <span className="text-xs font-mono text-primary">thread.zw/{formData.handle}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.categories || []).map((cat: string) => (
                    <span key={cat} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-mono text-muted uppercase tracking-widest">{cat}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-widest">0 products · 0 followers</span>
                  <button className="px-6 py-1.5 bg-primary text-white text-[10px] font-bold rounded-full">Follow</button>
                </div>

                <div className="flex border-b border-white/5 mt-2">
                  <div className="px-4 py-2 text-[10px] font-mono text-muted uppercase tracking-widest">Products</div>
                  <div className="px-4 py-2 text-[10px] font-mono text-primary border-b-2 border-primary uppercase tracking-widest">About</div>
                </div>

                <div className="flex flex-col gap-4 py-2">
                  <p className="text-xs text-muted leading-relaxed">
                    {formData.description || <span className="italic">No description added</span>}
                  </p>

                  {!formData.onlineOnly && (
                    <div className="bg-elevated p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-syne font-bold text-white">{formData.area}</span>
                        <span className="text-[10px] text-muted">{formData.landmark}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 bg-green/10 text-green text-[8px] font-bold rounded-full uppercase">Open Now</div>
                        <span className="text-[10px] text-muted">Closes 18:00</span>
                      </div>
                      <div className="text-[10px] text-muted line-clamp-1 border-t border-white/5 pt-2">
                        {formData.directions}
                      </div>
                    </div>
                  )}

                  <button className="w-full py-3 bg-green/10 text-green rounded-pill border border-green/20 flex items-center justify-center gap-2 text-xs font-bold">
                    <MessageCircle size={16} /> WhatsApp Shop
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setCurrentStep(1)}
                className="text-xs font-mono text-muted uppercase tracking-widest underline decoration-primary/30 underline-offset-4"
              >
                Edit Details
              </button>
              <button 
                onClick={() => {
                  setPaywallType('trial');
                  navigate('/paywall');
                }}
                className="w-full py-4 gradient-pink-purple text-white font-syne font-bold rounded-pill shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Rocket size={20} /> Launch My Shop →
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10 max-w-[430px] mx-auto">
        <div 
          className="h-full bg-primary transition-all duration-500" 
          style={{ width: `${(currentStep / 5) * 100}%` }} 
        />
      </div>

      <header className="p-6 pt-8 flex justify-between items-center z-40">
        <button 
          onClick={handleBack}
          className="text-white/70"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Step {currentStep} of 5</span>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-[10px] font-mono text-muted uppercase tracking-widest mt-1"
          >
            Save & Exit
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-8 pb-12 overflow-y-auto no-scrollbar">
        {renderStep()}
      </main>

      {/* Area Bottom Sheet */}
      <AnimatePresence>
        {showAreaSheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAreaSheet(false)}
              className="fixed inset-0 bg-black/60 z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-card z-[101] max-w-[430px] mx-auto p-6 flex flex-col gap-6 max-h-[70vh]"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full self-center" />
              <h3 className="text-xl font-syne font-bold text-white">Select Area</h3>
              <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {AREAS.map(area => (
                  <button
                    key={area}
                    onClick={() => {
                      updateFormData('area', area);
                      setShowAreaSheet(false);
                    }}
                    className={`w-full p-4 text-left rounded-xl transition-all ${
                      formData.area === area ? 'bg-primary/10 text-primary' : 'text-white hover:bg-white/5'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
