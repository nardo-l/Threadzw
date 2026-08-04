// src/screens/SignUp.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Mail, 
  User, 
  MoreHorizontal, 
  Check, 
  Eye, 
  EyeOff, 
  Loader2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { FREE_TRIAL_DAYS } from '../lib/plans';

// Brand SVGs
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5 fill-current text-black" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.3c.69-.83 1.15-1.99.1-3.04-1.02.04-2.27.68-2.98 1.51-.62.72-1.16 1.89-1.01 3.02 1.14.09 2.31-.56 2.89-1.49z" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5 fill-current text-black" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.34V9.37a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.86-.8z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5 text-pink-600 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-5 h-5 text-[#25D366] fill-current" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 text-[#1877F2] fill-current" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface SignUpProps {
  initialStep?: number;
}

export const SignUp: React.FC<SignUpProps> = ({ initialStep }) => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { refreshShop } = useShopContext();

  // Active step (1 to 4)
  const [step, setStep] = useState<number>(() => {
    if (initialStep !== undefined) return Math.min(4, Math.max(1, initialStep));
    return 1;
  });
  const [viewMode, setViewMode] = useState<'flow' | 'overview'>('flow');

  // Form state
  const [shopName, setShopName] = useState('Plusher');
  const [referrer, setReferrer] = useState('TikTok');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+263');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Hearing options list
  const REFERRAL_OPTIONS = [
    { id: 'TikTok', label: 'TikTok', icon: <TikTokIcon /> },
    { id: 'Instagram', label: 'Instagram', icon: <InstagramIcon /> },
    { id: 'Friend', label: 'Friend', icon: <User className="w-5 h-5 text-black" /> },
    { id: 'WhatsApp', label: 'WhatsApp', icon: <WhatsAppIcon /> },
    { id: 'Google', label: 'Google', icon: <GoogleIcon /> },
    { id: 'Facebook', label: 'Facebook', icon: <FacebookIcon /> },
    { id: 'Other', label: 'Other', icon: <MoreHorizontal className="w-5 h-5 text-black" /> },
  ];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+263')) {
      if (val.startsWith('0')) {
        val = '+263' + val.slice(1);
      } else if (!val.startsWith('+')) {
        val = '+263' + val;
      } else {
        val = '+263';
      }
    }
    setPhone(val);
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const emailVal = email.trim();
    const phoneVal = phone.trim();
    const passVal = password.trim();

    if (!emailVal || !passVal) {
      toast.error('Please enter email and password');
      return;
    }

    if (!phoneVal || phoneVal === '+263') {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);

    try {
      let currentUser = session?.user || null;

      if (!currentUser) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: emailVal,
          password: passVal,
          options: {
            data: {
              full_name: shopName || 'Shop Owner',
              phone_number: phoneVal,
            }
          }
        });

        if (signUpErr) {
          if (signUpErr.message.includes('already registered')) {
            const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
              email: emailVal,
              password: passVal
            });
            if (signInErr) throw signInErr;
            currentUser = signInData.user;
          } else {
            throw signUpErr;
          }
        } else {
          currentUser = signUpData.user;
          // Ensure active session if auto-confirm is off or session wasn't set immediately
          if (!signUpData.session) {
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: emailVal,
              password: passVal
            });
            if (signInData?.user) {
              currentUser = signInData.user;
            }
          }
        }
      }

      if (!currentUser) throw new Error('Authentication failed');

      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('supabase_logged_in_user_id', currentUser.id);

      // Create shop record
      const slug = shopName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      const shopPayload = {
        owner_id: currentUser.id,
        name: shopName.trim() || 'My Shop',
        slug: slug || `shop-${Date.now().toString(36)}`,
        category: 'Streetwear & Fashion',
        description: `${shopName} official storefront on ThreadZW.`,
        whatsapp_number: phoneVal || '+263771234567',
        is_active: true,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
      };

      try {
        const { data: existingShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', currentUser.id)
          .maybeSingle();

        if (existingShop) {
          await supabase.from('shops').update(shopPayload).eq('id', existingShop.id);
        } else {
          await supabase.from('shops').insert(shopPayload);
        }
      } catch (dbErr) {
        console.warn('Shop table insert note:', dbErr);
      }

      try {
        await refreshShop();
      } catch (e) {
        console.warn('refreshShop error:', e);
      }

      toast.success('🎉 Welcome to ThreadZW!');
      navigate('/setup-success', { replace: true });

    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || 'Failed to sign up');
      toast.error(err?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  // Helper component for Progress bar
  const ProgressIndicator = ({ activeStep }: { activeStep: number }) => (
    <div className="flex items-center gap-1.5 w-32 sm:w-40">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
            s <= activeStep ? 'bg-[#C6FF00]' : 'bg-zinc-200'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased flex flex-col items-center justify-between selection:bg-[#C6FF00]">
      
      {/* MODE 1: INTERACTIVE STEP-BY-STEP FLOW */}
      {viewMode === 'flow' && (
        <div className="w-full max-w-md mx-auto min-h-screen p-6 sm:p-8 flex flex-col justify-between relative">
            
            <AnimatePresence mode="wait">
              
              {/* ========================================= */}
              {/* SCREEN 1: WELCOME */}
              {/* ========================================= */}
              {step === 1 && (
                <motion.div
                  key="screen1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Logo */}
                  <div className="pt-2">
                    <div className="space-y-0.5">
                      <h2 className="text-2xl font-black tracking-tight text-black">
                        THREAD<span className="text-[#C6FF00]">ZW</span>
                      </h2>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                        SELL MORE. STRESS LESS.
                      </p>
                    </div>
                  </div>

                  {/* Headlines */}
                  <div className="py-6 space-y-3">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-black tracking-tight leading-[1.08]">
                      Launch your<br />
                      clothing store<br />
                      in under<br />
                      <span className="text-[#C6FF00]">60 seconds.</span>
                    </h1>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed pt-1">
                      No coding. No website builders.<br />
                      Just your brand.
                    </p>
                  </div>

                  {/* Collage Graphic / Image representation */}
                  <div className="py-2 flex items-center justify-center relative">
                    <div className="relative w-full max-w-[280px] h-48 bg-zinc-50 rounded-2xl p-2 border border-zinc-100 flex items-center justify-center overflow-hidden">
                      {/* Black Blond Hoodie */}
                      <img
                        src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=300"
                        alt="Blond Hoodie"
                        className="w-28 h-36 object-cover rounded-xl shadow-lg -rotate-6 absolute left-2 top-4 border-2 border-white z-10"
                      />
                      {/* Cap */}
                      <img
                        src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=300"
                        alt="LA Cap"
                        className="w-24 h-24 object-cover rounded-xl shadow-md rotate-12 absolute right-2 top-2 border-2 border-white z-20"
                      />
                      {/* Champion Olive Hoodie */}
                      <img
                        src="https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=300"
                        alt="Olive Hoodie"
                        className="w-28 h-32 object-cover rounded-xl shadow-lg rotate-3 absolute right-6 bottom-2 border-2 border-white z-0"
                      />
                    </div>
                  </div>

                  {/* Bottom Button */}
                  <div className="pt-6 space-y-3 text-center">
                    <button
                      onClick={() => setStep(2)}
                      className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                    >
                      <span className="text-black font-extrabold">Get Started</span>
                      <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                    </button>
                    <p className="text-xs text-zinc-400 font-medium">
                      Join thousands of brands in Zimbabwe
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 2: ENTER SHOP NAME */}
              {/* ========================================= */}
              {step === 2 && (
                <motion.div
                  key="screen2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-4">
                    <button
                      onClick={() => setStep(1)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={1} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-6 pt-4">
                    <div className="space-y-2">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
                        What’s your<br />shop called?
                      </h1>
                      <p className="text-xs sm:text-sm text-zinc-500 font-normal">
                        This will be the name of your store on ThreadZW.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-black uppercase tracking-wider block">
                        Shop name
                      </label>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Plusher, Nardo, Drip Cartel"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-4 text-sm font-semibold text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-all"
                        autoFocus
                      />
                      <p className="text-xs text-zinc-400 font-medium pt-1">
                        You can change this later.
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-6">
                    <button
                      onClick={() => setStep(3)}
                      className="w-full bg-black hover:bg-zinc-800 text-white font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 3: WHERE DID YOU HEAR ABOUT US? */}
              {/* ========================================= */}
              {step === 3 && (
                <motion.div
                  key="screen3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-4">
                    <button
                      onClick={() => setStep(2)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={2} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-4 pt-2">
                    <div className="space-y-1">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
                        Where did you<br />hear about us?
                      </h1>
                      <p className="text-xs text-zinc-500 font-normal">
                        This helps us improve and grow the ThreadZW community.
                      </p>
                    </div>

                    {/* Radio Options List */}
                    <div className="space-y-2 pt-1 max-h-[340px] overflow-y-auto pr-1">
                      {REFERRAL_OPTIONS.map((opt) => {
                        const isSelected = referrer === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setReferrer(opt.id)}
                            className={`w-full p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-zinc-50 border-black'
                                : 'bg-white border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {opt.icon}
                              <span className="text-sm font-semibold text-black">{opt.label}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-black bg-black text-white' : 'border-zinc-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-4">
                    <button
                      onClick={() => setStep(4)}
                      className="w-full bg-black hover:bg-zinc-800 text-white font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 4: SIGN UP */}
              {/* ========================================= */}
              {step === 4 && (
                <motion.div
                  key="screen4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-4">
                    <button
                      onClick={() => setStep(3)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={3} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-6 pt-2">
                    <div className="space-y-2">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
                        Let’s create<br />your account
                      </h1>
                      <p className="text-xs sm:text-sm text-zinc-500 font-normal">
                        Create an account to manage your store and grow your brand.
                      </p>
                    </div>

                    {/* Direct Sign Up Form (Email, Phone with +263 preset, Password) */}
                    <form onSubmit={handleSignUp} className="space-y-3 pt-1">
                      {authError && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
                          {authError}
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-bold text-zinc-600 mb-1 block">Email address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-3 text-sm text-black focus:outline-none focus:border-black font-medium"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-600 mb-1 block">WhatsApp phone number</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder="+263 77 123 4567"
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-3 text-sm text-black focus:outline-none focus:border-black font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-600 mb-1 block">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white border border-zinc-200 rounded-xl pl-3.5 pr-10 py-3 text-sm text-black focus:outline-none focus:border-black"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black hover:bg-zinc-800 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2 shadow-sm"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>Create Account & Start Trial</span>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Terms footer */}
                  <div className="pt-4 text-center">
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                      By continuing, you agree to our<br />
                      <span className="font-bold text-zinc-700 underline cursor-pointer">Terms of Service</span> and{' '}
                      <span className="font-bold text-zinc-700 underline cursor-pointer">Privacy Policy</span>.
                    </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

        </div>
      )}

      {/* MODE 2: OVERVIEW OF ALL 4 MOCKUP SCREENS SIDE BY SIDE */}
      {viewMode === 'overview' && (
        <div className="w-full max-w-7xl px-4 py-8 mx-auto flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start justify-center">
            
            {/* =================================================== */}
            {/* CARD 1: WELCOME */}
            {/* =================================================== */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-black text-black">
                    THREAD<span className="text-[#C6FF00]">ZW</span>
                  </h2>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">
                    SELL MORE. STRESS LESS.
                  </p>
                </div>

                <div className="space-y-2 py-4">
                  <h1 className="text-3xl font-extrabold text-black tracking-tight leading-[1.08]">
                    Launch your<br />
                    clothing store<br />
                    in under<br />
                    <span className="text-[#C6FF00]">60 seconds.</span>
                  </h1>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    No coding. No website builders.<br />
                    Just your brand.
                  </p>
                </div>

                <div className="relative w-full h-36 bg-zinc-50 rounded-2xl p-2 border border-zinc-100 flex items-center justify-center overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=300"
                    alt="Blond Hoodie"
                    className="w-20 h-28 object-cover rounded-xl shadow-lg -rotate-6 absolute left-2 top-2 border-2 border-white z-10"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=300"
                    alt="LA Cap"
                    className="w-18 h-18 object-cover rounded-xl shadow-md rotate-12 absolute right-2 top-1 border-2 border-white z-20"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=300"
                    alt="Olive Hoodie"
                    className="w-20 h-24 object-cover rounded-xl shadow-lg rotate-3 absolute right-4 bottom-1 border-2 border-white z-0"
                  />
                </div>

                <div className="pt-4 space-y-2 text-center">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(1); }}
                    className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-sm py-3.5 px-5 rounded-2xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Join thousands of brands in Zimbabwe
                  </p>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">1 Welcome</span>
              </div>
            </div>

            {/* =================================================== */}
            {/* CARD 2: ENTER SHOP NAME */}
            {/* =================================================== */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={1} />
                </div>

                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight leading-tight">
                      What’s your<br />shop called?
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      This will be the name of your store on ThreadZW.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[11px] font-bold text-black uppercase tracking-wider block">
                      Shop name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="e.g. Plusher, Nardo, Drip Cartel"
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-3.5 py-3 text-xs font-medium text-zinc-400"
                    />
                    <p className="text-[11px] text-zinc-400 font-medium">
                      You can change this later.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(2); }}
                    className="w-full bg-black text-white font-extrabold text-sm py-3.5 px-5 rounded-2xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">2 Enter Shop Name</span>
              </div>
            </div>

            {/* =================================================== */}
            {/* CARD 3: WHERE DID YOU HEAR ABOUT US? */}
            {/* =================================================== */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={2} />
                </div>

                <div className="space-y-3 py-1">
                  <div className="space-y-0.5">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Where did you<br />hear about us?
                    </h1>
                    <p className="text-[11px] text-zinc-500 font-normal">
                      This helps us improve and grow the ThreadZW community.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {REFERRAL_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        className="w-full p-2.5 rounded-xl border border-zinc-200 flex items-center justify-between text-xs font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          <span className="text-black">{opt.label}</span>
                        </div>
                        <div className="w-4 h-4 rounded-full border border-zinc-300" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(3); }}
                    className="w-full bg-black text-white font-extrabold text-sm py-3.5 px-5 rounded-2xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">3 Where did you hear about us?</span>
              </div>
            </div>

            {/* =================================================== */}
            {/* CARD 4: SIGN UP */}
            {/* =================================================== */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={3} />
                </div>

                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight leading-tight">
                      Let’s create<br />your account
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      Create an account to manage your store and grow your brand.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 mb-0.5 block">Email address</label>
                      <input
                        type="email"
                        readOnly
                        value="owner@plusher.co.zw"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 mb-0.5 block">WhatsApp phone number</label>
                      <input
                        type="tel"
                        readOnly
                        value="+263 77 123 4567"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 mb-0.5 block">Password</label>
                      <input
                        type="password"
                        readOnly
                        value="••••••••"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black"
                      />
                    </div>

                    <button
                      onClick={() => { setViewMode('flow'); setStep(4); }}
                      className="w-full bg-black text-white font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center cursor-pointer mt-1"
                    >
                      <span>Create Account & Start Trial</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                    By continuing, you agree to our<br />
                    <span className="font-bold text-zinc-700 underline">Terms of Service</span> and{' '}
                    <span className="font-bold text-zinc-700 underline">Privacy Policy</span>.
                  </p>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">4 Sign Up</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
