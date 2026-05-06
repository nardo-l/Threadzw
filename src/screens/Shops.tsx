import React, { useState } from 'react';
import { Search, ArrowRight, Star, MapPin, Users, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useShops } from '../hooks/useShops';
import { ShopCardShimmer } from '../components/ui/Shimmer';
import { ScreenError } from '../components/ui/ScreenError';
import { EmptyState } from '../components/ui/EmptyState';

import { Avatar } from '../components/Avatar';

export const Shops: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { shops, newShops, loading, error, refetch } = useShops(searchQuery);

  if (loading && !shops.length) {
    return (
      <div className="flex flex-col gap-8 p-6">
        <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 flex justify-between items-center">
          <h1 className="text-3xl font-pacifico text-primary">Shops</h1>
        </header>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => <ShopCardShimmer key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40 py-4 px-6 flex justify-between items-center">
          <h1 className="text-3xl font-pacifico text-primary">Shops</h1>
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
    <div className="flex flex-col gap-8 p-6">
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 flex justify-between items-center">
        <h1 className="text-3xl font-pacifico text-primary">Shops</h1>
        <button className="p-2 rounded-full bg-card text-primary"><Search size={20} /></button>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search for shops..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card border-none rounded-pill py-4 pl-14 pr-6 text-white placeholder:text-muted focus:ring-2 focus:ring-primary transition-all outline-none"
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
      </div>

      {/* Affiliate Banner */}
      <div className="gradient-purple-pink rounded-card p-6 flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Users size={24} className="text-white" />
          </div>
          <h2 className="text-lg font-syne font-bold leading-tight">
            Open a shop for someone.<br />Earn on every sale.
          </h2>
        </div>
        <button 
          onClick={() => toast.info("Coming soon....", {
            style: { background: '#111', color: 'white', border: '1px solid #222' }
          })}
          className="bg-white text-primary font-bold py-3 rounded-pill text-sm hover:bg-opacity-90 transition-all active:scale-[0.98]"
        >
          Start Earning
        </button>
      </div>

      {shops.length > 0 ? (
        <>
          {/* Shops Near You */}
          <section className="flex flex-col gap-4">
            <h3 className="text-lg font-syne font-bold px-2">Shops Near You</h3>
            <div className="flex flex-col gap-4">
              {shops.slice(0, 3).map(shop => (
                <ShopCard key={shop.id} shop={shop} onClick={() => navigate(`/shop/${shop.handle}`)} />
              ))}
            </div>
          </section>

          {/* New Shops This Week */}
          {newShops.length > 0 && (
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-syne font-bold px-2">New Shops This Week</h3>
              <div className="flex flex-col gap-4">
                {newShops.map(shop => (
                  <div key={shop.id} className="relative">
                    <ShopCard shop={shop} onClick={() => navigate(`/shop/${shop.handle}`)} />
                    <span className="absolute -top-2 -right-2 bg-secondary text-black text-[8px] font-mono font-black px-2 py-1 rounded-pill shadow-lg uppercase tracking-widest">NEW</span>
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
      className="bg-card rounded-card p-4 flex items-center gap-4 group cursor-pointer hover:bg-card/80 transition-all"
    >
      <Avatar 
        url={shop.avatar_url} 
        size={56}
        className="border border-white/5"
      />
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white">{shop.name}</h4>
          <div className="flex items-center gap-1 text-secondary">
            <Star size={12} fill="currentColor" />
            <span className="text-[10px] font-mono font-bold">{shop.rating || 5.0}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted">
          <MapPin size={10} />
          <span className="text-[10px] font-mono">{shop.area}</span>
        </div>
        <div className="flex gap-2 mt-1">
          {shop.categories?.map((cat: string) => (
            <span key={cat} className="text-[8px] font-mono uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-pill text-muted">
              {cat}
            </span>
          ))}
        </div>
      </div>
      <ArrowRight size={18} className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </div>
  );
};
