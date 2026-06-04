import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, ShoppingBag, Heart, Award, LogOut, ChevronRight, Share2, 
  Bookmark, Plus, X, Bell, Trophy, ArrowRight, User, Menu, Camera, 
  Star, MapPin, Search, Edit3, HelpCircle, Info, ExternalLink, RefreshCw, Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PERSONALITY_RESULTS } from '../data/mockData';
import { ZIMBABWE_TOWNS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

// --- Types ---
interface SaveItem {
  id: string;
  created_at: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    images: string[];
    price: number;
  };
}

interface FollowItem {
  id: string;
  created_at: string;
  shop_id: string;
  shops: {
    id: string;
    name: string;
    handle: string;
    logo_url: string | null;
    avatar_url?: string | null;
    category: string;
    town: string;
    is_live: boolean;
  };
}

// --- Utils ---
const formatCount = (n: number) => {
  if (!n || n === 0) return '0';
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  }
  return n.toString();
};

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut, session, isGuest, user, updateProfile } = useAuth();
  const { 
    unreadNotificationCount, 
    shops,
    userShop
  } = useInventory();
  
  // State
  const [activeTab, setActiveTab] = useState<'saved' | 'following' | 'about'>('saved');
  const [loading, setLoading] = useState(true);
  const [savedProducts, setSavedProducts] = useState<SaveItem[]>([]);
  const [followedShops, setFollowedShops] = useState<FollowItem[]>([]);
  
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Data Fetching
  const fetchProfileData = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const [savesResult, followsResult] = await Promise.all([
        supabase
          .from('saves')
          .select('*, products(id, name, images, price)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('follows')
          .select('*, shops(id, name, handle, logo_url, category, town, is_live)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
      ]);
      
      setSavedProducts(savesResult.data || []);
      setFollowedShops(followsResult.data || []);
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) {
      fetchProfileData();
    }
  }, [isGuest, session?.user?.id]);

  // Drawer handling
  useEffect(() => {
    if (showDrawer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDrawer]);

  const closeDrawer = () => {
    setDrawerClosing(true);
    setTimeout(() => {
      setShowDrawer(false);
      setDrawerClosing(false);
    }, 230);
  };

  // Profile actions
  const handleUnfollow = async (shopId: string) => {
    if (!session?.user?.id) return;
    
    // Optimistic update
    const previous = [...followedShops];
    setFollowedShops(prev => prev.filter(f => f.shop_id !== shopId));
    
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('user_id', session.user.id)
        .eq('shop_id', shopId);
        
      if (error) throw error;
      toast.success('Unfollowed shop');
    } catch (err) {
      setFollowedShops(previous);
      toast.error('Failed to unfollow');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/${profile?.handle || user?.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Thread ZW | ${profile?.display_name || 'Profile'}`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share failed');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    }
  };

  // --- Sub-views ---

  if (isGuest) {
    return <GuestProfileView navigate={navigate} />;
  }

  const personality = PERSONALITY_RESULTS.find(p => p.id === profile?.personality_type) || PERSONALITY_RESULTS.find(p => p.type === profile?.personality_type);
  const myShop = userShop;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-cream overflow-y-auto no-scrollbar pb-32">
      {/* Drawer Overlay */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-[100] backdrop-blur-md bg-charcoal/20"
          />
        )}
      </AnimatePresence>

      {/* Side Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <SideDrawer 
            onClose={closeDrawer} 
            profile={profile} 
            isClosing={drawerClosing}
            navigate={navigate}
            unreadCount={unreadNotificationCount}
            userHasShop={!!userShop}
            onSignOut={() => {
              closeDrawer();
              setShowSignOutConfirm(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="relative h-[280px] shrink-0 bg-cream flex flex-col items-center justify-center border-b-8 border-charcoal overflow-hidden group">
        {/* Cover Background (Abstract) */}
        <div className="absolute inset-0 opacity-10 flex flex-wrap items-center justify-center gap-20 p-20 select-none">
           <span className="text-[20vw] font-display font-black italic tracking-tighter text-charcoal">DRIP</span>
           <span className="text-[15vw] font-display font-black italic tracking-tighter text-charcoal">NODE</span>
           <span className="text-[25vw] font-display font-black italic tracking-tighter text-charcoal">SYNC</span>
        </div>

        {/* Action Bar */}
        <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center z-[20]">
          <button 
            onClick={() => setShowDrawer(true)}
            className="w-14 h-14 rounded-[20px] bg-white border-4 border-charcoal flex items-center justify-center text-charcoal active:scale-90 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_rgba(0,0,0,1)]"
          >
            <Menu size={24} strokeWidth={3} />
          </button>

          <div className="flex gap-4">
             <button 
                onClick={handleShare}
                className="w-14 h-14 rounded-[20px] bg-white border-4 border-charcoal flex items-center justify-center text-charcoal active:scale-90 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-y-[-2px]"
             >
                <Share2 size={24} strokeWidth={3} />
             </button>
             <button 
                onClick={() => navigate('/notifications')}
                className="w-14 h-14 rounded-[20px] bg-lime border-4 border-charcoal flex items-center justify-center text-charcoal active:scale-90 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] relative"
             >
                <Bell size={24} strokeWidth={3} />
                {unreadNotificationCount > 0 && (
                   <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#C6FF00] border-4 border-charcoal rounded-full flex items-center justify-center text-white text-[10px] font-black italic">
                      {unreadNotificationCount}
                   </div>
                )}
             </button>
          </div>
        </div>

        {/* Avatar Container */}
        <div className="relative mt-12 group/avatar">
          <div className="w-[150px] h-[150px] rounded-[48px] border-4 border-charcoal bg-white p-2 overflow-hidden shadow-[12px_12px_0_#C6FF00] transition-transform group-hover/avatar:scale-105 duration-500">
             <div className="w-full h-full rounded-[40px] overflow-hidden bg-cream flex items-center justify-center">
               {profile?.avatar_url ? (
                 <img src={profile.avatar_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 <span className="text-6xl font-display font-black text-charcoal italic">
                   {profile?.display_name?.charAt(0) || 'U'}
                 </span>
               )}
             </div>
          </div>
          <button 
            onClick={() => setShowEditSheet(true)}
            className="absolute -bottom-2 -right-2 w-12 h-12 rounded-[20px] bg-lime border-4 border-charcoal flex items-center justify-center text-xl shadow-[4px_4px_0_rgba(0,0,0,1)] active:scale-90 transition-all"
          >
            <Camera size={20} strokeWidth={4} />
          </button>
        </div>
      </div>

      {/* Body Section */}
      <div className="pt-10 px-8 flex flex-col items-center">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex flex-col items-center">
            <h1 className="text-5xl md:text-6xl font-display font-black italic tracking-tighter leading-none mb-1 text-charcoal">
              {profile?.display_name || 'anonymous'}
            </h1>
            <span className="text-2xl font-display font-black text-[#C6FF00] italic tracking-tighter leading-none">@{profile?.handle || 'user'}</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <div className="oval-sticker !bg-charcoal !text-cream !px-4 !py-1 !text-[11px] border-none !shadow-none uppercase font-black italic tracking-widest">{profile?.town || 'Zimbabwe'}</div>
            <div className="oval-sticker !bg-white !text-charcoal !border-2 !border-charcoal !px-4 !py-1 !text-[11px] !shadow-none uppercase font-black italic tracking-widest flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-lime animate-pulse" />
               SECURE NODE
            </div>
          </div>
        </div>

        {/* Style Persona Pill */}
        <button 
          onClick={() => navigate('/quiz')}
          className="mt-10 w-full p-6 rounded-[32px] border-4 border-charcoal bg-white flex items-center justify-between group active:scale-95 transition-all shadow-[10px_10px_0_#C6FF00] hover:translate-y-[-4px] hover:shadow-[14px_14px_0_#C6FF00]"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[20px] bg-charcoal/5 flex items-center justify-center text-4xl border-2 border-charcoal/10 group-hover:bg-lime transition-colors">
               {personality?.icon || '✨'}
            </div>
            <div className="flex flex-col items-start">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic">Persona Matrix</span>
               <span className="text-2xl font-display font-black text-charcoal italic tracking-tight leading-none">
                  {personality?.type || 'Sync Protocol'}
               </span>
            </div>
          </div>
          <ChevronRight size={24} className="text-charcoal opacity-20 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
        </button>

        {/* Stats Grid */}
        <div className="w-full mt-10 grid grid-cols-2 gap-4">
           <button 
             onClick={() => setActiveTab('saved')}
             className="flex flex-col p-6 rounded-[32px] bg-white border-4 border-charcoal shadow-[8px_8px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all group"
           >
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-full bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00]">
                    <Heart size={20} strokeWidth={4} />
                 </div>
                 <span className="text-4xl font-display font-black text-charcoal italic tracking-tighter leading-none">{formatCount(savedProducts.length)}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-charcoal/30 italic">Registry</span>
           </button>
           <button 
             onClick={() => setActiveTab('following')}
             className="flex flex-col p-6 rounded-[32px] bg-white border-4 border-charcoal shadow-[8px_8px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all group"
           >
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center text-charcoal">
                    <ShoppingBag size={20} strokeWidth={4} />
                 </div>
                 <span className="text-4xl font-display font-black text-charcoal italic tracking-tighter leading-none">{formatCount(followedShops.length)}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-charcoal/30 italic">Network</span>
           </button>
        </div>

        {/* Tabs */}
        <div className="w-full mt-12">
          <div className="flex gap-8 border-b-4 border-charcoal/5">
            {(['saved', 'following', 'about'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative italic ${activeTab === tab ? 'text-charcoal' : 'text-charcoal/20'}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="profile-tab-line" className="absolute bottom-[-4px] left-0 right-0 h-1.5 bg-charcoal rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-10 pb-20">
            {activeTab === 'saved' && (
              <SavedTab products={savedProducts} loading={loading} navigate={navigate} />
            )}
            {activeTab === 'following' && (
              <FollowingTab follows={followedShops} loading={loading} navigate={navigate} onUnfollow={handleUnfollow} />
            )}
            {activeTab === 'about' && (
              <AboutTab profile={profile} myShop={myShop} navigate={navigate} />
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Profile Bottom Sheet */}
      <AnimatePresence>
        {showEditSheet && (
          <EditProfileSheet 
            profile={profile} 
            onClose={() => setShowEditSheet(false)} 
            onUpdate={updateProfile}
          />
        )}
      </AnimatePresence>

      {/* Sign Out Confirm Modal */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setShowSignOutConfirm(false)}
               className="fixed inset-0 z-[200] backdrop-blur-xl bg-charcoal/40"
            />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-8 pointer-events-none">
              <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }} 
                 animate={{ scale: 1, opacity: 1 }} 
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="w-full max-w-[400px] bg-white border-8 border-charcoal rounded-[54px] p-10 shadow-[32px_32px_0_rgba(0,0,0,1)] pointer-events-auto flex flex-col items-center text-center gap-8"
              >
                 <div className="w-24 h-24 rounded-[32px] bg-red-500 border-4 border-charcoal flex items-center justify-center text-white shadow-[8px_8px_0_rgba(0,0,0,1)]">
                    <LogOut size={44} strokeWidth={4} />
                 </div>
                 <div className="flex flex-col gap-3">
                   <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter text-charcoal leading-none">Disconnect Node?</h2>
                   <p className="text-sm font-black text-charcoal/30 uppercase italic tracking-[0.2em] leading-relaxed">
                     Neural link termination will restrict access to private style registries.
                   </p>
                 </div>
                 <div className="w-full flex flex-col gap-4">
                   <button 
                     onClick={() => signOut()}
                     className="w-full h-20 rounded-[28px] bg-red-500 text-white font-display font-black uppercase italic tracking-tighter text-2xl border-4 border-charcoal shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all"
                   >
                     TERMINATE LINK
                   </button>
                   <button 
                     onClick={() => setShowSignOutConfirm(false)}
                     className="w-full h-20 rounded-[28px] bg-white text-charcoal font-display font-black uppercase italic tracking-tighter text-2xl border-4 border-charcoal shadow-[8px_8px_0_rgba(0,0,0,0.05)] active:translate-y-[4px] active:shadow-none transition-all"
                   >
                     ABORT
                   </button>
                 </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-components ---

const DecorativeShapes = () => {
  const shapes = ['●', '✕', '◆', '●', '✕', '◆', '●'];
  return (
    <>
      {shapes.map((s, i) => (
        <motion.span
          key={`shape-${i}`}
          animate={{ 
            y: [0, -4, 0],
            rotate: [0, 15, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            delay: i * 0.5,
            ease: "easeInOut"
          }}
          className="absolute text-white opacity-20 pointer-events-none"
          style={{
            fontSize: s === '✕' ? '12px' : '8px',
            left: `${15 + (i * 12)}%`,
            top: `${20 + (i * 8) % 60}%`
          }}
        >
          {s}
        </motion.span>
      ))}
    </>
  );
};

const SideDrawer: React.FC<{
  onClose: () => void;
  profile: any;
  isClosing: boolean;
  navigate: (path: string) => void;
  unreadCount?: number;
  userHasShop?: boolean;
  onSignOut: () => void;
}> = ({ onClose, profile, isClosing, navigate, unreadCount, userHasShop, onSignOut }) => {
  
  const menuItems = [
    { id: 'profile', icon: <User size={24} strokeWidth={3} />, label: 'Neural Profile', onClick: () => { onClose(); } },
    { id: 'notifications', icon: <Bell size={24} strokeWidth={3} />, label: 'Transmission Logs', onClick: () => { onClose(); navigate('/notifications'); }, badge: unreadCount },
    { 
      id: 'shop', 
      icon: <ShoppingBag size={24} strokeWidth={3} />, 
      label: userHasShop ? 'Command Center' : 'Establish Shop', 
      onClick: () => { onClose(); navigate(userHasShop ? '/shop-centre' : '/seller-onboarding'); } 
    },
    { id: 'quiz', icon: <Star size={24} strokeWidth={3} />, label: 'Archetype Survey', onClick: () => { onClose(); navigate('/quiz'); } },
    { id: 'challenge', icon: <Award size={24} strokeWidth={3} />, label: 'Style Consensus', onClick: () => { onClose(); navigate('/challenge'); } },
    { id: 'settings', icon: <Settings size={24} strokeWidth={3} />, label: 'Core Config', onClick: () => { onClose(); navigate('/settings'); } },
  ];

  return (
    <motion.div 
      initial={{ x: '-100%' }}
      animate={{ x: isClosing ? '-100%' : 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
      className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-cream z-[101] flex flex-col border-r-8 border-charcoal"
    >
      {/* Side Drawer Header */}
      <div className="relative p-10 pt-20 flex flex-col border-b-4 border-charcoal bg-white">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-12 h-12 rounded-[16px] border-4 border-charcoal flex items-center justify-center text-charcoal bg-white shadow-[4px_4px_0_rgba(0,0,0,1)] active:scale-90 transition-all font-black text-xs"
        >
          <X size={20} strokeWidth={4} />
        </button>
        <div className="flex flex-col gap-8">
          <div className="w-[100px] h-[100px] rounded-[32px] border-4 border-charcoal bg-white p-1 overflow-hidden shadow-[8px_8px_0_#C6FF00]">
             <div className="w-full h-full rounded-[26px] overflow-hidden bg-cream flex items-center justify-center">
               {profile?.avatar_url ? (
                 <img src={profile.avatar_url} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-4xl font-display font-black text-charcoal italic">
                   {profile?.display_name?.charAt(0) || 'U'}
                 </span>
               )}
             </div>
          </div>
          <div className="flex flex-col min-w-0">
             <span className="text-4xl font-display font-black italic truncate leading-tight uppercase tracking-tighter text-charcoal">{profile?.display_name || 'User'}</span>
             <span className="text-xl font-display font-black text-[#C6FF00] italic tracking-tighter leading-none mt-1">@{profile?.handle || 'user'}</span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-10 overflow-y-auto no-scrollbar px-6 space-y-4">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={item.onClick}
            className="w-full p-6 rounded-[28px] flex items-center gap-6 hover:bg-lime transition-all text-charcoal border-4 border-transparent hover:border-charcoal hover:shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none group"
          >
            <div className="w-12 h-12 rounded-[16px] bg-charcoal/5 flex items-center justify-center group-hover:bg-white transition-colors">
               {item.icon}
            </div>
            <span className="text-[13px] font-black uppercase tracking-[0.2em] flex-1 text-left italic">{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] border-4 border-charcoal flex items-center justify-center">
                <span className="text-[10px] font-black text-white">{item.badge}</span>
              </div>
            ) : (
              <ArrowRight size={18} className="opacity-10 group-hover:opacity-100 group-hover:translate-x-2 transition-all" strokeWidth={3} />
            )}
          </button>
        ))}

        <div className="h-1 bg-charcoal/5 mx-4 my-8" />

        <button 
          onClick={onSignOut}
          className="w-full p-6 rounded-[28px] flex items-center gap-6 hover:bg-red-500 hover:text-white transition-all text-[#C6FF00] border-4 border-transparent hover:border-charcoal hover:shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none font-black italic uppercase tracking-[0.2em] text-[13px]"
        >
          <div className="w-12 h-12 rounded-[16px] bg-red-500/10 flex items-center justify-center group-hover:bg-white">
             <LogOut size={20} strokeWidth={4} />
          </div>
          Disconnect
        </button>
      </div>

      {/* Footer */}
      <div className="p-10 pb-16 border-t-4 border-charcoal bg-white">
         <span className="text-3xl font-display font-black tracking-[-0.08em] italic text-charcoal">thread<span className="text-[#C6FF00]">zw</span></span>
         <div className="flex items-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-lime animate-pulse" />
            <p className="text-charcoal/30 text-[9px] font-black uppercase tracking-[0.4em] italic">V.2.1.0-EDITION</p>
         </div>
      </div>
    </motion.div>
  );
};

const SavedTab: React.FC<{ products: SaveItem[], loading: boolean, navigate: (p: string) => void }> = ({ products, loading, navigate }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-8">
        {[1, 2, 3, 4].map(i => (
          <div key={`profile-shimmer-grid-${i}`} className="aspect-[4/5] bg-charcoal/5 animate-pulse rounded-[40px] border-4 border-dashed border-charcoal/10" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center text-center gap-8 border-8 border-dashed border-charcoal/5 rounded-[54px] bg-white/40">
        <div className="w-24 h-24 rounded-[32px] bg-cream border-4 border-charcoal flex items-center justify-center text-[#C6FF00] shadow-[8px_8px_0_rgba(0,0,0,1)]">
           <Heart size={44} strokeWidth={4} />
        </div>
        <div className="flex flex-col gap-3">
           <h3 className="text-3xl font-display font-black italic uppercase tracking-tighter text-charcoal/40">Archive Terminated</h3>
           <p className="italic-accent text-xl text-charcoal/20 max-w-[280px] leading-tight mx-auto">
             "No style protocols detected. Begin registry in the feed."
           </p>
        </div>
        <button 
          onClick={() => navigate('/home')}
           className="px-10 py-5 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-xl rounded-[24px] shadow-[8px_8px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all"
        >
          Launch Feed
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      {products.map(item => (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          key={item.id} 
          onClick={() => navigate(`/product/${item.products.id}`)}
          className="flex flex-col gap-4 group cursor-pointer"
        >
          <div className="aspect-[4/5] relative rounded-[40px] overflow-hidden border-4 border-charcoal bg-white shadow-[8px_8px_0_rgba(0,0,0,1)] group-active:translate-y-[2px] group-active:shadow-none transition-all">
            <img 
              src={item.products.images[0]} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              loading="lazy" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 right-4">
               <div className="oval-sticker !bg-[#C6FF00] !text-white !p-2 !px-4 !shadow-none border-none uppercase font-black italic tracking-widest text-[9px] translate-y-[-20%] group-hover:translate-y-0 transition-transform">Registry OK</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col gap-1 px-4">
            <h4 className="text-2xl font-display font-black uppercase italic tracking-tighter truncate leading-none text-charcoal group-hover:text-[#C6FF00] transition-colors">{item.products.name}</h4>
            <span className="text-3xl font-display font-black text-[#C6FF00] italic tracking-tighter leading-none">${item.products.price}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const FollowingTab: React.FC<{ follows: FollowItem[], loading: boolean, navigate: (p: string) => void, onUnfollow: (id: string) => void }> = ({ follows, loading, navigate, onUnfollow }) => {
  if (loading) {
    return <div className="space-y-4 mt-4">
      {[1, 2, 3].map(i => <div key={`profile-shimmer-row-${i}`} className="h-32 bg-white border-4 border-dashed border-charcoal/10 rounded-[40px] animate-pulse" />)}
    </div>;
  }

  if (follows.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center text-center gap-8 border-8 border-dashed border-charcoal/5 rounded-[54px] bg-white/40">
        <div className="w-24 h-24 rounded-[32px] bg-cream border-4 border-charcoal flex items-center justify-center text-lime shadow-[8px_8px_0_rgba(0,0,0,1)]">
           <ShoppingBag size={44} strokeWidth={4} />
        </div>
        <div className="flex flex-col gap-3">
           <h3 className="text-3xl font-display font-black italic uppercase tracking-tighter text-charcoal/40">Network Offline</h3>
           <p className="italic-accent text-xl text-charcoal/20 max-w-[280px] leading-tight mx-auto">
             "Establish connections with operational storefronts."
           </p>
        </div>
        <button 
          onClick={() => navigate('/shops')}
          className="px-10 py-5 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-xl rounded-[24px] shadow-[8px_8px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all"
        >
          Browse Network
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {follows.map(follow => (
        <div 
          key={follow.id}
          onClick={() => navigate(`/shop/${follow.shops.handle || follow.shops.id}`)}
          className="bg-white border-4 border-charcoal rounded-[40px] p-6 flex items-center gap-6 active:translate-y-[2px] transition-all cursor-pointer shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] group"
        >
          <div className="w-[80px] h-[80px] rounded-[28px] overflow-hidden border-4 border-charcoal bg-white flex items-center justify-center shrink-0 shadow-[4px_4px_0_#C6FF00]">
             {(follow.shops.logo_url || follow.shops.avatar_url) ? (
                <img src={follow.shops.logo_url || follow.shops.avatar_url || undefined} className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full bg-linear-to-br from-charcoal/5 to-charcoal/10 flex items-center justify-center text-4xl">🏪</div>
             )}
          </div>
          <div className="flex-1 min-w-0">
             <h4 className="text-3xl font-display font-black uppercase italic truncate tracking-tighter text-charcoal leading-none mb-2 group-hover:text-[#C6FF00] transition-colors">{follow.shops.name}</h4>
             <div className="flex flex-wrap items-center gap-2">
                <div className="oval-sticker !bg-charcoal/5 !text-charcoal/40 !p-1 !px-3 !shadow-none !text-[8.5px] border-none uppercase font-black italic tracking-widest">{follow.shops.category}</div>
                <div className="oval-sticker !bg-lime !text-charcoal !p-1 !px-3 !shadow-none !text-[8.5px] border-none uppercase font-black italic tracking-widest">{follow.shops.town}</div>
             </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onUnfollow(follow.shop_id); }}
            className="w-12 h-12 rounded-[16px] bg-charcoal/5 border-2 border-charcoal/10 flex items-center justify-center text-charcoal/20 hover:bg-[#C6FF00] hover:text-white hover:border-charcoal transition-all active:scale-90"
            title="Unfollow"
          >
             <X size={20} strokeWidth={4} />
          </button>
        </div>
      ))}
    </div>
  );
};

const AboutTab: React.FC<{ profile: any, myShop: any, navigate: (p: string) => void }> = ({ profile, myShop, navigate }) => {
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  const rows = [
    { label: 'Neural Identity', value: profile?.display_name || 'None' },
    { label: 'Access Handle', value: profile?.handle ? `@${profile.handle}` : 'None' },
    { label: 'Deployment Hub', value: profile?.town || '—' },
    { label: 'Style Matrix', value: profile?.personality_type || 'Scanning...' },
    { label: 'Sync Initiation', value: memberSince },
  ];

  return (
    <div className="mt-8 flex flex-col gap-10">
      <div className="bg-white border-4 border-charcoal rounded-[48px] p-10 shadow-[12px_12px_0_rgba(0,0,0,0.05)]">
         <div className="flex flex-col gap-8">
            {rows.map((row, i) => (
              <div key={`profile-row-${row.label}`} className={`flex justify-between items-center pb-4 ${i < rows.length - 1 ? 'border-b-2 border-charcoal/5' : ''}`}>
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic">{row.label}</span>
                 <span className="text-xl font-display font-black text-charcoal italic tracking-tight">{row.value}</span>
              </div>
            ))}
         </div>
      </div>

      {myShop && (
        <button 
          onClick={() => navigate('/shop-centre')}
          className="w-full bg-lime border-4 border-charcoal rounded-[48px] p-8 flex items-center gap-8 active:translate-[4px] transition-all shadow-[12px_12px_0_#000000] group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Radio size={120} className="text-charcoal" strokeWidth={1} />
          </div>
          <div className="w-24 h-24 rounded-[32px] bg-white border-4 border-charcoal flex-shrink-0 flex items-center justify-center overflow-hidden shadow-[6px_6px_0_rgba(0,0,0,1)]">
             {myShop.logo_url ? (
               <img src={myShop.logo_url} className="w-full h-full object-cover" />
             ) : (
               <span className="text-4xl">🏪</span>
             )}
          </div>
          <div className="flex-1 text-left flex flex-col gap-2">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-charcoal animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal">Terminal Active</span>
             </div>
             <h4 className="text-4xl font-display font-black text-charcoal italic uppercase tracking-tighter leading-none">{myShop.name}</h4>
             <p className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 italic">Manage Operational Center →</p>
          </div>
        </button>
      )}
    </div>
  );
};

const EditProfileSheet: React.FC<{
  profile: any;
  onClose: () => void;
  onUpdate: (data: any) => Promise<{ error: any | null }>;
}> = ({ profile, onClose, onUpdate }) => {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [handle, setHandle] = useState(profile?.handle || '');
  const [town, setTown] = useState(profile?.town || '');
  const [saving, setSaving] = useState(false);
  const [showTownPicker, setShowTownPicker] = useState(false);
  
  const [isHandleAvailable, setIsHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle availability check
  useEffect(() => {
    const checkHandle = async () => {
      if (!handle || handle === profile?.handle) {
        setIsHandleAvailable(null);
        return;
      }
      if (handle.length < 3) {
        setIsHandleAvailable(false);
        return;
      }

      setCheckingHandle(true);
      const { data } = await supabase
        .from('profiles')
        .select('handle')
        .eq('handle', handle.toLowerCase())
        .single();
      
      setIsHandleAvailable(!data);
      setCheckingHandle(false);
    };

    const timer = setTimeout(checkHandle, 500);
    return () => clearTimeout(timer);
  }, [handle, profile?.handle]);

  const handleSave = async () => {
    if (handle !== profile?.handle && isHandleAvailable === false) {
      toast.error('Handle is already taken');
      return;
    }

    setSaving(true);
    const { error } = await onUpdate({
      display_name: displayName,
      handle: handle.toLowerCase(),
      town: town
    });

    if (!error) {
      toast.success('Profile updated');
      onClose();
    } else {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large (max 2MB)');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;
      let publicUrl = '';

      try {
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        publicUrl = data.publicUrl;
      } catch (uploadErr) {
        console.warn('Avatars upload to storage failed, falling back to local object URL. Error:', uploadErr);
        publicUrl = URL.createObjectURL(file);
      }

      await onUpdate({ avatar_url: publicUrl });
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] backdrop-blur-xl bg-charcoal/20"
      />
      <motion.div 
        initial={{ y: '100%', x: '-50%' }}
        animate={{ y: 0, x: '-50%' }}
        exit={{ y: '100%', x: '-50%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[201] bg-cream rounded-t-[54px] border-x-8 border-t-8 border-charcoal p-10 pb-16 max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_-12px_40px_rgba(0,0,0,0.1)]"
      >
        <div className="w-16 h-2 rounded-full bg-charcoal/10 mx-auto mb-10" />
        
        <div className="flex justify-between items-center mb-10">
          <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic">Protocol Edit</span>
             <h2 className="text-4xl font-display font-black text-charcoal italic uppercase tracking-tighter leading-none">NODE CONFIG</h2>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-[16px] bg-white border-4 border-charcoal flex items-center justify-center text-charcoal shadow-[4px_4px_0_rgba(0,0,0,1)] active:scale-90 transition-all">
             <X size={20} strokeWidth={4} />
          </button>
        </div>

        <div className="space-y-10">
           {/* Photo Section */}
           <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.3em] italic pl-2">Neural Avatar</label>
              <div className="bg-white border-4 border-charcoal rounded-[40px] p-6 flex items-center gap-8 shadow-[8px_8px_0_rgba(0,0,0,0.05)]">
                 <div className="w-24 h-24 rounded-[32px] border-4 border-charcoal p-1 bg-cream overflow-hidden shadow-[4px_4px_0_#C6FF00]">
                    <div className="w-full h-full rounded-[24px] overflow-hidden bg-white flex items-center justify-center">
                       {profile?.avatar_url ? (
                         <img src={profile.avatar_url} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-4xl font-display font-black text-charcoal italic">U</span>
                       )}
                    </div>
                 </div>
                 <div className="flex-1 flex flex-col gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-14 bg-charcoal text-cream font-display font-black uppercase italic tracking-tight text-lg rounded-[20px] flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      New Capture <Camera size={18} strokeWidth={3} />
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                    />
                 </div>
              </div>
           </div>

           {/* Fields */}
           <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3 group">
                 <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.3em] italic pl-2 group-focus-within:text-[#C6FF00] transition-colors">Digital Handle</label>
                 <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-display font-black text-charcoal/20">@</span>
                    <input 
                       type="text"
                       value={handle}
                       onChange={(e) => setHandle(e.target.value.replace(/\s+/g, '').toLowerCase())}
                       className="w-full h-20 bg-white border-4 border-charcoal rounded-[28px] pl-12 pr-8 text-2xl font-display font-black italic text-charcoal tracking-tight focus:bg-white focus:shadow-[8px_8px_0_#C6FF00] transition-all outline-none"
                    />
                    {handle.length > 0 && handle !== profile?.handle && (
                       <div className={`absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase italic ${isHandleAvailable ? 'bg-lime text-charcoal' : 'bg-red-500 text-white'}`}>
                          {checkingHandle ? 'Syncing...' : (isHandleAvailable ? 'Verified' : 'Conflicts')}
                       </div>
                    )}
                 </div>
              </div>

              <div className="flex flex-col gap-3 group">
                 <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.3em] italic pl-2 group-focus-within:text-[#C6FF00] transition-colors">Neural Alias</label>
                 <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-20 bg-white border-4 border-charcoal rounded-[28px] px-8 text-2xl font-display font-black italic text-charcoal tracking-tight focus:bg-white focus:shadow-[8px_8px_0_#C6FF00] transition-all outline-none"
                    placeholder="Identity Label"
                 />
              </div>

              <div className="flex flex-col gap-3 group">
                 <label className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.3em] italic pl-2 group-focus-within:text-[#C6FF00] transition-colors">Stationary Node</label>
                 <button 
                    onClick={() => setShowTownPicker(true)}
                    className="w-full h-20 bg-white border-4 border-charcoal rounded-[28px] px-8 flex items-center justify-between text-2xl font-display font-black italic text-charcoal tracking-tight hover:shadow-[8px_8px_0_#C6FF00] transition-all"
                 >
                    <span className={town ? 'text-charcoal' : 'text-charcoal/20'}>{town || 'Locate Node'}</span>
                    <MapPin size={24} className="text-charcoal/30" strokeWidth={3} />
                 </button>
              </div>
           </div>

           <div className="pt-6">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full h-24 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-3xl rounded-[32px] shadow-[12px_12px_0_#C6FF00] active:translate-y-[6px] active:shadow-none transition-all flex items-center justify-center gap-6 disabled:opacity-50"
              >
                {saving ? (
                   <>
                     <RefreshCw size={32} className="animate-spin" strokeWidth={3} />
                     <span className="animate-pulse">SYNCING...</span>
                   </>
                ) : (
                   <>COMMIT CHANGES <Bookmark size={28} strokeWidth={4} /></>
                )}
              </button>
           </div>
        </div>
      </motion.div>

      {/* Town Picker */}
      <AnimatePresence>
        {showTownPicker && (
          <TownPicker onClose={() => setShowTownPicker(false)} onSelect={(t) => { setTown(t); setShowTownPicker(false); }} currentTown={town} />
        )}
      </AnimatePresence>
    </>
  );
};

const TownPicker: React.FC<{ onClose: () => void, onSelect: (t: string) => void, currentTown: string }> = ({ onClose, onSelect, currentTown }) => {
  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[300] backdrop-blur-md bg-charcoal/20"
      />
      <motion.div 
        initial={{ y: '100%', x: '-50%' }} animate={{ y: 0, x: '-50%' }} exit={{ y: '100%', x: '-55%' }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[301] bg-white border-x-8 border-t-8 border-charcoal rounded-t-[54px] p-10 max-h-[70vh] flex flex-col shadow-[0_-12px_40px_rgba(0,0,0,0.1)]"
      >
        <div className="w-16 h-2 rounded-full mx-auto mb-10 bg-charcoal/10" />
        <div className="flex flex-col mb-8 pl-2">
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic">Geospatial Sync</span>
           <h2 className="text-4xl font-display font-black text-charcoal italic uppercase tracking-tighter leading-none">STATION NODE</h2>
        </div>
        <div className="overflow-y-auto no-scrollbar flex-1 space-y-4 pb-12">
          {ZIMBABWE_TOWNS.map(town => (
            <button 
              key={town}
              onClick={() => onSelect(town)}
              className={`w-full h-16 rounded-[24px] text-left px-8 font-display font-black uppercase italic tracking-tight text-xl transition-all border-4 ${currentTown === town ? 'bg-lime text-charcoal border-charcoal shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white text-charcoal/20 border-charcoal/5 hover:border-charcoal hover:text-charcoal'}`}
            >
              {town}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
};

const GuestProfileView: React.FC<{ navigate: (p: string) => void }> = ({ navigate }) => {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-cream overflow-y-auto no-scrollbar pb-20">
      {/* Header */}
      <div className="relative h-[420px] shrink-0 bg-charcoal overflow-hidden flex flex-col items-center justify-center p-12 text-center gap-8">
        <div className="absolute inset-0 opacity-10 flex flex-wrap items-center justify-center gap-10 select-none rotate-3">
           <span className="text-[15vw] font-display font-black text-white italic tracking-tighter">THREAD</span>
           <span className="text-[12vw] font-display font-black text-lime italic tracking-widest">GUEST</span>
           <span className="text-[18vw] font-display font-black text-white italic tracking-tighter">COLLECTIVE</span>
        </div>
        
        <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-32 h-32 rounded-[40px] bg-white border-4 border-lime flex items-center justify-center relative z-10 shadow-[12px_12px_0_rgba(198,255,0,0.3)]"
        >
           <User size={64} className="text-charcoal" strokeWidth={3} />
        </motion.div>
        
        <div className="flex flex-col gap-4 relative z-10">
           <h2 className="text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-[0.8]">GUEST ENTITY <br/><span className="text-lime">DETECTED</span></h2>
           <p className="text-sm font-black text-white/40 uppercase italic tracking-[0.3em] max-w-[280px] leading-relaxed mx-auto">
             Identity protocol awaiting verification. Access restricted to public layers.
           </p>
        </div>
      </div>

      <div className="px-8 flex flex-col gap-8 -mt-20 relative z-20">
        <div className="bg-white border-8 border-charcoal rounded-[54px] p-10 shadow-[20px_20px_0_rgba(0,0,0,1)] flex flex-col gap-8">
           <div className="flex flex-col gap-4">
              <h3 className="text-3xl font-display font-black text-charcoal uppercase italic tracking-tighter">Initialize Link</h3>
              <p className="text-[11px] font-black text-charcoal/30 uppercase italic tracking-widest leading-relaxed">
                 Establishing a neural connection grants access to deep-level archival and shop deployment features.
              </p>
           </div>
           
           <div className="flex flex-col gap-4">
              <button 
                onClick={() => navigate('/auth?mode=signup')}
                className="w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-[28px] shadow-[8px_8px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all"
              >
                Sign Up Protocol
              </button>

              <button 
                onClick={() => navigate('/auth?mode=login')}
                className="w-full h-20 bg-white border-4 border-charcoal text-charcoal font-display font-black uppercase italic tracking-tighter text-2xl rounded-[28px] shadow-[8px_8px_0_rgba(0,0,0,0.05)] active:translate-y-[4px] active:shadow-none transition-all"
              >
                Authentication
              </button>
           </div>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-3 gap-3">
           {[
             { icon: <Heart size={20} />, label: 'ARCHIVE' },
             { icon: <ShoppingBag size={20} />, label: 'ESTABLISH' },
             { icon: <Award size={20} />, label: 'REWARDS' }
           ].map((f, i) => (
             <div key={`profile-feature-${i}`} className="bg-white border-4 border-charcoal rounded-[24px] p-5 flex flex-col items-center justify-center gap-3 shadow-[6px_6px_0_rgba(0,0,0,0.05)]">
                <div className="text-charcoal">{f.icon}</div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] italic text-charcoal/40">{f.label}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
