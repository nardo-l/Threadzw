import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Plus, Filter, 
  MoreVertical, Image as ImageIcon,
  Home, Package, BarChart3, Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Product } from '../types';

export const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();

      if (shop) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shop.id)
          .order('created_at', { ascending: false });
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-page-bg text-white pb-32">
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black italic tracking-tighter">Inventory</h1>
          <button onClick={() => navigate('/add-product')} className="w-10 h-10 rounded-full bg-neon text-neon-text flex items-center justify-center">
            <Plus size={20} className="stroke-[3]" />
          </button>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text">
            <Search size={18} />
          </div>
          <input 
            placeholder="Search your products..."
            className="w-full h-12 bg-card-bg border border-border rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:border-neon transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {['All Products', 'Published', 'Drafts'].map((tab, i) => (
          <button key={`inventory-tab-${i}`} className={`flex-1 py-3 text-[13px] font-bold text-center border-b-2 transition-all ${i === 0 ? 'text-neon border-neon' : 'text-secondary-text border-transparent'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-5 space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-neon border-t-transparent animate-spin rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-secondary-text text-sm">No products found</p>
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-card-bg border border-border rounded-xl p-3.5 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-lg bg-ele-bg overflow-hidden flex-shrink-0">
                {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-800"><ImageIcon size={20} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{p.name}</h4>
                <div className="text-neon font-bold text-sm mt-0.5">${p.price}</div>
                <div className="text-secondary-text text-[11px] mt-1">{p.total_stock} Units</div>
              </div>
              <button className="p-2 text-secondary-text">
                <MoreVertical size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-page-bg border-t border-ele-bg z-50 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex items-center pb-safe">
        <div className="flex items-center justify-around w-full min-w-max px-4 gap-2">
          <NavTab icon={<Home size={22} />} label="Dashboard" onClick={() => navigate('/dashboard')} />
          <NavTab icon={<Package size={22} />} label="Products" active />
          <NavTab icon={<BarChart3 size={22} />} label="Analytics" onClick={() => navigate('/analytics')} />
          <NavTab icon={<Settings size={22} />} label="Settings" onClick={() => navigate('/settings')} />
        </div>
      </div>
    </div>
  );
};

const NavTab = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${active ? 'text-neon' : 'text-secondary-text hover:text-white'}`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);
