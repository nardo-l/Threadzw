import React from 'react';
import { motion } from 'motion/react';
import { useInventory } from '../../context/InventoryContext';
import { Sparkles, Zap, Package, ShoppingBag, ArrowRight } from 'lucide-react';

export const NoShopView: React.FC = () => {
  const { setSellerFlowState } = useInventory();

  const features = [
    { icon: <Zap size={18} className="text-amber-400" />, title: 'Up in 2 minutes', body: 'Create your shop, add products, and go live fast.' },
    { icon: <Package size={18} className="text-blue-400" />, title: 'Track everything', body: 'Sales, views, stock levels and smart alerts.' },
    { icon: <ShoppingBag size={18} className="text-primary" />, title: 'WhatsApp-first', body: 'Buyers contact you directly. No middleman.' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <header className="px-6 py-12 flex items-center justify-center relative z-10">
        <h1 className="text-lg font-syne font-black tracking-tighter uppercase italic opacity-20">Foundry Center</h1>
      </header>

      <main className="flex-1 px-8 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="w-24 h-24 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center shadow-heavy mx-auto relative group">
             <div className="absolute inset-0 bg-white/5 blur-xl group-hover:bg-primary/20 transition-all" />
             <ShoppingBag size={40} className="text-white relative z-10" />
          </div>
          <h2 className="text-4xl font-syne font-black tracking-[calc(-0.04em)] uppercase italic mt-10 mb-4 leading-none">Open Your <span className="text-primary">Legacy</span></h2>
          <p className="text-white/40 text-[15px] leading-relaxed max-w-[280px] mx-auto">Join Zimbabwe's elite fashion collective. Your pieces, in the correct hands.</p>
        </motion.div>

        <section className="w-full flex flex-col gap-3 mb-10">
           {features.map((f, i) => (
             <motion.div 
               key={`noshop-feature-${i}`}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.1 * i }}
               className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4 text-left"
             >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">{f.icon}</div>
                <div>
                   <h4 className="text-[12px] font-black uppercase tracking-widest italic">{f.title}</h4>
                   <p className="text-[11px] text-white/30 leading-tight mt-0.5">{f.body}</p>
                </div>
             </motion.div>
           ))}
        </section>

        <div className="w-full bg-[#1A1A1A]/40 border border-white/5 p-5 rounded-3xl flex items-center gap-4 mb-10">
           <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary italic font-black text-xs">20d</div>
           <div className="text-left">
              <h5 className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Founders Trial</h5>
              <p className="text-[10px] text-white/30 leading-tight">No payment needed for 20 days. Full access.</p>
           </div>
        </div>

        <button 
          onClick={() => setSellerFlowState('seller_onboarding')}
          className="w-full h-16 bg-white text-black rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-heavy active:scale-95 transition-all flex items-center justify-center gap-3 italic"
        >
          Begin The Journey <ArrowRight size={16} />
        </button>
      </main>
    </div>
  );
};
