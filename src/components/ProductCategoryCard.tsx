import React from 'react';
import { motion } from 'motion/react';
import { Check, Shirt, Scissors, Footprints, Crown, ShoppingBag, Smartphone } from 'lucide-react';

interface ProductCategoryCardProps {
  name: string;
  iconType: string;
  isSelected: boolean;
  onClick: () => void;
}

export const ProductCategoryCard: React.FC<ProductCategoryCardProps> = ({
  name,
  iconType,
  isSelected,
  onClick
}) => {
  const getIcon = () => {
    switch (iconType.toLowerCase()) {
      case 'tops':
      case 'shirt':
        return <Shirt className={isSelected ? 'text-black' : 'text-zinc-700'} size={24} />;
      case 'bottoms':
      case 'pants':
        return <Scissors className={isSelected ? 'text-black' : 'text-zinc-700'} size={24} />;
      case 'shoes':
      case 'footprints':
        return <Footprints className={isSelected ? 'text-black' : 'text-zinc-700'} size={24} />;
      case 'hats':
      case 'caps':
        return <Crown className={isSelected ? 'text-black' : 'text-zinc-700'} size={24} />;
      case 'accessories':
      case 'bag':
        return <ShoppingBag className={isSelected ? 'text-black' : 'text-zinc-700'} size={24} />;
      case 'phones':
      case 'smartphone':
        return <Smartphone className={isSelected ? 'text-black' : 'text-zinc-700'} size={24} />;
      default:
        return <Shirt className={isSelected ? 'text-black' : 'text-zinc-700'} size={24} />;
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all duration-200 border-2 ${
        isSelected
          ? 'bg-[#C8FF00]/10 border-[#C8FF00] shadow-md shadow-[#C8FF00]/10'
          : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'
      }`}
    >
      {/* Checkmark badge when selected */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#C8FF00] text-black flex items-center justify-center shadow-sm">
          <Check size={14} className="stroke-[3]" />
        </div>
      )}

      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#C8FF00] text-black' : 'bg-zinc-100 text-zinc-800'}`}>
        {getIcon()}
      </div>

      <span className={`text-xs font-bold tracking-tight ${isSelected ? 'text-black' : 'text-zinc-800'}`}>
        {name}
      </span>
    </motion.div>
  );
};
