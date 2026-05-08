import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, Check, Eye, EyeOff, Lock, User, AtSign, Loader2, Pencil, X, HelpCircle, Info, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, useThemeControl } from '../App';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { mapError } from '../lib/utils';
import { Sun, Moon, Monitor } from 'lucide-react';

/*
RUN THIS IN SUPABASE SQL EDITOR
IF UPLOAD STILL FAILS:

-- Drop existing policies first
drop policy if exists 
  "avatars: authenticated upload" 
  on storage.objects;

drop policy if exists 
  "avatars: public read" 
  on storage.objects;

-- Recreate policies
create policy 
  "avatars: public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy 
  "avatars: authenticated upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = 
    (storage.foldername(name))[1]
  );

create policy
  "avatars: authenticated update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = 
    (storage.foldername(name))[1]
  );

create policy
  "avatars: authenticated delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = 
    (storage.foldername(name))[1]
  );
*/

export const EditProfile: React.FC = () => {
  const t = useTheme();
  const { themeMode, setThemeMode } = useThemeControl();
  const navigate = useNavigate();
  const { session, user, profile, updateProfile, updatePassword, uploadAvatar, checkHandleAvailability } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(profile?.display_name || '');
  const [handle, setHandle] = useState(profile?.handle || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // NEW STATE:
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [presetAvatars, setPresetAvatars] = useState<any[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max 2MB');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading photo...');

    try {
      console.log('Starting custom upload using uploadAvatar service...');
      const { error, publicUrl } = await uploadAvatar(file);
      
      if (error) {
        console.error('Upload failed:', error.message, error.details);
        toast.error('Upload failed: ' + mapError(error), { id: toastId });
        return;
      }

      if (publicUrl) {
        console.log('Upload successful. URL:', publicUrl);
        setAvatarUrl(publicUrl);
        toast.success('Photo uploaded! Save changes to apply.', { id: toastId });
        setShowAvatarPicker(false);
      }
    } catch (err: any) {
      console.error('Unexpected upload error:', err);
      toast.error('Something went wrong', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setName(prev => prev || profile.display_name || '');
      setHandle(prev => prev || profile.handle || '');
      setAvatarUrl(prev => prev || profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  // Toast wrapper
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  const fetchPresetAvatars = async (isRetry = false) => {
    // Don't refetch if already loaded and not a forcing retry
    if (presetAvatars.length > 0 && !isRetry) return;
    
    setLoadingAvatars(true);
    
    try {
      console.log('Fetching avatars from bucket: avatars-preset');
      
      const fetchFromBucket = async (bucketName: string) => {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list('', {
            limit: 100,
            offset: 0
          });
        if (error) throw error;
        return data;
      };

      let data;
      let bucketUsed = 'avatars-preset';
      
      try {
        data = await fetchFromBucket('avatars-preset');
        if (!data || data.length === 0) {
           console.log('avatars-preset empty, trying fallback bucket: avatars');
           data = await fetchFromBucket('avatars');
           bucketUsed = 'avatars';
        }
      } catch (e) {
        console.warn('Failed to fetch from avatars-preset, trying avatars:', e);
        data = await fetchFromBucket('avatars');
        bucketUsed = 'avatars';
      }
      
      if (!data || data.length === 0) {
        console.warn('No files found in either avatars-preset or avatars buckets');
        setPresetAvatars([]);
        setLoadingAvatars(false);
        return;
      }
      
      // Filter image files only (case insensitive)
      const imageFiles = data.filter(
        (file: any) => {
          if (!file.name || file.name === '.emptyFolderPlaceholder') return false;
          
          const name = file.name.toLowerCase();
          return name.endsWith('.png') ||
                 name.endsWith('.jpg') ||
                 name.endsWith('.jpeg') ||
                 name.endsWith('.webp') ||
                 name.endsWith('.svg') ||
                 name.endsWith('.avif');
        }
      );
      
      if (imageFiles.length === 0) {
        setPresetAvatars([]);
        setLoadingAvatars(false);
        return;
      }
      
      // Get public URL for each file
      const avatarUrls = imageFiles.map(
        (file: any) => {
          const { data: urlData } = supabase.storage
            .from(bucketUsed)
            .getPublicUrl(file.name);
          
          return {
            name: file.name,
            url: urlData?.publicUrl
          };
        }
      ).filter((item: any) => item.url);
      
      setPresetAvatars(avatarUrls);
      
    } catch (err: any) {
      console.error('Avatar fetch error:', err);
      showToast(mapError(err), 'error');
    } finally {
      setLoadingAvatars(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return;
    if (selectedAvatar === avatarUrl) {
      setShowAvatarPicker(false);
      return;
    }
    
    setSavingAvatar(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: selectedAvatar
        })
        .eq('id', session.user.id);
      
      if (error) {
        console.error('Avatar save error:', error);
        showToast('Could not save avatar. Please try again.', 'error');
        return;
      }
      
      // Update local profile state via updateProfile if needed or just set locally
      setAvatarUrl(selectedAvatar);
      
      // Close the picker
      setShowAvatarPicker(false);
      setSelectedAvatar(null);
      
      // Success toast
      showToast('Avatar updated ✓', 'success');
      
    } catch (err) {
      console.error('Unexpected error:', err);
      showToast('Something went wrong. Try again.', 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleCloseAvatarPicker = () => {
    setShowAvatarPicker(false);
    setSelectedAvatar(null);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    // Safety timeout to prevent infinite loading state
    const safetyTimeout = setTimeout(() => {
      setIsSaving(false);
      toast.error('Update is taking longer than expected. Please check your connection.');
    }, 15000);

    try {
      // Validate Handle uniqueness if changed
      if (handle !== profile?.handle) {
        const isAvailable = await checkHandleAvailability(handle);
        if (!isAvailable) {
          toast.error('This handle is already taken');
          clearTimeout(safetyTimeout);
          setIsSaving(false);
          return;
        }
      }

      // Update Profile
      const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_]/g, '').trim();
      const { error: profileError } = await updateProfile({
        display_name: name,
        handle: cleanHandle,
        avatar_url: avatarUrl
      });

      if (profileError) throw profileError;

      // Update Password if provided
      if (newPassword && newPassword.length >= 6) {
        const { error: passError } = await updatePassword(newPassword);
        if (passError) throw passError;
      }

      toast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error: any) {
      console.error('Save profile error:', error);
      toast.error(mapError(error));
    } finally {
      clearTimeout(safetyTimeout);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: t.bg_primary }}>
      {/* Header */}
      <header 
        className="p-6 flex items-center gap-4 border-b sticky top-0 backdrop-blur-xl z-10"
        style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
      >
        <button onClick={() => navigate(-1)} style={{ color: t.text_tertiary }}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-syne font-bold" style={{ color: t.text_primary }}>Edit Profile</h1>
      </header>

      <main className="flex-1 flex flex-col p-6 gap-8 overflow-y-auto no-scrollbar">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div 
              onClick={() => {
                setShowAvatarPicker(true);
                fetchPresetAvatars();
              }}
              style={{ 
                cursor: 'pointer',
                boxShadow: showAvatarPicker ? `0 0 0 3px ${t.accent}66` : 'none',
                background: t.accent
              }}
              className="w-32 h-32 rounded-full p-1 relative active:scale-95 transition-all"
            >
              <div 
                className="w-full h-full rounded-full flex items-center justify-center text-5xl border-4 overflow-hidden relative"
                style={{ background: t.bg_card, borderColor: t.bg_primary }}
              >
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl || undefined}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                    onError={() => setImgError(true)}
                    alt="Profile"
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: t.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={48} className="text-white/20" />
                  </div>
                )}
              </div>

              {/* Edit icon overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: t.gradient,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${t.bg_primary}`,
                zIndex: 5
              }}>
                <Pencil size={14} className="text-white" />
              </div>
            </div>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Tap photo to change</p>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Form */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest ml-1" style={{ color: t.text_tertiary }}>Full Name</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: t.text_tertiary }}>
                <User size={18} />
              </div>
              <input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full border-2 rounded-2xl p-5 pl-12 outline-none focus:border-primary transition-all"
                style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary, '--tw-ring-color': t.accent } as any}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest ml-1" style={{ color: t.text_tertiary }}>@handle</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: t.text_tertiary }}>
                <AtSign size={18} />
              </div>
              <input 
                value={handle}
                onChange={e => setHandle(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="your_handle"
                className="w-full border-2 rounded-2xl p-5 pl-12 outline-none focus:border-primary transition-all"
                style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary, '--tw-ring-color': t.accent } as any}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest ml-1" style={{ color: t.text_tertiary }}>Password</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: t.text_tertiary }}>
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 rounded-2xl p-5 pl-12 outline-none focus:border-primary transition-all"
                style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary, '--tw-ring-color': t.accent } as any}
              />
              <button 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 hover:text-white"
                style={{ color: t.text_tertiary }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-tighter ml-1 opacity-50" style={{ color: t.text_tertiary }}>Leave blank to keep current password</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving || !name || !handle}
          className={`mt-6 w-full py-5 rounded-pill font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            isSaving ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 text-white'
          }`}
          style={{ 
            background: isSaving ? t.bg_card : t.accent,
            boxShadow: isSaving ? 'none' : t.shadow
          }}
        >
          {isSaving ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check size={20} /> Save Changes
            </>
          )}
        </button>

        {/* Appearance Section */}
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-[10px] font-mono uppercase tracking-widest ml-1" style={{ color: t.text_tertiary }}>Appearance</p>
          <div className="rounded-[24px] border p-1 grid grid-cols-3 gap-1 shadow-sm" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
            {[
              { id: 'light', label: 'Light', icon: <Sun size={16} /> },
              { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
              { id: 'system', label: 'System', icon: <Monitor size={16} /> }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setThemeMode(mode.id as any)}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-bold transition-all relative overflow-hidden"
                style={{ 
                  background: themeMode === mode.id ? t.bg_primary : 'transparent',
                  color: themeMode === mode.id ? t.text_primary : t.text_tertiary,
                  border: themeMode === mode.id ? `1px solid ${t.border_secondary}` : '1px solid transparent'
                }}
              >
                {mode.icon}
                {mode.label}
                {themeMode === mode.id && (
                  <motion.div 
                    layoutId="theme-pill"
                    className="absolute inset-0 z-[-1]"
                    style={{ background: t.bg_primary }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-[10px] font-mono uppercase tracking-widest ml-1" style={{ color: t.text_tertiary }}>Support & Help</p>
          <div className="rounded-[24px] border overflow-hidden" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
            <button
              onClick={() => {}}
              className="w-full flex items-center gap-4 p-5 hover:bg-white/5 transition-all text-left border-b group"
              style={{ borderColor: t.border_secondary }}
            >
              <div className="p-2 rounded-lg group-hover:text-white transition-colors" style={{ background: t.bg_primary, color: t.text_tertiary }}>
                <Info size={18} />
              </div>
              <span className="flex-1 text-sm font-medium" style={{ color: t.text_primary }}>Help & Support</span>
              <ChevronRight size={18} style={{ color: `${t.text_tertiary}80` }} />
            </button>
            <button
              onClick={() => navigate('/how-to-use')}
              className="w-full flex items-center gap-4 p-5 transition-all text-left group"
              style={{ background: t.bg_card }}
            >
              <div className="p-2 rounded-lg group-hover:text-white transition-colors" style={{ background: t.bg_primary, color: t.text_tertiary }}>
                <HelpCircle size={18} />
              </div>
              <span className="flex-1 text-sm font-medium" style={{ color: t.text_primary }}>How to Use Thread ZW</span>
              <ChevronRight size={18} style={{ color: `${t.text_tertiary}80` }} />
            </button>
          </div>
        </div>

        <div className="pb-10" />
      </main>

      {/* Avatar Picker Bottom Sheet */}
      <AnimatePresence>
        {showAvatarPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseAvatarPicker}
              className="fixed inset-0 z-[300] backdrop-blur-sm"
              style={{ background: t.overlay }}
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[20px] z-[301] flex flex-col overflow-hidden border-t shadow-2xl"
              style={{ background: t.bg_primary, borderColor: t.border_secondary }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: t.border_secondary }} />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-2 pb-1">
                <h3 className="text-lg font-bold" style={{ color: t.text_primary }}>Choose Your Avatar</h3>
                <button 
                  onClick={handleCloseAvatarPicker}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: t.bg_card, color: t.text_primary }}
                >
                  <X size={14} />
                </button>
              </div>
              
              <div className="px-6 mb-5 flex gap-2 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 disabled:opacity-50 border"
                  style={{ background: `${t.accent}15`, borderColor: `${t.accent}30`, color: t.accent }}
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  Upload Custom
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <p className="px-6 text-[10px] uppercase font-bold tracking-widest mb-3" style={{ color: t.text_tertiary }}>Or pick a preset:</p>
              
              {/* Scrollable Grid */}
              <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
                {/* Current Selection Preview */}
                {(selectedAvatar && selectedAvatar !== avatarUrl) && (
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full border-2 p-0.5" style={{ borderColor: `${t.accent}4D` }}>
                        <img 
                          src={avatarUrl || undefined} 
                          className="w-full h-full rounded-full object-cover" 
                          style={{ background: t.bg_card }}
                          alt="current"
                        />
                      </div>
                      <span className="text-[8px] uppercase font-bold" style={{ color: t.text_tertiary }}>Current</span>
                    </div>
                    
                    <div className="flex items-center" style={{ color: t.text_tertiary }}>
                      <ArrowLeft size={14} className="rotate-180" />
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-12 h-12 rounded-full border-2 p-0.5"
                        style={{ borderColor: t.accent }}
                      >
                        <img 
                          src={selectedAvatar || undefined} 
                          className="w-full h-full rounded-full object-cover" 
                          style={{ background: t.bg_card }}
                          alt="selected"
                        />
                      </motion.div>
                      <span className="text-[8px] uppercase font-bold" style={{ color: t.accent }}>New</span>
                    </div>
                  </div>
                )}

                {loadingAvatars ? (
                  <div className="grid grid-cols-4 gap-3">
                    {[...Array(12)].map((_, i) => (
                      <div 
                        key={i} 
                        className="aspect-square rounded-full animate-pulse"
                        style={{ background: t.bg_card }}
                      />
                    ))}
                  </div>
                ) : presetAvatars.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="text-4xl mb-3">😶</span>
                    <p className="text-sm font-bold" style={{ color: t.text_primary }}>No avatars available yet</p>
                    <button 
                      onClick={() => fetchPresetAvatars(true)}
                      className="mt-4 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all"
                      style={{ background: t.bg_card, color: t.text_primary, borderColor: t.border_secondary }}
                    >
                      Tap to Retry
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {presetAvatars.map((avatar, i) => {
                      const isCurrent = avatarUrl === avatar.url;
                      const isSelected = selectedAvatar === avatar.url;
                      
                      return (
                        <div key={i} className="relative flex flex-col items-center">
                          <button
                            onClick={() => setSelectedAvatar(avatar.url)}
                            className={`relative aspect-square w-full rounded-full overflow-hidden transition-all duration-150 active:scale-95 border-2`}
                            style={{ 
                              borderColor: isSelected || (isCurrent && !selectedAvatar) ? t.accent : t.border_secondary,
                              boxShadow: (isSelected || (isCurrent && !selectedAvatar)) ? `0 0 0 2px ${t.accent}4D` : 'none'
                            }}
                          >
                            <img 
                              src={avatar.url || undefined} 
                              className="w-full h-full object-cover"
                              style={{ background: t.bg_card, opacity: 0, transition: 'opacity 0.2s' }}
                              onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                              alt={avatar.name}
                            />
                          </button>
                          {(isSelected || (isCurrent && !selectedAvatar)) && (
                            <div 
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                              style={{ background: t.accent, borderColor: t.bg_primary }}
                            >
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Footer Button */}
              <div 
                className="absolute bottom-0 left-0 right-0 p-5 border-t pb-10"
                style={{ background: t.bg_primary, borderColor: t.border_secondary }}
              >
                <button
                  disabled={!selectedAvatar || selectedAvatar === avatarUrl || savingAvatar}
                  onClick={handleSaveAvatar}
                  className={`w-full py-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    !selectedAvatar || selectedAvatar === avatarUrl
                      ? 'opacity-50 cursor-not-allowed'
                      : 'text-white'
                  }`}
                  style={{ 
                    background: (!selectedAvatar || selectedAvatar === avatarUrl) ? t.bg_card : t.gradient,
                    color: (!selectedAvatar || selectedAvatar === avatarUrl) ? t.text_tertiary : 'white',
                    boxShadow: (!selectedAvatar || selectedAvatar === avatarUrl) ? 'none' : t.shadow
                  }}
                >
                  {savingAvatar ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Save Avatar <Check size={16} /></>
                  )}
                </button>
                
                <button 
                  onClick={handleCloseAvatarPicker}
                  className="w-full mt-4 text-[10px] font-bold uppercase tracking-widest text-center"
                  style={{ color: t.text_tertiary }}
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
