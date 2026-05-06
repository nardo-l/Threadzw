import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const categories = [
  { emoji: '👕', label: 'Clothing', value: 'clothing' },
  { emoji: '👟', label: 'Sneakers', value: 'sneakers' },
  { emoji: '🧥', label: 'Thrift & Vintage', value: 'thrift' },
  { emoji: '🔥', label: 'Streetwear', value: 'streetwear' },
  { emoji: '💍', label: 'Accessories', value: 'accessories' },
  { emoji: '📱', label: 'Electronics', value: 'electronics' },
  { emoji: '👠', label: 'Footwear', value: 'footwear' },
  { emoji: '⚽', label: 'Sportswear', value: 'sportswear' },
  { emoji: '👔', label: 'Formal Wear', value: 'formal' },
  { emoji: '🧒', label: 'Kids Fashion', value: 'kids' },
  { emoji: '👜', label: 'Bags', value: 'bags' },
  { emoji: '💄', label: 'Beauty', value: 'beauty' },
  { emoji: '📦', label: 'Other', value: 'other' }
];

interface TrialActivationViewProps {
  onActivated: () => void;
  onBack: () => void;
}

export const TrialActivationView: React.FC<TrialActivationViewProps> = ({ onActivated, onBack }) => {
  const { session, user } = useAuth();
  const { shopFormData, setSellerFlowState, loadExistingShop } = useInventory();
  const [whatsappNumber, setWhatsappNumber] = useState(shopFormData.whatsapp);
  const [activating, setActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const selectedCategory = categories.find(c => c.value === shopFormData.category);
  const trialEnd = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

  const uploadShopImages = async (shopId: string) => {
    let bannerUrl = null;
    let avatarUrl = null;
    
    // Helper for robust upload
    const safeUpload = async (file: File, bucket: string, prefix: string) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const path = `${shopId}/${prefix}.${ext}`;
      let targetBucket = bucket;

      const { error } = await supabase.storage
        .from(targetBucket)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (error) {
        if (error.message?.includes('Bucket not found') && targetBucket !== 'shop-banners') {
          const { data, error: fallbackError } = await supabase.storage
            .from('shop-banners')
            .upload(`${prefix}_${path}`, file, { upsert: true, contentType: file.type });
          if (fallbackError) throw fallbackError;
          targetBucket = 'shop-banners';
          return supabase.storage.from(targetBucket).getPublicUrl(`${prefix}_${path}`).data.publicUrl;
        }
        throw error;
      }
      return supabase.storage.from(targetBucket).getPublicUrl(path).data.publicUrl;
    };
    
    if (shopFormData.bannerFile) {
      try {
        bannerUrl = await safeUpload(shopFormData.bannerFile, 'shop-banners', 'banner');
      } catch (e) {
        console.error('Banner upload failed:', e);
      }
    }
    
    if (shopFormData.avatarFile) {
      try {
        avatarUrl = await safeUpload(shopFormData.avatarFile, 'shop-avatars', 'avatar');
      } catch (e) {
        console.error('Avatar upload failed:', e);
      }
    }
    
    return { bannerUrl, avatarUrl };
  };

  const handleActivateTrial = async () => {
    if (!whatsappNumber.trim()) {
      setToast({ message: 'Enter your WhatsApp number.', type: 'error' });
      return;
    }

    if (!user?.id) return;

    const checkExistingShop = async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    };

    setActivating(true);
    try {
      // 1. Double check for existing shop (client side)
      const existing = await checkExistingShop();
      if (existing) {
        setToast({ message: "You already have a shop. Loading it now...", type: 'success' });
        await loadExistingShop();
        onActivated();
        return;
      }

      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 20 * 24 * 60 * 60 * 1000);

      // Create shop in Supabase first to get ID
      const { data: newShop, error } = await supabase
        .from('shops')
        .insert({
          owner_id: session.user.id,
          name: shopFormData.name,
          handle: shopFormData.handle.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          categories: [shopFormData.category],
          description: shopFormData.description,
          location: shopFormData.town,
          whatsapp: whatsappNumber.trim(),
          instagram: shopFormData.instagram,
          plan: 'shop',
          is_live: true,
          subscription_status: 'trial',
          created_at: trialStart.toISOString()
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint (one shop per user)
        if (error.code === '23505' || error.message?.includes('shops_owner_id_unique')) {
           setToast({ message: "You already have a shop. We're loading it for you.", type: 'success' });
           await loadExistingShop();
           onActivated();
           return;
        }
        throw error;
      }

      // Upload images
      const { bannerUrl, avatarUrl } = await uploadShopImages(newShop.id);
      
      // Update shop with image URLs
      if (bannerUrl || avatarUrl) {
        await supabase
          .from('shops')
          .update({
            banner_url: bannerUrl,
            logo_url: avatarUrl // Sync for compatibility
          })
          .eq('id', newShop.id);
      }

      // Update profile WhatsApp
      await supabase
        .from('profiles')
        .update({ has_shop: true, shop_name: shopFormData.name })
        .eq('id', session.user.id);

      setActivationSuccess(true);
    } catch (err: any) {
      console.error('Trial activation error:', err);
      let msg = 'Could not activate trial. Please try again.';
      
      if (err.message?.includes('duplicate') || err.message?.includes('unique') || err.code === '23505') {
        msg = 'That handle is already taken. Go back and choose another.';
      } else if (err.message?.includes('column') || err.message?.includes('schema cache')) {
        msg = 'System configuration error (missing columns). Please contact support.';
      } else if (err.message?.includes('policy') || err.code === '42501') {
        msg = 'Permission denied. Please ensure you are logged in correctly.';
      }
      
      setToast({ message: msg, type: 'error' });
    } finally {
      setActivating(false);
    }
  };

  if (activationSuccess) {
    return (
      <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center p-8 text-center">
        <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ type: 'spring', damping: 12, stiffness: 200, duration: 0.5 }}
           className="w-20 h-20 bg-[#FF2D78] rounded-full flex items-center justify-center mb-6"
        >
           <Check className="w-9 h-9 text-white" strokeWidth={3} />
        </motion.div>

        <h2 className="text-white text-[26px] font-bold mb-2">Your Shop is Live! 🎉</h2>
        <div className="mb-8">
           <p className="text-white text-[16px] font-medium">{shopFormData.name}</p>
           <p className="text-[#888] text-[13px]">@{shopFormData.handle}</p>
        </div>

        <div className="w-full bg-[#111] rounded-[14px] p-4 text-left space-y-4 mb-8 max-w-[320px]">
           <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#888]">Plan:</span>
              <span className="text-white">Thread ZW Shop (Trial)</span>
           </div>
           <div className="h-[1px] bg-[#1a1a1a]" />
           <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#888]">Trial ends:</span>
              <span className="text-white font-bold">{trialEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
           </div>
           <div className="h-[1px] bg-[#1a1a1a]" />
           <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#888]">Monthly after trial:</span>
              <span className="text-[#FF2D78] font-bold">$6/month</span>
           </div>
        </div>

        <button
          onClick={onActivated}
          className="w-full h-14 rounded-full bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold text-[15px] shadow-lg max-w-[320px]"
        >
          Start Adding Products →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-5">
      {/* Top Bar */}
      <div className="sticky top-0 bg-black z-10 py-4 flex items-center mb-2">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="flex-1 text-center font-bold text-[18px]">Activate Free Trial</h1>
        <div className="w-10" />
      </div>

       {/* Progress */}
       <div className="flex flex-col items-center py-2 mb-6">
        <span className="text-[#888] text-[12px] mb-2">Step 2 of 2</span>
        <div className="w-full px-1">
           <div className="h-[3px] w-full bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-[#c8f135] w-full" />
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Shop Preview Card */}
        <div className="bg-[#111] border border-[#222] rounded-[16px] overflow-hidden mb-6 shadow-xl">
           <div className="h-[80px] bg-[#1a1a1a] relative">
              {shopFormData.bannerPreview ? (
                 <img src={shopFormData.bannerPreview} className="w-full h-full object-cover opacity-60" alt="Banner" />
              ) : (
                 <div className="w-full h-full bg-linear-to-br from-[#9B27AF]/20 to-[#FF2D78]/20" />
              )}
              
              <div className="absolute -bottom-8 left-5">
                 <div className="w-16 h-16 rounded-full border-4 border-[#111] overflow-hidden bg-gradient-to-tr from-[#9B27AF] to-[#FF2D78]">
                    {shopFormData.avatarPreview ? (
                       <img src={shopFormData.avatarPreview} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                          {shopFormData.name.charAt(0)}
                       </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="p-5 pt-10">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-white text-[17px] font-bold">{shopFormData.name || 'Shop Name'}</h3>
                    <p className="text-[#888] text-[12px]">@{shopFormData.handle || 'handle'}</p>
                 </div>
                 <div className="bg-[rgba(255,45,120,0.1)] px-2.5 py-1 rounded-full border border-[#FF2D7820]">
                    <span className="text-[#FF2D78] text-[11px] font-medium uppercase tracking-wider">
                       {selectedCategory?.emoji} {selectedCategory?.label}
                    </span>
                 </div>
              </div>
              
              <div className="h-[1px] bg-[#1a1a1a] my-4" />
              
              <div className="space-y-2">
                <div className="flex gap-2">
                   <span className="text-[#666] text-[13px] shrink-0">📍</span>
                   <p className="text-[#888] text-[13px] leading-relaxed line-clamp-2">
                      {shopFormData.town}, {shopFormData.directions}
                   </p>
                </div>
                <div className="flex gap-2">
                   <span className="text-[#666] text-[13px] shrink-0">🕐</span>
                   <p className="text-[#888] text-[12px]">
                      {shopFormData.tradingHours}
                   </p>
                </div>
              </div>
           </div>
        </div>

        {/* Trial Details Card */}
        <div className="bg-linear-to-br from-[rgba(34,197,94,0.08)] to-[rgba(34,197,94,0.04)] border border-[rgba(34,197,94,0.2)] rounded-[16px] p-5 mb-6">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#14532d]/40 flex items-center justify-center text-[20px]">
                 🎁
              </div>
              <div>
                 <p className="text-white text-[16px] font-bold">20 Days Free</p>
                 <p className="text-[#888] text-[12px]">No payment needed to start</p>
              </div>
           </div>

           <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center text-black">
                    <Check className="w-3 h-3" strokeWidth={4} />
                 </div>
                 <span className="text-white text-[13px]">Your shop goes live instantly</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center text-black">
                    <Check className="w-3 h-3" strokeWidth={4} />
                 </div>
                 <span className="text-white text-[13px]">List up to 3 products</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center text-black">
                    <Check className="w-3 h-3" strokeWidth={4} />
                 </div>
                 <span className="text-white text-[13px]">Buyers can find you immediately</span>
              </div>
           </div>

           <div className="bg-[#111] rounded-[10px] p-3 px-4 flex justify-between items-center">
              <span className="text-[#888] text-[13px]">Trial ends:</span>
              <span className="text-white text-[13px] font-bold">
                 {trialEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
           </div>
        </div>

        {/* WhatsApp Number Section */}
        <div className="mb-6">
           <label className="text-white font-bold text-[14px] block mb-2 text-center">Your WhatsApp Number</label>
           <p className="text-[#888] text-[12px] text-center mb-4 leading-relaxed">
              We'll send you shop updates, low stock alerts, and renewal reminders here.
           </p>
           <input 
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+263 7X XXX XXXX"
              className="w-full h-[52px] bg-[#111] border border-[#222] rounded-[12px] px-4 text-white text-[16px] outline-none focus:border-[#FF2D78] transition-all text-center"
           />
        </div>

        <button
           onClick={handleActivateTrial}
           disabled={activating || !whatsappNumber.trim()}
           className={`w-full h-14 rounded-full font-bold text-[15px] flex items-center justify-center mt-4 transition-all
              ${whatsappNumber.trim() 
                ? 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white' 
                : 'bg-[#1a1a1a] text-[#555] pointer-events-none'}`}
        >
           {activating ? (
             <div className="w-5 h-5 border-2 border-white rounded-full animate-spin border-t-transparent" />
           ) : whatsappNumber.trim() ? "Activate My Free Trial 🚀" : "Enter your WhatsApp number"}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-6 right-6 z-[70]">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className={`p-4 rounded-[12px] shadow-2xl flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
           >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                 <span className="text-white text-[14px]">{toast.type === 'error' ? '!' : '✓'}</span>
              </div>
              <p className="text-white text-[13px] font-medium">{toast.message}</p>
           </motion.div>
        </div>
      )}
    </div>
  );
};
