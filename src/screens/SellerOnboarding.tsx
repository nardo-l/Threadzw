import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Instagram, 
  Store, 
  MapPin, 
  Clock, 
  ShoppingBag, 
  Tag, 
  Users, 
  Search,
  MessageCircle,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ZIMBABWE_TOWNS, SHOP_CATEGORIES } from '../constants';
import { toast } from 'sonner';

const WHATSAPP_NUMBER = "0789113734";

interface TradingHours {
  [key: string]: { isOpen: boolean; from: string; to: string };
}

const DEFAULT_TRADING_HOURS: TradingHours = {
  Mon: { isOpen: true, from: '09:00', to: '17:00' },
  Tue: { isOpen: true, from: '09:00', to: '17:00' },
  Wed: { isOpen: true, from: '09:00', to: '17:00' },
  Thu: { isOpen: true, from: '09:00', to: '17:00' },
  Fri: { isOpen: true, from: '09:00', to: '17:00' },
  Sat: { isOpen: true, from: '09:00', to: '13:00' },
  Sun: { isOpen: false, from: '09:00', to: '17:00' },
};

export const SellerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showTownPicker, setShowTownPicker] = useState(false);

  const [formData, setFormData] = useState({
    contact_name: '',
    business_name: '',
    category: '',
    town: '',
    physical_location: '',
    trading_hours: DEFAULT_TRADING_HOURS,
    whatsapp_number: '',
    instagram: '',
    product_description: '',
    price_range: { from: 0, to: 100 },
    product_count: '',
    heard_from: ''
  });

  const nextStep = () => {
    if (step < 12) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveLead = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('shop_leads').insert([{
        ...formData,
        price_from: formData.price_range.from,
        price_to: formData.price_range.to,
        trading_hours: formData.trading_hours,
        status: 'new'
      }]);
      
      if (error) throw error;

      // Format WhatsApp message
      const hoursStr = Object.entries(formData.trading_hours)
        .filter(([_, h]) => h.isOpen)
        .map(([day, h]) => `${day}: ${h.from}-${h.to}`)
        .join(', ');

      const message = `*NEW SHOP LEAD* 🚀%0A%0A` +
        `*Contact:* ${formData.contact_name}%0A` +
        `*Business:* ${formData.business_name}%0A` +
        `*Category:* ${formData.category}%0A` +
        `*Location:* ${formData.town} (${formData.physical_location})%0A` +
        `*Hours:* ${hoursStr}%0A` +
        `*WhatsApp:* ${formData.whatsapp_number}%0A` +
        `*Instagram:* ${formData.instagram}%0A` +
        `*Products:* ${formData.product_description}%0A` +
        `*Price Range:* $${formData.price_range.from} - $${formData.price_range.to}%0A` +
        `*Stock Volume:* ${formData.product_count}%0A` +
        `*Heard from:* ${formData.heard_from}%0A%0A` +
        `Please build my shop! 🏪`;

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
      toast.success("Lead sent successfully!");
      navigate('/');
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const renderProgress = () => (
    <div className="flex gap-2 mb-10">
      {[...Array(12)].map((_, i) => (
        <div 
          key={`onboarding-progress-bar-${i}`} 
          className={`h-2 flex-1 rounded-full transition-all duration-500 ${i < step ? 'bg-lime' : 'bg-charcoal/5'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col p-8 overflow-x-hidden text-charcoal font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-12 z-10">
        <button onClick={prevStep} className="w-14 h-14 rounded-full bg-white border-2 border-charcoal flex items-center justify-center text-charcoal active:scale-95 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)]">
          <ArrowLeft size={22} />
        </button>
        <div className="font-display font-black text-[12px] uppercase tracking-widest text-charcoal/20 italic">
          Protocol {step === 0 ? 1 : step}/12
        </div>
        <div className="w-14" />
      </header>

      <main className="flex-1 flex flex-col relative max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block drop-shadow-lg">📡</span>
                <h1 className="text-4xl md:text-5xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none mb-6">
                  Initiate <br/><span className="text-pink">Operational</span> <br/>Node.
                </h1>
                <p className="text-2xl italic-accent text-charcoal/40 leading-tight">
                  Deploy your business entity on the ThreadZW global storefront network.
                </p>
              </div>
              <input 
                type="text" 
                placeholder="PROVISION LEGAL NAME"
                className="w-full bg-white border-4 border-charcoal rounded-[32px] p-6 text-charcoal font-black focus:border-pink outline-none text-xl transition-all shadow-[8px_8px_0_rgba(0,0,0,0.05)] placeholder:text-charcoal/10"
                value={formData.contact_name}
                onChange={(e) => updateForm('contact_name', e.target.value)}
                autoFocus
              />
              <button 
                onClick={nextStep}
                disabled={!formData.contact_name}
                className="mt-12 w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-full shadow-[12px_12px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-4 disabled:opacity-20"
              >
                Sync Next <ChevronRight size={24} strokeWidth={3} />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block drop-shadow-lg">🏢</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Entity <br/><span className="text-pink">Branding</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Define the commercial identity for your storefront registry.</p>
              </div>
              <input 
                type="text" 
                placeholder="BUSINESS NAME"
                className="w-full bg-white border-4 border-charcoal rounded-[32px] p-6 text-charcoal font-black focus:border-pink outline-none text-xl transition-all shadow-[8px_8px_0_rgba(0,0,0,0.05)] placeholder:text-charcoal/10"
                value={formData.business_name}
                onChange={(e) => updateForm('business_name', e.target.value)}
                autoFocus
              />
              <button 
                onClick={nextStep}
                disabled={!formData.business_name}
                className="mt-12 w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-full shadow-[12px_12px_0_#F4A6C1] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-4 disabled:opacity-20"
              >
                Parameters Locked <ChevronRight size={24} strokeWidth={3} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block">🏷️</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Commercial <br/><span className="text-pink">Archetype</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Classify your primary inventory protocol.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {SHOP_CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => {
                      updateForm('category', cat.label);
                      nextStep();
                    }}
                    className={`p-6 rounded-[32px] border-4 transition-all flex flex-col items-center gap-4 ${
                      formData.category === cat.label 
                      ? 'bg-charcoal border-charcoal text-cream shadow-[10px_10px_0_#C6FF00]' 
                      : 'bg-white border-charcoal/10 text-charcoal/20 active:scale-95'
                    }`}
                  >
                    <span className="text-4xl">{cat.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest italic">{cat.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block">📍</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Geographic <br/><span className="text-pink">Node</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Select your operational base within the Zimbabwe cluster.</p>
              </div>
              <button 
                onClick={() => setShowTownPicker(true)}
                className="w-full bg-white border-4 border-charcoal rounded-[32px] p-8 text-charcoal font-black flex items-center justify-between text-2xl italic tracking-tighter transition-all shadow-[8px_8px_0_rgba(0,0,0,0.05)]"
              >
                <span>{formData.town || 'Locate Node'}</span>
                <MapPin size={32} className="text-pink" />
              </button>
              
              <button 
                onClick={nextStep}
                disabled={!formData.town}
                className="mt-12 w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-full shadow-[12px_12px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-4 disabled:opacity-20"
              >
                Coordinate Locked <ChevronRight size={24} />
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block">🏪</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Spatial <br/><span className="text-pink">Presence</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Define your physical versus digital operational capacity.</p>
              </div>
              <textarea 
                placeholder="e.g. Online only, OR Eastlea Shopping Centre, Shop 4"
                className="w-full bg-white border-4 border-charcoal rounded-[32px] p-8 text-charcoal font-black italic focus:border-pink outline-none text-xl transition-all min-h-[160px] resize-none shadow-[8px_8px_0_rgba(0,0,0,0.05)]"
                value={formData.physical_location}
                onChange={(e) => updateForm('physical_location', e.target.value)}
                autoFocus
              />
              <button 
                onClick={nextStep}
                disabled={!formData.physical_location}
                className="mt-12 w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-full shadow-[12px_12px_0_#F4A6C1] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-4 disabled:opacity-20"
              >
                Spatial Sync <ChevronRight size={24} />
              </button>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full overflow-y-auto no-scrollbar max-h-[75vh]">
              <div className="mb-10">
                <span className="text-6xl mb-6 block">⏰</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Uptime <br/><span className="text-pink">Protocol</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Synchronize your operational windows with global demand.</p>
              </div>
              <div className="space-y-4">
                {Object.entries(formData.trading_hours).map(([day, hours]) => (
                  <div key={day} className={`flex items-center justify-between p-6 bg-white border-2 rounded-[28px] transition-all ${hours.isOpen ? 'border-charcoal shadow-[6px_6px_0_rgba(0,0,0,0.05)]' : 'border-charcoal/5 opacity-50'}`}>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          const newHours = { ...formData.trading_hours, [day]: { ...hours, isOpen: !hours.isOpen } };
                          updateForm('trading_hours', newHours);
                        }}
                        className={`w-10 h-10 rounded-[12px] flex items-center justify-center border-4 transition-all ${hours.isOpen ? 'bg-charcoal border-charcoal text-cream' : 'border-charcoal/10 text-transparent'}`}
                      >
                        <Check size={20} strokeWidth={4} />
                      </button>
                      <span className="font-display font-black text-charcoal text-lg uppercase italic tracking-tighter">{day}</span>
                    </div>
                    {hours.isOpen ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={hours.from}
                          onChange={(e) => {
                            const newHours = { ...formData.trading_hours, [day]: { ...hours, from: e.target.value } };
                            updateForm('trading_hours', newHours);
                          }}
                          className="w-16 bg-cream border-2 border-charcoal/10 rounded-xl p-2 text-center text-[10px] font-black text-charcoal uppercase outline-none focus:border-pink" 
                        />
                        <span className="text-charcoal/20 font-black">-</span>
                        <input 
                          type="text" 
                          value={hours.to}
                          onChange={(e) => {
                            const newHours = { ...formData.trading_hours, [day]: { ...hours, to: e.target.value } };
                            updateForm('trading_hours', newHours);
                          }}
                          className="w-16 bg-cream border-2 border-charcoal/10 rounded-xl p-2 text-center text-[10px] font-black text-charcoal uppercase outline-none focus:border-pink" 
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-pink uppercase italic tracking-widest">Inert</span>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={nextStep}
                className="mt-12 mb-12 w-full h-16 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-xl rounded-full shadow-[8px_8px_0_#C6FF00] active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                Uptime Logged <ChevronRight size={24} />
              </button>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block drop-shadow-lg">💬</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Comms <br/><span className="text-pink">Signal</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Configure your WhatsApp routing for high-speed client engagement.</p>
              </div>
              <input 
                type="tel" 
                placeholder="MOBILE PROTOCOL"
                className="w-full bg-white border-4 border-charcoal rounded-[32px] p-8 text-charcoal font-black italic focus:border-pink outline-none text-2xl transition-all shadow-[10px_10px_0_rgba(0,0,0,0.05)]"
                value={formData.whatsapp_number}
                onChange={(e) => updateForm('whatsapp_number', e.target.value)}
                autoFocus
              />
              <button 
                onClick={nextStep}
                disabled={!formData.whatsapp_number}
                className="mt-12 w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-full shadow-[12px_12px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-4 disabled:opacity-20"
              >
                Signal Sync <ChevronRight size={24} />
              </button>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div key="step7" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block">📸</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Social <br/><span className="text-pink">Node</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Integrate your Instagram handle for verified cross-platform presence.</p>
              </div>
              <div className="relative">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-charcoal/20 font-black text-2xl">@</div>
                <input 
                  type="text" 
                  placeholder="HANDLE"
                  className="w-full bg-white border-4 border-charcoal rounded-[32px] p-8 pl-16 text-charcoal font-black italic focus:border-pink outline-none text-2xl transition-all shadow-[10px_10px_0_rgba(0,0,0,0.05)]"
                  value={formData.instagram}
                  onChange={(e) => updateForm('instagram', e.target.value)}
                  autoFocus
                />
              </div>
              <button 
                onClick={nextStep}
                className="mt-12 w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-full shadow-[12px_12px_0_#F4A6C1] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-4"
              >
                Link Sequence <ChevronRight size={24} />
              </button>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div key="step8" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block">📦</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Inventory <br/><span className="text-pink">Blueprint</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Outline the primary units your storefront will provision.</p>
              </div>
              <textarea 
                placeholder="DESCRIBE STOCK..."
                className="w-full bg-white border-4 border-charcoal rounded-[32px] p-8 text-charcoal font-black italic focus:border-pink outline-none text-xl transition-all min-h-[160px] resize-none shadow-[10px_10px_0_rgba(0,0,0,0.05)]"
                value={formData.product_description}
                onChange={(e) => updateForm('product_description', e.target.value)}
                autoFocus
              />
              <button 
                onClick={nextStep}
                disabled={!formData.product_description}
                className="mt-12 w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-full shadow-[12px_12px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-4 disabled:opacity-20"
              >
                Blueprint Locked <ChevronRight size={24} />
              </button>
            </motion.div>
          )}

          {step === 9 && (
            <motion.div key="step9" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block">💰</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Price <br/><span className="text-pink">Scale</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Define the fiscal boundaries of your storefront inventory.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] italic font-black text-charcoal/30 ml-4 uppercase tracking-widest">Entry ($)</label>
                  <input 
                    type="number" 
                    placeholder="10"
                    className="w-full bg-white border-4 border-charcoal rounded-[32px] p-6 text-charcoal font-black focus:border-pink outline-none text-xl transition-all shadow-[8px_8px_0_rgba(0,0,0,0.05)]"
                    value={formData.price_range.from || ''}
                    onChange={(e) => updateForm('price_range', { ...formData.price_range, from: Number(e.target.value) })}
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] italic font-black text-charcoal/30 ml-4 uppercase tracking-widest">Peak ($)</label>
                  <input 
                    type="number" 
                    placeholder="200"
                    className="w-full bg-white border-4 border-charcoal rounded-[32px] p-6 text-charcoal font-black focus:border-pink outline-none text-xl transition-all shadow-[8px_8px_0_rgba(0,0,0,0.05)]"
                    value={formData.price_range.to || ''}
                    onChange={(e) => updateForm('price_range', { ...formData.price_range, to: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button 
                onClick={nextStep}
                disabled={!formData.price_range.to}
                className="mt-12 w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-full shadow-[12px_12px_0_#F4A6C1] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-4 disabled:opacity-20"
              >
                Scale Defined <ChevronRight size={24} />
              </button>
            </motion.div>
          )}

          {step === 10 && (
            <motion.div key="step10" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block">📊</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Stock <br/><span className="text-pink">Volume</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Quantify your current operational bandwidth.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {['1-10', '11-50', '51-100', '100+'].map(val => (
                  <button 
                    key={val}
                    onClick={() => {
                      updateForm('product_count', val);
                      nextStep();
                    }}
                    className={`p-6 rounded-[32px] border-4 text-left transition-all italic font-display font-black uppercase tracking-tighter text-2xl ${
                      formData.product_count === val 
                      ? 'bg-charcoal border-charcoal text-cream shadow-[10px_10px_0_#C6FF00]' 
                      : 'bg-white border-charcoal/5 text-charcoal/20 active:scale-95'
                    }`}
                  >
                    <span>{val} UNITS</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 11 && (
            <motion.div key="step11" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
              <div className="mb-10">
                <span className="text-6xl mb-6 block">🔍</span>
                <h2 className="text-4xl font-display font-black text-charcoal uppercase italic tracking-tighter leading-none">
                  Discovery <br/><span className="text-pink">Path</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-4 italic leading-tight">Final parameters: How did you interface with the Thread node?</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {['Instagram', 'Word of mouth', 'TikTok', 'WhatsApp Status', 'Other'].map(val => (
                  <button 
                    key={val}
                    onClick={() => {
                      updateForm('heard_from', val);
                      nextStep();
                    }}
                    className={`p-6 rounded-[32px] border-4 text-left transition-all italic font-display font-black uppercase tracking-tighter text-xl ${
                      formData.heard_from === val 
                      ? 'bg-charcoal border-charcoal text-cream shadow-[10px_10px_0_#C6FF00]' 
                      : 'bg-white border-charcoal/5 text-charcoal/20 active:scale-95'
                    }`}
                  >
                    <span>{val}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 12 && (
            <motion.div key="step12" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full text-center">
              <div className="mb-10 mt-12">
                <div className="w-28 h-28 bg-lime rounded-[44px] flex items-center justify-center text-charcoal mx-auto mb-10 shadow-[10px_10px_0_rgba(0,0,0,1)] border-4 border-charcoal animate-pulse">
                  <Check size={56} strokeWidth={4} />
                </div>
                <h2 className="text-4xl font-display font-black text-charcoal leading-none uppercase italic tracking-tighter">
                  Configuration <br/><span className="text-pink">Absolute</span>.
                </h2>
                <p className="italic-accent text-xl text-charcoal/40 mt-8 italic leading-tight max-w-[300px] mx-auto">
                  Transmit these parameters to the ThreadZW master node. Your Entity ID will be live within 24 standard cycles.
                </p>
              </div>
              
              <button 
                onClick={saveLead}
                disabled={loading}
                className="mt-auto w-full h-20 bg-charcoal text-cream font-display font-black uppercase italic tracking-tighter text-2xl rounded-full shadow-[15px_15px_0_#C6FF00] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-5 disabled:opacity-20 italic"
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-cream/30 border-t-lime rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageCircle size={32} strokeWidth={4} /> Transmit Fragment
                  </>
                )}
              </button>
              <p className="text-[10px] text-charcoal/20 mt-8 font-black uppercase tracking-widest italic">
                HARARE MASTER NODE • SYNC PENDING
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Town Picker Sheet */}
      <AnimatePresence>
        {showTownPicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTownPicker(false)}
              className="fixed inset-0 z-[100] bg-charcoal/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-cream rounded-t-[48px] p-10 max-h-[85vh] flex flex-col border-t-4 border-charcoal shadow-2xl"
            >
              <div className="w-20 h-1.5 bg-charcoal/10 rounded-full mx-auto mb-10" />
              <h3 className="text-3xl font-display font-black text-charcoal mb-10 italic uppercase border-b-4 border-charcoal/5 pb-6">Geographic Cluster</h3>
              <div className="overflow-y-auto no-scrollbar flex-1 flex flex-col gap-3 pb-20">
                {ZIMBABWE_TOWNS.map(town => (
                  <button 
                    key={town}
                    onClick={() => {
                      updateForm('town', town);
                      setShowTownPicker(false);
                    }}
                    className={`w-full p-6 rounded-[32px] text-left font-black transition-all border-4 text-xl italic tracking-tighter uppercase ${
                      formData.town === town ? 'bg-charcoal border-charcoal text-cream shadow-[6px_6px_0_#F4A6C1]' : 'bg-white border-charcoal/5 text-charcoal/30'
                    }`}
                  >
                    {town}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="mt-12 bg-cream">
        {renderProgress()}
      </footer>
    </div>
  );
};
