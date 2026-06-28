// src/components/storefront/StorefrontCategories.tsx
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Filter, Shirt, HardHat, Sparkles, Smartphone, Eye, Gem, ShoppingBag } from 'lucide-react';

interface StorefrontCategoriesProps {
  products: any[];
  categories: any[];
  onNavigateToPage: (page: any, params?: any) => void;
}

export const StorefrontCategories: React.FC<StorefrontCategoriesProps> = ({
  products,
  categories,
  onNavigateToPage
}) => {
  // Required category definitions
  const requiredCategories = [
    { name: 'Clothing', icon: Shirt, banner: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80' },
    { name: 'Sneakers', icon: Sparkles, banner: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
    { name: 'Thrift', icon: ShoppingBag, banner: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80' },
    { name: 'Electronics', icon: Smartphone, banner: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80' },
    { name: 'Accessories', icon: HardHat, banner: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80' },
    { name: 'Jewellery', icon: Gem, banner: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80' },
    { name: 'Other', icon: Eye, banner: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80' }
  ];

  // Map product counts for each required category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    requiredCategories.forEach(cat => {
      counts[cat.name] = 0;
    });

    products.forEach(p => {
      const pCat = (p.category || '').toLowerCase();
      
      // Match clothing
      if (pCat.includes('clothing') || pCat.includes('tee') || pCat.includes('hoodie') || pCat.includes('pant') || pCat.includes('top') || pCat.includes('shirt') || pCat.includes('outerwear') || pCat.includes('streetwear')) {
        counts['Clothing'] += 1;
      }
      // Match sneakers
      else if (pCat.includes('sneaker') || pCat.includes('shoe') || pCat.includes('kicks') || pCat.includes('boots')) {
        counts['Sneakers'] += 1;
      }
      // Match thrift
      else if (pCat.includes('thrift') || pCat.includes('vintage') || pCat.includes('preowned')) {
        counts['Thrift'] += 1;
      }
      // Match electronics
      else if (pCat.includes('electronic') || pCat.includes('phone') || pCat.includes('gadget') || pCat.includes('pod') || pCat.includes('watch')) {
        counts['Electronics'] += 1;
      }
      // Match accessories
      else if (pCat.includes('accessory') || pCat.includes('cap') || pCat.includes('bag') || pCat.includes('socks') || pCat.includes('belt') || pCat.includes('hat')) {
        counts['Accessories'] += 1;
      }
      // Match jewellery
      else if (pCat.includes('jewel') || pCat.includes('chain') || pCat.includes('ring') || pCat.includes('necklace') || pCat.includes('earring') || pCat.includes('gold')) {
        counts['Jewellery'] += 1;
      }
      // Match other
      else {
        counts['Other'] += 1;
      }
    });

    return counts;
  }, [products]);

  // Click handler to open and filter in shop
  const handleSelectCategory = (catName: string) => {
    // Map selecting to actual product category filtering
    // In our shop, we filter products by subcategory directly, so we pass down the category query
    onNavigateToPage('shop', { category: catName });
  };

  return (
    <div className="space-y-6 px-5 pb-16 select-none text-left">
      <div className="space-y-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Curated Drops</span>
        <h2 className="font-syne text-2xl font-black uppercase tracking-tight text-white">Categories</h2>
      </div>

      <div className="space-y-3.5">
        {requiredCategories.map((cat, idx) => {
          const count = categoryCounts[cat.name] || 0;
          const IconComp = cat.icon;

          return (
            <motion.div
              whileTap={{ scale: 0.98 }}
              key={`category-row-${cat.name}-${idx}`}
              onClick={() => handleSelectCategory(cat.name)}
              className="relative h-28 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/80 hover:border-[#C6FF00]/30 cursor-pointer transition-all flex items-center group shadow-md"
            >
              {/* Background cover */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={cat.banner} 
                  alt={cat.name} 
                  className="w-full h-full object-cover filter brightness-[0.35] grayscale group-hover:scale-105 group-hover:brightness-[0.4] transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
              </div>

              {/* Content overlay */}
              <div className="absolute inset-0 flex items-center justify-between p-5 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center text-[#C6FF00]">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-syne text-sm font-black uppercase tracking-wider text-white leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
                      {count} items listed
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-neutral-400 group-hover:text-[#C6FF00] group-hover:border-[#C6FF00]/20 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
