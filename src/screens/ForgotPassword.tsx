import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const ForgotPassword = () => {
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
        redirectTo: `${window.location.origin}/reset-password`,
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
      <div className="min-h-screen bg-black flex flex-col p-6 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-[#C6FF00] opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto relative z-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full bg-[#C6FF00]/10 flex items-center justify-center mb-10 border border-[#C6FF00]/20"
          >
            <CheckCircle2 size={40} className="text-[#C6FF00]" />
          </motion.div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">Security Protocol</h1>
          <p className="text-[#888] text-sm leading-relaxed mb-10 font-mono uppercase tracking-widest text-[11px]">
            Access link transmitted to <span className="text-white font-bold">{email}</span>. 
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-5 bg-[#C6FF00] text-black rounded-full font-black uppercase tracking-widest text-lg shadow-xl shadow-[#C6FF00]/20 transition-all active:scale-[0.98]"
          >
            Terminal Login ✓
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-[#C6FF00] opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />
      <header className="py-4 relative z-10">
        <button
          onClick={() => navigate('/auth')}
          className="w-12 h-12 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4 text-white">Reset Key?</h1>
        <p className="text-[#888] text-sm leading-relaxed mb-10">
          Transmit your email address and we'll send a link to securely reset your access key.
        </p>

        <form onSubmit={handleResetRequest} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#555] ml-1">Business Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333] w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="simba@threadzw.com"
                className="w-full bg-[#111] border border-[#222] rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-[#C6FF00] transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-[#C6FF00] text-black rounded-full flex items-center justify-center gap-3 font-black uppercase tracking-widest text-lg shadow-xl shadow-[#C6FF00]/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <span>Transmit Link</span>
                <Send size={18} />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};
