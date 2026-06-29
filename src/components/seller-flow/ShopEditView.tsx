import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useInventory } from '../../context/InventoryContext';
import { ChevronLeft, Camera, Edit2, Plus, X, Save, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ZIMBABWE_TOWNS } from '../../constants';

interface ShopEditViewProps {
  myShop: any;
  onUpdate: () => void;
}

const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM'
];

const DEFAULT_HOURS = {
  monday:    { open: true,  openTime: '8:00 AM', closeTime: '6:00 PM' },
  tuesday:   { open: true,  openTime: '8:00 AM', closeTime: '6:00 PM' },
  wednesday: { open: true,  openTime: '8:00 AM', closeTime: '6:00 PM' },
  thursday:  { open: true,  openTime: '8:00 AM', closeTime: '6:00 PM' },
  friday:    { open: true,  openTime: '8:00 AM', closeTime: '6:00 PM' },
  saturday:  { open: true,  openTime: '8:00 AM', closeTime: '5:00 PM' },
  sunday:    { open: false, openTime: '9:00 AM', closeTime: '3:00 PM' }
};

export const ShopEditView: React.FC<ShopEditViewProps> = ({ myShop, onUpdate }) => {
  const { setSellerFlowState } = useInventory();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState(myShop?.name || '');
  const [description, setDescription] = useState(myShop?.description || '');
  const [town, setTown] = useState(myShop?.location || myShop?.town || '');
  const [directions, setDirections] = useState(myShop?.directions || '');
  const [whatsapp, setWhatsapp] = useState(myShop?.whatsapp_number || myShop?.whatsapp || '');
  const [instagram, setInstagram] = useState(myShop?.instagram || '');
  
  const [bannerPreview, setBannerPreview] = useState<string | null>(myShop?.banner_url || null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(myShop?.avatar_url || myShop?.logo_url || null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [tradingHours, setTradingHours] = useState(myShop?.trading_hours_json || DEFAULT_HOURS);
  
  const [showTownPicker, setShowTownPicker] = useState(false);
  const [townSearch, setTownSearch] = useState('');
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const formatTradingHours = (hours: any) => {
    const daysArr = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayAbbr: any = {
      monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
      friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
    };
    
    const lines = [];
    let rangeStart = null;
    let rangeHours = null;
    
    daysArr.forEach((day, index) => {
      const h = hours[day];
      const dayName = dayAbbr[day];
      
      if (!h.open) {
        if (rangeStart !== null) {
          lines.push(
            rangeStart === dayAbbr[daysArr[index-1]]
              ? `${rangeStart}: ${rangeHours}`
              : `${rangeStart}–${dayAbbr[daysArr[index-1]]}: ${rangeHours}`
          );
          rangeStart = null;
          rangeHours = null;
        }
        lines.push(`${dayName}: Closed`);
      } else {
        const hoursStr = `${h.openTime}–${h.closeTime}`;
        
        if (rangeHours === hoursStr) {
          // Continue
        } else {
          if (rangeStart !== null) {
            lines.push(
              rangeStart === dayAbbr[daysArr[index-1]]
                ? `${rangeStart}: ${rangeHours}`
                : `${rangeStart}–${dayAbbr[daysArr[index-1]]}: ${rangeHours}`
            );
          }
          rangeStart = dayName;
          rangeHours = hoursStr;
        }
      }
      
      if (index === daysArr.length - 1 && rangeStart !== null) {
        lines.push(
          rangeStart === dayName
            ? `${rangeStart}: ${rangeHours}`
            : `${rangeStart}–${dayName}: ${rangeHours}`
        );
      }
    });
    
    return lines.join('\n');
  };

  const uploadFile = async (file: File, bucket: string, shopId: string, prefix: string) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const path = `${shopId}/${prefix}_${Date.now()}.${ext}`;
    
    // Try primary bucket, fallback to 'shop-banners' if bucket not found
    let targetBucket = bucket;
    
    const { error } = await supabase.storage
      .from(targetBucket)
      .upload(path, file, { contentType: file.type });
    
    if (error) {
      if (error.message?.includes('Bucket not found') && targetBucket !== 'shop-banners') {
        // Fallback to shop-banners if the specific bucket is missing
        const { error: fallbackError } = await supabase.storage
          .from('shop-banners')
          .upload(path, file, { contentType: file.type });
        
        if (fallbackError) throw fallbackError;
        targetBucket = 'shop-banners';
      } else {
        throw error;
      }
    }
    
    const { data } = supabase.storage.from(targetBucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Shop name is required');
      return;
    }

    setLoading(true);
    try {
      let finalBannerUrl = myShop.banner_url || null;
      let finalAvatarUrl = myShop.avatar_url || myShop.logo_url || null;

      if (bannerFile) {
        try {
          finalBannerUrl = await uploadFile(bannerFile, 'shop-banners', myShop.id, 'banner');
        } catch (uploadErr: any) {
          console.error('Banner upload failed:', uploadErr);
          toast.error('Banner upload failed. Using existing.');
        }
      }
      
      if (avatarFile) {
        try {
          finalAvatarUrl = await uploadFile(avatarFile, 'shop-avatars', myShop.id, 'avatar');
        } catch (uploadErr: any) {
          console.error('Avatar upload failed:', uploadErr);
          toast.error('Avatar upload failed. Using existing.');
        }
      }

      const formattedHours = formatTradingHours(tradingHours);

      const { error } = await supabase
        .from('shops')
        .update({
          name,
          description,
          location: town, 
          whatsapp_number: whatsapp,
          instagram,
          banner_url: finalBannerUrl,
          logo_url: finalAvatarUrl
        })
        .eq('id', myShop.id);

      if (error) throw error;
      
      toast.success('Shop updated! ✓');
      // Cleanup URLs
      if (bannerFile) URL.revokeObjectURL(bannerPreview!);
      if (avatarFile) URL.revokeObjectURL(avatarPreview!);
      
      onUpdate();
      setSellerFlowState('live');
    } catch (err: any) {
      console.error(err);
      toast.error('Could not update shop: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Banner must be less than 5MB');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Avatar must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const applyToAll = (openTime: string, closeTime: string) => {
    const newHours = { ...tradingHours };
    Object.keys(newHours).forEach(day => {
      if (newHours[day as keyof typeof tradingHours].open) {
        newHours[day as keyof typeof tradingHours] = {
          ...newHours[day as keyof typeof tradingHours],
          openTime,
          closeTime
        };
      }
    });
    setTradingHours(newHours);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-30 px-4 py-4 flex items-center border-b border-[#1a1a1a]">
        <button onClick={() => setSellerFlowState('live')} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="flex-1 text-center font-bold text-[17px]">Edit Your Shop</h1>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-[#C6FF00] text-white px-4 py-1.5 rounded-full font-bold text-[13px] shadow-lg disabled:opacity-50"
        >
          {loading ? '...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* BANNER & AVATAR EDIT SECTION */}
        <div className="mb-14">
          <div 
            onClick={() => bannerInputRef.current?.click()}
            className="w-full h-[140px] bg-[#111] border border-dashed border-[#333] rounded-[14px] overflow-hidden relative cursor-pointer"
          >
            {bannerPreview ? (
              <img 
                src={bannerPreview} 
                className="w-full h-full object-cover" 
                alt="Banner preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Camera className="text-[#444] mb-2" />
                <span className="text-[#888] text-[13px] font-bold">Add Banner</span>
              </div>
            )}
            
            <div className="absolute bottom-[10px] right-[10px] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-white text-[11px] font-bold">✏️ Change</span>
            </div>
            
            <input 
              type="file"
              ref={bannerInputRef}
              onChange={handleBannerSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* AVATAR UPLOAD */}
          <div className="relative flex justify-center -mt-10">
            <div 
              onClick={() => avatarInputRef.current?.click()}
              className="w-20 h-20 rounded-full border-[3px] border-black overflow-hidden relative cursor-pointer bg-gradient-to-tr from-[#9B27AF] to-[#C6FF00] flex items-center justify-center shadow-xl"
            >
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  className="w-full h-full object-cover" 
                  alt="Avatar preview"
                />
              ) : (
                <Plus className="text-white w-7 h-7" strokeWidth={3} />
              )}
              
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#C6FF00] rounded-full border-2 border-black flex items-center justify-center">
                <Edit2 className="text-white w-2.5 h-2.5" />
              </div>
              
              <input 
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Shop Basic Details */}
          <div>
            <h3 className="text-white font-bold text-[15px] mb-4">Basic Info</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[#888] text-[11px] uppercase font-bold mb-1.5 block">Shop Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 bg-[#111] border border-[#222] rounded-[12px] px-4 text-[15px] focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div>
                <label className="text-[#888] text-[11px] uppercase font-bold mb-1.5 block">Description / Headline</label>
                <textarea 
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Premium sneakers in Mutare"
                  className="w-full bg-[#111] border border-[#222] rounded-[12px] p-4 text-[15px] focus:border-[#C6FF00] outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div>
            <h3 className="text-white font-bold text-[15px] mb-4">Location</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[#888] text-[11px] uppercase font-bold mb-1.5 block">Town</label>
                <button 
                  type="button"
                  onClick={() => setShowTownPicker(true)}
                  className="w-full h-12 bg-[#111] border border-[#222] rounded-[12px] px-4 text-[15px] flex items-center justify-between text-left focus:border-[#C6FF00] outline-none"
                >
                  <span className={town ? 'text-white' : 'text-[#444]'}>{town || 'Select Town'}</span>
                  <Edit2 size={14} className="text-[#888]" />
                </button>
              </div>

              <div>
                <label className="text-[#888] text-[11px] uppercase font-bold mb-1.5 block">Directions / Landmark</label>
                <input 
                  type="text"
                  value={directions}
                  onChange={(e) => setDirections(e.target.value)}
                  placeholder="e.g. Next to OK Supermarket"
                  className="w-full h-12 bg-[#111] border border-[#222] rounded-[12px] px-4 text-[15px] focus:border-[#C6FF00] outline-none"
                />
              </div>
            </div>
          </div>

          {/* TRADING HOURS PICKER */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-[15px]">Trading Hours</h3>
            </div>
            
            <div className="bg-[#111] border border-[#222] rounded-[16px] overflow-hidden">
              {Object.keys(tradingHours).map((day, index, arr) => {
                const h = tradingHours[day as keyof typeof tradingHours];
                const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
                
                return (
                  <div key={day} className={`p-4 ${index !== arr.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}>
                    <div className="flex items-center">
                      <button 
                        onClick={() => setTradingHours((prev: any) => ({ 
                          ...prev, 
                          [day]: { ...prev[day], open: !prev[day].open } 
                        }))}
                        className={`w-9 h-5 rounded-full relative transition-all duration-300 ${h.open ? 'bg-[#C6FF00]' : 'bg-[#333]'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${h.open ? 'left-5' : 'left-1'}`} />
                      </button>
                      
                      <span className="text-white font-bold text-[14px] ml-2.5">{dayCapitalized}</span>
                      
                      {!h.open ? (
                        <span className="ml-auto text-[#666] text-[12px] font-bold">Closed</span>
                      ) : (
                        <div className="ml-auto flex items-center gap-2">
                          <select 
                            value={h.openTime}
                            onChange={(e) => setTradingHours((prev: any) => ({ 
                              ...prev, 
                              [day]: { ...prev[day], openTime: e.target.value } 
                            }))}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-[11px] rounded-lg px-2 py-1 outline-none"
                          >
                            {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <span className="text-[#444] text-[10px]">to</span>
                          <select 
                            value={h.closeTime}
                            onChange={(e) => setTradingHours((prev: any) => ({ 
                              ...prev, 
                              [day]: { ...prev[day], closeTime: e.target.value } 
                            }))}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-[11px] rounded-lg px-2 py-1 outline-none"
                          >
                            {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-4 px-1">
              <span className="text-[#666] text-[11px]">Apply to open days:</span>
              <div className="flex gap-2">
                {[{ label: '8–5', o: '8:00 AM', c: '5:00 PM' }, { label: '8–8', o: '8:00 AM', c: '8:00 PM' }].map(p => (
                  <button
                    key={p.label}
                    onClick={() => applyToAll(p.o, p.c)}
                    className="bg-[#1a1a1a] text-[#888] text-[11px] font-bold px-3 py-1.5 rounded-full border border-[#2a2a2a]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Social Details */}
          <div>
            <h3 className="text-white font-bold text-[15px] mb-4">Contact Info</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[#888] text-[11px] uppercase font-bold mb-1.5 block">WhatsApp Number</label>
                <input 
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+263..."
                  className="w-full h-12 bg-[#111] border border-[#222] rounded-[12px] px-4 text-[15px] focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div>
                <label className="text-[#888] text-[11px] uppercase font-bold mb-1.5 block">Instagram Handle</label>
                <input 
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@myshop"
                  className="w-full h-12 bg-[#111] border border-[#222] rounded-[12px] px-4 text-[15px] focus:border-[#C6FF00] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full h-14 bg-linear-to-r from-[#9B27AF] to-[#C6FF00] text-white font-bold rounded-full mt-12 flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all"
        >
          {loading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
          ) : (
            <>Save Changes</>
          )}
        </button>
      </div>

      {/* Town Picker */}
      <AnimatePresence>
        {showTownPicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
              onClick={() => setShowTownPicker(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 bg-[#0d0d0d] rounded-t-[32px] z-[101] flex flex-col max-h-[85vh] border-t border-[#222]"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white text-xl font-bold">Select Town</h3>
                  <button onClick={() => setShowTownPicker(false)} className="p-2">
                    <X size={20} className="text-white" />
                  </button>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={18} />
                  <input 
                    type="text"
                    value={townSearch}
                    onChange={(e) => setTownSearch(e.target.value)}
                    placeholder="Search town..."
                    className="w-full h-12 bg-[#111] border border-[#222] rounded-[14px] pl-11 pr-4 text-white placeholder:text-[#444] focus:border-[#C6FF00] outline-none"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto no-scrollbar space-y-2 pb-10">
                  {ZIMBABWE_TOWNS.filter(t => t.toLowerCase().includes(townSearch.toLowerCase())).map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => {
                        setTown(t);
                        setShowTownPicker(false);
                        setTownSearch('');
                      }}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all ${
                        town === t ? 'bg-[#C6FF00] text-white' : 'bg-[#111] text-[#888] border border-[#222]'
                      }`}
                    >
                      <span className="font-bold">{t}</span>
                      {town === t && <Check size={18} />}
                    </button>
                  ))}
                  {ZIMBABWE_TOWNS.filter(t => t.toLowerCase().includes(townSearch.toLowerCase())).length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-[#444] text-[14px]">No towns found for "{townSearch}"</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

