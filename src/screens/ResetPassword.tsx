// src/screens/ResetPassword.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2, Key, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword, session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[FORENSIC-RESET] Initiating password update...");

    if (!session) {
      console.warn("[FORENSIC-RESET] No active authenticated session found.");
      toast.error("Your recovery session has expired. Please request a new recovery link.");
      navigate('/login');
      return;
    }

    if (!password || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      console.log("[FORENSIC-RESET] Calling updatePassword...");
      const { error } = await updatePassword(password);

      if (error) {
        console.error("[FORENSIC-RESET] updatePassword returned error:", error);
        throw error;
      }

      toast.success('Password updated successfully! 🚀');
      console.log("[FORENSIC-RESET] Password update succeeded. Navigating to dashboard.");
      navigate('/dashboard');
    } catch (err: any) {
      console.error("[FORENSIC-RESET] Exception in reset password:", err);
      toast.error(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-hidden z-[45] selection:bg-[#bef715] selection:text-black">
      {/* Header with simple title */}
      <header className="h-20 px-6 flex items-center justify-between shrink-0 bg-black">
        <span className="text-xl font-black tracking-tighter text-[#bef715]">
          ThreadZW<span className="text-white">.</span>
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md space-y-10">
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">New Password</h1>
            <p className="text-zinc-500 text-sm font-medium">Create a strong password to protect your merchant account.</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              {/* Password field */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full h-14 bg-zinc-950 border border-zinc-900 rounded-2xl px-5 text-[15px] font-medium text-white placeholder-zinc-700 focus:outline-none focus:border-[#bef715] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full h-14 bg-zinc-950 border border-zinc-900 rounded-2xl px-5 text-[15px] font-medium text-white placeholder-zinc-700 focus:outline-none focus:border-[#bef715] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#bef715] hover:opacity-90 active:scale-[0.99] text-black font-black uppercase tracking-wider text-[13px] rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4 stroke-[2.5]" />
                  Save Password
                </>
              )}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
};
