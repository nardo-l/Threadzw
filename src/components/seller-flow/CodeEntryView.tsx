import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { ChevronLeft, Delete } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const CodeEntryView: React.FC<{ myShop: any; onActivated: () => void }> = ({ myShop, onActivated }) => {
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
    if (fullCode.length !== codeLength) {
      toast.error(`Enter all ${codeLength} characters.`);
      return;
    }

    setLoading(true);
    try {
      // Check code in Supabase
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

      // Mark code as used and update shop
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
    <div className="flex flex-col min-h-screen bg-black">
      <div className="p-4 flex items-center">
        <button onClick={() => setSellerFlowState('paywall')} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="flex-1 text-center font-bold text-white text-[17px]">Enter Access Code</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
        <div className="w-16 h-16 bg-[#FF2D781A] rounded-full flex items-center justify-center mb-6">
          <span className="text-[32px]">🗝️</span>
        </div>

        <h2 className="text-white text-[22px] font-bold mb-2">Check your WhatsApp</h2>
        <p className="text-[#888] text-[14px] leading-[1.5] mb-10 max-w-[260px]">
          We've sent a <span className="text-white font-bold">{codeLength}-character</span> access code to verify your payment.
        </p>

        <div className={`grid grid-cols-6 gap-2 mb-10 transition-all`}>
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

        {loading ? (
          <div className="flex items-center gap-3 text-[#FF2D78] font-bold text-[14px]">
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-[#FF2D7822] border-t-[#FF2D78] rounded-full" />
             Verifying Code...
          </div>
        ) : (
          <button 
            onClick={() => window.open('https://wa.me/263776223144', '_blank')}
            className="text-[#888] text-[13px] font-medium underline"
          >
            Didn't receive a code?
          </button>
        )}
      </div>

      <div className="p-8 text-center">
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#111] rounded-full text-[11px] text-[#888]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            Admin is currently verifying payments
         </div>
      </div>
    </div>
  );
};
