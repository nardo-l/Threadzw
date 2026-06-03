import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Check, Upload, 
  Instagram, MapPin, MessageSquare, Store, ShoppingBag, 
  Smartphone, Sparkles, Image as ImageIcon, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SHOP_CATEGORIES, ZIMBABWE_TOWNS } from '../../constants';

interface ShopFrontOnboardingProps {
  shop: any;
  onClose: () => void;
  onComplete: (updatedShop: any) => void;
}

const PRESET_EMOJIS = ['🏪', '👕', '🧥', '👟', '🎒', '🕶️', '🔥', '👑', '💄', '💍'];

export const ShopFrontOnboarding: React.FC<ShopFrontOnboardingProps> = ({
  shop,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [name, setName] = useState(shop?.name || '');
  const [handle, setHandle] = useState(shop?.handle || shop?.slug || '');
  const [whatsapp, setWhatsapp] = useState(shop?.whatsapp || '');
  const [location, setLocation] = useState(shop?.location || 'Harare');
  const [addressLine, setAddressLine] = useState('');
  const [category, setCategory] = useState(shop?.categories?.[0] || 'Streetwear');
  const [description, setDescription] = useState(shop?.description || '');
  const [instagram, setInstagram] = useState(shop?.instagram || '');
  
  // Visual/Asset States
  const [logoPreview, setLogoPreview] = useState<string | null>(shop?.logo_url || null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanHandle = (val: string) => {
    return val
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const slug = cleanHandle(val);
    setHandle(slug);
  };

  // Drag and Drop Logo Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Max is 5MB.');
      return;
    }

    // Convert to a local blob URL for preview
    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);
    setSelectedEmoji(null); // Clear emoji preset if uploading actual file
    
    // Store file representation on window / state safely
    (window as any).__onboardingLogoFile = file;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const selectEmojiLogo = (emoji: string) => {
    setSelectedEmoji(emoji);
    setLogoPreview(null);
    (window as any).__onboardingLogoFile = null;
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return name.trim().length >= 2 && handle.trim().length >= 2;
      case 2:
        return whatsapp.trim().length >= 7;
      case 3:
        return location.trim().length > 0;
      case 4:
        return category.trim().length > 0 && description.trim().length >= 5;
      case 5:
        return true; // Optional fields (logo/instagram)
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || shop?.owner_id;

      let finalLogoUrl = logoPreview || shop?.logo_url;

      // Check if they uploaded an image file that needs to go to storage
      const logoFile = (window as any).__onboardingLogoFile;
      if (logoFile && userId) {
        const bucket = 'shop-avatars';
        const ext = logoFile.name.split('.').pop();
        const filePath = `${shop?.id || userId}/logo_${Date.now()}.${ext}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, logoFile, { upsert: true });

          if (!uploadError) {
            const { data } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);
            finalLogoUrl = data.publicUrl;
          }
        } catch (uploadErr) {
          console.warn("Upload failed, keeping local URL preview:", uploadErr);
        }
      } else if (selectedEmoji) {
        // High quality SVG or canvas representation placeholder code
        // Simple and beautiful canvas data url creation
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Soft premium background
          ctx.fillStyle = '#161616';
          ctx.fillRect(0, 0, 120, 120);
          
          // Border path
          ctx.strokeStyle = 'rgba(200, 255, 0, 0.2)';
          ctx.lineWidth = 4;
          ctx.strokeRect(2, 2, 116, 116);

          // Render emoji nicely
          ctx.font = '54px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(selectedEmoji, 60, 60);

          finalLogoUrl = canvas.toDataURL();
        }
      }

      // Consolidate full location description
      const finalLocation = addressLine.trim() 
        ? `${location} (${addressLine.trim()})` 
        : location;

      const updateData = {
        name: name.trim(),
        handle: handle.trim().toLowerCase(),
        slug: handle.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        location: finalLocation,
        categories: [category],
        description: description.trim(),
        instagram: instagram.trim() ? instagram.trim().replace(/^@/, '') : null,
        logo_url: finalLogoUrl || null,
        is_live: true
      };

      let updatedShop;
      if (shop?.id) {
        const { data, error } = await supabase
          .from('shops')
          .update(updateData)
          .eq('id', shop.id)
          .select()
          .maybeSingle();

        if (error) throw error;
        updatedShop = data;
      } else {
        const trialEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const { data, error } = await supabase
          .from('shops')
          .insert([
            {
              ...updateData,
              owner_id: userId,
              trial_started_at: new Date().toISOString(),
              trial_ends_at: trialEnds.toISOString(),
              subscription_status: 'trial',
              manual_lock: false,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .maybeSingle();

        if (error) throw error;
        updatedShop = data;
      }

      // Update profile onboarding status
      if (userId) {
        await supabase
          .from('profiles')
          .update({ onboarding_complete: true })
          .eq('id', userId);
      }

      // Mark local storage configurations
      localStorage.setItem('threadzw_shop_onboarding_first_time', 'done');
      if (updatedShop?.id) {
        localStorage.setItem(`threadzw_shop_front_setup_${updatedShop.id}`, 'true');
        localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
      }

      // Update local storage shop details cache
      if (userId && updatedShop) {
        localStorage.setItem(`shop_${userId}`, JSON.stringify(updatedShop));
      }

      // Success Callback!
      onComplete(updatedShop || { ...shop, ...updateData });
    } catch (err: any) {
      console.error("Onboarding submission failed:", err);
      alert(err.message || 'Failed to save storefront details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { title: "Brand Identity", icon: <Store className="w-5 h-5" /> },
    { title: "Contact Hub", icon: <Smartphone className="w-5 h-5" /> },
    { title: "Headquarters", icon: <MapPin className="w-5 h-5" /> },
    { title: "Motto & Genre", icon: <ShoppingBag className="w-5 h-5" /> },
    { title: "Finishing Touches", icon: <Sparkles className="w-5 h-5" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative my-8">
        
        {/* TOP STATUS WATERMARK */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 opacity-40">
          <div className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse" />
          <span className="text-[9px] font-mono tracking-wider font-bold text-white uppercase">Storefront Registry</span>
        </div>

        {/* CLOSE BUTTON */}
        <button 
          id="btn_onboarding_close"
          onClick={() => {
            if (confirm("Are you sure you want to exit setup? You can finish customising your shopfront later from the notice banner.")) {
              localStorage.setItem('threadzw_shop_onboarding_first_time', 'done');
              onClose();
            }
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* STEPPER PROGRESS Segment Bar */}
        <div className="mt-14 px-6 flex justify-between gap-1">
          {steps.map((s, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === step;
            const isCompleted = stepNum < step;
            return (
              <div 
                key={`progress-segment-${idx}`}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-[#c8ff00]' : isActive ? 'bg-[#c8ff00]/60 animate-pulse' : 'bg-white/10'
                }`}
              />
            );
          })}
        </div>

        {/* STEP TITLE HEADER */}
        <div className="px-6 pt-5 pb-3 border-b border-white/5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#c8ff00]/10 border border-[#c8ff00]/20 flex items-center justify-center text-[#c8ff00]">
            {steps[step - 1].icon}
          </div>
          <div>
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wide">
              Step {step} of 5: {steps[step - 1].title}
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono">THREADZW PROTOCOL</p>
          </div>
        </div>

        {/* INTERNAL CONTAINER FOR SCREENS */}
        <div className="p-6 flex-1 min-h-[340px] flex flex-col justify-between">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="onb-step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 flex-1"
              >
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">What's the name of your brand?</h3>
                  <p className="text-xs text-zinc-400 mt-1">This will be your primary storefront name visible to buyers.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="input_shop_name" className="text-[10px] font-mono text-[#c8ff00] uppercase tracking-widest font-bold">Shop Brand Name</label>
                  <input 
                    id="input_shop_name"
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Kure Streetwear"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-[#c8ff00] transition-colors"
                    maxLength={32}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="input_shop_handle" className="text-[10px] font-mono text-[#c8ff00] uppercase tracking-widest font-bold">Custom URL Handle</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono select-none">/@</span>
                    <input 
                      id="input_shop_handle"
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(cleanHandle(e.target.value))}
                      placeholder="kure"
                      className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 pl-9 text-white text-sm outline-none focus:border-[#c8ff00] transition-colors font-mono"
                      maxLength={24}
                    />
                  </div>
                  {handle && (
                    <span className="text-[10px] font-mono text-zinc-500">
                      Your store link: <span className="text-[#c8ff00]">threadzw.com/shop/{handle}</span>
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="onb-step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 flex-1"
              >
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">Secure your WhatsApp Hotline 💬</h3>
                  <p className="text-xs text-zinc-400 mt-1">Customers on your web store will draft orders directly to your WhatsApp.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="input_shop_whatsapp" className="text-[10px] font-mono text-[#c8ff00] uppercase tracking-widest font-bold">WhatsApp Business Number</label>
                  <input 
                    id="input_shop_whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. +263776223144"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-[#c8ff00] transition-colors font-mono"
                  />
                  <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl flex gap-2.5 items-start">
                    <span className="text-lg">💡</span>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Use international format (with country code prefix like <span className="text-white font-bold">+263</span>) to ensure instant, global routing.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="onb-step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 flex-1"
              >
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">Where is your brand based? 📍</h3>
                  <p className="text-xs text-zinc-400 mt-1">Show buyers where you ship from or host local meet-ups.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="select_shop_city" className="text-[10px] font-mono text-[#c8ff00] uppercase tracking-widest font-bold">Primary City/HQ</label>
                  <select
                    id="select_shop_city"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-[#c8ff00] transition-colors cursor-pointer"
                  >
                    {ZIMBABWE_TOWNS.map(town => (
                      <option key={`town-${town}`} value={town} className="bg-[#111]">{town}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="input_address_detail" className="text-[10px] font-mono text-[#c8ff00] uppercase tracking-widest font-bold">Store address / Booth (Optional)</label>
                  <input 
                    id="input_address_detail"
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="e.g. Shop 22 Eastgate, or Online Only"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-[#c8ff00] transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="onb-step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 flex-1"
              >
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">What do you sell & what's your vibe? 👕</h3>
                  <p className="text-xs text-zinc-400 mt-1">Select your primary aesthetic and provide a brief catchphrase.</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-[#c8ff00] uppercase tracking-widest font-bold block">Brand Category</span>
                  <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto pr-1">
                    {SHOP_CATEGORIES.map(cat => {
                      const isSelected = category === cat.label || category === cat.id;
                      return (
                        <button
                          key={`cat-btn-${cat.id}`}
                          id={`btn_cat_${cat.id}`}
                          type="button"
                          onClick={() => setCategory(cat.label)}
                          className={`px-3 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00] font-bold' 
                              : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="textarea_shop_motto" className="text-[10px] font-mono text-[#c8ff00] uppercase tracking-widest font-bold">Shop Tagline / Motto</label>
                  <input 
                    id="textarea_shop_motto"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Crafted for the rebels chasing dreams."
                    maxLength={100}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-[#c8ff00] transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="onb-step5"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 flex-1"
              >
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">Visual Identity & Instagram 📸</h3>
                  <p className="text-xs text-zinc-400 mt-1">Add your store's logo profile and connect your socials.</p>
                </div>

                {/* DRAG AND DROP FILE UPLOAD / EMOJI LIST */}
                <div className="grid grid-cols-2 gap-3.5 items-stretch">
                  
                  {/* LOGO DRAG & DROP AREA */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                      isDragging 
                        ? 'border-[#c8ff00] bg-[#c8ff00]/5' 
                        : logoPreview 
                        ? 'border-white/25 hover:border-[#c8ff00]' 
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileSelect}
                    />

                    {logoPreview ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10">
                        <img src={logoPreview} className="w-full h-full object-cover" alt="Preview" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload size={20} className="text-zinc-500 mb-1" />
                        <span className="text-[10px] font-bold text-white uppercase">Upload Image</span>
                        <span className="text-[8px] text-zinc-500 font-mono mt-0.5">Drag - Click</span>
                      </div>
                    )}
                  </div>

                  {/* PRESET EMOJI PICKER ALTERNATIVE */}
                  <div className="border border-white/5 bg-white/[0.01] rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[8.5px] font-mono text-[#c8ff00] uppercase tracking-wider font-extrabold leading-tight">Or use beautiful Preset:</span>
                    <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                      {PRESET_EMOJIS.map(em => (
                        <button
                          key={`emoji-preset-${em}`}
                          type="button"
                          onClick={() => selectEmojiLogo(em)}
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all border ${
                            selectedEmoji === em
                              ? 'bg-[#c8ff00]/15 border-[#c8ff00] scale-110'
                              : 'bg-[#181818] border-white/5 hover:border-white/20'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* INSTAGRAM INTERACTIVE INPUT */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <label htmlFor="input_shop_insta" className="text-[10px] font-mono text-[#c8ff00] uppercase tracking-widest font-bold">Instagram @Handle</label>
                  <div className="relative">
                    <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      id="input_shop_insta"
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="e.g. kure.zw"
                      className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 pl-11 text-white text-sm outline-none focus:border-[#c8ff00] transition-colors font-mono"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTIONS ROW & STEP CONTROLS */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5 md:gap-4">
            
            {/* BACK ACTION */}
            {step > 1 ? (
              <button
                id="btn_onboarding_back"
                type="button"
                onClick={() => setStep(step - 1)}
                className="h-12 px-5 rounded-xl border border-white/10 font-bold text-xs uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft size={14} /> Back
              </button>
            ) : (
              <div />
            )}

            {/* CONTINUE CTA / LAUNCH BUTTON */}
            {step < 5 ? (
              <button
                id="btn_onboarding_next"
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!validateStep()}
                className="h-12 px-6 bg-[#c8ff00] hover:bg-[#b0df00] disabled:bg-zinc-800 disabled:text-zinc-500 font-extrabold text-xs uppercase tracking-widest text-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : (
              <button
                id="btn_onboarding_submit"
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-12 px-6 bg-[#c8ff00] hover:bg-[#b0df00] disabled:bg-zinc-800 font-black text-xs uppercase tracking-widest text-black rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(200,255,0,0.15)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Launching...
                  </>
                ) : (
                  <>
                    Launch Storefront 🚀
                  </>
                )}
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
