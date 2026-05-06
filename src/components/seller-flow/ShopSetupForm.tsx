import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useInventory } from '../../context/InventoryContext';
import { ChevronLeft, Camera, Edit2, Plus, X, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ZIMBABWE_TOWNS } from '../../constants';

const categories = [
  // ... categories same
];

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

interface ShopSetupFormProps {
  onNext: () => void;
}

export const ShopSetupForm: React.FC<ShopSetupFormProps> = ({ onNext }) => {
  const { shopFormData, setShopFormData, setSellerFlowState } = useInventory();
  const [handleAvailability, setHandleAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [localHandle, setLocalHandle] = useState(shopFormData.handle);
  const [showTownPicker, setShowTownPicker] = useState(false);
  const [townSearch, setTownSearch] = useState('');
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [tradingHours, setTradingHours] = useState(shopFormData.tradingHoursJson || DEFAULT_HOURS);

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

  useEffect(() => {
    const formatted = formatTradingHours(tradingHours);
    setShopFormData({ 
      tradingHours: formatted,
      tradingHoursJson: tradingHours
    });
  }, [tradingHours]);

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Banner must be less than 5MB');
        return;
      }
      const preview = URL.createObjectURL(file);
      setShopFormData({ bannerFile: file, bannerPreview: preview });
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Avatar must be less than 2MB');
        return;
      }
      const preview = URL.createObjectURL(file);
      setShopFormData({ avatarFile: file, avatarPreview: preview });
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

  // Debounced check
  useEffect(() => {
    if (localHandle.length < 3) {
      setHandleAvailability('idle');
      return;
    }

    setHandleAvailability('checking');
    const timer = setTimeout(async () => {
      const cleanHandle = localHandle.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const { data } = await supabase
        .from('shops')
        .select('id')
        .eq('handle', cleanHandle)
        .maybeSingle();

      setHandleAvailability(data ? 'taken' : 'available');
      setShopFormData({ handle: cleanHandle });
    }, 500);

    return () => clearTimeout(timer);
  }, [localHandle, setShopFormData]);

  const isFormValid = 
    shopFormData.name.trim().length > 0 &&
    handleAvailability === 'available' &&
    shopFormData.category !== '' &&
    shopFormData.town !== '' &&
    shopFormData.directions.trim().length > 0 &&
    shopFormData.tradingHours.trim().length > 0 &&
    shopFormData.whatsapp.trim().length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-black text-white relative">
      {/* Top Bar */}
      <div className="sticky top-0 bg-black z-10 px-4 py-4 flex items-center border-b border-[#111]">
        <button 
          onClick={() => setSellerFlowState('seller_onboarding')} 
          className="p-2 -ml-2"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="flex-1 text-center font-bold text-[18px]">Set Up Your Shop</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Progress */}
      <div className="flex flex-col items-center py-4 bg-black">
        <span className="text-[#888] text-[12px] mb-2">Step 1 of 2</span>
        <div className="w-full px-6">
           <div className="h-[3px] w-full bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-[#c8f135] w-1/2" />
           </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-32">
        {/* IMAGE UPLOAD SECTION */}
        <div className="mb-14">
          <div 
            onClick={() => bannerInputRef.current?.click()}
            className="w-full h-[140px] bg-[#111] border border-dashed border-[#333] rounded-[14px] overflow-hidden relative cursor-pointer"
          >
            {shopFormData.bannerPreview ? (
              <img 
                src={shopFormData.bannerPreview} 
                className="w-full h-full object-cover" 
                alt="Banner preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-2xl">🖼️</span>
                <span className="text-white text-[13px] mt-1.5 font-bold">Add Shop Banner</span>
                <span className="text-[#888] text-[10px] mt-1">Recommended: 1200×400px</span>
              </div>
            )}
            
            {shopFormData.bannerPreview && (
              <div className="absolute bottom-[10px] right-[10px] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className="text-white text-[11px] font-bold">✏️ Change Banner</span>
              </div>
            )}
            
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
              className="w-20 h-20 rounded-full border-[3px] border-black overflow-hidden relative cursor-pointer bg-gradient-to-tr from-[#9B27AF] to-[#FF2D78] flex items-center justify-center shadow-xl"
            >
              {shopFormData.avatarPreview ? (
                <img 
                  src={shopFormData.avatarPreview} 
                  className="w-full h-full object-cover" 
                  alt="Avatar preview"
                />
              ) : (
                <Plus className="text-white w-7 h-7" strokeWidth={3} />
              )}
              
              {shopFormData.avatarPreview && (
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#FF2D78] rounded-full border-2 border-black flex items-center justify-center">
                  <Edit2 className="text-white w-2.5 h-2.5" />
                </div>
              )}
              
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

        <h2 className="text-white font-bold text-[15px] mb-6">Your Shop</h2>

        {/* Shop Name */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-white font-bold text-[13px]">Shop Name *</label>
            <span className="text-[#888] text-[10px]">{shopFormData.name.length}/30</span>
          </div>
          <input 
            type="text"
            maxLength={30}
            value={shopFormData.name}
            onChange={(e) => setShopFormData({ name: e.target.value })}
            placeholder="e.g. KickZone, VintageVault, DrapeZW"
            className="w-full h-[50px] bg-[#111] border border-[#222] rounded-[10px] px-4 text-[15px] focus:border-[#FF2D78] outline-none transition-all"
          />
        </div>

        {/* Handle */}
        <div className="mb-6">
          <label className="text-white font-bold text-[13px] block mb-2">Your Handle *</label>
          <div className="flex items-center bg-[#111] border border-[#222] rounded-[10px] focus-within:border-[#FF2D78] transition-all overflow-hidden">
            <div className="px-3 border-r border-[#222] h-[50px] flex items-center">
              <span className="text-[#888] text-[16px]">@</span>
            </div>
            <input 
              type="text"
              value={localHandle}
              onChange={(e) => setLocalHandle(e.target.value)}
              placeholder="yourshopname"
              className="flex-1 h-[50px] bg-transparent px-4 text-[15px] outline-none"
            />
          </div>
          <div className="flex justify-between items-center mt-1">
             <span className="text-[#888] text-[11px]">Letters, numbers and underscores only. Min 3 characters.</span>
             {handleAvailability === 'checking' && <span className="text-[#888] text-[11px]">Checking...</span>}
             {handleAvailability === 'taken' && <span className="text-[#FF2D78] text-[11px]">✗ Handle taken</span>}
             {handleAvailability === 'available' && <span className="text-[#22c55e] text-[11px]">✓ Available</span>}
          </div>
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="text-white font-bold text-[13px] block mb-2">What do you sell? *</label>
          <div className="grid grid-cols-2 gap-2 mt-3">
             {[
               { emoji: '👕', label: 'Clothing', value: 'clothing' },
               { emoji: '👟', label: 'Sneakers', value: 'sneakers' },
               { emoji: '🧥', label: 'Thrift & Vintage', value: 'thrift' },
               { emoji: '🔥', label: 'Streetwear', value: 'streetwear' },
               { emoji: '💍', label: 'Accessories', value: 'accessories' },
               { emoji: '📱', label: 'Electronics', value: 'electronics' },
               { emoji: '👠', label: 'Footwear', value: 'footwear' },
               { emoji: '⚽', label: 'Sportswear', value: 'sportswear' },
               { emoji: '👔', label: 'Formal Wear', value: 'formal' },
               { emoji: '🧒', label: 'Kids Fashion', value: 'kids' },
               { emoji: '👜', label: 'Bags', value: 'bags' },
               { emoji: '💄', label: 'Beauty', value: 'beauty' },
               { emoji: '📦', label: 'Other', value: 'other' }
             ].map(c => (
                <button
                  key={c.value}
                  onClick={() => setShopFormData({ category: c.value })}
                  className={`flex items-center gap-2 p-3 rounded-[10px] border transition-all text-left
                    ${shopFormData.category === c.value 
                      ? 'bg-[rgba(255,45,120,0.08)] border-[#FF2D78] text-[#FF2D78]' 
                      : 'bg-[#111] border-[#222] text-white opacity-80'}`}
                >
                  <span className="text-[18px]">{c.emoji}</span>
                  <span className="text-[13px] font-medium">{c.label}</span>
                </button>
             ))}
          </div>
        </div>

        {/* About Your Shop */}
        <div className="mb-6">
          <div className="flex items-center gap-1 mb-2">
            <label className="text-white font-bold text-[13px]">About Your Shop</label>
            <span className="text-[#888] text-[11px]">(optional)</span>
          </div>
          <textarea 
            rows={3}
            maxLength={200}
            value={shopFormData.description}
            onChange={(e) => setShopFormData({ description: e.target.value })}
            placeholder="Tell buyers what makes your shop different..."
            className="w-full bg-[#111] border border-[#222] rounded-[10px] p-4 text-[15px] focus:border-[#FF2D78] outline-none transition-all resize-none"
          />
          <div className="text-right mt-1">
             <span className="text-[#888] text-[10px]">{shopFormData.description.length}/200</span>
          </div>
        </div>

        {/* Town */}
        <div className="mb-6">
           <label className="text-white font-bold text-[13px] block mb-2">Your Shop's Town *</label>
           <button 
             type="button"
             onClick={() => setShowTownPicker(true)}
             className="w-full bg-[rgba(255,45,120,0.08)] border border-[rgba(255,45,120,0.3)] rounded-[10px] p-[14px] flex justify-between items-center"
           >
              <span className="text-[#FF2D78] text-[14px] font-medium">📍 {shopFormData.town || 'Select Town'}</span>
              <span className="text-[#888] text-[11px]">Change →</span>
           </button>
        </div>

        {/* Directions */}
        <div className="mb-6">
          <label className="text-white font-bold text-[13px] block mb-2">How to Find Your Shop *</label>
          <textarea 
            rows={4}
            value={shopFormData.directions}
            onChange={(e) => setShopFormData({ directions: e.target.value })}
            placeholder="e.g. Eastlea Shopping Centre, Shop 14, Ground Floor. Opposite Chicken Inn. Look for the orange sign."
            className="w-full bg-[#111] border border-[#222] rounded-[10px] p-4 text-[15px] focus:border-[#FF2D78] outline-none transition-all resize-none"
          />
        </div>

        {/* TRADING HOURS PICKER */}
        <div className="mb-8">
          <label className="text-white font-bold text-[13px] block mb-3">Trading Hours *</label>
          
          <div className="bg-[#111] border border-[#222] rounded-[14px] overflow-hidden">
            {Object.keys(tradingHours).map((day, index, arr) => {
              const h = tradingHours[day as keyof typeof tradingHours];
              const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
              
              const parseTime = (t: string) => {
                const [time, period] = t.split(' ');
                let [hours, mins] = time.split(':').map(Number);
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
                return hours * 60 + mins;
              };
              const isValid = parseTime(h.closeTime) > parseTime(h.openTime);

              return (
                <div key={day} className={`p-4 ${index !== arr.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}>
                  <div className="flex items-center">
                    {/* Toggle */}
                    <button 
                      onClick={() => setTradingHours(prev => ({ 
                        ...prev, 
                        [day]: { ...prev[day as keyof typeof tradingHours], open: !prev[day as keyof typeof tradingHours].open } 
                      }))}
                      className={`w-9 h-5 rounded-full relative transition-all duration-300 ${h.open ? 'bg-[#FF2D78]' : 'bg-[#333]'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${h.open ? 'left-5' : 'left-1'}`} />
                    </button>
                    
                    <span className="text-white font-bold text-[14px] ml-2.5">{dayCapitalized}</span>
                    
                    {!h.open ? (
                      <span className="ml-auto text-[#888] text-[12px] font-bold">Closed</span>
                    ) : (
                      <div className="ml-auto flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <span className="text-[#666] text-[8px] uppercase font-bold mb-1">Open</span>
                          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1">
                            <select 
                              value={h.openTime}
                              onChange={(e) => setTradingHours(prev => ({ 
                                ...prev, 
                                [day]: { ...prev[day as keyof typeof tradingHours], openTime: e.target.value } 
                              }))}
                              className="bg-transparent text-white text-[11px] outline-none border-none"
                            >
                              {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[#666] text-[8px] uppercase font-bold mb-1">Close</span>
                          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1">
                            <select 
                              value={h.closeTime}
                              onChange={(e) => setTradingHours(prev => ({ 
                                ...prev, 
                                [day]: { ...prev[day as keyof typeof tradingHours], closeTime: e.target.value } 
                              }))}
                              className="bg-transparent text-white text-[11px] outline-none border-none"
                            >
                              {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {h.open && !isValid && (
                    <p className="text-[#ef4444] text-[10px] mt-2 font-bold text-right italic">Close must be after open</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-[#888] text-[11px]">Apply to all open days:</span>
            <div className="flex gap-2">
              {[
                { label: '9–5', open: '9:00 AM', close: '5:00 PM' },
                { label: '8–6', open: '8:00 AM', close: '6:00 PM' },
                { label: '8–8', open: '8:00 AM', close: '8:00 PM' }
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => applyToAll(p.open, p.close)}
                  className="bg-[#1a1a1a] text-[#888] text-[11px] font-bold px-3 py-1.5 rounded-full border border-[#2a2a2a] active:bg-[#FF2D78] active:text-white transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="mb-6">
          <label className="text-white font-bold text-[13px] block mb-1">Shop WhatsApp *</label>
          <p className="text-[#888] text-[11px] mb-3">Buyers will contact you on this number.</p>
          <input 
            type="tel"
            value={shopFormData.whatsapp}
            onChange={(e) => setShopFormData({ whatsapp: e.target.value })}
            placeholder="+263 7X XXX XXXX"
            className="w-full h-[50px] bg-[#111] border border-[#222] rounded-[10px] px-4 text-[15px] focus:border-[#FF2D78] outline-none transition-all"
          />
        </div>

        {/* Instagram */}
        <div className="mb-10">
          <div className="flex items-center gap-1 mb-2">
            <label className="text-white font-bold text-[13px]">Instagram Handle</label>
            <span className="text-[#888] text-[11px]">(optional)</span>
          </div>
          <div className="flex items-center bg-[#111] border border-[#222] rounded-[10px] focus-within:border-[#FF2D78] transition-all overflow-hidden">
            <div className="px-3 border-r border-[#222] h-[50px] flex items-center">
              <span className="text-[#888] text-[16px]">@</span>
            </div>
            <input 
              type="text"
              value={shopFormData.instagram}
              onChange={(e) => setShopFormData({ instagram: e.target.value })}
              placeholder="yourshop"
              className="flex-1 h-[50px] bg-transparent px-4 text-[15px] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#111] p-[16px] pb-[32px] z-20">
         {isFormValid ? (
            <button
              onClick={onNext}
              className="w-full h-[54px] bg-linear-to-r from-[#9B27AF] to-[#FF2D78] rounded-full text-white font-bold text-[14px] flex items-center justify-center gap-2"
            >
              Next — Activate Free Trial →
            </button>
         ) : (
            <button
              disabled
              className="w-full h-[54px] bg-[#1a1a1a] rounded-full text-[#555] font-bold text-[14px] pointer-events-none"
            >
              Fill all required fields
            </button>
         )}
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
                    className="w-full h-12 bg-[#111] border border-[#222] rounded-[14px] pl-11 pr-4 text-white placeholder:text-[#444] focus:border-[#FF2D78] outline-none"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto no-scrollbar space-y-2 pb-10">
                  {ZIMBABWE_TOWNS.filter(t => t.toLowerCase().includes(townSearch.toLowerCase())).map(town => (
                    <button 
                      key={town}
                      type="button"
                      onClick={() => {
                        setShopFormData({ town });
                        setShowTownPicker(false);
                        setTownSearch('');
                      }}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all ${
                        shopFormData.town === town ? 'bg-[#FF2D78] text-white' : 'bg-[#111] text-[#888] border border-[#222]'
                      }`}
                    >
                      <span className="font-bold">{town}</span>
                      {shopFormData.town === town && <Check size={18} />}
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
