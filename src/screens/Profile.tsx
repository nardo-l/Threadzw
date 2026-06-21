import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getShopUrl } from '../utils/shopUrl';
import { 
  User, Mail, Calendar, Key, Shield, HelpCircle, 
  ChevronRight, ArrowLeft, LogOut, Globe, Settings, MapPin, Tag 
} from 'lucide-react';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { toast } from 'sonner';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndShop = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/');
          return;
        }

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        setProfile(profileData || { email: session.user.email });

        // Fetch shop
        const { data: shopData } = await supabase
          .from('shops')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        setShop(shopData);
      } catch (err) {
        console.error('Error fetching profile assets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndShop();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Signed out securely.');
    } catch (err) {
      toast.error('Sign out failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C6FF00] border-t-transparent animate-spin" />
      </div>
    );
  }

  const formattedJoinDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'June 2024';

  const avatarInitial = profile?.display_name?.slice(0, 1) || profile?.username?.slice(0, 1) || profile?.email?.slice(0, 1) || 'T';

  return (
    <div className="min-h-screen bg-[#070709] text-white pb-32 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4 border-b border-white/[0.02] flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400">
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase font-black">Merchant Security</span>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">My Profile</h1>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        
        {/* AVATAR CARD */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-[#C6FF00]/35 flex items-center justify-center shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-[#C6FF00]">{avatarInitial.toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-base text-white truncate">
              {profile?.display_name || profile?.username || 'ThreadZW Merchant'}
            </h3>
            <p className="text-xs text-zinc-500 truncate mt-0.5">{profile?.email || 'security@threadzw.store'}</p>
            <span className="inline-block bg-[#C6FF00]/10 text-[#C6FF00] text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#C6FF00]/10 mt-2">
              Pro Member
            </span>
          </div>
        </div>

        {/* SHOP METADATA */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 px-1">Shop Information</h3>
          <div className="bg-[#111115] border border-white/[0.05] rounded-2xl divide-y divide-white/[0.03]">
            
            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Shop Handle</span>
              <span className="font-mono text-[#C6FF00] font-black">@{shop?.handle || 'unconfigured'}</span>
            </div>

            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Location</span>
              <span className="text-white font-medium flex items-center gap-1">
                <MapPin size={13} className="text-zinc-500" />
                {shop?.location || 'Harare CBD'}
              </span>
            </div>

            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Categories</span>
              <span className="text-white font-medium flex items-center gap-1 text-right">
                <Tag size={13} className="text-zinc-500" />
                {shop?.categories?.join(', ') || 'Streetwear'}
              </span>
            </div>

            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Storefront Link</span>
              {shop?.slug || shop?.handle ? (
                <Link 
                  to={getShopUrl(shop.slug || shop.handle, shop.id)} 
                  className="text-[#C6FF00] text-xs font-mono font-bold flex items-center gap-1 hover:underline"
                >
                  <Globe size={13} />
                  /{shop.slug || shop.handle}
                </Link>
              ) : (
                <span className="text-zinc-500 text-xs font-mono">No active shop handle</span>
              )}
            </div>

          </div>
        </div>

        {/* SUBSCRIPTION / SYSTEM INFO */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 px-1">Account & Credentials</h3>
          <div className="bg-[#111115] border border-white/[0.05] rounded-2xl divide-y divide-white/[0.03]">
            
            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Joined Date</span>
              <span className="text-white font-medium flex items-center gap-1">
                <Calendar size={13} className="text-zinc-500" />
                {formattedJoinDate}
              </span>
            </div>

            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Terminal ID</span>
              <span className="text-zinc-400 font-mono text-xs truncate max-w-[150px]">TZW-{profile?.id?.slice(0, 8) || 'MAIN-SECURE'}</span>
            </div>

            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">License Status</span>
              <span className="text-emerald-400 font-bold uppercase text-xs flex items-center gap-1">
                <Shield size={13} />
                ACTIVE (PRO)
              </span>
            </div>

          </div>
        </div>

        {/* QUICK VIEWS */}
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/edit-shop')}
            className="w-full bg-[#111115] hover:bg-[#16161c] border border-white/[0.05] p-4 rounded-xl flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C6FF00]/10 text-[#C6FF00] flex items-center justify-center">
                <Settings size={15} />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Edit Shop</span>
                <span className="text-[10px] text-zinc-500">Configure parameters & handle slugs</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-600" />
          </button>

          <button 
            onClick={() => navigate('/support')}
            className="w-full bg-[#111115] hover:bg-[#16161c] border border-white/[0.05] p-4 rounded-xl flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <HelpCircle size={15} />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Help & Support</span>
                <span className="text-[10px] text-zinc-500">Read FAQs & contact support team</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-600" />
          </button>
        </div>

        {/* LOG OUT BUTTON */}
        <button 
          onClick={handleSignOut}
          className="w-full h-12 bg-red-950/20 hover:bg-red-950/35 border border-red-900/25 p-4 rounded-xl flex items-center justify-center gap-2 text-red-400 font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer"
        >
          <LogOut size={14} />
          <span>Terminate Session (Log Out)</span>
        </button>

      </div>

      <BottomNavBar />
    </div>
  );
};
