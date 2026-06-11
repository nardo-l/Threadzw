import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, BarChart3, Settings } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const getActiveTab = () => {
    if (pathname === '/' || pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/sales') || pathname.startsWith('/orders')) return 'orders';
    if (pathname.startsWith('/inventory') || pathname.startsWith('/products') || pathname.startsWith('/add-product') || pathname.startsWith('/edit-product')) return 'products';
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/settings') || pathname.startsWith('/edit-shop')) return 'settings';
    return '';
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
    { id: 'orders', label: 'Orders', path: '/sales', icon: <ShoppingBag size={20} /> },
    { id: 'products', label: 'Products', path: '/inventory', icon: <Package size={20} /> },
    { id: 'analytics', label: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
    { id: 'settings', label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0E0E12]/95 backdrop-blur-md border-t border-white/[0.04] z-50 flex items-center pb-safe">
      <div className="flex items-center justify-around w-full max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all ${
                isActive 
                  ? 'text-[#c8ff00] transform scale-105' 
                  : 'text-[#A1A1AA] hover:text-white active:scale-95'
              }`}
              id={`nav-tab-${item.id}`}
            >
              <div className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(200,255,0,0.4)]' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-extrabold uppercase tracking-widest transition-all ${isActive ? 'text-[#c8ff00]' : 'text-zinc-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
