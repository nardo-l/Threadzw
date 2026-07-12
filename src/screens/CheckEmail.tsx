// src/screens/CheckEmail.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Loader2, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const CheckEmail: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(60);
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    // Retrieve stored email from sessionStorage
    const storedEmail = sessionStorage.getItem('pending_verification_email');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      console.warn("[CheckEmail] No pending verification email stored in sessionStorage.");
      setEmail('your email address');
    }
  }, []);

  // Handle countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0 || isResending) return;

    if (!email || email === 'your email address') {
      toast.error('Cannot resend verification: email address is unknown. Please register again.');
      return;
    }

    setIsResending(true);
    console.log(`[CheckEmail] Resending verification email to: ${email}`);

    try {
      const redirectUrl =
        window.location.hostname === 'localhost'
          ? 'http://localhost:5173/auth/confirm'
          : 'https://threadzw.vercel.app/auth/confirm';

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) {
        console.error("[CheckEmail] Supabase resend returned error:", error);
        throw error;
      }

      toast.success('Verification link resent successfully! 🚀');
      setCountdown(60); // Reset countdown back to 60 seconds
    } catch (err: any) {
      console.error("[CheckEmail] Exception during resend:", err);
      toast.error(err?.message || 'Failed to resend email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white text-zinc-900 flex flex-col items-center justify-center font-sans select-none overflow-hidden z-[90] selection:bg-[#bef715] selection:text-black">
      <div className="w-full max-w-md px-6 text-center space-y-8">
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center space-y-6"
        >
          {/* Logo */}
          <span className="text-3xl font-black tracking-tighter text-[#bef715]">
            ThreadZW<span className="text-zinc-900">.</span>
          </span>

          {/* Icon Outer Container */}
          <div className="relative w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-3xl flex items-center justify-center shadow-sm">
            <Mail className="w-9 h-9 text-[#bef715] stroke-[2]" />
            <motion.div 
              className="absolute inset-0 rounded-3xl border-2 border-[#bef715]/10 animate-ping pointer-events-none"
              style={{ animationDuration: '3s' }}
            />
          </div>

          {/* Typography */}
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-zinc-950 tracking-tight font-grotesk uppercase">
              Check your email
            </h1>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
              We've sent a verification link to
            </p>
            <div className="bg-zinc-50 border border-zinc-100 px-4 py-2 rounded-full inline-block">
              <span className="text-zinc-800 font-bold text-sm select-all">
                {email}
              </span>
            </div>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-xs mx-auto pt-2">
              Click the link in your inbox to continue.
            </p>
          </div>

          {/* Buttons & Actions */}
          <div className="w-full space-y-4 pt-4">
            
            {/* Resend Button */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                Didn't receive it?
              </p>
              <button
                onClick={handleResendEmail}
                disabled={countdown > 0 || isResending}
                className={`w-full py-4 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  countdown > 0 || isResending
                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                    : 'bg-[#bef715] text-black border-[#bef715] hover:bg-[#aae010] active:scale-[0.98]'
                }`}
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    Resending...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                    Resend available in {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend Email
                  </>
                )}
              </button>
            </div>

            {/* Back to Login */}
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 px-6 rounded-full font-bold uppercase tracking-wider text-xs text-zinc-600 border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </button>

          </div>
        </motion.div>

      </div>
    </div>
  );
};
