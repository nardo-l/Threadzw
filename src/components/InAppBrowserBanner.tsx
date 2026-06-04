import React, { useState, useEffect } from 'react';
import { ExternalLink, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InAppBrowserBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor;
    const isInstagram = ua.indexOf('Instagram') > -1;
    const isFacebook = ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1;
    
    // Only show if in Instagram or Facebook in-app browser
    if (isInstagram || isFacebook) {
      // Check if dismissed before
      const isDismissed = localStorage.getItem('thread_iab_banner_dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('thread_iab_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="fixed top-0 left-0 right-0 z-[9999] p-4"
      >
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 shadow-2xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#C6FF00]/10 flex items-center justify-center shrink-0">
            <AlertCircle className="text-[#C6FF00] w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm mb-1">Open in External Browser</h3>
            <p className="text-[#888] text-xs leading-relaxed">
              Thread works best in Chrome or Safari. Instagram's browser may cause login and payment issues.
            </p>
            <div className="flex items-center gap-3 mt-3">
               <button 
                onClick={() => {
                  // Some tricks to force open external browser
                  // Not perfect but helps
                  const url = window.location.href;
                  if (navigator.userAgent.includes('Instagram')) {
                    // Try to trigger external browser download/open
                  }
                  window.location.href = url;
                }}
                className="bg-[#C6FF00] text-black text-[11px] font-bold px-4 py-2 rounded-full flex items-center gap-2"
              >
                <ExternalLink size={14} /> Open Main Browser
              </button>
              <button 
                onClick={handleDismiss}
                className="text-[#555] text-[11px] font-bold px-2 py-2"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-[#444] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
