import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Package, BarChart3, Settings as SettingsIcon, ShoppingBag,
  LogOut, Shield, ChevronRight, User, Settings as GearIcon,
  FileText, Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { getShopStatus } from '../utils/shopStatus';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const togglePublishState = async () => {
    if (!shop) return;
    const nextIsLive = !shop.is_live;
    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_live: nextIsLive })
        .eq('id', shop.id);
      
      if (error) throw error;

      const updatedShop = { ...shop, is_live: nextIsLive };
      setShop(updatedShop);
      localStorage.setItem(`shop_${shop.owner_id}`, JSON.stringify(updatedShop));
      localStorage.setItem('threadzw_shop', JSON.stringify(updatedShop));
      
      toast.success(nextIsLive ? 'Shop published successfully! 🚀' : 'Shop paused successfully.');
    } catch (err) {
      console.error('Error updating shop live state:', err);
      toast.error('Failed to update shop status.');
    }
  };

  const statusObj = { status: 'free', daysLeft: 999 };
  const daysLeft = 999;
  const isUrgent = false;

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon border-t-transparent animate-spin" />
      </div>
    );
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
              navigate('/profile');
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

          {/* Shop Visibility Switch */}
          <div 
            onClick={togglePublishState}
            style={{ 
              background: 'none', 
              borderBottom: '1px solid #1A1A1A', 
              padding: '16px 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 14, 
              cursor: 'pointer' 
            }}
            className="group active:opacity-80 transition-all select-none"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${shop?.is_live ? 'bg-[#c8ff00]/10 text-[#c8ff00]' : 'bg-[#EF4444]/15 text-[#EF4444]'}`}>
              <Globe size={18} />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-[15px]">Shop Visibility</div>
              <p className="text-[#A1A1AA] text-xs mt-0.5">
                Current status: <span className={shop?.is_live ? 'text-[#c8ff00] font-bold' : 'text-[#EF4444] font-bold'}>{shop?.is_live ? 'LIVE (Tap to Paused)' : 'OFFLINE (Tap to publish)'}</span>
              </p>
            </div>
            <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${shop?.is_live ? 'bg-[#c8ff00]' : 'bg-zinc-800'}`}>
              <div className={`w-5 h-5 rounded-full bg-black transition-transform duration-200 ${shop?.is_live ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
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

          {/* 6. Help & Support */}
          <div 
            onClick={() => {
              navigate('/support');
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
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-sky-400 border border-[#222222] flex items-center justify-center flex-shrink-0">
              <Shield size={18} />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-[15px]">Help & Support</div>
              <p className="text-[#A1A1AA] text-xs mt-0.5">Read FAQs, log tickets & contact support</p>
            </div>
            <ChevronRight size={18} className="text-[#A1A1AA]" />
          </div>

          {/* 6b. Separator */}
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
          <p className="text-secondary-text text-[10px] font-mono"><span className="threadzw-wordmark text-[10px] uppercase">ThreadZW</span> Terminal v2.1.0-Production</p>
          <p className="text-secondary-text text-[10px] font-mono mt-1">© 2024 Operations Node Zimbabwe</p>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
};
