// src/components/storefront/StorefrontCategories.tsx
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Shirt, HardHat, Sparkles, Smartphone, Eye, Gem, ShoppingBag } from 'lucide-react';

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

  const handleSelectCategory = (catName: string) => {
    onNavigateToPage('shop', { category: catName });
  };

  return (
    <div className="space-y-6 px-5 pb-20 select-none text-left bg-white min-h-screen pt-4">
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 font-sans">Curated Drops</span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">Categories</h2>
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
              className="relative h-24 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-150 cursor-pointer transition-all flex items-center group shadow-xs"
            >
              {/* Background cover */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={cat.banner} 
                  alt={cat.name} 
                  className="w-full h-full object-cover filter brightness-[0.45] grayscale group-hover:scale-103 group-hover:brightness-[0.4] transition-all duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
              </div>

              {/* Content overlay */}
              <div className="absolute inset-0 flex items-center justify-between p-5 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold tracking-wide text-white font-sans">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-300 font-sans">
                      {count} items listed
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 flex items-center justify-center text-white group-hover:bg-green-600 group-hover:border-green-600 transition-colors">
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
