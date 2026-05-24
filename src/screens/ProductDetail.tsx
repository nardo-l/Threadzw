import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Share2, MessageCircle, 
  Check, Zap, Package, ShoppingBag,
  ChevronRight, Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Product, Shop } from '../types';

export const ProductDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, shops(*)')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        setLoading(false);
        return;
      }
      
      setProduct(data);
      setShop(data.shops);
      setLoading(false);
      
      // Increment view
      await supabase.rpc('increment_product_view_count', { product_id: id });
    };
    
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product || !shop) {
    return (
      <div className="min-h-screen bg-page-bg text-white flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-card-bg rounded-3xl flex items-center justify-center text-4xl mb-6">🚫</div>
        <h1 className="text-2xl font-black italic tracking-tighter">Item Not Found</h1>
        <button onClick={() => navigate(-1)} className="mt-8 text-neon font-black uppercase text-xs italic tracking-widest underline">Back to Shop</button>
      </div>
    );
  }

  const handleWhatsApp = () => {
    if (!selectedSize && product.sizes?.length > 0) {
      alert('Please select a size first');
      return;
    }
    const message = `Hi! I saw your ${product.name} on ThreadZW and I'm interested. ${selectedSize ? `Is it available in size ${selectedSize}?` : ''}`;
    const url = `https://wa.me/${shop.whatsapp?.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-page-bg text-white pb-40 lg:pb-0">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 h-20 z-50 flex justify-between items-center px-6 pointer-events-none">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center pointer-events-auto active:scale-90 transition-all">
          <ArrowLeft size={22} />
        </button>
        <button className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center pointer-events-auto active:scale-90 transition-all">
          <Share2 size={22} />
        </button>
      </div>

      <div className="lg:flex lg:min-h-screen">
        {/* Media Section */}
        <div className="relative w-full aspect-[4/5] lg:aspect-auto lg:flex-1 lg:h-screen bg-ele-bg overflow-hidden sticky lg:top-0">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImage}
              src={product.images?.[currentImage] || 'https://via.placeholder.com/600x800'} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          </AnimatePresence>
          
          {/* Controls */}
          {product.images?.length > 1 && (
            <div className="absolute inset-x-0 bottom-10 flex justify-center gap-2 z-20">
              {product.images.map((_, i) => (
                <div 
                  key={`indicator-${i}`} 
                  onClick={() => setCurrentImage(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentImage ? 'w-8 bg-neon' : 'w-2 bg-white/20'}`} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="px-6 pt-10 pb-20 lg:w-[480px] lg:h-screen lg:overflow-y-auto lg:bg-page-bg lg:pt-24 lg:pb-32 no-scrollbar">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-neon/10 border border-neon/30 text-neon px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic leading-none">
                {product.category || 'CURATED DROP'}
              </div>
              <div className="flex items-center gap-1.5 text-secondary-text text-[10px] font-bold uppercase tracking-widest">
                <Zap size={10} className="text-neon" /> {product.total_stock > 0 ? `${product.total_stock} LEFT` : 'OUT OF STOCK'}
              </div>
            </div>

            <h1 className="text-[40px] font-black italic tracking-tighter leading-none mb-4">{product.name}</h1>
            
            <div className="flex items-baseline gap-3 mb-10 pb-8 border-b border-border">
              <span className="text-4xl font-black text-neon italic">${product.price}</span>
              <span className="text-secondary-text text-sm font-bold uppercase tracking-widest italic opacity-50">USD</span>
            </div>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-10">
                <h3 className="text-secondary-text text-[11px] font-black tracking-[0.2em] uppercase mb-4 italic">Select Archetype Config</h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((s: any) => {
                    const isSelected = selectedSize === s.size;
                    const isOut = s.quantity === 0;
                    return (
                      <button 
                        key={s.size}
                        disabled={isOut}
                        onClick={() => setSelectedSize(s.size)}
                        className={`h-16 flex-1 min-w-[70px] rounded-2xl border-2 font-black italic text-lg transition-all ${isSelected ? 'bg-neon border-neon text-neon-text shadow-[0_8px_24px_rgba(198,255,0,0.15)]' : isOut ? 'bg-ele-bg border-border text-secondary-text/30 cursor-not-allowed italic font-normal' : 'bg-card-bg border-border hover:border-white'}`}
                      >
                        {s.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Narrative */}
            <div className="mb-12">
               <h3 className="text-secondary-text text-[11px] font-black tracking-[0.2em] uppercase mb-4 italic">Manifesto Note</h3>
               <p className="text-lg font-medium text-secondary-text leading-relaxed">
                 {product.description || 'A unique piece curated for the high-end streetwear enthusiast. Premium materials, flawless construction.'}
               </p>
            </div>

            {/* Shop Box */}
            <div className="bg-card-bg border border-border rounded-[32px] p-6 mb-12 flex items-center justify-between group active:scale-[0.98] transition-all" onClick={() => navigate(`/shop/${shop.handle}`)}>
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-[24px] bg-ele-bg border-2 border-border overflow-hidden">
                    {shop.avatar_url ? (
                      <img src={shop.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-neon text-xl bg-page-bg">
                        {shop.name[0].toUpperCase()}
                      </div>
                    )}
                 </div>
                 <div>
                    <h4 className="font-bold text-lg mb-0.5">{shop.name}</h4>
                    <span className="text-secondary-text text-xs uppercase tracking-widest font-black italic text-neon">@{shop.handle}</span>
                 </div>
              </div>
              <ChevronRight size={20} className="text-secondary-text group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Tech Specs */}
            <div className="grid grid-cols-2 gap-4 mb-20">
               <div className="bg-ele-bg border border-border/50 rounded-2xl p-5 flex flex-col gap-4">
                  <Shield size={24} className="text-neon" />
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest italic mb-1">Authentic Node</h5>
                    <p className="text-[9px] text-secondary-text font-bold leading-relaxed">Fully verified by ThreadZW protocols.</p>
                  </div>
               </div>
               <div className="bg-ele-bg border border-border/50 rounded-2xl p-5 flex flex-col gap-4">
                  <Package size={24} className="text-warm" />
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest italic mb-1">Stock Status</h5>
                    <p className="text-[9px] text-secondary-text font-bold leading-relaxed">Direct from shop inventory.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Buy Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-[60] bg-page-bg/80 backdrop-blur-2xl border-t border-border px-6 pt-6 pb-safe">
        <div className="max-w-xl mx-auto flex items-center gap-6">
          <div className="flex flex-col">
             <span className="text-secondary-text text-[10px] font-black uppercase tracking-widest italic opacity-50 mb-1">Subtotal</span>
             <div className="text-3xl font-black italic tracking-tighter leading-none">${product.price}</div>
          </div>
          <button 
            onClick={handleWhatsApp}
            className="flex-1 h-[68px] bg-neon text-neon-text rounded-2xl flex items-center justify-center gap-3 font-black text-xl italic tracking-tighter uppercase shadow-[0_12px_40px_rgba(198,255,0,0.2)] active:scale-[0.97] transition-all"
          >
            ORDER ON WHATSAPP <MessageCircle size={28} fill="currentColor" stroke="none" />
          </button>
        </div>
      </footer>
    </div>
  );
};
