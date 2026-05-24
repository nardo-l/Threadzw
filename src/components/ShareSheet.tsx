import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, MessageCircle, Share2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { toast } from 'sonner';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shop: {
    id: string;
    name: string;
    handle: string;
    logo_url?: string;
    avatar_url?: string;
  };
  onTrackShare?: () => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({ isOpen, onClose, shop, onTrackShare }) => {
  const [copied, setCopied] = useState(false);

  const getShopLink = (handle: string) => {
    return 'https://threadzw.vercel.app/shop/@' + handle.toLowerCase();
  };

  const handleCopyLink = async () => {
    const link = getShopLink(shop.handle);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('Link copied to clipboard ✓');
      onTrackShare?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Could not copy link.');
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Check out ${shop.name} on Zimbabwe ThreadZW! 🧵\n${getShopLink(shop.handle)}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    onTrackShare?.();
    onClose();
  };

  const shareViaTwitter = () => {
    const tweet = encodeURIComponent(
      `Check out ${shop.name} on @threadzw — Zimbabwe's fashion marketplace 🧵\n\n${getShopLink(shop.handle)}\n\n#ZimbabweFashion #ThreadZW`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank');
    onTrackShare?.();
    onClose();
  };

  const shareViaInstagram = () => {
    handleCopyLink();
    toast.success('Link copied! Paste it in your Instagram bio or story.');
    onTrackShare?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center p-4 backdrop-blur-sm bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-[430px] rounded-t-[32px] overflow-hidden shadow-2xl border-t bg-[#111] border-[#222]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-12 h-1.5 rounded-full mx-auto mb-6 bg-[#222]" />

              <div className="flex items-center gap-3 mb-6">
                <Avatar url={shop.avatar_url || shop.logo_url} size={44} ring={false} />
                <div className="flex flex-col">
                  <span className="text-[15px] font-bold text-white">{shop.name}</span>
                  <span className="text-[12px] mt-0.5 text-[#888]">@{shop.handle}</span>
                </div>
              </div>

              {/* Link Display Box */}
              <div 
                className="flex items-center gap-3 p-3 px-3.5 rounded-[10px] border mb-5 bg-[#1a1a1a] border-[#222]"
              >
                <span className="flex-1 text-[12px] font-mono truncate text-[#888]">
                   {getShopLink(shop.handle)}
                </span>
                <button 
                  onClick={handleCopyLink}
                  className="p-1.5 transition-colors"
                >
                  {copied ? (
                    <Check size={14} className="text-[#10b981]" />
                  ) : (
                    <Copy size={16} className="text-[#FF2D78]" />
                  ) }
                </button>
              </div>

              {/* Share Options */}
              <h3 className="text-[11px] font-mono uppercase tracking-wider mb-3 text-[#888]">
                Share via
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <button 
                  onClick={shareViaWhatsApp}
                  className="flex flex-col items-center justify-center p-3.5 rounded-[12px] border transition-all active:scale-[0.98] bg-green-500/10 border-green-500/30"
                >
                  <span className="text-[24px] mb-1.5">💬</span>
                  <span className="text-white text-[12px] font-bold uppercase tracking-tight">WhatsApp</span>
                </button>

                <button 
                  onClick={shareViaTwitter}
                  className="flex flex-col items-center justify-center p-3.5 rounded-[12px] border transition-all active:scale-[0.98] bg-black/10 border-[#222]"
                >
                  <span className="text-[22px] mb-1.5 text-white">𝕏</span>
                  <span className="text-white text-[12px] font-bold uppercase tracking-tight">Twitter / X</span>
                </button>

                <button 
                  onClick={shareViaInstagram}
                  className="flex flex-col items-center justify-center p-3.5 rounded-[12px] border transition-all active:scale-[0.98] bg-pink-500/10 border-pink-500/30"
                >
                  <span className="text-[24px] mb-1.5">📸</span>
                  <span className="text-white text-[12px] font-bold uppercase tracking-tight text-white">Instagram</span>
                </button>

                <button 
                  onClick={() => {
                    handleCopyLink();
                    onClose();
                  }}
                  className="flex flex-col items-center justify-center p-3.5 rounded-[12px] border transition-all active:scale-[0.98] bg-[#FF2D78]/10 border-[#FF2D78]/30"
                >
                  <span className="text-[24px] mb-1.5">🔗</span>
                  <span className="text-white text-[12px] font-bold uppercase tracking-tight text-[#FF2D78]">Copy Link</span>
                </button>
              </div>

              {/* Instagram Tip */}
              <div 
                className="mt-4 p-3 px-3.5 rounded-[10px] border bg-[#1a1a1a] border-[#222]"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span>💡</span>
                  <span className="text-[11px] font-bold uppercase tracking-tight text-[#888]">Instagram tip:</span>
                </div>
                <p className="text-[11px] leading-[1.5] text-[#888]">
                  Copy your link and add it to your Instagram bio or paste it in your story as a sticker.
                </p>
              </div>

              <button 
                onClick={onClose}
                className="w-full mt-6 py-2 text-[13px] font-medium text-[#555]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
