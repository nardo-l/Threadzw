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

const initializeProfileInDatabase = async (user: any) => {
  console.log("FORENSIC: AuthContext - Running database profile initialization for user:", user.id);
  const rawEmail = user.email || '';
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

  console.log("FORENSIC: AuthContext - Selected unique handle for new profile:", uniqueHandle);

  const newProfileData = {
    id: user.id,
    email: rawEmail.toLowerCase(),
    display_name: user.user_metadata?.display_name || emailPrefix || 'ThreadZW Merchant',
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
    console.error("FORENSIC: Failed to initialize profile in database:", initError);
    throw initError;
  }

  return createdProfile;
};

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
      console.log("FORENSIC: AuthContext initSession starting");
      // Create a generous 30.0 second timeout promise for initial session fetch
      const sessionTimeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase initial response timeout")), 30000)
      );

      try {
        console.log("FORENSIC: AuthContext - Calling supabase.auth.getSession");
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          sessionTimeoutPromise
        ]) as any;
        console.log("FORENSIC: AuthContext - getSession completed:", sessionResult);

        const initialSession = sessionResult?.data?.session;

        if (mounted) {
          if (initialSession) {
            console.log("FORENSIC: AuthContext - Session found on init. User ID:", initialSession.user?.id);
            setSession(initialSession);
            localStorage.setItem('threadzw_logged_in', 'true');
            if (initialSession.user?.id) {
              localStorage.setItem('supabase_logged_in_user_id', initialSession.user.id);
            }
            // Fetch profile with its own 30.0 second timeout protection
            const profileTimeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error("Supabase profile fetch timeout")), 30000)
            );
            try {
              console.log("FORENSIC: AuthContext - Fetching profile for user:", initialSession.user.id);
              const profileResult = await Promise.race([
                supabase.from('profiles').select('*').eq('id', initialSession.user.id).maybeSingle(),
                profileTimeoutPromise
              ]) as any;
              console.log("FORENSIC: AuthContext - Profile fetch completed:", profileResult);
              
              if (profileResult?.error) {
                throw profileResult.error;
              }

              const profileCheck = profileResult?.data;
              if (profileCheck) {
                console.log("FORENSIC: AuthContext - Profile loaded:", profileCheck);
                setProfile({
                  ...profileCheck,
                  town: profileCheck.style_preferences?.town || 'Harare'
                });
              } else {
                console.warn("FORENSIC: AuthContext - No profile found in database. Running database profile initialization process.");
                const createdProfile = await initializeProfileInDatabase(initialSession.user);
                if (createdProfile) {
                  setProfile({
                    ...createdProfile,
                    town: createdProfile.style_preferences?.town || 'Harare'
                  });
                } else {
                  throw new Error("Profile initialization process returned no data");
                }
              }
            } catch (profileErr) {
              console.error("FORENSIC: AuthContext - Profile fetch or database initialization failed. No synthetic fallback is set:", profileErr);
              setProfile(null);
            }
          } else {
            console.log("FORENSIC: AuthContext - No initial session found");
            setSession(null);
            setProfile(null);
            localStorage.removeItem('threadzw_logged_in');
            localStorage.removeItem('supabase_logged_in_user_id');
          }
        }
      } catch (e) {
        console.error("FORENSIC: AuthContext - initSession error or timeout (falling back gracefully):", e);
        if (mounted) {
          setSession(null);
          setProfile(null);
          localStorage.removeItem('threadzw_logged_in');
          localStorage.removeItem('supabase_logged_in_user_id');
        }
      } finally {
        if (mounted) {
          console.log("FORENSIC: AuthContext - Setting loading to false in initSession");
          setLoading(false);
        }
      }
    };

    initSession();

    console.log("FORENSIC: AuthContext - Setting up onAuthStateChange listener");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("FORENSIC: AuthContext - onAuthStateChange event triggered:", event, "Session exists:", !!currentSession);
      if (mounted) {
        if (currentSession) {
          console.log("FORENSIC: AuthContext onAuthStateChange - Setting session. User ID:", currentSession.user?.id);
          setSession(currentSession);
          localStorage.setItem('threadzw_logged_in', 'true');
          if (currentSession.user?.id) {
            localStorage.setItem('supabase_logged_in_user_id', currentSession.user.id);
          }
          
          try {
            console.log("FORENSIC: AuthContext onAuthStateChange - Querying profiles table for:", currentSession.user.id);
            
            // Protect the profiles query with a generous 30-second timeout
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .maybeSingle();

            const profileResult = await Promise.race([
              profilePromise,
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Profiles query timed out")), 30000))
            ]) as any;

            if (profileResult?.error) {
              console.error("FORENSIC: AuthContext onAuthStateChange - profiles table query error:", profileResult.error);
              throw profileResult.error;
            }
            console.log("FORENSIC: AuthContext onAuthStateChange - profiles table response:", profileResult?.data);
            
            if (profileResult?.data) {
              setProfile({
                ...profileResult.data,
                town: profileResult.data.style_preferences?.town || 'Harare'
              });
            } else {
              console.warn("FORENSIC: AuthContext onAuthStateChange - Profile not found in database. Running database profile initialization process.");
              const createdProfile = await initializeProfileInDatabase(currentSession.user);
              if (createdProfile) {
                setProfile({
                  ...createdProfile,
                  town: createdProfile.style_preferences?.town || 'Harare'
                });
              } else {
                throw new Error("Profile initialization process returned no data");
              }
            }
          } catch (profileErr) {
            console.error("FORENSIC: AuthContext onAuthStateChange - Profile fetch or database initialization failed. No synthetic fallback is set:", profileErr);
            setProfile(null);
          }
        } else {
          console.log("FORENSIC: AuthContext onAuthStateChange - No session. Clearing session/profile states");
          setSession(null);
          setProfile(null);
          localStorage.removeItem('threadzw_logged_in');
          localStorage.removeItem('supabase_logged_in_user_id');
        }
        console.log("FORENSIC: AuthContext onAuthStateChange - Setting loading to false");
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
    localStorage.removeItem('supabase_logged_in_user_id')
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
