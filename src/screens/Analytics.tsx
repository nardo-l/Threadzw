import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Package, BarChart3, Settings as SettingsIcon, TrendingUp, Users, ShoppingBag, Eye } from 'lucide-react';

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-page-bg text-white pb-32">
       <div className="px-5 pt-8">
          <h1 className="text-2xl font-black italic tracking-tighter mb-8">Performance</h1>
          <div className="grid grid-cols-2 gap-3">
             <StatCard label="Total Revenue" value="$0" icon={<TrendingUp size={16} />} color="text-neon" />
             <StatCard label="Total Orders" value="0" icon={<ShoppingBag size={16} />} color="text-warm" />
             <StatCard label="Shop Views" value="0" icon={<Eye size={16} />} color="text-sky-400" />
             <StatCard label="Customers" value="0" icon={<Users size={16} />} color="text-pink-400" />
          </div>
          
          <div className="mt-10 bg-card-bg border border-border rounded-3xl p-6 text-center">
             <div className="w-16 h-16 rounded-full bg-ele-bg mx-auto flex items-center justify-center text-2xl mb-4">📊</div>
             <h3 className="font-bold text-lg mb-2">No data yet</h3>
             <p className="text-secondary-text text-sm">Once you start selling, you'll see your growth charts here.</p>
          </div>
       </div>

      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-page-bg border-t border-ele-bg z-50 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex items-center pb-safe">
        <div className="flex items-center justify-around w-full min-w-max px-4 gap-2">
          <NavTab icon={<Home size={22} />} label="Dashboard" onClick={() => navigate('/dashboard')} />
          <NavTab icon={<Package size={22} />} label="Products" onClick={() => navigate('/inventory')} />
          <NavTab icon={<BarChart3 size={22} />} label="Analytics" active />
          <NavTab icon={<SettingsIcon size={22} />} label="Settings" onClick={() => navigate('/settings')} />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-card-bg border border-border rounded-2xl p-5">
    <div className={`w-8 h-8 rounded-full bg-ele-bg flex items-center justify-center mb-3 ${color}`}>{icon}</div>
    <div className="text-2xl font-black">{value}</div>
    <div className="text-secondary-text text-[10px] font-black tracking-widest mt-1 uppercase">{label}</div>
  </div>
);

const NavTab = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${active ? 'text-neon' : 'text-secondary-text hover:text-white'}`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);
