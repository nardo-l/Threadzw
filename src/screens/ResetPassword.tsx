import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if we have a session to perform the update
  // Password recovery link sets a temporary session
  useEffect(() => {
    if (!authLoading && !session) {
      const timer = setTimeout(() => {
        if (!session) {
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
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-6">
        <Loader2 className="animate-spin text-[#25D366] w-8 h-8" />
      </div>
    );
  }

  if (!session && !authLoading) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-hidden z-[45]">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto px-6 space-y-10">
          <div className="w-16 h-16 rounded-full bg-red-950/20 flex items-center justify-center border border-red-900/30">
            <AlertCircle className="text-red-500 w-8 h-8" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Session Expired</h1>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              This reset link is either invalid, expired, or has reached a terminal state.
            </p>
          </div>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer active:scale-[0.98]"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  if (success) {
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
            <h1 className="text-3xl font-black text-white tracking-tight">Success</h1>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              Your password has been securely updated. Initializing login coordinates...
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer active:scale-[0.98]"
          >
            Proceed to Login
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
            <h1 className="text-4xl font-black text-white tracking-tight">Create New Password</h1>
            <p className="text-zinc-500 text-sm font-medium">Establish a secure new access key for your merchant dashboard.</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-1 relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New Password"
                className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 pr-10 pl-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-700"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-4 text-zinc-500 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-1 relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 pr-10 pl-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-700"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 bottom-4 text-zinc-500 hover:text-white cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
            </button>
          </form>

        </div>
      </main>

    </div>
  );
};
