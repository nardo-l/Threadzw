import React from 'react';
import { ArrowLeft, ShoppingBag, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { useSavedItems } from '../hooks/useSavedItems';
import { ScreenError } from '../components/ui/ScreenError';
import { ProductCardShimmer } from '../components/ui/Shimmer';

export const SavedItems: React.FC = () => {
  const t = useTheme();
  const navigate = useNavigate();
  const { savedItems, loading, error, refetch } = useSavedItems();

  const getStockStatus = (variants: any[]) => {
    const total = variants?.reduce((acc, v) => acc + v.quantity, 0) || 0;
    if (total >= 10) return { color: t.green, text: 'In Stock', bgColor: t.green_bg };
    if (total >= 3) return { color: t.amber, text: `Only ${total} left`, bgColor: t.amber_bg };
    if (total >= 1) return { color: t.red, text: `Last ${total}!`, bgColor: t.red_bg };
    return { color: t.text_tertiary, text: 'Sold Out', bgColor: t.bg_card };
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 p-6 pb-32 min-h-screen" style={{ background: t.bg_primary }}>
        <header className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full" style={{ background: t.bg_card }} />
          <div className="h-8 w-32 rounded-lg" style={{ background: t.bg_card }} />
        </header>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <ProductCardShimmer key={i} />)}
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
    <div className="flex flex-col gap-8 p-6 pb-32 min-h-screen" style={{ background: t.bg_primary }}>
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full transition-colors" style={{ background: t.bg_card, color: t.text_primary }}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-syne font-bold" style={{ color: t.text_primary }}>Saved Items</h1>
      </header>

      {savedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl opacity-20" style={{ background: t.bg_card }}>
            🔖
          </div>
          <div>
            <h3 className="text-lg font-syne font-bold" style={{ color: t.text_primary }}>No saved items yet</h3>
            <p className="text-sm font-sans" style={{ color: t.text_tertiary }}>Bookmark products you love to see them here.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 text-white font-bold rounded-pill shadow-lg mt-2"
            style={{ background: t.accent, boxShadow: t.shadow }}
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
                className={`rounded-card overflow-hidden border group cursor-pointer relative transition-all ${isSoldOut ? 'opacity-50 grayscale' : ''}`}
                style={{ background: t.bg_card, borderColor: t.border_secondary }}
              >
                <div className="h-40 relative flex items-center justify-center text-5xl overflow-hidden" style={{ background: t.bg_secondary }}>
                  {product.images?.[0] ? (
                    <img src={product.images[0] || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    '👟'
                  )}
                  {isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: t.overlay }}>
                      <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest border px-2 py-1 rounded-pill" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${stock.text === 'Last ' + (product.variants?.reduce((acc: any, v: any) => acc + v.quantity, 0)) + '!' ? 'animate-pulse' : ''}`} style={{ background: stock.color }} />
                    <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: t.text_tertiary }}>{stock.text}</span>
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-wider truncate" style={{ color: t.text_tertiary }}>{product.shop_name}</p>
                  <h4 className="text-sm font-bold truncate" style={{ color: t.text_primary }}>{product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-syne font-bold" style={{ color: t.accent }}>${product.price}</span>
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
