import React, { useState, useEffect } from 'react';
import { Settings, ShoppingBag, CreditCard, Heart, Award, LogOut, ChevronRight, Share2, Bookmark, Plus, Shield, BarChart3, Tag, Receipt, X, Bell, Trophy, ArrowRight, Music, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { supabase } from '../lib/supabase';
import { PERSONALITY_RESULTS } from '../data/mockData';
import { motion, AnimatePresence } from 'motion/react';

import { Avatar } from '../components/Avatar';

const MUSIFY_URL = 'https://muzify.com/';

const QuickAccessButton: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  isPrimary?: boolean;
}> = ({ icon, label, onClick, isPrimary }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all ${
      isPrimary ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
    }`}
  >
    {icon}
    <span className="text-[10px] font-mono uppercase tracking-tighter font-bold">{label}</span>
  </button>
);

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut, session, loading: loadingAuth } = useAuth();
  const { userShop, loading: loadingInventory, setBuyerFlowState, unreadNotificationCount, handleOpenShopCentre } = useInventory();
  const [showShopPopup, setShowShopPopup] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  const [communityCards, setCommunityCards] = useState<any[]>([]);

  // Safety timeout to prevent stuck loading state
  useEffect(() => {
    if (loadingAuth || loadingInventory) {
      const timer = setTimeout(() => setForceShow(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [loadingAuth, loadingInventory]);

  useEffect(() => {
    const fetchCards = async () => {
      const { data } = await supabase.from('community_cards').select('*');
      if (data) setCommunityCards(data);
    };
    fetchCards();
  }, []);

  const getCardImage = (key: string) => {
    return communityCards.find(c => c.card_key === key)?.image_url;
  };

  if ((loadingAuth || loadingInventory) && !forceShow) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="spinner-32" />
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest animate-pulse">Loading Profile...</p>
        <style>{`
          .spinner-32 {
            width: 32px;
            height: 32px;
            border: 3px solid #111;
            border-top-color: #FF2D78;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6 min-h-[60vh]">
        <div className="w-20 h-20 bg-[#111] border border-[#222] rounded-full flex items-center justify-center text-4xl shadow-xl">👤</div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white">Not signed in</h1>
          <p className="text-sm text-[#888]">Sign in to view and manage your profile</p>
        </div>
        <button 
          onClick={() => window.location.href = '/auth'}
          className="px-10 py-4 bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold rounded-full shadow-lg shadow-[#FF2D78]/20 active:scale-95 transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  const personality = PERSONALITY_RESULTS.find(p => p.type === profile?.personality_type) || PERSONALITY_RESULTS[0];
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '2024';
    const date = new Date(dateString);
    return date.getFullYear();
  };

  const menuItems = [
    { label: 'Notifications', icon: (
      <div className="relative">
        <Bell size={18} />
        {unreadNotificationCount > 0 && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF2D78] rounded-full border border-black" />
        )}
      </div>
    ), color: 'text-blue-400', onClick: () => navigate('/notifications') },
    { label: 'Affiliate Earnings', icon: <Share2 size={18} />, color: 'text-purple-400', onClick: () => {} },
    { label: 'Saved Items', icon: <Bookmark size={18} />, color: 'text-[#FF2D78]', onClick: () => navigate('/saved-items') },
    { label: 'Paynow Wallet', icon: <CreditCard size={18} />, color: 'text-secondary', onClick: () => {} },
    { label: 'Settings', icon: <Settings size={18} />, color: 'text-[#888]', onClick: () => navigate('/profile/edit') },
  ];

  return (
    <div className="flex-1 flex flex-col bg-black min-h-screen relative font-sans">
      {/* Header */}
      <div className="p-6 pt-12 flex flex-col items-center gap-4">
        <div className="relative group">
          <Avatar 
            url={profile?.avatar_url} 
            size={112} 
            ring 
            className="border-4 border-black" 
          />
          <button 
            onClick={() => navigate('/profile/edit')}
            className="absolute bottom-1 right-1 w-8 h-8 bg-[#FF2D78] rounded-full flex items-center justify-center border-2 border-black shadow-lg"
          >
            <Settings size={14} className="text-white" />
          </button>
        </div>

        <div className="text-center w-full max-w-[280px]">
          <div className="h-8 flex items-center justify-center">
            {profile ? (
              <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
            ) : (
              <div className="w-32 h-4 bg-white/5 rounded-full animate-pulse" />
            )}
          </div>
          <div className="h-5 flex items-center justify-center mt-1 px-4">
            {profile ? (
              <div className="flex flex-col items-center">
                <p className="text-[12px] font-bold text-[#888] uppercase tracking-widest leading-tight">
                  @{profile.handle} • Member since {formatDate(profile.created_at)}
                </p>
                <p className="text-[10px] text-[#555] font-mono mt-0.5">{profile.email}</p>
              </div>
            ) : (
              <div className="w-48 h-3 bg-white/5 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8 pb-32">
        {/* Personality Card */}
        <div className="bg-gradient-to-br from-[#9B27AF] to-[#FF2D78] rounded-[24px] p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Aesthetic Identity</span>
              <h2 className="text-3xl font-pacifico text-white mt-1">{personality.type}</h2>
            </div>
            <span className="text-4xl">{personality.icon}</span>
          </div>
          <p className="text-sm text-white/90 leading-relaxed mb-6 font-medium italic">
            "{personality.description}"
          </p>
          <button 
            onClick={() => navigate('/quiz')}
            className="w-full py-3.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[12px] font-bold text-white hover:bg-white/30 transition-all uppercase tracking-widest"
          >
            Update Identity
          </button>
        </div>

        {/* Persistent Shop Centre Button */}
        {session && (
          <button 
            onClick={() => handleOpenShopCentre(navigate)}
            className="w-full h-[52px] bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] rounded-full flex items-center justify-center gap-2 shadow-lg shadow-[#FF2D78]/20 active:scale-[0.98] transition-all"
          >
            <span className="text-[18px]">🏪</span>
            <span className="text-white font-bold text-[15px]">Shop Centre</span>
          </button>
        )}

        {/* Shop Section */}
        {profile?.has_shop ? (
          <div className="bg-[#111] rounded-[24px] border border-[#222] p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#FF2D7815] flex items-center justify-center text-2xl border border-[#FF2D7830]">
                  🏪
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[17px] font-bold text-white">{profile.shop_name}</h3>
                  <span className="text-[10px] font-bold text-[#FF2D78] uppercase tracking-widest">thread.zw/{profile.handle}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22c55e10] rounded-full border border-[#22c55e20]">
                <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <QuickAccessButton 
                icon={<BarChart3 size={20} />} 
                label="Analytics" 
                onClick={() => navigate('/dashboard')} 
              />
              <QuickAccessButton 
                icon={<Tag size={20} />} 
                label="Storefront" 
                onClick={() => userShop && navigate(`/shop/${userShop.id}`)} 
              />
              <QuickAccessButton 
                icon={<Receipt size={20} />} 
                label="Orders" 
                onClick={() => navigate('/orders')} 
              />
              <QuickAccessButton 
                icon={<Plus size={20} />} 
                label="List Item" 
                onClick={() => navigate('/new-listing')}
                isPrimary
              />
            </div>

            <button 
              onClick={() => handleOpenShopCentre(navigate)}
              className="w-full py-4 border border-[#222] rounded-xl text-[14px] font-bold text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              Shop Control Centre <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowShopPopup(true)}
            className="w-full bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-[#222] text-white font-bold py-6 rounded-[24px] shadow-xl flex items-center justify-center gap-3 text-[17px] active:scale-[0.98] transition-all"
          >
            <span className="text-2xl">🏪</span> Start Selling on Thread
          </button>
        )}

        {/* You Might Like Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-5 h-5 rounded-full bg-linear-to-tr from-[#FF2D78] to-[#9C27B0] flex items-center justify-center">
              <Users size={10} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight font-syne uppercase tracking-wider">You might like</span>
          </div>
          
          <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-6 px-6">
            {/* How Fly Card */}
            <motion.div 
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/quiz')}
              className="w-[240px] aspect-[4/3] rounded-[20px] overflow-hidden shrink-0 relative bg-[#111] border border-white/5 active:scale-95 transition-all cursor-pointer"
            >
              <div className="absolute inset-0">
                 {getCardImage('how_fly') ? (
                   <img src={getCardImage('how_fly')} className="w-full h-full object-cover blur-[2px] brightness-[0.5] scale-105" />
                 ) : (
                   <div className="w-full h-full bg-linear-to-br from-[#1a0a2a] to-[#2a0a1a]" />
                 )}
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold text-[15px]">How Fly Are You?</h3>
                <p className="text-white/70 text-[11px] mt-0.5">Discover your fashion persona</p>
              </div>
            </motion.div>

            {/* Musify Card */}
            <motion.div 
              whileTap={{ scale: 0.97 }}
              onClick={() => window.open(MUSIFY_URL, '_blank')}
              className="w-[240px] aspect-[4/3] rounded-[20px] overflow-hidden shrink-0 relative bg-[#111] border border-white/5 active:scale-95 transition-all cursor-pointer"
            >
               <div className="absolute inset-0">
                 {getCardImage('musify') ? (
                   <img src={getCardImage('musify')} className="w-full h-full object-cover blur-[2px] brightness-[0.5] scale-105" />
                 ) : (
                   <div className="w-full h-full bg-linear-to-br from-[#0a1a0a] to-[#0a0a1a]" />
                 )}
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                 <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="bg-green-500/20 border border-green-500/30 rounded-full px-1.5 py-0.5">
                      <span className="text-green-500 text-[8px] font-bold">LIVE</span>
                    </div>
                    <Music size={12} className="text-white" />
                 </div>
                 <h3 className="text-white font-bold text-[15px]">Musify</h3>
                 <p className="text-white/70 text-[11px] mt-0.5">Quick song quiz for your personality</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-[#111] rounded-[24px] overflow-hidden border border-[#222]">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-4 p-5 hover:bg-white/5 transition-all active:bg-white/10 group ${
                i !== menuItems.length - 1 ? 'border-b border-[#222]' : ''
              }`}
            >
              <div className={`p-2.5 rounded-xl bg-black/50 ${item.color} border border-white/5`}>
                {item.icon}
              </div>
              <span className="flex-1 text-left text-[15px] font-bold text-[#eee]">{item.label}</span>
              <ChevronRight size={18} className="text-[#444] group-hover:text-white transition-all" />
            </button>
          ))}
        </div>

        <button 
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full flex items-center justify-center gap-3 bg-[#ef444410] hover:bg-[#ef444420] text-[#ef4444] transition-all py-5 rounded-[24px] border border-[#ef444420] font-bold"
        >
          <LogOut size={20} />
          <span className="uppercase tracking-widest text-[13px]">Sign Out</span>
        </button>

        <p className="text-center text-[10px] text-[#444] font-bold uppercase tracking-widest pb-4">
          Thread ZW v2.0 • Proudly Zimbabwean 🇿🇼
        </p>

        {/* Auth Debug Panel (Hidden/Small) */}
        <div className="mt-8 border-t border-white/5 pt-8 flex flex-col items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-mono text-[#444] uppercase tracking-[0.2em]">Auth Debug Centre</p>
          
          <button
            onClick={() => {
              // Sign out first
              supabase.auth.signOut().then(() => {
                // Clear ALL storage variants
                const keys = [
                  'thread_onboarding_complete',
                  'thread_town_selected',
                  'thread_style_picked',
                  'thread_has_account',
                  'thread_user_town',
                  'onboarding_slides_done',
                  'style_picked',
                  'thread_selected_town',
                  'buyerFlowState',
                  'communityScreen'
                ];
                keys.forEach(k => localStorage.removeItem(k));
                localStorage.removeItem('isGuest');
                
                // Hard reload to reset entire app state
                window.location.href = '/';
              }).catch(() => {
                window.location.href = '/';
              });
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#333',
              fontSize: 11,
              fontFamily: 'monospace',
              cursor: 'pointer',
              padding: '8px',
              display: 'block',
              margin: '0 auto',
            }}
          >
            Reset Onboarding (Dev)
          </button>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${session ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[9px] font-mono text-[#555] uppercase">{session ? 'Supabase ACTIVE' : 'Supabase INACTIVE'}</span>
            </div>
            <p className="text-[8px] font-mono text-[#333] uppercase">UID: {session?.user?.id || 'null'}</p>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignOutConfirm(false)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[201] bg-[#0d0d0d] rounded-t-[32px] p-8 pb-12 border-t border-[#222]"
            >
              <div className="w-12 h-1 bg-[#333] rounded-full mx-auto mb-8" />
              <div className="text-center space-y-4 mb-8">
                <div className="w-20 h-20 bg-[#ef444415] rounded-full flex items-center justify-center mx-auto mb-2">
                  <LogOut size={32} className="text-[#ef4444]" />
                </div>
                <h2 className="text-white text-2xl font-bold">Sign Out?</h2>
                <p className="text-[#888] text-[15px]">You'll need to sign back in to access your shop and saved items.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => signOut()}
                  className="w-full h-14 bg-[#ef4444] text-white font-bold rounded-full text-[16px] active:scale-95 transition-all shadow-lg shadow-[#ef4444]/20"
                >
                  Yes, Sign Out
                </button>
                <button 
                  onClick={() => setShowSignOutConfirm(false)}
                  className="w-full h-14 bg-[#111] text-white font-bold rounded-full text-[16px] border border-[#222]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Shop Creation Popup (Same as original but styled consistently) */}
      <AnimatePresence>
        {showShopPopup && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShopPopup(false)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[380px] bg-[#0d0d0d] border border-[#222] rounded-[32px] p-8 z-[201] flex flex-col items-center text-center gap-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-[#FF2D7815] rounded-full flex items-center justify-center text-4xl mb-2 border border-[#FF2D7830]">
                🏪
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white italic">Open Your Shop</h3>
                <p className="text-sm text-[#888] leading-relaxed">
                  Start selling your drip to thousands of buyers across Zimbabwe today.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => {
                    setShowShopPopup(false);
                    handleOpenShopCentre(navigate);
                  }}
                  className="w-full h-14 bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold rounded-full shadow-lg shadow-[#FF2D78]/20 flex items-center justify-center gap-2"
                >
                  Launch Shop →
                </button>
                <button 
                  onClick={() => setShowShopPopup(false)}
                  className="w-full h-14 bg-[#111] text-[#666] font-bold rounded-full border border-[#222]"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
