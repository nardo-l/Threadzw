import React, { useState } from 'react';
import { TrendingUp, ShoppingBag, Eye, AlertCircle, Plus, Edit2, X, Minus, Check, Clock, DollarSign, Tag, Heart, Bookmark, Ship, Calendar, Navigation, MessageCircle, ChevronRight, ChevronLeft, Layout, BarChart3, Users, Package, Globe, Smartphone, Zap, ArrowRight, Radio } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { ScreenError } from '../components/ui/ScreenError';
import { useTheme } from '../App';

export const Dashboard: React.FC = () => {
  const t = useTheme();
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
      <div className="flex flex-col gap-8 p-6" style={{ background: t.bg_primary }}>
        <div className="h-16 w-full rounded-lg shimmer-bg" style={{ background: t.bg_card }} />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-card shimmer-bg" style={{ background: t.bg_card }} />)}
        </div>
        <div className="h-64 w-full rounded-card shimmer-bg" style={{ background: t.bg_card }} />
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center gap-8" style={{ background: t.bg_primary }}>
        <div className="w-24 h-24 rounded-3xl border flex items-center justify-center text-5xl shadow-2xl" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          🏪
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-syne font-bold" style={{ color: t.text_primary }}>Your shop lives here</h1>
          <p className="text-sm max-w-[280px] mx-auto leading-relaxed" style={{ color: t.text_tertiary }}>
            Track sales, manage stock, and grow your business — all from here
          </p>
        </div>
        <button 
          onClick={() => navigate('/seller-onboarding')}
          className="w-full text-white font-bold py-4 rounded-pill shadow-lg mt-4"
          style={{ background: t.accent, boxShadow: t.shadow }}
        >
          Create Your Store
        </button>
      </div>
    );
  }

  const isShopEmpty = products.length === 0;

  return (
    <div className="flex-1 flex flex-col gap-8 p-6" style={{ background: t.bg_primary }}>
      <header className="sticky top-0 backdrop-blur-md z-40 py-4 -mx-6 px-6 flex justify-between items-center" style={{ backgroundColor: `${t.bg_primary}CC` }}>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-pacifico" style={{ color: t.text_primary }}>{userData.shopName || 'My Shop'}</h1>
            {userData.shopIsVerified && (
              <div className="bg-blue-500 rounded-full p-0.5 mt-1">
                <Check size={10} className="text-white stroke-[4]" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${userData.isShopLive ? 'bg-green-500 animate-pulse' : ''} rounded-full`} style={{ background: !userData.isShopLive ? t.border_secondary : undefined }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>
              {userData.isShopLive ? 'Shop Live' : 'Offline'}
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="p-3 rounded-full"
          style={{ background: t.bg_card, color: t.accent }}
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat: any) => (
          <div key={stat.label} className="rounded-card p-4 flex flex-col gap-2 border" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
            <div className="p-1.5 rounded-lg w-fit" style={{ background: t.bg_primary, color: stat.color === 'text-primary' ? t.accent : stat.color.replace('text-', '') }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase" style={{ color: t.text_tertiary }}>{stat.label}</p>
              <p className="text-lg font-syne font-bold" style={{ color: stat.color === 'text-primary' ? t.accent : stat.color.replace('text-', '') }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <section className="flex flex-col gap-6">
        {/* 1. Weekly Revenue - Bar Chart */}
        <div className="rounded-card p-6 border flex flex-col gap-6" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-syne font-bold" style={{ color: t.text_primary }}>Weekly Revenue</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-syne font-bold" style={{ color: t.text_secondary }}>${stats[0]?.value.replace('$', '')}</span>
                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-bold rounded-pill">+12%</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[8px] font-mono uppercase tracking-widest">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: t.accent }} />
                <span style={{ color: t.text_primary }}>This Week</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 border border-dashed rounded-full" style={{ borderColor: t.text_tertiary }} />
                <span style={{ color: t.text_tertiary }}>Last Week</span>
              </div>
            </div>
          </div>
          <div className="h-40 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
              {/* Last Week Dashed Line */}
              <path 
                d="M 0 80 Q 50 60 100 90 T 200 50 T 300 70" 
                fill="none" 
                stroke={t.text_tertiary} 
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
                const barColor = i === 5 ? t.accent : `${t.accent}4D`; // 30% opacity
                return (
                  <g key={i} className="group cursor-pointer">
                    <motion.rect
                      initial={{ height: 0, y: 100 }}
                      animate={{ height, y }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      x={x}
                      width={barWidth}
                      rx="4"
                      fill={barColor}
                      className="hover:brightness-110 transition-all"
                    />
                    {i === 5 && (
                      <rect x={x} y={y} width={barWidth} height={height} fill={t.accent} className="blur-md opacity-30" />
                    )}
                    <text x={x + barWidth/2} y="115" textAnchor="middle" fill={t.text_tertiary} className="text-[8px] font-mono">{d.day}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 2. Sales Over Time - Line Chart */}
        <div className="rounded-card p-6 border flex flex-col gap-6" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          <h3 className="font-syne font-bold" style={{ color: t.text_primary }}>Sales Over Time</h3>
          <div className="h-40 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.accent} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
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
                stroke={t.accent}
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
                  fill={t.accent}
                  style={{ stroke: t.bg_card }}
                  className="stroke-2 cursor-pointer hover:r-4 transition-all"
                />
              ))}
            </svg>
            <div className="flex justify-between mt-2">
              <span className="text-[8px] font-mono" style={{ color: t.text_tertiary }}>1 Mar</span>
              <span className="text-[8px] font-mono" style={{ color: t.text_tertiary }}>30 Mar</span>
            </div>
          </div>
        </div>

        {/* 3. In-store vs Online - Donut Chart */}
        <div className="rounded-card p-6 border flex flex-col gap-6" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          <h3 className="font-syne font-bold" style={{ color: t.text_primary }}>In-store vs Online</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke={t.border_secondary} strokeWidth="12" />
                <motion.circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke={t.accent} 
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
                <span className="text-xl font-syne font-bold" style={{ color: t.text_primary }}>{stats[1]?.value || 0}</span>
                <span className="text-[8px] font-mono uppercase" style={{ color: t.text_tertiary }}>Orders</span>
              </div>
            </div>
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: t.accent }} />
                  <span className="text-xs" style={{ color: t.text_primary }}>Online</span>
                </div>
                <span className="text-xs font-mono" style={{ color: t.text_tertiary }}>{analytics.onlinePercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span className="text-xs" style={{ color: t.text_primary }}>In-store</span>
                </div>
                <span className="text-xs font-mono" style={{ color: t.text_tertiary }}>{100 - analytics.onlinePercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Top Products - Horizontal Bar Chart */}
        <div className="rounded-card p-6 border flex flex-col gap-6" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          <h3 className="font-syne font-bold" style={{ color: t.text_primary }}>Top Products</h3>
          <div className="flex flex-col gap-4">
            {topProducts.map((p: any, i: number) => (
              <div key={p.name} className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                  <span style={{ color: t.text_primary }}>{p.name}</span>
                  <span style={{ color: t.text_tertiary }}>{p.units} units</span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: t.bg_primary }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.units / 50) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ background: i === 0 ? t.accent : `${t.accent}66` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Views Over Time - Line Chart (Blue) */}
        <div className="rounded-card p-6 border flex flex-col gap-6" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          <h3 className="font-syne font-bold" style={{ color: t.text_primary }}>Views Over Time</h3>
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
              <span className="text-[8px] font-mono" style={{ color: t.text_tertiary }}>1 Mar</span>
              <span className="text-[8px] font-mono" style={{ color: t.text_tertiary }}>30 Mar</span>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Row */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-card p-4 border flex flex-col gap-1" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          <span className="text-[8px] font-mono uppercase" style={{ color: t.text_tertiary }}>Avg. Discount</span>
          <p className="text-sm font-syne font-bold text-amber-500">-${analytics.avgDiscount}</p>
        </div>
        <div className="rounded-card p-4 border flex flex-col gap-1" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          <span className="text-[8px] font-mono uppercase" style={{ color: t.text_tertiary }}>Best Size</span>
          <p className="text-sm font-syne font-bold" style={{ color: t.accent }}>{analytics.bestSize}</p>
        </div>
        <div className="rounded-card p-4 border flex flex-col gap-1" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          <span className="text-[8px] font-mono uppercase" style={{ color: t.text_tertiary }}>Online %</span>
          <p className="text-sm font-syne font-bold text-blue-400">{analytics.onlinePercent}%</p>
        </div>
      </section>

      {/* Smart Signals */}
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-syne font-bold px-2" style={{ color: t.text_primary }}>Smart Signals</h3>
        <div className="flex flex-col gap-3">
          {isShopEmpty && (
            <div className="border rounded-card p-5 flex flex-col gap-4" style={{ background: `${t.accent}1A`, borderColor: `${t.accent}33` }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{ background: `${t.accent}33`, color: t.accent }}>
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="font-bold" style={{ color: t.text_primary }}>Your first sale is coming</h4>
                  <p className="text-xs" style={{ color: t.text_tertiary }}>Add your first product to start appearing in the feed</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-full py-3 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                style={{ background: t.accent }}
              >
                <Plus size={14} /> Add Your First Product
              </button>
            </div>
          )}
          {!isShopEmpty && analytics.highInterestProducts.map((p: any) => (
            <div key={p.id} className="border rounded-card p-4 flex items-center gap-4" style={{ background: `${t.accent}1A`, borderColor: `${t.accent}33` }}>
              <div className="p-2 rounded-lg" style={{ background: `${t.accent}33`, color: t.accent }}>
                <Tag size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs leading-tight" style={{ color: t.accent }}>
                  <span className="font-bold">High Interest</span> — {p.name} has {p.saves} saves but few sales. Consider adjusting price.
                </p>
              </div>
            </div>
          ))}
          {!isShopEmpty && (
            <div className="border rounded-card p-4 flex items-center gap-4" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
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
          <h3 className="text-lg font-syne font-bold" style={{ color: t.text_primary }}>My Products</h3>
          <button className="text-xs font-mono" style={{ color: t.accent }}>View All</button>
        </div>
        
        {isShopEmpty ? (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full h-48 rounded-card border-2 border-dashed flex flex-col items-center justify-center gap-3 group transition-all"
            style={{ borderColor: `${t.accent}33`, background: `${t.accent}0D` }}
          >
            <div className="p-4 rounded-full group-hover:scale-110 transition-transform" style={{ background: `${t.accent}1A`, color: t.accent }}>
              <Plus size={32} />
            </div>
            <p className="text-sm font-bold" style={{ color: t.text_tertiary }}>List your first product</p>
          </button>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
            {products.map((product: any) => {
              const stock = getStockInfo(product.variants);
              return (
                <div key={product.id} className="rounded-card overflow-hidden border w-56 flex-shrink-0 relative group" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
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
                      <h4 className="text-xs font-bold truncate" style={{ color: t.text_primary }}>{product.name}</h4>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: t.accent }}>${product.price}</p>
                    </div>
                    <button 
                      onClick={() => setSellingProduct(product)}
                      className="w-full py-2 border rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest"
                      style={{ background: `${t.accent}1A`, borderColor: `${t.accent}33`, color: t.accent }}
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
          className="text-white font-bold py-4 rounded-pill flex items-center justify-center gap-2 shadow-lg mt-4"
          style={{ background: t.accent, boxShadow: t.shadow }}
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
  const t = useTheme();
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
          <h2 className="text-2xl font-pacifico" style={{ color: t.text_primary }}>Edit Shop</h2>
          <button onClick={onClose} className="p-2 rounded-full" style={{ background: t.bg_card, color: t.text_tertiary }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="rounded-xl p-4 border flex items-center justify-between" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: `${t.accent}1A`, color: t.accent }}>
                <Ship size={20} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: t.text_primary }}>Online Only</p>
                <p className="text-[10px] font-mono uppercase" style={{ color: t.text_tertiary }}>No physical storefront</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsOnlineOnly(!isOnlineOnly)}
              className={`w-12 h-6 rounded-full transition-all relative ${isOnlineOnly ? '' : ''}`}
              style={{ background: isOnlineOnly ? t.accent : t.border_secondary }}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isOnlineOnly ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {isOnlineOnly ? (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Delivery Info</label>
              <textarea 
                value={deliveryInfo} 
                onChange={e => setDeliveryInfo(e.target.value)} 
                className="border-none rounded-xl p-4 outline-none focus:ring-2 h-24 resize-none" 
                style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                placeholder="e.g. We ship nationwide via Swift. Same day delivery in Harare." 
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Area</label>
                  <select 
                    value={area} 
                    onChange={e => setArea(e.target.value)} 
                    className="border-none rounded-xl p-4 outline-none focus:ring-2 appearance-none"
                    style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                  >
                    {areas.map(a => <option key={a} style={{ background: t.bg_card }}>{a}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>WhatsApp Number</label>
                  <input 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                    className="border-none rounded-xl p-4 outline-none focus:ring-2" 
                    style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                    placeholder="2637..." 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Landmark (Short Summary)</label>
                <input 
                  value={landmark} 
                  onChange={e => setLandmark(e.target.value)} 
                  className="border-none rounded-xl p-4 outline-none focus:ring-2" 
                  style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                  placeholder="e.g. Eastlea Shopping Centre, Shop 14" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Directions (How to get there)</label>
                <textarea 
                  value={directions} 
                  onChange={e => setDirections(e.target.value)} 
                  className="border-none rounded-xl p-4 outline-none focus:ring-2 h-32 resize-none" 
                  style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                  placeholder="e.g. From Eastlea roundabout head south on Simon Mazorodze..." 
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: t.accent }} />
                  <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Trading Hours</label>
                </div>
                <div className="flex flex-col gap-3">
                  {days.map(day => (
                    <div key={day} className="flex items-center gap-4">
                      <button 
                        type="button"
                        onClick={() => setTradingHours(prev => ({ ...prev, [day]: { ...prev[day], active: !prev[day].active } }))}
                        className="w-10 py-2 rounded-lg text-[10px] font-bold transition-all"
                        style={{ 
                          background: tradingHours[day].active ? t.accent : t.bg_card, 
                          color: tradingHours[day].active ? '#ffffff' : t.text_tertiary 
                        }}
                      >
                        {day}
                      </button>
                      {tradingHours[day].active ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="time" 
                            value={tradingHours[day].open} 
                            onChange={e => setTradingHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                            className="flex-1 border-none rounded-lg p-2 text-[10px] outline-none" 
                            style={{ background: t.bg_card, color: t.text_primary }}
                          />
                          <span className="text-[10px]" style={{ color: t.text_tertiary }}>to</span>
                          <input 
                            type="time" 
                            value={tradingHours[day].close} 
                            onChange={e => setTradingHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                            className="flex-1 border-none rounded-lg p-2 text-[10px] outline-none" 
                            style={{ background: t.bg_card, color: t.text_primary }}
                          />
                        </div>
                      ) : (
                        <span className="flex-1 text-[10px] font-mono italic" style={{ color: t.text_tertiary }}>Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="w-full text-white font-bold py-4 rounded-pill shadow-lg mt-4"
            style={{ background: t.accent, boxShadow: t.shadow }}
          >
            Save Shop Details
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AddProductModal: React.FC<{ onClose: () => void, onAdd: (p: any) => void, userData: any }> = ({ onClose, onAdd, userData }) => {
  const t = useTheme();
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
          <h2 className="text-2xl font-pacifico" style={{ color: t.text_primary }}>Add Product</h2>
          <button onClick={onClose} className="p-2 rounded-full" style={{ background: t.bg_card, color: t.text_tertiary }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Product Photos (Exactly 6)</label>
            <div className="grid grid-cols-3 gap-3">
              {imageLabels.map((label, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <div 
                    onClick={() => !images[index] && handleImageUpload(index)}
                    className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center relative transition-all cursor-pointer"
                    style={{ 
                      borderColor: images[index] ? t.accent : `${t.accent}4D`,
                      background: images[index] ? t.bg_card : `${t.accent}0D`
                    }}
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
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white flex items-center justify-center shadow-lg"
                          style={{ background: t.accent }}
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <Plus size={20} style={{ color: `${t.accent}66` }} />
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-center uppercase truncate" style={{ color: t.text_tertiary }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Product Name</label>
            <input 
              required value={name} onChange={e => setName(e.target.value)} 
              className="border-none rounded-xl p-4 outline-none focus:ring-2" 
              style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
              placeholder="e.g. Jordan 4 Black Cat" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Category</label>
              <select 
                value={category} onChange={e => setCategory(e.target.value)} 
                className="border-none rounded-xl p-4 outline-none focus:ring-2 appearance-none"
                style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
              >
                <option style={{ background: t.bg_card }}>Sneakers</option>
                <option style={{ background: t.bg_card }}>Clothing</option>
                <option style={{ background: t.bg_card }}>Accessories</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Price (USD)</label>
              <input 
                required type="number" value={price} onChange={e => setPrice(e.target.value)} 
                className="border-none rounded-xl p-4 outline-none focus:ring-2" 
                style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                placeholder="120" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Description</label>
            <textarea 
              value={description} onChange={e => setDescription(e.target.value)} 
              className="border-none rounded-xl p-4 outline-none focus:ring-2 h-24 resize-none" 
              style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
              placeholder="Tell buyers about the drip..." 
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Stock & Variants</label>
              <span className="text-[10px] font-mono" style={{ color: t.accent }}>Total: {totalStock} units</span>
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
                  className="flex-1 border-none rounded-xl p-3 text-sm outline-none focus:ring-1" 
                  style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                />
                <div className="flex items-center rounded-xl px-2" style={{ background: t.bg_card }}>
                  <button type="button" onClick={() => {
                    const newV = [...variants];
                    newV[i].quantity = Math.max(0, newV[i].quantity - 1);
                    setVariants(newV);
                  }} className="p-2" style={{ color: t.text_tertiary }}><Minus size={14} /></button>
                  <span className="w-8 text-center text-sm font-mono" style={{ color: t.text_primary }}>{v.quantity}</span>
                  <button type="button" onClick={() => {
                    const newV = [...variants];
                    newV[i].quantity += 1;
                    setVariants(newV);
                  }} className="p-2" style={{ color: t.accent }}><Plus size={14} /></button>
                </div>
                {i === variants.length - 1 ? (
                  <button type="button" onClick={() => setVariants([...variants, { size: '', quantity: 0 }])} className="p-3 rounded-xl" style={{ background: `${t.accent}1A`, color: t.accent }}><Plus size={16} /></button>
                ) : (
                  <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="p-3 rounded-xl bg-red-500/10 text-red-500"><X size={16} /></button>
                )}
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={!isFormValid}
            className="font-bold py-4 rounded-pill shadow-lg transition-all mt-4"
            style={{ 
              background: isFormValid ? t.accent : t.border_secondary, 
              color: isFormValid ? '#ffffff' : `${t.text_primary}80`,
              boxShadow: isFormValid ? t.shadow : 'none',
              cursor: isFormValid ? 'pointer' : 'not-allowed'
            }}
          >
            {isFormValid ? 'List Product' : 'Add all 6 photos to continue'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const MarkAsSoldModal: React.FC<{ product: any, onClose: () => void, onConfirm: (sale: any) => void }> = ({ product, onClose, onConfirm }) => {
  const t = useTheme();
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
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border relative overflow-hidden" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              '👟'
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold" style={{ color: t.text_primary }}>{product.name}</h2>
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Mark as Sold</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ background: t.bg_card, color: t.text_tertiary }}><X size={20} /></button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Select Variant</label>
            <div className="flex flex-wrap gap-2">
              {product.variants.map(v => (
                <button
                  key={v.size}
                  disabled={v.quantity === 0}
                  onClick={() => {
                    setSelectedSize(v.size);
                    setQuantity(1);
                  }}
                  className="px-4 py-2 rounded-pill text-xs font-mono transition-all border"
                  style={{ 
                    background: selectedSize === v.size ? t.accent : t.bg_card, 
                    borderColor: selectedSize === v.size ? t.accent : t.border_secondary,
                    color: selectedSize === v.size ? '#ffffff' : t.text_tertiary,
                    opacity: v.quantity === 0 ? 0.3 : 1
                  }}
                >
                  {v.size} ({v.quantity})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Quantity</label>
              <div className="flex items-center rounded-xl p-1 w-fit" style={{ background: t.bg_card }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3" style={{ color: t.text_tertiary }}><Minus size={16} /></button>
                <span className="w-10 text-center font-syne font-bold" style={{ color: t.text_primary }}>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} className="p-3" style={{ color: t.accent }}><Plus size={16} /></button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Sale Price (USD)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.text_tertiary }} />
                <input 
                  type="number" 
                  value={salePrice} 
                  onChange={e => setSalePrice(e.target.value)}
                  className="w-full border-none rounded-xl py-3 pl-10 pr-4 font-syne font-bold outline-none focus:ring-1" 
                  style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Sale Channel</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setSaleType('in-store')}
                className="flex-1 py-3 rounded-xl text-xs font-bold transition-all border"
                style={{ 
                  background: saleType === 'in-store' ? `${t.text_secondary}1A` : t.bg_card, 
                  borderColor: saleType === 'in-store' ? t.text_secondary : t.border_secondary,
                  color: saleType === 'in-store' ? t.text_secondary : t.text_tertiary
                }}
              >
                In-Store
              </button>
              <button 
                onClick={() => setSaleType('online')}
                className="flex-1 py-3 rounded-xl text-xs font-bold transition-all border"
                style={{ 
                  background: saleType === 'online' ? 'rgba(59, 130, 246, 0.1)' : t.bg_card, 
                  borderColor: saleType === 'online' ? '#3b82f6' : t.border_secondary,
                  color: saleType === 'online' ? '#3b82f6' : t.text_tertiary
                }}
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
            className="w-full text-white font-bold py-4 rounded-pill shadow-lg mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: t.accent, boxShadow: t.shadow }}
          >
            <Check size={20} /> Confirm Sale
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ShopSetupFlow: React.FC<{ step: number, setStep: (s: number) => void, onComplete: () => void }> = ({ step, setStep, onComplete }) => {
  const t = useTheme();
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
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: t.bg_primary }}>
      <header className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <button onClick={() => step > 1 ? setStep(step - 1) : null} className={`p-2 rounded-full text-white ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`} style={{ background: t.bg_card }}>
            <ChevronLeft size={20} />
          </button>
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Step {step} of 5</span>
          <div className="w-10" />
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: t.border_secondary }}>
          <motion.div 
            className="h-full" 
            style={{ background: t.accent }}
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
                  <h2 className="text-3xl font-syne font-bold" style={{ color: t.text_primary }}>Shop Identity</h2>
                  <p className="text-sm" style={{ color: t.text_tertiary }}>What's the name of your empire?</p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Shop Name</label>
                    <input 
                      value={formData.shopName}
                      onChange={e => setFormData({ ...formData, shopName: e.target.value, shopHandle: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="border-none rounded-xl p-4 outline-none focus:ring-2" 
                      style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                      placeholder="e.g. SoleKing HRE" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Shop Handle</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm" style={{ color: t.text_tertiary }}>thread.zw/</span>
                      <input 
                        value={formData.shopHandle}
                        onChange={e => setFormData({ ...formData, shopHandle: e.target.value })}
                        className="w-full border-none rounded-xl py-4 pl-[90px] pr-12 font-mono text-sm outline-none focus:ring-2" 
                        style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
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
                  <h2 className="text-3xl font-syne font-bold" style={{ color: t.text_primary }}>Category & Bio</h2>
                  <p className="text-sm" style={{ color: t.text_tertiary }}>Tell buyers what you sell and why they should shop with you.</p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Primary Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setFormData({ ...formData, shopCategory: cat })}
                          className="px-4 py-2 rounded-pill text-xs font-bold transition-all border"
                          style={{ 
                            background: formData.shopCategory === cat ? t.accent : t.bg_card, 
                            borderColor: formData.shopCategory === cat ? t.accent : t.border_secondary,
                            color: formData.shopCategory === cat ? '#ffffff' : t.text_tertiary 
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Description</label>
                      <span className="text-[10px] font-mono" style={{ color: t.text_tertiary }}>{formData.shopDescription.length}/160</span>
                    </div>
                    <textarea 
                      maxLength={160}
                      value={formData.shopDescription}
                      onChange={e => setFormData({ ...formData, shopDescription: e.target.value })}
                      className="border-none rounded-xl p-4 outline-none focus:ring-2 h-32 resize-none" 
                      style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                      placeholder="e.g. Zimbabwe's premier destination for authentic sneakers..." 
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-syne font-bold" style={{ color: t.text_primary }}>Location</h2>
                  <p className="text-sm" style={{ color: t.text_tertiary }}>Where can buyers find you?</p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="rounded-xl p-4 border flex items-center justify-between" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: `${t.accent}1A`, color: t.accent }}>
                        <Ship size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: t.text_primary }}>Online Only</p>
                        <p className="text-[10px] font-mono uppercase" style={{ color: t.text_tertiary }}>No physical storefront</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFormData({ ...formData, shopIsOnlineOnly: !formData.shopIsOnlineOnly })}
                      className="w-12 h-6 rounded-full transition-all relative"
                      style={{ background: formData.shopIsOnlineOnly ? t.accent : t.border_secondary }}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.shopIsOnlineOnly ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {!formData.shopIsOnlineOnly && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Area</label>
                        <select 
                          value={formData.shopArea}
                          onChange={e => setFormData({ ...formData, shopArea: e.target.value })}
                          className="border-none rounded-xl p-4 outline-none focus:ring-2 appearance-none"
                          style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                        >
                          {areas.map(a => <option key={a} style={{ background: t.bg_card }}>{a}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Landmark</label>
                        <input 
                          value={formData.shopLandmark}
                          onChange={e => setFormData({ ...formData, shopLandmark: e.target.value })}
                          className="border-none rounded-xl p-4 outline-none focus:ring-2" 
                          style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                          placeholder="e.g. Eastlea Shopping Centre, Shop 14" 
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Directions</label>
                        <textarea 
                          value={formData.shopDirections}
                          onChange={e => setFormData({ ...formData, shopDirections: e.target.value })}
                          className="border-none rounded-xl p-4 outline-none focus:ring-2 h-24 resize-none" 
                          style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                          placeholder="e.g. From Eastlea roundabout head south..." 
                        />
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} style={{ color: t.accent }} />
                          <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Trading Hours</label>
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
                                className="w-10 py-2 rounded-lg text-[10px] font-bold transition-all"
                                style={{ 
                                  background: formData.shopTradingHours[day].active ? t.accent : t.bg_card, 
                                  color: formData.shopTradingHours[day].active ? '#ffffff' : t.text_tertiary 
                                }}
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
                                    className="flex-1 border-none rounded-lg p-2 text-[10px] outline-none" 
                                    style={{ background: t.bg_card, color: t.text_primary }}
                                  />
                                  <span className="text-[10px]" style={{ color: t.text_tertiary }}>to</span>
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
                                    className="flex-1 border-none rounded-lg p-2 text-[10px] outline-none" 
                                    style={{ background: t.bg_card, color: t.text_primary }}
                                  />
                                </div>
                              ) : (
                                <span className="flex-1 text-[10px] font-mono italic" style={{ color: t.text_tertiary }}>Closed</span>
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
                  <h2 className="text-3xl font-syne font-bold" style={{ color: t.text_primary }}>Contact</h2>
                  <p className="text-sm" style={{ color: t.text_tertiary }}>How should buyers reach you?</p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>WhatsApp Number</label>
                    <input 
                      value={formData.shopWhatsApp}
                      onChange={e => setFormData({ ...formData, shopWhatsApp: e.target.value })}
                      className="border-none rounded-xl p-4 outline-none focus:ring-2" 
                      style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
                      placeholder="2637..." 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.text_tertiary }}>Instagram Handle (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm" style={{ color: t.text_tertiary }}>@</span>
                      <input 
                        value={formData.shopInstagram}
                        onChange={e => setFormData({ ...formData, shopInstagram: e.target.value })}
                        className="w-full border-none rounded-xl py-4 pl-10 outline-none focus:ring-2" 
                        style={{ background: t.bg_card, color: t.text_primary, '--tw-ring-color': t.accent } as any}
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
                  <h2 className="text-3xl font-syne font-bold" style={{ color: t.text_primary }}>Preview</h2>
                  <p className="text-sm" style={{ color: t.text_tertiary }}>This is how buyers will see your shop.</p>
                </div>
                
                <div className="border rounded-[32px] overflow-hidden shadow-2xl" style={{ background: t.bg_primary, borderColor: t.border_secondary }}>
                  <div className="h-32 gradient-pink-purple" />
                  <div className="px-6 pb-6 -mt-10">
                    <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-4xl mb-4" style={{ background: t.bg_card, borderColor: t.bg_primary }}>🏪</div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-2xl font-syne font-bold" style={{ color: t.text_primary }}>{formData.shopName}</h3>
                        <p className="text-xs font-mono" style={{ color: t.text_tertiary }}>thread.zw/{formData.shopHandle}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-pill text-[10px] font-bold uppercase tracking-widest" style={{ background: `${t.accent}1A`, color: t.accent }}>{formData.shopCategory}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: t.text_secondary }}>{formData.shopDescription}</p>
                      
                      <div className="rounded-xl p-4 border flex flex-col gap-3" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
                        <div className="flex items-center gap-3">
                          <Navigation size={16} style={{ color: t.accent }} />
                          <div>
                            <p className="text-xs font-bold" style={{ color: t.text_primary }}>{formData.shopArea}</p>
                            <p className="text-[10px]" style={{ color: t.text_tertiary }}>{formData.shopLandmark}</p>
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
          className="w-full text-white font-bold py-4 rounded-pill shadow-lg flex items-center justify-center gap-2"
          style={{ background: t.accent, boxShadow: t.shadow }}
        >
          {step === 5 ? 'Launch My Shop' : 'Continue'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

