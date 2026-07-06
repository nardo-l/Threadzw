import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  X, ArrowLeft, Plus, Trash2, Camera, Check, ChevronRight, Loader2, ChevronDown, Image as ImageIcon, Sparkles, Tag, Layers, HelpCircle, ArrowUp, ArrowDown, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { uploadImage } from '../utils/uploadImage';
import { useGlobalCategories } from '../hooks/useGlobalCategories';
import { getSizesForCategory } from '../utils/sizes';

interface SizeStock {
  active: boolean;
  stock: number;
}

export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraPicker = () => {
    cameraInputRef.current?.click();
  };

  // Flow State (6 Steps)
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

  // Step 1: Basic Details
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Step 2: Photos & Drag and Drop
  const [images, setImages] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Step 3: Sizes Management
  const [activeSizeEditing, setActiveSizeEditing] = useState<string | null>(null);
  const [tempStockInput, setTempStockInput] = useState('');
  const [showCustomSizeInput, setShowCustomSizeInput] = useState(false);
  const [customSizeName, setCustomSizeName] = useState('');
  const [sizeStock, setSizeStock] = useState<Record<string, SizeStock>>({});
  const [generalStock, setGeneralStock] = useState('10');

  // Step 4: Colours Management
  const [selectedColors, setSelectedColors] = useState<string[]>(['Midnight Black']);
  const [customColorInput, setCustomColorInput] = useState('');

  // Step 5: Description & Specs
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [gender, setGender] = useState('Unisex');
  const [condition, setCondition] = useState('New');
  const [features, setFeatures] = useState('');
  const [careInstructions, setCareInstructions] = useState('');

  // Step 6: Review & Publish
  const [isFeatured, setIsFeatured] = useState(false);

  // Default category on globalCategories load
  useEffect(() => {
    if (globalCategories && globalCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(globalCategories[0].name);
    }
  }, [globalCategories, selectedCategory]);

  // Fetch shop info on mount
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

  // Shared file upload processor
  const processFiles = async (files: File[]) => {
    if (images.length + files.length > 6) {
      toast.error('Maximum of 6 photos allowed.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading photo to secure storage...');
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

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Photo removed.');
  };

  // Move images in gallery
  const moveImage = (index: number, moveDirection: 'left' | 'right') => {
    if (moveDirection === 'left' && index === 0) return;
    if (moveDirection === 'right' && index === images.length - 1) return;
    const targetIdx = moveDirection === 'left' ? index - 1 : index + 1;
    setImages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Promote thumbnail to cover photo
  const setAsCover = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const copy = [...prev];
      const target = copy[index];
      copy.splice(index, 1);
      copy.unshift(target);
      return copy;
    });
    toast.success('Main cover photo updated.');
  };

  // Step 3: Size Adjustments
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

  // Step 4: Colour Adjustments
  const handleAddCustomColor = () => {
    if (!customColorInput.trim()) return;
    const colName = customColorInput.trim();
    if (selectedColors.includes(colName)) {
      toast.error('Color already exists.');
      return;
    }
    setSelectedColors(prev => [...prev, colName]);
    setCustomColorInput('');
    toast.success(`Color "${colName}" added.`);
  };

  const handleRemoveColor = (colName: string) => {
    setSelectedColors(prev => prev.filter(c => c !== colName));
    toast.success(`Color "${colName}" removed.`);
  };

  const moveColor = (index: number, moveDirection: 'left' | 'right') => {
    if (moveDirection === 'left' && index === 0) return;
    if (moveDirection === 'right' && index === selectedColors.length - 1) return;
    const targetIdx = moveDirection === 'left' ? index - 1 : index + 1;
    setSelectedColors(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Nav Actions
  const goNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        toast.error('Please enter a product name.');
        return;
      }
      if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        toast.error('Please enter a valid retail price.');
        return;
      }
      if (!selectedCategory) {
        toast.error('Please select a product category.');
        return;
      }
    }

    if (step === 2) {
      if (images.length === 0) {
        toast.error('Please upload at least one product photo.');
        return;
      }
    }

    if (step === 3) {
      const hasSizes = getSizesForCategory(selectedCategory) !== null;
      if (hasSizes) {
        const activeSizes = Object.entries(sizeStock).filter(([_, val]) => val.active);
        if (activeSizes.length === 0) {
          toast.error('Please configure at least one size variant & stock quantity.');
          return;
        }
      } else {
        if (!generalStock.trim() || isNaN(parseInt(generalStock)) || parseInt(generalStock) < 0) {
          toast.error('Please provide a valid stock level.');
          return;
        }
      }
    }

    if (step === 4) {
      if (selectedColors.length === 0) {
        toast.error('Please add at least one color option.');
        return;
      }
    }

    setDirection(1);
    setStep(s => Math.min(6, s + 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(1, s - 1));
  };

  // Database publishing flow
  const handlePublishProduct = async () => {
    if (!name || !price || images.length === 0) {
      toast.error('Required product specifications missing.');
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

      // Structure size variants
      let configuredSizes = [];
      let totalStock = 0;

      const hasSizes = getSizesForCategory(selectedCategory) !== null;

      if (hasSizes) {
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

      // Appending dynamic specs to description to preserve 100% database schema compatibility
      let finalDescription = description.trim();
      if (material || brand || gender || condition || features || careInstructions) {
        finalDescription += "\n\n--- SPECIFICATIONS ---";
        if (brand) finalDescription += `\nBrand: ${brand}`;
        if (material) finalDescription += `\nMaterial: ${material}`;
        if (gender) finalDescription += `\nGender: ${gender}`;
        if (condition) finalDescription += `\nCondition: ${condition}`;
        if (features) finalDescription += `\nFeatures: ${features}`;
        if (careInstructions) finalDescription += `\nCare Instructions: ${careInstructions}`;
      }

      const productPayload = {
        shop_id: shopId,
        owner_id: ownerId,
        name: name.trim(),
        price: parseFloat(price),
        category: selectedCategory || null,
        condition: condition || 'New',
        description: finalDescription || null,
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

      // Safe inventory table upsert
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

      // Increment shop product count via RPC
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
    setName('');
    setPrice('');
    setImages([]);
    setSelectedColors(['Midnight Black']);
    setDescription('');
    setBrand('');
    setMaterial('');
    setGender('Unisex');
    setCondition('New');
    setIsFeatured(false);
    setStep(1);
    setIsSuccess(false);
  };

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-y-auto select-none relative flex flex-col justify-between">
      
      {/* 3px Neon Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/10 z-50 max-w-[430px] mx-auto">
        <div 
          className="h-full bg-[#C6FF00] transition-all duration-300"
          style={{ width: `${(step / 6) * 100}%` }}
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
            Step {step} of 6
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
                  STEP 1: BASIC INFORMATION
                 ======================================================== */}
              {step === 1 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">STEP 1 OF 6</span>
                    <h1 className="text-2xl font-black tracking-tight text-white font-syne">Basic Information</h1>
                    <p className="text-white/50 text-xs">Configure the identity, retail cost, and classification.</p>
                  </div>

                  <div className="space-y-4 py-2 flex-1">
                    {/* Product Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/55">Product Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Vintage Heavyweight Tee"
                        className="w-full bg-white border border-white/[0.08] focus:border-[#C6FF00] rounded-xl p-4 text-zinc-950 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-sm shadow-sm font-bold"
                      />
                    </div>

                    {/* Price USD */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/55">Retail Price (USD) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-zinc-500 text-sm">$</span>
                        <input 
                          type="number"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          placeholder="25.00"
                          className="w-full bg-white border border-white/[0.08] focus:border-[#C6FF00] rounded-xl p-4 pl-8 text-zinc-950 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-sm shadow-sm font-bold"
                        />
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/55">Product Category <span className="text-red-500">*</span></label>
                      {globalCategoriesLoading ? (
                        <div className="h-14 bg-white/[0.03] rounded-xl flex items-center justify-center border border-white/[0.08]">
                          <Loader2 size={16} className="text-white/30 animate-spin" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                          {globalCategories?.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setSelectedCategory(cat.name)}
                              className={`p-3.5 rounded-xl border text-xs font-bold font-sans transition-all cursor-pointer ${
                                selectedCategory === cat.name
                                  ? 'bg-[#C6FF00] text-black border-[#C6FF00] shadow-md shadow-[#C6FF00]/10'
                                  : 'bg-white/[0.02] text-white/75 border-white/[0.08] hover:border-white/15'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={goNext}
                      className="w-full h-12 rounded-xl bg-[#C6FF00] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#C6FF00]/10 cursor-pointer hover:bg-[#b0e000] active:scale-[0.98]"
                    >
                      <span>Continue to Photos</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  STEP 2: PHOTOS (DRAG AND DROP, PREVIEWS, REORDER)
                 ======================================================== */}
              {step === 2 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">STEP 2 OF 6</span>
                    <h1 className="text-2xl font-black tracking-tight text-white font-syne">Product Gallery</h1>
                    <p className="text-white/50 text-xs">Upload up to 6 high-res photos. Drag or shift to arrange display order.</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-start space-y-4 py-2">
                    {/* Drag and Drop Box */}
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={triggerFilePicker}
                      className={`h-40 w-full bg-white/[0.01] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center transition-all cursor-pointer group relative overflow-hidden ${
                        isDragOver ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/[0.03] group-hover:bg-[#C6FF00]/10 flex items-center justify-center text-white/40 group-hover:text-[#C6FF00] transition-all mb-2 border border-white/5">
                        <Camera size={20} />
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-[#C6FF00] transition-colors">
                        Drag & Drop or Click to Upload
                      </span>
                      <p className="text-[10px] text-white/40 mt-1">PNG, JPG, or WebP up to 5MB (Max 6)</p>
                    </div>

                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFilesSelected}
                      multiple
                      className="hidden"
                      accept="image/*"
                    />

                    {/* Previews grid */}
                    {images.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-white/55 block">Uploaded Previews ({images.length} / 6)</label>
                        <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto no-scrollbar py-1">
                          {images.map((img, idx) => (
                            <div 
                              key={`preview-${idx}`}
                              className="aspect-[3/4] bg-neutral-900 border border-white/[0.08] rounded-xl overflow-hidden relative group"
                            >
                              <img src={img} className="w-full h-full object-cover" alt="" />
                              
                              {/* Label badge */}
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-3xs border border-white/10 text-[9px] font-mono text-white/90">
                                {idx === 0 ? '🏆 Cover' : `#${idx + 1}`}
                              </div>

                              {/* Controls Overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end gap-1.5">
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setAsCover(idx)}
                                      className="w-6 h-6 rounded-md bg-black/80 hover:bg-black text-[9px] text-white flex items-center justify-center border border-white/10 cursor-pointer"
                                      title="Make Cover"
                                    >
                                      ⭐
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(idx)}
                                    className="w-6 h-6 rounded-md bg-black/80 hover:bg-red-700 text-white flex items-center justify-center border border-white/10 cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                <div className="flex justify-between">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => moveImage(idx, 'left')}
                                    className="w-6 h-6 rounded-md bg-black/80 hover:bg-black text-white flex items-center justify-center border border-white/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    ←
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === images.length - 1}
                                    onClick={() => moveImage(idx, 'right')}
                                    className="w-6 h-6 rounded-md bg-black/80 hover:bg-black text-white flex items-center justify-center border border-white/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    →
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation footer */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 h-12 rounded-xl border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 h-12 rounded-xl bg-[#C6FF00] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#C6FF00]/10 cursor-pointer hover:bg-[#b0e000]"
                    >
                      <span>Continue</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  STEP 3: SIZES (PRESETS, ADD UNLIMITED, REORDER, STOCK)
                 ======================================================== */}
              {step === 3 && (() => {
                const standardSizes = getSizesForCategory(selectedCategory);
                const hasSizes = standardSizes !== null;

                return (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">STEP 3 OF 6</span>
                      <h1 className="text-2xl font-black tracking-tight text-white font-syne">Variants & Stock</h1>
                      <p className="text-white/50 text-xs">
                        {hasSizes 
                          ? `Select the sizes you have in stock for "${selectedCategory}".` 
                          : `Specify the stock quantity for "${selectedCategory}".`
                        }
                      </p>
                    </div>

                    <div className="flex-1 space-y-4 py-2 overflow-y-auto no-scrollbar max-h-96">
                      {!hasSizes ? (
                        <div className="space-y-3 p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl animate-wipe">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-white/55 block">Total Stock Quantity</label>
                          <input 
                            type="number"
                            min="0"
                            value={generalStock}
                            onChange={e => setGeneralStock(e.target.value)}
                            placeholder="e.g. 10"
                            className="w-full bg-white text-zinc-950 border border-zinc-200 focus:border-[#C6FF00] rounded-xl p-4 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-sm font-bold shadow-sm"
                          />
                          <p className="text-[11px] text-white/40 leading-relaxed font-sans">
                            Since this category does not use standard sizes, please provide your current aggregate inventory count.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-5 animate-wipe">
                          {/* Horizontally scrollable row of size chips */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-white/55 block">Available Sizes</label>
                            
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent -mx-1 px-1">
                              {standardSizes.map((sz) => {
                                const isAdded = sizeStock[sz]?.active;
                                const isSelected = activeSizeEditing === sz;

                                return (
                                  <button
                                    key={`chip-${sz}`}
                                    type="button"
                                    onClick={() => {
                                      if (isAdded) {
                                        // Edit quantity if already added
                                        setActiveSizeEditing(sz);
                                        setTempStockInput(String(sizeStock[sz].stock));
                                      } else {
                                        setActiveSizeEditing(sz);
                                        setTempStockInput('');
                                      }
                                    }}
                                    className={`px-4 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                                      isSelected
                                        ? 'bg-[#C6FF00] text-black border-[#C6FF00] scale-105 shadow-md shadow-[#C6FF00]/15'
                                        : isAdded
                                        ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                                        : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20 hover:bg-white/10'
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
                                  className="px-4 py-2 rounded-full border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1 bg-transparent"
                                >
                                  <span>+ Custom</span>
                                </button>
                              ) : null}
                            </div>
                          </div>

                          {/* Custom Size Name Input Block */}
                          {showCustomSizeInput && (
                            <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-3 animate-fade-in">
                              <label className="text-[10px] font-mono uppercase tracking-wider text-white/55 block">Add Custom Size Name</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. XXXL or 49"
                                  value={customSizeName}
                                  onChange={e => setCustomSizeName(e.target.value)}
                                  className="flex-1 bg-white text-zinc-950 border border-zinc-200 focus:border-[#C6FF00] rounded-xl p-3 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-bold"
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCustomSizeName();
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCustomSizeName}
                                  className="px-4 bg-[#C6FF00] hover:bg-[#b0e000] text-black rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer transition-all"
                                >
                                  Next
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowCustomSizeInput(false);
                                    setCustomSizeName('');
                                  }}
                                  className="px-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Selected Size / Stock Input Block */}
                          {activeSizeEditing && !showCustomSizeInput && (
                            <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-3 animate-fade-in">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono uppercase tracking-wider text-[#C6FF00] block">
                                  Stock Quantity for Size: <span className="font-sans font-black text-white text-sm ml-1">{activeSizeEditing}</span>
                                </label>
                                <span className="text-[9px] font-mono text-white/40 uppercase">Press Enter to save</span>
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  type="number"
                                  min="1"
                                  value={tempStockInput}
                                  onChange={e => setTempStockInput(e.target.value)}
                                  placeholder="e.g. 15"
                                  className="flex-1 bg-white text-zinc-950 border border-[#C6FF00] rounded-xl p-3 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-bold"
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleConfirmStock();
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={handleConfirmStock}
                                  className="px-5 bg-[#C6FF00] hover:bg-[#b0e000] text-black rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer transition-all"
                                >
                                  Save Quantity
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSizeEditing(null);
                                    setTempStockInput('');
                                  }}
                                  className="px-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Completed Size Chips */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-white/55 block">Configured Variants</label>
                            
                            {Object.entries(sizeStock).filter(([_, details]) => details.active).length === 0 ? (
                              <p className="text-xs text-white/30 italic text-center py-6 border border-dashed border-white/5 rounded-xl font-sans bg-white/[0.01]">
                                No sizes added to inventory. Tap a size chip above to set its stock.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2 p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                                {Object.entries(sizeStock)
                                  .filter(([_, details]) => details.active)
                                  .map(([sz, details]) => (
                                    <div 
                                      key={`completed-${sz}`}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-zinc-900 text-xs font-extrabold shadow-sm border border-zinc-200 group transition-all hover:border-zinc-300"
                                    >
                                      <span 
                                        onClick={() => {
                                          setActiveSizeEditing(sz);
                                          setTempStockInput(String(details.stock));
                                        }}
                                        className="cursor-pointer"
                                        title="Click to edit quantity"
                                      >
                                        {sz} <span className="text-zinc-500 font-medium font-sans">({details.stock})</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSize(sz)}
                                        className="text-zinc-400 hover:text-red-500 transition-colors p-0.5"
                                        title="Remove variant"
                                      >
                                        <X size={12} className="stroke-[3]" />
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Navigation footer */}
                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={goBack}
                        className="flex-1 h-12 rounded-xl border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="flex-1 h-12 rounded-xl bg-[#C6FF00] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#C6FF00]/10 cursor-pointer hover:bg-[#b0e000]"
                      >
                        <span>Continue</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ========================================================
                  STEP 4: COLOUR VARIATIONS (CHIPS, ADD, REMOVE, REORDER)
                 ======================================================== */}
              {step === 4 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">STEP 4 OF 6</span>
                    <h1 className="text-2xl font-black tracking-tight text-white font-syne">Colour Options</h1>
                    <p className="text-white/50 text-xs">Configure the color choices buyers can choose from on checkout.</p>
                  </div>

                  <div className="flex-1 space-y-4 py-2">
                    {/* Add Color Input Row */}
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={customColorInput}
                        onChange={e => setCustomColorInput(e.target.value)}
                        placeholder="Add colour (e.g. Sage Green)"
                        className="flex-1 bg-white text-zinc-950 border border-zinc-200 focus:border-[#C6FF00] rounded-xl p-3.5 font-sans focus:outline-none transition-all placeholder:text-zinc-500 text-sm font-bold shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColor}
                        className="px-5 bg-[#C6FF00] hover:bg-[#b0e000] text-black rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>

                    {/* Chips Display */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/55 block">Active Colours (Arrange displays)</label>
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
                        {selectedColors.map((col, idx) => (
                          <div 
                            key={`col-chip-${col}-${idx}`}
                            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between text-xs font-sans font-bold"
                          >
                            <span className="text-white font-bold">{col}</span>
                            <div className="flex items-center gap-1.5">
                              {/* Reorder Buttons */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveColor(idx, 'left')}
                                className="w-7 h-7 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center border border-white/5 cursor-pointer disabled:opacity-30"
                                title="Move Up"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === selectedColors.length - 1}
                                onClick={() => moveColor(idx, 'right')}
                                className="w-7 h-7 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center border border-white/5 cursor-pointer disabled:opacity-30"
                                title="Move Down"
                              >
                                <ArrowDown size={12} />
                              </button>
                              
                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveColor(col)}
                                className="w-7 h-7 bg-white/5 hover:bg-red-950 hover:text-red-400 text-white/55 hover:border-red-500/20 rounded-lg flex items-center justify-center border border-white/5 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 h-12 rounded-xl border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 h-12 rounded-xl bg-[#C6FF00] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#C6FF00]/10 cursor-pointer hover:bg-[#b0e000]"
                    >
                      <span>Continue</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  STEP 5: DESCRIPTION & TECHNICAL SPECS
                 ======================================================== */}
              {step === 5 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">STEP 5 OF 6</span>
                    <h1 className="text-2xl font-black tracking-tight text-white font-syne">Garment Description</h1>
                    <p className="text-white/50 text-xs">Describe key aesthetics and provide specific technical classifications.</p>
                  </div>

                  <div className="flex-1 space-y-4 py-2 overflow-y-auto no-scrollbar max-h-[380px]">
                    {/* Story / Description Text Box */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/55">Product Narrative Description</label>
                      <textarea 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Detail materials, fitment notes, model reference, or drop context..."
                        className="w-full bg-white border border-white/[0.08] focus:border-[#C6FF00] rounded-xl p-4 text-zinc-950 font-sans focus:outline-none resize-none transition-all placeholder:text-zinc-400 text-xs leading-relaxed font-semibold"
                      />
                    </div>

                    {/* Material Option */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/55">Material Composition</label>
                      <input 
                        type="text"
                        value={material}
                        onChange={e => setMaterial(e.target.value)}
                        placeholder="e.g. 100% Cotton, 360gsm French Terry"
                        className="w-full bg-white border border-white/[0.08] focus:border-[#C6FF00] rounded-xl p-3 text-zinc-950 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-semibold"
                      />
                    </div>

                    {/* Brand */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/55">Brand / Designer</label>
                      <input 
                        type="text"
                        value={brand}
                        onChange={e => setBrand(e.target.value)}
                        placeholder="e.g. Custom Boutique or Own Label"
                        className="w-full bg-white border border-white/[0.08] focus:border-[#C6FF00] rounded-xl p-3 text-zinc-950 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-semibold"
                      />
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/55">Key Features</label>
                      <input 
                        type="text"
                        value={features}
                        onChange={e => setFeatures(e.target.value)}
                        placeholder="e.g. Heavyweight feel, Drop shoulder, Distressed hem"
                        className="w-full bg-white border border-white/[0.08] focus:border-[#C6FF00] rounded-xl p-3 text-zinc-950 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-semibold"
                      />
                    </div>

                    {/* Care Instructions */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/55">Care Instructions</label>
                      <input 
                        type="text"
                        value={careInstructions}
                        onChange={e => setCareInstructions(e.target.value)}
                        placeholder="e.g. Machine wash cold, lay flat to dry"
                        className="w-full bg-white border border-white/[0.08] focus:border-[#C6FF00] rounded-xl p-3 text-zinc-950 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-xs font-semibold"
                      />
                    </div>

                    {/* Gender and Condition Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-white/55">Gender Classification</label>
                        <select
                          value={gender}
                          onChange={e => setGender(e.target.value)}
                          className="w-full bg-[#121212] border border-white/[0.08] focus:border-[#C6FF00] rounded-xl p-3 text-white font-sans focus:outline-none transition-all text-xs"
                        >
                          <option value="Unisex">Unisex</option>
                          <option value="Men">Men</option>
                          <option value="Women">Women</option>
                          <option value="Kids">Kids</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-white/55">Condition Status</label>
                        <select
                          value={condition}
                          onChange={e => setCondition(e.target.value)}
                          className="w-full bg-[#121212] border border-white/[0.08] focus:border-[#C6FF00] rounded-xl p-3 text-white font-sans focus:outline-none transition-all text-xs"
                        >
                          <option value="New">New</option>
                          <option value="Like New">Like New</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 h-12 rounded-xl border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 h-12 rounded-xl bg-[#C6FF00] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#C6FF00]/10 cursor-pointer hover:bg-[#b0e000]"
                    >
                      <span>Continue</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  STEP 6: REVIEW & PUBLISH (PRODUCT CARD PREVIEW)
                 ======================================================== */}
              {step === 6 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">FINAL STEP</span>
                    <h1 className="text-2xl font-black tracking-tight text-white font-syne">Review & Deploy</h1>
                    <p className="text-white/50 text-xs">Inspect how your product will look inside the storefront catalog page.</p>
                  </div>

                  {/* Catalog-Style Mock Product Card */}
                  <div className="flex-1 py-1 flex flex-col justify-start space-y-4">
                    <div className="bg-[#121212] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col gap-3 font-sans">
                      <div className="aspect-[4/5] rounded-xl overflow-hidden bg-neutral-900 relative">
                        <img src={images[0]} className="w-full h-full object-cover" alt="" />
                        <span className="absolute top-3 left-3 bg-[#C6FF00] text-black text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                          {selectedCategory}
                        </span>
                      </div>

                      <div className="space-y-1 text-left">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base font-extrabold tracking-tight text-white leading-tight">{name}</h3>
                          <span className="text-base font-black text-[#C6FF00] shrink-0">${parseFloat(price || '0').toFixed(2)}</span>
                        </div>

                        {/* Specs overview line */}
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {getSizesForCategory(selectedCategory) !== null ? (
                            <span className="text-[10px] font-mono uppercase bg-white/5 text-white/70 border border-white/[0.08] px-2 py-0.5 rounded">
                              Sizes: {Object.entries(sizeStock).filter(([_, v]) => v.active).map(([k]) => k).join(', ')}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono uppercase bg-white/5 text-white/70 border border-white/[0.08] px-2 py-0.5 rounded">
                              Size: Universal (Qty: {generalStock})
                            </span>
                          )}

                          <span className="text-[10px] font-mono uppercase bg-white/5 text-white/70 border border-white/[0.08] px-2 py-0.5 rounded">
                            Colors: {selectedColors.join(', ')}
                          </span>

                          {material && (
                            <span className="text-[10px] font-mono uppercase bg-white/5 text-white/70 border border-[#C6FF00]/20 px-2 py-0.5 rounded">
                              {material}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Featured Product Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C6FF00]/10 flex items-center justify-center text-[#C6FF00]">
                          <Sparkles size={16} />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-white block">Feature on Home</span>
                          <span className="text-[10px] text-white/40">Place this garment inside your homepage catalog hero.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFeatured(!isFeatured)}
                        className={`w-12 h-6 rounded-full relative transition-all ${
                          isFeatured ? 'bg-[#C6FF00]' : 'bg-white/10'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${
                          isFeatured ? 'left-7 bg-black' : 'left-1 bg-white/60'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      disabled={publishing}
                      onClick={goBack}
                      className="flex-1 h-12 rounded-xl border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={publishing}
                      onClick={handlePublishProduct}
                      className="flex-1 h-12 rounded-xl bg-[#C6FF00] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#C6FF00]/10 cursor-pointer hover:bg-[#b0e000] disabled:opacity-50"
                    >
                      {publishing ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} className="stroke-[3]" />
                          <span>Publish Live</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          ) : (
            /* ========================================================
               SUCCESS STATE SCREEN (CONGRATULATORY ANIMATION)
               ======================================================== */
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex-1 flex flex-col justify-between py-12 text-center space-y-6 h-full max-h-[500px]"
            >
              <div className="space-y-6 my-auto">
                {/* Visual confirmation circle */}
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="w-20 h-20 rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/30 flex items-center justify-center text-[#C6FF00] mx-auto shadow-lg shadow-[#C6FF00]/10"
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
                  className="w-full h-12 rounded-xl bg-[#C6FF00] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer active:scale-[0.98] hover:bg-[#b0e000]"
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
