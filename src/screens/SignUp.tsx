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
import { FREE_TRIAL_DAYS } from '../lib/plans';
import { 
  Storefront3DIllustration, 
  ShopSign3DIllustration, 
  SocialOrbit3DIllustration,
  ProductCatalog3DIllustration,
  SafeVault3DIllustration,
  MailAccount3DIllustration,
  HoodieFashion3DIllustration,
  ZimbabweMap3DIllustration,
  LogoUpload3DIllustration,
  BannerUpload3DIllustration,
  ShopReady3DIllustration
} from '../components/onboarding/OnboardingIllustrations';

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
    email: session?.user?.email || localStorage.getItem('threadzw_signup_email') || '',
    password: localStorage.getItem('threadzw_signup_password') || '',
    whatsappNumber: '+263',
    vibe: 'Minimal',
    location: 'Harare',
    citySearch: '',
  });

  useEffect(() => {
    if (session?.user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: session.user.email || prev.email }));
    }
  }, [session]);

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

    const emailVal = formData.email.trim();
    const passVal = formData.password;

    if (!emailVal || !passVal) {
      const err = 'Please enter your email and password.';
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
          const { error: profileInsErr } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: formData.shopName || emailVal.split('@')[0],
            email: emailVal.trim().toLowerCase(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          if (profileInsErr) {
            await supabase.from('profiles').insert({
              id: data.user.id,
              full_name: formData.shopName || emailVal.split('@')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      localStorage.setItem('threadzw_signup_email', emailVal);
      localStorage.setItem('threadzw_signup_password', passVal);

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
        trial_ends_at: new Date(Date.now() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
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
      setTimeout(() => {
        navigate('/dashboard');
        window.location.reload();
      }, 500);
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
    <div id="threadzw-onboarding-design-system" className="min-h-screen w-full bg-black text-[#e1e4cf] selection:bg-[#bef500] selection:text-black font-sans flex flex-col justify-between overflow-y-auto overflow-x-hidden relative">
      {/* Background Micro Glow */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#bef500]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-[#bef500]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center w-full max-w-[420px] mx-auto px-5 pt-6 pb-2 bg-black/90 backdrop-blur-md z-50 sticky top-0 shrink-0">
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-xl tracking-tight text-white font-sans">
            ThreadZW<span className="text-[#C6FF00]">.</span>
          </span>
        </div>

        {step < 12 && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 hover:text-[#C6FF00] transition-colors cursor-pointer"
          >
            SKIP
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col items-center justify-start px-4 pt-2 max-w-md mx-auto w-full z-10 ${step < 7 ? 'pb-32' : 'pb-16'}`}>
        
        {/* Progress Tracker Bar */}
        {step < 12 && (
          <div className="w-full max-w-[390px] mx-auto mb-4">
            <div className="flex justify-between items-center font-mono text-xs">
              {/* Progress segments */}
              <div className="flex gap-1.5 h-1.5 w-32">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-full rounded-full transition-all duration-300 ${
                      idx < Math.ceil((step / 12) * 4) ? 'bg-[#C6FF00]' : 'bg-[#222225]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-zinc-400 font-bold text-[11px]">{step} / 12</span>
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
            className="w-full flex flex-col items-center justify-start text-center space-y-5 my-auto"
          >

            {/* STEP 01: Create Online Shop */}
            {step === 1 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-6 text-left px-2">
                {/* 3D Illustration */}
                <Storefront3DIllustration />

                {/* Typography */}
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    CREATE YOUR<br />
                    ONLINE SHOP<br />
                    <span className="text-[#C6FF00]">IN MINUTES.</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                    No website skills needed.<br />
                    Create your shop, upload products, and share your link.
                  </p>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                  >
                    <span>START</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 02: Shop Name */}
            {step === 2 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-6 text-left px-2">
                {/* 3D Illustration */}
                <ShopSign3DIllustration shopName={formData.shopName} />

                {/* Typography */}
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    WHAT'S YOUR<br />
                    <span className="text-[#C6FF00]">SHOP NAME?</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                    This will be the name of your online shop.
                  </p>
                </div>

                {/* Input Field */}
                <div className="space-y-2.5">
                  <div className="relative">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={formData.shopName}
                      onChange={(e) => {
                        updateField('shopName', e.target.value);
                        const slug = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').substring(0, 32);
                        updateField('username', slug);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!formData.shopName.trim()) {
                            toast.error('Please enter a shop name!');
                            return;
                          }
                          setStep(3);
                        }
                      }}
                      placeholder="NULLA Clothing"
                      className="w-full bg-[#111114] border border-[#232326] px-4 py-3.5 text-base font-bold text-white placeholder:text-zinc-600 focus:border-[#C6FF00] focus:outline-none rounded-2xl transition-all"
                    />
                  </div>

                  {/* Slug Subtext */}
                  <div className="px-1 text-xs font-mono text-zinc-400">
                    <span>
                      threadzw.com/shop/<span className="text-[#C6FF00] font-bold">{formData.username || 'nulla-clothing'}</span>
                    </span>
                  </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!formData.shopName.trim()) {
                        updateField('shopName', 'NULLA Clothing');
                        updateField('username', 'nulla-clothing');
                      }
                      setStep(3);
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 03: Referral Source */}
            {step === 3 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-5 text-left px-2">
                {/* 3D Illustration */}
                <SocialOrbit3DIllustration />

                {/* Typography */}
                <div className="space-y-1.5">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    WHERE DID<br />
                    YOU HEAR<br />
                    <span className="text-[#C6FF00]">ABOUT US?</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                    Help us improve by letting us know where you found us.
                  </p>
                </div>

                {/* Options 2-Column Grid */}
                <div className="grid grid-cols-2 gap-2.5">
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
                        onClick={() => updateField('referralSource', item.label)}
                        className={`p-3.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-black border-[#C6FF00] text-white shadow-[0_0_12px_rgba(198,255,0,0.2)]'
                            : 'bg-[#111114] border-[#222225] text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <IconComp size={16} className={isSelected ? 'text-[#C6FF00]' : 'text-zinc-400'} />
                        <span className="font-bold text-xs tracking-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!formData.referralSource) {
                        updateField('referralSource', 'Instagram');
                      }
                      setStep(4);
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 04: Product Category */}
            {step === 4 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-4 text-left px-2">
                {/* 3D Illustration */}
                <ProductCatalog3DIllustration />

                {/* Typography */}
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    WHAT ARE<br />
                    YOU <span className="text-[#C6FF00]">SELLING?</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                    Choose the best option that describes what you sell.
                  </p>
                </div>

                {/* Options 2-Column Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Streetwear', icon: ShoppingBag },
                    { label: 'Sneakers', icon: Zap },
                    { label: 'Thrift', icon: RefreshCw },
                    { label: 'Jewellery', icon: Sparkles },
                    { label: 'Perfume', icon: Radio },
                    { label: 'Beauty', icon: Sparkles },
                    { label: 'Accessories', icon: Sliders },
                    { label: 'Electronics', icon: Smartphone }
                  ].map((cat, idx) => {
                    const isSelected = formData.businessType === cat.label;
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => updateField('businessType', cat.label)}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-black border-[#C6FF00] text-white shadow-[0_0_12px_rgba(198,255,0,0.2)]'
                            : 'bg-[#111114] border-[#222225] text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <IconComp size={16} className={isSelected ? 'text-[#C6FF00]' : 'text-zinc-400'} />
                        <span className="font-bold text-xs tracking-tight">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!formData.businessType) {
                        updateField('businessType', 'Streetwear');
                      }
                      setStep(5);
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 05: Save Account Intro */}
            {step === 5 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-6 text-left px-2">
                {/* 3D Illustration */}
                <SafeVault3DIllustration />

                {/* Typography */}
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    LET'S SAVE<br />
                    YOUR<br />
                    <span className="text-[#C6FF00]">ACCOUNT.</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                    We'll securely save your progress before creating your shop.
                  </p>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-4">
                  <button
                    onClick={() => setStep(6)}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 06: Create Account / Auth */}
            {step === 6 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-4 text-left px-2">
                {/* 3D Illustration */}
                <MailAccount3DIllustration />

                {/* Typography */}
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    CREATE YOUR<br />
                    <span className="text-[#C6FF00]">ACCOUNT.</span>
                  </h1>
                </div>

                {/* Auth Form / Inputs */}
                <form onSubmit={handleSignUp} className="space-y-3">
                  {authError && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono">
                      {authError}
                    </div>
                  )}

                  {/* Email Input */}
                  <div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="Email address"
                      className="w-full bg-[#111114] border border-[#232326] rounded-xl px-4 py-3 text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#C6FF00]"
                    />
                  </div>

                  {/* Phone Number Input (+263 prefilled) */}
                  <div>
                    <input
                      type="tel"
                      required
                      value={formData.whatsappNumber}
                      onChange={(e) => updateField('whatsappNumber', e.target.value)}
                      placeholder="Phone number (+263...)"
                      className="w-full bg-[#111114] border border-[#232326] rounded-xl px-4 py-3 text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#C6FF00]"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Password"
                      className="w-full bg-[#111114] border border-[#232326] rounded-xl pl-4 pr-10 py-3 text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#C6FF00]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Terms */}
                  <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                    By continuing you agree to our{' '}
                    <span className="text-[#C6FF00] underline cursor-pointer">Terms of Service</span> and{' '}
                    <span className="text-[#C6FF00] underline cursor-pointer">Privacy Policy</span>.
                  </p>

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)] disabled:opacity-50"
                    >
                      <span>{authLoading ? 'CREATING...' : 'CONTINUE'}</span>
                      <ArrowRight size={20} className="stroke-[3]" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 07: What's your shop called? */}
            {step === 7 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-6 text-left px-2">
                {/* 3D Illustration */}
                <ShopSign3DIllustration shopName={formData.shopName} />

                {/* Typography */}
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    WHAT'S YOUR<br />
                    <span className="text-[#C6FF00]">SHOP NAME?</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                    This is what customers will see.
                  </p>
                </div>

                {/* Large rounded text field */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => {
                      updateField('shopName', e.target.value);
                      const slug = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').substring(0, 32);
                      updateField('username', slug);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!formData.shopName.trim()) {
                          updateField('shopName', 'Nulla Clothing');
                          updateField('username', 'nulla-clothing');
                        }
                        setStep(8);
                      }
                    }}
                    placeholder="e.g. Nulla Clothing"
                    className="w-full bg-[#111114] border border-[#232326] px-4 py-3.5 text-base font-bold text-white placeholder:text-zinc-600 focus:border-[#C6FF00] focus:outline-none rounded-2xl transition-all"
                  />
                  <p className="text-xs text-zinc-500 font-medium px-1">
                    You can change this later.
                  </p>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!formData.shopName.trim()) {
                        updateField('shopName', 'Nulla Clothing');
                        updateField('username', 'nulla-clothing');
                      }
                      setStep(8);
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 08: What best describes your shop? */}
            {step === 8 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-4 text-left px-2">
                {/* 3D Illustration */}
                <HoodieFashion3DIllustration />

                {/* Typography */}
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    WHAT BEST<br />
                    DESCRIBES<br />
                    <span className="text-[#C6FF00]">YOUR SHOP?</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                    Choose the style that best represents your business.
                  </p>
                </div>

                {/* Large premium cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Clothing Brand', icon: ShoppingBag },
                    { label: 'Sneakers', icon: Zap },
                    { label: 'Accessories', icon: Sliders },
                    { label: 'Vintage', icon: RefreshCw },
                    { label: 'Sportswear', icon: Zap },
                    { label: 'Boutique', icon: Sparkles },
                    { label: 'Streetwear', icon: Layers },
                    { label: 'Other', icon: Sparkles }
                  ].map((style, sIdx) => {
                    const isSelected = formData.vibe === style.label || formData.businessType === style.label;
                    const IconComp = style.icon;
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          updateField('vibe', style.label);
                          updateField('businessType', style.label);
                        }}
                        className={`p-3.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-black border-[#C6FF00] text-white shadow-[0_0_12px_rgba(198,255,0,0.2)]'
                            : 'bg-[#111114] border-[#222225] text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <IconComp size={16} className={isSelected ? 'text-[#C6FF00]' : 'text-zinc-400'} />
                        <span className="font-bold text-xs tracking-tight">{style.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!formData.vibe) {
                        updateField('vibe', 'Clothing Brand');
                      }
                      setStep(9);
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 09: Where are you located? */}
            {step === 9 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-4 text-left px-2">
                {/* 3D Illustration */}
                <ZimbabweMap3DIllustration />

                {/* Typography */}
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    WHERE ARE<br />
                    YOU <span className="text-[#C6FF00]">LOCATED?</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                    Customers nearby can discover your shop.
                  </p>
                </div>

                {/* Search field */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="text"
                    value={formData.citySearch}
                    onChange={(e) => updateField('citySearch', e.target.value)}
                    placeholder="Search your city"
                    className="w-full bg-[#111114] border border-[#232326] rounded-xl pl-10 pr-4 py-3 text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>

                {/* Suggested cities list */}
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto overscroll-contain touch-pan-y no-scrollbar">
                  {['Bulawayo', 'Harare', 'Mutare', 'Gweru', 'Masvingo', 'Chinhoyi', 'Other']
                    .filter(c => !formData.citySearch || c.toLowerCase().includes(formData.citySearch.toLowerCase()))
                    .map((city, cIdx) => {
                      const isSelected = formData.location === city;
                      return (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => updateField('location', city)}
                          className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-black border-[#C6FF00] text-white shadow-[0_0_12px_rgba(198,255,0,0.2)]'
                              : 'bg-[#111114] border-[#222225] text-zinc-300 hover:border-zinc-500'
                          }`}
                        >
                          <MapPin size={15} className={isSelected ? 'text-[#C6FF00]' : 'text-zinc-400'} />
                          <span className="font-semibold text-xs tracking-tight">{city}</span>
                        </button>
                      );
                    })}
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!formData.location) {
                        updateField('location', 'Harare');
                      }
                      setStep(10);
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 10: Upload Logo */}
            {step === 10 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-4 text-left px-2">
                {/* 3D Illustration */}
                <LogoUpload3DIllustration />

                {/* Typography */}
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    UPLOAD YOUR<br />
                    <span className="text-[#C6FF00]">LOGO.</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                    Your logo appears across your storefront and builds trust with customers.
                  </p>
                </div>

                {/* Large upload area */}
                <div className="space-y-1.5">
                  <label className="w-full bg-[#111114] border border-dashed border-[#232326] hover:border-[#C6FF00] rounded-2xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center">
                    <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                    {logoPreview ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#27272A]">
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1A1A20] flex items-center justify-center text-[#C6FF00] group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                      </div>
                    )}
                    <span className="font-extrabold text-xs text-white uppercase tracking-wide">
                      {logoPreview ? 'Change Logo' : '⬆ Tap to Upload'}
                    </span>
                    <div className="text-[11px] text-zinc-400 space-y-0.5 font-medium">
                      <p>Supported formats: <span className="text-zinc-300">PNG • JPG • SVG</span></p>
                      <p>Recommended: <span className="text-zinc-300">Square image (1024×1024)</span></p>
                    </div>
                  </label>
                  <p className="text-[11px] text-zinc-500 font-medium px-1">
                    You can change this later.
                  </p>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setStep(11)}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 11: Upload Banner */}
            {step === 11 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-4 text-left px-2">
                {/* 3D Illustration */}
                <BannerUpload3DIllustration />

                {/* Typography */}
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    UPLOAD YOUR<br />
                    <span className="text-[#C6FF00]">BANNER.</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                    Show customers what makes your brand unique.
                  </p>
                </div>

                {/* Large upload area */}
                <div className="space-y-1.5">
                  <label className="w-full bg-[#111114] border border-dashed border-[#232326] hover:border-[#C6FF00] rounded-2xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center">
                    <input type="file" accept="image/*" onChange={handleBannerSelect} className="hidden" />
                    {bannerPreview ? (
                      <div className="relative w-full h-20 rounded-xl overflow-hidden border border-[#27272A]">
                        <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1A1A20] flex items-center justify-center text-[#C6FF00] group-hover:scale-110 transition-transform">
                        <Camera size={20} />
                      </div>
                    )}
                    <span className="font-extrabold text-xs text-white uppercase tracking-wide">
                      {bannerPreview ? 'Change Banner' : '🖼 Tap to Upload Banner'}
                    </span>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Recommended size: <span className="text-zinc-300">1600 × 600 px</span>
                    </p>
                  </label>
                  <p className="text-[11px] text-zinc-500 font-medium px-1">
                    This becomes the hero image of your storefront.
                  </p>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setStep(12)}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                  >
                    <span>CONTINUE</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 12: Your Shop is Ready */}
            {step === 12 && (
              <div className="w-full max-w-[390px] mx-auto flex flex-col justify-start space-y-4 text-left px-2">
                {/* 3D Illustration */}
                <ShopReady3DIllustration />

                {/* Typography */}
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-[1.05]">
                    YOUR SHOP IS<br />
                    <span className="text-[#C6FF00]">READY.</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                    Everything is set. Let's launch your storefront and start selling.
                  </p>
                </div>

                {/* Completion checklist */}
                <div className="bg-[#111114] border border-[#232326] rounded-2xl p-3.5 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-zinc-300">
                    {[
                      'Account created',
                      'Shop name saved',
                      'Category selected',
                      'Location added',
                      'Logo uploaded',
                      'Banner uploaded'
                    ].map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-[#C6FF00] shrink-0" />
                        <span className="text-[11px] font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA Button & subtext */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={triggerStoreCreation}
                    disabled={isBuilding}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-between hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.2)] disabled:opacity-70"
                  >
                    <span>{isBuilding ? 'LAUNCHING...' : 'LAUNCH MY SHOP'}</span>
                    <ArrowRight size={20} className="stroke-[3]" />
                  </button>

                  <p className="text-[11px] text-zinc-500 text-center font-medium">
                    You're entering your merchant dashboard.
                  </p>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Shell for initial setup steps */}
      {step < 7 && (
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

          {step > 1 && step < 7 && (
            <button
              type="button"
              onClick={() => {
                if (step === 2) {
                  if (!formData.shopName.trim()) {
                    toast.error('Please enter a shop name!');
                    return;
                  }
                  setStep(3);
                  return;
                }
                if (step === 6) {
                  if (session?.user) {
                    setStep(7);
                  } else {
                    const formEl = document.querySelector('form');
                    if (formEl) {
                      formEl.requestSubmit ? formEl.requestSubmit() : formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    } else {
                      toast.error('Please enter your email and password to create your account.');
                    }
                  }
                  return;
                }
                setStep(prev => prev + 1);
              }}
              className="bg-[#bef500] text-black font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-[0_0_15px_rgba(190,245,0,0.2)]"
            >
              {step === 6 ? 'Create Account' : 'Continue'}
              <ArrowRight size={16} />
            </button>
          )}
        </footer>
      )}
    </div>
  );
};
