import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2 } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const BestDresserEntry: React.FC = () => {
  const { setBuyerFlowState } = useInventory();
  const [handle, setHandle] = useState('');
  const [url, setUrl] = useState('');
  const [checks, setChecks] = useState([false, false, false, false]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const checklistItems = [
    "I have posted an outfit photo on Instagram",
    "I tagged @threadzw in my caption",
    "I tagged @threadzw in the photo itself",
    "This is my own original outfit photo"
  ];

  const toggleCheck = (index: number) => {
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  const isComplete = handle.trim() !== '' && url.trim() !== '' && checks.every(c => c);

  const handleSubmit = () => {
    if (!isComplete) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="flex flex-col bg-black min-h-screen text-white">
      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-20">
        <button onClick={() => setBuyerFlowState('bestDresser')}>
          <X className="text-white" size={24} />
        </button>
        <h1 className="text-white font-bold text-[18px]">Enter Contest</h1>
        <div className="w-6" /> {/* Spacer */}
      </div>

      <div className="px-5 py-6">
        {/* Info Card */}
        <div className="rounded-[16px] bg-linear-to-br from-[#9B27AF] to-[#FF2D78] p-5 mb-8">
           <h3 className="text-white font-bold text-[16px]">🏆 April 2026 Contest</h3>
           <p className="text-white/70 text-[13px] mt-1">Submissions close in 17 days</p>
           <div className="mt-4 flex items-center gap-1.5">
             <span className="text-[#f59e0b] font-bold text-[14px]">$30 cash prize</span>
             <span className="text-white/60 text-[12px]">via Paynow</span>
           </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
           <div className="flex flex-col gap-2">
              <label className="text-white font-bold text-[13px]">Your Instagram Handle *</label>
              <div className="flex items-center bg-[#1a1a1a] border border-[#333] rounded-[10px] h-12 focus-within:border-[#FF2D78] transition-colors overflow-hidden">
                 <span className="text-[#888] text-[15px] ml-4">@</span>
                 <input 
                  type="text" 
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="yourhandle"
                  className="flex-1 bg-transparent border-none outline-none text-white text-[15px] px-2"
                 />
              </div>
           </div>

           <div className="flex flex-col gap-2">
              <label className="text-white font-bold text-[13px]">Post URL *</label>
              <p className="text-[#888] text-[11px]">Link to your Instagram post</p>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://instagram.com/p/..."
                className="w-full h-12 bg-[#1a1a1a] border border-[#333] rounded-[10px] px-4 text-white text-[14px] focus:outline-none focus:border-[#FF2D78] transition-colors"
              />
           </div>

           <div className="flex flex-col gap-3">
              <label className="text-white font-bold text-[13px]">Confirm the following *</label>
              <div className="space-y-4">
                 {checklistItems.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start" onClick={() => toggleCheck(i)}>
                       <div className={`w-6 h-6 rounded-[6px] shrink-0 border-2 transition-all flex items-center justify-center
                         ${checks[i] ? 'bg-linear-to-br from-[#9B27AF] to-[#FF2D78] border-transparent' : 'bg-[#1a1a1a] border-[#333]'}`}>
                          {checks[i] && <Check className="text-white" size={14} strokeWidth={4} />}
                       </div>
                       <p className="text-[#888] text-[13px] leading-relaxed">{item}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit}
          disabled={!isComplete || loading}
          className={`mt-10 w-full h-[56px] rounded-full font-bold text-[15px] flex items-center justify-center transition-all shadow-lg
            ${isComplete && !loading ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white active:scale-[0.98]' : 'bg-[#333] text-[#666]'}`}
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : (isComplete ? "Submit Entry →" : "Submit Entry")}
        </button>
      </div>

      {/* Success Bottom Sheet */}
      <AnimatePresence>
        {success && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => { setSuccess(false); setBuyerFlowState('bestDresser'); }}
               className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed bottom-0 left-0 right-0 z-[101] bg-[#111] border-t border-[#222] rounded-t-[24px] p-8 pb-10 flex flex-col items-center text-center"
            >
               <div className="w-12 h-1 bg-[#333] rounded-full mb-8 cursor-pointer" onClick={() => setSuccess(false)} />
               <div className="w-14 h-14 bg-linear-to-br from-[#9B27AF] to-[#FF2D78] rounded-full flex items-center justify-center mb-6">
                  <Check className="text-white" size={32} />
               </div>
               <h2 className="text-white font-bold text-[22px]">Entry Submitted! 🎉</h2>
               <p className="text-[#888] text-[13px] mt-2 max-w-[280px]">
                  Your entry is under review. We'll notify you within 48 hours.
               </p>
               <button 
                 onClick={() => { setSuccess(false); setBuyerFlowState('bestDresser'); }}
                 className="mt-10 w-full h-[52px] bg-linear-to-r from-[#9B27AF] to-[#FF2D78] rounded-full text-white font-bold text-[15px]"
               >
                 Got It
               </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
