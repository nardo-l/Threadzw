import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Upload, Save, Check, Globe, Layout, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AppSettings {
  logo_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  app_name: string;
  app_tagline: string;
}

export const AppBrandingView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    logo_url: null,
    favicon_url: null,
    og_image_url: null,
    app_name: 'Thread ZW',
    app_tagline: 'The Zimbabwean Fashion Marketplace'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching app settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo_url' | 'favicon_url' | 'og_image_url') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Max 2MB.');
      return;
    }

    setUploading(type);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const path = `branding/${type}_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(path);

      const newSettings = { ...settings, [type]: publicUrl };
      setSettings(newSettings);

      // Update DB immediately for asset uploads
      await supabase
        .from('app_settings')
        .upsert(newSettings);

      // Trigger dynamic update if it's icon or OG
      if (type === 'favicon_url' || type === 'logo_url') {
        updateFavicon(publicUrl);
      }
      if (type === 'og_image_url') {
        updateOGImage(publicUrl);
      }

    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Check console.');
    } finally {
      setUploading(null);
    }
  };

  const updateFavicon = (url: string) => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);

    const appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement || document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = url;
    document.getElementsByTagName('head')[0].appendChild(appleIcon);
  };

  const updateOGImage = (url: string) => {
    const metaNames = ['og:image', 'twitter:image'];
    metaNames.forEach(name => {
      const meta = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`) as HTMLMetaElement || document.createElement('meta');
      if (name === 'og:image') meta.setAttribute('property', name);
      else meta.setAttribute('name', name);
      meta.content = url;
      document.getElementsByTagName('head')[0].appendChild(meta);
    });
  };

  const handleSaveText = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert(settings);
      if (error) throw error;
      alert('Settings saved!');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-white">Loading branding...</div>;

  return (
    <div className="flex flex-col bg-black min-h-screen text-white pb-32">
      <div className="p-5 flex items-center justify-between border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <Palette className="text-[#FF2D78]" size={20} />
          <h2 className="font-bold text-[18px]">App Branding</h2>
        </div>
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Logo Section */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-widest text-white/50">App Logo</h3>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-white/5 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center relative group">
              {settings.logo_url ? (
                <img src={settings.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
              ) : (
                <Layout size={32} className="text-white/20" />
              )}
              {uploading === 'logo_url' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#FF2D78] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <label className="bg-white text-black font-bold text-xs px-6 py-2.5 rounded-full cursor-pointer hover:bg-white/90 active:scale-95 transition-all">
              {settings.logo_url ? 'Replace Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo_url')} />
            </label>
            <p className="text-[10px] text-white/30 text-center uppercase tracking-tighter">
              Used in header, login, and favicon (2MB max)
            </p>
          </div>
        </div>

        {/* OG Image Section */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-widest text-white/50">SEO / OG Image</h3>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="aspect-video bg-white/5 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center relative">
              {settings.og_image_url ? (
                <img src={settings.og_image_url} className="w-full h-full object-cover" alt="OG Preview" />
              ) : (
                <Globe size={40} className="text-white/20" />
              )}
              {uploading === 'og_image_url' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white/50">
                  <div className="w-6 h-6 border-2 border-[#FF2D78] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <label className="border border-white/20 text-white font-bold text-xs px-6 py-2.5 rounded-full cursor-pointer hover:bg-white/5 active:scale-95 transition-all">
                {settings.og_image_url ? 'Change Social Image' : 'Upload Social Image'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'og_image_url')} />
              </label>
            </div>
            <p className="text-[10px] text-white/30 text-center uppercase tracking-tighter">
              Dimensions: 1200x630 suggested for WhatsApp & FB sharing
            </p>
          </div>
        </div>

        {/* Text Settings */}
        <div className="space-y-6 bg-[#111] border border-white/10 rounded-2xl p-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Application Name</label>
            <input 
              value={settings.app_name}
              onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF2D78]/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">App Tagline</label>
            <input 
              value={settings.app_tagline}
              onChange={(e) => setSettings({ ...settings, app_tagline: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF2D78]/50 transition-all"
            />
          </div>
          <button 
            onClick={handleSaveText}
            disabled={saving}
            className="w-full py-4 bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Save Copy Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};
