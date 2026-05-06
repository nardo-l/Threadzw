import React from 'react';

export const Shimmer = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-[#1a1a1a] ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
  </div>
);

export const ProductCardShimmer = () => (
  <div className="rounded-2xl overflow-hidden border border-[#2a2a2a]">
    <Shimmer className="h-48 w-full" />
    <div className="p-3 space-y-2">
      <Shimmer className="h-3 w-2/3 rounded-full" />
      <Shimmer className="h-4 w-full rounded-full" />
      <Shimmer className="h-4 w-1/3 rounded-full" />
    </div>
  </div>
);

export const ShopCardShimmer = () => (
  <div className="rounded-2xl border border-[#2a2a2a] p-4 flex gap-3">
    <Shimmer className="h-12 w-12 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Shimmer className="h-4 w-1/2 rounded-full" />
      <Shimmer className="h-3 w-3/4 rounded-full" />
      <Shimmer className="h-3 w-1/3 rounded-full" />
    </div>
  </div>
);

export const StatCardShimmer = () => (
  <div className="rounded-2xl border border-[#2a2a2a] p-4 space-y-2">
    <Shimmer className="h-8 w-1/2 rounded-full" />
    <Shimmer className="h-3 w-2/3 rounded-full" />
  </div>
);
