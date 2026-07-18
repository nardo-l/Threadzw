// src/screens/SetupShop.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Pencil,
  ShoppingBag,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '../utils/uploadImage';

const zimbabweLocations = {
  'Harare': ['Harare CBD', 'Avondale', 'Borrowdale', 'Eastlea', 'Mount Pleasant', 'Marlborough'],
  'Bulawayo': ['Bulawayo CBD', 'Suburbs', 'Hillside', 'Kumalo', 'Sauerstown'],
  'Manicaland': ['Mutare', 'Chipinge', 'Nyanga', 'Rusape'],
  'Midlands': ['Gweru', 'Kwekwe', 'Zvishavane', 'Shurugwi'],
  'Masvingo': ['Masvingo Town', 'Chiredzi', 'Triangle'],
  'Mashonaland Central': ['Bindura', 'Mazowe', 'Mvurwi'],
  'Mashonaland East': ['Marondera', 'Ruwa', 'Goromonzi'],
  'Mashonaland West': ['Chinhoyi', 'Kariba', 'Kadoma', 'Chegutu'],
  'Matabeleland North': ['Victoria Falls', 'Hwange', 'Lupane'],
  'Matabeleland South': ['Gwanda', 'Beitbridge', 'Plumtree']
};

const WorkspaceCheckItem: React.FC<{ label: string; delay: number }> = ({ label, delay }) => {
  const [status, setStatus] = useState<'pending' | 'active' | 'done'>('pending');

  useEffect(() => {
    const timerActive = setTimeout(() => {
      setStatus('active');
    }, delay - 400);

    const timerDone = setTimeout(() => {
      setStatus('done');
    }, delay);

    return () => {
      clearTimeout(timerActive);
      clearTimeout(timerDone);
    };
  }, [delay]);

  return (
    <div className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${status !== 'pending' ? 'opacity-100' : 'opacity-30'}`}>
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${status === 'done' ? 'bg-green-500/10 border-green-500 text-green-500' : status === 'active' ? 'border-[#bef715] text-[#bef715] animate-pulse bg-[#bef715]/5' : 'border-zinc-800 text-zinc-800'}`}>
        {status === 'done' ? (
          <Check className="w-2.5 h-2.5 stroke-[3.5]" />
        ) : (
          <div className="w-1.5 h-1.5 bg-[#bef715] rounded-full" />
        )}
      </div>
      <span className={`font-semibold tracking-tight transition-colors ${status === 'done' ? 'text-zinc-400' : status === 'active' ? 'text-white' : 'text-zinc-600'}`}>
        {label}
      </span>
    </div>
  );
};

export const SetupShop: React.FC<{ onSetupComplete?: () => void }> = ({ onSetupComplete }) => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { refreshShop } = useShopContext();
  
  // Steps: 
  // 0 = Workspace Setup (Animated Checklist)
  // 1 = Shop Category Choice
  // 8 = Brand Personality Choice
  // 2 = Shop Basics
  // 3 = Brand Vibe / Personality (Pre-populates & edits description)
  // 4 = Branding Uploads (Logo & Banner)
  // 5 = Storefront Preview
  // 6 = "Build My Shop" Processing Screen
  // 7 = Success (Store is Live!)
  // Retrieve saved step from localStorage or default to 1 (Shop Category Choice)
  const [step, setStep] = useState<number>(() => {
    const saved = localStorage.getItem('threadzw_onboarding_step');
    if (saved) {
      const parsed = parseInt(saved, 10);
      // Ensure we only restore valid onboarding steps (not Step 0, and not completed steps 29/30)
      if (parsed > 0 && parsed < 29) {
        return parsed;
      }
    }
    return 1; // Default to step 1 (Shop Category Choice)
  });
  const [loading, setLoading] = useState(false);

  // Persist current onboarding step
  useEffect(() => {
    if (step > 0 && step < 29) {
      localStorage.setItem('threadzw_onboarding_step', step.toString());
    }
  }, [step]);

  // Form states
  const [shopName, setShopName] = useState('');
  const [shopHandle, setShopHandle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Sneakers' | 'Thrift' | 'Streetwear' | 'Formal'>('Streetwear');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Branding states (URLs uploaded to Supabase)
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Handle availability states
  const [handleAvailable, setHandleAvailable] = useState(true);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  // Compiling / loading simulation states
  const [progressIndex, setProgressIndex] = useState(0);
  const [dbCreationFinished, setDbCreationFinished] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Category Selector Dropdown State
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Handle auto-slugification
  const handleNameChange = (name: string) => {
    setShopName(name);
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setShopHandle(slug);
  };

  // Check shop handle availability in real-time
  useEffect(() => {
    if (!shopHandle) {
      setHandleAvailable(true);
      setHandleError(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (shopHandle.length < 3) {
        setHandleError('Handle must be at least 3 characters');
        setHandleAvailable(false);
        return;
      }
      
      setCheckingHandle(true);
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('slug')
          .eq('slug', shopHandle.toLowerCase().trim())
          .maybeSingle();

        if (error) {
          console.error('Error checking handle availability:', error);
        }

        if (data) {
          setHandleError('This handle is already taken');
          setHandleAvailable(false);
        } else {
          setHandleError(null);
          setHandleAvailable(true);
        }
      } catch (err) {
        console.error('Handle validation error:', err);
      } finally {
        setCheckingHandle(false);
      }
    }, 400); // Debounced checkout

    return () => clearTimeout(timer);
  }, [shopHandle]);

  // Pre-fill shop name from onboarding if available
  useEffect(() => {
    const savedShopName = localStorage.getItem('threadzw_onboarding_shop_name');
    if (savedShopName && !shopName) {
      setShopName(savedShopName);
      const slug = savedShopName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setShopHandle(slug);
    }
  }, []);

  // Handle image selections and upload them in the background
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      toast.error('Session expired. Please log in.');
      return;
    }

    setUploadingLogo(true);
    // Show local preview immediately
    const localReader = new FileReader();
    localReader.onload = () => setLogoPreview(localReader.result as string);
    localReader.readAsDataURL(file);

    console.log("[SETUP-SHOP] [FORENSIC] (AWAIT_LOGO_UPLOAD_BEFORE) Starting logo upload to Storage...");
    const t0 = performance.now();
    try {
      const url = await uploadImage({
        supabase,
        file,
        bucket: 'shop-avatars',
        folder: 'logo',
        userId: user.id
      });
      const t1 = performance.now();
      console.log(`[SETUP-SHOP] [FORENSIC] (AWAIT_LOGO_UPLOAD_AFTER) Logo upload succeeded in ${(t1 - t0).toFixed(2)}ms. URL:`, url);
      setLogoUrl(url);
      toast.success('Logo uploaded successfully');
    } catch (err: any) {
      const t1 = performance.now();
      console.error(`[SETUP-SHOP] [FORENSIC] (AWAIT_LOGO_UPLOAD_EXCEPTION) Logo upload failed in ${(t1 - t0).toFixed(2)}ms. Details:`, {
        message: err?.message,
        stack: err?.stack,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
      });
      toast.error(err?.message || 'Logo upload failed. Try again.');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      toast.error('Session expired. Please log in.');
      return;
    }

    setUploadingBanner(true);
    // Show local preview immediately
    const localReader = new FileReader();
    localReader.onload = () => setBannerPreview(localReader.result as string);
    localReader.readAsDataURL(file);

    console.log("[SETUP-SHOP] [FORENSIC] (AWAIT_BANNER_UPLOAD_BEFORE) Starting banner upload to Storage...");
    const t0 = performance.now();
    try {
      const url = await uploadImage({
        supabase,
        file,
        bucket: 'shop-banners',
        folder: 'banner',
        userId: user.id
      });
      const t1 = performance.now();
      console.log(`[SETUP-SHOP] [FORENSIC] (AWAIT_BANNER_UPLOAD_AFTER) Banner upload succeeded in ${(t1 - t0).toFixed(2)}ms. URL:`, url);
      setBannerUrl(url);
      toast.success('Banner uploaded successfully');
    } catch (err: any) {
      const t1 = performance.now();
      console.error(`[SETUP-SHOP] [FORENSIC] (AWAIT_BANNER_UPLOAD_EXCEPTION) Banner upload failed in ${(t1 - t0).toFixed(2)}ms. Details:`, {
        message: err?.message,
        stack: err?.stack,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
      });
      toast.error(err?.message || 'Banner upload failed. Try again.');
      setBannerPreview(null);
    } finally {
      setUploadingBanner(false);
    }
  };

  // Submit and create the storefront
  const handleCreateShop = async () => {
    if (!user?.id) {
      console.error("[SETUP-SHOP] [FORENSIC] Not authenticated, cannot run handleCreateShop.");
      toast.error('Not authenticated');
      setStep(28); // Go back to review if error
      return;
    }

    if (!shopName.trim() || !shopHandle.trim() || !whatsapp.trim()) {
      console.error("[SETUP-SHOP] [FORENSIC] Validation failed: name, handle or whatsapp is empty.");
      toast.error('Please complete all fields');
      setStep(28); // Go back to review if error
      return;
    }

    const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, '');
    if (cleanWhatsapp.length < 9) {
      console.error("[SETUP-SHOP] [FORENSIC] Validation failed: whatsapp number is invalid.");
      toast.error('Please enter a valid WhatsApp number');
      setStep(28); // Go back to review if error
      return;
    }

    console.log("[SETUP-SHOP] [FORENSIC] Initiating shop creation. Parameters:", {
      userId: user.id,
      shopName: shopName.trim(),
      shopHandle: shopHandle.toLowerCase().trim(),
      selectedCategory,
      whatsapp: `+263${cleanWhatsapp}`,
      descriptionLength: description.trim().length,
      hasLogo: !!logoUrl,
      hasBanner: !!bannerUrl
    });

    setLoading(true);

    try {
      // Create shop in database via the custom RPC
      console.log("[SETUP-SHOP] [FORENSIC] (AWAIT_RPC_CREATE_BEFORE) Calling supabase.rpc('create_shop')...");
      const tRpc0 = performance.now();
      let rpcResult;
      try {
        rpcResult = await supabase.rpc('create_shop', {
          p_name: shopName.trim(),
          p_slug: shopHandle.toLowerCase().trim(),
          p_category: selectedCategory,
          p_whatsapp_number: `+263${cleanWhatsapp}`,
        });
        const tRpc1 = performance.now();
        console.log(`[SETUP-SHOP] [FORENSIC] (AWAIT_RPC_CREATE_AFTER) supabase.rpc('create_shop') resolved in ${(tRpc1 - tRpc0).toFixed(2)}ms.`);
      } catch (rpcExc: any) {
        const tRpc1 = performance.now();
        console.error(`[SETUP-SHOP] [FORENSIC] (AWAIT_RPC_CREATE_EXCEPTION) supabase.rpc('create_shop') exception in ${(tRpc1 - tRpc0).toFixed(2)}ms. Details:`, {
          message: rpcExc?.message,
          stack: rpcExc?.stack,
          fullError: JSON.stringify(rpcExc, Object.getOwnPropertyNames(rpcExc))
        });
        throw rpcExc;
      }

      const { data, error: rpcError } = rpcResult;
      console.log("[SETUP-SHOP] [FORENSIC] supabase.rpc('create_shop') response payload:", {
        data,
        error: rpcError ? { message: rpcError.message, code: rpcError.code, details: rpcError.details, hint: rpcError.hint } : null
      });

      if (rpcError) {
        throw rpcError;
      }

      // Update logo, banner, and description right after creating the shop
      const updatePayload: any = {
        description: description.trim(),
      };
      if (logoUrl) updatePayload.logo_url = logoUrl;
      if (bannerUrl) updatePayload.banner_url = bannerUrl;

      console.log("[SETUP-SHOP] [FORENSIC] (AWAIT_SHOP_UPDATE_BEFORE) Updating additional storefront metadata. Payload:", updatePayload);
      const tUpd0 = performance.now();
      let updateResult;
      try {
        updateResult = await supabase
          .from('shops')
          .update(updatePayload)
          .eq('owner_id', user.id);
        const tUpd1 = performance.now();
        console.log(`[SETUP-SHOP] [FORENSIC] (AWAIT_SHOP_UPDATE_AFTER) Shops update operation resolved in ${(tUpd1 - tUpd0).toFixed(2)}ms.`);
      } catch (updExc: any) {
        const tUpd1 = performance.now();
        console.error(`[SETUP-SHOP] [FORENSIC] (AWAIT_SHOP_UPDATE_EXCEPTION) Shops update failed in ${(tUpd1 - tUpd0).toFixed(2)}ms. Details:`, {
          message: updExc?.message,
          stack: updExc?.stack,
          fullError: JSON.stringify(updExc, Object.getOwnPropertyNames(updExc))
        });
        throw updExc;
      }

      const { error: updateError } = updateResult;
      if (updateError) {
        console.error("[SETUP-SHOP] [FORENSIC] Shops table update returned a Supabase error:", updateError);
        throw updateError;
      }

      // Update local storage states
      localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
      localStorage.setItem('threadzw_shop_onboarding_first_time', 'done');
      localStorage.setItem('threadzw_onboarding_complete', 'true');
      localStorage.removeItem('threadzw_onboarding_step');
      console.log("[SETUP-SHOP] [FORENSIC] Local onboarding flag states updated in localStorage.");

      if (updateProfile) {
        console.log("[SETUP-SHOP] [FORENSIC] (AWAIT_PROFILE_SYNC_BEFORE) Calling updateProfile to complete merchant onboarding...");
        const tProf0 = performance.now();
        try {
          await updateProfile({ onboarding_complete: true, town: city || 'Harare' });
          const tProf1 = performance.now();
          console.log(`[SETUP-SHOP] [FORENSIC] (AWAIT_PROFILE_SYNC_AFTER) updateProfile completed in ${(tProf1 - tProf0).toFixed(2)}ms.`);
        } catch (profExc: any) {
          const tProf1 = performance.now();
          console.error(`[SETUP-SHOP] [FORENSIC] (AWAIT_PROFILE_SYNC_EXCEPTION) updateProfile threw an error in ${(tProf1 - tProf0).toFixed(2)}ms. Details:`, {
            message: profExc?.message,
            stack: profExc?.stack,
            fullError: JSON.stringify(profExc, Object.getOwnPropertyNames(profExc))
          });
          throw profExc;
        }
      } else {
        console.warn("[SETUP-SHOP] [FORENSIC] Warning: updateProfile is not defined in context.");
      }

      console.log("[SETUP-SHOP] [FORENSIC] Storefront onboarding completed successfully. Transitioning to dbCreationFinished status.");
      setDbCreationFinished(true);
    } catch (err: any) {
      console.error('[SETUP-SHOP] [FORENSIC] EXCEPTION during shop creation flow:', {
        message: err?.message,
        stack: err?.stack,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
      });
      toast.error(err?.message || 'Failed to initialize storefront details.');
      setStep(28); // Return to review on error
    } finally {
      setLoading(false);
    }
  };

  // Build My Shop Loader effect
  useEffect(() => {
    if (step !== 29) return;
    
    // Trigger real creation
    handleCreateShop();

    // Start loading checkpoints cycle (1 per second)
    setProgressIndex(0);
    const interval = setInterval(() => {
      setProgressIndex((prev) => {
        if (prev >= 4) {
          clearInterval(interval);
          return 4;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // Handle final automatic transition to Step 30
  useEffect(() => {
    if (step === 29 && progressIndex === 4 && dbCreationFinished) {
      setStep(30);
    }
  }, [step, progressIndex, dbCreationFinished]);

  // Map database enum values to premium user-facing labels
  const getCategoryLabel = (cat: 'Sneakers' | 'Thrift' | 'Streetwear' | 'Formal') => {
    switch (cat) {
      case 'Streetwear': return 'Clothing & Fashion';
      case 'Sneakers': return 'Footwear & Sneakers';
      case 'Thrift': return 'Thrift & Vintage';
      case 'Formal': return 'Other';
    }
  };

  // Get first characters of name for default visual logo placeholder
  const getInitials = (name: string) => {
    if (!name) return 'ZD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Auto-advance step 0 to step 1
  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => {
        setStep(1);
      }, 3400);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none overflow-y-auto selection:bg-[#bef715] selection:text-black">
      
      {step === 0 && (
        /* SCREEN 18 — PREPARING YOUR WORKSPACE */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto text-center"
        >
          <div className="w-full shrink-0 py-4" />

          {/* Checklist Center */}
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-8 my-4">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#bef715]/5 rounded-full blur-2xl animate-pulse" />
              <Loader2 className="w-12 h-12 animate-spin text-[#bef715]" />
            </div>

            <div className="w-full space-y-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                  Preparing your<br />
                  <span className="text-[#bef715]">workspace</span>
                </h1>
                <p className="text-zinc-500 text-xs font-mono font-bold uppercase tracking-widest">Setting up secure environment</p>
              </div>

              {/* Checklist */}
              <div className="w-full bg-zinc-950 border border-zinc-900/60 rounded-2xl p-5 text-left space-y-3.5 max-w-[340px] mx-auto">
                {[
                  { label: 'Creating your account', delay: 400 },
                  { label: 'Reserving your shop', delay: 1000 },
                  { label: 'Connecting your profile', delay: 1600 },
                  { label: 'Preparing your dashboard', delay: 2200 },
                  { label: 'Almost ready...', delay: 2800 }
                ].map((item, idx) => {
                  return <WorkspaceCheckItem key={idx} label={item.label} delay={item.delay} />;
                })}
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 text-center py-4">
            <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
              Please wait while we initialize
            </span>
          </div>
        </motion.div>
      )}

      {step === 1 && (
        /* SCREEN 19 — SHOP CATEGORY */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header */}
          <div className="w-full shrink-0">
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">Step 1 of 5</span>
              <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Business Type</span>
            </div>
            {/* Progress line with 5 segments */}
            <div className="w-full grid grid-cols-5 gap-2 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Category selection */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4">
            <div className="space-y-1.5 text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                What type of clothing<br />
                business do you <span className="text-[#bef715]">run?</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Select the option that matches your brand style best.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'Streetwear', label: 'Streetwear', icon: '⚡' },
                { id: 'Boutique', label: 'Boutique', icon: '✨' },
                { id: 'Thrift', label: 'Thrift', icon: '♻️' },
                { id: 'Sportswear', label: 'Sportswear', icon: '🏃' },
                { id: 'Luxury', label: 'Luxury', icon: '💎' },
                { id: 'Kids', label: 'Kids', icon: '🧸' },
                { id: 'Footwear', label: 'Footwear', icon: '👟' },
                { id: 'Accessories', label: 'Accessories', icon: '🎒' }
              ] as const).map((opt) => {
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      // Map opt.id to allowed DB enum values
                      if (opt.id === 'Footwear') {
                        setSelectedCategory('Sneakers');
                      } else if (opt.id === 'Thrift') {
                        setSelectedCategory('Thrift');
                      } else if (opt.id === 'Kids' || opt.id === 'Accessories') {
                        setSelectedCategory('Formal');
                      } else {
                        setSelectedCategory('Streetwear');
                      }
                      
                      // Auto continue
                      setStep(8);
                    }}
                    className="p-4 h-24 rounded-2xl border border-zinc-900 bg-zinc-950 hover:border-[#bef715]/40 flex flex-col justify-between text-left transition-all cursor-pointer active:scale-95"
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-extrabold text-white">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full shrink-0 text-center py-4" />
        </motion.div>
      )}

      {step === 8 && (
        /* SCREEN 20 — BRAND PERSONALITY */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header */}
          <div className="w-full shrink-0">
            <div className="flex justify-between items-center py-2">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">Step 2 of 10</span>
              <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Brand Vibe</span>
            </div>
            {/* Progress line with 10 segments */}
            <div className="w-full grid grid-cols-10 gap-1 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Vibe selection */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4">
            <div className="space-y-1.5 text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                What's your brand<br />
                <span className="text-[#bef715]">personality?</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Choose the style that best represents your clothing brand.</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                { label: 'Minimal', desc: 'Clean, timeless essentials.', icon: '📐' },
                { label: 'Streetwear', desc: 'Bold graphics and urban culture.', icon: '👟' },
                { label: 'Luxury', desc: 'Premium craftsmanship and exclusivity.', icon: '⚜️' },
                { label: 'Vintage', desc: 'Classic fashion with character.', icon: '🕰️' },
                { label: 'Sportswear', desc: 'Performance and movement.', icon: '🏀' },
                { label: 'Y2K', desc: 'Trendy nostalgic fashion.', icon: '🪐' }
              ].map((opt) => {
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setDescription(`${opt.label}: ${opt.desc}`);
                      setStep(21);
                    }}
                    className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950 hover:border-[#bef715]/40 flex items-center justify-between text-left transition-all cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="space-y-0.5">
                        <span className="text-sm font-extrabold text-white block">{opt.label}</span>
                        <span className="text-xs font-medium text-zinc-500 block">{opt.desc}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#bef715]" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full shrink-0 text-center py-4" />
        </motion.div>
      )}

      {step === 21 && (
        /* SCREEN 21 — SHOP NAME */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header */}
          <div className="w-full shrink-0">
            <div className="flex justify-between items-center py-2">
              <button 
                type="button"
                onClick={() => setStep(8)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">Step 3 of 10</span>
              <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Shop Name</span>
            </div>
            {/* Progress line with 10 segments */}
            <div className="w-full grid grid-cols-10 gap-1 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Form details */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4">
            <div className="space-y-1.5 text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                What is your<br />
                shop <span className="text-[#bef715]">called?</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Enter the name customers know you by.</p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Shop Name</label>
              <input 
                type="text"
                value={shopName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Urban Drip"
                className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-medium"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full shrink-0">
            <button
              onClick={() => setStep(22)}
              disabled={!shopName.trim()}
              className="w-full h-14 bg-[#bef715] disabled:opacity-50 hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>Continue &rarr;</span>
            </button>
          </div>
        </motion.div>
      )}

      {step === 22 && (
        /* SCREEN 22 — USERNAME / SHOP URL */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header */}
          <div className="w-full shrink-0">
            <div className="flex justify-between items-center py-2">
              <button 
                type="button"
                onClick={() => setStep(21)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">Step 4 of 10</span>
              <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Shop Link</span>
            </div>
            {/* Progress line with 10 segments */}
            <div className="w-full grid grid-cols-10 gap-1 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Form details */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4">
            <div className="space-y-1.5 text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                Choose your<br />
                shop <span className="text-[#bef715]">link</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Customers will visit your shop using this address.</p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <input 
                  type="text"
                  value={shopHandle}
                  onChange={(e) => setShopHandle(e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="yourshop"
                  className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-mono"
                />
                {checkingHandle && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#bef715]" />
                  </div>
                )}
              </div>
              
              {/* Preview Link Display */}
              <div className="mt-2 p-3 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500">Preview:</span>
                <span className="text-xs font-mono font-bold text-white">
                  threadzw.app/<span className="text-[#bef715]">{shopHandle || 'yourshop'}</span>
                </span>
              </div>

              {/* Real-time handle status feedback */}
              {shopHandle && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {checkingHandle ? (
                    <span className="text-xs text-zinc-600 font-medium">Verifying availability...</span>
                  ) : handleAvailable ? (
                    <div className="flex items-center gap-1 text-[#bef715]">
                      <span className="text-xs font-black uppercase tracking-wider">✓ Available</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500">
                      <span className="text-xs font-black uppercase tracking-wider">❌ Already taken</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full shrink-0">
            <button
              onClick={() => setStep(23)}
              disabled={!shopHandle.trim() || checkingHandle || !handleAvailable}
              className="w-full h-14 bg-[#bef715] disabled:opacity-50 hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>Continue &rarr;</span>
            </button>
          </div>
        </motion.div>
      )}

      {step === 23 && (
        /* SCREEN 23 — WHATSAPP NUMBER */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header */}
          <div className="w-full shrink-0">
            <div className="flex justify-between items-center py-2">
              <button 
                type="button"
                onClick={() => setStep(22)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">Step 5 of 10</span>
              <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">WhatsApp</span>
            </div>
            {/* Progress line with 10 segments */}
            <div className="w-full grid grid-cols-10 gap-1 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Form details */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4">
            <div className="space-y-1.5 text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                Where should<br />
                customers <span className="text-[#bef715]">contact you?</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Customers will send orders directly to this WhatsApp number.</p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">WhatsApp number</label>
              <div className="flex gap-2">
                <div className="w-24 h-12 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold text-zinc-400">
                  <span>🇿🇼</span>
                  <span>+263</span>
                </div>
                <div className="flex-1">
                  <input 
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="77 444 3322"
                    className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full shrink-0">
            <button
              onClick={() => setStep(24)}
              disabled={!whatsapp.trim() || whatsapp.replace(/[^0-9]/g, '').length < 9}
              className="w-full h-14 bg-[#bef715] disabled:opacity-50 hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>Continue &rarr;</span>
            </button>
          </div>
        </motion.div>
      )}

      {step === 24 && (
        /* SCREEN 24 — BUSINESS LOCATION */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header */}
          <div className="w-full shrink-0">
            <div className="flex justify-between items-center py-2">
              <button 
                type="button"
                onClick={() => setStep(23)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">Step 6 of 10</span>
              <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Location</span>
            </div>
            {/* Progress line with 10 segments */}
            <div className="w-full grid grid-cols-10 gap-1 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Form details */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4">
            <div className="space-y-1.5 text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                Where is your<br />
                business <span className="text-[#bef715]">located?</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Select your province and city to let local customers find you.</p>
            </div>

            <div className="space-y-4">
              {/* Province Dropdown */}
              <div className="space-y-1.5 text-left relative">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Province</label>
                <button
                  type="button"
                  onClick={() => {
                    setProvinceDropdownOpen(!provinceDropdownOpen);
                    setCityDropdownOpen(false);
                  }}
                  className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 flex items-center justify-between text-white text-sm focus:outline-none focus:border-[#bef715] transition-all font-medium text-left cursor-pointer"
                >
                  <span>{province || 'Select Province'}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${provinceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {provinceDropdownOpen && (
                  <div className="absolute top-[74px] left-0 w-full bg-zinc-950 border border-zinc-900 rounded-xl p-1.5 space-y-1 z-30 shadow-2xl max-h-48 overflow-y-auto">
                    {Object.keys(zimbabweLocations).map((prov) => (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => {
                          setProvince(prov);
                          setCity(''); // reset city
                          setProvinceDropdownOpen(false);
                        }}
                        className={`w-full h-10 px-3 rounded-lg text-xs font-bold text-left flex items-center justify-between hover:bg-zinc-900 transition-all ${province === prov ? 'text-[#bef715] bg-[#bef715]/5' : 'text-zinc-400'}`}
                      >
                        <span>{prov}</span>
                        {province === prov && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* City Dropdown */}
              <div className="space-y-1.5 text-left relative">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">City / Town</label>
                <button
                  type="button"
                  disabled={!province}
                  onClick={() => {
                    setCityDropdownOpen(!cityDropdownOpen);
                    setProvinceDropdownOpen(false);
                  }}
                  className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 flex items-center justify-between text-white text-sm focus:outline-none focus:border-[#bef715] transition-all font-medium text-left cursor-pointer disabled:opacity-50"
                >
                  <span>{city || 'Select City / Town'}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {cityDropdownOpen && province && (
                  <div className="absolute top-[74px] left-0 w-full bg-zinc-950 border border-zinc-900 rounded-xl p-1.5 space-y-1 z-30 shadow-2xl max-h-48 overflow-y-auto">
                    {zimbabweLocations[province as keyof typeof zimbabweLocations]?.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCity(c);
                          setCityDropdownOpen(false);
                        }}
                        className={`w-full h-10 px-3 rounded-lg text-xs font-bold text-left flex items-center justify-between hover:bg-zinc-900 transition-all ${city === c ? 'text-[#bef715] bg-[#bef715]/5' : 'text-zinc-400'}`}
                      >
                        <span>{c}</span>
                        {city === c && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full shrink-0">
            <button
              onClick={() => setStep(25)}
              disabled={!province || !city}
              className="w-full h-14 bg-[#bef715] disabled:opacity-50 hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>Continue &rarr;</span>
            </button>
          </div>
        </motion.div>
      )}

      {step === 25 && (
        /* SCREEN 25 — BUSINESS DESCRIPTION */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header */}
          <div className="w-full shrink-0">
            <div className="flex justify-between items-center py-2">
              <button 
                type="button"
                onClick={() => setStep(24)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">Step 7 of 10</span>
              <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">About</span>
            </div>
            {/* Progress line with 10 segments */}
            <div className="w-full grid grid-cols-10 gap-1 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Form details */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4">
            <div className="space-y-1.5 text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                Tell us about<br />
                your <span className="text-[#bef715]">shop</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Write a description of what you sell and your terms.</p>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Description</label>
                <span className="text-xs font-mono text-zinc-600">{description.length}/160</span>
              </div>
              <textarea 
                value={description}
                maxLength={160}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Urban Drip is Harare's premier plug for high-end streetwear. We offer delivery nationwide and real-time support on WhatsApp."
                className="w-full h-32 bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-medium resize-none"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full shrink-0">
            <button
              onClick={() => setStep(26)}
              disabled={!description.trim() || description.length < 10}
              className="w-full h-14 bg-[#bef715] disabled:opacity-50 hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>Continue &rarr;</span>
            </button>
          </div>
        </motion.div>
      )}

      {step === 26 && (
        /* SCREEN 26 — UPLOAD LOGO */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header */}
          <div className="w-full shrink-0">
            <div className="flex justify-between items-center py-2">
              <button 
                type="button"
                onClick={() => setStep(25)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">Step 8 of 10</span>
              <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Logo</span>
            </div>
            {/* Progress line with 10 segments */}
            <div className="w-full grid grid-cols-10 gap-1 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Form details */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4">
            <div className="space-y-1.5 text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                Upload your<br />
                shop <span className="text-[#bef715]">logo</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Make your shop recognizable with a clean logo.</p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-36 h-36 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center bg-zinc-950 hover:border-[#bef715] transition-all overflow-hidden group">
                {uploadingLogo ? (
                  <Loader2 className="w-8 h-8 animate-spin text-[#bef715]" />
                ) : logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <button 
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex flex-col items-center justify-center space-y-1 text-zinc-500 hover:text-white"
                  >
                    <span className="text-3xl font-light">+</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Tap to upload</span>
                  </button>
                )}

                {logoPreview && !uploadingLogo && (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Change</span>
                  </button>
                )}
              </div>

              <input 
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full shrink-0">
            <button
              onClick={() => setStep(27)}
              className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>{logoUrl ? 'Continue' : 'Skip & Continue'} &rarr;</span>
            </button>
          </div>
        </motion.div>
      )}

      {step === 27 && (
        /* SCREEN 27 — UPLOAD BANNER */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header */}
          <div className="w-full shrink-0">
            <div className="flex justify-between items-center py-2">
              <button 
                type="button"
                onClick={() => setStep(26)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">Step 9 of 10</span>
              <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Banner</span>
            </div>
            {/* Progress line with 10 segments */}
            <div className="w-full grid grid-cols-10 gap-1 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Form details */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4">
            <div className="space-y-1.5 text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                Upload your<br />
                shop <span className="text-[#bef715]">banner</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Add a landscape banner to display at the top of your store (optional).</p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full h-36 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center bg-zinc-950 hover:border-[#bef715] transition-all overflow-hidden group">
                {uploadingBanner ? (
                  <Loader2 className="w-8 h-8 animate-spin text-[#bef715]" />
                ) : bannerPreview ? (
                  <img 
                    src={bannerPreview} 
                    alt="Banner preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <button 
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="flex flex-col items-center justify-center space-y-1 text-zinc-500 hover:text-white"
                  >
                    <span className="text-3xl font-light">+</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Tap to upload</span>
                  </button>
                )}

                {bannerPreview && !uploadingBanner && (
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Change</span>
                  </button>
                )}
              </div>

              <input 
                type="file"
                ref={bannerInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleBannerUpload}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full shrink-0">
            <button
              onClick={() => setStep(28)}
              className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>{bannerUrl ? 'Continue' : 'Skip & Continue'} &rarr;</span>
            </button>
          </div>
        </motion.div>
      )}

      {step === 28 && (
        /* SCREEN 28 — REVIEW */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header */}
          <div className="w-full shrink-0">
            <div className="flex justify-between items-center py-2">
              <button 
                type="button"
                onClick={() => setStep(27)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">Step 10 of 10</span>
              <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Review</span>
            </div>
            {/* Progress line with 10 segments */}
            <div className="w-full grid grid-cols-10 gap-1 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
            </div>
          </div>

          {/* Form details */}
          <div className="w-full flex-1 flex flex-col justify-start space-y-6 my-4 overflow-y-auto pr-1">
            <div className="space-y-1 text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                Review your<br />
                shop <span className="text-[#bef715]">details</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Make sure everything looks perfect before launching.</p>
            </div>

            {/* Structured review card list */}
            <div className="space-y-3">
              {/* Shop Name */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Shop Name</span>
                  <span className="text-sm font-bold text-white">{shopName}</span>
                </div>
                <button onClick={() => setStep(21)} className="text-xs font-bold text-[#bef715] hover:underline uppercase tracking-wider">Edit</button>
              </div>

              {/* Shop Link */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Shop Link</span>
                  <span className="text-xs font-mono font-bold text-white">threadzw.app/{shopHandle}</span>
                </div>
                <button onClick={() => setStep(22)} className="text-xs font-bold text-[#bef715] hover:underline uppercase tracking-wider">Edit</button>
              </div>

              {/* WhatsApp Contact */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">WhatsApp Number</span>
                  <span className="text-sm font-bold text-white font-mono">+263 {whatsapp}</span>
                </div>
                <button onClick={() => setStep(23)} className="text-xs font-bold text-[#bef715] hover:underline uppercase tracking-wider">Edit</button>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Location</span>
                  <span className="text-sm font-bold text-white">{city}, {province}</span>
                </div>
                <button onClick={() => setStep(24)} className="text-xs font-bold text-[#bef715] hover:underline uppercase tracking-wider">Edit</button>
              </div>

              {/* Description */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl">
                <div className="text-left max-w-[80%]">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Bio / Description</span>
                  <p className="text-xs font-medium text-zinc-400 line-clamp-2">{description}</p>
                </div>
                <button onClick={() => setStep(25)} className="text-xs font-bold text-[#bef715] hover:underline uppercase tracking-wider">Edit</button>
              </div>

              {/* Visuals Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Logo</span>
                  <span className="text-xs font-bold text-white">{logoPreview ? '✓ Loaded' : 'Skipped'}</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-[#bef715]/10 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Banner</span>
                  <span className="text-xs font-bold text-white">{bannerPreview ? '✓ Loaded' : 'Skipped'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full shrink-0">
            <button
              onClick={() => setStep(29)}
              className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>Build My Shop 🚀</span>
            </button>
          </div>
        </motion.div>
      )}

      {step === 29 && (
        /* SCREEN 29 — CREATING SHOP PROGRESS LOADER */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto text-center"
        >
          <div className="w-full shrink-0 py-4" />

          {/* Processing Visuals */}
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-8 my-4">
            {/* Double rotating dash borders */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#bef715]/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute inset-0 border-2 border-dashed border-[#bef715]/20 rounded-full animate-spin [animation-duration:12s]" />
              <div className="absolute inset-2 border border-dashed border-[#bef715]/40 rounded-full animate-spin [animation-duration:5s] [animation-direction:reverse]" />
              <div className="absolute w-24 h-24 bg-zinc-950 border border-zinc-900 rounded-full flex flex-col items-center justify-center shadow-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-[#bef715]" />
              </div>
            </div>

            {/* Headline & Progress Checklist */}
            <div className="w-full space-y-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                  Building your<br />
                  <span className="text-[#bef715]">storefront</span>
                </h1>
                <p className="text-zinc-500 text-xs font-mono font-bold uppercase tracking-widest">Compiling catalog engine</p>
              </div>

              {/* Tasks Checklist */}
              <div className="w-full bg-zinc-950 border border-zinc-900/60 rounded-2xl p-4 text-left space-y-3 max-w-[340px] mx-auto">
                {[
                  { label: `Securing domain: threadzw.app/${shopHandle}`, stepMin: 0 },
                  { label: 'Provisioning secure cloud database tables', stepMin: 1 },
                  { label: `Activating WhatsApp ordering at +263${whatsapp}`, stepMin: 2 },
                  { label: 'Bundling visual assets and branding layers', stepMin: 3 }
                ].map((item, idx) => {
                  const isActive = progressIndex >= item.stepMin;
                  const isCompleted = progressIndex > item.stepMin;
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${
                        isActive ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isCompleted 
                          ? 'bg-green-500/10 border-green-500 text-green-500' 
                          : isActive 
                            ? 'border-[#bef715] text-[#bef715] animate-pulse bg-[#bef715]/5' 
                            : 'border-zinc-800 text-zinc-800'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                        ) : (
                          <div className="w-1.5 h-1.5 bg-[#bef715] rounded-full" />
                        )}
                      </div>
                      <span className={`font-semibold tracking-tight transition-colors ${
                        isCompleted ? 'text-zinc-400' : isActive ? 'text-white' : 'text-zinc-600'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 text-center py-4">
            <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
              Secured by Supabase PostgreSQL
            </span>
          </div>
        </motion.div>
      )}

      {step === 30 && (
        /* SCREEN 30 — SUCCESS Celebration */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto text-center"
        >
          <div className="w-full shrink-0 py-4" />

          {/* Celebration visuals */}
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-8 my-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Backlight glow */}
              <div className="absolute inset-0 bg-[#bef715]/10 rounded-full blur-2xl animate-pulse" />
              
              {/* Double pulsing borders */}
              <div className="absolute inset-0 border-2 border-dashed border-[#bef715]/20 rounded-full animate-spin [animation-duration:15s]" />
              <div className="absolute inset-2 border-[3px] border-[#bef715]/40 rounded-full animate-ping [animation-duration:3s]" />
              
              {/* Inner checkmark shield */}
              <div className="absolute w-28 h-28 bg-zinc-950 border border-[#bef715] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(190,247,21,0.2)]">
                <Check className="w-14 h-14 text-[#bef715] stroke-[4]" />
              </div>

              {/* Sparkles */}
              <div className="absolute -top-2 left-6 w-2 h-2 rounded-full bg-[#bef715] opacity-60 animate-bounce" />
              <div className="absolute -bottom-3 right-8 w-2.5 h-2.5 rounded-full bg-[#bef715] opacity-75 animate-pulse" />
              <div className="absolute top-12 -right-4 w-1.5 h-1.5 rounded-full bg-[#bef715] opacity-40 animate-bounce [animation-delay:0.5s]" />
              <div className="absolute top-20 -left-5 w-2 h-2 rounded-full bg-[#bef715] opacity-50 animate-pulse [animation-delay:0.8s]" />
            </div>

            {/* Headline and Copy */}
            <div className="space-y-3 px-2">
              <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">
                Your shop is<br />
                <span className="text-[#bef715]">live!</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                Congratulations! Your ThreadZW online storefront has been created. Start marketing your products today.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3 shrink-0 mt-6">
            <button
              onClick={async () => {
                console.log("[SETUP-SHOP] [FORENSIC] (AWAIT_GO_DASHBOARD_BEFORE) User clicked 'Go to Dashboard' button.");
                const t0 = performance.now();
                try {
                  if (onSetupComplete) {
                    console.log("[SETUP-SHOP] [FORENSIC] Calling onSetupComplete()...");
                    await onSetupComplete();
                    console.log("[SETUP-SHOP] [FORENSIC] onSetupComplete() finished.");
                  } else {
                    console.log("[SETUP-SHOP] [FORENSIC] onSetupComplete is not defined. Calling refreshShop()...");
                    await refreshShop();
                    console.log("[SETUP-SHOP] [FORENSIC] refreshShop() finished.");
                  }
                  const t1 = performance.now();
                  console.log(`[SETUP-SHOP] [FORENSIC] (AWAIT_GO_DASHBOARD_AFTER) Completion routine resolved in ${(t1 - t0).toFixed(2)}ms. Navigating to /dashboard...`);
                } catch (navExc: any) {
                  const t1 = performance.now();
                  console.error(`[SETUP-SHOP] [FORENSIC] (AWAIT_GO_DASHBOARD_EXCEPTION) Completion routine threw exception in ${(t1 - t0).toFixed(2)}ms. Details:`, {
                    message: navExc?.message,
                    stack: navExc?.stack,
                    fullError: JSON.stringify(navExc, Object.getOwnPropertyNames(navExc))
                  });
                }
                navigate('/dashboard');
                console.log("[SETUP-SHOP] [FORENSIC] navigate('/dashboard') called.");
              }}
              className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <a
              href={`/${shopHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={async () => {
                console.log("[SETUP-SHOP] [FORENSIC] (AWAIT_PREVIEW_BEFORE) User clicked 'Preview My Shop' link.");
                const t0 = performance.now();
                try {
                  if (onSetupComplete) {
                    console.log("[SETUP-SHOP] [FORENSIC] Calling onSetupComplete() on preview...");
                    await onSetupComplete();
                    console.log("[SETUP-SHOP] [FORENSIC] onSetupComplete() finished.");
                  } else {
                    console.log("[SETUP-SHOP] [FORENSIC] onSetupComplete is not defined. Calling refreshShop() on preview...");
                    await refreshShop();
                    console.log("[SETUP-SHOP] [FORENSIC] refreshShop() finished.");
                  }
                  const t1 = performance.now();
                  console.log(`[SETUP-SHOP] [FORENSIC] (AWAIT_PREVIEW_AFTER) Completion routine for preview resolved in ${(t1 - t0).toFixed(2)}ms.`);
                } catch (navExc: any) {
                  const t1 = performance.now();
                  console.error(`[SETUP-SHOP] [FORENSIC] (AWAIT_PREVIEW_EXCEPTION) Completion routine for preview threw exception in ${(t1 - t0).toFixed(2)}ms. Details:`, {
                    message: navExc?.message,
                    stack: navExc?.stack,
                    fullError: JSON.stringify(navExc, Object.getOwnPropertyNames(navExc))
                  });
                }
              }}
              className="w-full h-12 bg-transparent text-[#bef715] border border-zinc-900 rounded-2xl hover:bg-zinc-950 font-extrabold text-sm flex items-center justify-center cursor-pointer transition-all active:scale-[0.98]"
            >
              Preview My Shop 🔗
            </a>
          </div>
        </motion.div>
      )}

    </div>
  );
};
