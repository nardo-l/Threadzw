import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Check, Camera, Image as ImageIcon, Search, MessageSquare, 
  Eye, EyeOff, ShoppingBag, Smartphone, Store, Clock, Flame, Send,
  ArrowRight, Lock, AlertCircle, TrendingUp, CheckCircle2, Package,
  DollarSign, BarChart2, MapPin, Tag, Trophy, AlertTriangle, RefreshCw, HelpCircle, Shirt, Briefcase, Gem, Sparkles,
  X, MessageCircle, Unlock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useDemoShop } from '../hooks/useDemoShop';
import { useGlobalCategories } from '../hooks/useGlobalCategories';

// Hero icon component
interface HeroIconProps {
  icon: React.ComponentType<any>;
  color: string;
}

const HeroIcon: React.FC<HeroIconProps> = ({ icon: Icon, color }) => (
  <div style={{
    width: 96,
    height: 96,
    borderRadius: 24,
    background: `rgba(${color}, 0.1)`,
    border: `1.5px solid rgba(${color}, 0.2)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px'
  }}>
    <Icon 
      size={44} 
      color={`rgba(${color}, 1)`}
      strokeWidth={1.5}
    />
  </div>
);

// Official WhatsApp SVG icon component
const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297
      -.149-1.758-.867-2.03-.967
      -.273-.099-.471-.148-.67.15
      -.197.297-.767.966-.94 1.164
      -.173.199-.347.223-.644.075
      -.297-.15-1.255-.463-2.39-1.475
      -.883-.788-1.48-1.761-1.653
      -2.059-.173-.297-.018-.458.13
      -.606.134-.133.298-.347.446
      -.52.149-.174.198-.298.298
      -.497.099-.198.05-.371-.025
      -.52-.075-.149-.669-1.612
      -.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371
      -.01-.57-.01-.198 0-.52.074
      -.792.372-.272.297-1.04 
      1.016-1.04 2.479 0 1.462
      1.065 2.875 1.213 3.074.149
      .198 2.096 3.2 5.077 4.487
      .709.306 1.262.489 1.694.625
      .712.227 1.36.195 1.871.118
      .571-.085 1.758-.719 2.006
      -1.413.248-.694.248-1.289
      .173-1.413-.074-.124-.272
      -.198-.57-.347m-5.421 7.403h
      -.004a9.87 9.87 0 01-5.031
      -1.378l-.361-.214-3.741.982
      .998-3.648-.235-.374a9.86 9.86
      0 01-1.51-5.26c.001-5.45 
      4.436-9.884 9.888-9.884 2.64
      0 5.122 1.03 6.988 2.898a9.825
      9.825 0 012.893 6.994c-.003
      5.45-4.437 9.884-9.885 
      9.884m8.413-18.297A11.815 
      11.815 0 0012.05 0C5.495 0 
      .16 5.335.157 11.892c0 2.096
      .547 4.142 1.588 5.945L.057 
      24l6.305-1.654a11.882 11.882
      0 005.683 1.448h.005c6.554 0
      11.89-5.335 11.893-11.893a11.821
      11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const generateSlug = (shopName: string): string => {
  return shopName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    // Remove special characters
    .replace(/\s+/g, '')
    // Remove all spaces
    .replace(/-+/g, '-');
    // Clean up dashes
};

export const generateUniqueSlug = async (shopName: string): Promise<string> => {
  const baseSlug = generateSlug(shopName);
  
  // Check if slug already exists
  const { data } = await supabase
    .from('shops')
    .select('id, slug')
    .eq('slug', baseSlug)
    .maybeSingle();
  
  if (!data || (data.id && String(data.id).startsWith('local-'))) {
    // Slug is available
    return baseSlug;
  }
  
  // Slug taken, try with numbers
  let counter = 2;
  while (counter < 8) { // Prevent infinite loop in local fallback/sandbox mode
    const newSlug = `${baseSlug}${counter}`;
    
    const { data: existing } = await supabase
      .from('shops')
      .select('id, slug')
      .eq('slug', newSlug)
      .maybeSingle();
    
    if (!existing || (existing.id && String(existing.id).startsWith('local-'))) return newSlug;
    counter++;
  }
  return `${baseSlug}${Math.floor(1000 + Math.random() * 9000)}`;
};

interface OnboardingFlowProps {
  setAppStage: (stage: 'landing' | 'paywall' | 'building' | 'dashboard' | 'admin' | 'shop' | 'product') => void;
  setPaywallScreen?: (screen: number) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ 
  setAppStage,
  setPaywallScreen: setGlobalPaywallScreen
}) => {
  const { demoShop, demoProducts, screenshots, loading: demoLoading } = useDemoShop();
  const { categories: globalCategories } = useGlobalCategories();
  const [screen, setScreen] = useState(1);

  // Phase tracking
  // Form responses
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const formData = React.useMemo(() => ({
    shopName,
    category,
    description,
    priceRange,
    city,
    whatsapp,
    instagram
  }), [shopName, category, description, priceRange, city, whatsapp, instagram]);

  // Selection visual toggles
  const [q1Answer, setQ1Answer] = useState<string | null>(null);
  const [q2Answer, setQ2Answer] = useState<string | null>(null);
  const [q3Answer, setQ3Answer] = useState<string | null>(null);

  // Signup fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [signingUp, setSigningUp] = useState(false);

  // Building loader
  const [loadProgress, setLoadProgress] = useState(0);
  const [visibleChecks, setVisibleChecks] = useState<number[]>([]);

  // Paywall Step (1 to 4) on custom Phase 5
  const [paywallStep, setPaywallStep] = useState(1);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Handle browser back and custom route pop overrides
  useEffect(() => {
    const handlePopState = () => {
      if (screen === 1 || screen === 26) return;
      if (screen >= 27 && screen <= 30) {
        // Paywall custom back rules
        if (screen === 27) {
          setScreen(25);
        } else if (screen === 30) {
          // No back on paywall screen 4
        } else {
          setScreen(prev => prev - 1);
        }
      } else {
        setScreen(prev => prev - 1);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [screen]);

  // Username validation helper
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }
    const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (cleaned.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('shops')
          .select('id')
          .eq('handle', cleaned)
          .maybeSingle();
        setUsernameAvailable(!data);
      } catch (err) {
        setUsernameAvailable(true);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Sync to auto progress for Screen 2 (DM)
  useEffect(() => {
    if (screen === 2 && q1Answer) {
      const timer = setTimeout(() => setScreen(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [screen, q1Answer]);

  // Sync to auto progress for Screen 3 (2am purchase)
  useEffect(() => {
    if (screen === 3 && q2Answer) {
      const timer = setTimeout(() => setScreen(4), 2000);
      return () => clearTimeout(timer);
    }
  }, [screen, q2Answer]);

  // Sync to auto progress for Screen 4 (Google search)
  useEffect(() => {
    if (screen === 4 && q3Answer) {
      const timer = setTimeout(() => setScreen(5), 2500);
      return () => clearTimeout(timer);
    }
  }, [screen, q3Answer]);

  // Auto progress for Screen 8 (Competitors list)
  useEffect(() => {
    if (screen === 8) {
      const timer = setTimeout(() => setScreen(9), 3000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Live Screen 26 Building Animation ticker (5s)
  useEffect(() => {
    if (screen === 26) {
      setLoadProgress(0);
      setVisibleChecks([]);
      
      const interval = setInterval(() => {
        setLoadProgress(p => {
          if (p >= 100) return 100;
          return p + 2;
        });
      }, 100);

      const timers = [
        setTimeout(() => setVisibleChecks(v => [...v, 0]), 800),
        setTimeout(() => setVisibleChecks(v => [...v, 1]), 1600),
        setTimeout(() => setVisibleChecks(v => [...v, 2]), 2400),
        setTimeout(() => setVisibleChecks(v => [...v, 3]), 3200),
        setTimeout(() => {
          setScreen(27); // Advances to Paywall Screen 1 (Phase 5)
        }, 5000)
      ];

      return () => {
        clearInterval(interval);
        timers.forEach(clearTimeout);
      };
    }
  }, [screen]);

  const handleBack = () => {
    if (screen === 1 || screen === 26) return;
    if (screen === 27) {
      setScreen(25);
    } else if (screen === 30) {
      // Screen 30 (paywall 4) has no back
    } else {
      setScreen(prev => prev - 1);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSignUpSubmit = async () => {
    if (signingUp) return;
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    if (!cleanUsername || cleanUsername.length < 3) {
      toast.error('Choose a valid shop handle username.');
      return;
    }
    if (usernameAvailable === false) {
      toast.error('This shop handle username is already taken.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSigningUp(true);
    try {
      // 1. Create supabase Auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            username: cleanUsername,
            display_name: shopName || 'ThreadZW Merchant',
            handle: cleanUsername
          }
        }
      });

      let activeUserId = '';
      if (authError) {
        if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already exists')) {
          const { data: sData, error: sErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password
          });
          if (sErr) {
            throw new Error('This email is already registered. Please check credentials or sign in.');
          }
          activeUserId = sData.user?.id || '';
        } else {
          throw authError;
        }
      } else {
        activeUserId = authData.user?.id || '';
      }

      if (!activeUserId) {
        throw new Error('Could not establish secure login session.');
      }

      // 2. Setup/Upsert user profiles database record
      await supabase.from('profiles').upsert({
        id: activeUserId,
        display_name: shopName || 'ThreadZW Merchant',
        email: email.trim().toLowerCase(),
        whatsapp_number: whatsapp || '0776223144',
        onboarding_complete: true // Set to true since they completed this flow
      });

      let finalLogoUrl = logoPreview;
      let finalBannerUrl = bannerPreview;

      // Upload logo if selected
      if (logoFile && activeUserId) {
        try {
          const ext = logoFile.name.split('.').pop();
          const filePath = `${activeUserId}/logo_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('shop-avatars')
            .upload(filePath, logoFile, { upsert: true });
          
          if (!uploadErr) {
            const { data: logoPub } = supabase.storage.from('shop-avatars').getPublicUrl(filePath);
            finalLogoUrl = logoPub.publicUrl;
          }
        } catch (err) {
          console.error('Logo upload error during onboarding:', err);
        }
      }

      // Upload banner if selected
      if (bannerFile && activeUserId) {
        try {
          const ext = bannerFile.name.split('.').pop();
          const filePath = `${activeUserId}/banner_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('shop-images')
            .upload(filePath, bannerFile, { upsert: true });
          
          if (!uploadErr) {
            const { data: bannerPub } = supabase.storage.from('shop-images').getPublicUrl(filePath);
            finalBannerUrl = bannerPub.publicUrl;
          }
        } catch (err) {
          console.error('Banner upload error during onboarding:', err);
        }
      }

      // 3. Connect/Insert shop config
      const trialEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const generatedSlug = await generateUniqueSlug(shopName || 'My Shop');
      const { error: shopError } = await supabase.from('shops').upsert({
        owner_id: activeUserId,
        name: shopName || 'My Shop',
        handle: cleanUsername,
        slug: generatedSlug,
        categories: [category || 'Clothing'],
        location: city || 'Harare',
        whatsapp: whatsapp || '0776223144',
        instagram: instagram || null,
        description: description || 'Zim clothing store',
        logo_url: finalLogoUrl,
        banner_url: finalBannerUrl,
        plan: 'shop',
        subscription_status: 'trial',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEnds.toISOString(),
        is_live: true
      });

      if (shopError) throw shopError;

      // 4. Record local stage values
      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.removeItem('threadzw_onboarding_step');
      localStorage.setItem('threadzw_owner_name', shopName || 'Merchant');

      // Proceed to Building Screen countdown animation state
      setScreen(26);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred during account creation.');
    } finally {
      setSigningUp(false);
    }
  };

  const handleFinishPaywall = async () => {
    try {
      localStorage.setItem('threadzw_onboarding_complete', 'true');
      localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
      localStorage.setItem('threadzw_shop_onboarding_first_time', 'done');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('profiles').update({
          onboarding_complete: true // Mark as finished to prevent duplicate layouts
        }).eq('id', session.user.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAppStage('dashboard');
    }
  };

  // Helper values for screen index mapping
  const currentProgress = screen >= 27 ? 100 : Math.round(((screen - 1) / 25) * 100);

  // ZIM city lists
  const zimCities = [
    'Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Masvingo', 'Kwekwe', 'Online only'
  ];
  const filteredCities = zimCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  return (
    <div id="threadzw-immersive-onboarding" className="fixed inset-0 bg-[#0a0a0a] text-white flex flex-col font-sans select-none overflow-hidden z-[45] selection:bg-[#c8ff00]/30">
      
      {/* 1. TOP PROGRESS BAR */}
      <div className="w-full h-[3px] bg-white/5 relative z-50">
        <div 
          style={{ width: `${currentProgress}%` }} 
          className="h-full bg-[#c8ff00] transition-all duration-300 ease-out" 
        />
      </div>

      {/* 2. HEADER BAR (except first welcome and animation screen) */}
      {screen > 1 && screen !== 26 && screen !== 30 && (
        <div className="h-14 px-4 flex items-center justify-between z-50">
          <button 
            onClick={handleBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <span className="threadzw-wordmark text-[#c8ff00] font-black uppercase text-base tracking-tighter">
            ThreadZW
          </span>
          <div className="w-10 h-10" />
        </div>
      )}

      {screen === 1 && (
        <div className="h-14 flex items-center justify-center pt-5">
          <span className="threadzw-wordmark text-[#c8ff00] font-black uppercase text-xl tracking-tighter">
            ThreadZW
          </span>
        </div>
      )}

      {/* 3. SCREENS BODY CONTAINER */}
      <div className="flex-1 w-full max-w-[430px] mx-auto px-5 flex flex-col justify-between pb-8 pt-4 overflow-y-auto no-scrollbar">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col justify-between"
          >
            {/* SCREEN 1: WELCOME */}
            {screen === 1 && (
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 my-auto">
                <motion.span 
                  animate={{ rotate: [0, 15, -15, 15, 0] }}
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                  className="text-7xl"
                >
                  👋
                </motion.span>
                <div className="space-y-3">
                  <h1 className="text-3xl font-[900] tracking-tight text-white leading-tight">
                    Hey. Quick question.
                  </h1>
                  <p className="text-white/50 text-base font-medium">
                    Be honest. It'll take 30 seconds.
                  </p>
                </div>
                <button 
                  onClick={() => setScreen(2)}
                  className="w-full h-13 mt-6 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px] flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer transition-transform"
                >
                  Let's go &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 2: DM PRICES */}
            {screen === 2 && (
              <div className="flex-1 flex flex-col justify-center space-y-8 my-auto">
                <span className="text-[#c8ff00] text-[11px] font-black uppercase tracking-widest block text-center">
                  PHASE 1: REALITY CHECK
                </span>
                <h1 className="text-2xl font-[900] text-center tracking-tight text-white leading-snug">
                  Customers DM you asking prices all day?
                </h1>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setQ1Answer('yes')}
                    className={`aspect-square rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border transition-all ${
                      q1Answer === 'yes' 
                        ? 'bg-[#c8ff00]/5 border-[#c8ff00]' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-5xl">😤</span>
                    <span className="font-extrabold text-sm">Yes, constantly</span>
                  </button>

                  <button 
                    onClick={() => {
                      setQ1Answer('no');
                      setTimeout(() => setScreen(3), 800);
                    }}
                    className={`aspect-square rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border transition-all ${
                      q1Answer === 'no' 
                        ? 'bg-[#c8ff00]/5 border-[#c8ff00]' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-5xl">😌</span>
                    <span className="font-extrabold text-sm">Not really</span>
                  </button>
                </div>

                {q1Answer === 'yes' && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[#FF6464] text-center font-bold text-sm tracking-tight"
                  >
                    You're losing sales every single day.
                  </motion.p>
                )}
              </div>
            )}

            {/* SCREEN 3: 2AM BUYING */}
            {screen === 3 && (
              <div className="flex-1 flex flex-col justify-center space-y-8 my-auto">
                <span className="text-[#c8ff00] text-[11px] font-black uppercase tracking-widest block text-center">
                  PHASE 1: REALITY CHECK
                </span>
                <h1 className="text-2xl font-[900] text-center tracking-tight text-white leading-snug">
                  Can customers buy from you at 2am?
                </h1>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setQ2Answer('yes');
                      setTimeout(() => setScreen(4), 800);
                    }}
                    className={`aspect-square rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border transition-all ${
                      q2Answer === 'yes' 
                        ? 'bg-[#c8ff00]/5 border-[#c8ff00]' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                               <CheckCircle2 className="text-[#c8ff00] w-10 h-10" />
                    <span className="font-extrabold text-sm">Yes they can</span>
                  </button>

                  <button 
                    onClick={() => setQ2Answer('no')}
                    className={`aspect-square rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border transition-all ${
                      q2Answer === 'no' 
                        ? 'bg-[#c8ff00]/5 border-[#c8ff00]' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-red-500/50 flex items-center justify-center text-red-500">
                      <X size={20} />
                    </div>
                    <span className="font-extrabold text-sm">No they can't</span>
                  </button>
                </div>

                {q2Answer === 'no' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center"
                  >
                    <Clock size={28} className="text-[#c8ff00] shrink-0" />
                    <div className="text-left">
                      <h4 className="font-black text-white text-base">67% of browsing happens after 9pm</h4>
                      <p className="text-white/50 text-xs">While you sleep, sales disappear.</p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* SCREEN 4: GOOGLE INVISIBLE */}
            {screen === 4 && (
              <div className="flex-1 flex flex-col justify-center space-y-8 my-auto">
                <span className="text-[#c8ff00] text-[11px] font-black uppercase tracking-widest block text-center">
                  PHASE 1: REALITY CHECK
                </span>
                <h1 className="text-2xl font-[900] text-center tracking-tight text-white leading-snug">
                  Does your shop show on Google?
                </h1>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setQ3Answer('yes');
                      setTimeout(() => setScreen(5), 800);
                    }}
                    className={`aspect-square rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border transition-all ${
                      q3Answer === 'yes' 
                        ? 'bg-[#c8ff00]/5 border-[#c8ff00]' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <Search className="text-[#c8ff00] w-10 h-10" />
                    <span className="font-extrabold text-sm">Yes it does</span>
                  </button>

                  <button 
                    onClick={() => setQ3Answer('no')}
                    className={`aspect-square rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border transition-all ${
                      q3Answer === 'no' 
                        ? 'bg-[#c8ff00]/5 border-[#c8ff00]' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <EyeOff className="text-[#FF6464] w-10 h-10" />
                    <span className="font-extrabold text-sm">I'm invisible</span>
                  </button>
                </div>

                {q3Answer === 'no' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
                  >
                    <div className="space-y-1.5 font-mono text-[11px] text-left">
                      <div className="flex justify-between text-white/40 border-b border-white/5 pb-1 gap-2 items-center">
                        <span className="flex items-center gap-1.5"><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c864' }} className="inline-block" /> HarareFits</span>
                        <span className="text-[#22C55E] font-bold">ONLINE</span>
                      </div>
                      <div className="flex justify-between text-white/40 border-b border-white/5 pb-1 gap-2 items-center">
                        <span className="flex items-center gap-1.5"><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c864' }} className="inline-block" /> VintageZim</span>
                        <span className="text-[#22C55E] font-bold">ONLINE</span>
                      </div>
                      <div className="flex justify-between text-white border border-[#c8ff00]/30 bg-[#c8ff00]/5 p-1 rounded-md animate-pulse gap-2 items-center">
                        <span className="font-bold text-white flex items-center gap-1.5"><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4444' }} className="inline-block" /> [Your Store]</span>
                        <span className="text-[#EF4444] font-bold">NOT FOUND</span>
                      </div>
                    </div>
                    <p className="text-[#c8ff00] font-black text-xs text-center mt-3">
                      Your competitors are searchable.
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* SCREEN 5: STAT BOMB */}
            {screen === 5 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <HeroIcon icon={DollarSign} color="255,68,68" />
                  </motion.div>

                  <h1 className="text-4xl font-[950] tracking-tighter text-white">
                    23 customers
                  </h1>
                  <p className="text-white/60 text-base max-w-[280px]">
                    asked for prices on WhatsApp last week and disappeared.
                  </p>

                  <div className="w-20 h-[1px] bg-white/10" />

                  <h1 className="text-5xl font-[950] tracking-tighter text-[#EF4444]">
                    $0
                  </h1>
                  <p className="text-white/60 text-base">
                    you made from them.
                  </p>

                  <span className="text-white/30 text-xs italic block mt-1">
                    (Average for ZIM fashion sellers)
                  </span>
                </div>

                <button 
                  onClick={() => setScreen(6)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px] flex items-center justify-center gap-1"
                >
                  That ends today &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 6: ALARM ALARM */}
            {screen === 6 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="text-center">
                    <span className="text-[#c8ff00] text-[11px] font-black uppercase tracking-widest block mb-4">
                      PHASE 2: WAKE UP
                    </span>
                    <motion.div 
                      animate={{ rotate: [-6, 6, -6, 6, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 1.5 }}
                    >
                      <HeroIcon icon={Clock} color="255,170,0" />
                    </motion.div>
                  </div>

                  <div className="bg-white/5 border border-white/15 rounded-2xl p-5 space-y-3 shadow-lg">
                    <span className="font-mono text-3xl font-black text-orange-500 tracking-tight block text-center">
                      2:47 AM
                    </span>
                    <p className="text-white/70 text-sm font-bold text-center">
                      Someone searched for streetwear in Harare.
                    </p>
                    <p className="text-[#EF4444] text-xs font-black text-center uppercase tracking-wider">
                      ✗ Your store was offline.
                    </p>
                  </div>

                  <h3 className="text-2xl font-[900] text-center tracking-tight text-white leading-tight mt-2">
                    You missed that sale.<br/>And the 12 before it.
                  </h3>
                </div>

                <button 
                  onClick={() => setScreen(7)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  Show me what I'm losing &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 7: BAR GRAPH */}
            {screen === 7 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="flex-1 flex flex-col justify-center space-y-8">
                  <h1 className="text-2xl font-[900] text-center tracking-tight text-white líder-tight">
                    Here's what an online shop changes.
                  </h1>

                  {/* Graphic columns */}
                  <div className="flex justify-center items-end h-40 gap-8 border-b border-white/10 pb-2 px-10">
                    <div className="flex flex-col items-center flex-1 space-y-2">
                      <div className="w-full bg-white/20 rounded-t-lg h-8" />
                      <span className="font-bold text-xs text-white/50">Now</span>
                    </div>

                    <div className="flex flex-col items-center flex-1 space-y-2">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: "130px" }}
                        transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                        className="w-full bg-[#c8ff00] rounded-t-lg"
                      />
                      <span className="font-bold text-xs text-[#c8ff00]">Online</span>
                    </div>
                  </div>

                  <div className="text-center space-y-1.5 px-4">
                    <h4 className="font-black text-white text-lg">Shops online sell 3× more.</h4>
                    <p className="text-white/50 text-sm">Same products. Just visible.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(8)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  Continue &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 8: WHILE YOU READ THIS */}
            {screen === 8 && (
              <div className="flex-1 flex flex-col justify-center space-y-8 my-auto">
                <h1 className="text-2xl font-[900] text-center tracking-tight text-white leading-tight">
                  While you read this...
                </h1>

                <div className="space-y-3">
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between text-xs font-bold font-sans"
                  >
                    <span className="flex items-center gap-1.5"><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c864' }} className="inline-block" /> {demoShop?.name || 'DemoShop'}</span>
                    <span className="text-white/60">just got an order</span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between text-xs font-bold font-sans"
                  >
                    <span className="flex items-center gap-1.5"><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c864' }} className="inline-block" /> HarareFits</span>
                    <span className="text-white/60">just got a WhatsApp</span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.4 }}
                    className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between text-xs font-bold font-sans"
                  >
                    <span className="flex items-center gap-1.5"><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c864' }} className="inline-block" /> ZimDrip</span>
                    <span className="text-white/60">just got a new follower</span>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2 }}
                    className="bg-[#EF4444]/5 border border-[#c8ff00]/40 p-4 rounded-xl flex items-center justify-between text-xs font-bold animate-pulse font-sans"
                  >
                    <span className="text-white font-[950] flex items-center gap-1.5"><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4444' }} className="inline-block" /> Your store</span>
                    <span className="text-[#EF4444] font-black">still offline</span>
                  </motion.div>
                </div>
              </div>
            )}

            {/* SCREEN 9: TRANSITION ⚡ */}
            {screen === 9 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                  <span className="text-[#c8ff00] text-[11px] font-black uppercase tracking-widest block">
                    PHASE 3: THE SHIFT
                  </span>
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-7xl block"
                  >
                    ⚡
                  </motion.span>
                  <div className="space-y-4">
                    <h2 className="text-2xl font-[900] leading-tight text-white px-2">
                      You've been selling with the wrong tools.
                    </h2>
                    
                    <motion.h2 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-2xl font-[950] text-[#c8ff00]"
                    >
                      That changes now.
                    </motion.h2>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(10)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  I'm ready &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 10: YOUR LINK */}
            {screen === 10 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-1">
                    <span className="text-white/40 text-xs font-bold block uppercase tracking-wider">Your Instant Link</span>
                    <code className="text-[#c8ff00] font-mono text-md font-black block break-all">
                      threadzw.vercel.app/shop/<span className="underline select-all">{generateSlug(shopName || 'yourshop')}</span>
                    </code>
                  </div>

                  <div className="text-center space-y-3">
                    <h3 className="text-3xl font-[950] tracking-tight leading-tight">
                      One link.<br/>Share it everywhere.
                    </h3>
                    <p className="text-white/50 text-sm font-bold">
                      Instagram bio. TikTok. WhatsApp status.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(11)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  Continue &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 11: WHATSAPP ORDER */}
            {screen === 11 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="flex-1 flex flex-col justify-center space-y-8">
                  <div className="text-center">
                    <HeroIcon icon={MessageCircle} color="200,255,0" />
                  </div>

                  {/* iOS Notification Card */}
                  <motion.div 
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-xl text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c864' }} className="inline-block" />
                      <span className="font-extrabold text-xs text-white">WhatsApp</span>
                      <span className="text-white/40 text-[10px] ml-auto">now</span>
                    </div>
                    <h4 className="font-black text-sm text-white">New order from Customer!</h4>
                    <p className="text-white/70 text-xs mt-0.5">"Hi I want the cargo pants size M"</p>
                  </motion.div>

                  <div className="text-center space-y-3">
                    <h3 className="text-2xl font-[950] tracking-tight leading-tight">
                      Customers order.<br/>You just confirm.
                    </h3>
                    <p className="text-white/50 text-sm font-bold">
                      No more explaining sizes 10 times.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(12)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  Continue &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 12: SALES TRACKING */}
            {screen === 12 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="flex-1 flex flex-col justify-center space-y-8">
                  <h3 className="text-xl font-[900] text-center tracking-tight text-white leading-tight">
                    Know exactly what's selling.
                  </h3>

                  {/* Bar Chart Weeks */}
                  <div className="flex justify-between items-end h-32 border-b border-white/10 pb-2 px-6">
                    {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((day, idx) => {
                      const heights = ["20%", "45%", "85%", "60%", "30%"];
                      return (
                        <div key={day} className="flex flex-col items-center flex-1 space-y-2 relative">
                          {idx === 2 && (
                            <span className="absolute -top-7 text-[#c8ff00] animate-bounce"><Flame size={20} /></span>
                          )}
                          <div style={{ height: heights[idx] }} className="w-6 bg-[#c8ff00] rounded-sm" />
                          <span className="font-mono text-[9px] text-white/40 font-bold">{day}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 justify-center">
                    <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/80 font-bold flex items-center gap-1"><TrendingUp size={14} className="text-[#c8ff00]" /> +47% avg revenue</span>
                    <span className="bg-white/5 border border-[#c8ff00]/20 rounded-full px-3 py-1.5 text-xs text-white/80 font-bold flex items-center gap-1"><Trophy size={14} className="text-[#c8ff00]" /> Best seller tracked</span>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(13)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  Continue &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 13: PREVIEW mockup */}
            {screen === 13 && (
              <div className="flex-1 flex flex-col justify-between py-4">
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <h3 className="text-xl font-[900] text-center tracking-tight text-white animate-fade-in">
                    Your shop will look like this.
                  </h3>

                  {demoLoading ? (
                    <div className="w-[180px] h-[240px] rounded-[22px] mx-auto animate-shimmer bg-white/[0.04]" />
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      {screenshots && screenshots.length > 0 ? (
                        /* Horizontal scroll of real screenshots (FIX 5) */
                        <div className="w-full flex gap-3 overflow-x-auto py-2 no-scrollbar px-4">
                          {screenshots.map(shot => (
                            <div 
                              key={shot.id} 
                              style={{
                                minWidth: 200,
                                borderRadius: 16,
                                overflow: 'hidden',
                                flexShrink: 0
                              }}
                              className="border border-white/10 bg-[#151515]"
                            >
                              <img 
                                src={shot.image_url}
                                style={{
                                  width: '100%',
                                  height: 380,
                                  objectFit: 'cover'
                                }}
                                alt=""
                                referrerPolicy="no-referrer"
                              />
                              {shot.caption && (
                                <p style={{
                                  fontSize: 12,
                                  color: 'rgba(255,255,255,0.4)',
                                  padding: '8px 12px'
                                }} className="font-sans text-center">
                                  {shot.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Fallback when no screenshots uploaded: screen phone mockup with live demo shop data (FIX 3) AND coming soon indicator */
                        <div className="w-full space-y-4 flex flex-col items-center">
                          {/* Real-time demo shop mockup (FIX 3) */}
                          <div className="w-[200px] h-[280px] bg-[#111] border-[4px] border-white/15 rounded-[22px] mx-auto overflow-hidden shadow-2xl flex flex-col relative text-[8px]">
                            <div className="h-1 w-16 bg-white/20 rounded-full mx-auto mt-1 mb-1.5" />
                            
                            {/* Cover Banner placeholder */}
                            <div 
                              style={{
                                height: 56,
                                backgroundImage: demoShop?.banner_url ? `url(${demoShop.banner_url})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundColor: '#1E1B4B'
                              }}
                              className="relative flex items-end px-2 pb-1 bg-gradient-to-r from-zinc-800 to-stone-800"
                            >
                              {/* logo circle */}
                              <div 
                                style={{
                                  backgroundImage: demoShop?.logo_url ? `url(${demoShop.logo_url})` : 'none',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  backgroundColor: '#111'
                                }}
                                className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center font-bold"
                              >
                                {!demoShop?.logo_url && (
                                  <span className="text-[5px] font-sans text-white">
                                    {demoShop?.name ? demoShop.name.charAt(0).toUpperCase() : 'S'}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Text items */}
                            <div className="p-2 space-y-1 text-left">
                              <h5 className="font-sans font-black text-white leading-none truncate">{demoShop?.name || 'My Shop'}</h5>
                              <p className="text-white/40 text-[6px] leading-tight truncate">{demoShop?.location || 'Harare'} &bull; clothing category</p>
                              
                              {/* Products visual representation */}
                              {demoProducts.length === 0 ? (
                                <div className="text-center text-[7px] text-white/30 py-4 font-bold font-sans">
                                  No products in stock
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-1 pt-1">
                                  {demoProducts.slice(0, 2).map((product, idx) => (
                                    <div key={product.id || idx} className="bg-white/5 aspect-square rounded-md p-1 flex flex-col justify-between border border-white/5 overflow-hidden">
                                      {product.image_url ? (
                                        <img 
                                          src={product.image_url} 
                                          className="w-full h-8 object-cover rounded-sm mx-auto" 
                                          alt=""
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <div className="w-full h-8 bg-zinc-800 rounded-sm" />
                                      )}
                                      <span className="font-sans font-black text-white text-[6px]">${product.price}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Interactive chat block line */}
                            <div className="absolute bottom-1.5 left-2 right-2 bg-[#25D366] py-1 flex items-center justify-center gap-1 font-sans font-black text-[7px] text-white rounded-md uppercase">
                              Chat on WhatsApp
                            </div>
                          </div>

                          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-wider font-sans">Screenshots coming soon</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-center text-white/40 text-xs">
                    Professional. Live in minutes.
                  </p>
                </div>

                <button 
                  onClick={() => setScreen(14)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  Build my shop &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 14: TRANSITION 🚀 */}
            {screen === 14 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                  <span className="text-[#c8ff00] text-[11px] font-black uppercase tracking-widest block">
                    PHASE 4: BUILD YOUR SHOP
                  </span>
                  
                  <motion.span 
                    animate={{ y: [40, -40], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="text-7xl block"
                  >
                    🚀
                  </motion.span>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-[950] tracking-tighter text-white">
                      Let's build it.
                    </h2>
                    <p className="text-white/50 text-sm font-bold">
                      Takes less than 2 minutes.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(15)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  Start &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 15: SHOP NAME SETUP */}
            {screen === 15 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="flex-1 flex flex-col justify-center space-y-8">
                  <h2 className="text-2xl font-[900] tracking-tight text-white leading-tight">
                    What's your shop called?
                  </h2>
                  
                  <input 
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Harare Vintage"
                    className="w-full border-none border-b-2 border-white/15 focus:border-b-color-[#c8ff00] focus:border-b-2 focus:outline-none bg-transparent text-white font-[900] text-2xl py-3 placeholder:text-white/20 transition-all text-center"
                    autoFocus
                  />
                </div>

                <button 
                  disabled={!shopName.trim()}
                  onClick={() => setScreen(16)}
                  className={`w-full h-13 font-extrabold text-[15px] rounded-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    shopName.trim() ? 'bg-[#c8ff00] text-black' : 'bg-white/5 text-white/30 pointer-events-none'
                  }`}
                >
                  That's the name &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 16: WHAT YOU SELL (grid choice) */}
            {screen === 16 && (
              <Screen16
                categories={globalCategories}
                onSelect={setCategory}
                selectedCategory={category}
                step={screen}
                formData={formData}
                onNext={() => setScreen(17)}
              />
            )}

            {/* SCREEN 17: DESCRIBE SHOP */}
            {screen === 17 && (
              <div className="flex-1 flex flex-col justify-between py-4">
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <div>
                    <h2 className="text-xl font-[900] tracking-tight text-white leading-none mb-1">
                      Describe your shop.
                    </h2>
                    <p className="text-white/40 text-xs font-bold">One sentence.</p>
                  </div>

                  <div className="relative">
                    <textarea 
                      value={description}
                      onChange={(e) => {
                        if (e.target.value.length <= 120) {
                          setDescription(e.target.value);
                        }
                      }}
                      placeholder="e.g. Harare's finest collection of vintage items."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-[#c8ff00] focus:outline-none focus:ring-1 focus:ring-[#c8ff00] transition-colors resize-none mb-1.5"
                    />
                    <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white/30 font-mono">
                      {description.length}/120
                    </span>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="space-y-1.5">
                    <span className="text-white/30 text-[10px] font-black uppercase tracking-wider block">TAP TO FILL</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Exclusive streetwear fits.",
                        "Premium thrift & vintage finds.",
                        "Fresh drops every week.",
                        "Harare's best sneaker spot."
                      ].map(chip => (
                        <button
                          key={chip}
                          onClick={() => setDescription(chip)}
                          className="bg-white/5 hover:bg-white/10 p-2 py-1.5 rounded-lg text-xs text-white/70 border border-white/5 transition-colors cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(18)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  Continue &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 18: PRICE RANGE */}
            {screen === 18 && (
              <div className="flex-1 flex flex-col justify-between py-4">
                <div className="flex-1 flex flex-col justify-center space-y-6 animate-fade-in">
                  <h2 className="text-xl font-[900] text-center tracking-tight text-white leading-tight">
                    Your average price?
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Under $10",
                      "$10 — $30",
                      "$30 — $100",
                      "$100+",
                      "Mixed prices"
                    ].map(price => {
                      const isSelected = priceRange === price;
                      return (
                        <button
                          key={price}
                          onClick={() => setPriceRange(price)}
                          className={`p-4 rounded-xl text-center border font-bold text-xs transition-all ${
                            isSelected 
                              ? 'bg-[#c8ff00]/10 border-[#c8ff00] text-white' 
                              : 'bg-white/5 border-white/10 text-white/70'
                          }`}
                        >
                          {price}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setScreen(19)}
                    className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                  >
                    Continue &rarr;
                  </button>
                  <button 
                    onClick={() => {
                      setPriceRange('Mixed prices');
                      setScreen(19);
                    }}
                    className="w-full text-white/30 hover:text-white/60 text-xs font-bold transition-colors block text-center cursor-pointer"
                  >
                    Skip &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 19: CITY */}
            {screen === 19 && (
              <div className="flex-1 flex flex-col justify-between py-4">
                <div className="flex-1 flex flex-col justify-start space-y-4 pt-4 max-h-[400px]">
                  <h2 className="text-xl font-[900] tracking-tight text-white leading-none">
                    Which city?
                  </h2>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input 
                      type="text"
                      placeholder="Search Zim city..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#c8ff00] focus:outline-none focus:ring-1 focus:ring-[#c8ff00] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-[180px] pr-1.5 no-scrollbar">
                    {filteredCities.map(item => {
                      const isSelected = city === item;
                      return (
                        <button
                          key={item}
                          onClick={() => {
                            setCity(item);
                            setTimeout(() => setScreen(20), 500);
                          }}
                          className={`w-full p-2.5 rounded-lg border text-left text-xs font-extrabold transition-all flex justify-between items-center ${
                            isSelected 
                              ? 'bg-[#c8ff00]/10 border-[#c8ff00] text-white' 
                              : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <span>📍 {item}</span>
                          {isSelected && <span className="text-[#c8ff00]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  disabled={!city}
                  onClick={() => setScreen(20)}
                  className={`w-full h-13 font-extrabold text-[15px] rounded-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    city ? 'bg-[#c8ff00] text-black' : 'bg-white/5 text-white/30 pointer-events-none'
                  }`}
                >
                  Continue &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 20: WHATSAPP PHONE */}
            {screen === 20 && (
              <div className="flex-1 flex flex-col justify-between py-4 animate-scale-up">
                <div className="flex-1 flex flex-col justify-center space-y-5">
                  <h2 className="text-xl font-[900] tracking-tight text-white leading-none">
                    Where do customers reach you?
                  </h2>

                  <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5 focus-within:border-[#c8ff00] transition-colors">
                    <span className="font-mono text-base font-black px-4 bg-white/5 text-white/45 flex items-center border-r border-white/5 select-none text-[15px]">
                      +263
                    </span>
                    <input 
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="77 444 3322"
                      className="flex-1 px-4 py-3.5 bg-transparent border-none text-white text-lg font-bold font-mono focus:outline-none"
                    />
                  </div>

                  {whatsapp.length >= 8 && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-[#25D366] text-white p-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase"
                    >
                      <span className="flex items-center gap-1.5"><WhatsAppIcon size={14} /> Orders go here: +263 {whatsapp}</span>
                    </motion.div>
                  )}
                </div>

                <button 
                  disabled={whatsapp.length < 8}
                  onClick={() => setScreen(21)}
                  className={`w-full h-13 font-extrabold text-[15px] rounded-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    whatsapp.length >= 8 ? 'bg-[#c8ff00] text-black' : 'bg-white/5 text-white/30 pointer-events-none'
                  }`}
                >
                  Continue &rarr;
                </button>
              </div>
            )}

            {/* SCREEN 21: INSTAGRAM USERNAME */}
            {screen === 21 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <h2 className="text-xl font-[900] tracking-tight text-white leading-none">
                    Got an Instagram?
                  </h2>

                  <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5 focus-within:border-[#c8ff00] transition-colors">
                    <span className="font-mono text-base font-black px-4 bg-white/5 text-white/45 flex items-center border-r border-white/5 select-none text-[15px]">
                      @
                    </span>
                    <input 
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                      placeholder="yourhandle"
                      className="flex-1 px-4 py-3.5 bg-transparent border-none text-white text-base font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setScreen(22)}
                    className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                  >
                    Continue &rarr;
                  </button>
                  <button 
                    onClick={() => {
                      setInstagram('');
                      setScreen(22);
                    }}
                    className="w-full text-white/30 hover:text-white/60 text-xs font-bold transition-colors block text-center cursor-pointer"
                  >
                    Skip for now &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 22: LOGO */}
            {screen === 22 && (
              <div className="flex-1 flex flex-col justify-between py-4">
                <div className="flex-1 flex flex-col justify-center items-center space-y-5 text-center">
                  <div>
                    <h2 className="text-xl font-[900] tracking-tight text-white leading-none mb-1">
                      Add your logo.
                    </h2>
                    <p className="text-white/40 text-xs font-bold">Appears on your shop page.</p>
                  </div>

                  <input 
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="w-40 h-40 rounded-full border-2 border-dashed border-white/20 hover:border-[#c8ff00]/40 bg-white/5 flex flex-col items-center justify-center overflow-hidden transition-colors cursor-pointer group relative"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-white/45 group-hover:text-[#c8ff00] transition-colors">
                        <Camera className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase">Tap to upload</span>
                      </div>
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setScreen(23)}
                    className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                  >
                    {logoPreview ? 'Next ➔' : 'Skip for now ➔'}
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 23: BANNER */}
            {screen === 23 && (
              <div className="flex-1 flex flex-col justify-between py-4">
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <div>
                    <h2 className="text-xl font-[900] tracking-tight text-white leading-none mb-1">
                      Add your banner.
                    </h2>
                    <p className="text-white/40 text-xs font-bold">The cover image of your shop.</p>
                  </div>

                  <input 
                    type="file"
                    ref={bannerInputRef}
                    onChange={handleBannerUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    className="w-full h-36 bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group hover:border-[#c8ff00]/40"
                  >
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-white/40 group-hover:text-[#c8ff00] transition-colors">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-[11px] font-black uppercase">🖼️ + Add Banner</span>
                        <span className="text-[9px] text-white/20">1200 &times; 400px recommended</span>
                      </div>
                    )}
                  </button>

                  <div className="space-y-1 mt-2">
                    <span className="text-white/30 text-[9px] font-black uppercase tracking-wider block">PREVIEW LAYOUT</span>
                    <div className="border border-white/10 rounded-xl p-2.5 bg-zinc-950 flex items-center gap-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-cover bg-center opacity-30 filter blur-sm" style={{ backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none' }}></div>
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] uppercase font-black font-mono overflow-hidden relative z-10 shrink-0">
                        {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> : shopName.substring(0, 2) || 'TZW'}
                      </div>
                      <div className="relative z-10 text-left">
                        <h5 className="font-extrabold text-white text-xs leading-none mb-1">{shopName || 'My Shop'}</h5>
                        <p className="text-white/50 text-[10px] leading-none"> Harare &bull; {category || 'Clothing'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(24)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  {bannerPreview ? 'Next ➔' : 'Skip for now ➔'}
                </button>
              </div>
            )}

            {/* SCREEN 24: REVIEW */}
            {screen === 24 && (
              <div className="flex-1 flex flex-col justify-between py-4">
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <div>
                    <h2 className="text-xl font-[900] tracking-tight text-white leading-none mb-1">
                      Almost done!
                    </h2>
                    <p className="text-white/40 text-xs font-bold">Verify before we build.</p>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4.5 space-y-3.5 text-xs text-left shadow-lg">
                    {[
                      { l: 'Shop name', v: shopName },
                      { l: 'Category', v: category },
                      { l: 'City', v: city },
                      { l: 'WhatsApp', v: `+263 ${whatsapp}` },
                      { l: 'Instagram', v: instagram ? `@${instagram}` : 'Skipped' },
                      { l: 'Logo', v: logoPreview ? '✓ Added' : '— Not added' },
                      { l: 'Banner', v: bannerPreview ? '✓ Added' : '— Not added' }
                    ].map(row => (
                      <div key={row.l} className="flex justify-between items-center border-b border-white/5 pb-2.5 last:border-0 last:pb-0 gap-3">
                        <span className="text-white/45 font-bold uppercase text-[9px] tracking-wider shrink-0">{row.l}</span>
                        <span className="text-white font-extrabold text-right truncate max-w-[180px]">{row.v}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-white/40 text-[11px] leading-tight font-medium">
                    Build activates your 3-day trial instantly.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    // Pre-fill username check with handle version of shopName if empty
                    const handleCandidate = shopName.toLowerCase().replace(/[^a-z0-9_-]/g, '').substring(0, 15);
                    setUsername(handleCandidate);
                    setScreen(25);
                  }}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                >
                  Build My Shop 🚀
                </button>
              </div>
            )}

            {/* SCREEN 25: SECURE ACCOUNT SIGN UP */}
            {screen === 25 && (
              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="flex-1 flex flex-col justify-start space-y-4 pt-4 max-h-[500px] overflow-y-auto no-scrollbar pr-0.5">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <span className="inline-block bg-[#c8ff00] text-black text-[10px] tracking-wider uppercase font-black px-3 py-1 rounded-full px-4 font-bold scale-95 shadow-md">
                      🎁 3 days free &bull; No payment needed
                    </span>
                    <h2 className="text-xl font-[900] tracking-tight leading-none text-white pt-2.5">
                      Secure Account
                    </h2>
                  </div>

                  <div className="space-y-3 TEXT-LEFT text-xs">
                    {/* Username Setup */}
                    <div className="text-left">
                      <label className="text-white/50 text-[10px] tracking-wider uppercase font-bold block mb-1">Shop Handle / Username</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">@</span>
                        <input 
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          placeholder="yourhandle"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm focus:border-[#c8ff00] focus:outline-none transition-colors"
                        />
                      </div>
                      {username.length >= 3 && (
                        <div className="mt-1 text-[10px]">
                          {checkingUsername ? (
                            <span className="text-white/40">Checking availability...</span>
                          ) : usernameAvailable === true ? (
                            <span className="text-[#22C55E]">✓ @{username} is available!</span>
                          ) : usernameAvailable === false ? (
                            <span className="text-[#EF4444]">✗ @{username} is already taken</span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Email address */}
                    <div className="text-left">
                      <label className="text-white/50 text-[10px] tracking-wider uppercase font-bold block mb-1">Email address</label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-sm focus:border-[#c8ff00] focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Password */}
                    <div className="text-left">
                      <label className="text-white/50 text-[10px] tracking-wider uppercase font-bold block mb-1">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-3.5 pr-10 py-3 text-sm focus:border-[#c8ff00] focus:outline-none transition-colors"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div className="text-left">
                      <label className="text-white/50 text-[10px] tracking-wider uppercase font-bold block mb-1">Confirm password</label>
                      <div className="relative">
                        <input 
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-3.5 pr-10 py-3 text-sm focus:border-[#c8ff00] focus:outline-none transition-colors"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Terms Card */}
                    <div className="bg-[#c8ff00]/5 border border-[#c8ff00]/15 rounded-xl p-3.5 text-[11px] text-[#c8ff00] leading-snug font-bold">
                      🔒 By signing up you agree to our terms. Your 3-day trial starts immediately.
                    </div>
                  </div>
                </div>

                <div className="space-y-4 shadow-xl">
                  <button 
                    disabled={
                      !username.trim() ||
                      usernameAvailable === false ||
                      !email.trim() ||
                      password.length < 6 ||
                      password !== confirmPassword ||
                      signingUp
                    }
                    onClick={handleSignUpSubmit}
                    className={`w-full h-13 font-extrabold text-[15px] rounded-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      username.trim() &&
                      usernameAvailable !== false &&
                      email.trim() &&
                      password.length >= 6 &&
                      password === confirmPassword &&
                      !signingUp
                        ? 'bg-[#c8ff00] text-black font-extrabold'
                        : 'bg-white/5 text-white/30 pointer-events-none'
                    }`}
                  >
                    {signingUp ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Launching...</span>
                      </div>
                    ) : (
                      'Activate Free Trial →'
                    )}
                  </button>

                  <button
                    onClick={() => {
                      // Navigate back to landing screen 
                      setAppStage('landing');
                    }}
                    className="w-full text-white/30 hover:text-white/60 text-xs font-bold transition-colors block text-center cursor-pointer mb-2"
                  >
                    Already have an account? Sign in &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 26: 5-SEC BUILD ANIMATION SCREEN */}
            {screen === 26 && (
              <div className="flex-1 flex flex-col justify-between fixed inset-0 bg-[#0a0a0a] z-50 text-center select-none overflow-hidden pb-8 pt-8 px-6 font-sans">
                {/* WORDMARK */}
                <span className="threadzw-wordmark text-[#c8ff00] font-black uppercase tracking-widest text-2xl pt-8">
                  ThreadZW
                </span>

                {/* ANIMATED BIG SPINNER */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-12 shrink-0">
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.45, 0.15] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute w-36 h-36 rounded-full bg-[#c8ff00] -left-6 -top-6"
                    />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                      className="absolute w-32 h-32 rounded-full border-2 border-dashed border-[#c8ff00] -left-4 -top-4"
                    />
                    <div className="relative w-24 h-24 bg-[#121212] border border-white/10 rounded-full flex items-center justify-center text-[#c8ff00] shadow-xl">
                      <Store className="w-12 h-12" />
                    </div>
                  </div>

                  {/* Checklist updates delay checkmarks ticker */}
                  <div className="w-full max-w-[280px] space-y-3.5 text-left pl-3 text-base">
                    {[
                      "Creating your storefront...",
                      "Setting up your shop link...",
                      "Connecting WhatsApp orders...",
                      "Your shop is ready!"
                    ].map((item, idx) => {
                      const complete = visibleChecks.includes(idx);
                      return (
                        <div key={item} className="h-6">
                          {complete && (
                            <motion.div 
                              initial={{ opacity: 0, x: -8 }} 
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-3"
                            >
                              <span className="text-[#c8ff00] font-black text-lg">✓</span>
                              <span className="text-white font-extrabold text-[15px]">{item}</span>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-white/45 text-xs font-bold leading-none tracking-tight">Just a moment...</p>
                </div>

                {/* bottom filling bar */}
                <div className="w-full h-1 bg-white/5 relative mt-auto">
                  <div style={{ width: `${loadProgress}%` }} className="h-full bg-[#c8ff00]" />
                </div>
              </div>
            )}

            {/* PAYWALL SCREEN 1: FREE TRIAL COPY */}
            {screen === 27 && (
              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="flex-1 flex flex-col justify-center space-y-5">
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2, 3].map(dot => (
                      <div key={dot} className={`w-2 h-2 rounded-full ${dot === 0 ? 'bg-[#c8ff00]' : 'bg-white/10'}`} />
                    ))}
                  </div>

                  <div className="text-center space-y-1">
                    <h2 className="text-2xl font-[950] tracking-tight leading-none text-white">
                      Try ThreadZW free
                    </h2>
                    <h2 className="text-2xl font-[950] tracking-tight leading-none text-white">
                      for 3 days.
                    </h2>
                    <span className="text-white/50 text-xs font-bold block pt-1">No payment needed to start.</span>
                  </div>

                  {/* Everything included list card */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-3 text-xs text-left shadow-lg">
                    <span className="text-[#c8ff00] text-[9px] font-black uppercase tracking-wider block">EVERYTHING INCLUDED:</span>
                    
                    {[
                      { icon: Store, t: 'Your own shop page', s: `Live at threadzw.com/shop/@${username || 'handle'}` },
                      { icon: Package, t: 'Unlimited products', s: 'Upload as many as you need' },
                      { icon: MessageSquare, t: 'WhatsApp orders', s: 'Customers contact you directly' },
                      { icon: BarChart2, t: 'Analytics', s: 'See views and top products' }
                    ].map(row => {
                      const IconComponent = row.icon;
                      return (
                        <div key={row.t} className="flex gap-3 items-start">
                          <IconComponent size={16} className="text-[#c8ff00] shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-white leading-tight">{row.t}</h4>
                            <p className="text-white/45 text-[10px] mt-0.5 leading-tight">{row.s}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Warning reminder card */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 flex gap-3 text-left">
                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-amber-500 text-[11px] leading-snug font-bold">
                      You will receive a WhatsApp reminder on day 3 before your trial ends.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(28)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px] mt-4"
                >
                  Get Started &rarr;
                </button>
              </div>
            )}

            {/* PAYWALL SCREEN 2: JUST $5/MONTH ECOCASH */}
            {screen === 28 && (
              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="flex-1 flex flex-col justify-start space-y-4 pt-4 max-h-[500px] overflow-y-auto no-scrollbar">
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2, 3].map(dot => (
                      <div key={dot} className={`w-2 h-2 rounded-full ${dot === 1 ? 'bg-[#c8ff00]' : 'bg-white/10'}`} />
                    ))}
                  </div>

                  <div className="text-center">
                    <h2 className="text-xl font-black text-white leading-none">Just $5/month</h2>
                    <h2 className="text-base font-bold text-white/50 leading-none mt-1">after your trial.</h2>

                    {/* Big Display price badge */}
                    <div className="mt-2 text-center select-none">
                      <span className="text-6xl font-[950] tracking-tighter text-[#c8ff00] leading-none uppercase inline-block">
                        $5
                      </span>
                      <span className="text-lg font-black text-white/90">/month</span>
                      <p className="text-white/40 text-[11px] mt-0.5 font-bold">Less than $0.17 per day</p>
                    </div>
                  </div>

                  {/* Payment layout cards */}
                  <div className="space-y-3 shrink-0">
                    {/* EcoCash 1 */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2.5">
                      <h4 className="font-extrabold text-sm flex items-center gap-1.5 leading-none">
                        <Smartphone size={16} className="text-[#c8ff00]" /> EcoCash App
                      </h4>
                      <p className="text-white/50 text-[11px] leading-none">Open EcoCash &rarr; Send Money &rarr; Enter number &rarr; Send $5</p>
                      
                      <div className="bg-[#c8ff00]/5 border border-[#c8ff00]/30 rounded-xl p-3 text-center my-1 select-all font-mono text-lg font-extrabold text-[#c8ff00] leading-none tracking-wider font-sans">
                        0789 113 734
                      </div>
                    </div>

                    {/* EcoCash 2 */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2.5">
                      <h4 className="font-extrabold text-sm flex items-center gap-1.5 leading-none">
                        <Smartphone size={16} className="text-[#c8ff00]" /> EcoCash Super App
                      </h4>
                      <p className="text-white/50 text-[11px] leading-none">Open Super App &rarr; Send Money &rarr; Enter number &rarr; Send $5</p>
                      
                      <div className="bg-[#c8ff00]/5 border border-[#c8ff00]/30 rounded-xl p-3 text-center my-1 select-all font-mono text-lg font-extrabold text-[#c8ff00] leading-none tracking-wider font-sans">
                        0789 113 734
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-white/35 text-[10px] py-1 font-bold">
                    Use your WhatsApp number as payment reference
                  </p>
                </div>

                <button 
                  onClick={() => setScreen(29)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px] mt-3"
                >
                  Got it &rarr;
                </button>
              </div>
            )}

            {/* PAYWALL SCREEN 3: WHATSAPP CODE */}
            {screen === 29 && (
              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="flex-1 flex flex-col justify-start space-y-4 pt-4 max-h-[500px] overflow-y-auto no-scrollbar">
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2, 3].map(dot => (
                      <div key={dot} className={`w-2 h-2 rounded-full ${dot === 2 ? 'bg-[#c8ff00]' : 'bg-white/10'}`} />
                    ))}
                  </div>

                  <div className="text-center space-y-1">
                    <HeroIcon icon={MessageSquare} color="37,211,102" />
                    <h2 className="text-xl font-[950] tracking-tight leading-none text-white pt-2">
                      We send your unlock
                    </h2>
                    <h2 className="text-xl font-[950] tracking-tight leading-none text-white">
                      code on WhatsApp.
                    </h2>
                    <p className="text-white/50 text-[11px] max-w-[280px] mx-auto leading-relaxed font-bold">
                      After you pay, our team verifies and sends your 6-character unlock code directly to your WhatsApp.
                    </p>
                  </div>

                  {/* Step explanations */}
                  <div className="space-y-3 text-left">
                    <div className="flex gap-3 bg-white/5 border border-white/5 p-3 rounded-xl text-xs items-center">
                      <div className="w-5 h-5 rounded-full bg-[#c8ff00] text-black text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                      <div>
                        <h4 className="font-extrabold leading-none">Pay via EcoCash</h4>
                        <p className="text-white/45 text-[10px] mt-0.5 leading-none">Send $5 to 0789 113 734</p>
                      </div>
                    </div>

                    <div className="flex gap-3 bg-white/5 border border-white/5 p-3 rounded-xl text-xs items-center">
                      <div className="w-5 h-5 rounded-full bg-[#c8ff00] text-black text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                      <div>
                        <h4 className="font-extrabold leading-none">We verify your payment</h4>
                        <p className="text-white/45 text-[10px] mt-0.5 leading-none">Usually within 2-4 hours during 8am-8pm ZIM time</p>
                      </div>
                    </div>

                    <div className="flex gap-3 bg-white/5 border border-white/5 p-3 rounded-xl text-xs items-start">
                      <div className="w-5 h-5 rounded-full bg-[#c8ff00] text-black text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <div className="flex-1">
                        <h4 className="font-extrabold leading-none">Code arrives on WhatsApp</h4>
                        <p className="text-white/45 text-[10px] mt-0.5 leading-none">A 6-character code like this:</p>
                        
                        {/* Mock WhatsApp screen */}
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 mt-2.5 space-y-1 scale-95 origin-left">
                          <span className="text-[10px] font-black uppercase text-[#25D366]">THREADZW</span>
                          <span className="text-[9px] text-white/50 block leading-none">Your unlock code is:</span>
                          <span className="font-mono text-base font-black text-[#c8ff00] leading-none tracking-widest block">7823KF</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(30)}
                  className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px] mt-3"
                >
                  Continue &rarr;
                </button>
              </div>
            )}

            {/* PAYWALL SCREEN 4: COUNTDOWN */}
            {screen === 30 && (
              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="flex-1 flex flex-col justify-center space-y-5">
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2, 3].map(dot => (
                      <div key={dot} className={`w-2 h-2 rounded-full ${dot === 3 ? 'bg-[#c8ff00]' : 'bg-white/10'}`} />
                    ))}
                  </div>

                  <div className="text-center space-y-1">
                    <HeroIcon icon={Unlock} color="200,255,0" />
                    <h2 className="text-2xl font-[950] tracking-tight leading-none text-white pt-2">
                      You're in.
                    </h2>
                    <p className="text-white/50 text-xs font-bold leading-none">Your 3-day free trial is active.</p>
                  </div>

                  {/* Big countdown badge layout card */}
                  <div className="bg-[#c8ff00]/5 border border-[#c8ff00]/20 rounded-2xl p-6 text-center space-y-3.5 shadow-xl max-w-xs mx-auto w-full">
                    <span className="text-7xl font-[1000] text-[#c8ff00] leading-none tracking-tighter block font-mono select-none">
                      3
                    </span>
                    <span className="text-white font-[900] text-sm uppercase tracking-wider block">days remaining</span>
                    
                    {/* Tiny full loading progress block */}
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative mt-1.5">
                      <div className="absolute inset-y-0 left-0 bg-[#c8ff00] w-full" />
                    </div>
                  </div>

                  <p className="text-center text-white/40 text-xs leading-relaxed font-bold px-3">
                    After day 3, keep your shop live for $5/month.<br/>Pay via EcoCash or InnBucks anytime.
                  </p>
                </div>

                <div className="shadow-2xl pt-2">
                  <button 
                    onClick={handleFinishPaywall}
                    className="w-full h-13 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px]"
                  >
                    Go to my dashboard &rarr;
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>

    </div>
  );
};

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    cover_image_url?: string | null;
  };
  isSelected: boolean;
  onSelect: (categoryName: string) => void;
}

const CategoryCard = React.memo<CategoryCardProps>(({ 
  category, 
  isSelected, 
  onSelect 
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(category.name)}
      style={{
        background: isSelected
          ? 'rgba(200,255,0,0.08)'
          : 'rgba(255,255,255,0.04)',
        border: isSelected
          ? '2px solid #c8ff00'
          : '1.5px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        cursor: 'pointer',
        transition: 
          'border-color 0.15s ease, background 0.15s ease',
        minHeight: 100
      }}
    >
      {/* Cover image circle */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        overflow: 'hidden',
        border: isSelected
          ? '2px solid #c8ff00'
          : '2px solid rgba(255,255,255,0.1)',
        flexShrink: 0
      }}>
        {category.cover_image_url ? (
          <img
            src={category.cover_image_url}
            alt={category.name}
            loading="lazy"
            width={48}
            height={48}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: isSelected
              ? 'rgba(200,255,0,0.15)'
              : 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 900,
            color: isSelected
              ? '#c8ff00'
              : 'rgba(255,255,255,0.3)'
          }}>
            {category.name
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Name */}
      <span style={{
        fontSize: 13,
        fontWeight: 800,
        color: isSelected
          ? '#c8ff00'
          : 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 1.2
      }}>
        {category.name}
      </span>
    </button>
  );
});

CategoryCard.displayName = 'CategoryCard';

interface Screen16Props {
  categories: any[];
  onSelect: (categoryName: string) => void;
  selectedCategory: string;
  step: number;
  formData: any;
  onNext: () => void;
}

const Screen16: React.FC<Screen16Props> = React.memo(({ 
  categories,    // From parent, not fetched here
  onSelect,      // Callback when category chosen
  selectedCategory,    // Currently selected category
  step,
  formData,
  onNext         // Advance to screen 17
}) => {
  console.log('Screen 16 rendered', {
    timestamp: Date.now(),
    currentStep: step,
    formData: formData,
    selectedCategory: selectedCategory
  });

  const displayCategories = 
    categories && categories.length > 0
      ? categories
      : [
          { id: '1', name: 'Clothing' },
          { id: '2', name: 'Sneakers' },
          { id: '3', name: 'Thrift & Vintage' },
          { id: '4', name: 'Streetwear' },
          { id: '5', name: "Women's Fashion" },
          { id: '6', name: 'Formal Wear' },
          { id: '7', name: 'Accessories' },
          { id: '8', name: 'Mixed' }
        ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 4px',
      height: '100%'
    }}>
      
      {/* Phase label */}
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '2.5px',
        color: '#c8ff00',
        textTransform: 'uppercase',
        marginBottom: 16
      }}>
        PHASE 4: BUILD YOUR SHOP
      </p>
      
      {/* Headline */}
      <h1 style={{
        fontSize: 32,
        fontWeight: 900,
        color: '#ffffff',
        letterSpacing: '-0.5px',
        marginBottom: 8
      }}>
        What do you sell?
      </h1>
      
      <p style={{
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 28
      }}>
        Choose your main category.
      </p>
      
      {/* Category grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        flex: 1
      }}>
        {displayCategories
          .slice(0, 8)
          .map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isSelected={selectedCategory === cat.name}
              onSelect={onSelect}
            />
          ))
        }
      </div>
      
      {/* CTA */}
      <button
        onClick={onNext}
        disabled={!selectedCategory}
        style={{
          width: '100%',
          padding: '16px',
          background: selectedCategory
            ? '#c8ff00'
            : 'rgba(255,255,255,0.06)',
          color: selectedCategory
            ? '#000000'
            : 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: 10,
          fontWeight: 900,
          fontSize: 15,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          cursor: selectedCategory
            ? 'pointer'
            : 'not-allowed',
          transition: 
            'background 0.2s ease, color 0.2s ease',
          marginTop: 20
        }}
      >
        Continue
      </button>
    </div>
  );
});

Screen16.displayName = 'Screen16';
