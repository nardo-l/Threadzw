import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, MapPin, Clock, MessageCircle, Star, Check, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useInventory } from '../../context/InventoryContext';
import { supabase } from '../../lib/supabase';
import { isShopOpen } from '../../lib/utils';
import { ShareSheet } from '../ShareSheet';

export const ShopProfileView: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentShopId, 
    following, 
    toggleFollow, 
    shops, 
    products, 
    reviews: contextReviews,
    increaseShopViewCount
  } = useInventory();
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');
  const [followerCount, setFollowerCount] = useState(0);
  const [showShareSheet, setShowShareSheet] = useState(false);

  const shop = shops.find(s => s.id === currentShopId);
  const shopProducts = products.filter(p => p.shop_id === shop?.id);
  const shopReviews = contextReviews[shop?.id || ''] || [];

  const openStatus = { isOpen: true, text: 'Open' }; // Fallback since trading_hours_json might be missing

  useEffect(() => {
    if (shop?.id) {
       increaseShopViewCount(shop.id);
       
       const fetchFollowers = async () => {
         const { count, error } = await supabase
           .from('follows')
           .select('*', { count: 'exact', head: true })
           .eq('shop_id', shop.id);
         if (!error && count !== null) setFollowerCount(count);
       };
       fetchFollowers();
    }
  }, [shop?.id, increaseShopViewCount]);

  const trackShareEvent = async () => {
    if (!shop?.id) return;
    try {
      await supabase.rpc('increment_shop_shares', { p_shop_id: shop.id });
    } catch (err) {
      console.error('Share tracking error:', err);
    }
  };

  const handleShareShopProfile = async () => {
    if (!shop) return;
    const link = 'https://threadzw.vercel.app/shop/@' + shop.handle.toLowerCase();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop.name + ' on Zimbabwe ThreadZW',
          text: `Check out ${shop.name} on Zimbabwe ThreadZW 🧵`,
          url: link
        });
        trackShareEvent();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setShowShareSheet(true);
        }
      }
    } else {
      setShowShareSheet(true);
    }
  };

  if (!shop) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-8 text-center text-white">
      <div className="text-[64px] mb-4">🏪</div>
      <h1 className="text-xl font-bold mb-2">Shop not found</h1>
      <p className="text-[#888] mb-6">The shop you are looking for does not exist or has been removed.</p>
      <button 
        onClick={() => navigate('/shops')}
        className="px-8 h-12 bg-linear-to-r from-[#9B27AF] to-[#FF2D78] rounded-full font-bold"
      >
        Explore Other Shops
      </button>
    </div>
  );

  return (
    <div className="flex flex-col bg-black min-h-screen pb-[120px]">
      {/* Banner & Back Arrow */}
      <div className="relative w-full h-[200px] bg-[#111] overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/60 z-[1]" />
        {shop.banner_url && (
          <img src={shop.banner_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        )}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-8 left-5 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center z-10"
        >
          <ArrowLeft className="text-white" size={20} />
        </button>
      </div>

      {/* Shop Info Overlay */}
      <div className="px-5 relative z-10">
        <div className="flex justify-between items-start -mt-[34px]">
          <div className="w-[84px] h-[84px] rounded-full border-[4px] border-black p-0.5 bg-black overflow-hidden relative shadow-2xl">
             {(shop.avatar_url || shop.logo_url) ? (
               <img src={shop.avatar_url || shop.logo_url} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
             ) : (
               <div className="w-full h-full rounded-full bg-linear-to-br from-[#FF2D78] to-[#9B27AF] border-2 border-[#FF2D78] flex items-center justify-center text-2xl">🏪</div>
             )}
          </div>
          <div className="flex gap-2 mt-[44px]">
             <button 
              onClick={handleShareShopProfile}
              className="w-9 h-9 rounded-full bg-[#111] border border-[#222] flex items-center justify-center transition-transform active:scale-90"
             >
                <Share2 className="text-white" size={16} />
             </button>
             <button 
              onClick={() => toggleFollow(shop.id)}
              className={`h-9 px-5 rounded-full font-bold text-[13px] transition-all
                ${following.includes(shop.id) ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white' : 'border border-[#FF2D78] text-[#FF2D78]'}`}
             >
                {following.includes(shop.id) ? 'Following ✓' : 'Follow'}
             </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <h2 className="text-white font-bold text-[20px]">{shop.name}</h2>
          {shop.is_verified && <Check className="bg-[#FF2D78] text-white p-0.5 rounded-full" size={14} />}
        </div>
        <div className="text-[#888] text-[12px] mt-0.5">@{shop.handle || (shop.name && shop.name.toLowerCase().replace(/\s+/g, '')) || 'shop'} • {shop.location || shop.area}</div>
        
        <div className="mt-2.5 flex items-center gap-2">
          <div className="px-3 py-1 bg-[#FF2D781A] border border-[#FF2D7833] rounded-full text-[#FF2D78] text-[11px] font-medium">
            {shop.category || "General Store"}
          </div>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 text-[11px] font-medium flex items-center gap-1.5">
            <MapPin size={10} /> {shop.location || shop.area || 'Unknown'}
          </div>
        </div>

        <p className="text-[#888] text-[14px] mt-3 leading-relaxed">
          {shop.description || "Welcome to our shop! We offer the best quality products for you."}
        </p>

        {/* Stats Row */}
        <div className="mt-4 flex items-center justify-between bg-[#111] border border-[#222] rounded-[16px] py-3.5 px-6">
           <div className="flex flex-col items-center">
             <span className="text-white font-bold text-[18px]">{followerCount}</span>
             <span className="text-[#888] text-[11px] mt-0.5">Followers</span>
           </div>
           <div className="w-px h-8 bg-[#222]" />
           <div className="flex flex-col items-center">
             <span className="text-white font-bold text-[18px]">{shopProducts.length}</span>
             <span className="text-[#888] text-[11px] mt-0.5">Products</span>
           </div>
           <div className="w-px h-8 bg-[#222]" />
           <div className="flex flex-col items-center">
             <span className="text-white font-bold text-[18px]">4.9</span>
             <span className="text-[#888] text-[11px] mt-0.5">Rating</span>
           </div>
        </div>

        {/* Info Cards */}
        <div className="mt-4 space-y-2">
           <div className="bg-[#111] border border-[#222] rounded-[12px] p-3.5 flex gap-3">
              <MapPin className="text-[#FF2D78] shrink-0" size={16} />
              <div className="text-[#888] text-[13px] leading-relaxed">
                {shop.area || "Harare, Zimbabwe"} {shop.landmark ? `• ${shop.landmark}` : ''}
              </div>
           </div>
           <div className="bg-[#111] border border-[#222] rounded-[12px] p-3.5 flex gap-3">
              <Clock className="text-[#FF2D78] shrink-0" size={16} />
              <div className="flex-1">
                 <div className="text-[#888] text-[13px]">{shop.trading_hours || 'Mon–Sat: 8am – 6pm'}</div>
                 <div className={`text-[12px] mt-1.5 flex items-center gap-1.5 font-bold ${openStatus.isOpen ? 'text-green-500' : 'text-[#f59e0b]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${openStatus.isOpen ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-[#f59e0b]'}`} /> 
                    {openStatus.text}
                 </div>
              </div>
           </div>
        </div>

        {/* WhatsApp CTA */}
        <a 
          href={`https://wa.me/${shop.whatsapp?.replace(/\+/g, '') || '263700000000'}?text=Hi ${shop.name}, I'm interested in your products.`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2.5 w-full h-[48px] bg-[#25D366] rounded-full text-white font-bold text-[14px] shadow-lg active:scale-[0.98] transition-transform"
        >
          <MessageCircle size={18} fill="white" />
          Chat on WhatsApp
        </a>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <div className="mx-5 bg-[#111] rounded-full p-1 flex">
           {(['products', 'reviews'] as const).map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`flex-1 h-[38px] rounded-full text-[13px] font-bold capitalize transition-all
                 ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-[#888]'}`}
             >
               {tab}
             </button>
           ))}
        </div>

        {activeTab === 'products' ? (
          <div className="grid grid-cols-2 gap-2.5 px-5 mt-5">
            {shopProducts.map(p => (
              <div 
                key={p.id} 
                className="bg-[#111] border border-[#222] rounded-[14px] overflow-hidden"
                onClick={() => navigate(`/product/${p.id}`)}
              >
                 <div className="aspect-square bg-card relative flex items-center justify-center text-[40px] overflow-hidden">
                    {p.images[0] ? (
                      <img src={p.images[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : '👟'}
                 </div>
                 <div className="p-2.5">
                    <div className="text-white font-bold text-[13px] truncate">{p.name}</div>
                    <div className="text-[#FF2D78] font-bold text-[13px] mt-0.5">${p.price}</div>
                    <div className="mt-1.5 px-2 py-0.5 bg-green-500/10 rounded-full w-fit">
                       <span className="text-green-500 text-[10px] font-bold">{p.total_stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 mt-5 space-y-4">
             {/* Rating Summary */}
             <div className="bg-[#111] rounded-[14px] p-4 flex gap-6 items-center">
                <div className="flex flex-col items-center">
                   <span className="text-white font-bold text-[40px] leading-none">4.8</span>
                   <div className="flex text-[#FF2D78] gap-0.5 mt-2">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < 4 ? 'currentColor' : 'none'} />)}
                   </div>
                   <span className="text-[#888] text-[11px] mt-1.5">12 reviews</span>
                </div>
                <div className="w-px h-16 bg-[#222]" />
                <div className="flex-1 space-y-1.5">
                   {[5, 4, 3, 2, 1].map(stars => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-[#888] text-[10px] w-4">{stars}★</span>
                        <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                           <div 
                            className="h-full bg-linear-to-r from-[#9B27AF] to-[#FF2D78]" 
                            style={{ width: stars === 5 ? '80%' : stars === 4 ? '15%' : '5%' }}
                           />
                        </div>
                        <span className="text-[#888] text-[10px] w-4">{stars === 5 ? '8' : stars === 4 ? '3' : '1'}</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* Review List */}
             {shopReviews.length === 0 ? (
                <div className="bg-[#111] border border-[#222] rounded-[14px] p-8 flex flex-col items-center text-center">
                   <div className="text-[32px] mb-2">⭐</div>
                   <div className="text-white font-bold text-[14px]">No reviews yet</div>
                   <p className="text-[#888] text-[12px] mt-1">Be the first to leave a review after your purchase!</p>
                </div>
             ) : (
                shopReviews.map((r, i) => (
                   <div key={i} className="bg-[#111] border border-[#222] rounded-[12px] p-4">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[18px]">👤</div>
                            <div className="text-white font-bold text-[13px]">{r.userName}</div>
                         </div>
                         <div className="flex text-[#FF2D78] gap-0.5">
                            {[...Array(r.rating)].map((_, i) => <Star key={i} size={11} fill="currentColor" />) as any}
                         </div>
                      </div>
                      <p className="text-[#888] text-[13px] mt-3 leading-relaxed">{r.text}</p>
                      <div className="text-[#555] text-[10px] mt-2.5">{new Date(r.timestamp).toLocaleDateString()}</div>
                   </div>
                ))
             )}
          </div>
        )}
      </div>
      
      <ShareSheet 
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        shop={shop}
        onTrackShare={trackShareEvent}
      />
    </div>
  );
};
