import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, Check, Eye, EyeOff, Lock, User, AtSign, Loader2, Pencil, X, HelpCircle, Info, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
    <div className="flex flex-col min-h-screen bg-cream">
      {/* Header */}
      <header 
        className="p-8 flex items-center justify-between border-b-8 border-charcoal sticky top-0 backdrop-blur-xl z-[102] bg-white/80"
      >
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)} 
            className="w-14 h-14 rounded-[20px] bg-white border-4 border-charcoal flex items-center justify-center text-charcoal active:scale-90 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)]"
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic">Protocol Config</span>
             <h1 className="text-4xl font-display font-black text-charcoal italic tracking-tighter leading-none uppercase">Neural Edit</h1>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving || !name || !handle}
          className="px-8 h-14 bg-lime border-4 border-charcoal text-charcoal font-display font-black uppercase italic tracking-tight text-lg rounded-[20px] shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={24} className="animate-spin" /> : 'COMMIT'}
        </button>
      </header>

      <main className="flex-1 flex flex-col p-10 gap-12 overflow-y-auto no-scrollbar pb-32">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div 
              onClick={() => {
                setShowAvatarPicker(true);
                fetchPresetAvatars();
              }}
              className="w-44 h-44 rounded-[54px] border-8 border-charcoal bg-white p-2 relative active:scale-95 transition-all shadow-[20px_20px_0_#C6FF00] group-hover:translate-y-[-4px] group-hover:shadow-[24px_24px_0_#C6FF00] cursor-pointer"
            >
              <div className="w-full h-full rounded-[44px] overflow-hidden bg-cream flex items-center justify-center border-4 border-charcoal/5">
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl || undefined}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                    alt="Profile"
                  />
                ) : (
                  <User size={64} className="text-charcoal/20" strokeWidth={3} />
                )}
              </div>

              {/* Edit icon overlay */}
              <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-[20px] bg-lime border-4 border-charcoal flex items-center justify-center text-charcoal shadow-[6px_6px_0_rgba(0,0,0,1)] group-hover:scale-110 transition-transform">
                <Pencil size={24} strokeWidth={4} />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#C6FF00] italic">Avatar Sync Required</span>
             <p className="text-charcoal/30 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Select from archives or upload capture</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3 group">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic pl-4 group-focus-within:text-[#C6FF00] transition-colors">Neural Alias</label>
            <div className="relative">
              <input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Identity Label"
                className="w-full bg-white border-4 border-charcoal rounded-[32px] p-8 text-2xl font-display font-black italic text-charcoal tracking-tight focus:bg-white focus:shadow-[12px_12px_0_#C6FF00] transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 group">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic pl-4 group-focus-within:text-[#C6FF00] transition-colors">Digital Handle</label>
            <div className="relative">
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-display font-black text-charcoal/20">@</span>
              <input 
                value={handle}
                onChange={e => setHandle(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="handle_sync"
                className="w-full bg-white border-4 border-charcoal rounded-[32px] p-8 pl-16 text-2xl font-display font-black italic text-charcoal tracking-tight focus:bg-white focus:shadow-[12px_12px_0_#C6FF00] transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 group">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic pl-4 group-focus-within:text-[#C6FF00] transition-colors">Cipher Protocol</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border-4 border-charcoal rounded-[32px] p-8 text-2xl font-display font-black italic text-charcoal tracking-tight focus:bg-white focus:shadow-[12px_12px_0_#C6FF00] transition-all outline-none"
              />
              <button 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-charcoal active:scale-90 transition-all hover:text-[#C6FF00]"
              >
                {showPassword ? <EyeOff size={24} strokeWidth={3} /> : <Eye size={24} strokeWidth={3} />}
              </button>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/20 italic pl-4">Maintain vacancy to preserve existing cipher</p>
          </div>
        </div>

        {/* Support Section */}
        <div className="flex flex-col gap-6 pt-6">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic pl-4">Knowledge Base</label>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {}}
              className="w-full bg-white border-4 border-charcoal rounded-[32px] p-8 flex items-center justify-between group active:translate-y-[4px] transition-all shadow-[8px_8px_0_rgba(0,0,0,0.05)] hover:shadow-[12px_12px_0_rgba(0,0,0,0.05)]"
            >
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-[16px] bg-charcoal/5 flex items-center justify-center text-charcoal group-hover:bg-lime transition-colors">
                     <Info size={24} strokeWidth={3} />
                  </div>
                  <span className="text-xl font-display font-black text-charcoal italic uppercase tracking-tight">Technical Support</span>
               </div>
               <ChevronRight size={24} className="text-charcoal/20 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
            </button>
            <button
               onClick={() => navigate('/how-to-use')}
               className="w-full bg-white border-4 border-charcoal rounded-[32px] p-8 flex items-center justify-between group active:translate-y-[4px] transition-all shadow-[8px_8px_0_rgba(0,0,0,0.05)] hover:shadow-[12px_12px_0_rgba(0,0,0,0.05)]"
            >
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-[16px] bg-charcoal/5 flex items-center justify-center text-charcoal group-hover:bg-lime transition-colors">
                     <HelpCircle size={24} strokeWidth={3} />
                  </div>
                  <span className="text-xl font-display font-black text-charcoal italic uppercase tracking-tight">Operational Guide</span>
               </div>
               <ChevronRight size={24} className="text-charcoal/20 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
            </button>
          </div>
        </div>
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
              className="fixed inset-0 z-[300] backdrop-blur-xl bg-charcoal/20"
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%', x: '-50%' }}
              animate={{ y: 0, x: '-50%' }}
              exit={{ y: '100%', x: '-50%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[301] bg-white border-x-8 border-t-8 border-charcoal rounded-t-[54px] p-10 pb-16 flex flex-col max-h-[90vh] overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.2)]"
            >
              {/* Drag Handle */}
              <div className="flex justify-center mb-10">
                <div className="w-16 h-2 rounded-full bg-charcoal/10" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic">Archetype Selector</span>
                   <h3 className="text-4xl font-display font-black text-charcoal italic uppercase tracking-tighter leading-none">NODE AVATAR</h3>
                </div>
                <button 
                  onClick={handleCloseAvatarPicker}
                  className="w-14 h-14 rounded-[20px] bg-white border-4 border-charcoal flex items-center justify-center text-charcoal shadow-[4px_4px_0_rgba(0,0,0,1)] active:scale-90 transition-all"
                >
                  <X size={24} strokeWidth={4} />
                </button>
              </div>
              
              <div className="mb-10 flex gap-4 overflow-x-auto no-scrollbar pb-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-shrink-0 flex items-center gap-4 px-8 py-5 rounded-[24px] border-4 border-charcoal bg-lime text-charcoal font-display font-black uppercase italic tracking-tight text-xl shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} strokeWidth={3} />}
                  Capture Custom
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="flex items-center gap-3 mb-6 pl-2">
                 <div className="w-2 h-2 rounded-full bg-[#C6FF00] animate-pulse" />
                 <p className="text-[10px] uppercase font-black tracking-widest text-charcoal italic">Neural Presets Detected:</p>
              </div>
              
              {/* Scrollable Grid */}
              <div className="flex-1 overflow-y-auto px-2 pb-12 no-scrollbar">
                {/* Current Selection Preview */}
                {(selectedAvatar && selectedAvatar !== avatarUrl) && (
                  <div className="flex items-center justify-between gap-6 mb-10 bg-cream border-4 border-dashed border-charcoal/20 p-6 rounded-[32px]">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-[28px] border-4 p-1 border-charcoal/10 bg-white">
                        <img 
                          src={avatarUrl || undefined} 
                          className="w-full h-full rounded-[22px] object-cover bg-cream"
                          alt="current"
                        />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black uppercase text-charcoal/30 italic">Active</span>
                         <span className="font-display font-black text-charcoal italic uppercase tracking-tighter">PREVIOUS</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center w-12 h-12 bg-charcoal rounded-full text-lime">
                      <ArrowLeft size={24} className="rotate-180" strokeWidth={4} />
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col text-right">
                         <span className="text-[9px] font-black uppercase text-[#C6FF00] italic">New Protocol</span>
                         <span className="font-display font-black text-charcoal italic uppercase tracking-tighter">PENDING</span>
                      </div>
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 rounded-[28px] border-4 p-1 border-[#C6FF00] bg-white shadow-[6px_6px_0_#C6FF00]"
                      >
                        <img 
                          src={selectedAvatar || undefined} 
                          className="w-full h-full rounded-[22px] object-cover bg-cream"
                          alt="selected"
                        />
                      </motion.div>
                    </div>
                  </div>
                )}

                {loadingAvatars ? (
                  <div className="grid grid-cols-4 gap-6">
                    {[...Array(12)].map((_, i) => (
                      <div 
                        key={`profile-avatar-shimmer-${i}`} 
                        className="aspect-square rounded-[24px] animate-pulse bg-charcoal/5 border-4 border-dashed border-charcoal/10"
                      />
                    ))}
                  </div>
                ) : presetAvatars.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-6 border-8 border-dashed border-charcoal/5 rounded-[48px]">
                    <div className="text-6xl grayscale opacity-20">😶</div>
                    <div className="flex flex-col gap-2">
                       <p className="text-2xl font-display font-black text-charcoal/30 italic uppercase tracking-tighter">Archives Expired</p>
                       <p className="text-[10px] font-black text-charcoal/10 uppercase tracking-widest italic">Sync failed or no datasets found</p>
                    </div>
                    <button 
                      onClick={() => fetchPresetAvatars(true)}
                      className="px-10 py-5 bg-charcoal text-white font-display font-black uppercase italic tracking-tighter text-xl rounded-[24px] shadow-[8px_8px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all"
                    >
                      Retry Pulse
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-6">
                    {presetAvatars.map((avatar, i) => {
                      const isCurrent = avatarUrl === avatar.url;
                      const isSelected = selectedAvatar === avatar.url;
                      
                      return (
                        <div key={`preset-avatar-${i}-${avatar.name}`} className="relative group/btn">
                          <button
                            onClick={() => setSelectedAvatar(avatar.url)}
                            className={`relative aspect-square w-full rounded-[28px] overflow-hidden transition-all duration-300 active:scale-90 border-4 ${isSelected || (isCurrent && !selectedAvatar) ? 'border-[#C6FF00] shadow-[6px_6px_0_#C6FF00] -translate-y-1' : 'border-charcoal hover:border-lime group-hover/btn:translate-y-[-2px]'}`}
                          >
                            <img 
                              src={avatar.url || undefined} 
                              className="w-full h-full object-cover bg-cream transition-transform group-hover/btn:scale-110"
                              onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                              alt={avatar.name}
                            />
                            <div className={`absolute inset-0 bg-[#C6FF00]/20 transition-opacity ${isSelected || (isCurrent && !selectedAvatar) ? 'opacity-100' : 'opacity-0'}`} />
                          </button>
                          {(isSelected || (isCurrent && !selectedAvatar)) && (
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-[12px] border-2 flex items-center justify-center bg-lime border-charcoal shadow-[2px_2px_0_rgba(0,0,0,1)] z-10">
                              <Check size={16} strokeWidth={4} className="text-charcoal" />
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
                className="mt-auto pt-10 border-t-4 border-charcoal bg-white flex flex-col gap-4"
              >
                <button
                  disabled={!selectedAvatar || selectedAvatar === avatarUrl || savingAvatar}
                  onClick={handleSaveAvatar}
                  className="w-full h-24 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-4xl rounded-[32px] shadow-[12px_12px_0_#C6FF00] active:translate-y-[6px] active:shadow-none transition-all flex items-center justify-center gap-6 disabled:opacity-40 disabled:shadow-none disabled:active:translate-y-0 disabled:bg-charcoal/10"
                >
                  {savingAvatar ? (
                     <>
                        <Loader2 size={32} className="animate-spin" strokeWidth={3} />
                        <span className="animate-pulse">SETTING...</span>
                     </>
                  ) : (
                    <>SAVE SELECTION <Check size={28} strokeWidth={4} /></>
                  )}
                </button>
                
                <button 
                  onClick={handleCloseAvatarPicker}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.4em] text-center text-charcoal/20 italic hover:text-[#C6FF00] transition-colors"
                >
                  Terminate Probe
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
