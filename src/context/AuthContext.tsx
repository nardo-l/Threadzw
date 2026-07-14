import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  session: any | null
  user: any | null
  profile: any | null
  subscription: any | null
  loading: boolean
  isGuest: boolean
  setIsGuest: (val: boolean) => void
  sessionExpired: boolean
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: any) => Promise<{ error: any | null }>
  uploadAvatar: (file: File) => Promise<{ error: any | null, publicUrl: string | null }>
  updatePassword: (password: string) => Promise<{ error: any | null }>
  resetPassword: (email: string) => Promise<{ error: any | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [subscription, setSubscription] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  const handleProfileAndSubscriptionLoading = async (activeSession: any) => {
    const userId = activeSession.user.id;
    console.log("[LOGIN] [FORENSIC-AUTH] handleProfileAndSubscriptionLoading START for user ID:", userId);
    try {
      // 1. Fetch Profile
      console.log("[LOGIN] [FORENSIC-AUTH] STEP 1 PROFILE: Querying profiles table for user ID:", userId);
      const tProfile0 = performance.now();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      const tProfile1 = performance.now();
      console.log(`[LOGIN] [FORENSIC-AUTH] STEP 1 PROFILE Response received in ${(tProfile1 - tProfile0).toFixed(2)}ms. Data:`, profileData, "Error:", profileError);

      if (profileError) {
        console.error("[LOGIN] [FORENSIC-AUTH] Error loading profile:", profileError);
      } else if (profileData) {
        console.log("[LOGIN] [FORENSIC-AUTH] Setting profile state with data:", profileData);
        setProfile({
          ...profileData,
          town: profileData.style_preferences?.town || 'Harare'
        });
      } else {
        console.log("[LOGIN] [FORENSIC-AUTH] Profiles table returned null. Using fallback basic profile state.");
        // Fallback basic profile creation state if user is logged in but table row isn't ready
        setProfile({
          id: userId,
          display_name: activeSession.user.user_metadata?.full_name || 'ThreadZW Merchant',
          email: activeSession.user.email,
          onboarding_complete: false
        });
      }

      // 2. Fetch Subscription
      console.log("[LOGIN] [FORENSIC-AUTH] STEP 2 SUB: Querying subscriptions table for user ID:", userId);
      const tSub0 = performance.now();
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();
      const tSub1 = performance.now();
      console.log(`[LOGIN] [FORENSIC-AUTH] STEP 2 SUB Response received in ${(tSub1 - tSub0).toFixed(2)}ms. Data:`, subData, "Error:", subError);

      if (subError) {
        console.error("[LOGIN] [FORENSIC-AUTH] Supabase error loading subscription:", subError);
        setSubscription(null);
      } else {
        console.log("[LOGIN] [FORENSIC-AUTH] Setting subscription state with data:", subData);
        setSubscription(subData);
      }

    } catch (err) {
      console.error("[LOGIN] [FORENSIC-AUTH] Exception caught during profile/subscription loading:", err);
      setProfile(null);
      setSubscription(null);
    } finally {
      console.log("[LOGIN] [FORENSIC-AUTH] handleProfileAndSubscriptionLoading FINALLY block reached.");
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log("[LOGIN] [FORENSIC-AUTH] AuthProvider mounted. Setting up session listeners.");

    // Initial session fetch
    const initSession = async () => {
      console.log("[LOGIN] [FORENSIC-AUTH] initSession starting...");
      try {
        console.log("[LOGIN] [FORENSIC-AUTH] Calling supabase.auth.getSession...");
        const t0 = performance.now();
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        const t1 = performance.now();
        console.log(`[LOGIN] [FORENSIC-AUTH] supabase.auth.getSession returned in ${(t1 - t0).toFixed(2)}ms. Session:`, !!initialSession);
        
        if (!mounted) {
          console.log("[LOGIN] [FORENSIC-AUTH] initSession returned but component is unmounted.");
          return;
        }

        if (initialSession) {
          console.log("[LOGIN] [FORENSIC-AUTH] Initial session active. Setting session and loading profile/subscription...");
          setSession(initialSession);
          await handleProfileAndSubscriptionLoading(initialSession);
        } else {
          console.log("[LOGIN] [FORENSIC-AUTH] No initial session found.");
          setSession(null);
          setProfile(null);
          setSubscription(null);
        }
      } catch (err) {
        console.error("[LOGIN] [FORENSIC-AUTH] initSession error:", err);
        if (mounted) {
          setSession(null);
          setProfile(null);
          setSubscription(null);
        }
      } finally {
        if (mounted) {
          console.log("[LOGIN] [FORENSIC-AUTH] initSession finished. Setting loading state to false.");
          setLoading(false);
        }
      }
    };

    initSession();

    console.log("[LOGIN] [FORENSIC-AUTH] Subscribing to supabase.auth.onAuthStateChange...");
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`[LOGIN] [FORENSIC-AUTH] onAuthStateChange event received. Event: "${event}", hasSession: ${!!currentSession}`);
      if (!mounted) {
        console.log("[LOGIN] [FORENSIC-AUTH] onAuthStateChange callback received but component is unmounted.");
        return;
      }
      
      try {
        if (currentSession) {
          console.log("[LOGIN] [FORENSIC-AUTH] Setting session and loading profile/subscription for event:", event);
          setLoading(true);
          setSession(currentSession);
          await handleProfileAndSubscriptionLoading(currentSession);
        } else {
          console.log("[LOGIN] [FORENSIC-AUTH] No session active for event:", event);
          setSession(null);
          setProfile(null);
          setSubscription(null);
        }
      } catch (authChangeErr) {
        console.error("[LOGIN] [FORENSIC-AUTH] Error in onAuthStateChange callback:", authChangeErr);
      } finally {
        console.log("[LOGIN] [FORENSIC-AUTH] Setting loading state to false in onAuthStateChange.");
        setLoading(false);
      }
    });

    return () => {
      console.log("[LOGIN] [FORENSIC-AUTH] AuthProvider unmounting. Cleaning up listener.");
      mounted = false;
      authSub.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setProfile({
          ...data,
          town: data.style_preferences?.town || 'Harare'
        });
      }
    } catch (e) {
      console.error("fetchProfile error:", e);
    }
  }

  const updateProfile = async (updates: any) => {
    if (!session?.user?.id) return { error: new Error('Not logged in') };
    try {
      const dbUpdates = { ...updates };
      if ('town' in dbUpdates) {
        dbUpdates.style_preferences = {
          ...(profile?.style_preferences || {}),
          town: dbUpdates.town
        };
        delete dbUpdates.town;
      }
      const { error } = await supabase.from('profiles').upsert({ id: session.user.id, ...dbUpdates });
      if (error) throw error;
      
      setProfile((prev: any) => ({ ...prev, ...updates }));
      return { error: null };
    } catch (error: any) {
      console.error("updateProfile error:", error);
      return { error };
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      if (!session?.user?.id) throw new Error('Not logged in');
      
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${session.user.id}/avatar-${Date.now()}.${ext}`;
      let publicUrl = '';

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      publicUrl = data.publicUrl;

      return { error: null, publicUrl };
    } catch (error: any) {
      return { error, publicUrl: null };
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error) {
      return { error };
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl =
        window.location.hostname === 'localhost'
          ? 'http://localhost:5173/auth/confirm'
          : 'https://threadzw.vercel.app/auth/confirm';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    setSession(null)
    setProfile(null)
    setSubscription(null)
    setIsGuest(false)
    setSessionExpired(false)
    
    // Clear local storage items cached for onboarding/user details
    localStorage.removeItem('threadzw_logged_in')
    localStorage.removeItem('supabase_logged_in_user_id')
    localStorage.removeItem('threadzw_onboarding_complete')
    localStorage.removeItem('threadzw_onboarding_step')
    localStorage.removeItem('threadzw_onboarding_states')
    localStorage.removeItem('threadzw_owner_name')
    localStorage.removeItem('threadzw_first_login_overlay_shown')
    localStorage.removeItem('threadzw_shop_onboarding_first_time')
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      subscription,
      loading,
      isGuest,
      setIsGuest,
      sessionExpired,
      signOut,
      fetchProfile,
      updateProfile,
      uploadAvatar,
      updatePassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
