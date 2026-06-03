import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Share2, ArrowRight, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface RevealScreenProps {
  myShop: {
    id: string;
    name: string;
    handle: string;
    category: string;
    town: string;
    avatar_url?: string;
    logo_url?: string;
    banner_url?: string;
  } | null;
  setAppStage: (stage: 'paywall' | 'onboarding' | 'building' | 'reveal' | 'dashboard' | null) => void;
}

// Particle confetti model
interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotate: number;
  delay: number;
}

const CONFETTI_COLORS = ['#C6FF00', '#FF7A00', '#22C55E', '#3B82F6', '#EC4899', '#FBBF24'];

export const RevealScreen: React.FC<RevealScreenProps> = ({ myShop, setAppStage }) => {
  const [copied, setCopied] = useState(false);
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  const handle = myShop?.handle || 'shop';
  const shopUrl = `threadzw.vercel.app/shop/@${handle}`;

  // Generate 45 random particle pieces on mount
  useEffect(() => {
    const list: ConfettiParticle[] = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10, // 10% to 90% horizontal range
      y: Math.random() * -45 - 10, // Start just above preview screen
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 6,
      rotate: Math.random() * 360,
      delay: Math.random() * 0.4
    }));
    setParticles(list);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${shopUrl}`);
      setCopied(true);
      toast.success('Shop link copied ✓');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Could not copy link.');
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Check out my new online clothing shop on ThreadZW! Browse our items live at: https://${shopUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noreferrer,noopener');
    toast.success('WhatsApp sharing initialized.');
  };

  return (
    <div className="bg-[#0B0B0B] min-h-screen text-white flex flex-col justify-between p-6 font-sans relative overflow-hidden select-none">
      
      {/* CUSTOM PARTICLES CONFETTI OVERLAY */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              top: `${p.y}%`, 
              left: `${p.x}%`, 
              opacity: 1, 
              rotate: p.rotate,
              scale: 1 
            }}
            animate={{ 
              top: '110%', 
              rotate: p.rotate + 720,
              opacity: [1, 1, 0.7, 0]
            }}
            transition={{ 
              duration: Math.random() * 2 + 2, 
              ease: [0.1, 0.8, 0.3, 1],
              delay: p.delay 
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size * (Math.random() > 0.5 ? 1.5 : 1),
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.6 ? '50%' : '2px',
              transformOrigin: 'center center'
            }}
          />
        ))}
      </div>

      {/* REVEAL CONTENT HEADER AREA */}
      <div className="w-full max-w-md mx-auto pt-16 flex-1 flex flex-col items-center text-center justify-center space-y-8 z-30">
        
        {/* GLOWING ICON AND SUCCESS HEADER */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            className="w-20 h-20 bg-[#C6FF00]/10 border border-[#C6FF00]/30 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-[#C6FF00]/10"
          >
            <Sparkles className="text-[#C6FF00]" size={36} />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white font-black text-[34px] tracking-tight leading-tight"
          >
            Your shop is <span className="text-[#C6FF00]">live!</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[#A1A1AA] text-sm leading-relaxed max-w-[280px]"
          >
            Congratulations! Your online catalog is configured and ready to receive customer orders.
          </motion.p>
        </div>

        {/* SHOP PREVIEW CARD BLOCK */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 0.6 }}
          className="w-full bg-[#151515] border border-[#2A2A2A] rounded-3xl overflow-hidden shadow-2xl text-left"
        >
          {/* Banner cover layout */}
          <div className="h-28 bg-[#202020] relative overflow-hidden">
            {myShop?.banner_url ? (
              <img src={myShop.banner_url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#151515] to-stone-900" />
            )}
            <div className="absolute top-3 right-3 bg-black/60 border border-white/5 text-[11px] font-bold text-[#C6FF00] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <span className="w-2 h-2 rounded-full bg-[#00c864] shrink-0" /> Trial Active
            </div>
          </div>

          {/* Shop information rows */}
          <div className="p-5.5 relative">
            
            {/* Round Avatar image overlap */}
            <div className="absolute -top-10 left-5 w-16 h-16 rounded-full border-3 border-[#151515] bg-[#1A1A1A] overflow-hidden shadow-xl">
              {(myShop?.logo_url || myShop?.avatar_url) ? (
                <img src={myShop.logo_url || myShop.avatar_url || undefined} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-2xl">
                  {myShop?.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="pt-8.5 space-y-1">
              <h3 className="text-white font-black text-xl leading-none">
                {myShop?.name || 'My Shop'}
              </h3>
              <p className="text-[#A1A1AA] text-xs">
                {myShop?.category || 'Clothing'} · Based in {myShop?.town || 'Zimbabwe'}
              </p>
            </div>

            {/* Custom URL Pill row with quick external link check */}
            <div className="mt-5 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl py-3.5 px-4 flex items-center justify-between">
              <span className="text-[#C6FF00] font-mono font-bold text-sm select-all">
                {shopUrl}
              </span>
              <button
                onClick={handleCopy}
                className="text-stone-400 hover:text-white cursor-pointer active:scale-95 transition-transform"
                aria-label="Copy shop link to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-[#C2FF00]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </motion.div>

        {/* QUICK SHARE ACTIONS ROW */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-full grid grid-cols-2 gap-3"
        >
          <button
            onClick={handleCopy}
            className="h-14 bg-[#151515] hover:bg-[#202020] border border-[#2A2A2A] rounded-2xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-colors"
          >
            <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy Link'}
          </button>
          
          <button
            onClick={handleWhatsAppShare}
            className="h-14 bg-[#25D366] hover:bg-[#22C35E] rounded-2xl flex items-center justify-center gap-2 font-black text-sm text-white cursor-pointer transition-colors"
          >
            <MessageSquare className="w-4 h-4 stroke-[2.5]" /> Share on WA
          </button>
        </motion.div>

      </div>

      {/* DASHBOARD ROUTE ACCESS BUTTON FIXED AT BOTTOM */}
      <div className="w-full max-w-sm mx-auto p-2 z-30">
        <button
          onClick={() => {
            console.log('User completed reveal view. Entering Dashboard.');
            localStorage.setItem('threadzw_onboarding_complete', 'true');
            setAppStage('dashboard');
          }}
          className="w-full bg-[#C6FF00] text-[#0B0B0B] font-black text-base h-14 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:opacity-95 transition-opacity"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

    </div>
  );
};
