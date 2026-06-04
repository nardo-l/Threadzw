import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Bookmark, ArrowRight, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInventory } from '../context/InventoryContext';
import { MOCK_SHOPS, MOCK_PRODUCTS } from '../data/mockData';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const FRAME_DURATION = 5000;

export const StoriesViewer: React.FC = () => {
  const navigate = useNavigate();
  const { 
    storiesViewerOpen, 
    setStoriesViewerOpen, 
    currentStoryShopId, 
    markStoryAsSeen,
    stories,
    products
  } = useInventory();
  const { session } = useAuth();

  // Group stories by shop
  const shopsWithStories = useMemo(() => {
    const grouped: Record<string, any> = {};
    stories.forEach(story => {
      if (!grouped[story.shop_id]) {
        grouped[story.shop_id] = {
          id: story.shop_id,
          name: story.shop?.name || 'Shop',
          avatar: story.shop?.avatar_url || '🏪',
          stories: []
        };
      }
      grouped[story.shop_id].stories.push(story);
    });
    return Object.values(grouped);
  }, [stories]);

  const [shopIndex, setShopIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(FRAME_DURATION);

  const currentShop = shopsWithStories[shopIndex];
  
  const currentStories = currentShop?.stories || [];
  const currentStory = currentStories[frameIndex];

  // Get product info if story is linked to one
  const currentProduct = useMemo(() => {
    if (!currentStory?.product_id) return null;
    return products.find(p => p.id === currentStory.product_id);
  }, [currentStory, products]);

  useEffect(() => {
    if (currentStoryShopId) {
      const index = shopsWithStories.findIndex(s => s.id === currentStoryShopId);
      if (index !== -1) {
        setShopIndex(index);
        setFrameIndex(0);
      }
    }
  }, [currentStoryShopId, shopsWithStories]);

  const nextFrame = () => {
    if (frameIndex < currentStories.length - 1) {
      setFrameIndex(prev => prev + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
      remainingTimeRef.current = FRAME_DURATION;
    } else if (shopIndex < shopsWithStories.length - 1) {
      markStoryAsSeen(currentShop.id);
      setShopIndex(prev => prev + 1);
      setFrameIndex(0);
      setProgress(0);
      startTimeRef.current = Date.now();
      remainingTimeRef.current = FRAME_DURATION;
    } else {
      handleClose();
    }
  };

  const prevFrame = () => {
    if (frameIndex > 0) {
      setFrameIndex(prev => prev - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
      remainingTimeRef.current = FRAME_DURATION;
    } else if (shopIndex > 0) {
      setShopIndex(prev => prev - 1);
      const prevShop = shopsWithStories[shopIndex - 1];
      setFrameIndex(prevShop.stories.length - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
      remainingTimeRef.current = FRAME_DURATION;
    } else {
      setFrameIndex(0);
      setProgress(0);
      startTimeRef.current = Date.now();
      remainingTimeRef.current = FRAME_DURATION;
    }
  };

  useEffect(() => {
    if (!storiesViewerOpen || isPaused) return;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = (elapsed / FRAME_DURATION) * 100;
      
      if (newProgress >= 100) {
        nextFrame();
      } else {
        setProgress(newProgress);
        timerRef.current = requestAnimationFrame(tick) as any;
      }
    };

    startTimeRef.current = Date.now() - (progress / 100) * FRAME_DURATION;
    timerRef.current = requestAnimationFrame(tick) as any;

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current as any);
    };
  }, [storiesViewerOpen, isPaused, frameIndex, shopIndex]);

  const handleClose = () => {
    if (currentShop) markStoryAsSeen(currentShop.id);
    setStoriesViewerOpen(false);
    setShopIndex(0);
    setFrameIndex(0);
    setProgress(0);
  };

  const handleSave = () => {
    if (!session) return;
    setIsSaved(!isSaved);
    if (!isSaved) {
      toast.success('Saved ✓', {
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a' }
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStart !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStart;
      if (deltaY > 80) {
        handleClose();
      }
    }
    setTouchStart(null);
  };

  const gradients = [
    'linear-gradient(160deg, #f72585 0%, #1a1a1a 60%)',
    'linear-gradient(200deg, #7209b7 0%, #0d0d0d 60%)',
    'linear-gradient(140deg, #1a1a1a 0%, #f72585 60%, #7209b7 100%)'
  ];

  if (!storiesViewerOpen || !currentShop || !currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[1000] bg-background flex flex-col max-w-[430px] mx-auto overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
          {currentStories.map((s, i) => (
            <div key={s.id || `progress-${i}`} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 linear"
                style={{ 
                  width: i < frameIndex ? '100%' : i === frameIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Shop Info */}
        <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-elevated border-2 border-primary overflow-hidden flex items-center justify-center text-xl">
              {currentShop.avatar && currentShop.avatar.startsWith('http') ? (
                <img src={currentShop.avatar} alt={currentShop.name} className="w-full h-full object-cover" />
              ) : (
                currentShop.avatar
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white leading-none">{currentShop.name}</span>
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
                {currentStory.content ? 'Latest Update' : 'New Drop'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted ml-2">
              {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {isPaused && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex items-center gap-1 px-2 py-1 bg-black/40 rounded-full"
              >
                <Pause size={10} className="text-white" />
                <span className="text-[8px] font-mono text-white uppercase">Paused</span>
              </motion.div>
            )}
            <button 
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Multi-Shop Indicator */}
        <div className="absolute top-20 left-4 z-50 flex gap-1.5">
          {shopsWithStories.map((s, i) => (
            <div 
              key={s.id} 
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === shopIndex ? 'bg-white scale-125' : 'bg-white/20'}`} 
            />
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative">
          {/* Gradient Background */}
          <div 
            className="absolute inset-0 transition-all duration-500 bg-[#111]"
          />

          {/* Media Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            {currentStory.media_type === 'image' ? (
              <motion.img 
                key={currentStory.id}
                src={currentStory.media_url}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            ) : (
              <video 
                src={currentStory.media_url} 
                autoPlay 
                muted 
                loop 
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

          {/* Tap Zones */}
          <div className="absolute inset-0 flex">
            <div 
              className="flex-1 h-full" 
              onClick={(e) => {
                e.stopPropagation();
                prevFrame();
              }}
            />
            <div 
              className="flex-1 h-full" 
              onClick={(e) => {
                e.stopPropagation();
                nextFrame();
              }}
            />
          </div>
        </div>

        {/* Bottom Info */}
        <div className="p-6 pb-10 bg-black/80 backdrop-blur-xl flex flex-col gap-6 z-50">
          <div className="flex flex-col gap-2">
            {currentProduct && (
              <>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest">
                      {currentProduct.total_stock > 0 ? `Only ${currentProduct.total_stock} left` : 'Out of Stock'}
                    </span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-white leading-tight">
                  {currentProduct.name}
                </h2>

                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#C6FF00]">${currentProduct.price}</span>
                  {currentProduct.price < 50 && (
                     <span className="text-sm text-muted line-through">$60</span>
                  )}
                </div>
              </>
            )}
            
            {currentStory.content && !currentProduct && (
               <p className="text-white text-lg font-bold">{currentStory.content}</p>
            )}

            <span className="text-xs font-mono text-muted">by {currentShop.name}</span>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleSave}
              className="flex-1 py-4 bg-white/5 border border-white/10 rounded-full flex items-center justify-center gap-2 text-white font-medium transition-all active:scale-95"
            >
              <Bookmark size={18} className={isSaved ? 'fill-[#C6FF00] text-[#C6FF00]' : ''} />
              Save
            </button>
            {currentProduct ? (
              <button 
                onClick={() => {
                  handleClose();
                  navigate(`/product/${currentProduct.id}`);
                }}
                className="flex-[2] py-4 bg-linear-to-r from-[#9B27AF] to-[#C6FF00] text-white rounded-full flex items-center justify-center gap-2 font-bold shadow-lg transition-all active:scale-95"
              >
                View Product <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                onClick={() => {
                  handleClose();
                  navigate(`/shop/${currentShop.id}`);
                }}
                className="flex-[2] py-4 bg-linear-to-r from-[#9B27AF] to-[#C6FF00] text-white rounded-full flex items-center justify-center gap-2 font-bold shadow-lg transition-all active:scale-95"
              >
                Visit Shop <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Long Press Overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-none z-40"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
