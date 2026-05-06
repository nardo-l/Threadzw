import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useInventory } from '../../context/InventoryContext';

export const PaymentReceivedView: React.FC<{ myShop: any; onActivated: () => void }> = ({ myShop, onActivated }) => {
  const { setSellerFlowState } = useInventory();
  const codeLength = 6;
  const [code, setCode] = useState<string[]>(new Array(codeLength).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (loading) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(false);

    if (value && index < codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleManualSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== codeLength) return;

    setLoading(true);
    try {
      const { data: validCode, error: codeErr } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', fullCode)
        .eq('shop_id', myShop.id)
        .eq('is_used', false)
        .maybeSingle();

      if (codeErr) throw codeErr;

      if (!validCode) {
        setError(true);
        toast.error('Invalid access code.');
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 20);

      const { error: updateErr } = await supabase
        .from('shops')
        .update({
          subscription_status: 'active',
          is_live: true,
          access_code: fullCode,
          code_expires_at: expiresAt.toISOString(),
          last_code_activated_at: new Date().toISOString()
        })
        .eq('id', myShop.id);

      if (updateErr) throw updateErr;

      await supabase
        .from('access_codes')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', validCode.id);

      toast.success('Shop reactivated! 🎉');
      onActivated();
    } catch (err) {
      console.error(err);
      toast.error('Error verifying code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code.every(char => char !== '') && code.length === codeLength) {
      handleManualSubmit();
    }
  }, [code]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-sans">
      <div className="flex-1 flex flex-col items-center pt-[60px] px-10 text-center">
        <h1 className="text-[#FF2D78] font-pacifico text-[32px] mb-[32px]">thread</h1>
        
        <div className="text-[72px] mb-8 animate-pulse">⏳</div>
        
        <h2 className="text-white text-[24px] font-bold mb-2">Payment Received</h2>
        <p className="text-[#888] text-[14px] leading-[1.5] mb-10 max-w-[280px]">
          Our admin is verifying your payment. Your shop will be live in 30 mins.
        </p>

        {/* STATUS STEPS */}
        <div className="w-full space-y-4 mb-10 text-left max-w-[280px]">
           <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[12px]">✓</div>
              <span className="text-white text-[14px] font-medium">Payment Received</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center">
                 <motion.div 
                   animate={{ rotate: 360 }} 
                   transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                   className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full"
                 />
              </div>
              <span className="text-white text-[14px] font-medium">Verification in progress</span>
           </div>
           <div className="flex items-center gap-3 opacity-30">
              <div className="w-6 h-6 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-[12px]" />
              <span className="text-white text-[14px] font-medium">Shop goes live</span>
           </div>
        </div>

        <p className="text-[#888] text-[12px] mb-6 font-mono uppercase tracking-widest">Enter code if received</p>

        <div className="grid grid-cols-6 gap-2 mb-10 transition-all">
          {code.map((char, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              maxLength={1}
              value={char}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-10 h-10 bg-[#111] border rounded-[10px] text-center text-white text-[16px] font-bold outline-none uppercase transition-all
                ${error ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-[#222] focus:border-[#FF2D78]'}`}
            />
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-[#FF2D78] font-bold text-[14px]">
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-[#FF2D7822] border-t-[#FF2D78] rounded-full" />
             Verifying...
          </div>
        )}
      </div>

      <div className="p-8 text-center">
         <button 
            onClick={() => window.open('https://wa.me/263776223144', '_blank')}
            className="text-[#888] text-[13px] font-medium underline"
          >
            Need help? Chat with Admin
          </button>
      </div>
    </div>
  );
};
