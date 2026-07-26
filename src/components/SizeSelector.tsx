import React from 'react';
import { Check } from 'lucide-react';

interface SizeSelectorProps {
  sizes: string[];
  selectedSizes: Record<string, { active: boolean; stock: number }>;
  onToggleSize: (size: string) => void;
  isStorage?: boolean;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSizes,
  onToggleSize,
  isStorage = false
}) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-zinc-950 uppercase tracking-wider block">
        {isStorage ? 'Storage Options' : 'Available sizes'}
      </label>
      <div className="grid grid-cols-3 gap-2.5">
        {sizes.map((sz) => {
          const isAdded = selectedSizes[sz]?.active;

          return (
            <button
              key={`size-chip-${sz}`}
              type="button"
              onClick={() => onToggleSize(sz)}
              style={{ color: '#09090b', backgroundColor: isAdded ? 'rgba(200, 255, 0, 0.2)' : '#ffffff' }}
              className={`py-4 px-3 rounded-2xl border-2 text-sm font-black transition-all cursor-pointer flex items-center justify-between shadow-sm text-zinc-950 ${
                isAdded
                  ? 'border-[#C8FF00] shadow-md scale-[1.02]'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <span className="truncate text-zinc-950 font-black" style={{ color: '#09090b' }}>{sz}</span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                isAdded ? 'bg-[#C8FF00] text-zinc-950 border border-zinc-900' : 'bg-zinc-100 text-transparent border border-zinc-200'
              }`}>
                <Check size={13} className={`stroke-[3] ${isAdded ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

