import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Upload, Save, Check, Globe, Layout, Palette, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast as sonnerToast } from 'sonner';

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

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('app_settings').select('*').maybeSingle();
      if (data) setSettings(data);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo_url' | 'favicon_url' | 'og_image_url') => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      sonnerToast.error('File too large. Max 2MB.');
      return;
    }

    setUploading(type);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const path = `branding/${type}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('app-assets').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('app-assets').getPublicUrl(path);
      const newSettings = { ...settings, [type]: publicUrl };
      setSettings(newSettings);
      await supabase.from('app_settings').upsert(newSettings);
      sonnerToast.success(`${type.replace('_', ' ')} updated`);
    } catch (err) {
      sonnerToast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSaveText = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('app_settings').upsert(settings);
      if (error) throw error;
      sonnerToast.success('Branding saved ✓');
    } catch (err) {
      sonnerToast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-10 text-center z-[110]">
       <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
       <p className="text-white/30 text-[10px] font-black uppercase tracking-widest italic">Syncing Style...</p>
    </div>
  );

  return (
    <div className="flex flex-col bg-black min-h-screen text-white font-sans pb-32">
      <header className="px-6 py-8 flex items-center justify-between sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-syne font-black tracking-tighter uppercase leading-none">BRANDING</h1>
            <span className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Foundry</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
           <Palette size={20} />
        </div>
      </header>

      <div className="px-6 py-10 flex flex-col gap-12">
        {/* Identity Section */}
        <section>
          <div className="flex items-center gap-2 mb-8">
             <h3 className="text-xs font-black uppercase tracking-widest text-white/30 italic">Visual Identity</h3>
             <div className="flex-1 h-px bg-white/5" />
          </div>
          
          <div className="flex flex-col gap-8">
             <div className="flex items-center justify-between p-6 rounded-[32px] bg-[#0A0A0A] border border-white/5">
                <div className="flex flex-col gap-1">
                   <span className="text-sm font-bold">Brand Logo</span>
                   <p className="text-[10px] text-white/20 uppercase font-black">SVG or PNG (Max 2MB)</p>
                </div>
                <label className="relative cursor-pointer group">
                   <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 group-hover:bg-white/10 transition-all">
                      {settings.logo_url ? <img src={settings.logo_url} className="w-full h-full object-contain p-2" /> : <Layout size={24} className="opacity-20" />}
                      {uploading === 'logo_url' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-pulse"><Upload size={16} /></div>}
                   </div>
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo_url')} />
                </label>
             </div>

             <div className="flex flex-col p-6 rounded-[32px] bg-[#0A0A0A] border border-white/5 gap-6">
                <div className="flex flex-col gap-1">
                   <span className="text-sm font-bold">Social Preview (OG)</span>
                   <p className="text-[10px] text-white/20 uppercase font-black">Appearance on WhatsApp / FB</p>
                </div>
                <label className="relative cursor-pointer group w-full aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:bg-white/10">
                   {settings.og_image_url ? <img src={settings.og_image_url} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="opacity-10" />}
                   {uploading === 'og_image_url' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-pulse"><Upload size={24} /></div>}
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'og_image_url')} />
                </label>
             </div>
          </div>
        </section>

        {/* Messaging Section */}
        <section>
          <div className="flex items-center gap-2 mb-8">
             <h3 className="text-xs font-black uppercase tracking-widest text-white/30 italic">Global Messaging</h3>
             <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="flex flex-col gap-6 p-8 rounded-[40px] bg-[#0A0A0A] border border-white/5">
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">App Title</label>
               <input 
                 value={settings.app_name}
                 onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                 placeholder="e.g. THREAD ZW"
                 className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 font-bold text-sm outline-none focus:border-primary/50 transition-all placeholder:opacity-20"
               />
             </div>

             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Tagline / Mission</label>
               <textarea 
                 value={settings.app_tagline}
                 onChange={(e) => setSettings({ ...settings, app_tagline: e.target.value })}
                 placeholder="e.g. Elevating Zimbabwe's Fashion Culture"
                 className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:border-primary/50 transition-all resize-none placeholder:opacity-20"
               />
             </div>

             <button 
               onClick={handleSaveText}
               disabled={saving}
               className="w-full h-16 bg-white text-black rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-heavy active:scale-95 transition-all overflow-hidden relative"
             >
               {saving ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <>Update Master Records <Save size={16} /></>}
             </button>
          </div>
        </section>
      </div>
    </div>
  );
};
