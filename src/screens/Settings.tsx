import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Package, BarChart3, Settings as SettingsIcon, 
  LogOut, Shield, ChevronRight, User, Settings as GearIcon,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { HowToPay } from './HowToPay';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'howToPay'>('menu');

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/');
          return;
        }

        const { data: shopData } = await supabase
          .from('shops')
          .select('*')
          .eq('owner_id', session.user.id)
          .single();

        if (shopData) {
          setShop(shopData);
        }
      } catch (err) {
        console.error('Settings shop fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Failed to log out');
    }
  };

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

  const daysLeft = shop ? getDaysLeft(shop) : 0;
  const isUrgent = daysLeft <= 3 && (shop?.subscription_status === 'trial' || shop?.subscription_status === 'active');

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon border-t-transparent animate-spin" />
      </div>
    );
  }

  // If we are looking at the "How to Pay" screen
  if (currentScreen === 'howToPay') {
    return <HowToPay onBack={() => setCurrentScreen('menu')} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white pb-32 font-sans select-none">
      <div className="px-5 pt-8">
        <h1 className="text-2xl font-black italic tracking-tighter mb-6">Settings</h1>
        
        {/* Settings List */}
        <div className="flex flex-col">
          
          {/* 1. Edit Profile */}
          <div 
            onClick={() => {
              toast.info('Profile editing is managed in your main profile screen');
            }} 
            style={{ 
              background: 'none', 
              borderBottom: '1px solid #1A1A1A', 
              padding: '16px 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 14, 
              cursor: 'pointer' 
            }}
            className="group active:opacity-80 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-[#A1A1AA] border border-[#222222] flex items-center justify-center flex-shrink-0">
              <User size={18} />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-[15px]">Edit Profile</div>
              <p className="text-[#A1A1AA] text-xs mt-0.5">Update your personal details & contacts</p>
            </div>
            <ChevronRight size={18} className="text-[#A1A1AA]" />
          </div>

          {/* 2. Shop Settings */}
          <div 
            onClick={() => {
              navigate('/edit-shop');
            }} 
            style={{ 
              background: 'none', 
              borderBottom: '1px solid #1A1A1A', 
              padding: '16px 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 14, 
              cursor: 'pointer' 
            }}
            className="group active:opacity-80 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-[#A1A1AA] border border-[#222222] flex items-center justify-center flex-shrink-0">
              <GearIcon size={18} />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-[15px]">Shop Settings</div>
              <p className="text-[#A1A1AA] text-xs mt-0.5">Manage shop name, logo & domain info</p>
            </div>
            <ChevronRight size={18} className="text-[#A1A1AA]" />
          </div>

          {/* 3. Separator */}
          <div className="h-[1px] bg-[#1A1A1A] my-3 w-full" />

          {/* 4. How to Pay (NEW) */}
          <div 
            onClick={() => setCurrentScreen('howToPay')}
            style={{ 
              background: 'none', 
              borderBottom: '1px solid #1A1A1A', 
              padding: '16px 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 14, 
              cursor: 'pointer' 
            }}
            className="group active:opacity-80 transition-all"
          >
            <div 
              style={{
                background: 'rgba(198,255,0,0.08)',
                border: '1px solid rgba(198,255,0,0.15)'
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <span className="text-[18px] leading-none">💸</span>
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <div className="text-white font-bold text-[15px] flex items-center">
                  How to Pay
                  {isUrgent && (
                    <span 
                      style={{ 
                        background: 'rgba(239,68,68,0.1)', 
                        border: '1px solid rgba(239,68,68,0.2)' 
                      }} 
                      className="rounded-full px-2 py-0.5 text-[#EF4444] text-[11px] font-bold ml-2 select-none"
                    >
                      Pay now
                    </span>
                  )}
                </div>
                <p className="text-[#A1A1AA] text-xs mt-0.5">EcoCash payment guide</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#A1A1AA]" />
          </div>

          {/* 5. Privacy & Terms */}
          <div 
            onClick={() => {
              toast.info('Merchant terms and compliance agreements are active');
            }}
            style={{ 
              background: 'none', 
              borderBottom: '1px solid #1A1A1A', 
              padding: '16px 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 14, 
              cursor: 'pointer' 
            }}
            className="group active:opacity-80 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-[#A1A1AA] border border-[#222222] flex items-center justify-center flex-shrink-0">
              <FileText size={18} />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-[15px]">Privacy & Terms</div>
              <p className="text-[#A1A1AA] text-xs mt-0.5">Read compliance guidelines & legal policies</p>
            </div>
            <ChevronRight size={18} className="text-[#A1A1AA]" />
          </div>

          {/* 6. Separator */}
          <div className="h-[1px] bg-[#1A1A1A] my-3 w-full" />

          {/* 7. Log Out */}
          <div 
            onClick={handleSignOut}
            style={{ 
              background: 'none', 
              borderBottom: '1px solid #1A1A1A', 
              padding: '16px 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 14, 
              cursor: 'pointer' 
            }}
            className="group active:opacity-80 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center flex-shrink-0">
              <LogOut size={18} />
            </div>
            <div className="flex-1">
              <div className="text-[#EF4444] font-bold text-[15px]">Log Out</div>
              <p className="text-[#EF4444]/70 text-xs mt-0.5">Sign out of your merchant node securely</p>
            </div>
            <ChevronRight size={18} className="text-[#EF4444]/70" />
          </div>

        </div>

        <div className="pt-10 text-center">
          <p className="text-secondary-text text-[10px] font-mono">ThreadZW Terminal v2.1.0-Production</p>
          <p className="text-secondary-text text-[10px] font-mono mt-1">© 2024 Operations Node Zimbabwe</p>
        </div>
      </div>

      {/* Nav Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0B0B0B] border-t border-[#151515] z-50 flex items-center pb-safe">
        <div className="flex items-center justify-around w-full px-4 gap-2">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all text-[#A1A1AA] hover:text-white"
          >
            <Home size={22} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/inventory')}
            className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all text-[#A1A1AA] hover:text-white"
          >
            <Package size={22} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Products</span>
          </button>
          <button 
            onClick={() => navigate('/analytics')}
            className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all text-[#A1A1AA] hover:text-white"
          >
            <BarChart3 size={22} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Analytics</span>
          </button>
          <button 
            className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all text-neon"
          >
            <GearIcon size={22} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
