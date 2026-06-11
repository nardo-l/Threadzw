import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, MapPin, Clock, Globe, Instagram, MessageCircle, ChevronRight, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface ShopSetupProps {
  myShop: any;
  onComplete: () => void;
}

export const ShopSetup: React.FC<ShopSetupProps> = ({ myShop, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    category: '',
    description: '',
    area: '',
    landmark: '',
    directions: '',
    is_online_only: false,
    instagram: '',
    delivery_info: '',
    trading_hours: {
      Mon: { open: '08:00', close: '17:00' },
      Tue: { open: '08:00', close: '17:00' },
      Wed: { open: '08:00', close: '17:00' },
      Thu: { open: '08:00', close: '17:00' },
      Fri: { open: '08:00', close: '17:00' },
      Sat: { open: '09:00', close: '15:00' },
      Sun: { closed: true }
    }
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const categories = ['Streetwear', 'Formal', 'Footwear', 'Vintage', 'Accessories', 'Beauty'];
  const areas = ['Harare CBD', 'Avondale', 'Arundel', 'Borrowdale', 'Msasa', 'Mbare', 'Bulawayo', 'Mutare', 'Gweru', 'Online Only'];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate Handle
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('handle', formData.handle.toLowerCase())
        .neq('id', myShop.id)
        .maybeSingle();

      if (existingShop) {
        toast.error('Handle is already taken', { style: { background: '#ef4444', color: 'white' } });
        setStep(1);
        setLoading(false);
        return;
      }

      let logoUrl = myShop.logo_url;
      let bannerUrl = myShop.banner_url;

      if (avatarFile) {
        logoUrl = await uploadImage(avatarFile, 'shop-avatars', `${myShop.id}/logo_${Date.now()}`);
      }
      if (bannerFile) {
        bannerUrl = await uploadImage(bannerFile, 'shop-banners', `${myShop.id}/banner_${Date.now()}`);
      }

      const updatedFields = {
        name: formData.name,
        handle: formData.handle.toLowerCase(),
        slug: formData.handle.toLowerCase(),
        categories: [formData.category],
        description: formData.description,
        location: `${formData.area}${formData.landmark ? `, ${formData.landmark}` : ''}${formData.directions ? ` (${formData.directions})` : ''}`,
        instagram: formData.instagram,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        setup_complete: true,
        is_live: true
      };

      const { error: updateError } = await supabase
        .from('shops')
        .update(updatedFields)
        .eq('id', myShop.id);

      if (updateError) throw updateError;

      // Update local storage cache to keep details in sync immediately
      const mergedShop = { ...myShop, ...updatedFields };
      localStorage.setItem('threadzw_shop', JSON.stringify(mergedShop));
      if (myShop.owner_id) {
        localStorage.setItem(`shop_${myShop.owner_id}`, JSON.stringify(mergedShop));
      }

      toast.success('Shop setup complete!', { style: { background: '#22c55e', color: 'white' } });
      onComplete();
    } catch (err) {
      console.error('Error setting up shop:', err);
      toast.error('Failed to save shop details', { style: { background: '#ef4444', color: 'white' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col pt-10">
      {/* Header */}
      <div className="px-6 flex justify-between items-center mb-8">
        <div>
          <h2 className="text-white font-bold text-[24px]">Setup Your Shop</h2>
          <p className="text-[#888] text-[14px]">Let's get your store looking professional.</p>
        </div>
        <div className="text-[#C6FF00] font-bold text-[14px] bg-[#C6FF001A] px-3 py-1 rounded-full">
          Step {step}/3
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
        {step === 1 && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-6"
          >
            {/* Visuals */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div 
                  className="w-24 h-24 rounded-full bg-[#111] border-2 border-[#222] overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => document.getElementById('logo-input')?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="text-[#333]" size={32} />
                  )}
                </div>
                <input id="logo-input" type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#C6FF00] rounded-full flex items-center justify-center text-white border-4 border-black">
                  <Camera size={14} />
                </div>
              </div>
              <p className="text-[#888] text-[12px] mt-2">Shop Logo</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white font-bold text-[13px] block mb-2">Shop Name</label>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. KickZone Harare"
                  className="w-full h-12 bg-[#111] border border-[#222] rounded-[10px] px-4 text-white text-[15px] focus:outline-none focus:border-[#C6FF00]"
                />
              </div>
              <div>
                <label className="text-white font-bold text-[13px] block mb-2">Shop Handle (@name)</label>
                <input 
                  value={formData.handle}
                  onChange={(e) => setFormData({...formData, handle: e.target.value})}
                  placeholder="kickzone_zw"
                  className="w-full h-12 bg-[#111] border border-[#222] rounded-[10px] px-4 text-white text-[15px] focus:outline-none focus:border-[#C6FF00]"
                />
              </div>
              <div>
                <label className="text-white font-bold text-[13px] block mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button 
                      key={c}
                      onClick={() => setFormData({...formData, category: c})}
                      className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all
                        ${formData.category === c ? 'bg-[#C6FF00] text-white' : 'bg-[#111] border border-[#333] text-[#888]'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-white font-bold text-[13px] block mb-2">Short Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What do you sell?"
                  className="w-full h-24 bg-[#111] border border-[#222] rounded-[10px] p-4 text-white text-[14px] focus:outline-none focus:border-[#C6FF00] resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div>
                <label className="text-white font-bold text-[13px] block mb-2">Area / Suburb</label>
                <div className="flex flex-wrap gap-2">
                  {areas.map(a => (
                    <button 
                      key={a}
                      onClick={() => setFormData({...formData, area: a})}
                      className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all
                        ${formData.area === a ? 'bg-[#C6FF00] text-white' : 'bg-[#111] border border-[#333] text-[#888]'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-white font-bold text-[13px] block mb-2">Nearest Landmark</label>
                <input 
                  value={formData.landmark}
                  onChange={(e) => setFormData({...formData, landmark: e.target.value})}
                  placeholder="e.g. Opposite Joina City"
                  className="w-full h-12 bg-[#111] border border-[#222] rounded-[10px] px-4 text-white text-[15px] focus:outline-none focus:border-[#C6FF00]"
                />
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="online-only"
                  checked={formData.is_online_only}
                  onChange={(e) => setFormData({...formData, is_online_only: e.target.checked})}
                  className="w-5 h-5 accent-[#C6FF00]"
                />
                <label htmlFor="online-only" className="text-white text-[14px]">Online Only / Delivery Based</label>
              </div>
              {!formData.is_online_only && (
                <div>
                  <label className="text-white font-bold text-[13px] block mb-2">Detailed Directions</label>
                  <textarea 
                    value={formData.directions}
                    onChange={(e) => setFormData({...formData, directions: e.target.value})}
                    placeholder="e.g. First floor, Room 102..."
                    className="w-full h-24 bg-[#111] border border-[#222] rounded-[10px] p-4 text-white text-[14px] focus:outline-none focus:border-[#C6FF00] resize-none"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-6"
          >
            <div>
              <label className="text-white font-bold text-[13px] block mb-3">Shop Banner (Optional)</label>
              <div 
                className="w-full aspect-[21/9] rounded-[16px] bg-[#111] border border-[#222] border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => document.getElementById('banner-input')?.click()}
              >
                {bannerPreview ? (
                  <img src={bannerPreview} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="text-[#333] mb-2" size={24} />
                    <span className="text-[#444] text-[12px]">Top profile banner</span>
                  </>
                )}
              </div>
              <input id="banner-input" type="file" hidden accept="image/*" onChange={handleBannerChange} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white font-bold text-[13px] block mb-2">Instagram Handle</label>
                <div className="flex items-center bg-[#111] border border-[#222] rounded-[10px] px-4 focus-within:border-[#C6FF00]">
                  <span className="text-[#444] mr-1">@</span>
                  <input 
                    value={formData.instagram}
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                    placeholder="my_shop_page"
                    className="flex-1 h-12 bg-transparent text-white text-[15px] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-white font-bold text-[13px] block mb-2">Delivery Info</label>
                <textarea 
                  value={formData.delivery_info}
                  onChange={(e) => setFormData({...formData, delivery_info: e.target.value})}
                  placeholder="e.g. Free delivery in Hre CBD, $5 outside..."
                  className="w-full h-24 bg-[#111] border border-[#222] rounded-[10px] p-4 text-white text-[14px] focus:outline-none focus:border-[#C6FF00] resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-md border-t border-[#1a1a1a] flex gap-3">
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="flex-1 h-14 bg-[#111] border border-[#222] rounded-full text-white font-bold"
          >
            Back
          </button>
        )}
        <button 
          disabled={loading || (step === 1 && (!formData.name || !formData.handle || !formData.category))}
          onClick={() => {
            if (step < 3) setStep(step + 1);
            else handleSubmit();
          }}
          className={`h-14 bg-linear-to-r from-[#9B27AF] to-[#C6FF00] rounded-full text-white font-bold transition-all flex items-center justify-center gap-2
            ${step === 1 ? 'w-full' : 'flex-[2]'} 
            ${(loading || (step === 1 && (!formData.name || !formData.handle || !formData.category))) ? 'opacity-50 grayscale' : ''}`}
        >
          {loading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
          ) : step === 3 ? 'Launch My Shop!' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};
