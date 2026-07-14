// src/screens/SignUp.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Loader2, 
  Check, 
  TrendingUp, 
  Rocket, 
  ShieldCheck, 
  ChevronRight,
  ShoppingBag,
  MessageSquare,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  AlertTriangle,
  Globe,
  Search,
  Eye as EyeIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  
  // localStep:
  // 0 = Screen 2: Introduction
  // 1 = Screen 3: Shop Name
  // 2 = Screen 4: Reality Check 1 (Phase 1)
  // 3 = Screen 5: Reality Check 2
  // 4 = Screen 6: Reality Check 3
  // 5 = Screen 7: Reality Check 4
  // 6 = Screen 8: Wake Up Screen (Phase 2)
  // 7 = Screen 9: Solution 1 (Phase 3)
  // 8 = Screen 10: Solution 2
  // 9 = Screen 11: Create Account
  const [localStep, setLocalStep] = useState(0);

  // Onboarding answers / shop data
  const [shopName, setShopName] = useState('');
  const [realityCheck1, setRealityCheck1] = useState('');
  const [realityCheck2, setRealityCheck2] = useState('');
  const [realityCheck3, setRealityCheck3] = useState('');
  const [realityCheck4, setRealityCheck4] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Form states (Step 9 - Create Account)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  
  const isSigningUpRef = useRef(false);

  // Autofocus input ref for Screen 3
  const shopNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localStep === 1 && shopNameInputRef.current) {
      setTimeout(() => {
        shopNameInputRef.current?.focus();
      }, 300);
    }
  }, [localStep]);

  // Keep shop name synchronized in local storage for SetupShop
  const handleShopNameChange = (val: string) => {
    setShopName(val);
    localStorage.setItem('threadzw_onboarding_shop_name', val);
  };

  // Password requirement validation
  const hasMinLength = password.length >= 8;
  const hasNumOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>_+\-\[\]\\\/]/.test(password);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!hasMinLength || !hasNumOrSymbol) {
      toast.error('Please meet all password requirements');
      return;
    }

    setLoading(true);
    setSignUpError(null);
    isSigningUpRef.current = true;

    try {
      console.log("SIGNUP FLOW: Starting sign up process...");
      
      const redirectUrl =
        window.location.hostname === 'localhost'
          ? 'http://localhost:3000/auth/confirm'
          : 'https://threadzw.vercel.app/auth/confirm';

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            display_name: fullName.trim(),
          },
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) {
        isSigningUpRef.current = false;
        throw error;
      }

      console.log("SIGNUP FLOW: signUp completed successfully. Redirecting to check-email...");
      isSigningUpRef.current = false;
      sessionStorage.setItem('pending_verification_email', email.trim().toLowerCase());
      toast.success('Account created. Verification email sent.');
      navigate('/check-email');
    } catch (err: any) {
      isSigningUpRef.current = false;
      console.error("SIGNUP FLOW: Error object caught during sign up:", err);
      const errorMessage = err?.message || 'Failed to create account. Please try again.';
      setSignUpError(errorMessage);
      toast.error(`Sign up failed\n\n${errorMessage}`);
      setLoading(false);
    }
  };

  // Solution cards carousel
  const solutionCards = [
    {
      icon: '🌐',
      title: 'Always Online',
      body: 'Customers browse your items 24/7 while you sleep. Your shop never closes.'
    },
    {
      icon: '💬',
      title: 'WhatsApp Ordering',
      body: 'Say goodbye to price-in-DM questions. Get structured orders directly in WhatsApp.'
    },
    {
      icon: '📊',
      title: 'Visitor Insights',
      body: 'Track exactly who views your shop, what gets clicked, and when sales peak.'
    },
    {
      icon: '⚡',
      title: 'Zero Tech Hassle',
      body: 'No website building, hosting, or domains needed. Up and running in 60 seconds.'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-y-auto z-[45] selection:bg-[#bef715] selection:text-black">
      
      <AnimatePresence mode="wait">
        
        {localStep === 0 && (
          /* SCREEN 2 — INTRODUCTION */
          <motion.div 
            key="step-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Minimal Top Header */}
            <div className="w-full flex justify-between items-center py-4">
              <span className="text-xl font-black tracking-tighter text-[#bef715]">
                ThreadZW<span className="text-white">.</span>
              </span>
              <button
                type="button"
                onClick={() => setLocalStep(14)}
                className="text-xs font-black tracking-widest text-zinc-500 hover:text-white uppercase transition-colors"
              >
                Skip
              </button>
            </div>

            {/* Content & Illustration */}
            <div className="w-full flex-1 flex flex-col items-center justify-center space-y-8 my-4 text-center">
              {/* Animated waving hand emoji */}
              <motion.div
                animate={{ rotate: [0, 14, -10, 14, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
                className="text-7xl select-none"
              >
                👋
              </motion.div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                  Hey. Quick question.
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-semibold">
                  Be honest. It'll take 30 seconds.
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(1)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
              >
                <span>LET'S GO</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 1 && (
          /* SCREEN 3 — SHOP NAME */
          <motion.div 
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Segmented top indicator bar */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(0)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-zinc-500 uppercase">narrative setup</span>
              </div>
              <div className="w-full grid grid-cols-8 gap-1.5 mt-2">
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-[2px] rounded-full bg-zinc-900" />
                ))}
              </div>
            </div>

            {/* Input & Question */}
            <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4 text-left">
              <span className="text-xs font-black tracking-wider text-[#bef715] uppercase font-mono">
                the start of your brand
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                What's your shop called?
              </h1>
              
              <div className="space-y-3 pt-2">
                <input
                  ref={shopNameInputRef}
                  type="text"
                  required
                  autoFocus
                  value={shopName}
                  onChange={(e) => handleShopNameChange(e.target.value)}
                  placeholder="e.g. Byo Streetwear"
                  className="w-full h-16 bg-zinc-950 border-2 border-zinc-900 rounded-2xl px-5 text-white text-lg font-black focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800"
                />
                <p className="text-zinc-500 text-xs font-semibold pl-1">
                  Example: <span className="text-zinc-400 font-bold">Byo Streetwear</span> or <span className="text-zinc-400 font-bold">Harare Fits</span>. You can change this later!
                </p>
              </div>
            </div>

            {/* Next Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                disabled={!shopName.trim()}
                onClick={() => setLocalStep(2)}
                className={`w-full h-14 font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all ${
                  shopName.trim()
                    ? 'bg-[#bef715] text-black hover:opacity-95 shadow-lg shadow-[#bef715]/10 cursor-pointer active:scale-[0.98]'
                    : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 2 && (
          /* SCREEN 4 — REALITY CHECK 1 */
          <motion.div 
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-orange-500 uppercase tracking-widest">phase 1: reality check</span>
              </div>
              <div className="w-full grid grid-cols-8 gap-1.5 mt-2">
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[2px] rounded-full bg-zinc-900" />
                ))}
              </div>
            </div>

            {/* Question and Option list */}
            <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4 text-left">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest block">
                  PHASE 1: REALITY CHECK
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug">
                  How do customers find your products right now, WW?
                </h1>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  {
                    id: 'whatsapp',
                    title: 'WhatsApp messages',
                    desc: 'They DM me for prices and photos.'
                  },
                  {
                    id: 'social',
                    title: 'Instagram / TikTok',
                    desc: 'They find me on social media.'
                  },
                  {
                    id: 'walkin',
                    title: 'Walk-in / word of mouth',
                    desc: 'People know my physical location.'
                  },
                  {
                    id: 'none',
                    title: "I don't have online presence",
                    desc: 'Currently no way to find me online.'
                  }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setRealityCheck1(opt.id)}
                    className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      realityCheck1 === opt.id
                        ? 'border-[#bef715] bg-[#bef715]/5'
                        : 'border-zinc-900 hover:border-zinc-800 bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white uppercase">{opt.title}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        realityCheck1 === opt.id ? 'border-[#bef715] bg-[#bef715]' : 'border-zinc-800'
                      }`}>
                        {realityCheck1 === opt.id && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                    </div>
                    <p className="text-zinc-500 text-xs font-semibold mt-1">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                disabled={!realityCheck1}
                onClick={() => setLocalStep(3)}
                className={`w-full h-14 font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all ${
                  realityCheck1
                    ? 'bg-[#bef715] text-black hover:opacity-95 shadow-lg shadow-[#bef715]/10 cursor-pointer active:scale-[0.98]'
                    : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 3 && (
          /* SCREEN 5 — REALITY CHECK 2 */
          <motion.div 
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(2)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-orange-500 uppercase tracking-widest">phase 1: reality check</span>
              </div>
              <div className="w-full grid grid-cols-8 gap-1.5 mt-2">
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-[2px] rounded-full bg-zinc-900" />
                ))}
              </div>
            </div>

            {/* Question and Option list */}
            <div className="w-full flex-1 flex flex-col justify-center space-y-8 my-4 text-left">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest block">
                  PHASE 1: REALITY CHECK
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug">
                  Do customers message you asking "how much?" all day?
                </h1>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setRealityCheck2('yes')}
                  className={`p-6 rounded-2xl border-2 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                    realityCheck2 === 'yes'
                      ? 'border-[#bef715] bg-[#bef715]/5 scale-[1.02]'
                      : 'border-zinc-900 hover:border-zinc-800 bg-zinc-950'
                  }`}
                >
                  <span className="text-4xl">😩</span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase">Yes, constantly</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-normal">It drains all my time and energy.</p>
                  </div>
                </div>

                <div
                  onClick={() => setRealityCheck2('no')}
                  className={`p-6 rounded-2xl border-2 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                    realityCheck2 === 'no'
                      ? 'border-[#bef715] bg-[#bef715]/5 scale-[1.02]'
                      : 'border-zinc-900 hover:border-zinc-800 bg-zinc-950'
                  }`}
                >
                  <span className="text-4xl">🙂</span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase">Not really</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-normal">My customers rarely ask this.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next/Skip Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(4)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
              >
                <span>{realityCheck2 ? 'Continue' : 'Skip'}</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 4 && (
          /* SCREEN 6 — REALITY CHECK 3 */
          <motion.div 
            key="step-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(3)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-orange-500 uppercase tracking-widest">phase 1: reality check</span>
              </div>
              <div className="w-full grid grid-cols-8 gap-1.5 mt-2">
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[2px] rounded-full bg-zinc-900" />
                ))}
              </div>
            </div>

            {/* Question and Option list */}
            <div className="w-full flex-1 flex flex-col justify-center space-y-8 my-4 text-left">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest block">
                  PHASE 1: REALITY CHECK
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug">
                  Can customers browse your products to buy when you are offline?
                </h1>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setRealityCheck3('yes')}
                  className={`p-6 rounded-2xl border-2 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                    realityCheck3 === 'yes'
                      ? 'border-[#bef715] bg-[#bef715]/5 scale-[1.02]'
                      : 'border-zinc-900 hover:border-zinc-800 bg-zinc-950'
                  }`}
                >
                  <span className="text-4xl">✅</span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase">Yes, they can</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-normal">My store has 24/7 client browsing.</p>
                  </div>
                </div>

                <div
                  onClick={() => setRealityCheck3('no')}
                  className={`p-6 rounded-2xl border-2 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                    realityCheck3 === 'no'
                      ? 'border-[#bef715] bg-[#bef715]/5 scale-[1.02]'
                      : 'border-zinc-900 hover:border-zinc-800 bg-zinc-950'
                  }`}
                >
                  <span className="text-4xl">❌</span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase">No, they can't</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-normal">They must wait until I am awake & online.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(5)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
              >
                <span>{realityCheck3 ? 'Continue' : 'Skip'}</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 5 && (
          /* SCREEN 7 — REALITY CHECK 4 */
          <motion.div 
            key="step-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(4)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-orange-500 uppercase tracking-widest">phase 1: reality check</span>
              </div>
              <div className="w-full grid grid-cols-8 gap-1.5 mt-2">
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[2px] rounded-full bg-zinc-900" />
                ))}
              </div>
            </div>

            {/* Question and Option list */}
            <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4 text-left">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest block">
                  PHASE 1: REALITY CHECK
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug">
                  What is your biggest daily challenge in running your retail brand?
                </h1>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  {
                    id: 'exist',
                    icon: '👁️',
                    title: 'No one knows I exist online',
                    desc: 'I need more traffic and reach'
                  },
                  {
                    id: 'sales',
                    icon: '📉',
                    title: 'I need more customers',
                    desc: 'Weekly sales are inconsistent'
                  },
                  {
                    id: 'chaos',
                    icon: '📦',
                    title: 'Managing orders is pure chaos',
                    desc: 'Too many fragmented WhatsApp messages'
                  },
                  {
                    id: 'pay',
                    icon: '😩',
                    title: 'Customers never commit to pay',
                    desc: 'They ask for prices and size then disappear'
                  }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setRealityCheck4(opt.id)}
                    className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      realityCheck4 === opt.id
                        ? 'border-[#bef715] bg-[#bef715]/5'
                        : 'border-zinc-900 hover:border-zinc-800 bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white uppercase">{opt.title}</h4>
                        <p className="text-zinc-500 text-[11px] font-semibold mt-0.5 leading-snug">{opt.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        realityCheck4 === opt.id ? 'border-[#bef715] bg-[#bef715]' : 'border-zinc-800'
                      }`}>
                        {realityCheck4 === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skip / Continue Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(6)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
              >
                <span>{realityCheck4 ? 'Continue' : 'Skip'}</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 6 && (
          /* SCREEN 8 — WAKE UP SCREEN */
          <motion.div 
            key="step-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(5)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-orange-500 uppercase tracking-widest">phase 2: wake up</span>
              </div>
              <div className="w-full grid grid-cols-8 gap-1.5 mt-2">
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-[2px] rounded-full bg-zinc-900" />
                ))}
              </div>
            </div>

            {/* Main Narration Body */}
            <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4 text-left">
              <span className="text-xs font-black tracking-widest text-orange-500 uppercase font-mono">
                PHASE 2: WAKE UP
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-orange-500 tracking-tight leading-[1.1] uppercase">
                HERE'S WHAT'S<br />ACTUALLY HAPPENING:
              </h1>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-orange-950/40 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-950/30 border border-orange-900/50 flex items-center justify-center text-orange-500 text-xs shrink-0 mt-0.5 font-bold">1</div>
                  <p className="text-zinc-300 text-sm leading-relaxed font-semibold">
                    Every unpriced DM is a sale you almost missed. Customers hate having to message for simple prices and sizes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/40 border border-orange-950/40 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-950/30 border border-orange-900/50 flex items-center justify-center text-orange-500 text-xs shrink-0 mt-0.5 font-bold">2</div>
                  <p className="text-zinc-300 text-sm leading-relaxed font-semibold">
                    Your competitors are already online. While you manually coordinate orders, they are automating their business.
                  </p>
                </div>
              </div>

              {/* Orange Divider */}
              <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent my-2" />

              <h2 className="text-2xl sm:text-3xl font-black text-[#bef715] uppercase tracking-tight text-center w-full pt-2">
                Let's fix this together.
              </h2>
            </div>

            {/* Action button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(7)}
                className="w-full h-14 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-orange-500/10 uppercase tracking-wider"
              >
                <span>Show Me How</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 7 && (
          /* SCREEN 9 — SOLUTION 1 */
          <motion.div 
            key="step-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(6)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">phase 3: solution</span>
              </div>
              <div className="w-full grid grid-cols-8 gap-1.5 mt-2">
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-[#bef715]" />
                <div className="h-[2px] rounded-full bg-zinc-900" />
              </div>
            </div>

            {/* Feature Cards Carousel */}
            <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4 text-left">
              <div className="space-y-1.5">
                <span className="text-xs font-black tracking-widest text-[#bef715] uppercase font-mono">
                  PHASE 3: SOLUTION
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug">
                  Here's what your ThreadZW catalog provides.
                </h1>
              </div>

              {/* Swipeable Carousel Card */}
              <div className="relative w-full h-56 bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#bef715]/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl select-none">{solutionCards[carouselIndex].icon}</span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      {solutionCards[carouselIndex].title}
                    </h3>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed font-semibold">
                    {solutionCards[carouselIndex].body}
                  </p>
                </div>

                {/* Left/Right click controls & dots */}
                <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
                  <div className="flex gap-1">
                    {solutionCards.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === carouselIndex ? 'w-5 bg-[#bef715]' : 'w-1.5 bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={carouselIndex === 0}
                      onClick={() => setCarouselIndex(p => p - 1)}
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border border-zinc-800 ${
                        carouselIndex === 0 ? 'text-zinc-700 border-zinc-950' : 'text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={carouselIndex === solutionCards.length - 1}
                      onClick={() => setCarouselIndex(p => p + 1)}
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border border-zinc-800 ${
                        carouselIndex === solutionCards.length - 1 ? 'text-zinc-700 border-zinc-950' : 'text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(8)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
              >
                <span>Continue</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 8 && (
          /* SCREEN 10 — SOLUTION 2 */
          <motion.div 
            key="step-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(7)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">phase 3: solution</span>
              </div>
              <div className="w-full grid grid-cols-8 gap-1.5 mt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[2px] rounded-full bg-[#bef715]" />
                ))}
              </div>
            </div>

            {/* Invisible store vs Visible stores visual mockup */}
            <div className="w-full flex-1 flex flex-col justify-center space-y-6 my-4 text-left">
              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase leading-snug">
                  Other shops around Zimbabwe are getting searched on Google.
                </h1>
                <p className="text-red-500 font-bold text-sm uppercase">You are invisible.</p>
              </div>

              {/* Status store list mock */}
              <div className="space-y-2.5">
                {[
                  { name: 'HarareFits', status: 'ONLINE', isLive: true },
                  { name: 'ByoDrip', status: 'ONLINE', isLive: true },
                  { name: 'ZimThrift', status: 'ONLINE', isLive: true },
                ].map((st, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-900 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">{st.name}</span>
                    <span className="text-[9px] font-mono font-bold text-[#bef715] bg-[#bef715]/10 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#bef715] rounded-full animate-pulse" />
                      {st.status}
                    </span>
                  </div>
                ))}

                {/* Pulsing Offline Card */}
                <div className="p-4 rounded-xl bg-red-950/5 border-2 border-dashed border-red-900/40 flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.02)] animate-pulse">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    {shopName.trim() || 'Your Store'}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-red-500 bg-red-500/10 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border border-red-500/20">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    OFFLINE / UNSEARCHABLE
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(9)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
              >
                <span>Continue</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 9 && (
          /* SCREEN 11 — YOUR SHOP IS ALWAYS OPEN */
          <motion.div 
            key="step-9"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(8)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Always Open</span>
              </div>
              <div className="w-full h-[2px] rounded-full bg-[#bef715] mt-2" />
            </div>

            {/* Main Visual: Phone Mockup */}
            <div className="w-full flex-1 flex flex-col justify-center items-center my-4 space-y-6">
              {/* Outer Phone Mockup */}
              <div className="relative w-48 h-80 rounded-[32px] border-[4px] border-zinc-800 bg-zinc-950 p-3 shadow-2xl flex flex-col justify-between overflow-hidden">
                {/* Speaker pill */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-2.5 bg-zinc-800 rounded-full" />
                
                {/* Content: Mock Storefront */}
                <div className="flex-1 flex flex-col justify-between pt-4 pb-1">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black tracking-tighter text-[#bef715]">ThreadZW.</span>
                      <span className="text-[6px] px-1 py-0.5 rounded bg-[#bef715]/10 text-[#bef715] font-bold">● OPEN 24/7</span>
                    </div>
                    {/* Mock Banner */}
                    <div className="h-12 rounded-lg bg-zinc-900 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Drip Collection</span>
                    </div>
                    {/* Mock Avatar */}
                    <div className="w-7 h-7 rounded-full bg-zinc-900 border border-[#bef715] -mt-5 ml-2 flex items-center justify-center text-[8px] font-black text-[#bef715]">
                      {shopName ? shopName.slice(0, 2).toUpperCase() : 'ZW'}
                    </div>
                    {/* Mock Listing */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-12 bg-zinc-850 rounded" />
                      <div className="h-1 w-16 bg-zinc-900 rounded" />
                    </div>
                  </div>

                  {/* Sleeping customer text indicator */}
                  <div className="p-1.5 rounded-xl bg-[#bef715]/5 border border-[#bef715]/10 text-center space-y-0.5">
                    <span className="text-sm block">😴</span>
                    <p className="text-[7px] text-zinc-400 font-medium">Customer bought while you were sleeping!</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-center px-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug">
                  Your shop stays open even while you sleep.
                </h1>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-semibold">
                  Customers can browse your collections, view prices, discover new arrivals and contact you anytime—even when you're away from your phone.
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(10)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
              >
                <span>Continue</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 10 && (
          /* SCREEN 12 — YOUR PERSONAL SHOP LINK */
          <motion.div 
            key="step-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(9)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Shop Link</span>
              </div>
              <div className="w-full h-[2px] rounded-full bg-[#bef715] mt-2" />
            </div>

            {/* Main Content */}
            <div className="w-full flex-1 flex flex-col justify-center items-center my-4 space-y-8 text-center">
              
              {/* Premium Link Card with Share Icon */}
              <div className="relative w-full max-w-[340px] p-6 rounded-3xl bg-zinc-950 border-2 border-zinc-900 shadow-2xl space-y-4 overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#bef715]/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-[#bef715]/10 flex items-center justify-center text-[#bef715]">
                    <span className="text-lg">🔗</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-[#bef715] cursor-pointer transition-colors border border-zinc-800">
                    <span className="text-xs">📤</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">YOUR PERSONAL URL</span>
                  <div className="p-3 bg-zinc-900/50 border border-zinc-900 rounded-xl flex items-center justify-between">
                    <span className="text-sm font-bold text-white select-all">
                      threadzw.com/
                      <span className="text-[#bef715]">
                        {shopName ? shopName.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : 'yourfits'}
                      </span>
                    </span>
                    <span className="text-[10px] bg-zinc-950 text-zinc-400 font-bold px-2 py-1 rounded">COPY</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-center px-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug">
                  Share one link everywhere.
                </h1>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-semibold">
                  Put your shop link on Instagram, TikTok, WhatsApp Status, Facebook and anywhere customers discover your brand.
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(11)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
              >
                <span>Continue</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 11 && (
          /* SCREEN 13 — ANALYTICS */
          <motion.div 
            key="step-11"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(10)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Analytics</span>
              </div>
              <div className="w-full h-[2px] rounded-full bg-[#bef715] mt-2" />
            </div>

            {/* Main Visual: Dashboard Mockup */}
            <div className="w-full flex-1 flex flex-col justify-center items-center my-4 space-y-6 text-center">
              
              <div className="w-full max-w-[340px] grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 text-left space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">VIEWS</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">1,482</span>
                    <span className="text-[9px] font-bold text-[#bef715]">+14%</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 text-left space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">VISITORS</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">840</span>
                    <span className="text-[9px] font-bold text-[#bef715]">+22%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 text-left space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">PRODUCT CLICKS</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">395</span>
                    <span className="text-[9px] font-bold text-[#bef715]">+8%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#bef715]/5 border-2 border-[#bef715]/20 text-left space-y-1">
                  <span className="text-[10px] font-mono text-[#bef715] font-black uppercase tracking-widest">ORDERS</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#bef715]">112</span>
                    <span className="text-[9px] font-bold text-[#bef715]">+35%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-center px-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug">
                  Know what your customers love.
                </h1>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-semibold">
                  Track visits, discover your best-selling products and make smarter business decisions.
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(12)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
              >
                <span>Continue</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 12 && (
          /* SCREEN 14 — READY TO BUILD */
          <motion.div 
            key="step-12"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(11)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Ready</span>
              </div>
              <div className="w-full h-[2px] rounded-full bg-[#bef715] mt-2" />
            </div>

            {/* Main Visual: Storefront Preview */}
            <div className="w-full flex-1 flex flex-col justify-center items-center my-4 space-y-6 text-center">
              
              <div className="w-full max-w-[340px] p-5 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-2xl relative overflow-hidden space-y-4">
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-[#bef715]/30" />
                
                {/* Store Header Mock */}
                <div className="flex justify-between items-center">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">STOREFRONT</span>
                    <h3 className="text-base font-black text-white uppercase">{shopName || 'Your Store'}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#bef715]/10 flex items-center justify-center text-[#bef715]">
                    <span className="text-xs">🛍️</span>
                  </div>
                </div>

                {/* Abstract Preview blocks */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-zinc-900 rounded-xl space-y-2">
                    <div className="h-10 bg-zinc-950 rounded" />
                    <div className="h-2 w-10 bg-zinc-800 rounded" />
                  </div>
                  <div className="p-2 bg-zinc-900 rounded-xl space-y-2">
                    <div className="h-10 bg-zinc-950 rounded" />
                    <div className="h-2 w-12 bg-zinc-800 rounded" />
                  </div>
                  <div className="p-2 bg-zinc-900 rounded-xl space-y-2">
                    <div className="h-10 bg-zinc-950 rounded" />
                    <div className="h-2 w-8 bg-zinc-800 rounded" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-center px-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug">
                  Everything is ready.
                </h1>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-semibold">
                  Now let's build your own online clothing shop.
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(13)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
              >
                <span>Let's Build &rarr;</span>
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 13 && (
          /* SCREEN 15 — ACCOUNT CREATION INTRODUCTION */
          <motion.div 
            key="step-13"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
          >
            {/* Header */}
            <div className="w-full">
              <div className="flex justify-between items-center py-2">
                <button 
                  type="button"
                  onClick={() => setLocalStep(12)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-black text-[#bef715] uppercase tracking-widest">Account</span>
              </div>
              <div className="w-full h-[2px] rounded-full bg-[#bef715] mt-2" />
            </div>

            {/* Content */}
            <div className="w-full flex-1 flex flex-col justify-center items-center my-4 space-y-6 text-center">
              
              {/* Security Shield Icon Illustration */}
              <div className="w-24 h-24 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-5xl relative shadow-2xl">
                <div className="absolute inset-0 bg-[#bef715]/5 rounded-full blur-xl pointer-events-none" />
                🛡️
              </div>

              <div className="space-y-2 text-center px-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-snug">
                  First, let's create your account.
                </h1>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-semibold">
                  Your account keeps your shop secure, saves your progress and gives you access to your merchant dashboard.
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setLocalStep(14)}
                className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10 uppercase tracking-wider"
              >
                <span>Continue</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {localStep === 14 && (
          /* SCREEN 16 — SIGN UP (The pre-existing signup form) */
          <motion.div 
            key="step-14"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
          >
            {/* Header */}
            <div className="w-full shrink-0">
              <div className="flex items-center justify-between py-4">
                <button 
                  type="button"
                  onClick={() => setLocalStep(13)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-white active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2]" />
                </button>
                <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">
                  Step 1 of 5
                </span>
              </div>

              {/* Custom 5-segment Progress Bar */}
              <div className="w-full grid grid-cols-5 gap-2 mt-2 mb-8">
                <div className="h-[3px] rounded-full bg-[#bef715]" />
                <div className="h-[3px] rounded-full bg-zinc-900" />
                <div className="h-[3px] rounded-full bg-zinc-900" />
                <div className="h-[3px] rounded-full bg-zinc-900" />
                <div className="h-[3px] rounded-full bg-zinc-900" />
              </div>
            </div>

            {/* Form */}
            <div className="w-full flex-1 flex flex-col justify-center space-y-8 my-4">
              <div className="space-y-2 text-left">
                <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">
                  Create your<br />
                  <span className="text-[#bef715]">account</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium">Let's get you started. It only takes a minute.</p>
              </div>

              {signUpError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-950/20 border border-red-900/40 rounded-2xl p-4 text-center space-y-3"
                >
                  <div className="text-red-500 font-extrabold text-sm">
                    Sign up failed
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    {signUpError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSignUpError(null)}
                    className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 text-white font-extrabold text-xs rounded-xl border border-zinc-900 cursor-pointer transition-all"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Full name</label>
                  <input 
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Tawanda Muzenda"
                    className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-medium"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Email address</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tawanda@gmail.com"
                    className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-medium"
                  />
                </div>

                <div className="space-y-1.5 text-left relative">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl pl-4 pr-11 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-800 font-mono"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="space-y-2 pt-2 text-left">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${hasMinLength ? 'bg-[#bef715]/10 border-[#bef715] text-[#bef715]' : 'border-zinc-800 text-zinc-800'}`}>
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className={`text-xs font-semibold ${hasMinLength ? 'text-[#bef715]' : 'text-zinc-500'}`}>
                      At least 8 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${hasNumOrSymbol ? 'bg-[#bef715]/10 border-[#bef715] text-[#bef715]' : 'border-zinc-800 text-zinc-800'}`}>
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className={`text-xs font-semibold ${hasNumOrSymbol ? 'text-[#bef715]' : 'text-zinc-500'}`}>
                      Include a number or symbol
                    </span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] mt-6 shadow-lg shadow-[#bef715]/10"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue ->'}
                </button>
              </form>
            </div>

            <div className="w-full shrink-0 text-center py-4">
              <p className="text-xs text-zinc-500 font-medium">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
