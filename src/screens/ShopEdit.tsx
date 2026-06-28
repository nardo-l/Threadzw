import React, { useState, useEffect, useRef } from 'react';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Camera, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Instagram, 
  MessageCircle, 
  Clock, 
  MapPin, 
  Globe, 
  Trash2, 
  Pause, 
  Play,
  Loader2,
  AlertTriangle,
  Info,
  Sparkles,
  Layout,
  Palette,
  Heart,
  BookOpen,
  Facebook,
  Phone,
  HelpCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Shimmer } from '../components/ui/Shimmer';
import { ScreenError } from '../components/ui/ScreenError';
import { FieldError } from '../components/ui/FieldError';
import { uploadImage } from '../utils/uploadImage';
import { useInventory } from '../context/InventoryContext';
import { useShopContext } from '../context/ShopContext';
import { parseShopConfig, serializeShopConfig, StorefrontConfig } from '../utils/configHelper';
import { slugify } from '../utils/slugify';
import { getImageUrl as getGlobalImageUrl } from '../utils/imageUrl';
import { ShopLogo, ShopBanner, ProductImage } from '../components/ui/ShopImage';

const AREAS = [
  'Harare CBD', 'Eastlea', 'Borrowdale', 'Avondale', 'Bulawayo', 
  'Mutare', 'Chitungwiza', 'Gweru', 'Victoria Falls', 'Other'
];

const CATEGORY_OPTIONS = [
  'Sneakers', 'Clothing', 'Thrift', 'Electronics', 'Accessories', 'Jewellery', 'Other'
];

interface TradingHour {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export const ShopEdit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { refreshInventory } = useInventory();
  const { refreshShop } = useShopContext();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Form state
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [handle, setHandle] = useState('');
  const [originalHandle, setOriginalHandle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [suburb, setSuburb] = useState('');
  const [city, setCity] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [pickupAvailable, setPickupAvailable] = useState(false);
  const [pickupLabel, setPickupLabel] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [directions, setDirections] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  
  // Custom Premium Redesigned Storefront States
  const [storeStory, setStoreStory] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<string[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<string[]>([]);
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  const [brandColorPrimary, setBrandColorPrimary] = useState('');
  const [brandColorSecondary, setBrandColorSecondary] = useState('');
  const [brandColorAccent, setBrandColorAccent] = useState('');
  const [layoutStyle, setLayoutStyle] = useState('fashion-editorial');
  const [themeSelection, setThemeSelection] = useState<'streetwear' | 'luxury' | 'minimalist' | 'vintage' | 'sportswear'>('streetwear');
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [tradingHours, setTradingHours] = useState<TradingHour[]>([
    { day: 'Mon', isOpen: true,  openTime: '09:00', closeTime: '18:00' },
    { day: 'Tue', isOpen: true,  openTime: '09:00', closeTime: '18:00' },
    { day: 'Wed', isOpen: true,  openTime: '09:00', closeTime: '18:00' },
    { day: 'Thu', isOpen: true,  openTime: '09:00', closeTime: '18:00' },
    { day: 'Fri', isOpen: true,  openTime: '09:00', closeTime: '18:00' },
    { day: 'Sat', isOpen: true,  openTime: '09:00', closeTime: '17:00' },
    { day: 'Sun', isOpen: false, openTime: '10:00', closeTime: '15:00' },
  ]);

  // Image state
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Handle availability
  const [handleAvailable, setHandleAvailable] = useState(true);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  // UI state
  const [showAreaSheet, setShowAreaSheet] = useState(false);
  const [dangerZoneExpanded, setDangerZoneExpanded] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [contactExpanded, setContactExpanded] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCustomOverlayToast, setShowCustomOverlayToast] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchShopData();
  }, [user]);

  useEffect(() => {
    const fromOverlay = localStorage.getItem('threadzw_from_overlay') === 'true' || 
                        new URLSearchParams(window.location.search).get('from_overlay') === 'true';
    if (fromOverlay) {
      setShowCustomOverlayToast(true);
      localStorage.removeItem('threadzw_from_overlay');
      const t = setTimeout(() => {
        setShowCustomOverlayToast(false);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, []);

  // Handle availability check
  useEffect(() => {
    if (!handle || handle === originalHandle) {
      setHandleAvailable(true);
      setHandleError(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (handle.length < 3) {
        setHandleError('Handle must be at least 3 characters');
        setHandleAvailable(false);
        return;
      }
      
      setCheckingHandle(true);
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('handle')
          .eq('handle', handle.toLowerCase())
          .neq('id', shopId)
          .maybeSingle();

        if (error) throw error;
        
        setHandleAvailable(!data);
        setHandleError(data ? 'This handle is already taken' : null);
      } catch (err) {
        console.error('Handle check error:', err);
      } finally {
        setCheckingHandle(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [handle, originalHandle, shopId]);

  const fetchShopData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;

      setShopId(data.id);
      setShopName(data.name || '');
      setHandle(data.handle || '');
      setOriginalHandle(data.handle || '');
      setCategories(data.categories || []);
      
      // Parse description config safely to support premium custom properties
      const { description: plainDesc, config } = parseShopConfig(data.description || '');
      setDescription(plainDesc);
      setTagline(config.tagline || data.tagline || '');
      setStoreStory(config.story || '');
      setTiktok(config.tiktok || '');
      setFacebook(config.facebook || '');
      setThemeSelection(config.theme_selection || 'streetwear');
      setLayoutStyle(config.layout_style || 'fashion-editorial');
      setFeaturedProducts(config.featured_products || []);
      setBestSellerProducts(config.best_seller_products || []);
      if (config.brand_colors) {
        setBrandColorPrimary(config.brand_colors.primary || '');
        setBrandColorSecondary(config.brand_colors.secondary || '');
        setBrandColorAccent(config.brand_colors.accent || '');
      }

      // Also let's fetch seller products to display selection checklists
      try {
        const { data: pData } = await supabase
          .from('products')
          .select('id, name, price, images, category')
          .eq('shop_id', data.id)
          .neq('status', 'deleted');
        if (pData) {
          setShopProducts(pData);
        }
      } catch (pErr) {
        console.warn('Failed querying products inside ShopEdit:', pErr);
      }
      setSuburb(config.suburb || data.suburb || '');
      setCity(config.city || data.city || '');
      setGoogleMapsUrl(config.google_maps_url || data.google_maps_url || '');
      setPickupAvailable(config.pickup_available !== undefined ? config.pickup_available : (data.pickup_available || false));
      setPickupLabel(config.pickup_label || data.pickup_label || '');
      setArea(data.location || '');
      setLandmark(config.landmark || data.landmark || '');
      setDirections(config.directions || data.directions || '');
      setOnlineOnly(config.online_only !== undefined ? config.online_only : (data.online_only || false));
      setDeliveryInfo(config.delivery_info || data.delivery_info || '');
      setWhatsapp(data.whatsapp ? data.whatsapp.replace('+263', '') : '');
      setInstagram(config.instagram || data.instagram || '');
      if (config.trading_hours) {
        setTradingHours(config.trading_hours);
      } else if (data.trading_hours) {
        setTradingHours(data.trading_hours);
      }
      setBannerUrl(data.banner_url || null);
      setBannerPreview(data.banner_url || null);
      setAvatarUrl(data.logo_url || data.avatar_url || null);
      setAvatarPreview(data.logo_url || data.avatar_url || null);
      setIsLive(data.is_live);
      setProductCount(data.product_count || 0);

    } catch (err) {
      console.error('Fetch shop error:', err);
      setError('Could not load shop details');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string | null) => {
    return getGlobalImageUrl(url);
  };

  const uploadShopImage = async (file: File, type: 'logo' | 'banner') => {
    const toast = {
      error: (msg: string) => showToast(msg, 'error'),
      success: (msg: string) => showToast(msg, 'success'),
    };

    try {
      if (type === 'logo') {
        setUploadingAvatar(true);
      } else {
        setUploadingBanner(true);
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large. Max 5MB.');
        return;
      }
      
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        toast.error('Use JPG, PNG or WebP only.');
        return;
      }

      let activeShopId = shopId;
      if (!activeShopId && user) {
        const { data: dbShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (dbShop) {
          activeShopId = dbShop.id;
          setShopId(dbShop.id);
        }
      }

      const bucket = type === 'logo' ? 'shop-avatars' : 'shop-banners';

      // Build unique file path
      const ext = file.name.split('.').pop();
      const filePath = `${activeShopId || user?.id}/${type}_${Date.now()}.${ext}`;

      let publicUrl = '';

      try {
        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        publicUrl = data.publicUrl;
      } catch (uploadErr: any) {
        console.warn("Storage upload failed, falling back to local preview url. Error:", uploadErr);
        publicUrl = URL.createObjectURL(file);
      }

      // Bust browser cache
      const bustUrl = publicUrl.startsWith('blob:') ? publicUrl : `${publicUrl}?t=${Date.now()}`;

      // Save URL to shops table
      try {
        const { error: dbError } = await supabase
          .from('shops')
          .update(
            type === 'logo' 
              ? { logo_url: publicUrl }
              : { banner_url: publicUrl }
          )
          .eq('owner_id', user?.id || '');

        if (dbError) throw dbError;
      } catch (dbErr: any) {
        console.warn("Database update failed for image path, caching locally. Error:", dbErr);
      }

      // Update local state immediately
      if (type === 'logo') {
        setAvatarUrl(bustUrl);
        setAvatarPreview(bustUrl);
      } else {
        setBannerUrl(bustUrl);
        setBannerPreview(bustUrl);
      }

      // Update localStorage cached shop if key exists
      try {
        const cachedKey = `shop_${user?.id}`;
        const cached = localStorage.getItem(cachedKey);
        let parsed = cached ? JSON.parse(cached) : {};
        if (type === 'logo') {
          parsed.logo_url = publicUrl;
        } else {
          parsed.banner_url = publicUrl;
        }
        localStorage.setItem(cachedKey, JSON.stringify(parsed));
        localStorage.setItem('threadzw_shop', JSON.stringify(parsed));
      } catch (e) {
        console.warn('Cache update warning:', e);
      }

      if (publicUrl.startsWith('blob:')) {
        toast.error(
          type === 'logo'
            ? 'Logo preview active. Configure storage RLS to upload to cloud.'
            : 'Banner preview active. Configure storage RLS to upload to cloud.'
        );
      } else {
        toast.success(
          type === 'logo' 
            ? 'Logo updated!' 
            : 'Banner updated!'
        );
      }

      // Trigger active layout rebuild
      await refreshInventory();
      await refreshShop();

    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed. Try again.');
    } finally {
      if (type === 'logo') {
        setUploadingAvatar(false);
      } else {
        setUploadingBanner(false);
      }
    }
  };

  const markChanged = () => setHasChanges(true);

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadShopImage(file, 'banner');
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadShopImage(file, 'logo');
  };

  const toggleCategory = (cat: string) => {
    setCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    markChanged();
  };

  const updateTradingHour = (index: number, updates: Partial<TradingHour>) => {
    setTradingHours(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
    markChanged();
  };

  const applyToAllWeekdays = () => {
    const mon = tradingHours[0];
    setTradingHours(prev => prev.map((h, i) => 
      i > 0 && i < 5 ? { ...h, isOpen: mon.isOpen, openTime: mon.openTime, closeTime: mon.closeTime } : h
    ));
    markChanged();
    showToast('Applied Monday hours to all weekdays', 'info');
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowUnsavedModal(true);
    } else {
      navigate('/settings');
    }
  };

  const handleSave = async () => {
    console.log('[EDIT_SHOP_PAGE] Save Changes clicked');
    console.log('[EDIT_SHOP_PAGE] Current States:', {
      shopId,
      user: user?.id,
      shopName,
      handle,
      originalHandle,
      tagline,
      categories,
      city,
      suburb,
      onlineOnly,
      area,
      whatsapp,
      instagram
    });

    const errors: Record<string, string> = {};
    if (!shopName.trim()) errors.shopName = 'Shop name is required';
    if (!handle.trim()) errors.handle = 'Shop handle is required';
    if (categories.length === 0) errors.categories = 'Select at least one category';
    if (!onlineOnly) {
      if (!area) errors.area = 'Please select your area';
      if (!landmark.trim()) errors.landmark = 'Please add your landmark';
      if (!directions.trim()) errors.directions = 'Please add directions';
    }

    // Standardize & clean Zimbabwean WhatsApp input format
    let cleanWhatsapp = whatsapp.replace(/\D/g, '');
    if (cleanWhatsapp.startsWith('0')) {
      cleanWhatsapp = cleanWhatsapp.substring(1);
    }
    
    if (!whatsapp.trim() || cleanWhatsapp.length !== 9) {
      errors.whatsapp = 'Please enter a valid 9-digit WhatsApp number (e.g. 077... or 77...)';
    }
    
    if (!handleAvailable) errors.handle = handleError || 'This handle is already taken';

    if (Object.keys(errors).length > 0) {
      console.warn('[EDIT_SHOP_PAGE] Validation failed:', errors);
      setValidationErrors(errors);
      const firstErrorVal = Object.values(errors)[0];
      showToast(firstErrorVal, 'error');
      setSaveError(firstErrorVal);
      const firstErrorKey = Object.keys(errors)[0];
      
      if (firstErrorKey === 'area' || firstErrorKey === 'landmark' || firstErrorKey === 'directions') {
        setContactExpanded(true);
      }
      
      setTimeout(() => {
        const element = document.getElementById(`field-${firstErrorKey}`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    // Try verifying and restoring shopId if undefined
    let activeShopId = shopId;
    if (!activeShopId && user?.id) {
      console.log('[EDIT_SHOP_PAGE] shopId empty, querying by owner_id:', user.id);
      try {
        const { data: dbShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (dbShop) {
          activeShopId = dbShop.id;
          setShopId(dbShop.id);
          console.log('[EDIT_SHOP_PAGE] Recovered missing shopId:', dbShop.id);
        }
      } catch (recoveryErr) {
        console.error('[EDIT_SHOP_PAGE] Error recovering active shopId:', recoveryErr);
      }
    }

    if (!activeShopId) {
      setSaveError('Shop identifier not found. Please refresh page and verify shop setup.');
      showToast('Shop identifier missing', 'error');
      console.error('[EDIT_SHOP_PAGE] Save aborted: activeShopId is empty');
      return;
    }

    setSaving(true);
    setValidationErrors({});
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const cleanBanner = bannerUrl ? bannerUrl.split('?')[0] : null;
      const cleanAvatar = avatarUrl ? avatarUrl.split('?')[0] : null;

      // Pack custom storefront settings into config block safely
      const configObj: StorefrontConfig = {
        tagline: tagline.trim(),
        story: storeStory.trim(),
        featured_products: featuredProducts,
        best_seller_products: bestSellerProducts,
        instagram: instagram.trim(),
        tiktok: tiktok.trim(),
        facebook: facebook.trim(),
        whatsapp_number: `+263${cleanWhatsapp}`,
        theme_selection: themeSelection,
        layout_style: layoutStyle,
        brand_colors: {
          primary: brandColorPrimary,
          secondary: brandColorSecondary,
          accent: brandColorAccent,
        },
        suburb: suburb.trim() || undefined,
        city: city.trim() || undefined,
        google_maps_url: googleMapsUrl.trim() || undefined,
        pickup_available: pickupAvailable,
        pickup_label: pickupLabel.trim() || undefined,
        landmark: landmark.trim() || undefined,
        directions: directions.trim() || undefined,
        online_only: onlineOnly,
        delivery_info: onlineOnly ? deliveryInfo.trim() : undefined,
        instagram_url: instagram.trim() ? `https://instagram.com/${instagram.trim().replace(/^@/, '')}` : undefined,
        trading_hours: tradingHours,
      };

      const serializedDescription = serializeShopConfig(description, configObj);

      // Prepare payload and strip undefined values
      const updateData: any = {
        name: shopName.trim(),
        handle: handle.trim().toLowerCase(),
        slug: slugify(handle),
        description: serializedDescription,
        categories,
        location: onlineOnly ? null : area,
        whatsapp: `+263${cleanWhatsapp}`,
        whatsapp_number: `+263${cleanWhatsapp}`,
        instagram: instagram.trim() || null,
        banner_url: cleanBanner,
        logo_url: cleanAvatar,
        updated_at: new Date().toISOString()
      };

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      console.log('[EDIT_SHOP_PAGE] Final database update payload:', updateData);

      // Update shop in database
      const { data, error: updateError } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', activeShopId)
        .select()
        .single();

      console.log('[EDIT_SHOP_PAGE] Exact Supabase response:', { data, error: updateError });

      if (updateError) {
        console.error('[EDIT_SHOP_PAGE] Supabase error response:', updateError);
        
        if (updateError.code === '23505') {
          setHandleError('This handle was just taken by someone else. Try a different one.');
          setHandleAvailable(false);
          setSaving(false);
          return;
        }

        if (updateError.code === '42501') {
          setSaveError('Permission denied. Please make sure you are logged in as the owner of this shop.');
          showToast('Update permission denied', 'error');
          setSaving(false);
          return;
        }

        throw updateError;
      }

      console.log('[EDIT_SHOP_PAGE] Database update successful:', data);

      // Save changes locally in localStorage immediately to prevent stale states
      try {
        if (user?.id) {
          const cachedKey = `shop_${user.id}`;
          const cached = localStorage.getItem(cachedKey);
          let mergedObj = { id: activeShopId, owner_id: user.id, ...updateData };
          if (cached) {
            mergedObj = { ...JSON.parse(cached), ...updateData };
          }
          localStorage.setItem(cachedKey, JSON.stringify(mergedObj));
          localStorage.setItem('threadzw_shop', JSON.stringify(mergedObj));
          if (updateData.name) {
            localStorage.setItem('threadzw_owner_name', updateData.name);
          }
        }
      } catch (e) {
        console.warn("[EDIT_SHOP_PAGE] Error caching shop updates locally:", e);
      }

      // Sync state and memory to avoid stale data
      await refreshInventory();
      await refreshShop();

      setHasChanges(false);
      setSaveSuccess(true);
      showToast('Shop updated successfully', 'success');
      setTimeout(() => {
        setSaveSuccess(false);
        navigate('/settings');
      }, 1000);

    } catch (err: any) {
      console.error('[EDIT_SHOP_PAGE] Caught unexpected save error:', err);
      const msg = err?.message || 'Could not save changes -- please try again';
      setSaveError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePauseToggle = async () => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_live: !isLive })
        .eq('id', shopId);

      if (error) throw error;

      // Update local storage cache
      try {
        if (user?.id) {
          const cachedKey = `shop_${user.id}`;
          const cached = localStorage.getItem(cachedKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.is_live = !isLive;
            localStorage.setItem(cachedKey, JSON.stringify(parsed));
            localStorage.setItem('threadzw_shop', JSON.stringify(parsed));
          }
        }
      } catch (cacheErr) {
        console.warn('Error updating pause status in caching:', cacheErr);
      }

      setIsLive(!isLive);
      await refreshShop();
      showToast(isLive ? 'Shop paused' : 'Shop is live again', 'success');
      setShowPauseModal(false);
      navigate('/settings');
    } catch (err) {
      showToast('Error updating shop status', 'error');
    }
  };

  const handleDeleteShop = async () => {
    try {
      setSaving(true);
      // Cancel subscription
      await supabase.from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('shop_id', shopId);

      // Mark products as deleted
      await supabase.from('products')
        .update({ status: 'deleted' })
        .eq('shop_id', shopId);

      // Delete shop
      await supabase.from('shops')
        .delete()
        .eq('id', shopId);

      localStorage.removeItem('thread_shop_draft');
      showToast('Shop deleted permanently', 'info');
      navigate('/profile');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Could not delete shop -- contact support', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md z-50 flex items-center px-4 border-b border-border">
          <Shimmer className="w-8 h-8 rounded-full" />
          <Shimmer className="w-32 h-6 mx-auto rounded-md" />
          <Shimmer className="w-12 h-6 rounded-md" />
        </div>
        <div className="pt-20 px-4 space-y-8">
          <Shimmer className="w-full h-[140px] rounded-16" />
          <div className="space-y-4">
            <Shimmer className="w-1/3 h-6 rounded-md" />
            <Shimmer className="w-full h-14 rounded-12" />
          </div>
          <div className="space-y-4">
            <Shimmer className="w-1/3 h-6 rounded-md" />
            <Shimmer className="w-full h-14 rounded-12" />
          </div>
          <div className="space-y-4">
            <Shimmer className="w-1/3 h-6 rounded-md" />
            <div className="grid grid-cols-3 gap-2">
              <Shimmer className="h-10 rounded-pill" />
              <Shimmer className="h-10 rounded-pill" />
              <Shimmer className="h-10 rounded-pill" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ScreenError 
        icon={<AlertTriangle size={32} />}
        heading="Could not load your shop"
        body={error}
        onRetry={fetchShopData} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Custom Overlay Toast */}
      {showCustomOverlayToast && (
        <div id="custom-overlay-toast" className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce cursor-pointer flex items-center justify-center w-[calc(100%-32px)] max-w-[398px]">
          <div style={{
            background: 'rgba(198, 255, 0,0.12)',
            border: '1px solid rgba(198, 255, 0,0.25)',
            borderRadius: '10px',
            color: '#C6FF00',
            fontSize: '13px',
            padding: '12px 16px'
          }} className="font-extrabold shadow-[0_4px_24px_rgba(0,0,0,0.9)] flex items-center gap-2 w-full justify-center">
            <span>👋 Start by adding your logo and banner</span>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md z-50 flex items-center justify-between px-4 border-b border-border max-w-[430px] mx-auto">
        <button 
          onClick={handleBack}
          className="p-2 -ml-2 text-white hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        
        <h1 className="font-pacifico text-xl text-white">Edit Shop</h1>
        
        <div className="w-10 h-10" /> {/* Balance placeholder */}
      </div>

      <div className="pt-20 px-4 space-y-10">
        {/* ========================================================
            PART 1: BASIC SETTINGS
           ======================================================== */}
        <section className="space-y-6">
          <div className="space-y-1 border-b border-border/40 pb-2">
            <h2 className="font-syne font-bold text-lg text-white">Basic Settings</h2>
            <p className="font-sans text-xs text-muted">Core information about your brand & store</p>
          </div>

          {/* Shop Photos */}
          <div className="space-y-4">
            <label className="font-mono text-xs text-muted uppercase tracking-wider block">Shop Photos</label>
            <div className="relative">
              {/* Banner Upload */}
              <div 
                onClick={() => {
                  if (!uploadingBanner) bannerInputRef.current?.click();
                }}
                className="w-full h-[140px] rounded-16 overflow-hidden bg-elevated border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer group relative flex flex-col items-center justify-center"
              >
                {(bannerPreview || bannerUrl) ? (
                  <>
                    <ShopBanner 
                      url={bannerPreview || bannerUrl} 
                      alt="Banner" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                      <Camera size={24} className="text-white mb-1" />
                      <span className="font-mono text-[10px] text-white uppercase tracking-wider">Change Banner</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <Camera size={24} className="text-primary" />
                    </div>
                    <span className="font-mono text-xs text-muted">Upload Banner</span>
                    <span className="font-mono text-[8px] text-muted/60 mt-1 uppercase tracking-tighter">Appears at the top of your shop profile</span>
                  </>
                )}
                
                {uploadingBanner && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <Loader2 size={24} className="text-primary animate-spin" />
                    <span className="ml-2 font-mono text-xs text-white">Uploading...</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  disabled={uploadingBanner}
                  onClick={() => bannerInputRef.current?.click()}
                  className="px-4 py-2 bg-elevated border border-border text-xs rounded-lg font-mono text-white flex items-center gap-2 hover:bg-white/5 disabled:opacity-50 transition-all font-bold"
                >
                  {uploadingBanner ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-primary" />
                      <span>Uploading...</span>
                    </>
                  ) : (bannerPreview || bannerUrl) ? (
                    'Change Banner'
                  ) : (
                    'Upload Banner'
                  )}
                </button>
              </div>

              {/* Avatar Upload */}
              <div className="absolute -bottom-16 left-4 flex flex-col items-center">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!uploadingAvatar) avatarInputRef.current?.click();
                  }}
                  className="w-20 h-20 rounded-full bg-elevated border-2 border-primary overflow-hidden cursor-pointer group relative flex items-center justify-center shadow-xl mb-1"
                >
                  {(avatarPreview || avatarUrl) ? (
                    <>
                      <ShopLogo 
                        url={avatarPreview || avatarUrl} 
                        name={shopName}
                        alt="Logo" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <Camera size={24} className="text-primary" />
                  )}
                  
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                      <Loader2 size={20} className="text-primary animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={(e) => {
                    e.stopPropagation();
                    avatarInputRef.current?.click();
                  }}
                  className="font-mono text-[10px] text-primary uppercase tracking-wider block w-full text-center hover:underline disabled:opacity-50 font-bold"
                >
                  {uploadingAvatar ? 'Uploading...' : (avatarPreview || avatarUrl) ? 'Change Logo' : 'Upload Logo'}
                </button>
              </div>
            </div>
            
            <p className="font-mono text-[10px] text-muted pt-14">
              Changes will be saved when you tap Save Changes
            </p>

            <input 
              type="file" 
              ref={bannerInputRef} 
              onChange={handleBannerSelect} 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp" 
            />
            <input 
              type="file" 
              ref={avatarInputRef} 
              onChange={handleAvatarSelect} 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp" 
            />
          </div>

          {/* Shop Name */}
          <div id="field-shopName" className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="font-mono text-xs text-muted uppercase tracking-wider">
                Shop Name <span className="text-primary">*</span>
              </label>
              <span className="font-mono text-[10px] text-muted">{shopName.length}/40</span>
            </div>
            <input 
              value={shopName}
              onChange={e => {
                if (e.target.value.length <= 40) {
                  setShopName(e.target.value);
                  markChanged();
                }
              }}
              placeholder="Your shop's name"
              className={`w-full bg-elevated border-2 rounded-12 p-4 text-white font-sans focus:outline-none transition-all ${
                validationErrors.shopName ? 'border-red' : 'border-transparent focus:border-primary'
              }`}
            />
            {validationErrors.shopName && <FieldError message={validationErrors.shopName} />}
          </div>

          {/* Shop Link */}
          <div id="field-handle" className="space-y-2">
            <label className="font-mono text-xs text-muted uppercase tracking-wider">
              Shop Link <span className="text-primary">*</span>
            </label>
            <div className={`flex items-center bg-elevated border-2 rounded-12 overflow-hidden transition-all ${
              validationErrors.handle ? 'border-red' : 'border-transparent focus-within:border-primary'
            }`}>
              <span className="pl-4 font-mono text-primary text-sm">thread.zw/</span>
              <input 
                value={handle}
                onChange={e => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                  if (val.length <= 30) {
                    setHandle(val);
                    markChanged();
                  }
                }}
                placeholder="handle"
                className="flex-1 bg-transparent p-4 pl-0 text-white font-sans focus:outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 min-h-[16px]">
              {checkingHandle && (
                <>
                  <Loader2 size={12} className="text-primary animate-spin" />
                  <span className="font-mono text-[11px] text-muted">Checking...</span>
                </>
              )}
              {!checkingHandle && handle && handle !== originalHandle && (
                handleAvailable ? (
                  <>
                    <Check size={12} className="text-green" />
                    <span className="font-mono text-[11px] text-green">Available</span>
                  </>
                ) : (
                  <>
                    <X size={12} className="text-red" />
                    <span className="font-mono text-[11px] text-red">{handleError || 'Already taken'}</span>
                  </>
                )
              )}
            </div>

            <div className="bg-elevated/50 border border-primary/20 rounded-12 p-3 mt-2">
              <span className="font-mono text-[10px] text-muted uppercase tracking-tighter block mb-1">Your shop link:</span>
              <span className="font-mono text-sm text-primary font-bold">thread.zw/{handle || 'handle'}</span>
            </div>
            {validationErrors.handle && <FieldError message={validationErrors.handle} />}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="font-mono text-xs text-muted uppercase tracking-wider">Description</label>
              <span className="font-mono text-[10px] text-muted">{description.length}/300</span>
            </div>
            <textarea 
              value={description}
              onChange={e => {
                if (e.target.value.length <= 300) {
                  setDescription(e.target.value);
                  markChanged();
                }
              }}
              rows={4}
              placeholder="Tell buyers what you sell and why they should shop with you"
              className="w-full bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-4 text-white font-sans focus:outline-none resize-none transition-all"
            />
          </div>

          {/* WhatsApp */}
          <div id="field-whatsapp" className="space-y-2">
            <label className="font-mono text-xs text-muted uppercase tracking-wider">
              WhatsApp Number <span className="text-primary">*</span>
            </label>
            <div className={`flex items-center bg-elevated border-2 rounded-12 overflow-hidden transition-all ${
              validationErrors.whatsapp ? 'border-red' : 'border-transparent focus-within:border-primary'
            }`}>
              <span className="pl-4 font-mono text-muted text-sm">+263</span>
              <input 
                type="tel"
                value={whatsapp}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 9) {
                    setWhatsapp(val);
                    markChanged();
                  }
                }}
                placeholder="771 234 567"
                className="flex-1 bg-transparent p-4 pl-2 text-white font-sans focus:outline-none"
              />
            </div>
            
            {whatsapp.length === 9 && (
              <div className="bg-green/5 border-l-2 border-green p-3 rounded-r-12 flex items-start gap-3 animate-wipe">
                <MessageCircle size={16} className="text-green mt-0.5" />
                <div className="space-y-1">
                  <p className="font-mono text-[10px] text-green uppercase font-bold">WhatsApp Preview</p>
                  <p className="font-mono text-[11px] text-muted leading-relaxed">
                    Buyers will see: "Hi, I'm interested in [product] from Thread ZW..."
                  </p>
                </div>
              </div>
            )}
            {validationErrors.whatsapp && <FieldError message={validationErrors.whatsapp} />}
          </div>

          {/* Categories */}
          <div id="field-categories" className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-xs text-muted uppercase tracking-wider">Categories</label>
              <p className="font-sans text-xs text-muted">Select everything that applies to your shop</p>
            </div>

            <div className={`flex flex-wrap gap-2 transition-all ${validationErrors.categories ? 'animate-shake' : ''}`}>
              {CATEGORY_OPTIONS.map((cat, index) => {
                const isSelected = categories.includes(cat);
                return (
                  <button
                    key={`${cat || 'cat'}-${index}`}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-4 py-2 rounded-pill font-sans text-sm transition-all border ${
                      isSelected 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-elevated border-border text-muted hover:border-primary/50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            {validationErrors.categories && <FieldError message={validationErrors.categories} />}
          </div>
        </section>

        {/* ========================================================
            PART 2: CONTACT & LOCATION (COLLAPSIBLE ACCORDION)
           ======================================================== */}
        <section className="space-y-6 pt-6 border-t border-border">
          <button 
            type="button"
            onClick={() => setContactExpanded(!contactExpanded)}
            className="w-full flex items-center justify-between py-2 text-left group"
          >
            <div className="space-y-1">
              <h2 className="font-syne font-bold text-lg text-white group-hover:text-primary transition-colors flex items-center gap-2">
                Contact & Location
                <MapPin size={16} className="text-primary" />
              </h2>
              <p className="font-sans text-xs text-muted">Manage storefront access and secondary connections</p>
            </div>
            <div className="p-2 bg-elevated rounded-full text-muted group-hover:text-white transition-colors">
              <ChevronDown 
                size={20} 
                className={`transform transition-transform duration-300 ${contactExpanded ? 'rotate-180' : ''}`} 
              />
            </div>
          </button>

          {contactExpanded && (
            <div className="space-y-6 pt-4 animate-wipe">
              {/* Online Only Toggle */}
              <div className="flex items-center justify-between bg-elevated p-4 rounded-12">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe size={20} className="text-primary" />
                  </div>
                  <span className="font-sans text-white">My shop is online only</span>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setOnlineOnly(!onlineOnly);
                    markChanged();
                  }}
                  className={`w-12 h-6 rounded-pill relative transition-colors ${onlineOnly ? 'bg-primary' : 'bg-muted/30'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${onlineOnly ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {!onlineOnly ? (
                <div className="space-y-6 animate-wipe overflow-hidden">
                  {/* Area Dropdown */}
                  <div id="field-area" className="space-y-2">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider">
                      Area <span className="text-primary">*</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowAreaSheet(true)}
                      className={`w-full bg-elevated border-2 rounded-12 p-4 text-white font-sans flex items-center justify-between transition-all ${
                        validationErrors.area ? 'border-red' : 'border-transparent focus:border-primary'
                      }`}
                    >
                      <span className={area ? 'text-white' : 'text-muted'}>
                        {area || 'Select your area'}
                      </span>
                      <ChevronDown size={20} className="text-muted" />
                    </button>
                    {validationErrors.area && <FieldError message={validationErrors.area} />}
                  </div>

                  {/* Suburb & City Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-muted uppercase tracking-wider">Suburb</label>
                      <input 
                        value={suburb}
                        onChange={e => {
                          setSuburb(e.target.value);
                          markChanged();
                        }}
                        placeholder="e.g. Avondale"
                        className="w-full bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-4 text-white font-sans focus:outline-none transition-all font-sans"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-muted uppercase tracking-wider">City</label>
                      <input 
                        value={city}
                        onChange={e => {
                          setCity(e.target.value);
                          markChanged();
                        }}
                        placeholder="e.g. Harare"
                        className="w-full bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-4 text-white font-sans focus:outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Google Maps URL Link */}
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider">Google Maps Link</label>
                    <input 
                      value={googleMapsUrl}
                      onChange={e => {
                        setGoogleMapsUrl(e.target.value);
                        markChanged();
                      }}
                      placeholder="e.g. https://maps.google.com/?q=..."
                      className="w-full bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-4 text-white font-sans focus:outline-none transition-all font-sans"
                    />
                  </div>

                  {/* Landmark */}
                  <div id="field-landmark" className="space-y-2">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider">
                      Landmark / Address <span className="text-primary">*</span>
                    </label>
                    <input 
                      value={landmark}
                      onChange={e => {
                        setLandmark(e.target.value);
                        markChanged();
                      }}
                      placeholder="e.g. Eastlea Shopping Centre, Shop 14"
                      className={`w-full bg-elevated border-2 rounded-12 p-4 text-white font-sans focus:outline-none transition-all ${
                        validationErrors.landmark ? 'border-red' : 'border-transparent focus:border-primary'
                      }`}
                    />
                    {validationErrors.landmark && <FieldError message={validationErrors.landmark} />}
                  </div>

                  {/* Directions */}
                  <div id="field-directions" className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label className="font-mono text-xs text-muted uppercase tracking-wider">
                        How to Get There <span className="text-primary">*</span>
                      </label>
                      <span className="font-mono text-[10px] text-muted">{directions.length}/500</span>
                    </div>
                    <textarea 
                      value={directions}
                      onChange={e => {
                        if (e.target.value.length <= 500) {
                          setDirections(e.target.value);
                          markChanged();
                        }
                      }}
                      rows={5}
                      placeholder="Step-by-step directions from a nearby landmark..."
                      className={`w-full bg-elevated border-2 rounded-12 p-4 text-white font-sans focus:outline-none resize-none transition-all ${
                        validationErrors.directions ? 'border-red' : 'border-transparent focus:border-primary'
                      }`}
                    />
                    <p className="font-mono text-[10px] text-muted/60 uppercase tracking-tighter">This is what buyers see instead of Google Maps</p>
                    {validationErrors.directions && <FieldError message={validationErrors.directions} />}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 animate-wipe overflow-hidden">
                  <label className="font-mono text-xs text-muted uppercase tracking-wider">Delivery Information</label>
                  <textarea 
                    value={deliveryInfo}
                    onChange={e => {
                      setDeliveryInfo(e.target.value);
                      markChanged();
                    }}
                    rows={3}
                    placeholder="Describe how you deliver -- courier, pickup point, areas covered..."
                    className="w-full bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-4 text-white font-sans focus:outline-none resize-none transition-all"
                  />
                </div>
              )}

              {/* Instagram Handle */}
              <div className="space-y-2">
                <label className="font-mono text-xs text-muted uppercase tracking-wider">Instagram Handle</label>
                <div className="flex items-center bg-elevated border-2 border-transparent focus-within:border-primary rounded-12 overflow-hidden transition-all">
                  <span className="pl-4 font-mono text-muted text-sm">@</span>
                  <input 
                    value={instagram}
                    onChange={e => {
                      setInstagram(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''));
                      markChanged();
                    }}
                    placeholder="yourshopname"
                    className="flex-1 bg-transparent p-4 pl-1 text-white font-sans focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================
            PART 3: ADVANCED SETTINGS (COLLAPSIBLE ACCORDION)
           ======================================================== */}
        <section className="space-y-6 pt-6 border-t border-border">
          <button 
            type="button"
            onClick={() => setAdvancedExpanded(!advancedExpanded)}
            className="w-full flex items-center justify-between py-2 text-left group"
          >
            <div className="space-y-1">
              <h2 className="font-syne font-bold text-lg text-white group-hover:text-primary transition-colors flex items-center gap-2">
                Advanced Settings
                <Sparkles size={16} className="text-primary" />
              </h2>
              <p className="font-sans text-xs text-muted">Trading hours, pickup setup, theme, brand story, and collections</p>
            </div>
            <div className="p-2 bg-elevated rounded-full text-muted group-hover:text-white transition-colors">
              <ChevronDown 
                size={20} 
                className={`transform transition-transform duration-300 ${advancedExpanded ? 'rotate-180' : ''}`} 
              />
            </div>
          </button>

          {advancedExpanded && (
            <div className="space-y-8 pt-4 animate-wipe">
              {/* Pickup Configuration */}
              <div className="space-y-4">
                <h3 className="font-syne font-bold text-md text-white border-b border-border/20 pb-1">Pickup Setup</h3>
                <div className="flex items-center justify-between bg-elevated p-4 rounded-12">
                  <div className="flex flex-col">
                    <span className="font-sans text-white font-medium">In-person Pickup Available</span>
                    <span className="font-mono text-[10px] text-muted uppercase mt-0.5">Allow buyers to pick up items directly</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setPickupAvailable(!pickupAvailable);
                      markChanged();
                    }}
                    className={`w-12 h-6 rounded-pill relative transition-colors ${pickupAvailable ? 'bg-primary' : 'bg-muted/30'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pickupAvailable ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {pickupAvailable && (
                  <div className="space-y-2 animate-wipe overflow-hidden">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider">Pickup Notice / Label</label>
                    <input 
                      value={pickupLabel}
                      onChange={e => {
                        setPickupLabel(e.target.value);
                        markChanged();
                      }}
                      placeholder="e.g. Pickup available within 2 hours"
                      className="w-full bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-4 text-white font-sans focus:outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Trading Hours */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border/20 pb-1">
                  <h3 className="font-syne font-bold text-md text-white">Trading Hours</h3>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock size={16} className="text-primary" />
                  </div>
                </div>

                <div className="space-y-4">
                  {tradingHours.map((hour, index) => (
                    <div key={`${hour.day || 'hour'}-${index}`} className="flex items-center justify-between">
                      <span className="font-sans text-white w-12 text-sm">{hour.day}</span>
                      
                      <div className="flex-1 flex items-center justify-end gap-3">
                        {hour.isOpen ? (
                          <div className="flex items-center gap-2 animate-wipe">
                            <input 
                              type="time"
                              value={hour.openTime}
                              onChange={e => updateTradingHour(index, { openTime: e.target.value })}
                              className="bg-elevated border-2 border-transparent focus:border-primary rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                            />
                            <span className="text-muted">—</span>
                            <input 
                              type="time"
                              value={hour.closeTime}
                              onChange={e => updateTradingHour(index, { closeTime: e.target.value })}
                              className="bg-elevated border-2 border-transparent focus:border-primary rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-muted uppercase tracking-wider">Closed</span>
                        )}

                        <button 
                          type="button"
                          onClick={() => updateTradingHour(index, { isOpen: !hour.isOpen })}
                          className={`w-10 h-5 rounded-pill relative transition-colors ${hour.isOpen ? 'bg-primary' : 'bg-muted/30'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hour.isOpen ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  type="button"
                  onClick={applyToAllWeekdays}
                  className="font-mono text-xs text-primary uppercase tracking-wider hover:underline"
                >
                  Apply to all weekdays
                </button>
              </div>

              {/* Theme Customization */}
              <div className="space-y-4">
                <h3 className="font-syne font-bold text-md text-white border-b border-border/20 pb-1">Boutique Themes</h3>
                <div className="bg-elevated/40 border border-border/40 rounded-16 p-4 space-y-5">
                  {/* Theme Selection */}
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider flex items-center gap-1.5 text-white">
                      <Palette size={14} className="text-primary" /> Theme Selection
                    </label>
                    <p className="text-xs text-muted">Each theme automatically redesigns typography, spacing, and layouts to vibe perfectly.</p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {(['streetwear', 'luxury', 'minimalist', 'vintage', 'sportswear'] as const).map((theme) => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => {
                            setThemeSelection(theme);
                            markChanged();
                          }}
                          className={`p-3 rounded-12 border-2 text-xs font-syne font-bold capitalize transition-all ${
                            themeSelection === theme 
                              ? 'border-primary bg-primary/10 text-white shadow-md' 
                              : 'border-transparent bg-elevated text-muted hover:text-white hover:bg-elevated-hover'
                          }`}
                        >
                          {theme === 'luxury' ? 'Luxury Fashion' : theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Style */}
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider flex items-center gap-1.5 text-white">
                      <Layout size={14} className="text-primary" /> Homepage Layout Style
                    </label>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {[
                        { id: 'fashion-editorial', label: 'Premium Editorial' },
                        { id: 'bento-grid', label: 'Bento Grid Style' },
                        { id: 'default', label: 'Classic Grid' }
                      ].map((layout) => (
                        <button
                          key={layout.id}
                          type="button"
                          onClick={() => {
                            setLayoutStyle(layout.id);
                            markChanged();
                          }}
                          className={`p-2.5 rounded-12 border-2 text-xs font-syne font-bold transition-all ${
                            layoutStyle === layout.id 
                              ? 'border-primary bg-primary/10 text-white shadow-md' 
                              : 'border-transparent bg-elevated text-muted hover:text-white hover:bg-elevated-hover'
                          }`}
                        >
                          {layout.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tagline */}
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider flex items-center gap-2 text-white">
                      Store Tagline
                    </label>
                    <input
                      value={tagline}
                      onChange={e => {
                        setTagline(e.target.value);
                        markChanged();
                      }}
                      placeholder="Built for the ones chasing more"
                      className="w-full bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-3 text-white text-sm focus:outline-none"
                    />
                  </div>

                  {/* Store Story */}
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider flex items-center gap-2 text-white">
                      <BookOpen size={14} className="text-primary" /> Brand Story / Mission
                    </label>
                    <textarea
                      value={storeStory}
                      onChange={e => {
                        setStoreStory(e.target.value);
                        markChanged();
                      }}
                      placeholder="In 2026, we launched Kure to connect high-concept silhouettes with local Harare design structures..."
                      rows={4}
                      className="w-full bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-3 text-white text-sm focus:outline-none resize-none"
                    />
                  </div>

                  {/* Colors Override */}
                  <div className="space-y-3 pt-2">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider flex items-center gap-1.5 text-white">
                      <Palette size={14} /> Brand Colors Override (Optional)
                    </label>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Specify hex overrides or leave blank to let our AI auto-extract colors from your store logo.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] text-muted uppercase font-semibold">Primary</span>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="color"
                            value={brandColorPrimary || '#000000'}
                            onChange={e => {
                              setBrandColorPrimary(e.target.value);
                              markChanged();
                            }}
                            className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            placeholder="Auto"
                            value={brandColorPrimary}
                            onChange={e => {
                              setBrandColorPrimary(e.target.value);
                              markChanged();
                            }}
                            className="font-mono text-[9px] w-full bg-elevated text-white p-1 rounded uppercase min-w-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="font-mono text-[9px] text-muted uppercase font-semibold">Secondary</span>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="color"
                            value={brandColorSecondary || '#ffffff'}
                            onChange={e => {
                              setBrandColorSecondary(e.target.value);
                              markChanged();
                            }}
                            className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            placeholder="Auto"
                            value={brandColorSecondary}
                            onChange={e => {
                              setBrandColorSecondary(e.target.value);
                              markChanged();
                            }}
                            className="font-mono text-[9px] w-full bg-elevated text-white p-1 rounded uppercase min-w-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="font-mono text-[9px] text-muted uppercase font-semibold">Accent</span>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="color"
                            value={brandColorAccent || '#C6FF00'}
                            onChange={e => {
                              setBrandColorAccent(e.target.value);
                              markChanged();
                            }}
                            className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            placeholder="Auto"
                            value={brandColorAccent}
                            onChange={e => {
                              setBrandColorAccent(e.target.value);
                              markChanged();
                            }}
                            className="font-mono text-[9px] w-full bg-elevated text-white p-1 rounded uppercase min-w-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social links tiktok and facebook */}
                  <div className="space-y-3 pt-2">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider text-white">Secondary Social Platforms</label>
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-muted">TikTok Handle</span>
                      <div className="flex items-center bg-elevated rounded-12 p-3 text-sm">
                        <span className="text-muted mr-1">@</span>
                        <input
                          value={tiktok}
                          onChange={e => {
                            setTiktok(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''));
                            markChanged();
                          }}
                          placeholder="kure_clothing"
                          className="flex-1 bg-transparent text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-muted">Facebook Profile URL</span>
                      <div className="flex items-center bg-elevated rounded-12 p-3 text-sm">
                        <Facebook size={14} className="text-muted mr-2" />
                        <input
                          value={facebook}
                          onChange={e => {
                            setFacebook(e.target.value);
                            markChanged();
                          }}
                          placeholder="https://facebook.com/kureclothing"
                          className="flex-1 bg-transparent text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collections selection */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border/20 pb-1">
                  <h3 className="font-syne font-bold text-md text-white">Collections Configuration</h3>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart size={16} className="text-red-500" />
                  </div>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Toggles which of your items will render under the premium "Featured Collection" and "Best Seller" storefront grids.
                </p>

                {shopProducts.length === 0 ? (
                  <div className="p-4 bg-elevated/45 text-center rounded-12">
                    <p className="text-xs text-muted font-mono uppercase">No products listed yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 border border-border/20 rounded-12 p-2 bg-elevated/30">
                    {shopProducts.map((p, index) => {
                      const isFeat = featuredProducts.includes(p.id);
                      const isBest = bestSellerProducts.includes(p.id);
                      const imgUrl = Array.isArray(p.images) && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=80&q=80';
                      
                      return (
                        <div key={`${p.id || 'product'}-${index}`} className="flex items-center justify-between p-2 rounded-8 bg-elevated/80 border border-border/10">
                          <div className="flex items-center gap-2">
                            <ProductImage url={imgUrl} className="w-8 h-8 rounded object-cover" />
                            <div className="leading-tight">
                              <p className="text-xs text-white font-medium truncate max-w-[120px]">{p.name}</p>
                              <p className="text-[10px] text-primary font-mono">${p.price}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isFeat) {
                                  setFeaturedProducts(featuredProducts.filter(id => id !== p.id));
                                } else {
                                  setFeaturedProducts([...featuredProducts, p.id]);
                                }
                                markChanged();
                              }}
                              className={`px-2 py-1 rounded text-[9px] font-mono uppercase tracking-wider border transition-colors ${
                                isFeat 
                                  ? 'bg-primary text-black border-primary' 
                                  : 'bg-transparent text-muted border-muted/30 hover:border-muted'
                              }`}
                            >
                              Featured
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (isBest) {
                                  setBestSellerProducts(bestSellerProducts.filter(id => id !== p.id));
                                } else {
                                  setBestSellerProducts([...bestSellerProducts, p.id]);
                                }
                                markChanged();
                              }}
                              className={`px-2 py-1 rounded text-[9px] font-mono uppercase tracking-wider border transition-colors ${
                                isBest 
                                  ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                                  : 'bg-transparent text-muted border-muted/30 hover:border-muted'
                              }`}
                            >
                              Best Seller
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Spacing spacer instead of static save button */}
        <div className="pt-4" />

        {/* Danger Zone */}
        <section className="pt-10 border-t border-border">
          <button 
            onClick={() => setDangerZoneExpanded(!dangerZoneExpanded)}
            className="flex items-center gap-2 font-mono text-xs text-red uppercase tracking-widest mb-4"
          >
            Danger Zone
            {dangerZoneExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {dangerZoneExpanded && (
            <div className="space-y-4 animate-wipe overflow-hidden">
              {/* Delete Shop */}
              <div className="bg-elevated rounded-16 p-5 border-l-4 border-red">
                <h3 className="font-syne font-bold text-lg text-red mb-1">Delete Your Shop</h3>
                <p className="font-sans text-sm text-muted mb-6">
                  Permanently deletes your shop, all products, and sales history. This cannot be undone.
                </p>
                <button 
                  onClick={() => setShowDeleteStep1(true)}
                  className="px-6 py-2.5 rounded-pill font-syne font-bold text-sm border border-red text-red hover:bg-red/10 transition-all"
                >
                  Delete Shop
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      
      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-[340px] rounded-20 p-6 border border-border space-y-6">
            <div className="space-y-2">
              <h3 className="font-syne font-bold text-xl text-white">Unsaved changes</h3>
              <p className="font-sans text-muted">You have unsaved changes. Leave without saving?</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleSave}
                className="w-full py-4 bg-primary text-white font-syne font-bold rounded-14 shadow-lg shadow-primary/20"
              >
                Save Changes
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="w-full py-4 border border-red text-red font-syne font-bold rounded-14"
              >
                Discard & Leave
              </button>
              <button 
                onClick={() => setShowUnsavedModal(false)}
                className="w-full py-2 text-muted font-sans text-sm"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Confirmation Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-[340px] rounded-20 p-6 border border-border space-y-6">
            <div className="space-y-2">
              <h3 className="font-syne font-bold text-xl text-white">
                {isLive ? 'Pause your shop?' : 'Unpause your shop?'}
              </h3>
              <p className="font-sans text-muted">
                {isLive 
                  ? 'Your listings will be hidden until you unpause.' 
                  : 'Your shop will be visible to all buyers again.'
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowPauseModal(false)}
                className="flex-1 py-4 bg-elevated text-white font-syne font-bold rounded-14"
              >
                Cancel
              </button>
              <button 
                onClick={handlePauseToggle}
                className={`flex-1 py-4 font-syne font-bold rounded-14 ${isLive ? 'bg-amber text-black' : 'bg-green text-black'}`}
              >
                {isLive ? 'Pause' : 'Unpause'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Step 1 Modal */}
      {showDeleteStep1 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-[340px] rounded-20 p-6 border border-border space-y-6">
            <div className="space-y-2">
              <h3 className="font-syne font-bold text-xl text-white">Are you sure?</h3>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red shrink-0 mt-0.5" />
                  <p className="font-sans text-sm text-muted">All {productCount} products will be deleted permanently</p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red shrink-0 mt-0.5" />
                  <p className="font-sans text-sm text-muted">All sales history will be lost</p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red shrink-0 mt-0.5" />
                  <p className="font-sans text-sm text-muted">Your shop link thread.zw/{handle} will be released</p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red shrink-0 mt-0.5" />
                  <p className="font-sans text-sm text-muted">Your subscription will be cancelled immediately</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowDeleteStep1(false);
                  setShowDeleteStep2(true);
                }}
                className="w-full py-4 bg-red text-white font-syne font-bold rounded-14"
              >
                Yes, I understand -- delete my shop
              </button>
              <button 
                onClick={() => setShowDeleteStep1(false)}
                className="w-full py-4 bg-elevated text-white font-syne font-bold rounded-14"
              >
                Keep My Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Step 2 Modal */}
      {showDeleteStep2 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-[340px] rounded-20 p-6 border border-border space-y-6">
            <div className="space-y-2">
              <h3 className="font-syne font-bold text-xl text-white">Type DELETE to confirm</h3>
              <p className="font-sans text-muted text-sm">This action is permanent and cannot be reversed.</p>
            </div>
            
            <input 
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full bg-elevated border-2 border-primary rounded-12 p-4 text-white font-sans focus:outline-none text-center"
            />

            <div className="space-y-3">
              <button 
                onClick={handleDeleteShop}
                disabled={deleteConfirmText !== 'DELETE' || saving}
                className={`w-full py-4 font-syne font-bold rounded-14 transition-all ${
                  deleteConfirmText === 'DELETE' && !saving
                    ? 'bg-red text-white shadow-lg shadow-red/20' 
                    : 'bg-muted/20 text-muted cursor-not-allowed'
                }`}
              >
                {saving ? <Loader2 className="animate-spin mx-auto" /> : 'Delete My Shop Forever'}
              </button>
              <button 
                onClick={() => {
                  setShowDeleteStep2(false);
                  setDeleteConfirmText('');
                }}
                className="w-full py-2 text-muted font-sans text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area Bottom Sheet */}
      {showAreaSheet && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/60" 
            onClick={() => setShowAreaSheet(false)}
          />
          <div className="relative bg-card w-full max-w-[430px] rounded-t-32 p-6 animate-wipe overflow-hidden">
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            <h3 className="font-syne font-bold text-xl text-white mb-6">Select Area</h3>
            <div className="space-y-1 max-h-[400px] overflow-y-auto no-scrollbar">
              {AREAS.map((a, index) => (
                <button
                  key={`${a || 'area'}-${index}`}
                  onClick={() => {
                    setArea(a);
                    setShowAreaSheet(false);
                    markChanged();
                  }}
                  className={`w-full p-4 rounded-16 text-left font-sans transition-all flex items-center justify-between ${
                    area === a ? 'bg-primary/10 text-primary' : 'text-white hover:bg-elevated'
                  }`}
                >
                  {a}
                  {area === a && <Check size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating always-visible Save Changes Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-40 max-w-[430px] mx-auto flex flex-col gap-1.5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
          style={{
            background: saveSuccess
              ? '#10b981'
              : saving
                ? '#1f2937'
                : '#C6FF00',
            color: saveSuccess || saving
              ? '#ffffff'
              : '#000000',
            border: 'none',
            borderRadius: '14px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 800,
            fontFamily: 'sans-serif'
          }}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check size={16} />
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>

        {saveError && (
          <p className="text-[10px] text-red text-center font-mono uppercase tracking-tight">
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
};
