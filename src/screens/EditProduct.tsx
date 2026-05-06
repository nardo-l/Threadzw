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
  ShoppingBag
} from 'lucide-react';
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('owner_id', user.id)
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
    setColours([...colours, { name: '', hex: '#f72585' }]);
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
            {[...Array(5)].map((_, i) => <Shimmer key={i} className="h-[120px] rounded-16" />)}
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
    <div className="min-h-screen bg-background pb-32">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md z-50 flex items-center justify-between px-4 border-b border-border max-w-[430px] mx-auto">
        <button onClick={handleBack} className="p-2 -ml-2 text-white hover:text-primary transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-pacifico text-xl text-white">Edit Product</h1>
        <button 
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`font-mono text-sm font-bold transition-colors ${
            saving || !hasChanges ? 'text-muted cursor-not-allowed' : 'text-primary'
          }`}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
        </button>
      </div>

      <div className="pt-20 px-4 space-y-10">
        {/* Section 1: Photos */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="font-syne font-bold text-lg text-white">Photos</h2>
              <p className="font-sans text-xs text-muted">Tap any photo to replace it</p>
            </div>
            <div className="flex gap-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${photos[i].url || photos[i].preview ? 'bg-primary' : 'bg-muted/30'}`} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Slot 1: Main Photo */}
            <div 
              onClick={() => fileInputRefs.current[0]?.click()}
              className={`col-span-2 h-[200px] rounded-16 overflow-hidden bg-elevated border-2 border-dashed transition-all cursor-pointer group relative flex flex-col items-center justify-center ${
                photos[0].url || photos[0].preview ? 'border-transparent' : 'border-primary/30'
              }`}
            >
              {(photos[0].url || photos[0].preview) ? (
                <>
                  <img 
                    src={photos[0].preview || photos[0].url || undefined} 
                    alt="Main" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <Camera size={24} className="text-white mb-1" />
                    <span className="font-mono text-[10px] text-white uppercase tracking-wider">Replace</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <span className="font-mono text-[10px] text-white uppercase tracking-wider">Main Photo (Cover)</span>
                  </div>
                </>
              ) : (
                <>
                  <Camera size={24} className="text-primary mb-2" />
                  <span className="font-mono text-xs text-muted">Main Photo</span>
                </>
              )}
              <span className="absolute top-3 left-3 font-mono text-[10px] text-white/40">01</span>
              {uploadingSlots[0] && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <Loader2 size={24} className="text-primary animate-spin" />
                </div>
              )}
            </div>

            {/* Slots 2-6 */}
            {photos.slice(1).map((slot, i) => {
              const idx = i + 1;
              const hasImage = slot.url || slot.preview;
              return (
                <div 
                  key={idx}
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  className={`h-[120px] rounded-16 overflow-hidden bg-elevated border-2 border-dashed transition-all cursor-pointer group relative flex flex-col items-center justify-center ${
                    hasImage ? 'border-transparent' : 'border-primary/30'
                  }`}
                >
                  {hasImage ? (
                    <>
                      <img 
                        src={slot.preview || slot.url || undefined} 
                        alt={slot.label} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                        <Camera size={20} className="text-white mb-1" />
                        <span className="font-mono text-[10px] text-white uppercase tracking-wider">Replace</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(idx);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red transition-colors"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="font-mono text-[10px] text-white uppercase tracking-wider">{slot.label}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera size={20} className="text-primary mb-1" />
                      <span className="font-mono text-[10px] text-muted">{slot.label}</span>
                    </>
                  )}
                  <span className="absolute top-2 left-2 font-mono text-[10px] text-white/40">0{idx + 1}</span>
                  {uploadingSlots[idx] && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                      <Loader2 size={20} className="text-primary animate-spin" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
              {photos.filter(p => p.url || p.preview).length} of 6 photos
            </span>
            {photos.some(p => !p.url && !p.preview) && (
              <span className="font-mono text-[10px] text-amber uppercase tracking-wider">
                Missing photos will use original images
              </span>
            )}
          </div>

          {photos.map((_, i) => (
            <input
              key={i}
              type="file"
              accept="image/*"
              ref={el => { fileInputRefs.current[i] = el; }}
              onChange={e => handlePhotoSelect(e, i)}
              className="hidden"
            />
          ))}
        </section>

        {/* Quick Actions */}
        <section className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          <button 
            onClick={handleQuickPause}
            className={`flex items-center gap-2 px-4 py-2 rounded-pill font-mono text-[10px] uppercase tracking-wider whitespace-nowrap border transition-all ${
              status === 'active' 
                ? 'bg-amber/10 border-amber text-amber' 
                : 'bg-green/10 border-green text-green'
            }`}
          >
            {status === 'active' ? <Pause size={14} /> : <Play size={14} />}
            {status === 'active' ? 'Pause Listing' : 'Resume Listing'}
          </button>
          
          <button 
            onClick={() => setShowSoldOutModal(true)}
            disabled={totalStock === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-pill font-mono text-[10px] uppercase tracking-wider whitespace-nowrap border transition-all ${
              totalStock === 0 
                ? 'bg-muted/10 border-muted text-muted cursor-not-allowed' 
                : 'bg-card border-border text-white hover:border-primary'
            }`}
          >
            <ShoppingBag size={14} />
            Mark All Sold Out
          </button>

          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-pill font-mono text-[10px] uppercase tracking-wider whitespace-nowrap border border-red text-red bg-red/10"
          >
            <Trash2 size={14} />
            Delete Product
          </button>
        </section>

        {/* Section 2: Product Details */}
        <section className="space-y-6 pt-6 border-t border-border">
          <h2 className="font-syne font-bold text-lg text-white">Product Details</h2>
          
          {/* Product Name */}
          <div id="field-productName" className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="font-mono text-xs text-muted uppercase tracking-wider">
                Product Name <span className="text-primary">*</span>
              </label>
              <span className="font-mono text-[10px] text-muted">{productName.length}/80</span>
            </div>
            <input 
              value={productName}
              onChange={e => {
                if (e.target.value.length <= 80) {
                  setProductName(e.target.value);
                  markChanged();
                }
              }}
              placeholder="e.g. Vintage Nike Windbreaker"
              className={`w-full bg-elevated border-2 rounded-12 p-4 text-white font-sans focus:outline-none transition-all ${
                validationErrors.productName ? 'border-red' : 'border-transparent focus:border-primary'
              }`}
            />
          </div>

          {/* Category */}
          <div id="field-category" className="space-y-2">
            <label className="font-mono text-xs text-muted uppercase tracking-wider">
              Category <span className="text-primary">*</span>
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    markChanged();
                  }}
                  className={`px-4 py-2 rounded-pill font-sans text-sm whitespace-nowrap border transition-all ${
                    category === cat 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-elevated border-border text-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div id="field-condition" className="space-y-2">
            <label className="font-mono text-xs text-muted uppercase tracking-wider">
              Condition <span className="text-primary">*</span>
            </label>
            <div className="flex gap-2">
              {conditions.map(cond => (
                <button
                  key={cond}
                  onClick={() => {
                    setCondition(cond);
                    markChanged();
                  }}
                  className={`flex-1 py-2 rounded-pill font-sans text-sm border transition-all ${
                    condition === cond 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-elevated border-border text-muted'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
            {condition && (
              <p className="font-sans text-xs text-muted italic animate-wipe">
                {conditionNotes[condition]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="font-mono text-xs text-muted uppercase tracking-wider">Description</label>
              <span className="font-mono text-[10px] text-muted">{description.length}/400</span>
            </div>
            <textarea 
              value={description}
              onChange={e => {
                if (e.target.value.length <= 400) {
                  setDescription(e.target.value);
                  markChanged();
                }
              }}
              rows={4}
              placeholder="Tell buyers what makes this item special..."
              className="w-full bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-4 text-white font-sans focus:outline-none resize-none transition-all"
            />
          </div>
        </section>

        {/* Section 3: Pricing */}
        <section className="space-y-6 pt-6 border-t border-border">
          <h2 className="font-syne font-bold text-lg text-white">Pricing</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div id="field-price" className="space-y-2">
              <label className="font-mono text-xs text-muted uppercase tracking-wider">
                Price <span className="text-primary">*</span>
              </label>
              <div className={`flex items-center bg-elevated border-2 rounded-12 overflow-hidden transition-all ${
                validationErrors.price ? 'border-red' : 'border-transparent focus-within:border-primary'
              }`}>
                <span className="pl-4 font-mono text-primary">$</span>
                <input 
                  type="number"
                  value={price}
                  onChange={e => {
                    setPrice(e.target.value);
                    markChanged();
                  }}
                  placeholder="0.00"
                  className="w-full bg-transparent p-4 pl-1 text-white font-sans focus:outline-none"
                />
              </div>
            </div>

            {/* Original Price */}
            <div id="field-originalPrice" className="space-y-2">
              <label className="font-mono text-xs text-muted uppercase tracking-wider">Original Price</label>
              <div className={`flex items-center bg-elevated border-2 rounded-12 overflow-hidden transition-all ${
                validationErrors.originalPrice ? 'border-red' : 'border-transparent focus-within:border-primary'
              }`}>
                <span className="pl-4 font-mono text-muted">$</span>
                <input 
                  type="number"
                  value={originalPrice}
                  onChange={e => {
                    setOriginalPrice(e.target.value);
                    markChanged();
                  }}
                  placeholder="0.00"
                  className="w-full bg-transparent p-4 pl-1 text-white font-sans focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {price && (
              <div className="flex items-center gap-3 animate-wipe">
                <span className="font-syne font-bold text-3xl text-primary">USD {price}</span>
                {originalPrice && parseFloat(originalPrice) > parseFloat(price) && (
                  <span className="bg-primary text-white px-2 py-0.5 rounded-pill font-mono text-[10px] font-bold">
                    -{Math.round((1 - parseFloat(price) / parseFloat(originalPrice)) * 100)}% OFF
                  </span>
                )}
              </div>
            )}
            {originalPrice && (
              <p className="font-mono text-[10px] text-muted uppercase tracking-tighter">
                {parseFloat(originalPrice) > parseFloat(price) 
                  ? 'Buyers see a strikethrough of this price'
                  : <span className="text-amber">Compare price should be higher than listed price</span>
                }
              </p>
            )}
          </div>
        </section>

        {/* Section 4: Sizes & Stock */}
        <section className="space-y-6 pt-6 border-t border-border">
          <h2 className="font-syne font-bold text-lg text-white">Sizes & Stock</h2>
          
          <div className="flex items-center justify-between bg-elevated p-4 rounded-12">
            <span className="font-sans text-sm text-white">This item has no sizes (e.g. chains, caps)</span>
            <button 
              onClick={() => {
                setNoSizes(!noSizes);
                markChanged();
              }}
              className={`w-12 h-6 rounded-pill relative transition-colors ${noSizes ? 'bg-primary' : 'bg-muted/30'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${noSizes ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {noSizes ? (
            <div className="space-y-2 animate-wipe">
              <label className="font-mono text-xs text-muted uppercase tracking-wider">Quantity</label>
              <div className="flex items-center gap-4 bg-elevated p-2 rounded-12 w-fit">
                <button 
                  onClick={() => {
                    setSingleQuantity(Math.max(0, singleQuantity - 1));
                    markChanged();
                  }}
                  className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-white"
                >
                  <Minus size={18} />
                </button>
                <span className="font-syne font-bold text-xl w-8 text-center">{singleQuantity}</span>
                <button 
                  onClick={() => {
                    setSingleQuantity(singleQuantity + 1);
                    markChanged();
                  }}
                  className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-white"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div id="field-sizes" className="space-y-4 animate-wipe">
              <div className="space-y-3">
                {sizeVariants.map((variant, idx) => (
                  <div key={idx} className="flex items-center gap-3 animate-wipe">
                    <input 
                      value={variant.size}
                      onChange={e => updateSizeVariant(idx, { size: e.target.value })}
                      placeholder="Size"
                      className="w-20 bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-3 text-white font-sans focus:outline-none"
                    />
                    <div className="flex items-center gap-2 bg-elevated p-1 rounded-12">
                      <button 
                        onClick={() => updateSizeVariant(idx, { quantity: Math.max(0, variant.quantity - 1) })}
                        className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-white"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-mono text-sm w-6 text-center">{variant.quantity}</span>
                      <button 
                        onClick={() => updateSizeVariant(idx, { quantity: variant.quantity + 1 })}
                        className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-pill font-mono text-[8px] uppercase font-bold ${
                      variant.quantity > 3 ? 'bg-green/10 text-green' : 
                      variant.quantity > 0 ? 'bg-amber/10 text-amber' : 'bg-red/10 text-red'
                    }`}>
                      {variant.quantity > 3 ? 'In Stock' : variant.quantity > 0 ? 'Low' : 'Sold Out'}
                    </div>

                    <button 
                      onClick={() => removeSizeVariant(idx)}
                      className="p-2 text-muted hover:text-red transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={addSizeVariant}
                className="flex items-center gap-2 px-4 py-2 rounded-pill border border-border text-muted hover:text-primary hover:border-primary transition-all font-sans text-sm"
              >
                <Plus size={16} />
                Add Size
              </button>

              {/* Quick Add Sizes */}
              {(category === 'Sneakers' || category === 'Clothing') && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {(category === 'Sneakers' ? ['UK6', 'UK7', 'UK8', 'UK9', 'UK10', 'UK11', 'UK12'] : ['XS', 'S', 'M', 'L', 'XL', 'XXL']).map(s => (
                    <button 
                      key={s}
                      onClick={() => {
                        if (!sizeVariants.some(v => v.size === s)) {
                          setSizeVariants([...sizeVariants, { size: s, quantity: 1 }]);
                          markChanged();
                        }
                      }}
                      className="px-3 py-1 bg-elevated rounded-pill font-mono text-[10px] text-muted hover:text-white transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`font-mono text-xs uppercase tracking-wider ${totalStock > 0 ? 'text-white' : 'text-red'}`}>
                Total Stock: {totalStock} units
              </span>
              <div className={`w-2 h-2 rounded-full ${totalStock > 0 ? 'bg-green' : 'bg-red'}`} />
            </div>

            {stockDecreased && (
              <div className="bg-amber/5 border-l-4 border-amber p-4 rounded-r-16 space-y-1 animate-wipe">
                <p className="font-mono text-[10px] text-amber uppercase font-bold">You're reducing stock</p>
                <p className="font-sans text-sm text-white">Current: {originalData.total_stock} units → New: {totalStock} units</p>
                <p className="font-sans text-xs text-muted">Make sure this matches your actual physical stock</p>
              </div>
            )}
          </div>
        </section>

        {/* Section 5: Colours */}
        <section className="space-y-6 pt-6 border-t border-border">
          <div className="space-y-1">
            <h2 className="font-syne font-bold text-lg text-white">Colours</h2>
            <p className="font-sans text-xs text-muted">Optional — only add if your item comes in different colours</p>
          </div>

          <div className="space-y-3">
            {colours.map((colour, idx) => (
              <div key={idx} className="flex items-center gap-3 animate-wipe">
                <div 
                  className="w-10 h-10 rounded-12 border-2 border-border relative overflow-hidden"
                  style={{ backgroundColor: colour.hex }}
                >
                  <input 
                    type="color"
                    value={colour.hex}
                    onChange={e => updateColour(idx, { hex: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <input 
                  value={colour.name}
                  onChange={e => updateColour(idx, { name: e.target.value })}
                  placeholder="Colour Name"
                  className="flex-1 bg-elevated border-2 border-transparent focus:border-primary rounded-12 p-3 text-white font-sans focus:outline-none"
                />
                <button 
                  onClick={() => removeColour(idx)}
                  className="p-2 text-muted hover:text-red transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={addColour}
            className="flex items-center gap-2 px-4 py-2 rounded-pill border border-border text-muted hover:text-primary hover:border-primary transition-all font-sans text-sm"
          >
            <Plus size={16} />
            Add Colour
          </button>

          <div className="flex flex-wrap gap-2 pt-2">
            {['White', 'Black', 'Grey', 'Brown', 'Navy', 'Red', 'Green', 'Multi'].map(c => (
              <button 
                key={c}
                onClick={() => {
                  if (!colours.some(col => col.name === c)) {
                    const hexMap: Record<string, string> = {
                      'White': '#ffffff', 'Black': '#000000', 'Grey': '#888888', 'Brown': '#8b4513',
                      'Navy': '#000080', 'Red': '#ff0000', 'Green': '#00ff00', 'Multi': '#f72585'
                    };
                    setColours([...colours, { name: c, hex: hexMap[c] || '#f72585' }]);
                    markChanged();
                  }
                }}
                className="px-3 py-1 bg-elevated rounded-pill font-mono text-[10px] text-muted hover:text-white transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Section 6: Listing Status */}
        <section className="space-y-6 pt-6 border-t border-border">
          <h2 className="font-syne font-bold text-lg text-white">Listing Status</h2>
          
          <div className="flex gap-2">
            {[
              { id: 'active', label: 'Active', color: 'bg-green', note: 'Your product is visible to buyers in the feed' },
              { id: 'paused', label: 'Paused', color: 'bg-amber', note: 'Your product is hidden but not deleted. Buyers cannot see it.' },
              { id: 'sold_out', label: 'Sold Out', color: 'bg-muted', note: 'Shown in the feed with a Sold Out badge. Buyers can see it but not enquire.' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setStatus(s.id);
                  markChanged();
                }}
                className={`flex-1 py-3 rounded-12 border-2 transition-all flex flex-col items-center gap-1 ${
                  status === s.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-transparent bg-elevated'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                <span className={`font-syne font-bold text-xs ${status === s.id ? 'text-primary' : 'text-muted'}`}>{s.label}</span>
              </button>
            ))}
          </div>
          
          <p className={`font-mono text-[10px] uppercase tracking-wider ${
            status === 'active' ? 'text-green' : status === 'paused' ? 'text-amber' : 'text-muted'
          }`}>
            {status === 'active' ? 'Your product is visible to buyers in the feed' : 
             status === 'paused' ? 'Your product is hidden but not deleted. Buyers cannot see it.' : 
             'Shown in the feed with a Sold Out badge. Buyers can see it but not enquire.'}
          </p>
        </section>
      </div>

      {/* Bottom Action Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border z-40 max-w-[430px] mx-auto">
        {hasChanges ? (
          <div className="space-y-3">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 gradient-pink-purple text-white font-syne font-bold rounded-14 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
            <button 
              onClick={() => setShowDiscardModal(true)}
              className="w-full py-2 text-muted font-sans text-sm hover:text-white transition-colors"
            >
              Discard Changes
            </button>
          </div>
        ) : (
          <button 
            disabled
            className="w-full py-4 bg-card text-muted font-sans font-bold rounded-14 cursor-default"
          >
            No changes to save
          </button>
        )}
      </div>

      {/* Modals */}

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-[340px] rounded-20 p-6 border border-border space-y-6">
            <div className="space-y-2">
              <h3 className="font-syne font-bold text-xl text-white">Unsaved changes</h3>
              <p className="font-sans text-muted">Leave without saving your changes?</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleSave}
                className="w-full py-4 bg-primary text-white font-syne font-bold rounded-14 shadow-lg shadow-primary/20"
              >
                Save Changes
              </button>
              <button 
                onClick={() => navigate(-1)}
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

      {/* Discard Changes Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDiscardModal(false)} />
          <div className="relative bg-card w-full max-w-[430px] rounded-t-32 p-8 animate-wipe overflow-hidden">
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            <div className="space-y-2 mb-8">
              <h3 className="font-syne font-bold text-2xl text-white">Discard all changes?</h3>
              <p className="font-sans text-muted">Your edits will be lost</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  fetchProduct();
                  setHasChanges(false);
                  setShowDiscardModal(false);
                }}
                className="w-full py-4 bg-red text-white font-syne font-bold rounded-14"
              >
                Discard
              </button>
              <button 
                onClick={() => setShowDiscardModal(false)}
                className="w-full py-4 bg-elevated text-white font-syne font-bold rounded-14"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-[340px] rounded-20 p-6 border border-border space-y-6">
            <div className="space-y-2">
              <h3 className="font-syne font-bold text-xl text-white">Delete this product?</h3>
              <p className="font-sans text-muted text-sm leading-relaxed">
                Buyers can no longer find this listing. Sales history is preserved.
              </p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setShowDeleteConfirmModal(true);
                }}
                className="w-full py-4 bg-red text-white font-syne font-bold rounded-14"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-4 bg-elevated text-white font-syne font-bold rounded-14"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Final Confirm Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-[340px] rounded-20 p-6 border border-border space-y-6">
            <div className="space-y-2">
              <h3 className="font-syne font-bold text-xl text-white">Delete {productName}?</h3>
              <p className="font-sans text-muted text-sm">This action cannot be undone.</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleDelete}
                className="w-full py-4 bg-red text-white font-syne font-bold rounded-14 shadow-lg shadow-red/20"
              >
                Delete Forever
              </button>
              <button 
                onClick={() => setShowDeleteConfirmModal(false)}
                className="w-full py-4 bg-elevated text-white font-syne font-bold rounded-14"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sold Out Modal */}
      {showSoldOutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-[340px] rounded-20 p-6 border border-border space-y-6">
            <div className="space-y-2">
              <h3 className="font-syne font-bold text-xl text-white">Mark all as sold out?</h3>
              <p className="font-sans text-muted text-sm">This will set all size quantities to 0.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSoldOutModal(false)}
                className="flex-1 py-4 bg-elevated text-white font-syne font-bold rounded-14"
              >
                Cancel
              </button>
              <button 
                onClick={handleMarkSoldOut}
                className="flex-1 py-4 bg-primary text-white font-syne font-bold rounded-14"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
