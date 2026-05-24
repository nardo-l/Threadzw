import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Check, Camera, Image, Search, 
  MessageSquare, Star, Sparkles, BarChart2, Laptop, 
  Settings, ShoppingBag, Eye, EyeOff, Edit, Shield, ChevronRight, Pencil
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface OnboardingFlowProps {
  onboardingStep: number;
  setOnboardingStep: React.Dispatch<React.SetStateAction<number>>;
  setAppStage: (stage: 'landing' | 'paywall' | 'onboarding' | 'building' | 'reveal' | 'dashboard' | null) => void;
  setPaywallScreen?: React.Dispatch<React.SetStateAction<number>>;
  setPaywallMode?: React.Dispatch<React.SetStateAction<'signup' | 'payment'>>;
  shopData: {
    ownerName: string;
    name: string;
    category: string;
    town: string;
    whatsapp: string;
    description: string;
    instagram: string;
    priceRange: string;
    productEstimate: string;
  };
  setShopData: React.Dispatch<React.SetStateAction<{
    ownerName: string;
    name: string;
    category: string;
    town: string;
    whatsapp: string;
    description: string;
    instagram: string;
    priceRange: string;
    productEstimate: string;
  }>>;
  logoFile: File | null;
  setLogoFile: React.Dispatch<React.SetStateAction<File | null>>;
  logoPreview: string | null;
  setLogoPreview: React.Dispatch<React.SetStateAction<string | null>>;
  bannerFile: File | null;
  setBannerFile: React.Dispatch<React.SetStateAction<File | null>>;
  bannerPreview: string | null;
  setBannerPreview: React.Dispatch<React.SetStateAction<string | null>>;
  signupAlreadyDone?: boolean;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onboardingStep,
  setOnboardingStep,
  setAppStage,
  setPaywallScreen,
  setPaywallMode,
  shopData,
  setShopData,
  logoFile,
  setLogoFile,
  logoPreview,
  setLogoPreview,
  bannerFile,
  setBannerFile,
  bannerPreview,
  setBannerPreview,
  signupAlreadyDone = false
}) => {
  // Navigation block indicator the platform requested
  const [isNavigating, setIsNavigating] = useState(false);
  const [townSearchQuery, setTownSearchQuery] = useState('');
  
  // Custom onboarding screen mock values
  const [currentChannels, setCurrentChannels] = useState<string[]>([]);
  const [dmsConstantly, setDmsConstantly] = useState<boolean | null>(null);
  const [offlineBrowse, setOfflineBrowse] = useState<boolean | null>(null);
  const [onGoogle, setOnGoogle] = useState<boolean | null>(null);
  const [trackingProduct, setTrackingProduct] = useState<string | null>(null);
  const [customChallenge, setCustomChallenge] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Fetch the custom onboarding image URL from DB app_settings
  useEffect(() => {
    const fetchOnboardingImage = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'onboarding_preview_image_url')
          .maybeSingle();

        if (!error && data?.value) {
          console.log('Onboarding preview image active:', data.value);
          setPreviewImageUrl(data.value);
        }
      } catch (err) {
        console.error('Error fetching preview setting:', err);
      }
    };
    fetchOnboardingImage();
  }, []);

  // Set phase color matching the step
  const getPhaseColor = () => {
    if (onboardingStep <= 7) return '#A1A1AA'; // Reality Check (Phase 1)
    if (onboardingStep <= 12) return '#FF7A00'; // Wake Up (Phase 2)
    if (onboardingStep <= 17) return '#C6FF00'; // Solution (Phase 3)
    if (onboardingStep <= 28) return '#FF7A00'; // Build & Review (Phase 4)
    return '#C6FF00'; // Phase 5: Secure Account
  };

  const currentPhaseColor = getPhaseColor();

  const updateField = (key: string, value: any) => {
    setShopData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (isNavigating) return;
    setIsNavigating(true);

    if (onboardingStep === 28) {
      if (signupAlreadyDone) {
        // Go straight to building animation screen
        setAppStage('building');
      } else {
        setOnboardingStep(29);
      }
    } else if (onboardingStep === 29) {
      if (setPaywallScreen) setPaywallScreen(1);
      if (setPaywallMode) setPaywallMode('signup');
      setAppStage('paywall');
    } else {
      setOnboardingStep((prev) => prev + 1);
    }

    setTimeout(() => {
      setIsNavigating(false);
    }, 450);
  };

  const handleBack = () => {
    if (isNavigating || onboardingStep <= 1) return;
    setIsNavigating(true);
    setOnboardingStep((prev) => prev - 1);
    
    setTimeout(() => {
      setIsNavigating(false);
    }, 450);
  };

  // towns listing
  const ZIMBABWE_TOWNS = [
    'Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 
    'Kwekwe', 'Kadoma', 'Masvingo', 'Chinhoyi', 'Norton'
  ];

  const filteredTowns = ZIMBABWE_TOWNS.filter((t) =>
    t.toLowerCase().includes(townSearchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0B0B0B] min-h-screen text-white font-sans selection:bg-[#C6FF00]/20 relative flex flex-col justify-between overflow-x-hidden">
      
      {/* PHASE PROGRESS STATUS HEADER BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#151515]">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${(onboardingStep / 29) * 100}%`,
            backgroundColor: currentPhaseColor
          }}
        />
      </div>

      {/* BACK BUTTON */}
      {onboardingStep > 1 && (
        <button
          onClick={handleBack}
          className="fixed top-6 left-5 z-40 p-2 text-[#A1A1AA] hover:text-white transition-colors duration-200 cursor-pointer"
          aria-label="Back to previous onboarding step"
        >
          <ArrowLeft className="w-5.5 h-5.5" />
        </button>
      )}

      {/* ONBOARDING SCROLL VIEW WRAPPER */}
      <div className="w-full max-w-md mx-auto pt-20 px-6 pb-36 flex-1 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          
          <motion.div
            key={`onboarding-step-${onboardingStep}`}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col justify-start"
          >
            
            {/* PHASE INDICATORS SUBTITLE */}
            <span className="text-[11px] font-mono tracking-widest uppercase mb-4 block" style={{ color: currentPhaseColor }}>
              {onboardingStep <= 7 && "Phase 1: Reality Check"}
              {onboardingStep > 7 && onboardingStep <= 12 && "Phase 2: Wake Up"}
              {onboardingStep > 12 && onboardingStep <= 17 && "Phase 3: Solution"}
              {onboardingStep > 17 && onboardingStep <= 28 && "Phase 4: Design Your Shop"}
              {onboardingStep === 29 && "Phase 5: Secure Account"}
            </span>

            {/* SCREEN 1: MERCHANT FULL NAME ENTRY */}
            {onboardingStep === 1 && (
              <div className="space-y-6">
                <span className="text-5xl block animate-bounce" style={{ animationDuration: '4s' }}>Hey 👋</span>
                <h1 className="text-white font-black text-[32px] tracking-tight leading-tight -mt-2">
                  Let's get your clothing shop online.
                </h1>
                <p className="text-[#A1A1AA] text-base leading-relaxed">
                  Answer a few questions and set your shop info. We'll build your online storefront automatically.
                </p>

                <div className="pt-4">
                  <label className="text-[#A1A1AA] text-[13px] font-bold block mb-1.5">
                    What should we call you?
                  </label>
                  <input
                    type="text"
                    value={shopData.ownerName}
                    onChange={(e) => updateField('ownerName', e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-[#151515] text-white border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-[#C6FF00] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* SCREEN 2: CURRENT SALES CHANNEL PILLS */}
            {onboardingStep === 2 && (
              <div className="space-y-6">
                <h1 className="text-white font-black text-[28px] tracking-tight leading-tight">
                  How do customers find your products right now, {shopData.ownerName || 'friend'}?
                </h1>
                <p className="text-[#A1A1AA] text-sm">Select all that apply:</p>

                <div className="space-y-3">
                  {[
                    { id: 'whatsapp', icon: '📱', title: 'WhatsApp messages', detail: 'They DM me for prices and photos' },
                    { id: 'social', icon: '📸', title: 'Instagram / TikTok', detail: 'They find me on social media' },
                    { id: 'walkin', icon: '🏪', title: 'Walk-in / word of mouth', detail: 'People know my physical location' },
                    { id: 'none', icon: '🌐', title: "I don't have online presence", detail: 'Currently no way to find me online' }
                  ].map((opt) => {
                    const active = currentChannels.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          const updated = active 
                            ? currentChannels.filter(c => c !== opt.id)
                            : [...currentChannels, opt.id];
                          setCurrentChannels(updated);
                        }}
                        className={`bg-[#151515] border rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer ${
                          active ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-[#2A2A2A]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0B0B0B] flex items-center justify-center text-lg">
                          {opt.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm">{opt.title}</h4>
                          <span className="text-[#A1A1AA] text-xs leading-normal mt-0.5 block">{opt.detail}</span>
                        </div>
                        {active && (
                          <div className="w-5 h-5 rounded-full bg-[#C6FF00] flex items-center justify-center">
                            <Check className="text-black w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 3: DO CUSTOMERS MESSAGE CONSTANTLY */}
            {onboardingStep === 3 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  Do customers message you asking "how much?" all day?
                </h1>
                
                <div className="flex gap-4">
                  {[
                    { label: "😤 Yes, constantly", val: true },
                    { label: "😌 Not really", val: false }
                  ].map((btn) => {
                    const active = dmsConstantly === btn.val;
                    return (
                      <button
                        key={'b3-' + btn.val}
                        onClick={() => {
                          setDmsConstantly(btn.val);
                          setTimeout(handleNext, 400);
                        }}
                        className={`flex-1 h-28 rounded-2xl bg-[#151515] border p-4 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                          active ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-[#2A2A2A]'
                        }`}
                      >
                        <span className="text-2xl">{btn.label.split(' ')[0]}</span>
                        <span className="font-bold text-sm text-white">{btn.label.split(' ').slice(1).join(' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 4: OFFLINE BROWSE PROBLEM */}
            {onboardingStep === 4 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  Can customers browse your products to buy when you are offline?
                </h1>

                <div className="flex gap-4">
                  {[
                    { label: "✅ Yes, they can", val: true },
                    { label: "❌ No, they can't", val: false }
                  ].map((btn) => {
                    const active = offlineBrowse === btn.val;
                    return (
                      <button
                        key={'b4-' + btn.val}
                        onClick={() => {
                          setOfflineBrowse(btn.val);
                          setTimeout(handleNext, 400);
                        }}
                        className={`flex-1 h-28 rounded-2xl bg-[#151515] border p-4 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                          active ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-[#2A2A2A]'
                        }`}
                      >
                        <span className="text-2xl">{btn.label.split(' ')[0]}</span>
                        <span className="font-bold text-sm text-white">{btn.label.split(' ').slice(1).join(' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 5: GOOGLE VISIBILITY CHALLENGE */}
            {onboardingStep === 5 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  Does your clothing shop appear on Google when someone searches "curated drip Harare"?
                </h1>

                <div className="flex gap-4">
                  {[
                    { label: "✅ Yes, it does", val: true },
                    { label: "❌ No, it doesn't", val: false }
                  ].map((btn) => {
                    const active = onGoogle === btn.val;
                    return (
                      <button
                        key={'b5-' + btn.val}
                        onClick={() => {
                          setOnGoogle(btn.val);
                          setTimeout(handleNext, 400);
                        }}
                        className={`flex-1 h-28 rounded-2xl bg-[#151515] border p-4 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                          active ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-[#2A2A2A]'
                        }`}
                      >
                        <span className="text-2xl">{btn.label.split(' ')[0]}</span>
                        <span className="font-bold text-sm text-white">{btn.label.split(' ').slice(1).join(' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 6: SALES TRACKING ENGINE */}
            {onboardingStep === 6 && (
              <div className="space-y-6">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  How are you tracking which products sell best?
                </h1>

                <div className="space-y-3">
                  {[
                    { id: 'memory', icon: '🧠', title: 'I just remember' },
                    { id: 'manual', icon: '📝', title: 'I write it down on paper' },
                    { id: 'none', icon: '❌', title: "I'm not tracking at all right now" },
                    { id: 'sheet', icon: '📊', title: 'I use an Excel spreadsheet' }
                  ].map((opt) => {
                    const active = trackingProduct === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setTrackingProduct(opt.id);
                          setTimeout(handleNext, 400);
                        }}
                        className={`bg-[#151515] border rounded-2xl p-4.5 flex items-center gap-4 transition-all cursor-pointer ${
                          active ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-[#2A2A2A]'
                        }`}
                      >
                        <div className="text-2xl">{opt.icon}</div>
                        <h4 className="text-white font-bold text-[15px]">{opt.title}</h4>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 7: BIGGEST CHALLENGE IN SHOPPING */}
            {onboardingStep === 7 && (
              <div className="space-y-6">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  What is your biggest daily challenge in running your retail brand?
                </h1>

                <div className="space-y-3">
                  {[
                    { id: 'visibility', icon: '👁️', title: 'No one knows I exist online', sub: 'I need more traffic and reach' },
                    { id: 'customers', icon: '💸', title: 'I need more customers', sub: 'Weekly sales are inconsistent' },
                    { id: 'chaos', icon: '⏰', title: 'Managing orders is pure chaos', sub: 'Too many fragmented WhatsApp messages' },
                    { id: 'ghosts', icon: '😤', title: 'Customers never commit to pay', sub: 'They ask for prices and size then disappear' }
                  ].map((opt) => {
                    const active = customChallenge === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setCustomChallenge(opt.id);
                          setTimeout(handleNext, 500);
                        }}
                        className={`bg-[#151515] border rounded-2xl p-4.5 flex items-center gap-4 transition-all cursor-pointer ${
                          active ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-[#2A2A2A]'
                        }`}
                      >
                        <div className="text-2xl">{opt.icon}</div>
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-[15px]">{opt.title}</h4>
                          <span className="text-[#A1A1AA] text-xs leading-normal mt-0.5 block">{opt.sub}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 8 — PAIN POINTS DRAMATIC TYPING */}
            {onboardingStep === 8 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-2xl font-black text-[#FF7A00] uppercase tracking-wide">
                    Here's what's actually happening:
                  </h1>
                </motion.div>

                <div className="space-y-4 mt-8">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-lg text-[#A1A1AA] max-w-[280px]"
                  >
                    {dmsConstantly ? "Every unpriced DM is a sale you almost missed." : "Customers are searching online and finding other stores."}
                  </motion.p>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 }}
                    className="text-base text-[#A1A1AA]"
                  >
                    Your competitors are already online.
                  </motion.p>

                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 80 }}
                    transition={{ delay: 2.6, duration: 0.5 }}
                    className="h-0.5 bg-[#FF7A00] mx-auto mt-6"
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 3.2 }}
                    className="pt-6"
                  >
                    <h2 className="text-3xl font-black text-[#C6FF00]">Let's fix this together.</h2>
                  </motion.div>
                </div>
              </div>
            )}

            {/* SCREEN 9: NIGHT EXPLAINED */}
            {onboardingStep === 9 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  Every single night you sleep, customers try to find your items.
                </h1>

                <div className="bg-[#151515] border border-[#2A2A2A] rounded-[24px] p-6 text-center shadow-xl">
                  <span className="text-5xl block">⏰</span>
                  <div className="text-[32px] font-mono font-black mt-4 text-[#FF7A00]">2:47 AM</div>
                  <p className="text-[#A1A1AA] text-sm mt-1.5 font-medium">Someone wants to buy your vintage windbreaker.</p>
                  <div className="text-[#EF4444] text-[13px] font-black mt-3 uppercase tracking-wider">
                    ✕ Your store is currently offline
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 10: PRICES DM LOSS ANALYSIS */}
            {onboardingStep === 10 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  "How much?" DMs cost you sales every single week.
                </h1>

                <div className="text-center bg-[#151515] border border-[#2A2A2A] rounded-2xl py-8 px-4">
                  <span className="text-5xl block animate-pulse">💸</span>
                  <h3 className="text-[#C6FF00] font-black text-[34px] leading-none mt-4">
                    23 customers
                  </h3>
                  <p className="text-[#A1A1AA] text-sm mt-2">
                    asked for prices in WhatsApp last week but disappeared.
                  </p>
                  <p className="text-stone-500 font-mono text-[11px] mt-2 italic">
                    (Standard data average for ZIM apparel merchants)
                  </p>
                </div>
              </div>
            )}

            {/* SCREEN 11: COMPETITOR LANDSCAPE OF HARARE */}
            {onboardingStep === 11 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  Other shops around Zimbabwe are getting searched on Google. You are invisible.
                </h1>

                <div className="space-y-4 pt-4 select-none">
                  <div className="flex items-center justify-between bg-[#151515] p-3.5 rounded-xl opacity-40 scale-95 border border-[#2A2A2A]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 text-sm flex items-center justify-center font-bold">H</div>
                      <div>
                        <div className="font-bold text-sm text-white">HarareFits</div>
                        <div className="text-[11px] text-[#22C55E]">🟢 ONLINE</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-[#C6FF00]/10 border-2 border-[#C6FF00] p-5 rounded-2xl scale-100 shadow-lg shadow-[#C6FF00]/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-bold text-lg">Y</div>
                      <div>
                        <div className="font-black text-base text-white">Your Store</div>
                        <div className="text-[12px] text-[#EF4444] font-bold">🔴 OFFLINE / UNSEARCHABLE</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-[#151515] p-3.5 rounded-xl opacity-40 scale-95 border border-[#2A2A2A]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 text-sm flex items-center justify-center font-bold">V</div>
                      <div>
                        <div className="font-bold text-sm text-white">VintageZim</div>
                        <div className="text-[11px] text-[#22C55E]">🟢 ONLINE</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 12: WAKEUP WARNING FINALE */}
            {onboardingStep === 12 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-8">
                <span className="text-7xl">⚡</span>
                <h2 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  You have been selling with the wrong tools.
                </h2>
                <h3 className="text-[#C6FF00] font-black text-3xl">
                  ThreadZW fixes this.
                </h3>
              </div>
            )}

            {/* SCREEN 13: FEATURES GRID HORIZONTAL */}
            {onboardingStep === 13 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  Here's what your ThreadZW catalog provides.
                </h1>

                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x px-1">
                  {[
                    { icon: '🌐', title: 'Always Online', desc: 'Customers browse your items 24/7 while you sleep.' },
                    { icon: '📊', title: 'Real-time Analytics', desc: 'See exactly who viewed what product and when.' },
                    { icon: '🔗', title: 'Unique Shop Link', desc: 'A custom handle link like threadzw.com/shop/@yourname' },
                    { icon: '💬', title: 'One-Tap WhatsApp', desc: 'Customers tap "Message Seller" on the product to buy.' },
                    { icon: '📦', title: 'Inventory count', desc: 'Keep track of stock sizes easily.' }
                  ].map((feat, i) => (
                    <div key={'onb13-' + i} className="min-w-[260px] bg-[#151515] border border-[#2A2A2A] rounded-2xl p-6 snap-center">
                      <div className="w-12 h-12 rounded-full bg-[#C6FF00]/10 flex items-center justify-center text-3xl">
                        {feat.icon}
                      </div>
                      <h4 className="text-white font-black text-lg mt-4">{feat.title}</h4>
                      <p className="text-[#A1A1AA] text-sm mt-2 leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCREEN 14: INTERACTIVE PREVIEW */}
            {onboardingStep === 14 && (
              <div className="space-y-6 text-center flex flex-col items-center">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  Your shop will look like this.
                </h1>

                {/* Smartphone frame container */}
                <div className="w-[200px] bg-[#151515] border-2 border-[#2A2A2A] rounded-[32px] p-2 shadow-2xl relative">
                  {/* Speaker slot */}
                  <div className="w-16 h-1.5 bg-[#0B0B0B] rounded-full mx-auto mb-2" />

                  {/* Glass pane mock */}
                  <div className="rounded-2xl overflow-hidden bg-[#0B0B0B] min-h-[300px]">
                    {previewImageUrl ? (
                      <img
                        src={previewImageUrl}
                        referrerPolicy="no-referrer"
                        alt="Shop front outline"
                        className="w-full h-auto object-cover"
                      />
                    ) : (
                      <div className="p-3">
                        {/* Shimmer header card */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-[#C6FF00]/20 animate-pulse" />
                          <div className="flex-1 space-y-1">
                            <div className="h-2 bg-[#2A2A2A] rounded w-3/4" />
                            <div className="h-1.5 bg-[#2A2A2A] rounded w-1/2" />
                          </div>
                        </div>
                        {/* Shimmer items grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {[1, 2, 3, 4].map((s) => (
                            <div key={'shim-' + s} className="aspect-square bg-[#151515] rounded-lg animate-pulse" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[#A1A1AA] text-[13px] mt-2 max-w-[260px]">
                  A clean, professional page that loads in milliseconds for local shoppers.
                </p>
              </div>
            )}

            {/* SCREEN 15: ANALYTICS PREVIEW CHART */}
            {onboardingStep === 15 && (
              <div className="space-y-8 flex flex-col items-center text-center">
                <h1 className="text-white font-black text-[30px] leading-tight tracking-tight">
                  Know what's selling. When. How much.
                </h1>

                {/* Vertical bar charts container mock inside a phone */}
                <div className="w-[180px] h-[240px] bg-[#151515] border border-[#2A2A2A] rounded-[24px] p-4 flex flex-col justify-end gap-2.5">
                  <div className="flex items-end justify-center gap-2.5 h-36">
                    {[3, 6, 4, 8, 5].map((val, idx) => (
                      <motion.div
                        key={'bbar-' + idx}
                        initial={{ height: 0 }}
                        animate={{ height: `${val * 10}%` }}
                        transition={{ delay: idx * 0.15, duration: 0.6 }}
                        className="flex-1 bg-[#C6FF00] rounded-t-sm"
                      />
                    ))}
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-2 flex justify-between text-[10px] text-stone-500 font-mono">
                    <span>MON</span>
                    <span>WED</span>
                    <span>FRI</span>
                  </div>
                </div>

                <p className="text-[#A1A1AA] text-sm max-w-[280px]">
                  Get actual statistics on view count, hot sellers, and click-through analytics instantly.
                </p>
              </div>
            )}

            {/* SCREEN 16: URL SHOWCASE DESIGN */}
            {onboardingStep === 16 && (
              <div className="space-y-8 flex flex-col items-center justify-center text-center">
                <h1 className="text-white font-black text-[32px] leading-tight tracking-tight">
                  Your link. Everywhere.
                </h1>

                <div className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-5 w-full">
                  <span className="text-[#A1A1AA] text-[11px] block font-mono">threadzw.com/shop/</span>
                  <span className="text-[#C6FF00] font-black text-2xl tracking-tight block mt-1">
                    @{shopData.name.toLowerCase().replace(/\s+/g, '') || 'yourshop'}
                  </span>
                </div>

                <p className="text-[#A1A1AA] text-sm max-w-[280px]">
                  Place it in your Instagram bio, TikTok profiles, or broadcasts. Never type out prices manually again.
                </p>
              </div>
            )}

            {/* SCREEN 17: TRANSITIONAL CTA */}
            {onboardingStep === 17 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-10">
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="text-8xl block"
                >
                  🚀
                </motion.span>
                <h2 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  Ready to build your shop? It takes less than 3 minutes.
                </h2>
              </div>
            )}

            {/* SCREEN 18: CHOOSE SHOP NAME */}
            {onboardingStep === 18 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  What is your clothing shop called?
                </h1>

                <div className="pt-4 relative">
                  <input
                    type="text"
                    value={shopData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g. Harare Vintage"
                    className="w-full bg-transparent border-t-0 border-x-0 border-b-2 border-[#2A2A2A] focus:border-[#C6FF00] py-4 text-3xl font-black text-white focus:outline-none transition-all placeholder:text-stone-700"
                  />

                  {shopData.name.length >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 font-mono text-[#C6FF00] text-xs"
                    >
                      threadzw.com/shop/@{shopData.name.toLowerCase().replace(/\s+/g, '')}
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 19: SELECT CATEGORIES */}
            {onboardingStep === 19 && (
              <div className="space-y-6">
                <h1 className="text-[#C6FF00] font-black text-[32px] tracking-tight leading-tight">
                  What do you sell, mainly?
                </h1>

                <div className="grid grid-cols-2 gap-3 pb-8">
                  {[
                    { emoji: '👕', label: 'Clothing' },
                    { emoji: '👟', label: 'Sneakers' },
                    { emoji: '🧥', label: 'Thrift & Vintage' },
                    { emoji: '🔥', label: 'Streetwear' },
                    { emoji: '👗', label: "Women's Fashion" },
                    { emoji: '👔', label: 'Formal Wear' },
                    { emoji: '💍', label: 'Accessories' },
                    { emoji: '📦', label: 'Mixed' }
                  ].map((cat, i) => {
                    const active = shopData.category === cat.label;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          updateField('category', cat.label);
                        }}
                        className={`h-24 bg-[#151515] border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          active ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-[#2A2A2A]'
                        }`}
                      >
                        <span className="text-2xl">{cat.emoji}</span>
                        <span className="text-white font-bold text-xs">{cat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 20: BASED-IN TOWN IN ZIMBABWE */}
            {onboardingStep === 20 && (
              <div className="space-y-6">
                <h1 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  Which city are you based in?
                </h1>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1AA]">
                    <Search className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={townSearchQuery}
                    onChange={(e) => setTownSearchQuery(e.target.value)}
                    className="w-full bg-[#151515] text-white border border-[#2A2A2A] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#C6FF00] transition-colors"
                  />
                </div>

                <div className="bg-[#151515] border border-[#2A2A2A] rounded-2xl overflow-hidden divide-y divide-[#2A2A2A] max-h-60 overflow-y-auto no-scrollbar">
                  {filteredTowns.map((town, idx) => {
                    const active = shopData.town === town;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          updateField('town', town);
                          setTimeout(handleNext, 400);
                        }}
                        className="px-5 py-3.5 flex items-center justify-between active:bg-[#202020] cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm">📍</span>
                          <span className={`text-[15px] ${active ? 'text-[#C6FF00] font-bold' : 'text-white'}`}>
                            {town}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-1.5 flex items-center justify-center ${
                          active ? 'border-[#C6FF00] bg-[#C6FF00]' : 'border-stone-700'
                        }`}>
                          {active && <Check className="text-black w-3.5 h-3.5 stroke-[3.5]" />}
                        </div>
                      </div>
                    );
                  })}
                  {filteredTowns.length === 0 && (
                    <div className="p-4 text-center text-[#A1A1AA] text-xs">
                      No matching towns found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 21: CONTACT WHATSAPP PREFIX DETAILS */}
            {onboardingStep === 21 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  Where should customers reach you?
                </h1>

                <div className="space-y-4">
                  <div className="flex gap-3 bg-[#151515] border border-[#2A2A2A] focus-within:border-[#C6FF00] rounded-xl px-4 py-3 relative items-center transition-all">
                    <span className="text-stone-400 font-black text-lg select-none">+263</span>
                    <input
                      type="tel"
                      value={shopData.whatsapp}
                      onChange={(e) => updateField('whatsapp', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="77 444 3322"
                      className="bg-transparent text-white text-2xl font-black w-full focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#25D366] rounded-full h-[52px] flex items-center justify-center gap-2 text-white font-black cursor-default opacity-50 select-none">
                    <MessageSquare className="w-5 h-5" /> Chat on WhatsApp →
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 22: ONE-SENTENCE DESCRIPTION */}
            {onboardingStep === 22 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  Describe your shop in one sentence.
                </h1>

                <div className="relative">
                  <textarea
                    value={shopData.description}
                    onChange={(e) => updateField('description', e.target.value.slice(0, 120))}
                    placeholder="e.g. Premium thrift finds and limited sneakers."
                    className="w-full bg-[#151515] border border-[#2A2A2A] rounded-2xl p-5 text-white text-base leading-relaxed min-h-[140px] focus:outline-none focus:border-[#C6FF00] transition-colors"
                  />
                  <div className="absolute bottom-4 right-4 text-stone-500 font-mono text-xs">
                    {shopData.description.length}/120
                  </div>
                </div>

                {/* Tags Suggestions */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {[
                    'Exclusive streetwear fits.',
                    'Premium thrift curated daily.',
                    'Fresh kicks and accessories.',
                    'Local boutique designs.'
                  ].map((sug, i) => (
                    <div
                      key={i}
                      onClick={() => updateField('description', sug)}
                      className="flex-shrink-0 bg-[#151515] border border-[#2A2A2A] rounded-full px-4 py-2 text-xs text-[#A1A1AA] cursor-pointer hover:border-[#C6FF00] hover:text-[#C6FF00] transition-all"
                    >
                      {sug}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCREEN 23: ACCESSIBLE INSTAGRAM HANDLE */}
            {onboardingStep === 23 && (
              <div className="space-y-8">
                <h1 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  Have an Instagram link or handle?
                </h1>

                <div className="flex items-center gap-3 bg-[#151515] border border-[#2A2A2A] rounded-xl px-4 h-[60px] focus-within:border-[#C6FF00] transition-all">
                  <span className="text-stone-400 font-bold text-lg select-none">@</span>
                  <input
                    type="text"
                    value={shopData.instagram}
                    onChange={(e) => updateField('instagram', e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                    placeholder="shop_handle"
                    className="bg-transparent text-white text-xl font-bold w-full focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* SCREEN 24: PRODUCT CATALOG SPEC ESTIMATION */}
            {onboardingStep === 24 && (
              <div className="space-y-6">
                <h1 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  How many products are you starting with?
                </h1>

                <div className="space-y-3">
                  {[
                    { id: '1-5', title: '1 — 5', label: 'Just getting started' },
                    { id: '6-20', title: '6 — 20', label: 'Growing catalogue' },
                    { id: '21-50', title: '21 — 50', label: 'Established shop' },
                    { id: '50+', title: '50+', label: 'Large collection' }
                  ].map((opt) => {
                    const active = shopData.productEstimate === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          updateField('productEstimate', opt.id);
                          setTimeout(handleNext, 400);
                        }}
                        className={`bg-[#151515] border rounded-2xl h-16 px-5 flex items-center justify-between transition-all cursor-pointer ${
                          active ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-[#2A2A2A]'
                        }`}
                      >
                        <span className="text-white font-bold text-base">{opt.title}</span>
                        <span className="text-[#A1A1AA] text-xs">{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 25: PRICE BAND CHOICES */}
            {onboardingStep === 25 && (
              <div className="space-y-6">
                <h1 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  What is your average price range?
                </h1>

                <div className="space-y-3">
                  {[
                    { id: '<10', title: 'Under $10' },
                    { id: '10-30', title: '$10 — $30' },
                    { id: '30-100', title: '$30 — $100' },
                    { id: '100+', title: '$100+' },
                    { id: 'mixed', title: 'Mixed prices' }
                  ].map((opt) => {
                    const active = shopData.priceRange === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          updateField('priceRange', opt.id);
                          setTimeout(handleNext, 400);
                        }}
                        className={`bg-[#151515] border rounded-2xl h-16 px-5 flex items-center justify-between transition-all cursor-pointer ${
                          active ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-[#2A2A2A]'
                        }`}
                      >
                        <span className="text-white font-bold text-base">{opt.title}</span>
                        <span className="w-4 h-4 rounded-full border border-stone-800" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 26: LOGO PICZONE */}
            {onboardingStep === 26 && (
              <div className="space-y-6">
                <h1 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  Add your shop logo.
                </h1>
                <p className="text-[#A1A1AA] text-sm">
                  This appears on your shop page and product listings.
                </p>

                <div className="pt-8 flex flex-col items-center">
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="w-36 h-36 rounded-full bg-[#151515] border-2 border-dashed border-[#2A2A2A] relative flex items-center justify-center cursor-pointer overflow-hidden hover:border-[#C6FF00] transition-colors"
                  >
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#C6FF00] flex items-center justify-center text-black shadow-lg">
                          <Pencil size={12} className="stroke-[3]" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <span className="text-white font-bold text-3xl">+</span>
                        <Camera className="w-5 h-5 mx-auto mt-1 text-[#A1A1AA]" />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={logoInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                          setLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                  <span className="text-[#A1A1AA] text-xs mt-3">Tap to upload / edit</span>
                  {logoPreview && (
                    <span className="text-[#C6FF00] font-bold text-xs mt-2 block animate-pulse">
                      Logo loaded! 🔥
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 27: BANNER COVER FILE */}
            {onboardingStep === 27 && (
              <div className="space-y-6">
                <h1 className="text-white font-black text-[32px] tracking-tight leading-tight">
                  Add a shop banner.
                </h1>
                <p className="text-[#A1A1AA] text-sm">
                  The cover image at the top of your shop page.
                </p>

                <div className="pt-8 space-y-6">
                  <div
                    onClick={() => bannerInputRef.current?.click()}
                    className="w-full h-36 bg-[#151515] border-2 border-dashed border-[#2A2A2A] rounded-2xl relative flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[#C6FF00] transition-colors"
                  >
                    {bannerPreview ? (
                      <>
                        <img src={bannerPreview} className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 right-2 px-3 py-1 bg-black/80 border border-stone-800 rounded-full flex items-center gap-1.5 text-xs font-bold text-white">
                          <Pencil size={11} className="stroke-[2.5]" /> Change
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl block mb-1">🖼️</span>
                        <span className="text-white font-bold text-sm">+ Add Shop Banner</span>
                        <span className="text-[#A1A1AA] text-xxs block mt-1">1200x400px recommended</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={bannerInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBannerFile(file);
                          setBannerPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>

                  {bannerPreview && (
                    <div className="space-y-2">
                      <span className="text-[#A1A1AA] text-xs font-bold block">Preview layout:</span>
                      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden relative">
                        <div className="h-20 w-full overflow-hidden relative">
                          <img src={bannerPreview} className="w-full h-full object-cover" alt="Banner Preview" />
                          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-[#C6FF00] overflow-hidden bg-[#151515]">
                            {logoPreview && <img src={logoPreview} className="w-full h-full object-cover" alt="Logo preview" />}
                          </div>
                        </div>
                        <div className="pt-6 pb-3 text-center">
                          <span className="text-white font-bold text-sm block">{shopData.name || 'Your Brand'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 28: DETAILED REVIEWS INFO CARD SUMMARY */}
            {onboardingStep === 28 && (
              <div className="space-y-6 bg-[#0B0B0B] pb-10">
                <div className="flex items-center gap-2">
                  <span className="text-5xl animate-spin" style={{ animationDuration: '6s' }}>🎉</span>
                  <div>
                    <h2 className="text-white font-black text-2xl tracking-tight leading-none">Almost done!</h2>
                    <p className="text-[#A1A1AA] text-sm mt-1">Verify details before creating shop.</p>
                  </div>
                </div>

                {/* SUMMARY ROW SHEET */}
                <div className="bg-[#151515] border border-[#2A2A2A] rounded-[24px] p-5.5 space-y-4">
                  {[
                    { label: "Merchant display name", value: shopData.ownerName },
                    { label: "Shop page name", value: shopData.name },
                    { label: "Category", value: shopData.category },
                    { label: "City", value: shopData.town },
                    { label: "WhatsApp Contact", value: `+263 ${shopData.whatsapp}` },
                    { label: "Instagram Link", value: shopData.instagram ? `@${shopData.instagram}` : 'Skipped' },
                    { label: "Mock Logo Uploaded", value: logoFile ? '✓ Loaded' : 'Skipped' },
                    { label: "Mock Banner Uploaded", value: bannerFile ? '✓ Loaded' : 'Skipped' }
                  ].map((row, idx, array) => (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center text-xs pb-3.5 ${
                        idx === array.length - 1 ? '' : 'border-b border-[#202020]'
                      }`}
                    >
                      <span className="text-[#A1A1AA]">{row.label}</span>
                      <span className="text-white font-black max-w-[200px] text-right truncate">
                        {row.value || 'Not provided'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-center p-2 text-stone-500 text-xs">
                  Everything look correct? Build activates your 3-day trial instantly.
                </div>
              </div>
            )}

            {/* SCREEN 29: ACCOUNT SAVING GREETING SCREEN */}
            {onboardingStep === 29 && (
              <div className="space-y-6 bg-[#0B0B0B] pb-10 flex-col justify-center text-center">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      {/* Concentric pulse rings */}
                      <span className="text-7xl block animate-pulse select-none">⚡</span>
                      <div className="absolute inset-0 bg-[#C6FF00]/10 rounded-full blur-xl animate-ping opacity-70" />
                    </div>
                  </div>
                  
                  <h2 className="text-white font-black text-3xl tracking-tight leading-tight pt-2">
                    While your Shop is being built, let's save your account.
                  </h2>
                  
                  <p className="text-[#A1A1AA] text-sm max-w-sm mx-auto leading-relaxed">
                    You've designed a powerful showcase. To register your Zimbabwean domain, secure your data, and claim your exclusive <span className="text-[#C6FF00] font-bold">3-Day Free Trial</span>, let's create your merchant profile.
                  </p>
                </div>

                <div className="bg-[#151515] border border-[#2A2A2A] rounded-[24px] p-5.5 space-y-4 text-left">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-1 flex items-center justify-center w-5 h-5 bg-[#C6FF00]/10 text-[#C6FF00] rounded-full text-xs font-bold shrink-0">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-xs">Instantly Secures Shop Setup</h4>
                      <p className="text-[#A1A1AA] text-[11px] mt-0.5">Saves all {shopData.name || 'your'} inventory, price ranges, and locations securely.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3.5 border-t border-[#202020] pt-4">
                    <div className="mt-1 flex items-center justify-center w-5 h-5 bg-[#C6FF00]/10 text-[#C6FF00] rounded-full text-xs font-bold shrink-0">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-xs">Activates WhatsApp & Socials Link</h4>
                      <p className="text-[#A1A1AA] text-[11px] mt-0.5">Links +263 {shopData.whatsapp} for real-time customer orders.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 border-t border-[#202020] pt-4">
                    <div className="mt-1 flex items-center justify-center w-5 h-5 bg-[#C6FF00]/10 text-[#C6FF00] rounded-full text-xs font-bold shrink-0">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-xs">Unlock Live Seller Dashboard</h4>
                      <p className="text-[#A1A1AA] text-[11px] mt-0.5">Manage stock, add custom products, and track real Zimbabwean store analytics.</p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[#A1A1AA] text-xs">
                  Takes less than 45 seconds to secure your login.
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* FIXED NEXT FORWARD ACTION FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0B0B0B] z-30 border-t border-[#151515]">
        <div className="max-w-md mx-auto">
          {onboardingStep === 1 && (
            <button
              onClick={handleNext}
              disabled={!shopData.ownerName.trim()}
              className={`w-full h-[54px] rounded-full font-black text-sm flex items-center justify-center gap-1.5 transition-all text-black cursor-pointer ${
                shopData.ownerName.trim() ? 'bg-[#C6FF00] hover:opacity-90' : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
              }`}
            >
              Let's Go →
            </button>
          )}

          {onboardingStep === 2 && (
            <button
              onClick={handleNext}
              disabled={currentChannels.length === 0}
              className={`w-full h-[54px] rounded-full font-black text-sm flex items-center justify-center gap-1.5 transition-all text-black cursor-pointer ${
                currentChannels.length > 0 ? 'bg-[#C6FF00] hover:opacity-90' : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
              }`}
            >
              Continue
            </button>
          )}

          {/* Simple clicks automatically advance, but in case they manually navigate/click */}
          {((onboardingStep >= 3 && onboardingStep <= 7) || onboardingStep === 24 || onboardingStep === 25) && (
            <button
              onClick={handleNext}
              className="w-full h-[54px] bg-[#1A1A1A] border border-[#2A2A2A] text-[#A1A1AA] font-bold text-sm rounded-full transition-all cursor-pointer hover:text-white"
            >
              Skip / Continue →
            </button>
          )}

          {onboardingStep >= 8 && onboardingStep <= 17 && (
            <button
              onClick={handleNext}
              className="w-full bg-[#C6FF00] text-[#0B0B0B] h-[54px] rounded-full font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {onboardingStep === 8 ? 'Show Me How →' : onboardingStep === 12 ? "I'm Ready →" : onboardingStep === 17 ? "Let's Build It 🚀" : 'Continue →'}
            </button>
          )}

          {onboardingStep === 18 && (
            <button
              onClick={handleNext}
              disabled={shopData.name.trim().length < 3}
              className={`w-full h-[54px] rounded-full font-black text-sm flex items-center justify-center gap-1.5 transition-all text-black cursor-pointer ${
                shopData.name.trim().length >= 3 ? 'bg-[#C6FF00] hover:opacity-90' : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
              }`}
            >
              That's the name →
            </button>
          )}

          {onboardingStep === 19 && (
            <button
              onClick={handleNext}
              disabled={!shopData.category}
              className={`w-full h-[54px] rounded-full font-black text-sm flex items-center justify-center gap-1.5 transition-all text-black cursor-pointer ${
                shopData.category ? 'bg-[#C6FF00] hover:opacity-90' : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
              }`}
            >
              Continue
            </button>
          )}

          {onboardingStep === 20 && (
            <button
              onClick={handleNext}
              disabled={!shopData.town}
              className={`w-full h-[54px] rounded-full font-black text-sm flex items-center justify-center gap-1.5 transition-all text-black cursor-pointer ${
                shopData.town ? 'bg-[#C6FF00] hover:opacity-90' : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
              }`}
            >
              Continue
            </button>
          )}

          {onboardingStep === 21 && (
            <button
              onClick={handleNext}
              disabled={shopData.whatsapp.length < 9}
              className={`w-full h-[54px] rounded-full font-black text-sm flex items-center justify-center gap-1.5 transition-all text-black cursor-pointer ${
                shopData.whatsapp.length >= 9 ? 'bg-[#C6FF00] hover:opacity-90' : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
              }`}
            >
              Continue
            </button>
          )}

          {onboardingStep === 22 && (
            <button
              onClick={handleNext}
              disabled={!shopData.description.trim()}
              className={`w-full h-[54px] rounded-full font-black text-sm flex items-center justify-center gap-1.5 transition-all text-black cursor-pointer ${
                shopData.description.trim() ? 'bg-[#C6FF00] hover:opacity-90' : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
              }`}
            >
              Continue
            </button>
          )}

          {onboardingStep === 23 && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleNext}
                disabled={!shopData.instagram.trim()}
                className={`w-full h-[54px] rounded-full font-black text-sm flex items-center justify-center gap-1.5 transition-all text-black cursor-pointer ${
                  shopData.instagram.trim() ? 'bg-[#C6FF00] hover:opacity-90' : 'bg-[#1A1A1A] text-[#A1A1AA] pointer-events-none'
                }`}
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  updateField('instagram', '');
                  handleNext();
                }}
                className="w-full text-center text-xs text-[#A1A1AA] hover:text-white"
              >
                Skip for now →
              </button>
            </div>
          )}

          {onboardingStep === 26 && (
            <button
              onClick={handleNext}
              className="w-full bg-[#C6FF00] text-black h-[54px] rounded-full font-black text-sm hover:opacity-90 transition-all flex items-center justify-center cursor-pointer"
            >
              {logoFile ? 'Next →' : 'Skip for now →'}
            </button>
          )}

          {onboardingStep === 27 && (
            <button
              onClick={handleNext}
              className="w-full bg-[#C6FF00] text-black h-[54px] rounded-full font-black text-sm hover:opacity-90 transition-all flex items-center justify-center cursor-pointer"
            >
              {bannerFile ? 'Next →' : 'Skip for now →'}
            </button>
          )}

          {onboardingStep === 28 && (
            <button
              onClick={handleNext}
              className="w-full bg-[#C6FF00] text-black h-[54px] rounded-full font-black text-base hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF00]/10 font-bold"
            >
              Build My Shop 🚀
            </button>
          )}

          {onboardingStep === 29 && (
            <button
              onClick={handleNext}
              className="w-full bg-[#C6FF00] text-black h-[54px] rounded-full font-black text-base hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF00]/10 font-bold animate-pulse"
              style={{ animationDuration: '4s' }}
            >
              Save & Secure Account →
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
