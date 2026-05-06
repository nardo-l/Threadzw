import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

interface StyleCard {
  id: string;
  image_url: string;
  style_label: string;
  result_headline: string;
  result_message: string;
  result_emoji: string;
  result_stat: string;
  display_order: number;
}

export const StylePicker = ({ onComplete }: { onComplete: () => void }) => {
  const navigate = useNavigate();
  const [styleCards, setStyleCards] = useState<StyleCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedCard, setSelectedCard] = useState<StyleCard | null>(null);

  const fetchStyleCards = async () => {
    try {
      setLoadingCards(true);
      const { data, error } = await supabase
        .from('style_cards')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setStyleCards(data);
      } else {
        // Fallback or empty
        setStyleCards([]);
      }
    } catch (err) {
      console.error('Style cards error:', err);
    } finally {
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    fetchStyleCards();
  }, []);

  const handleContinue = () => {
    if (selectedCard) {
      navigate('/onboarding/style-result', { state: { selectedCard } });
    }
  };

  const handleSkip = () => {
    localStorage.setItem('thread_onboarding_complete', 'true');
    localStorage.setItem('thread_style_picked', 'true');
    onComplete();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Top Section */}
      <div className="pt-[60px] px-6 text-center relative">
        <div className="absolute top-4 right-4">
          <button 
            onClick={handleSkip}
            className="text-white/60 text-[13px] font-medium px-2 py-1"
          >
            Skip
          </button>
        </div>
        <h1 className="font-pacifico text-[#FF2D78] text-[22px]">thread</h1>
        <h2 className="mt-6 text-[28px] font-bold leading-[1.2]">What's your style?</h2>
        <p className="mt-2.5 text-[#888] text-[15px] max-w-[260px] mx-auto">
          Pick the outfit that speaks to you.
        </p>
        <div className="mt-4 flex items-center justify-center gap-1.5 uppercase tracking-wider text-[12px] text-[#888]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF2D78]" />
          Pick one
        </div>
      </div>

      {/* Style Cards Grid */}
      <div className="mt-6 px-5 flex-1 pb-[100px]">
        {loadingCards ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-[#1a1a1a] rounded-[16px] animate-pulse"
                style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
              />
            ))}
          </div>
        ) : styleCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[60px] px-8 text-center">
            <span className="text-[48px]">👗</span>
            <h3 className="mt-4 text-[18px] font-bold">Styles coming soon</h3>
            <p className="mt-2 text-[#888] text-[13px]">Check back at launch</p>
            <button
              onClick={handleSkip}
              className="mt-6 bg-[#111] border border-[#222] rounded-full h-[42px] px-7 text-[#888] text-[13px]"
            >
              Skip for now →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {styleCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                onClick={() => setSelectedCard(card)}
                className={`relative aspect-[3/4] rounded-[16px] overflow-hidden cursor-pointer transition-all duration-150 ${
                  selectedCard?.id === card.id
                    ? 'border-[2.5px] border-[#FF2D78] shadow-[0_0_0_3px_rgba(255,45,120,0.25)] scale-[1.02]'
                    : 'border-2 border-transparent'
                }`}
              >
                <img
                  src={card.image_url}
                  alt={card.style_label}
                  className="absolute inset-0 w-full h-full object-cover bg-[#1a1a1a]"
                />
                <div className="absolute bottom-0 inset-x-0 h-[55%] bg-gradient-to-t from-black/90 to-transparent" />
                <span className="absolute bottom-3 left-3 text-white text-[14px] font-bold">
                  {card.style_label}
                </span>

                {selectedCard?.id === card.id && (
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#FF2D78] border-2 border-black flex items-center justify-center text-white font-bold text-[14px]">
                    ✓
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 inset-x-0 bg-black border-t border-[#111] p-4 pb-8 flex justify-center">
        {!selectedCard ? (
          <button
            disabled
            className="w-full h-[48px] rounded-full bg-[#1a1a1a] border border-[#222] text-[#555] font-bold text-[14px] pointer-events-none"
          >
            Choose your style above
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="w-full h-[48px] rounded-full bg-gradient-to-r from-[#FF2D78] to-[#9F33FF] text-white font-bold text-[14px] px-[28px]"
          >
            This Is My Style →
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
