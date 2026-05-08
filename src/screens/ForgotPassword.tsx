import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../App';
import { toast } from 'sonner';

export const ForgotPassword = () => {
  const t = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://reset-password-henna.vercel.app/",
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Reset link sent to your email');
    } catch (err: any) {
      console.error('Reset password error:', err);
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col p-6" style={{ background: t.bg_primary }}>
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: t.accent_bg }}
          >
            <CheckCircle2 size={40} style={{ color: t.accent }} />
          </motion.div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: t.text_primary }}>
            Check your email
          </h1>
          <p className="text-[15px] leading-relaxed mb-8" style={{ color: t.text_secondary }}>
            We've sent a password reset link to <span className="font-medium text-white">{email}</span>. 
            Please check your inbox and follow the instructions.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-4 rounded-xl font-bold text-[15px] transition-all active:scale-95"
            style={{ background: t.gradient, color: 'white' }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6" style={{ background: t.bg_primary }}>
      <button
        onClick={() => navigate('/auth')}
        className="w-10 h-10 rounded-full flex items-center justify-center mb-8 border"
        style={{ borderColor: t.border_subtle, color: t.text_primary }}
      >
        <ArrowLeft size={20} />
      </button>

      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-3xl font-bold mb-3" style={{ color: t.text_primary }}>
          Forgot Password?
        </h1>
        <p className="text-[15px] mb-8" style={{ color: t.text_secondary }}>
          No worries! Enter your email address below and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleResetRequest} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[13px] font-medium ml-1" style={{ color: t.text_secondary }}>
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail size={18} style={{ color: t.text_secondary }} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full bg-transparent border-2 rounded-xl py-4 pl-12 pr-4 text-[15px] outline-none transition-all focus:border-primary"
                style={{ borderColor: t.border_subtle, color: t.text_primary }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-[15px] transition-all active:scale-95 disabled:opacity-50"
            style={{ background: t.gradient, color: 'white' }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span>Send Reset Link</span>
                <Send size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
