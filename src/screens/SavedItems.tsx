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
    if (total >= 10) return { color: 'bg-green-500', text: 'In Stock' };
    if (total >= 3) return { color: 'bg-amber-500', text: `Only ${total} left` };
    if (total >= 1) return { color: 'bg-red-500 animate-pulse', text: `Last ${total}!` };
    return { color: 'bg-muted', text: 'Sold Out' };
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 p-6 pb-32 bg-background min-h-screen">
        <header className="flex items-center gap-4">
          <div className="h-10 w-10 bg-card rounded-full shimmer-bg" />
          <div className="h-8 w-32 bg-card rounded-lg shimmer-bg" />
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
    <div className="flex flex-col gap-8 p-6 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-card text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-syne font-bold text-white">Saved Items</h1>
      </header>

      {savedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center text-4xl opacity-20">
            🔖
          </div>
          <div>
            <h3 className="text-lg font-syne font-bold text-white">No saved items yet</h3>
            <p className="text-sm text-muted">Bookmark products you love to see them here.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-primary text-white font-bold rounded-pill shadow-lg shadow-primary/30 mt-2"
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
                className={`bg-card rounded-card overflow-hidden border-t border-primary/10 group cursor-pointer relative transition-all ${isSoldOut ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="h-40 bg-black relative flex items-center justify-center text-5xl overflow-hidden">
                  <div className="absolute inset-0 shimmer opacity-50" />
                  {product.images?.[0] ? (
                    <img src={product.images[0] || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    product.imageEmoji || '👟'
                  )}
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest border border-white/20 px-2 py-1 rounded-pill">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${stock.color}`} />
                    <span className="text-[8px] font-mono text-muted uppercase tracking-wider">{stock.text}</span>
                  </div>
                  <p className="text-[10px] font-mono text-muted uppercase tracking-wider truncate">{product.shop_name}</p>
                  <h4 className="text-sm font-bold truncate text-white">{product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-primary font-syne font-bold">${product.price}</span>
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
