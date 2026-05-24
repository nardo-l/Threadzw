import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ArrowRight, 
  X, 
  Check, 
  Copy, 
  Instagram, 
  MapPin, 
  Smartphone,
  Info,
  Clock,
  TrendingUp,
  Globe,
  Share2,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// --- Types ---
type Phase = 'DISCOVERY' | 'REALIZATION' | 'SOLUTION' | 'PERSONALIZATION' | 'REWARD';

interface OnboardingData {
  name: string;
  painPoints: string[];
  dmFrequency: 'yes' | 'no';
  offlineBrowsing: 'yes' | 'no';
  visibleOnGoogle: 'yes' | 'no';
  trackingMethod: string;
  primaryChallenge: string;
  shopName: string;
  category: string;
  town: string;
  whatsapp: string;
  description: string;
  instagram: string;
  logoUrl?: string;
  bannerUrl?: string;
  priceRange: string;
}

// --- Constants ---
const ZIMBABWE_TOWNS = [
  'Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 
  'Kwekwe', 'Kadoma', 'Masvingo', 'Chinhoyi', 'Norton', 
  'Marondera', 'Ruwa', 'Chegutu', 'Zvishavane', 'Bindura', 
  'Beitbridge', 'Redcliff', 'Victoria Falls', 'Hwange', 'Rusape', 
  'Chiredzi', 'Kariba', 'Karoi', 'Gokwe', 'Chipinge', 'Shurugwi'
];

const CATEGORIES = [
  { id: 'clothing', name: 'Clothing', emoji: '👕' },
  { id: 'sneakers', name: 'Sneakers', emoji: '👟' },
  { id: 'thrift', name: 'Thrift & Vintage', emoji: '🧥' },
  { id: 'streetwear', name: 'Streetwear', emoji: '🔥' },
  { id: 'accessories', name: 'Accessories', emoji: '💍' },
  { id: 'women', name: "Women's Fashion", emoji: '👗' },
  { id: 'formal', name: 'Formal Wear', emoji: '👔' },
  { id: 'mixed', name: 'Mixed / Other', emoji: '📦' }
];

const PHASES: Record<Phase, { label: string, color: string }> = {
  DISCOVERY: { label: 'The Reflection', color: '#111111' },
  REALIZATION: { label: 'The Hard Truth', color: '#EF4444' },
  SOLUTION: { label: 'The Vision', color: '#22C55E' },
  PERSONALIZATION: { label: 'The Architect', color: '#FF5FA2' },
  REWARD: { label: 'The New Era', color: '#FF5FA2' }
};

export const ShopOnboardingFlow: React.FC = () => {
  const { session } = useAuth();
  const { refreshInventory } = useInventory();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    painPoints: [],
    dmFrequency: 'no',
    offlineBrowsing: 'no',
    visibleOnGoogle: 'no',
    trackingMethod: '',
    primaryChallenge: '',
    shopName: '',
    category: '',
    town: '',
    whatsapp: '',
    description: '',
    instagram: '',
    priceRange: ''
  });

  const [saving, setSaving] = useState(false);
  const [savedShop, setSavedShop] = useState<any>(null);

  const totalSteps = 28;
  const progress = (currentStep / totalSteps) * 100;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipToPhase = (phase: Phase) => {
    if (phase === 'PERSONALIZATION') setCurrentStep(18);
  };

  const handleFinalSubmit = async () => {
    setSaving(true);
    try {
      const { data: lead, error: leadErr } = await supabase
        .from('shop_leads')
        .insert({
          user_id: session?.user?.id,
          contact_name: data.name,
          business_name: data.shopName,
          category: data.category,
          town: data.town,
          whatsapp_number: data.whatsapp,
          instagram: data.instagram,
          product_description: data.description,
          price_from: data.priceRange.includes('$10') ? 10 : 30,
          pain_points: data.painPoints,
          onboarding_data: data,
          status: 'new'
        })
        .select()
        .single();

      if (leadErr) throw leadErr;
      setSavedShop(lead);
      nextStep(); // To Step 26: Building
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error('Failed to save shop info');
    } finally {
      setSaving(false);
    }
  };

  const currentPhase = useMemo(() => {
    if (currentStep <= 7) return 'DISCOVERY';
    if (currentStep <= 12) return 'REALIZATION';
    if (currentStep <= 17) return 'SOLUTION';
    if (currentStep <= 25) return 'PERSONALIZATION';
    return 'REWARD';
  }, [currentStep]);

  return (
    <div className="fixed inset-0 bg-background z-[1000] flex flex-col font-sans overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-border z-[1001]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-primary transition-all duration-700 ease-[0.22, 1, 0.36, 1]"
        />
      </div>

      {/* Top Bar */}
      {currentStep < 26 && (
        <header className="px-6 py-8 flex items-center justify-between z-[1002]">
          <button 
            onClick={prevStep}
            className={`w-10 h-10 flex items-center justify-center rounded-full border border-border bg-white shadow-premium transition-all active:scale-90 ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black tracking-widest text-[#AAA] uppercase">
               Step {currentStep} <span className="opacity-30">/ {totalSteps}</span>
            </span>
            <div className="h-1 w-12 bg-border rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-soft-black"
                 animate={{ width: `${(currentStep % 7 || 7) * 14.2}%` }}
               />
            </div>
          </div>

          <button 
            onClick={() => skipToPhase('PERSONALIZATION')}
            className="text-[10px] font-black text-[#AAA] uppercase tracking-widest hover:text-soft-black"
          >
            Skip
          </button>
        </header>
      )}

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full flex flex-col pt-4"
          >
            {currentStep < 26 && (
               <div className="mb-6">
                 <motion.span 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-soft-black/5 text-soft-black"
                 >
                   {PHASES[currentPhase].label}
                 </motion.span>
               </div>
            )}
            
            <StepContent 
              step={currentStep} 
              data={data} 
              setData={setData} 
              nextStep={nextStep}
              handleFinalSubmit={handleFinalSubmit}
              saving={saving}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Continue Button */}
      {showContinue(currentStep, data) && (
        <div className="fixed bottom-0 left-0 right-0 p-8 pb-12 z-[1010] bg-linear-to-t from-background via-background to-transparent pointer-events-none flex justify-center">
          <button
            onClick={() => {
              if (currentStep === 25) handleFinalSubmit();
              else nextStep();
            }}
            disabled={saving}
            className={`
              w-full max-w-[400px] h-16 rounded-full font-black text-sm tracking-widest uppercase transition-all pointer-events-auto
              flex items-center justify-center gap-3 active:scale-95 shadow-heavy
              ${saving ? 'bg-warm-grey text-[#AAA]' : 'bg-soft-black text-white'}
            `}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {currentStep === 1 ? 'Start the journey' : (currentStep === 25 ? "Build the dream" : "Continue")}
                <ArrowRight size={18} strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const showContinue = (step: number, data: OnboardingData) => {
  if (step === 1) return data.name.trim().length > 0;
  if (step === 2) return data.painPoints.length > 0;
  if (step >= 3 && step <= 7) return false;
  if (step === 8) return true;
  if (step >= 9 && step <= 12) return true;
  if (step >= 13 && step <= 17) return true;
  if (step === 18) return data.shopName.trim().length > 2;
  if (step === 19) return data.category.length > 0;
  if (step === 20) return false;
  if (step === 21) return data.whatsapp.trim().length > 8;
  if (step === 22) return data.description.trim().length > 0;
  if (step === 23) return true;
  if (step === 24) return true;
  if (step === 25) return data.priceRange.length > 0;
  return false;
};

const StepContent = ({ step, data, setData, nextStep, handleFinalSubmit, saving }: any) => {
  switch (step) {
    case 1:
      return (
        <div className="flex flex-col">
          <motion.h1 
            className="text-5xl font-syne font-black tracking-tighter leading-[0.9] text-soft-black mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            THE NEW ERA<br />OF COMMERCE.
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-charcoal font-medium leading-relaxed mb-12 max-w-[280px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Zimbabwes finest fashion deserves a world-class platform. Let's craft your identity.
          </motion.p>
          
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="relative">
              <span className="text-[10px] font-black text-[#AAA] tracking-widest uppercase mb-2 block ml-1">Your Name</span>
              <input 
                autoFocus
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="What should we call you?"
                className="w-full bg-white border border-border rounded-[24px] h-20 px-8 text-xl font-bold text-soft-black focus:border-primary outline-none transition-all shadow-premium"
              />
            </div>
          </motion.div>
        </div>
      );

    case 2:
      return (
        <div className="flex flex-col">
          <h2 className="text-3xl font-syne font-black tracking-tighter leading-[1.1] mb-8">
            How does the culture find you, {data.name.split(' ')[0]}?
          </h2>
          <div className="grid gap-3">
            {[
              { id: 'whatsapp', icon: <MessageSquare size={20} />, label: 'WhatsApp Groups' },
              { id: 'social', icon: <Instagram size={20} />, label: 'Instagram & TikTok' },
              { id: 'walk', icon: <MapPin size={20} />, label: 'Physical Shop' },
              { id: 'none', icon: <Globe size={20} />, label: 'Starting fresh' }
            ].map(opt => {
              const active = data.painPoints.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const next = active 
                      ? data.painPoints.filter(p => p !== opt.id)
                      : [...data.painPoints, opt.id];
                    setData({ ...data, painPoints: next });
                  }}
                  className={`
                    w-full h-20 bg-white border rounded-[24px] px-6 flex items-center gap-4 transition-all
                    ${active ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-border'}
                  `}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? 'bg-primary text-white' : 'bg-warm-grey text-soft-black/40'}`}>
                    {opt.icon}
                  </div>
                  <span className={`font-black text-sm uppercase tracking-widest ${active ? 'text-soft-black' : 'text-[#AAA]'}`}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      );

    case 3:
    case 4:
    case 5:
      const questions = {
        3: { q: "Are the constant WhatsApp DMs feeling overwhelming?", yes: "Constantly", no: "I'm okay" },
        4: { q: "Do customers find it hard to see your full stock offline?", yes: "Yes, it's a gap", no: "My links work" },
        5: { q: "Does your brand deserve more Google visibility?", yes: "Absolutely", no: "I'm hidden" }
      };
      const q = questions[step as keyof typeof questions];
      return (
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-4xl font-syne font-black tracking-tighter leading-[1] mb-12">
            {q.q}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
               onClick={() => {
                 setTimeout(nextStep, 500);
               }}
               className="h-40 bg-white border border-border rounded-[32px] flex flex-col items-center justify-center gap-4 shadow-premium active:scale-95 transition-all text-soft-black font-black uppercase tracking-widest text-xs"
            >
              <Check className="text-primary" size={24} />
              {q.yes}
            </button>
            <button
               onClick={() => {
                 setTimeout(nextStep, 500);
               }}
               className="h-40 bg-white border border-border rounded-[32px] flex flex-col items-center justify-center gap-4 shadow-premium active:scale-95 transition-all text-[#AAA] font-black uppercase tracking-widest text-xs"
            >
              <X size={24} />
              {q.no}
            </button>
          </div>
        </div>
      );

    case 8: // Emotional Transition
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-20 h-20 rounded-full bg-soft-black flex items-center justify-center mb-12 shadow-heavy"
           >
             <Zap className="text-primary" fill="currentColor" size={32} />
           </motion.div>
           <h2 className="text-4xl font-syne font-black tracking-tighter leading-[1] mb-6">
             THE WORLD IS CHANGING.
           </h2>
           <p className="text-muted-charcoal font-medium max-w-[260px] leading-relaxed">
             The old way was DMs and manual spreadsheets. The new way is automated, premium, and unstoppable.
           </p>
        </div>
      );

    case 12: // Realization Transition
      return (
         <div className="flex-1 flex flex-col items-center justify-center text-center">
           <motion.div 
             className="text-primary mb-8"
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
           >
             <Sparkles size={64} strokeWidth={1} />
           </motion.div>
           <h2 className="text-4xl font-syne font-black tracking-tighter leading-[1] mb-6">
             YOU DESERVE<br />DIGITAL LUXURY.
           </h2>
           <p className="text-muted-charcoal font-medium max-w-[260px]">
             Let's stop managing chaos and start building an empire.
           </p>
         </div>
      );

    case 18:
      return (
        <div className="flex flex-col">
          <h2 className="text-5xl font-syne font-black tracking-tighter leading-[0.9] mb-8">
            WHAT IS THE<br /><span className="text-primary">VISION?</span>
          </h2>
          <div className="relative mt-8">
            <span className="text-[10px] font-black text-[#AAA] tracking-widest uppercase mb-4 block ml-1">Shop Identity</span>
            <input 
              autoFocus
              value={data.shopName}
              onChange={(e) => setData({ ...data, shopName: e.target.value })}
              placeholder="e.g. LUX CULTURE"
              className="w-full bg-transparent border-b-2 border-border py-4 text-4xl font-syne font-black text-soft-black focus:border-primary outline-none transition-all placeholder:text-[#EEE]"
            />
            {data.shopName.length > 2 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 flex items-center gap-3 bg-warm-grey/50 p-4 rounded-2xl border border-border"
              >
                <Globe size={14} className="text-primary" />
                <span className="text-[10px] font-black text-soft-black uppercase tracking-widest">
                  threadzw.com/{data.shopName.toLowerCase().replace(/\s/g, '-')}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      );

    case 19:
      return (
        <div className="flex flex-col">
          <h2 className="text-3xl font-syne font-black tracking-tighter leading-[1.1] mb-8">
            Define your curation.
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(cat => {
              const active = data.category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setData({ ...data, category: cat.id })}
                  className={`
                    h-32 border-2 rounded-[28px] flex flex-col items-center justify-center gap-3 transition-all
                    ${active ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-border bg-white'}
                  `}
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-soft-black' : 'text-[#AAA]'}`}>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      );

    case 21:
       return (
         <div className="flex flex-col">
            <h2 className="text-3xl font-syne font-black tracking-tighter leading-[1.1] mb-8">
              Where can buyers reach you?
            </h2>
            <div className="bg-white border-2 border-border rounded-[32px] p-6 shadow-premium">
               <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                   <MessageSquare size={24} />
                 </div>
                 <div>
                   <h4 className="font-black text-soft-black uppercase text-[10px] tracking-widest">WhatsApp Direct</h4>
                   <p className="text-[10px] font-medium text-[#AAA] tracking-widest uppercase">Zimbabwe (+263)</p>
                 </div>
               </div>
               <div className="flex items-center gap-4 h-16 border-b border-border mb-4">
                  <span className="text-2xl font-black text-[#CCC]">+263</span>
                  <input 
                    autoFocus
                    type="tel"
                    value={data.whatsapp}
                    onChange={(e) => setData({ ...data, whatsapp: e.target.value })}
                    placeholder="77 000 0000"
                    className="flex-1 bg-transparent text-2xl font-black text-soft-black outline-none placeholder:text-[#EEE]"
                  />
               </div>
            </div>
         </div>
       );

    case 26: // Building Automation
      return <BuildingLoader name={data.shopName} onComplete={nextStep} />;

    case 27: // Reveal
      return <RevealShop shopName={data.shopName} data={data} nextStep={nextStep} />;

    case 28: // Next Steps
      return <NextSteps shopName={data.shopName} />;

    default:
      return (
        <div className="flex-1 flex items-center justify-center">
           <div className="bg-warm-grey p-12 rounded-[40px] text-center">
              <Zap className="mx-auto mb-4 text-[#AAA]" />
              <p className="font-black uppercase tracking-widest text-[10px] text-[#AAA]">Coming soon</p>
           </div>
        </div>
      );
  }
};

const BuildingLoader = ({ name, onComplete }: any) => {
  const [active, setActive] = useState(0);
  const items = [
    'Forging digital identity',
    'Syncing product vaults',
    'Activating live circuits',
    'Generating secure links',
    'Establishing the empire'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => {
        if (prev < items.length) return prev + 1;
        clearInterval(timer);
        setTimeout(onComplete, 1500);
        return prev;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [items.length, onComplete]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="relative w-32 h-32 mb-16">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="64" cy="64" r="60" 
            fill="none" stroke="#EEE" strokeWidth="2"
          />
          <motion.circle 
            cx="64" cy="64" r="60" 
            fill="none" stroke="#FF5FA2" strokeWidth="2"
            strokeDasharray={377}
            initial={{ strokeDashoffset: 377 }}
            animate={{ strokeDashoffset: 377 - (377 * (active / items.length)) }}
            transition={{ duration: 1, ease: "circOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-syne font-black text-soft-black">
          {Math.round((active / items.length) * 100)}%
        </div>
      </div>

      <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#AAA] mb-12">Building {name}</h2>

      <div className="space-y-4 w-full max-w-[240px]">
        {items.map((item, i) => (
          <motion.div 
            key={`onboarding-item-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ 
              opacity: active > i ? 1 : (active === i ? 0.3 : 0.1),
              x: active > i ? 0 : -5
            }}
            className="flex items-center gap-4 text-left"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${active > i ? 'bg-primary shadow-[0_0_8px_#FF5FA2]' : 'bg-[#EEE]'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${active > i ? 'text-soft-black' : 'text-[#AAA]'}`}>{item}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const RevealShop = ({ shopName, data, nextStep }: any) => {
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF5FA2', '#111111', '#ECE9E4']
    });
  }, []);

  const handleCopy = () => {
    const url = `threadzw.com/shop/${shopName.toLowerCase().replace(/\s/g, '-')}`;
    navigator.clipboard.writeText(url);
    toast.success('Identity link copied');
  };

  return (
    <div className="flex-1 flex flex-col items-center pt-12">
      <div className="w-20 h-20 rounded-full bg-soft-black flex items-center justify-center mb-8 shadow-heavy">
         <Sparkles className="text-primary" size={32} />
      </div>
      <h2 className="text-5xl font-syne font-black tracking-tighter leading-[0.9] text-center mb-4">THE DOORS<br />ARE OPEN.</h2>
      <p className="text-muted-charcoal font-medium text-center mb-16 max-w-[240px]">Your shop is live on Thread ZW. Welcome to the elite tier.</p>
      
      <div className="w-full bg-white border border-border rounded-[48px] p-8 shadow-heavy mb-12 flex flex-col items-center text-center">
         <div className="w-24 h-24 rounded-full bg-warm-grey border border-border flex items-center justify-center text-5xl mb-6">
           {data.category === 'clothing' ? '👕' : data.category === 'sneakers' ? '👟' : '🔥'}
         </div>
         <h3 className="text-2xl font-syne font-black text-soft-black mb-1">{shopName}</h3>
         <p className="text-[10px] font-black uppercase tracking-widest text-[#AAA]">
           {CATEGORIES.find(c => c.id === data.category)?.name} • {data.town}
         </p>
      </div>

      <div className="w-full flex gap-3">
         <button 
           onClick={handleCopy}
           className="flex-1 h-16 bg-soft-black text-white rounded-full font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
         >
           Copy Shop Link
         </button>
         <button className="w-16 h-16 border border-border rounded-full flex items-center justify-center text-soft-black active:scale-95 transition-all">
           <Share2 size={24} />
         </button>
      </div>
      
      <button 
        onClick={nextStep}
        className="mt-12 text-[10px] font-black uppercase tracking-widest text-[#AAA] hover:text-soft-black transition-colors"
      >
        Continue to Dashboard
      </button>
    </div>
  );
};

const NextSteps = ({ shopName }: any) => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-4xl font-syne font-black tracking-tighter leading-[0.9] mb-12">THE NEXT<br />CHAPTER.</h2>
      
      <div className="space-y-8">
        <NextStepItem 
          num={1} color="#22C55E" icon={<Check size={14} strokeWidth={4} />}
          title="IDENTITY ESTABLISHED"
          desc="Your link is active. Share it in your Instagram bio to start taking professional orders."
          isDone
        />
        <NextStepItem 
          num={2} color="#FF5FA2"
          title="CURATE YOUR VAULT"
          desc="Upload your first 5 products. Shops with products get 10x more visibility in the Mall."
        />
        <NextStepItem 
          num={3} color="#AAA"
          title="ELITE SUPPORT"
          desc="Our team will reach out via WhatsApp to help you scale your operations."
        />
      </div>

      <div className="mt-auto pb-12">
        <button 
          onClick={() => navigate('/shop-centre')}
          className="w-full h-20 bg-soft-black text-white rounded-full font-black text-sm uppercase tracking-widest shadow-heavy active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          ENTER SHOP CENTRE
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

const NextStepItem = ({ num, color, icon, title, desc, isDone }: any) => (
  <div className="flex gap-6">
    <div className="flex flex-col items-center gap-3">
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2" 
        style={{ borderColor: color, backgroundColor: isDone ? color : 'transparent', color: isDone ? 'white' : color }}
      >
        {isDone ? icon : <span className="font-black text-xs">{num}</span>}
      </div>
      <div className="w-[1px] h-full bg-border rounded-full last:hidden" />
    </div>
    <div className="flex flex-col gap-1 pb-4">
      <h4 className="text-soft-black font-black text-xs uppercase tracking-widest">{title}</h4>
      <p className="text-muted-charcoal text-[13px] font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);
