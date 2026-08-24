import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  X, ArrowLeft, Plus, Trash2, Camera, Check, ChevronRight, Loader2, ChevronDown, Image as ImageIcon, Sparkles, Tag, Layers, HelpCircle, ArrowUp, ArrowDown, RefreshCw, Upload, Shirt
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { uploadImage } from '../utils/uploadImage';
import { useGlobalCategories } from '../hooks/useGlobalCategories';
import { getCategoryConfig } from '../utils/categoryConfig';
import { SizeSelector } from '../components/SizeSelector';
import { cropToSquare, enhanceLighting, compressAndOptimize } from '../utils/imageEnhancer';
import { ProductCategoryCard } from '../components/ProductCategoryCard';
import { setOnboardingStep } from '../hooks/useOnboarding';
import { canAddProduct, getProductImageLimit } from '../config/plans';
import { UpgradePromptModal } from '../components/plans/UpgradePromptModal';
import { ProUpgradePaywallCard } from '../components/plans/ProUpgradePaywallCard';
import { Shop } from '../types';

interface SizeStock {
  active: boolean;
  stock: number;
}

export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraPicker = () => {
    cameraInputRef.current?.click();
  };

  const [aiGenerating, setAiGenerating] = useState(false);

  const handleGenerateAIDescription = async () => {
    if (!name) {
      toast.error('Please enter a product title in Step 1 first!');
      return;
    }
    setAiGenerating(true);
    const toastId = toast.loading('Generating AI description & selling points...');
    try {
      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          category: selectedCategory || 'Apparel',
          price: price || '0.00'
        })
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
      }
      if (data.sellingPoints && Array.isArray(data.sellingPoints)) {
        setFeatures(data.sellingPoints.join(', '));
      }
      toast.success('Generated with Gemini! Review and edit before saving.', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate description with AI.', { id: toastId });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCropSquare = async (idx: number) => {
    try {
      const toastId = toast.loading('Cropping image to 1:1 square...');
      const cropped = await cropToSquare(images[idx]);
      setImages(prev => {
        const copy = [...prev];
        copy[idx] = cropped;
        return copy;
      });
      toast.success('Image cropped to 1:1 square!', { id: toastId });
    } catch (err) {
      toast.error('Crop failed');
    }
  };

  const handleEnhanceLighting = async (idx: number) => {
    try {
      const toastId = toast.loading('Enhancing lighting & contrast...');
      const enhanced = await enhanceLighting(images[idx]);
      setImages(prev => {
        const copy = [...prev];
        copy[idx] = enhanced;
        return copy;
      });
      toast.success('Lighting enhanced!', { id: toastId });
    } catch (err) {
      toast.error('Enhancement failed');
    }
  };
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [productStatus, setProductStatus] = useState<'active' | 'sold_out'>('active');
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopHandle, setShopHandle] = useState<string | null>(null);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [isAtLimit, setIsAtLimit] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch Global Categories
  const { categories: globalCategories, loading: globalCategoriesLoading } = useGlobalCategories();

  // Step 1: Basic Details
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tops');

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
  const [publishedCount, setPublishedCount] = useState<number>(0);

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
            .select('*')
            .eq('owner_id', session.user.id).order('created_at', { ascending: false }).limit(1)
            .maybeSingle();
          if (shop) {
            setShopId(shop.id);
            setShopHandle(shop.slug);
            setShopData(shop as unknown as Shop);

            // Check active published products count
            const { count: activeCount } = await supabase
              .from('products')
              .select('id', { count: 'exact', head: true })
              .eq('shop_id', shop.id)
              .eq('is_published', true);

            if (typeof activeCount === 'number') {
              setPublishedCount(activeCount);
            }

            const isClothingShop = (shop.page_type || 'clothing').toLowerCase() === 'clothing' || shop.page_type === 'storefront';
            const check = canAddProduct(shop as unknown as Shop, activeCount || 0);
            if (!check.allowed && !isClothingShop) {
              setIsAtLimit(true);
              setShowUpgradeModal(true);
            }
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
    const maxPhotos = getProductImageLimit(shopData);
    if (images.length + files.length > maxPhotos) {
      toast.error(`Maximum of ${maxPhotos} photos allowed on your plan.`);
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
      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('Uploaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast.error('Upload failed: ' + err.message, { id: toastId });
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
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
      if (!name.trim() || name.trim().length < 3) {
        toast.error('Product name must be at least 3 characters.');
        return;
      }
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        toast.error('Please enter a valid product price.');
        return;
      }
      if (!description.trim() || description.trim().length < 2) {
        toast.error('Please enter a product description.');
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
      const config = getCategoryConfig(selectedCategory);
      if (!config.skipSizes) {
        const activeSizes = Object.entries(sizeStock).filter(([_, val]) => val.active);
        if (activeSizes.length === 0) {
          toast.error(config.isStorage ? 'Please select at least one storage option.' : 'Please configure at least one size.');
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

    // Navigation logic for accessories skipping sizes
    const config = getCategoryConfig(selectedCategory);
    if (step === 3 && config.skipSizes) {
      // Automatically ensure "One Size" is active and jump directly to step 4 (Colours)
      setSizeStock({
        'One Size': { active: true, stock: 10 }
      });
      setDirection(1);
      setStep(4);
      return;
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
      
      let currentShopId = shopId;
      if (!currentShopId || String(currentShopId).startsWith('local-shop-') || currentShopId === '55555555-5555-5555-5555-555555555555') {
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (shop) {
          currentShopId = shop.id;
        }
      }

      // Structure size variants
      let configuredSizes = [];
      let totalStock = 0;

      const config = getCategoryConfig(selectedCategory);

      if (!config.skipSizes) {
        configuredSizes = Object.entries(sizeStock)
          .filter(([_, value]) => value.active)
          .map(([size, value]) => ({
            size,
            quantity: value.stock
          }));
        totalStock = configuredSizes.reduce((sum, s) => sum + s.quantity, 0);
      } else {
        const qty = 10;
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

      const productPayload: any = {
        shop_id: currentShopId,
        name: name.trim(),
        price: parseFloat(price),
        category: selectedCategory || null,
        description: finalDescription || null,
        images: images,
        image_url: images[0] || null,
        sizes: configuredSizes,
        stock: totalStock,
        total_stock: totalStock,
        colours: selectedColors,
        is_published: true,
        status: 'active',
        created_at: new Date().toISOString()
      };

      if (!currentShopId || String(currentShopId).startsWith('local-shop-') || currentShopId === '55555555-5555-5555-5555-555555555555') {
        throw new Error("Cannot create product: No active, valid shop found for your profile.");
      }

      // Direct product insertion using authenticated Supabase client
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(productPayload)
        .select('*')
        .single();

      if (insertError) {
        console.error('[AddProduct] Supabase product insert error:', insertError);
        const errMsg = insertError.message || '';
        const errDetails = insertError.details || '';
        const errCode = insertError.code || '';

        const isLimitReached = 
          errMsg.includes('PRODUCT_LIMIT_REACHED') ||
          errMsg.includes('limit reached') ||
          errMsg.includes('quota') ||
          errDetails.includes('PRODUCT_LIMIT_REACHED') ||
          errDetails.includes('quota') ||
          errCode === '23514';

        if (isLimitReached) {
          toast.dismiss(apiToast);
          const isClothingShop = (shopData?.page_type || 'clothing').toLowerCase() === 'clothing' || shopData?.page_type === 'storefront';
          if (isClothingShop) {
            toast.error('Free clothing shops have unlimited products. Refresh and try publishing again.', { duration: 6000 });
            setPublishing(false);
            return;
          }
          toast.error('Your vehicle listing limit has been reached. Upgrade to Vehicle Premium to add another vehicle.', { duration: 6000 });
          setIsAtLimit(true);
          setShowUpgradeModal(true);
          setPublishing(false);
          return;
        }

        throw new Error(errMsg || 'Failed to publish product. Please try again.');
      }

      // Non-blocking inventory variant sync
      if (newProduct?.id && Array.isArray(configuredSizes) && configuredSizes.length > 0) {
        try {
          for (const sizeObj of configuredSizes) {
            if (sizeObj && sizeObj.size) {
              const stockQty = typeof sizeObj.quantity === 'number' 
                ? sizeObj.quantity 
                : (parseInt(sizeObj.quantity, 10) || 0);

              await supabase
                .from('inventory')
                .upsert({
                  product_id: newProduct.id,
                  size: String(sizeObj.size),
                  stock_count: stockQty
                });
            }
          }
        } catch (invErr) {
          console.warn('[AddProduct] Inventory variant sync notice:', invErr);
        }
      }

      const generatedId = newProduct.id;
      setProductId(generatedId);
      await setOnboardingStep(currentShopId, 'completed');

      toast.success('Product live! 🚀', { id: apiToast });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('[AddProduct] Publish error:', err);
      toast.error('Failed to publish product. ' + (err.message || 'Please try again.'), { id: apiToast });
    } finally {
      setPublishing(false);
    }
  };

  const handleResetForm = () => {
    // Reset flow and navigation controls
    setStep(1);
    setDirection(1);
    setUploading(false);
    setUploadProgress(0);
    setReplacingIndex(null);
    setProductStatus('active');
    setShowDiscardModal(false);
    setPublishing(false);
    setIsSuccess(false);
    setProductId(null);
    setAiGenerating(false);

    // Step 1: Basic Details
    setName('');
    setPrice('');
    if (globalCategories && globalCategories.length > 0) {
      setSelectedCategory(globalCategories[0].name);
    } else {
      setSelectedCategory('Tops');
    }

    // Step 2: Photos
    setImages([]);
    setIsDragOver(false);

    // Step 3: Sizes & Stock
    setActiveSizeEditing(null);
    setTempStockInput('');
    setShowCustomSizeInput(false);
    setCustomSizeName('');
    setSizeStock({});
    setGeneralStock('10');

    // Step 4: Colours
    setSelectedColors(['Midnight Black']);
    setCustomColorInput('');

    // Step 5: Description & Specs
    setDescription('');
    setBrand('');
    setMaterial('');
    setGender('Unisex');
    setCondition('New');
    setFeatures('');
    setCareInstructions('');

    // Step 6: Review & Publish
    setIsFeatured(false);

    // Reset file input element values
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
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

  if (isAtLimit && !isSuccess && shopData?.page_type === 'vehicles') {
    return (
      <ProUpgradePaywallCard
        shop={shopData}
        productCount={publishedCount || 0}
        onBack={() => navigate('/inventory')}
        onSuccess={() => {
          setIsAtLimit(false);
          setStep(1);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans overflow-y-auto select-none relative flex flex-col justify-between">
      
      {/* 3px Neon Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-zinc-100 z-50 max-w-[430px] mx-auto">
        <div 
          className="h-full bg-[#C8FF00] transition-all duration-300"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      {/* HEADER */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-200 bg-white z-40 relative max-w-[430px] w-full mx-auto">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button 
              type="button"
              onClick={goBack}
              className="p-2 -ml-2 text-zinc-600 hover:text-black transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <span className="text-zinc-950 text-[11px] font-black tracking-[2px] uppercase font-mono">
            ADD PRODUCT
          </span>
        </div>

        {step === 1 ? (
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-black transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        ) : (
          <span className="text-zinc-800 text-[10px] font-mono tracking-widest font-black uppercase bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
            Step {step} of 6
          </span>
        )}
      </div>

      {/* CORE CONTAINER */}
      <div className="flex-1 w-full max-w-[430px] mx-auto px-5 pt-4 pb-24 flex flex-col justify-start relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {isAtLimit && !isSuccess && shopData?.page_type === 'vehicles' ? (
            <motion.div
              key="limit-paywall"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex-1 flex flex-col justify-between py-6 space-y-6"
            >
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#C8FF00]/10 border border-[#C8FF00]/30 text-black flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles size={28} className="text-zinc-950" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-zinc-950 bg-[#C8FF00] px-3 py-1 rounded-full border border-black/10">
                    Vehicle Free limit · {publishedCount || 0} active vehicles
                  </span>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950 mt-2">
                    Product Limit Reached
                  </h1>
                  <p className="text-xs text-zinc-600 font-medium leading-relaxed max-w-xs mx-auto">
                    Your Free vehicle plan has reached its active-listing limit. Upgrade to Vehicle Premium to keep growing your showroom.
                  </p>
                </div>

                {/* Vehicle Premium Summary Card */}
                <div className="bg-zinc-950 text-white p-6 rounded-3xl border border-zinc-800 space-y-4 text-left shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-900 font-extrabold bg-[#C8FF00] px-2.5 py-0.5 rounded-full">
                        Growth Tier
                      </span>
                      <h3 className="text-lg font-black uppercase tracking-tight text-white mt-1">
                        Vehicle Premium
                      </h3>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-[#C8FF00]">$30</span>
                        <span className="text-[10px] text-zinc-400 font-semibold block uppercase font-mono">Per Year</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-zinc-800 pt-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                      <div className="w-4 h-4 rounded-full bg-[#C8FF00]/20 text-[#C8FF00] flex items-center justify-center shrink-0">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span>Unlimited active product listings</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                      <div className="w-4 h-4 rounded-full bg-[#C8FF00]/20 text-[#C8FF00] flex items-center justify-center shrink-0">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span>Verified storefront badge</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                      <div className="w-4 h-4 rounded-full bg-[#C8FF00]/20 text-[#C8FF00] flex items-center justify-center shrink-0">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span>Priority marketplace search placement</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                      <div className="w-4 h-4 rounded-full bg-[#C8FF00]/20 text-[#C8FF00] flex items-center justify-center shrink-0">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span>Direct WhatsApp customer ordering</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full h-14 rounded-2xl bg-[#C8FF00] hover:bg-[#b2e600] text-zinc-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles size={16} />
                  <span>Upgrade to Vehicle Premium — $30 USD / Year</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/inventory')}
                  className="w-full h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Manage Existing Products
                </button>
              </div>
            </motion.div>
          ) : !isSuccess ? (
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
                  STEP 1: BASIC INFORMATION (PHASE 1)
                 ======================================================== */}
              {step === 1 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Step 1 of 6</span>
                      <div className="flex gap-1.5">
                        <span className="w-6 h-1.5 rounded-full bg-[#C8FF00]" />
                        <span className="w-6 h-1.5 rounded-full bg-zinc-200" />
                        <span className="w-6 h-1.5 rounded-full bg-zinc-200" />
                        <span className="w-6 h-1.5 rounded-full bg-zinc-200" />
                        <span className="w-6 h-1.5 rounded-full bg-zinc-200" />
                        <span className="w-6 h-1.5 rounded-full bg-zinc-200" />
                      </div>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-950 font-sans">Create your product.</h1>
                    <p className="text-zinc-500 text-sm">Let's start with the basics.</p>
                  </div>

                  <div className="space-y-6 py-2 flex-1">
                    {/* Section 1: Product Name */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Product Name <span className="text-red-500">*</span></label>
                        <span className="text-[11px] font-mono text-zinc-400">{name.length}/80</span>
                      </div>
                      <input 
                        type="text"
                        maxLength={80}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Heavyweight Oversized Hoodie"
                        className="w-full bg-zinc-50 border-2 border-zinc-200 focus:border-[#C8FF00] rounded-2xl p-4 text-zinc-950 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-sm font-semibold shadow-sm"
                      />
                    </div>

                    {/* Section 1.5: Price */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Price (USD) <span className="text-red-500">*</span></label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">$</span>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-zinc-50 border-2 border-zinc-200 focus:border-[#C8FF00] rounded-2xl p-4 pl-9 text-zinc-950 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-sm font-semibold shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Section 2: Product Description */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Product Description <span className="text-red-500">*</span></label>
                        <span className="text-[11px] font-mono text-zinc-400">{description.length} / 500</span>
                      </div>
                      <textarea 
                        maxLength={500}
                        rows={4}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Tell customers about this product..."
                        className="w-full bg-zinc-50 border-2 border-zinc-200 focus:border-[#C8FF00] rounded-2xl p-4 text-zinc-950 font-sans focus:outline-none transition-all placeholder:text-zinc-400 text-sm font-normal resize-none shadow-sm"
                      />
                    </div>

                    {/* Section 3: Product Category */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">Product Category <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { name: 'Tops', icon: 'Tops' },
                          { name: 'Bottoms', icon: 'Bottoms' },
                          { name: 'Shoes', icon: 'Shoes' },
                          { name: 'Hats', icon: 'Hats' },
                          { name: 'Accessories', icon: 'Accessories' },
                          { name: 'Phones', icon: 'Phones' }
                        ].map(cat => (
                          <ProductCategoryCard
                            key={cat.name}
                            name={cat.name}
                            iconType={cat.icon}
                            isSelected={selectedCategory === cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <div className="pt-4">
                    <button
                      type="button"
                      disabled={name.trim().length < 3 || !price || parseFloat(price) <= 0 || description.trim().length < 2 || !selectedCategory}
                      onClick={goNext}
                      className={`w-full h-14 rounded-2xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                        name.trim().length >= 3 && price && parseFloat(price) > 0 && description.trim().length >= 2 && selectedCategory
                          ? 'bg-[#C8FF00] text-black hover:bg-[#b8eb00] cursor-pointer active:scale-[0.98] shadow-[#C8FF00]/20'
                          : 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>Continue →</span>
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
                    <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Step 2 of 6</span>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-950 font-sans">Add product images.</h1>
                    <p className="text-zinc-500 text-sm">Upload up to 10 images. The first image will be your cover photo.</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-start space-y-4 py-2">
                    {/* Drag and Drop Box */}
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={triggerFilePicker}
                      className="h-44 w-full bg-white border-2 border-dashed border-zinc-300 hover:border-zinc-400 rounded-3xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group relative overflow-hidden shadow-sm"
                    >
                      {uploading ? (
                        <div className="w-full max-w-[240px] space-y-3 flex flex-col items-center">
                          <Loader2 size={24} className="text-zinc-950 animate-spin" />
                          <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider animate-pulse">Uploading to ThreadZW...</span>
                          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#C8FF00] h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <span className="text-[10px] text-zinc-600 font-mono font-black">{uploadProgress}%</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-full bg-zinc-100 group-hover:bg-[#C8FF00]/20 flex items-center justify-center text-zinc-700 transition-all mb-3 border border-zinc-200">
                            <Upload size={24} />
                          </div>
                          <span className="text-sm font-extrabold text-zinc-950 group-hover:text-black transition-colors">
                            Tap to upload or drag and drop
                          </span>
                          <p className="text-xs text-zinc-400 mt-1">PNG, JPG or WebP • Max 10MB each</p>
                        </>
                      )}
                    </div>

                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFilesSelected}
                      multiple
                      className="hidden"
                      accept="image/*"
                    />

                    <input 
                      type="file"
                      ref={replaceFileInputRef}
                      onChange={handleReplacePhotoSelected}
                      className="hidden"
                      accept="image/*"
                    />

                    {/* Previews grid */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Uploaded images ({images.length}/10)</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto no-scrollbar">
                        {Array.from({ length: 8 }).map((_, idx) => {
                          const img = images[idx];
                          return (
                            <div 
                              key={`slot-${idx}`}
                              className="aspect-[3/4] bg-zinc-100 border-2 border-zinc-200 rounded-xl overflow-hidden relative group flex items-center justify-center"
                            >
                              {img ? (
                                <>
                                  <img src={img} className="w-full h-full object-cover" alt="" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                                    <div className="flex justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePhoto(idx)}
                                        className="w-5 h-5 rounded bg-black/80 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <span className="text-zinc-300 font-mono text-xs font-bold">{idx + 1}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="w-24 h-14 rounded-2xl border-2 border-zinc-200 text-zinc-700 hover:text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer bg-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 h-14 rounded-2xl bg-[#C8FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#C8FF00]/20 cursor-pointer hover:bg-[#b8eb00]"
                    >
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  STEP 3: SIZES OR STORAGE OPTIONS
                 ======================================================== */}
              {step === 3 && (() => {
                const config = getCategoryConfig(selectedCategory);
                const sizes = config.sizes;

                return (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Step 3 of 6</span>
                        <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200 inline-flex items-center gap-1">
                          Need help? Size guide
                        </span>
                      </div>
                      <h1 className="text-3xl font-black tracking-tight text-zinc-950 font-sans">
                        {config.isStorage ? 'Storage Options.' : 'Select sizes.'}
                      </h1>
                      <p className="text-zinc-500 text-sm">
                        {config.isStorage ? 'Choose the storage capacities available.' : 'Choose the sizes available for this product.'}
                      </p>
                    </div>

                    <div className="flex-1 space-y-4 py-2 overflow-y-auto no-scrollbar max-h-96">
                      {/* Category card preview */}
                      <div className="bg-white border-2 border-zinc-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/20 text-zinc-950 flex items-center justify-center border border-[#C8FF00]/40">
                          <Shirt size={20} />
                        </div>
                        <div>
                          <span className="text-xs font-black text-zinc-950 block">Category: {selectedCategory}</span>
                          <span className="text-xs text-zinc-500 font-medium">
                            {config.isStorage ? 'Select available storage variants.' : 'Choose all sizes that apply.'}
                          </span>
                        </div>
                      </div>

                      <SizeSelector
                        sizes={sizes}
                        selectedSizes={sizeStock}
                        isStorage={config.isStorage}
                        onToggleSize={(sz) => {
                          const isAdded = sizeStock[sz]?.active;
                          if (isAdded) {
                            handleRemoveSize(sz);
                          } else {
                            setSizeStock(prev => ({
                              ...prev,
                              [sz]: { active: true, stock: 10 }
                            }));
                          }
                        }}
                      />

                      {/* Info banner */}
                      <div className="p-4 bg-[#C8FF00]/10 border-2 border-[#C8FF00]/30 rounded-2xl flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#C8FF00] text-black flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                          i
                        </div>
                        <p className="text-xs font-bold text-zinc-900 leading-relaxed">
                          You'll be able to set stock for each {config.isStorage ? 'storage option' : 'size'} in the next step.
                        </p>
                      </div>
                    </div>

                    {/* Navigation footer */}
                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={goBack}
                        className="w-24 h-14 rounded-2xl border-2 border-zinc-200 text-zinc-700 hover:text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer bg-white"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="flex-1 h-14 rounded-2xl bg-[#C8FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#C8FF00]/20 cursor-pointer hover:bg-[#b8eb00]"
                      >
                        <span>Continue</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ========================================================
                  STEP 4: COLOUR VARIATIONS
                 ======================================================== */}
              {step === 4 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Step 4 of 6</span>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-950 font-sans">Choose colours.</h1>
                    <p className="text-zinc-500 text-sm">Select all the colours available for this product.</p>
                  </div>

                  <div className="flex-1 space-y-4 py-2 overflow-y-auto no-scrollbar max-h-[420px]">
                    {/* Tip banner */}
                    <div className="p-3.5 bg-zinc-50 border-2 border-zinc-200 rounded-2xl flex items-center gap-2.5 text-xs text-zinc-700 font-bold">
                      <div className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-800 flex items-center justify-center shrink-0 font-bold text-[10px]">!</div>
                      <span>Tip: You can select multiple colours.</span>
                    </div>

                    {/* Popular colors grid */}
                    <div className="space-y-3">
                      <label className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider block">Popular colours</label>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { name: 'Black', hex: '#000000', border: 'border-zinc-900' },
                          { name: 'White', hex: '#FFFFFF', border: 'border-zinc-300' },
                          { name: 'Grey', hex: '#808080', border: 'border-zinc-400' },
                          { name: 'Navy', hex: '#1B2A4A', border: 'border-blue-950' },
                          { name: 'Blue', hex: '#2563EB', border: 'border-blue-600' },
                          { name: 'Red', hex: '#DC2626', border: 'border-red-600' },
                          { name: 'Green', hex: '#16A34A', border: 'border-green-600' },
                          { name: 'Olive', hex: '#556B2F', border: 'border-emerald-800' },
                          { name: 'Brown', hex: '#78350F', border: 'border-amber-900' },
                          { name: 'Beige', hex: '#F5F5DC', border: 'border-amber-200' },
                          { name: 'Cream', hex: '#FFFDD0', border: 'border-amber-100' },
                          { name: 'Yellow', hex: '#EAB308', border: 'border-yellow-500' },
                          { name: 'Orange', hex: '#F97316', border: 'border-orange-500' },
                          { name: 'Pink', hex: '#EC4899', border: 'border-pink-500' },
                          { name: 'Purple', hex: '#9333EA', border: 'border-purple-600' },
                          { name: 'Burgundy', hex: '#800020', border: 'border-rose-950' },
                          { name: 'Sky Blue', hex: '#7DD3FC', border: 'border-sky-300' },
                          { name: 'Denim Blue', hex: '#1E40AF', border: 'border-blue-800' },
                          { name: 'Gold', hex: '#CA8A04', border: 'border-yellow-600' },
                          { name: 'Silver', hex: '#D1D5DB', border: 'border-zinc-300' },
                        ].map((c) => {
                          const isSelected = selectedColors.includes(c.name);
                          return (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedColors(selectedColors.filter(col => col !== c.name));
                                } else {
                                  setSelectedColors([...selectedColors, c.name]);
                                }
                              }}
                              className="flex flex-col items-center gap-1.5 cursor-pointer group"
                            >
                              <div className={`w-12 h-12 rounded-full relative flex items-center justify-center shadow-sm border-2 transition-all ${c.border} ${
                                isSelected ? 'ring-2 ring-zinc-950 ring-offset-2 scale-105' : 'hover:scale-105'
                              }`} style={{ backgroundColor: c.hex }}>
                                {isSelected && (
                                  <div className="w-6 h-6 rounded-full bg-zinc-950 text-[#C8FF00] flex items-center justify-center shadow-sm">
                                    <Check size={14} className="stroke-[3]" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-zinc-800 text-center truncate w-full">{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="w-24 h-14 rounded-2xl border-2 border-zinc-200 text-zinc-700 hover:text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer bg-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 h-14 rounded-2xl bg-[#C8FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#C8FF00]/20 cursor-pointer hover:bg-[#b8eb00]"
                    >
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  STEP 5: STOCK BY SIZE
                 ======================================================== */}
              {step === 5 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Step 5 of 6</span>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-950 font-sans">Set stock.</h1>
                    <p className="text-zinc-500 text-sm">Add the available stock for each size.</p>
                  </div>

                  <div className="flex-1 space-y-4 py-2 overflow-y-auto no-scrollbar max-h-[420px]">
                    {/* Info banner */}
                    <div className="p-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-800 flex items-center justify-center shrink-0 font-bold text-xs">i</div>
                      <p className="text-xs font-bold text-zinc-900 leading-relaxed">
                        Customers will only be able to order what's in stock.
                      </p>
                    </div>

                    {/* Category summary card */}
                    <div className="p-4 bg-white border-2 border-zinc-200 rounded-2xl space-y-1 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#C8FF00]/20 text-zinc-950 flex items-center justify-center border border-[#C8FF00]/40">
                          <Shirt size={16} />
                        </div>
                        <span className="text-xs font-black text-zinc-950">Category: {selectedCategory}</span>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium pl-9">
                        Selected sizes: {Object.entries(sizeStock).filter(([_, v]) => v.active).map(([k]) => k).join(', ') || 'None selected'}
                      </p>
                    </div>

                    {/* Stock by size list */}
                    <div className="space-y-3">
                      <label className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider block">Stock by size</label>
                      <div className="space-y-2.5">
                        {Object.entries(sizeStock).filter(([_, v]) => v.active).length === 0 ? (
                          <div className="p-6 bg-zinc-50 border-2 border-zinc-200 rounded-2xl text-center text-xs text-zinc-500">
                            No sizes selected in Step 3. Please go back or default stock will apply.
                          </div>
                        ) : (
                          Object.entries(sizeStock)
                            .filter(([_, v]) => v.active)
                            .map(([sz, details]) => (
                              <div 
                                key={`stock-row-${sz}`}
                                className="p-4 bg-white border-2 border-zinc-200 rounded-2xl flex items-center justify-between shadow-sm"
                              >
                                <span className="font-extrabold text-sm text-zinc-950 w-12">{sz}</span>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = details.stock;
                                      if (current > 0) {
                                        setSizeStock(prev => ({
                                          ...prev,
                                          [sz]: { ...details, stock: current - 1 }
                                        }));
                                      }
                                    }}
                                    className="w-10 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold flex items-center justify-center transition-colors cursor-pointer border border-zinc-200 text-lg"
                                  >
                                    -
                                  </button>
                                  <span className="font-black text-base text-zinc-950 w-8 text-center">{details.stock}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = details.stock;
                                      setSizeStock(prev => ({
                                        ...prev,
                                        [sz]: { ...details, stock: current + 1 }
                                      }));
                                    }}
                                    className="w-10 h-10 rounded-xl bg-[#C8FF00]/20 hover:bg-[#C8FF00]/40 text-zinc-950 font-bold flex items-center justify-center transition-colors cursor-pointer border border-[#C8FF00]/50 text-lg"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="w-24 h-14 rounded-2xl border-2 border-zinc-200 text-zinc-700 hover:text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer bg-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 h-14 rounded-2xl bg-[#C8FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#C8FF00]/20 cursor-pointer hover:bg-[#b8eb00]"
                    >
                      <span>Continue</span>
                      <ChevronRight size={16} />
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
                        <span className="absolute top-3 left-3 bg-[#25D366] text-black text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                          {selectedCategory}
                        </span>
                      </div>

                      <div className="space-y-1 text-left">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base font-extrabold tracking-tight text-white leading-tight">{name}</h3>
                          <span className="text-base font-black text-[#25D366] shrink-0">${parseFloat(price || '0').toFixed(2)}</span>
                        </div>

                        {/* Specs overview line */}
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {!getCategoryConfig(selectedCategory).skipSizes ? (
                            <span className="text-[10px] font-mono uppercase bg-white/5 text-white/70 border border-white/[0.08] px-2 py-0.5 rounded">
                              Sizes: {Object.entries(sizeStock).filter(([_, v]) => v.active).map(([k]) => k).join(', ')}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono uppercase bg-white/5 text-white/70 border border-white/[0.08] px-2 py-0.5 rounded">
                              Size: One Size
                            </span>
                          )}

                          <span className="text-[10px] font-mono uppercase bg-white/5 text-white/70 border border-white/[0.08] px-2 py-0.5 rounded">
                            Colors: {selectedColors.join(', ')}
                          </span>

                          {material && (
                            <span className="text-[10px] font-mono uppercase bg-white/5 text-white/70 border border-[#25D366]/20 px-2 py-0.5 rounded">
                              {material}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Featured Product Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                          <Sparkles size={16} />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-black block">Feature on Home</span>
                          <span className="text-[10px] text-zinc-600 font-medium">Place this garment inside your homepage catalog hero.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFeatured(!isFeatured)}
                        className={`w-12 h-6 rounded-full relative transition-all ${
                          isFeatured ? 'bg-[#25D366]' : 'bg-zinc-200 border border-zinc-300'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${
                          isFeatured ? 'left-7 bg-black' : 'left-1 bg-white'
                        }`} />
                      </button>
                    </div>

                    {/* Product Availability Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                          <Check size={16} />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-black block">Upload to shopfront</span>
                          <span className="text-[10px] text-zinc-600 font-medium">Publish item directly to your storefront catalog.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProductStatus(productStatus === 'active' ? 'sold_out' : 'active')}
                        className={`w-12 h-6 rounded-full relative transition-all ${
                          productStatus === 'active' ? 'bg-[#25D366]' : 'bg-zinc-200 border border-zinc-300'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${
                          productStatus === 'active' ? 'left-7 bg-black' : 'left-1 bg-white'
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
                      className="flex-1 h-12 rounded-xl bg-[#25D366] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#25D366]/10 cursor-pointer hover:bg-[#b0e000] disabled:opacity-50"
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
               SUCCESS STATE SCREEN (PHASE 6)
               ======================================================== */
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex-1 flex flex-col justify-between py-6 text-center space-y-6 h-full max-w-md mx-auto"
            >
              <div className="space-y-6 my-auto">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Step 6 of 6</span>
                  <div className="flex gap-1.5">
                    <span className="w-6 h-1.5 rounded-full bg-[#C8FF00]" />
                    <span className="w-6 h-1.5 rounded-full bg-[#C8FF00]" />
                    <span className="w-6 h-1.5 rounded-full bg-[#C8FF00]" />
                    <span className="w-6 h-1.5 rounded-full bg-[#C8FF00]" />
                    <span className="w-6 h-1.5 rounded-full bg-[#C8FF00]" />
                    <span className="w-6 h-1.5 rounded-full bg-[#C8FF00]" />
                  </div>
                </div>

                {/* Visual confirmation circle with scale-in animation */}
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: [0.4, 1.15, 1], opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-20 h-20 rounded-full bg-[#C8FF00]/15 border-2 border-[#C8FF00] flex items-center justify-center text-zinc-950 mx-auto shadow-xl shadow-[#C8FF00]/20"
                  >
                    <Check size={36} className="stroke-[3] text-zinc-950" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-zinc-950 font-sans">
                    Product created!
                  </h1>
                  <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed">
                    Your product has been successfully published to your ThreadZW store. Customers can now discover and order it.
                  </p>
                </div>

                {/* Product Preview Card */}
                <div className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-2xl p-4 flex gap-4 text-left shadow-sm">
                  <div className="w-20 h-24 rounded-xl bg-zinc-200 overflow-hidden shrink-0 relative">
                    {images[0] && (
                      <img src={images[0]} className="w-full h-full object-cover" alt="" />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-center gap-1">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">{selectedCategory}</span>
                    <h4 className="font-extrabold text-sm leading-tight line-clamp-1 text-zinc-900">
                      {name}
                    </h4>
                    <p className="text-zinc-950 font-black text-base">
                      USD {parseFloat(price || '0').toFixed(2)}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-medium text-zinc-600">
                      <span>{Object.entries(sizeStock).filter(([_, v]) => v.active).length || 1} Sizes</span>
                      <span>•</span>
                      <span>{selectedColors.length} Colours</span>
                      <span>•</span>
                      <span className="font-bold text-zinc-900">Total Stock: {Object.entries(sizeStock).filter(([_, v]) => v.active).reduce((sum, [_, v]) => sum + v.stock, 0) || generalStock || 10}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION ROW */}
              <div className="space-y-3 pt-4 w-full">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full h-14 rounded-2xl bg-[#C8FF00] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer active:scale-[0.98] hover:bg-[#b8eb00] shadow-lg shadow-[#C8FF00]/20"
                >
                  Add Another Product
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full h-14 rounded-2xl bg-white border-2 border-zinc-200 text-zinc-900 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer hover:border-zinc-300 active:scale-[0.98] shadow-sm"
                >
                  Go to Dashboard
                </button>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="text-xs font-bold text-zinc-600 hover:text-black inline-flex items-center gap-1 transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    <span>Go to Dashboard →</span>
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* UPGRADE MODAL WINDOW */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        shop={shopData}
        reason="product_limit"
      />

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
                  handleResetForm();
                  navigate('/inventory');
                }}
                className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold leading-none cursor-pointer transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 h-10 rounded-xl bg-[#25D366] text-black text-xs font-bold leading-none cursor-pointer transition-colors"
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
