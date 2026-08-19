// src/components/design-system/screens/Screen7EmptyDashboard.tsx

import React from 'react';
import { 
  Bell, 
  ArrowRight, 
  Eye, 
  ShoppingBag, 
  Home, 
  Tag, 
  PlusCircle, 
  BarChart2, 
  Menu as MenuIcon 
} from 'lucide-react';

interface Screen7EmptyDashboardProps {
  onAddFirstProduct?: () => void;
  onViewStore?: () => void;
  onNavigateTab?: (tab: string) => void;
  interactive?: boolean;
}

export const Screen7EmptyDashboard: React.FC<Screen7EmptyDashboardProps> = ({
  onAddFirstProduct,
  onViewStore,
  onNavigateTab,
  interactive = false
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-1 px-1">
        <span className="text-xs font-bold text-black tracking-tight">
          Dashboard
        </span>
        <button
          className={`p-1.5 rounded-full hover:bg-zinc-100 transition-colors text-black ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <Bell size={16} className="stroke-[2.2]" />
        </button>
      </div>

      {/* Headline & Subtext */}
      <div className="py-1 px-1 space-y-1">
        <h1 className="text-2xl sm:text-[26px] font-black text-black tracking-tight leading-tight">
          Your store<br />is live.
        </h1>
        <div className="text-[11px] text-zinc-500 font-medium space-y-0.5 leading-relaxed">
          <p>Your customers can't buy what they can't see.</p>
          <p className="text-zinc-600 font-semibold">Add your first product to start receiving orders.</p>
        </div>
      </div>

      {/* 3D Storefront Illustration Showcase Card */}
      <div className="py-1 px-1 my-auto">
        <div className="w-full bg-[#F4F4F5]/70 border border-zinc-200/80 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-2xs">
          
          {/* Lime Green Store Tag Badge */}
          <div className="mb-2">
            <span className="bg-[#C6FF00] text-black font-black text-[9px] tracking-wider uppercase px-2.5 py-0.5 rounded-md shadow-2xs">
              YOUR STORE
            </span>
          </div>

          {/* Storefront Façade Graphic */}
          <div className="w-48 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {/* Striped Awning */}
            <div className="h-5 flex">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i % 2 === 0 ? 'bg-black' : 'bg-white'}`}
                />
              ))}
            </div>

            {/* Storefront Windows & Door */}
            <div className="p-3 bg-zinc-50/50 flex items-center justify-between gap-2 h-16">
              {/* Left Window (T-shirt silhouette) */}
              <div className="flex-1 h-full bg-white border border-zinc-200 rounded-md flex items-center justify-center">
                <div className="w-4 h-5 border border-dashed border-zinc-300 rounded-xs" />
              </div>

              {/* Middle Window */}
              <div className="flex-1 h-full bg-white border border-zinc-200 rounded-md flex items-center justify-center">
                <div className="w-4 h-5 border border-dashed border-zinc-300 rounded-xs" />
              </div>

              {/* Right Door */}
              <div className="w-7 h-full bg-zinc-200/80 border border-zinc-300 rounded-md relative flex items-center justify-end pr-1">
                <div className="w-1 h-2 bg-zinc-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Statistics Cards in a Row */}
      <div className="grid grid-cols-3 gap-2 px-1 py-1">
        {/* Stat 1: Store Views */}
        <div className="p-2.5 rounded-2xl border border-zinc-200 bg-white flex flex-col items-center text-center space-y-1 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#C6FF00]/30 text-black flex items-center justify-center">
            <Eye size={13} className="stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
            Store Views
          </span>
          <span className="text-sm font-black text-black">
            0
          </span>
        </div>

        {/* Stat 2: Products */}
        <div className="p-2.5 rounded-2xl border border-zinc-200 bg-white flex flex-col items-center text-center space-y-1 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#C6FF00]/30 text-black flex items-center justify-center">
            <ShoppingBag size={13} className="stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
            Products
          </span>
          <span className="text-sm font-black text-black">
            0
          </span>
        </div>

        {/* Stat 3: WhatsApp Clicks */}
        <div className="p-2.5 rounded-2xl border border-zinc-200 bg-white flex flex-col items-center text-center space-y-1 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#C6FF00]/30 text-black flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-black fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
          </div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
            WhatsApp Clicks
          </span>
          <span className="text-sm font-black text-black">
            0
          </span>
        </div>
      </div>

      {/* CTA Buttons: Primary + Secondary */}
      <div className="space-y-2 pt-2 px-1">
        <button
          onClick={onAddFirstProduct}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">ADD FIRST PRODUCT</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>

        <button
          onClick={onViewStore}
          className={`w-full bg-white hover:bg-zinc-50 border border-zinc-200 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider py-3 px-5 rounded-2xl text-center transition-all ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          VIEW STORE
        </button>
      </div>

      {/* Bottom App Navigation Bar */}
      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between px-3 text-zinc-400">
        <div className="flex flex-col items-center text-black">
          <div className="w-6 h-6 rounded-md bg-[#C6FF00] flex items-center justify-center text-black">
            <Home size={14} className="stroke-[2.5]" />
          </div>
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <Tag size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <PlusCircle size={17} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <BarChart2 size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <MenuIcon size={16} />
        </div>
      </div>

    </div>
  );
};
