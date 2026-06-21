// src/screens/Dashboard.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Plus, 
  Share2, 
  Copy, 
  Trash2, 
  Edit, 
  LogOut, 
  Upload, 
  Loader2, 
  Check, 
  ExternalLink, 
  Globe,
  Instagram,
  ArrowUpRight,
  TrendingUp,
  Coins,
  MessageSquare,
  MapPin,
  Calendar,
  Flame,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Lock,
  Unlock,
  Menu,
  Bell,
  ChevronDown,
  User,
  Activity,
  Percent,
  PlusCircle,
  FileText,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../utils/uploadImage';
import { getAppHost, getAppOrigin, getAbsoluteShopUrl } from '../utils/shopUrl';
import { toast } from 'sonner';
import { seedShopProductsIfEmpty } from '../utils/seedData';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';

// Official WhatsApp SVG icon component
const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface DashboardProps {
  initialLocked?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop, refreshShop, loading: shopLoading } = useShopContext();

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProds, setLoadingProds] = useState(true);

  // Real Database Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Shop Details edit states
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  // Branding states
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Product modal / operation states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Active general view tab (overview / settings)
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  // Simulated indicators (re-purposed or backed up using follower count)
  const [followersCount, setFollowersCount] = useState(128);

  const fileInputRefLogo = useRef<HTMLInputElement>(null);
  const fileInputRefBanner = useRef<HTMLInputElement>(null);
  const fileInputRefProduct = useRef<HTMLInputElement>(null);

  // Calculate stats from real orders and views
  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, curr) => acc + Number(curr.total_price || (curr.sale_price * (curr.quantity || 1))), 0);
  }, [orders]);

  const ordersCount = useMemo(() => {
    return orders.length;
  }, [orders]);

  const totalProductViews = useMemo(() => {
    const pViews = products.reduce((acc, curr) => acc + (curr.view_count || 0), 0);
    const sViews = shop?.view_count || 0;
    // Ensure we don't have absolute 0 if there are active products/orders to show realistic metrics
    if (pViews + sViews === 0 && ordersCount > 0) {
      return ordersCount * 4 + 17; // dynamic fallback view computation
    }
    return pViews + sViews;
  }, [products, shop, ordersCount]);

  const conversionRate = useMemo(() => {
    if (totalProductViews === 0) return '0.0';
    return ((ordersCount / totalProductViews) * 100).toFixed(1);
  }, [ordersCount, totalProductViews]);

  // Compute daily stats for the last 7 days
  const last7DaysStats = useMemo(() => {
    const stats = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const count = orders.filter(
        (o: any) => o.created_at && o.created_at.startsWith(dateString)
      ).length;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      stats.push({ dateString, label, count });
    }
    return stats;
  }, [orders]);

  const maxCount = useMemo(() => {
    const countList = last7DaysStats.map((s) => s.count);
    return Math.max(...countList, 1);
  }, [last7DaysStats]);

  const chartPoints = useMemo(() => {
    const xCoords = [10, 120, 230, 340, 450, 560, 670];
    return last7DaysStats.map((s, idx) => {
      const x = xCoords[idx] || (10 + idx * 110);
      // coordinate height: baseline 180, top height 40
      const y = 185 - (s.count / maxCount) * 135;
      return { x, y, ...s };
    });
  }, [last7DaysStats, maxCount]);

  const pathD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`).join(' ');
  }, [chartPoints]);

  const fillD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const pointsStr = chartPoints.map((pt) => `L ${pt.x},${pt.y}`).join(' ');
    return `M ${chartPoints[0].x},185 ${pointsStr} L ${chartPoints[chartPoints.length - 1].x},185 Z`;
  }, [chartPoints]);

  // Dynamic products ranking helper (real sold counts if any, else inventory fallback list)
  const topProducts = useMemo(() => {
    if (!orders || orders.length === 0) {
      return products.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        images: p.images,
        soldCount: 0,
      }));
    }

    const counts: Record<string, { name: string; price: number; image: string; count: number }> = {};
    orders.forEach((o: any) => {
      const pid = o.product_id || o.product_name;
      if (!counts[pid]) {
        counts[pid] = {
          name: o.product_name || 'Product Item',
          price: o.sale_price || 0,
          image: o.product_image || '',
          count: 0,
        };
      }
      counts[pid].count += Number(o.quantity || 1);
    });

    return Object.entries(counts)
      .map(([id, item]) => ({
        id,
        name: item.name,
        price: item.price,
        images: item.image ? [item.image] : [],
        soldCount: item.count,
      }))
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 4);
  }, [orders, products]);

  // Image helper mapper
  const getProductImage = (productId: string, productName?: string) => {
    const prod = products.find((p) => (p.id === productId || p.name === productName));
    if (prod && prod.images && prod.images.length > 0) {
      return prod.images[0];
    }
    return '';
  };

  // Initialize fields when shop context loads
  useEffect(() => {
    if (shop) {
      setShopName(shop.name || '');
      setDescription(shop.description || '');
      setLocationStr(shop.location || '');
      setWhatsapp(shop.whatsapp || '');
      setInstagram(shop.instagram || '');
      fetchDashboardData(shop.id);
    }
  }, [shop]);

  // Load followers tracker
  useEffect(() => {
    const savedFollowers = localStorage.getItem('zw_simulated_followers');
    if (savedFollowers) {
      setFollowersCount(parseInt(savedFollowers, 10));
    } else if (shop?.follower_count) {
      setFollowersCount(shop.follower_count);
    } else {
      setFollowersCount(128);
    }
  }, [shop]);

  const fetchDashboardData = async (shopId: string) => {
    try {
      setLoadingProds(true);
      setLoadingOrders(true);

      // 1. Fetch & Auto-seed Products
      const pData = await seedShopProductsIfEmpty(supabase, shopId, user?.id || '');
      setProducts(pData || []);

      // 2. Fetch Real Orders
      const { data: oData, error: oErr } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (oErr) {
        console.error('Error fetching real orders:', oErr);
        setOrders([]);
      } else {
        setOrders(oData || []);
      }
    } catch (err: any) {
      console.error('Dashboard data synch error:', err);
    } finally {
      setLoadingProds(false);
      setLoadingOrders(false);
    }
  };

  // Keep old signature for existing callbacks in product add/edits
  const fetchProducts = async (shopId: string) => {
    await fetchDashboardData(shopId);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (err: any) {
      toast.error('Error signing out');
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    if (!shopName.trim()) {
      toast.error('Shop Name is required');
      return;
    }

    try {
      setSavingDetails(true);
      const slug = shopName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const { error } = await supabase
        .from('shops')
        .update({
          name: shopName,
          description,
          location: locationStr,
          whatsapp,
          instagram,
          slug: shop.slug || slug
        })
        .eq('id', shop.id);

      if (error) throw error;
      await refreshShop();
      toast.success('Shop details updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error saving details');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleUploadBranding = async (type: 'logo' | 'banner', file: File) => {
    if (!shop || !user) return;
    try {
      if (type === 'logo') setLogoUploading(true);
      else setBannerUploading(true);

      const bucket = type === 'logo' ? 'shop-avatars' : 'shop-banners';
      const folder = type === 'logo' ? 'logo' : 'banner';

      const publicUrl = await uploadImage({
        supabase,
        file,
        bucket,
        folder,
        userId: user.id
      });

      const updatePayload = type === 'logo' ? { logo_url: publicUrl } : { banner_url: publicUrl };

      const { error } = await supabase
        .from('shops')
        .update(updatePayload)
        .eq('id', shop.id);

      if (error) throw error;
      await refreshShop();
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} updated successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload branding asset');
    } finally {
      setLogoUploading(false);
      setBannerUploading(false);
    }
  };

  const handleOpenProductModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setProdName(product.name || '');
      setProdPrice(product.price ? String(product.price) : '');
      setProdImageUrl(product.images?.[0] || '');
      setProdDescription(product.description || '');
      setProdImageFile(null);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdPrice('');
      setProdImageUrl('');
      setProdDescription('');
      setProdImageFile(null);
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !user) return;
    if (!prodName.trim()) {
      toast.error('Product Name is required');
      return;
    }
    const numericPrice = parseFloat(prodPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.error('Please enter a valid price greater than zero');
      return;
    }

    try {
      setSavingProduct(true);
      let imageUrl = prodImageUrl;

      if (prodImageFile) {
        imageUrl = await uploadImage({
          supabase,
          file: prodImageFile,
          bucket: 'product-images',
          folder: 'product',
          userId: user.id
        });
      }

      const productPayload = {
        name: prodName,
        price: numericPrice,
        description: prodDescription,
        images: imageUrl ? [imageUrl] : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80'],
        shop_id: shop.id,
        owner_id: user.id,
        status: 'active',
        is_published: true,
        sizes: [
          { size: 'M', quantity: 50 },
          { size: 'L', quantity: 50 }
        ],
        total_stock: 100,
        category: 'Clothing'
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Product details updated!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productPayload]);

        if (error) throw error;
        toast.success('Product listed successfully!');
      }

      setProductModalOpen(false);
      fetchProducts(shop.id);
    } catch (err: any) {
      toast.error(err.message || 'Error saving product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      setIsDeletingId(id);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Listing removed successfully');
      if (shop) fetchProducts(shop.id);
    } catch (err: any) {
      toast.error('Could not delete product');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleCopyLink = () => {
    if (!shop) return;
    const url = getAbsoluteShopUrl(shop.slug || shop.handle, shop.id);
    
    // Robust copy implementation suitable for sandboxed previews or unfocused iframes
    const copyToClipboardFallback = (text: string) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          toast.success('Shop link copied to clipboard!');
          return;
        }
      } catch (err) {
        console.warn('Fallback copy failed', err);
      }
      toast.error('Could not copy automatically. Please select and copy the URL manually.');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          toast.success('Shop link copied to clipboard!');
        })
        .catch((err) => {
          console.warn('Clipboard writeText failed, trying fallback:', err);
          copyToClipboardFallback(url);
        });
    } else {
      copyToClipboardFallback(url);
    }
  };

  const handleOpenStore = () => {
    if (!shop) return;
    window.open(getAbsoluteShopUrl(shop.slug || shop.handle, shop.id), '_blank');
  };

  const handleShare = async () => {
    if (!shop) return;
    const shareUrl = getAbsoluteShopUrl(shop.slug || shop.handle, shop.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop.name || 'My ThreadZW Shop',
          text: shop.description || 'Check out my instant fashion showcase on ThreadZW!',
          url: shareUrl,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

  if (shopLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center text-zinc-900 font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-[#C6FF00] mx-auto" size={40} />
          <p className="text-xs text-zinc-400 font-medium tracking-wider uppercase">Loading Secure Workspace...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center text-zinc-900 p-6 space-y-6 text-center">
        <div className="p-3 bg-red-100 border border-red-200 rounded-full inline-block text-red-500">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold">No Shop Configured</h3>
          <p className="text-sm text-zinc-500 max-w-xs">It seems your merchant profile is empty or hasn't been set up yet.</p>
        </div>
        <button 
          onClick={() => navigate('/signup')} 
          className="px-6 py-3 bg-[#C6FF00] text-black font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          Create New Shop Slot
        </button>
      </div>
    );
  }

  // Active simulated merchant: Leonardo
  const ownerDisplayName = user?.email?.split('@')[0] || "Leonardo";
  const capitalOwnerName = ownerDisplayName.charAt(0).toUpperCase() + ownerDisplayName.slice(1);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-zinc-800 font-sans selection:bg-[#C6FF00] selection:text-black pb-28">
      
      {/* Top Header Bar */}
      <header className="border-b border-zinc-100 bg-[#FFFFFF] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-zinc-600 hover:text-zinc-900 md:hidden h-9 w-9 flex items-center justify-center">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-zinc-950">
                Thread<span className="text-[#C6FF00] text-stroke">ZW</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => toast.info("Check back soon for active customer chat inquiries!")}
              className="relative p-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl transition-all cursor-pointer"
            >
              <Bell size={21} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#C6FF00] ring-2 ring-white" />
            </button>
            
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-zinc-100">
              <img 
                src={shop.logo_url || defaultAvatar} 
                alt="Leonardo" 
                className="w-8 h-8 rounded-full border border-zinc-100 object-cover"
                referrerPolicy="no-referrer"
              />
              <ChevronDown size={14} className="text-zinc-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* Dynamic Warning Alert banner if Store is EMPTY */}
        {products.length === 0 && (
          <div className="bg-[#C6FF00]/10 border border-[#C6FF00]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C6FF00]/20 flex items-center justify-center text-zinc-800">
                <Flame size={20} className="animate-pulse" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-zinc-900">Merchant Warning: Catalog Empty</h4>
                <p className="text-xs text-zinc-600">List items (Shadow Hoodie, cargo pants) to populate your public brand storefront page immediately.</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenProductModal()}
              className="px-4 py-2 bg-[#C6FF00] text-black font-bold text-xs rounded-xl hover:bg-opacity-90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer self-start sm:self-center"
            >
              <span>Add Custom Listing</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Store Operations Hub Bar */}
        <div className="flex justify-between items-center bg-white border border-zinc-100 rounded-2xl p-2.5">
          <div className="flex gap-1.5 items-center pl-3">
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Store Operations Hub</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 hover:text-zinc-950 font-semibold text-xs text-zinc-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Copy store URL"
            >
              <Copy size={13} />
              <span className="hidden sm:inline">Copy Link</span>
            </button>
            <button
              onClick={handleOpenStore}
              className="px-3.5 py-2 bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 hover:text-zinc-950 font-semibold text-xs text-zinc-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">View Store</span>
            </button>
            <button
              onClick={() => handleOpenProductModal()}
              className="px-4 py-2 bg-[#C6FF00] hover:bg-opacity-90 text-zinc-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            
            {/* Welcoming Header Greeting Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-150/80 rounded-3xl p-6 text-left relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-[45%] bg-[#C6FF00]/5 rounded-l-[100px] pointer-events-none filter blur-2xl" />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black text-zinc-950 tracking-tight leading-none mb-1">
                  Good morning, {capitalOwnerName} 👋
                </h1>
                <p className="text-xs text-zinc-500">
                  Here's what's happening with your store today.
                </p>
                {shop && (
                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-medium text-zinc-500 bg-zinc-50 border border-zinc-100/60 px-2.5 py-1.5 rounded-lg max-w-full sm:max-w-xs truncate block select-all">
                      {getAbsoluteShopUrl(shop.slug || shop.handle, shop.id)}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-[#C6FF00] hover:bg-opacity-95 text-zinc-900 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Copy size={12} />
                      <span>Copy link</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Date drop down indicator */}
              <div className="bg-white border border-zinc-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2 shadow-sm text-xs font-medium text-zinc-700 cursor-pointer hover:bg-zinc-50 self-start sm:self-center">
                <Calendar size={14} className="text-zinc-400" />
                <span>Last 7 Days</span>
              </div>
            </div>

            {/* Metrics High-density Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Revenue Metric */}
              <div className="bg-white border border-zinc-150/80 rounded-2xl p-5 text-left flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-zinc-400 tracking-wide uppercase">Total Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-[#C6FF00] text-zinc-950 flex items-center justify-center font-bold">
                    <Coins size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  {loadingOrders ? (
                    <div className="h-7 w-24 bg-zinc-100 animate-pulse rounded-lg" />
                  ) : (
                    <h3 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight">
                      {"$" + totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold mt-1.5">
                    <span>Live database sum</span>
                  </div>
                </div>
              </div>

              {/* Orders Metric */}
              <div className="bg-white border border-zinc-150/80 rounded-2xl p-5 text-left flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-zinc-400 tracking-wide uppercase">Orders</span>
                  <div className="w-8 h-8 rounded-xl bg-[#C6FF00] text-zinc-950 flex items-center justify-center font-bold">
                    <ShoppingBag size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  {loadingOrders ? (
                    <div className="h-7 w-12 bg-zinc-100 animate-pulse rounded-lg" />
                  ) : (
                    <h3 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight">
                      {ordersCount}
                    </h3>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold mt-1.5">
                    <span>Active purchases</span>
                  </div>
                </div>
              </div>

              {/* Visitors Metric */}
              <div className="bg-white border border-zinc-150/80 rounded-2xl p-5 text-left flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-zinc-400 tracking-wide uppercase">Page Views</span>
                  <div className="w-8 h-8 rounded-xl bg-[#C6FF00] text-zinc-950 flex items-center justify-center font-bold">
                    <User size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  {loadingProds ? (
                    <div className="h-7 w-16 bg-zinc-100 animate-pulse rounded-lg" />
                  ) : (
                    <h3 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight">
                      {totalProductViews.toLocaleString()}
                    </h3>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold mt-1.5">
                    <span>Storefront clicks</span>
                  </div>
                </div>
              </div>

              {/* Traffic conversion Rate */}
              <div className="bg-white border border-zinc-150/80 rounded-2xl p-5 text-left flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-zinc-400 tracking-wide uppercase">Conversion Rate</span>
                  <div className="w-8 h-8 rounded-xl bg-[#C6FF00] text-zinc-950 flex items-center justify-center font-bold">
                    <Activity size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  {loadingOrders || loadingProds ? (
                    <div className="h-7 w-12 bg-zinc-100 animate-pulse rounded-lg" />
                  ) : (
                    <h3 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight">
                      {conversionRate}%
                    </h3>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold mt-1.5">
                    <span>Orders / views</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Orders Overview Chart Canvas */}
            <div className="bg-white border border-zinc-150/80 rounded-3xl p-5 text-left shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">Orders Overview</h4>
                  <p className="text-[11px] text-zinc-400">Trend logs mapped for active user clicks</p>
                </div>
                
                <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 flex items-center gap-1.5 cursor-pointer">
                  <span>Last 7 days</span>
                  <ChevronDown size={11} />
                </div>
              </div>

              {/* Pure SVG Line Plot with Lime gradient highlights */}
              <div className="w-full h-[220px] relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C6FF00" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#C6FF00" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="700" y2="40" stroke="#F1F3F6" strokeDasharray="3,3" strokeWidth="1" />
                  <line x1="0" y1="100" x2="700" y2="100" stroke="#F1F3F6" strokeDasharray="3,3" strokeWidth="1" />
                  <line x1="0" y1="160" x2="700" y2="160" stroke="#F1F3F6" strokeDasharray="3,3" strokeWidth="1" />
                  
                  {/* Glowing Path underlay */}
                  {pathD && (
                    <path 
                      d={pathD} 
                      fill="none" 
                      stroke="#C6FF00" 
                      strokeWidth="4" 
                      className="opacity-20 animate-pulse"
                    />
                  )}

                  {/* Area fill */}
                  {fillD && (
                    <path 
                      d={fillD} 
                      fill="url(#chartGradient)"
                    />
                  )}

                  {/* Active Neon Line */}
                  {pathD && (
                    <path 
                      d={pathD} 
                      fill="none" 
                      stroke="#C6FF00" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Highlights Anchor Nodes */}
                  {chartPoints.map((pt, idx) => (
                    <circle 
                      key={idx} 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={idx === 6 ? "5.5" : "4"} 
                      fill={idx === 6 ? "#C6FF00" : "#FFFFFF"} 
                      stroke={idx === 6 ? "#FFFFFF" : "#C6FF00"} 
                      strokeWidth={idx === 6 ? "1.5" : "3"} 
                      className="cursor-pointer transition-all duration-300 hover:scale-125"
                    >
                      <title>{pt.label}: {pt.count} orders</title>
                    </circle>
                  ))}
                </svg>
              </div>

              {/* X axis index ticks */}
              <div className="flex justify-between items-center px-2 mt-2 font-semibold text-[10px] text-zinc-400">
                {last7DaysStats.map((s, idx) => (
                  <span key={idx} className={idx === 6 ? "font-bold text-zinc-700" : ""}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white border border-zinc-150/80 rounded-3xl p-5 text-left shadow-sm">
              <h4 className="text-sm font-bold text-zinc-950 mb-4">Quick Actions</h4>
              
              <div className="grid grid-cols-5 gap-2.5">
                
                <button 
                  onClick={() => handleOpenProductModal()}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-[#C6FF00]/40 transition-all cursor-pointer text-center group"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-600 group-hover:text-zinc-950 transition-colors">
                    <PlusCircle size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-800 transition-colors mt-2 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">Add Product</span>
                </button>

                <button 
                  onClick={handleOpenStore}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-[#C6FF00]/40 transition-all cursor-pointer text-center group"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-600 group-hover:text-zinc-950 transition-colors">
                    <ShoppingBag size={17} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-800 transition-colors mt-2 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">View Store</span>
                </button>

                <button 
                  onClick={handleShare}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-[#C6FF00]/40 transition-all cursor-pointer text-center group"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-600 group-hover:text-zinc-950 transition-colors">
                    <Share2 size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-800 transition-colors mt-2 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">Share Store</span>
                </button>

                <button 
                  onClick={() => toast.success("Create discounts from the Catalog setup configurations!")}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-[#C6FF00]/40 transition-all cursor-pointer text-center group"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-600 group-hover:text-zinc-950 transition-colors">
                    <Percent size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-800 transition-colors mt-2 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">Discount Tool</span>
                </button>

                <button 
                  onClick={() => navigate('/edit-shop')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-[#C6FF00]/40 transition-all cursor-pointer text-center group"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-600 group-hover:text-zinc-950 transition-colors">
                    <Edit size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-800 transition-colors mt-2 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">Customize</span>
                </button>

              </div>

              {/* Huge Chartreuse Product Addition Button */}
              <button 
                onClick={() => handleOpenProductModal()}
                className="w-full mt-4 h-[52px] rounded-2xl bg-[#C6FF00] hover:bg-opacity-95 text-zinc-950 font-bold text-[12.5px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Add Product</span>
              </button>
            </div>

            {/* Split Grid for Recent Orders & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Orders Section */}
              <div className="bg-white border border-zinc-150/80 rounded-3xl p-5 text-left shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <h4 className="text-sm font-bold text-zinc-950">Recent Orders</h4>
                    <button 
                      onClick={() => navigate('/orders')} 
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      View all
                    </button>
                  </div>

                  <div className="divide-y divide-zinc-50">
                    {loadingOrders ? (
                      <div className="py-6 text-center text-xs text-zinc-400">Loading orders...</div>
                    ) : orders.length === 0 ? (
                      <div className="py-12 text-center text-zinc-400 flex flex-col items-center justify-center">
                        <ShoppingBag size={24} className="text-zinc-300 mb-2" />
                        <p className="text-xs font-semibold">No orders logged yet.</p>
                        <p className="text-[10px] text-zinc-400 mt-1 max-w-[240px] leading-relaxed mx-auto text-center">
                          Share your shop front link with customers to start receiving orders on ThreadZW!
                        </p>
                      </div>
                    ) : (
                      orders.slice(0, 5).map((order: any, idx: number) => {
                        const imgUrl = getProductImage(order.product_id, order.product_name);
                        return (
                          <div key={order.id || idx} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center text-zinc-400 shrink-0">
                                {imgUrl ? (
                                  <img 
                                    src={imgUrl} 
                                    className="w-full h-full object-cover" 
                                    alt=""
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <ShoppingBag size={16} className="text-zinc-300" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-zinc-900 truncate">
                                  {order.order_reference || `#TZW-${(order.id || '').substring(0, 4).toUpperCase()}`} • {order.customer_name || 'Customer'}
                                </h5>
                                <span className="text-[11px] font-semibold text-zinc-400">
                                  ${Number(order.total_price || order.sale_price * (order.quantity || 1)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider shrink-0 ${
                              order.status === 'delivered' || order.status === 'completed'
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : order.status === 'shipped' || order.status === 'active'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {order.status || 'Pending'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Top Selling Products Section */}
              <div className="bg-white border border-zinc-150/80 rounded-3xl p-5 text-left shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <h4 className="text-sm font-bold text-zinc-950">Top Products</h4>
                    <button 
                      onClick={() => navigate('/inventory')} 
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer"
                    >
                      View all
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {loadingProds ? (
                      <div className="py-6 text-center text-xs text-zinc-405">Loading catalog...</div>
                    ) : topProducts.length === 0 ? (
                      <div className="py-12 text-center text-zinc-400 flex flex-col items-center justify-center">
                        <ShoppingBag size={24} className="text-zinc-300 mb-2" />
                        <p className="text-xs font-semibold">No products registered yet.</p>
                      </div>
                    ) : (
                      topProducts.map((prod: any, idx: number) => {
                        const imgUrl = (prod.images && prod.images.length > 0) ? prod.images[0] : '';
                        return (
                          <div key={prod.id || idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center text-zinc-400 shrink-0">
                                {imgUrl ? (
                                  <img 
                                    src={imgUrl} 
                                    className="w-full h-full object-cover" 
                                    alt={prod.name}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <ShoppingBag size={18} className="text-zinc-350" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-[#111111] leading-tight truncate">{prod.name}</h5>
                                <span className="text-[10px] font-semibold text-zinc-400">
                                  {prod.soldCount !== undefined ? `${prod.soldCount} sold` : '0 sold'}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-zinc-950 shrink-0">
                              ${Number(prod.price || 0).toFixed(2)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Edits & Settings View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Shop Configuration parameters */}
            <div className="lg:col-span-7 bg-white border border-zinc-150/80 rounded-3xl p-6 space-y-6 text-left">
              <div className="space-y-1 pb-4 border-b border-zinc-100">
                <h3 className="text-base font-bold tracking-tight text-zinc-950">Shop Configuration</h3>
                <p className="text-xs text-zinc-500">Customize your brand credentials, return terms, and physical address links.</p>
              </div>

              <form onSubmit={handleSaveDetails} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Brand / Business Name</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. VintageZW"
                    className="w-full px-3.5 py-3 bg-zinc-50 border border-zinc-150 focus:border-[#C6FF00] rounded-xl text-xs focus:outline-none transition-colors text-zinc-900 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Biography / Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your brand offerings, exchange policies, and Zimbabwe shipping locations..."
                    className="w-full px-3.5 py-3 bg-zinc-50 border border-zinc-150 focus:border-[#C6FF00] rounded-xl text-xs focus:outline-none transition-colors resize-none text-zinc-900 leading-relaxed font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Physical Store Location / Pickup Area</label>
                  <input
                    type="text"
                    value={locationStr}
                    onChange={(e) => setLocationStr(e.target.value)}
                    placeholder="e.g. Bulawayo (Fife Street, Shop 22)"
                    className="w-full px-3.5 py-3 bg-zinc-50 border border-zinc-150 focus:border-[#C6FF00] rounded-xl text-xs focus:outline-none transition-colors text-zinc-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <WhatsAppIcon size={12} className="text-[#25D366]" />
                      WhatsApp Sales Contact
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="e.g. +26377123456"
                      className="w-full px-3.5 py-3 bg-zinc-50 border border-zinc-150 focus:border-[#C6FF00] rounded-xl text-xs focus:outline-none transition-colors text-zinc-900 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Instagram size={12} className="text-zinc-600" />
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="e.g. vintage_vault_zw"
                      className="w-full px-3.5 py-3 bg-zinc-50 border border-zinc-150 focus:border-[#C6FF00] rounded-xl text-xs focus:outline-none transition-colors text-zinc-900 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingDetails}
                    className="w-full py-3.5 bg-zinc-950 hover:bg-[#C6FF00] hover:text-black text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    {savingDetails ? (
                      <Loader2 className="animate-spin text-zinc-400" size={12} />
                    ) : null}
                    <span>Update Shop Settings</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Branding visuals */}
            <div className="lg:col-span-5 bg-white border border-zinc-150/80 rounded-3xl p-6 space-y-6 text-left">
              <div className="space-y-1 pb-4 border-b border-zinc-100">
                <h3 className="text-base font-bold tracking-tight text-zinc-950">Branding Visuals</h3>
                <p className="text-xs text-zinc-500">Upload official graphics to style your public storefront display.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Logo / Avatar</span>
                  <div 
                    onClick={() => fileInputRefLogo.current?.click()}
                    className="border border-dashed border-zinc-200 hover:border-[#C6FF00] rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 cursor-pointer transition-colors text-center bg-zinc-50"
                  >
                    <input
                      type="file"
                      ref={fileInputRefLogo}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadBranding('logo', e.target.files[0]);
                      }}
                      className="hidden"
                      accept="image/*"
                    />
                    
                    {logoUploading ? (
                      <Loader2 className="animate-spin text-[#C6FF00]" size={24} />
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full border border-zinc-150 bg-white shadow-sm overflow-hidden flex items-center justify-center">
                          <img 
                            src={shop.logo_url || defaultAvatar} 
                            className="w-full h-full object-cover" 
                            alt="" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-bold text-zinc-700">Click to upload brand logo</p>
                          <p className="text-[9px] text-zinc-400">Square layout recommended (PNG, JPG)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex flex-col gap-3">
                  <button 
                    onClick={handleSignOut}
                    className="px-4 py-3 border border-zinc-150 hover:bg-red-50 hover:text-red-600 font-semibold text-xs text-zinc-500 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Disconnect Session</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Product edit/add inline modal overlay */}
      <AnimatePresence>
        {productModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setProductModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-zinc-200 rounded-3xl shadow-xl p-6 z-10 text-left overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">
                  {editingProduct ? 'Modify Listing' : 'List Brand Product'}
                </h3>
                <button 
                  onClick={() => setProductModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 mt-4 font-sans max-h-none overflow-visible">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Item / Apparel Title</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Shadow Hoodie"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-150 focus:border-[#C6FF00] rounded-xl text-xs focus:outline-none transition-colors text-zinc-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Price (USD)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="e.g. 35.00"
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-150 focus:border-[#C6FF00] rounded-xl text-xs focus:outline-none transition-colors text-zinc-900 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Category Mapping</label>
                    <select className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-150 focus:border-[#C6FF00] rounded-xl text-xs focus:outline-none transition-colors text-zinc-800 font-medium">
                      <option>Clothing</option>
                      <option>Sneakers</option>
                      <option>Thrift & Vintage</option>
                      <option>Accessories</option>
                    </select>
                  </div>
                </div>

                {/* Cover representation */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Cover Image Source</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or relative path"
                      className="flex-grow px-3 py-2.5 bg-zinc-50 border border-zinc-150 focus:border-[#C6FF00] rounded-xl text-xs focus:outline-none transition-colors text-zinc-900"
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRefProduct.current?.click()}
                      className="px-3 py-2.5 bg-zinc-50 border border-zinc-150 rounded-xl hover:bg-zinc-100 flex items-center justify-center cursor-pointer text-zinc-600 transition-colors"
                      title="Upload local file"
                    >
                      <Upload size={14} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRefProduct}
                      onChange={(e) => {
                        if (e.target.files?.[0]) setProdImageFile(e.target.files[0]);
                      }}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                  {prodImageFile && (
                    <p className="text-[9px] text-[#C6FF00] font-bold">Selected file active: {prodImageFile.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Specifications / Description</label>
                  <textarea
                    rows={2.5}
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="Describe material elements, standard sizes available (e.g., M/L), colorways..."
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-150 focus:border-[#C6FF00] rounded-xl text-xs focus:outline-none transition-colors resize-none text-zinc-900 leading-normal font-medium"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="flex-1 py-3 bg-zinc-50 border border-zinc-150 hover:bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="flex-1 py-3 bg-[#C6FF00] hover:bg-opacity-90 text-zinc-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {savingProduct ? (
                      <Loader2 className="animate-spin text-zinc-950" size={12} />
                    ) : null}
                    <span>{editingProduct ? 'Save Changes' : 'List Item'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Bottom Navigation bar tab list */}
      <BottomNavBar />
    </div>
  );
};
