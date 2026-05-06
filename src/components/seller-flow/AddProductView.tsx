import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Plus, Minus, Check, Lock } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast as sonnerToast } from 'sonner';

export const AddProductView: React.FC<{ myShop: any; onPublished: () => void | Promise<void> }> = ({ myShop, onPublished }) => {
  const { user } = useAuth();
  const { setSellerFlowState } = useInventory();
  
  // Form State
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([null, null, null, null, null, null]);
  const [photoPreviews, setPhotoPreviews] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [uploadProgress, setUploadProgress] = useState<number[]>(new Array(6).fill(0));
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('sneakers');
  const [condition, setCondition] = useState<string | null>(null);
  const [sizes, setSizes] = useState<{ size: string; qty: number }[]>([]);
  const [newSize, setNewSize] = useState('');
  const [description, setDescription] = useState('');
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const categories = [
    { value: 'sneakers', label: 'Sneakers' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'thrift', label: 'Thrift' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'jewellery', label: 'Jewellery' },
    { value: 'other', label: 'Other' }
  ];

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];

  // Load Draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('product_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setName(draft.name || '');
        setPrice(draft.price || '');
        setCategory(draft.category || 'Streetwear');
        setCondition(draft.condition || null);
        setSizes(draft.sizes || []);
        setDescription(draft.description || '');
      } catch (e) {
        console.error('Failed to load draft');
      }
    }
  }, []);

  const saveDraft = () => {
    const draft = { name, price, category, condition, sizes, description };
    localStorage.setItem('product_draft', JSON.stringify(draft));
    setToast('Draft saved ✓');
    setTimeout(() => setToast(null), 3000);
  };

  const handlePhotoSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFiles = [...photoFiles];
      newFiles[index] = file;
      setPhotoFiles(newFiles);

      const newPreviews = [...photoPreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setPhotoPreviews(newPreviews);
    }
  };

  const uploadImage = async (file: File, index: number) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${myShop.id}/${Date.now()}_${index}.${fileExt}`;
    
    console.log(`Attempting to upload: bucket=product-images, path=${fileName}`);

    setUploadProgress(prev => {
      const next = [...prev];
      next[index] = 10;
      return next;
    });

    const { error } = await supabase.storage.from('product-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
    
    if (error) {
      console.error('Full upload error details:', error);
      throw error;
    }

    setUploadProgress(prev => {
      const next = [...prev];
      next[index] = 100;
      return next;
    });

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return publicUrl;
  };

  const handlePublish = async () => {
    if (!isFormComplete || isPublishing) return;
    if (!user) {
      sonnerToast.error('You must be logged in to publish');
      return;
    }

    // Feature 5: Enforce Trial Product Limit
    const isTrial = myShop?.subscription_status === 'trial';
    const maxProducts = isTrial ? 3 : 1000;
    
    try {
      // Get current product count
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', myShop.id);

      if (countError) throw countError;

      if ((count || 0) >= maxProducts) {
        sonnerToast.error(`Trial limit reached (${maxProducts} products). Upgrade to add more.`);
        return;
      }

      setIsPublishing(true);
      console.log('Publishing product for shop:', myShop.id, 'owner:', user.id);

      // 1. Upload Images
      const uploadedUrls = [];
      for (let i = 0; i < photoFiles.length; i++) {
        if (photoFiles[i]) {
          try {
            const url = await uploadImage(photoFiles[i]!, i);
            uploadedUrls.push(url);
          } catch (uploadErr) {
            console.error(`Error uploading image ${i}:`, uploadErr);
            throw new Error(`Failed to upload image ${i + 1}`);
          }
        }
      }

      // 2. Insert into products
      const { error, data } = await supabase.from('products').insert({
        shop_id: myShop.id,
        owner_id: user.id,
        name,
        description,
        price: parseFloat(price),
        images: uploadedUrls,
        category,
        condition,
        sizes: sizes.map(s => ({ size: s.size, quantity: s.qty })),
        is_published: true,
        status: 'active',
        total_stock: sizes.reduce((acc, s) => acc + s.qty, 0)
      }).select().single();

      if (error) {
        console.error('Supabase insert error details:', error);
        throw error;
      }

      console.log('Product published successfully:', data);
      localStorage.removeItem('product_draft');
      setShowSuccess(true);
      onPublished();
    } catch (err: any) {
      console.error('Error publishing product:', err);
      sonnerToast.error(err.message || 'Failed to publish product');
    } finally {
      setIsPublishing(false);
    }
  };

  const photoCount = photoFiles.filter(Boolean).length;
  const overallProgress = (photoCount / 6) * 100;

  const addSize = () => {
    if (!newSize) return;
    setSizes([...sizes, { size: newSize, qty: 1 }]);
    setNewSize('');
  };

  const updateQty = (index: number, delta: number) => {
    const newSizes = [...sizes];
    newSizes[index].qty = Math.max(1, newSizes[index].qty + delta);
    setSizes(newSizes);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const totalStock = sizes.reduce((acc, s) => acc + s.qty, 0);

  const checklist = [
    { label: '6 photos uploaded', complete: photoCount === 6 },
    { label: 'Product name added', complete: !!name },
    { label: 'Price set', complete: !!price },
    { label: 'Condition selected', complete: !!condition },
    { label: 'At least one size added', complete: sizes.length > 0 },
  ];

  const isFormComplete = checklist.every(item => item.complete);

  return (
    <div className="flex flex-col min-h-screen bg-black pb-10">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-5 py-2.5 rounded-full font-bold text-[13px] shadow-lg"
          >
             {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#1a1a1a]">
        <button onClick={() => setSellerFlowState('live')} className="p-1">
          <X className="text-white" size={24} />
        </button>
        <h1 className="text-white font-bold text-[18px] absolute left-1/2 -translate-x-1/2">New Listing</h1>
        <button 
          onClick={saveDraft}
          className="text-[#888] text-[13px] font-medium"
        >
          Save Draft
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Photo Section */}
        <div className="px-5 mt-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-white font-bold text-[14px]">Photos</span>
            <span className="text-[#888] text-[12px]">{photoCount} / 6 uploaded</span>
          </div>
          <div className="w-full h-[3px] bg-[#222] rounded-full overflow-hidden">
            <motion.div 
               animate={{ width: `${overallProgress}%` }}
               className="h-full bg-linear-to-r from-[#9B27AF] to-[#FF2D78]" 
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {['Main', 'Back', 'Side', 'Detail', 'On Foot', 'Size Tag'].map((label, i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  onClick={() => document.getElementById(`photo-input-${i}`)?.click()}
                  className={`aspect-square w-full rounded-[12px] flex items-center justify-center relative transition-all border-[1.5px] overflow-hidden
                    ${photoPreviews[i] ? 'border-[#FF2D78]' : 'border-dashed border-[#333] bg-[#111] text-[#333]'}`}
                >
                  <input 
                    id={`photo-input-${i}`} 
                    type="file" 
                    hidden 
                    accept="image/*" 
                    onChange={(e) => handlePhotoSelect(i, e)} 
                  />
                  {photoPreviews[i] ? (
                     <>
                       <img src={photoPreviews[i]!} className="w-full h-full object-cover" />
                       <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#FF2D78] rounded-full flex items-center justify-center text-white">
                          <Check size={10} />
                       </div>
                       {uploadProgress[i] > 0 && uploadProgress[i] < 100 && (
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-[#FF2D78] border-t-transparent rounded-full" />
                         </div>
                       )}
                     </>
                  ) : <Camera size={20} />}
                </div>
                <span className="text-[#888] text-[10px] mt-1.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="px-5 mt-8 space-y-6">
           {/* Product Name */}
           <div>
              <label className="text-white font-bold text-[13px] block mb-2">Product Name *</label>
              <input 
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="e.g. Air Force 1 Low White"
                 className="w-full h-12 bg-[#1a1a1a] border border-[#333] rounded-[10px] px-3.5 text-white text-[15px] focus:outline-none focus:border-[#FF2D78] transition-colors"
              />
           </div>

           {/* Price */}
           <div>
              <label className="text-white font-bold text-[13px] block mb-2">Price (USD) *</label>
              <div className="flex items-center bg-[#1a1a1a] border border-[#333] rounded-[10px] px-3.5 focus-within:border-[#FF2D78] transition-colors">
                 <span className="text-[#888] text-[15px]">$</span>
                 <input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 h-12 bg-transparent text-white text-[15px] pl-1.5 focus:outline-none"
                 />
              </div>
           </div>

           {/* Category Selection */}
           <div>
              <label className="text-white font-bold text-[13px] block mb-2.5">Category *</label>
              <div className="flex flex-wrap gap-2">
                 {categories.map(c => (
                    <button 
                       key={c.value}
                       onClick={() => setCategory(c.value)}
                       className={`px-[18px] py-2 rounded-full text-[13px] font-medium transition-all
                        ${category === c.value ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white shadow-lg' : 'bg-[#1a1a1a] border border-[#333] text-[#888]'}`}
                    >
                       {c.label}
                    </button>
                 ))}
              </div>
           </div>

           {/* Condition */}
           <div>
              <label className="text-white font-bold text-[13px] block mb-2.5">Condition *</label>
              <div className="flex flex-wrap gap-2">
                 {conditions.map(c => (
                    <button 
                       key={c.value}
                       onClick={() => setCondition(c.value)}
                       className={`px-[18px] py-2 rounded-full text-[13px] font-medium transition-all
                        ${condition === c.value ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white shadow-lg' : 'bg-[#1a1a1a] border border-[#333] text-[#888]'}`}
                    >
                       {c.label}
                    </button>
                 ))}
              </div>
           </div>

           {/* Sizes & Stock */}
           <div>
              <label className="text-white font-bold text-[13px] block">Sizes & Stock *</label>
              <p className="text-[#888] text-[12px] mb-3">Add sizes and quantity for each</p>
              
              <div className="space-y-1.5 mb-3">
                 {sizes.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#1a1a1a] p-2.5 px-3.5 rounded-[10px]">
                       <span className="text-white font-bold text-[14px]">{s.size}</span>
                       <div className="flex items-center gap-3">
                          <button onClick={() => updateQty(i, -1)} className="w-7 h-7 bg-black text-[#FF2D78] rounded-full flex items-center justify-center font-bold">
                             <Minus size={14} />
                          </button>
                          <span className="text-white font-bold text-[14px] min-w-[20px] text-center">{s.qty}</span>
                          <button onClick={() => updateQty(i, 1)} className="w-7 h-7 bg-black text-[#FF2D78] rounded-full flex items-center justify-center font-bold">
                             <Plus size={14} />
                          </button>
                          <button onClick={() => removeSize(i)} className="ml-3 text-[#555]">
                             <X size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="flex gap-2">
                 <input 
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="UK8"
                    className="w-20 h-10 bg-[#1a1a1a] border border-[#333] rounded-[8px] px-3 text-white text-[13px] text-center focus:outline-none focus:border-[#FF2D78]"
                 />
                 <button 
                  onClick={addSize}
                  className="px-4 h-10 border border-[#FF2D78] text-[#FF2D78] rounded-full text-[13px] font-bold hover:bg-[#FF2D7811] transition-colors"
                 >
                    Add Size +
                 </button>
              </div>
              <p className="text-[#888] text-[13px] mt-4">Total Stock: <span className="text-white font-bold">{totalStock}</span></p>
           </div>

           {/* Description */}
           <div>
              <label className="text-white font-bold text-[13px] block mb-2">Description</label>
              <textarea 
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="Describe your product — condition details, colorway, history..."
                 className="w-full min-h-[100px] bg-[#1a1a1a] border border-[#333] rounded-[10px] p-4 text-white text-[14px] focus:outline-none focus:border-[#FF2D78] transition-colors resize-none"
              />
           </div>
        </div>

        {/* Publish Section */}
        <div className="px-5 mt-8 pb-10">
           <div className="bg-[#FF2D780F] border border-[#FF2D7826] rounded-[12px] p-4 mb-5">
              <h4 className="text-[#FF2D78] font-bold text-[13px] mb-2.5">Before you publish:</h4>
              <div className="space-y-2">
                 {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                       <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.complete ? 'text-[#FF2D78]' : 'text-[#444]'}`}>
                          {item.complete ? <Check size={14} strokeWidth={3} /> : <div className="w-3.5 h-3.5 rounded-full border border-[#444]" />}
                       </div>
                       <span className={`text-[13px] ${item.complete ? 'text-white' : 'text-[#888]'}`}>{item.label}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  setToast('Draft saved ✓');
                  setTimeout(() => setToast(null), 3000);
                }}
                className="w-full h-13 bg-[#111] border border-[#333] rounded-full text-white font-bold text-[14px]"
              >
                Save as Draft
              </button>
              <button 
                onClick={handlePublish}
                disabled={!isFormComplete}
                className={`w-full h-13 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 transition-all
                  ${isFormComplete ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white shadow-lg shadow-[#FF2D7833]' : 'bg-[#333] text-[#666]'}`}
              >
                {!isFormComplete && <Lock size={14} />}
                {isFormComplete ? 'Publish Listing ✓' : 'Publish Listing'}
              </button>
           </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/90 z-[100]"
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="fixed inset-0 z-[110] flex items-center justify-center px-6"
            >
               <div className="w-full bg-[#111] rounded-[24px] p-8 border border-[#222] flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-[#FF2D78] rounded-full flex items-center justify-center text-white text-[28px] mb-5">✓</div>
                  <h3 className="text-white font-bold text-[22px]">Product Listed! 🎉</h3>
                  <p className="text-[#888] text-[14px] mt-2 mb-8">Your product is now live in the Thread ZW feed.</p>
                  
                  <div className="flex flex-col gap-2.5 w-full">
                     <button 
                       onClick={() => setShowSuccess(false)}
                       className="w-full h-12 border border-[#FF2D78] text-[#FF2D78] rounded-full font-bold text-[14px]"
                     >
                        Add Another Product
                     </button>
                     <button 
                       onClick={() => setSellerFlowState('live')}
                       className="w-full h-12 bg-linear-to-r from-[#9B27AF] to-[#FF2D78] rounded-full text-white font-bold text-[14px]"
                     >
                        Go to Shop Centre
                     </button>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
