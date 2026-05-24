import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useInventory } from '../../context/InventoryContext';
import { ChevronLeft, Camera, X, Search, Check, Smartphone, Globe, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ZIMBABWE_TOWNS } from '../../constants';

const categories = [
  { emoji: '👕', label: 'Clothing', value: 'clothing' },
  { emoji: '👟', label: 'Sneakers', value: 'sneakers' },
  { emoji: '📻', label: 'Tech & Gadgets', value: 'electronics' },
  { emoji: '💍', label: 'Accessories', value: 'accessories' },
  { emoji: '📦', label: 'General Goods', value: 'other' }
];

interface ShopSetupFormProps {
  onNext: () => void;
}

export const ShopSetupForm: React.FC<ShopSetupFormProps> = ({ onNext }) => {
  const { shopFormData, setShopFormData, setSellerFlowState } = useInventory();
  const [handleAvailability, setHandleAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [localHandle, setLocalHandle] = useState(shopFormData.handle || '');
  const [showTownPicker, setShowTownPicker] = useState(false);
  const [townSearch, setTownSearch] = useState('');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!localHandle || localHandle.length < 3) {
      setHandleAvailability('idle');
      return;
    }

    setHandleAvailability('checking');
    const timer = setTimeout(async () => {
      const cleanHandle = localHandle.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const { data } = await supabase.from('shops').select('id').eq('handle', cleanHandle).maybeSingle();
      setHandleAvailability(data ? 'taken' : 'available');
      setShopFormData({ handle: cleanHandle });
    }, 500);
    return () => clearTimeout(timer);
  }, [localHandle, setShopFormData]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setShopFormData({ avatarFile: file, avatarPreview: preview });
    }
  };

  const isFormValid = 
    shopFormData.name?.trim()?.length > 0 &&
    handleAvailability === 'available' &&
    shopFormData.category &&
    shopFormData.town &&
    shopFormData.whatsapp?.trim()?.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0B] text-white font-sans">
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between border-b border-white/5">
        <button onClick={() => setSellerFlowState('seller_onboarding')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-black uppercase italic tracking-tighter">Node Configuration</h1>
        <div className="w-10" />
      </header>

      {/* Progress */}
      <div className="px-6 py-4">
         <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Deployment Sync</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#C6FF00] italic">Protocol Alpha</span>
         </div>
         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '50%' }} className="h-full bg-[#C6FF00]" />
         </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-40 space-y-10">
        
        {/* Avatar / Logo Section */}
        <div className="flex flex-col items-center gap-4">
           <div 
             onClick={() => avatarInputRef.current?.click()}
             className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] md:rounded-[48px] bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden shadow-2xl transition-all hover:border-[#C6FF00]/50"
           >
              {shopFormData.avatarPreview ? (
                <img src={shopFormData.avatarPreview} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="size-6 md:size-8 text-zinc-700 mb-2 transition-colors group-hover:text-[#C6FF00]" />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 italic group-hover:text-white transition-colors">Visual ID</span>
                </>
              )}
              <input ref={avatarInputRef} type="file" onChange={handleAvatarSelect} className="hidden" accept="image/*" />
           </div>
           <p className="text-[8px] font-black uppercase tracking-widest text-[#C6FF00] italic">Node ID logo required</p>
        </div>

        {/* Basic Metadata */}
        <div className="space-y-6">
           <InputGroup label="Commercial Entity Name" placeholder="e.g. SoloTech HRE">
              <input 
                value={shopFormData.name || ''} 
                onChange={(e) => setShopFormData({ name: e.target.value })}
                className="w-full h-12 md:h-14 bg-black border border-white/5 rounded-xl md:rounded-2xl px-5 text-sm font-bold focus:border-[#C6FF00] focus:ring-1 focus:ring-[#C6FF00]/20 transition-all outline-none" 
              />
           </InputGroup>

           <InputGroup label="Network Handle (@)">
              <div className="relative">
                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">@</span>
                 <input 
                    value={localHandle} 
                    onChange={(e) => setLocalHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full h-12 md:h-14 bg-black border border-white/5 rounded-xl md:rounded-2xl pl-10 pr-5 text-sm font-bold focus:border-[#C6FF00] focus:ring-1 focus:ring-[#C6FF00]/20 transition-all outline-none" 
                    placeholder="solotech_node"
                 />
                 <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {handleAvailability === 'checking' && <div className="w-4 h-4 border-2 border-[#C6FF00]/30 border-t-[#C6FF00] rounded-full animate-spin" />}
                    {handleAvailability === 'available' && <Check size={16} className="text-[#C6FF00]" />}
                    {handleAvailability === 'taken' && <X size={16} className="text-red-500" />}
                 </div>
              </div>
           </InputGroup>

           <InputGroup label="Market Category">
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                 {categories.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setShopFormData({ category: c.value })}
                      className={`h-12 md:h-14 rounded-xl md:rounded-2xl border flex items-center gap-3 px-4 transition-all ${shopFormData.category === c.value ? 'bg-[#C6FF00]/10 border-[#C6FF00] text-[#C6FF00]' : 'bg-black border-white/5 text-zinc-500'}`}
                    >
                       <span className="text-lg">{c.emoji}</span>
                       <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest italic">{c.label}</span>
                    </button>
                 ))}
              </div>
           </InputGroup>
        </div>

        {/* Location & Routing */}
        <div className="space-y-6 pt-6 border-t border-white/5">
           <InputGroup label="Geospatial Hub (Town)">
              <button 
                onClick={() => setShowTownPicker(true)}
                className="w-full h-12 md:h-14 bg-black border border-white/5 rounded-xl md:rounded-2xl px-5 text-sm font-bold flex items-center justify-between group hover:border-[#C6FF00]/30 transition-all italic text-zinc-300"
              >
                 <div className="flex items-center gap-3 uppercase">
                   <Globe size={16} className="text-[#C6FF00]" />
                   {shopFormData.town || 'Select Hub'}
                 </div>
                 <ChevronRight size={16} className="text-zinc-700" />
              </button>
           </InputGroup>

           <InputGroup label="WhatsApp Routing">
              <div className="relative">
                 <Smartphone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" />
                 <input 
                    value={shopFormData.whatsapp || ''} 
                    onChange={(e) => setShopFormData({ whatsapp: e.target.value })}
                    className="w-full h-12 md:h-14 bg-black border border-white/5 rounded-xl md:rounded-2xl pl-12 pr-5 text-sm font-bold focus:border-[#C6FF00] focus:ring-1 focus:ring-[#C6FF00]/20 transition-all outline-none" 
                    placeholder="+263 712 345 678"
                 />
              </div>
           </InputGroup>

           <InputGroup label="In-Depth Directions">
              <textarea 
                value={shopFormData.directions || ''} 
                onChange={(e) => setShopFormData({ directions: e.target.value })}
                className="w-full bg-black border border-white/5 rounded-2xl p-5 text-sm font-bold focus:border-[#C6FF00] focus:ring-1 focus:ring-[#C6FF00]/20 transition-all outline-none min-h-[120px] resize-none" 
                placeholder="e.g. Eastlea Shopping Center, Suite 12. Opposite post office."
              />
           </InputGroup>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B] to-transparent">
         <button 
           disabled={!isFormValid}
           onClick={onNext}
           className="w-full h-14 md:h-16 bg-[#C6FF00] text-black rounded-2xl md:rounded-3xl font-black uppercase tracking-widest italic flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-30 disabled:grayscale text-xs md:text-sm"
         >
            Initialize Node <ArrowRight size={18} strokeWidth={3} />
         </button>
      </div>

      {/* Town Picker Sheet */}
      <AnimatePresence>
        {showTownPicker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" onClick={() => setShowTownPicker(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-x-0 bottom-0 z-[101] max-h-[80vh] bg-[#151515] border-t border-white/10 rounded-t-[40px] flex flex-col">
               <div className="p-8 flex flex-col gap-6 h-full">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xl font-black uppercase italic tracking-tighter">SELECT HUB</h3>
                     <button onClick={() => setShowTownPicker(false)}><X size={24} /></button>
                  </div>
                  <div className="relative">
                     <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                     <input 
                       value={townSearch} 
                       onChange={(e) => setTownSearch(e.target.value)}
                       className="w-full h-12 bg-black border border-white/5 rounded-xl pl-12 pr-5 text-sm font-bold outline-none focus:border-[#C6FF00]" 
                       placeholder="Search regions..." 
                     />
                  </div>
                  <div className="overflow-y-auto space-y-2 pb-10">
                     {ZIMBABWE_TOWNS.filter(t => t.toLowerCase().includes(townSearch.toLowerCase())).map(t => (
                        <button
                          key={t}
                          onClick={() => { setShopFormData({ town: t }); setShowTownPicker(false); }}
                          className={`w-full p-4 rounded-xl text-left font-black uppercase tracking-widest italic text-xs transition-colors ${shopFormData.town === t ? 'bg-[#C6FF00] text-black' : 'hover:bg-white/5 '}`}
                        >
                           {t}
                        </button>
                     ))}
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const InputGroup = ({ label, children }: any) => (
  <div className="space-y-3">
     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic block">{label}</label>
     {children}
  </div>
);
