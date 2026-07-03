import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight,
  Plus, 
  Minus,
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
import { FieldError } from '../components/ui/FieldError';

import { useGlobalCategories } from '../hooks/useGlobalCategories';

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
  const [collection, setCollection] = useState('');
  const [photoErrors, setPhotoErrors] = useState<Record<number, boolean>>({});
  
  // --- UI State ---
  const [step, setStep] = useState(1);
  const [publishAttempted, setPublishAttempted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  
  const { categories: globalCategories, loading: globalCategoriesLoading } = useGlobalCategories();
  
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Draft Logic ---
  useEffect(() => {
    const savedDraft = localStorage.getItem('thread_draft_listing');
    if (savedDraft) {
      setShowDraftBanner(true);
    }
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
      setCollection(draft.collection || '');
    }
    setShowDraftBanner(false);
  };

  const handleSaveDraft = () => {
    const draft = {
      photos, productName, category, condition, description,
      price, originalPrice, sizeVariants, noSizes, singleQuantity,
      colours, isFeatured, collection
    };
    localStorage.setItem('thread_draft_listing', JSON.stringify(draft));
    showToast('Draft saved', 'success');
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('thread_draft_listing');
    setShowDraftBanner(false);
  };

  const isStepValid = (s: number) => {
    if (s === 1) {
      return productName.trim() !== '' && category !== '' && condition !== '' && price !== '';
    }
    if (s === 2) {
      return filledPhotosCount === 6;
    }
    if (s === 3) {
      return noSizes || sizeVariants.length > 0;
    }
    return true;
  };

  const validateStepToGo = (targetStep: number): boolean => {
    for (let s = 1; s < targetStep; s++) {
      if (!isStepValid(s)) return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!productName.trim() || !category || !condition || !price) {
        showToast('Please complete all required fields', 'error');
        setPublishAttempted(true);
        return;
      }
    } else if (step === 2) {
      if (filledPhotosCount < 6) {
        showToast('Please upload all 6 required photo perspectives', 'error');
        setPublishAttempted(true);
        return;
      }
    } else if (step === 3) {
      if (!noSizes && sizeVariants.length === 0) {
        showToast('Please register at least one size variant or select Universal Scale', 'error');
        return;
      }
    }
    
    if (step < 6) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleBack();
    }
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
        compare_price: originalPrice ? parseFloat(originalPrice) : undefined,
        category: category,
        condition: condition.toLowerCase().replace(' ', '_'),
        images: uploadedUrls,
        description: description,
        sizes: finalVariants,
        total_stock: finalVariants.reduce((sum, v) => sum + v.quantity, 0),
        is_published: true,
        is_featured: isFeatured,
        collection: collection.trim() || null
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
    <div className="flex flex-col min-h-screen bg-cream text-charcoal pb-32 overflow-x-hidden font-sans">
      {/* Immersive Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-0">
          <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-[#C6FF00]/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-1/4 left-0 w-[100vw] h-[100vw] bg-lime/10 blur-[200px] rounded-full -translate-x-1/2" />
      </div>

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-2xl border-b-2 border-charcoal/5">
        <div className="max-w-[430px] mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={handleBack} className="w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-charcoal active:scale-90 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/30 italic leading-none mb-1">New Intent</h1>
            <span className="text-sm font-display font-black uppercase tracking-tight italic">Curate Unit</span>
          </div>
          <button onClick={handleSaveDraft} className="text-[10px] font-black uppercase tracking-widest text-charcoal italic border-b-2 border-[#C6FF00] pb-0.5">
            Save Draft
          </button>
        </div>
        {/* Step Indicator Bubbles */}
        <div className="max-w-[430px] mx-auto px-6 py-3 bg-cream/90 backdrop-blur-md flex items-center justify-between border-t border-charcoal/5 gap-2 select-none">
          {[
            { n: 1, label: 'Details' },
            { n: 2, label: 'Gallery' },
            { n: 3, label: 'Sizing' },
            { n: 4, label: 'Colors' },
            { n: 5, label: 'Narrative' },
            { n: 6, label: 'Review' }
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => {
                if (s.n < step) {
                  setStep(s.n);
                } else if (validateStepToGo(s.n)) {
                  setStep(s.n);
                }
              }}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
            >
              <div className={`h-1.5 w-full rounded-full transition-all ${
                s.n === step 
                  ? 'bg-[#C6FF00] shadow-[0_0_8px_#C6FF00]' 
                  : s.n < step 
                    ? 'bg-charcoal' 
                    : 'bg-charcoal/10'
              }`} />
              <span className={`text-[8px] font-black uppercase tracking-tight transition-colors ${s.n === step ? 'text-charcoal' : 'text-charcoal/40 group-hover:text-charcoal/70'}`}>
                {s.label}
              </span>
            </button>
          ))}
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

        {/* Step 1: Details */}
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-10 relative z-10"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Metadata</h2>
                 <div className="h-px flex-1 bg-charcoal/10" />
              </div>
              <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Identity Core</h3>
            </div>

            {/* Name */}
            <div id="error-productName" className="flex flex-col gap-5">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic">Product Title</label>
                <div className="flex items-center gap-2">
                   <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${productName.trim() ? 'bg-[#C6FF00] shadow-[0_0_10px_rgba(244,166,193,0.8)]' : 'bg-charcoal/5'}`} />
                   <span className="text-[#C6FF00] text-xs font-black italic">*</span>
                </div>
              </div>
              <div className="relative group">
                <input 
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value.slice(0, 80))}
                  placeholder="Declare product name..."
                  className={`w-full bg-white border-2 rounded-[32px] px-8 py-6 text-xl font-display font-black italic tracking-tight text-charcoal placeholder:text-charcoal/10 focus:outline-none transition-all duration-500 ${
                    publishAttempted && !productName ? 'border-[#C6FF00]' : 'border-charcoal/5 focus:border-[#C6FF00]/40 focus:ring-8 focus:ring-[#C6FF00]/5'
                  }`}
                />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-end">
                  <span className="text-[10px] font-black text-charcoal/30 italic leading-none">{productName.length}/80</span>
                </div>
              </div>
              <FieldError message={publishAttempted && !productName ? 'Identity label unresolved' : null} />
            </div>

            {/* Category */}
            <div id="error-category" className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                 <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic">Classification</label>
                 <span className="text-[#C6FF00] text-xs font-black italic">*</span>
              </div>
              <div className={`flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-8 px-8 ${publishAttempted && !category ? 'animate-shake' : ''}`}>
                {globalCategoriesLoading ? (
                  <div className="py-4 text-center text-xs text-charcoal/40 uppercase tracking-widest font-bold">Loading...</div>
                ) : (
                  globalCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`relative w-44 h-24 rounded-[20px] overflow-hidden transition-all flex items-end p-4 border-2 flex-shrink-0 text-left ${
                        category === cat.name 
                          ? 'border-charcoal scale-105 shadow-md font-bold' 
                          : 'border-charcoal/10 hover:border-charcoal/35'
                      }`}
                    >
                      <div className="absolute inset-0 bg-black/55 z-10" />
                      {cat.cover_image_url && (
                        <img 
                          src={cat.cover_image_url} 
                          alt={cat.name} 
                          className="absolute inset-0 w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-widest z-20 relative ${category === cat.name ? 'text-[#C6FF00]' : 'text-white'}`}>
                        {cat.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <FieldError message={publishAttempted && !category ? 'Classification scope missing' : null} />
            </div>

            {/* Collection */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                 <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic">Collection Drop</label>
              </div>
              <div className="relative group">
                <input 
                  type="text"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value.slice(0, 50))}
                  placeholder="e.g. Corteiz RTW, Essentials 2026..."
                  className="w-full bg-white border-2 border-charcoal/5 rounded-[32px] px-8 py-6 text-xl font-display font-black italic tracking-tight text-charcoal placeholder:text-charcoal/10 focus:outline-none transition-all duration-500 focus:border-[#C6FF00]/40 focus:ring-8 focus:ring-[#C6FF00]/5 font-sans"
                />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-end">
                  <span className="text-[10px] font-black text-charcoal/30 italic leading-none">{collection.length}/50</span>
                </div>
              </div>
            </div>

            {/* Condition */}
            <div id="error-condition" className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic">Condition State</label>
                <span className="text-[#C6FF00] text-xs font-black italic">*</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {CONDITIONS.map(c => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCondition(c.label)}
                    className={`py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 italic ${
                      condition === c.label 
                        ? 'bg-charcoal border-charcoal text-white shadow-xl' 
                        : 'bg-white border-charcoal/5 text-charcoal/30 hover:border-charcoal/10'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {condition && (
                  <motion.div 
                    key={condition}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white border-2 border-charcoal/5 rounded-[40px] flex items-start gap-5 shadow-[8px_8px_0_rgba(0,0,0,0.02)]"
                  >
                     <div className="w-10 h-10 rounded-full bg-cream-dark flex items-center justify-center flex-shrink-0">
                        <Info size={16} className="text-charcoal/30" />
                     </div>
                     <p className="text-[11px] font-black text-charcoal/40 leading-relaxed italic uppercase tracking-widest">
                        {CONDITIONS.find(c => c.label === condition)?.desc}
                     </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pricing Section (Valuation) */}
            <div className="flex flex-col gap-10 mt-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-3">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Valuation</h2>
                   <div className="h-px flex-1 bg-charcoal/10" />
                </div>
                <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Market Value</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Listed Price */}
                <div id="error-price" className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic">Ask Price</label>
                    <span className="text-[#C6FF00] text-xs font-black italic">*</span>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-display font-black text-charcoal/10 italic">$</span>
                    <input 
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className={`w-full bg-white border-2 rounded-[32px] p-8 pl-16 text-2xl font-display font-black italic text-charcoal focus:outline-none transition-all duration-500 ${
                        publishAttempted && !price ? 'border-[#C6FF00]' : 'border-charcoal/5 focus:border-[#C6FF00]/40 focus:ring-8 focus:ring-[#C6FF00]/5'
                      }`}
                    />
                  </div>
                  <FieldError message={publishAttempted && !price ? 'Valuation required' : null} />
                </div>

                {/* Original Price */}
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic px-2">MSRP / Baseline</label>
                  <div className="relative group">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-display font-black text-charcoal/5 italic">$</span>
                    <input 
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white border-2 border-charcoal/5 rounded-[32px] p-8 pl-16 text-2xl font-display font-black italic text-charcoal/20 focus:outline-none focus:border-[#C6FF00]/40 focus:ring-8 focus:ring-[#C6FF00]/5 transition-all duration-700"
                    />
                  </div>
                </div>
              </div>

              {/* Price Feedback */}
              {(price || originalPrice) && (
                <div className="flex items-center justify-between p-8 bg-white rounded-[48px] border-2 border-charcoal/5 shadow-[12px_12px_0_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-6">
                    {price && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col"
                      >
                         <span className="text-[8px] font-black text-charcoal/20 uppercase tracking-widest italic leading-none mb-2">Quote Alpha</span>
                         <span className="text-4xl font-display font-black text-charcoal italic tracking-tight leading-none">${price}</span>
                      </motion.div>
                    )}
                    {discountPercent && (
                      <div className="px-5 py-2.5 bg-[#C6FF00] text-white text-[10px] font-black italic rounded-full shadow-[0_15px_30px_rgba(244,166,193,0.3)] uppercase tracking-widest">
                        {discountPercent}% OFF
                      </div>
                    )}
                  </div>
                  {originalPrice && price && parseFloat(originalPrice) < parseFloat(price) && (
                    <div className="flex items-center gap-3 text-red-500 px-5 py-2 bg-red-50 rounded-full border-2 border-red-100 italic">
                      <AlertCircle size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest italic leading-none">Inverted Logic Warning</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Priority Broadcaster / Shop Information */}
            <div className="flex flex-col gap-6 mt-6">
              <div 
                className={`p-10 rounded-[48px] border-4 transition-all duration-700 relative overflow-hidden group cursor-pointer ${isFeatured ? 'bg-charcoal border-lime shadow-[0_20px_40px_rgba(198,255,0,0.15)]' : 'bg-white border-charcoal/5 shadow-[12px_12px_0_rgba(0,0,0,0.02)]'}`} 
                onClick={() => setIsFeatured(!isFeatured)}
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
            </div>
          </motion.div>
        )}

        {/* Step 2: Gallery */}
        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8 relative z-10 animate-fade-in"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Perspective</h2>
                 <div className="h-px flex-1 bg-charcoal/10" />
              </div>
              <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8] mb-2">Digital Exhibit</h3>
              <p className="text-[11px] font-black text-[#C6FF00] uppercase tracking-widest italic">High-fidelity visual verification required</p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {PHOTO_SLOTS_CONFIG.map((slot, idx) => {
                const isMain = slot.id === 1;
                const preview = photos[idx];
                const hasError = photoErrors[idx];
                
                return (
                  <div 
                    key={slot.id}
                    className={`${isMain ? 'col-span-2 aspect-[4/3]' : 'aspect-square'} relative rounded-[48px] overflow-hidden transition-all duration-500 ${
                      hasError ? 'border-4 border-red-500 bg-red-50' :
                      !preview ? 'bg-white border-2 border-charcoal/5 group active:scale-95' : 'bg-white border-4 border-charcoal'
                    } ${publishAttempted && !preview && !hasError ? 'border-red-500 animate-shake shadow-[0_20px_40px_rgba(239,68,68,0.1)]' : 'shadow-[12px_12px_0_rgba(0,0,0,0.03)] hover:shadow-[12px_12px_0_rgba(0,0,0,0.06)]'}`}
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
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <AlertTriangle size={32} className="text-red-500" />
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">Signal Lost</span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRefs.current[idx]?.click();
                          }}
                          className="px-8 py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 active:scale-90 transition-all italic"
                        >
                          <RefreshCw size={12} strokeWidth={3} />
                          Retry
                        </button>
                      </div>
                    ) : preview ? (
                      <>
                        <img src={preview || undefined} alt={slot.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-80" />
                        
                        <div className="absolute top-6 left-6 flex flex-col items-start gap-1">
                           <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Exhibit</span>
                           <span className="oval-sticker !bg-charcoal !text-white !py-1 !px-2 !text-[8px] !shadow-none border-none">
                            0{slot.id}
                           </span>
                        </div>

                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                          className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white border-2 border-charcoal flex items-center justify-center text-charcoal active:scale-90 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)]"
                        >
                          <X size={20} strokeWidth={3} />
                        </button>

                        <div className="absolute bottom-8 left-8 flex flex-col gap-1">
                          <span className="text-xs font-black text-white uppercase tracking-[0.2em] italic leading-none">{slot.label}</span>
                          <div className="flex items-center gap-2 pt-2">
                             <div className="w-2.5 h-2.5 rounded-full bg-lime shadow-[0_0_12px_#C6FF00]" />
                             <span className="text-[10px] font-black text-lime uppercase tracking-widest italic">Verified</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative group cursor-pointer">
                        <div className="absolute top-8 left-8 text-[12px] font-black text-charcoal/5 italic leading-none">0{slot.id}</div>
                        <div className="w-20 h-20 rounded-full bg-cream-dark flex items-center justify-center text-charcoal/10 group-hover:bg-[#C6FF00]/20 group-hover:text-[#C6FF00] transition-all duration-700 border-2 border-charcoal/5 group-hover:border-[#C6FF00]/20">
                          <Plus size={isMain ? 40 : 32} strokeWidth={3} />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.4em] group-hover:text-charcoal transition-all italic leading-none">{slot.label}</span>
                          {isMain && <span className="italic-accent text-[10px] uppercase tracking-widest">Signature View</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-4 p-8 bg-white rounded-[48px] border-2 border-charcoal/5 shadow-[16px_16px_0_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/20 italic leading-none mb-2">Upload Progress</span>
                   <span className="text-xl font-display font-black text-charcoal italic tracking-tight leading-none">{filledPhotosCount} / 6 Authenticated</span>
                </div>
                <div className="flex gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={`upload-progress-dot-${i}`} className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${i < filledPhotosCount ? 'bg-[#C6FF00] shadow-[0_0_12px_rgba(244,166,193,0.5)] scale-125' : 'bg-charcoal/10 flex-shrink-0'}`} />
                  ))}
                </div>
              </div>
              {filledPhotosCount < 6 && (
                 <p className="text-[10px] font-black text-[#C6FF00] uppercase tracking-widest italic leading-none pt-2 border-t border-charcoal/5">Pending critical visual vectors</p>
              )}
            </div>

            {filledPhotosCount < 6 && (
              <div className="bg-elevated border-l-2 border-amber-500 p-4 rounded-r-xl flex flex-col gap-2 bg-white/50 border border-charcoal/5">
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
                    <li key={`photo-tip-${i}`} className="text-[11px] font-sans text-muted leading-tight flex gap-2">
                      <span className="text-amber-500/50">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Size Specifications */}
        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-10 relative z-10"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Logistics</h2>
                 <div className="h-px flex-1 bg-charcoal/10" />
              </div>
              <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Availability Index</h3>
            </div>

            {/* No Sizes Toggle */}
            <div className="flex items-center justify-between p-10 bg-white rounded-[48px] border-4 border-charcoal shadow-[12px_12px_0_rgba(0,0,0,0.05)] transition-all duration-500 group">
              <div className="flex flex-col gap-2">
                <span className="text-xl font-display font-black text-charcoal uppercase tracking-tighter italic leading-none">Universal Scale</span>
                <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.4em] italic mb-1">Accessories / One-Size Units</span>
              </div>
              <button 
                type="button"
                onClick={() => setNoSizes(!noSizes)}
                className={`w-20 h-10 rounded-full relative transition-all duration-700 overflow-hidden border-4 ${noSizes ? 'bg-lime border-charcoal' : 'bg-cream-dark border-charcoal/10'}`}
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
                    type="button"
                    onClick={() => setSingleQuantity(Math.max(1, singleQuantity - 1))}
                    className="w-20 h-20 rounded-[28px] bg-white border-4 border-charcoal flex items-center justify-center text-charcoal active:scale-90 transition-all hover:bg-cream-dark shadow-[6px_6px_0_rgba(0,0,0,1)]"
                  >
                    <Minus size={32} strokeWidth={4} />
                  </button>
                  <div className="flex-1 flex flex-col items-center">
                     <span className="text-7xl font-display font-black text-charcoal italic tracking-tighter leading-none">{singleQuantity}</span>
                     <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest mt-4 italic">Operational Range</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSingleQuantity(singleQuantity + 1)}
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
                      key={`size-variant-${idx}`}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-6 bg-white p-6 rounded-[32px] border-4 border-charcoal shadow-[10px_10px_0_rgba(0,0,0,0.03)] group"
                    >
                      <div className="flex-1 relative pl-4">
                        <input 
                          type="text"
                          value={v.size}
                          onChange={(e) => updateSizeVariant(idx, 'size', e.target.value)}
                          placeholder="Label (e.g. UK9)"
                          className="w-full bg-transparent text-xl font-display font-black text-charcoal uppercase tracking-tighter placeholder:text-charcoal/10 focus:outline-none italic"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-cream-dark rounded-full border-2 border-charcoal/5 p-1.5">
                        <button 
                          type="button"
                          onClick={() => updateSizeVariant(idx, 'quantity', Math.max(1, v.quantity - 1))}
                          className="w-12 h-12 rounded-full bg-white border-2 border-charcoal flex items-center justify-center text-charcoal active:scale-90 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)]"
                        >
                          <Minus size={18} strokeWidth={4} />
                        </button>
                        <span className="w-12 text-center font-display font-black text-charcoal text-xl italic">{v.quantity}</span>
                        <button 
                          type="button"
                          onClick={() => updateSizeVariant(idx, 'quantity', v.quantity + 1)}
                          className="w-12 h-12 rounded-full bg-charcoal text-cream flex items-center justify-center active:scale-90 transition-all shadow-[4px_4px_0_#C6FF00]"
                        >
                          <Plus size={18} strokeWidth={4} />
                        </button>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeSizeVariant(idx)} 
                        className="w-14 h-14 flex items-center justify-center text-charcoal/20 hover:text-[#C6FF00] transition-all active:scale-90"
                      >
                        <Trash2 size={24} strokeWidth={3} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                <button 
                  type="button"
                  onClick={addSizeVariant}
                  className="w-full h-20 rounded-[32px] bg-white border-4 border-dashed border-charcoal/10 flex items-center justify-center gap-5 text-charcoal/40 hover:bg-[#C6FF00]/5 hover:border-[#C6FF00]/40 transition-all active:scale-[0.98] group mt-4"
                >
                  <Plus size={28} strokeWidth={4} className="group-hover:rotate-90 transition-transform duration-700 text-[#C6FF00]" />
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
                      {(category === 'Sneakers' ? SNEAKER_SIZES : CLOTHING_SIZES).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSizeVariants([...sizeVariants, { size: s, quantity: 1 }])}
                          className="px-6 py-3 bg-white border-2 border-charcoal/10 rounded-2xl text-[10px] font-black text-charcoal/40 hover:text-charcoal hover:bg-cream-dark hover:border-charcoal/40 transition-all italic tracking-widest uppercase hover:translate-y-[-2px] shadow-sm"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-8 bg-charcoal rounded-[48px] shadow-[12px_12px_0_#C6FF00]">
              <div className="flex items-center gap-4">
                 <div className={`w-3 h-3 rounded-full ${totalStock > 0 ? 'bg-lime animate-pulse shadow-[0_0_12px_#C6FF00]' : 'bg-white/10'}`} />
                 <span className={`text-[12px] font-black uppercase tracking-widest italic transition-colors ${totalStock > 0 ? 'text-lime' : 'text-white/20'}`}>
                  Inventory Payload: {totalStock} units
                 </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Color Options */}
        {step === 4 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-10 relative z-10"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Spectrum</h2>
                 <div className="h-px flex-1 bg-charcoal/10" />
              </div>
              <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Color Mapping</h3>
            </div>

            <div className="flex flex-col gap-6">
              <AnimatePresence>
                {colours.map((c, idx) => (
                  <motion.div 
                    key={`colour-mapping-${idx}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-6 bg-white p-6 rounded-[32px] border-4 border-charcoal shadow-[10px_10px_0_rgba(0,0,0,0.03)] group"
                  >
                    <div className="flex-1 relative pl-4">
                      <input 
                        type="text"
                        value={c.name}
                        onChange={(e) => updateColour(idx, 'name', e.target.value)}
                        placeholder="Declaration (e.g. Noir)"
                        className="w-full bg-transparent text-xl font-display font-black text-charcoal uppercase tracking-tighter placeholder:text-charcoal/10 focus:outline-none italic"
                      />
                    </div>
                    <div className="relative w-16 h-16 rounded-[20px] overflow-hidden border-4 border-charcoal hover:scale-105 transition-all cursor-pointer shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
                      <input 
                        type="color"
                        value={c.hex}
                        onChange={(e) => updateColour(idx, 'hex', e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeColour(idx)} 
                      className="w-14 h-14 flex items-center justify-center text-charcoal/20 hover:text-[#C6FF00] transition-all active:scale-90"
                    >
                      <X size={24} strokeWidth={3} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {colours.length < 6 && (
                <button 
                  type="button"
                  onClick={addColour}
                  className="w-full h-20 rounded-[32px] bg-white border-4 border-dashed border-charcoal/10 flex items-center justify-center gap-5 text-charcoal/40 hover:bg-[#C6FF00]/5 hover:border-[#C6FF00]/40 transition-all active:scale-[0.98] group"
                >
                  <Plus size={28} strokeWidth={4} className="text-[#C6FF00] group-hover:rotate-180 transition-transform duration-700" />
                  <span className="text-[12px] font-black uppercase tracking-[0.3em] italic">Inject Hue Variant</span>
                </button>
              )}

              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {QUICK_COLOURS.map(qc => (
                  <button
                    key={qc.name}
                    type="button"
                    onClick={() => colours.length < 6 && setColours([...colours, qc])}
                    className="flex items-center gap-3 pl-2 pr-6 py-2.5 bg-white border-2 border-charcoal/5 rounded-full hover:bg-cream-dark hover:border-charcoal/20 transition-all active:scale-95 shadow-sm"
                  >
                    <div className="w-6 h-6 rounded-full border-2 border-charcoal/10" style={{ background: qc.hex }} />
                    <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em] italic">{qc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Description */}
        {step === 5 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-10 relative z-10"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Editorial</h2>
                 <div className="h-px flex-1 bg-charcoal/10" />
              </div>
              <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Narrative</h3>
            </div>

            <div className="flex flex-col gap-5">
              <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.4em] italic leading-none px-2">WhatsApp Narrative Description</label>
              <div className="relative group">
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 400))}
                  placeholder="Write a description that sells... (Sent to buyers on WhatsApp)"
                  className="w-full bg-white border-2 border-charcoal/5 rounded-[40px] p-8 text-sm font-medium text-charcoal/80 placeholder:text-charcoal/5 focus:outline-none focus:border-[#C6FF00]/40 focus:ring-8 focus:ring-[#C6FF00]/5 transition-all duration-700 h-56 resize-none italic leading-relaxed"
                />
                <div className="absolute bottom-8 right-10 flex flex-col items-end">
                  <span className="text-[10px] font-black text-charcoal/20 italic">{description.length}/400</span>
                </div>
              </div>
              <p className="text-[9px] font-black text-charcoal/15 italic uppercase tracking-[0.3em] leading-none text-center font-mono">Honest narratives accelerate conversion cycles</p>
            </div>
          </motion.div>
        )}

        {/* Step 6: Review Step */}
        {step === 6 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col gap-8 relative z-10"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/20 italic leading-none">Verification</h2>
                 <div className="h-px flex-1 bg-charcoal/10" />
              </div>
              <h3 className="text-5xl font-display font-black text-charcoal uppercase italic tracking-tight leading-[0.8]">Review Unit</h3>
              <p className="text-[11px] font-black text-[#C6FF00] uppercase tracking-widest italic font-mono">Verify all digital fragments before commit</p>
            </div>

            {/* Premium recap card */}
            <div className="bg-white border-4 border-charcoal rounded-[48px] p-8 space-y-6 shadow-[16px_16px_0_rgba(0,0,0,0.05)] text-left select-none">
              {/* Photo strip */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 border-b border-charcoal/5 -mx-4 px-4">
                {photos.map((p, i) => p && (
                  <div key={`review-img-${i}`} className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-charcoal shrink-0 shadow-sm bg-zinc-50">
                    <img src={p} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              <div className="space-y-4 font-sans">
                <div>
                  <span className="text-[9px] font-black text-charcoal/25 uppercase tracking-widest font-mono">Title</span>
                  <p className="text-xl font-display font-black text-charcoal italic tracking-tight leading-none mt-1">{productName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black text-charcoal/25 uppercase tracking-widest font-mono">Classification</span>
                    <p className="text-xs font-black text-charcoal uppercase tracking-wider mt-1">{category}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-charcoal/25 uppercase tracking-widest font-mono">Condition State</span>
                    <p className="text-xs font-black text-charcoal uppercase tracking-wider mt-1">{condition}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black text-charcoal/25 uppercase tracking-widest font-mono">Listed Price</span>
                    <p className="text-2xl font-display font-black text-charcoal italic leading-none mt-1">${price}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-charcoal/25 uppercase tracking-widest font-mono">Baseline / MSRP</span>
                    <p className="text-lg font-display font-black text-charcoal/25 italic leading-none mt-1">{originalPrice ? `$${originalPrice}` : 'None'}</p>
                  </div>
                </div>

                {collection && (
                  <div>
                    <span className="text-[9px] font-black text-charcoal/25 uppercase tracking-widest font-mono">Collection Drop</span>
                    <p className="text-xs font-black text-charcoal uppercase tracking-wider mt-1">{collection}</p>
                  </div>
                )}

                <div>
                  <span className="text-[9px] font-black text-charcoal/25 uppercase tracking-widest font-mono">Availability Inventory</span>
                  <p className="text-xs font-black text-charcoal uppercase tracking-wider mt-1">
                    {noSizes ? `One Size (${singleQuantity} Unit)` : `${sizeVariants.map(v => `${v.size} (Qty: ${v.quantity})`).join(', ')}`}
                  </p>
                </div>

                {colours.length > 0 && (
                  <div>
                    <span className="text-[9px] font-black text-charcoal/25 uppercase tracking-widest font-mono">Spectrum Hues</span>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {colours.map((c, i) => (
                        <div key={`review-col-${i}`} className="flex items-center gap-1.5 bg-zinc-50 border border-charcoal/10 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
                          <div className="w-3.5 h-3.5 rounded-full border border-charcoal/10" style={{ background: c.hex }} />
                          <span>{c.name || 'Custom'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {description && (
                  <div>
                    <span className="text-[9px] font-black text-charcoal/25 uppercase tracking-widest font-mono font-sans">WhatsApp Narrative Description</span>
                    <p className="text-xs text-charcoal/60 leading-relaxed italic bg-zinc-50/50 p-4 rounded-3xl border border-charcoal/5 mt-1">
                      {description}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-charcoal/5">
                  <span className="text-[9px] font-black text-charcoal/25 uppercase tracking-widest font-mono">Priority Broadcaster</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${isFeatured ? 'bg-[#C6FF00] text-black shadow-sm' : 'bg-zinc-100 text-zinc-400'}`}>
                    {isFeatured ? 'Activated' : 'Standard'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
          
      </div>

      {/* Sticky Publish Button */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-cream via-cream/95 to-transparent z-50">
        <div className="max-w-[430px] mx-auto flex flex-col gap-5">
          <div className="flex items-center justify-between transition-all duration-700 bg-white p-4 rounded-3xl border-2 border-charcoal/5 shadow-sm">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-charcoal/20 uppercase tracking-[0.4em] mb-1">Asset Verification</span>
                <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest italic leading-none">{filledPhotosCount} / 6 Units Valid</span>
             </div>
             <div className="flex gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={`validation-bar-${i}`} className={`w-1.5 h-4 rounded-full transition-all duration-500 ${i < filledPhotosCount ? 'bg-lime shadow-[0_0_10px_#C6FF00]' : 'bg-charcoal/5'}`} />
                ))}
             </div>
          </div>
          
          <div className="flex gap-4">
            {step > 1 && (
              <button 
                type="button"
                onClick={handlePrevStep}
                className="h-20 px-8 rounded-full bg-white border-4 border-charcoal text-charcoal font-display uppercase font-black italic flex items-center justify-center transition-all duration-300 active:scale-95 shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none shrink-0"
              >
                Back
              </button>
            )}

            {step < 6 ? (
              <button 
                type="button"
                onClick={handleNextStep}
                className="group relative flex-1 h-20 rounded-full bg-charcoal text-cream font-display uppercase font-black italic flex items-center justify-center gap-4 overflow-hidden transition-all duration-500 active:translate-y-1 active:shadow-none shadow-[8px_8px_0_#C6FF00] hover:shadow-[6px_6px_0_#C6FF00]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="text-xl tracking-tight relative z-10">Next Step</span>
                <ArrowRight size={24} strokeWidth={4} className="group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handlePublish}
                disabled={filledPhotosCount < 6 || isPublishing}
                className={`group relative flex-1 h-20 rounded-full flex items-center justify-center overflow-hidden transition-all duration-700 active:translate-y-1 active:shadow-none ${
                  filledPhotosCount < 6 
                    ? 'bg-white border-4 border-charcoal/10 text-charcoal/10 cursor-not-allowed opacity-50' 
                    : 'bg-charcoal text-cream shadow-[12px_12px_0_#C6FF00] active:shadow-none hover:shadow-[10px_10px_0_#C6FF00]'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="relative z-10 flex items-center justify-center gap-5">
                  {isPublishing ? (
                    <RefreshCw size={28} className="animate-spin text-lime" strokeWidth={4} />
                  ) : filledPhotosCount < 6 ? (
                    <>
                      <Lock size={24} className="opacity-40" strokeWidth={3} />
                      <span className="text-base font-display font-black uppercase tracking-[0.1em] italic">Signals Pending</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-display font-black uppercase italic tracking-tighter">Sync to Node</span>
                      <ArrowRight size={32} strokeWidth={4} className="group-hover:translate-x-3 transition-transform duration-700" />
                    </>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Discard Modal */}
      <AnimatePresence>
        {showDiscardModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-charcoal/90 backdrop-blur-xl"
              onClick={() => setShowDiscardModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-white border-4 border-charcoal rounded-[56px] p-12 w-full max-w-sm flex flex-col gap-10 text-center shadow-[20px_20px_0_rgba(0,0,0,0.1)]"
            >
              <div className="w-24 h-24 rounded-[36px] bg-red-50 flex items-center justify-center text-red-500 mx-auto border-4 border-charcoal shadow-[8px_8px_0_rgba(185,28,28,1)]">
                <AlertCircle size={48} strokeWidth={4} />
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tight leading-none">Purge Data?</h3>
                <p className="italic-accent text-[14px] text-charcoal/40 leading-tight">All curated modifications will be liquidated immediately. This protocol is terminal.</p>
              </div>
              <div className="flex flex-col gap-5">
                <button 
                  onClick={() => {
                    localStorage.removeItem('thread_draft_listing');
                    navigate(-1);
                  }}
                  className="w-full h-16 bg-red-500 text-white text-sm font-black uppercase tracking-[0.3em] rounded-full italic hover:translate-y-[-2px] transition-all shadow-[8px_8px_0_rgba(185,28,28,1)]"
                >
                  Purge Fragment
                </button>
                <button 
                  onClick={() => setShowDiscardModal(false)}
                  className="w-full h-16 bg-white border-4 border-charcoal text-charcoal text-sm font-black uppercase tracking-[0.3em] rounded-full italic hover:bg-cream-dark transition-all"
                >
                  Retain Content
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
            className="fixed inset-0 z-[200] bg-cream flex flex-col items-center justify-center p-10 text-center overflow-hidden"
          >
            {/* Immersive Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180vw] h-[180vw] bg-[#C6FF00]/5 blur-[200px] rounded-full animate-pulse" />
            </div>

            <motion.div 
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 80 }}
              className="w-40 h-40 rounded-[48px] bg-charcoal flex items-center justify-center text-lime shadow-[20px_20px_0_#C6FF00] mb-16 relative z-10 border-4 border-charcoal"
            >
              <Check size={80} strokeWidth={5} />
            </motion.div>

            <div className="relative z-10 flex flex-col items-center max-w-sm mb-20">
               <h2 className="text-7xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-[0.8] mb-6">Unit Logged.</h2>
               <div className="oval-sticker !bg-[#C6FF00] !text-white !text-xl mb-4">{productName}</div>
               <p className="text-[12px] font-black text-charcoal/30 tracking-[0.4em] uppercase italic leading-tight text-center px-10">Data committed to global inventory node successfully.</p>
            </div>

            <div className="flex flex-col gap-5 w-full max-w-xs relative z-10">
              <button 
                onClick={() => navigate(`/product/${createdProductId || ''}`)}
                className="w-full h-20 bg-charcoal text-cream text-lg font-display font-black uppercase italic tracking-[0.2em] rounded-full shadow-[12px_12px_0_#C6FF00] active:translate-y-1 active:shadow-none transition-all"
              >
                Inspect Listing
              </button>
              <button 
                onClick={() => navigate('/shop-centre')}
                className="w-full h-20 bg-white border-4 border-charcoal text-charcoal text-sm font-black uppercase tracking-[0.3em] rounded-full italic hover:bg-cream-dark transition-all"
              >
                Return to Hub
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
