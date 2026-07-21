// src/screens/SignUp.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Loader2, 
  Check, 
  ChevronRight,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Image,
  Upload,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Instagram,
  MessageCircle,
  Users,
  Search,
  HelpCircle,
  Compass,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';

interface SignUpProps {
  initialStep?: number;
}

export const SignUp: React.FC<SignUpProps> = ({ initialStep }) => {
  const navigate = useNavigate();
  const { session, profile, updateProfile } = useAuth();
  const { refreshShop } = useShopContext();

  // Active Screen Step (1 to 5)
  const [step, setStep] = useState<number>(() => {
    if (initialStep !== undefined) return initialStep;
    return 1;
  });

  // Setup form state
  const [formData, setFormData] = useState({
    shopName: '',
    businessType: 'Clothing Brand',
    email: '',
    password: '',
    username: '',
    whatsapp_number: ''
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auth form states & handling
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // File Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Shop Creation states
  const [creatingShop, setCreatingShop] = useState(false);
  const [creationProgress, setCreationProgress] = useState<string>('Creating account');

  // Input refs for autofocus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 2 && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 300);
    }
  }, [step]);

  // Handle going back
  const handleBack = () => {
    if (step > 1 && step < 5) {
      setStep(prev => prev - 1);
    }
  };

  // Handle going next with validation
  const handleNext = () => {
    if (step === 1) {
      if (!formData.businessType) {
        toast.error('Please select what you sell');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (session) {
        setStep(4); // Skip Account creation (Step 3) since already logged in
      } else {
        setStep(3); // Pricing to Account
      }
    } else if (step === 3) {
       setStep(4);
    } else if (step === 4) {
      if (!formData.shopName.trim() || !formData.username.trim() || !formData.whatsapp_number.trim()) {
        toast.error('All shop details, including a WhatsApp number, are required.');
        return;
      }
      setStep(5);
    }
  };

  // Get friendly mapped error messages for common authentication/Postgres/network errors
  const getFriendlyErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred.';
    const message = error.message || String(error);
    
    if (message.includes('already registered') || message.includes('already_registered') || message.includes('User already registered') || message.includes('anonymous_sign_up_prohibited')) {
      return 'Email already registered. Please use another email or log in.';
    }
    if (message.includes('weak_password') || message.includes('weak password') || message.includes('Signup requires a stronger password') || message.includes('Password should be') || message.includes('should be at least 8 characters') || message.includes('at least 8 characters')) {
      return 'Weak password. Please enter a stronger password of at least 8 characters.';
    }
    if (message.includes('invalid_email') || message.includes('invalid email') || message.includes('email address is invalid') || message.includes('Email format is invalid') || message.includes('Unable to validate email')) {
      return 'Invalid email address. Please check your spelling and domain format.';
    }
    if (message.includes('fetch') || message.includes('NetworkError') || message.includes('Network error') || message.includes('Failed to fetch') || message.includes('network')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    return message || 'An unexpected error occurred. Please try again.';
  };

  // Handle Supabase Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const emailVal = formData.email.trim();
    const passVal = formData.password;
    const confirmPassVal = confirmPassword;

    // 1. Basic empty check
    if (!emailVal || !passVal || !confirmPassVal) {
      const errText = 'All credential fields are required.';
      setAuthError(errText);
      toast.error(errText);
      return;
    }

    // 2. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      const errText = 'Invalid email address. Please enter a valid email format.';
      setAuthError(errText);
      toast.error(errText);
      return;
    }

    // 3. Password length check (must be at least 8 characters)
    if (passVal.length < 8) {
      const errText = 'Password must be at least 8 characters long.';
      setAuthError(errText);
      toast.error(errText);
      return;
    }

    // 4. Password match check
    if (passVal !== confirmPassVal) {
      const errText = 'Passwords do not match. Please verify your passwords.';
      setAuthError(errText);
      toast.error(errText);
      return;
    }

    setAuthLoading(true);

    try {
      // Create user account via official Supabase Auth API
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: emailVal,
        password: passVal,
        options: {
          data: {
            role: 'merchant',
            full_name: formData.shopName.trim() || emailVal.split('@')[0]
          }
        }
      });

      if (signUpErr) throw signUpErr;

      if (!data?.user) {
        throw new Error('Sign up failed to return user session or details');
      }

      // Check if profile exists
      const { data: existingProfile, error: profileCheckErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileCheckErr) {
        console.warn('Profile existence check warning:', profileCheckErr);
      }

      // Create new profile record if none exists
      if (!existingProfile) {
        // Build the profile insert payload based on our verified database schema
        const profileInsert: any = {
          id: data.user.id,
          full_name: formData.shopName.trim() || emailVal.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: profileErr } = await supabase
          .from('profiles')
          .insert(profileInsert);

        if (profileErr) {
          console.error('Error creating profile record:', profileErr);
          throw profileErr;
        }
      }

      toast.success('Account created successfully!');
      setStep(4); // Move to Shop Details (Step 4)
    } catch (err: any) {
      console.error('Sign up error:', err);
      const friendlyMsg = getFriendlyErrorMessage(err);
      setAuthError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Trigger shop creation process
  const triggerCreateShop = async () => {
    if (!formData.shopName.trim() || !formData.username.trim() || !formData.whatsapp_number.trim()) {
      toast.error('All shop details, including a WhatsApp number, are required.');
      return;
    }
    setStep(5); // Show loading screen
    setCreatingShop(true);
    try {
      setCreationProgress('Creating account');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication session not found. Please log in.');
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setCreationProgress('Creating storefront');

      const shopPayload = {
        owner_id: user.id,
        name: formData.shopName.trim(),
        slug: formData.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        whatsapp_number: formData.whatsapp_number.trim(),
        category: formData.businessType,
        description: 'New Shop',
        is_active: true,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error: insertError } = await supabase
        .from('shops')
        .insert(shopPayload);

      if (insertError) throw insertError;

      await new Promise(resolve => setTimeout(resolve, 800));
      setCreationProgress('Preparing dashboard');

      await refreshShop();
      await new Promise(resolve => setTimeout(resolve, 800));
      setCreationProgress('Generating shop link');

      toast.success('Your storefront is fully initialized!');
      handleFinishOnboarding();
    } catch (err: any) {
      console.error('Shop creation failure:', err);
      toast.error(err.message || 'Could not launch shop database record.');
      setStep(4); // Revert back
    } finally {
      setCreatingShop(false);
    }
  };

  // Complete onboarding
  const handleFinishOnboarding = async () => {
    try {
      toast.loading('Synchronizing secure configurations...');

      await refreshShop();
      toast.dismiss();
      toast.success('Welcome to ThreadZW! Launching your workspace...', { duration: 4000 });
      
      // Navigate to standard dashboard
      navigate('/dashboard');
      window.location.reload();
    } catch (err: any) {
      toast.dismiss();
      console.error('Finalization fail:', err);
      toast.error(err.message || 'Unable to finalize workspace configuration.');
    }
  };

  const progressPercent = Math.min(100, Math.round((Math.min(13, step) / 13) * 100));

  return (
    <div id="threadzw-onboarding-rebuild" className="min-h-screen bg-black text-white selection:bg-[#C6FF00] selection:text-black font-sans flex flex-col justify-between overflow-x-hidden relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      {/* Header Bar */}
      <header className="w-full z-10 px-6 py-5 max-w-5xl mx-auto flex items-center justify-between border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black uppercase tracking-tight leading-none italic font-sans text-white">
            THREAD<span className="text-[#C6FF00]">ZW</span>
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#C6FF00] font-bold bg-[#C6FF00]/10 px-2.5 py-1 rounded-full border border-[#C6FF00]/20">
            LAUNCH SYSTEM
          </span>
        </div>

        {/* Dynamic Progress Indicator */}
        {step < 6 && (
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-zinc-500 font-extrabold">
              {step} OF 13
            </span>
            <div className="w-24 h-1.5 rounded-full bg-zinc-900 overflow-hidden hidden sm:block">
              <div 
                className="h-full bg-[#C6FF00] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 max-w-2xl mx-auto w-full z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full flex flex-col justify-center"
          >

            {/* SCREEN 1: What do you sell? */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase text-[#C6FF00] tracking-widest font-extrabold">STEP 01 — CATEGORY</span>
                  <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">What do you want to sell on ThreadZW?</h2>
                  <p className="text-zinc-400 text-sm">We'll personalize your shop.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    'Clothing Brand',
                    'Thrift Shop',
                    'Drip Shop',
                    'Sneakers',
                    'Phones',
                    'Accessories',
                    'Beauty',
                    'Other'
                  ].map(opt => {
                    const isSelected = formData.businessType === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          updateField('businessType', opt);
                          setTimeout(handleNext, 250);
                        }}
                        className={`p-4 rounded-2xl text-left border text-xs transition-all flex items-center justify-between active:scale-[0.98] cursor-pointer ${
                          isSelected 
                            ? 'bg-[#C6FF00]/10 border-[#C6FF00] text-white' 
                            : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span className="font-extrabold uppercase tracking-wider">{opt}</span>
                        {isSelected && <Check size={16} className="text-[#C6FF00]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 2: Pricing */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center sm:text-left space-y-2">
                  <span className="text-xs font-mono uppercase text-[#C6FF00] tracking-widest font-extrabold">STEP 02 — PRICING</span>
                  <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">Start your free trial</h2>
                </div>

                <div className="p-8 rounded-[32px] border-2 border-[#C6FF00] bg-zinc-950/90 relative overflow-hidden space-y-6 shadow-[0_0_40px_rgba(198,255,0,0.1)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">🎁 7-Day Free Trial</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-mono font-black text-[#C6FF00]">$0</span>
                      <span className="text-xs text-zinc-500 block font-mono">TODAY</span>
                    </div>
                  </div>

                  <hr className="border-zinc-900" />
                  <p className="text-xs text-zinc-500 font-mono">After trial: $2.99/month</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">No payment required today. You can cancel before your trial ends.</p>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleNext}
                    className="w-full py-4.5 rounded-full bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(198,255,0,0.25)] cursor-pointer"
                  >
                    Start Free Trial
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 3: Account Creation */}
            {step === 3 && (
              <div id="threadzw-signup-secure-workspace" className="space-y-8 max-w-md mx-auto">
                <div className="space-y-3 text-center sm:text-left">
                  <span className="text-xs font-mono uppercase text-[#C6FF00] tracking-widest font-extrabold block">
                    STEP 03 — ACCOUNT
                  </span>
                  <h2 className="text-4xl font-black uppercase tracking-tight italic font-sans text-white">
                    Create Account
                  </h2>
                </div>

                <form onSubmit={handleSignUp} className="space-y-6">
                  {authError && (
                    <div className="p-4.5 rounded-3xl bg-red-500/10 border-2 border-red-500/25 flex items-start gap-3.5 text-red-400 text-xs font-mono leading-relaxed">
                      <AlertTriangle className="shrink-0 text-red-500 mt-0.5" size={18} />
                      <span>{authError}</span>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-650" size={20} />
                      <input 
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="takunda@yourbrand.co.zw"
                        className="w-full pl-13 pr-5 py-5 bg-zinc-950 border-2 border-zinc-850 rounded-3xl focus:outline-none focus:border-[#C6FF00] text-base font-bold transition-all text-white placeholder-zinc-700 shadow-[0_0_20px_rgba(0,0,0,0.6)]"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black block">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-650" size={20} />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-13 pr-14 py-5 bg-zinc-950 border-2 border-zinc-850 rounded-3xl focus:outline-none focus:border-[#C6FF00] text-base font-bold transition-all text-white placeholder-zinc-700 shadow-[0_0_20px_rgba(0,0,0,0.6)]"
                      />
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-650" size={20} />
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-13 pr-14 py-5 bg-zinc-950 border-2 border-zinc-850 rounded-3xl focus:outline-none focus:border-[#C6FF00] text-base font-bold transition-all text-white placeholder-zinc-700 shadow-[0_0_20px_rgba(0,0,0,0.6)]"
                      />
                    </div>
                  </div>

                  {/* Submit CTA Button */}
                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-5 rounded-full bg-[#C6FF00] disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-extrabold text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_30px_rgba(198,255,0,0.35)] active:scale-[0.98] cursor-pointer"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="animate-spin text-black" size={20} />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SCREEN 4: Shop Details */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase text-[#C6FF00] tracking-widest font-extrabold">STEP 04 — SHOP DETAILS</span>
                  <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">Create your shop</h2>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold block">Shop Name</label>
                    <input 
                      type="text"
                      value={formData.shopName}
                      onChange={(e) => {
                        updateField('shopName', e.target.value);
                        const slug = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').substring(0, 32);
                        updateField('username', slug);
                      }}
                      placeholder="Nulla Clothing"
                      className="w-full px-5 py-4 bg-zinc-950 border border-zinc-850 rounded-2xl focus:outline-none focus:border-[#C6FF00] text-base font-bold text-white transition-all placeholder:text-zinc-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold block">Storefront Username</label>
                    <div className="relative flex items-center bg-zinc-950 border border-zinc-850 rounded-2xl focus-within:border-[#C6FF00] transition-all">
                      <span className="pl-5 text-zinc-500 font-mono text-sm select-none">
                        threadzw.app/
                      </span>
                      <input 
                        type="text"
                        value={formData.username}
                        onChange={(e) => updateField('username', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="nulla-clothing"
                        className="flex-1 px-2 py-4 bg-transparent focus:outline-none text-sm font-mono font-bold text-[#C6FF00] placeholder:text-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold block">WhatsApp Number (For Orders)</label>
                    <div className="relative flex items-center bg-zinc-950 border border-zinc-850 rounded-2xl focus-within:border-[#C6FF00] transition-all">
                      <span className="pl-5 text-zinc-500 font-mono text-sm select-none">
                        +263 |
                      </span>
                      <input 
                        type="tel"
                        value={formData.whatsapp_number.replace(/^\+263/, '')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          updateField('whatsapp_number', val ? `+263${val}` : '');
                        }}
                        placeholder="77 123 4567"
                        className="flex-1 px-2 py-4 bg-transparent focus:outline-none text-sm font-mono font-bold text-white placeholder:text-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={triggerCreateShop}
                    disabled={!formData.shopName.trim() || !formData.username.trim() || !formData.whatsapp_number.trim()}
                    className="w-full py-4.5 rounded-full bg-[#C6FF00] disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Continue
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 5: Creating Shop */}
            {step === 5 && (
              <div className="space-y-8 text-center py-8">
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <Loader2 className="text-[#C6FF00] animate-spin w-24 h-24" />
                </div>
                <div className="space-y-4">
                  <span className="text-xs font-mono uppercase text-[#C6FF00] tracking-widest font-black bg-[#C6FF00]/10 px-3 py-1 rounded-full border border-[#C6FF00]/20">
                    SETTING UP
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-none italic text-white">Creating your workspace...</h2>
                  
                  {/* Visual Steps list */}
                  <div className="max-w-xs mx-auto text-left space-y-3 pt-6 font-mono text-xs text-zinc-500">
                    <div className="flex items-center gap-3">
                      {creationProgress === 'Creating account' ? (
                        <Loader2 className="animate-spin text-[#C6FF00]" size={14} />
                      ) : (
                        <Check size={14} className="text-[#C6FF00] stroke-[3]" />
                      )}
                      <span className={creationProgress === 'Creating account' ? 'text-white font-bold' : 'text-zinc-400'}>Creating account</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {creationProgress === 'Creating storefront' ? (
                        <Loader2 className="animate-spin text-[#C6FF00]" size={14} />
                      ) : (
                        ['Creating account', 'Creating storefront'].includes(creationProgress) ? (
                          <Check size={14} className="text-[#C6FF00] stroke-[3]" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-zinc-800" />
                        )
                      )}
                      <span className={creationProgress === 'Creating storefront' ? 'text-white font-bold' : 'text-zinc-400'}>Creating storefront</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {creationProgress === 'Preparing dashboard' ? (
                        <Loader2 className="animate-spin text-[#C6FF00]" size={14} />
                      ) : (
                        ['Preparing dashboard', 'Generating shop link'].includes(creationProgress) ? (
                            <Check size={14} className="text-[#C6FF00] stroke-[3]" />
                        ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-zinc-800" />
                        )
                      )}
                      <span className={creationProgress === 'Preparing dashboard' ? 'text-white font-bold' : 'text-zinc-400'}>Preparing dashboard</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Controls */}
      {step < 6 && (
        <footer className="w-full z-10 px-6 py-5 max-w-5xl mx-auto flex items-center justify-between border-t border-white/5 bg-black/80 backdrop-blur-md sticky bottom-0">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button 
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}
          </div>
          <span className="text-[10px] text-zinc-650 font-mono font-bold uppercase tracking-widest">
            ThreadZW Cloud Engine
          </span>
        </footer>
      )}
    </div>
  );
};
