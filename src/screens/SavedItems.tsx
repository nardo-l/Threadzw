import React from 'react';
import { ArrowLeft, ShoppingBag, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSavedItems } from '../hooks/useSavedItems';
import { ScreenError } from '../components/ui/ScreenError';
import { ProductCardShimmer } from '../components/ui/Shimmer';

export const SavedItems: React.FC = () => {
  const navigate = useNavigate();
  const { savedItems, loading, error, refetch } = useSavedItems();

  const getStockStatus = (variants: any[]) => {
    const total = variants?.reduce((acc, v) => acc + v.quantity, 0) || 0;
    if (total >= 10) return { color: '#10b981', text: 'In Stock', bgColor: 'rgba(16,185,129,0.1)' };
    if (total >= 3) return { color: '#f59e0b', text: `Only ${total} left`, bgColor: 'rgba(245,158,11,0.1)' };
    if (total >= 1) return { color: '#ef4444', text: `Last ${total}!`, bgColor: 'rgba(239,68,68,0.1)' };
    return { color: '#555', text: 'Sold Out', bgColor: '#111' };
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 p-6 pb-32 min-h-screen bg-[#0d0d0d]">
        <header className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[#111]" />
          <div className="h-8 w-32 rounded-lg bg-[#111]" />
        </header>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <ProductCardShimmer key={`saved-pulse-${i}`} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ScreenError 
        icon={<Radio size={32} />}
        heading="Saved Items Error"
        body={error}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6 pb-32 min-h-screen bg-[#0d0d0d]">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full transition-colors bg-[#111] text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-syne font-bold text-white">Saved Items</h1>
      </header>

      {savedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl opacity-20 bg-[#111]">
            🔖
          </div>
          <div>
            <h3 className="text-lg font-syne font-bold text-white">No saved items yet</h3>
            <p className="text-sm font-sans text-[#555]">Bookmark products you love to see them here.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 text-white font-bold rounded-pill shadow-lg mt-2 bg-[#FF5FA2] shadow-[#FF5FA2]/20"
          >
            Explore Feed
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {savedItems.map(product => {
            const stock = getStockStatus(product.variants);
            const isSoldOut = stock.text === 'Sold Out';

            return (
              <div 
                key={product.id} 
                onClick={() => navigate(`/product/${product.id}`)}
                className={`rounded-card overflow-hidden border group cursor-pointer relative transition-all ${isSoldOut ? 'opacity-50 grayscale' : ''} bg-[#111] border-[#222] shadow-lg`}
              >
                <div className="h-40 relative flex items-center justify-center text-5xl overflow-hidden bg-[#1a1a1a]">
                  {product.images?.[0] ? (
                    <img src={product.images[0] || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    '👟'
                  )}
                  {isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest border px-2 py-1 rounded-pill border-white/20">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${stock.text.includes('Last') ? 'animate-pulse' : ''}`} style={{ background: stock.color }} />
                    <span className="text-[8px] font-mono uppercase tracking-wider text-[#555]">{stock.text}</span>
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-wider truncate text-[#555]">{product.shop_name}</p>
                  <h4 className="text-sm font-bold truncate text-white">{product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-syne font-bold text-[#FF5FA2]">${product.price}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
