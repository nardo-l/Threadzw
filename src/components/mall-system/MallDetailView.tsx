import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Share2, 
  Users, 
  MapPin, 
  Search, 
  Star, 
  Plus, 
  MoreVertical,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';

export const MallDetailView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleFollow, following } = useInventory();
  
  const [mall, setMall] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shops' | 'about' | 'activity'>('shops');

  useEffect(() => {
    const fetchMallData = async () => {
      setLoading(true);
      try {
        // Fetch Mall
        const { data: mallData } = await supabase
          .from('malls')
          .select('*')
          .eq('id', id)
          .single();
        
        if (mallData) setMall(mallData);

        // Fetch Shops in Mall
        const { data: mallShops } = await supabase
          .from('mall_shops')
          .select('*, shop:shops(*)')
          .eq('mall_id', id);
        
        if (mallShops) setShops(mallShops.map(ms => ms.shop));
      } catch (err) {
        console.error('Error fetching mall details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMallData();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-full border-4 border-[#C6FF00] border-t-transparent animate-spin" /></div>;
  if (!mall) return <div className="p-10 text-center">Mall not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8F8] pb-32">
      {/* Header / Banner */}
      <div className="h-[240px] relative">
        <div 
          onClick={() => navigate('/malls')}
          className="absolute top-12 left-5 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform"
        >
          <ChevronLeft size={24} />
        </div>
        
        <div className="absolute top-12 right-5 z-20 flex gap-2">
          <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white">
            <Share2 size={20} />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white">
            <MoreVertical size={20} />
          </button>
        </div>

        {mall.banner_url ? (
          <img src={mall.banner_url} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#111] to-[#333]" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-6 left-5 right-5 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-white p-1 shadow-2xl overflow-hidden">
               {mall.logo_url ? (
                 <img src={mall.logo_url} className="w-full h-full object-cover rounded-2xl" />
               ) : (
                 <div className="w-full h-full bg-[#111] flex items-center justify-center text-3xl font-black text-[#C6FF00]">
                   {mall.name[0]}
                 </div>
               )}
            </div>
            <div className="mb-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h1 className="text-white font-bold text-[24px] font-syne">{mall.name}</h1>
                {mall.is_verified && <CheckCircle2 size={18} className="text-[#3B82FB] fill-[#3B82FB] text-white" />}
              </div>
              <div className="flex items-center gap-3 text-white/70 text-[13px] font-medium">
                <span className="flex items-center gap-1"><MapPin size={12} /> {mall.town}</span>
                <span className="flex items-center gap-1"><Users size={12} /> {shops.length} Shops</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-6 mb-4 flex border-b border-[#EFEFEF]">
        {['Shops', 'About', 'Activity'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase() as any)}
            className={`
              px-5 py-3 text-[14px] font-bold transition-all relative
              ${activeTab === tab.toLowerCase() ? 'text-[#111]' : 'text-[#888]'}
            `}
          >
            {tab}
            {activeTab === tab.toLowerCase() && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#111]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-5">
        {activeTab === 'shops' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-[#111] font-bold text-[18px]">Collections ({shops.length})</h2>
               <div className="flex items-center gap-2">
                 <button className="w-10 h-10 rounded-full bg-white border border-[#EFEFEF] flex items-center justify-center">
                    <Search size={18} className="text-[#888]" />
                 </button>
               </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               {shops.map(shop => (
                 <ShopRow key={shop.id} shop={shop} />
               ))}
               
               {/* Suggest shop call to action */}
               <div className="bg-white border-2 border-dashed border-[#EFEFEF] rounded-3xl p-6 flex flex-col items-center text-center">
                 <Plus size={32} className="text-[#EFEFEF] mb-3" />
                 <h4 className="text-[#111] font-bold">Have a shop here?</h4>
                 <p className="text-[#888] text-[13px] mt-1 mb-4">Apply to join {mall.name} and boost your visibility.</p>
                 <button className="px-6 py-2 bg-[#F8F8F8] text-[#111] rounded-full font-bold text-[12px]">Request Invite</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#EFEFEF]">
            <h3 className="text-[#111] font-bold text-lg mb-3">About the Mall</h3>
            <p className="text-[#888] text-[15px] leading-relaxed mb-6">
              {mall.description || 'Welcome to our fashion collective. We prioritize style, quality and community above all else.'}
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-[#F8F8F8] flex items-center justify-center text-[#111]">
                    <Users size={18} />
                 </div>
                 <div>
                    <p className="text-[#111] font-bold text-sm">Founded</p>
                    <p className="text-[#888] text-[12px]">Joined ThreadZW {new Date(mall.created_at).toLocaleDateString()}</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ShopRow = ({ shop }: { shop: any }) => {
  const navigate = useNavigate();
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/shop/${shop.id}`)}
      className="bg-white rounded-3xl p-4 flex items-center gap-4 border border-[#EFEFEF] shadow-sm active:shadow-md transition-all"
    >
      <div className="w-14 h-14 rounded-2xl bg-[#F8F8F8] overflow-hidden shrink-0">
        {shop.logo_url ? (
          <img src={shop.logo_url} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
        )}
      </div>
      
      <div className="flex-1">
        <h4 className="text-[#111] font-bold text-[16px] leading-tight mb-0.5">{shop.name}</h4>
        <p className="text-[#888] text-[12px] font-medium uppercase tracking-tight">{shop.categories?.[0] || 'Fashion'}</p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1 text-[#F59E0B]">
          <Star size={12} fill="currentColor" />
          <span className="text-[12px] font-black">{shop.rating || 'New'}</span>
        </div>
        <ArrowRight size={16} className="text-[#CCC]" />
      </div>
    </motion.div>
  );
};
