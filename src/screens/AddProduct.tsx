import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  X, ArrowLeft, Plus, Trash2, Camera, Sparkles, Check, ChevronRight, Loader2, ChevronDown, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { uploadImage } from '../utils/uploadImage';
import { useGlobalCategories } from '../hooks/useGlobalCategories';

interface SizeStock {
  active: boolean;
  stock: number;
}

export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow State
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [uploading, setUploading] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopHandle, setShopHandle] = useState<string | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  // SCREEN 1: Photos State
  const [images, setImages] = useState<string[]>([]);

  // SCREEN 2: Product Info State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedTag, setSelectedTag] = useState('None');

  // SCREEN 3: Sizes & Stock State
  const [sizeCategory, setSizeCategory] = useState<'apparel' | 'sneakers' | 'onesize'>('apparel');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [sizeStock, setSizeStock] = useState<Record<string, SizeStock>>({
    'XS': { active: false, stock: 10 },
    'S': { active: false, stock: 10 },
    'M': { active: false, stock: 10 },
    'L': { active: false, stock: 10 },
    'XL': { active: false, stock: 10 },
    'XXL': { active: false, stock: 10 },
  });

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

  // Visibility state
  const [isVisible, setIsVisible] = useState(true);

  // SCREEN 4: Description & Publish State
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Fetch shop information on launch
  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: shop } = await supabase
            .from('shops')
            .select('id, handle')
            .eq('owner_id', session.user.id)
            .maybeSingle();
          if (shop) {
            setShopId(shop.id);
            setShopHandle(shop.handle);
          }
        }
      } catch (err) {
        console.error('Error fetching shop info:', err);
      }
    };
    fetchShopInfo();
  }, []);

  // SCREEN 1: Handling Photo Uploads & File Selections
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
    const toastId = toast.loading('Uploading assets drop...');
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`"${file.name}" exceeds max size of 5MB.`);
          continue;
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`"${file.name}" has invalid format. JPG, PNG, and WebP only.`);
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
      toast.success('Photos uploaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error('Error uploading product images:', err);
      toast.error('Upload failed: ' + err.message, { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag and drop reordering inside Screen 1
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

  // SCREEN 3: Sizing adjustments
  const handleSizeCategoryChange = (val: 'apparel' | 'sneakers' | 'onesize') => {
    setSizeCategory(val);
    if (val === 'apparel') {
      setSizeStock({
        'XS': { active: false, stock: 10 },
        'S': { active: false, stock: 10 },
        'M': { active: false, stock: 10 },
        'L': { active: false, stock: 10 },
        'XL': { active: false, stock: 10 },
        'XXL': { active: false, stock: 10 },
      });
    } else if (val === 'sneakers') {
      setSizeStock({
        'EU 40': { active: false, stock: 10 },
        'EU 41': { active: false, stock: 10 },
        'EU 42': { active: false, stock: 10 },
        'EU 43': { active: false, stock: 10 },
        'EU 44': { active: false, stock: 10 },
        'EU 45': { active: false, stock: 10 },
        'US 8': { active: false, stock: 10 },
        'US 9': { active: false, stock: 10 },
        'US 10': { active: false, stock: 10 },
        'US 11': { active: false, stock: 10 },
      });
    } else if (val === 'onesize') {
      setSizeStock({
        'One Size': { active: true, stock: 10 }
      });
    }
  };

  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    const sizeName = customSizeInput.trim().toUpperCase();
    setSizeStock(prev => {
      if (prev[sizeName]) {
        toast.error('Size option already exists.');
        return prev;
      }
      return {
        ...prev,
        [sizeName]: { active: true, stock: 10 }
      };
    });
    setCustomSizeInput('');
    toast.success(`Size "${sizeName}" added!`);
  };

  const toggleSizeActive = (sz: string) => {
    setSizeStock(prev => {
      const current = prev[sz] || { active: false, stock: 10 };
      return {
        ...prev,
        [sz]: {
          ...current,
          active: !current.active,
          stock: !current.active ? 10 : current.stock
        }
      };
    });
  };

  const updateSizeStock = (sz: string, val: number) => {
    setSizeStock(prev => ({
      ...prev,
      [sz]: {
        ...(prev[sz] || { active: true }),
        stock: Math.max(0, val)
      }
    }));
  };

  // Navigation handlers
  const goNext = () => {
    if (step === 1 && images.length === 0) return;
    if (step === 2 && (!name || !price)) return;
    
    // Validate Screen 3 size/stock
    if (step === 3) {
      const activeSizes = Object.values(sizeStock).filter(s => s.active);
      const hasStock = activeSizes.some(s => s.stock > 0);
      if (!hasStock) {
        toast.error('Please add stock (at least 1 size with stock > 0)');
        return;
      }
    }

    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(1, s - 1));
  };

  // Confirm publish upload action
  const handlePublishProduct = async () => {
    if (!name || !price || images.length === 0) {
      toast.error('Required product information missing.');
      return;
    }

    setPublishing(true);
    const apiToast = toast.loading('Publishing product live to storefront...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be signed in to create products.');
      }
      const ownerId = session.user.id;

      // Structure size variants for save array
      const configuredSizes = Object.entries(sizeStock)
        .filter(([_, value]) => value.active)
        .map(([size, value]) => ({
          size,
          quantity: value.stock
        }));

      const totalStock = configuredSizes.reduce((sum, s) => sum + s.quantity, 0);

      const productPayload = {
        shop_id: shopId,
        owner_id: ownerId,
        name: name.trim(),
        price: parseFloat(price),
        category: null, // Removed category
        description: description.trim() || null,
        images,
        sizes: configuredSizes,
        colours: selectedColors,
        total_stock: totalStock,
        is_published: isVisible,
        is_featured: isFeatured,
        status: totalStock === 0 ? 'sold_out' : 'active',
        created_at: new Date().toISOString()
      };

      // 1. Insert product
      const { data: newProd, error: insertError } = await supabase
        .from('products')
        .insert(productPayload)
        .select('id')
        .single();

      if (insertError) throw insertError;

      const generatedId = newProd?.id;
      setProductId(generatedId);

      // 2. Safe inventory upsert for database structure resiliency
      try {
        if (generatedId) {
          for (const size of configuredSizes) {
            await supabase
              .from('inventory')
              .upsert({
                product_id: generatedId,
                size: size.size,
                stock_count: size.quantity
              });
          }
        }
      } catch (e) {
        // Silently support setups without the separate inventory table
        console.log('Fitted catalog storage inline inside products table schema.');
      }

      // 3. Increment counters
      if (shopId) {
        await supabase.rpc('increment_shop_product_count', { shop_id: shopId });
      }

      toast.success('Product live! 🚀', { id: apiToast });
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to publish product. ' + (err.message || 'Please try again.'), { id: apiToast });
    } finally {
      setPublishing(false);
    }
  };

  const handleResetForm = () => {
    setImages([]);
    setName('');
    setPrice('');
    setSelectedTag('None');
    setSelectedColors(['Midnight Black']);
    setShowCustomColorInput(false);
    setCustomColorText('');
    setIsVisible(true);
    setDescription('');
    setIsFeatured(false);
    setSizeStock({
      'XS': { active: false, stock: 1 },
      'S': { active: false, stock: 1 },
      'M': { active: false, stock: 1 },
      'L': { active: false, stock: 1 },
      'XL': { active: false, stock: 1 },
      'XXL': { active: false, stock: 1 },
    });
    setStep(1);
    setIsSuccess(false);
  };

  // Determine state validation for CTAs
  const isScreen1Valid = images.length > 0;
  const isScreen2Valid = name.trim() !== '' && price.trim() !== '';
  const isScreen3Valid = Object.values(sizeStock).some(s => s.active && s.stock > 0);

  // Frame transition settings
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden select-none relative flex flex-col justify-between">
      
      {/* 3px Neon Progress Bar at topmost */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/10 z-50">
        <div 
          className="h-full bg-[#C6FF00] transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* CORE HEADER */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.04] bg-[#0a0a0a] z-40 relative">
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
          <span className="text-[#C6FF00] text-[11px] font-bold tracking-[2px] uppercase font-mono">
            ADDING PRODUCT
          </span>
        </div>

        {step === 1 ? (
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        ) : (
          <span className="text-white/30 text-[10px] font-mono tracking-widest font-black uppercase">
            Step {step} of 4
          </span>
        )}
      </div>

      {/* STEP ENGINE INJECTS */}
      <div className="flex-1 w-full max-w-md mx-auto px-5 pt-4 pb-24 flex flex-col justify-start relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {!isSuccess ? (
            <motion.div
              key={`add-step-${step}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full flex-1 flex flex-col justify-between"
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
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(index)}
                                className="absolute top-1 right-1 w-6 h-6 rounded-[6px] bg-black/75 hover:bg-black text-white hover:text-[#C6FF00] transition-colors flex items-center justify-center text-[11px] font-bold z-10 cursor-pointer"
                              >
                                ×
                              </button>
                              {isCover && (
                                <div className="absolute bottom-1 left-1.5 right-1.5 bg-black/80 backdrop-blur-xs py-0.5 rounded text-center text-[8px] uppercase tracking-wider text-[#C6FF00] font-black pointer-events-none">
                                  Cover
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={triggerFilePicker}
                              disabled={uploading}
                              className="w-full h-full bg-white/[0.04] border-[1.5px] border-dashed border-white/[0.15] hover:border-[#C6FF00]/40 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-white/[0.06] active:scale-[0.97]"
                            >
                              <Plus size={24} className="text-white/30" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

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

                  {/* BOTTOM ACTION CTA */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!isScreen1Valid || uploading}
                      onClick={goNext}
                      className="w-full h-12 rounded-[10px] bg-[#C6FF00] disabled:bg-neutral-800 text-black disabled:text-zinc-500 font-extrabold text-[15px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
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
                        className="w-full text-lg font-bold bg-white/[0.05] border-[1.5px] border-white/10 focus:border-[#C6FF00] rounded-[10px] px-4 py-3.5 text-white placeholder-white/25 outline-none focus:outline-none transition-all"
                      />
                    </div>

                    {/* Price input */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 block">
                        Price
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 font-black text-xl text-[#C6FF00] select-none">$</span>
                        <input 
                          type="number" 
                          inputMode="decimal"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0"
                          className="w-full text-xl font-black bg-white/[0.05] border-[1.5px] border-white/10 focus:border-[#C6FF00] rounded-[10px] pl-10 pr-4 py-3.5 text-[#C6FF00] placeholder-white/20 outline-none focus:outline-none transition-all"
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
                                  ? 'bg-[#C6FF00]/10 border-[#C6FF00] text-[#C6FF00]' 
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
                    className="w-full h-12 rounded-[10px] bg-[#C6FF00] disabled:bg-neutral-800 text-black disabled:text-zinc-500 font-extrabold text-[15px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} strokeWidth={3} />
                  </button>

                </div>
              )}

              {/* SCREEN 3: SIZES & STOCK */}
              {step === 3 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-white">Sizes & stock.</h1>
                    <p className="text-white/50 text-[13px]">Select category & tap sizes to activate.</p>
                  </div>

                  {/* Size type selection tab */}
                  <div className="flex gap-2 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl font-sans">
                    {(['apparel', 'sneakers', 'onesize'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleSizeCategoryChange(cat)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                          sizeCategory === cat 
                            ? 'bg-[#C6FF00] text-black font-black' 
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {cat === 'onesize' ? 'No Size' : cat}
                      </button>
                    ))}
                  </div>

                  {/* Size grid */}
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    
                    {sizeCategory === 'onesize' ? (
                      <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl flex flex-col gap-2 relative">
                        <span className="text-[14px] font-extrabold text-white">Universal "One Size" Stock Level</span>
                        <p className="text-white/40 text-[11px] leading-tight">Caters perfectly to accessories, bags, sunglasses or raw materials that don't have sizing scales.</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="font-mono text-xs text-white/55">Stock Qty:</span>
                          <input
                            type="number"
                            min={0}
                            value={sizeStock['One Size']?.stock ?? 10}
                            onChange={(e) => updateSizeStock('One Size', parseInt(e.target.value) || 0)}
                            className="w-20 h-9 rounded-lg bg-white/[0.06] border border-[#C6FF00]/30 text-white font-extrabold text-[15px] text-center focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          {Object.entries(sizeStock).map(([sz, value]) => {
                            return (
                              <div
                                key={`size-card-${sz}`}
                                className={`p-3 rounded-xl border flex flex-col items-center justify-between gap-2.5 relative transition-all min-h-[72px] ${
                                  value.active
                                    ? 'bg-[#C6FF00]/8 border-[#C6FF00] text-[#C6FF00]'
                                    : 'bg-white/[0.04] border-white/[0.08] text-white/30'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleSizeActive(sz)}
                                  className="w-full h-full absolute inset-0 rounded-xl z-0 cursor-pointer"
                                />

                                {/* Stock status indicator dot */}
                                {value.active && (
                                  <div 
                                    className={`w-2 h-2 rounded-full absolute top-2 right-2 ${
                                      value.stock >= 5 ? 'bg-green-500' : value.stock >= 1 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                  />
                                )}

                                <span className="font-extrabold text-[15px] relative z-10 leading-none">
                                  {sz}
                                </span>

                                {value.active && (
                                  <input
                                    type="number"
                                    min={0}
                                    value={value.stock}
                                    onChange={(e) => updateSizeStock(sz, parseInt(e.target.value) || 0)}
                                    className="w-12 h-7 rounded-[6px] bg-white/[0.06] border border-[#C6FF00]/30 text-white font-extrabold text-[13px] text-center relative z-10 focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Add custom size option */}
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={customSizeInput}
                            onChange={(e) => setCustomSizeInput(e.target.value)}
                            placeholder="Add custom size (e.g. US 12, EU 46)"
                            className="flex-1 text-xs bg-[#C6FF00]/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#C6FF00] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomSize}
                            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
                          >
                            Add +
                          </button>
                        </div>
                      </>
                    )}

                  </div>

                  {/* Colors swatches */}
                  <div className="space-y-4 pt-1">
                      <div>
                        <label className="text-[11.5px] font-bold uppercase tracking-[1.5px] text-[#C6FF00] block mb-2">
                          Colours (Select multiple or add custom)
                        </label>
                        <div className="flex flex-wrap gap-2.5 items-center bg-white/[0.03] border border-white/[0.06] p-3 rounded-xl">
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
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all relative cursor-pointer border border-white/5 ${
                                  isSelected 
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110 bg-[#C6FF00]/10' 
                                    : 'bg-white/[0.05] hover:bg-white/[0.1]'
                                }`}
                                title={swatchName}
                              >
                                {sw}
                              </button>
                            );
                          })}
                          
                          {/* Custom color adder toggle button */}
                          <button
                            type="button"
                            onClick={() => setShowCustomColorInput(!showCustomColorInput)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
                              showCustomColorInput 
                                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-white'
                            }`}
                            title="Add custom color"
                          >
                            {showCustomColorInput ? '×' : <Plus size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Custom color input form */}
                      {showCustomColorInput && (
                        <div className="flex gap-2 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                          <input
                            type="text"
                            value={customColorText}
                            onChange={(e) => setCustomColorText(e.target.value)}
                            placeholder="e.g. Vintage Cream, Acid Teal"
                            className="flex-1 text-[13px] bg-white/[0.05] border border-white/10 hover:border-white/20 focus:border-[#C6FF00] rounded-lg px-3 py-2 text-white placeholder-white/25 outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomColor();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomColor}
                            className="bg-[#C6FF00] hover:bg-[#b5e600] text-black text-xs font-black px-4 py-2 rounded-lg transition-all cursor-pointer shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      )}

                      {/* Selected color list with remove options */}
                      {selectedColors.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6FF00]/50 block">Active Palette:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedColors.map((color) => (
                              <span 
                                key={`selected-col-${color}`}
                                className="inline-flex items-center gap-1 bg-[#C6FF00]/10 hover:bg-[#C6FF00]/25 text-[#C6FF00] border border-[#C6FF00]/25 font-mono text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-[6px] transition-colors"
                              >
                                <span>{color}</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedColors(selectedColors.filter(c => c !== color))}
                                  className="text-white/40 hover:text-red-400 font-extrabold ml-1 cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Visibility toggle option */}
                    <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                      <div className="space-y-0.5">
                        <span className="text-[13px] font-bold text-white block">Show on storefront</span>
                        <p className="text-white/35 text-[11px] leading-tight">Customers can see this product</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsVisible(!isVisible)}
                        className={`w-12 h-6.5 rounded-lg border flex items-center p-0.5 transition-all cursor-pointer ${
                          isVisible ? 'bg-[#C6FF00] border-[#C6FF00]' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div 
                          className={`w-5.5 h-5 rounded-[6px] transition-all bg-black ${
                            isVisible ? 'translate-x-5.5' : 'translate-x-0 bg-white/20'
                          }`}
                        />
                      </button>
                    </div>

                  {/* BOTTOM CTA */}
                  <button
                    type="button"
                    disabled={!isScreen3Valid}
                    onClick={goNext}
                    className="w-full h-12 rounded-[10px] bg-[#C6FF00] disabled:bg-neutral-800 text-black disabled:text-zinc-500 font-extrabold text-[15px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} strokeWidth={3} />
                  </button>

                </div>
              )}

              {/* SCREEN 4: DESCRIPTION & PUBLISH */}
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
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/85 border border-white/10 rounded text-[7px] font-black uppercase tracking-wider text-[#C6FF00]">
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
                        <p className="text-[#C6FF00] font-black text-[16px] leading-none">
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
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 block">
                        Description (optional)
                      </label>
                      <span className="text-[10px] font-mono text-white/30 font-bold leading-none">
                        {description.length}/300
                      </span>
                    </div>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value.substring(0, 300))}
                      rows={3}
                      placeholder="Describe the material, fit, or styling tips..."
                      className="w-full text-sm bg-white/[0.05] border-[1.5px] border-white/10 focus:border-[#C6FF00] rounded-[10px] p-3.5 text-white placeholder-white/20 outline-none focus:outline-none transition-all leading-normal resize-none"
                    />
                  </div>

                  {/* Featured toggle selector */}
                  <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl pb-3.5">
                    <div className="space-y-0.5">
                      <span className="text-[13px] font-bold text-white block">⭐ Feature this product</span>
                      <p className="text-white/35 text-[11px] leading-tight">Shows at top of your storefront</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFeatured(!isFeatured)}
                      className={`w-12 h-6.5 rounded-lg border flex items-center p-0.5 transition-all cursor-pointer ${
                        isFeatured ? 'bg-[#C6FF00] border-[#C6FF00]' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div 
                        className={`w-5.5 h-5 rounded-[6px] transition-all bg-black ${
                          isFeatured ? 'translate-x-5.5' : 'translate-x-0 bg-white/20'
                        }`}
                      />
                    </button>
                  </div>

                  {/* ACTION CTA BLOCK */}
                  <button
                    type="button"
                    disabled={publishing}
                    onClick={handlePublishProduct}
                    className="w-full min-h-[52px] h-[52px] rounded-[10px] bg-[#C6FF00] text-black font-extrabold text-[16px] uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-[0_8px_24px_rgba(198, 255, 0,0.25)] pt-1"
                  >
                    {publishing ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-black" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <span>Publish Product 🚀</span>
                      </>
                    )}
                  </button>

                </div>
              )}

            </motion.div>
          ) : (
            
            // SUCCESS SCREEN (Slide up overlaying)
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="w-full flex-1 flex flex-col justify-between py-6 text-center"
            >
              <div className="space-y-6 flex-grow flex flex-col items-center justify-center">
                
                {/* Checkmark circle scale animation */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.1, 1] }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="w-[100px] h-[100px] rounded-full border-2 border-[#C6FF00] bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00]"
                >
                  <Check size={48} className="stroke-[3]" />
                </motion.div>

                <div className="space-y-1.5">
                  <h1 className="text-3xl font-black italic tracking-wide text-white uppercase">
                    Product live! 🚀
                  </h1>
                  <p className="text-white/50 text-[13px] tracking-wide">
                    Customers can now find this on your shop.
                  </p>
                </div>

                {/* Cover photo preview card */}
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
                    <p className="text-[#C6FF00] font-black text-[18px] leading-none">
                      ${price}
                    </p>

                  </div>
                </div>

              </div>

              {/* ACTION ROW BUTTONS */}
              <div className="space-y-3 pt-6 w-full max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full h-12 rounded-[10px] bg-[#C6FF00] text-black font-extrabold text-[15px] uppercase tracking-wide flex items-center justify-center transition-all cursor-pointer active:scale-[0.98]"
                >
                  Add another product
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

      {/* DISCARD MODAL WINDOW */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#121212] border border-white/[0.08] rounded-2xl w-full max-w-xs p-5 space-y-4">
            <div className="space-y-1 text-center">
              <h3 className="text-white text-base font-black uppercase tracking-wide">
                Discard this product?
              </h3>
              <p className="text-white/50 text-xs leading-relaxed">
                Any photos uploaded will be lost.
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setShowDiscardModal(false);
                  navigate('/inventory');
                }}
                className="flex-1 h-10 rounded-[10px] bg-red-600 hover:bg-red-700 text-white font-bold leading-none cursor-pointer transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 h-10 rounded-[10px] bg-[#C6FF00] text-black font-bold leading-none cursor-pointer transition-colors"
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

// Help helper triggers
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
