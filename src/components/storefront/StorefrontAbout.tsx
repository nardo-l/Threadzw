// src/components/storefront/StorefrontAbout.tsx
import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, MapPin, Feather, Globe } from 'lucide-react';
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
    <div className="space-y-8 px-5 pb-16 select-none text-left">
      {/* Editorial Header */}
      <div className="space-y-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C6FF00] font-mono">Editorial Journal</span>
        <h2 className="font-syne text-2xl font-black uppercase tracking-tight text-white">About Brand</h2>
      </div>

      {/* Large Featured Image */}
      <div className="h-56 rounded-[24px] overflow-hidden bg-neutral-950 border border-neutral-800 relative shadow-lg">
        <ShopBanner shop={shop} height="100%" className="w-full h-full object-cover filter brightness-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3.5 z-10">
          <div className="w-12 h-12 rounded-full border border-[#C6FF00] p-0.5 bg-black overflow-hidden flex items-center justify-center shrink-0">
            <ShopLogo shop={shop} size="100%" className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <h3 className="font-syne text-sm font-black uppercase tracking-wider text-white leading-none">
              {shop.name}
            </h3>
            <span className="text-[9px] uppercase font-mono tracking-widest text-[#C6FF00] font-bold mt-1 block">
              EST. {shop.created_at ? new Date(shop.created_at).getFullYear() : '2026'}
            </span>
          </div>
        </div>
      </div>

      {/* Brand Story Statement */}
      <div className="bg-neutral-900/20 border-l-[3px] border-[#C6FF00] pl-4 py-1 space-y-2">
        <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#C6FF00] font-bold">The Design Manifesto</h4>
        <p className="text-neutral-300 text-xs leading-relaxed font-sans">
          {shop.description || 'Constructed with premium textiles, tailored shapes, and graphic identity. ThreadZW boutique represents a cultural movement designed in Bulawayo to challenge international luxury standards, bringing pure fashion expression to everyday street apparel.'}
        </p>
      </div>

      {/* ----------------- MISSION & CORE VALUES ----------------- */}
      <div className="space-y-5">
        <h4 className="font-syne text-sm font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-2">
          Boutique Values
        </h4>

        <div className="grid gap-4">
          {/* Value 1 */}
          <div className="p-4 bg-neutral-900/40 border border-neutral-850 rounded-2xl flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00] shrink-0 mt-0.5">
              <Feather className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wide text-neutral-100">Tailored Construction</h5>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Meticulous focus on seams, fabric weight (300GSM+ cotton), and structured fits to provide comfort that endures.
              </p>
            </div>
          </div>

          {/* Value 2 */}
          <div className="p-4 bg-neutral-900/40 border border-neutral-850 rounded-2xl flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00] shrink-0 mt-0.5">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wide text-neutral-100">Urban Identity</h5>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Celebrating local street culture and designer identity of Bulawayo, elevating modern African tailoring.
              </p>
            </div>
          </div>

          {/* Value 3 */}
          <div className="p-4 bg-neutral-900/40 border border-neutral-850 rounded-2xl flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00] shrink-0 mt-0.5">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wide text-neutral-100">Absolute Authenticity</h5>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Every drop is verified original, constructed or handpicked by our expert design curation teams.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainable Local Mission */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-[20px] p-5 text-center space-y-2.5">
        <h4 className="font-syne text-xs font-extrabold uppercase tracking-widest text-white">Our Local Mission</h4>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          We prioritize local tailors, sustainable small-batch production runs to minimize waste, and high-standard working coordinates within the Bulawayo arts community. Thank you for supporting Zimbabwe fashion culture.
        </p>
        <button
          onClick={() => onNavigateToPage('shop')}
          className="mt-2.5 px-5 py-2.5 bg-neutral-950 text-[#C6FF00] border border-neutral-800 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#C6FF00] hover:text-black hover:border-transparent transition-all cursor-pointer"
        >
          Explore drops
        </button>
      </div>
    </div>
  );
};
