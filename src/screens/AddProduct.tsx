import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, ImageIcon, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';

export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<{ size: string; quantity: number }[]>([]);

  React.useEffect(() => {
    const fetchShopId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', session.user.id)
          .single();
        if (shop) {
          setShopId(shop.id);
        }
      }
    };
    fetchShopId();
  }, []);

  const handlePhotoUpload = async (file: File) => {
    if (!shopId) {
      alert('Please wait for shop credentials context to finish loading...');
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setImages(prev => [...prev, publicUrl].slice(0, 6));
    } catch (err: any) {
      console.error('Error uploading product images:', err);
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const categories = ['👕 Clothing', '👟 Sneakers', '🧥 Thrift', '🔥 Streetwear', '💍 Accessories'];
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];

  const toggleSize = (size: string) => {
    if (selectedSizes.some(s => s.size === size)) {
      setSelectedSizes(prev => prev.filter(s => s.size !== size));
    } else {
      setSelectedSizes(prev => [...prev, { size, quantity: 1 }]);
    }
  };

  const updateQuantity = (size: string, qty: number) => {
    setSelectedSizes(prev => prev.map(s => s.size === size ? { ...s, quantity: Math.max(0, qty) } : s));
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get shop id
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();
      
      if (!shop) throw new Error('Shop not found');

      const totalStock = selectedSizes.reduce((acc, s) => acc + s.quantity, 0);

      const { error } = await supabase
        .from('products')
        .insert({
          shop_id: shop.id,
          name,
          price: parseFloat(price),
          description,
          category,
          images,
          sizes: selectedSizes,
          total_stock: totalStock,
          is_published: true
        });
      
      if (error) throw error;
      
      // Update shop product count
      await supabase.rpc('increment_shop_product_count', { shop_id: shop.id });

      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg text-white pb-32">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-page-bg/80 backdrop-blur-xl border-b border-border z-50 flex items-center justify-between px-6">
        <h1 className="font-bold text-lg">Add Product</h1>
        <button onClick={() => navigate(-1)} className="p-2 text-secondary-text">
          <X size={24} />
        </button>
      </div>

      <div className="pt-24 px-6 space-y-8 max-w-lg mx-auto">
        {/* Image Upload */}
        <div>
          <label className="text-secondary-text text-[13px] font-bold uppercase tracking-widest mb-3 block">Images (Max 6)</label>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <label className="w-20 h-20 bg-card-bg border-[1.5px] border-dashed border-border rounded-xl flex flex-col items-center justify-center text-secondary-text cursor-pointer hover:border-neon transition-colors shrink-0 disabled:opacity-50">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-neon border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={20} />
                  <span className="text-[9px] font-bold mt-1 uppercase tracking-wider text-secondary-text/60">Upload</span>
                </>
              )}
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await handlePhotoUpload(file);
                  }
                }}
              />
            </label>
            {images.map((img, i) => (
              <div key={`preview-${i}-${img.substring(0, 20)}`} className="w-20 h-20 rounded-xl bg-ele-bg overflow-hidden relative shrink-0">
                <img src={img} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="text-secondary-text text-[13px] font-bold uppercase tracking-widest mb-2 block">Product Name *</label>
            <Input placeholder="e.g. Vintage Oversized Hoodie" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-secondary-text text-[13px] font-bold uppercase tracking-widest mb-2 block">Price ($) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text font-bold">$</span>
              <input 
                type="number"
                placeholder="25.00"
                className="w-full h-[54px] bg-card-bg border-[1.5px] border-border rounded-xl pl-8 pr-4 text-base focus:outline-none focus:border-neon focus:ring-4 focus:ring-neon/10 transition-all"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-secondary-text text-[13px] font-bold uppercase tracking-widest mb-2 block">Description</label>
          <textarea 
            placeholder="Tell customers about this item..."
            className="w-full bg-card-bg border-[1.5px] border-border rounded-xl p-4 text-base min-h-[100px] focus:outline-none focus:border-neon transition-all"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-secondary-text text-[13px] font-bold uppercase tracking-widest mb-3 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, i) => (
              <div 
                key={`cat-opt-${i}-${cat}`}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full border-[1.5px] text-sm font-bold transition-all cursor-pointer ${category === cat ? 'bg-neon/10 border-neon text-neon' : 'bg-card-bg border-border text-secondary-text'}`}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        {/* Sizes & Stock */}
        <div>
          <label className="text-secondary-text text-[13px] font-bold uppercase tracking-widest mb-3 block">Available Sizes</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {sizeOptions.map((size, i) => {
              const isSelected = selectedSizes.some(s => s.size === size);
              return (
                <div 
                  key={`size-opt-${i}-${size}`}
                  onClick={() => toggleSize(size)}
                  className={`w-12 h-12 rounded-xl border-[1.5px] flex items-center justify-center font-bold transition-all cursor-pointer ${isSelected ? 'bg-neon/10 border-neon text-neon' : 'bg-card-bg border-border text-secondary-text'}`}
                >
                  {size}
                </div>
              );
            })}
          </div>

          {selectedSizes.length > 0 && (
            <div className="space-y-3 bg-card-bg/50 border border-border/50 rounded-2xl p-4">
              <div className="text-[11px] font-black uppercase tracking-widest text-secondary-text mb-2">Set Quantities</div>
              {selectedSizes.map((s) => (
                <div key={`size-qty-${s.size}`} className="flex items-center justify-between">
                  <span className="font-bold text-sm">{s.size}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(s.size, s.quantity - 1)} className="w-8 h-8 rounded-lg bg-card-bg border border-border flex items-center justify-center text-lg">-</button>
                    <span className="w-8 text-center font-mono font-bold">{s.quantity}</span>
                    <button onClick={() => updateQuantity(s.size, s.quantity + 1)} className="w-8 h-8 rounded-lg bg-card-bg border border-border flex items-center justify-center text-lg">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action */}
        <div className="pt-8">
          <Button 
            variant="primary" 
            size="xl" 
            fullWidth 
            disabled={!name || !price || loading} 
            onClick={handleCreate}
          >
            {loading ? 'Creating...' : 'Publish Product →'}
          </Button>
        </div>
      </div>
    </div>
  );
};
