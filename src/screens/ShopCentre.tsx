import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Share2, 
  ExternalLink, 
  MessageCircle, 
  MapPin, 
  ShieldCheck, 
  CreditCard,
  ChevronRight,
  Plus,
  ArrowRight,
  QrCode,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PaywallFlow } from '../components/seller-flow/PaywallFlow';
import { CodeEntryView } from '../components/seller-flow/CodeEntryView';
import { ShopSetupForm } from '../components/seller-flow/ShopSetupForm';
import { SellerOnboarding } from '../components/seller-flow/SellerOnboarding';

export const ShopCentre: React.FC = () => {
  const navigate = useNavigate();
  const { userData, sellerFlowState, setSellerFlowState, updateUserData } = useInventory();
  const [isSharing, setIsSharing] = useState(false);

  // If the user hasn't finished onboarding or shop setup
  if (sellerFlowState === 'seller_onboarding') {
    return <SellerOnboarding onComplete={() => setSellerFlowState('setup_form')} />;
  }

  if (sellerFlowState === 'setup_form') {
    return <ShopSetupForm onNext={() => setSellerFlowState('live')} />;
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/shop/@${userData.shopHandle}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: userData.shopName,
          text: `Check out my shop on ThreadZW! 🧵`,
          url
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Storefront link copied!');
    }
  };

  return (
    <div className="flex flex-col gap-12 bg-cream min-h-screen">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-6xl md:text-7xl font-display font-black uppercase italic tracking-tighter leading-[0.8]">
          the <span className="text-pink">terminal</span>
        </h1>
        <div className="flex items-center gap-3">
          <p className="italic-accent text-xl">Governance Protocol</p>
          <div className="oval-sticker !bg-lime !text-charcoal !shadow-none">Active</div>
        </div>
      </header>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Visual Identity & Sharing */}
        <section className="bg-white border-2 border-charcoal rounded-[40px] p-10 flex flex-col gap-10 relative overflow-hidden shadow-[12px_12px_0_#F4A6C1]">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Sparkles size={120} /></div>
          
          <div className="flex items-center gap-6 md:gap-8 relative z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-cream border-2 border-charcoal flex items-center justify-center text-4xl md:text-5xl shadow-inner font-display font-black text-charcoal italic overflow-hidden">
               {userData.shopLogo ? (
                 <img src={userData.shopLogo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : userData.shopName?.[0] || 'T'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-3xl md:text-4xl font-display font-black uppercase italic tracking-tighter leading-none">{userData.shopName || 'Commercial Node'}</h3>
                {userData.shopIsVerified && <ShieldCheck size={24} className="text-lime" fill="currentColor" />}
              </div>
              <p className="italic-accent text-xl text-charcoal/40 mt-2">threadzw.com/@{userData.shopHandle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button 
              onClick={() => window.open(`/shop/${userData.shopHandle}`, '_blank')}
              className="h-16 bg-cream border-2 border-charcoal rounded-[24px] flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest italic hover:bg-cream-dark transition-all text-charcoal shadow-[4px_4px_0_rgba(0,0,0,1)]"
            >
              <ExternalLink size={18} /> View Storefront
            </button>
            <button 
              onClick={handleShare}
              className="h-16 bg-charcoal text-cream rounded-[24px] flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest italic shadow-[6px_6px_0_#C6FF00] active:scale-95 transition-all"
            >
              <Share2 size={18} strokeWidth={3} /> Broadcast Node
            </button>
          </div>

          <button className="mt-4 p-6 bg-cream border-2 border-charcoal rounded-[32px] flex items-center justify-between group hover:bg-white transition-all">
             <div className="flex items-center gap-6">
                <div className="p-4 bg-charcoal text-cream rounded-2xl shadow-[4px_4px_0_#F4A6C1]">
                   <QrCode size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 italic">Visual Identity Key</p>
                   <p className="text-lg font-display font-black italic tracking-tighter leading-none mt-1">Export Physical Tag</p>
                </div>
             </div>
             <ChevronRight size={20} className="text-charcoal/20 group-hover:text-charcoal transition-colors translate-x-[-4px]" />
          </button>
        </section>

        {/* Global Protocol Settings */}
        <section className="bg-white border-2 border-charcoal rounded-[40px] p-10 flex flex-col gap-8 shadow-[12px_12px_0_rgba(0,0,0,0.05)]">
           <div className="flex items-center gap-3">
              <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter">Core Config</h3>
              <div className="h-px flex-1 bg-charcoal/10" />
           </div>
           
           <div className="grid grid-cols-1 gap-4">
              <ProtocolItem 
                icon={<MessageCircle size={20} />} 
                label="WhatsApp Routing" 
                value={`+${userData.shopWhatsApp || 'Not Routed'}`} 
                onClick={() => navigate('/terminal/edit')}
              />
              <ProtocolItem 
                icon={<MapPin size={20} />} 
                label="Basing Hub" 
                value={userData.shopArea || 'Harare'} 
                onClick={() => navigate('/terminal/edit')}
              />
              <ProtocolItem 
                icon={<CreditCard size={20} />} 
                label="Billing Cycle" 
                value={userData.isShopLive ? 'Initialized' : 'Restricted'} 
                onClick={() => setSellerFlowState('paywall')}
                color={userData.isShopLive ? 'text-lime' : 'text-pink'}
              />
           </div>

           <button 
            onClick={() => navigate('/terminal/edit')}
            className="w-full h-16 mt-4 border-2 border-charcoal border-dashed rounded-[24px] flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest italic text-charcoal/30 hover:text-charcoal hover:bg-cream/50 transition-all"
           >
             Refine Node Metadata <Settings size={16} />
           </button>
        </section>

        {/* Subscription / Paywall Alert */}
        {!userData.isShopLive && (
          <div className="lg:col-span-2">
             <div className="bg-pink/5 border-2 border-pink/20 rounded-[40px] p-10 flex flex-col lg:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-pink/10 rounded-3xl flex items-center justify-center text-pink shrink-0 shadow-[8px_8px_0_rgba(0,0,0,1)] border-2 border-charcoal">
                   <CreditCard size={40} />
                </div>
                <div className="flex-1 text-center lg:text-left">
                   <h3 className="text-3xl font-display font-black uppercase italic tracking-tighter text-charcoal mb-2">Protocol Restricted</h3>
                   <p className="italic-accent text-charcoal/50 text-lg leading-relaxed max-w-xl">
                      Your commercial node is restricted to local management only. Global visibility and WhatsApp routing are disabled until the next payment engagement is cleared.
                   </p>
                </div>
                <button 
                  onClick={() => setSellerFlowState('paywall')}
                  className="h-20 px-10 bg-charcoal text-cream rounded-full font-black uppercase tracking-widest italic shadow-[10px_10px_0_#C6FF00] active:scale-95 transition-all"
                >
                  Clear Balance <ArrowRight size={20} className="inline ml-2" strokeWidth={3} />
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Experimental Features */}
      <section className="mt-8">
        <div className="flex items-center gap-6 mb-10">
           <h3 className="text-3xl font-display font-black uppercase italic tracking-tighter">advanced <span className="text-pink">modules</span></h3>
           <div className="h-0.5 flex-1 bg-charcoal/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <ModuleCard 
             title="Custom Brand" 
             desc="Configure visual identity protocol: fonts and spectrums." 
             isNew 
           />
           <ModuleCard 
             title="Global Sync" 
             desc="Broadcast sync with IG/FB inventory distribution." 
           />
           <ModuleCard 
             title="Receipt Node" 
             desc="PDF transactional metadata for verified clients." 
           />
        </div>
      </section>

      {/* Modals for flow management */}
      <AnimatePresence>
        {sellerFlowState === 'paywall' && (
          <PaywallFlow myShop={userData} onActivated={() => setSellerFlowState('live')} />
        )}
        {sellerFlowState === 'enter_code' && (
          <CodeEntryView myShop={userData} onActivated={() => setSellerFlowState('live')} />
        )}
      </AnimatePresence>
    </div>
  );
};

const ProtocolItem = ({ icon, label, value, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-6 bg-white border-2 border-charcoal rounded-[24px] group hover:bg-cream-dark transition-all shadow-[4px_4px_0_rgba(0,0,0,0.05)]"
  >
    <div className="flex items-center gap-5">
      <div className="text-charcoal/20 group-hover:text-pink transition-colors">{icon}</div>
      <div className="text-left">
        <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/30 italic mb-1">{label}</p>
        <p className={`text-lg font-display font-black italic tracking-tighter leading-none ${color || 'text-charcoal'}`}>{value}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-charcoal/10 group-hover:text-charcoal transition-colors" />
  </button>
);

const ModuleCard = ({ title, desc, isNew }: any) => (
  <div className="bg-white border-2 border-charcoal rounded-[32px] p-10 flex flex-col gap-6 group hover:translate-y-[-4px] transition-all cursor-not-allowed shadow-[8px_8px_0_rgba(0,0,0,0.05)]">
    <div className="flex justify-between items-start">
       <div className="w-14 h-14 bg-cream border-2 border-charcoal rounded-2xl flex items-center justify-center text-charcoal/30 group-hover:text-pink transition-colors shadow-[4px_4px_0_rgba(0,0,0,1)]">
          <Settings size={24} />
       </div>
       {isNew && <div className="oval-sticker !bg-lime !text-charcoal !shadow-none font-black">Encrypted</div>}
    </div>
    <div>
       <h4 className="text-2xl font-display font-black uppercase italic tracking-tighter mb-2">{title}</h4>
       <p className="italic-accent text-charcoal/50 text-sm leading-relaxed">{desc}</p>
    </div>
    <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-pink italic">Module Locked</div>
  </div>
);
