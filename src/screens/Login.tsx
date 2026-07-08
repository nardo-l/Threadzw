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
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const startOverall = performance.now();
    console.log("FORENSIC START: handleLogin invoked at timestamp", new Date().toISOString());

    // Clear any stale local storage session states before every login attempt
    localStorage.removeItem('threadzw_logged_in');
    localStorage.removeItem('supabase_logged_in_user_id');
    localStorage.removeItem('threadzw_owner_email');
    localStorage.removeItem('threadzw_owner_name');

    setLoading(true);
    setLoginError(null);
    setShake(false);
    
    console.log("FORENSIC: handleLogin starting");
    console.log("FORENSIC: Inputs received - Email/Username:", email, "Password length:", password?.length);

    try {
      let resolvedEmail = email.trim();
      const startUsernameResolve = performance.now();
      
      // If the entered email/username doesn't contain '@', it is a handle/username
      if (!resolvedEmail.includes('@')) {
        console.log("FORENSIC: Input does not contain '@'. Resolving username/handle:", resolvedEmail);
        const lowerHandle = resolvedEmail.toLowerCase();
        
        // Query profiles table for matching handle
        console.log("FORENSIC: STEP 0.1 - Querying profiles table for handle:", lowerHandle);
        const tProf0 = performance.now();
        const profileLookupPromise = supabase
          .from('profiles')
          .select('email, handle')
          .eq('handle', lowerHandle)
          .maybeSingle();

        const profileResult = await Promise.race([
          profileLookupPromise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Username lookup timed out")), 4000))
        ]) as any;
        const tProf1 = performance.now();
        console.log(`FORENSIC TIMING: query on SQL table profiles with filter [handle = ${lowerHandle}] took ${(tProf1 - tProf0).toFixed(2)}ms (row count: ${profileResult?.data ? 1 : 0}, evaluation: RLS, indexes: handle_unique_idx)`);

        if (profileResult?.error) {
          console.error("FORENSIC: STEP 0.1 ERROR - Profile query failed:", profileResult.error);
        }

        if (profileResult?.data?.email) {
          resolvedEmail = profileResult.data.email;
          console.log("FORENSIC: STEP 0.1 SUCCESS - Resolved handle directly in profiles table to email:", resolvedEmail);
        } else {
          // If profile not found, search in shops table for matching handle or name
          console.log("FORENSIC: STEP 0.2 - Profile handle not found. Querying shops table for handle/slug:", lowerHandle);
          const tShop0 = performance.now();
          const shopLookupPromise = supabase
            .from('shops')
            .select('owner_id, name, handle')
            .or(`handle.eq.${lowerHandle},slug.eq.${lowerHandle}`)
            .maybeSingle();

          const shopResult = await Promise.race([
            shopLookupPromise,
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Shop lookup timed out")), 4000))
          ]) as any;
          const tShop1 = performance.now();
          console.log(`FORENSIC TIMING: query on SQL table shops with filter [handle = ${lowerHandle} OR slug = ${lowerHandle}] took ${(tShop1 - tShop0).toFixed(2)}ms (row count: ${shopResult?.data ? 1 : 0}, evaluation: RLS, indexes: shops_handle_idx/shops_slug_idx)`);

          if (shopResult?.error) {
            console.error("FORENSIC: STEP 0.2 ERROR - Shop query failed:", shopResult.error);
          }

          if (shopResult?.data?.owner_id) {
            console.log("FORENSIC: STEP 0.2 SUCCESS - Found shop owner ID. Querying owner's profile:", shopResult.data.owner_id);
            const tOwner0 = performance.now();
            const ownerLookupPromise = supabase
              .from('profiles')
              .select('email')
              .eq('id', shopResult.data.owner_id)
              .maybeSingle();

            const ownerResult = await Promise.race([
              ownerLookupPromise,
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Owner profile lookup timed out")), 4000))
            ]) as any;
            const tOwner1 = performance.now();
            console.log(`FORENSIC TIMING: query on SQL table profiles with filter [id = ${shopResult.data.owner_id}] took ${(tOwner1 - tOwner0).toFixed(2)}ms (row count: ${ownerResult?.data ? 1 : 0}, evaluation: RLS, indexes: profiles_pkey)`);

            if (ownerResult?.data?.email) {
              resolvedEmail = ownerResult.data.email;
              console.log("FORENSIC: STEP 0.3 SUCCESS - Resolved shop owner's profile email:", resolvedEmail);
            }
          }
        }

        // If we still didn't resolve to a valid email format, throw a clear error
        if (!resolvedEmail.includes('@')) {
          throw new Error(`The username "${resolvedEmail}" is not recognized as a registered merchant account. Please sign in with your email address instead.`);
        }
      }
      const endUsernameResolve = performance.now();
      console.log(`FORENSIC TIMING: username resolution took ${(endUsernameResolve - startUsernameResolve).toFixed(2)}ms`);

      console.log("FORENSIC: STEP 1 - Calling supabase.auth.signInWithPassword for email:", resolvedEmail);
      const startSignIn = performance.now();
      const signInPromise = supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password
      });

      // Timeout promise specifically for the actual auth request
      const authTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Authentication request timed out. Please check your network connection.")), 15000)
      );

      const { data, error } = await Promise.race([
        signInPromise,
        authTimeout
      ]) as any;
      const endSignIn = performance.now();
      console.log(`FORENSIC TIMING: supabase.auth.signInWithPassword() duration: ${(endSignIn - startSignIn).toFixed(2)}ms (start: ${startSignIn.toFixed(2)}, end: ${endSignIn.toFixed(2)})`);

      // Strict validation of the authenticated session
      if (error) {
        console.error("FORENSIC: STEP 1 ERROR (auth error):", error);
        throw error;
      }
      
      if (!data?.session || !data?.session?.user) {
        console.error("FORENSIC: STEP 1 ERROR (no session):", data);
        throw new Error('No authenticated user session was returned from the authentication service.');
      }

      console.log("FORENSIC: STEP 2 - Session verified. User ID:", data.user.id);
      
      toast.success('Signed in successfully');
      
      localStorage.setItem('supabase_logged_in_user_id', data.user.id);
      localStorage.setItem('threadzw_owner_email', resolvedEmail.toLowerCase());
      localStorage.setItem('threadzw_logged_in', 'true');
      
      console.log("FORENSIC: STEP 3 - Navigating to /dashboard");
      const startNav = performance.now();
      navigate('/dashboard');
      const endNav = performance.now();
      console.log(`FORENSIC TIMING: Navigation to /dashboard triggered. duration: ${(endNav - startNav).toFixed(2)}ms`);
      
      const endOverall = performance.now();
      console.log(`FORENSIC TIMING: Total login flow execution time: ${(endOverall - startOverall).toFixed(2)}ms`);
    } catch (err: any) {
      console.error("FORENSIC: CATCH BLOCK - Login failed:", err);
      // Clear password field
      setPassword('');
      setShake(true);
      
      // Extract clean error message to show in the UI
      const displayMessage = err?.message || 'The email/username or password you entered is incorrect. Please try again.';
      setLoginError(displayMessage);
      
      // Ensure all local storage session state remains cleared on failure
      localStorage.removeItem('threadzw_logged_in');
      localStorage.removeItem('supabase_logged_in_user_id');
      localStorage.removeItem('threadzw_owner_email');
      localStorage.removeItem('threadzw_owner_name');
    } finally {
      console.log("FORENSIC: FINALLY BLOCK - Setting loading to false");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-hidden z-[45]">
      
      {/* Header with back button */}
      <header className="h-20 px-6 flex items-center justify-between shrink-0 bg-black">
        <button 
          onClick={() => navigate('/')}
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
            <h1 className="text-4xl font-black text-white tracking-tight">Owner Login</h1>
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
                Please check your email/username and try again.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginError(null);
                    setShake(false);
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="flex-1 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-900 text-white font-extrabold text-xs rounded-xl border border-zinc-900 cursor-pointer transition-all"
                >
                  Forgot?
                </button>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <input 
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email or Username"
                className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 px-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-700"
              />
            </div>

            <div className="space-y-1 relative">
              <motion.div
                animate={shake ? { x: [-10, 10, -8, 8, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 pr-10 pl-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-700"
                />
              </motion.div>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-4 text-zinc-500 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 font-medium">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-extrabold text-[#25D366] hover:underline"
            >
              Get Started Free
            </Link>
          </p>

        </div>
      </main>

    </div>
  );
};
