// src/screens/SignUp.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
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
  Link as LinkIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  // Onboarding wizard steps (0 = Welcome Screen, 1 = Create Account)
  const [localStep, setLocalStep] = useState(0);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  
  const isSigningUpRef = useRef(false);

  // Password requirement validation
  const hasMinLength = password.length >= 8;
  const hasNumOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>_+\-\[\]\\\/]/.test(password);

  useEffect(() => {
    if (session && isSigningUpRef.current) {
      console.log("SIGNUP FLOW: Session is now fully active in AuthContext. Navigating to setup...");
      isSigningUpRef.current = false;
      navigate('/setup');
    }
  }, [session, navigate]);

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
      console.log("STEP 1 - Calling signUp");
      
      const redirectUrl =
        window.location.hostname === 'localhost'
          ? 'http://localhost:5173/auth/confirm'
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

      console.log("STEP 2 - signUp finished", { data, error });

      if (error) {
        isSigningUpRef.current = false;
        console.error("SIGNUP FLOW: signUp returned an error:", error);
        throw error;
      }

      const sessionUser = data?.user;
      console.log("SIGNUP FLOW: User details from signUp data:", sessionUser);

      if (sessionUser) {
        console.log("STEP 3 - Sign up successful. Navigating to setup...");
        toast.success('Account created successfully');
        navigate('/setup');
      } else {
        isSigningUpRef.current = false;
        console.log("SIGNUP FLOW: signUp completed but user session is not available yet (email confirmation required?).");
        toast.success('Account created. Please check your email.');
        setLoading(false);
      }
    } catch (err: any) {
      isSigningUpRef.current = false;
      console.error("SIGNUP FLOW: Complete error object caught during sign up:", err);
      
      if (err) {
        if (err.code) {
          console.error("SIGNUP FLOW: Error code detected:", err.code);
        }
        if (err.status) {
          console.error("SIGNUP FLOW: Error HTTP status code detected:", err.status);
        }
        // Log HTTP response body if available on the error object
        const responseBody = err.response || err.body || (err.headers ? err : null);
        if (responseBody) {
          console.error("SIGNUP FLOW: HTTP response/body detected:", responseBody);
        }
      }

      const errorMessage = err?.message || 'Failed to create account. Please try again.';
      setSignUpError(errorMessage);
      
      // Toast the precise error message with double line break
      toast.error(`Sign up failed\n\n${errorMessage}`);
      
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-y-auto z-[45] selection:bg-[#bef715] selection:text-black">
      
      {localStep === 0 ? (
        /* SCREEN 1: WELCOME SCREEN */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-8 max-w-[480px] mx-auto relative z-10"
        >
          {/* Header Area */}
          <div className="w-full flex justify-between items-center py-4">
            <span className="text-2xl font-black tracking-tighter text-[#bef715]">
              ThreadZW<span className="text-white">.</span>
            </span>
          </div>

          {/* Main Visuals & Hero Copy */}
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-8 my-4">
            {/* Headline and Copy */}
            <div className="w-full text-left space-y-4">
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] uppercase">
                Let's build<br />
                your brand.<br />
                <span className="text-[#bef715] underline decoration-[#bef715] decoration-2 underline-offset-8">
                  Together.
                </span>
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-medium">
                Join thousands of Zimbabwean entrepreneurs selling online with beautiful shops.
              </p>
            </div>

            {/* Glowing Shopping Bag Visual Illustration */}
            <div className="relative w-full h-64 flex items-center justify-center my-6">
              {/* Central Ambient Glow */}
              <div className="absolute w-56 h-56 bg-[#bef715]/10 rounded-full blur-3xl -z-10" />

              {/* Shopping Bag Model */}
              <div className="relative w-40 h-48 drop-shadow-[0_0_25px_rgba(190,247,21,0.15)] flex flex-col items-center justify-center bg-zinc-950 border border-zinc-900 rounded-3xl p-4 transform -rotate-2 hover:rotate-0 transition-transform duration-500 ease-out">
                {/* Bag Handle */}
                <div className="absolute -top-6 w-20 h-16 border-4 border-zinc-900 rounded-t-full -z-10" />
                <div className="absolute -top-[21px] w-[74px] h-[60px] border-[3px] border-[#bef715]/10 rounded-t-full -z-10 animate-pulse" />
                
                {/* Bag Content Initials Logo */}
                <span className="text-4xl font-black tracking-tighter text-[#bef715] mb-1 animate-pulse">
                  TZ
                </span>
                
                {/* Visual Detail Line */}
                <div className="w-12 h-1 bg-zinc-900 rounded-full" />
              </div>

              {/* Left Floating Neon Link Icon */}
              <div className="absolute left-[12%] bottom-[25%] w-12 h-12 rounded-full flex items-center justify-center bg-zinc-950 border border-[#bef715]/20 text-[#bef715] shadow-[0_0_15px_rgba(190,247,21,0.1)] hover:scale-110 transition-transform cursor-pointer">
                <LinkIcon className="w-5 h-5 stroke-[2]" />
              </div>

              {/* Right Floating Neon Graph Icon */}
              <div className="absolute right-[12%] top-[25%] w-12 h-12 rounded-full flex items-center justify-center bg-zinc-950 border border-[#bef715]/20 text-[#bef715] shadow-[0_0_15px_rgba(190,247,21,0.1)] hover:scale-110 transition-transform cursor-pointer animate-bounce">
                <TrendingUp className="w-5 h-5 stroke-[2]" />
              </div>
            </div>
          </div>

          {/* Action Button & Link */}
          <div className="w-full space-y-6 shrink-0 mt-2">
            <button
              onClick={() => setLocalStep(1)}
              className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#bef715]/10"
            >
              <span>Get Started</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <p className="text-center text-sm text-zinc-500 font-medium">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-extrabold text-[#bef715] hover:underline"
              >
                Login
              </Link>
            </p>
          </div>

          {/* Marketing Footer Section */}
          <div className="w-full border-t border-zinc-900 mt-12 pt-8 grid grid-cols-2 gap-4">
            <div className="flex flex-col items-start space-y-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-[#bef715]">
                <Rocket className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-tight">Quick Setup</span>
              <p className="text-[10px] text-zinc-500 leading-normal">Launch your shop in minutes.</p>
            </div>

            <div className="flex flex-col items-start space-y-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-[#bef715]">
                <LinkIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-tight">Your Own Link</span>
              <p className="text-[10px] text-zinc-500 leading-normal">Share your shop anywhere.</p>
            </div>

            <div className="flex flex-col items-start space-y-2 mt-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-[#bef715]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-tight">Secure & Reliable</span>
              <p className="text-[10px] text-zinc-500 leading-normal">Your business in safe hands.</p>
            </div>

            <div className="flex flex-col items-start space-y-2 mt-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-[#bef715]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-tight">Grow Faster</span>
              <p className="text-[10px] text-zinc-500 leading-normal">Tools to help you sell more.</p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* SCREEN 2: CREATE ACCOUNT */
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="min-h-screen w-full flex flex-col justify-between px-6 py-8 max-w-[480px] mx-auto"
        >
          {/* Header area with navigation and progress */}
          <div className="w-full shrink-0">
            <div className="flex items-center justify-between py-4">
              <button 
                onClick={() => setLocalStep(0)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-white active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2]" />
              </button>
              <span className="text-xs font-mono font-black text-zinc-500 tracking-wider uppercase">
                Step 1 of 4
              </span>
            </div>

            {/* Custom 4-segment Progress Bar */}
            <div className="w-full grid grid-cols-4 gap-2 mt-2 mb-8">
              <div className="h-[3px] rounded-full bg-[#bef715]" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
              <div className="h-[3px] rounded-full bg-zinc-900" />
            </div>
          </div>

          {/* Form and Headline */}
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

              {/* Password Requirement Checkboxes */}
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

    </div>
  );
};

