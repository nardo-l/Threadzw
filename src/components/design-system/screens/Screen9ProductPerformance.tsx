// src/components/design-system/screens/Screen9ProductPerformance.tsx

import React, { useState } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  Home, 
  Tag, 
  PlusCircle, 
  BarChart2, 
  Menu as MenuIcon 
} from 'lucide-react';

interface ProductItem {
  id: number;
  rank: number;
  name: string;
  views: number;
  image: string;
}

interface Screen9ProductPerformanceProps {
  onViewAllProducts?: () => void;
  onSelectProduct?: (product: ProductItem) => void;
  interactive?: boolean;
}

const PRODUCTS_DATA: Record<'most' | 'least' | 'topClicked', ProductItem[]> = {
  most: [
    {
      id: 1,
      rank: 1,
      name: 'Vintage Graphic Hoodie',
      views: 89,
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 2,
      rank: 2,
      name: 'Retro Jordan 4 White Cement',
      views: 67,
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 3,
      rank: 3,
      name: 'Oversized Brown Hoodie',
      views: 43,
      image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=300&q=80'
    }
  ],
  least: [
    {
      id: 4,
      rank: 1,
      name: 'Basic Crewneck Sweatshirt',
      views: 8,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 5,
      rank: 2,
      name: 'Canvas Tote Bag Natural',
      views: 12,
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 6,
      rank: 3,
      name: 'Ribbed Knit Beanie Black',
      views: 15,
      image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=300&q=80'
    }
  ],
  topClicked: [
    {
      id: 1,
      rank: 1,
      name: 'Vintage Graphic Hoodie',
      views: 34,
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 2,
      rank: 2,
      name: 'Retro Jordan 4 White Cement',
      views: 29,
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 7,
      rank: 3,
      name: 'Cargo Utility Pants Olive',
      views: 21,
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=300&q=80'
    }
  ]
};

export const Screen9ProductPerformance: React.FC<Screen9ProductPerformanceProps> = ({
  onViewAllProducts,
  onSelectProduct,
  interactive = false
}) => {
  const [activeTab, setActiveTab] = useState<'most' | 'least' | 'topClicked'>('most');

  const products = PRODUCTS_DATA[activeTab];

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
          See which<br />products perform<br />best.
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Use insights to stock better and sell more.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 px-1 py-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => interactive && setActiveTab('most')}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
            activeTab === 'most'
              ? 'bg-[#C6FF00] text-black shadow-2xs'
              : 'text-zinc-500 hover:text-black font-medium'
          } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          Most Viewed
        </button>

        <button
          onClick={() => interactive && setActiveTab('least')}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
            activeTab === 'least'
              ? 'bg-[#C6FF00] text-black shadow-2xs'
              : 'text-zinc-500 hover:text-black font-medium'
          } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          Least Viewed
        </button>

        <button
          onClick={() => interactive && setActiveTab('topClicked')}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
            activeTab === 'topClicked'
              ? 'bg-[#C6FF00] text-black shadow-2xs'
              : 'text-zinc-500 hover:text-black font-medium'
          } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          Top Clicked
        </button>
      </div>

      {/* Ranked Products List */}
      <div className="space-y-2 px-1 my-auto py-1">
        {products.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectProduct?.(item)}
            className={`w-full bg-white border border-zinc-200/90 rounded-2xl p-2.5 flex items-center justify-between shadow-2xs transition-all hover:border-zinc-300 ${
              interactive ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {/* Rank Number with Lime Badge */}
              <div className="w-5 h-5 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs">
                {item.rank}
              </div>

              {/* Product Thumbnail */}
              <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 shrink-0 flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80';
                  }}
                />
              </div>

              {/* Product Name & Views */}
              <div className="space-y-0.5 max-w-[150px]">
                <h4 className="text-xs font-black text-black leading-tight line-clamp-1">
                  {item.name}
                </h4>
                <div className="flex items-center gap-1 text-zinc-500 text-[10px] font-semibold">
                  <Eye size={11} className="stroke-[2.2]" />
                  <span>{item.views} {activeTab === 'topClicked' ? 'clicks' : 'views'}</span>
                </div>
              </div>
            </div>

            {/* Trailing Chevron */}
            <div className="text-zinc-400 pr-1">
              <ChevronRight size={16} className="stroke-[2.5]" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-2 px-1">
        <button
          onClick={onViewAllProducts}
          className={`w-full bg-white hover:bg-zinc-50 border border-zinc-200 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl text-center transition-all shadow-2xs ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          VIEW ALL PRODUCTS
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
          <div className="w-6 h-6 rounded-md bg-[#C6FF00] flex items-center justify-center text-black shadow-2xs">
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
