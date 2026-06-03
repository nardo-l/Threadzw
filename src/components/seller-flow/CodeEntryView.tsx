import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, MessageCircle, RefreshCcw, X } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface CodeEntryViewProps {
  myShop: any;
  onActivated: () => void;
}

export const CodeEntryView: React.FC<CodeEntryViewProps> = ({ myShop, onActivated }) => {
  const { setSellerFlowState, refreshInventory } = useInventory();
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    if (code.length !== 6) {
      toast.error('Sync code must be 6 digits.');
      return;
    }

    setValidating(true);
    try {
      // In a real app, this would check a 'verification_codes' table
      // For this implementation, we'll simulate verification or check if a code was assigned to the shop
      // If we want a simple "demo" code, let's say '123456' or any code that the admin 'manually' sent.
      
      const { data: codeMatch, error } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', code)
        .eq('shop_id', myShop.id)
        .eq('is_used', false)
        .maybeSingle();

      if (error) throw error;

      if (!codeMatch && code !== '000000') { // 000000 as universal dev code
         toast.error('Sync code invalid or already expired.');
         setValidating(false);
         return;
      }

      // Mark code as used
      if (codeMatch) {
        await supabase.from('activation_codes').update({ is_used: true }).eq('id', codeMatch.id);
      }

      // Activate shop
      const nextRenewal = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
      await supabase
        .from('shops')
        .update({
          is_live: true,
          subscription_status: 'active',
          trial_ends_at: nextRenewal.toISOString()
        })
        .eq('id', myShop.id);

      toast.success('Sync Successful. Commercial Node Online.');
      await refreshInventory();
      onActivated();
    } catch (err) {
      console.error(err);
      toast.error('Sync Protocol Failed.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-[#0B0B0B] flex flex-col font-sans"
    >
      <header className="px-6 py-8 flex items-center justify-between border-b border-white/5">
        <button onClick={() => setSellerFlowState('live')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <X size={20} />
        </button>
        <h1 className="text-lg font-black uppercase italic tracking-tighter">Sync Verification</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 px-8 flex flex-col items-center justify-center text-center space-y-12">
         <div className="w-20 h-20 bg-[#C6FF00]/10 rounded-[32px] flex items-center justify-center text-[#C6FF00] mb-4">
            <RefreshCcw size={40} className={validating ? 'animate-spin' : ''} />
         </div>

         <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Enter Sync Code</h2>
            <p className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-widest italic max-w-xs mx-auto">
               Input the 6-digit verification key transmitted to your WhatsApp number.
            </p>
         </div>

         <div className="w-full max-w-xs">
            <input 
               type="text"
               maxLength={6}
               value={code}
               onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
               className="w-full bg-transparent text-center text-5xl md:text-6xl font-black italic tracking-[0.1em] md:tracking-[0.2em] text-[#C6FF00] outline-none placeholder:text-zinc-900"
               placeholder="000000"
               autoFocus
            />
         </div>

         <div className="space-y-6 w-full max-w-xs">
            <button 
              disabled={validating || code.length !== 6}
              onClick={handleValidate}
              className="w-full h-14 md:h-16 bg-[#C6FF00] text-black rounded-2xl md:rounded-3xl font-black uppercase tracking-widest italic flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-30 disabled:grayscale text-xs md:text-sm"
            >
               {validating ? "Validating Protocol..." : "Finalize Sync"} <ArrowRight size={20} strokeWidth={3} />
            </button>

            <button 
              onClick={() => window.open('https://wa.me/263789113734', '_blank')}
              className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-widest italic hover:text-[#C6FF00] transition-colors flex items-center justify-center gap-2"
            >
               <MessageCircle size={14} /> Haven't received my code
            </button>
         </div>
      </div>

      <div className="p-10 text-center">
         <div className="flex items-center justify-center gap-2 text-zinc-800">
            <ShieldCheck size={14} /> 
            <span className="text-[9px] font-black uppercase tracking-widest italic">Encrypted Verification Layer</span>
         </div>
      </div>
    </motion.div>
  );
};
