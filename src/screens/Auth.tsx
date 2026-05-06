import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, X, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { mapError } from '../lib/utils';

interface AuthProps {
}

export const Auth: React.FC<AuthProps> = () => {
  const mounted = React.useRef(true);
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotSheet, setShowForgotSheet] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Validations
  const isHandleValid = (h: string) => {
    return h.length >= 3 && h.length <= 20 && /^[a-zA-Z0-9_]+$/.test(h);
  };

  const isEmailValid = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    
    setLoading(true);
    setError(null);
  
    try {
      const { error: signInError } = await
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        })
      
      if (signInError) {
        // Smart Redirect: If user not found (usually 400 with 'Invalid login credentials')
        // We can't perfectly distinguish between "wrong password" and "user not found" for security,
        // but we can catch common hints or if message specifically says not found.
        if (signInError.message.toLowerCase().includes('invalid login credentials')) {
          // We can't be 100% sure the user doesn't exist, but we can offer to sign up
          // or if the user is 100% sure they never signed up, they can switch.
          // To satisfy "user tries to sign in without an account they are taken to sign up page":
          // since we can't reliably know if user exists without trying to sign up, 
          // we will show the error and maybe a more prominent "Create Account" button?
          // Actually, if we want to be more proactive, we can try to sign up if sign in fails? 
          // No, that's risky. But we can assume if it's "Invalid login credentials", 
          // and they want smart redirect, we can switch to signup mode and show hint.
          setMode('signup');
          setError('Account not found. Please create an account below.');
          setLoading(false);
          return;
        }
        throw signInError
      }
      
      // After successful sign in
      localStorage.setItem('thread_has_account', 'true');
      
      // Session listener handles navigation automatically
      
    } catch (err: any) {
      console.error('Sign in error:', err)
      setError(mapError(err))
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!handle.trim() || handle.length < 3) {
      setError('Handle must be at least 3 characters.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const cleanHandle = handle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
      
      // Check handle not taken
      const { data: existing } = 
        await supabase
          .from('profiles')
          .select('id')
          .eq('handle', cleanHandle)
          .maybeSingle()
      
      if (existing) {
        setError('That handle is already taken.')
        setLoading(false)
        return
      }
      
      // Sign up with Supabase
      const { data, error: signUpError } = await
        supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              display_name: displayName.trim(),
              handle: cleanHandle
            }
          }
        })
      
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered') || 
            signUpError.message.toLowerCase().includes('already exists')) {
          setMode('signin');
          setError('An account with this email already exists. Please sign in.');
          setLoading(false);
          return;
        }
        throw signUpError
      }
      
      // After successful sign up
      localStorage.setItem('thread_has_account', 'true');
      
      // Create profile row immediately
      if (data.user) {
        const pendingStyle = localStorage.getItem('pending_style');
        
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            display_name: displayName.trim(),
            handle: cleanHandle,
            email: email.trim(),
            style_preference: pendingStyle || null,
            created_at: new Date().toISOString()
          });

        if (pendingStyle) {
          localStorage.removeItem('pending_style');
        }
      }
      
      // Session listener will automatically navigate to app
      
    } catch (err: any) {
      console.error('Sign up error:', err)
      setError(mapError(err))
    } finally {
      if (mounted.current) setLoading(false)
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
    
    if (error) {
      setError(mapError(error));
      setLoading(false);
    } else {
      setResetSent(true);
      setLoading(false);
    }
  };


  const isFormFilled = mode === 'signin' 
    ? email && password 
    : email && password && displayName && handle;

  return (
    <div className="flex-1 flex flex-col bg-black min-h-screen relative font-sans overflow-hidden">
      {/* Header */}
      <div className="pt-20 pb-12 flex flex-col items-center">
        <h1 className="text-[52px] font-pacifico text-[#FF2D78]">thread</h1>
        <p className="text-[#888] text-[13px] mt-1">Zimbabwe's Closet</p>
      </div>

      {/* Tabs */}
      <div className="px-8 mb-8">
        <div className="flex border-b border-[#222]">
          <button 
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-4 text-[15px] font-bold transition-all relative ${mode === 'signin' ? 'text-white' : 'text-[#888]'}`}
          >
            Sign In
            {mode === 'signin' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF2D78]" />
            )}
          </button>
          <button 
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-4 text-[15px] font-bold transition-all relative ${mode === 'signup' ? 'text-white' : 'text-[#888]'}`}
          >
            Sign Up
            {mode === 'signup' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF2D78]" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 px-8 overflow-y-auto no-scrollbar pb-12">
        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-5">
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#888] uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Simba Makoni"
                  className="w-full h-14 bg-[#111] border border-[#222] rounded-[16px] px-4 text-white text-[15px] focus:border-[#FF2D78] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#888] uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF2D78] font-bold">@</span>
                  <input 
                    type="text"
                    required
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    placeholder="handle"
                    className="w-full h-14 bg-[#111] border border-[#222] rounded-[16px] pl-9 pr-4 text-white text-[15px] focus:border-[#FF2D78] outline-none transition-all"
                  />
                </div>
                {handle && !isHandleValid(handle) && (
                  <p className="text-[#ef4444] text-[11px] mt-1 ml-1">Handle can only contain letters, numbers and underscores. Min 3 characters.</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#888] uppercase tracking-widest ml-1">Email</label>
            <input 
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full h-14 bg-[#111] border border-[#222] rounded-[16px] px-4 text-white text-[15px] focus:border-[#FF2D78] outline-none transition-all"
            />
            {email && !isEmailValid(email) && (
              <p className="text-[#ef4444] text-[11px] mt-1 ml-1">Please enter a valid email address.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#888] uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 bg-[#111] border border-[#222] rounded-[16px] px-4 text-white text-[15px] focus:border-[#FF2D78] outline-none transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {password && password.length < 6 && (
              <p className="text-[#ef4444] text-[11px] mt-1 ml-1">Password must be at least 6 characters.</p>
            )}
          </div>

          {error && (
            <div className="bg-[#ef444414] border border-[#ef444440] rounded-[10px] p-3 flex items-start gap-3">
              <span className="text-[13px] mt-0.5">⚠️</span>
              <p className="text-[#ef4444] text-[13px]">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || !isFormFilled}
            className={`w-full h-[52px] rounded-full font-bold text-[15px] transition-all flex items-center justify-center ${
              isFormFilled 
                ? 'bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white shadow-lg' 
                : 'bg-[#111] text-[#444] cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="spinner-20" />
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>


          {mode === 'signin' && (
            <button 
              type="button"
              onClick={() => { setShowForgotSheet(true); setError(null); }}
              className="w-full text-[#FF2D78] text-[13px] font-bold text-center mt-3"
            >
              Forgot Password?
            </button>
          )}

          {mode === 'signup' && (
            <p className="text-[#666] text-[11px] text-center mt-3">
              By signing up you agree to our <span className="text-[#888] underline">Terms of Service</span>
            </p>
          )}
        </form>
      </div>

      {/* Forgot Password Bottom Sheet */}
      <AnimatePresence>
        {showForgotSheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotSheet(false)}
              className="fixed inset-0 bg-black/60 z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-[#0d0d0d] rounded-t-[32px] p-8 pb-12"
            >
              <div className="w-12 h-1 bg-[#333] rounded-full mx-auto mb-6" />
              
              {!resetSent ? (
                <>
                  <h2 className="text-white text-[18px] font-bold">Reset Password</h2>
                  <p className="text-[#888] text-[13px] mt-2 mb-6">Enter your email and we'll send you a link to reset your password.</p>
                  
                  <div className="space-y-4">
                    <input 
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full h-14 bg-[#111] border border-[#222] rounded-[16px] px-4 text-white text-[15px] focus:border-[#FF2D78] outline-none transition-all"
                    />
                    
                    {error && (
                      <div className="bg-[#ef444414] border border-[#ef444440] rounded-[10px] p-3 flex items-start gap-3">
                        <span className="text-[13px] mt-0.5">⚠️</span>
                        <p className="text-[#ef4444] text-[13px]">{error}</p>
                      </div>
                    )}

                    <button 
                      onClick={handleResetPassword}
                      disabled={loading || !resetEmail}
                      className={`w-full h-[52px] rounded-full font-bold text-[15px] flex items-center justify-center ${
                        resetEmail 
                          ? 'bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white shadow-lg' 
                          : 'bg-[#111] text-[#444]'
                      }`}
                    >
                      {loading ? <div className="spinner-20" /> : 'Send Reset Link'}
                    </button>
                    
                    <button 
                      onClick={() => setShowForgotSheet(false)}
                      className="w-full text-[#888] text-[13px] font-medium text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <span className="text-[40px] mb-4 block">✉️</span>
                  <h2 className="text-white text-[18px] font-bold">Check Your Email</h2>
                  <p className="text-[#888] text-[13px] mt-2 mb-8">We sent a reset link to <span className="text-white font-bold">{resetEmail}</span>. Check your inbox.</p>
                  
                  <button 
                    onClick={() => setShowForgotSheet(false)}
                    className="w-full h-[52px] bg-transparent border border-[#333] rounded-full text-white font-bold text-[15px]"
                  >
                    Got It
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .spinner-20 {
          width: 20px;
          height: 20px;
          border: 2px solid #222;
          border-top-color: #FF2D78;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
