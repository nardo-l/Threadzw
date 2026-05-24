import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { 
  ArrowLeft, 
  Camera, 
  X, 
  Plus, 
  Minus, 
  Loader2, 
  AlertTriangle, 
  Check, 
  Trash2, 
  Pause, 
  Play,
  ShoppingBag,
  Package,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { Shimmer } from '../components/ui/Shimmer';
import { ScreenError } from '../components/ui/ScreenError';

interface SizeVariant {
  size: string;
  quantity: number;
}

interface ColourVariant {
  name: string;
  hex: string;
}

interface PhotoSlot {
  url: string | null;
  file: File | null;
  preview: string | null;
  label: string;
}

export const EditProduct = () => {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const { deleteProduct, updateProduct } = useInventory();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showSoldOutModal, setShowSoldOutModal] = useState(false);

  // Original data for change detection
  const [originalData, setOriginalData] = useState<any>(null);

  // Form fields
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [sizeVariants, setSizeVariants] = useState<SizeVariant[]>([]);
  const [noSizes, setNoSizes] = useState(false);
  const [singleQuantity, setSingleQuantity] = useState(1);
  const [colours, setColours] = useState<ColourVariant[]>([]);
  const [status, setStatus] = useState('active');
  const [isFeatured, setIsFeatured] = useState(false);
  const [collection, setCollection] = useState('');

  // Images -- 6 slots
  const [photos, setPhotos] = useState<PhotoSlot[]>([
    { url: null, file: null, preview: null, label: 'Main Photo' },
    { url: null, file: null, preview: null, label: 'Back' },
    { url: null, file: null, preview: null, label: 'Side' },
    { url: null, file: null, preview: null, label: 'Detail' },
    { url: null, file: null, preview: null, label: 'On Foot' },
    { url: null, file: null, preview: null, label: 'Size Tag' },
  ]);
  const [uploadingSlots, setUploadingSlots] = useState([false, false, false, false, false, false]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchProduct();
    return () => {
      // Revoke object URLs on unmount
      photos.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); });
    };
  }, [productId]);

  const fetchProduct = async () => {
    if (!user || !productId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch user's shop first
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (shopError) throw shopError;
      if (!shopData) throw new Error('Shop not found');

      // 2. Query product by shop_id
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('shop_id', shopData.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      setOriginalData(data);

      // Pre-fill form fields
      setProductName(data.name || '');
      setCategory(data.category || '');
      setCondition(data.condition || '');
      setDescription(data.description || '');
      setPrice(data.price?.toString() || '');
      setOriginalPrice(data.original_price?.toString() || '');
      setStatus(data.status || 'active');

      // Pre-fill sizes
      if (data.sizes && data.sizes.length > 0) {
        const isNoSize = data.sizes.length === 1 && data.sizes[0].size === 'One Size';
        if (isNoSize) {
          setNoSizes(true);
          setSingleQuantity(data.sizes[0].quantity || 1);
        } else {
          setNoSizes(false);
          setSizeVariants(data.sizes);
        }
      }

      // Pre-fill colours
      setColours(data.colours || []);

      // Pre-fill collection & featured
      setIsFeatured(data.is_featured || false);
      setCollection(data.collection || '');

      // Pre-fill images
      if (data.images && data.images.length > 0) {
        setPhotos(prev => prev.map((slot, i) => ({
          ...slot,
          url: data.images[i] || null,
          file: null,
          preview: null,
        })));
      }

    } catch (err) {
      console.error('fetchProduct error:', err);
      setError('Could not load this product');
    }
    setLoading(false);
  };

  const markChanged = () => setHasChanges(true);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be under 10MB', 'error');
      return;
    }

    if (photos[slotIndex].preview) {
      URL.revokeObjectURL(photos[slotIndex].preview!);
    }

    const preview = URL.createObjectURL(file);

    setPhotos(prev => prev.map((slot, i) =>
      i === slotIndex
        ? { ...slot, file, preview, url: null }
        : slot
    ));

    markChanged();
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    // Cannot remove Slot 1 if it's the only filled slot
    const filledSlotsCount = photos.filter(p => p.url || p.preview).length;
    if (index === 0 && filledSlotsCount === 1) {
      showToast('Main photo is required', 'warning');
      return;
    }

    setPhotos(prev => prev.map((slot, i) => 
      i === index ? { ...slot, url: null, file: null, preview: null } : slot
    ));
    markChanged();
  };

  const addSizeVariant = () => {
    if (sizeVariants.length >= 20) return;
    setSizeVariants([...sizeVariants, { size: '', quantity: 1 }]);
    markChanged();
  };

  const updateSizeVariant = (index: number, updates: Partial<SizeVariant>) => {
    setSizeVariants(prev => prev.map((v, i) => i === index ? { ...v, ...updates } : v));
    markChanged();
  };

  const removeSizeVariant = (index: number) => {
    setSizeVariants(prev => prev.filter((_, i) => i !== index));
    markChanged();
  };

  const addColour = () => {
    setColours([...colours, { name: '', hex: '#C6FF00' }]);
    markChanged();
  };

  const updateColour = (index: number, updates: Partial<ColourVariant>) => {
    setColours(prev => prev.map((c, i) => i === index ? { ...c, ...updates } : c));
    markChanged();
  };

  const removeColour = (index: number) => {
    setColours(prev => prev.filter((_, i) => i !== index));
    markChanged();
  };

  const handleQuickPause = async () => {
    const newStatus = status === 'active' ? 'paused' : 'active';
    try {
      const success = await updateProduct(productId!, { status: newStatus as any });
      
      if (!success) throw new Error('Failed to update status');
      
      setStatus(newStatus);
      showToast(newStatus === 'paused' ? 'Listing paused' : 'Listing resumed', 'success');
    } catch (err) {
      showToast('Error updating status', 'error');
    }
  };

  const handleMarkSoldOut = async () => {
    const zeroSizes = sizeVariants.map(v => ({ ...v, quantity: 0 }));
    try {
      const success = await updateProduct(productId!, {
        sizes: zeroSizes,
        total_stock: 0,
        status: 'sold_out'
      });
      
      if (!success) throw new Error('Failed to mark sold out');

      setSizeVariants(zeroSizes);
      setSingleQuantity(0);
      setStatus('sold_out');
      showToast('All sizes marked as sold out', 'info');
      setShowSoldOutModal(false);
    } catch (err) {
      showToast('Error marking as sold out', 'error');
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    try {
      const success = await deleteProduct(productId);
      if (success) {
        showToast('Product deleted', 'info');
        navigate(-1);
      } else {
        showToast('Failed to delete product', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error deleting product', 'error');
    }
  };

  const buildChangeSummary = () => {
    const changes = [];
    if (productName !== originalData.name) changes.push('Name updated');
    if (parseFloat(price) !== originalData.price) {
      changes.push(`Price: $${originalData.price} -> $${price}`);
    }
    const newTotal = noSizes ? singleQuantity
      : sizeVariants.reduce((s, v) => s + v.quantity, 0);
    if (newTotal !== originalData.total_stock) {
      changes.push(`Stock: ${originalData.total_stock} -> ${newTotal} units`);
    }
    const newPhotos = photos.filter(p => p.file !== null).length;
    if (newPhotos > 0) changes.push(`${newPhotos} photo${newPhotos > 1 ? 's' : ''} replaced`);
    if (description !== originalData.description) changes.push('Description updated');
    if (category !== originalData.category) changes.push('Category changed');
    if (condition !== originalData.condition) changes.push('Condition changed');
    return changes;
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!productName.trim()) errors.productName = 'Product name is required';
    if (!category) errors.category = 'Please select a category';
    if (!condition) errors.condition = 'Please select a condition';
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      errors.price = 'Please enter a valid price';
    }
    if (!noSizes && sizeVariants.length === 0) {
      errors.sizes = 'Add at least one size variant';
    }
    if (originalPrice && parseFloat(originalPrice) <= parseFloat(price)) {
      errors.originalPrice = 'Compare price must be higher than listed price';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    
    // Safety timeout to prevent infinite loading state
    const safetyTimeout = setTimeout(() => {
      setSaving(false);
      showToast('Update is taking longer than expected. Please check your connection.', 'error');
    }, 15000); // 15s for product saves involving images

    try {
      // Show change summary
      const summary = buildChangeSummary();
      if (summary.length > 0) {
        showToast(summary.join(', '), 'info', undefined, 1500);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Upload only changed images
      const finalImageUrls = await Promise.all(
        photos.map(async (slot, i) => {
          if (slot.file) {
            const ext = slot.file.name.split('.').pop();
            const fileName = `${originalData.shop_id}/${productId}/${Date.now()}-slot${i}.${ext}`;

            setUploadingSlots(prev => prev.map((v, idx) => idx === i ? true : v));

            const { error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(fileName, slot.file, { upsert: true });

            setUploadingSlots(prev => prev.map((v, idx) => idx === i ? false : v));

            if (uploadError) {
              console.error(`Upload error slot ${i}:`, uploadError);
              showToast(`Photo ${i + 1} upload failed`, 'error');
              return originalData?.images?.[i] || null;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(fileName);

            return publicUrl;
          } else if (slot.url) {
            return slot.url;
          } else {
            return null;
          }
        })
      );

      const cleanImageUrls = finalImageUrls.filter(Boolean);

      const totalStock = noSizes
        ? singleQuantity
        : sizeVariants.reduce((sum, v) => sum + (v.quantity || 0), 0);

      const success = await updateProduct(productId!, {
        name: productName.trim(),
        category,
        condition,
        description: description.trim() || null,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        compare_price: originalPrice ? parseFloat(originalPrice) : null,
        images: cleanImageUrls as string[],
        sizes: noSizes
          ? [{ size: 'One Size', quantity: singleQuantity }]
          : sizeVariants.map(v => ({
              size: v.size,
              quantity: parseInt(v.quantity.toString()) || 0
            })),
        colours: colours.filter(c => c.name) as any,
        total_stock: totalStock,
        status: totalStock === 0 ? 'sold_out' : (status as any),
        is_featured: isFeatured,
        collection: collection.trim() || null,
      });

      if (!success) throw new Error('Failed to update product');

      setHasChanges(false);
      showToast('Product updated', 'success');
      navigate(-1);

    } catch (err) {
      console.error('Save error:', err);
      showToast('Could not save changes -- please try again', 'error');
    } finally {
      clearTimeout(safetyTimeout);
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowUnsavedModal(true);
    } else {
      navigate(-1);
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
          <div className="grid grid-cols-2 gap-2">
            <Shimmer className="col-span-2 h-[200px] rounded-16" />
            {[...Array(5)].map((_, i) => <Shimmer key={`photo-shimmer-${i}`} className="h-[120px] rounded-16" />)}
          </div>
          <Shimmer className="w-1/3 h-6 rounded-md" />
          <Shimmer className="w-full h-14 rounded-12" />
          <Shimmer className="w-1/3 h-6 rounded-md" />
          <Shimmer className="w-full h-14 rounded-12" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ScreenError 
        icon={<AlertTriangle size={32} />}
        heading="Could not load this product"
        body="It may have been deleted or there was a connection issue."
        onRetry={fetchProduct}
        secondaryLabel="Go Back"
        secondaryAction={() => navigate(-1)}
      />
    );
  }

  const categories = ['Sneakers', 'Clothing', 'Thrift', 'Electronics', 'Accessories', 'Jewellery', 'Other'];
  const conditions = ['New', 'Like New', 'Good', 'Fair'];
  const conditionNotes: Record<string, string> = {
    'New': 'Never worn, tags attached, original packaging',
    'Like New': 'Worn once or twice, no visible wear',
    'Good': 'Visible light wear, no damage',
    'Fair': 'Noticeable wear, priced accordingly'
  };

  const totalStock = noSizes ? singleQuantity : sizeVariants.reduce((s, v) => s + v.quantity, 0);
  const stockDecreased = originalData && totalStock < originalData.total_stock;

  return (
    <div className="min-h-screen bg-cream pb-32 font-sans selection:bg-pink/30">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-cream/80 backdrop-blur-xl z-50 flex items-center justify-between px-6 border-b-4 border-charcoal max-w-[430px] mx-auto">
        <button onClick={handleBack} className="p-3 -ml-3 text-charcoal hover:text-pink transition-all active:scale-90 bg-white border-2 border-charcoal rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)]">
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <h1 className="text-2xl font-display font-black text-charcoal italic uppercase tracking-tighter">Modify <span className="text-pink">Asset</span></h1>
        <button 
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`h-12 px-6 rounded-2xl font-display font-black text-xs uppercase italic tracking-widest transition-all ${
            saving || !hasChanges 
              ? 'bg-charcoal/5 border-2 border-charcoal/5 text-charcoal/20 cursor-not-allowed' 
              : 'bg-charcoal text-cream border-2 border-charcoal shadow-[4px_4px_0_#C6FF00] hover:translate-y-[-2px] active:translate-y-[2px] active:shadow-none'
          }`}
        >
          {saving ? <Loader2 size={18} className="animate-spin" strokeWidth={3} /> : 'Sync'}
        </button>
      </div>

      <div className="pt-32 px-6 space-y-12">
        {/* Section 1: Photos */}
        <section className="space-y-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-3">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Visual Protocol</h2>
               <div className="h-px flex-1 bg-charcoal/10" />
            </div>
            <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Asset Cluster</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Slot 1: Main Photo */}
            <div 
              onClick={() => fileInputRefs.current[0]?.click()}
              className={`col-span-2 h-[280px] rounded-[48px] overflow-hidden bg-white border-4 border-dashed transition-all cursor-pointer group relative flex flex-col items-center justify-center ${
                photos[0].url || photos[0].preview ? 'border-charcoal border-solid' : 'border-charcoal/10 hover:border-pink/40'
              }`}
            >
              {(photos[0].url || photos[0].preview) ? (
                <>
                  <img 
                    src={photos[0].preview || photos[0].url || undefined} 
                    alt="Main" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-charcoal/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="w-16 h-16 bg-white border-4 border-charcoal rounded-full flex items-center justify-center text-charcoal shadow-[6px_6px_0_rgba(0,0,0,1)]">
                       <Camera size={28} strokeWidth={4} />
                    </div>
                    <span className="font-display font-black text-xs text-white uppercase tracking-[0.2em] italic mt-4">Replace Primary</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-cream border-4 border-charcoal border-dashed rounded-full flex items-center justify-center text-charcoal/20">
                    <Camera size={28} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-black text-charcoal/20 uppercase tracking-[0.3em] italic">Initial Asset Required</span>
                </div>
              )}
              <div className="absolute top-6 left-6 w-10 h-10 bg-white border-4 border-charcoal rounded-2xl flex items-center justify-center font-display font-black italic shadow-[4px_4px_0_rgba(0,0,0,1)]">01</div>
              {uploadingSlots[0] && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-md">
                   <div className="w-12 h-12 border-4 border-charcoal border-t-pink rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Slots 2-6 */}
            {photos.slice(1).map((slot, i) => {
              const idx = i + 1;
              const hasImage = slot.url || slot.preview;
              return (
                <div 
                  key={`photo-slot-edit-${idx}`}
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  className={`h-[140px] rounded-[32px] overflow-hidden bg-white border-4 border-dashed transition-all cursor-pointer group relative flex flex-col items-center justify-center ${
                    hasImage ? 'border-charcoal border-solid shadow-[6px_6px_0_rgba(0,0,0,0.03)]' : 'border-charcoal/10 hover:border-pink/20 hover:bg-pink/5'
                  }`}
                >
                  {hasImage ? (
                    <>
                      <img 
                        src={slot.preview || slot.url || undefined} 
                        alt={slot.label} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-charcoal/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                        <Camera size={20} className="text-white" strokeWidth={4} />
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(idx);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-[12px] bg-red-500 border-2 border-charcoal flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)]"
                      >
                        <X size={16} strokeWidth={4} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Camera size={24} className="text-charcoal/10" strokeWidth={3} />
                      <span className="text-[8px] font-black text-charcoal/10 uppercase tracking-widest mt-2 px-4 text-center">{slot.label}</span>
                    </>
                  )}
                  <div className="absolute top-3 left-3 w-7 h-7 bg-white border-2 border-charcoal rounded-xl flex items-center justify-center text-[10px] font-display font-black italic shadow-[3px_3px_0_rgba(0,0,0,1)]">0{idx + 1}</div>
                  {uploadingSlots[idx] && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-sm">
                       <Loader2 size={24} className="text-pink animate-spin" strokeWidth={4} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center px-4">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-lime animate-pulse" />
                <span className="text-[9px] font-black text-charcoal/40 uppercase tracking-[0.3em] italic">
                   Buffer Registry: {photos.filter(p => p.url || p.preview).length} / 6
                </span>
             </div>
             {photos.some(p => !p.url && !p.preview) && (
               <span className="text-[9px] font-black text-pink uppercase tracking-widest italic animate-pulse">
                 Synchronizing Legacy Assets
               </span>
             )}
          </div>

          {photos.map((_, i) => (
            <input
              key={`hidden-input-${i}`}
              type="file"
              accept="image/*"
              ref={el => { fileInputRefs.current[i] = el; }}
              onChange={e => handlePhotoSelect(e, i)}
              className="hidden"
            />
          ))}
        </section>

        {/* Quick Actions */}
        <section className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-2">
          <button 
            onClick={handleQuickPause}
            className={`flex items-center gap-3 px-8 py-4 rounded-[24px] font-display font-black text-[10px] uppercase tracking-widest whitespace-nowrap border-4 transition-all hover:translate-y-[-2px] active:translate-y-[2px] italic ${
              status === 'active' 
                ? 'bg-amber-50 border-charcoal text-charcoal shadow-[6px_6px_0_rgba(245,158,11,1)]' 
                : 'bg-lime border-charcoal text-charcoal shadow-[6px_6px_0_rgba(0,0,0,1)]'
            }`}
          >
            {status === 'active' ? <Pause size={18} strokeWidth={4} /> : <Play size={18} strokeWidth={4} />}
            {status === 'active' ? 'Archive Signal' : 'Restore Signal'}
          </button>
          
          <button 
            onClick={() => setShowSoldOutModal(true)}
            disabled={totalStock === 0}
            className={`flex items-center gap-3 px-8 py-4 rounded-[24px] font-display font-black text-[10px] uppercase tracking-widest whitespace-nowrap border-4 transition-all hover:translate-y-[-2px] active:translate-y-[2px] italic ${
              totalStock === 0 
                ? 'bg-charcoal/5 border-charcoal/5 text-charcoal/20 cursor-not-allowed' 
                : 'bg-white border-charcoal text-charcoal shadow-[6px_6px_0_rgba(0,0,0,1)]'
            }`}
          >
            <ShoppingBag size={18} strokeWidth={4} />
            Liquidate Stock
          </button>

          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-3 px-8 py-4 rounded-[24px] font-display font-black text-[10px] uppercase tracking-widest whitespace-nowrap border-4 border-charcoal bg-red-500 text-white italic hover:translate-y-[-2px] active:translate-y-[2px] shadow-[6px_6px_0_rgba(0,0,0,1)]"
          >
            <Trash2 size={18} strokeWidth={4} />
            Purge Unit
          </button>
        </section>

        {/* Section 2: Product Details */}
        <section className="flex flex-col gap-10 mt-16 relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-3">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Identity Header</h2>
               <div className="h-px flex-1 bg-charcoal/10" />
            </div>
            <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Product Metadata</h3>
          </div>
          
          {/* Product Name */}
          <div id="field-productName" className="flex flex-col gap-4">
            <div className="flex justify-between items-end px-4">
              <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic leading-none">Nomenclature</label>
              <span className="text-[10px] font-black text-charcoal/20 italic">{productName.length} / 80</span>
            </div>
            <div className={`p-8 bg-white rounded-[40px] border-4 transition-all duration-500 ${validationErrors.productName ? 'border-pink bg-pink/5' : 'border-charcoal focus-within:shadow-[12px_12px_0_#C6FF00]'}`}>
              <input 
                value={productName}
                onChange={e => {
                  if (e.target.value.length <= 80) {
                    setProductName(e.target.value);
                    markChanged();
                  }
                }}
                placeholder="Product Descriptor (e.g. Vintage Nike)"
                className="w-full bg-transparent text-3xl font-display font-black text-charcoal uppercase tracking-tighter placeholder:text-charcoal/10 focus:outline-none italic"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div id="field-category" className="flex flex-col gap-5">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic leading-none px-4">Registry Segment</label>
            <div className="flex flex-wrap gap-3 px-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    markChanged();
                  }}
                  className={`px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all border-4 italic ${
                    category === cat 
                      ? 'bg-charcoal text-cream border-charcoal shadow-[6px_6px_0_#C6FF00]' 
                      : 'bg-white border-charcoal/5 text-charcoal/40 hover:border-charcoal/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Collection Drop */}
          <div className="flex flex-col gap-5">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic leading-none px-4">Collection Drop</label>
            <div className="relative group px-2 font-sans">
              <input 
                type="text"
                value={collection}
                onChange={(e) => {
                  setCollection(e.target.value.slice(0, 50));
                  markChanged();
                }}
                placeholder="e.g. Corteiz RTW, Essentials 2026..."
                className="w-full bg-white border-2 border-charcoal/5 rounded-[32px] px-8 py-6 text-xl font-display font-black italic tracking-tight text-charcoal placeholder:text-charcoal/10 focus:outline-none transition-all duration-500 focus:border-pink/40 focus:ring-8 focus:ring-pink/5 font-sans"
              />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-end">
                <span className="text-[10px] font-black text-charcoal/30 italic leading-none">{collection.length}/50</span>
              </div>
            </div>
          </div>

          {/* Condition Protocol */}
          <div id="field-condition" className="flex flex-col gap-5">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic leading-none px-4">Physical Integrity</label>
            <div className="grid grid-cols-2 gap-3 px-2">
              {conditions.map(cond => (
                <button
                  key={cond}
                  onClick={() => {
                    setCondition(cond);
                    markChanged();
                  }}
                  className={`py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all border-4 italic ${
                    condition === cond 
                      ? 'bg-charcoal text-cream border-charcoal shadow-[6px_6px_0_#F4A6C1]' 
                      : 'bg-white border-charcoal/5 text-charcoal/40 hover:border-charcoal/20'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
            {condition && (
               <div className="mx-4 p-5 bg-cream-dark/50 border-2 border-charcoal/5 rounded-[24px] flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-pink" />
                  <p className="text-[11px] font-black text-charcoal/40 uppercase italic leading-tight tracking-tight">
                    {conditionNotes[condition]}
                  </p>
               </div>
            )}
          </div>

          {/* Description Terminal */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end px-4">
               <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic leading-none">Manifesto Content</label>
               <span className="text-[10px] font-black text-charcoal/20 italic">{description.length} / 400</span>
            </div>
            <div className="p-8 bg-white rounded-[40px] border-4 border-charcoal focus-within:shadow-[12px_12px_0_rgba(0,0,0,0.05)] transition-all">
              <textarea 
                value={description}
                onChange={e => {
                  if (e.target.value.length <= 400) {
                    setDescription(e.target.value);
                    markChanged();
                  }
                }}
                rows={4}
                placeholder="Declare product specifications..."
                className="w-full bg-transparent text-xl font-display font-black text-charcoal uppercase tracking-tighter placeholder:text-charcoal/10 focus:outline-none resize-none italic leading-tight"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Pricing */}
        <section className="flex flex-col gap-10 mt-20 relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-3">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Financial Layer</h2>
               <div className="h-px flex-1 bg-charcoal/10" />
            </div>
            <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Valuation Matrix</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
            {/* Price Node */}
            <div id="field-price" className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic leading-none px-4">Registry Price (USD)</label>
              <div className={`flex items-center bg-white border-4 rounded-[40px] px-8 py-8 transition-all duration-500 ${validationErrors.price ? 'border-pink' : 'border-charcoal focus-within:shadow-[12px_12px_0_#C6FF00]'}`}>
                <span className="text-4xl font-display font-black text-charcoal/20 italic mr-4">$</span>
                <input 
                  type="number"
                  value={price}
                  onChange={e => {
                    setPrice(e.target.value);
                    markChanged();
                  }}
                  placeholder="0.00"
                  className="w-full bg-transparent text-5xl font-display font-black text-charcoal uppercase tracking-tighter placeholder:text-charcoal/5 focus:outline-none italic"
                />
              </div>
            </div>

            {/* Compare Price Node */}
            <div id="field-originalPrice" className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic leading-none px-4">Benchmark Value (MSRP)</label>
              <div className={`flex items-center bg-white border-4 rounded-[40px] px-8 py-8 transition-all duration-500 ${validationErrors.originalPrice ? 'border-pink' : 'border-charcoal focus-within:shadow-[12px_12px_0_rgba(0,0,0,0.05)]'}`}>
                <span className="text-4xl font-display font-black text-charcoal/20 italic mr-4">$</span>
                <input 
                  type="number"
                  value={originalPrice}
                  onChange={e => {
                    setOriginalPrice(e.target.value);
                    markChanged();
                  }}
                  placeholder="0.00"
                  className="w-full bg-transparent text-5xl font-display font-black text-charcoal uppercase tracking-tighter placeholder:text-charcoal/5 focus:outline-none italic"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-4">
            {price && (
              <div className="flex items-center gap-6 animate-wipe">
                <span className="text-7xl font-display font-black text-charcoal italic tracking-tighter leading-none">USD {price}</span>
                {originalPrice && parseFloat(originalPrice) > parseFloat(price) && (
                  <div className="oval-sticker !bg-pink !text-white !text-xl animate-bounce">
                    -{Math.round((1 - parseFloat(price) / parseFloat(originalPrice)) * 100)}% RELIEF
                  </div>
                )}
              </div>
            )}
            <p className="text-[11px] font-black text-charcoal/30 uppercase tracking-[0.2em] italic leading-tight">
              {originalPrice && parseFloat(originalPrice) > parseFloat(price) 
                ? 'Market benchmark comparison enabled for visual leverage.'
                : 'No price reduction detected in current valuation.'
              }
            </p>
          </div>
        </section>

        {/* Section 4: Sizes & Stock */}
        <section id="error-sizes" className="flex flex-col gap-10 mt-20 relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-3">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Logistics</h2>
               <div className="h-px flex-1 bg-charcoal/10" />
            </div>
            <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Availability Index</h3>
          </div>

          <div className="flex items-center justify-between p-10 bg-white rounded-[48px] border-4 border-charcoal shadow-[12px_12px_0_rgba(0,0,0,0.05)] transition-all duration-500 group">
            <div className="flex flex-col gap-2">
              <span className="text-xl font-display font-black text-charcoal uppercase tracking-tighter italic leading-none">Universal Scale</span>
              <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.4em] italic mb-1">Accessories / One-Size Units</span>
            </div>
            <button 
              onClick={() => {
                setNoSizes(!noSizes);
                markChanged();
              }}
              className={`w-20 h-10 rounded-full relative transition-all duration-500 overflow-hidden border-4 ${noSizes ? 'bg-lime border-charcoal' : 'bg-cream-dark border-charcoal/10'}`}
            >
              <motion.div 
                animate={{ x: noSizes ? 40 : 4 }}
                className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-charcoal rounded-full shadow-lg z-10"
              />
            </button>
          </div>

          {noSizes ? (
            <div className="flex flex-col gap-6 p-10 bg-white rounded-[48px] border-2 border-charcoal/5 shadow-[20px_20px_0_rgba(0,0,0,0.02)]">
              <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic leading-none text-center">Master Stock Units</label>
              <div className="flex items-center gap-10">
                <button 
                  onClick={() => {
                    setSingleQuantity(Math.max(0, singleQuantity - 1));
                    markChanged();
                  }}
                  className="w-20 h-20 rounded-[28px] bg-white border-4 border-charcoal flex items-center justify-center text-charcoal active:scale-90 transition-all hover:bg-cream-dark shadow-[6px_6px_0_rgba(0,0,0,1)]"
                >
                  <Minus size={32} strokeWidth={4} />
                </button>
                <div className="flex-1 flex flex-col items-center">
                   <span className="text-7xl font-display font-black text-charcoal italic tracking-tighter leading-none">{singleQuantity}</span>
                   <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest mt-4 italic">Operational Range</span>
                </div>
                <button 
                  onClick={() => {
                    setSingleQuantity(singleQuantity + 1);
                    markChanged();
                  }}
                  className="w-20 h-20 rounded-[28px] bg-charcoal flex items-center justify-center text-lime shadow-[6px_6px_0_#C6FF00] active:scale-90 transition-all"
                >
                  <Plus size={32} strokeWidth={4} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <AnimatePresence>
                {sizeVariants.map((v, idx) => (
                  <motion.div 
                    key={`size-variant-edit-${idx}`}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-6 bg-white p-6 rounded-[32px] border-4 border-charcoal shadow-[10px_10px_0_rgba(0,0,0,0.03)] group"
                  >
                    <div className="flex-1 relative pl-4">
                      <input 
                        type="text"
                        value={v.size}
                        onChange={(e) => updateSizeVariant(idx, { size: e.target.value })}
                        placeholder="Label (e.g. UK9)"
                        className="w-full bg-transparent text-xl font-display font-black text-charcoal uppercase tracking-tighter placeholder:text-charcoal/10 focus:outline-none italic"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1 min-w-[60px]">
                       <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${
                        v.quantity > 3 ? 'text-lime' : v.quantity > 0 ? 'text-amber-500' : 'text-pink'
                       }`}>
                         {v.quantity > 3 ? 'In Stock' : v.quantity > 0 ? 'Low' : 'Depleted'}
                       </span>
                    </div>
                    <div className="flex items-center gap-2 bg-cream-dark rounded-full border-2 border-charcoal/5 p-1.5">
                      <button 
                        onClick={() => updateSizeVariant(idx, { quantity: Math.max(0, v.quantity - 1) })}
                        className="w-12 h-12 rounded-full bg-white border-2 border-charcoal flex items-center justify-center text-charcoal active:scale-90 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)]"
                      >
                        <Minus size={18} strokeWidth={4} />
                      </button>
                      <span className="w-12 text-center font-display font-black text-charcoal text-xl italic">{v.quantity}</span>
                      <button 
                        onClick={() => updateSizeVariant(idx, { quantity: v.quantity + 1 })}
                        className="w-12 h-12 rounded-full bg-charcoal text-cream flex items-center justify-center active:scale-90 transition-all shadow-[4px_4px_0_#C6FF00]"
                      >
                        <Plus size={18} strokeWidth={4} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeSizeVariant(idx)} 
                      className="w-14 h-14 flex items-center justify-center text-charcoal/20 hover:text-pink transition-all active:scale-90"
                    >
                      <Trash2 size={24} strokeWidth={3} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <button 
                onClick={addSizeVariant}
                className="w-full h-20 rounded-[32px] bg-white border-4 border-dashed border-charcoal/10 flex items-center justify-center gap-5 text-charcoal/40 hover:bg-pink/5 hover:border-pink/40 transition-all active:scale-[0.98] group mt-4"
              >
                <Plus size={28} strokeWidth={4} className="group-hover:rotate-90 transition-transform duration-700 text-pink" />
                <span className="text-[12px] font-black uppercase tracking-[0.3em] italic">Register Size Unit</span>
              </button>

              {/* Suggestions */}
              {(category === 'Sneakers' || category === 'Clothing') && (
                <div className="flex flex-col gap-5 mt-6 px-4">
                  <div className="flex items-center gap-3">
                     <span className="text-[9px] font-black text-charcoal/20 uppercase tracking-[0.3em] italic leading-none">Protocol Shortcuts</span>
                     <div className="h-px flex-1 bg-charcoal/5" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(category === 'Sneakers' ? ['UK6', 'UK7', 'UK8', 'UK9', 'UK10', 'UK11', 'UK12'] : ['XS', 'S', 'M', 'L', 'XL', 'XXL']).map(s => (
                      <button
                        key={s}
                        onClick={() => {
                          if (!sizeVariants.some(v => v.size === s)) {
                            setSizeVariants([...sizeVariants, { size: s, quantity: 1 }]);
                            markChanged();
                          }
                        }}
                        className="px-6 py-3 bg-white border-2 border-charcoal/10 rounded-2xl text-[10px] font-black text-charcoal/40 hover:text-charcoal hover:bg-cream-dark hover:border-charcoal/40 transition-all italic tracking-widest uppercase shadow-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-6">
            <div className={`p-8 rounded-[48px] border-4 transition-all duration-700 ${totalStock > 0 ? 'bg-charcoal text-lime border-charcoal shadow-[12px_12px_0_#C6FF00]' : 'bg-pink/10 text-pink border-pink shadow-[12px_12px_0_rgba(0,0,0,1)]'}`}>
               <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center border-4 ${totalStock > 0 ? 'bg-lime border-lime text-charcoal' : 'bg-pink text-white border-pink'}`}>
                    <Package size={24} strokeWidth={4} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] italic mb-1 opacity-60">Inventory Status</span>
                    <span className="text-2xl font-display font-black italic tracking-tighter uppercase leading-none">Total Units: {totalStock}</span>
                  </div>
               </div>
            </div>

            {stockDecreased && (
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="p-8 bg-pink/5 border-4 border-pink rounded-[40px] flex items-start gap-6"
               >
                  <AlertTriangle size={32} className="text-pink shrink-0" strokeWidth={3} />
                  <div className="flex flex-col gap-2">
                     <p className="text-[10px] font-black text-pink uppercase tracking-[0.3em] italic">Stock Reduction Protocol</p>
                     <p className="text-[14px] font-black text-charcoal leading-tight italic uppercase tracking-tighter">
                        Current: {originalData.total_stock} units → New: {totalStock} units. Ensure physical reconciliation.
                     </p>
                  </div>
               </motion.div>
            )}
          </div>
        </section>

        {/* Section 5: Colours */}
        <section className="flex flex-col gap-10 mt-20 relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-3">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Spectrum Data</h2>
               <div className="h-px flex-1 bg-charcoal/10" />
            </div>
            <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Color Mapping</h3>
          </div>

          <div className="flex flex-col gap-6">
            <AnimatePresence>
              {colours.map((c, idx) => (
                <motion.div 
                  key={`colour-mapping-edit-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-6 bg-white p-6 rounded-[32px] border-4 border-charcoal shadow-[10px_10px_0_rgba(0,0,0,0.03)] group"
                >
                  <div className="flex-1 relative pl-4">
                    <input 
                      type="text"
                      value={c.name}
                      onChange={(e) => updateColour(idx, { name: e.target.value })}
                      placeholder="Declaration (e.g. Cobalt)"
                      className="w-full bg-transparent text-xl font-display font-black text-charcoal uppercase tracking-tighter placeholder:text-charcoal/10 focus:outline-none italic"
                    />
                  </div>
                  <div className="relative w-16 h-16 rounded-[20px] overflow-hidden border-4 border-charcoal hover:scale-105 transition-all cursor-pointer shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
                    <input 
                      type="color"
                      value={c.hex}
                      onChange={(e) => updateColour(idx, { hex: e.target.value })}
                      className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    />
                  </div>
                  <button onClick={() => removeColour(idx)} className="w-14 h-14 flex items-center justify-center text-charcoal/20 hover:text-pink transition-all active:scale-90">
                    <X size={24} strokeWidth={3} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <button 
              onClick={addColour}
              className="w-full h-16 rounded-[32px] bg-white border-4 border-dashed border-charcoal/10 flex items-center justify-center gap-4 text-charcoal/40 hover:bg-lime/5 hover:border-lime/40 transition-all active:scale-[0.98] mt-2 group"
            >
              <Plus size={24} strokeWidth={4} className="group-hover:rotate-90 transition-transform duration-700 text-lime" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Add Component Color</span>
            </button>

            <div className="flex flex-wrap gap-2 pt-4 px-4">
              {['White', 'Black', 'Grey', 'Brown', 'Navy', 'Red', 'Green', 'Multi'].map(c => (
                <button 
                  key={c}
                  onClick={() => {
                    if (!colours.some(col => col.name === c)) {
                      const hexMap: Record<string, string> = {
                        'White': '#ffffff', 'Black': '#000000', 'Grey': '#888888', 'Brown': '#8b4513',
                        'Navy': '#000080', 'Red': '#ff0000', 'Green': '#00ff00', 'Multi': '#C6FF00'
                      };
                      setColours([...colours, { name: c, hex: hexMap[c] || '#C6FF00' }]);
                      markChanged();
                    }
                  }}
                  className="px-5 py-2 bg-white border-2 border-charcoal/5 rounded-2xl text-[9px] font-black text-charcoal/30 hover:text-charcoal hover:border-charcoal/40 transition-all italic uppercase tracking-widest"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Listing Status */}
        <section className="flex flex-col gap-10 mt-20 relative z-10 pb-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-3">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Visibility Layer</h2>
               <div className="h-px flex-1 bg-charcoal/10" />
            </div>
            <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Status Protocol</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
            {[
              { id: 'active', label: 'Authorized', color: 'bg-lime', icon: <Check size={20} strokeWidth={4} />, hex: '#C6FF00', note: 'Unit is live in the global marketplace' },
              { id: 'paused', label: 'Legacy', color: 'bg-amber-500', icon: <Pause size={20} strokeWidth={4} />, hex: '#F59E0B', note: 'Unit is archived but preserved in the database.' },
              { id: 'sold_out', label: 'Liquidated', color: 'bg-pink', icon: <ShoppingBag size={20} strokeWidth={4} />, hex: '#F4A6C1', note: 'Stock level at zero. Displayed as legacy interest unit.' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setStatus(s.id);
                  markChanged();
                }}
                className={`group flex flex-col items-center justify-center p-10 rounded-[48px] border-4 transition-all duration-700 relative overflow-hidden ${
                  status === s.id 
                    ? 'bg-charcoal border-charcoal shadow-[12px_12px_0_rgba(var(--status-color),0.2)]'
                    : 'bg-white border-charcoal/5 grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
                }`}
                style={{ '--status-color': s.id === 'active' ? '198,255,0' : s.id === 'paused' ? '245,158,11' : '244,166,193' } as any}
              >
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center mb-6 border-4 transition-all duration-700 ${
                  status === s.id ? `${s.color} border-white/10 text-charcoal shadow-[0_0_20px_rgba(var(--status-color),0.5)] scale-110` : 'bg-charcoal/5 border-charcoal text-charcoal/10'
                }`}>
                  {s.icon}
                </div>
                <span className={`text-xl font-display font-black uppercase italic tracking-tighter transition-colors ${status === s.id ? 'text-white' : 'text-charcoal'}`}>{s.label}</span>
                {status === s.id && (
                   <div className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest italic text-center leading-none px-2">{s.note}</p>
                   </div>
                )}
              </button>
            ))}
          </div>

          <div 
            className={`p-10 rounded-[48px] border-4 transition-all duration-700 relative overflow-hidden group cursor-pointer mt-10 ${isFeatured ? 'bg-charcoal border-lime shadow-[0_20px_40px_rgba(198,255,0,0.15)]' : 'bg-white border-charcoal/5 shadow-[12px_12px_0_rgba(0,0,0,0.02)]'}`} 
            onClick={() => {
              setIsFeatured(!isFeatured);
              markChanged();
            }}
          >
            {isFeatured && (
               <div className="absolute inset-0 bg-gradient-to-br from-lime/5 via-transparent to-transparent opacity-50" />
            )}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col gap-4 max-w-[75%]">
                <div className="flex items-center gap-4">
                  <h4 className={`text-2xl font-display font-black uppercase italic tracking-tighter transition-colors ${isFeatured ? 'text-lime' : 'text-charcoal'}`}>Priority Broadcaster</h4>
                   <div className={`w-3 h-3 rounded-full ${isFeatured ? 'bg-lime animate-pulse shadow-[0_0_12px_#C6FF00]' : 'bg-charcoal/5'}`} />
                </div>
                <p className={`text-[12px] font-black uppercase italic leading-tight tracking-[0.1em] ${isFeatured ? 'text-white/40' : 'text-charcoal/30'}`}>
                  Amplify acquisition frequency. Elevate listing to the primary discovery layer for global terminal visibility.
                </p>
              </div>
              <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center border-4 transition-all duration-700 ${isFeatured ? 'bg-lime border-lime text-charcoal shadow-2xl scale-110' : 'bg-white border-charcoal/10 text-charcoal/10'}`}>
                 <Zap size={32} strokeWidth={4} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Action Area */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-cream/90 backdrop-blur-xl border-t-4 border-charcoal z-40 max-w-[430px] mx-auto">
        <AnimatePresence mode="wait">
          {hasChanges ? (
            <motion.div 
              key="changed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-4"
            >
              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full h-20 bg-charcoal text-cream font-display font-black text-xl italic rounded-[28px] shadow-[8px_8px_0_#C6FF00] flex items-center justify-center gap-4 uppercase tracking-[0.2em] transition-all hover:translate-y-[-4px] hover:shadow-[12px_12px_0_#C6FF00] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={28} className="animate-spin" strokeWidth={4} />
                    Syncing...
                  </>
                ) : 'Commit Updates'}
              </button>
              <button 
                onClick={() => setShowDiscardModal(true)}
                className="w-full py-4 text-charcoal/40 font-black uppercase tracking-[0.4em] text-[10px] italic hover:text-pink transition-colors"
               >
                Erase Buffer
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 bg-charcoal/5 border-4 border-dashed border-charcoal/10 rounded-[40px] flex items-center justify-center italic"
             >
              <span className="text-[12px] font-black text-charcoal/20 uppercase tracking-[0.4em]">Terminal Primed</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Unsaved Changes Modal */}
        {showUnsavedModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-charcoal/90 backdrop-blur-md"
              onClick={() => setShowUnsavedModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-[380px] rounded-[48px] p-10 border-4 border-charcoal shadow-[16px_16px_0_rgba(0,0,0,1)] relative z-10 flex flex-col gap-8"
            >
              <div className="flex flex-col gap-4">
                <div className="w-16 h-16 bg-pink/10 border-4 border-pink rounded-[24px] flex items-center justify-center text-pink">
                   <AlertTriangle size={32} strokeWidth={4} />
                </div>
                <div className="flex flex-col">
                   <h3 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-[0.8] mb-2">Unsaved Signal</h3>
                   <p className="text-[11px] font-black text-charcoal/40 uppercase italic tracking-widest leading-relaxed">
                      Terminal state will be lost if connection is severed. Register changes now?
                   </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleSave}
                  className="w-full h-16 bg-charcoal text-cream font-display font-black rounded-[24px] uppercase italic tracking-[0.1em] shadow-[6px_6px_0_#C6FF00] active:scale-95 transition-all text-sm"
                >
                  Confirm Registry
                </button>
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full h-16 bg-white border-4 border-pink text-pink font-display font-black rounded-[24px] uppercase italic tracking-[0.1em] shadow-[6px_6px_0_rgba(244,166,193,0.3)] active:scale-95 transition-all text-sm"
                >
                  Sever Link
                </button>
                <button 
                  onClick={() => setShowUnsavedModal(false)}
                  className="w-full py-2 text-charcoal/20 font-black uppercase text-[10px] tracking-widest italic"
                >
                  Return to Matrix
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Discard Changes Modal */}
        {showDiscardModal && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm"
              onClick={() => setShowDiscardModal(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative bg-white w-full max-w-[430px] rounded-t-[54px] p-12 border-t-8 border-charcoal shadow-[0_-20px_60px_rgba(0,0,0,0.4)]"
            >
              <div className="w-20 h-2 bg-charcoal/10 rounded-full mx-auto mb-10" />
              <div className="flex flex-col gap-6 mb-12">
                <div className="flex items-center gap-4">
                   <div className="w-1.5 h-10 bg-pink rounded-full" />
                   <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-[0.8]">Reset Buffer?</h3>
                </div>
                <p className="text-[12px] font-black text-charcoal/30 uppercase italic tracking-[0.2em] leading-relaxed">
                   Purging temporary cache. This action is irreversible within the current session.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    fetchProduct();
                    setHasChanges(false);
                    setShowDiscardModal(false);
                  }}
                  className="w-full h-20 bg-pink text-white font-display font-black text-xl italic rounded-[28px] uppercase tracking-[0.2em] shadow-[8px_8px_0_#000000] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  Flush Cache
                </button>
                <button 
                  onClick={() => setShowDiscardModal(false)}
                  className="w-full h-20 bg-cream text-charcoal border-4 border-charcoal font-display font-black text-xl italic rounded-[28px] uppercase tracking-[0.2em] shadow-[8px_8px_0_rgba(0,0,0,0.05)] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  Abort Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-charcoal/95 backdrop-blur-xl"
              onClick={() => setShowDeleteModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-[380px] rounded-[54px] p-12 border-8 border-charcoal shadow-[24px_24px_0_#EF4444] relative z-10 flex flex-col gap-10 text-center"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-red-500 border-4 border-charcoal rounded-full flex items-center justify-center text-white animate-pulse shadow-[8px_8px_0_rgba(0,0,0,1)]">
                   <Trash2 size={42} strokeWidth={4} />
                </div>
                <div className="flex flex-col gap-2">
                   <h3 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-[0.8]">Terminate Unit?</h3>
                   <p className="text-[10px] font-black text-charcoal/30 uppercase italic tracking-widest px-4">
                      Permanent removal from global network index.
                   </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setShowDeleteConfirmModal(true);
                  }}
                  className="w-full h-20 bg-charcoal text-white font-display font-black rounded-[28px] uppercase italic tracking-[0.1em] shadow-[8px_8px_0_#EF4444] active:scale-95 transition-all"
                >
                  Purge Asset
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full h-20 bg-white border-2 border-charcoal/10 text-charcoal/20 font-display font-black rounded-[28px] uppercase italic tracking-[0.1em] active:scale-95 transition-all text-sm"
                >
                  Retake Control
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Final Confirm Modal */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-500/20 backdrop-blur-2xl"
              onClick={() => setShowDeleteConfirmModal(false)}
            />
            <motion.div 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="bg-charcoal w-full max-w-[380px] rounded-[54px] p-12 border-8 border-red-500 shadow-[24px_24px_0_rgba(239,68,68,0.2)] relative z-10 flex flex-col gap-10 text-center"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col gap-2">
                   <h3 className="text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-[0.8] mb-4">Final Breach?</h3>
                   <p className="text-[12px] font-black text-red-500 uppercase italic tracking-widest">
                      Deleting: {productName}
                   </p>
                   <p className="text-[10px] font-black text-white/20 uppercase italic tracking-[0.2em] mt-4">This action cannot be reverted.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleDelete}
                  className="w-full h-20 bg-red-500 text-white font-display font-black rounded-[28px] uppercase italic tracking-[0.1em] shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  Sever Forever
                </button>
                <button 
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="w-full h-20 bg-white/5 border-2 border-white/10 text-white font-display font-black rounded-[28px] uppercase italic tracking-[0.1em] active:scale-95 transition-all text-sm"
                >
                  Emergency Abort
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Sold Out Modal */}
        {showSoldOutModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-charcoal/80 backdrop-blur-lg"
              onClick={() => setShowSoldOutModal(false)}
            />
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-[380px] rounded-[54px] p-12 border-4 border-charcoal shadow-[16px_16px_0_#FFD700] relative z-10 flex flex-col gap-10"
            >
              <div className="flex flex-col gap-4">
                <div className="w-16 h-16 bg-amber-500/10 border-4 border-amber-500 rounded-[24px] flex items-center justify-center text-amber-500">
                   <ShoppingBag size={32} strokeWidth={4} />
                </div>
                <div className="flex flex-col">
                   <h3 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-[0.8] mb-2">Liquidate State</h3>
                   <p className="text-[11px] font-black text-charcoal/40 uppercase italic tracking-widest leading-relaxed">
                      Setting all indices to zero. This unit will be marked as depleted.
                   </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowSoldOutModal(false)}
                  className="flex-1 h-16 bg-cream text-charcoal border-4 border-charcoal font-display font-black rounded-[20px] uppercase italic tracking-widest text-xs active:scale-95 transition-all"
                >
                  Abort
                </button>
                <button 
                  onClick={handleMarkSoldOut}
                  className="flex-1 h-16 bg-charcoal text-cream font-display font-black rounded-[20px] uppercase italic tracking-widest text-xs shadow-[4px_4px_0_#FFD700] active:scale-95 transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
