// THREADZW PRICING: $5/month | 3-day trial — do not change without updating all instances
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Smartphone, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface PaywallFlowProps {
  myShop: any;
  onActivated: () => void | Promise<void>;
}

export const PaywallFlow: React.FC<PaywallFlowProps> = ({ myShop, onActivated }) => {
  const { session } = useAuth();
  const { setSellerFlowState } = useInventory();
  const [whatsappNumber, setWhatsappNumber] = useState(myShop?.whatsapp || '');
  const [loading, setLoading] = useState(false);

  const handleSubmitPayment = async () => {
    if (!whatsappNumber.trim()) {
      toast.error('Enter your WhatsApp number.');
      return;
    }
    
    setLoading(true);
    try {
      // Record the pending payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          shop_id: myShop.id,
          owner_id: session?.user?.id,
          whatsapp_number: whatsappNumber.trim(),
          plan: 'standard',
          amount: 5,
          status: 'pending',
          receiving_number: '0789113734'
        });
      
      if (paymentError) throw paymentError;
      
      // Update shop status locally and on server
      await supabase
        .from('shops')
        .update({
          subscription_status: 'pending_payment',
        })
        .eq('id', myShop.id);
      
      // Move to code entry state
      setSellerFlowState('enter_code');
    } catch (err) {
      console.error(err);
      toast.error('Could not submit activation protocol.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#0B0B0B] flex flex-col font-sans"
    >
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between border-b border-white/5">
        <button onClick={() => setSellerFlowState('live')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <X size={20} />
        </button>
        <h1 className="text-lg font-black uppercase italic tracking-tighter">Activate your store</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-10 pb-40 space-y-10">
        
        {/* Plan Header */}
        <div className="text-center space-y-3">
           <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-[#C6FF00]/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-[#C6FF00] shadow-[0_0_40px_rgba(198,255,0,0.1)]">
              <ShieldCheck className="size-7 md:size-8" />
           </div>
           <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Activate your store — $5/month</h2>
           <p className="text-[#C6FF00] text-[12px] md:text-sm font-black italic uppercase tracking-widest">$5.00 USD / MONTH</p>
        </div>

        {/* Manual Instructions */}
        <div className="space-y-6">
           <InstructionStep 
             num="01" 
             title="Send $5 to EcoCash +263789113734 or InnBucks" 
             desc="Send exactly $5.00 USD to help activate your catalog." 
           />
           
           <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Recipient</span>
                 <span className="text-sm font-bold text-white">0789113734</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Reference</span>
                 <span className="text-sm font-bold text-white italic">Your Shop Name</span>
              </div>
           </div>

           <InstructionStep 
             num="02" 
             title="Enter your reference info & Tap 'I've Paid'" 
             desc="Input the number used for this transaction below." 
           />

           <div className="relative">
              <Smartphone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                 value={whatsappNumber}
                 onChange={(e) => setWhatsappNumber(e.target.value)}
                 className="w-full h-14 md:h-16 bg-black border border-white/5 rounded-xl md:rounded-2xl pl-12 pr-5 text-sm font-bold focus:border-[#C6FF00] outline-none transition-all placeholder:text-zinc-700"
                 placeholder="WhatsApp number (Reference)"
              />
           </div>

           <InstructionStep 
             num="03" 
             title="Wait for your 6-digit code on WhatsApp" 
             desc="Our verify agent will text validation credentials inside 2 hours." 
           />

           <InstructionStep 
             num="04" 
             title="Enter code to unlock your store" 
             desc="Once received, tap Enter Sync Code dashboard option to unlock." 
           />
        </div>

        {/* Support Link */}
        <button 
          onClick={() => window.open('https://wa.me/263789113734', '_blank')}
          className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest italic text-zinc-400"
        >
          <MessageCircle size={18} className="text-[#C6FF00]" /> Direct Support Routing
        </button>
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B] to-transparent">
         <button 
           disabled={loading || !whatsappNumber.trim()}
           onClick={handleSubmitPayment}
           className="w-full h-14 md:h-16 bg-[#C6FF00] text-black rounded-2xl md:rounded-3xl font-black uppercase tracking-widest italic flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-xs md:text-sm disabled:opacity-30"
         >
            {loading ? "Transmitting..." : "I've Paid"} 
            <ArrowRight size={18} strokeWidth={3} />
         </button>
      </div>
    </motion.div>
  );
};

const InstructionStep = ({ num, title, desc }: any) => (
  <div className="flex gap-4 items-start">
    <div className="text-[#C6FF00] font-black italic text-lg opacity-20 shrink-0 leading-none pt-1">{num}</div>
    <div className="space-y-1">
      <h4 className="text-xs font-black uppercase italic tracking-widest text-white">{title}</h4>
      <p className="text-zinc-500 text-[10px] leading-relaxed font-medium uppercase tracking-wide">{desc}</p>
    </div>
  </div>
);
