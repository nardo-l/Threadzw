import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../App';

const MUSIFY_URL = 'https://muzify.com/';

interface CommunityCardData {
  id: string;
  card_key: string;
  image_url: string;
}

export const CommunityHub: React.FC = () => {
  const t = useTheme();
  const { setCommunityScreen } = useInventory();
  const { profile } = useAuth();
  const [communityCardImages, setCommunityCardImages] = useState<Record<string, CommunityCardData>>({});
  const [loading, setLoading] = useState(true);

  const fetchCommunityCards = async () => {
    try {
      const { data } = await supabase
        .from('community_cards')
        .select('*');
      
      if (data) {
        const cardMap: Record<string, CommunityCardData> = {};
        data.forEach(card => {
          cardMap[card.card_key] = card;
        });
        setCommunityCardImages(cardMap);
      }
    } catch (err) {
      console.error('Community cards error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityCards();
  }, []);

  const cards = [
    {
      key: 'musify',
      title: 'Musify',
      description: 'Quick song quiz for your personality',
      status: 'LIVE',
      action: () => window.open(MUSIFY_URL, '_blank'),
      color: '#22c55e', // Green
      rotate: -8,
      zIndex: 1,
      style: { left: '0px', top: '30px', transformOrigin: 'bottom center' }
    },
    {
      key: 'how_fly',
      title: 'How Fly Are You?',
      description: 'Find your style personality',
      status: 'LIVE',
      action: () => setCommunityScreen('quiz'),
      color: '#ec4899', // Pink
      rotate: 0,
      zIndex: 3,
      style: { left: '50%', transform: 'translateX(-50%)', top: '0px', transformOrigin: 'bottom center' }
    },
    {
      key: 'best_dresser',
      title: 'Best Dresser',
      description: 'Monthly contest. Win $30 cash.',
      status: 'SOON',
      action: () => setCommunityScreen('bestDresser'),
      color: '#9333ea', // Purple
      rotate: 8,
      zIndex: 2,
      style: { right: '0px', top: '30px', transformOrigin: 'bottom center' }
    }
  ];

  return (
    <div className="flex flex-col min-h-screen pb-[120px]" style={{ background: t.bg_primary }}>
      {/* TOP BAR */}
      <header className="px-5 pt-8 pb-1">
        <h1 className="font-bold text-[18px]" style={{ color: t.text_primary }}>Community</h1>
      </header>

      {/* SUBTITLE */}
      <p className="px-5 mt-1 mb-8 text-[14px]" style={{ color: t.text_tertiary }}>
        What are you into?
      </p>

      {/* THREE CARD FAN LAYOUT */}
      <div className="relative h-[420px] mx-4 mt-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
             {/* Skeleton Fan */}
             {[-8, 0, 8].map((rot, i) => (
                <div 
                  key={i}
                  className="absolute w-[185px] aspect-[3/4] rounded-[20px] animate-pulse border shadow-2xl"
                  style={{
                    background: t.bg_card,
                    borderColor: t.border_secondary,
                    left: i === 0 ? '0px' : i === 1 ? '50%' : 'auto',
                    right: i === 2 ? '0px' : 'auto',
                    top: i === 1 ? '0px' : '30px',
                    transform: i === 1 ? 'translateX(-50%)' : `rotate(${rot}deg)`,
                    transformOrigin: 'bottom center',
                    zIndex: i === 1 ? 3 : i === 0 ? 1 : 2
                  }}
                />
             ))}
          </div>
        ) : (
          cards.map((card) => (
            <motion.div
              key={card.key}
              whileTap={{ scale: 0.97 }}
              onClick={card.action}
              className="absolute w-[185px] aspect-[3/4] cursor-pointer"
              style={{
                ...card.style as any,
                zIndex: card.zIndex,
                transform: `${card.style.transform || ''} rotate(${card.rotate}deg)`
              }}
            >
              <div className="relative w-full h-full rounded-[20px] overflow-hidden shadow-2xl border" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
                {/* Background Image Layer */}
                <div className="absolute inset-0">
                  {communityCardImages[card.key]?.image_url ? (
                    <img
                      src={communityCardImages[card.key].image_url}
                      alt={card.title}
                      className="w-full h-full object-cover blur-[3px] brightness-[0.5] scale-110"
                    />
                  ) : (
                    <div 
                      className="w-full h-full"
                      style={{ 
                        background: card.key === 'musify' 
                          ? 'linear-gradient(135deg, #1a0a2a, #2a0a1a)'
                          : card.key === 'how_fly'
                          ? 'linear-gradient(135deg, #0a0a1a, #1a0a2a)'
                          : 'linear-gradient(135deg, #0a1a0a, #0a0a1a)'
                      }}
                    />
                  )}
                </div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-black/92 via-black/40 to-transparent" />

                {/* Card Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-start">
                   {/* Status Badge */}
                   <div className={`mb-2 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider`}
                     style={{ 
                       background: card.status === 'LIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(147, 51, 234, 0.2)',
                       borderColor: card.status === 'LIVE' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(147, 51, 234, 0.4)',
                       color: card.status === 'LIVE' ? '#22c55e' : '#9333ea'
                     }}
                   >
                     {card.status}
                   </div>

                   <h3 className="text-white font-bold text-[16px] leading-tight mb-1">
                     {card.title}
                   </h3>
                   <p className="text-white/70 text-[11px] leading-snug line-clamp-2">
                     {card.description}
                   </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* BELOW THE CARDS */}
      <div className="mt-8 flex flex-col items-center">
         <p className="text-[12px]" style={{ color: t.text_tertiary }}>Tap a card to explore</p>
         <div className="flex gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#ec4899]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#9333ea]" />
         </div>
      </div>
    </div>
  );
};
