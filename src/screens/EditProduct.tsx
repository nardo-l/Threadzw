import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ArrowLeft, Plus, Trash2, Camera, Sparkles, Check, ChevronRight, Loader2, ChevronDown, Search, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { uploadImage } from '../utils/uploadImage';
import { getShopUrl } from '../utils/shopUrl';
import { useGlobalCategories } from '../hooks/useGlobalCategories';
import { getSizesForCategory } from '../utils/sizes';
import { cropToSquare, enhanceLighting, compressAndOptimize } from '../utils/imageEnhancer';

interface SizeStock {
  active: boolean;
  stock: number;
}

export const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = id;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Global Categories
  const { categories: globalCategories, loading: globalCategoriesLoading } = useGlobalCategories();

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopHandle, setShopHandle] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [productStatus, setProductStatus] = useState<'active' | 'sold_out'>('active');
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleGenerateAIDescription = async () => {
    if (!name) {
      toast.error('Please enter a product name first!');
      return;
    }
    setAiGenerating(true);
    const toastId = toast.loading('Generating AI description...');
    try {
      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          category: loadedCategory || 'Apparel',
          price: price || '0.00'
        })
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description.substring(0, 300));
      }
      toast.success('Generated with Gemini AI! Review and edit before saving.', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate description with AI.', { id: toastId });
    } finally {
      setAiGenerating(false);
    }
  };

  // SCREEN 1: Photos State
  const [images, setImages] = useState<string[]>([]);

  // SCREEN 2: Basic Info
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedTag, setSelectedTag] = useState('None');

  // SCREEN 3: Sizes & Availability
  const [loadedCategory, setLoadedCategory] = useState<string>('Clothing');
  const [activeSizeEditing, setActiveSizeEditing] = useState<string | null>(null);
  const [tempStockInput, setTempStockInput] = useState('');
  const [showCustomSizeInput, setShowCustomSizeInput] = useState(false);
  const [customSizeName, setCustomSizeName] = useState('');
  const [sizeStock, setSizeStock] = useState<Record<string, SizeStock>>({});
  const [generalStock, setGeneralStock] = useState('10');

  // Colors optional State
  const swatches = ['⚫', '⚪', '🟤', '🔴', '🔵', '🟡', '🟢'];
  const swatchToName: Record<string, string> = {
    '⚫': 'Midnight Black',
    '⚪': 'Sail White',
    '🟤': 'Earth Brown',
    '🔴': 'Crimson Red',
    '🔵': 'Cobalt Blue',
    '🟡': 'Sun Yellow',
    '🟢': 'Forest Green',
  };
  const [selectedColors, setSelectedColors] = useState<string[]>(['Midnight Black']);
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  const [customColorText, setCustomColorText] = useState('');

  const handleAddCustomColor = () => {
    const trimmed = customColorText.trim();
    if (trimmed && !selectedColors.includes(trimmed)) {
      setSelectedColors([...selectedColors, trimmed]);
    }
    setCustomColorText('');
    setShowCustomColorInput(false);
  };

  // Visibility toggle
  const [isVisible, setIsVisible] = useState(true);

  // SCREEN 4: Description & Publish
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Load product & shop details
  useEffect(() => {
    const fetchProductAndShop = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Session expired. Please sign in again.');
          navigate('/login');
          return;
        }

        // Get user shop data
        let shop = null;
        try {
          const { data } = await supabase
            .from('shops')
            .select('id, handle')
            .eq('owner_id', session.user.id).order('created_at', { ascending: false }).limit(1)
            .maybeSingle();
          if (data) shop = data;
        } catch (e) {
          console.warn("EditProduct database shop query failed:", e);
        }

        if (!shop) {
          throw new Error('Merchant shop not found in Supabase. Please complete your shop setup first.');
        }

        setShopId(shop.id);
        setShopHandle(shop.slug || '');

        // Fetch product info matching product ID and shop ID
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('shop_id', shop.id)
          .single();

        if (error || !product) {
          throw new Error('Listing records mismatch or missing.');
        }

        // Populating state settings
        setName(product.name || '');
        setPrice(product.price ? product.price.toString() : '');
        setDescription(product.description || '');
        setImages(product.images || []);
        setIsFeatured(product.is_featured || false);
        setIsVisible(product.is_published ?? true);
        setProductStatus(product.status || 'active');

        // Pre-populate sizes
        const categoryName = product.category || 'Clothing';
        setLoadedCategory(categoryName);
        const hasSizes = getSizesForCategory(categoryName) !== null;

        if (product.sizes && Array.isArray(product.sizes)) {
          const updatedSizeStock: Record<string, SizeStock> = {};
          
          product.sizes.forEach((s: any) => {
            if (s && s.size) {
              updatedSizeStock[s.size] = {
                active: true,
                stock: s.quantity ?? 10
              };
            }
          });

          setSizeStock(updatedSizeStock);

          // If it's a non-sized product, pre-populate generalStock with the first quantity found
          if (!hasSizes) {
            const firstSize = product.sizes[0];
            if (firstSize) {
              setGeneralStock(String(firstSize.quantity ?? 10));
            }
          }
        }

        // Pre-populate colours swatches selection
        if (product.colours && Array.isArray(product.colours)) {
          setSelectedColors(product.colours.filter((c: any) => typeof c === 'string' && c.trim() !== ''));
        }

        // Match optional product tags representation
        if (product.status === 'sold_out') {
          setSelectedTag('None'); // default
        }

      } catch (err: any) {
        console.error(err);
        toast.error('Failed to load item context: ' + err.message);
        navigate('/inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndShop();
  }, [productId]);

  // Upload actions handles
  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 6) {
      toast.error('Maximum of 6 photos allowed.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    const toastId = toast.loading('Uploading catalog photo drop...');
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`"${file.name}" exceeds max size of 5MB.`);
          continue;
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`"${file.name}" format not supported. Please use JPG, PNG, or WebP.`);
          continue;
        }

        const publicUrl = await uploadImage({
          supabase,
          file,
          bucket: 'product-images',
          folder: 'product',
          userId: shopId || 'unknown'
        });

        setImages(prev => [...prev, publicUrl]);
      }
      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('Photos added!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Upload failed: ' + err.message, { id: toastId });
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplacePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingIndex === null) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image exceeds maximum size of 5MB.');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format not supported. Please use JPG, PNG, or WebP.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    const toastId = toast.loading('Replacing photo in secure storage...');
    try {
      const publicUrl = await uploadImage({
        supabase,
        file,
        bucket: 'product-images',
        folder: 'product',
        userId: shopId || 'unknown'
      });

      setImages(prev => {
        const copy = [...prev];
        copy[replacingIndex] = publicUrl;
        return copy;
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('Photo replaced successfully!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Replacement failed: ' + err.message, { id: toastId });
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      setReplacingIndex(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  // Drag and drop sorting
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (sourceIndexStr === '') return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex) return;

    const reordered = [...images];
    const temp = reordered[sourceIndex];
    reordered[sourceIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setImages(reordered);
  };

  const handleRemovePhoto = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Photo removed.');
  };

  // Sizing adjustments
  const handleConfirmStock = () => {
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

    // Save the size
    setSizeStock(prev => ({
      ...prev,
      [activeSizeEditing]: { active: true, stock: qty }
    }));

    // Clear and return focus
    setActiveSizeEditing(null);
    setTempStockInput('');
  };

  const handleRemoveSize = (sz: string) => {
    setSizeStock(prev => {
      const copy = { ...prev };
      delete copy[sz];
      return copy;
    });
    toast.success(`Removed size ${sz}.`);
  };

  const handleAddCustomSizeName = () => {
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

  // Navigation handlers
  const goNext = () => {
    if (step === 1 && images.length === 0) return;
    if (step === 2 && (!name || !price)) return;
    
    if (step === 3) {
      const hasSizes = getSizesForCategory(loadedCategory) !== null;
      if (hasSizes) {
        const activeSizes = Object.values(sizeStock).filter(s => s.active);
        const hasStock = activeSizes.some(s => s.stock > 0);
        if (!hasStock) {
          toast.error('Please add stock (at least 1 size with stock > 0)');
          return;
        }
      } else {
        if (!generalStock.trim() || isNaN(parseInt(generalStock)) || parseInt(generalStock) < 0) {
          toast.error('Please provide a valid stock level.');
          return;
        }
      }
    }

    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(1, s - 1));
  };

  // Update Database parameters on save
  const handleSaveChanges = async () => {
    if (!name || !price || images.length === 0) {
      toast.error('Required product components missing.');
      return;
    }

    setSaving(true);
    const saveToastHandle = toast.loading('Syncing listing modifications to database...');
    try {
      const hasSizes = getSizesForCategory(loadedCategory) !== null;
      let configuredSizes = [];

      if (hasSizes) {
        configuredSizes = Object.entries(sizeStock)
          .filter(([_, data]) => data.active)
          .map(([size, data]) => ({
            size,
            quantity: data.stock
          }));
      } else {
        const qty = parseInt(generalStock) || 10;
        configuredSizes = [{ size: 'One Size', quantity: qty }];
      }

      const totalStock = configuredSizes.reduce((total, s) => total + s.quantity, 0);

      const { data: { session } } = await supabase.auth.getSession();
      const ownerId = session?.user?.id;
      
      let currentShopId = shopId;
      if (!currentShopId && ownerId) {
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (shop) currentShopId = shop.id;
      }

      const updatePayload: any = {
        name: name.trim(),
        price: parseFloat(price),
        category: loadedCategory || null,
        description: description.trim() || null,
        images: images,
        image_url: images[0] || null,
        sizes: configuredSizes,
        stock: totalStock,
        total_stock: totalStock,
        colours: selectedColors,
        is_published: isVisible,
        status: productStatus,
        is_featured: isFeatured,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', productId)
        .eq('shop_id', currentShopId);

      if (updateError) throw updateError;

      // Safe update database inventory tables for resilience
      try {
        for (const size of configuredSizes) {
          await supabase
            .from('inventory')
            .upsert({
              product_id: productId,
              size: size.size,
              stock_count: size.quantity
            });
        }
      } catch (err) {
        console.log('Synchronized inventory parameters into inline JSONB formats.');
      }

      toast.success('Changes saved successfully! ✓', { id: saveToastHandle });
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      toast.error('Saving process rejected. ' + (err.message || 'Please test again.'), { id: saveToastHandle });
    } finally {
      setSaving(false);
    }
  };

  // Validate state
  const isScreen1Valid = images.length > 0;
  const isScreen2Valid = name.trim() !== '' && price.trim() !== '';
  const isScreen3Valid = getSizesForCategory(loadedCategory) !== null
    ? Object.values(sizeStock).some(s => s.active && s.stock > 0)
    : (generalStock.trim() !== '' && !isNaN(parseInt(generalStock)) && parseInt(generalStock) >= 0);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100vw' : '-100vw',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100vw' : '-100vw',
      opacity: 0
    })
  };

  const tagOptions = ['New Drop', 'Best Seller', 'Limited', 'None'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-10 h-10 text-[#bef715] animate-spin" />
        <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase animate-pulse font-black">
          Fetching listing context...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-y-auto select-none relative flex flex-col justify-between">
      
      {/* 3px Neon Progress Bar at topmost */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/10 z-50">
        <div 
          className="h-full bg-[#bef715] transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* CORE HEADER */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.08] bg-[#0a0a0a] z-40 relative font-sans">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button 
              type="button"
              onClick={goBack}
              className="p-2 -ml-2 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <span className="text-white text-[11px] font-extrabold tracking-[2px] uppercase font-mono">
            EDITING PRODUCT
          </span>
        </div>

        {step === 1 ? (
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        ) : (
          <span className="text-white/60 text-[10px] font-mono tracking-widest font-black uppercase">
            Step {step} of 4
          </span>
        )}
      </div>

      {/* STEP ENGINE INJECTS */}
      <div className="flex-1 w-full max-w-md mx-auto px-5 pt-4 pb-24 flex flex-col justify-start relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {!isSuccess ? (
            <motion.div
              key={`edit-step-${step}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full flex-1 flex flex-col justify-between text-left"
            >
              
              {/* SCREEN 1: IMAGES */}
              {step === 1 && (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-white">Add photos.</h1>
                    <p className="text-white/50 text-[13px]">Show every angle.</p>
                  </div>

                  {/* Photo 3x2 grid */}
                  <div className="grid grid-cols-3 gap-3.5 my-auto">
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const img = images[index];
                      const isCover = index === 0;

                      return (
                        <div 
                          key={`photo-slot-${index}`}
                          draggable={!!img}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, index)}
                          className="aspect-square relative group"
                        >
                          {img ? (
                            <div className="w-full h-full relative rounded-xl overflow-hidden border border-white/10">
                              <img src={img} className="w-full h-full object-cover" alt="" />
                              <div className="absolute top-1 right-1 flex gap-1 z-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplacingIndex(index);
                                    setTimeout(() => {
                                      replaceFileInputRef.current?.click();
                                    }, 50);
                                  }}
                                  className="w-5 h-5 rounded-[4px] bg-black/85 hover:bg-[#bef715] text-white hover:text-black transition-colors flex items-center justify-center cursor-pointer"
                                  title="Replace photo"
                                >
                                  <RefreshCw size={10} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(index)}
                                  className="w-5 h-5 rounded-[4px] bg-black/85 hover:bg-red-600 text-white transition-colors flex items-center justify-center text-[10px] font-bold cursor-pointer"
                                  title="Remove photo"
                                >
                                  ×
                                </button>
                              </div>
                              {isCover && (
                                <div className="absolute bottom-1 left-1.5 right-1.5 bg-black/80 backdrop-blur-xs py-0.5 rounded text-center text-[8px] uppercase tracking-wider text-[#bef715] font-black pointer-events-none">
                                  Cover
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={triggerFilePicker}
                              disabled={uploading}
                              className="w-full h-full bg-white/[0.04] border-[1.5px] border-dashed border-white/[0.15] hover:border-[#bef715]/40 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-white/[0.06] active:scale-[0.97]"
                            >
                              <Plus size={24} className="text-white/30" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {uploading && (
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-2 font-mono">
                      <div className="flex justify-between text-[10px] font-black text-[#bef715]">
                        <span className="uppercase tracking-wider">Syncing secure assets...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#bef715] h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <span className="text-[12px] text-white/35 font-medium leading-none inline-flex items-center gap-1.5 justify-center">
                      📸 First photo is your cover image
                    </span>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFilesSelected} 
                    className="hidden" 
                  />

                  <input 
                    type="file" 
                    ref={replaceFileInputRef} 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleReplacePhotoSelected} 
                    className="hidden" 
                  />

                  {/* BOTTOM ACTION CTA */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!isScreen1Valid || uploading}
                      onClick={goNext}
                      className="w-full h-12 rounded-[10px] bg-[#bef715] disabled:bg-neutral-800 text-black disabled:text-zinc-500 font-extrabold text-[15px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] hover:bg-[#a9db10]"
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <ChevronRight size={16} strokeWidth={3} />
                        </>
                      )}
                    </button>
                    {isCoverPhotoLabel(images)}
                  </div>
                </div>
              )}

              {/* SCREEN 2: PRODUCT INFO */}
              {step === 2 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-white">Product details.</h1>
                  </div>

                  {/* Fields lists */}
                  <div className="space-y-5 flex-1 flex flex-col justify-center">
                    
                    {/* Name input */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 block">
                        Name
                      </label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Cargo Pants"
                        className="w-full text-lg font-bold bg-white border-[1.5px] border-white/10 focus:border-[#bef715] rounded-[10px] px-4 py-3.5 text-zinc-950 placeholder-zinc-400 outline-none focus:outline-none transition-all"
                      />
                    </div>

                    {/* Price input */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 block">
                        Price
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 font-black text-xl text-zinc-400 select-none">$</span>
                        <input 
                          type="number" 
                          inputMode="decimal"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0"
                          className="w-full text-xl font-black bg-white border-[1.5px] border-white/10 focus:border-[#bef715] rounded-[10px] pl-10 pr-4 py-3.5 text-zinc-950 placeholder-zinc-400 outline-none focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Tag Optional Selector */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 block">
                        Tag (optional)
                      </label>
                      <div className="flex gap-2">
                        {tagOptions.map((tg) => {
                          const isSelected = selectedTag === tg;
                          return (
                            <button
                              key={`tag-pill-${tg}`}
                              type="button"
                              onClick={() => setSelectedTag(tg)}
                              className={`flex-1 text-[13px] font-bold py-2 border rounded-[8px] text-center transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-[#bef715]/10 border-[#bef715] text-[#bef715]' 
                                  : 'bg-white/[0.05] border-white/10 text-white/50 hover:text-white'
                              }`}
                            >
                              {tg}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM CTA */}
                  <button
                    type="button"
                    disabled={!isScreen2Valid}
                    onClick={goNext}
                    className="w-full h-12 rounded-[10px] bg-[#bef715] disabled:bg-neutral-800 text-black disabled:text-zinc-500 font-extrabold text-[15px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] hover:bg-[#a9db10]"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} strokeWidth={3} />
                  </button>
                </div>
              )}

              {/* SCREEN 3: SIZES & STOCK GRID */}
              {step === 3 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-white">Sizes & stock.</h1>
                    <p className="text-white/50 text-[13px]">Configure quantities for sizes of {loadedCategory}.</p>
                  </div>

                  {/* Size selection block */}
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    {!getSizesForCategory(loadedCategory) ? (
                      <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl flex flex-col gap-2 relative">
                        <span className="text-[14px] font-extrabold text-white">Stock Quantity</span>
                        <p className="text-white/45 text-[11px] leading-tight">This is a One-size product. Set the total stock quantity below.</p>
                        <div className="flex items-center gap-3 mt-1.5 font-sans">
                          <span className="font-mono text-xs text-white/55">Stock Qty:</span>
                          <input
                            type="number"
                            min={0}
                            value={generalStock}
                            onChange={(e) => setGeneralStock(e.target.value)}
                            className="w-20 h-9 rounded-lg bg-black border border-zinc-800 text-white font-extrabold text-[15px] text-center focus:outline-none focus:ring-1 focus:ring-[#bef715]"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Selected variant chips (similar to colors) */}
                        {Object.entries(sizeStock).filter(([_, v]) => v.active).length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase tracking-[1.5px] text-white/40 font-bold block">Configured Sizes:</span>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(sizeStock)
                                .filter(([_, v]) => v.active)
                                .map(([sz, v]) => (
                                  <div
                                    key={`selected-size-chip-${sz}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#bef715] text-black font-extrabold rounded-full text-xs font-sans shadow-sm"
                                  >
                                    <span>{sz} • {v.stock}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSize(sz)}
                                      className="text-black/60 hover:text-black font-black cursor-pointer text-[11px] p-0.5"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Available Sizes title & Horizontally scrollable row of size chips */}
                        <div className="space-y-2">
                          <span className="text-[11px] uppercase tracking-[1.5px] text-[#bef715] font-bold block">
                            Available Sizes ({loadedCategory})
                          </span>
                          
                          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar scroll-smooth">
                            {getSizesForCategory(loadedCategory)?.map((sz) => {
                              const isActive = sizeStock[sz]?.active;
                              const isEditing = activeSizeEditing === sz;
                              return (
                                <button
                                  key={`avail-size-chip-${sz}`}
                                  type="button"
                                  onClick={() => {
                                    setActiveSizeEditing(sz);
                                    setTempStockInput(sizeStock[sz]?.active ? String(sizeStock[sz].stock) : '15');
                                  }}
                                  className={`flex-shrink-0 min-w-12 h-12 rounded-xl border flex items-center justify-center font-extrabold text-sm transition-all relative ${
                                    isEditing 
                                      ? 'border-[#bef715] bg-[#bef715]/10 text-[#bef715] scale-95'
                                      : isActive 
                                        ? 'border-[#bef715] bg-zinc-900 text-[#bef715]' 
                                        : 'border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white'
                                  }`}
                                >
                                  {sz}
                                </button>
                              );
                            })}

                            {/* Trigger Custom Size Input */}
                            <button
                              type="button"
                              onClick={() => setShowCustomSizeInput(true)}
                              className="flex-shrink-0 px-4 h-12 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-transparent text-white/60 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Plus size={13} />
                              Custom Size
                            </button>
                          </div>
                        </div>

                        {/* Custom Size Dialog Input inside workflow */}
                        {showCustomSizeInput && (
                          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3 font-sans">
                            <span className="text-[12px] font-extrabold text-[#bef715] uppercase block">Add Custom Size</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={customSizeName}
                                onChange={(e) => setCustomSizeName(e.target.value)}
                                placeholder="e.g. XXL, US 12, EU 46"
                                className="flex-1 text-xs bg-black text-white font-bold border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-[#bef715] placeholder:text-zinc-600"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomSizeName();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomSizeName}
                                className="bg-[#bef715] text-black text-xs font-black px-4 py-2 rounded-lg hover:opacity-90"
                              >
                                Add
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowCustomSizeInput(false)}
                              className="text-[10px] text-white/40 hover:text-white/60 underline uppercase"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Stock Quantity Input for chosen size */}
                        {activeSizeEditing && (
                          <div className="p-4 bg-zinc-900 border border-[#bef715]/30 rounded-xl space-y-3 font-sans">
                            <div className="flex justify-between items-center">
                              <span className="text-[13px] font-black text-white">
                                Enter Stock Quantity for <span className="text-[#bef715] font-black">{activeSizeEditing}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveSizeEditing(null)}
                                className="text-white/40 hover:text-white text-xs"
                              >
                                Close
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min={1}
                                value={tempStockInput}
                                onChange={(e) => setTempStockInput(e.target.value)}
                                className="w-24 h-10 rounded-lg bg-black border border-zinc-800 text-white font-extrabold text-[16px] text-center focus:outline-none focus:border-[#bef715]"
                                placeholder="15"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleConfirmStock();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleConfirmStock}
                                className="h-10 bg-[#bef715] text-black text-xs font-black px-5 rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5"
                              >
                                <Check size={14} strokeWidth={3} />
                                Confirm
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Colors swatches */}
                    <div className="space-y-4 pt-1">
                      <div>
                        <label className="text-[11.5px] font-bold uppercase tracking-[1.5px] text-[#bef715] block mb-2 font-sans">
                          Colours selection (Tap to toggle)
                        </label>
                        <div className="flex flex-wrap gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          {swatches.map((sw) => {
                            const swatchName = swatchToName[sw];
                            const isSelected = selectedColors.includes(swatchName);
                            return (
                              <button
                                key={`swatch-${sw}`}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedColors(selectedColors.filter(c => c !== swatchName));
                                  } else {
                                    setSelectedColors([...selectedColors, swatchName]);
                                  }
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all relative cursor-pointer ${
                                  isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]' : 'opacity-60 hover:opacity-100'
                                }`}
                                title={swatchName}
                              >
                                {sw}
                              </button>
                            );
                          })}

                          {/* Custom Color Add Trigger */}
                          <button
                            type="button"
                            onClick={() => setShowCustomColorInput(true)}
                            className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/10 text-white font-heavy border border-white/20 flex items-center justify-center cursor-pointer transition-all"
                            title="Add Custom Color"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {showCustomColorInput && (
                        <div className="flex gap-2 animate-none">
                          <input
                            type="text"
                            value={customColorText}
                            onChange={(e) => setCustomColorText(e.target.value)}
                            placeholder="Type custom colour name (e.g. Acid Lime)..."
                            className="flex-grow text-[13px] font-medium bg-black border border-[#bef715]/40 focus:border-[#bef715] rounded-lg px-3.5 py-2.5 text-white placeholder-zinc-500 outline-none outline-0"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomColor}
                            className="px-4 bg-[#bef715] text-black font-extrabold text-xs uppercase rounded-lg hover:opacity-90 cursor-pointer font-sans"
                          >
                            Add
                          </button>
                        </div>
                      )}

                      {/* Active Color Palette tags display */}
                      {selectedColors.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-[1px] text-white/30 font-bold block">Active Palette:</span>
                          <div className="flex flex-wrap gap-1.5 font-sans">
                            {selectedColors.map((colName) => (
                              <div
                                key={`active-col-${colName}`}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#bef715]/10 border border-[#bef715]/20 text-[#bef715] rounded-full text-xs font-semibold"
                              >
                                <span>{colName}</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedColors(selectedColors.filter(c => c !== colName))}
                                  className="text-white/40 hover:text-white font-bold cursor-pointer text-[10px]"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Visibility toggle option */}
                    <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl font-sans">
                      <div className="space-y-0.5">
                        <span className="text-[13px] font-bold text-white block">Show on storefront</span>
                        <p className="text-white/35 text-[11px] leading-tight">Customers can see this product</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsVisible(!isVisible)}
                        className={`w-12 h-6.5 rounded-lg border flex items-center p-0.5 transition-all cursor-pointer ${
                          isVisible ? 'bg-[#bef715] border-[#bef715]' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div 
                          className={`w-5.5 h-5 rounded-[6px] transition-all bg-black ${
                            isVisible ? 'translate-x-5.5' : 'translate-x-0 bg-white/20'
                          }`}
                        />
                      </button>
                    </div>

                  </div>

                  {/* BOTTOM CTA */}
                  <button
                    type="button"
                    disabled={!isScreen3Valid}
                    onClick={goNext}
                    className="w-full h-12 rounded-[10px] bg-[#bef715] disabled:bg-neutral-800 text-black disabled:text-zinc-500 font-extrabold text-[15px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] hover:bg-[#a9db10]"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} strokeWidth={3} />
                  </button>

                </div>
              )}

              {/* SCREEN 4: DESCRIPTION & SAVE */}
              {step === 4 && (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-white">Final touches.</h1>
                  </div>

                  {/* Dynamic Real-Time storefront preview card */}
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden h-[130px] flex">
                    <div className="w-[40%] bg-neutral-900 border-r border-white/[0.05] relative overflow-hidden flex items-center justify-center">
                      {images[0] ? (
                        <img src={images[0]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-[10px] text-white/20 uppercase font-black tracking-widest leading-none">
                          No Photo
                        </span>
                      )}
                      
                      {selectedTag !== 'None' && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/85 border border-white/10 rounded text-[7px] font-black uppercase tracking-wider text-[#bef715]">
                          {selectedTag}
                        </div>
                      )}
                    </div>

                    <div className="w-[60%] p-3.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-extrabold text-[14px] leading-tight line-clamp-1 text-white">
                            {name || 'Product name'}
                          </h4>
                        </div>
                        <p className="text-[#bef715] font-black text-[16px] leading-none">
                          ${parseFloat(price) ? parseFloat(price) : '0'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 overflow-hidden">
                        {Object.entries(sizeStock)
                          .filter(([_, data]) => data.active)
                          .map(([sz]) => (
                            <span 
                              key={`chip-${sz}`} 
                              className="text-[9px] font-black uppercase px-2 py-0.5 bg-white/5 border border-white/10 text-white rounded-[6px]"
                            >
                              {sz}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Description input */}
                  <div className="space-y-2 animate-none">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 block">
                          Description (optional)
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateAIDescription}
                          disabled={aiGenerating}
                          className="px-2.5 py-1 bg-[#bef715]/20 hover:bg-[#bef715]/30 text-[#bef715] font-sans text-[10px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-[#bef715]/30"
                        >
                          <Sparkles size={11} className={aiGenerating ? 'animate-spin' : ''} />
                          {aiGenerating ? 'Generating...' : 'Auto-Generate with AI'}
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-white/30 font-bold leading-none">
                        {description.length}/300
                      </span>
                    </div>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value.substring(0, 300))}
                      rows={3}
                      placeholder="Describe the material, fit, or styling tips..."
                      className="w-full text-sm bg-white border-[1.5px] border-white/10 focus:border-[#bef715] rounded-[10px] p-3.5 text-zinc-950 placeholder-zinc-400 outline-none focus:outline-none transition-all leading-normal resize-none font-semibold"
                    />
                  </div>

                  {/* Featured toggle option */}
                  <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl pb-3.5 font-sans">
                    <div className="space-y-0.5">
                      <span className="text-[13px] font-bold text-white block">⭐ Feature this product</span>
                      <p className="text-white/35 text-[11px] leading-tight">Shows at top of your storefront</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFeatured(!isFeatured)}
                      className={`w-12 h-6.5 rounded-lg border flex items-center p-0.5 transition-all cursor-pointer ${
                        isFeatured ? 'bg-[#bef715] border-[#bef715]' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div 
                        className={`w-5.5 h-5 rounded-[6px] transition-all bg-black ${
                          isFeatured ? 'translate-x-5.5' : 'translate-x-0 bg-white/20'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Product Availability Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl pb-3.5 font-sans">
                    <div className="space-y-0.5">
                      <span className="text-[13px] font-bold text-white block">✅ Mark as Available</span>
                      <p className="text-white/35 text-[11px] leading-tight">Disable this to set item as Sold Out</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductStatus(productStatus === 'active' ? 'sold_out' : 'active')}
                      className={`w-12 h-6.5 rounded-lg border flex items-center p-0.5 transition-all cursor-pointer ${
                        productStatus === 'active' ? 'bg-[#bef715] border-[#bef715]' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div 
                        className={`w-5.5 h-5 rounded-[6px] transition-all bg-black ${
                          productStatus === 'active' ? 'translate-x-5.5' : 'translate-x-0 bg-white/20'
                        }`}
                      />
                    </button>
                  </div>

                  {/* ACTION CTA BLOCK */}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveChanges}
                    className="w-full min-h-[52px] h-[52px] rounded-[10px] bg-[#bef715] text-black font-extrabold text-[16px] uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-[0_8px_24px_rgba(190, 247, 21,0.25)] pt-1 hover:bg-[#a9db10]"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-black" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Changes ✓</span>
                      </>
                    )}
                  </button>

                </div>
              )}

            </motion.div>
          ) : (
            
            // SUCCESS REDIRECT STATE
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="w-full flex-1 flex flex-col justify-between py-6 text-center font-sans"
            >
              <div className="space-y-6 flex-grow flex flex-col items-center justify-center">
                
                {/* Scale checkmark success */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.1, 1] }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="w-[100px] h-[100px] rounded-full border-2 border-[#bef715] bg-[#bef715]/10 flex items-center justify-center text-[#bef715]"
                >
                  <Check size={48} className="stroke-[3]" />
                </motion.div>

                <div className="space-y-1.5">
                  <h1 className="text-3xl font-black italic tracking-wide text-white uppercase leading-none">
                    Changes saved! ✓
                  </h1>
                  <p className="text-white/50 text-[13px] tracking-wide">
                    Your product listing updates were fully synchronized.
                  </p>
                </div>

                {/* Listing overview detail */}
                <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden h-[130px] flex text-left max-w-sm mt-4">
                  <div className="w-[40%] bg-neutral-900 border-r border-white/[0.05] relative overflow-hidden flex items-center justify-center">
                    {images[0] && (
                      <img src={images[0]} className="w-full h-full object-cover" alt="" />
                    )}
                  </div>

                  <div className="w-[60%] p-4 flex flex-col justify-center gap-1.5">
                    <h4 className="font-extrabold text-[15px] leading-tight line-clamp-1 text-white">
                      {name}
                    </h4>
                    <p className="text-[#bef715] font-black text-[18px] leading-none">
                      ${price}
                    </p>

                  </div>
                </div>

              </div>

              {/* ACTION ROW FOOTER CONTROLS */}
              <div className="space-y-3 pt-6 w-full max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    // Navigate to public-shop URL or specific product page view safely
                    const shopPath = getShopUrl(shopHandle, shopId);
                    console.log("[EDIT PRODUCT ROUTING] Attempting storefront navigation with shopHandle:", shopHandle, "shopId:", shopId, "Path:", shopPath);
                    if (shopPath) {
                      navigate(shopPath);
                    } else {
                      console.warn("[EDIT PRODUCT ROUTING] Broken link prevented: shopHandle is invalid or missing", shopHandle);
                      toast.error("Unable to navigate to storefront: invalid handle!");
                      navigate('/inventory');
                    }
                  }}
                  className="w-full h-12 rounded-[10px] bg-[#bef715] text-black font-extrabold text-[15px] uppercase tracking-wide flex items-center justify-center transition-all cursor-pointer active:scale-[0.98] hover:bg-[#a9db10]"
                >
                  View on storefront
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/inventory')}
                  className="w-full h-12 rounded-[10px] bg-white/[0.05] border border-white/10 text-white font-extrabold text-[15px] uppercase tracking-wide flex items-center justify-center transition-all cursor-pointer hover:bg-white/[0.1] active:scale-[0.98]"
                >
                  Back to dashboard
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DISCARD CONFIRM DIALOG MODAL */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-[#121212] border border-white/[0.08] rounded-2xl w-full max-w-xs p-5 space-y-4">
            <div className="space-y-1 text-center">
              <h3 className="text-white text-base font-black uppercase tracking-wide">
                Discard modifications?
              </h3>
              <p className="text-white/50 text-xs leading-relaxed">
                Any changes made to these slides will be lost.
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setShowDiscardModal(false);
                  navigate('/inventory');
                }}
                className="flex-1 h-10 rounded-[10px] bg-red-600 hover:bg-red-700 text-white font-bold leading-none cursor-pointer transition-all"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 h-10 rounded-[10px] bg-[#bef715] text-black font-bold leading-none cursor-pointer transition-all"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Sub-labels trigger
function isCoverPhotoLabel(images: string[]) {
  if (images.length === 0) return null;
  return (
    <div className="text-center mt-3">
      <span className="text-[10px] text-white/30 font-bold tracking-wider font-mono uppercase">
        Cover photo selected
      </span>
    </div>
  );
}
