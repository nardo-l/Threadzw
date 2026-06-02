import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export const QuizResultView: React.FC = () => {
  const { setBuyerFlowState, userData } = useInventory();
  const { profile } = useAuth();
  
  // Receipt State
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(true);
  const [receiptError, setReceiptError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const personalityId = profile?.personality_type || (userData as any).personality || 'nonchalant';

  const result = useMemo(() => {
    const id = personalityId.toLowerCase();
    const map: Record<string, any> = {
      nonchalant: {
        name: "NONCHALANT",
        prefix: "THE",
        message: "You don't try to stand out. You just do. The fits are quiet, the presence is loud, and the energy never asks for permission. That's the rarest kind of drip."
      },
      chill: {
        name: "CHILL ONE",
        prefix: "THE",
        message: "You make it look easy because for you it is. No stress, no overthinking — just the right fit at the right time. Effortless is not a style. For you it's a lifestyle."
      },
      party: {
        name: "THE PARTY",
        prefix: "LIFE OF",
        message: "You don't arrive — you land. Every outfit is an event, every entrance is a statement. The room changes when you walk in and you know it. Own that."
      },
      hustler: {
        name: "HUSTLER",
        prefix: "THE",
        message: "Every fit is strategic. You dress for where you're going not where you are. Sharp, intentional, always ready. The grind shows in the drip."
      },
      ghost: {
        name: "GHOST",
        prefix: "THE",
        message: "You appear once and live in people's memories forever. Rare fits, quiet entries, unforgettable exits. Mystery is not an aesthetic. It's just who you are."
      },
      creative: {
        name: "CREATIVE",
        prefix: "THE",
        message: "Fashion is your first language. You don't follow trends you create references. Every outfit is a piece, every day a canvas. The most original people never fit a mold. You never will."
      }
    };
    return map[id] || map.nonchalant;
  }, [personalityId]);

  useEffect(() => {
    const fetchReceipt = async () => {
      setReceiptLoading(true);
      setReceiptError(false);
      try {
        let fileId = personalityId.toLowerCase();
        if (fileId === 'party') fileId = 'life_of_the_party';
        const fileName = `${fileId}.png`;
        const { data } = supabase.storage.from('personality-receipts').getPublicUrl(fileName);
        
        const img = new Image();
        img.src = data.publicUrl;
        img.onload = () => {
          setReceiptUrl(data.publicUrl);
          setReceiptLoading(false);
        };
        img.onerror = () => {
          setReceiptError(true);
          setReceiptLoading(false);
        };
      } catch (err) {
        setReceiptError(true);
        setReceiptLoading(false);
      }
    };
    fetchReceipt();
  }, [personalityId]);

  const handleDownload = async () => {
    if (!receiptUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(receiptUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thread_zw_${personalityId}_receipt.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Receipt saved ✓');
    } catch (err) {
      toast.error('Could not save receipt.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!receiptUrl) return;
    try {
      const response = await fetch(receiptUrl);
      const blob = await response.blob();
      const file = new File([blob], 'receipt.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Thread ZW',
          text: `I got ${result.prefix} ${result.name} on Thread ZW 🧵 @threadzw`
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-y-auto no-scrollbar">
      {/* Top Bar */}
      <button 
        onClick={() => setBuyerFlowState('home')}
        className="absolute top-5 right-5 z-20 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-md"
      >
        <X size={16} />
      </button>

      <div className="flex-1 flex flex-col pt-14 pb-12">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-7 pt-14"
        >
          <span className="text-white/55 text-[15px] font-mono tracking-[0.2em] uppercase mb-1.5 block">
            YOU ARE...
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-white text-[38px] font-black font-bebas tracking-tight">
              {result.prefix}
            </span>
            <span className="text-[42px] font-black font-bebas tracking-tight bg-linear-to-br from-[#9B27AF] to-[#FF5FA2] bg-clip-text text-transparent italic">
              {result.name}
            </span>
          </div>
        </motion.div>

        {/* Receipt Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ 
            duration: 0.5, 
            delay: 0.15,
            ease: [0.34, 1.56, 0.64, 1]
          }}
          className="mt-8 px-5 relative"
        >
          <div className="relative shadow-[8px_12px_24px_rgba(0,0,0,0.6),-2px_-2px_8px_rgba(0,0,0,0.3)] rounded-[12px] overflow-hidden">
            <div className="bg-[#f5f0e8] min-h-[320px] w-full flex flex-col items-center justify-center">
              {receiptLoading ? (
                <div className="flex flex-col items-center gap-2.5">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-[2.5px] border-[#ddd] border-t-[#555] rounded-full"
                  />
                  <span className="text-[#888] text-[12px] font-mono">Preparing your receipt...</span>
                </div>
              ) : receiptError || !receiptUrl ? (
                <div className="flex flex-col items-center gap-2.5">
                  <span className="text-[36px]">🧾</span>
                  <span className="text-[#777] text-[13px] font-mono">Receipt coming soon</span>
                </div>
              ) : (
                <img 
                  src={receiptUrl} 
                  alt="Personality Receipt" 
                  className="w-full h-auto block"
                />
              )}
            </div>
            
            {/* Curled Corner Effect */}
            <div className="absolute bottom-[-4px] right-[12px] w-10 h-10 bg-radial-[circle_at_bottom_right] from-black/40 to-transparent rounded-br-[4px] pointer-events-none" />
          </div>
        </motion.div>

        {/* Message Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-8 px-6"
        >
          <span className="text-[#FF5FA2] text-[40px] font-serif leading-[0.6] block mb-1.5">"</span>
          <p className="text-white text-[15px] leading-[1.8] italic font-light">
            {result.message}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-7 px-6 space-y-4"
        >
          <div className="flex gap-2.5">
            <button 
              onClick={handleShare}
              className="flex-1 h-[52px] bg-linear-to-r from-[#9B27AF] to-[#FF5FA2] rounded-[12px] text-white font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              Share 📸
            </button>
            <button 
              onClick={() => setBuyerFlowState('home')}
              className="flex-1 h-[52px] bg-[#111] border border-[#222] rounded-[12px] text-white font-bold text-[14px] active:scale-[0.98] transition-transform"
            >
              Done
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 mt-3 text-center">
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="text-[#FF5FA2] text-[13px] font-medium flex items-center gap-1.5"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : '⬇️'} Save Receipt
            </button>
            
            <button 
              onClick={() => setBuyerFlowState('quiz')}
              className="text-[#888] text-[12px] mt-2 underline"
            >
              Retake Quiz
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
