import React, { useState, useEffect } from 'react';
import { Settings, ShoppingBag, CreditCard, Heart, Award, LogOut, ChevronRight, Share2, Bookmark, Plus, Shield, BarChart3, Tag, Receipt, X, Bell, Trophy, ArrowRight, Music, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { supabase } from '../lib/supabase';
import { PERSONALITY_RESULTS } from '../data/mockData';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../App';

import { Avatar } from '../components/Avatar';

const MUSIFY_URL = 'https://muzify.com/';

const QuickAccessButton: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  isPrimary?: boolean;
}> = ({ icon, label, onClick, isPrimary }) => {
  const t = useTheme();
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all ${
        isPrimary ? 'text-white shadow-lg' : 'hover:bg-white/5'
      }`}
      style={{ 
        background: isPrimary ? t.accent : t.bg_card_2, 
        color: isPrimary ? 'white' : t.text_tertiary,
        boxShadow: isPrimary ? t.shadow : 'none'
      }}
    >
      {icon}
      <span className="text-[10px] font-mono uppercase tracking-tighter font-bold">{label}</span>
    </button>
  );
};

export const Profile: React.FC = () => {
  const t = useTheme();
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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4" style={{ background: t.bg_primary }}>
        <div className="spinner-32" />
        <p className="text-[10px] font-mono uppercase tracking-widest animate-pulse" style={{ color: t.text_tertiary }}>Loading Profile...</p>
        <style>{`
          .spinner-32 {
            width: 32px;
            height: 32px;
            border: 3px solid ${t.bg_card};
            border-top-color: ${t.accent};
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6 min-h-[60vh]" style={{ background: t.bg_primary }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl border" style={{ background: t.bg_card, borderColor: t.border_secondary }}>👤</div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" style={{ color: t.text_primary }}>Not signed in</h1>
          <p className="text-sm font-sans" style={{ color: t.text_tertiary }}>Sign in to view and manage your profile</p>
        </div>
        <button 
          onClick={() => window.location.href = '/auth'}
          className="px-10 py-4 text-white font-bold rounded-full shadow-lg active:scale-95 transition-all"
          style={{ background: t.gradient, boxShadow: t.shadow }}
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
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border" style={{ background: t.accent, borderColor: t.bg_primary }} />
        )}
      </div>
    ), color: '#3b82f6', onClick: () => navigate('/notifications') },
    { label: 'Affiliate Earnings', icon: <Share2 size={18} />, color: t.accent, onClick: () => {} },
    { label: 'Saved Items', icon: <Bookmark size={18} />, color: t.accent, onClick: () => navigate('/saved-items') },
    { label: 'Paynow Wallet', icon: <CreditCard size={18} />, color: t.text_secondary, onClick: () => {} },
    { label: 'Settings', icon: <Settings size={18} />, color: t.text_tertiary, onClick: () => navigate('/profile/edit') },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen relative font-sans" style={{ background: t.bg_primary }}>
      {/* Header */}
      <div className="p-6 pt-12 flex flex-col items-center gap-4">
        <div className="relative group">
          <Avatar 
            url={profile?.avatar_url} 
            size={112} 
            ring 
            className="border-4" 
            style={{ borderColor: t.bg_primary }}
          />
          <button 
            onClick={() => navigate('/profile/edit')}
            className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg"
            style={{ background: t.accent, borderColor: t.bg_primary }}
          >
            <Settings size={14} className="text-white" />
          </button>
        </div>

        <div className="text-center w-full max-w-[280px]">
          <div className="h-8 flex items-center justify-center">
            {profile ? (
              <h1 className="text-2xl font-bold" style={{ color: t.text_primary }}>{profile.display_name}</h1>
            ) : (
              <div className="w-32 h-4 rounded-full animate-pulse" style={{ background: t.bg_card }} />
            )}
          </div>
          <div className="h-5 flex items-center justify-center mt-1 px-4">
            {profile ? (
              <div className="flex flex-col items-center">
                <p className="text-[12px] font-bold uppercase tracking-widest leading-tight" style={{ color: t.text_secondary }}>
                  @{profile.handle} • Member since {formatDate(profile.created_at)}
                </p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: t.text_tertiary }}>{profile.email}</p>
              </div>
            ) : (
              <div className="w-48 h-3 rounded-full animate-pulse" style={{ background: t.bg_card }} />
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8 pb-32">
        {/* Personality Card */}
        <div className="rounded-[24px] p-6 relative overflow-hidden shadow-xl" style={{ background: t.gradient }}>
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
            className="w-full h-[52px] rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
            style={{ background: t.gradient, boxShadow: t.shadow }}
          >
            <span className="text-[18px]">🏪</span>
            <span className="text-white font-bold text-[15px]">Shop Centre</span>
          </button>
        )}

        {/* Shop Section */}
        {profile?.has_shop ? (
          <div className="rounded-[24px] border p-6 space-y-6 shadow-xl" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border" style={{ background: `${t.accent}15`, borderColor: `${t.accent}30` }}>
                  🏪
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[17px] font-bold" style={{ color: t.text_primary }}>{profile.shop_name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.accent }}>thread.zw/{profile.handle}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ background: `${t.green}10`, borderColor: `${t.green}20` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.green }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.green }}>Active</span>
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
              className="w-full py-4 border rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2"
              style={{ borderColor: t.border_secondary, color: t.text_primary }}
            >
              Shop Control Centre <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowShopPopup(true)}
            className="w-full border font-bold py-6 rounded-[24px] shadow-xl flex items-center justify-center gap-3 text-[17px] active:scale-[0.98] transition-all"
            style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary }}
          >
            <span className="text-2xl">🏪</span> Start Selling on Thread
          </button>
        )}

        {/* You Might Like Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: t.gradient }}>
              <Users size={10} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight font-syne uppercase tracking-wider" style={{ color: t.text_primary }}>You might like</span>
          </div>
          
          <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-6 px-6">
            {/* How Fly Card */}
            <motion.div 
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/quiz')}
              className="w-[240px] aspect-[4/3] rounded-[20px] overflow-hidden shrink-0 relative border active:scale-95 transition-all cursor-pointer"
              style={{ background: t.bg_card, borderColor: t.border_secondary }}
            >
              <div className="absolute inset-0">
                 {getCardImage('how_fly') ? (
                    <img src={getCardImage('how_fly')} className="w-full h-full object-cover blur-[2px] brightness-[0.5] scale-105 shadow-2l" />
                 ) : (
                    <div className="w-full h-full" style={{ background: t.gradient, opacity: 0.2 }} />
                 )}
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="text-white font-bold text-[15px]">How Fly Are You?</h2>
                <p className="text-white/70 text-[11px] mt-0.5">Discover your fashion persona</p>
              </div>
            </motion.div>

            {/* Musify Card */}
            <motion.div 
              whileTap={{ scale: 0.97 }}
              onClick={() => window.open(MUSIFY_URL, '_blank')}
              className="w-[240px] aspect-[4/3] rounded-[20px] overflow-hidden shrink-0 relative border active:scale-95 transition-all cursor-pointer"
              style={{ background: t.bg_card, borderColor: t.border_secondary }}
            >
               <div className="absolute inset-0">
                 {getCardImage('musify') ? (
                    <img src={getCardImage('musify')} className="w-full h-full object-cover blur-[2px] brightness-[0.5] scale-105" />
                 ) : (
                    <div className="w-full h-full" style={{ background: t.gradient, opacity: 0.2 }} />
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
                 <h2 className="text-white font-bold text-[15px]">Musify</h2>
                 <p className="text-white/70 text-[11px] mt-0.5">Quick song quiz for your personality</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Menu */}
        <div className="rounded-[24px] overflow-hidden border" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-4 p-5 transition-all active:bg-white/5 group ${
                i !== menuItems.length - 1 ? 'border-b' : ''
              }`}
              style={{ borderColor: t.border_secondary }}
            >
              <div 
                className={`p-2.5 rounded-xl border`} 
                style={{ background: t.bg_primary, borderColor: t.border_secondary, color: typeof item.color === 'string' && item.color.startsWith('#') ? item.color : undefined }}
              >
                {item.icon}
              </div>
              <span className="flex-1 text-left text-[15px] font-bold" style={{ color: t.text_primary }}>{item.label}</span>
              <ChevronRight size={18} className="transition-all" style={{ color: t.text_tertiary }} />
            </button>
          ))}
        </div>

        <button 
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full flex items-center justify-center gap-3 transition-all py-5 rounded-[24px] border font-bold"
          style={{ background: t.red_bg, borderColor: t.red_bg, color: t.red }}
        >
          <LogOut size={20} />
          <span className="uppercase tracking-widest text-[13px]">Sign Out</span>
        </button>

        <p className="text-center text-[10px] font-bold uppercase tracking-widest pb-4" style={{ color: t.text_tertiary }}>
          Thread ZW v2.0 • Proudly Zimbabwean 🇿🇼
        </p>

        {/* Auth Debug Panel (Hidden/Small) */}
        <div className="mt-8 border-t pt-8 flex flex-col items-center gap-4 opacity-50 hover:opacity-100 transition-opacity" style={{ borderColor: t.border_secondary }}>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: t.text_tertiary }}>Auth Debug Centre</p>
          
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
              color: t.text_tertiary,
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
              <span className="text-[9px] font-mono uppercase" style={{ color: t.text_tertiary }}>{session ? 'Supabase ACTIVE' : 'Supabase INACTIVE'}</span>
            </div>
            <p className="text-[8px] font-mono uppercase" style={{ color: t.text_tertiary }}>UID: {session?.user?.id || 'null'}</p>
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
              className="fixed inset-0 z-[200] backdrop-blur-md"
              style={{ background: t.overlay }}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[201] rounded-t-[32px] p-8 pb-12 border-t shadow-2xl"
              style={{ background: t.bg_primary, borderColor: t.border_secondary }}
            >
              <div className="w-12 h-1 rounded-full mx-auto mb-8" style={{ background: t.border_secondary }} />
              <div className="text-center space-y-4 mb-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: t.red_bg }}>
                  <LogOut size={32} style={{ color: t.red }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: t.text_primary }}>Sign Out?</h2>
                <p className="text-[15px]" style={{ color: t.text_tertiary }}>You'll need to sign back in to access your shop and saved items.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => signOut()}
                  className="w-full h-14 text-white font-bold rounded-full text-[16px] active:scale-95 transition-all shadow-lg"
                  style={{ background: t.red, boxShadow: t.shadow }}
                >
                  Yes, Sign Out
                </button>
                <button 
                  onClick={() => setShowSignOutConfirm(false)}
                  className="w-full h-14 font-bold rounded-full text-[16px] border"
                  style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_primary }}
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
              className="fixed inset-0 z-[200] backdrop-blur-sm"
              style={{ background: t.overlay }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[380px] border rounded-[32px] p-8 z-[201] flex flex-col items-center text-center gap-6 shadow-2xl"
              style={{ background: t.bg_primary, borderColor: t.border_secondary }}
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-2 border" style={{ background: `${t.accent}15`, borderColor: `${t.accent}30` }}>
                🏪
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold italic" style={{ color: t.text_primary }}>Open Your Shop</h3>
                <p className="text-sm font-sans leading-relaxed" style={{ color: t.text_secondary }}>
                  Start selling your drip to thousands of buyers across Zimbabwe today.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => {
                    setShowShopPopup(false);
                    handleOpenShopCentre(navigate);
                  }}
                  className="w-full h-14 text-white font-bold rounded-full shadow-lg flex items-center justify-center gap-2"
                  style={{ background: t.gradient, boxShadow: t.shadow }}
                >
                  Launch Shop →
                </button>
                <button 
                  onClick={() => setShowShopPopup(false)}
                  className="w-full h-14 font-bold rounded-full border"
                  style={{ background: t.bg_card, borderColor: t.border_secondary, color: t.text_tertiary }}
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
