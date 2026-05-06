import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Check, 
  Camera, 
  Info, 
  DollarSign, 
  ChevronRight, 
  Trash2, 
  Rocket, 
  Lock,
  AlertCircle,
  Zap,
  Ship,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { useSubscription } from '../context/SubscriptionContext';
import { UpgradeSheet } from '../components/UpgradeSheet';
import { FieldError } from '../components/ui/FieldError';

import { PRODUCT_CATEGORIES } from '../constants';

// --- Types ---

interface SizeVariant {
  size: string;
  quantity: number;
}

interface Colour {
  name: string;
  hex: string;
}

interface PhotoSlot {
  id: number;
  label: string;
  preview: string | null;
}

// --- Constants ---

const CONDITIONS = [
  { label: 'New', desc: 'Never worn, tags attached, original packaging' },
  { label: 'Like New', desc: 'Worn once or twice, no visible wear' },
  { label: 'Good', desc: 'Visible light wear, no damage' },
  { label: 'Fair', desc: 'Noticeable wear, priced accordingly' }
];

const SNEAKER_SIZES = ['UK6', 'UK7', 'UK8', 'UK9', 'UK10', 'UK11', 'UK12'];
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const QUICK_COLOURS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#000000' },
  { name: 'Grey', hex: '#888888' },
  { name: 'Brown', hex: '#4b2c20' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Red', hex: '#ff0000' },
  { name: 'Green', hex: '#00ff00' },
  { name: 'Multi', hex: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' }
];

const PHOTO_SLOTS_CONFIG = [
  { id: 1, label: 'Main Photo' },
  { id: 2, label: 'Back' },
  { id: 3, label: 'Side' },
  { id: 4, label: 'Detail' },
  { id: 5, label: 'On Foot' },
  { id: 6, label: 'Size Tag' }
];

export const NewListing: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAtProductLimit } = useSubscription();
  const { addProduct, userShop } = useInventory();
  
  // --- Form State ---
  const [photos, setPhotos] = useState<(string | null)[]>(new Array(6).fill(null));
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [sizeVariants, setSizeVariants] = useState<SizeVariant[]>([]);
  const [noSizes, setNoSizes] = useState(false);
  const [singleQuantity, setSingleQuantity] = useState(1);
  const [colours, setColours] = useState<Colour[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [photoErrors, setPhotoErrors] = useState<Record<number, boolean>>({});
  
  // --- UI State ---
  const [publishAttempted, setPublishAttempted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAtProductLimit) {
      setShowUpgradeSheet(true);
    }
  }, [isAtProductLimit]);

  // --- Draft Logic ---
  useEffect(() => {
    const savedDraft = localStorage.getItem('thread_draft_listing');
    if (savedDraft) {
      setShowDraftBanner(true);
    }

    // Mock initial state for demo - REMOVED for production
  }, []);

  const handleContinueDraft = () => {
    const savedDraft = localStorage.getItem('thread_draft_listing');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setPhotos(draft.photos);
      setProductName(draft.productName);
      setCategory(draft.category);
      setCondition(draft.condition);
      setDescription(draft.description);
      setPrice(draft.price);
      setOriginalPrice(draft.originalPrice);
      setSizeVariants(draft.sizeVariants);
      setNoSizes(draft.noSizes);
      setSingleQuantity(draft.singleQuantity);
      setColours(draft.colours);
      setIsFeatured(draft.isFeatured);
    }
    setShowDraftBanner(false);
  };

  const handleSaveDraft = () => {
    const draft = {
      photos, productName, category, condition, description,
      price, originalPrice, sizeVariants, noSizes, singleQuantity,
      colours, isFeatured
    };
    localStorage.setItem('thread_draft_listing', JSON.stringify(draft));
    showToast('Draft saved', 'success');
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('thread_draft_listing');
    setShowDraftBanner(false);
  };

  // --- Computed State ---
  const filledPhotosCount = photos.filter(p => p !== null).length;
  const allPhotosUploaded = filledPhotosCount === 6;
  
  const requiredFields = [
    ...photos,
    productName,
    category,
    price,
    noSizes ? true : sizeVariants.length > 0
  ];
  
  const filledRequiredCount = [
    ...photos.filter(p => p !== null),
    productName.trim() !== '' ? true : null,
    category !== '' ? true : null,
    price !== '' ? true : null,
    (noSizes || sizeVariants.length > 0) ? true : null
  ].filter(Boolean).length;

  const progress = (filledRequiredCount / 10) * 100;

  const discountPercent = useMemo(() => {
    const p = parseFloat(price);
    const op = parseFloat(originalPrice);
    if (p && op && op > p) {
      return Math.round(((op - p) / op) * 100);
    }
    return null;
  }, [price, originalPrice]);

  const totalStock = useMemo(() => {
    if (noSizes) return singleQuantity;
    return sizeVariants.reduce((acc, v) => acc + v.quantity, 0);
  }, [noSizes, singleQuantity, sizeVariants]);

  // --- Handlers ---
  const uploadImage = async (file: File, index: number): Promise<string> => {
    if (!userShop) throw new Error('No shop found');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userShop.id}/${Date.now()}_listing_${index}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);
      
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>(new Array(6).fill(null));

  const handlePhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('File too large (max 5MB)', 'error');
        return;
      }

      setPhotoErrors(prev => ({ ...prev, [index]: false }));
      
      // Update file state
      const newFiles = [...photoFiles];
      newFiles[index] = file;
      setPhotoFiles(newFiles);

      // Local preview
      const previewUrl = URL.createObjectURL(file);
      const newPhotos = [...photos];
      newPhotos[index] = previewUrl;
      setPhotos(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
    
    const newFiles = [...photoFiles];
    newFiles[index] = null;
    setPhotoFiles(newFiles);
  };

  const handleBack = () => {
    const hasContent = photos.some(p => p !== null) || productName || category || condition || description || price || originalPrice || sizeVariants.length > 0;
    if (hasContent) {
      setShowDiscardModal(true);
    } else {
      navigate(-1);
    }
  };

  const addSizeVariant = () => {
    if (sizeVariants.length < 20) {
      setSizeVariants([...sizeVariants, { size: '', quantity: 1 }]);
    }
  };

  const updateSizeVariant = (index: number, field: keyof SizeVariant, value: string | number) => {
    const newVariants = [...sizeVariants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setSizeVariants(newVariants);
  };

  const removeSizeVariant = (index: number) => {
    setSizeVariants(sizeVariants.filter((_, i) => i !== index));
  };

  const addColour = () => {
    if (colours.length < 6) {
      setColours([...colours, { name: '', hex: '#f72585' }]);
    }
  };

  const updateColour = (index: number, field: keyof Colour, value: string) => {
    const newColours = [...colours];
    newColours[index] = { ...newColours[index], [field]: value };
    setColours(newColours);
  };

  const removeColour = (index: number) => {
    setColours(colours.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (filledPhotosCount < 6) errors.push('photos');
    if (!productName.trim()) errors.push('productName');
    if (!category) errors.push('category');
    if (!condition) errors.push('condition');
    if (!price) errors.push('price');
    if (!noSizes && sizeVariants.length === 0) errors.push('sizes');
    return errors;
  };

  const handlePublish = async () => {
    setPublishAttempted(true);
    const errors = validateForm();
    if (errors.length > 0) {
      showToast('Please fill in all required fields', 'error');
      const firstError = document.getElementById(`error-${errors[0]}`);
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsPublishing(true);
    try {
      if (!userShop) {
        showToast('No active shop found. Please set up your shop first.', 'error');
        return;
      }

      // 1. Upload Images
      const uploadedUrls: string[] = [];
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        if (file) {
          try {
            const url = await uploadImage(file, i);
            uploadedUrls.push(url);
          } catch (uploadErr) {
            console.error(`Error uploading photo ${i}:`, uploadErr);
            throw new Error(`Failed to upload photo ${i + 1}`);
          }
        }
      }

      // Prepare variants
      const finalVariants = noSizes 
        ? [{ size: 'One Size', quantity: singleQuantity }]
        : sizeVariants;

      const newProduct = await addProduct({
        shop_id: userShop.id,
        name: productName,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : undefined,
        category: category,
        condition: condition.toLowerCase().replace(' ', '_'),
        images: uploadedUrls,
        description: description,
        sizes: finalVariants,
        total_stock: finalVariants.reduce((sum, v) => sum + v.quantity, 0),
        is_published: true
      });

      if (newProduct) {
        setCreatedProductId(newProduct.id);
        // Success!
        localStorage.removeItem('thread_draft_listing');
        setShowSuccess(true);
      }
    } catch (error: any) {
      console.error('Error publishing product:', error);
      showToast(error.message || 'Failed to publish product. Please try again.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[430px] mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={handleBack} className="p-2 -ml-2 text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-pacifico text-white">New Listing</h1>
          <button onClick={handleSaveDraft} className="text-sm font-sans text-muted hover:text-primary transition-colors">
            Save Draft
          </button>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-white/5 w-full">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-20 px-6 flex flex-col gap-10">
        
        {/* Draft Banner */}
        <AnimatePresence>
          {showDraftBanner && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-primary" />
                  <span className="text-sm font-sans font-bold text-white">You have an unsaved draft</span>
                </div>
                <button onClick={handleDiscardDraft} className="text-[10px] font-mono text-muted uppercase tracking-widest">Discard</button>
              </div>
              <button 
                onClick={handleContinueDraft}
                className="w-full py-2 bg-primary text-white text-xs font-bold rounded-pill"
              >
                Continue Editing
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1: Photos */}
        <section id="error-photos" className="flex flex-col gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-syne font-bold text-white">Photos</h2>
            <p className="text-sm font-sans text-muted">Add 6 photos of your product</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PHOTO_SLOTS_CONFIG.map((slot, idx) => {
              const isMain = slot.id === 1;
              const preview = photos[idx];
              const hasError = photoErrors[idx];
              
              return (
                <div 
                  key={slot.id}
                  className={`${isMain ? 'col-span-2 h-56' : 'h-40'} relative rounded-card overflow-hidden transition-all duration-300 ${
                    hasError ? 'border-2 border-red bg-red/5' :
                    !preview ? 'border-1.5 border-dashed border-primary/30 bg-card' : 'bg-elevated'
                  } ${publishAttempted && !preview && !hasError ? 'border-red-500/50 animate-shake' : ''}`}
                  onClick={() => !preview && fileInputRefs.current[idx]?.click()}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={el => { fileInputRefs.current[idx] = el; }}
                    onChange={(e) => handlePhotoUpload(idx, e)}
                  />
                  
                  {hasError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                      <AlertTriangle size={24} className="text-red" />
                      <span className="text-[10px] font-mono text-red uppercase tracking-widest text-center">Upload Failed</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRefs.current[idx]?.click();
                        }}
                        className="mt-2 px-4 py-1.5 bg-red text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 active:scale-95"
                      >
                        <RefreshCw size={12} />
                        Retry
                      </button>
                    </div>
                  ) : preview ? (
                    <>
                      <img src={preview || undefined} alt={slot.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20" />
                      <span className="absolute top-3 left-3 text-[10px] font-mono text-white bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-md">
                        0{slot.id}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white border border-white/10"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-[10px] font-mono text-white uppercase tracking-widest">{slot.label}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <span className="absolute top-3 left-3 text-[10px] font-mono text-muted">0{slot.id}</span>
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-primary"
                      >
                        <Plus size={isMain ? 32 : 24} />
                      </motion.div>
                      <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{slot.label}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{filledPhotosCount} of 6 photos added</span>
              <div className="flex gap-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < filledPhotosCount ? 'bg-primary' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
            {filledPhotosCount < 6 ? (
              <p className="text-[10px] font-sans text-amber-500">Add {6 - filledPhotosCount} more photo(s) to unlock publishing</p>
            ) : (
              <p className="text-[10px] font-mono text-green-500 font-bold uppercase tracking-widest">All photos added ✓</p>
            )}
          </div>

          {filledPhotosCount < 6 && (
            <div className="bg-elevated border-l-2 border-amber-500 p-4 rounded-r-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-500">
                <Camera size={14} />
                <span className="text-[10px] font-mono uppercase tracking-widest">Photo Tips</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {[
                  "Main photo should be clean, well-lit, on a neutral background",
                  "Show the back, sides, and any defects honestly",
                  "Include the size tag — buyers always want to see it",
                  "On Foot / worn photo increases enquiries significantly"
                ].map((tip, i) => (
                  <li key={i} className="text-[11px] font-sans text-muted leading-tight flex gap-2">
                    <span className="text-amber-500/50">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Section 2: Product Details */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-syne font-bold text-white">Product Details</h2>
          
          {/* Name */}
          <div id="error-productName" className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Product Name</label>
              <span className="text-red-500">*</span>
            </div>
                <div className="relative">
                  <input 
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value.slice(0, 80))}
                    placeholder="e.g. Nike Air Force 1 White"
                    className={`w-full bg-elevated border-2 rounded-xl p-4 text-sm text-white focus:outline-none transition-all ${
                      publishAttempted && !productName ? 'border-red/50' : 'border-white/5 focus:border-primary'
                    }`}
                  />
                  <span className="absolute bottom-4 right-4 text-[10px] font-mono text-muted">
                    {productName.length}/80
                  </span>
                </div>
                <FieldError message={publishAttempted && !productName ? 'Product name is required' : null} />
              </div>

          {/* Category */}
          <div id="error-category" className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Category</label>
              <span className="text-red-500">*</span>
            </div>
            <div className={`flex gap-2 overflow-x-auto no-scrollbar pb-2 ${publishAttempted && !category ? 'animate-shake' : ''}`}>
              {PRODUCT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.label)}
                  className={`px-6 py-2.5 rounded-pill text-xs font-sans font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                    category === cat.label 
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                      : 'bg-card border-white/5 text-muted hover:border-white/20'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
            <FieldError message={publishAttempted && !category ? 'Please select a category' : null} />
          </div>

          {/* Condition */}
          <div id="error-condition" className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Condition</label>
              <span className="text-red-500">*</span>
            </div>
            <div className="flex gap-2">
              {CONDITIONS.map(c => (
                <button
                  key={c.label}
                  onClick={() => setCondition(c.label)}
                  className={`flex-1 py-2.5 rounded-pill text-xs font-sans font-bold transition-all border ${
                    condition === c.label 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-card border-white/5 text-muted'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {condition && (
                <motion.p 
                  key={condition}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-sans text-muted italic"
                >
                  {CONDITIONS.find(c => c.label === condition)?.desc}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Description</label>
            <div className="relative">
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 400))}
                placeholder="Tell buyers what makes this item special. Include brand details, any flaws, how you got it, etc."
                className="w-full bg-elevated border-2 border-white/5 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary transition-all h-32 resize-none"
              />
              <span className="absolute bottom-4 right-4 text-[10px] font-mono text-muted">
                {description.length}/400
              </span>
            </div>
            <p className="text-[10px] font-mono text-muted italic">Honest descriptions lead to more enquiries and better reviews</p>
          </div>
        </section>

        {/* Section 3: Pricing */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-syne font-bold text-white">Pricing</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Listed Price */}
            <div id="error-price" className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Price</label>
                <span className="text-red-500">*</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className={`w-full bg-elevated border-2 rounded-xl p-4 pl-8 text-sm text-white focus:outline-none transition-all ${
                    publishAttempted && !price ? 'border-red/50' : 'border-white/5 focus:border-primary'
                  }`}
                />
              </div>
              <FieldError message={publishAttempted && !price ? 'Price is required' : null} />
            </div>

            {/* Original Price */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Original Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                <input 
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-elevated border-2 border-white/5 rounded-xl p-4 pl-8 text-sm text-white focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Price Feedback */}
          <div className="flex items-center justify-between h-8">
            <div className="flex items-center gap-3">
              {price && (
                <motion.span 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-syne font-bold text-primary"
                >
                  ${price}
                </motion.span>
              )}
              {discountPercent && (
                <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-mono font-bold rounded-pill">
                  -{discountPercent}% OFF
                </span>
              )}
            </div>
            {originalPrice && price && parseFloat(originalPrice) < parseFloat(price) && (
              <span className="text-[10px] font-sans text-amber-500">Original price should be higher</span>
            )}
          </div>

          <div className="bg-elevated border-l-2 border-primary p-4 rounded-r-xl flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary">
              <Info size={14} />
              <span className="text-[10px] font-mono uppercase tracking-widest">Pricing in Zimbabwe</span>
            </div>
            <p className="text-[11px] font-sans text-muted leading-tight">
              Price in USD. Buyers expect honest pricing — overpriced items get saved but rarely enquired about.
            </p>
          </div>
        </section>

        {/* Section 4: Sizes & Stock */}
        <section id="error-sizes" className="flex flex-col gap-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-syne font-bold text-white">Sizes & Stock</h2>
            <p className="text-sm font-sans text-muted">Add each size you have available and how many units</p>
          </div>

          {/* No Sizes Toggle */}
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-white/5">
            <div className="flex flex-col">
              <span className="text-sm font-sans text-white">This item has no sizes</span>
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">e.g. chains, caps, one-size</span>
            </div>
            <button 
              onClick={() => setNoSizes(!noSizes)}
              className={`w-12 h-6 rounded-full relative transition-all ${noSizes ? 'bg-primary' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: noSizes ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          {noSizes ? (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Quantity</label>
              <div className="flex items-center gap-4 bg-elevated p-4 rounded-xl border border-white/5">
                <button 
                  onClick={() => setSingleQuantity(Math.max(1, singleQuantity - 1))}
                  className="w-10 h-10 rounded-lg bg-card flex items-center justify-center text-white"
                >
                  -
                </button>
                <span className="flex-1 text-center font-syne font-bold text-white text-lg">{singleQuantity}</span>
                <button 
                  onClick={() => setSingleQuantity(singleQuantity + 1)}
                  className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {sizeVariants.map((v, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={v.size}
                        onChange={(e) => updateSizeVariant(idx, 'size', e.target.value)}
                        placeholder="e.g. UK9"
                        className="w-full bg-elevated border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-elevated p-1 rounded-xl border border-white/5">
                      <button 
                        onClick={() => updateSizeVariant(idx, 'quantity', Math.max(1, v.quantity - 1))}
                        className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-white text-sm"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-white text-sm">{v.quantity}</span>
                      <button 
                        onClick={() => updateSizeVariant(idx, 'quantity', v.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                    <button onClick={() => removeSizeVariant(idx)} className="p-2 text-muted hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button 
                onClick={addSizeVariant}
                className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary/30 rounded-xl text-primary font-sans font-bold text-sm hover:bg-primary/5 transition-all"
              >
                <Plus size={18} />
                Add Size
              </button>

              {/* Suggestions */}
              {(category === 'Sneakers' || category === 'Clothing') && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Quick Add</span>
                  <div className="flex flex-wrap gap-2">
                    {(category === 'Sneakers' ? SNEAKER_SIZES : CLOTHING_SIZES).map(s => (
                      <button
                        key={s}
                        onClick={() => setSizeVariants([...sizeVariants, { size: s, quantity: 1 }])}
                        className="px-3 py-1.5 bg-card border border-white/5 rounded-lg text-[10px] font-mono text-muted hover:text-white hover:border-white/20 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${totalStock > 0 ? 'text-green-500' : 'text-muted'}`}>
              Total Stock: {totalStock} units
            </span>
          </div>
        </section>

        {/* Section 5: Colours */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-syne font-bold text-white">Colours</h2>
            <p className="text-sm font-sans text-muted">Optional — add if your item comes in multiple colours</p>
          </div>

          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {colours.map((c, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      value={c.name}
                      onChange={(e) => updateColour(idx, 'name', e.target.value)}
                      placeholder="Colour name"
                      className="w-full bg-elevated border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                    <input 
                      type="color"
                      value={c.hex}
                      onChange={(e) => updateColour(idx, 'hex', e.target.value)}
                      className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    />
                  </div>
                  <button onClick={() => removeColour(idx)} className="p-2 text-muted hover:text-red-500 transition-colors">
                    <X size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {colours.length < 6 && (
              <button 
                onClick={addColour}
                className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/10 rounded-xl text-muted font-sans font-bold text-sm hover:border-white/20 transition-all"
              >
                <Plus size={18} />
                Add Colour
              </button>
            )}

            <div className="flex flex-wrap gap-2">
              {QUICK_COLOURS.map(qc => (
                <button
                  key={qc.name}
                  onClick={() => colours.length < 6 && setColours([...colours, qc])}
                  className="flex items-center gap-2 px-3 py-1.5 bg-card border border-white/5 rounded-lg hover:border-white/20 transition-all"
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: qc.hex }} />
                  <span className="text-[10px] font-mono text-muted">{qc.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Shop & Visibility */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-syne font-bold text-white">Shop & Visibility</h2>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-widest">Listing to:</label>
            <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center text-2xl">👑</div>
              <div className="flex flex-col">
                <span className="font-syne font-bold text-white">SoleKing HRE</span>
                <span className="text-xs font-sans text-muted">Eastlea, Harare</span>
              </div>
            </div>
          </div>

          <div className={`flex flex-col gap-3 p-5 bg-card rounded-2xl border-2 transition-all ${isFeatured ? 'border-gold shadow-lg shadow-gold/5' : 'border-white/5'}`}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans font-bold text-white">List as Featured</span>
                  {isFeatured && (
                    <span className="px-2 py-0.5 bg-gold text-black text-[8px] font-mono font-bold rounded-pill uppercase tracking-wider">Featured</span>
                  )}
                </div>
                <p className="text-xs font-sans text-muted leading-tight">
                  Boost visibility — your listing appears at the top of the feed for 24 hours
                </p>
              </div>
              <button 
                onClick={() => setIsFeatured(!isFeatured)}
                className={`w-12 h-6 rounded-full relative transition-all ${isFeatured ? 'bg-gold' : 'bg-white/10'}`}
              >
                <motion.div 
                  animate={{ x: isFeatured ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                />
              </button>
            </div>
            <p className="text-[10px] font-mono text-muted italic">Featured listing available with your plan</p>
          </div>
        </section>
      </div>

      {/* Sticky Publish Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-40">
        <div className="max-w-[430px] mx-auto flex flex-col gap-3">
          {filledPhotosCount < 6 && (
            <p className="text-[10px] font-mono text-muted text-center">
              {filledPhotosCount} of 6 photos added · {6 - filledPhotosCount} more needed
            </p>
          )}
          
          <button 
            onClick={handlePublish}
            disabled={filledPhotosCount < 6 || isPublishing}
            className={`w-full py-4 rounded-button font-syne font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${
              filledPhotosCount < 6 
                ? 'bg-[#2a2a2a] text-muted/50 cursor-not-allowed' 
                : progress < 100 
                  ? 'bg-primary/80 text-white' 
                  : 'gradient-pink-purple text-white shadow-primary/20'
            }`}
          >
            {isPublishing ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : filledPhotosCount < 6 ? (
              <>
                <Lock size={20} />
                Upload all 6 photos to publish
              </>
            ) : progress < 100 ? (
              'Complete required fields to publish'
            ) : (
              <>
                <Rocket size={20} />
                Publish Listing
              </>
            )}
          </button>
        </div>
      </div>

      {/* Discard Modal */}
      <AnimatePresence>
        {showDiscardModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowDiscardModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-card border border-white/10 rounded-card p-8 w-full max-w-sm flex flex-col gap-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                <AlertCircle size={32} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-syne font-bold text-white">Discard this listing?</h3>
                <p className="text-sm font-sans text-muted">All your progress will be lost. You can save it as a draft instead.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    localStorage.removeItem('thread_draft_listing');
                    navigate(-1);
                  }}
                  className="w-full py-3 border-2 border-red-500/30 text-red-500 font-sans font-bold rounded-button"
                >
                  Discard
                </button>
                <button 
                  onClick={() => setShowDiscardModal(false)}
                  className="w-full py-3 bg-primary text-white font-sans font-bold rounded-button"
                >
                  Keep Editing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] gradient-pink-purple flex flex-col items-center justify-center p-8 text-center"
          >
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    top: -20, 
                    left: `${Math.random() * 100}%`,
                    rotate: 0
                  }}
                  animate={{ 
                    top: '120%',
                    rotate: 360,
                    left: `${Math.random() * 100}%`
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2, 
                    repeat: Infinity,
                    ease: "linear",
                    delay: Math.random() * 2
                  }}
                  className="absolute w-3 h-3 rounded-sm"
                  style={{ 
                    backgroundColor: ['#f72585', '#7209b7', '#4ade80', '#fbbf24'][Math.floor(Math.random() * 4)] 
                  }}
                />
              ))}
            </div>

            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-primary shadow-2xl mb-8"
            >
              <Check size={48} strokeWidth={4} />
            </motion.div>

            <h2 className="text-5xl font-pacifico text-white mb-2">Listed! 🚀</h2>
            <p className="text-xl font-syne font-bold text-white/90 mb-4">{productName}</p>
            <p className="text-sm font-sans text-white/70 mb-12">Your product is now live on Thread ZW</p>

            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                onClick={() => navigate(`/product/${createdProductId || ''}`)}
                className="w-full py-4 bg-white text-primary font-syne font-bold rounded-button shadow-xl"
              >
                View Listing
              </button>
              <button 
                onClick={() => navigate('/shop-centre')}
                className="w-full py-4 border-2 border-white/30 text-white font-syne font-bold rounded-button"
              >
                Go to Shop Centre
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Sheet */}
      <UpgradeSheet 
        isOpen={showUpgradeSheet} 
        onClose={() => {
          setShowUpgradeSheet(false);
          if (isAtProductLimit) navigate('/shop-centre');
        }} 
      />
    </div>
  );
};
