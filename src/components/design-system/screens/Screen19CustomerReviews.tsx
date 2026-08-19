// src/components/design-system/screens/Screen19CustomerReviews.tsx

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Car, 
  PlusCircle, 
  Heart, 
  User, 
  PenSquare 
} from 'lucide-react';
import { toast } from 'sonner';

interface Screen19CustomerReviewsProps {
  onBack?: () => void;
  onWriteReview?: () => void;
  interactive?: boolean;
}

export const Screen19CustomerReviews: React.FC<Screen19CustomerReviewsProps> = ({
  onBack,
  onWriteReview,
  interactive = false
}) => {
  const [reviewsList, setReviewsList] = useState([
    {
      initial: 'T',
      name: 'Tawanda M.',
      date: '2 days ago',
      rating: 5,
      text: 'Great condition and exactly as described. Smooth purchase!',
    },
    {
      initial: 'K',
      name: 'Kudzai N.',
      date: '1 week ago',
      rating: 5,
      text: 'Very professional dealer. Car runs perfectly.',
    },
    {
      initial: 'B',
      name: 'Blessing R.',
      date: '2 weeks ago',
      rating: 5,
      text: 'Best car buying experience ever. Highly recommended!',
    },
  ]);

  const ratingBars = [
    { stars: 5, count: 26, pct: 81 },
    { stars: 4, count: 4, pct: 12 },
    { stars: 3, count: 1, pct: 3 },
    { stars: 2, count: 0, pct: 0 },
    { stars: 1, count: 1, pct: 3 },
  ];

  const handleWriteReview = () => {
    if (!interactive) return;
    toast.success('Review submission modal opened!');
    onWriteReview?.();
  };

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onBack}
            className={`p-1 -ml-1 rounded-full text-black hover:bg-zinc-100 transition-colors ${
              interactive ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <ArrowLeft size={16} className="stroke-[2.5]" />
          </button>
          <h3 className="text-xs font-black text-black tracking-tight">
            Reviews
          </h3>
        </div>
      </div>

      {/* Overall Rating Section with Big 4.8 Score and Stars */}
      <div className="px-1 pt-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            4.8
          </span>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={14} 
                className="fill-[#C6FF00] text-[#a4d600] stroke-[1]" 
              />
            ))}
          </div>
        </div>
        <p className="text-[9.5px] font-medium text-zinc-500 -mt-1">
          Based on 32 reviews
        </p>

        {/* Rating Breakdown Bar Chart */}
        <div className="space-y-1 pt-1">
          {ratingBars.map((b) => (
            <div key={b.stars} className="flex items-center gap-2 text-[9px] font-bold text-zinc-600">
              <span className="w-4 flex items-center gap-0.5 text-zinc-700">
                {b.stars} <Star size={8} className="fill-zinc-400 text-zinc-400" />
              </span>
              <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#C6FF00] rounded-full"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
              <span className="w-3.5 text-right font-mono text-zinc-400 text-[8.5px]">
                {b.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Cards List */}
      <div className="px-1 py-1 space-y-1.5 flex-1">
        {reviewsList.map((rev, idx) => (
          <div
            key={idx}
            className="bg-white border border-zinc-200/80 rounded-xl p-2 shadow-2xs space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-black text-white text-[9px] font-black flex items-center justify-center">
                  {rev.initial}
                </div>
                <div>
                  <h5 className="text-[9.5px] font-extrabold text-black leading-none">
                    {rev.name}
                  </h5>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={8} 
                        className="fill-[#C6FF00] text-[#9fcb00] stroke-[0.5]" 
                      />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-[8px] font-medium text-zinc-400">
                {rev.date}
              </span>
            </div>

            <p className="text-[9px] font-medium text-zinc-700 leading-relaxed">
              {rev.text}
            </p>
          </div>
        ))}
      </div>

      {/* Primary CTA: WRITE A REVIEW */}
      <div className="px-1 pb-1 pt-0.5">
        <button
          onClick={handleWriteReview}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <PenSquare size={13} className="stroke-[2.5]" />
          <span className="font-extrabold tracking-wide">WRITE A REVIEW</span>
        </button>
      </div>

      {/* Customer Bottom Navigation Bar */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between px-3 text-zinc-400">
        <div className="flex flex-col items-center hover:text-black">
          <Car size={14} />
          <span className="text-[7.5px] font-medium">Home</span>
        </div>
        <div className="flex flex-col items-center text-black">
          <div className="w-5 h-5 rounded-md bg-[#C6FF00] flex items-center justify-center text-black shadow-2xs">
            <Car size={13} className="stroke-[2.5]" />
          </div>
          <span className="text-[7.5px] font-bold text-black">Cars</span>
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <PlusCircle size={14} />
          <span className="text-[7.5px] font-medium">Sell Car</span>
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <Heart size={14} />
          <span className="text-[7.5px] font-medium">Favorites</span>
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <User size={14} />
          <span className="text-[7.5px] font-medium">Profile</span>
        </div>
      </div>

    </div>
  );
};
