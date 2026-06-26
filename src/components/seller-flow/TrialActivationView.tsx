import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { ChevronLeft, Check, Smartphone, Terminal, Zap, Globe, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface TrialActivationViewProps {
  onActivated: () => void;
  onBack: () => void;
}

export const TrialActivationView: React.FC<TrialActivationViewProps> = ({ onActivated, onBack }) => {
  const { session, user } = useAuth();
  const { shopFormData, setSellerFlowState, refreshInventory } = useInventory();
  const [activating, setActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  const trialEnd = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);

  const uploadShopImages = async (shopId: string) => {
    let avatarUrl = null;
    
    if (shopFormData.avatarFile) {
      const ext = shopFormData.avatarFile.name.split('.').pop()?.toLowerCase();
      const path = `${shopId}/logo.${ext}`;
      const { error } = await supabase.storage.from('shop-avatars').upload(path, shopFormData.avatarFile, { upsert: true });
      if (!error) {
        avatarUrl = supabase.storage.from('shop-avatars').getPublicUrl(path).data.publicUrl;
      }
    }
    return { avatarUrl };
  };

  const handleActivateTrial = async () => {
    if (!user?.id) return;
    setActivating(true);

    try {
      // 1. Update existing shop (OnboardingFlow is the sole creator)
      const cleanHandle = shopFormData.handle.toLowerCase();
      const { data: existing } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!existing) {
        throw new Error("No existing shop found to activate. Please complete the official onboarding first.");
      }

      const { data: newShop, error } = await supabase
        .from('shops')
        .update({
          name: shopFormData.name,
          handle: cleanHandle,
          slug: cleanHandle,
          categories: [shopFormData.category],
          description: shopFormData.description || '',
          location: shopFormData.town,
          whatsapp: shopFormData.whatsapp,
          is_live: true,
          subscription_status: 'trial',
          trial_ends_at: trialEnd.toISOString(),
          plan: 'shop'
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      if (newShop) {
        // Log details for tasks 1 & 3
        console.log("Auth User ID:\n" + user.id);
        console.log("Store ID:\n" + newShop.id);
        console.log("Generated URL:\n" + `/shop/${newShop.id}`);

        console.log("AUTH USER:", user.id);
        console.log("STORE ID:", newShop.id);
        console.log("GENERATED URL:", `/shop/${newShop.id}`);
      }

      // 2. Upload Logo
      const { avatarUrl } = await uploadShopImages(newShop.id);
      let finalAvatarUrl = newShop.logo_url;
      if (avatarUrl) {
        finalAvatarUrl = avatarUrl;
        await supabase.from('shops').update({ logo_url: avatarUrl }).eq('id', newShop.id);
      }

      // 3. Update Profile
      await supabase.from('profiles').update({ has_shop: true }).eq('id', user.id);

      // Save complete shop record to localStorage to prevent cache misalignments
      const activatedShop = {
        ...newShop,
        logo_url: finalAvatarUrl,
        slug: cleanHandle,
        handle: cleanHandle,
        is_live: true,
        setup_complete: true
      };
      localStorage.setItem('threadzw_shop', JSON.stringify(activatedShop));
      localStorage.setItem(`shop_${user.id}`, JSON.stringify(activatedShop));

      await refreshInventory();
      setActivationSuccess(true);
    } catch (err: any) {
      console.error('Activation Error:', err);
      toast.error(err.message || 'Node initialization failed.');
    } finally {
      setActivating(false);
    }
  };

  if (activationSuccess) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0B] z-[60] flex flex-col items-center justify-center p-8 text-center font-sans">
        <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           className="w-24 h-24 bg-[#C6FF00] rounded-[32px] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(198,255,0,0.2)]"
        >
           <Check className="w-10 h-10 text-black" strokeWidth={4} />
        </motion.div>

        <h2 className="text-white text-3xl font-black uppercase italic tracking-tighter mb-2">Node Active</h2>
        <p className="text-zinc-500 text-sm uppercase tracking-widest italic mb-10">Initial deployment successful</p>

        <div className="w-full max-w-sm bg-[#151515] border border-white/5 rounded-[32px] p-8 space-y-6 text-left">
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Protocol</span>
              <span className="text-sm font-bold text-white">Founder Trial Activation</span>
           </div>
           <div className="h-px bg-white/5" />
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Terminus Date</span>
              <span className="text-sm font-bold text-[#C6FF00] italic">{trialEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
           </div>
           <div className="h-px bg-white/5" />
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Monthly Sync</span>
              <span className="text-sm font-bold text-white">$7.00 USD</span>
           </div>
        </div>

        <button
          onClick={onActivated}
          className="w-full max-w-sm h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl mt-12 active:scale-95 transition-all text-sm italic"
        >
          Enter Terminal <Check className="inline ml-2" size={18} strokeWidth={3} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0B] text-white font-sans">
      <header className="px-6 py-8 flex items-center justify-between border-b border-white/5">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-black uppercase italic tracking-tighter">Activation Protocol</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 py-4">
         <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Finalization</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#C6FF00] italic">Ready for Launch</span>
         </div>
         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: '50%' }} animate={{ width: '100%' }} className="h-full bg-[#C6FF00]" />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-10 pb-40 space-y-12">
        <div className="text-center space-y-4">
           {/* THREADZW PRICING: $7/month | 28-day trial — do not change without updating all instances */}
           <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Start <span className="text-[#C6FF00]">free</span> for 28 days</h2>
           <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Then just $7/month</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
           <ProtocolFeature icon={<Zap size={24} />} title="Immediate Visibility" desc="Your storefront becomes globally accessible via protocol link." />
           <ProtocolFeature icon={<Smartphone size={24} />} title="WhatsApp Bridge" desc="Sales routing initiated directly to your commercial number." />
           <ProtocolFeature icon={<Globe size={24} />} title="Zimbabwean Distribution" desc="Indexed for local hub searches in your selected region." />
           <ProtocolFeature icon={<Package size={24} />} title="Infinite Inventory" desc="Unlimited stock unit listings during the trial period." />
        </div>

        <div className="bg-[#151515] border border-white/5 rounded-[40px] p-8 flex flex-col items-center text-center gap-6">
           <div className="w-16 h-16 bg-black border border-white/5 rounded-3xl flex items-center justify-center text-[#C6FF00]">
              <Terminal size={32} />
           </div>
           <div>
              <h3 className="text-sm font-black uppercase italic tracking-tighter mb-2">Zero Friction Entry</h3>
              <p className="text-zinc-500 text-[11px] leading-relaxed font-medium uppercase tracking-wider">No credit card required. Your node remains active for 28 days of uninterrupted operation before the first lock occurs.</p>
           </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B] to-transparent">
         <button 
           disabled={activating}
           onClick={handleActivateTrial}
           className="w-full h-14 md:h-16 bg-[#C6FF00] text-black rounded-2xl md:rounded-3xl font-black uppercase tracking-widest italic flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-xs md:text-sm disabled:opacity-50"
         >
            {activating ? "Deploying Node..." : "Activate Storefront Node"} 
            {!activating && <ArrowRight size={18} strokeWidth={3} />}
         </button>
      </div>
    </div>
  );
};

const ProtocolFeature = ({ icon, title, desc }: any) => (
  <div className="flex gap-5 items-start">
    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#C6FF00] shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-xs font-black uppercase italic tracking-widest text-white mb-1">{title}</h4>
      <p className="text-zinc-500 text-[10px] leading-relaxed font-medium uppercase tracking-wide">{desc}</p>
    </div>
  </div>
);

const ArrowRight = ({ size, strokeWidth, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
