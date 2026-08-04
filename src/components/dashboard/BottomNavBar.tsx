import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Plus, User } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  const getActiveTab = () => {
    if (pathname === '/' || pathname.replace(/\/$/, '') === '/dashboard') return 'home';
    if (pathname.startsWith('/inventory') || pathname.startsWith('/products')) return 'products';
    if (pathname.startsWith('/add-product')) return 'add-product';
    if (pathname.startsWith('/edit-shop') || pathname.startsWith('/account') || pathname.startsWith('/edit-profile')) return 'account';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[420px] z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-2 px-3 flex items-center justify-between border border-zinc-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
        
        {/* 1. Home */}
        <button
          onClick={() => navigate('/dashboard')}
          id="nav-tab-home"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 cursor-pointer transition-all active:scale-95 group"
        >
          <Home className={`w-5 h-5 transition-colors ${activeTab === 'home' ? 'text-black' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
          <span className={`text-[10px] tracking-tight font-semibold ${activeTab === 'home' ? 'text-black font-bold' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
            Home
          </span>
          {activeTab === 'home' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF00] -mt-0.5" />
          )}
        </button>

        {/* 2. Products */}
        <button
          onClick={() => navigate('/inventory')}
          id="nav-tab-products"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 cursor-pointer transition-all active:scale-95 group"
        >
          <Package className={`w-5 h-5 transition-colors ${activeTab === 'products' ? 'text-black' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
          <span className={`text-[10px] tracking-tight font-semibold ${activeTab === 'products' ? 'text-black font-bold' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
            Products
          </span>
          {activeTab === 'products' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF00] -mt-0.5" />
          )}
        </button>

        {/* 3. Center + Button (Add Product) */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => navigate('/add-product')}
            id="nav-tab-add"
            aria-label="Add Product"
            className="w-11 h-11 rounded-2xl bg-[#C6FF00] hover:bg-[#b5eb00] text-black flex items-center justify-center shadow-md shadow-[#C6FF00]/40 transition-all active:scale-95 cursor-pointer hover:scale-105"
          >
            <Plus className="w-6 h-6 text-black stroke-[3]" />
          </button>
        </div>

        {/* 4. Account */}
        <button
          onClick={() => navigate('/edit-shop')}
          id="nav-tab-account"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 cursor-pointer transition-all active:scale-95 group"
        >
          <User className={`w-5 h-5 transition-colors ${activeTab === 'account' ? 'text-black' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
          <span className={`text-[10px] tracking-tight font-semibold ${activeTab === 'account' ? 'text-black font-bold' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
            Account
          </span>
          {activeTab === 'account' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF00] -mt-0.5" />
          )}
        </button>

      </div>
    </div>
  );
};


