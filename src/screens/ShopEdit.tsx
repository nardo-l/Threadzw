import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
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
  Info
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Shimmer } from '../components/ui/Shimmer';
import { ScreenError } from '../components/ui/ScreenError';
import { FieldError } from '../components/ui/FieldError';

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

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchShopData();
  }, [user]);

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
      setTagline(data.tagline || '');
      setDescription(data.description || '');
      setCategories(data.categories || []);
      setSuburb(data.suburb || '');
      setCity(data.city || '');
      setGoogleMapsUrl(data.google_maps_url || '');
      setPickupAvailable(data.pickup_available || false);
      setPickupLabel(data.pickup_label || '');
      setArea(data.location || '');
      setLandmark(data.landmark || '');
      setDirections(data.directions || '');
      setOnlineOnly(data.online_only || false);
      setDeliveryInfo(data.delivery_info || '');
      setWhatsapp(data.whatsapp ? data.whatsapp.replace('+263', '') : '');
      setInstagram(data.instagram || '');
      if (data.trading_hours) setTradingHours(data.trading_hours);
      setBannerUrl(data.banner_url || null);
      setAvatarUrl(data.avatar_url || null);
      setIsLive(data.is_live);
      setProductCount(data.product_count || 0);

    } catch (err) {
      console.error('Fetch shop error:', err);
      setError('Could not load shop details');
    } finally {
      setLoading(false);
    }
  };

  const markChanged = () => setHasChanges(true);

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    markChanged();
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    markChanged();
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
    const errors: Record<string, string> = {};
    if (!shopName.trim()) errors.shopName = 'Shop name is required';
    if (!handle.trim()) errors.handle = 'Shop handle is required';
    if (categories.length === 0) errors.categories = 'Select at least one category';
    if (!onlineOnly) {
      if (!area) errors.area = 'Please select your area';
      if (!landmark.trim()) errors.landmark = 'Please add your landmark';
      if (!directions.trim()) errors.directions = 'Please add directions';
    }
    const cleanWhatsapp = whatsapp.replace(/\D/g, '');
    if (!whatsapp.trim() || cleanWhatsapp.length !== 9) {
      errors.whatsapp = 'Please enter a valid 9-digit WhatsApp number';
    }
    if (!handleAvailable) errors.handle = handleError || 'This handle is already taken';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    setValidationErrors({});

    try {
      let newBannerUrl = bannerUrl;
      let newAvatarUrl = avatarUrl;

      // Upload new banner if changed
      if (newBannerFile && user) {
        setUploadingBanner(true);
        const ext = newBannerFile.name.split('.').pop();
        const path = `${user.id}/banner_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('shop-banners')
          .upload(path, newBannerFile, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('shop-banners').getPublicUrl(path);
        newBannerUrl = publicUrl;
        setUploadingBanner(false);
      }

      // Upload new avatar if changed
      if (newAvatarFile && user) {
        setUploadingAvatar(true);
        const ext = newAvatarFile.name.split('.').pop();
        const path = `${user.id}/avatar_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('shop-avatars')
          .upload(path, newAvatarFile, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('shop-avatars').getPublicUrl(path);
        newAvatarUrl = publicUrl;
        setUploadingAvatar(false);
      }

      // Update shop in database
      const { error: updateError } = await supabase
        .from('shops')
        .update({
          name: shopName.trim(),
          handle: handle.trim().toLowerCase(),
          tagline: tagline.trim() || null,
          description: description.trim(),
          categories,
          suburb: suburb.trim() || null,
          city: city.trim() || null,
          google_maps_url: googleMapsUrl.trim() || null,
          pickup_available: pickupAvailable,
          pickup_label: pickupLabel.trim() || null,
          location: onlineOnly ? null : area,
          landmark: onlineOnly ? null : landmark.trim(),
          directions: onlineOnly ? null : directions.trim(),
          online_only: onlineOnly,
          delivery_info: onlineOnly ? deliveryInfo.trim() : null,
          whatsapp: `+263${cleanWhatsapp}`,
          instagram: instagram.trim() || null,
          instagram_url: instagram.trim() ? `https://instagram.com/${instagram.trim().replace(/^@/, '')}` : null,
          trading_hours: tradingHours,
          banner_url: newBannerUrl,
          logo_url: newAvatarUrl,
        })
        .eq('id', shopId);

      if (updateError) {
        if (updateError.code === '23505') {
          setHandleError('This handle was just taken by someone else. Try a different one.');
          setHandleAvailable(false);
          setSaving(false);
          return;
        }
        throw updateError;
      }

      setHasChanges(false);
      showToast('Shop updated successfully', 'success');
      setTimeout(() => navigate('/settings'), 800);

    } catch (err) {
      console.error('Save error:', err);
      showToast('Could not save changes -- please try again', 'error');
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

      setIsLive(!isLive);
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
    <div className="min-h-screen bg-background pb-20">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md z-50 flex items-center justify-between px-4 border-b border-border max-w-[430px] mx-auto">
        <button 
          onClick={handleBack}
          className="p-2 -ml-2 text-white hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        
        <h1 className="font-pacifico text-xl text-white">Edit Shop</h1>
        
        <button 
          onClick={handleSave}
          disabled={saving || (!hasChanges && handle === originalHandle)}
          className={`font-mono text-sm font-bold transition-colors ${
            saving || (!hasChanges && handle === originalHandle) 
              ? 'text-muted cursor-not-allowed' 
              : 'text-primary'
          }`}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
        </button>
      </div>

      <div className="pt-20 px-4 space-y-10">
        {/* Section 1: Shop Photos */}
        <section className="space-y-4">
          <h2 className="font-syne font-bold text-lg text-white">Shop Photos</h2>
          
          <div className="relative">
            {/* Banner Upload */}
            <div 
              onClick={() => bannerInputRef.current?.click()}
              className="w-full h-[140px] rounded-16 overflow-hidden bg-elevated border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer group relative flex flex-col items-center justify-center"
            >
              {(bannerPreview || bannerUrl) ? (
                <>
                  <img 
                    src={bannerPreview || bannerUrl || undefined} 
                    alt="Banner" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
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
                  <span className="font-mono text-xs text-muted">Add Shop Banner</span>
                  <span className="font-mono text-[8px] text-muted/60 mt-1 uppercase tracking-tighter">Appears at the top of your shop profile</span>
                </>
              )}
              
              {uploadingBanner && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <Loader2 size={24} className="text-primary animate-spin" />
                </div>
              )}
            </div>

            {/* Avatar Upload */}
            <div className="absolute -bottom-6 left-4">
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  avatarInputRef.current?.click();
                }}
                className="w-20 h-20 rounded-full bg-elevated border-2 border-primary overflow-hidden cursor-pointer group relative flex items-center justify-center shadow-xl"
              >
                {(avatarPreview || avatarUrl) ? (
                  <>
                    <img 
                      src={avatarPreview || avatarUrl || undefined} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
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
                onClick={() => avatarInputRef.current?.click()}
                className="mt-1 font-mono text-[10px] text-primary uppercase tracking-wider block w-full text-center"
              >
                Edit
              </button>
            </div>
          </div>
          
          <p className="font-mono text-[10px] text-muted pt-4">
            Changes will be saved when you tap Save
          </p>

          <input 
            type="file" 
            ref={bannerInputRef} 
            onChange={handleBannerSelect} 
            className="hidden" 
            accept="image/*" 
          />
          <input 
            type="file" 
            ref={avatarInputRef} 
            onChange={handleAvatarSelect} 
            className="hidden" 
            accept="image/*" 
          />
        </section>

        {/* Section 2: Shop Identity */}
        <section className="space-y-6 pt-6 border-t border-border">
          <h2 className="font-syne font-bold text-lg text-white">Shop Identity</h2>
          
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

          {/* Shop Handle */}
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

            {/* Live Preview Card */}
            <div className="bg-elevated/50 border border-primary/20 rounded-12 p-3 mt-2">
              <span className="font-mono text-[10px] text-muted uppercase tracking-tighter block mb-1">Your shop link:</span>
              <span className="font-mono text-sm text-primary font-bold">thread.zw/{handle || 'handle'}</span>
            </div>
            {validationErrors.handle && <FieldError message={validationErrors.handle} />}
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="font-mono text-xs text-muted uppercase tracking-wider">
                Tagline
              </label>
              <span className="font-mono text-[10px] text-muted">{tagline.length}/300</span>
            </div>
            <input 
              value={tagline}
              onChange={e => {
                if (e.target.value.length <= 300) {
                  setTagline(e.target.value);
                  markChanged();
                }
              }}
              placeholder="e.g. The underdog clothing brand"
              className="w-full bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-4 text-white font-sans focus:outline-none transition-all"
            />
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
        </section>

        {/* Section 3: Categories */}
        <section id="field-categories" className="space-y-4 pt-6 border-t border-border">
          <div className="space-y-1">
            <h2 className="font-syne font-bold text-lg text-white">Categories</h2>
            <p className="font-sans text-xs text-muted">Select everything that applies to your shop</p>
          </div>

          <div className={`flex flex-wrap gap-2 transition-all ${validationErrors.categories ? 'animate-shake' : ''}`}>
            {CATEGORY_OPTIONS.map(cat => {
              const isSelected = categories.includes(cat);
              return (
                <button
                  key={cat}
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
        </section>

        {/* Section 4: Location */}
        <section className="space-y-6 pt-6 border-t border-border">
          <h2 className="font-syne font-bold text-lg text-white">Location</h2>
          
          {/* Online Only Toggle */}
          <div className="flex items-center justify-between bg-elevated p-4 rounded-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe size={20} className="text-primary" />
              </div>
              <span className="font-sans text-white">My shop is online only</span>
            </div>
            <button 
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
        </section>

        {/* Section 4B: Pickup Settings */}
        <section className="space-y-6 pt-6 border-t border-border">
          <div className="flex justify-between items-center">
            <h2 className="font-syne font-bold text-lg text-white">Pickup Settings</h2>
          </div>

          <div className="flex items-center justify-between bg-elevated p-4 rounded-12">
            <div className="flex flex-col">
              <span className="font-sans text-white font-medium">In-person Pickup Available</span>
              <span className="font-mono text-[10px] text-muted uppercase mt-0.5">Allow buyers to pick up items directly</span>
            </div>
            <button 
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
        </section>

        {/* Section 5: Trading Hours */}
        <section className="space-y-6 pt-6 border-t border-border">
          <div className="flex justify-between items-center">
            <h2 className="font-syne font-bold text-lg text-white">Trading Hours</h2>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock size={20} className="text-primary" />
            </div>
          </div>

          <div className="space-y-4">
            {tradingHours.map((hour, index) => (
              <div key={hour.day} className="flex items-center justify-between">
                <span className="font-sans text-white w-12">{hour.day}</span>
                
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
            onClick={applyToAllWeekdays}
            className="font-mono text-xs text-primary uppercase tracking-wider hover:underline"
          >
            Apply to all weekdays
          </button>
        </section>

        {/* Section 6: Contact */}
        <section className="space-y-6 pt-6 border-t border-border">
          <h2 className="font-syne font-bold text-lg text-white">Contact</h2>
          
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

          {/* Instagram */}
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
        </section>

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
              {/* Pause Shop */}
              <div className={`bg-elevated rounded-16 p-5 border-l-4 ${isLive ? 'border-amber' : 'border-green'}`}>
                <h3 className={`font-syne font-bold text-lg mb-1 ${isLive ? 'text-amber' : 'text-green'}`}>
                  {isLive ? 'Pause Your Shop' : 'Shop is Paused'}
                </h3>
                <p className="font-sans text-sm text-muted mb-6">
                  {isLive 
                    ? 'Your products will be hidden from the feed while paused. All data is preserved.'
                    : 'Your shop is currently hidden. Unpause to make it visible to buyers again.'
                  }
                </p>
                <button 
                  onClick={() => setShowPauseModal(true)}
                  className={`px-6 py-2.5 rounded-pill font-syne font-bold text-sm border transition-all ${
                    isLive 
                      ? 'border-amber text-amber hover:bg-amber/10' 
                      : 'border-green text-green hover:bg-green/10'
                  }`}
                >
                  {isLive ? 'Pause Shop' : 'Unpause Shop'}
                </button>
              </div>

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
              {AREAS.map(a => (
                <button
                  key={a}
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
    </div>
  );
};
