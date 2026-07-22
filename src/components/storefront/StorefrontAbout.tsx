// src/components/storefront/StorefrontAbout.tsx
import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Feather } from 'lucide-react';
import { ShopLogo, ShopBanner } from '../ui/ShopImage';

interface StorefrontAboutProps {
  shop: any;
  onNavigateToPage: (page: any) => void;
}

export const StorefrontAbout: React.FC<StorefrontAboutProps> = ({
  shop,
  onNavigateToPage
}) => {
  return (
    <div className="space-y-8 px-5 pb-24 select-none text-left bg-white min-h-screen pt-4 font-sans">
      {/* Editorial Header */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 font-sans">Our Story</span>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">About Brand</h2>
      </div>

      {/* Large Featured Image */}
      <div className="h-48 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-150 relative shadow-sm">
        <ShopBanner shop={shop} height="100%" className="w-full h-full object-cover filter brightness-[0.7]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full border-2 border-white p-0.5 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-md">
              <ShopLogo shop={shop} size="100%" className="w-full h-full rounded-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight font-sans">
                {shop.name}
              </h3>
              <span className="text-[10px] font-bold text-green-300 mt-0.5 block font-sans">
                EST. {shop.created_at ? new Date(shop.created_at).getFullYear() : '2026'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Story Statement */}
      <div className="bg-zinc-50 border-l-[3px] border-green-600 pl-4 py-2.5 space-y-1 rounded-r-xl">
        <h4 className="text-[10px] uppercase tracking-wider text-green-700 font-bold font-sans">Our Mission</h4>
        <p className="text-zinc-600 text-xs leading-relaxed font-sans font-medium">
          {shop.description || 'Constructed with premium textiles, tailored shapes, and graphic identity. Our boutique represents a cultural movement designed in Zimbabwe to challenge international luxury standards, bringing pure fashion expression to everyday streetwear.'}
        </p>
      </div>

      {/* ----------------- MISSION & CORE VALUES ----------------- */}
      <div className="space-y-5">
        <h4 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2 font-sans">
          Boutique Values
        </h4>

        <div className="grid gap-4">
          {/* Value 1 */}
          <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
              <Feather className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-zinc-900 font-sans">Premium Quality</h5>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                Meticulous focus on seams, fabrics, and structured fits to provide garments that endure.
              </p>
            </div>
          </div>

          {/* Value 2 */}
          <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-zinc-900 font-sans">Cultural Representation</h5>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                Celebrating local street culture and creative designer identities, elevating modern styles.
              </p>
            </div>
          </div>

          {/* Value 3 */}
          <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-zinc-900 font-sans">Absolute Authenticity</h5>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                Every drop is verified original, constructed or handpicked by our expert design curation teams.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainable Local Mission */}
      <div className="bg-green-50/40 border border-green-100/50 rounded-2xl p-5 text-center space-y-3">
        <h4 className="text-xs font-bold text-green-800 font-sans">Our Local Mission</h4>
        <p className="text-[11px] text-zinc-600 leading-relaxed font-sans font-medium">
          We prioritize sustainable production runs to minimize waste and support high-standard creative collaborations. Thank you for supporting local Zimbabwe fashion.
        </p>
        <button
          onClick={() => onNavigateToPage('shop')}
          className="px-5 py-2 bg-green-600 text-white hover:bg-green-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          Explore Collection
        </button>
      </div>
    </div>
  );
};
