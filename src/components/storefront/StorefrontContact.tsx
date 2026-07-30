// src/components/storefront/StorefrontContact.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MessageCircle, MapPin, Send, Instagram, Facebook, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trackWhatsAppClick } from '../../lib/analytics';

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
      toast.success('Message sent successfully!');
      
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
    <div className="space-y-6 px-5 pb-24 select-none text-left bg-white min-h-screen pt-4 font-sans">
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 font-sans">Help Center</span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">Contact Us</h2>
      </div>

      {/* ----------------- CONTACT COORDINATES ----------------- */}
      <div className="bg-zinc-50 border border-zinc-150 rounded-[20px] p-5 space-y-4">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Contact Details</span>

        <div className="space-y-3.5">
          {/* WhatsApp link */}
          <a
            href={`https://wa.me/${cleanWhatsApp}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              console.log("TRACK START", { shopId: shop?.id, eventType: 'whatsapp_click' });
              trackWhatsAppClick(shop.id);
            }}
            className="flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
              <MessageCircle className="w-4.5 h-4.5 fill-current" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase text-zinc-400 block tracking-wider">WhatsApp Chat</span>
              <span className="text-xs font-semibold text-zinc-800 group-hover:text-green-600 transition-colors">
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
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/15 flex items-center justify-center text-pink-600 group-hover:bg-pink-500/20 transition-colors">
              <Instagram className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase text-zinc-400 block tracking-wider">Instagram</span>
              <span className="text-xs font-semibold text-zinc-800 group-hover:text-green-600 transition-colors">
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
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-600 group-hover:bg-blue-500/20 transition-colors">
              <Facebook className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase text-zinc-400 block tracking-wider">Facebook</span>
              <span className="text-xs font-semibold text-zinc-800 group-hover:text-green-600 transition-colors">
                {shop.name} Official
              </span>
            </div>
          </a>

          {/* Email */}
          <a
            href={`mailto:${shop.email || 'info@threadzw.co.zw'}`}
            className="flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-200/60 border border-zinc-300/40 flex items-center justify-center text-zinc-600 group-hover:bg-zinc-200 transition-colors">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase text-zinc-400 block tracking-wider">Email Coordinates</span>
              <span className="text-xs font-semibold text-zinc-800 group-hover:text-green-600 transition-colors truncate block max-w-[240px]">
                {shop.email || `contact@${shop.slug || 'threadzw'}.co.zw`}
              </span>
            </div>
          </a>

          {/* Physical Location */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/15 flex items-center justify-center text-green-600">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase text-zinc-400 block tracking-wider">Physical Coordinates</span>
              <span className="text-xs font-semibold text-zinc-800">
                {shop.city || 'Bulawayo'}, Zimbabwe
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- FUNCTIONAL CONTACT FORM ----------------- */}
      <div className="bg-white border border-zinc-150 rounded-[20px] p-5 space-y-4 shadow-xs">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Send us a message</span>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600 animate-bounce">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Message Sent!</h4>
                <p className="text-[11px] text-zinc-500 max-w-xs mt-1 leading-relaxed">
                  Our customer service representative will follow up with your inquiry shortly.
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Brian"
                  className="w-full text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none p-3 text-zinc-800 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. brian@gmail.com"
                  className="w-full text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none p-3 text-zinc-800 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Message Inquiry</label>
                <textarea
                  required
                  rows={4}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="How can we help you?"
                  className="w-full text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none resize-none p-3 text-zinc-800 font-sans leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-green-700 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending message...' : (
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
