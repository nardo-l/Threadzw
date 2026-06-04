import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { QUIZ_QUESTIONS, PERSONALITY_RESULTS, ANSWER_MAP } from '../data/mockData';
import { toast } from 'sonner';

export const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<typeof QUIZ_QUESTIONS>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  
  // Receipt State
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const { user, updateProfile } = useAuth();

  useEffect(() => {
    setQuestions(QUIZ_QUESTIONS);
  }, []);

  const calculatePersonality = (ans: number[]) => {
    const counts: Record<string, number> = {
      nonchalant: 0,
      chill: 0,
      party: 0,
      hustler: 0,
      ghost: 0,
      creative: 0
    };

    const optionKeys = ['a', 'b', 'c', 'd'];
    ans.forEach((optionIdx, qIdx) => {
      const qKey = `q${qIdx + 1}`;
      const optionKey = optionKeys[optionIdx];
      const result = ANSWER_MAP[qKey]?.[optionKey];
      if (result && counts[result] !== undefined) {
        counts[result]++;
      }
    });

    const scoresArray = Object.entries(counts).map(([id, count]) => ({ id, count }));
    const top = scoresArray.sort((a, b) => b.count - a.count)[0];
    const personality = PERSONALITY_RESULTS.find(r => r.id === top.id) || PERSONALITY_RESULTS[0];

    const dripScore = Math.min(100, Math.round(((counts.nonchalant + counts.ghost) / 4) * 100));
    const fitScore = Math.min(100, Math.round(((counts.chill + counts.creative) / 4) * 100));
    const sauceScore = Math.min(100, Math.round(((counts.party + counts.hustler) / 4) * 100));

    return {
      ...personality,
      stats: {
        drip: Math.max(10, dripScore),
        fit: Math.max(10, fitScore),
        sauciness: Math.max(10, sauceScore)
      }
    };
  };

  const fetchReceiptImage = async (personalityId: string) => {
    setReceiptLoading(true);
    setReceiptError(false);
    
    try {
      let fileId = personalityId.toLowerCase();
      // Apply common renames
      if (fileId === 'party') fileId = 'life_of_the_party';
      
      const fileName = fileId + '.png';
      const { data } = supabase.storage.from('personality-receipts').getPublicUrl(fileName);
      
      // Verification logic with fallback
      const checkImage = (url: string): Promise<boolean> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
      };

      const exists = await checkImage(data.publicUrl);
      
      if (exists) {
        setReceiptUrl(data.publicUrl);
        setReceiptLoading(false);
      } else if (fileId === 'creative') {
        // Fallback for creative personality which often has mapping issues
        const { data: fallbackData } = supabase.storage.from('personality-receipts').getPublicUrl('trendsetter.png');
        const fallbackExists = await checkImage(fallbackData.publicUrl);
        if (fallbackExists) {
          setReceiptUrl(fallbackData.publicUrl);
        } else {
          setReceiptError(true);
        }
        setReceiptLoading(false);
      } else {
        setReceiptError(true);
        setReceiptLoading(false);
      }
    } catch (err) {
      setReceiptError(true);
      setReceiptLoading(false);
    }
  };

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers, optionIdx];
    setAnswers(newAnswers);
    
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      revealResult(newAnswers);
    }
  };

  const revealResult = async (finalAnswers: number[]) => {
    setIsRevealing(true);
    const personality = calculatePersonality(finalAnswers);
    
    try {
      if (user) {
        await updateProfile({ personality_type: personality.id });
        await supabase.from('personality_results').upsert({
          user_id: user.id,
          personality_type: personality.id,
          drip_score: personality.stats.drip,
          fit_score: personality.stats.fit,
          sauce_score: personality.stats.sauciness,
          answers: finalAnswers.map(a => a.toString()),
          is_current: true
        }, { onConflict: 'user_id' });
      }
    } catch (error) {
      console.error('Error saving personality results:', error);
    } finally {
      fetchReceiptImage(personality.id);
      setTimeout(() => {
        setResult(personality);
        setIsRevealing(false);
      }, 2000);
    }
  };

  const handleDownload = async () => {
    if (!receiptUrl) return;
    setIsDownloading(true);
    try {
      // Get the path from the URL
      const path = receiptUrl.split('personality-receipts/')[1];
      if (!path) throw new Error('Invalid URL');
      
      const { data: blob, error } = await supabase.storage
        .from('personality-receipts')
        .download(path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thread_zw_${result.id}_receipt.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Receipt saved ✓');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Could not save receipt.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!receiptUrl) return;
    setIsSharing(true);
    try {
      // Get the path from the URL
      const path = receiptUrl.split('personality-receipts/')[1];
      if (!path) throw new Error('Invalid URL');
      
      const { data: blob, error } = await supabase.storage
        .from('personality-receipts')
        .download(path);
      
      if (error) throw error;
      
      const file = new File([blob], 'thread_zw_receipt.png', { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Thread ZW',
          text: 'My style personality on Thread ZW 🧵'
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'thread_zw_receipt.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Image saved! Share it to your story.');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share error:', err);
        toast.error('Could not share.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (questions.length === 0) return null;

  if (result) {
    const getGradient = (id: string) => {
      switch (id) {
        case 'nonchalant': return 'from-gray-400 via-gray-100 to-gray-500';
        case 'creative': return 'from-[#9F33FF] via-[#C6FF00] to-[#FF8A00]';
        case 'party': return 'from-[#C6FF00] to-[#FF8A00]';
        case 'hustler': return 'from-[#22c55e] to-[#10b981]';
        case 'ghost': return 'from-[#3b82f6] to-[#1d4ed8]';
        case 'chill': return 'from-[#f59e0b] to-[#ea580c]';
        default: return 'from-[#C6FF00] to-[#9F33FF]';
      }
    };

    const container: any = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.15
        }
      }
    };

    const item: any = {
      hidden: { opacity: 0, y: 30 },
      show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
      <div className="min-h-screen bg-black flex flex-col overflow-y-auto no-scrollbar font-sans selection:bg-[#C6FF00]/30">
        <main className="flex-1 px-8 pt-20 pb-12 flex flex-col items-center">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full flex flex-col items-center text-center"
          >
            <motion.div variants={item} className="mb-2">
              <span className="text-[#666] text-[12px] font-black uppercase tracking-[0.3em]">You are...</span>
            </motion.div>
            
            <motion.h1 
              variants={item}
              className={`text-[56px] font-black leading-[1] tracking-tighter bg-linear-to-b ${getGradient(result.id)} bg-clip-text text-transparent mb-12 py-2`}
            >
              {result.type}
            </motion.h1>

            {/* RECEIPT SECTION */}
            <motion.div variants={item} className="w-full max-w-[340px] mb-12">
              <div className="rounded-[24px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(255,45,120,0.15)] bg-[#111] border border-white/5 relative">
                {receiptLoading ? (
                  <div className="aspect-[3/5] flex flex-col items-center justify-center bg-[#050505]">
                    <div className="w-10 h-10 border-[3px] border-white/10 border-t-[#C6FF00] rounded-full animate-spin" />
                    <span className="text-[#444] text-[11px] font-mono mt-4 uppercase tracking-widest">Printing Receipt...</span>
                  </div>
                ) : receiptError ? (
                  <div className="aspect-[3/5] flex flex-col items-center justify-center bg-[#050505] p-10">
                    <span className="text-[48px] mb-4">🧾</span>
                    <h5 className="text-white text-[16px] font-bold mb-2">Receipt Lost</h5>
                    <p className="text-[#666] text-[13px] leading-relaxed">The style servers couldn't handle your sauce. Check back later.</p>
                  </div>
                ) : receiptUrl ? (
                  <img 
                    src={receiptUrl} 
                    className="w-full h-auto block" 
                    alt="Personality Receipt" 
                    referrerPolicy="no-referrer"
                  />
                ) : null}
              </div>
            </motion.div>

            {/* QUOTE CARD */}
            <motion.div variants={item} className="w-full max-w-[340px] bg-[#111] border border-white/5 rounded-[24px] p-8 mb-12 text-left relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#C6FF00] opacity-5 blur-3xl -mr-16 -mt-16" />
               <span className="text-[#C6FF00] text-[48px] font-serif absolute top-2 right-6 opacity-20">"</span>
               <p className="text-white text-[18px] font-medium leading-[1.6] relative z-10 italic">
                 {result.description}
               </p>
            </motion.div>

            {/* ACTIONS */}
            <motion.div variants={item} className="w-full max-w-[340px] flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="h-[60px] bg-white text-black font-bold text-[14px] rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="animate-spin" size={20} /> : 'Save View'}
                </button>
                <button 
                  onClick={handleShare}
                  disabled={isSharing}
                  className="h-[60px] bg-[#9F33FF] text-white font-bold text-[14px] rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {isSharing ? <Loader2 className="animate-spin" size={20} /> : 'Share Story'}
                </button>
              </div>

              <button 
                onClick={() => {
                  setResult(null);
                  setCurrentIdx(0);
                  setAnswers([]);
                  setReceiptUrl(null);
                }}
                className="w-full h-[60px] bg-[#111] border border-white/5 text-[#888] font-bold text-[14px] rounded-full flex items-center justify-center active:bg-white/5 transition-colors"
              >
                Retake Quiz
              </button>
            </motion.div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (isRevealing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center font-sans tracking-tight">
        <div className="w-16 h-16 border-[3px] border-[#222] border-t-[#C6FF00] rounded-full animate-spin mb-8" />
        <h2 className="text-[22px] font-bold text-white">Analyzing your drip...</h2>
        <p className="mt-2 text-[#888] text-[14px]">Calculing style score from your answers.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col h-screen bg-black font-sans">
      <header className="p-8 pt-12 flex flex-col gap-6 shrink-0">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <span className="text-[#C6FF00] font-pacifico text-[18px]">thread</span>
          <div className="w-6" />
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-[11px] font-bold text-[#555] uppercase tracking-[0.2em]">
            <span>Question {currentIdx + 1}/{questions.length}</span>
            <span>{Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-1 w-full bg-[#111] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#C6FF00] transition-all duration-500" 
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-12 px-8 flex flex-col justify-center">
        <h2 className="text-[28px] font-bold text-white text-center leading-[1.2] mb-10">
          {currentQuestion.question}
        </h2>

        <div className="flex flex-col w-full gap-3 max-w-[340px] mx-auto">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={option}
              onClick={() => handleAnswer(idx)}
              className="w-full p-4 bg-[#111] border border-[#222] rounded-[16px] flex items-center gap-4 text-left hover:border-[#C6FF0014] active:scale-[0.98] transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[13px] font-bold text-[#555] group-hover:bg-[#C6FF00] group-hover:text-white transition-colors">
                {optionLabels[idx]}
              </div>
              <span className="flex-1 text-white text-[15px] font-medium leading-snug">
                {option}
              </span>
            </button>
          ))}
        </div>
      </main>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
};
