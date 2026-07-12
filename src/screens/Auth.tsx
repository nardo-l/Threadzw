import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, ArrowLeft, Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { mapError } from '../lib/utils';
import { toast } from 'sonner';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const mounted = React.useRef(true);
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const [view, setView] = useState<'welcome' | 'signin' | 'signup'>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const { setIsGuest } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    // Explicitly wipe stale credentials/sessions to avoid false-positive mock authentication
    localStorage.removeItem('threadzw_logged_in');
    localStorage.removeItem('supabase_logged_in_user_id');
    localStorage.removeItem('threadzw_owner_email');
    localStorage.removeItem('threadzw_owner_name');
    
    setLoading(true);
    setError(null);
  
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      if (signInError) {
        if (signInError.message.toLowerCase().includes('invalid login credentials')) {
          setView('signup');
          setError('Account not found. Please create an account below.');
          setLoading(false);
          return;
        }
        throw signInError;
      }

      if (!data?.session) {
        throw new Error('No authenticated session was returned from the authentication service.');
      }

      localStorage.setItem('thread_has_account', 'true');
    } catch (err: any) {
      // Clear out states completely on failure
      localStorage.removeItem('threadzw_logged_in');
      localStorage.removeItem('supabase_logged_in_user_id');
      localStorage.removeItem('threadzw_owner_email');
      localStorage.removeItem('threadzw_owner_name');
      setError(mapError(err));
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !handle.trim() || !email.trim() || password.length < 6) {
      setError('Please fill in all fields correctly.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const { data: existing } = await supabase.from('profiles').select('id').eq('handle', cleanHandle).maybeSingle();
      if (existing) {
        setError('That handle is already taken.');
        setLoading(false);
        return;
      }
      
      const redirectUrl =
        window.location.hostname === 'localhost'
          ? 'http://localhost:5173/auth/confirm'
          : 'https://threadzw.vercel.app/auth/confirm';

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: { 
          data: { display_name: displayName.trim(), handle: cleanHandle },
          emailRedirectTo: redirectUrl
        }
      });
      
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          setView('signin');
          setError('An account with this email already exists. Please sign in.');
          setLoading(false);
          return;
        }
        throw signUpError;
      }
      
      localStorage.setItem('thread_has_account', 'true');
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName.trim(),
          handle: cleanHandle,
          email: email.trim(),
          created_at: new Date().toISOString()
        });
      }
      
      sessionStorage.setItem('pending_verification_email', email.trim().toLowerCase());
      toast.success('Account created. Verification email sent.');
      navigate('/check-email');
    } catch (err: any) {
      console.error("[AUTH-SIGNUP-DEBUG] Complete error object caught:", err);
      if (err) {
        if (err.code) {
          console.error("[AUTH-SIGNUP-DEBUG] Error code:", err.code);
        }
        if (err.status) {
          console.error("[AUTH-SIGNUP-DEBUG] Error HTTP status code:", err.status);
        }
        const responseBody = err.response || err.body || (err.headers ? err : null);
        if (responseBody) {
          console.error("[AUTH-SIGNUP-DEBUG] HTTP response/body:", responseBody);
        }
      }
      const errorMessage = err?.message || 'Failed to create account. Please try again.';
      setError(mapError(err));
      toast.error(`Sign up failed\n\n${errorMessage}`);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#25D366]/30 flex flex-col relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-10 right-10 text-white/5 -rotate-12 pointer-events-none"><Star size={120} fill="currentColor" /></div>
      <div className="absolute bottom-10 left-10 text-white/5 rotate-12 pointer-events-none"><Sparkles size={80} fill="currentColor" /></div>
      
      <AnimatePresence mode="wait">
        {view === 'welcome' && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-8 pt-20"
          >
            <div className="flex flex-col items-center gap-6 mb-auto mt-20">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative text-center"
              >
                <h1 className="text-7xl md:text-8xl font-display font-black tracking-tighter relative text-white uppercase leading-[0.8]">
                   thread<span className="text-[#25D366]">ZW</span>
                </h1>
                <div className="mt-4 text-stone-400 text-sm tracking-wider uppercase font-mono">The Collective Protocol.</div>
              </motion.div>
            </div>

            <div className="flex flex-col gap-4 max-w-sm mx-auto w-full mb-12">
              <button 
                onClick={() => setView('signup')}
                className="w-full bg-[#25D366] hover:bg-[#b5e600] text-black py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all active:scale-[0.98]"
              >
                Deploy Storefront
              </button>
              <button 
                onClick={() => setView('signin')}
                className="w-full bg-white/5 text-white border border-white/10 hover:bg-white/10 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all active:scale-[0.98]"
              >
                Client Authentication
              </button>
              
              <div className="mt-6 flex flex-col items-center gap-4 text-center">
                <button 
                  onClick={() => setIsGuest(true)}
                  className="text-stone-400 hover:text-[#25D366] text-xs uppercase tracking-widest font-bold transition-colors"
                >
                  Guest Access
                </button>
              </div>
            </div>
            
            <div className="mt-auto text-center border-t border-white/5 pt-8">
              <span className="text-xs text-stone-600 uppercase tracking-widest font-mono">Infrastructure Layer established in Zimbabwe.</span>
            </div>
          </motion.div>
        )}

        {(view === 'signin' || view === 'signup') && (
          <motion.div 
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col p-8 pt-12 relative z-10"
          >
            <button 
              onClick={() => setView('welcome')}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-12 self-start active:scale-95 transition-all"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="max-w-sm mx-auto w-full">
              <div className="mb-10">
                <h2 className="text-5xl font-display font-black uppercase tracking-tighter mb-2 leading-[0.8] text-white">
                  {view === 'signin' ? 'entry.' : 'setup.'}
                </h2>
                <div className="text-xs font-mono tracking-widest text-[#25D366] uppercase">Protocol Engagement</div>
              </div>

              <form onSubmit={view === 'signin' ? handleSignIn : handleSignUp} className="space-y-5">
                <AnimatePresence mode="popLayout">
                  {view === 'signup' && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1.5"
                      >
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1">Commercial Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                          <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Store Owner"
                            className="w-full bg-[#111] border border-stone-800 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[#25D366] transition-all text-white placeholder:text-stone-600 text-sm"
                          />
                        </div>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1.5"
                      >
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1">Node Handle</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-stone-500 font-bold text-sm">@</div>
                          <input
                            type="text"
                            required
                            value={handle}
                            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="handle"
                            className="w-full bg-[#111] border border-stone-800 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[#25D366] transition-all text-white placeholder:text-stone-600 text-sm"
                          />
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1">Routing Address or Username</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Username or email address"
                      className="w-full bg-[#111] border border-stone-800 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[#25D366] transition-all text-white placeholder:text-stone-600 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Key Phrase</label>
                    {view === 'signin' && (
                      <Link to="/forgot-password" disable-navigation="true" className="text-[10px] text-stone-400 hover:text-[#25D366] transition-colors uppercase font-mono tracking-wider">Reset?</Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#111] border border-stone-800 rounded-xl py-3.5 pl-11 pr-10 outline-none focus:border-[#25D366] transition-all text-white placeholder:text-stone-600 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-[#25D366] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 mt-4"
                  >
                    <AlertCircle className="text-red-500 w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-white text-xs font-medium leading-tight">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#25D366] hover:bg-[#b5e600] text-black py-4 rounded-xl font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-8 text-sm"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    view === 'signin' ? 'Verify Identity' : 'Establish Node'
                  )}
                </button>
              </form>

              <div className="mt-12 text-center">
                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">
                  {view === 'signin' ? 'Zero Account?' : 'Identity Established?'}
                  <button 
                    onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
                    className="ml-2 text-white border-b border-[#25D366] hover:text-[#25D366] transition-colors"
                  >
                    {view === 'signin' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
