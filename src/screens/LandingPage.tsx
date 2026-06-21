// src/screens/LandingPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shirt, 
  ShoppingBag, 
  Sparkles, 
  Store, 
  UserPlus, 
  Plus, 
  Share2, 
  ArrowRight,
  Zap
} from 'lucide-react';

interface LandingPageProps {
  onStartFree: () => void;
  onLoginSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree, onLoginSuccess }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between selection:bg-[#C6FF00] selection:text-black">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-white">
              ThreadZW<span className="text-[#C6FF00]">.</span>
            </span>
            <span className="bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded text-white/60">
              Beta
            </span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-white/80 hover:text-[#C6FF00] transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-24">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/90">
            <Zap size={12} className="text-[#C6FF00] animate-pulse" />
            <span>Zimbabwe's Instant Shop Builder</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-white">
            Create your fashion store <span className="text-[#C6FF00]">in minutes.</span>
          </h1>

          <p className="text-base md:text-lg text-zinc-400 font-medium">
            Built for Zimbabwean clothing brands, thrift stores, boutiques, and sneaker sellers.
          </p>

          <div className="pt-4 flex flex-col items-center gap-3">
            <button
              onClick={onStartFree}
              className="w-full sm:w-auto px-8 py-4 bg-[#C6FF00] hover:bg-[#b5e600] active:scale-[0.98] text-black text-base font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-[#C6FF00]/10 cursor-pointer"
            >
              <span>Create Your Shop</span>
              <ArrowRight size={18} />
            </button>
            <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">
              Free during beta 🇿🇼
            </span>
          </div>
        </section>

        {/* Who It's For Section */}
        <section className="space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-bold tracking-widest text-[#C6FF00] uppercase">
              Who It's For
            </h2>
            <p className="text-xl font-bold text-white tracking-tight">
              Tailored specifically for local fashion entrepreneurs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Cards */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 hover:border-white/10 transition-colors">
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-[#C6FF00]">
                <Shirt size={24} />
              </div>
              <h3 className="text-sm font-bold text-white">Clothing Brands</h3>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 hover:border-white/10 transition-colors">
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-[#C6FF00]">
                <ShoppingBag size={24} />
              </div>
              <h3 className="text-sm font-bold text-white">Thrift Stores</h3>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 hover:border-white/10 transition-colors">
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-[#C6FF00]">
                <Sparkles size={24} />
              </div>
              <h3 className="text-sm font-bold text-white">Sneaker Sellers</h3>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 hover:border-white/10 transition-colors">
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-[#C6FF00]">
                <Store size={24} />
              </div>
              <h3 className="text-sm font-bold text-white">Boutique Shops</h3>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-bold tracking-widest text-[#C6FF00] uppercase">
              How It Works
            </h2>
            <p className="text-xl font-bold text-white tracking-tight">
              Simple setup with zero technical skills required
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-3 relative hover:border-white/10 transition-colors">
              <span className="absolute top-4 right-4 text-3xl font-black text-white/5 font-mono select-none">
                01
              </span>
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[#C6FF00]">
                <UserPlus size={20} />
              </div>
              <h3 className="font-bold text-white text-base">Create your shop</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose a unique web address and enter your basic contact details like WhatsApp and Instagram.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-3 relative hover:border-white/10 transition-colors">
              <span className="absolute top-4 right-4 text-3xl font-black text-white/5 font-mono select-none">
                02
              </span>
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[#C6FF00]">
                <Plus size={20} />
              </div>
              <h3 className="font-bold text-white text-base">Add products</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Upload product photos, set your prices, and put items live in seconds.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-3 relative hover:border-white/10 transition-colors">
              <span className="absolute top-4 right-4 text-3xl font-black text-white/5 font-mono select-none">
                03
              </span>
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[#C6FF00]">
                <Share2 size={20} />
              </div>
              <h3 className="font-bold text-white text-base">Share your link</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Put your link in your Instagram bio, WhatsApp Status, or Facebook page to receive direct orders.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 border border-white/5 rounded-3xl p-8 md:p-12 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Start selling online today.
          </h2>
          <button
            onClick={onStartFree}
            className="w-full sm:w-auto px-8 py-4 bg-[#C6FF00] hover:bg-[#b5e600] active:scale-[0.98] text-black text-sm font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center">
          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} ThreadZW. All rights reserved. Made for Zimbabwe's fashion ecosystem.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-400 font-semibold">
            <span>Zimbabwe's #1 Fashion Storefront Builder 🇿🇼</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
