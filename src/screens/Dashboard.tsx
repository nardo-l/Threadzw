import React, { useState } from 'react';
import { TrendingUp, ShoppingBag, Eye, AlertCircle, Plus, Edit2, X, Minus, Check, Clock, DollarSign, Tag, Heart, Bookmark, Ship, Calendar, Navigation, MessageCircle, ChevronRight, ChevronLeft, Layout, BarChart3, Users, Package, Globe, Smartphone, Zap, ArrowRight, Radio } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { ScreenError } from '../components/ui/ScreenError';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userData, shopLaunched } = useInventory();
  const { stats, analytics, weeklyData, salesOverTime, topProducts, products, loading, error, refetch, recordSale, addProduct } = useDashboard();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditShopModalOpen, setIsEditShopModalOpen] = useState(false);
  const [sellingProduct, setSellingProduct] = useState<any | null>(null);

  const getStockInfo = (variants: any[]) => {
    const total = variants?.reduce((acc, v) => acc + v.quantity, 0) || 0;
    if (total >= 10) return { color: 'text-green-500', bg: 'bg-green-500', label: 'In Stock' };
    if (total >= 3) return { color: 'text-amber-500', bg: 'bg-amber-500', label: `${total} Left` };
    if (total >= 1) return { color: 'text-red-500', bg: 'bg-red-500', label: 'Low Stock' };
    return { color: 'text-muted', bg: 'bg-muted', label: 'Sold Out' };
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 p-6">
        <div className="h-16 w-full bg-card rounded-lg shimmer-bg" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-card shimmer-bg" />)}
        </div>
        <div className="h-64 w-full bg-card rounded-card shimmer-bg" />
      </div>
    );
  }

  if (error) {
    return (
      <ScreenError 
        icon={<Radio size={32} />}
        heading="Dashboard Error"
        body={error}
        onRetry={refetch}
      />
    );
  }

  if (!userData.hasShop && !shopLaunched) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center gap-8">
        <div className="w-24 h-24 rounded-3xl bg-card border border-white/5 flex items-center justify-center text-5xl shadow-2xl">
          🏪
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-syne font-bold text-white">Your shop lives here</h1>
          <p className="text-sm text-muted max-w-[280px] mx-auto leading-relaxed">
            Track sales, manage stock, and grow your business — all from here
          </p>
        </div>
        <button 
          onClick={() => navigate('/seller-onboarding')}
          className="w-full bg-primary text-white font-bold py-4 rounded-pill shadow-lg shadow-primary/30 mt-4"
        >
          Create Your Store
        </button>
      </div>
    );
  }

  const isShopEmpty = products.length === 0;

  return (
    <div className="flex flex-col gap-8 p-6">
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-pacifico text-white">{userData.shopName || 'My Shop'}</h1>
            {userData.shopIsVerified && (
              <div className="bg-blue-500 rounded-full p-0.5 mt-1">
                <Check size={10} className="text-white stroke-[4]" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${userData.isShopLive ? 'bg-green-500 animate-pulse' : 'bg-muted'} rounded-full`} />
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
              {userData.isShopLive ? 'Shop Live' : 'Offline'}
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="p-3 rounded-full bg-card text-primary"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat: any) => (
          <div key={stat.label} className="bg-card rounded-card p-4 flex flex-col gap-2 border border-white/5">
            <div className={`p-1.5 rounded-lg bg-black w-fit ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted uppercase">{stat.label}</p>
              <p className={`text-lg font-syne font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <section className="flex flex-col gap-6">
        {/* 1. Weekly Revenue - Bar Chart */}
        <div className="bg-card rounded-card p-6 border border-white/5 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-syne font-bold text-white">Weekly Revenue</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-syne font-bold text-secondary">${stats[0]?.value.replace('$', '')}</span>
                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-bold rounded-pill">+12%</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[8px] font-mono uppercase tracking-widest">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-white">This Week</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 border border-dashed border-muted rounded-full" />
                <span className="text-muted">Last Week</span>
              </div>
            </div>
          </div>
          <div className="h-40 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
              {/* Last Week Dashed Line */}
              <path 
                d="M 0 80 Q 50 60 100 90 T 200 50 T 300 70" 
                fill="none" 
                stroke="#888888" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
                className="opacity-30"
              />
              {/* Bars */}
              {weeklyData.map((d: any, i: number) => {
                const barWidth = 30;
                const gap = (300 - (barWidth * 7)) / 6;
                const x = i * (barWidth + gap);
                const height = (d.value / 1000) * 100;
                const y = 100 - height;
                return (
                  <g key={i} className="group cursor-pointer">
                    <motion.rect
                      initial={{ height: 0, y: 100 }}
                      animate={{ height, y }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      x={x}
                      width={barWidth}
                      rx="4"
                      className={`${i === 5 ? 'fill-primary' : 'fill-primary/30'} hover:fill-primary transition-colors`}
                    />
                    {i === 5 && (
                      <rect x={x} y={y} width={barWidth} height={height} className="fill-primary blur-md opacity-30" />
                    )}
                    <text x={x + barWidth/2} y="115" textAnchor="middle" className="fill-muted text-[8px] font-mono">{d.day}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 2. Sales Over Time - Line Chart */}
        <div className="bg-card rounded-card p-6 border border-white/5 flex flex-col gap-6">
          <h3 className="font-syne font-bold text-white">Sales Over Time</h3>
          <div className="h-40 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f72585" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f72585" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area */}
              <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                d={`M 0 100 ${salesOverTime.map((d: any, i: number) => `L ${(i / (salesOverTime.length - 1)) * 300} ${100 - (d.sales / 35) * 80}`).join(' ')} L 300 100 Z`}
                fill="url(#lineGradient)"
              />
              {/* Line */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d={`M 0 ${100 - (salesOverTime[0]?.sales / 35) * 80 || 100} ${salesOverTime.map((d: any, i: number) => `L ${(i / (salesOverTime.length - 1)) * 300} ${100 - (d.sales / 35) * 80}`).join(' ')}`}
                fill="none"
                stroke="#f72585"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dots */}
              {salesOverTime.map((d: any, i: number) => (
                <circle 
                  key={i}
                  cx={(i / (salesOverTime.length - 1)) * 300}
                  cy={100 - (d.sales / 35) * 80}
                  r="3"
                  className="fill-primary stroke-background stroke-2 cursor-pointer hover:r-4 transition-all"
                />
              ))}
            </svg>
            <div className="flex justify-between mt-2">
              <span className="text-[8px] font-mono text-muted">1 Mar</span>
              <span className="text-[8px] font-mono text-muted">30 Mar</span>
            </div>
          </div>
        </div>

        {/* 3. In-store vs Online - Donut Chart */}
        <div className="bg-card rounded-card p-6 border border-white/5 flex flex-col gap-6">
          <h3 className="font-syne font-bold text-white">In-store vs Online</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a1a" strokeWidth="12" />
                <motion.circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#f72585" 
                  strokeWidth="12" 
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 * (1 - analytics.onlinePercent / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
                <motion.circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#7209b7" 
                  strokeWidth="12" 
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 * (1 - (100 - analytics.onlinePercent) / 100) }}
                  style={{ rotate: `${(analytics.onlinePercent / 100) * 360}deg`, transformOrigin: 'center' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-syne font-bold text-white">{stats[1]?.value || 0}</span>
                <span className="text-[8px] font-mono text-muted uppercase">Orders</span>
              </div>
            </div>
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-xs text-white">Online</span>
                </div>
                <span className="text-xs font-mono text-muted">{analytics.onlinePercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span className="text-xs text-white">In-store</span>
                </div>
                <span className="text-xs font-mono text-muted">{100 - analytics.onlinePercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Top Products - Horizontal Bar Chart */}
        <div className="bg-card rounded-card p-6 border border-white/5 flex flex-col gap-6">
          <h3 className="font-syne font-bold text-white">Top Products</h3>
          <div className="flex flex-col gap-4">
            {topProducts.map((p: any, i: number) => (
              <div key={p.name} className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                  <span className="text-white">{p.name}</span>
                  <span className="text-muted">{p.units} units</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.units / 50) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className={`h-full rounded-full ${i === 0 ? 'bg-primary' : 'bg-primary/40'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Views Over Time - Line Chart (Blue) */}
        <div className="bg-card rounded-card p-6 border border-white/5 flex flex-col gap-6">
          <h3 className="font-syne font-bold text-white">Views Over Time</h3>
          <div className="h-40 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                d={`M 0 100 ${salesOverTime.map((d: any, i: number) => `L ${(i / (salesOverTime.length - 1)) * 300} ${100 - (d.sales * 1.5 / 50) * 80}`).join(' ')} L 300 100 Z`}
                fill="url(#blueGradient)"
              />
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d={`M 0 ${100 - (salesOverTime[0]?.sales * 1.5 / 50) * 80 || 100} ${salesOverTime.map((d: any, i: number) => `L ${(i / (salesOverTime.length - 1)) * 300} ${100 - (d.sales * 1.5 / 50) * 80}`).join(' ')}`}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex justify-between mt-2">
              <span className="text-[8px] font-mono text-muted">1 Mar</span>
              <span className="text-[8px] font-mono text-muted">30 Mar</span>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Row */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-card p-4 border border-white/5 flex flex-col gap-1">
          <span className="text-[8px] font-mono text-muted uppercase">Avg. Discount</span>
          <p className="text-sm font-syne font-bold text-amber-500">-${analytics.avgDiscount}</p>
        </div>
        <div className="bg-card rounded-card p-4 border border-white/5 flex flex-col gap-1">
          <span className="text-[8px] font-mono text-muted uppercase">Best Size</span>
          <p className="text-sm font-syne font-bold text-primary">{analytics.bestSize}</p>
        </div>
        <div className="bg-card rounded-card p-4 border border-white/5 flex flex-col gap-1">
          <span className="text-[8px] font-mono text-muted uppercase">Online %</span>
          <p className="text-sm font-syne font-bold text-blue-400">{analytics.onlinePercent}%</p>
        </div>
      </section>

      {/* Smart Signals */}
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-syne font-bold px-2">Smart Signals</h3>
        <div className="flex flex-col gap-3">
          {isShopEmpty && (
            <div className="bg-primary/10 border border-primary/20 rounded-card p-5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl text-primary">
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white">Your first sale is coming</h4>
                  <p className="text-xs text-muted">Add your first product to start appearing in the feed</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Your First Product
              </button>
            </div>
          )}
          {!isShopEmpty && analytics.highInterestProducts.map((p: any) => (
            <div key={p.id} className="bg-primary/10 border border-primary/20 rounded-card p-4 flex items-center gap-4">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Tag size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-primary leading-tight">
                  <span className="font-bold">High Interest</span> — {p.name} has {p.saves} saves but few sales. Consider adjusting price.
                </p>
              </div>
            </div>
          ))}
          {!isShopEmpty && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-card p-4 flex items-center gap-4">
              <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                <TrendingUp size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-green-400/90 leading-tight">
                  <span className="font-bold">47 people</span> searched Air Force 1 Size 10 — no listings found
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* My Products */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-syne font-bold">My Products</h3>
          <button className="text-xs font-mono text-primary">View All</button>
        </div>
        
        {isShopEmpty ? (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full h-48 rounded-card border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-3 group hover:border-primary/40 transition-all"
          >
            <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Plus size={32} />
            </div>
            <p className="text-sm font-bold text-muted">List your first product</p>
          </button>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
            {products.map((product: any) => {
              const stock = getStockInfo(product.variants);
              return (
                <div key={product.id} className="bg-card rounded-card overflow-hidden border border-white/5 w-56 flex-shrink-0 relative group">
                  <div className="h-32 bg-black flex items-center justify-center text-4xl relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0] || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      '📦'
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-pill">
                      <div className={`w-1.5 h-1.5 rounded-full ${stock.bg}`} />
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-wider ${stock.color}`}>{stock.label}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit-product/${product.id}`);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    <div>
                      <h4 className="text-xs font-bold truncate">{product.name}</h4>
                      <p className="text-[10px] font-mono text-primary mt-0.5">${product.price}</p>
                    </div>
                    <button 
                      onClick={() => setSellingProduct(product)}
                      className="w-full py-2 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary hover:bg-primary hover:text-white transition-all uppercase tracking-widest"
                    >
                      Mark as Sold
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!isShopEmpty && (
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-white font-bold py-4 rounded-pill flex items-center justify-center gap-2 shadow-lg shadow-primary/30 mt-4"
        >
          <Plus size={20} /> Add New Product
        </button>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddProductModal 
            onClose={() => setIsAddModalOpen(false)} 
            onAdd={addProduct} 
            userData={userData}
          />
        )}
        {isEditShopModalOpen && (
          <EditShopModal onClose={() => setIsEditShopModalOpen(false)} />
        )}
        {sellingProduct && (
          <MarkAsSoldModal 
            product={sellingProduct} 
            onClose={() => setSellingProduct(null)} 
            onConfirm={(sale) => {
              recordSale(sale);
              setSellingProduct(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const EditShopModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { userData, updateUserData } = useInventory();
  const [area, setArea] = useState(userData.shopArea || 'Harare CBD');
  const [landmark, setLandmark] = useState(userData.shopLandmark || '');
  const [directions, setDirections] = useState(userData.shopDirections || '');
  const [whatsapp, setWhatsapp] = useState(userData.shopWhatsApp || '');
  const [isOnlineOnly, setIsOnlineOnly] = useState(userData.shopIsOnlineOnly || false);
  const [deliveryInfo, setDeliveryInfo] = useState(userData.shopDeliveryInfo || '');
  const [tradingHours, setTradingHours] = useState<Record<string, any>>(userData.shopTradingHours || {
    'Mon': { open: '08:00', close: '18:00', active: true },
    'Tue': { open: '08:00', close: '18:00', active: true },
    'Wed': { open: '08:00', close: '18:00', active: true },
    'Thu': { open: '08:00', close: '18:00', active: true },
    'Fri': { open: '08:00', close: '18:00', active: true },
    'Sat': { open: '08:00', close: '16:00', active: true },
    'Sun': { open: '09:00', close: '13:00', active: false },
  });

  const areas = ['Harare CBD', 'Eastlea', 'Borrowdale', 'Avondale', 'Bulawayo', 'Mutare', 'Chitungwiza', 'Other'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserData({
      shopArea: area,
      shopLandmark: landmark,
      shopDirections: directions,
      shopWhatsApp: whatsapp,
      shopIsOnlineOnly: isOnlineOnly,
      shopDeliveryInfo: deliveryInfo,
      shopTradingHours: tradingHours
    });
    toast.success('Shop details updated!');
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-background w-full max-w-[430px] rounded-t-[32px] p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-pacifico text-white">Edit Shop</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-card text-muted"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="bg-card rounded-xl p-4 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Ship size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Online Only</p>
                <p className="text-[10px] font-mono text-muted uppercase">No physical storefront</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsOnlineOnly(!isOnlineOnly)}
              className={`w-12 h-6 rounded-full transition-all relative ${isOnlineOnly ? 'bg-primary' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isOnlineOnly ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {isOnlineOnly ? (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Delivery Info</label>
              <textarea 
                value={deliveryInfo} 
                onChange={e => setDeliveryInfo(e.target.value)} 
                className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary h-24 resize-none" 
                placeholder="e.g. We ship nationwide via Swift. Same day delivery in Harare." 
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Area</label>
                  <select 
                    value={area} 
                    onChange={e => setArea(e.target.value)} 
                    className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    {areas.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-muted uppercase tracking-widest">WhatsApp Number</label>
                  <input 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                    className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="2637..." 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Landmark (Short Summary)</label>
                <input 
                  value={landmark} 
                  onChange={e => setLandmark(e.target.value)} 
                  className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="e.g. Eastlea Shopping Centre, Shop 14" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Directions (How to get there)</label>
                <textarea 
                  value={directions} 
                  onChange={e => setDirections(e.target.value)} 
                  className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary h-32 resize-none" 
                  placeholder="e.g. From Eastlea roundabout head south on Simon Mazorodze..." 
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-primary" />
                  <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Trading Hours</label>
                </div>
                <div className="flex flex-col gap-3">
                  {days.map(day => (
                    <div key={day} className="flex items-center gap-4">
                      <button 
                        type="button"
                        onClick={() => setTradingHours(prev => ({ ...prev, [day]: { ...prev[day], active: !prev[day].active } }))}
                        className={`w-10 py-2 rounded-lg text-[10px] font-bold transition-all ${tradingHours[day].active ? 'bg-primary text-white' : 'bg-card text-muted'}`}
                      >
                        {day}
                      </button>
                      {tradingHours[day].active ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="time" 
                            value={tradingHours[day].open} 
                            onChange={e => setTradingHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                            className="flex-1 bg-card border-none rounded-lg p-2 text-[10px] text-white outline-none" 
                          />
                          <span className="text-muted text-[10px]">to</span>
                          <input 
                            type="time" 
                            value={tradingHours[day].close} 
                            onChange={e => setTradingHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                            className="flex-1 bg-card border-none rounded-lg p-2 text-[10px] text-white outline-none" 
                          />
                        </div>
                      ) : (
                        <span className="flex-1 text-[10px] font-mono text-muted italic">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="w-full bg-primary text-white font-bold py-4 rounded-pill shadow-lg shadow-primary/30 mt-4"
          >
            Save Shop Details
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AddProductModal: React.FC<{ onClose: () => void, onAdd: (p: any) => void, userData: any }> = ({ onClose, onAdd, userData }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sneakers');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState<{ size: string; quantity: number }[]>([{ size: '', quantity: 0 }]);
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null, null]);

  const totalStock = variants.reduce((acc, v) => acc + v.quantity, 0);
  const isFormValid = name && category && price && images.every(img => img !== null);

  const imageLabels = [
    'Main Photo (Cover)',
    'Back',
    'Side',
    'Detail',
    'On Foot',
    'Size Tag'
  ];

  const handleImageUpload = (index: number) => {
    const newImages = [...images];
    newImages[index] = category === 'Sneakers' ? '👟' : '👕';
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const productData = {
      name,
      category,
      price: Number(price),
      description,
      images: images.filter((img): img is string => img !== null),
      sizes: variants.filter(v => v.size !== '').map(v => ({ size: v.size, quantity: v.quantity })),
      is_published: true
    };
    onAdd(productData);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-background w-full max-w-[430px] rounded-t-[32px] p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-pacifico text-white">Add Product</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-card text-muted"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Product Photos (Exactly 6)</label>
            <div className="grid grid-cols-3 gap-3">
              {imageLabels.map((label, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <div 
                    onClick={() => !images[index] && handleImageUpload(index)}
                    className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center relative transition-all cursor-pointer ${
                      images[index] ? 'border-primary bg-card' : 'border-primary/30 bg-primary/5 hover:border-primary/60'
                    }`}
                  >
                    {images[index] ? (
                      <>
                        <span className="text-3xl">{images[index]}</span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <Plus size={20} className="text-primary/40" />
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-muted text-center uppercase truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Product Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Jordan 4 Black Cat" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary appearance-none">
                <option>Sneakers</option>
                <option>Clothing</option>
                <option>Accessories</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Price (USD)</label>
              <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary" placeholder="120" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary h-24 resize-none" placeholder="Tell buyers about the drip..." />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Stock & Variants</label>
              <span className="text-[10px] font-mono text-primary">Total: {totalStock} units</span>
            </div>
            {variants.map((v, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input 
                  placeholder="Size (e.g. UK 9)" 
                  value={v.size} 
                  onChange={e => {
                    const newV = [...variants];
                    newV[i].size = e.target.value;
                    setVariants(newV);
                  }}
                  className="flex-1 bg-card border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-primary" 
                />
                <div className="flex items-center bg-card rounded-xl px-2">
                  <button type="button" onClick={() => {
                    const newV = [...variants];
                    newV[i].quantity = Math.max(0, newV[i].quantity - 1);
                    setVariants(newV);
                  }} className="p-2 text-muted"><Minus size={14} /></button>
                  <span className="w-8 text-center text-sm font-mono">{v.quantity}</span>
                  <button type="button" onClick={() => {
                    const newV = [...variants];
                    newV[i].quantity += 1;
                    setVariants(newV);
                  }} className="p-2 text-primary"><Plus size={14} /></button>
                </div>
                {i === variants.length - 1 ? (
                  <button type="button" onClick={() => setVariants([...variants, { size: '', quantity: 0 }])} className="p-3 rounded-xl bg-primary/10 text-primary"><Plus size={16} /></button>
                ) : (
                  <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="p-3 rounded-xl bg-red-500/10 text-red-500"><X size={16} /></button>
                )}
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={!isFormValid}
            className={`font-bold py-4 rounded-pill shadow-lg transition-all mt-4 ${
              isFormValid ? 'bg-primary text-white shadow-primary/30' : 'bg-muted text-white/50 cursor-not-allowed'
            }`}
          >
            {isFormValid ? 'List Product' : 'Add all 6 photos to continue'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const MarkAsSoldModal: React.FC<{ product: any, onClose: () => void, onConfirm: (sale: any) => void }> = ({ product, onClose, onConfirm }) => {
  const [selectedSize, setSelectedSize] = useState(product.variants.find(v => v.quantity > 0)?.size || '');
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(product.price.toString());
  const [saleType, setSaleType] = useState<'online' | 'in-store'>('in-store');

  const maxQty = product.variants.find(v => v.size === selectedSize)?.quantity || 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-background w-full max-w-[430px] rounded-t-[32px] p-8 flex flex-col gap-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center text-4xl border border-white/5">
            {product.imageEmoji}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{product.name}</h2>
            <p className="text-xs text-muted font-mono uppercase tracking-widest">Mark as Sold</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-card text-muted"><X size={20} /></button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Select Variant</label>
            <div className="flex flex-wrap gap-2">
              {product.variants.map(v => (
                <button
                  key={v.size}
                  disabled={v.quantity === 0}
                  onClick={() => {
                    setSelectedSize(v.size);
                    setQuantity(1);
                  }}
                  className={`px-4 py-2 rounded-pill text-xs font-mono transition-all border ${
                    selectedSize === v.size ? 'bg-primary border-primary text-white' : 'bg-card border-white/5 text-muted'
                  } ${v.quantity === 0 ? 'opacity-30 grayscale' : ''}`}
                >
                  {v.size} ({v.quantity})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Quantity</label>
              <div className="flex items-center bg-card rounded-xl p-1 w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-muted"><Minus size={16} /></button>
                <span className="w-10 text-center font-syne font-bold">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} className="p-3 text-primary"><Plus size={16} /></button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Sale Price (USD)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="number" 
                  value={salePrice} 
                  onChange={e => setSalePrice(e.target.value)}
                  className="w-full bg-card border-none rounded-xl py-3 pl-10 pr-4 text-white font-syne font-bold outline-none focus:ring-1 focus:ring-primary" 
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Sale Channel</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setSaleType('in-store')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${saleType === 'in-store' ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-card border-white/5 text-muted'}`}
              >
                In-Store
              </button>
              <button 
                onClick={() => setSaleType('online')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${saleType === 'online' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-card border-white/5 text-muted'}`}
              >
                Online
              </button>
            </div>
          </div>

          <button 
            disabled={!selectedSize}
            onClick={() => onConfirm({
              product_id: product.id,
              size: selectedSize,
              quantity,
              sale_price: Number(salePrice),
              listed_price: product.price,
              channel: saleType === 'online' ? 'whatsapp' : 'in_store',
              is_negotiated: Number(salePrice) !== product.price
            })}
            className="w-full bg-primary text-white font-bold py-4 rounded-pill shadow-lg shadow-primary/30 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check size={20} /> Confirm Sale
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ShopSetupFlow: React.FC<{ step: number, setStep: (s: number) => void, onComplete: () => void }> = ({ step, setStep, onComplete }) => {
  const { userData, updateUserData } = useInventory();
  const [formData, setFormData] = useState({
    shopName: userData.shopName || '',
    shopHandle: userData.shopHandle || '',
    shopCategory: userData.shopCategory || '',
    shopDescription: userData.shopDescription || '',
    shopArea: userData.shopArea || 'Harare CBD',
    shopLandmark: userData.shopLandmark || '',
    shopDirections: userData.shopDirections || '',
    shopIsOnlineOnly: userData.shopIsOnlineOnly || false,
    shopWhatsApp: userData.shopWhatsApp || '',
    shopInstagram: userData.shopInstagram || '',
    shopTradingHours: userData.shopTradingHours || {
      'Mon': { open: '08:00', close: '18:00', active: true },
      'Tue': { open: '08:00', close: '18:00', active: true },
      'Wed': { open: '08:00', close: '18:00', active: true },
      'Thu': { open: '08:00', close: '18:00', active: true },
      'Fri': { open: '08:00', close: '18:00', active: true },
      'Sat': { open: '08:00', close: '16:00', active: true },
      'Sun': { open: '09:00', close: '13:00', active: false },
    },
  });

  const categories = ['Sneakers', 'Streetwear', 'Vintage', 'Accessories', 'Luxury', 'Tech'];
  const areas = ['Harare CBD', 'Eastlea', 'Borrowdale', 'Avondale', 'Bulawayo', 'Mutare', 'Chitungwiza', 'Other'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleNext = () => {
    if (step < 5) {
      updateUserData(formData);
      setStep(step + 1);
    } else {
      updateUserData(formData);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
      <header className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <button onClick={() => step > 1 ? setStep(step - 1) : null} className={`p-2 rounded-full bg-card text-white ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}>
            <ChevronLeft size={20} />
          </button>
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Step {step} of 5</span>
          <div className="w-10" />
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary" 
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-8"
          >
            {step === 1 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-syne font-bold text-white">Shop Identity</h2>
                  <p className="text-sm text-muted">What's the name of your empire?</p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Shop Name</label>
                    <input 
                      value={formData.shopName}
                      onChange={e => setFormData({ ...formData, shopName: e.target.value, shopHandle: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="e.g. SoleKing HRE" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Shop Handle</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">thread.zw/</span>
                      <input 
                        value={formData.shopHandle}
                        onChange={e => setFormData({ ...formData, shopHandle: e.target.value })}
                        className="w-full bg-card border-none rounded-xl py-4 pl-[90px] pr-12 text-white font-mono text-sm outline-none focus:ring-2 focus:ring-primary" 
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                        <Check size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-syne font-bold text-white">Category & Bio</h2>
                  <p className="text-sm text-muted">Tell buyers what you sell and why they should shop with you.</p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Primary Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setFormData({ ...formData, shopCategory: cat })}
                          className={`px-4 py-2 rounded-pill text-xs font-bold transition-all border ${
                            formData.shopCategory === cat ? 'bg-primary border-primary text-white' : 'bg-card border-white/5 text-muted'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Description</label>
                      <span className="text-[10px] font-mono text-muted">{formData.shopDescription.length}/160</span>
                    </div>
                    <textarea 
                      maxLength={160}
                      value={formData.shopDescription}
                      onChange={e => setFormData({ ...formData, shopDescription: e.target.value })}
                      className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary h-32 resize-none" 
                      placeholder="e.g. Zimbabwe's premier destination for authentic sneakers..." 
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-syne font-bold text-white">Location</h2>
                  <p className="text-sm text-muted">Where can buyers find you?</p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="bg-card rounded-xl p-4 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Ship size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Online Only</p>
                        <p className="text-[10px] font-mono text-muted uppercase">No physical storefront</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFormData({ ...formData, shopIsOnlineOnly: !formData.shopIsOnlineOnly })}
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.shopIsOnlineOnly ? 'bg-primary' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.shopIsOnlineOnly ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {!formData.shopIsOnlineOnly && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Area</label>
                        <select 
                          value={formData.shopArea}
                          onChange={e => setFormData({ ...formData, shopArea: e.target.value })}
                          className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary appearance-none"
                        >
                          {areas.map(a => <option key={a}>{a}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Landmark</label>
                        <input 
                          value={formData.shopLandmark}
                          onChange={e => setFormData({ ...formData, shopLandmark: e.target.value })}
                          className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary" 
                          placeholder="e.g. Eastlea Shopping Centre, Shop 14" 
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Directions</label>
                        <textarea 
                          value={formData.shopDirections}
                          onChange={e => setFormData({ ...formData, shopDirections: e.target.value })}
                          className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary h-24 resize-none" 
                          placeholder="e.g. From Eastlea roundabout head south..." 
                        />
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-primary" />
                          <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Trading Hours</label>
                        </div>
                        <div className="flex flex-col gap-3">
                          {days.map(day => (
                            <div key={day} className="flex items-center gap-4">
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({ 
                                  ...prev, 
                                  shopTradingHours: { 
                                    ...prev.shopTradingHours, 
                                    [day]: { ...prev.shopTradingHours[day], active: !prev.shopTradingHours[day].active } 
                                  } 
                                }))}
                                className={`w-10 py-2 rounded-lg text-[10px] font-bold transition-all ${formData.shopTradingHours[day].active ? 'bg-primary text-white' : 'bg-card text-muted'}`}
                              >
                                {day}
                              </button>
                              {formData.shopTradingHours[day].active ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input 
                                    type="time" 
                                    value={formData.shopTradingHours[day].open} 
                                    onChange={e => setFormData(prev => ({ 
                                      ...prev, 
                                      shopTradingHours: { 
                                        ...prev.shopTradingHours, 
                                        [day]: { ...prev.shopTradingHours[day], open: e.target.value } 
                                      } 
                                    }))}
                                    className="flex-1 bg-card border-none rounded-lg p-2 text-[10px] text-white outline-none" 
                                  />
                                  <span className="text-muted text-[10px]">to</span>
                                  <input 
                                    type="time" 
                                    value={formData.shopTradingHours[day].close} 
                                    onChange={e => setFormData(prev => ({ 
                                      ...prev, 
                                      shopTradingHours: { 
                                        ...prev.shopTradingHours, 
                                        [day]: { ...prev.shopTradingHours[day], close: e.target.value } 
                                      } 
                                    }))}
                                    className="flex-1 bg-card border-none rounded-lg p-2 text-[10px] text-white outline-none" 
                                  />
                                </div>
                              ) : (
                                <span className="flex-1 text-[10px] font-mono text-muted italic">Closed</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-syne font-bold text-white">Contact</h2>
                  <p className="text-sm text-muted">How should buyers reach you?</p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-muted uppercase tracking-widest">WhatsApp Number</label>
                    <input 
                      value={formData.shopWhatsApp}
                      onChange={e => setFormData({ ...formData, shopWhatsApp: e.target.value })}
                      className="bg-card border-none rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="2637..." 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Instagram Handle (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">@</span>
                      <input 
                        value={formData.shopInstagram}
                        onChange={e => setFormData({ ...formData, shopInstagram: e.target.value })}
                        className="w-full bg-card border-none rounded-xl py-4 pl-10 text-white outline-none focus:ring-2 focus:ring-primary" 
                        placeholder="soleking_hre" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-syne font-bold text-white">Preview</h2>
                  <p className="text-sm text-muted">This is how buyers will see your shop.</p>
                </div>
                
                <div className="bg-background border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                  <div className="h-32 gradient-pink-purple" />
                  <div className="px-6 pb-6 -mt-10">
                    <div className="w-20 h-20 rounded-full bg-card border-4 border-background flex items-center justify-center text-4xl mb-4">🏪</div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-2xl font-syne font-bold text-white">{formData.shopName}</h3>
                        <p className="text-xs font-mono text-muted">thread.zw/{formData.shopHandle}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-pill text-[10px] font-bold uppercase tracking-widest">{formData.shopCategory}</span>
                      </div>
                      <p className="text-sm text-muted leading-relaxed">{formData.shopDescription}</p>
                      
                      <div className="bg-card rounded-xl p-4 border border-white/5 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Navigation size={16} className="text-primary" />
                          <div>
                            <p className="text-xs font-bold text-white">{formData.shopArea}</p>
                            <p className="text-[10px] text-muted">{formData.shopLandmark}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8">
        <button 
          onClick={handleNext}
          className="w-full bg-primary text-white font-bold py-4 rounded-pill shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
        >
          {step === 5 ? 'Launch My Shop' : 'Continue'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

