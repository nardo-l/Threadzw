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
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Camera,
  Eye,
  Tag,
  Layers,
  Award,
  Download,
  Printer,
  ChevronUp,
  Search,
  ShoppingCart,
  Compass,
  Info,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../utils/uploadImage';
import { getAppHost, getAppOrigin, getAbsoluteShopUrl } from '../utils/shopUrl';
import { getSizesForCategory } from '../utils/sizes';
import { toast } from 'sonner';
import { seedShopProductsIfEmpty } from '../utils/seedData';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { createMerchantNotification } from '../lib/analytics';


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
  const { shop, refreshShop, loading: shopLoading, authLoading } = useShopContext();

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
  const [prodDescription, setProdDescription] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // New multi-step onboarding wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardDirection, setWizardDirection] = useState<number>(1);
  const [prodCategory, setProdCategory] = useState('Clothing');
  const [prodSalePrice, setProdSalePrice] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodColors, setProdColors] = useState<string[]>([]);
  const [useMultipleSizes, setUseMultipleSizes] = useState(false);
  const [sizeCategory, setSizeCategory] = useState<'apparel' | 'sneakers' | 'accessories' | 'custom'>('apparel');
  const [sizeStock, setSizeStock] = useState<Record<string, { active: boolean; stock: number }>>({
    'XS': { active: false, stock: 10 },
    'S': { active: true, stock: 10 },
    'M': { active: true, stock: 10 },
    'L': { active: true, stock: 10 },
    'XL': { active: false, stock: 10 },
    'XXL': { active: false, stock: 10 },
  });
  const [generalStock, setGeneralStock] = useState('10');
  const [prodBrand, setProdBrand] = useState('');
  const [prodMaterial, setProdMaterial] = useState('');
  const [prodGender, setProdGender] = useState('Unisex');
  const [prodCondition, setProdCondition] = useState('New');
  const [isFeatured, setIsFeatured] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCustomSizeForm, setShowCustomSizeForm] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // New states for Step 3 size & stock matching AddProduct/EditProduct layout
  const [activeSizeEditing, setActiveSizeEditing] = useState<string | null>(null);
  const [tempStockInput, setTempStockInput] = useState('');
  const [showCustomSizeInput, setShowCustomSizeInput] = useState(false);
  const [customSizeName, setCustomSizeName] = useState('');

  // Sizing adjustments helpers for the onboard wizard
  const handleConfirmWizardStock = () => {
    if (!activeSizeEditing) return;
    const qty = parseInt(tempStockInput);
    if (!tempStockInput.trim() || isNaN(qty)) {
      toast.error('Please enter a valid stock quantity.');
      return;
    }
    if (qty <= 0) {
      toast.error('Stock quantity must be greater than zero.');
      return;
    }

    setSizeStock(prev => ({
      ...prev,
      [activeSizeEditing]: { active: true, stock: qty }
    }));

    setActiveSizeEditing(null);
    setTempStockInput('');
  };

  const handleRemoveWizardSize = (sz: string) => {
    setSizeStock(prev => {
      const copy = { ...prev };
      delete copy[sz];
      return copy;
    });
    toast.success(`Removed size ${sz}.`);
  };

  const handleAddWizardCustomSizeName = () => {
    const nameInput = customSizeName.trim();
    if (!nameInput) return;
    
    // Check for duplicates
    const matchedExisting = Object.keys(sizeStock).find(k => k.toUpperCase() === nameInput.toUpperCase() && sizeStock[k]?.active);
    if (matchedExisting) {
      toast.error(`Size "${matchedExisting}" is already added.`);
      return;
    }

    setActiveSizeEditing(nameInput);
    setTempStockInput('');
    setShowCustomSizeInput(false);
    setCustomSizeName('');
  };

  const wizardStandardSizes = useMemo(() => getSizesForCategory(prodCategory), [prodCategory]);
  const wizardHasSizes = wizardStandardSizes !== null;

  // Active general view tab (overview / settings)
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  // State for analytics events and notifications loaded from Supabase
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Filter events to only consider store views and product views as visits
  const visitEvents = useMemo(() => {
    return analyticsEvents.filter(e => e.event_type === 'store_view' || e.event_type === 'product_view');
  }, [analyticsEvents]);

  // Derived KPIs for Website Visits
  const visitsKPIs = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    const total = visitEvents.length;
    const today = visitEvents.filter(e => e.created_at && new Date(e.created_at) >= todayStart).length;
    const week = visitEvents.filter(e => e.created_at && new Date(e.created_at) >= startOfWeek).length;
    const month = visitEvents.filter(e => e.created_at && new Date(e.created_at) >= startOfMonth).length;

    const uniqueVisitors = new Set(visitEvents.map(e => e.visitor_id).filter(Boolean)).size;

    return {
      total,
      today,
      week,
      month,
      uniqueVisitors
    };
  }, [visitEvents]);

  // Products sorted by view counts (i.e. product_view count)
  const mostViewedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    const counts: Record<string, number> = {};
    visitEvents.forEach(e => {
      if (e.event_type === 'product_view' && e.product_id) {
        counts[e.product_id] = (counts[e.product_id] || 0) + 1;
      }
    });

    return products.map(p => {
      const views = counts[p.id] || p.view_count || 0;
      return {
        ...p,
        views
      };
    }).sort((a, b) => b.views - a.views);
  }, [products, visitEvents]);

  // Recent Visit Activity
  const recentVisitActivity = useMemo(() => {
    return visitEvents.slice(0, 10).map((e, index) => {
      let label = "Store homepage viewed";
      if (e.event_type === 'product_view') {
        const prod = products.find(p => p.id === e.product_id);
        label = prod ? `Viewed product: ${prod.name}` : "Viewed product listing";
      }
      return {
        id: e.id || `visit-${index}`,
        label,
        created_at: e.created_at || new Date().toISOString()
      };
    });
  }, [visitEvents, products]);

  // Filter events for purchase intents
  const purchaseIntentEvents = useMemo(() => {
    return analyticsEvents.filter(e => e.event_type === 'purchase_intent');
  }, [analyticsEvents]);

  // Derived KPIs for Buyer Intent & Estimated Revenue
  const merchantKPIs = useMemo(() => {
    const totalIntents = purchaseIntentEvents.length;
    const totalValue = purchaseIntentEvents.reduce((sum, e) => sum + Number(e.metadata?.price || 0), 0);
    const conversionRate = Number(localStorage.getItem('threadzw_conversion_rate') || '30') / 100;
    const estimatedRevenue = totalValue * conversionRate;

    return {
      totalIntents,
      totalValue,
      estimatedRevenue,
      conversionRatePercent: Number(localStorage.getItem('threadzw_conversion_rate') || '30')
    };
  }, [purchaseIntentEvents]);

  // Calculate top traffic sources from referrers
  const topTrafficSources = useMemo(() => {
    const counts: Record<string, number> = {};
    visitEvents.forEach(e => {
      const ref = e.referrer || e.metadata?.referrer_label || 'Direct';
      counts[ref] = (counts[ref] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [visitEvents]);

  // Chart timeframes restricted to today, 7days, 30days
  const [chartTimeframe, setChartTimeframe] = useState<'today' | '7days' | '30days'>('7days');

  // Daily average and trend calculations
  const dailyVisitsChartData = useMemo(() => {
    const now = new Date();
    const points: { label: string; value: number }[] = [];

    const filterVisitsByRange = (start: Date, end: Date) => {
      return visitEvents.filter(e => {
        if (!e.created_at) return false;
        const d = new Date(e.created_at);
        return d >= start && d <= end;
      });
    };

    if (chartTimeframe === 'today') {
      // 6 blocks of 4 hours
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - (i + 1) * 4);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - i * 4);
        const count = filterVisitsByRange(start, end).length;
        const label = `${end.getHours()}:00`;
        points.push({ label, value: count });
      }
    } else if (chartTimeframe === '7days') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);
        const count = filterVisitsByRange(start, end).length;
        const label = start.toLocaleDateString('en-US', { weekday: 'short' });
        points.push({ label, value: count });
      }
    } else {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);
        const count = filterVisitsByRange(start, end).length;
        const label = start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        points.push({ label, value: count });
      }
    }

    return points;
  }, [visitEvents, chartTimeframe]);

  const maxVisitsValue = useMemo(() => {
    const vals = dailyVisitsChartData.map(pt => pt.value);
    return Math.max(...vals, 1);
  }, [dailyVisitsChartData]);

  const visitsChartPoints = useMemo(() => {
    if (dailyVisitsChartData.length === 0) return [];
    const width = 700;
    const height = 160;
    const stepX = dailyVisitsChartData.length > 1 ? width / (dailyVisitsChartData.length - 1) : width;
    
    return dailyVisitsChartData.map((pt, idx) => {
      const x = idx * stepX;
      const valRatio = maxVisitsValue > 0 ? pt.value / maxVisitsValue : 0;
      const y = 180 - (valRatio * height);
      return {
        x,
        y,
        label: pt.label,
        count: pt.value
      };
    });
  }, [dailyVisitsChartData, maxVisitsValue]);

  const visitsPathD = useMemo(() => {
    if (visitsChartPoints.length === 0) return '';
    return visitsChartPoints.map((pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      return `L ${pt.x} ${pt.y}`;
    }).join(' ');
  }, [visitsChartPoints]);

  const visitsFillD = useMemo(() => {
    if (visitsChartPoints.length === 0) return '';
    const startPath = `M 0 180`;
    const linePaths = visitsChartPoints.map(pt => `L ${pt.x} ${pt.y}`).join(' ');
    const endPath = `L ${visitsChartPoints[visitsChartPoints.length - 1].x} 180 Z`;
    return `${startPath} ${linePaths} ${endPath}`;
  }, [visitsChartPoints]);

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return 'some time ago';
    }
  };

  // Simulated indicators
  const [followersCount, setFollowersCount] = useState(128);

  const fileInputRefLogo = useRef<HTMLInputElement>(null);
  const fileInputRefBanner = useRef<HTMLInputElement>(null);
  const fileInputRefProduct = useRef<HTMLInputElement>(null);

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

  // Auto-sync useMultipleSizes with prodCategory in the wizard
  useEffect(() => {
    const hasSizes = getSizesForCategory(prodCategory) !== null;
    setUseMultipleSizes(hasSizes);
  }, [prodCategory]);

  const fetchDashboardData = async (shopId: string) => {
    try {
      setLoadingProds(true);
      setLoadingOrders(true);
      setLoadingEvents(true);

      // 1. Fetch & Auto-seed Products
      const pData = await seedShopProductsIfEmpty(supabase, shopId, user?.id || '');
      const productsList = pData || [];
      setProducts(productsList);

      // 2. Fetch Real Analytics Events
      const { data: eData, error: eErr } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (eErr || !eData) {
        console.log('No database events detected or error fetching events.');
        setAnalyticsEvents([]);
      } else {
        setAnalyticsEvents(eData);
      }
    } catch (err: any) {
      console.error('Dashboard data synch error:', err);
    } finally {
      setLoadingProds(false);
      setLoadingOrders(false);
      setLoadingEvents(false);
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
        userId: shop.id
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
    setWizardStep(1);
    setWizardDirection(1);
    setCustomSizeInput('');
    setCustomColorInput('');
    setUploadingImage(false);
    setIsDragOver(false);
    setShowCustomSizeForm(false);
    setPublishError(null);

    if (product) {
      setEditingProduct(product);
      setProdName(product.name || '');
      
      const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);
      setProdPrice(hasDiscount ? String(product.original_price) : (product.price ? String(product.price) : ''));
      setProdSalePrice(hasDiscount ? String(product.price) : '');
      setProdCategory(product.category || 'Clothing');
      setProdImages(product.images || []);
      setProdColors(product.colours || []);
      
      const sizesArray = product.sizes || [];
      const hasMultiple = sizesArray.length > 0 && sizesArray[0].size !== 'One Size';
      setUseMultipleSizes(hasMultiple);

      if (hasMultiple) {
        const stockMap: Record<string, { active: boolean; stock: number }> = {};
        sizesArray.forEach((item: any) => {
          stockMap[item.size] = { active: true, stock: Number(item.quantity || 0) };
        });

        const catLower = (product.category || 'Clothing').toLowerCase();
        const isSneakers = catLower === 'sneakers' || sizesArray.some((s: any) => s.size.startsWith('EU') || s.size.startsWith('UK'));
        const isAccessories = catLower === 'accessories';
        const isCustom = catLower === 'custom';

        if (isSneakers) {
          setSizeCategory('sneakers');
          const sneakerSizes = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12', 'EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'];
          sneakerSizes.forEach(s => {
            if (!stockMap[s]) stockMap[s] = { active: false, stock: 10 };
          });
        } else if (isAccessories) {
          setSizeCategory('accessories' as any);
        } else if (isCustom) {
          setSizeCategory('custom' as any);
        } else {
          setSizeCategory('apparel');
          const apparelSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
          apparelSizes.forEach(s => {
            if (!stockMap[s]) stockMap[s] = { active: false, stock: 10 };
          });
        }
        setSizeStock(stockMap);
        setGeneralStock('10');
      } else {
        setGeneralStock(sizesArray[0]?.quantity ? String(sizesArray[0].quantity) : '10');
        setSizeStock({
          'XS': { active: false, stock: 10 },
          'S': { active: true, stock: 10 },
          'M': { active: true, stock: 10 },
          'L': { active: true, stock: 10 },
          'XL': { active: false, stock: 10 },
          'XXL': { active: false, stock: 10 },
        });
        setSizeCategory('apparel');
      }

      let mainDesc = product.description || '';
      let brandVal = '';
      let materialVal = '';
      let genderVal = 'Unisex';
      let conditionVal = product.condition || 'New';

      if (mainDesc.includes('--- SPECIFICATIONS ---')) {
        const parts = mainDesc.split('--- SPECIFICATIONS ---');
        mainDesc = parts[0].trim();
        const specLines = parts[1].split('\n');
        specLines.forEach((line: string) => {
          if (line.startsWith('Brand:')) brandVal = line.replace('Brand:', '').trim();
          if (line.startsWith('Material:')) materialVal = line.replace('Material:', '').trim();
          if (line.startsWith('Gender:')) genderVal = line.replace('Gender:', '').trim();
          if (line.startsWith('Condition:')) conditionVal = line.replace('Condition:', '').trim();
        });
      }

      setProdDescription(mainDesc);
      setProdBrand(brandVal);
      setProdMaterial(materialVal);
      setProdGender(genderVal);
      setProdCondition(conditionVal);
      setIsFeatured(product.is_featured || false);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdPrice('');
      setProdSalePrice('');
      setProdCategory('Clothing');
      setProdImages([]);
      setProdColors(['Black', 'White']);
      setUseMultipleSizes(false);
      setSizeCategory('apparel');
      setSizeStock({
        'XS': { active: false, stock: 10 },
        'S': { active: true, stock: 10 },
        'M': { active: true, stock: 10 },
        'L': { active: true, stock: 10 },
        'XL': { active: false, stock: 10 },
        'XXL': { active: false, stock: 10 },
      });
      setGeneralStock('10');
      setProdDescription('');
      setProdBrand('');
      setProdMaterial('');
      setProdGender('Unisex');
      setProdCondition('New');
      setIsFeatured(false);
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (publishOption: 'publish' | 'draft' = 'publish') => {
    if (!shop || !user) return;
    setPublishError(null);

    if (!prodName.trim()) {
      setPublishError('Product name is required.');
      toast.error('Product name is required');
      return;
    }

    if (prodImages.length === 0) {
      setPublishError('Please upload at least one image.');
      toast.error('Please upload at least one image');
      return;
    }

    if (!prodCategory) {
      setPublishError('You must select a category.');
      toast.error('You must select a category');
      return;
    }

    const numericPrice = parseFloat(prodPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setPublishError('Please enter a valid price greater than zero.');
      toast.error('Please enter a valid price greater than zero');
      return;
    }

    const numericSalePrice = prodSalePrice.trim() ? parseFloat(prodSalePrice) : null;
    if (numericSalePrice !== null && (isNaN(numericSalePrice) || numericSalePrice <= 0 || numericSalePrice >= numericPrice)) {
      setPublishError('Sale price must be greater than zero and less than the regular price.');
      toast.error('Sale price must be greater than zero and less than the regular price');
      return;
    }

    try {
      setSavingProduct(true);
      let configuredSizes = [];
      let totalStock = 0;

      if (useMultipleSizes) {
        configuredSizes = Object.entries(sizeStock)
          .filter(([_, val]) => val.active)
          .map(([size, val]) => ({
            size,
            quantity: val.stock
          }));
        totalStock = configuredSizes.reduce((sum, s) => sum + s.quantity, 0);
      } else {
        const qty = parseInt(generalStock) || 0;
        configuredSizes = [{ size: 'One Size', quantity: qty }];
        totalStock = qty;
      }

      let finalDescription = prodDescription.trim();
      if (prodBrand || prodMaterial || prodGender || prodCondition) {
        finalDescription += "\n\n--- SPECIFICATIONS ---";
        if (prodBrand) finalDescription += `\nBrand: ${prodBrand}`;
        if (prodMaterial) finalDescription += `\nMaterial: ${prodMaterial}`;
        if (prodGender) finalDescription += `\nGender: ${prodGender}`;
        if (prodCondition) finalDescription += `\nCondition: ${prodCondition}`;
      }

      const isPublished = publishOption === 'publish';
      const status = totalStock === 0 ? 'sold_out' : (isPublished ? 'active' : 'draft');

      // Map prices: price is active price, original_price is regular price before discount (if discount exists)
      const priceVal = numericSalePrice !== null ? numericSalePrice : numericPrice;
      const originalPriceVal = numericSalePrice !== null ? numericPrice : null;

      const productPayload = {
        name: prodName,
        price: priceVal,
        original_price: originalPriceVal,
        description: finalDescription,
        images: prodImages.length > 0 ? prodImages : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80'],
        shop_id: shop.id,
        owner_id: user.id,
        status,
        is_published: isPublished,
        is_featured: isFeatured,
        sizes: configuredSizes,
        colours: prodColors,
        total_stock: totalStock,
        category: prodCategory,
        condition: prodCondition
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success(isPublished ? 'Product published live!' : 'Product saved as draft!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productPayload]);

        if (error) throw error;
        toast.success(isPublished ? 'Product published live! 🚀' : 'Product saved as draft!');
      }

      setProductModalOpen(false);
      fetchProducts(shop.id);
    } catch (err: any) {
      console.error("Forensic publish failure details:", err);
      const exactError = err.message || err.details || JSON.stringify(err);
      setPublishError(exactError);
      toast.error('Publishing failed. Check details in the error card.');
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

  if (shopLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-zinc-800 font-sans pb-28 max-w-[430px] mx-auto relative border-x border-zinc-100">
        {/* Skeleton Top Bar */}
        <div className="h-16 border-b border-zinc-100 bg-white px-5 flex items-center justify-between sticky top-0 z-40">
          <div className="w-24 h-5 bg-zinc-200 rounded animate-pulse" />
          <div className="w-8 h-8 bg-zinc-200 rounded-full animate-pulse" />
        </div>

        {/* Skeleton Banner */}
        <div className="w-full h-44 bg-zinc-200 relative animate-pulse">
          {/* Skeleton Logo */}
          <div className="absolute -bottom-8 left-5 w-20 h-20 bg-zinc-300 rounded-full border-4 border-[#F9FAFB] animate-pulse" />
        </div>

        {/* Skeleton Shop Info */}
        <div className="px-5 pt-12 space-y-2">
          <div className="w-40 h-6 bg-zinc-200 rounded animate-pulse" />
          <div className="w-56 h-3.5 bg-zinc-200 rounded animate-pulse" />
          <div className="w-32 h-3.5 bg-zinc-200 rounded animate-pulse" />
        </div>

        {/* Skeleton Analytics Cards */}
        <div className="grid grid-cols-2 gap-3.5 px-5 pt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={`sk-card-${i}`} className="bg-white border border-zinc-100 p-4 rounded-2xl space-y-2 animate-pulse">
              <div className="w-12 h-3 bg-zinc-200 rounded" />
              <div className="w-16 h-6 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>

        {/* Skeleton Products List Header */}
        <div className="px-5 pt-8 pb-3 flex justify-between items-center">
          <div className="w-28 h-5 bg-zinc-200 rounded animate-pulse" />
          <div className="w-16 h-8 bg-zinc-100 rounded-full animate-pulse" />
        </div>

        {/* Skeleton Product Cards */}
        <div className="grid grid-cols-2 gap-3.5 px-5">
          {[1, 2].map((i) => (
            <div key={`sk-prod-${i}`} className="bg-white border border-zinc-100 rounded-2xl p-3.5 space-y-3 shadow-xs">
              <div className="aspect-square w-full bg-zinc-200 rounded-xl animate-pulse" />
              <div className="space-y-1.5 animate-pulse">
                <div className="w-3/4 h-3.5 bg-zinc-200 rounded" />
                <div className="w-1/3 h-4 bg-zinc-200 rounded" />
              </div>
            </div>
          ))}
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
        {/* Store Operations Hub Bar with Responsive Tabs */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-zinc-100 rounded-2xl p-3 gap-3">
          <div className="flex flex-wrap gap-3 items-center pl-1">
            <span className="text-xs font-black text-zinc-800 uppercase tracking-wider">Store Operations Hub</span>
            <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'overview' 
                    ? 'bg-zinc-950 text-white shadow-xs font-bold' 
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Overview
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-center">
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
            
            {/* Website Visits Control Center Toolbar */}
            <div id="visits-control-toolbar" className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-zinc-150 rounded-3xl p-6 text-left shadow-sm">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 mb-1.5">
                  <Activity size={12} className="animate-pulse" />
                  Live Store Traffic
                </span>
                <h2 className="text-lg font-black tracking-tight text-zinc-950">Boutique Website Visits</h2>
                <p className="text-xs text-zinc-500">Monitor storefront visitors and product engagement trends in real-time.</p>
              </div>

              {/* Timeframe Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200">
                  {([
                    { key: 'today', label: 'Today' },
                    { key: '7days', label: '7 Days' },
                    { key: '30days', label: '30 Days' }
                  ] as const).map((tf) => (
                    <button
                      key={tf.key}
                      onClick={() => setChartTimeframe(tf.key)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        chartTimeframe === tf.key 
                          ? 'bg-zinc-950 text-white shadow-sm' 
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visits KPI Metric Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Total Visits Card */}
              <div className="bg-white border border-zinc-150 rounded-3xl p-5 text-left shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-4 right-4 text-emerald-500/10 bg-emerald-500/5 p-2 rounded-xl">
                  <Eye size={18} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Total Visits</span>
                  <h3 className="text-2xl font-black text-zinc-950 leading-none">{visitsKPIs.total}</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-3">All-time store traffic</span>
              </div>

              {/* Today's Visits Card */}
              <div className="bg-white border border-zinc-150 rounded-3xl p-5 text-left shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-4 right-4 text-emerald-500/10 bg-emerald-500/5 p-2 rounded-xl">
                  <Activity size={18} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Today's Visits</span>
                  <h3 className="text-2xl font-black text-zinc-950 leading-none">{visitsKPIs.today}</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-3">Since midnight UTC</span>
              </div>

              {/* This Week's Visits Card */}
              <div className="bg-white border border-zinc-150 rounded-3xl p-5 text-left shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-4 right-4 text-emerald-500/10 bg-emerald-500/5 p-2 rounded-xl">
                  <Calendar size={18} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">This Week</span>
                  <h3 className="text-2xl font-black text-zinc-950 leading-none">{visitsKPIs.week}</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-3">Current calendar week</span>
              </div>

              {/* This Month's Visits Card */}
              <div className="bg-white border border-zinc-150 rounded-3xl p-5 text-left shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-4 right-4 text-emerald-500/10 bg-emerald-500/5 p-2 rounded-xl">
                  <Globe size={18} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">This Month</span>
                  <h3 className="text-2xl font-black text-zinc-950 leading-none">{visitsKPIs.month}</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-3">Current calendar month</span>
              </div>

              {/* Unique Visitors Card */}
              <div className="bg-white border border-zinc-150 rounded-3xl col-span-2 lg:col-span-1 p-5 text-left shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-4 right-4 text-emerald-500/10 bg-emerald-500/5 p-2 rounded-xl">
                  <User size={18} className="text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Unique Visitors</span>
                  <h3 className="text-2xl font-black text-zinc-950 leading-none">{visitsKPIs.uniqueVisitors}</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-3">Distinct shopper profiles</span>
              </div>

            </div>

            {/* Buyer Funnel & Financial Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Buyer Intents Card */}
              <div className="bg-white border border-zinc-150 rounded-3xl p-5 text-left shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-4 right-4 text-purple-500/10 bg-purple-500/5 p-2 rounded-xl">
                  <MessageSquare size={18} className="text-purple-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Total Buyer Intents</span>
                  <h3 className="text-2xl font-black text-zinc-950 leading-none">{merchantKPIs.totalIntents}</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-3">WhatsApp & Buy Now clicks</span>
              </div>

              {/* Total Intent Value Card */}
              <div className="bg-white border border-zinc-150 rounded-3xl p-5 text-left shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-4 right-4 text-amber-500/10 bg-amber-500/5 p-2 rounded-xl">
                  <Coins size={18} className="text-amber-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Total Funnel Value</span>
                  <h3 className="text-2xl font-black text-zinc-950 leading-none">${merchantKPIs.totalValue.toFixed(2)}</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-3">Sum of intent product values</span>
              </div>

              {/* Estimated Revenue Card */}
              <div className="bg-white border border-[#C6FF00]/40 bg-[#C6FF00]/5 rounded-3xl p-5 text-left shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-4 right-4 text-zinc-900/10 bg-[#C6FF00]/20 p-2 rounded-xl">
                  <TrendingUp size={18} className="text-zinc-900" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Estimated Revenue</span>
                  <h3 className="text-2xl font-black text-zinc-950 leading-none">${merchantKPIs.estimatedRevenue.toFixed(2)}</h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-semibold mt-3">Funnel Value × {merchantKPIs.conversionRatePercent}% Conversion</span>
              </div>

            </div>

            {/* Full-fidelity visits visualizations grid */}
            <div className="space-y-6">

              {/* Visits Trend SVG Line Chart */}
              <div className="bg-white border border-zinc-150 rounded-3xl p-6 text-left shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-zinc-900">Visits Timeline</h4>
                    <p className="text-[11px] text-zinc-400">Total visits recorded across the selected timeframe.</p>
                  </div>
                  <div className="text-xs font-bold text-zinc-700 bg-zinc-50 border border-zinc-150 px-3 py-1.5 rounded-xl">
                    Daily Average: <span className="text-emerald-600">{(visitEvents.length / (chartTimeframe === 'today' ? 1 : chartTimeframe === '7days' ? 7 : 30)).toFixed(1)}</span> visits
                  </div>
                </div>

                {/* Pure SVG Line Chart Canvas */}
                <div className="relative pt-4 overflow-hidden">
                  {visitEvents.length === 0 && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                      <span className="text-zinc-400 font-extrabold text-xs uppercase tracking-widest">No data yet</span>
                      <p className="text-[10px] text-zinc-400 mt-1">Awaiting your first store visits</p>
                    </div>
                  )}
                  <div className="w-full h-48 select-none">
                    <svg viewBox="0 0 700 180" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="700" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="60" x2="700" y2="60" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="100" x2="700" y2="100" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="140" x2="700" y2="140" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="180" x2="700" y2="180" stroke="#E2E8F0" strokeWidth="1" />

                      {/* Chart Path and Fill */}
                      {visitsChartPoints.length > 0 && (
                        <>
                          <path d={visitsFillD} fill="url(#visitsGradient)" className="transition-all duration-300" />
                          <path d={visitsPathD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
                          
                          {/* SVG Interactive Markers */}
                          {visitsChartPoints.map((pt, idx) => (
                            <g key={idx} className="group/dot cursor-pointer">
                              <circle 
                                cx={pt.x} 
                                cy={pt.y} 
                                r="4" 
                                fill="#FFFFFF" 
                                stroke="#10B981" 
                                strokeWidth="2.5" 
                                className="transition-all duration-200 group-hover/dot:r-6" 
                              />
                              <circle 
                                cx={pt.x} 
                                cy={pt.y} 
                                r="10" 
                                fill="#10B981" 
                                fillOpacity="0" 
                                className="hover:fill-opacity-10 transition-all duration-200"
                              />
                              {/* Value Tooltip */}
                              <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <rect 
                                  x={pt.x - 30} 
                                  y={pt.y - 32} 
                                  width="60" 
                                  height="22" 
                                  rx="6" 
                                  fill="#18181B" 
                                />
                                <text 
                                  x={pt.x} 
                                  y={pt.y - 17} 
                                  fill="#FFFFFF" 
                                  fontSize="10" 
                                  fontWeight="bold" 
                                  textAnchor="middle"
                                >
                                  {pt.count} views
                                </text>
                              </g>
                            </g>
                          ))}
                        </>
                      )}
                    </svg>
                  </div>

                  {/* Chart X-Axis Labels */}
                  <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 mt-2">
                    {visitsChartPoints.map((pt, idx) => (
                      <span key={idx}>{pt.label}</span>
                    ))}
                  </div>
                </div>

                {/* Interactive Test Tip */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <p className="text-emerald-800 text-left">
                    💡 <strong className="font-bold">Want to test live tracking?</strong> Open your storefront in a new tab, click custom items, then return here. The analytics engine registers actions in real-time!
                  </p>
                  <button 
                    onClick={handleOpenStore}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shrink-0 cursor-pointer shadow-sm"
                  >
                    Test Storefront
                  </button>
                </div>
              </div>

              {/* Split Grid for Recent Activity & Popular Items */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Column 1: Recent Visit Activity */}
                <div className="bg-white border border-zinc-150 rounded-3xl p-6 text-left shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-extrabold text-zinc-900">Recent Visit Activity</h4>
                      <p className="text-[11px] text-zinc-400">Chronological history of recent shopper views.</p>
                    </div>

                    <div className="divide-y divide-zinc-100 max-h-[350px] overflow-y-auto pr-1">
                      {recentVisitActivity.length === 0 ? (
                        <div className="py-8 text-center text-zinc-400 text-xs">
                          No visits logged yet.
                        </div>
                      ) : (
                        recentVisitActivity.map((activity) => (
                          <div key={activity.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-zinc-800 font-medium truncate">{activity.label}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider shrink-0">
                              {formatTimeAgo(activity.created_at)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 mt-4">
                    <span className="text-[10px] text-zinc-400 font-semibold block text-center">
                      Total tracked events: {visitEvents.length}
                    </span>
                  </div>
                </div>

                {/* Column 2: Most Viewed Products */}
                <div className="bg-white border border-zinc-150 rounded-3xl p-6 text-left shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-extrabold text-zinc-900">Most Viewed Products</h4>
                      <p className="text-[11px] text-zinc-400">Products sorted by customer view count.</p>
                    </div>

                    <div className="divide-y divide-zinc-100 max-h-[350px] overflow-y-auto pr-1">
                      {mostViewedProducts.length === 0 ? (
                        <div className="py-8 text-center text-zinc-400 text-xs">
                          No products viewed yet. Add some products and view them on your store!
                        </div>
                      ) : (
                        mostViewedProducts.slice(0, 5).map((product) => {
                          const imgUrl = product.images?.[0] || '';
                          return (
                            <div key={product.id} className="py-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
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
                                    {product.name}
                                  </h5>
                                  <span className="text-[11px] font-semibold text-zinc-400">
                                    ${Number(product.price).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider shrink-0">
                                {product.views || 0} views
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-semibold">
                      Showing top 5 products
                    </span>
                  </div>
                </div>

                {/* Column 3: Top Traffic Sources */}
                <div className="bg-white border border-zinc-150 rounded-3xl p-6 text-left shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-extrabold text-zinc-900">Top Traffic Sources</h4>
                      <p className="text-[11px] text-zinc-400">Distribution of visitor referrers.</p>
                    </div>

                    <div className="divide-y divide-zinc-100 max-h-[350px] overflow-y-auto pr-1">
                      {topTrafficSources.length === 0 ? (
                        <div className="py-8 text-center text-zinc-400 text-xs">
                          No traffic sources recorded yet.
                        </div>
                      ) : (
                        topTrafficSources.map(({ source, count }) => {
                          const percentage = visitEvents.length > 0 ? ((count / visitEvents.length) * 100).toFixed(0) : '0';
                          return (
                            <div key={source} className="py-3 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-[#C6FF00] border border-black/10 shrink-0" />
                                <span className="text-zinc-800 font-bold truncate">{source}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-zinc-600 font-medium">{count} visits</span>
                                <span className="text-[10px] bg-zinc-100 text-zinc-500 font-mono font-bold px-1.5 py-0.5 rounded">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 mt-4">
                    <span className="text-[10px] text-zinc-400 font-semibold block text-center">
                      Traffic channels tracked live
                    </span>
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 overflow-y-auto py-8 bg-zinc-950/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setProductModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white border border-zinc-150 rounded-3xl shadow-2xl p-6 md:p-8 z-10 text-left overflow-visible my-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-zinc-150">
                <div>
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wider">
                    {editingProduct ? 'Modify Listing' : 'List Brand Product'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Premium merchant onboarding</p>
                </div>
                <button 
                  onClick={() => setProductModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="py-4 flex flex-col items-center border-b border-zinc-100 mb-5">
                <div className="relative w-full max-w-[200px] flex items-center justify-between py-2">
                  {/* Connector Line */}
                  <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[1px] bg-zinc-200 z-0" />
                  
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const isActive = num === wizardStep;
                    const isCompleted = num < wizardStep;
                    const isDisabled = num > 1 && !prodName.trim() && parseFloat(prodPrice) <= 0;
                    
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setWizardDirection(num > wizardStep ? 1 : -1);
                          setWizardStep(num);
                        }}
                        className="relative z-10 focus:outline-none cursor-pointer group"
                        title={`Step ${num}`}
                      >
                        <span 
                          className={`block w-3 h-3 rounded-full transition-all duration-300 ${
                            isActive 
                              ? 'bg-emerald-500 ring-4 ring-emerald-500/20 scale-110' 
                              : isCompleted 
                                ? 'bg-emerald-500' 
                                : 'bg-zinc-200 group-hover:bg-zinc-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-center mt-3">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Step {wizardStep} of 6
                  </p>
                  <p className="text-sm font-black text-zinc-900 mt-0.5">
                    {wizardStep === 1 && 'Basic Information'}
                    {wizardStep === 2 && 'Product Gallery'}
                    {wizardStep === 3 && 'Variants & Stock'}
                    {wizardStep === 4 && 'Specifications'}
                    {wizardStep === 5 && 'Storefront Preview'}
                    {wizardStep === 6 && 'Ready to Publish'}
                  </p>
                </div>
              </div>

              {/* Step Forms */}
              {publishError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-left text-xs text-red-700 font-medium">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 font-black">!</div>
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-red-900 uppercase tracking-wide">Publishing Error</h5>
                      <p className="leading-relaxed">Database rejected the request: {publishError}</p>
                      <p className="text-[10px] text-red-500 mt-1">Please double-check your inputs, network connection, or try again.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 min-h-[300px] overflow-visible">
                <AnimatePresence mode="wait" custom={wizardDirection}>
                  <motion.div
                    key={wizardStep}
                    custom={wizardDirection}
                    initial={{ opacity: 0, x: wizardDirection * 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -wizardDirection * 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* STEP 1: Basic Information */}
                    {wizardStep === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Product Name / Title</label>
                          <input
                            type="text"
                            required
                            value={prodName}
                            onChange={(e) => setProdName(e.target.value)}
                            placeholder="e.g. Vintage Denim Jacket"
                            className="w-full px-4 h-11 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs md:text-sm focus:outline-none transition-all text-zinc-900 font-semibold shadow-sm placeholder-zinc-400 caret-black"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Category Mapping</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {['Clothing', 'Sneakers', 'Thrift & Vintage', 'Accessories', 'Custom'].map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setProdCategory(cat)}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                                  prodCategory === cat
                                    ? 'bg-black text-white border-black shadow-md'
                                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                          {prodCategory === 'Custom' && (
                            <input
                              type="text"
                              placeholder="Type custom category..."
                              value={prodCategory === 'Custom' ? '' : prodCategory}
                              onChange={(e) => setProdCategory(e.target.value || 'Custom')}
                              className="w-full mt-2 px-4 h-11 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs md:text-sm focus:outline-none transition-all text-zinc-900 font-semibold shadow-sm placeholder-zinc-400 caret-black"
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Regular Price (USD)</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">$</span>
                              <input
                                type="number"
                                required
                                step="0.01"
                                value={prodPrice}
                                onChange={(e) => setProdPrice(e.target.value)}
                                placeholder="35.00"
                                className="w-full pl-8 pr-4 h-11 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs md:text-sm focus:outline-none transition-all text-zinc-900 font-bold shadow-sm placeholder-zinc-400 caret-black"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Sale Price (Optional)</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={prodSalePrice}
                                onChange={(e) => setProdSalePrice(e.target.value)}
                                placeholder="25.00"
                                className="w-full pl-8 pr-4 h-11 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs md:text-sm focus:outline-none transition-all text-zinc-900 font-bold shadow-sm placeholder-zinc-400 caret-black"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Product Gallery */}
                    {wizardStep === 2 && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Product Gallery (Max 6)</label>
                          <p className="text-[9px] text-zinc-400">First image in the list represents the primary cover photo.</p>
                        </div>

                        {/* Drag and Drop Box */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                          onDragLeave={() => setIsDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            if (e.dataTransfer.files) {
                              const files = Array.from(e.dataTransfer.files);
                              const allowed = files.filter(f => f.type.startsWith('image/'));
                              if (allowed.length > 0) {
                                // Trigger processing
                                const uploadPromise = async () => {
                                  if (prodImages.length + allowed.length > 6) {
                                    toast.error('Max 6 images allowed.');
                                    return;
                                  }
                                  setUploadingImage(true);
                                  const id = toast.loading('Uploading dragged files...');
                                  try {
                                    const urls = [];
                                    for (const file of allowed) {
                                      const url = await uploadImage({
                                        supabase,
                                        file,
                                        bucket: 'product-images',
                                        folder: 'product',
                                        userId: shop?.id || 'unknown'
                                      });
                                      urls.push(url);
                                    }
                                    setProdImages(prev => [...prev, ...urls]);
                                    toast.success('Uploaded successfully!', { id });
                                  } catch (err: any) {
                                    toast.error('Drag upload failed: ' + err.message, { id });
                                  } finally {
                                    setUploadingImage(false);
                                  }
                                };
                                uploadPromise();
                              }
                            }
                          }}
                          onClick={() => fileInputRefProduct.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all text-center ${
                            isDragOver 
                              ? 'border-[#C6FF00] bg-[#C6FF00]/5 scale-98' 
                              : 'border-zinc-200 hover:border-[#C6FF00] bg-zinc-50 hover:bg-zinc-50/50'
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRefProduct}
                            multiple
                            accept="image/*"
                            onChange={async (e) => {
                              if (e.target.files) {
                                const files = Array.from(e.target.files);
                                if (prodImages.length + files.length > 6) {
                                  toast.error('Maximum 6 images allowed.');
                                  return;
                                  }
                                setUploadingImage(true);
                                const id = toast.loading('Uploading selected files...');
                                try {
                                  const urls = [];
                                  for (const file of files) {
                                    const url = await uploadImage({
                                      supabase,
                                      file,
                                      bucket: 'product-images',
                                      folder: 'product',
                                      userId: shop?.id || 'unknown'
                                    });
                                    urls.push(url);
                                  }
                                  setProdImages(prev => [...prev, ...urls]);
                                  toast.success('Uploaded successfully!', { id });
                                } catch (err: any) {
                                  toast.error('Upload failed: ' + err.message, { id });
                                } finally {
                                  setUploadingImage(false);
                                }
                              }
                            }}
                            className="hidden"
                          />
                          
                          {uploadingImage ? (
                            <Loader2 className="animate-spin text-zinc-950" size={24} />
                          ) : (
                            <Camera className="text-zinc-400" size={24} />
                          )}
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-bold text-zinc-800">Drag & Drop or click to upload</p>
                            <p className="text-[9px] text-zinc-400">Supports JPG, PNG, WebP up to 5MB each</p>
                          </div>
                        </div>

                        {/* Upload Grid */}
                        {prodImages.length > 0 && (
                          <div className="grid grid-cols-3 gap-3">
                            {prodImages.map((img, idx) => (
                              <div key={img} className="group relative aspect-square rounded-xl bg-zinc-50 border border-zinc-150 overflow-hidden shadow-sm">
                                <img 
                                  src={img} 
                                  className="w-full h-full object-cover" 
                                  alt="" 
                                  referrerPolicy="no-referrer"
                                />
                                
                                {/* Cover Badge */}
                                {idx === 0 ? (
                                  <span className="absolute top-1.5 left-1.5 bg-[#C6FF00] text-zinc-950 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-sm tracking-wider">
                                    Cover
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Move to front
                                      setProdImages(prev => {
                                        const next = [...prev];
                                        const item = next.splice(idx, 1)[0];
                                        return [item, ...next];
                                      });
                                    }}
                                    className="absolute top-1.5 left-1.5 hidden group-hover:block bg-zinc-950/70 hover:bg-zinc-950 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                  >
                                    Cover
                                  </button>
                                )}

                                {/* Delete Overlay Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProdImages(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Delete Image"
                                >
                                  <X size={10} />
                                </button>

                                {/* Order Controls */}
                                <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => {
                                      setProdImages(prev => {
                                        const next = [...prev];
                                        const temp = next[idx];
                                        next[idx] = next[idx - 1];
                                        next[idx - 1] = temp;
                                        return next;
                                      });
                                    }}
                                    className="p-1 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded disabled:opacity-30 cursor-pointer"
                                  >
                                    <ChevronLeft size={10} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === prodImages.length - 1}
                                    onClick={() => {
                                      setProdImages(prev => {
                                        const next = [...prev];
                                        const temp = next[idx];
                                        next[idx] = next[idx + 1];
                                        next[idx + 1] = temp;
                                        return next;
                                      });
                                    }}
                                    className="p-1 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded disabled:opacity-30 cursor-pointer"
                                  >
                                    <ChevronRight size={10} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 3: Variants & Stock */}
                    {wizardStep === 3 && (
                      <div className="space-y-4">

                        {!wizardHasSizes ? (
                          <div className="space-y-3 p-4 bg-zinc-50 border border-zinc-150 rounded-2xl animate-wipe">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Total Stock Quantity</label>
                            <input
                              type="number"
                              min="0"
                              value={generalStock}
                              onChange={(e) => setGeneralStock(e.target.value)}
                              placeholder="e.g. 20"
                              className="w-full px-4 h-11 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs md:text-sm focus:outline-none transition-all text-zinc-950 font-bold shadow-sm placeholder-zinc-500 caret-black"
                            />
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                              Since this category does not use standard sizes, please provide your current aggregate inventory count.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 animate-wipe">
                            {/* Horizontally scrollable row of size chips */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Available Sizes</label>
                              
                              <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                                {wizardStandardSizes?.map((sz) => {
                                  const isAdded = sizeStock[sz]?.active;
                                  const isSelected = activeSizeEditing === sz;

                                  return (
                                    <button
                                      key={`chip-${sz}`}
                                      type="button"
                                      onClick={() => {
                                        if (isAdded) {
                                          setActiveSizeEditing(sz);
                                          setTempStockInput(String(sizeStock[sz].stock));
                                        } else {
                                          setActiveSizeEditing(sz);
                                          setTempStockInput('');
                                        }
                                      }}
                                      className={`px-4 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                                        isSelected
                                          ? 'bg-black text-white border-black scale-105 shadow-sm'
                                          : isAdded
                                          ? 'bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-150'
                                          : 'bg-zinc-50 text-zinc-600 border-zinc-150 hover:border-zinc-200 hover:bg-zinc-100'
                                      }`}
                                    >
                                      {sz} {isAdded && `(${sizeStock[sz].stock})`}
                                    </button>
                                  );
                                })}

                                {/* Add Custom Size Chip at the end */}
                                {!showCustomSizeInput ? (
                                  <button
                                    key="chip-custom"
                                    type="button"
                                    onClick={() => setShowCustomSizeInput(true)}
                                    className="px-4 py-2 rounded-full border border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-800 hover:border-zinc-400 text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1 bg-transparent"
                                  >
                                    <span>+ Custom</span>
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            {/* Custom Size Name Input Block */}
                            {showCustomSizeInput && (
                              <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl space-y-3 animate-fade-in">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Add Custom Size Name</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="e.g. XXXL or 49"
                                    value={customSizeName}
                                    onChange={e => setCustomSizeName(e.target.value)}
                                    className="flex-1 bg-white border border-zinc-200 focus:border-[#C6FF00] rounded-xl p-3 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-bold"
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddWizardCustomSizeName();
                                      } else if (e.key === 'Escape') {
                                        setShowCustomSizeInput(false);
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddWizardCustomSizeName}
                                    className="px-4 py-2 bg-black text-white hover:bg-zinc-800 font-bold rounded-xl text-xs uppercase"
                                  >
                                    Next
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowCustomSizeInput(false)}
                                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs uppercase"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Stock Input for selected/activeSizeEditing size */}
                            {activeSizeEditing && (
                              <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl space-y-3 animate-fade-in">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">SET STOCK FOR VARIANT</span>
                                    <h3 className="text-sm font-black text-zinc-950 font-sans">Size Variant: <span className="text-black font-extrabold underline">{activeSizeEditing}</span></h3>
                                  </div>
                                  {sizeStock[activeSizeEditing]?.active && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleRemoveWizardSize(activeSizeEditing);
                                        setActiveSizeEditing(null);
                                      }}
                                      className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                      <X size={12} />
                                      <span>Remove Size</span>
                                    </button>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <input 
                                    type="number"
                                    min="1"
                                    placeholder="Stock quantity (e.g. 10)"
                                    value={tempStockInput}
                                    onChange={e => setTempStockInput(e.target.value)}
                                    className="flex-1 bg-white border border-zinc-200 focus:border-[#C6FF00] rounded-xl p-3 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-bold text-zinc-950"
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleConfirmWizardStock();
                                      } else if (e.key === 'Escape') {
                                        setActiveSizeEditing(null);
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={handleConfirmWizardStock}
                                    className="px-5 py-2 bg-black text-white hover:bg-zinc-800 font-bold rounded-xl text-xs uppercase cursor-pointer"
                                  >
                                    Apply
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveSizeEditing(null);
                                      setTempStockInput('');
                                    }}
                                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs uppercase cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Configured Sizes Summary grid */}
                            <div className="space-y-2 mt-4">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Configured Sizing Summary</label>
                              {Object.entries(sizeStock).filter(([_, v]) => v.active).length === 0 ? (
                                <div className="text-center py-4 px-3 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl text-[11px] text-zinc-500">
                                  No sizes active. Click any size chip above to add stock.
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                                  {Object.entries(sizeStock)
                                    .filter(([_, v]) => v.active)
                                    .map(([sz, v]) => (
                                      <div key={`summary-${sz}`} className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-150 rounded-xl">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-6 h-6 rounded bg-zinc-200 text-[10px] font-extrabold text-zinc-800 flex items-center justify-center">{sz}</span>
                                          <span className="text-[11px] font-bold text-zinc-700">Stock: {v.stock}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveWizardSize(sz)}
                                          className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}



                        {/* Colours management block */}
                        <div className="space-y-2 border-t border-zinc-100 pt-3">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-sans">Color Variants</label>
                          <div className="flex flex-wrap gap-1.5">
                            {prodColors.map((color) => (
                              <span 
                                key={color} 
                                className="inline-flex items-center gap-1 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-full text-xs font-semibold text-zinc-700"
                              >
                                {color}
                                <button
                                  type="button"
                                  onClick={() => setProdColors(prev => prev.filter(c => c !== color))}
                                  className="text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Type a color (e.g. Midnight Black, Burgundy)..."
                              value={customColorInput}
                              onChange={(e) => setCustomColorInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (customColorInput.trim() && !prodColors.includes(customColorInput.trim())) {
                                    setProdColors(prev => [...prev, customColorInput.trim()]);
                                    setCustomColorInput('');
                                  }
                                }
                              }}
                              className="flex-grow px-4 h-11 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs focus:outline-none transition-all text-zinc-900 font-semibold shadow-sm placeholder-zinc-400 caret-black"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (customColorInput.trim() && !prodColors.includes(customColorInput.trim())) {
                                  setProdColors(prev => [...prev, customColorInput.trim()]);
                                  setCustomColorInput('');
                                }
                              }}
                              className="px-4 h-11 bg-black hover:bg-zinc-800 active:scale-95 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center shrink-0 shadow-sm"
                            >
                              Add Color
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: Product Details */}
                    {wizardStep === 4 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Description / Narrative</label>
                          <textarea
                            rows={3}
                            value={prodDescription}
                            onChange={(e) => setProdDescription(e.target.value)}
                            placeholder="Tell the brand history, fit narrative, and materials of this premium piece..."
                            className="w-full px-4 py-3 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs md:text-sm focus:outline-none transition-all resize-none text-zinc-900 leading-relaxed font-semibold shadow-sm placeholder-zinc-400 caret-black"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Brand / Label</label>
                            <input
                              type="text"
                              value={prodBrand}
                              onChange={(e) => setProdBrand(e.target.value)}
                              placeholder="e.g. Nike, Vintage Studio"
                              className="w-full px-4 h-11 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs md:text-sm focus:outline-none transition-all text-zinc-900 font-semibold shadow-sm placeholder-zinc-400 caret-black"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Material Composition</label>
                            <input
                              type="text"
                              value={prodMaterial}
                              onChange={(e) => setProdMaterial(e.target.value)}
                              placeholder="e.g. 100% Cotton Canvas"
                              className="w-full px-4 h-11 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs md:text-sm focus:outline-none transition-all text-zinc-900 font-semibold shadow-sm placeholder-zinc-400 caret-black"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Gender Target</label>
                            <select
                              value={prodGender}
                              onChange={(e) => setProdGender(e.target.value)}
                              className="w-full px-4 h-11 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs md:text-sm focus:outline-none transition-all text-zinc-900 font-bold shadow-sm caret-black cursor-pointer"
                            >
                              <option>Unisex</option>
                              <option>Men</option>
                              <option>Women</option>
                              <option>Kids</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Condition Rating</label>
                            <select
                              value={prodCondition}
                              onChange={(e) => setProdCondition(e.target.value)}
                              className="w-full px-4 h-11 bg-white border border-zinc-200 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/10 rounded-xl text-xs md:text-sm focus:outline-none transition-all text-zinc-900 font-bold shadow-sm caret-black cursor-pointer"
                            >
                              <option>New</option>
                              <option>Like New</option>
                              <option>Excellent</option>
                              <option>Good</option>
                              <option>Fair</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 5: Storefront Preview */}
                    {wizardStep === 5 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Live Storefront Card Preview</label>
                          <p className="text-[9px] text-zinc-400">This mimics exactly how customer-facing interfaces list your item.</p>
                        </div>

                        {/* Storefront mimic card */}
                        <div className="bg-white border border-zinc-150 rounded-2xl overflow-hidden shadow-md max-w-sm mx-auto">
                          {/* Image Box */}
                          <div className="relative aspect-square bg-zinc-50 flex items-center justify-center overflow-hidden">
                            {prodImages.length > 0 ? (
                              <img 
                                src={prodImages[0]} 
                                className="w-full h-full object-cover" 
                                alt="" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="text-zinc-300 text-xs text-center flex flex-col items-center">
                                <ShoppingBag size={32} className="mb-2" />
                                <span>No listing photos active</span>
                              </div>
                            )}

                            {/* Sale Badge */}
                            {prodSalePrice && (
                              <span className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide shadow">
                                Sale
                              </span>
                            )}
                            
                            {/* Condition rating tag */}
                            <span className="absolute bottom-3 right-3 bg-zinc-950/80 backdrop-blur-xs text-white text-[8px] font-bold uppercase px-2 py-1 rounded-md tracking-wider">
                              {prodCondition}
                            </span>
                          </div>

                          {/* Body info */}
                          <div className="p-4 text-left space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                {prodBrand && (
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">{prodBrand}</span>
                                )}
                                <h4 className="text-sm font-bold text-zinc-900 leading-tight">{prodName || 'Untitled Product'}</h4>
                              </div>
                              <div className="text-right shrink-0">
                                {prodSalePrice ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs font-black text-[#C6FF00] bg-zinc-950 px-1.5 py-0.5 rounded">${Number(prodSalePrice).toFixed(2)}</span>
                                    <span className="text-[10px] text-zinc-400 line-through mt-0.5">${Number(prodPrice || 0).toFixed(2)}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-black text-zinc-950">${Number(prodPrice || 0).toFixed(2)}</span>
                                )}
                              </div>
                            </div>

                            {/* Mini Specs Row */}
                            <div className="flex flex-wrap gap-1 border-t border-zinc-100 pt-2 text-[10px] text-zinc-500 font-semibold">
                              <span>Cat: {prodCategory}</span>
                              {prodMaterial && (
                                <>
                                  <span className="text-zinc-300">•</span>
                                  <span>Mat: {prodMaterial}</span>
                                </>
                              )}
                              <span className="text-zinc-300">•</span>
                              <span>Target: {prodGender}</span>
                            </div>

                            {/* Colors & Sizes indicators */}
                            <div className="flex justify-between items-center text-[10px] bg-zinc-50 p-2 rounded-xl">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-zinc-400">Sizes:</span>
                                <div className="flex gap-1">
                                  {useMultipleSizes ? (
                                    Object.entries(sizeStock)
                                      .filter(([_, val]) => val.active)
                                      .slice(0, 3)
                                      .map(([sz]) => (
                                        <span key={sz} className="bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-[8px] font-bold text-zinc-700">{sz}</span>
                                      ))
                                  ) : (
                                    <span className="bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-[8px] font-bold text-zinc-700">One Size</span>
                                  )}
                                  {useMultipleSizes && Object.entries(sizeStock).filter(([_, val]) => val.active).length > 3 && (
                                    <span className="text-[8px] text-zinc-400">+{Object.entries(sizeStock).filter(([_, val]) => val.active).length - 3}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-zinc-400">Colors:</span>
                                <div className="flex gap-1 max-w-[100px] truncate">
                                  {prodColors.slice(0, 2).map((col) => (
                                    <span key={col} className="bg-zinc-150 border border-zinc-200 px-1 rounded text-[8px] font-semibold">{col}</span>
                                  ))}
                                  {prodColors.length > 2 && <span className="text-[8px] text-zinc-400">+{prodColors.length - 2}</span>}
                                </div>
                              </div>
                            </div>

                            {prodDescription && (
                              <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2 italic pt-1 border-t border-zinc-100">
                                "{prodDescription}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 6: Publish */}
                    {wizardStep === 6 && (
                      <div className="space-y-5 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] flex items-center justify-center mx-auto mb-2 animate-bounce">
                          <CheckCircle2 size={32} />
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Listing Fully Configured</h4>
                          <p className="text-xs text-zinc-500 mt-1">Review onboarding checkpoints prior to publishing live.</p>
                        </div>

                        {/* Onboarding Summary Metrics Checklist */}
                        <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 text-left text-xs space-y-2.5 max-w-sm mx-auto">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-zinc-500">Regular Listing Price:</span>
                            <span className="text-zinc-900">${Number(prodPrice || 0).toFixed(2)}</span>
                          </div>
                          {prodSalePrice && (
                            <div className="flex items-center justify-between font-bold text-emerald-600">
                              <span>Active Sale Price:</span>
                              <span>${Number(prodSalePrice).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Gallery Media assets:</span>
                            <span className="text-zinc-900 font-bold">{prodImages.length} active</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Sizing Configuration:</span>
                            <span className="text-zinc-900 font-bold">
                              {useMultipleSizes 
                                ? `${Object.values(sizeStock).filter(s => s.active).length} sizes enabled` 
                                : `One size stock`
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Color Options:</span>
                            <span className="text-zinc-900 font-bold">{prodColors.length} configured</span>
                          </div>
                        </div>

                        {/* Homepage Feature selector */}
                        <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-150 rounded-2xl max-w-sm mx-auto">
                          <div className="flex items-center gap-2 text-left">
                            <Sparkles size={16} className="text-[#C6FF00]" />
                            <div>
                              <h5 className="text-xs font-bold text-zinc-900">Feature on Homepage</h5>
                              <p className="text-[9px] text-zinc-400">Pin to the featured section on public storefront</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsFeatured(!isFeatured)}
                            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all cursor-pointer ${
                              isFeatured ? 'bg-[#C6FF00] justify-end' : 'bg-zinc-200 justify-start'
                            }`}
                          >
                            <span className="w-5 h-5 bg-white rounded-full shadow-sm block" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Wizard Nav Actions Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-zinc-100 mt-6 gap-3">
                {/* Back / Cancel button */}
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setWizardDirection(-1);
                      setWizardStep(prev => prev - 1);
                    }}
                    className="px-5 h-11 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 active:scale-95 text-zinc-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ArrowLeft size={13} />
                    <span>Back</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-5 h-11 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 active:scale-95 text-zinc-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center shadow-sm"
                  >
                    Cancel
                  </button>
                )}

                {/* Instant Save Draft Shortcut */}
                {wizardStep > 1 && wizardStep < 6 && (
                  <button
                    type="button"
                    onClick={() => handleSaveProduct('draft')}
                    disabled={savingProduct}
                    className="hidden sm:inline-block text-[10px] font-black text-zinc-400 hover:text-zinc-950 transition-colors uppercase tracking-widest py-2 cursor-pointer"
                  >
                    Save Draft Now
                  </button>
                )}

                {/* Next / Publish action */}
                {wizardStep < 6 ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Validation
                      if (wizardStep === 1) {
                        if (!prodName.trim()) {
                          toast.error('Product Name is required');
                          return;
                        }
                        const p = parseFloat(prodPrice);
                        if (isNaN(p) || p <= 0) {
                          toast.error('Please specify a valid regular price greater than zero');
                          return;
                        }
                      }
                      if (wizardStep === 2) {
                        if (prodImages.length === 0) {
                          toast.error('Please upload at least 1 image to proceed.');
                          return;
                        }
                      }
                      if (wizardStep === 3) {
                        if (useMultipleSizes) {
                          const activeCount = Object.values(sizeStock).filter(s => s.active).length;
                          if (activeCount === 0) {
                            toast.error('Please configure at least 1 size variant to proceed.');
                            return;
                          }
                        } else {
                          const s = parseInt(generalStock);
                          if (isNaN(s) || s < 0) {
                            toast.error('Please enter a valid stock quantity.');
                            return;
                          }
                        }
                        if (prodColors.length === 0) {
                          toast.error('Please specify at least 1 color option.');
                          return;
                        }
                      }

                      setWizardDirection(1);
                      setWizardStep(prev => prev + 1);
                    }}
                    className="px-6 h-11 bg-black hover:bg-zinc-800 active:scale-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ml-auto disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span>Next</span>
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5 ml-auto">
                    <button
                      type="button"
                      disabled={savingProduct}
                      onClick={() => handleSaveProduct('draft')}
                      className="px-5 h-11 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-900 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      disabled={savingProduct}
                      onClick={() => handleSaveProduct('publish')}
                      className="px-6 h-11 bg-[#C6FF00] hover:bg-opacity-95 active:scale-95 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {savingProduct ? (
                        <Loader2 className="animate-spin text-zinc-950" size={13} />
                      ) : null}
                      <span>Publish Live</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Bottom Navigation bar tab list */}
      <BottomNavBar />
    </div>
  );
};
