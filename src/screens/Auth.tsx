import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, ArrowLeft, Star, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { mapError } from '../lib/utils';

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
      setError('Please enter your email and password.')
      return
    }
    
    setLoading(true);
    setError(null);
  
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
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
      localStorage.setItem('thread_has_account', 'true');
    } catch (err: any) {
      setError(mapError(err))
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
    
    setLoading(true)
    setError(null)
    
    try {
      const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const { data: existing } = await supabase.from('profiles').select('id').eq('handle', cleanHandle).maybeSingle();
      if (existing) {
        setError('That handle is already taken.');
        setLoading(false);
        return;
      }
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: { data: { display_name: displayName.trim(), handle: cleanHandle } }
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
    } catch (err: any) {
      setError(mapError(err))
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-charcoal selection:bg-pink/30 flex flex-col relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-10 right-10 text-pink/10 -rotate-12"><Star size={120} fill="currentColor" /></div>
      <div className="absolute bottom-10 left-10 text-pink/10 rotate-12"><Heart size={80} fill="currentColor" /></div>
      
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
                <h1 className="text-8xl md:text-9xl font-display font-black italic tracking-tighter relative text-charcoal uppercase leading-[0.8]">
                   thread<span className="text-pink">zw</span>
                </h1>
                <div className="mt-4 italic-accent text-xl">The Collective Protocol.</div>
              </motion.div>
            </div>

            <div className="flex flex-col gap-6 max-w-sm mx-auto w-full mb-12">
              <button 
                onClick={() => setView('signup')}
                className="w-full bg-charcoal text-cream py-6 rounded-full font-black uppercase tracking-widest text-[13px] italic hover:scale-105 active:scale-[0.98] transition-all shadow-[10px_10px_0_#C6FF00]"
              >
                Deploy Storefront
              </button>
              <button 
                onClick={() => setView('signin')}
                className="w-full bg-white text-charcoal border-2 border-charcoal py-6 rounded-full font-black uppercase tracking-widest text-[13px] italic hover:bg-cream-dark active:scale-[0.98] transition-all shadow-[10px_10px_0_#F4A6C1]"
              >
                Client Authentication
              </button>
              
              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <button 
                  onClick={() => setIsGuest(true)}
                  className="oval-sticker hover:bg-pink hover:text-white transition-colors"
                >
                  Guest Access
                </button>
              </div>
            </div>
            
            <div className="mt-auto text-center border-t border-charcoal/5 pt-8">
              <span className="italic-accent text-charcoal/30">Infrastructure Layer established in Zimbabwe.</span>
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
              className="w-12 h-12 rounded-full bg-white border-2 border-charcoal flex items-center justify-center text-charcoal mb-12 self-start active:scale-95 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)]"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="max-w-sm mx-auto w-full">
              <div className="mb-10">
                <h2 className="text-6xl md:text-7xl font-display font-black uppercase italic tracking-tighter mb-2 leading-[0.8]">
                  {view === 'signin' ? 'entry.' : 'setup.'}
                </h2>
                <div className="italic-accent text-pink">Protocol Engagement</div>
              </div>

              <form onSubmit={view === 'signin' ? handleSignIn : handleSignUp} className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {view === 'signup' && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <label className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 ml-2 italic">Commercial Name</label>
                        <div className="relative">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/20" />
                          <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Store Owner"
                            className="w-full bg-white border-2 border-charcoal rounded-[24px] py-5 pl-14 pr-6 outline-none focus:border-pink transition-all text-charcoal shadow-[4px_4px_0_rgba(0,0,0,0.05)]"
                          />
                        </div>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <label className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 ml-2 italic">Node Handle</label>
                        <div className="relative">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-charcoal/20 font-black">@</div>
                          <input
                            type="text"
                            required
                            value={handle}
                            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="handle"
                            className="w-full bg-white border-2 border-charcoal rounded-[24px] py-5 pl-14 pr-6 outline-none focus:border-pink transition-all text-charcoal shadow-[4px_4px_0_rgba(0,0,0,0.05)]"
                          />
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 ml-2 italic">Routing Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/20" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@node.com"
                      className="w-full bg-white border-2 border-charcoal rounded-[24px] py-5 pl-14 pr-6 outline-none focus:border-pink transition-all text-charcoal shadow-[4px_4px_0_rgba(0,0,0,0.05)]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 italic">Key Phrase</label>
                    {view === 'signin' && (
                      <Link to="/forgot-password" disable-navigation="true" className="italic-accent text-[11px] hover:underline">Reset?</Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/20" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border-2 border-charcoal rounded-[24px] py-5 pl-14 pr-12 outline-none focus:border-pink transition-all text-charcoal shadow-[4px_4px_0_rgba(0,0,0,0.05)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-charcoal/20 hover:text-pink transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-pink/10 border-2 border-pink/20 rounded-[20px] flex items-start gap-3 mt-4"
                  >
                    <AlertCircle className="text-pink w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-charcoal text-[11px] font-bold uppercase tracking-tight leading-tight">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-charcoal text-cream py-6 rounded-full font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-10 text-[13px] italic shadow-[10px_10px_0_#C6FF00]"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                  ) : (
                    view === 'signin' ? 'Verify Identity' : 'Establish Node'
                  )}
                </button>
              </form>

              <div className="mt-12 text-center">
                <p className="text-charcoal/40 text-xs font-black uppercase tracking-widest italic">
                  {view === 'signin' ? 'Zero Account?' : 'Identity Established?'}
                  <button 
                    onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
                    className="ml-2 text-charcoal border-b-2 border-pink hover:text-pink transition-colors"
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
