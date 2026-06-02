import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const generateSetupSlug = (shopName: string): string => {
  return shopName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    // Remove special characters
    .replace(/\s+/g, '')
    // Remove all spaces
    .replace(/-+/g, '-');
    // Clean up dashes
};

export const generateUniqueSetupSlug = async (shopName: string): Promise<string> => {
  const baseSlug = generateSetupSlug(shopName);
  
  const { data } = await supabase
    .from('shops')
    .select('id, slug')
    .eq('slug', baseSlug)
    .maybeSingle();
  
  // If no data is returned or we got a Mock local fallback shop, the slug is free
  if (!data || (data.id && String(data.id).startsWith('local-'))) {
    return baseSlug;
  }
  
  let counter = 2;
  while (counter < 8) { // Prevent infinite loop in local fallback/sandbox mode
    const newSlug = `${baseSlug}${counter}`;
    const { data: existing } = await supabase
      .from('shops')
      .select('id, slug')
      .eq('slug', newSlug)
      .maybeSingle();
    
    if (!existing || (existing.id && String(existing.id).startsWith('local-'))) return newSlug;
    counter++;
  }
  return `${baseSlug}${Math.floor(1000 + Math.random() * 9000)}`;
};

export const SetupShop: React.FC<{ onSetupComplete?: () => void }> = ({ onSetupComplete }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [shopName, setShopName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('Harare');
  const [category, setCategory] = useState('Clothing');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Clothing', 'Sneakers', 'Accessories', 'Streetwear', 'Vintage'];
  const cities = ['Harare', 'Bulawayo', 'Gweru', 'Mutare', 'Masvingo', 'Chitungwiza'];

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('You must be logged in to create a shop.', 'error');
      return;
    }

    if (!shopName.trim()) {
      showToast('Shop Name is required.', 'error');
      return;
    }

    if (!whatsapp.trim()) {
      showToast('WhatsApp number is required.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const slug = await generateUniqueSetupSlug(shopName);
      const trialEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('shops')
        .insert({
          owner_id: user.id,
          name: shopName.trim(),
          handle: slug,
          slug: slug,
          whatsapp: whatsapp.trim(),
          location: city,
          categories: [category],
          description: `Welcome to ${shopName}! Browse our latest selection.`,
          trial_started_at: new Date().toISOString(),
          trial_ends_at: trialEnds.toISOString(),
          subscription_status: 'trial',
          manual_lock: false,
          is_live: true,
          created_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      showToast('Shop created successfully! 🛍️', 'success');
      if (onSetupComplete) {
        onSetupComplete();
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to create shop.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col p-6 sm:p-10 justify-center items-center min-h-screen bg-[#0d0d0d] text-white"
    >
      <div className="w-full max-w-md flex flex-col gap-8">
        {/* LOGO */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-5xl font-syne font-black italic text-[#c8ff00] uppercase tracking-tighter">THREADZW</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500">SaaS Infrastructure</p>
        </div>

        {/* HEADLINE */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">Let's set up your shop.</h2>
          <p className="text-zinc-400 text-sm">Just a few quick details to launch your storefront.</p>
        </div>

        <form onSubmit={handleCreateShop} className="flex flex-col gap-6 bg-[#121212] p-6 rounded-2xl border border-white/5 shadow-2xl">
          {/* SHOP NAME */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#c8ff00]">Shop Name</label>
            <input 
              type="text"
              required
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              placeholder="e.g. Kure Streetwear"
              className="border-2 rounded-xl p-4 outline-none focus:border-[#c8ff00] transition-all bg-[#161616] border-white/5 text-white text-sm"
              disabled={isSubmitting}
            />
            {shopName && (
              <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                Preview slug: <span className="text-[#c8ff00]/60">threadzw.vercel.app/shop/{generateSetupSlug(shopName)}</span>
              </span>
            )}
          </div>

          {/* WHATSAPP NUMBER */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#c8ff00]">WhatsApp Number</label>
            <input 
              type="tel"
              required
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="e.g. +263776223144"
              className="border-2 rounded-xl p-4 outline-none focus:border-[#c8ff00] transition-all bg-[#161616] border-white/5 text-white text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* CITY DROPDOWN */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#c8ff00]">City</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="border-2 rounded-xl p-4 outline-none focus:border-[#c8ff00] transition-all bg-[#161616] border-white/5 text-white text-sm appearance-none cursor-pointer"
              disabled={isSubmitting}
            >
              {cities.map(c => (
                <option key={c} value={c} className="bg-[#121212] text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* CATEGORY GRID */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#c8ff00]">Primary Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map(cat => {
                const isSelected = category === cat;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    disabled={isSubmitting}
                    className={`p-3 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                      isSelected 
                        ? 'bg-[#c8ff00] text-black border-[#c8ff00] font-black' 
                        : 'bg-[#161616] text-zinc-400 border-white/5 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CREATE CTA BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting || !shopName.trim() || !whatsapp.trim()}
            className="w-full bg-[#c8ff00] hover:bg-[#b0df00] disabled:bg-zinc-800 disabled:text-zinc-600 font-extrabold uppercase tracking-widest text-black p-4 rounded-xl mt-4 text-xs transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
            ) : (
              'Create My Shop →'
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
