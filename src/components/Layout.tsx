import React, { useRef, memo } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  BarChart3, 
  Settings,
  User,
  Bell,
  Menu,
  X,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/inventory', icon: <Package size={20} />, label: 'Products' },
    { to: '/edit-shop', icon: <Store size={20} />, label: 'Store' },
    { to: '/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#0B0B0B] text-white font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[260px] flex-col sticky top-0 h-screen border-r border-white/5 bg-[#0B0B0B] p-6">
        <div 
          onClick={() => navigate('/')}
          className="mb-12 cursor-pointer flex items-center gap-2 group"
        >
          <img 
            src="https://4htrv9mv32e5k648.public.blob.vercel-storage.com/file_000000009c74724684851106c3e2946c.png" 
            alt="ThreadZW Logo" 
            referrerPolicy="no-referrer"
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
          />
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <SidebarNavItem 
              key={item.to} 
              to={item.to} 
              icon={item.icon} 
              label={item.label} 
              isActive={location.pathname === item.to}
            />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          {profile?.has_shop && (
            <button 
              onClick={() => window.open(`/shop/@${profile.handle}`, '_blank')}
              className="w-full h-12 bg-[#151515] border border-white/5 rounded-xl flex items-center justify-between px-4 text-[12px] font-black uppercase tracking-widest hover:bg-white/5 transition-all group"
            >
              <span>Public Store</span>
              <ArrowUpRight size={14} className="text-[#D7FF00] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}
          
          <button 
            onClick={() => navigate('/add-product')}
            className="w-full h-14 bg-[#D7FF00] text-black rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[13px] italic shadow-xl shadow-[#D7FF00]/10 hover:shadow-[#D7FF00]/20 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Add Product
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 h-20 sticky top-0 z-[60] bg-[#0B0B0B]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="https://4htrv9mv32e5k648.public.blob.vercel-storage.com/file_000000009c74724684851106c3e2946c.png" 
              alt="ThreadZW Logo" 
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain" 
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-zinc-400">
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto p-6 md:p-10">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[1000] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-[80%] max-w-[300px] h-full bg-[#0B0B0B] border-l border-white/5 p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Menu</h2>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-2">
                 {navItems.map((item) => (
                  <button
                    key={item.to}
                    onClick={() => {
                      navigate(item.to);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[14px] font-black uppercase tracking-widest italic ${location.pathname === item.to ? 'bg-[#D7FF00] text-black' : 'text-zinc-500 hover:bg-white/5'}`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-auto space-y-4">
                <button 
                  onClick={() => signOut()}
                  className="w-full h-14 border border-white/5 rounded-2xl text-zinc-500 font-black uppercase tracking-widest text-[11px] italic"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarNavItem = ({ to, icon, label, isActive }: any) => (
  <NavLink
    to={to}
    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-[14px] font-black uppercase tracking-widest italic transition-all ${isActive ? 'bg-[#D7FF00] text-black shadow-lg shadow-[#D7FF00]/10' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);
