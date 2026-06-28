// src/components/storefront/StorefrontWishlist.tsx
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { ProductImage } from '../ui/ShopImage';

interface StorefrontWishlistProps {
  products: any[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCartDirectly: (product: any) => void;
  onNavigateToPage: (page: any, params?: any) => void;
}

export const StorefrontWishlist: React.FC<StorefrontWishlistProps> = ({
  products,
  wishlist,
  onToggleWishlist,
  onAddToCartDirectly,
  onNavigateToPage
}) => {
  // Filter products in wishlist
  const wishlistedItems = useMemo(() => {
    return products.filter(p => wishlist.includes(p.id));
  }, [products, wishlist]);

  return (
    <div className="space-y-6 px-5 pb-16 select-none text-left">
      <div className="space-y-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Curated Drops</span>
        <h2 className="font-syne text-2xl font-black uppercase tracking-tight text-white">Your Wishlist</h2>
      </div>

      {wishlistedItems.length === 0 ? (
        <div className="py-20 text-center text-neutral-500 space-y-4">
          <Heart className="w-16 h-16 mx-auto text-neutral-800 animate-pulse fill-current" />
          <p className="text-xs font-mono uppercase tracking-widest">Your wishlist is empty</p>
          <button
            onClick={() => onNavigateToPage('shop')}
            className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            Browse Releases
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {wishlistedItems.map((p, idx) => (
            <div
              key={`wish-${p.id || idx}`}
              className="group cursor-pointer flex flex-col justify-between bg-neutral-900/30 border border-neutral-800/50 hover:border-[#C6FF00]/30 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <div 
                onClick={() => onNavigateToPage('product', { productId: p.id })}
                className="aspect-[3/4] bg-neutral-950 w-full overflow-hidden relative"
              >
                <ProductImage product={p} index={0} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(p.id);
                  }}
                  className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black border border-white/5 text-[#C6FF00] rounded-full cursor-pointer z-10"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>

              <div className="p-3 border-t border-neutral-900 space-y-2 text-left">
                <div 
                  onClick={() => onNavigateToPage('product', { productId: p.id })}
                  className="space-y-0.5"
                >
                  <h4 className="text-xs font-bold uppercase truncate text-neutral-200 group-hover:text-white transition-colors">{p.name}</h4>
                  <span className="text-xs font-black text-[#C6FF00] font-mono block">${p.price}</span>
                </div>

                <button
                  onClick={() => onAddToCartDirectly(p)}
                  className="w-full py-2 bg-[#C6FF00] text-black text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow hover:opacity-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Add To Bag
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
