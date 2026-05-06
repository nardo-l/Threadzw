import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, X } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface PaywallFlowProps {
  myShop: any;
  onActivated: () => void | Promise<void>;
}

export const PaywallFlow: React.FC<PaywallFlowProps> = ({ myShop, onActivated }) => {
  const { session } = useAuth();
  const { setSellerFlowState } = useInventory();
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro'>((myShop?.plan === 'pro' ? 'pro' : 'standard') as 'standard' | 'pro');
  const [whatsappNumber, setWhatsappNumber] = useState(myShop?.whatsapp || '');
  const [loading, setLoading] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handlePlanChange = async (newPlan: 'standard' | 'pro') => {
    setSelectedPlan(newPlan);
    setShowPlanSelector(false);
    
    try {
      await supabase
        .from('shops')
        .update({
          plan: newPlan,
          monthly_price: newPlan === 'standard' ? 4 : 8
        })
        .eq('id', myShop.id);
    } catch (err) {
      console.error('Error updating plan:', err);
    }
  };

  const handleSubmitPayment = async () => {
    if (!whatsappNumber.trim()) {
      setToast({ message: 'Enter your WhatsApp number.', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          shop_id: myShop.id,
          owner_id: session?.user?.id,
          whatsapp_number: whatsappNumber.trim(),
          plan: selectedPlan,
          amount: selectedPlan === 'pro' ? 8 : 4,
          status: 'pending',
          receiving_number: '0776223144'
        });
      
      if (paymentError) throw paymentError;
      
      const { error: shopError } = await supabase
        .from('shops')
        .update({
          subscription_status: 'pending_payment',
          plan: selectedPlan
        })
        .eq('id', myShop.id);
      
      if (shopError) throw shopError;
      
      setSellerFlowState('pending_code');
    } catch (err) {
      console.error(err);
      setToast({ message: 'Could not submit. Try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const planDetails = {
    standard: {
      name: '1 Product Store',
      price: 4,
      features: [
        'Dedicated product page',
        'Direct WhatsApp connect',
        'Basic audience stats',
        'Drip authentication label'
      ]
    },
    pro: {
      name: 'Multi Product Store',
      price: 8,
      features: [
        'Full collection management',
        'Smart inventory signals',
        'Custom promo tools',
        'Premium shop placement',
        'Priority seller support'
      ]
    }
  };

  const currentPlanName = selectedPlan === 'standard' ? '1 Product Store' : 'Multi Product Store';
  const currentPrice = selectedPlan === 'standard' ? '4' : '8';

  return (
    <div className="flex flex-col min-h-screen bg-black pb-20 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6 text-center px-6">
        <span className="text-[40px] mb-2 shadow-[0_0_30px_rgba(255,45,120,0.2)]">🛍️</span>
        <h1 className="text-white text-[24px] font-bold leading-tight">
          Level up your store
        </h1>
        <p className="text-[#888] text-[13px] mt-2 max-w-[280px]">Choose the plan that fits your inventory goals</p>
      </div>

      {/* Current Plan Card */}
      <div className="mx-5 mb-8 bg-[#111] border border-[#222] border-l-4 border-l-[#FF2D78] rounded-[14px] p-4 flex justify-between items-center transition-all active:scale-[0.98]" onClick={() => setShowPlanSelector(true)}>
        <div>
           <span className="text-[#888] text-[11px] uppercase tracking-wider font-bold">Current Selection</span>
           <h3 className="text-white text-[15px] font-bold mt-1">
             {currentPlanName}
           </h3>
           <p className="text-[#FF2D78] text-[13px] font-medium mt-0.5">
             ${currentPrice}/month
           </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#888] text-[12px] font-medium">Change</span>
          <ChevronRight className="w-4 h-4 text-[#444]" />
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="mx-5 bg-[#111] border border-[#222] rounded-[16px] p-5 mb-6">
        <h3 className="text-white font-bold text-[16px] mb-5">How to Pay</h3>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-[26px] h-[26px] rounded-full bg-[#FF2D78] flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-[0_0_15px_rgba(255,45,120,0.4)]">1</div>
            <div className="flex-1">
              <span className="text-white font-bold text-[14px]">Send Payment</span>
              <p className="text-[#888] text-[13px] mt-1 leading-tight">EcoCash or InnBucks to <span className="text-white font-bold underline decoration-[#FF2D78]">0776223144</span>. Use your WhatsApp number as reference.</p>
              <div className="mt-3 bg-[#1a1a1a] rounded-[8px] p-3 flex justify-between items-center ring-1 ring-white/5">
                <span className="text-[#888] text-[13px]">Amount:</span>
                <span className="text-[#FF2D78] font-bold text-[16px]">${selectedPlan === 'standard' ? '4' : '8'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-[26px] h-[26px] rounded-full bg-[#FF2D78] flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-[0_0_15px_rgba(255,45,120,0.4)]">2</div>
            <div className="flex-1">
              <span className="text-white font-bold text-[14px]">Enter Your Number</span>
              <p className="text-[#888] text-[13px] mt-1">Which number did you send from?</p>
              <input 
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+263 7X XXX XXXX"
                className="mt-3 w-full h-[52px] bg-[#1a1a1a] border border-[#333] rounded-[12px] px-4 text-white text-[15px] outline-none focus:border-[#FF2D78] transition-all ring-1 ring-white/5"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-[26px] h-[26px] rounded-full bg-[#FF2D78] flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-[0_0_15px_rgba(255,45,120,0.4)]">3</div>
            <div className="flex-1">
              <span className="text-white font-bold text-[14px]">Notification</span>
              <p className="text-[#888] text-[13px] mt-1 leading-tight italic">We'll verify and WhatsApp your code within 2 hours.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-5">
        <button 
           onClick={handleSubmitPayment}
           disabled={loading || !whatsappNumber.trim()}
           className={`w-full h-[56px] rounded-full font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]
             ${whatsappNumber.trim() ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white shadow-xl' : 'bg-[#1a1a1a] text-[#555] pointer-events-none'}`}
        >
           {loading ? (
             <div className="w-5 h-5 border-2 border-white rounded-full animate-spin border-t-transparent" />
           ) : (
             <>
               🚀 I've Paid — Notify Admin
             </>
           )}
        </button>
      </div>

      {/* Plan Selector Bottom Sheet */}
      <AnimatePresence>
        {showPlanSelector && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowPlanSelector(false)}
               className="fixed inset-0 bg-black/80 z-[100]"
            />
            <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 300 }}
               className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] rounded-t-[32px] p-6 z-[101] border-t border-[#333] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
               <div className="w-12 h-1.5 bg-[#333] rounded-full mx-auto mb-6" />
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white text-[20px] font-bold">Switch Plan</h3>
                    <p className="text-[#888] text-[13px]">Choose the right tools for your shop</p>
                  </div>
                  <button onClick={() => setShowPlanSelector(false)} className="p-2 bg-[#1a1a1a] rounded-full"><X className="w-5 h-5 text-[#888]" /></button>
               </div>

               <div className="space-y-4 mb-8">
                  {Object.entries(planDetails).map(([id, p]) => (
                    <button
                      key={id}
                      onClick={() => handlePlanChange(id as any)}
                      className={`w-full p-5 rounded-[20px] border-2 text-left transition-all relative overflow-hidden group
                        ${selectedPlan === id ? 'bg-[rgba(255,45,120,0.08)] border-[#FF2D78]' : 'bg-black border-[#1a1a1a]'}`}
                    >
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <p className={`text-[12px] font-black uppercase tracking-[0.1em] mb-1 ${selectedPlan === id ? 'text-[#FF2D78]' : 'text-[#555]'}`}>{p.name} Plan</p>
                             <div className="flex items-baseline gap-1">
                                <span className="text-white text-[28px] font-black">${p.price}</span>
                                <span className="text-[#888] text-[13px] font-medium">/month</span>
                             </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                            ${selectedPlan === id ? 'bg-[#FF2D78] border-[#FF2D78]' : 'border-[#222]'}`}>
                             {selectedPlan === id && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                          </div>
                       </div>
                       
                       <div className="space-y-2.5">
                          {p.features.map((f, i) => (
                             <div key={i} className="flex items-center gap-2.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${selectedPlan === id ? 'bg-[#FF2D78]' : 'bg-[#333]'}`} />
                                <span className="text-[#aaa] text-[13px] font-medium leading-tight">{f}</span>
                             </div>
                          ))}
                       </div>
                       
                       {id === 'pro' && (
                         <div className="absolute top-4 right-12 bg-[#FF2D78] text-white text-[9px] font-black px-2 py-0.5 rounded-full rotate-12 shadow-lg">
                            POPULAR
                         </div>
                       )}
                    </button>
                  ))}
               </div>
               
               <button 
                 onClick={() => setShowPlanSelector(false)}
                 className="w-full h-14 rounded-full bg-white text-black font-bold text-[15px] mb-4"
               >
                 Confirm Selection
               </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-24 left-6 right-6 z-[70]">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className={`p-4 rounded-[12px] shadow-2xl flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
           >
              <p className="text-white text-[13px] font-medium">{toast.message}</p>
           </motion.div>
        </div>
      )}
    </div>
  );
};
