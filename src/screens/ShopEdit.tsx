import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { uploadImage } from '../utils/uploadImage';
import { getImageUrl as getGlobalImageUrl } from '../utils/imageUrl';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { toast } from 'sonner';
import { setOnboardingStep } from '../hooks/useOnboarding';
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  Share2, 
  Edit3, 
  ChevronRight, 
  Bell, 
  Menu, 
  Eye, 
  Package, 
  MessageCircle, 
  Check, 
  X, 
  Loader2, 
  TrendingUp, 
  Heart, 
  ShoppingBag, 
  Zap,
  MapPin,
  Sparkles,
  Phone
} from 'lucide-react';

interface ActivityItem {
  id: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  timestamp: string;
}

const CATEGORY_OPTIONS = [
  'Streetwear', 'Sneakers', 'Clothing', 'Thrift', 'Electronics', 'Accessories', 'Jewellery', 'Boutique', 'Other'
];

interface ShopEditProps {
  initialSubView?: 'account' | 'edit-profile';
}

export const ShopEdit: React.FC<ShopEditProps> = ({ initialSubView = 'account' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { shop, refreshShop } = useShopContext();

  const [view, setView] = useState<'account' | 'edit-profile'>(initialSubView);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Shop Fields
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [locatedIn, setLocatedIn] = useState('');
  const [directions, setDirections] = useState('');
  const [category, setCategory] = useState('Streetwear');
  const [whatsapp, setWhatsapp] = useState('');
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Image Uploading States
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Active Field Editing Modal
  const [activeModal, setActiveModal] = useState<null | 'shopName' | 'handle' | 'bio' | 'locatedIn' | 'directions' | 'category' | 'whatsapp'>(null);
  const [tempValue, setTempValue] = useState('');

  // Stats
  const [stats, setStats] = useState({
    products: 0,
    views: '0',
    whatsappClicks: 0
  });

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchShopData();
  }, [user]);

  const fetchShopData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setShopId(data.id);
        setShopName(data.name || 'My Shop');
        setHandle(data.slug || 'myshop');
        setDescription(data.description || data.tagline || '');
        // Keep the short public location separate from step-by-step directions.
        setLocatedIn(data.city || '');
        setDirections(data.directions || '');
        setCategory(data.categories?.[0] || data.category || 'Streetwear');
        
        // Format WhatsApp
        let wa = data.whatsapp_number || data.whatsapp || '';
        if (wa && !wa.startsWith('+') && wa.trim()) {
          wa = `+263 ${wa.replace(/\D/g, '')}`;
        }
        setWhatsapp(wa);

        setBannerUrl(data.banner_url || null);
        setAvatarUrl(data.logo_url || data.avatar_url || null);

        // Fetch product count & recent products for real activity log
        const { count, data: prods } = await supabase
          .from('products')
          .select('id, name, created_at', { count: 'exact' })
          .eq('shop_id', data.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        const { data: analyticsEvents } = await supabase
          .from('shop_analytics')
          .select('event_type, visitor_id')
          .eq('shop_id', data.id)
          .limit(5000);
        const visitorIds = new Set(
          (analyticsEvents || [])
            .filter((event: any) => event.event_type === 'shop_visit' && event.visitor_id)
            .map((event: any) => event.visitor_id)
        );
        const analyticsWhatsAppClicks = (analyticsEvents || []).filter(
          (event: any) => event.event_type === 'whatsapp_click'
        ).length;

        setStats({
          products: count || 0,
          views: String(visitorIds.size),
          whatsappClicks: analyticsWhatsAppClicks
        });

        // Build dynamic activity feed from real shop history
        const actList: ActivityItem[] = [];

        if (data.created_at) {
          actList.push({
            id: 'act-shop-created',
            icon: Sparkles,
            iconBg: 'bg-[#C6FF00]/20 text-black',
            iconColor: 'text-black',
            title: 'Storefront created',
            description: `${data.name || 'Your shop'} is live on ThreadZW`,
            timestamp: new Date(data.created_at).toLocaleDateString()
          });
        }

        if (prods && prods.length > 0) {
          prods.forEach((prod) => {
            actList.push({
              id: `act-prod-${prod.id}`,
              icon: Package,
              iconBg: 'bg-zinc-100 text-black',
              iconColor: 'text-black',
              title: `Added product "${prod.name}"`,
              description: 'Published to storefront catalog',
              timestamp: prod.created_at ? new Date(prod.created_at).toLocaleDateString() : 'Recently'
            });
          });
        }

        setRecentActivities(actList);
      } else {
        setShopName('My Shop');
        setHandle('myshop');
        setDescription('');
        setLocatedIn('');
        setDirections('');
        setWhatsapp('');
        setBannerUrl(null);
        setAvatarUrl(null);
        setStats({ products: 0, views: '0', whatsappClicks: 0 });
        setRecentActivities([]);
      }
    } catch (err) {
      console.error('Error fetching shop for Account page:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareShop = async () => {
    const shopSlug = handle || shop?.slug || shopId || '';
    const shareUrl = `${window.location.origin}/shop/${shopSlug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: shopName,
          text: `Check out ${shopName} on ThreadZW!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Shop link copied to clipboard!');
      }
    } catch (err) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Shop link copied to clipboard!');
    }
  };

  const handleUploadImage = async (file: File, type: 'logo' | 'banner') => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    try {
      if (type === 'logo') setUploadingAvatar(true);
      else setUploadingBanner(true);

      let activeShopId = shopId;
      if (!activeShopId && user) {
        const { data: dbShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (dbShop) activeShopId = dbShop.id;
      }

      const publicUrl = await uploadImage({
        supabase,
        file,
        bucket: type === 'logo' ? 'shop-avatars' : 'shop-banners',
        folder: type === 'logo' ? 'logo' : 'banner',
        userId: activeShopId || user?.id || ''
      });

      const bustUrl = `${publicUrl}?t=${Date.now()}`;

      if (type === 'logo') {
        setAvatarUrl(bustUrl);
      } else {
        setBannerUrl(bustUrl);
      }

      if (activeShopId) {
        await supabase
          .from('shops')
          .update(type === 'logo' ? { logo_url: publicUrl } : { banner_url: publicUrl })
          .eq('id', activeShopId);
      }

      await refreshShop();
      toast.success(`${type === 'logo' ? 'Profile photo' : 'Banner'} updated successfully!`);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      toast.error('Image upload failed. Please try again.');
    } finally {
      if (type === 'logo') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      let activeShopId = shopId;
      let activeOwnerId = user?.id;

      if (!activeShopId && activeOwnerId) {
        const { data: dbShop, error: fetchErr } = await supabase
          .from('shops')
          .select('id, owner_id')
          .eq('owner_id', activeOwnerId)
          .maybeSingle();

        if (fetchErr) {
          console.error("Error fetching shop by owner_id:", fetchErr);
        }
        if (dbShop) {
          activeShopId = dbShop.id;
        }
      }

      const cleanHandle = (handle || '').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

      // Core standard payload matching Supabase 'shops' table schema
      const payload: Record<string, any> = {
        name: shopName.trim() || 'My Shop',
        slug: cleanHandle || handle || 'myshop',
        description: description || '',
        category: category || 'Streetwear',
        whatsapp_number: whatsapp || '',
        city: locatedIn.trim() || '',
        location: directions.trim() || locatedIn.trim() || '',
        directions: directions.trim() || '',
      };

      if (avatarUrl && !avatarUrl.startsWith('data:')) {
        payload.logo_url = avatarUrl.split('?')[0];
      }
      if (bannerUrl && !bannerUrl.startsWith('data:')) {
        payload.banner_url = bannerUrl.split('?')[0];
      }

      console.log("Saving profile - Active Shop ID:", activeShopId, "Owner ID:", activeOwnerId, "Payload:", payload);

      if (!activeShopId && activeOwnerId) {
        // If shop doesn't exist yet for this user, insert a new shop record
        const insertPayload = {
          owner_id: activeOwnerId,
          ...payload,
          is_active: true,
        };
        console.log("No existing shop found. Inserting new shop:", insertPayload);
        const { data: insertedShop, error: insertErr } = await supabase
          .from('shops')
          .insert(insertPayload)
          .select('id')
          .single();

        if (insertErr) {
          console.error("Supabase shop insert error:", {
            code: insertErr.code,
            message: insertErr.message,
            details: insertErr.details,
            hint: insertErr.hint
          });
          throw insertErr;
        }
        if (insertedShop) {
          activeShopId = insertedShop.id;
          setShopId(insertedShop.id);
        }
      } else if (activeShopId) {
        // Update existing shop
        const { error: updateErr } = await supabase
          .from('shops')
          .update(payload)
          .eq('id', activeShopId);
        
        if (updateErr) {
          console.error("Supabase shop update error:", {
            code: updateErr.code,
            message: updateErr.message,
            details: updateErr.details,
            hint: updateErr.hint
          });

          // Fallback if extra columns cause issue
          if (updateErr.code === 'PGRST204' || updateErr.message?.includes('column')) {
            console.warn("Attempting fallback update with minimal fields...");
            const fallbackPayload = {
              name: shopName.trim() || 'My Shop',
              description: description || '',
              whatsapp_number: whatsapp || '',
            };
            const { error: fallbackErr } = await supabase
              .from('shops')
              .update(fallbackPayload)
              .eq('id', activeShopId);

            if (fallbackErr) {
              console.error("Fallback update also failed:", fallbackErr);
              throw updateErr;
            }
          } else {
            throw updateErr;
          }
        }

        try {
          await setOnboardingStep(activeShopId, 'step2');
        } catch (onbErr) {
          console.warn('Onboarding step update note:', onbErr);
        }
      } else {
        throw new Error('No authenticated user or shop found to update.');
      }

      await refreshShop();
      toast.success('Profile saved successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      console.error('Error code:', err?.code, 'message:', err?.message, 'details:', err?.details, 'hint:', err?.hint);
      const errMsg = err?.message || err?.details || 'Failed to save profile';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const openFieldModal = (field: 'shopName' | 'handle' | 'bio' | 'locatedIn' | 'directions' | 'category' | 'whatsapp') => {
    if (field === 'shopName') setTempValue(shopName);
    if (field === 'handle') setTempValue(handle);
    if (field === 'bio') setTempValue(description);
    if (field === 'locatedIn') setTempValue(locatedIn);
    if (field === 'directions') setTempValue(directions);
    if (field === 'category') setTempValue(category);
    if (field === 'whatsapp') setTempValue(whatsapp);
    setActiveModal(field);
  };

  const saveFieldModal = () => {
    if (activeModal === 'shopName') setShopName(tempValue);
    if (activeModal === 'handle') setHandle(tempValue.replace(/^@/, ''));
    if (activeModal === 'bio') setDescription(tempValue);
    if (activeModal === 'locatedIn') setLocatedIn(tempValue);
    if (activeModal === 'directions') setDirections(tempValue);
    if (activeModal === 'category') setCategory(tempValue);
    if (activeModal === 'whatsapp') setWhatsapp(tempValue);
    setActiveModal(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 pb-24">
        <Loader2 className="w-8 h-8 text-[#C6FF00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-28 selection:bg-[#C6FF00]">
      
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUploadImage(e.target.files[0], 'logo');
          }
        }}
      />
      <input
        type="file"
        ref={bannerInputRef}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUploadImage(e.target.files[0], 'banner');
          }
        }}
      />

      {/* ============================================================ */}
      {/* VIEW 1: ACCOUNT PAGE */}
      {/* ============================================================ */}
      {view === 'account' && (
        <div className="max-w-md mx-auto px-4 pt-4 sm:px-6">
          
          {/* Top Brand Header */}
          <header className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <span className="text-xl font-black tracking-tight">THREAD</span>
              <span className="text-xl font-black tracking-tight text-[#98E600] drop-shadow-xs">ZW</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => toast.info('No new notifications')}
                aria-label="Notifications"
                className="p-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5 text-black" />
              </button>
              <button 
                onClick={() => navigate('/settings')}
                aria-label="Menu"
                className="p-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5 text-black" />
              </button>
            </div>
          </header>

          {/* Shop Banner Container */}
          <div className="relative w-full rounded-3xl overflow-hidden bg-zinc-900 h-40 sm:h-48 border border-zinc-200/80 shadow-xs">
            {bannerUrl ? (
              <img 
                src={bannerUrl} 
                alt="Shop Banner" 
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-semibold p-4 text-center">
                <span>Tap "Edit Profile" to upload a shop banner</span>
              </div>
            )}
            {/* Share Shop Button on top right of banner */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={handleShareShop}
                className="bg-white/90 backdrop-blur-md hover:bg-white text-black text-xs font-extrabold py-2 px-3.5 rounded-xl border border-zinc-200/90 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Shop</span>
              </button>
            </div>
          </div>

          {/* Avatar and Action Buttons Row */}
          <div className="relative px-2 flex items-end justify-between -mt-10 mb-3 z-20">
            {/* Overlapping Logo */}
            <div className="relative">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-black text-white flex items-center justify-center overflow-hidden shadow-md">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={shopName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-2xl tracking-tighter">
                    {shopName ? shopName.substring(0, 2).toUpperCase() : 'TZ'}
                  </span>
                )}
              </div>
              {/* Green active dot */}
              <span className="w-4 h-4 bg-[#C6FF00] rounded-full border-2 border-white absolute bottom-1 right-1 z-10 shadow-xs" />
            </div>

            {/* Edit Profile Button */}
            <div className="pb-1">
              <button
                onClick={() => setView('edit-profile')}
                className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Shop Meta Info */}
          <div className="px-2 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-black">{shopName || 'My Shop'}</h1>
              {/* Verified Badge */}
              <CheckCircle2 className="w-5 h-5 text-[#25D366] fill-[#25D366] text-white shrink-0" />
            </div>

            {handle && (
              <p className="text-xs font-semibold text-zinc-500">@{handle.replace(/^@/, '')}</p>
            )}

            <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 pt-1">
              {directions && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {directions}
                </span>
              )}
              {directions && category && <span className="text-zinc-300">•</span>}
              <span className="font-semibold text-zinc-700">{category || 'Clothing'}</span>
            </div>

            {description ? (
              <p className="text-xs text-zinc-600 pt-1 leading-relaxed">
                {description}
              </p>
            ) : (
              <p className="text-xs text-zinc-400 italic pt-1">
                No store description added yet.
              </p>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 my-5">
            <div className="bg-zinc-50/80 rounded-2xl p-3 border border-zinc-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#C6FF00]/30 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-black" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight text-black">{stats.products}</div>
                <div className="text-[10px] text-zinc-500 font-medium">Products</div>
              </div>
            </div>

            <div className="bg-zinc-50/80 rounded-2xl p-3 border border-zinc-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-lime-100 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-black" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight text-black">{stats.views}</div>
                <div className="text-[10px] text-zinc-500 font-medium">Shop Views</div>
              </div>
            </div>

            <div className="bg-zinc-50/80 rounded-2xl p-3 border border-zinc-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight text-black">{stats.whatsappClicks}</div>
                <div className="text-[10px] text-zinc-500 font-medium">WhatsApp Clicks</div>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed Header */}
          <div className="bg-white rounded-3xl border border-zinc-100 p-4 sm:p-5 shadow-xs mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-black tracking-tight">Recent Activity</h2>
              <button 
                onClick={() => toast.info('Activity log is up to date!')}
                className="text-xs font-bold text-[#85B800] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Activity List */}
            {recentActivities.length > 0 ? (
              <div className="divide-y divide-zinc-100/80">
                {recentActivities.map((act) => {
                  const IconComp = act.icon;
                  return (
                    <div key={act.id} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
                      <div className={`w-9 h-9 rounded-full ${act.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <IconComp className={`w-4 h-4 ${act.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-bold text-black truncate">{act.title}</h3>
                          <span className="text-[10px] font-medium text-zinc-400 shrink-0">{act.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{act.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs font-bold text-zinc-700">No recent activity yet</p>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  Activity updates will appear here as your store gets views, WhatsApp inquiries, and sales.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: EDIT PROFILE PAGE (TikTok Style Rows) */}
      {/* ============================================================ */}
      {view === 'edit-profile' && (
        <div className="max-w-md mx-auto px-4 pt-4 pb-32 sm:px-6">
          
          {/* Header Bar */}
          <div className="flex items-center gap-3 pb-6 border-b border-zinc-100 mb-4">
            <button
              onClick={() => setView('account')}
              aria-label="Back to account"
              className="p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <h1 className="text-lg font-black tracking-tight text-black">Edit Profile</h1>
          </div>

          {/* Editable Rows */}
          <div className="bg-white rounded-3xl border border-zinc-100/90 shadow-xs divide-y divide-zinc-100 overflow-hidden">
            
            {/* 1. Profile Photo (Logo) */}
            <div 
              onClick={() => avatarInputRef.current?.click()}
              className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold text-black">Profile Photo</span>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-black text-white overflow-hidden border border-zinc-200 flex items-center justify-center shrink-0">
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#C6FF00]" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-xs">{shopName.substring(0, 2)}</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
              </div>
            </div>

            {/* 2. Banner */}
            <div 
              onClick={() => bannerInputRef.current?.click()}
              className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold text-black">Banner</span>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-8 rounded-lg bg-zinc-200 overflow-hidden border border-zinc-200 flex items-center justify-center shrink-0">
                  {uploadingBanner ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : bannerUrl ? (
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-zinc-400">None</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
              </div>
            </div>

            {/* 3. Shop Name */}
            <div 
              onClick={() => openFieldModal('shopName')}
              className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold text-black">Shop Name</span>
              <div className="flex items-center gap-2 max-w-[60%] justify-end">
                <span className="text-xs font-medium text-zinc-600 truncate">{shopName}</span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors shrink-0" />
              </div>
            </div>

            {/* 4. Username */}
            <div 
              onClick={() => openFieldModal('handle')}
              className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold text-black">Username</span>
              <div className="flex items-center gap-2 max-w-[60%] justify-end">
                <span className="text-xs font-medium text-zinc-600 truncate">@{handle.replace(/^@/, '')}</span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors shrink-0" />
              </div>
            </div>

            {/* 5. Bio */}
            <div 
              onClick={() => openFieldModal('bio')}
              className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold text-black">Bio</span>
              <div className="flex items-center gap-2 max-w-[60%] justify-end">
                <span className="text-xs font-medium text-zinc-600 truncate">{description || 'Add bio'}</span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors shrink-0" />
              </div>
            </div>

            {/* 6. Located in */}
            <div
              onClick={() => openFieldModal('locatedIn')}
              className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold text-black">Located in</span>
              <div className="flex items-center gap-2 max-w-[60%] justify-end">
                <span className="text-xs font-medium text-zinc-600 truncate">{locatedIn || 'Add town or city'}</span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors shrink-0" />
              </div>
            </div>

            {/* 7. Shop Directions */}
            <div 
              onClick={() => openFieldModal('directions')}
              className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold text-black">Shop Directions</span>
              <div className="flex items-center gap-2 max-w-[60%] justify-end">
                <span className="text-xs font-medium text-zinc-600 truncate">{directions || 'Add location/directions'}</span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors shrink-0" />
              </div>
            </div>

            {/* 8. Category */}
            <div 
              onClick={() => openFieldModal('category')}
              className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold text-black">Category</span>
              <div className="flex items-center gap-2 max-w-[60%] justify-end">
                <span className="text-xs font-medium text-zinc-600 truncate">{category}</span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors shrink-0" />
              </div>
            </div>

            {/* 9. WhatsApp Number */}
            <div 
              onClick={() => openFieldModal('whatsapp')}
              className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold text-black">WhatsApp Number</span>
              <div className="flex items-center gap-2 max-w-[60%] justify-end">
                <span className="text-xs font-medium text-zinc-600 truncate">{whatsapp || 'Add WhatsApp number'}</span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors shrink-0" />
              </div>
            </div>

          </div>

          {/* Prominent Neon Green Save Button */}
          <div className="mt-8">
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-sm py-4 px-6 rounded-2xl shadow-md shadow-[#C6FF00]/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>

        </div>
      )}

      {/* Field Input Dialog Modal */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-100/90 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-black">
                  {activeModal === 'shopName' && 'Edit Shop Name'}
                  {activeModal === 'handle' && 'Edit Username'}
                  {activeModal === 'bio' && 'Edit Bio'}
                  {activeModal === 'locatedIn' && 'Edit Located in'}
                  {activeModal === 'directions' && 'Edit Shop Directions'}
                  {activeModal === 'category' && 'Select Category'}
                  {activeModal === 'whatsapp' && 'Edit WhatsApp Number'}
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                  {activeModal === 'shopName' && 'The public name shown on your storefront'}
                  {activeModal === 'handle' && 'Your unique storefront handle and link (@handle)'}
                  {activeModal === 'bio' && 'Short description of what your shop sells'}
                  {activeModal === 'locatedIn' && 'The town or city shown publicly on your storefront'}
                  {activeModal === 'directions' && 'Clear walking or driving directions to your location'}
                  {activeModal === 'category' && 'Primary category for your catalog'}
                  {activeModal === 'whatsapp' && 'Customers will tap this number to place orders'}
                </p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeModal === 'category' ? (
              <div className="space-y-2 max-h-60 overflow-y-auto my-2 pr-1">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setTempValue(cat);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                      tempValue === cat ? 'bg-[#C6FF00] text-black shadow-xs' : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <span>{cat}</span>
                    {tempValue === cat && <Check className="w-4 h-4 text-black stroke-[3]" />}
                  </button>
                ))}
              </div>
            ) : activeModal === 'bio' || activeModal === 'locatedIn' || activeModal === 'directions' ? (
              <div className="space-y-2">
                <textarea
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  rows={activeModal === 'directions' ? 5 : 3}
                  autoFocus
                  placeholder={
                    activeModal === 'directions'
                      ? "e.g. Go to Mbali Mall first floor shop number 23 opposite the game arena..."
                      : activeModal === 'locatedIn'
                        ? 'e.g. Harare, Bulawayo, Mutare'
                        : 'e.g. Premium streetwear & sneakers in Harare. Nationwide delivery...'
                  }
                  className="w-full bg-zinc-50 border-2 border-zinc-200 focus:border-black rounded-2xl p-3.5 text-xs text-black font-medium focus:outline-none transition-colors resize-y min-h-[120px] max-h-[220px] overflow-y-auto leading-relaxed"
                />
                {activeModal === 'directions' && (
                  <p className="text-[10px] text-zinc-500 font-medium pl-1">
                    Tip: Enter each direction step on a new line for easy reading.
                  </p>
                )}
                {activeModal === 'locatedIn' && (
                  <p className="text-[10px] text-zinc-500 font-medium pl-1">
                    This is the short location customers see on your shop card. Add detailed directions separately below.
                  </p>
                )}
              </div>
            ) : activeModal === 'whatsapp' ? (
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-600">
                    <MessageCircle className="w-4 h-4 fill-emerald-600" />
                  </div>
                  <input
                    type="tel"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                    placeholder="e.g. +263 77 123 4567 or 0771234567"
                    className="w-full bg-zinc-50 border-2 border-zinc-200 focus:border-black rounded-2xl pl-10 pr-4 py-3.5 text-xs text-black font-medium focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 font-medium pl-1">
                  Enter with country code (e.g. +263 77...) or local format.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  {activeModal === 'handle' && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">@</span>
                  )}
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                    placeholder={activeModal === 'shopName' ? "e.g. Fresh Fits ZW" : "e.g. freshfits"}
                    className={`w-full bg-zinc-50 border-2 border-zinc-200 focus:border-black rounded-2xl ${activeModal === 'handle' ? 'pl-8' : 'px-3.5'} py-3.5 text-xs text-black font-medium focus:outline-none transition-colors`}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFieldModal}
                className="flex-1 py-3 bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Floating Navigation Bar */}
      <BottomNavBar />

    </div>
  );
};
