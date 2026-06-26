import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, RotateCcw, X, Heart, Star, Sparkles, Loader2 } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { PERSONALITY_RESULTS } from '../../data/quizData';
import { toast } from 'sonner';

export const QuizResultView: React.FC = () => {
  const { setCommunityScreen } = useInventory();
  const { profile } = useAuth();
  
  const navigate = useNavigate();
  
  // Receipt State
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(true);
  const [receiptError, setReceiptError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDone = () => {
    setCommunityScreen('hub');
    navigate('/');
  };

  const personalityId = profile?.personality_type ? (
    { 'Nonchalant': 'nonchalant', 'Clean Cut': 'chill', 'Main Character': 'party', 'Hypebeast': 'hustler', 'Minimalist': 'ghost', 'Trend-Setter': 'creative' }[profile.personality_type] || profile.personality_type
  ) : 'nonchalant';

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
        
        // Check image
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
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto no-scrollbar bg-[#F5F5F5]">
      {/* Top Bar */}
      <button 
        onClick={handleDone}
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md bg-white/60 shadow-sm text-[#111111]"
      >
        <X size={20} />
      </button>

      <div className="flex-1 flex flex-col pt-14 pb-12">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-8 pt-14"
        >
          <span className="text-[13px] font-bold tracking-[0.2em] uppercase mb-2 block text-[#888888]">
            DRIP PROFILE...
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[36px] font-bold tracking-tight text-[#111111]">
              {result.prefix}
            </span>
            <span className="text-[48px] font-black tracking-tight bg-clip-text text-transparent italic bg-gradient-to-br from-[#9B27AF] to-[#C6FF00]">
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
          className="mt-10 px-6 relative"
        >
          <div 
            className="relative shadow-2xl rounded-[16px] overflow-hidden border border-[#EFEFEF] bg-white p-1"
          >
            <div className="min-h-[340px] w-full flex flex-col items-center justify-center bg-[#F9FAFB] rounded-[12px]">
              {receiptLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-[3px] rounded-full border-[#C6FF00]/20 border-t-[#C6FF00]"
                  />
                  <span className="text-[12px] font-bold text-[#888888]">Printing receipt...</span>
                </div>
              ) : receiptError || !receiptUrl ? (
                <div className="flex flex-col items-center gap-3">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-[32px]">🧾</span>
                   </div>
                  <span className="text-[13px] font-bold text-[#888888]">Receipt coming soon</span>
                </div>
              ) : (
                <img 
                  src={receiptUrl} 
                  alt="Personality Receipt" 
                  className="w-full h-auto block rounded-[10px]"
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* Message Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-12 px-8"
        >
          <span className="text-[44px] font-serif leading-[0.6] block mb-2 text-[#C6FF00]">"</span>
          <p className="text-[16px] leading-[1.8] font-medium text-[#111111]/80 italic">
            {result.message}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-10 px-8 space-y-4"
        >
          <div className="flex gap-3">
            <button 
              onClick={handleShare}
              className="flex-1 h-[56px] rounded-full text-white font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xl bg-gradient-to-br from-[#9B27AF] to-[#C6FF00]"
            >
              Share Drip 📸
            </button>
            <button 
              onClick={handleDone}
              className="flex-1 h-[56px] border border-[#EFEFEF] rounded-full font-bold text-[15px] active:scale-[0.98] transition-all bg-white text-[#111111] shadow-sm"
            >
              Finish
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 mt-4">
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="text-[14px] font-bold flex items-center gap-2 text-[#C6FF00] hover:opacity-80 transition-opacity"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : '⬇️'} Download Receipt
            </button>
            
            <button 
              onClick={() => setCommunityScreen('quiz')}
              className="text-[12px] font-medium underline text-[#888888] decoration-dotted"
            >
              Retake Quiz
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
