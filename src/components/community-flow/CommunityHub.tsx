import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Zap, ChevronRight } from 'lucide-react';

const MUSIFY_URL = 'https://muzify.com/';

interface CommunityCardData {
  id: string;
  card_key: string;
  image_url: string;
}

export const CommunityHub: React.FC = () => {
  const navigate = useNavigate();
  const { setCommunityScreen } = useInventory();
  const { profile, session } = useAuth();
  const [communityCardImages, setCommunityCardImages] = useState<Record<string, CommunityCardData>>({});
  const [loading, setLoading] = useState(true);
  const [userChallenge, setUserChallenge] = useState<any>(null);

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

  const fetchUserChallenge = async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('creator_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) setUserChallenge(data);
    } catch (err) {
      console.error('User challenge fetch error:', err);
    }
  };

  useEffect(() => {
    fetchCommunityCards();
    fetchUserChallenge();
  }, [session]);

  const cards = [
    {
      key: 'musify',
      title: 'Musify',
      description: 'Know your music',
      status: 'LIVE',
      action: () => navigate('/musify', { state: { directShell: true } }),
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
    <div className="flex flex-col min-h-screen pb-[120px] bg-[#F5F5F5]">
      {/* TOP BAR */}
      <header className="px-5 pt-8 pb-1">
        <h1 className="font-bold text-[22px] text-[#111111]">Community</h1>
      </header>

      {/* SUBTITLE */}
      <p className="px-5 mt-1 mb-8 text-[14px] text-[#888888]">
        Join the conversation & compete
      </p>

      {/* THREE CARD FAN LAYOUT */}
      <div className="relative h-[420px] mx-4 mt-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
             {/* Skeleton Fan */}
             {[-8, 0, 8].map((rot, i) => (
                <div 
                  key={`skeleton-fan-${i}`}
                  className="absolute w-[185px] aspect-[3/4] rounded-[24px] animate-pulse border shadow-lg bg-white border-[#EFEFEF]"
                  style={{
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
              <div className="relative w-full h-full rounded-[24px] overflow-hidden shadow-2xl border bg-white border-[#EFEFEF]">
                {/* Background Image Layer */}
                <div className="absolute inset-0">
                  {communityCardImages[card.key]?.image_url ? (
                    <img
                      src={communityCardImages[card.key].image_url}
                      alt={card.title}
                      className="w-full h-full object-cover brightness-[0.7] scale-110"
                    />
                  ) : (
                    <div 
                      className="w-full h-full"
                      style={{ 
                        background: card.key === 'musify' 
                          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                          : card.key === 'how_fly'
                          ? 'linear-gradient(135deg, #ec4899, #db2777)'
                          : 'linear-gradient(135deg, #9333ea, #7e22ce)'
                      }}
                    />
                  )}
                </div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Card Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col items-start">
                   {/* Status Badge */}
                   <div className={`mb-3 px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider backdrop-blur-md`}
                     style={{ 
                       background: 'rgba(255, 255, 255, 0.2)',
                       borderColor: 'rgba(255, 255, 255, 0.4)',
                       color: '#FFFFFF'
                     }}
                   >
                     {card.status}
                   </div>

                   <h3 className="text-white font-bold text-[17px] leading-tight mb-1 shadow-sm">
                     {card.title}
                   </h3>
                   <p className="text-white/80 text-[11px] leading-snug line-clamp-2">
                     {card.description}
                   </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* BELOW THE CARDS */}
      <div className="mt-8 px-5">
         <motion.div
           whileTap={{ scale: 0.98 }}
           onClick={() => navigate('/challenge')}
           className="relative p-6 rounded-[24px] border overflow-hidden cursor-pointer bg-white border-[#EFEFEF] shadow-sm active:scale-[0.98] transition-all"
         >
           <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#9B27AF] to-[#FF2D78]" />
           
           <div className="flex items-center">
             <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#9B27AF] to-[#FF2D78] shadow-lg">
                <Zap className="text-white" size={24} fill="currentColor" />
             </div>
             
             <div className="ml-4 flex-1">
               <div className="flex items-center gap-2 mb-1.5">
                 <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#FF2D78]/10 text-[#FF2D78] border border-[#FF2D78]/20">
                   HOT
                 </span>
                 <div className="flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-green-500 text-[10px] font-bold uppercase tracking-tight">LIVE</span>
                 </div>
               </div>
               <h3 className="text-[17px] font-bold leading-tight text-[#111111]">The Challenge</h3>
               <p className="text-[12px] mt-0.5 text-[#888888]">Create your own & challenge friends</p>
             </div>
             
             <ChevronRight className="text-[#888888]" size={20} />
           </div>

           {userChallenge && (
             <div className="mt-5 pt-4 border-t flex items-center gap-3 border-[#EFEFEF]">
               <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-[#F5F5F5] flex items-center justify-center text-[10px] text-[#888888]">1</div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-[#EFEFEF] flex items-center justify-center text-[10px] text-[#888888]">2</div>
               </div>
               <p className="text-[11px] text-[#888888]">
                 <span className="font-bold text-[#FF2D78]">{userChallenge.attempt_count}</span> people have tried your challenge
               </p>
             </div>
           )}
         </motion.div>

         <div className="mt-8 flex flex-col items-center">
            <p className="text-[12px] text-[#888888] font-medium">Tap a card to start</p>
            <div className="flex gap-2.5 mt-3">
               <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] opacity-40" />
               <div className="w-2 h-2 rounded-full bg-[#ec4899]" />
               <div className="w-1.5 h-1.5 rounded-full bg-[#9333ea] opacity-40" />
            </div>
         </div>
      </div>
    </div>
  );
};
