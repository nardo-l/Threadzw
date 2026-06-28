import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  X, ArrowLeft, Plus, Trash2, Camera, Check, ChevronRight, Loader2, ChevronDown, Image as ImageIcon, Sparkles, Tag, Layers, HelpCircle
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
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch Global Categories
  const { categories: globalCategories, loading: globalCategoriesLoading } = useGlobalCategories();

  // SCREEN 1: Photos State (Allow up to 6, first is cover)
  const [images, setImages] = useState<string[]>([]);

  // SCREEN 2: Basic Details State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Default the category when globalCategories are loaded
  useEffect(() => {
    if (globalCategories && globalCategories.length > 0 && !selectedCategory) {
      // Find default category
      setSelectedCategory(globalCategories[0].name);
    }
  }, [globalCategories, selectedCategory]);

  // SCREEN 3: Optional Details states (Collapsible)
  const [descExpanded, setDescExpanded] = useState(false);
  const [sizesExpanded, setSizesExpanded] = useState(false);
  const [conditionExpanded, setConditionExpanded] = useState(false);

  // Field states inside accordions
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('New');
  const [generalStock, setGeneralStock] = useState('10');
  const [useMultipleSizes, setUseMultipleSizes] = useState(false);
  const [sizeCategory, setSizeCategory] = useState<'apparel' | 'sneakers' | 'onesize'>('apparel');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [sizeStock, setSizeStock] = useState<Record<string, SizeStock>>({
    'XS': { active: false, stock: 10 },
    'S': { active: true, stock: 10 },
    'M': { active: true, stock: 10 },
    'L': { active: true, stock: 10 },
    'XL': { active: false, stock: 10 },
    'XXL': { active: false, stock: 10 },
  });

  // SCREEN 4: Review & Publish State
  const [isFeatured, setIsFeatured] = useState(false);

  // Colors optional State (hardcoded fallback palette)
  const [selectedColors, setSelectedColors] = useState<string[]>(['Midnight Black']);

  // Fetch shop details on mount
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

  // Upload trigger helpers
  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraPicker = () => {
    cameraInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 6) {
      toast.error('Maximum of 6 photos allowed.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading photo...');
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
      toast.success('Uploaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast.error('Upload failed: ' + err.message, { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Photo removed.');
  };

  // Step 3 Sizing Adjustments
  const handleSizeCategoryChange = (val: 'apparel' | 'sneakers' | 'onesize') => {
    setSizeCategory(val);
    if (val === 'apparel') {
      setSizeStock({
        'XS': { active: false, stock: 10 },
        'S': { active: true, stock: 10 },
        'M': { active: true, stock: 10 },
        'L': { active: true, stock: 10 },
        'XL': { active: false, stock: 10 },
        'XXL': { active: false, stock: 10 },
      });
    } else if (val === 'sneakers') {
      setSizeStock({
        'EU 40': { active: false, stock: 10 },
        'EU 41': { active: true, stock: 10 },
        'EU 42': { active: true, stock: 10 },
        'EU 43': { active: true, stock: 10 },
        'EU 44': { active: false, stock: 10 },
        'EU 45': { active: false, stock: 10 },
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

  // Nav actions
  const goNext = () => {
    if (step === 1 && images.length === 0) {
      toast.error('Please upload at least one product image.');
      return;
    }
    if (step === 2 && (!name.trim() || !price.trim())) {
      toast.error('Please enter a product name and price.');
      return;
    }
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(1, s - 1));
  };

  // Database publishing flow
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

      // Structure size variants based on whether Multiple Sizes is enabled
      let configuredSizes = [];
      let totalStock = 0;

      if (useMultipleSizes) {
        configuredSizes = Object.entries(sizeStock)
          .filter(([_, value]) => value.active)
          .map(([size, value]) => ({
            size,
            quantity: value.stock
          }));
        totalStock = configuredSizes.reduce((sum, s) => sum + s.quantity, 0);
      } else {
        const qty = parseInt(generalStock) || 10;
        configuredSizes = [{ size: 'One Size', quantity: qty }];
        totalStock = qty;
      }

      const productPayload = {
        shop_id: shopId,
        owner_id: ownerId,
        name: name.trim(),
        price: parseFloat(price),
        category: selectedCategory || null,
        condition: condition || 'New',
        description: description.trim() || null,
        images,
        sizes: configuredSizes,
        colours: selectedColors,
        total_stock: totalStock,
        is_published: true,
        is_featured: isFeatured,
        status: totalStock === 0 ? 'sold_out' : 'active',
        created_at: new Date().toISOString()
      };

      if (!shopId || String(shopId).startsWith('local-shop-') || shopId === '55555555-5555-5555-5555-555555555555') {
        throw new Error("Cannot create product: No active, valid shop found for your profile.");
      }

      const { data: newProd, error: insertError } = await supabase
        .from('products')
        .insert(productPayload)
        .select('id')
        .single();

      if (insertError) throw insertError;

      const generatedId = newProd?.id;
      setProductId(generatedId);

      // Safe inventory table upsert (for setups that use it)
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
        console.log('Using inline products JSON array storage.');
      }

      // Safe RPC count increment
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
    setCondition('New');
    setGeneralStock('10');
    setUseMultipleSizes(false);
    setDescription('');
    setIsFeatured(false);
    setStep(1);
    setIsSuccess(false);
  };

  // Conditions list
  const conditions = [
    { value: 'New', label: 'New', desc: 'Brand new, never worn' },
    { value: 'Like New', label: 'Like New', desc: 'Worn once or twice' },
    { value: 'Good', label: 'Good', desc: 'Minor wear, well cared for' },
    { value: 'Fair', label: 'Fair', desc: 'Visible wear but fully functional' }
  ];

  // Motion animation presets
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '50px' : '-50px',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '50px' : '-50px',
      opacity: 0
    })
  };

  const isStep1Valid = images.length > 0;
  const isStep2Valid = name.trim() !== '' && price.trim() !== '' && selectedCategory !== '';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-y-auto select-none relative flex flex-col justify-between">
      
      {/* 3px Neon Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/10 z-50 max-w-[430px] mx-auto">
        <div 
          className="h-full bg-[#C6FF00] transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* HEADER */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.04] bg-[#0a0a0a] z-40 relative max-w-[430px] w-full mx-auto">
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
          <span className="text-[#C6FF00] text-[11px] font-black tracking-[2px] uppercase font-mono">
            ADD PRODUCT
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
          <span className="text-white/30 text-[10px] font-mono tracking-widest font-black uppercase bg-white/5 px-2.5 py-1 rounded-full border border-white/[0.04]">
            Step {step} of 4
          </span>
        )}
      </div>

      {/* CORE CONTAINER */}
      <div className="flex-1 w-full max-w-[430px] mx-auto px-5 pt-4 pb-24 flex flex-col justify-start relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {!isSuccess ? (
            <motion.div
              key={`add-step-${step}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col justify-between space-y-6"
            >
              
              {/* ========================================================
                  STEP 1: UPLOAD PRODUCT PHOTO
                 ======================================================== */}
              {step === 1 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">START HERE</span>
                    <h1 className="text-2xl font-black tracking-tight text-white font-syne">Upload product photo</h1>
                    <p className="text-white/50 text-xs">First image will be displayed as the main cover photo.</p>
                  </div>

                  {/* Large upload area centerpiece */}
                  <div className="flex-1 flex flex-col justify-center py-4">
                    {images.length === 0 ? (
                      <div 
                        onClick={triggerFilePicker}
                        className="aspect-square w-full bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-[#C6FF00]/40 rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/[0.03] group-hover:bg-[#C6FF00]/10 flex items-center justify-center text-white/40 group-hover:text-[#C6FF00] transition-all mb-4 border border-white/5">
                          <Camera size={28} />
                        </div>
                        <span className="text-sm font-bold text-white group-hover:text-[#C6FF00] transition-colors">
                          Tap to upload photo
                        </span>
                        <p className="text-[11px] text-white/45 mt-1 max-w-[200px]">
                          Accepts high quality PNG, JPG or WebP images
                        </p>
                      </div>
                    ) : (
                      <div className="aspect-square w-full relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <img src={images[0]} className="w-full h-full object-cover" alt="Product Cover" />
                        
                        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#C6FF00]">
                            Cover Photo
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(0)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white hover:text-red transition-colors flex items-center justify-center border border-white/10 cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}

                    {/* Camera and Gallery buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        type="button"
                        onClick={triggerCameraPicker}
                        className="h-12 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors text-white/80 hover:text-white"
                      >
                        <Camera size={16} className="text-[#C6FF00]" />
                        <span>Use Camera</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={triggerFilePicker}
                        className="h-12 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors text-white/80 hover:text-white"
                      >
                        <ImageIcon size={16} className="text-[#C6FF00]" />
                        <span>Open Gallery</span>
                      </button>
                    </div>

                    {/* Additional photos horizontal line (up to 6) */}
                    {images.length > 0 && (
                      <div className="mt-5 space-y-2">
                        <span className="text-[10px] text-white/40 font-mono tracking-wider block uppercase">
                          Additional Photos ({images.length - 1} / 5)
                        </span>
                        <div className="flex gap-2 items-center overflow-x-auto no-scrollbar py-1">
                          {images.slice(1).map((img, idx) => (
                            <div key={`extra-img-${idx}`} className="w-14 h-14 rounded-lg relative overflow-hidden border border-white/10 shrink-0">
                              <img src={img} className="w-full h-full object-cover" alt="" />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(idx + 1)}
                                className="absolute inset-0 bg-black/60 hover:bg-black/80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-red cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}

                          {images.length < 6 && (
                            <button
                              type="button"
                              onClick={triggerFilePicker}
                              className="w-14 h-14 bg-white/[0.03] hover:bg-white/[0.06] border border-dashed border-white/15 hover:border-[#C6FF00] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Plus size={16} className="text-white/40" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File inputs */}
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
                    ref={cameraInputRef} 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleFilesSelected} 
                    className="hidden" 
                  />

                  {/* BOTTOM NEXT BUTTON */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!isStep1Valid || uploading}
                      onClick={goNext}
                      className="w-full h-14 rounded-xl bg-[#C6FF00] disabled:bg-neutral-800 text-black disabled:text-zinc-500 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-black" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ChevronRight size={16} strokeWidth={3} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  STEP 2: BASIC DETAILS
                 ======================================================== */}
              {step === 2 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">PRODUCT IDENTITY</span>
                    <h1 className="text-2xl font-black tracking-tight text-white font-syne">Basic details</h1>
                    <p className="text-white/50 text-xs">Specify the main parameters of your product.</p>
                  </div>

                  <div className="space-y-5 flex-grow py-4 justify-center flex flex-col">
                    {/* Name input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-[1.5px] text-white/40 block">
                        Product Name <span className="text-[#C6FF00]">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Air Jordan 4 Retro"
                        className="w-full text-base font-bold bg-white/[0.04] border border-white/10 focus:border-[#C6FF00] rounded-xl px-4 py-3.5 text-white placeholder-white/25 outline-none focus:outline-none transition-all"
                      />
                    </div>

                    {/* Price input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-[1.5px] text-white/40 block">
                        Price (USD) <span className="text-[#C6FF00]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 font-black text-lg text-[#C6FF00] select-none">$</span>
                        <input 
                          type="number" 
                          inputMode="decimal"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full text-lg font-black bg-white/[0.04] border border-white/10 focus:border-[#C6FF00] rounded-xl pl-10 pr-4 py-3.5 text-[#C6FF00] placeholder-white/20 outline-none focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-[1.5px] text-white/40 block">
                        Category <span className="text-[#C6FF00]">*</span>
                      </label>
                      {globalCategoriesLoading ? (
                        <div className="h-12 bg-white/[0.02] rounded-xl animate-pulse flex items-center justify-center text-xs text-white/30">
                          Loading categories...
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto no-scrollbar p-0.5">
                          {globalCategories.map((cat) => {
                            const isSelected = selectedCategory === cat.name;
                            return (
                              <button
                                key={`cat-select-${cat.id}`}
                                type="button"
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`h-11 px-3 text-[12px] font-bold rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-[#C6FF00]/10 border-[#C6FF00] text-[#C6FF00] shadow-lg shadow-[#C6FF00]/5' 
                                    : 'bg-white/[0.03] border-white/5 text-white/60 hover:text-white'
                                }`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#C6FF00]' : 'bg-white/20'}`} />
                                <span className="truncate">{cat.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CONTINUE */}
                  <button
                    type="button"
                    disabled={!isStep2Valid}
                    onClick={goNext}
                    className="w-full h-14 rounded-xl bg-[#C6FF00] disabled:bg-neutral-800 text-black disabled:text-zinc-500 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <span>Continue</span>
                    <ChevronRight size={16} strokeWidth={3} />
                  </button>
                </div>
              )}

              {/* ========================================================
                  STEP 3: OPTIONAL DETAILS (COLLAPSIBLE ACCORDIONS)
                 ======================================================== */}
              {step === 3 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">OPTIONAL STEP</span>
                    <h1 className="text-2xl font-black tracking-tight text-white font-syne">Optional details</h1>
                    <p className="text-white/50 text-xs">All fields here are optional. Tap any header to configure.</p>
                  </div>

                  <div className="space-y-4 flex-grow py-2">
                    
                    {/* ACCORDION 1: DESCRIPTION */}
                    <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl overflow-hidden transition-colors duration-200">
                      <button
                        type="button"
                        onClick={() => setDescExpanded(!descExpanded)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${descExpanded ? 'bg-[#C6FF00]/10 border-[#C6FF00]/25 text-[#C6FF00]' : 'bg-white/5 border-white/5 text-white/50'}`}>
                            <Sparkles size={14} />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-white uppercase tracking-wider block">Description</span>
                            <span className="text-[10px] text-white/40 truncate block max-w-[200px]">
                              {description ? description : 'Add details, fit, style guide'}
                            </span>
                          </div>
                        </div>
                        <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 ${descExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {descExpanded && (
                        <div className="p-4 pt-0 border-t border-white/[0.04] space-y-2 animate-wipe">
                          <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest mt-3">
                            <span>Write details</span>
                            <span>{description.length}/300</span>
                          </div>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                            placeholder="Write high-converting details about materials, fit, design, or sizing guide..."
                            rows={3}
                            className="w-full text-xs bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-white/20 outline-none focus:border-[#C6FF00] resize-none leading-relaxed transition-colors"
                          />
                        </div>
                      )}
                    </div>

                    {/* ACCORDION 2: SIZES & STOCK QUANTITY */}
                    <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl overflow-hidden transition-colors duration-200">
                      <button
                        type="button"
                        onClick={() => setSizesExpanded(!sizesExpanded)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${sizesExpanded ? 'bg-[#C6FF00]/10 border-[#C6FF00]/25 text-[#C6FF00]' : 'bg-white/5 border-white/5 text-white/50'}`}>
                            <Layers size={14} />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-white uppercase tracking-wider block">Sizes & Stock</span>
                            <span className="text-[10px] text-white/40 block">
                              {useMultipleSizes ? 'Custom sizing configured' : `Default One Size · ${generalStock} units`}
                            </span>
                          </div>
                        </div>
                        <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 ${sizesExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {sizesExpanded && (
                        <div className="p-4 pt-0 border-t border-white/[0.04] space-y-4 animate-wipe">
                          
                          {/* Toggle Use multiple sizes */}
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-white/70">Does this product have multiple sizes?</span>
                            <button
                              type="button"
                              onClick={() => {
                                setUseMultipleSizes(!useMultipleSizes);
                                if (!useMultipleSizes) handleSizeCategoryChange('apparel');
                              }}
                              className={`w-11 h-6 rounded-lg relative transition-colors ${useMultipleSizes ? 'bg-[#C6FF00]' : 'bg-white/10'}`}
                            >
                              <div className={`absolute top-0.5 w-5 h-5 rounded-md bg-black transition-all ${useMultipleSizes ? 'left-5.5' : 'left-0.5 bg-white/40'}`} />
                            </button>
                          </div>

                          {!useMultipleSizes ? (
                            <div className="space-y-2 pt-2 bg-black/30 p-3 rounded-xl border border-white/[0.03]">
                              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 block">
                                Global Stock Volume
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min={0}
                                  value={generalStock}
                                  onChange={(e) => setGeneralStock(e.target.value)}
                                  className="w-full h-11 rounded-lg bg-black/40 border border-white/15 px-3 text-white text-sm font-extrabold outline-none focus:border-[#C6FF00]"
                                  placeholder="10"
                                />
                                <span className="text-xs text-white/40 shrink-0 uppercase tracking-widest font-mono">units available</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4 pt-2">
                              {/* Category Tabs */}
                              <div className="flex gap-1.5 p-1 bg-black/40 border border-white/10 rounded-lg">
                                {(['apparel', 'sneakers', 'onesize'] as const).map((cat) => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleSizeCategoryChange(cat)}
                                    className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-md transition-all capitalize cursor-pointer ${
                                      sizeCategory === cat 
                                        ? 'bg-[#C6FF00] text-black' 
                                        : 'text-white/50 hover:text-white'
                                    }`}
                                  >
                                    {cat === 'onesize' ? 'One Size' : cat}
                                  </button>
                                ))}
                              </div>

                              {/* Size selection grids */}
                              <div className="grid grid-cols-3 gap-2">
                                {Object.entries(sizeStock).map(([sz, value]) => (
                                  <div
                                    key={`opt-size-${sz}`}
                                    className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 relative transition-all ${
                                      value.active
                                        ? 'bg-[#C6FF00]/5 border-[#C6FF00] text-[#C6FF00]'
                                        : 'bg-black/20 border-white/5 text-white/30'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => toggleSizeActive(sz)}
                                      className="absolute inset-0 w-full h-full rounded-lg cursor-pointer"
                                    />
                                    <span className="font-black text-xs relative z-10">{sz}</span>
                                    {value.active && (
                                      <input
                                        type="number"
                                        min={0}
                                        value={value.stock}
                                        onChange={(e) => updateSizeStock(sz, parseInt(e.target.value) || 0)}
                                        className="w-12 h-6 rounded bg-black/40 border border-white/10 text-white font-bold text-[10px] text-center relative z-10 focus:outline-none focus:border-[#C6FF00]"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Add custom sizes */}
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={customSizeInput}
                                  onChange={(e) => setCustomSizeInput(e.target.value)}
                                  placeholder="e.g. EU 46"
                                  className="flex-1 text-[11px] bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white outline-none focus:border-[#C6FF00]"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCustomSize}
                                  className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Add +
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>

                    {/* ACCORDION 3: CONDITION (FOR THRIFT SELLERS) */}
                    <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl overflow-hidden transition-colors duration-200">
                      <button
                        type="button"
                        onClick={() => setConditionExpanded(!conditionExpanded)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${conditionExpanded ? 'bg-[#C6FF00]/10 border-[#C6FF00]/25 text-[#C6FF00]' : 'bg-white/5 border-white/5 text-white/50'}`}>
                            <Tag size={14} />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-white uppercase tracking-wider block">Product Condition</span>
                            <span className="text-[10px] text-white/40 block">
                              {condition}
                            </span>
                          </div>
                        </div>
                        <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 ${conditionExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {conditionExpanded && (
                        <div className="p-4 pt-0 border-t border-white/[0.04] space-y-3 animate-wipe">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 block mt-4">
                            Select Condition
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {conditions.map((item) => {
                              const isSelected = condition === item.value;
                              return (
                                <button
                                  key={`cond-${item.value}`}
                                  type="button"
                                  onClick={() => setCondition(item.value)}
                                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-[68px] cursor-pointer ${
                                    isSelected 
                                      ? 'bg-[#C6FF00]/10 border-[#C6FF00] text-[#C6FF00]' 
                                      : 'bg-black/30 border-white/5 text-white/60 hover:text-white'
                                  }`}
                                >
                                  <span className="text-xs font-extrabold block">{item.label}</span>
                                  <span className={`text-[9px] block ${isSelected ? 'text-[#C6FF00]/70' : 'text-white/30'}`}>{item.desc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* CONTINUE */}
                  <button
                    type="button"
                    onClick={goNext}
                    className="w-full h-14 rounded-xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <span>Continue to Review</span>
                    <ChevronRight size={16} strokeWidth={3} />
                  </button>
                </div>
              )}

              {/* ========================================================
                  STEP 4: REVIEW & PUBLISH
                 ======================================================== */}
              {step === 4 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">FINAL REVIEW</span>
                    <h1 className="text-2xl font-black tracking-tight text-white font-syne">Review & publish</h1>
                    <p className="text-white/50 text-xs">Verify your product listing details before publishing.</p>
                  </div>

                  {/* Elegant product showcase representation card */}
                  <div className="flex-grow flex flex-col justify-center py-2 space-y-4">
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                      <div className="aspect-video w-full bg-neutral-900 border-b border-white/[0.05] relative overflow-hidden flex items-center justify-center">
                        {images[0] ? (
                          <img src={images[0]} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-[11px] text-white/20 uppercase font-black tracking-widest">
                            No Photo
                          </span>
                        )}
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/15 rounded-lg text-[9px] font-black uppercase tracking-wider text-[#C6FF00]">
                          {selectedCategory}
                        </div>
                      </div>

                      <div className="p-4 space-y-3.5 text-left">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-lg leading-snug text-white">
                            {name || 'Untitled Product'}
                          </h4>
                          <p className="text-[#C6FF00] font-black text-xl leading-none">
                            ${price ? parseFloat(price).toFixed(2) : '0.00'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/[0.04]">
                          <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-1 bg-white/5 border border-white/10 text-white/70 rounded-md">
                            Condition: {condition}
                          </span>
                          
                          {useMultipleSizes ? (
                            Object.entries(sizeStock)
                              .filter(([_, data]) => data.active)
                              .map(([sz]) => (
                                <span 
                                  key={`review-chip-${sz}`} 
                                  className="text-[9px] font-mono uppercase tracking-wider px-2 py-1 bg-[#C6FF00]/10 border border-[#C6FF00]/20 text-[#C6FF00] rounded-md"
                                >
                                  {sz}
                                </span>
                              ))
                          ) : (
                            <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-1 bg-white/5 border border-white/10 text-white/70 rounded-md">
                              Qty: {generalStock} units
                            </span>
                          )}
                        </div>

                        {description && (
                          <p className="text-[11px] text-white/50 leading-relaxed pt-2 border-t border-white/[0.04] line-clamp-3">
                            {description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Feature this product toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">Feature on Storefront</span>
                        <p className="text-white/40 text-[10px]">Pins this product at the top of your shop</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFeatured(!isFeatured)}
                        className={`w-11 h-6 rounded-lg relative transition-colors ${isFeatured ? 'bg-[#C6FF00]' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-md bg-black transition-all ${isFeatured ? 'left-5.5' : 'left-0.5 bg-white/40'}`} />
                      </button>
                    </div>
                  </div>

                  {/* ACTION PUBLISH BUTTON */}
                  <button
                    type="button"
                    disabled={publishing}
                    onClick={handlePublishProduct}
                    className="w-full h-14 rounded-xl bg-[#C6FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-[0_8px_24px_rgba(198,255,0,0.25)]"
                  >
                    {publishing ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-black" />
                        <span>Publishing product...</span>
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
            
            // SUCCESS DEPLOYED PAGE
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="w-full flex-1 flex flex-col justify-between py-6 text-center"
            >
              <div className="space-y-6 flex-grow flex flex-col items-center justify-center">
                
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.1, 1] }}
                  transition={{ duration: 0.4 }}
                  className="w-20 h-20 rounded-full border-2 border-[#C6FF00] bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00] mb-2"
                >
                  <Check size={36} className="stroke-[3]" />
                </motion.div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-wide text-white font-syne uppercase">
                    PRODUCT DEPLOYED! 🚀
                  </h1>
                  <p className="text-white/50 text-xs max-w-xs mx-auto">
                    Customers can now purchase this live on your shop instantly.
                  </p>
                </div>

                <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden h-[96px] flex text-left max-w-sm mt-4">
                  <div className="w-[30%] bg-neutral-900 border-r border-white/[0.05] relative overflow-hidden flex items-center justify-center">
                    {images[0] && (
                      <img src={images[0]} className="w-full h-full object-cover" alt="" />
                    )}
                  </div>

                  <div className="w-[70%] p-4 flex flex-col justify-center gap-1">
                    <h4 className="font-extrabold text-sm leading-tight line-clamp-1 text-white">
                      {name}
                    </h4>
                    <p className="text-[#C6FF00] font-black text-base leading-none">
                      ${parseFloat(price).toFixed(2)}
                    </p>
                    <span className="text-[9px] text-white/30 uppercase font-mono tracking-wider">{selectedCategory}</span>
                  </div>
                </div>
              </div>

              {/* ACTION ROW */}
              <div className="space-y-3 pt-6 w-full max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full h-12 rounded-xl bg-[#C6FF00] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer active:scale-[0.98]"
                >
                  Add another product
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/inventory')}
                  className="w-full h-12 rounded-xl bg-white/[0.04] border border-white/10 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer hover:bg-white/[0.08] active:scale-[0.98]"
                >
                  Back to inventory
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DISCARD MODAL WINDOW */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#121212] border border-white/[0.08] rounded-2xl w-full max-w-xs p-5 space-y-4">
            <div className="space-y-1.5 text-center">
              <h3 className="text-white text-sm font-black uppercase tracking-wide">
                Discard product?
              </h3>
              <p className="text-white/50 text-xs leading-relaxed">
                Your current draft and uploaded photos will be permanently lost.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDiscardModal(false);
                  navigate('/inventory');
                }}
                className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold leading-none cursor-pointer transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 h-10 rounded-xl bg-[#C6FF00] text-black text-xs font-bold leading-none cursor-pointer transition-colors"
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
