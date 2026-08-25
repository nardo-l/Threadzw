// src/components/storefront/StorefrontWishlist.tsx
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { ProductImage } from '../ui/ShopImage';

interface StorefrontWishlistProps {
  shop?: any;
  products: any[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCartDirectly: (product: any) => void;
  onNavigateToPage: (page: any, params?: any) => void;
}

export const StorefrontWishlist: React.FC<StorefrontWishlistProps> = ({
  shop,
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
    <div className="space-y-6 px-5 pb-24 select-none text-left bg-white min-h-screen pt-4">
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider store-accent-text font-sans">Favorites</span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">Your Wishlist</h2>
      </div>

      {wishlistedItems.length === 0 ? (
        <div className="py-24 text-center text-zinc-400 space-y-4">
          <Heart className="w-12 h-12 mx-auto text-zinc-200 animate-pulse fill-zinc-100" />
          <p className="text-xs font-semibold tracking-wide text-zinc-500 font-sans">Your wishlist is empty</p>
          <button
            onClick={() => onNavigateToPage('shop')}
            className="px-6 py-2.5 store-accent-bg text-white text-xs font-semibold rounded-xl  transition-colors cursor-pointer shadow-sm"
          >
            Browse Collections
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {wishlistedItems.map((p, idx) => (
            <div
              key={`wish-${p.id || idx}`}
              className="group cursor-pointer flex flex-col justify-between bg-white border border-zinc-150 rounded-2xl overflow-hidden shadow-xs store-accent-hover-soft-border transition-all duration-300"
            >
              <div 
                onClick={() => onNavigateToPage('product', { productId: p.id })}
                className="aspect-[3/4] bg-zinc-50 w-full overflow-hidden relative"
              >
                <ProductImage product={p} shop={shop} index={0} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(p.id);
                  }}
                  className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-xs shadow-md border border-zinc-100 text-zinc-600 hover:text-red-500 rounded-full cursor-pointer z-10 transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 border-t border-zinc-100 space-y-2 text-left bg-zinc-50/50">
                <div 
                  onClick={() => onNavigateToPage('product', { productId: p.id })}
                  className="space-y-0.5"
                >
                  <h4 className="text-xs font-semibold truncate text-zinc-800 group-store-accent-hover-text transition-colors font-sans">{p.name}</h4>
                  <span className="text-xs font-bold text-zinc-900 block font-sans">${p.price}</span>
                </div>

                <button
                  onClick={() => onAddToCartDirectly(p)}
                  className="w-full py-2 store-accent-bg  text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Add to Bag
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
