import React, { useState } from 'react';
import { Search, ArrowRight, Star, MapPin, Users, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '../App';
import { useShops } from '../hooks/useShops';
import { ShopCardShimmer } from '../components/ui/Shimmer';
import { ScreenError } from '../components/ui/ScreenError';
import { EmptyState } from '../components/ui/EmptyState';

import { Avatar } from '../components/Avatar';

export const Shops: React.FC = () => {
  const t = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { shops, newShops, loading, error, refetch } = useShops(searchQuery);

  if (loading && !shops.length) {
    return (
      <div className="flex flex-col gap-8 p-6 min-h-screen" style={{ background: t.bg_primary }}>
        <header 
          className="sticky top-0 backdrop-blur-md z-40 py-4 -mx-6 px-6 flex justify-between items-center border-b"
          style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
        >
          <h1 className="text-3xl font-pacifico" style={{ color: t.accent }}>Shops</h1>
        </header>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => <ShopCardShimmer key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: t.bg_primary }}>
        <header 
          className="sticky top-0 backdrop-blur-md z-40 py-4 px-6 flex justify-between items-center border-b"
          style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
        >
          <h1 className="text-3xl font-pacifico" style={{ color: t.accent }}>Shops</h1>
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
    <div className="flex flex-col gap-8 p-6 min-h-screen" style={{ background: t.bg_primary }}>
      <header 
        className="sticky top-0 backdrop-blur-md z-40 py-4 -mx-6 px-6 flex justify-between items-center border-b"
        style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
      >
        <h1 className="text-3xl font-pacifico" style={{ color: t.accent }}>Shops</h1>
        <button className="p-2 rounded-full" style={{ background: t.bg_card, color: t.accent }}><Search size={20} /></button>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search for shops..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border rounded-pill py-4 pl-14 pr-6 placeholder:text-muted focus:ring-2 transition-all outline-none"
          style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary, '--tw-ring-color': t.accent } as any}
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2" style={{ color: t.accent }} size={20} />
      </div>

      {/* Affiliate Banner */}
      <div className="rounded-card p-6 flex flex-col gap-4 relative overflow-hidden" style={{ background: t.gradient }}>
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
            style: { background: t.bg_primary, color: t.text_primary, border: `1px solid ${t.border_secondary}` }
          })}
          className="bg-white font-bold py-3 rounded-pill text-sm hover:bg-opacity-90 transition-all active:scale-[0.98]"
          style={{ color: t.accent }}
        >
          Start Earning
        </button>
      </div>

      {shops.length > 0 ? (
        <>
          {/* Shops Near You */}
          <section className="flex flex-col gap-4">
            <h3 className="text-lg font-syne font-bold px-2" style={{ color: t.text_primary }}>Shops Near You</h3>
            <div className="flex flex-col gap-4">
              {shops.slice(0, 3).map(shop => (
                <ShopCard key={shop.id} shop={shop} onClick={() => navigate(`/shop/${shop.handle}`)} />
              ))}
            </div>
          </section>

          {/* New Shops This Week */}
          {newShops.length > 0 && (
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-syne font-bold px-2" style={{ color: t.text_primary }}>New Shops This Week</h3>
              <div className="flex flex-col gap-4">
                {newShops.map(shop => (
                  <div key={shop.id} className="relative">
                    <ShopCard shop={shop} onClick={() => navigate(`/shop/${shop.handle}`)} />
                    <span className="absolute -top-2 -right-2 text-black text-[8px] font-mono font-black px-2 py-1 rounded-pill shadow-lg uppercase tracking-widest" style={{ background: t.amber }}>NEW</span>
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
  const t = useTheme();
  return (
    <div 
      onClick={onClick}
      className="rounded-card p-4 flex items-center gap-4 group cursor-pointer transition-all border"
      style={{ background: t.bg_card, borderColor: t.border_secondary }}
    >
      <Avatar 
        url={shop.avatar_url} 
        size={56}
        className="border"
        style={{ borderColor: t.border_subtle }}
      />
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h4 className="font-bold" style={{ color: t.text_primary }}>{shop.name}</h4>
          <div className="flex items-center gap-1">
            <Star size={12} fill="currentColor" style={{ color: t.amber }} />
            <span className="text-[10px] font-mono font-bold" style={{ color: t.text_secondary }}>{shop.rating || 5.0}</span>
          </div>
        </div>
        <div className="flex items-center gap-1" style={{ color: t.text_tertiary }}>
          <MapPin size={10} />
          <span className="text-[10px] font-mono">{shop.area}</span>
        </div>
        <div className="flex gap-2 mt-1">
          {shop.categories?.map((cat: string) => (
            <span key={cat} className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-pill" style={{ background: t.bg_secondary, color: t.text_tertiary }}>
              {cat}
            </span>
          ))}
        </div>
      </div>
      <ArrowRight size={18} className="transition-all" style={{ color: t.text_tertiary }} />
    </div>
  );
};
