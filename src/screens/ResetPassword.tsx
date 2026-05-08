import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../App';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export const ResetPassword = () => {
  const t = useTheme();
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
        navigate('/auth');
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
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: t.bg_primary }}>
        <Loader2 className="animate-spin" style={{ color: t.accent }} size={32} />
      </div>
    );
  }

  if (!session && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col p-6 items-center justify-center text-center" style={{ background: t.bg_primary }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: t.red_bg }}>
          <AlertCircle size={40} style={{ color: t.red }} />
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: t.text_primary }}>
          Session Missing
        </h1>
        <p className="text-[15px] mb-8 max-w-sm" style={{ color: t.text_secondary }}>
          We couldn't find an active reset session. This can happen if the link has expired or was already used.
        </p>
        <button
          onClick={() => navigate('/forgot-password')}
          className="w-full max-w-sm py-4 rounded-xl font-bold text-[15px]"
          style={{ background: t.gradient, color: 'white' }}
        >
          Request New Link
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col p-6 items-center justify-center text-center" style={{ background: t.bg_primary }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: t.accent_bg }}
        >
          <CheckCircle2 size={40} style={{ color: t.accent }} />
        </motion.div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: t.text_primary }}>
          Password Updated!
        </h1>
        <p className="text-[15px] mb-8" style={{ color: t.text_secondary }}>
          Your password has been changed successfully. You'll be redirected to the sign in page in a moment.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="w-full max-w-sm py-4 rounded-xl font-bold text-[15px]"
          style={{ background: t.gradient, color: 'white' }}
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6" style={{ background: t.bg_primary }}>
      <div className="max-w-sm mx-auto w-full pt-12">
        <h1 className="text-3xl font-bold mb-3" style={{ color: t.text_primary }}>
          Reset Password
        </h1>
        <p className="text-[15px] mb-10" style={{ color: t.text_secondary }}>
          Please enter your new password below. Make sure it's something secure.
        </p>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          {/* New Password */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium ml-1" style={{ color: t.text_secondary }}>
              New Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock size={18} style={{ color: t.text_secondary }} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-2 rounded-xl py-4 pl-12 pr-12 text-[15px] outline-none transition-all focus:border-primary"
                style={{ borderColor: t.border_subtle, color: t.text_primary }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: t.text_secondary }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium ml-1" style={{ color: t.text_secondary }}>
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock size={18} style={{ color: t.text_secondary }} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-2 rounded-xl py-4 pl-12 pr-12 text-[15px] outline-none transition-all focus:border-primary"
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
              <span>Update Password</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
