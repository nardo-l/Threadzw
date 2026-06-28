// src/components/storefront/StorefrontContact.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MessageCircle, MapPin, Send, Instagram, Facebook, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StorefrontContactProps {
  shop: any;
}

export const StorefrontContact: React.FC<StorefrontContactProps> = ({ shop }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const cleanWhatsApp = (shop.whatsapp_number || shop.whatsapp || '263771234567').replace(/\D/g, '');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !msg.trim()) {
      toast.error('Please fill in required inputs');
      return;
    }

    setLoading(true);

    // Simulate sending message
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Boutique message dispatched successfully!');
      
      // Reset after a moment
      setTimeout(() => {
        setName('');
        setEmail('');
        setMsg('');
        setSubmitted(false);
      }, 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6 px-5 pb-16 select-none text-left">
      <div className="space-y-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Customer Assistance</span>
        <h2 className="font-syne text-2xl font-black uppercase tracking-tight text-white">Contact Us</h2>
      </div>

      {/* ----------------- CONTACT COORDINATES ----------------- */}
      <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[24px] p-5 space-y-4">
        <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-550 font-bold block">Contact Details</span>

        <div className="space-y-3.5">
          {/* WhatsApp link */}
          <a
            href={`https://wa.me/${cleanWhatsApp}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <MessageCircle className="w-4.5 h-4.5 fill-current" />
            </div>
            <div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-550 block">WhatsApp Chat</span>
              <span className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors">
                {shop.whatsapp_number || shop.whatsapp || shop.phone || '+263771234567'}
              </span>
            </div>
          </a>

          {/* Instagram link */}
          <a
            href={`https://instagram.com/${shop.instagram_handle || 'threadzw'}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-500/20 transition-colors">
              <Instagram className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-550 block">Instagram</span>
              <span className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors">
                @{shop.instagram_handle || shop.slug || 'threadzw'}
              </span>
            </div>
          </a>

          {/* Facebook link */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <Facebook className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-550 block">Facebook</span>
              <span className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors">
                {shop.name} Official
              </span>
            </div>
          </a>

          {/* Email */}
          <a
            href={`mailto:${shop.email || 'info@threadzw.co.zw'}`}
            className="flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-neutral-800/80 border border-neutral-750 flex items-center justify-center text-neutral-300 group-hover:bg-neutral-800 transition-colors">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-550 block">Email Coordinates</span>
              <span className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors truncate block max-w-[240px]">
                {shop.email || `contact@${shop.slug || 'threadzw'}.co.zw`}
              </span>
            </div>
          </a>

          {/* Physical Location */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#C6FF00]/10 border border-[#C6FF00]/20 flex items-center justify-center text-[#C6FF00]">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-550 block">Physical Coordinates</span>
              <span className="text-xs font-bold text-neutral-200">
                {shop.city || 'Bulawayo'}, Zimbabwe
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- FUNCTIONAL CONTACT FORM ----------------- */}
      <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-[24px] p-5 space-y-4 shadow-md">
        <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-550 font-bold block">Send dispatch message</span>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/30 flex items-center justify-center text-[#C6FF00]">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase text-white">Message Dispatched!</h4>
                <p className="text-[10px] text-neutral-500 max-w-xs mt-1">
                  Our customer care representatives will follow up with your inbox or phone promptly.
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono font-bold tracking-widest text-neutral-400">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Brian"
                  className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded-xl focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono font-bold tracking-widest text-neutral-400">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. brian@gmail.com"
                  className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded-xl focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono font-bold tracking-widest text-neutral-400">Message Inquiry</label>
                <textarea
                  required
                  rows={4}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Write your inquiry or question regarding custom tailors..."
                  className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded-xl focus:border-[#C6FF00] outline-none resize-none p-3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#C6FF00] text-black font-black text-xs uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 shadow-md"
              >
                {loading ? 'Dispatched In Transit...' : (
                  <>
                    Send Message <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
