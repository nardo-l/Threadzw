import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/withTimeout';

const LOGIN_REQUEST_TIMEOUT_MS = 15000;

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
    if (!email.trim() || !password) {
      setLoginError('Enter your email and password to continue.');
      return;
    }

    setLoading(true);
    setLoginError(null);
    setShake(false);

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }),
        LOGIN_REQUEST_TIMEOUT_MS,
        'SIGNIN'
      );
      if (error) throw error;
      if (!data?.session || !data?.user) throw new Error('SIGNIN_FAILED');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[LOGIN] sign in failed:', err);
      setPassword('');
      setShake(true);
      const raw = String(err?.message || '').toLowerCase();
      setLoginError(raw.includes('timeout')
        ? 'We could not reach ThreadZW right now. Check your connection and try again.'
        : 'The email or password is incorrect. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[45] overflow-hidden bg-[#050505] text-white selection:bg-[#C6FF00] selection:text-black">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between px-5">
          <button onClick={() => navigate('/')} aria-label="Back to home" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"><ArrowLeft size={18} /></button>
          <span className="text-lg font-black tracking-tight">THREAD<span className="text-[#C6FF00]">ZW</span></span>
          <span className="w-10" />
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-7">
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#C6FF00]">WELCOME BACK</p>
              <h1 className="mt-3 text-4xl font-black leading-none tracking-tight">Sign in.</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-500">Sign in to manage your ThreadZW storefront.</p>
            </div>

            {loginError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400"><AlertCircle size={18} /></div>
                  <div><p className="text-sm font-black text-red-300">Couldn't sign you in</p><p className="mt-1 text-xs leading-5 text-red-200/70">{loginError}</p></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => { setLoginError(null); setShake(false); }} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-black">Try again</button>
                  <button type="button" onClick={() => navigate('/signup')} className="flex-1 rounded-xl bg-[#C6FF00] py-2.5 text-xs font-black text-black">Create account</button>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Email address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="h-14 w-full rounded-2xl border border-white/10 bg-[#101010] px-4 text-sm font-semibold outline-none placeholder:text-zinc-700 focus:border-[#C6FF00]" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Password</label>
                <motion.div animate={shake ? { x: [-8, 8, -6, 6, 0] } : {}}>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" className="h-14 w-full rounded-2xl border border-white/10 bg-[#101010] px-4 pr-12 text-sm font-semibold outline-none placeholder:text-zinc-700 focus:border-[#C6FF00]" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                  </div>
                </motion.div>
              </div>
              <button type="submit" disabled={loading} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#C6FF00] text-sm font-black text-black shadow-[0_12px_35px_rgba(198,255,0,0.12)] transition hover:bg-[#D6FF33] disabled:opacity-50">
                {loading ? <Loader2 size={19} className="animate-spin" /> : 'Log In'}
              </button>
            </form>
            <p className="text-center text-sm text-zinc-500">Don't have an account? <Link to="/signup" className="font-black text-[#C6FF00]">Sign up</Link></p>
          </div>
        </main>
      </div>
    </div>
  );
};
