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
  Smartphone, 
  Pencil,
  Eye,
  EyeOff,
  ShoppingBag,
  Store,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '../utils/uploadImage';

export const SetupShop: React.FC<{ onSetupComplete?: () => void }> = ({ onSetupComplete }) => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { refreshShop } = useShopContext();
  
  // Steps: 2 = Shop Basics, 3 = Branding, 4 = Preview, 5 = Success Screen
  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(false);

  // Form states
  const [shopName, setShopName] = useState('');
  const [shopHandle, setShopHandle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Sneakers' | 'Thrift' | 'Streetwear' | 'Formal'>('Streetwear');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');

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
          .select('handle')
          .eq('handle', shopHandle.toLowerCase().trim())
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
    }, 4000); // 400ms debounce to feel snappy yet reduce DB load

    return () => clearTimeout(timer);
  }, [shopHandle]);

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

    try {
      const url = await uploadImage({
        supabase,
        file,
        bucket: 'shop-avatars',
        folder: 'logo',
        userId: user.id
      });
      setLogoUrl(url);
      toast.success('Logo uploaded successfully');
    } catch (err: any) {
      console.error('Logo upload error:', err);
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

    try {
      const url = await uploadImage({
        supabase,
        file,
        bucket: 'shop-banners',
        folder: 'banner',
        userId: user.id
      });
      setBannerUrl(url);
      toast.success('Banner uploaded successfully');
    } catch (err: any) {
      console.error('Banner upload error:', err);
      toast.error(err?.message || 'Banner upload failed. Try again.');
      setBannerPreview(null);
    } finally {
      setUploadingBanner(false);
    }
  };

  // Submit and create the storefront
  const handleCreateShop = async () => {
    if (!user?.id) {
      toast.error('Not authenticated');
      return;
    }

    if (!shopName.trim() || !shopHandle.trim() || !whatsapp.trim()) {
      toast.error('Please complete all fields');
      return;
    }

    const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, '');
    if (cleanWhatsapp.length < 9) {
      toast.error('Please enter a valid WhatsApp number');
      return;
    }

    setLoading(true);

    try {
      // Create shop in database via the custom RPC
      const { data, error: rpcError } = await supabase.rpc('create_shop', {
        p_name: shopName.trim(),
        p_slug: shopHandle.toLowerCase().trim(),
        p_category: selectedCategory,
        p_whatsapp_number: `+263${cleanWhatsapp}`,
      });

      if (rpcError) {
        throw rpcError;
      }

      // Update logo and banner URLs right after creating the shop
      if (logoUrl || bannerUrl) {
        const updatePayload: any = {};
        if (logoUrl) updatePayload.logo_url = logoUrl;
        if (bannerUrl) updatePayload.banner_url = bannerUrl;

        await supabase
          .from('shops')
          .update(updatePayload)
          .eq('owner_id', user.id);
      }

      // Update local storage states
      localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
      localStorage.setItem('threadzw_shop_onboarding_first_time', 'done');
      localStorage.setItem('threadzw_onboarding_complete', 'true');

      if (updateProfile) {
        await updateProfile({ onboarding_complete: true });
      }

      // Advance to success screen!
      setStep(5);
    } catch (err: any) {
      console.error('Error creating shop:', err);
      toast.error(err?.message || 'Failed to initialize storefront details.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none overflow-y-auto selection:bg-[#bef715] selection:text-black">
      
      {step === 2 && (
        /* STEP 2 OF 4: SHOP BASICS */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header Progress indicator */}
          <div className="w-full shrink-0">
            <div className="flex items-center justify-between py-4">
              <span className="text-zinc-600 font-extrabold text-sm uppercase">Shop Basics</span>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">
                Step 2 of 4
              </span>
            </div>

            {/* Progress line with segments */}
            <div className="w-full grid grid-cols-4 gap-2 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Form details */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-8 my-4">
            <div className="space-y-2 text-left">
              <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">
                Tell us about<br />
                <span className="text-[#bef715]">your shop</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">This will be your shop's identity online.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (handleAvailable && !checkingHandle) setStep(3); }} className="space-y-5">
              
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Shop name</label>
                <input 
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Zim Drip Collection"
                  className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-medium"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Shop handle</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={shopHandle}
                    onChange={(e) => setShopHandle(e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="zimdrip"
                    className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-mono"
                  />
                  {checkingHandle && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#bef715]" />
                    </div>
                  )}
                </div>
                {/* Real-time handle status feedback */}
                {shopHandle && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {checkingHandle ? (
                      <span className="text-xs text-zinc-600 font-medium">Verifying name availability...</span>
                    ) : handleAvailable ? (
                      <div className="flex items-center gap-1 text-[#bef715]">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span className="text-xs font-bold">{shopHandle} is available</span>
                      </div>
                    ) : (
                      <span className="text-xs text-red-500 font-bold">{handleError || 'This handle is taken'}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Shop Category Dropdown */}
              <div className="space-y-1.5 text-left relative">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Shop category</label>
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 flex items-center justify-between text-white text-sm focus:outline-none focus:border-[#bef715] transition-all font-medium text-left cursor-pointer"
                >
                  <span>{getCategoryLabel(selectedCategory)}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoryDropdownOpen && (
                  <div className="absolute top-[74px] left-0 w-full bg-zinc-950 border border-zinc-900 rounded-xl p-1.5 space-y-1 z-30 shadow-2xl">
                    {([
                      { id: 'Streetwear', label: 'Clothing & Fashion' },
                      { id: 'Sneakers', label: 'Footwear & Sneakers' },
                      { id: 'Thrift', label: 'Thrift & Vintage' },
                      { id: 'Formal', label: 'Other' }
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setSelectedCategory(opt.id); setCategoryDropdownOpen(false); }}
                        className={`w-full h-10 px-3 rounded-lg text-xs font-bold text-left flex items-center justify-between hover:bg-zinc-900 transition-all ${selectedCategory === opt.id ? 'text-[#bef715] bg-[#bef715]/5' : 'text-zinc-400'}`}
                      >
                        <span>{opt.label}</span>
                        {selectedCategory === opt.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* WhatsApp business with flag design */}
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
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="78 123 4567"
                      className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!handleAvailable || checkingHandle}
                className="w-full h-14 bg-[#bef715] disabled:opacity-50 hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] mt-8 shadow-lg shadow-[#bef715]/10"
              >
                <span>Continue &rarr;</span>
              </button>
            </form>
          </div>

          <div className="w-full shrink-0 text-center py-4" />
        </motion.div>
      )}

      {step === 3 && (
        /* STEP 3 OF 4: BRANDING */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto animate-fadeIn"
        >
          {/* Header Progress indicator */}
          <div className="w-full shrink-0">
            <div className="flex items-center justify-between py-4">
              <button 
                onClick={() => setStep(2)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-white active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2]" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">
                Step 3 of 4
              </span>
            </div>

            {/* Progress line with segments */}
            <div className="w-full grid grid-cols-4 gap-2 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Upload Cards */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-8 my-4">
            <div className="space-y-2 text-left">
              <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">
                Add your<br />
                <span className="text-[#bef715]">brand</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Upload a logo and banner to personalize your shop.</p>
            </div>

            <div className="space-y-6">
              {/* Logo Upload Box */}
              <div className="space-y-2 text-left">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Shop logo</span>
                <div className="relative h-44 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center overflow-hidden">
                  {uploadingLogo ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-[#bef715]">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-bold">Uploading logo...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-[#bef715] shadow-lg shadow-[#bef715]/10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-dashed border-zinc-800 flex items-center justify-center text-[#bef715] font-black text-xl animate-pulse shadow-md">
                          {getInitials(shopName)}
                        </div>
                      )}
                      <span className="text-xs font-extrabold text-zinc-400">Click the pencil icon to upload logo</span>
                    </div>
                  )}

                  {/* Edit Pencil Button */}
                  <button 
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute right-4 top-4 w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 text-[#bef715] active:scale-90 transition-all cursor-pointer shadow-lg"
                  >
                    <Pencil className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <input 
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>

              {/* Banner Upload Box */}
              <div className="space-y-2 text-left">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Shop banner (optional)</span>
                <div className="relative h-32 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center overflow-hidden">
                  {uploadingBanner ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-[#bef715]">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-bold">Uploading banner...</span>
                    </div>
                  ) : bannerPreview ? (
                    <div className="absolute inset-0">
                      <img 
                        src={bannerPreview} 
                        alt="Banner Preview" 
                        className="w-full h-full object-cover opacity-65"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-center justify-center">
                        <span className="text-xs font-black tracking-widest text-white uppercase bg-black/60 px-3 py-1.5 rounded-full border border-zinc-900">Custom banner active</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1.5 px-4 text-center">
                      <span className="text-3xl font-black tracking-tight text-zinc-800 italic uppercase">Drip</span>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Default visual asset</span>
                    </div>
                  )}

                  {/* Edit Pencil Button */}
                  <button 
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute right-4 top-4 w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 text-[#bef715] active:scale-90 transition-all cursor-pointer shadow-lg"
                  >
                    <Pencil className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <input 
                    type="file"
                    ref={bannerInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleBannerUpload}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] mt-8 shadow-lg shadow-[#bef715]/10"
            >
              <span>Continue &rarr;</span>
            </button>
          </div>

          <div className="w-full shrink-0 text-center py-4" />
        </motion.div>
      )}

      {step === 4 && (
        /* STEP 4 OF 4: PREVIEW */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header Progress indicator */}
          <div className="w-full shrink-0">
            <div className="flex items-center justify-between py-4">
              <button 
                onClick={() => setStep(3)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-white active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2]" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">
                Step 4 of 4
              </span>
            </div>

            {/* Progress line with segments */}
            <div className="w-full grid grid-cols-4 gap-2 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-[#bef715]" />
            </div>
          </div>

          {/* Preview details */}
          <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-2">
            <div className="space-y-1.5 text-left">
              <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">
                Preview your<br />
                <span className="text-[#bef715]">shop</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Here's how your shop will look to customers.</p>
            </div>

            {/* Realistic Shop Mockup Card */}
            <div className="w-full border border-zinc-900 rounded-3xl overflow-hidden bg-zinc-950 p-4 shadow-[0_0_40px_rgba(190,247,21,0.04)] relative">
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#bef715]/40 to-transparent" />
              
              {/* Phone Status bar mock */}
              <div className="flex items-center justify-between px-2 pb-3 border-b border-zinc-900/60 mb-3 text-[10px] text-zinc-500 font-bold font-mono">
                <span>9:41</span>
                <span className="tracking-wider flex items-center gap-1">
                  <span>5G</span>
                  <div className="w-5 h-2.5 bg-zinc-900 rounded-sm border border-zinc-800 p-0.5 flex items-center justify-start">
                    <div className="w-2.5 h-full bg-[#bef715] rounded-xs" />
                  </div>
                </span>
              </div>

              {/* Preview Banner */}
              <div className="w-full h-24 rounded-2xl bg-zinc-900 relative overflow-hidden flex items-center justify-center border border-zinc-900">
                {bannerPreview ? (
                  <img 
                    src={bannerPreview} 
                    alt="Banner" 
                    className="w-full h-full object-cover opacity-75"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl font-black tracking-tight text-zinc-800 italic uppercase">Drip</span>
                  </div>
                )}

                {/* Overlaid floating Logo */}
                <div className="absolute left-4 bottom-[-20px] w-14 h-14 rounded-full bg-zinc-950 border-2 border-[#bef715] p-0.5 shadow-lg flex items-center justify-center">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[#bef715] font-black text-sm">
                      {getInitials(shopName)}
                    </div>
                  )}
                </div>
              </div>

              {/* Shop Title Info */}
              <div className="pt-7 text-left space-y-1 px-1">
                <h3 className="text-lg font-black text-white leading-tight uppercase">
                  {shopName || 'Zim Drip Collection'}
                </h3>
                <span className="text-xs font-bold text-zinc-400">
                  {getCategoryLabel(selectedCategory)}
                </span>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2 pt-3 px-1">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#bef715]/5 border border-[#bef715]/10 text-[#bef715]">
                  <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                  <span className="text-[9px] font-black tracking-tight uppercase">100% Secure</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <Truck className="w-3 h-3" />
                  <span className="text-[9px] font-black tracking-tight uppercase">Fast Delivery</span>
                </div>
              </div>

              {/* Catalog items mockup */}
              <div className="grid grid-cols-3 gap-2 pt-4 px-1">
                {[
                  { name: 'Drip Hoodie', price: '$35.00', color: 'bg-zinc-900' },
                  { name: 'Zim Cap', price: '$15.00', color: 'bg-zinc-900' },
                  { name: 'Tracksuit', price: '$45.00', color: 'bg-zinc-900' }
                ].map((p, i) => (
                  <div key={i} className="rounded-xl border border-zinc-900/80 bg-zinc-950 p-2 space-y-1 text-left relative flex flex-col justify-between">
                    {/* Abstract Product Asset */}
                    <div className={`w-full h-14 rounded-lg ${p.color} flex items-center justify-center mb-1 text-zinc-700`}>
                      <ShoppingBag className="w-5 h-5 opacity-40 text-[#bef715]" />
                    </div>
                    <span className="text-[9px] font-bold text-white block truncate leading-none">{p.name}</span>
                    <span className="text-[9px] font-black text-[#bef715] leading-none">{p.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateShop}
              disabled={loading}
              className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] mt-4 shadow-lg shadow-[#bef715]/10"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Launch My Shop 🚀</span>
                </>
              )}
            </button>
          </div>

          <div className="w-full shrink-0 text-center py-4" />
        </motion.div>
      )}

      {step === 5 && (
        /* SCREEN 6: SUCCESS (Your shop is live!) */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto text-center"
        >
          <div className="w-full shrink-0 py-4" />

          {/* Success visuals */}
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-8 my-4">
            
            {/* Pulsing circular green success checkmark with particles */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              
              {/* Backlight glow */}
              <div className="absolute inset-0 bg-[#bef715]/10 rounded-full blur-2xl animate-pulse" />
              
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 border-[3px] border-[#bef715]/20 rounded-full animate-ping [animation-duration:3s]" />
              
              {/* Inner glowing circle */}
              <div className="absolute w-28 h-28 bg-zinc-950 border border-[#bef715] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(190,247,21,0.2)]">
                <Check className="w-14 h-14 text-[#bef715] stroke-[4]" />
              </div>

              {/* Sparkle particles */}
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
                Your online shop is ready. Start adding products and growing your brand.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="w-full space-y-4 shrink-0 mt-6">
            <button
              onClick={async () => {
                if (onSetupComplete) {
                  await onSetupComplete();
                } else {
                  await refreshShop();
                }
                navigate('/dashboard');
              }}
              className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              onClick={async () => {
                if (onSetupComplete) {
                  await onSetupComplete();
                } else {
                  await refreshShop();
                }
                navigate('/add-product');
              }}
              className="w-full h-12 bg-transparent text-[#bef715] hover:underline font-extrabold text-sm flex items-center justify-center cursor-pointer"
            >
              Add First Product
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
};
