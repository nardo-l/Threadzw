import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Shield, Eye, EyeOff, Lock, X } from 'lucide-react';

interface LandingPageProps {
  onStartFree: () => void;
  onLoginSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree, onLoginSuccess }) => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      toast.success('Signed in successfully! 👋');
      setShowSignIn(false);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Sign in error:', err);
      toast.error(err.message || 'Credentials entered are invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0B0B0B] text-white min-h-screen relative font-sans select-none overflow-x-hidden pb-10">
      
      {/* UPDATE 2: FIXED NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-[60px] bg-[#0B0B0B]/85 backdrop-blur-md border-b border-[#1A1A1A] z-[100] px-5 flex items-center justify-between">
        <div className="text-[#C6FF00] font-black text-2xl tracking-tighter font-mono select-none">
          ThreadZW
        </div>

        <div className="flex items-center gap-6">
          {/* Desktop Links (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-5 text-sm font-semibold tracking-wide text-[#A1A1AA]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#problems" className="hover:text-white transition-colors">Why ThreadZW</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <button 
            onClick={() => setShowSignIn(true)}
            className="text-[#A1A1AA] hover:text-white text-sm font-bold transition-all px-3 py-1.5 cursor-pointer"
          >
            Login
          </button>

          <button 
            onClick={onStartFree}
            className="bg-[#C6FF00] text-[#0B0B0B] font-extrabold text-[13px] rounded-full px-4.5 py-2 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer h-[38px] flex items-center justify-center shadow-[0_4px_20px_rgba(198,255,0,0.15)]"
          >
            Start Free
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="min-h-screen bg-[#0B0B0B] pt-[110px] pb-16 px-6 flex flex-col items-center justify-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-3.5 py-1.5 mb-6 select-none animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
          </span>
          <span className="text-[#A1A1AA] text-xs font-bold leading-none tracking-wider">🇿🇼 Made in Zimbabwe</span>
        </div>

        {/* Headline */}
        <h1 className="text-white font-black text-[40px] md:text-5xl leading-[1.05] tracking-tight max-w-[340px] md:max-w-xl mx-auto select-none">
          Create your online <br className="md:hidden" />
          shop in{' '}
          <span className="relative inline-block text-white">
            minutes.
            <span className="absolute left-0 right-0 bottom-[-2px] h-[3.5px] bg-[#C6FF00] rounded-full" />
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-[#A1A1AA] text-[15px] md:text-lg leading-relaxed max-w-[305px] md:max-w-md mx-auto mt-6">
          No website skills needed. Create your shop, upload products, and share your link.
        </p>

        {/* CTA BUTTONS */}
        <div className="flex flex-col gap-3 w-full max-w-[320px] mx-auto mt-8">
          <button 
            onClick={onStartFree}
            className="w-full h-14 bg-[#C6FF00] text-[#0B0B0B] font-black text-base rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-[0_0_40px_rgba(198,255,0,0.25)]"
          >
            Start Free →
          </button>

          <button 
            onClick={() => window.open('https://threadzw.vercel.app/shop/@demo', '_blank')}
            className="w-full h-12.5 bg-transparent border-1.5 border-[#2A2A2A] text-white font-black text-sm rounded-full flex items-center justify-center gap-2 hover:bg-white/[0.04] active:scale-95 cursor-pointer"
          >
            View Demo Shop →
          </button>
        </div>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-2 mt-8 animate-fade-in">
          <div className="flex -space-x-3.5">
            {[
              { label: 'K', bg: 'linear-gradient(135deg, #FF5E3A, #FF2A68)' },
              { label: 'T', bg: 'linear-gradient(135deg, #1AD6FD, #1D62F0)' },
              { label: 'B', bg: 'linear-gradient(135deg, #B224EF, #7579FF)' },
              { label: 'A', bg: 'linear-gradient(135deg, #C6FF00, #407D02)' }
            ].map((circle, idx) => (
              <div 
                key={idx}
                style={{ background: circle.bg }}
                className="w-8 h-8 rounded-full border border-[#0B0B0B] flex items-center justify-center text-white font-black text-[10px]"
              >
                {circle.label}
              </div>
            ))}
          </div>
          <p className="text-[#A1A1AA] text-xs font-semibold ml-1">
            <span className="text-white font-black ml-1">+50 shops</span> already live 🇿🇼
          </p>
        </div>

        {/* PHONE MOCKUP WITH FLOATING BADGES */}
        <div className="relative mt-14 max-w-[260px] mx-auto">
          {/* PHONE FRAME */}
          <div className="bg-[#151515] border-2 border-[#2A2A2A] rounded-[36px] p-2.5 shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] select-none">
            {/* NOTCH */}
            <div className="w-[60px] h-1.5 bg-[#0B0B0B] rounded-full mx-auto mb-2" />
            
            {/* SCREEN */}
            <div className="bg-[#0B0B0B] rounded-[26px] overflow-hidden text-left pb-3">
              {/* Mock Banner */}
              <div 
                style={{
                  height: 100,
                  background: 'linear-gradient(135deg, #1A1A1A, #252525)'
                }}
                className="relative"
              >
                {/* Avatar circle */}
                <div className="absolute bottom-[-18px] left-4 w-12 h-12 rounded-full bg-[#C6FF00] border-[3px] border-[#0B0B0B] flex items-center justify-center text-xl shadow-lg">
                  🏪
                </div>
              </div>

              {/* Shop Info */}
              <div className="pt-7 px-3.5">
                <h3 className="text-white font-black text-sm leading-none">KickZone ZW</h3>
                <p className="text-[#A1A1AA] text-[10px] mt-1 font-semibold">@kickzone · Harare</p>
              </div>

              {/* Grid Items */}
              <div className="grid grid-cols-2 gap-1.5 px-3.5 mt-2.5">
                {[
                  { emoji: '👟', price: '$15' },
                  { emoji: '👕', price: '$12' },
                  { emoji: '🧢', price: '$8' },
                  { emoji: '👖', price: '$18' }
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="bg-[#151515] rounded-[10px] h-[72px] flex flex-col items-center justify-center gap-1 border border-[#222222]"
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-[#C6FF00] font-black text-[10px]">{item.price}</span>
                  </div>
                ))}
              </div>

              {/* WhatsApp Button */}
              <div className="mx-3.5 mt-2.5 bg-[#25D366] text-white font-extrabold text-[10px] py-2 rounded-[10px] text-center shadow-md">
                💬 Chat on WhatsApp
              </div>
            </div>
          </div>

          {/* FLOATING BADGES */}
          {/* Badge 1: Top Right */}
          <div className="absolute top-[-10px] right-[-16px] bg-[#151515] border border-[#2A2A2A] rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg">
            <span className="text-sm">🔗</span>
            <span className="text-white font-extrabold text-[9px] uppercase tracking-wide">Your own link</span>
          </div>

          {/* Badge 2: Bottom Left */}
          <div className="absolute bottom-11 left-[-22px] bg-[#151515] border border-[#2A2A2A] rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22C55E]"></span>
            </span>
            <span className="text-white font-extrabold text-[9px] uppercase tracking-wide">Shop is live</span>
          </div>

          {/* Badge 3: Bottom Right */}
          <div className="absolute bottom-[-10px] right-[-10px] bg-[#C6FF00] rounded-xl px-2.5 py-1.5 flex items-center shadow-lg">
            <span className="text-[#0B0B0B] font-black text-[9px] uppercase tracking-wide">📦 3 orders today</span>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section id="problems" className="bg-[#0B0B0B] py-20 px-6">
        <div className="max-w-md mx-auto text-center">
          <span className="text-[#A1A1AA] text-[10px] font-black tracking-widest uppercase">The Problem</span>
          <h2 className="text-white font-black text-2xl tracking-tight leading-tight mt-2.5 mb-10">
            Most small brands struggle to sell online.
          </h2>

          <div className="space-y-3 text-left">
            {[
              {
                title: 'Websites are expensive',
                desc: "Paying a developer costs hundreds of dollars — money most small brands don't have."
              },
              {
                title: 'Instagram DMs are chaotic',
                desc: 'Managing hundreds of DMs asking about prices and sizes is exhausting and slow.'
              },
              {
                title: "Customers can't browse products",
                desc: "Without a shop page customers can't see what you have unless you send photos manually."
              }
            ].map((card, i) => (
              <div 
                key={i}
                className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-5 flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/20 flex items-center justify-center shrink-0">
                  <span className="text-md leading-none">❌</span>
                </div>
                <div>
                  <h4 className="text-white font-black text-[15px]">{card.title}</h4>
                  <p className="text-[#A1A1AA] text-[13px] mt-1 line-height-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section className="bg-[#111111] py-20 px-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <span className="text-[#C6FF00] text-[10px] font-black tracking-widest uppercase">The Solution</span>
            <h2 className="text-white font-black text-2xl tracking-tight leading-tight mt-2.5">
              ThreadZW makes selling easier.
            </h2>
            <p className="text-[#A1A1AA] text-sm font-bold mt-1 mb-10">Four simple steps.</p>
          </div>

          <div className="relative space-y-8">
            {/* Connection Line */}
            <div className="absolute left-[22px] top-6 bottom-6 w-[1px] bg-[#2A2A2A]" />

            {[
              {
                title: 'Create your shop',
                desc: 'Sign up, add your shop name, and get your unique link in minutes.'
              },
              {
                title: 'Upload your products',
                desc: 'Add photos, prices and sizes — takes less than 2 minutes per product.'
              },
              {
                title: 'Share your link everywhere',
                desc: 'Post your link on Instagram bio, WhatsApp status, Facebook — anywhere.'
              },
              {
                title: 'Customers order on WhatsApp',
                desc: 'Customers tap a button and message you directly — you never miss a sale.'
              }
            ].map((step, idx) => (
              <div key={idx} className="flex gap-4 items-start relative z-10">
                <div className="w-11 h-11 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-black text-base flex items-center justify-center shrink-0 shadow-md">
                  {idx + 1}
                </div>
                <div className="pt-2">
                  <h4 className="text-white font-extrabold text-[15px] leading-tight">{step.title}</h4>
                  <p className="text-[#A1A1AA] text-[13px] mt-1.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="bg-[#0B0B0B] py-20 px-6">
        <div className="max-w-md mx-auto text-center">
          <span className="text-[#A1A1AA] text-[10px] font-black tracking-widest uppercase">Features</span>
          <h2 className="text-white font-black text-2xl tracking-tight leading-tight mt-2.5 mb-10">
            Everything you need. <br />Nothing you don't.
          </h2>

          <div className="grid grid-cols-2 gap-2.5 text-left">
            {[
              { icon: '📦', title: 'Add products easily', desc: 'Upload photos and set prices from your phone in minutes.' },
              { icon: '🔗', title: 'Share your shop link', desc: 'One link to send everywhere. threadzw.com/shop/@you' },
              { icon: '💬', title: 'WhatsApp ordering', desc: 'Every product has a direct WhatsApp order button.' },
              { icon: '📊', title: 'Track your orders', desc: 'See which products people are viewing and ordering.' },
              { icon: '📸', title: 'Post new drops', desc: 'Keep customers coming back with new product updates.' },
              { icon: '📱', title: 'Works on your phone', desc: 'Built for mobile. No laptop or tech skills needed.' }
            ].map((feat, idx) => (
              <div 
                key={idx}
                className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-4.5 flex flex-col justify-start"
              >
                <div className="w-10 h-10 rounded-full bg-[#C6FF00]/5 border border-[#C6FF00]/15 flex items-center justify-center text-md mb-3">
                  {feat.icon}
                </div>
                <h4 className="text-white font-black text-[13px] leading-tight">{feat.title}</h4>
                <p className="text-[#A1A1AA] text-[11px] mt-1.5 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="bg-[#111111] py-20 px-6">
        <div className="max-w-md mx-auto text-center">
          <span className="text-[#A1A1AA] text-[10px] font-black tracking-widest uppercase">Pricing</span>
          <h2 className="text-white font-black text-2xl tracking-tight leading-tight mt-2.5 mb-10">
            Simple pricing. <br />No surprises.
          </h2>

          <div className="bg-[#151515] border-2 border-[#C6FF00] rounded-[24px] p-7 text-left shadow-[0_8px_32px_rgba(198,255,0,0.06)]">
            <div className="inline-flex items-center bg-[#C6FF00] text-[#0B0B0B] font-black text-[10px] uppercase tracking-wider rounded-full px-3.5 py-1 mb-4">
              🎁 3 days free to start
            </div>

            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-[#C6FF00] font-black text-60px leading-none">$9</span>
              <span className="text-[#A1A1AA] text-lg font-bold">/month</span>
            </div>
            <p className="text-[#A1A1AA] text-xs font-semibold mt-1">Billed monthly · Cancel any time</p>

            <div className="h-[1px] bg-[#2A2A2A] my-5" />

            <div className="space-y-3">
              {[
                'Unlimited products',
                'Your own shop link',
                'WhatsApp ordering',
                'Order tracking',
                'New drop posts',
                'Works on your phone',
                'Pay with EcoCash'
              ].map((benefit, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <span className="text-[#C6FF00] font-bold text-sm">✓</span>
                  <span className="text-white font-semibold text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={onStartFree}
              className="w-full h-13.5 bg-[#C6FF00] text-[#0B0B0B] font-black text-base rounded-full mt-6 flex items-center justify-center gap-1 hover:opacity-95 transition-all cursor-pointer"
            >
              Start Free →
            </button>
            <p className="text-[#A1A1AA] text-[11px] text-center mt-3 font-semibold">No credit card · Pay with EcoCash</p>
          </div>
        </div>
      </section>

      {/* BUILT IN ZIMBABWE SECTION */}
      <section className="bg-[#0B0B0B] py-20 px-6 text-center">
        <div className="max-w-md mx-auto">
          <span className="text-[56px] leading-none mb-4 block">🇿🇼</span>
          <h2 className="text-white font-black text-3xl tracking-tight leading-tight mt-4">
            Built for <br />Zimbabwean brands.
          </h2>
          <p className="text-[#A1A1AA] text-[15px] leading-relaxed max-w-[285px] mx-auto mt-4">
            Created to help local businesses sell online faster — without needing expensive websites or tech skills. If you can use WhatsApp you can use ThreadZW.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mt-7">
            {[
              { emoji: '🏪', text: '50+ shops live' },
              { emoji: '🇿🇼', text: 'Zimbabwe built' },
              { emoji: '💬', text: 'WhatsApp-first' },
              { emoji: '📱', text: 'Mobile only' }
            ].map((pill, i) => (
              <div 
                key={i}
                className="bg-[#151515] border border-[#2A2A2A] rounded-full px-4 py-2 flex items-center gap-1.5"
              >
                <span className="text-sm">{pill.emoji}</span>
                <span className="text-white font-bold text-xs leading-none">{pill.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section 
        style={{
          background: 'linear-gradient(160deg, #0B0B0B 0%, #0f0800 100%)'
        }}
        className="py-24 px-6 text-center"
      >
        <div className="max-w-md mx-auto">
          <h2 className="text-white font-black text-[34px] leading-tight tracking-tight">
            Start your online <br className="md:hidden" />shop today. 🚀
          </h2>
          <p className="text-[#A1A1AA] text-[15px] leading-relaxed max-w-[265px] mx-auto mt-4 mb-8">
            Join hundreds of Zimbabwean clothing brands already selling with ThreadZW.
          </p>

          <button 
            onClick={onStartFree}
            className="w-full h-14 bg-[#C6FF00] text-[#0B0B0B] font-black text-base rounded-full flex items-center justify-center gap-1.5 cursor-pointer max-w-[325px] mx-auto hover:opacity-95 transition-all shadow-[0_0_40px_rgba(198,255,0,0.2)]"
          >
            Create Your Shop →
          </button>
          <p className="text-[#A1A1AA] text-[11px] font-semibold mt-3">First 3 days completely free</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0B0B0B] border-t border-[#151515] py-10 px-6 text-center">
        <div className="text-[#C6FF00] font-black text-lg font-mono">ThreadZW</div>
        <p className="text-[#A1A1AA] text-xs font-semibold mt-1">Zimbabwe's shop platform</p>
        <p className="text-neutral-600 text-[10px] mt-6 leading-relaxed">
          © 2026 ThreadZW · Built in Zimbabwe 🇿🇼
        </p>
      </footer>

      {/* SIGN IN BOTTOM SHEET */}
      <AnimatePresence>
        {showSignIn && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignIn(false)}
              className="fixed inset-0 bg-black z-[1000]"
            />

            {/* Bottom Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#151515] border-t border-[#2A2A2A] rounded-t-[24px] z-[1001] p-6 pb-12 shadow-2xl"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1 bg-[#2A2A2A] rounded-full mx-auto mb-6 shrink-0" />

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black text-2xl tracking-tight leading-none">Welcome back 👋</h3>
                <button 
                  onClick={() => setShowSignIn(false)}
                  className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center cursor-pointer hover:bg-neutral-700/80 transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-[#0B0B0B] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#C6FF00] transition-colors font-semibold placeholder:text-neutral-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#A1A1AA] mb-1.5 flex justify-between items-center">
                    <span>Password</span>
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#C6FF00] font-bold text-[11px] capitalize focus:outline-none cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-[#0B0B0B] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#C6FF00] transition-colors font-semibold placeholder:text-neutral-700 text-sm"
                    />
                    <div className="absolute right-4 top-[14px] text-neutral-700">
                      <Lock size={16} />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-[#C6FF00] text-[#0B0B0B] font-black text-base rounded-full mt-2 cursor-pointer flex items-center justify-center gap-1.5 tracking-wide shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : 'Sign In →'}
                </button>
              </form>

              <div className="text-center mt-6">
                <span className="text-[#A1A1AA] text-xs">Don't have an account? </span>
                <button 
                  onClick={() => {
                    setShowSignIn(false);
                    onStartFree();
                  }}
                  className="text-[#C6FF00] font-black text-xs cursor-pointer hover:underline"
                >
                  Start Free →
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
