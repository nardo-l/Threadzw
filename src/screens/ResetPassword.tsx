import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if we have a session to perform the update
  // Password recovery link sets a temporary session
  useEffect(() => {
    // If not loading and no session, we give it a few seconds to parse hash
    if (!authLoading && !session) {
      const timer = setTimeout(() => {
        if (!session) {
          // Still no session after 3 seconds, probably invalid link
          console.warn("No session found in ResetPassword after delay");
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session, authLoading]);
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      toast.success('Password updated successfully');
      
      // Clear URL fragments if any
      window.history.replaceState({}, '', window.location.pathname);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Update password error:', err);
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <Loader2 className="animate-spin text-[#C6FF00]" size={32} />
      </div>
    );
  }

  if (!session && !authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col p-6 items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-[#C6FF00] opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 relative z-10 border border-red-500/20">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-4 relative z-10 text-white">
          Session Void
        </h1>
        <p className="text-[#888] text-sm mb-10 max-w-sm relative z-10 leading-relaxed font-mono uppercase tracking-widest text-[11px]">
          Reset link has expired or reached terminal state.
        </p>
        <button
          onClick={() => navigate('/forgot-password')}
          className="w-full max-w-sm py-5 bg-[#C6FF00] text-black rounded-full font-black uppercase tracking-widest text-lg shadow-xl shadow-[#C6FF00]/20 transition-all active:scale-[0.98] relative z-10"
        >
          Request New Protocol
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex flex-col p-6 items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-[#C6FF00] opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full bg-[#C6FF00]/10 flex items-center justify-center mb-6 relative z-10 border border-[#C6FF00]/20"
        >
          <CheckCircle2 size={40} className="text-[#C6FF00]" />
        </motion.div>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-4 relative z-10 text-white">
          Key Replaced ✓
        </h1>
        <p className="text-[#888] text-sm mb-10 relative z-10 leading-relaxed font-mono uppercase tracking-widest text-[11px]">
          The vault is secure. Initializing terminal login...
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full max-w-sm py-5 bg-[#C6FF00] text-black rounded-full font-black uppercase tracking-widest text-lg shadow-xl shadow-[#C6FF00]/20 transition-all active:scale-[0.98] relative z-10"
        >
          Enter Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 text-white overflow-hidden">
       <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-[#C6FF00] opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-sm mx-auto w-full pt-12 relative z-10">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4 text-white">
          Replace Key
        </h1>
        <p className="text-[#888] text-sm mb-10 leading-relaxed">
          Establish a new access key. Ensure high entropy for maximum security.
        </p>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#555] ml-1">
              New Access Key
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333] w-5 h-5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111] border border-[#222] rounded-2xl py-4 pl-12 pr-12 text-white outline-none focus:border-[#C6FF00] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#C6FF00]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#555] ml-1">
              Confirm New Key
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333] w-5 h-5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111] border border-[#222] rounded-2xl py-4 pl-12 pr-12 text-white outline-none focus:border-[#C6FF00] transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-[#C6FF00] text-black rounded-full flex items-center justify-center gap-2 font-black uppercase tracking-widest text-lg shadow-xl shadow-[#C6FF00]/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <span>Finalize Key Replacement ✓</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
