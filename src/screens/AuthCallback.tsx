// src/screens/AuthCallback.tsx

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, ShieldX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { hasShop, loading: shopLoading } = useShopContext();

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const verifyToken = async () => {
      if (!token_hash || !type) {
        console.warn("[AUTH-CALLBACK] URL is missing token_hash or type params.");
        if (active) {
          setStatus('error');
          setErrorMessage("This confirmation link is invalid or has expired.");
        }
        return;
      }

      try {
        console.log(`[AUTH-CALLBACK] Verifying OTP. Type: ${type}, Hash: ${token_hash.substring(0, 8)}...`);
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          console.error("[AUTH-CALLBACK] verifyOtp call returned an error:", error);
          if (active) {
            setStatus('error');
            setErrorMessage(error.message || "This confirmation link is invalid or has expired.");
          }
          return;
        }

        console.log("[AUTH-CALLBACK] verifyOtp successful.");
        if (active) {
          setStatus('success');
        }
      } catch (err: any) {
        console.error("[AUTH-CALLBACK] Exception caught in verifyToken:", err);
        if (active) {
          setStatus('error');
          setErrorMessage(err?.message || "An unexpected verification error occurred.");
        }
      }
    };

    verifyToken();

    return () => {
      active = false;
    };
  }, [token_hash, type]);

  // Navigate once verification is successful and loading states are settled
  useEffect(() => {
    if (status !== 'success' || authLoading || shopLoading) {
      return;
    }

    console.log(`[AUTH-CALLBACK] Verification successful, session active: ${!!session}, hasShop: ${hasShop}, type: ${type}`);

    if (type === 'recovery') {
      console.log("[AUTH-CALLBACK] Password recovery detected. Redirecting to /reset-password");
      navigate('/reset-password');
      return;
    }

    if (!session) {
      console.log("[AUTH-CALLBACK] No session established. Redirecting to /login");
      navigate('/login');
    } else if (!hasShop) {
      console.log("[AUTH-CALLBACK] No shop found for authenticated merchant. Redirecting to /setup");
      navigate('/setup');
    } else {
      console.log("[AUTH-CALLBACK] Shop found. Redirecting to /dashboard");
      navigate('/dashboard');
    }
  }, [status, authLoading, shopLoading, session, hasShop, type, navigate]);

  return (
    <div className="fixed inset-0 bg-white text-zinc-900 flex flex-col items-center justify-center font-sans select-none overflow-hidden z-[100] selection:bg-[#bef715] selection:text-black">
      <div className="w-full max-w-md px-6 text-center space-y-8">
        
        {status === 'verifying' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center space-y-6"
          >
            {/* Logo */}
            <span className="text-3xl font-black tracking-tighter text-[#bef715]">
              ThreadZW<span className="text-zinc-900">.</span>
            </span>

            {/* Spinner */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#bef715]" />
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-950 font-grotesk">
                Confirming your account...
              </h1>
              <p className="text-zinc-500 text-sm font-medium">
                Please wait while we securely verify your email.
              </p>
            </div>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center space-y-6"
          >
            {/* Logo */}
            <span className="text-3xl font-black tracking-tighter text-[#bef715]">
              ThreadZW<span className="text-zinc-900">.</span>
            </span>

            <div className="relative w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#bef715]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-950 font-grotesk">
                Verified successfully
              </h1>
              <p className="text-zinc-500 text-sm font-medium">
                Syncing secure merchant services, please wait...
              </p>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-6"
          >
            {/* Logo */}
            <span className="text-3xl font-black tracking-tighter text-[#bef715]">
              ThreadZW<span className="text-zinc-900">.</span>
            </span>

            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-950 font-grotesk">
                Verification failed
              </h1>
              <p className="text-zinc-500 text-sm font-medium max-w-xs mx-auto">
                {errorMessage || "This confirmation link is invalid or has expired."}
              </p>
            </div>

            <button 
              onClick={() => navigate('/login')}
              className="btn-primary w-full max-w-xs py-3.5 bg-[#bef715] text-black font-bold uppercase tracking-wider text-xs rounded-full shadow-[0_4px_14px_rgba(190,247,21,0.25)] hover:bg-[#aae010] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center"
            >
              Return to Login
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
};
