import React, { useState } from 'react';
import { Search, ArrowRight, Star, MapPin, Users, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useShops } from '../hooks/useShops';
import { ShopCardShimmer } from '../components/ui/Shimmer';
import { ScreenError } from '../components/ui/ScreenError';
import { EmptyState } from '../components/ui/EmptyState';
import { getShopUrl } from '../utils/shopUrl';

import { Avatar } from '../components/Avatar';

export const Shops: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { shops, newShops, loading, error, refetch } = useShops(searchQuery);

  if (loading && !shops.length) {
    return (
      <div className="flex flex-col gap-8 p-6 min-h-screen bg-[#0d0d0d]">
        <header 
          className="sticky top-0 backdrop-blur-md z-40 py-4 -mx-6 px-6 flex justify-between items-center border-b bg-[#0d0d0d]/80 border-[#222]"
        >
          <h1 className="text-3xl font-pacifico text-[#C6FF00]">Shops</h1>
        </header>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => <ShopCardShimmer key={`shop-shimmer-${i}`} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0d0d0d]">
        <header 
          className="sticky top-0 backdrop-blur-md z-40 py-4 px-6 flex justify-between items-center border-b bg-[#0d0d0d]/80 border-[#222]"
        >
          <h1 className="text-3xl font-pacifico text-[#C6FF00]">Shops</h1>
        </header>
        <ScreenError 
          icon={<Radio size={32} />}
          heading="Couldn't load shops"
          body="Something went wrong loading the shops list."
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6 min-h-screen bg-[#0d0d0d]">
      <header 
        className="sticky top-0 backdrop-blur-md z-40 py-4 -mx-6 px-6 flex justify-between items-center border-b bg-[#0d0d0d]/80 border-[#222]"
      >
        <h1 className="text-3xl font-pacifico text-[#C6FF00]">Shops</h1>
        <button className="p-2 rounded-full bg-[#111] text-[#C6FF00]"><Search size={20} /></button>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search for shops..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border rounded-pill py-4 pl-14 pr-6 placeholder:text-muted focus:ring-2 transition-all outline-none bg-[#111] border-[#222] text-white focus:ring-[#C6FF00]"
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C6FF00]" size={20} />
      </div>

      {/* Affiliate Banner */}
      <div className="rounded-card p-6 flex flex-col gap-4 relative overflow-hidden bg-gradient-to-br from-[#C6FF00] to-[#C6FF00]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Users size={24} className="text-white" />
          </div>
          <h2 className="text-lg font-syne font-bold leading-tight text-white">
            Open a shop for someone.<br />Earn on every sale.
          </h2>
        </div>
        <button 
          onClick={() => toast.info("Coming soon....", {
            style: { background: '#0d0d0d', color: 'white', border: '1px solid #222' }
          })}
          className="bg-white font-bold py-3 rounded-pill text-sm hover:bg-opacity-90 transition-all active:scale-[0.98] text-[#C6FF00]"
        >
          Start Earning
        </button>
      </div>

      {shops.length > 0 ? (
        <>
          {/* Shops Near You */}
          <section className="flex flex-col gap-4">
            <h3 className="text-lg font-syne font-bold px-2 text-white">Shops Near You</h3>
            <div className="flex flex-col gap-4">
              {shops.slice(0, 3).map(shop => (
                <ShopCard 
                  key={shop.id} 
                  shop={shop} 
                  onClick={() => {
                    const activeSlug = shop.slug || shop.handle;
                    const path = getShopUrl(activeSlug);
                    console.log("[SHOPS ROUTING] Clicked ShopCard, navigating to:", path);
                    if (path) {
                      navigate(path);
                    } else {
                      console.warn("[SHOPS ROUTING] Broken link prevented: slug/handle missing", shop);
                      toast.error("Unable to load store storefront!");
                    }
                  }} 
                />
              ))}
            </div>
          </section>

          {/* New Shops This Week */}
          {newShops.length > 0 && (
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-syne font-bold px-2 text-white">New Shops This Week</h3>
              <div className="flex flex-col gap-4">
                {newShops.map(shop => (
                  <div key={shop.id} className="relative">
                    <ShopCard 
                      shop={shop} 
                      onClick={() => {
                        const activeSlug = shop.slug || shop.handle;
                        const path = getShopUrl(activeSlug);
                        console.log("[SHOPS ROUTING] Clicked New ShopCard, navigating to:", path);
                        if (path) {
                          navigate(path);
                        } else {
                          console.warn("[SHOPS ROUTING] Broken link prevented: slug/handle missing on new shop", shop);
                          toast.error("Unable to load store storefront!");
                        }
                      }} 
                    />
                    <span className="absolute -top-2 -right-2 text-black text-[8px] font-mono font-black px-2 py-1 rounded-pill shadow-lg uppercase tracking-widest bg-[#f59e0b]">NEW</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <EmptyState 
          icon="🏪"
          heading="No shops found"
          body="Try searching for something else or browse all shops."
          buttonLabel="Clear Search"
          buttonAction={() => setSearchQuery('')}
        />
      )}
    </div>
  );
};

const ShopCard: React.FC<{ shop: any, onClick: () => void }> = ({ shop, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="rounded-card p-4 flex items-center gap-4 group cursor-pointer transition-all border bg-[#111] border-[#222]"
    >
      <Avatar 
        url={shop.avatar_url} 
        size={56}
        className="border border-[#333]"
      />
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white">{shop.name}</h4>
          <div className="flex items-center gap-1">
            <Star size={12} fill="currentColor" className="text-[#f59e0b]" />
            <span className="text-[10px] font-mono font-bold text-[#888]">{shop.rating || 5.0}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#555]">
          <MapPin size={10} />
          <span className="text-[10px] font-mono">{shop.area}</span>
        </div>
        <div className="flex gap-2 mt-1">
          {shop.categories?.map((cat: string) => (
            <span key={cat} className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-pill bg-[#1a1a1a] text-[#555]">
              {cat}
            </span>
          ))}
        </div>
      </div>
      <ArrowRight size={18} className="transition-all text-[#555]" />
    </div>
  );
};
