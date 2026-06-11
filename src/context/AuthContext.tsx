import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  session: any | null
  user: any | null
  profile: any | null
  loading: boolean
  isGuest: boolean
  setIsGuest: (val: boolean) => void
  sessionExpired: boolean
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: any) => Promise<{ error: any | null }>
  uploadAvatar: (file: File) => Promise<{ error: any | null, publicUrl: string | null }>
  checkHandleAvailability: (handle: string) => Promise<boolean>
  updatePassword: (password: string) => Promise<{ error: any | null }>
  resetPassword: (email: string) => Promise<{ error: any | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      // Create a 2.5 second timeout promise
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase initial response timeout")), 2500)
      );

      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]) as any;

        const initialSession = sessionResult?.data?.session;

        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            localStorage.setItem('threadzw_logged_in', 'true');
            // Fetch profile with timeout protection
            try {
              const profileResult = await Promise.race([
                supabase.from('profiles').select('*').eq('id', initialSession.user.id).maybeSingle(),
                timeoutPromise
              ]) as any;
              
              const profileCheck = profileResult?.data;
              if (profileCheck) {
                setProfile({
                  ...profileCheck,
                  town: profileCheck.style_preferences?.town || 'Harare'
                });
              } else {
                setProfile(initialSession.user);
              }
            } catch (profileErr) {
              console.warn("Profile fetch timed out, falling back to basic user info:", profileErr);
              setProfile(initialSession.user);
            }
          } else {
            setSession(null);
            setProfile(null);
            localStorage.removeItem('threadzw_logged_in');
          }
        }
      } catch (e) {
        console.error("Auth initSession error or timeout:", e);
        if (mounted) {
          setSession(null);
          setProfile(null);
          localStorage.removeItem('threadzw_logged_in');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (mounted) {
        if (currentSession) {
          setSession(currentSession);
          localStorage.setItem('threadzw_logged_in', 'true');
          try {
            const { data: profileCheck } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .maybeSingle();
            
            if (profileCheck) {
              setProfile({
                ...profileCheck,
                town: profileCheck.style_preferences?.town || 'Harare'
              });
            } else {
              setProfile(currentSession.user);
            }
          } catch (profileErr) {
            console.warn("Profile fetch in auth state change error:", profileErr);
            setProfile(currentSession.user);
          }
        } else {
          setSession(null);
          setProfile(null);
          localStorage.removeItem('threadzw_logged_in');
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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

  const checkHandleAvailability = async (handle: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from('shops').select('handle').eq('handle', handle).maybeSingle();
      if (error) return false;
      return !data;
    } catch {
      return false;
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
      const { error } = await supabase.auth.resetPasswordForEmail(email);
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
    setIsGuest(true)
    setSessionExpired(false)
    localStorage.removeItem('threadzw_logged_in')
    localStorage.removeItem('threadzw_onboarding_complete')
    localStorage.removeItem('threadzw_onboarding_step')
    localStorage.removeItem('threadzw_onboarding_states')
    localStorage.removeItem('threadzw_owner_name')
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isGuest,
      setIsGuest,
      sessionExpired,
      signOut,
      fetchProfile,
      updateProfile,
      uploadAvatar,
      checkHandleAvailability,
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
