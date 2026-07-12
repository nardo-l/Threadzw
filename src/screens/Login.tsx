// src/screens/Login.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[FORENSIC] handleLogin initiated. Email:", email);
    if (!email || !password) {
      console.warn("[FORENSIC] handleLogin cancelled: missing email/password");
      toast.error('Please fill in all fields');
      return;
    }

    console.log("[FORENSIC] Setting loading state to true");
    setLoading(true);
    setLoginError(null);
    setShake(false);

    try {
      console.log("[FORENSIC] Calling supabase.auth.signInWithPassword...");
      const t0 = performance.now();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      const t1 = performance.now();
      console.log(`[FORENSIC] supabase.auth.signInWithPassword returned after ${(t1 - t0).toFixed(2)}ms`);

      if (error) {
        console.error("[FORENSIC] supabase.auth.signInWithPassword returned error:", error);
        throw error;
      }

      console.log("[FORENSIC] signInWithPassword response details:", {
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email
      });

      if (!data?.session || !data?.user) {
        throw new Error('No authenticated user session was returned.');
      }

      toast.success('Signed in successfully');
      console.log("[FORENSIC] Triggering route navigation to /dashboard via navigate()...");
      navigate('/dashboard');
      console.log("[FORENSIC] navigate('/dashboard') called.");
    } catch (err: any) {
      console.error("[FORENSIC] Exception caught in handleLogin:", err);
      setPassword('');
      setShake(true);
      setLoginError(err?.message || 'Incorrect email or password. Please try again.');
    } finally {
      console.log("[FORENSIC] handleLogin finally block reached. Setting loading state to false");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-hidden z-[45] selection:bg-[#bef715] selection:text-black">
      
      {/* Header with back button */}
      <header className="h-20 px-6 flex items-center justify-between shrink-0 bg-black">
        <button 
          onClick={() => navigate('/')}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-white active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>
        
        <span className="text-xl font-black tracking-tighter text-[#bef715]">
          ThreadZW<span className="text-white">.</span>
        </span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md space-y-10">
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">Owner Login</h1>
            <p className="text-zinc-500 text-sm font-medium">Sign in to manage your premium storefront.</p>
          </div>

          {loginError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-950/20 border border-red-900/40 rounded-2xl p-5 text-center space-y-3"
            >
              <div className="text-red-500 font-extrabold text-sm">
                Incorrect credentials
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed">
                {loginError}
              </p>
              <button
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setShake(false);
                }}
                className="w-full py-2.5 px-4 bg-[#bef715] hover:opacity-90 text-black font-extrabold text-xs rounded-xl cursor-pointer transition-all"
              >
                Try Again
              </button>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Email address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tawanda@gmail.com"
                className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-850 font-medium"
              />
            </div>

            <div className="space-y-1.5 text-left relative">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <motion.div
                  animate={shake ? { x: [-10, 10, -8, 8, -5, 5, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 bg-zinc-950 border border-zinc-900 rounded-xl pl-4 pr-11 text-white text-sm focus:outline-none focus:border-[#bef715] transition-all placeholder-zinc-850 font-mono"
                  />
                </motion.div>
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#bef715] hover:opacity-95 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] mt-8 shadow-lg shadow-[#bef715]/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 font-medium">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-extrabold text-[#bef715] hover:underline"
            >
              Get Started Free
            </Link>
          </p>

        </div>
      </main>

    </div>
  );
};
