import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Package, BarChart3, Settings as SettingsIcon, ShoppingBag,
  LogOut, Shield, ChevronRight, User, Settings as GearIcon,
  FileText, Globe, Activity, CheckCircle2, AlertCircle, Percent
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { getShopStatus } from '../utils/shopStatus';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { runStoreRouterTestSuite, TestResult } from '../utils/storeRouterTestSuite';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [conversionRate, setConversionRate] = useState<number>(() => {
    return Number(localStorage.getItem('threadzw_conversion_rate') || '30');
  });

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
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-zinc-800 pb-32 font-sans select-none text-left">
      <div className="max-w-md mx-auto px-5 pt-8">
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight leading-none uppercase mb-6">Settings</h1>
        
        {/* Settings List */}
        <div className="flex flex-col bg-white border border-zinc-150/80 rounded-3xl p-4 shadow-sm space-y-1">
          
          {/* 1. Edit Profile */}
          <div 
            onClick={() => {
              navigate('/profile');
            }} 
            className="group active:opacity-80 transition-all flex items-center gap-3.5 py-3 cursor-pointer border-b border-zinc-100 last:border-none"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-50 text-zinc-500 border border-zinc-200/40 flex items-center justify-center flex-shrink-0">
              <User size={18} />
            </div>
            <div className="flex-1">
              <div className="text-zinc-900 font-bold text-[14px]">Edit Profile</div>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium">Update your personal details & contacts</p>
            </div>
            <ChevronRight size={16} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 2. Shop Settings */}
          <div 
            onClick={() => {
              navigate('/edit-shop');
            }} 
            className="group active:opacity-80 transition-all flex items-center gap-3.5 py-3 cursor-pointer border-b border-zinc-100 last:border-none"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-50 text-zinc-500 border border-zinc-200/40 flex items-center justify-center flex-shrink-0">
              <GearIcon size={18} />
            </div>
            <div className="flex-1">
              <div className="text-zinc-900 font-bold text-[14px]">Shop Settings</div>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium">Manage shop name, logo & domain info</p>
            </div>
            <ChevronRight size={16} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Shop Visibility Switch */}
          <div 
            onClick={togglePublishState}
            className="group active:opacity-80 transition-all flex items-center gap-3.5 py-3 cursor-pointer border-b border-zinc-100 last:border-none select-none"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${shop?.is_live ? 'bg-[#C6FF00]/15 border-[#C6FF00]/40 text-zinc-900' : 'bg-red-50 border-red-100 text-red-500'}`}>
              <Globe size={18} />
            </div>
            <div className="flex-1">
              <div className="text-zinc-900 font-bold text-[14px]">Shop Visibility</div>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium">
                Status: <span className={shop?.is_live ? 'text-zinc-900 font-black' : 'text-red-500 font-bold'}>{shop?.is_live ? 'LIVE' : 'PAUSED'}</span>
              </p>
            </div>
            <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${shop?.is_live ? 'bg-[#C6FF00]' : 'bg-zinc-200'}`}>
              <div className="w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm" style={{ transform: shop?.is_live ? 'translateX(16px)' : 'translateX(0px)' }} />
            </div>
          </div>

          {/* 5. Privacy & Terms */}
          <div 
            onClick={() => {
              toast.info('Merchant terms and compliance agreements are active');
            }}
            className="group active:opacity-80 transition-all flex items-center gap-3.5 py-3 cursor-pointer border-b border-zinc-100 last:border-none"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-50 text-zinc-500 border border-zinc-200/40 flex items-center justify-center flex-shrink-0">
              <FileText size={18} />
            </div>
            <div className="flex-1">
              <div className="text-zinc-900 font-bold text-[14px]">Privacy & Terms</div>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium">Read compliance guidelines & legal policies</p>
            </div>
            <ChevronRight size={16} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 6. Help & Support */}
          <div 
            onClick={() => {
              navigate('/support');
            }} 
            className="group active:opacity-80 transition-all flex items-center gap-3.5 py-3 cursor-pointer border-b border-zinc-100 last:border-none"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-50 text-zinc-500 border border-zinc-200/40 flex items-center justify-center flex-shrink-0">
              <Shield size={18} />
            </div>
            <div className="flex-1">
              <div className="text-zinc-900 font-bold text-[14px]">Help & Support</div>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium">Read FAQs, log tickets & contact support</p>
            </div>
            <ChevronRight size={16} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

        </div>

        {/* Business Metrics Configuration Section */}
        <div className="h-4" />
        <div className="bg-white border border-zinc-150/80 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200/40 flex items-center justify-center text-zinc-800">
              <Percent size={15} className="stroke-[3.5px] text-zinc-700" />
            </div>
            <div>
              <h3 className="text-zinc-900 font-bold text-[14px]">Business Metrics</h3>
              <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-mono font-bold">Sales & Conversion Rates</p>
            </div>
          </div>
          <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-4">
            Configure the estimated conversion percentage from Buyer Intent actions (WhatsApp clicks and shop direction views) to actual completed sales. This value is used to calculate Estimated Revenue throughout your merchant dashboard.
          </p>
          <div className="space-y-3.5 pt-1.5">
            <div className="flex justify-between items-center">
              <label className="text-zinc-800 text-[11px] font-black uppercase tracking-wider">
                Estimated Buyer Intent → Sale Conversion %
              </label>
              <span className="bg-[#C6FF00]/15 text-zinc-900 px-3 py-1 rounded-xl text-xs font-mono font-black border border-[#C6FF00]/30">
                {conversionRate}%
              </span>
            </div>
            <input 
              type="range"
              min="5"
              max="100"
              value={conversionRate}
              onChange={(e) => {
                const val = Number(e.target.value);
                setConversionRate(val);
                localStorage.setItem('threadzw_conversion_rate', String(val));
                toast.success(`Conversion rate set to ${val}%! Dashboard updated.`);
              }}
              className="w-full accent-zinc-900 h-2 bg-zinc-150 rounded-lg cursor-pointer appearance-none border border-zinc-200"
            />
            <div className="flex justify-between text-[9px] text-zinc-400 font-bold tracking-widest uppercase">
              <span>5% (Conservative)</span>
              <span>100% (Direct)</span>
            </div>
          </div>
        </div>

        {/* System Integrity & Routing Diagnostics Panel */}
        <div className="h-4" />
        <div className="bg-white border border-zinc-150/80 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200/40 flex items-center justify-center text-zinc-600">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="text-zinc-900 font-bold text-[14px]">System Integrity</h3>
                <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-mono font-bold">Routing Diagnostics</p>
              </div>
            </div>
            <button
              type="button"
              disabled={runningTests}
              onClick={async () => {
                setRunningTests(true);
                setTestResults(null);
                try {
                  const res = await runStoreRouterTestSuite();
                  setTestResults(res);
                  const failed = res.filter(r => !r.success);
                  if (failed.length > 0) {
                    toast.error(`${failed.length} diagnostics test(s) failed.`);
                  } else {
                    toast.success("All store routing diagnostics passed successfully! 🚀");
                  }
                } catch (err) {
                  toast.error("Diagnostics execution aborted.");
                } finally {
                  setRunningTests(false);
                }
              }}
              className="px-3.5 py-1.5 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-full hover:bg-[#C6FF00] hover:text-black transition-all active:scale-95 disabled:opacity-55 cursor-pointer"
            >
              {runningTests ? 'Running...' : 'Run Self-Tests'}
            </button>
          </div>

          {!testResults && !runningTests && (
            <p className="text-zinc-500 text-xs leading-relaxed font-medium">
              Validate store creation queries, UUID format consistency, ID-based lookups, product catalog fetching, and custom 404 resilience.
            </p>
          )}

          {runningTests && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium py-2 animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-zinc-800 border-t-transparent animate-spin" />
              Executing live system routing checks on Supabase database...
            </div>
          )}

          {testResults && (
            <div className="space-y-3 mt-3 border-t border-zinc-100 pt-3">
              {testResults.map((result, idx) => (
                <div key={idx} className="flex gap-2.5 items-start text-xs border-b border-zinc-50 pb-2.5 last:border-none last:pb-0">
                  {result.success ? (
                    <CheckCircle2 size={15} className="text-[#3ADF00] mt-0.5 flex-shrink-0 animate-bounce" />
                  ) : (
                    <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-zinc-900 leading-none">{result.testName}</div>
                    <p className="text-zinc-500 text-[11px] mt-1 leading-relaxed font-mono font-semibold whitespace-pre-wrap break-words">
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Separator card spacing */}
        <div className="h-4" />

        {/* Action card for Log out */}
        <div className="bg-white border border-zinc-150/80 rounded-3xl p-4 shadow-sm">
          {/* 7. Log Out */}
          <div 
            onClick={handleSignOut}
            className="group active:opacity-80 transition-all flex items-center gap-3.5 py-1.5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
              <LogOut size={18} />
            </div>
            <div className="flex-1">
              <div className="text-red-500 font-bold text-[14px]">Log Out</div>
              <p className="text-red-500/80 text-xs mt-0.5 font-medium">Sign out of your merchant account securely</p>
            </div>
            <ChevronRight size={16} className="text-red-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div className="pt-10 text-center">
          <p className="text-zinc-400 text-[10px] font-mono tracking-wider"><span className="text-[10px] uppercase text-zinc-900 font-bold italic mr-1">ThreadZW</span> v2.1.0-Light</p>
          <p className="text-zinc-400 text-[10px] font-mono mt-1">© 2026 Operations Node Zimbabwe</p>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
};
