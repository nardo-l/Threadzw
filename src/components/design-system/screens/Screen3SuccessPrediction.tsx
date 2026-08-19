// src/components/design-system/screens/Screen3SuccessPrediction.tsx

import React from 'react';
import { ArrowLeft, ArrowRight, Image as ImageIcon, ShoppingBag, Rocket, MessageCircle } from 'lucide-react';

interface Screen3SuccessPredictionProps {
  progressPercentage?: number;
  onBack?: () => void;
  onSetUpStore?: () => void;
  interactive?: boolean;
}

export const Screen3SuccessPrediction: React.FC<Screen3SuccessPredictionProps> = ({
  progressPercentage = 0,
  onBack,
  onSetUpStore,
  interactive = false
}) => {
  const checklistItems = [
    {
      id: 'logo',
      label: 'Add logo',
      icon: <ImageIcon size={15} className="text-zinc-900" />,
      completed: false
    },
    {
      id: 'products',
      label: 'Add products',
      icon: <ShoppingBag size={15} className="text-zinc-900" />,
      completed: false
    },
    {
      id: 'whatsapp',
      label: 'Add WhatsApp',
      icon: (
        <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
        </svg>
      ),
      completed: false
    },
    {
      id: 'publish',
      label: 'Publish store',
      icon: <Rocket size={15} className="text-zinc-900" />,
      completed: false
    }
  ];

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black">
      {/* Top Navigation & Step Indicator */}
      <div className="space-y-3 pt-1">
        <button
          onClick={onBack}
          className={`p-1.5 -ml-1.5 rounded-full text-black hover:bg-zinc-100 transition-colors ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <ArrowLeft size={18} className="stroke-[2.5]" />
        </button>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-black uppercase tracking-wider">
            Step 2 of 4
          </span>
          {/* 4-segment Progress Bar: Steps 1 & 2 filled in lime */}
          <div className="flex items-center gap-1.5 w-28">
            <div className="h-1 rounded-full flex-1 bg-[#C6FF00]" />
            <div className="h-1 rounded-full flex-1 bg-[#C6FF00]" />
            <div className="h-1 rounded-full flex-1 bg-zinc-200" />
            <div className="h-1 rounded-full flex-1 bg-zinc-200" />
          </div>
        </div>
      </div>

      {/* Headline & Subtext */}
      <div className="py-2 space-y-1">
        <h1 className="text-2xl sm:text-[28px] font-black text-black tracking-tight leading-tight">
          Let’s get your<br />first sale faster.
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Stores with complete profiles get more customer inquiries.
        </p>
      </div>

      {/* Checklist Cards */}
      <div className="space-y-2 py-1">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className="w-full p-3 rounded-2xl border border-zinc-200 bg-white flex items-center gap-3 transition-colors shadow-2xs"
          >
            <div className="w-7 h-7 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <span className="text-xs sm:text-[13px] font-bold text-black tracking-tight">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Large Circular Progress Indicator */}
      <div className="py-3 flex flex-col items-center justify-center">
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* SVG Progress Gauge */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              className="text-zinc-100 stroke-current"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Active Lime Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              className="text-[#C6FF00] stroke-current transition-all duration-700 ease-out"
              strokeWidth="6"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Percentage & Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-black tracking-tight font-sans">
              {progressPercentage}%
            </span>
            <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase mt-0.5">
              COMPLETE
            </span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-2">
        <button
          onClick={onSetUpStore}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-6 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">SET UP STORE</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
