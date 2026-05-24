/*
SQL TO RUN IN SUPABASE:

create table profiles (
  id uuid references auth.users 
  on delete cascade,
  display_name text,
  handle text unique,
  email text,
  avatar_url text,
  onboarding_complete boolean default false,
  personality_type text,
  style_preferences jsonb,
  whatsapp_number text,
  created_at timestamptz 
  default now(),
  primary key (id)
);

alter table profiles enable 
row level security;

create policy "Users can view own profile" on profiles
  for select using (
    auth.uid() = id
  );

create policy "Users can update own profile" on profiles
  for update using (
    auth.uid() = id
  );

create policy "Users can insert own profile" on profiles
  for insert with check (
    auth.uid() = id
  );
*/

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
  const [loading, setLoading] = useState(true) // RULE 1: starts true
  const [isGuest, setIsGuest] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  const fetchProfile = async (userId: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('Profile fetch result:', error)
        if (error.code === 'PGRST116') {
          console.log('Profile missing, attempting to create one for user:', userId);
          await createMissingProfile(userId);
        }
        return
      }

      setProfile(data)
    } catch (err) {
      console.error('Unexpected profile error:', err)
    }
  }

  const createMissingProfile = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('Cannot create profile: No authenticated user found via getUser()');
        return
      }

      console.log('Creating profile for user in auth.users:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          handle: 'user_' + Math.random().toString(36).substring(2, 8),
          email: user.email,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!error && data) {
        setProfile(data)
        console.log('Profile created successfully');
      } else if (error) {
        console.error('Failed to create profile:', error.message, error.details);
      }
    } catch (err) {
      console.error('Profile creation error:', err)
    }
  }

  useEffect(() => {
    let mounted = true

    // RULE 5: Check for existing session on every app load
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return

        if (error) {
          console.error('Session check error details:', error)
          // If refresh token is invalid/not found, we must clear all local state
          if (error.message?.includes('Refresh Token Not Found') || 
              error.message?.includes('invalid refresh token') ||
              error.status === 400) {
            console.warn('Invalid refresh token detected in getSession, clearing local auth state...');
            
            // Clear supabase auth keys from storage
            Object.keys(localStorage).forEach(key => {
              if (key.includes('supabase.auth.token') || key.includes('sb-')) {
                localStorage.removeItem(key);
              }
            });
            
            setSession(null);
            setProfile(null);
          }
        } else {
          console.log(
            'Initial session check:',
            session
              ? '✓ ' + session.user.email
              : '✗ No session'
          )
          setSession(session)
          if (session?.user?.id) {
            fetchProfile(session.user.id)
          }
        }

        // RULE 2: Only stop loading AFTER session check is complete
        setLoading(false)
      })
      .catch(async err => {
        console.error('Session check catch error:', err)
        if (!mounted) return
        setLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return

        console.log(
          'Auth event:', event,
          session?.user?.email || 'none'
        )

        setSession(session)

        if (session?.user?.id) {
          fetchProfile(session.user.id)
          setIsGuest(false)
        } else {
          setProfile(null)
          setIsGuest(false)
        }
        
        if (event === 'TOKEN_REFRESHED' && !session) {
          setSessionExpired(true);
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const updateProfile = async (updates: any) => {
    if (!session?.user?.id) {
      console.warn('UpdateProfile aborted: No active session/user ID');
      return { error: new Error('No session') };
    }
    
    console.log('Attempting profile update for user:', session.user.id, 'with updates:', updates);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: session.user.id, 
          ...updates
        });
      
      if (error) {
        console.error('Supabase updateProfile error:', error.message, error.details, error.hint);
        return { error };
      }
      
      await fetchProfile(session.user.id);
      return { error: null };
    } catch (err: any) {
      console.error('Unexpected updateProfile catch block:', err);
      return { error: err };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!session?.user?.id) return { error: new Error('No session'), publicUrl: null };
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${session.user.id}/avatar-${Date.now()}.${fileExt}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { error: null, publicUrl };
    } catch (error: any) {
      return { error, publicUrl: null };
    }
  };

  const checkHandleAvailability = async (handle: string): Promise<boolean> => {
    if (!handle) return false;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', handle.toLowerCase())
        .maybeSingle();
      return !error && !data;
    } catch {
      return false;
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=set-password`,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Error during sign out:', err)
    } finally {
      // RESET EVERYTHING
      setSession(null)
      setProfile(null)
      setIsGuest(false)
      setSessionExpired(false)
      
      // Cleanup local state - Clear ALL variations of onboarding flags
      const keysToClear = [
        'thread_onboarding_complete',
        'thread_town_selected',
        'thread_style_picked',
        'thread_has_account',
        'thread_user_town',
        'onboarding_slides_done',
        'style_picked',
        'onboardingComplete',
        'thread_selected_town',
        'buyerFlowState',
        'communityScreen'
      ];
      keysToClear.forEach(key => localStorage.removeItem(key));
      
      setLoading(false)
      // Navigation happens automatically via routing logic
    }
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
