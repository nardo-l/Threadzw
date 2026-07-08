import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
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
      <div className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-hidden z-[45]">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto px-6 space-y-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20"
          >
            <CheckCircle2 className="text-[#25D366] w-8 h-8 stroke-[2.5]" />
          </motion.div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Email Sent</h1>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              We have transmitted secure access coordinates to <span className="text-white font-bold">{email}</span>.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer active:scale-[0.98]"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-hidden z-[45]">
      
      {/* Header with back button */}
      <header className="h-20 px-6 flex items-center justify-between shrink-0 bg-black">
        <button 
          onClick={() => navigate('/login')}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-white active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>
        
        <span className="text-sm font-black tracking-tighter text-white">
          ThreadZW<span className="text-[#25D366]">.</span>
        </span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md space-y-10">
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight font-sans">Reset Password</h1>
            <p className="text-zinc-500 text-sm font-medium">Enter your registered merchant email to restore access coordinates.</p>
          </div>

          <form onSubmit={handleResetRequest} className="space-y-6">
            <div className="space-y-1">
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 px-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-700"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Transmit Link'}
            </button>
          </form>

        </div>
      </main>

    </div>
  );
};
