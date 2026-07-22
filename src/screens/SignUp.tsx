// src/screens/SignUp.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Loader2, 
  Sparkles, 
  AlertTriangle, 
  Upload, 
  Image as ImageIcon, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Search, 
  MapPin, 
  ShoppingBag, 
  Globe, 
  ShieldCheck, 
  Cloud, 
  CheckCircle2, 
  Layers, 
  Radio, 
  Tv, 
  MessageSquare, 
  Users, 
  Sliders, 
  Zap, 
  HelpCircle,
  Camera,
  Smartphone,
  RefreshCw,
  Plus,
  Compass,
  CheckCircle,
  ChevronRight,
  Shield,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { uploadImage } from '../utils/uploadImage';

interface SignUpProps {
  initialStep?: number;
}

export const SignUp: React.FC<SignUpProps> = ({ initialStep }) => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const { refreshShop } = useShopContext();

  // Active Step (1 to 12)
  const [step, setStep] = useState<number>(() => {
    if (initialStep !== undefined) return Math.min(12, Math.max(1, initialStep));
    return 1;
  });

  // Onboarding Data State
  const [formData, setFormData] = useState({
    shopName: '',
    username: '',
    referralSource: '',
    businessType: 'Streetwear',
    email: '',
    password: '',
    confirmPassword: '',
    whatsappNumber: '',
    vibe: 'Minimal',
    location: 'Harare',
    citySearch: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auth UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Step 12 Building progress state
  const [buildPercent, setBuildPercent] = useState<number>(0);
  const [buildStepIndex, setBuildStepIndex] = useState<number>(0);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildComplete, setBuildComplete] = useState<boolean>(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 2 && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 200);
    }
  }, [step]);

  // Handle Logo Upload Preview
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      toast.success('Logo selected!');
    }
  };

  // Handle Banner Upload Preview
  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      toast.success('Banner selected!');
    }
  };

  // Back Button Navigation
  const handleBack = () => {
    if (step > 1 && step < 12 && !isBuilding) {
      setStep(prev => prev - 1);
    }
  };

  // Skip Navigation
  const handleSkip = () => {
    if (step === 10) setStep(11);
    else if (step === 11) triggerStoreCreation();
    else if (step < 12) setStep(prev => prev + 1);
  };

  // Auth Error Translation
  const getFriendlyErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred.';
    const message = error.message || String(error);
    if (message.includes('already registered') || message.includes('already_registered')) {
      return 'Email already registered. Please enter a different email or log in.';
    }
    if (message.includes('weak_password') || message.includes('at least 8 characters')) {
      return 'Password should be at least 8 characters.';
    }
    if (message.includes('invalid_email') || message.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    return message;
  };

  // Handle Supabase Sign Up (Step 6)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // If user is ALREADY logged in, proceed to Step 7 directly
    if (session?.user) {
      setStep(7);
      return;
    }

    const emailVal = formData.email.trim();
    const passVal = formData.password;
    const confirmPassVal = formData.confirmPassword;

    if (!emailVal || !passVal || !confirmPassVal) {
      const err = 'Please complete all email and password fields.';
      setAuthError(err);
      toast.error(err);
      return;
    }

    if (passVal.length < 6) {
      const err = 'Password must be at least 6 characters.';
      setAuthError(err);
      toast.error(err);
      return;
    }

    if (passVal !== confirmPassVal) {
      const err = 'Passwords do not match.';
      setAuthError(err);
      toast.error(err);
      return;
    }

    setAuthLoading(true);

    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: emailVal,
        password: passVal,
        options: {
          data: {
            role: 'merchant',
            full_name: formData.shopName || emailVal.split('@')[0]
          }
        }
      });

      if (signUpErr) throw signUpErr;

      if (data?.user) {
        // Create profile record if missing
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: formData.shopName || emailVal.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      toast.success('Account created successfully!');
      setStep(7); // Move to Trial Offer
    } catch (err: any) {
      console.error('Sign up error:', err);
      const friendly = getFriendlyErrorMessage(err);
      setAuthError(friendly);
      toast.error(friendly);
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 12 Store Creation & Deployment
  const triggerStoreCreation = async () => {
    setStep(12);
    setIsBuilding(true);
    setBuildPercent(0);
    setBuildStepIndex(0);

    // Progress simulation & DB creation in parallel
    const stepsList = [
      'Syncing Workspace',
      'Generating Storefront',
      'Preparing Dashboard',
      'Creating Inventory',
      'Finalizing'
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 4) + 2;
      if (currentProgress > 98) currentProgress = 98;
      setBuildPercent(currentProgress);

      const nextStepIdx = Math.min(4, Math.floor((currentProgress / 100) * 5));
      setBuildStepIndex(nextStepIdx);
    }, 120);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        clearInterval(interval);
        toast.error('Session expired. Please log in or recreate account.');
        setStep(6);
        setIsBuilding(false);
        return;
      }

      // 1. Upload Logo if selected
      let logoUrl = null;
      if (logoFile) {
        try {
          logoUrl = await uploadImage({
            supabase,
            file: logoFile,
            bucket: 'product-images',
            folder: 'shop_logo',
            userId: user.id
          });
        } catch (err) {
          console.warn('Logo upload skipped/failed:', err);
        }
      }

      // 2. Upload Banner if selected
      let bannerUrl = null;
      if (bannerFile) {
        try {
          bannerUrl = await uploadImage({
            supabase,
            file: bannerFile,
            bucket: 'product-images',
            folder: 'shop_banner',
            userId: user.id
          });
        } catch (err) {
          console.warn('Banner upload skipped/failed:', err);
        }
      }

      // 3. Prepare Shop Payload
      const rawSlug = formData.username || formData.shopName || `shop-${user.id.substring(0, 6)}`;
      const cleanSlug = rawSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

      const shopPayload = {
        owner_id: user.id,
        name: formData.shopName.trim() || 'ThreadZW Boutique',
        slug: cleanSlug || `store-${Date.now().toString(36)}`,
        category: formData.businessType || 'Streetwear',
        description: `${formData.vibe || 'Minimal'} clothing brand based in ${formData.location || 'Harare, Zimbabwe'}.`,
        whatsapp_number: formData.whatsappNumber.trim() || '+263771234567',
        is_active: true,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        logo_url: logoUrl,
        banner_url: bannerUrl
      };

      // Check if user already owns a shop
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (existingShop) {
        // Update existing
        await supabase
          .from('shops')
          .update(shopPayload)
          .eq('id', existingShop.id);
      } else {
        // Insert new
        const { error: insertErr } = await supabase
          .from('shops')
          .insert(shopPayload);
        if (insertErr) throw insertErr;
      }

      await refreshShop();

      // Complete progress animation
      clearInterval(interval);
      setBuildPercent(100);
      setBuildStepIndex(4);
      setBuildComplete(true);

      localStorage.setItem('threadzw_needs_walkthrough', 'true');
      localStorage.removeItem('threadzw_walkthrough_completed');

      toast.success('Your ThreadZW store is live!');
    } catch (err: any) {
      clearInterval(interval);
      console.error('Store creation error:', err);
      toast.error(err.message || 'Error creating storefront record');
      setIsBuilding(false);
      setStep(11);
    }
  };

  const finishAndGoToDashboard = () => {
    navigate('/dashboard');
    window.location.reload();
  };

  // Filtered Cities for Step 9
  const cities = ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo', 'Chinhoyi', 'Kwekwe', 'Kadoma', 'Victoria Falls', 'Other'];
  const filteredCities = cities.filter(c => c.toLowerCase().includes(formData.citySearch.toLowerCase()));

  return (
    <div id="threadzw-onboarding-design-system" className="min-h-screen bg-black text-[#e1e4cf] selection:bg-[#bef500] selection:text-black font-sans flex flex-col justify-between overflow-x-hidden relative">
      {/* Background Micro Glow */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#bef500]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-[#bef500]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center w-full px-6 md:px-16 h-[80px] bg-black border-b border-[#232323] z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#bef500] flex items-center justify-center text-black font-black">
            <Radio size={18} />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white uppercase font-serif">
            Thread<span className="text-[#bef500]">ZW</span>
          </span>
        </div>

        {step < 12 && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 hover:text-[#bef500] transition-colors cursor-pointer"
          >
            SKIP
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-4xl mx-auto w-full z-10">
        
        {/* Progress Tracker (12 Rectangular Blocks) */}
        {step < 12 && (
          <div className="w-full max-w-xl mb-10">
            <div className="flex justify-between items-center mb-2 font-mono text-xs">
              <span className="text-[#bef500] uppercase font-bold tracking-widest">Progress</span>
              <span className="text-zinc-500 font-bold">{String(step).padStart(2, '0')} / 12</span>
            </div>
            <div className="flex gap-1.5 h-1.5 w-full">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-full rounded-xs transition-all duration-300 ${
                    idx < step ? 'bg-[#bef500]' : 'bg-[#232323]'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full flex flex-col items-center justify-center text-center space-y-8"
          >

            {/* STEP 01: Welcome Screen */}
            {step === 1 && (
              <div className="space-y-8 max-w-2xl text-left">
                <div className="text-6xl animate-bounce">👋</div>
                <h1 className="text-4xl sm:text-7xl font-black uppercase tracking-tight text-white leading-none font-serif">
                  HEY.<br />
                  LET'S BUILD<br />
                  YOUR <span className="text-[#bef500]">SHOP.</span>
                </h1>
                <p className="text-lg text-zinc-400 font-medium max-w-md">
                  Answer a few questions. This takes less than <span className="text-[#bef500] font-mono font-bold">a minute.</span>
                </p>

                <div className="pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-5 rounded-2xl bg-[#bef500] text-black font-extrabold text-base uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-[0_0_25px_rgba(190,245,0,0.25)]"
                  >
                    LET'S GO
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 02: Shop Name */}
            {step === 2 && (
              <div className="space-y-8 w-full max-w-xl text-left">
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none font-serif">
                  WHAT'S YOUR<br />SHOP NAME?
                </h1>

                <div className="space-y-4">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => {
                      updateField('shopName', e.target.value);
                      const slug = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').substring(0, 32);
                      updateField('username', slug);
                    }}
                    placeholder="e.g. NULLA Clothing"
                    className="w-full h-24 sm:h-28 bg-[#0F0F10] border border-[#232323] px-6 text-2xl sm:text-4xl font-black text-white placeholder:text-zinc-700 focus:border-[#bef500] focus:outline-none rounded-2xl transition-all"
                  />

                  {/* Slug Live Preview */}
                  <div className="flex items-center gap-2 px-2 text-xs font-mono text-zinc-400">
                    <Globe size={14} className="text-zinc-500" />
                    <span>
                      threadzw.com/shop/<span className="text-[#bef500] font-bold">{formData.username || 'nulla-clothing'}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 03: Referral Source */}
            {step === 3 && (
              <div className="space-y-8 w-full max-w-2xl text-left">
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none font-serif">
                  WHERE DID<br />YOU HEAR<br /><span className="text-[#bef500]">ABOUT US?</span>
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Instagram', icon: Globe },
                    { label: 'TikTok', icon: Zap },
                    { label: 'Friend', icon: Users },
                    { label: 'Google', icon: Search },
                    { label: 'YouTube', icon: Tv },
                    { label: 'Other', icon: Radio }
                  ].map((item, i) => {
                    const isSelected = formData.referralSource === item.label;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          updateField('referralSource', item.label);
                          setTimeout(() => setStep(4), 200);
                        }}
                        className={`p-6 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#bef500]/10 border-[#bef500] text-white'
                            : 'bg-[#0F0F10] border-[#232323] text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <span className="font-bold text-sm uppercase tracking-widest">{item.label}</span>
                        <IconComp size={20} className={isSelected ? 'text-[#bef500]' : 'text-zinc-500'} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 04: Product Category */}
            {step === 4 && (
              <div className="space-y-8 w-full max-w-2xl text-left">
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none font-serif">
                  WHAT ARE<br /><span className="text-[#bef500]">YOU SELLING?</span>
                </h1>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Streetwear', icon: ShoppingBag },
                    { label: 'Sneakers', icon: Zap },
                    { label: 'Thrift', icon: RefreshCw },
                    { label: 'Jewellery', icon: Sparkles },
                    { label: 'Perfume', icon: Radio },
                    { label: 'Beauty', icon: Sparkles },
                    { label: 'Accessories', icon: Sliders },
                    { label: 'Electronics', icon: Smartphone },
                    { label: 'Other', icon: Layers }
                  ].map((cat, idx) => {
                    const isSelected = formData.businessType === cat.label;
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          updateField('businessType', cat.label);
                          setTimeout(() => setStep(5), 200);
                        }}
                        className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer min-h-[130px] ${
                          isSelected
                            ? 'bg-[#bef500]/10 border-[#bef500] text-white'
                            : 'bg-[#0F0F10] border-[#232323] text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <IconComp size={28} className={isSelected ? 'text-[#bef500]' : 'text-zinc-500'} />
                        <span className="font-bold text-xs uppercase tracking-wider">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 05: Save Account Intro */}
            {step === 5 && (
              <div className="space-y-8 w-full max-w-2xl text-left">
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none font-serif">
                  PERFECT.<br />NOW LET'S<br /><span className="text-[#bef500]">SAVE YOUR</span><br />ACCOUNT.
                </h1>

                <p className="text-zinc-400 text-sm leading-relaxed max-w-lg">
                  We'll securely save your progress before creating your shop. Your <span className="text-[#bef500] font-mono">brand assets</span> and <span className="text-[#bef500] font-mono">preferences</span> are being prepared.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-[#0F0F10] border border-[#232323] p-6 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#bef500]/10 flex items-center justify-center text-[#bef500] shrink-0">
                      <Shield size={22} />
                    </div>
                    <div>
                      <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">DATA SECURITY</h4>
                      <p className="text-xs text-zinc-400">256-bit encryption</p>
                    </div>
                  </div>

                  <div className="bg-[#0F0F10] border border-[#232323] p-6 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#bef500]/10 flex items-center justify-center text-[#bef500] shrink-0">
                      <Cloud size={22} />
                    </div>
                    <div>
                      <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">AUTO-SYNC</h4>
                      <p className="text-xs text-zinc-400">Real-time cloud save</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 06: Create Account / Auth */}
            {step === 6 && (
              <div className="space-y-6 w-full max-w-md text-left">
                <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none font-serif">
                  CREATE YOUR<br />ACCOUNT.
                </h1>

                {session?.user ? (
                  <div className="bg-[#0F0F10] border border-[#bef500]/30 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <CheckCircle2 size={20} className="text-[#bef500]" />
                      <span>Logged in as <strong>{session.user.email}</strong></span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">
                        WhatsApp Number for Orders
                      </label>
                      <input
                        type="tel"
                        value={formData.whatsappNumber}
                        onChange={(e) => updateField('whatsappNumber', e.target.value)}
                        placeholder="+263771234567"
                        className="w-full bg-black border border-[#232323] rounded-xl px-4 py-3 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#bef500]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(7)}
                      className="w-full py-4 bg-[#bef500] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 cursor-pointer"
                    >
                      Continue With This Account
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {authError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono">
                        {authError}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="NAME@DOMAIN.COM"
                          className="w-full bg-[#0F0F10] border border-[#232323] rounded-xl pl-12 pr-4 py-3.5 text-xs font-mono font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#bef500]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-[#0F0F10] border border-[#232323] rounded-xl pl-12 pr-10 py-3.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#bef500]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => updateField('confirmPassword', e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-[#0F0F10] border border-[#232323] rounded-xl pl-12 pr-10 py-3.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#bef500]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">
                        WhatsApp Number for Orders
                      </label>
                      <input
                        type="tel"
                        value={formData.whatsappNumber}
                        onChange={(e) => updateField('whatsappNumber', e.target.value)}
                        placeholder="+263771234567"
                        className="w-full bg-[#0F0F10] border border-[#232323] rounded-xl px-4 py-3.5 text-xs font-mono font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#bef500]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-4 bg-[#bef500] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 07: Trial & Pricing Offer */}
            {step === 7 && (
              <div className="space-y-8 w-full max-w-lg text-left">
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none font-serif">
                  START <br /><span className="text-[#bef500]">FREE.</span>
                </h1>

                <div className="bg-gradient-to-b from-[#0F0F10] to-black border-2 border-[#bef500] rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-[0_0_30px_rgba(190,245,0,0.15)]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#bef500] font-bold">FULL ACCESS</span>
                    <h3 className="text-2xl font-black uppercase text-white">7 DAY FREE TRIAL</h3>
                    <p className="text-xs font-mono text-zinc-400">$2.99/month afterwards.</p>
                  </div>

                  <div className="h-[1px] w-full bg-[#232323]" />

                  <ul className="space-y-3 text-xs font-bold uppercase tracking-wide text-zinc-200">
                    {['Unlimited products', 'Online storefront', 'WhatsApp orders', 'Analytics', 'Inventory'].map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-[#bef500] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setStep(8)}
                    className="w-full py-4 bg-[#bef500] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(190,245,0,0.3)]"
                  >
                    START MY FREE TRIAL
                  </button>

                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">NO PAYMENT TODAY. BILLED ONLY AFTER TRIAL.</p>
                    <p className="text-[10px] font-mono text-white font-bold uppercase">CANCEL ANYTIME.</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 08: Shop Identity / Vibe */}
            {step === 8 && (
              <div className="space-y-8 w-full max-w-2xl text-left">
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none font-serif">
                  WHAT BEST<br />DESCRIBES<br />YOUR SHOP?
                </h1>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { title: 'Minimal', desc: 'Clean lines & essential aesthetics', icon: Sliders },
                    { title: 'Streetwear', desc: 'Urban culture & bold drops', icon: ShoppingBag },
                    { title: 'Luxury', desc: 'High-end design & quality', icon: Sparkles },
                    { title: 'Vintage', desc: 'Timeless classics & retro pieces', icon: RefreshCw },
                    { title: 'Sportswear', desc: 'Performance & active lifestyle', icon: Zap },
                    { title: 'Beauty', desc: 'Skincare & personal wellness', icon: Sparkles },
                    { title: 'Tech', desc: 'Hardware & digital gear', icon: Smartphone },
                    { title: 'Accessories', desc: 'Curated additions to complete fit', icon: Layers }
                  ].map((v, vIdx) => {
                    const isSelected = formData.vibe === v.title;
                    const IconComp = v.icon;
                    return (
                      <button
                        key={vIdx}
                        type="button"
                        onClick={() => {
                          updateField('vibe', v.title);
                          setTimeout(() => setStep(9), 200);
                        }}
                        className={`p-5 rounded-2xl border flex flex-col justify-between text-left transition-all cursor-pointer min-h-[140px] ${
                          isSelected
                            ? 'bg-[#bef500]/10 border-[#bef500] text-white'
                            : 'bg-[#0F0F10] border-[#232323] text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <IconComp size={22} className={isSelected ? 'text-[#bef500]' : 'text-zinc-500'} />
                        <div>
                          <span className="font-bold text-xs uppercase tracking-wider block text-white">{v.title}</span>
                          <span className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">{v.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 09: Location Selection */}
            {step === 9 && (
              <div className="space-y-6 w-full max-w-xl text-left">
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none font-serif">
                  WHERE ARE<br /><span className="text-[#bef500]">YOU</span><br />LOCATED?
                </h1>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    value={formData.citySearch}
                    onChange={(e) => updateField('citySearch', e.target.value)}
                    placeholder="SEARCH YOUR CITY..."
                    className="w-full bg-[#0F0F10] border border-[#232323] rounded-xl pl-12 pr-4 py-3.5 font-mono text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#bef500]"
                  />
                </div>

                {/* City Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto no-scrollbar">
                  {filteredCities.map((city, cIdx) => {
                    const isSelected = formData.location === city;
                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => {
                          updateField('location', city);
                          setTimeout(() => setStep(10), 200);
                        }}
                        className={`p-4 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#bef500]/10 border-[#bef500] text-white font-bold'
                            : 'bg-[#0F0F10] border-[#232323] text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin size={16} className={isSelected ? 'text-[#bef500]' : 'text-zinc-500'} />
                          <span className="text-xs uppercase font-bold">{city}</span>
                        </div>
                        <ChevronRight size={16} className="text-zinc-600" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 10: Upload Logo */}
            {step === 10 && (
              <div className="space-y-8 w-full max-w-xl text-center flex flex-col items-center">
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none font-serif text-left w-full">
                  ADD YOUR<br /><span className="text-[#bef500]">LOGO.</span>
                </h1>

                <label className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#0F0F10] border-2 border-dashed border-[#232323] hover:border-[#bef500] transition-all cursor-pointer flex flex-col items-center justify-center p-6 group relative overflow-hidden">
                  <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />

                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-400 group-hover:text-white transition-colors">
                      <Upload size={36} className="text-[#bef500]" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-center">
                        DRAG & DROP OR TAP TO BROWSE
                      </span>
                    </div>
                  )}
                </label>

                <div className="flex gap-3 w-full max-w-sm">
                  <button
                    onClick={() => setStep(11)}
                    className="flex-1 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-800"
                  >
                    Skip Logo
                  </button>
                  <button
                    onClick={() => setStep(11)}
                    className="flex-1 py-3.5 bg-[#bef500] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:opacity-90"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 11: Upload Banner */}
            {step === 11 && (
              <div className="space-y-6 w-full max-w-xl text-left">
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none font-serif">
                  UPLOAD YOUR<br /><span className="text-[#bef500]">BANNER.</span>
                </h1>

                <label className="w-full aspect-[21/9] rounded-2xl bg-[#0F0F10] border-2 border-dashed border-[#232323] hover:border-[#bef500] transition-all cursor-pointer flex flex-col items-center justify-center p-6 group relative overflow-hidden">
                  <input type="file" accept="image/*" onChange={handleBannerSelect} className="hidden" />

                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-400 group-hover:text-white transition-colors">
                      <Camera size={32} className="text-[#bef500]" />
                      <span className="text-xs font-bold text-white uppercase">Click to select banner photo</span>
                      <span className="text-[10px] font-mono text-zinc-500">Recommended: 1920 x 820px</span>
                    </div>
                  )}
                </label>

                <button
                  onClick={triggerStoreCreation}
                  className="w-full py-4 bg-[#bef500] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(190,245,0,0.3)] flex items-center justify-center gap-2"
                >
                  Create & Launch Storefront
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 12: Deployment / Building Screen */}
            {step === 12 && (
              <div className="space-y-10 w-full max-w-lg text-center flex flex-col items-center py-6">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      className="text-zinc-900"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      className="text-[#bef500] transition-all duration-300 ease-linear"
                      strokeWidth="6"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * buildPercent) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-black text-[#bef500] font-mono">
                      {buildPercent}%
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">CREATING</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-5xl font-black uppercase text-white font-serif">
                    CREATING YOUR <span className="text-black bg-[#bef500] px-3 py-0.5 rounded-md">STORE</span>...
                  </h2>
                </div>

                {/* 5 Step Indicator List */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 w-full text-left">
                  {[
                    { label: 'Syncing Workspace', icon: RefreshCw },
                    { label: 'Generating Storefront', icon: Globe },
                    { label: 'Preparing Dashboard', icon: Sliders },
                    { label: 'Creating Inventory', icon: Layers },
                    { label: 'Finalizing', icon: CheckCircle2 }
                  ].map((sItem, sIdx) => {
                    const isActive = buildStepIndex === sIdx;
                    const isDone = buildStepIndex > sIdx;
                    const IconC = sItem.icon;
                    return (
                      <div
                        key={sIdx}
                        className={`p-3 rounded-xl border text-[10px] font-mono uppercase flex flex-col items-center text-center gap-1.5 transition-all ${
                          isDone
                            ? 'bg-[#bef500]/10 border-[#bef500] text-[#bef500]'
                            : isActive
                            ? 'bg-zinc-900 border-white text-white animate-pulse'
                            : 'bg-[#0F0F10] border-[#232323] text-zinc-600'
                        }`}
                      >
                        <IconC size={14} />
                        <span className="leading-tight font-bold">{sItem.label}</span>
                      </div>
                    );
                  })}
                </div>

                {buildComplete && (
                  <button
                    onClick={finishAndGoToDashboard}
                    className="w-full py-5 bg-[#bef500] text-black font-extrabold text-sm uppercase tracking-widest rounded-2xl hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-[0_0_30px_rgba(190,245,0,0.4)] flex items-center justify-center gap-2"
                  >
                    GO TO DASHBOARD
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Shell */}
      {step < 12 && (
        <footer className="fixed bottom-0 left-0 right-0 w-full z-50 flex justify-between items-center px-6 md:px-16 py-5 bg-black/95 backdrop-blur-md border-t border-[#232323]">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step > 1 && step < 12 && (
            <button
              type="button"
              onClick={() => {
                if (step === 2 && !formData.shopName.trim()) {
                  toast.error('Please enter a shop name!');
                  return;
                }
                if (step === 6) {
                  return; // handled by form
                }
                if (step === 11) {
                  triggerStoreCreation();
                  return;
                }
                setStep(prev => prev + 1);
              }}
              className="bg-[#bef500] text-black font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-[0_0_15px_rgba(190,245,0,0.2)]"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          )}
        </footer>
      )}
    </div>
  );
};
