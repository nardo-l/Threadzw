// src/screens/LandingPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Check, 
  Store, 
  ShoppingBag, 
  Share2, 
  Instagram, 
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Globe,
  Plus
} from 'lucide-react';

interface LandingPageProps {
  onStartFree: () => void;
  onLoginSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree }) => {
  const navigate = useNavigate();

  // Cards for Section A (Who is it for)
  const targetAudience = [
    { icon: '🧥', title: 'Thrift Stores', desc: 'Sell vintage collections professionally.' },
    { icon: '👟', title: 'Sneaker Resellers', desc: 'Showcase your latest drops beautifully.' },
    { icon: '📱', title: 'Electronics Sellers', desc: 'Display products without sending hundreds of photos.' },
    { icon: '💍', title: 'Jewellery Brands', desc: 'Create a premium storefront.' },
    { icon: '👜', title: 'Fashion Brands', desc: 'Build your own brand identity.' },
    { icon: '🎨', title: 'Handmade Businesses', desc: 'Sell your creations online.' },
  ];

  // We duplicate cards several times to create an absolute seamless loop
  const infiniteCards = [...targetAudience, ...targetAudience, ...targetAudience, ...targetAudience];

  const steps = [
    {
      step: 'Step 1',
      icon: <Store className="text-[#25D366] w-6 h-6" />,
      title: '🏪 Create Your Shop',
      desc: 'Upload your logo and business details in less than 60 seconds.'
    },
    {
      step: 'Step 2',
      icon: <ShoppingBag className="text-[#25D366] w-6 h-6" />,
      title: '📦 Add Products',
      desc: 'Upload products, set pricing, and write selling descriptions.'
    },
    {
      step: 'Step 3',
      icon: <Share2 className="text-[#25D366] w-6 h-6" />,
      title: '🔗 Share Your Link',
      desc: 'Share your professional ThreadZW shop link on WhatsApp Status, Instagram Bio, or flyers.'
    }
  ];

  // Social proof avatars / logos
  const localBrands = [
    { name: 'Kure', color: 'bg-indigo-600', text: 'K' },
    { name: 'TrendSetter', color: 'bg-rose-500', text: 'T' },
    { name: 'Bespoke', color: 'bg-emerald-600', text: 'B' },
    { name: 'Apex', color: 'bg-amber-500', text: 'A' },
    { name: 'Vogue', color: 'bg-fuchsia-600', text: 'V' },
    { name: 'Hype', color: 'bg-cyan-500', text: 'H' },
    { name: 'Drip', color: 'bg-violet-600', text: 'D' },
    { name: 'ThriftHQ', color: 'bg-teal-500', text: 'T' }
  ];

  const infiniteBrands = [...localBrands, ...localBrands, ...localBrands, ...localBrands];

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff] flex flex-col selection:bg-[#25D366] selection:text-black font-sans antialiased overflow-x-hidden">
      
      {/* Dynamic Keyframes for seamless train scroll */}
      <style>{`
        @keyframes trainScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .train-track {
          display: flex;
          width: max-content;
          animation: trainScroll 30s linear infinite;
        }
        .train-track:hover {
          animation-play-state: paused;
        }
        .brand-track {
          display: flex;
          width: max-content;
          animation: trainScroll 20s linear infinite;
        }
      `}</style>

      {/* Header / Top Nav */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900/60 py-4">
        <div className="max-w-[480px] mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <span 
            onClick={() => navigate('/')} 
            className="text-xl font-black tracking-tighter text-[#25D366] hover:opacity-90 transition-opacity cursor-pointer select-none flex items-center gap-1.5"
          >
            <span className="w-2.5 h-2.5 bg-[#25D366] rounded-sm inline-block animate-pulse" />
            ThreadZW
          </span>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-zinc-400 hover:text-[#ffffff] transition-colors cursor-pointer tracking-wide uppercase"
            >
              Login
            </button>
            <button
              onClick={onStartFree}
              className="bg-[#25D366] hover:opacity-90 active:scale-[0.98] text-black text-xs font-black px-4.5 py-2.5 rounded-full transition-all cursor-pointer shadow-md shadow-[#25D366]/10 tracking-wide uppercase"
            >
              Start Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-10 pb-12 max-w-[480px] mx-auto w-full flex flex-col items-center">
        {/* Made in Zimbabwe Pill */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-bold text-zinc-300 mb-6 select-none shadow-xl"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-ping" />
          <span>🇿🇼 Zimbabwe's Next-Gen Store Engine</span>
        </motion.div>

        {/* Hero Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[34px] sm:text-[38px] font-black tracking-tight text-white text-center leading-[1.12] mb-5 select-none"
        >
          Turn your WhatsApp business into a <span className="text-[#25D366] font-black">real online shop</span> in 5 minutes.
        </motion.h1>

        {/* Hero Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-zinc-400 text-xs sm:text-sm text-center max-w-[340px] leading-relaxed mb-8"
        >
          Upload products, share your link, and start selling professionally.
        </motion.p>

        {/* Action buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full flex flex-col gap-3.5 mb-10"
        >
          <button
            onClick={onStartFree}
            className="w-full py-4.5 bg-[#25D366] hover:bg-[#b0e300] active:scale-[0.98] text-black font-black text-sm uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/15 cursor-pointer font-sans"
          >
            <span>Start Free</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>


        </motion.div>
      </section>

      {/* SECTION A — WHO IS THREADZW FOR? */}
      <section className="bg-zinc-950/40 border-y border-zinc-900/50 py-12 overflow-hidden">
        <div className="max-w-[480px] mx-auto px-4 mb-6">
          <span className="font-mono text-[9px] text-[#25D366] uppercase tracking-[0.25em] font-bold block mb-1">AUDIENCE</span>
          <h2 className="text-xl font-black text-white tracking-tight">Who is ThreadZW for?</h2>
          <p className="text-xs text-zinc-500 mt-1">Built specifically for Zimbabwean social sellers & local creators.</p>
        </div>

        {/* Infinitely scrolling card list */}
        <div className="relative w-full overflow-hidden py-2 select-none">
          {/* Subtle gradient fading mask left and right */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          <div className="train-track gap-3.5">
            {infiniteCards.map((aud, index) => (
              <div 
                key={`${aud.title}-${index}`}
                className="flex items-center gap-3.5 bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700/80 p-4 rounded-xl min-w-[240px] max-w-[240px] shadow-sm transition-colors cursor-default"
              >
                <span className="text-2xl select-none">{aud.icon}</span>
                <div className="leading-tight">
                  <h4 className="text-xs font-black text-white">{aud.title}</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-medium leading-normal">{aud.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION B — HOW IT WORKS */}
      <section className="px-4 py-16 max-w-[480px] mx-auto w-full">
        <div className="mb-10 text-center">
          <span className="font-mono text-[9px] text-[#25D366] uppercase tracking-[0.25em] font-bold block mb-1.5">PROCESS</span>
          <h2 className="text-2xl font-black text-white tracking-tight">Setup in 3 simple steps</h2>
          <p className="text-xs text-zinc-400 mt-1">Everything you need to launch a beautiful online brand storefront.</p>
        </div>

        <div className="space-y-4">
          {steps.map((st, i) => (
            <motion.div 
              key={st.step}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-start gap-4 hover:border-zinc-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-center shrink-0 shadow-inner">
                {st.icon}
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-[#25D366] uppercase tracking-wider font-bold block">{st.step}</span>
                <h3 className="text-sm font-black text-white">{st.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">{st.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION C — PRICING */}
      <section className="bg-zinc-950/40 border-y border-zinc-900/50 py-16 px-4">
        <div className="max-w-[480px] mx-auto w-full">
          <div className="text-center mb-10">
            <span className="font-mono text-[9px] text-[#25D366] uppercase tracking-[0.25em] font-bold block mb-1.5">PRICING</span>
            <h2 className="text-2xl font-black text-white tracking-tight">Simple Pricing</h2>
            <p className="text-xs text-zinc-400 mt-1">Free to try, budget-friendly to grow.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-zinc-900/60 border-2 border-[#25D366]/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Pop badge */}
            <div className="absolute top-0 right-0 bg-[#25D366] text-black text-[9px] font-black uppercase px-3.5 py-1.5 rounded-bl-xl tracking-wider select-none">
              Most Popular
            </div>

            <span className="font-mono text-[10px] text-[#25D366] uppercase tracking-wider font-black block mb-1">PRO PLAN</span>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[34px] font-black text-white tracking-tight">$6</span>
              <span className="text-zinc-400 text-sm">/month</span>
            </div>

            <div className="inline-block bg-[#25D366]/10 border border-[#25D366]/15 rounded-lg px-3 py-1 text-[11px] font-bold text-[#25D366] mb-6">
              🎉 7-Day Free Trial
            </div>

            <div className="space-y-3.5 border-t border-zinc-800/80 pt-6 mb-8">
              {[
                'Unlimited products',
                'Custom shop link (thread.zw/your-name)',
                'Direct WhatsApp orders',
                'Visitor & Sales Analytics',
                'Featured collections storefront'
              ].map((feat) => (
                <div key={feat} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-[#25D366] shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-300 font-semibold">{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onStartFree}
              className="w-full py-4 bg-[#25D366] hover:opacity-95 active:scale-[0.98] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#25D366]/10"
            >
              Start Free Trial
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-3 font-semibold">No credit card required. Cancel anytime.</p>
          </motion.div>
        </div>
      </section>

      {/* SECTION D — SOCIAL PROOF */}
      <section className="py-16 overflow-hidden">
        <div className="max-w-[480px] mx-auto px-4 mb-8 text-center">
          <span className="font-mono text-[9px] text-[#25D366] uppercase tracking-[0.25em] font-bold block mb-1.5">MOMENTUM</span>
          <h2 className="text-lg font-black text-white tracking-tight">50+ Zimbabwean shops already live 🇿🇼</h2>
        </div>

        {/* Smooth horizontal moving logos */}
        <div className="relative w-full overflow-hidden select-none py-1">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          <div className="brand-track gap-4">
            {infiniteBrands.map((brand, index) => (
              <div 
                key={`${brand.name}-${index}`}
                className="flex items-center gap-2.5 bg-zinc-900/40 border border-zinc-800/40 p-2.5 pr-4.5 rounded-full"
              >
                <div className={`w-7.5 h-7.5 rounded-full ${brand.color} flex items-center justify-center text-[10px] font-black text-white shadow-md`}>
                  {brand.text}
                </div>
                <span className="text-[11px] font-bold text-zinc-300">{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION E — FINAL CTA */}
      <section className="px-4 py-20 max-w-[480px] mx-auto w-full text-center relative">
        <div className="absolute inset-0 bg-radial-gradient from-[#25D366]/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <h2 className="text-[28px] sm:text-[32px] font-black text-white tracking-tight leading-none">
            Ready to launch your online shop?
          </h2>
          <p className="text-xs text-zinc-400 max-w-[300px] mx-auto leading-relaxed">
            Configure your storefront, add products, and capture your custom handle inside 5 minutes.
          </p>

          <button
            onClick={onStartFree}
            className="w-full max-w-[280px] mx-auto py-4.5 bg-[#25D366] hover:opacity-95 active:scale-[0.98] text-black font-black text-sm uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#25D366]/15"
          >
            <span>Start Free</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 border-t border-zinc-900 bg-black">
        <div className="max-w-[480px] mx-auto px-4 text-center space-y-3">
          <p className="text-[10px] text-zinc-600 font-bold tracking-wider uppercase">THREADZW PLATFORM</p>
          <p className="text-[11px] text-zinc-500 font-semibold select-none">
            &copy; {new Date().getFullYear()} ThreadZW. Built in Harare. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};
