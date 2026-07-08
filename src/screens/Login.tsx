// src/screens/Login.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
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

    // Timeout promise for the auth request
    const authTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Authentication request timed out. Please check your network connection.")), 30000)
    );

    try {
      let resolvedEmail = email.trim();
      
      // If the entered email/username doesn't contain '@', it is a handle/username
      if (!resolvedEmail.includes('@')) {
        console.log("FORENSIC: Input does not contain '@'. Resolving username/handle:", resolvedEmail);
        const lowerHandle = resolvedEmail.toLowerCase();
        
        // Query profiles table for matching handle
        console.log("FORENSIC: STEP 0.1 - Querying profiles table for handle:", lowerHandle);
        const profileLookupPromise = supabase
          .from('profiles')
          .select('email, handle')
          .eq('handle', lowerHandle)
          .maybeSingle();

        const profileResult = await Promise.race([
          profileLookupPromise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Username lookup timed out")), 30000))
        ]) as any;

        if (profileResult?.error) {
          console.error("FORENSIC: STEP 0.1 ERROR - Profile query failed:", profileResult.error);
        }

        if (profileResult?.data?.email) {
          resolvedEmail = profileResult.data.email;
          console.log("FORENSIC: STEP 0.1 SUCCESS - Resolved handle directly in profiles table to email:", resolvedEmail);
        } else {
          // If profile not found, search in shops table for matching handle or name
          console.log("FORENSIC: STEP 0.2 - Profile handle not found. Querying shops table for handle/slug:", lowerHandle);
          const shopLookupPromise = supabase
            .from('shops')
            .select('owner_id, name, handle')
            .or(`handle.eq.${lowerHandle},slug.eq.${lowerHandle}`)
            .maybeSingle();

          const shopResult = await Promise.race([
            shopLookupPromise,
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Shop lookup timed out")), 30000))
          ]) as any;

          if (shopResult?.error) {
            console.error("FORENSIC: STEP 0.2 ERROR - Shop query failed:", shopResult.error);
          }

          if (shopResult?.data?.owner_id) {
            console.log("FORENSIC: STEP 0.2 SUCCESS - Found shop owner ID. Querying owner's profile:", shopResult.data.owner_id);
            const ownerLookupPromise = supabase
              .from('profiles')
              .select('email')
              .eq('id', shopResult.data.owner_id)
              .maybeSingle();

            const ownerResult = await Promise.race([
              ownerLookupPromise,
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Owner profile lookup timed out")), 30000))
            ]) as any;

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

      console.log("FORENSIC: STEP 1 - Calling supabase.auth.signInWithPassword for email:", resolvedEmail);
      const signInPromise = supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password
      });

      const { data, error } = await Promise.race([
        signInPromise,
        authTimeout
      ]) as any;

      console.log("FORENSIC: STEP 1 COMPLETE - signInWithPassword response:", { data, error });

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
      
      // Verify or initialize the profile record in the database before completing login flow
      console.log("FORENSIC: STEP 2.1 - Fetching or initializing profile for user ID:", data.user.id);
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      const profileResult = await Promise.race([
        profilePromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Loading profile from database timed out")), 30000))
      ]) as any;

      if (profileResult?.error) {
        console.error("FORENSIC: STEP 2.1 ERROR - Profile query failed:", profileResult.error);
        throw new Error(`Profile query failed: ${profileResult.error.message || 'Unknown database error'}`);
      }

      const profileCheck = profileResult?.data;
      if (!profileCheck) {
        console.warn("FORENSIC: STEP 2.1 - Profile is genuinely missing in database. Creating profile through initialization process.");
        
        // Generate a base unique handle from email or user ID
        const rawEmail = data.user.email || '';
        const emailPrefix = rawEmail.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase();
        let baseHandle = emailPrefix || 'merchant';
        if (baseHandle.length < 3) {
          baseHandle += '_user';
        }
        
        // Ensure handle is unique by checking if it already exists in profiles
        let uniqueHandle = baseHandle;
        let isUnique = false;
        let suffix = 0;
        
        while (!isUnique && suffix < 10) {
          const testHandle = suffix === 0 ? uniqueHandle : `${uniqueHandle}${suffix}`;
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('handle', testHandle)
            .maybeSingle();
          
          if (checkError) {
            console.error("FORENSIC: Profile handle uniqueness check error:", checkError);
            throw checkError;
          }

          if (!existingProfile) {
            uniqueHandle = testHandle;
            isUnique = true;
          } else {
            suffix++;
          }
        }
        if (!isUnique) {
          uniqueHandle = `${uniqueHandle}_${Math.floor(1000 + Math.random() * 9000)}`;
        }

        console.log("FORENSIC: STEP 2.1 - Selected unique handle for new profile:", uniqueHandle);

        const newProfileData = {
          id: data.user.id,
          email: rawEmail.toLowerCase(),
          display_name: data.user.user_metadata?.display_name || emailPrefix || 'ThreadZW Merchant',
          handle: uniqueHandle,
          onboarding_complete: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdProfile, error: initError } = await supabase
          .from('profiles')
          .insert(newProfileData)
          .select('*')
          .maybeSingle();

        if (initError) {
          console.error("FORENSIC: STEP 2.1 ERROR - Failed to initialize profile in database:", initError);
          throw new Error(`Failed to initialize profile in database: ${initError.message || 'Unknown database error'}`);
        }

        console.log("FORENSIC: STEP 2.1 SUCCESS - Profile successfully initialized in database:", createdProfile);
      } else {
        console.log("FORENSIC: STEP 2.1 SUCCESS - Profile verified in database:", profileCheck);
      }

      toast.success('Signed in successfully');
      
      localStorage.setItem('supabase_logged_in_user_id', data.user.id);
      localStorage.setItem('threadzw_owner_email', resolvedEmail.toLowerCase());
      localStorage.setItem('threadzw_logged_in', 'true');
      
      console.log("FORENSIC: STEP 3 - Navigating to /dashboard");
      navigate('/dashboard');
      console.log("FORENSIC: STEP 3 COMPLETE - Navigation triggered");
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
    <div style={{
      minHeight: '100svh',
      background: '#000000',
      maxWidth: 430,
      margin: '0 auto',
      padding: '40px 24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#ffffff'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-1.5px',
          margin: '0 0 8px'
        }}>
          ThreadZW
        </h1>
        <p style={{
          fontSize: 14,
          color: '#a1a1aa',
          margin: 0
        }}>
          SaaS Business Platform
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#ffffff',
            margin: 0
          }}>
            Owner Login
          </h2>
          <p style={{
            fontSize: 14,
            color: '#a1a1aa',
            margin: 0
          }}>
            Sign in to manage your storefront
          </p>
        </div>

        {loginError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '15px' }}>
              ❌ Incorrect email or password
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
              Please check your credentials and try again.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setShake(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#C6FF00',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Forgot Password?
              </button>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#a1a1aa'
            }}>
              Business Email or Username
            </label>
            <input 
              type="text"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@yourshop.com or username"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 15,
                border: loginError ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                outline: 'none',
                background: '#121215',
                color: '#ffffff'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#a1a1aa'
            }}>
              Password
            </label>
            <motion.div
              animate={shake ? { x: [-10, 10, -8, 8, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              style={{ position: 'relative' }}
            >
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  paddingRight: 44,
                  fontSize: 15,
                  border: loginError ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  outline: 'none',
                  background: '#121215',
                  color: '#ffffff'
                }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </motion.div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              marginTop: 12,
              padding: '15px',
              background: '#C6FF00',
              color: '#000000',
              border: 'none',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: 14,
          color: '#a1a1aa',
          marginTop: 12
        }}>
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            style={{
              fontWeight: 800,
              color: '#C6FF00',
              textDecoration: 'none'
            }}
          >
            Get Started Free
          </Link>
        </p>
      </div>
    </div>
  );
};
