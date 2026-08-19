// src/components/design-system/screens/Screen8AnalyticsOverview.tsx

import React from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ArrowRight, 
  Eye, 
  ShoppingBag, 
  Home, 
  Tag, 
  PlusCircle, 
  BarChart2, 
  Menu as MenuIcon,
  Store
} from 'lucide-react';

interface Screen8AnalyticsOverviewProps {
  onViewProductInsights?: () => void;
  interactive?: boolean;
}

export const Screen8AnalyticsOverview: React.FC<Screen8AnalyticsOverviewProps> = ({
  onViewProductInsights,
  interactive = false
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-1 px-1">
        <span className="text-xs font-bold text-black tracking-tight">
          Analytics
        </span>
        <div className="flex items-center gap-1 bg-zinc-100/90 border border-zinc-200/80 px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-700">
          <Calendar size={11} className="text-zinc-500" />
          <span>This Week</span>
          <ChevronDown size={11} className="text-zinc-500" />
        </div>
      </div>

      {/* Headline & Subtext */}
      <div className="py-1 px-1 space-y-0.5">
        <h1 className="text-2xl sm:text-[26px] font-black text-black tracking-tight leading-tight">
          See what's<br />working.
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Track how customers interact with your store.
        </p>
      </div>

      {/* 2x2 Analytics Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 px-1 py-1">
        
        {/* Card 1: Store Views */}
        <div className="p-3 rounded-2xl border border-zinc-200 bg-white space-y-1.5 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#C6FF00]/30 text-black flex items-center justify-center">
            <Eye size={13} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 block">
              Store Views
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-black font-sans">
                124
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600">
                ↑ +18%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Product Views */}
        <div className="p-3 rounded-2xl border border-zinc-200 bg-white space-y-1.5 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#C6FF00]/30 text-black flex items-center justify-center">
            <ShoppingBag size={13} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 block">
              Product Views
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-black font-sans">
                89
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600">
                ↑ +22%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: WhatsApp Clicks */}
        <div className="p-3 rounded-2xl border border-zinc-200 bg-white space-y-1.5 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#C6FF00]/30 text-black flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-black fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 block">
              WhatsApp Clicks
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-black font-sans">
                37
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600">
                ↑ +15%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Products */}
        <div className="p-3 rounded-2xl border border-zinc-200 bg-white space-y-1.5 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#C6FF00]/30 text-black flex items-center justify-center">
            <Store size={13} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 block">
              Products
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-black font-sans">
                12
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600">
                ↑ +5%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Visitors Over Time Interactive Minimal Area Chart */}
      <div className="px-1 py-1 space-y-1">
        <span className="text-[11px] font-bold text-black block">
          Visitors Over Time
        </span>
        
        <div className="w-full bg-white border border-zinc-200 rounded-2xl p-2.5 shadow-2xs relative">
          
          {/* Y-axis Labels */}
          <div className="absolute left-2.5 top-2.5 bottom-6 flex flex-col justify-between text-[8px] font-mono text-zinc-400 pointer-events-none">
            <span>200</span>
            <span>150</span>
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>

          {/* SVG Line & Area Graph */}
          <div className="pl-6 pt-1">
            <div className="relative h-20 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 240 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C6FF00" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#C6FF00" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="0" x2="240" y2="0" stroke="#F4F4F5" strokeWidth="1" />
                <line x1="0" y1="20" x2="240" y2="20" stroke="#F4F4F5" strokeWidth="1" />
                <line x1="0" y1="40" x2="240" y2="40" stroke="#F4F4F5" strokeWidth="1" />
                <line x1="0" y1="60" x2="240" y2="60" stroke="#F4F4F5" strokeWidth="1" />

                {/* Area Fill */}
                <path
                  d="M0,70 Q40,35 80,45 T160,25 T240,10 L240,80 L0,80 Z"
                  fill="url(#limeGradient)"
                />

                {/* Main Curved Line */}
                <path
                  d="M0,70 Q40,35 80,45 T160,25 T240,10"
                  fill="none"
                  stroke="#99cc00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Active Highlight Marker at Day 4 (Thursday) */}
                <circle cx="160" cy="25" r="4.5" fill="#99cc00" stroke="#FFFFFF" strokeWidth="2" />
              </svg>

              {/* Floating Tooltip Indicator */}
              <div className="absolute left-[138px] top-[0px] -translate-x-1/2 bg-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-xs pointer-events-none">
                124 Views
              </div>
            </div>

            {/* X-axis Day Labels */}
            <div className="flex items-center justify-between text-[8px] font-semibold text-zinc-400 pt-1.5 px-0.5">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span className="text-black font-bold">Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-2 px-1">
        <button
          onClick={onViewProductInsights}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">VIEW PRODUCT INSIGHTS</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Bottom App Navigation Bar */}
      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between px-3 text-zinc-400">
        <div className="flex flex-col items-center hover:text-black">
          <Home size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <Tag size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <PlusCircle size={17} />
        </div>
        <div className="flex flex-col items-center text-black">
          <div className="w-6 h-6 rounded-md bg-[#C6FF00] flex items-center justify-center text-black">
            <BarChart2 size={14} className="stroke-[2.5]" />
          </div>
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <MenuIcon size={16} />
        </div>
      </div>

    </div>
  );
};
