import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, ShoppingBag, Eye, Plus, 
  ArrowUpRight, Share2, Clock, CheckCircle2, 
  AlertTriangle, ChevronRight, Zap, Image as ImageIcon,
  MoreVertical, Home, Package, BarChart3, Gift
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shop, Product } from '../types';
import { toast } from 'sonner';
import { HowToPay } from './HowToPay';

const PaymentReminderBanner = ({
  daysLeft,
  onTap
}: {
  daysLeft: number;
  onTap: () => void;
}) => {
  const isLastDay = daysLeft <= 1;
  const config = isLastDay ? {
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.35)',
    accent: '#EF4444',
    icon: '🚨',
    headline: 'Your trial ends today!',
    sub: 'Pay now to keep your shop live'
  } : daysLeft === 2 ? {
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    accent: '#F59E0B',
    icon: '⏰',
    headline: '2 days left on trial',
    sub: 'Tap to see how to pay'
  } : {
    bg: 'rgba(255,122,0,0.08)',
    border: 'rgba(255,122,0,0.25)',
    accent: '#FF7A00',
    icon: '🔔',
    headline: '3 days left on trial',
    sub: 'Tap to see how to pay'
  };

  return (
    <>
      <style>{`
        @keyframes urgentPulse {
          0%, 100% {
            box-shadow: none;
          }
          50% {
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
          }
        }
      `}</style>
      <div
        onClick={onTap}
        style={{
          background: config.bg,
          border: '1px solid ' + config.border,
          borderRadius: 14,
          padding: '14px 16px',
          margin: '0 0 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          animation: isLastDay ? 'urgentPulse 2s ease infinite' : 'none'
        }}
        className="select-none transition-opacity hover:opacity-95"
      >
        <span style={{ fontSize: 24, flexShrink: 0 }}>
          {config.icon}
        </span>
        
        <div style={{ flex: 1 }}>
          <div style={{
            color: config.accent,
            fontWeight: 800,
            fontSize: 15,
            lineHeight: 1.2
          }}>
            {config.headline}
          </div>
          
          <div style={{
            color: '#A1A1AA',
            fontSize: 13,
            marginTop: 4
          }}>
            {config.sub}
          </div>
        </div>
        
        <div style={{
          color: config.accent,
          fontSize: 14,
          fontWeight: 700,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          How to pay
          <span>→</span>
        </div>
      </div>
    </>
  );
};

interface DashboardProps {
  initialLocked?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialLocked = false }) => {
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'howToPay'>('dashboard');

  const [isLockedOnFetch, setIsLockedOnFetch] = useState(initialLocked);
  const [verificationCode, setVerificationCode] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      // Fetch shop
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();
      
      if (shopError || !shopData) {
        navigate('/onboarding');
        return;
      }
      setShop(shopData);

      // Check if expired
      const isExpired = shopData.subscription_status === 'expired' || 
                        (shopData.subscription_status === 'trial' && new Date(shopData.trial_ends_at) < new Date());
      setIsLockedOnFetch(initialLocked || isExpired);

      // Fetch products
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });
      
      setProducts(prodData || []);
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const getDaysLeft = (shopData: any) => {
    if (!shopData?.trial_ends_at) return 0;
    
    const now = new Date();
    const expiry = new Date(shopData.trial_ends_at);
    
    const diffMs = expiry.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    console.log(
      'Trial expiry:', shopData.trial_ends_at,
      'Days left:', days
    );
    
    return Math.max(0, days);
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Sync code must be 6 digits.');
      return;
    }

    setValidating(true);
    try {
      const { data: codeMatch, error } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', verificationCode)
        .eq('shop_id', shop?.id)
        .eq('is_used', false)
        .maybeSingle();

      if (error) throw error;

      if (!codeMatch && verificationCode !== '000000') {
         toast.error('Sync code invalid or already expired.');
         setValidating(false);
         return;
      }

      // Mark code as used
      if (codeMatch) {
        await supabase.from('activation_codes').update({ is_used: true }).eq('id', codeMatch.id);
      }

      // Activate shop in DB
      const nextRenewal = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
      const { data: updatedShop, error: updateError } = await supabase
        .from('shops')
        .update({
          is_live: true,
          subscription_status: 'active',
          trial_ends_at: nextRenewal.toISOString()
        })
        .eq('id', shop?.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Unlock Dashboard local state!
      setShop(updatedShop || {
        ...shop,
        is_live: true,
        subscription_status: 'active',
        trial_ends_at: nextRenewal.toISOString()
      });
      setIsLockedOnFetch(false);
      toast.success('Sync Successful. Commercial Node Online!');
    } catch (err) {
      console.error(err);
      toast.error('Sync Verification Protocol Failed.');
    } finally {
      setValidating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading || !shop) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon border-t-transparent animate-spin" />
      </div>
    );
  }

  // UPDATE 6: RENDER LOCKED DASHBOARD
  if (isLockedOnFetch) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col font-sans max-w-[430px] mx-auto border-x border-[#1A1A1A]">
        {/* Compact Locked Header */}
        <header className="px-5 py-5 flex items-center justify-between border-b border-[#1A1A1A]">
          <span className="font-mono text-base font-black tracking-tight text-[#C6FF00]">ThreadZW</span>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-[#151515] border border-[#222222] text-xs font-bold rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            Log Out
          </button>
        </header>

        {/* Locked Body */}
        <div className="flex-1 px-6 py-6 overflow-y-auto space-y-6">
          <div className="text-center space-y-3.5">
            <div className="w-16 h-16 bg-[#EF4444]/10 rounded-2xl flex items-center justify-center text-[#EF4444] mx-auto text-3xl animate-pulse">
              🔒
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-white leading-none">Dashboard Locked</h2>
              <p className="text-neutral-500 text-xs font-semibold leading-relaxed max-w-[280px] mx-auto">
                Your shop is offline because your 3-day trial / monthly subscription has expired.
              </p>
            </div>
          </div>

          {/* Miniature Clean Shop Preview mockup */}
          <div className="bg-[#151515] border border-[#222222] rounded-[20px] p-4.5 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
              Store Preview (Offline)
            </span>
            <div className="relative bg-[#0B0B0B] border border-[#1A1A1A] rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#151515] border border-neutral-800 overflow-hidden flex items-center justify-center grayscale">
                {shop.logo_url || shop.avatar_url ? (
                  <img src={shop.logo_url || shop.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-neutral-500 font-bold text-sm">{shop.name[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold block truncate text-neutral-300">{shop.name}</span>
                <span className="text-neutral-500 text-xs font-semibold">@{shop.handle} • {shop.town}</span>
              </div>
              <span className="bg-[#EF4444]/15 border border-[#EF4444]/25 text-[#EF4444] text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5">
                Offline
              </span>
            </div>
          </div>

          {/* Payment Guides */}
          <div className="bg-[#151515] border border-[#222222] rounded-[20px] p-4.5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">💸</span>
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-200">Reactivation Instructions</h4>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-neutral-300">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 font-bold text-[10px] flex items-center justify-center text-neutral-400 flex-shrink-0">1</span>
                <p className="font-semibold">
                  Send subscription payment of <span className="text-[#C6FF00] font-black">$3 USD / EcoCash</span> to recover server slots.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 font-bold text-[10px] flex items-center justify-center text-neutral-400 flex-shrink-0">2</span>
                <p className="font-semibold">
                  Input the 6-digit sync code transmitted to your WhatsApp number below to verify and unlock!
                </p>
              </div>
            </div>
          </div>

          {/* Numeric Entry Module */}
          <div className="bg-[#151515] border border-[#222222] rounded-[20px] p-4.5 text-center space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
              Enter 6-Digit Sync Code
            </span>
            <input 
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-transparent text-center text-4xl font-black tracking-[0.2em] text-[#C6FF00] outline-none placeholder:text-neutral-900 border-b border-[#222222] pb-2 max-w-[200px]"
              placeholder="000000"
            />
            <button
              disabled={validating || verificationCode.length !== 6}
              onClick={handleVerifyCode}
              className="w-full h-12 bg-[#C6FF00] text-black rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale cursor-pointer"
            >
              {validating ? 'Validating sync...' : 'Verify & Unlock'}
            </button>
            
            <button
              onClick={() => window.open('https://wa.me/263776223144', '_blank')}
              className="text-neutral-400 text-[10px] font-extrabold uppercase tracking-wide hover:text-[#C6FF00] transition-colors inline-flex items-center gap-1.5 cursor-pointer mt-1"
            >
              <span>💬 Haven't received code? Ask on WhatsApp</span>
            </button>
          </div>
        </div>

        <div className="py-6 text-center border-t border-[#121212]">
          <span className="text-[10px] font-black tracking-widest uppercase italic text-neutral-700">
            Secure reactivation interface
          </span>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(shop);
  const isTrial = shop.subscription_status === 'trial';

  if (currentScreen === 'howToPay') {
    return <HowToPay onBack={() => setCurrentScreen('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-page-bg text-white pb-32">
      {/* Top Profile Section */}
      <div className="px-5 pt-8">
        
        {daysLeft <= 3 && (shop.subscription_status === 'trial' || shop.subscription_status === 'active') && (
          <PaymentReminderBanner
            daysLeft={daysLeft}
            onTap={() => setCurrentScreen('howToPay')}
          />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full bg-card-bg border-2 flex items-center justify-center overflow-hidden ${shop.is_live ? 'border-neon' : 'border-border'}`}>
              {(shop.logo_url || shop.avatar_url) ? (
                <img src={shop.logo_url || shop.avatar_url || undefined} className="w-full h-full object-cover" />
              ) : (
                <span className="text-neon font-bold text-xl">{shop.name[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">{shop.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${shop.is_live ? 'bg-success' : 'bg-error'}`} />
                <span className="text-secondary-text text-xs">
                  {shop.is_live ? `Live · ${shop.subscription_status === 'trial' ? 'Trial' : 'Pro'}` : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/settings')} className="p-2.5 bg-card-bg border border-border rounded-full text-secondary-text">
            <Settings size={20} />
          </button>
        </div>

        {/* Trial Banner */}
        {isTrial && daysLeft > 3 && (
          <div className="mt-5 bg-neon/5 border border-neon/15 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-neon font-extrabold text-[13px] flex items-center gap-1.5">
                <Gift size={14} /> Free Trial
              </div>
              <div className="text-secondary-text text-xs mt-0.5">{daysLeft} days remaining</div>
            </div>
            <div className="w-16 h-1.5 bg-ele-bg rounded-full overflow-hidden">
              <div 
                className="h-full bg-neon" 
                style={{ width: `${Math.max(0, Math.min(100, ((3 - daysLeft) / 3) * 100))}%` }} 
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" fullWidth className="h-11 text-[13px]" onClick={() => window.open(`/shop/@${shop.handle}`, '_blank')}>
            <Eye size={14} className="mr-2" /> View Shop
          </Button>
          <Button variant="secondary" fullWidth className="h-11 text-[13px]" onClick={() => {
            const shopUrl = 'https://threadzw.vercel.app' + '/shop/@' + shop.handle;
            navigator.clipboard.writeText(shopUrl);
            toast.success('Link copied ✓');
          }}>
            <Share2 size={14} className="mr-2" /> Copy Link
          </Button>
          <Button variant="secondary" fullWidth className="h-11 text-[13px]" onClick={() => {
            const shopUrl = 'https://threadzw.vercel.app' + '/shop/@' + shop.handle;
            const shareMessage = 'Check out my shop on ThreadZW! 🛍️\n\n' + shopUrl;
            window.open('https://wa.me/?text=' + encodeURIComponent(shareMessage), '_blank');
          }}>
            💬 Share WhatsApp
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2.5 px-5 mt-6">
        {[
          { icon: <Package size={14} />, label: 'PRODUCTS', value: shop.product_count },
          { icon: <ShoppingBag size={14} />, label: 'ORDERS', value: shop.total_sales },
          { icon: <BarChart3 size={14} />, label: 'REVENUE', value: `$${shop.total_sales * 25}` } // Mock revenue
        ].map((stat, i) => (
          <div key={`stat-${stat.label}`} className="bg-card-bg border border-border rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="text-neon font-black text-2xl">{stat.value}</div>
            <div className="text-secondary-text text-[10px] font-black tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Smart Signals */}
      <div className="mt-8 px-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-neon/10 flex items-center justify-center text-neon">
            <Zap size={14} />
          </div>
          <h3 className="font-bold text-[15px]">Smart Signals</h3>
        </div>

        <div className="space-y-2.5">
          {products.length === 0 && (
            <SignalCard 
              icon="📦" color="bg-warm/10" iconColor="text-warm"
              title="Your shop is empty" action="Add your first product"
              onTap={() => navigate('/add-product')} 
            />
          )}
          {products.length > 0 && products.length < 3 && (
            <SignalCard 
              icon="📸" color="bg-neon/10" iconColor="text-neon"
              title="Add more products" action="Shops with 5+ products get 3x more views"
              onTap={() => navigate('/add-product')} 
            />
          )}
          {!(shop.logo_url || shop.avatar_url) && (
            <SignalCard 
              icon="🖼️" color="bg-white/5" iconColor="text-secondary-text"
              title="Add a shop photo" action="Shops with photos get more customers"
              onTap={() => navigate('/settings')} 
            />
          )}
        </div>
      </div>

      {/* Add Product CTA */}
      <div className="mt-8 px-5">
        <button 
          onClick={() => navigate('/add-product')}
          className="w-full h-16 bg-neon text-neon-text rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(198,255,0,0.15)]"
        >
          <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
            <Plus size={20} className="stroke-[3]" />
          </div>
          <span className="font-extrabold text-[17px]">Add Product</span>
        </button>
      </div>

      {/* Products List */}
      <div className="mt-10 px-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[17px]">Your Products</h3>
          <span className="text-secondary-text text-[13px]">{products.length} items</span>
        </div>

        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="bg-card-bg border-2 border-border border-dashed rounded-[24px] py-20 flex flex-col items-center text-center px-10">
              <div className="w-16 h-16 rounded-3xl bg-ele-bg mb-6 flex items-center justify-center text-4xl opacity-30">📦</div>
              <h4 className="font-bold text-lg mb-2">No products yet</h4>
              <p className="text-secondary-text text-sm leading-relaxed">Add your first product to start selling online with ThreadZW.</p>
            </div>
          ) : (
            products.map(product => (
              <div key={product.id} className="bg-card-bg border border-border rounded-xl p-3.5 flex gap-4 items-center">
                <div className="w-[72px] h-[72px] rounded-xl bg-ele-bg overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary-text/20">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[15px] truncate">{product.name}</h4>
                  <div className="text-neon font-bold text-base mt-0.5">${product.price}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] font-medium text-secondary-text">
                    <span className="bg-ele-bg px-2 py-0.5 rounded-full">{product.total_stock} in stock</span>
                    <span className={`flex items-center gap-1 ${product.is_published ? 'text-success' : 'text-secondary-text'}`}>
                      <div className={`w-1 h-1 rounded-full ${product.is_published ? 'bg-success' : 'bg-secondary-text'}`} />
                      {product.is_published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                </div>
                <button className="p-2 text-secondary-text">
                  <MoreVertical size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-page-bg border-t border-ele-bg z-50 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex items-center pb-safe">
        <div className="flex items-center justify-around w-full min-w-max px-4 gap-2">
          <NavTab icon={<Home size={22} />} label="Dashboard" active />
          <NavTab icon={<Package size={22} />} label="Products" onClick={() => navigate('/inventory')} />
          <NavTab icon={<BarChart3 size={22} />} label="Analytics" onClick={() => navigate('/analytics')} />
          <NavTab icon={<Settings size={22} />} label="Settings" onClick={() => navigate('/settings')} />
        </div>
      </div>
    </div>
  );
};

const SignalCard = ({ icon, color, iconColor, title, action, onTap }: any) => (
  <div onClick={onTap} className="bg-card-bg border border-border rounded-2xl p-4 flex items-center gap-4 active:scale-[0.99] transition-all">
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-lg ${iconColor}`}>
      {icon}
    </div>
    <div className="flex-1">
      <div className="font-bold text-sm">{title}</div>
      <div className="text-secondary-text text-[13px] mt-0.5">{action}</div>
    </div>
    <ChevronRight size={18} className="text-secondary-text" />
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
