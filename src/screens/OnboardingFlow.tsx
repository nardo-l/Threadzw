import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Check, Camera, Image as ImageIcon, Sparkles, Loader2, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useShopContext } from '../context/ShopContext';

export const generateSlug = (shopName: string): string => {
  if (!shopName) return '';
  return shopName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
};

export const generateUniqueSlug = async (shopName: string): Promise<string> => {
  const baseSlug = generateSlug(shopName);
  const { data } = await supabase
    .from('shops')
    .select('id, slug')
    .eq('slug', baseSlug)
    .maybeSingle();
  
  if (!data || (data.id && String(data.id).startsWith('local-'))) {
    return baseSlug;
  }
  
  let counter = 2;
  while (counter < 8) {
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

type CategoryType = 'Sneakers' | 'Thrift' | 'Streetwear' | 'Formal';

const categoryMockProducts: Record<CategoryType, { name: string; price: string; image: string; description: string }[]> = {
  Sneakers: [
    {
      name: "Air Jordan 4 Retro Pine Green",
      price: "45",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
      description: "Authentic retro sneakers featuring premium leather and striking pine green accents."
    },
    {
      name: "Yeezy Boost 350 V2 Carbon",
      price: "40",
      image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80",
      description: "Ultra-comfortable primeknit upper with signature boost cushioning."
    },
    {
      name: "Nike Air Force 1 07",
      price: "25",
      image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80",
      description: "The legend lives on in this classic street icon with crisp leather edges."
    }
  ],
  Thrift: [
    {
      name: "Vintage Distressed Leather Jacket",
      price: "35",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80",
      description: "Genuine heavy cowhide leather jacket with perfect worn-in vintage character."
    },
    {
      name: "90s Retro Corduroy Shirt",
      price: "20",
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
      description: "Soft heavyweight corduroy in a classic relaxed oversize cut."
    },
    {
      name: "Classic High-Waist Denim",
      price: "22",
      image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
      description: "Premium vintage Levi's denim. Durable, timeless, and perfectly styled."
    }
  ],
  Streetwear: [
    {
      name: "Heavyweight Oversized Hoodie",
      price: "30",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80",
      description: "450GSM loopback cotton hoodie with a dropped shoulder silhouette and custom graphic print."
    },
    {
      name: "Oversized Acid-Wash Tee",
      price: "15",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80",
      description: "Thick premium cotton washed-black tee with high-density brand chest print."
    },
    {
      name: "Utility Multi-Pocket Cargo",
      price: "35",
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80",
      description: "Durable cotton-ripstop trousers with utility webbing and standard streetwear fitting."
    }
  ],
  Formal: [
    {
      name: "Tailored Slim Double Suit",
      price: "85",
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80",
      description: "Bespoke-cut wool blend blazer and tapered trouser set. Sharp style for elites."
    },
    {
      name: "Satin Pleated Midi Dress",
      price: "45",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80",
      description: "Elegant emerald green satin midi featuring fluid pleats and a draped cowl neckline."
    },
    {
      name: "Premium Oxford Leather Brogues",
      price: "50",
      image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&q=80",
      description: "Hand-crafted full-grain leather shoes with exquisite wingtip detailing."
    }
  ]
};

type ScreenType = 
  | 'WELCOME' 
  | 'SIGN_IN'
  | 'SHOP_NAME' 
  | 'CATEGORY' 
  | 'CITY' 
  | 'WHATSAPP' 
  | 'INSTAGRAM' 
  | 'DESCRIPTION' 
  | 'LOGO_UPLOAD' 
  | 'BANNER_UPLOAD' 
  | 'CREATE_ACCOUNT' 
  | 'BUILDING';

interface OnboardingFlowProps {
  setAppStage: (stage: 'landing' | 'paywall' | 'building' | 'dashboard' | 'admin' | 'shop' | 'product' | 'setup' | 'shop-directory' | 'onboarding') => void;
}

const ZIM_CITIES = [
  "Harare", "Bulawayo", "Chitungwiza", "Mutare", "Gweru", 
  "Kwekwe", "Masvingo", "Kadoma", "Victoria Falls", "Chinhoyi"
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ setAppStage }) => {
  const { setShop, setHasShop, setLoading: setShopLoading, refreshShop } = useShopContext();

  const [screen, setScreen] = useState<ScreenType>('WELCOME');
  
  // Creation values
  const [shopName, setShopName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Sneakers');
  const [selectedCity, setSelectedCity] = useState('Harare');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [description, setDescription] = useState('');

  // Media files
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Sign up account state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStatus, setCreationStatus] = useState('Initiating...');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Sequential steps list for creation
  const CREATION_STEPS: ScreenType[] = [
    'SHOP_NAME',
    'CATEGORY',
    'CITY',
    'WHATSAPP',
    'DESCRIPTION',
    'LOGO_UPLOAD',
    'BANNER_UPLOAD',
    'CREATE_ACCOUNT'
  ];

  const getStepProgress = () => {
    const idx = CREATION_STEPS.indexOf(screen);
    if (idx === -1) return 0;
    return Math.round(((idx + 1) / CREATION_STEPS.length) * 100);
  };

  const isCreationScreen = CREATION_STEPS.includes(screen);

  const handleNext = () => {
    if (screen === 'SHOP_NAME') {
      if (!shopName.trim()) {
        toast.error('Please enter a shop name.');
        return;
      }
      setScreen('CATEGORY');
    } else if (screen === 'CATEGORY') {
      setScreen('CITY');
    } else if (screen === 'CITY') {
      setScreen('WHATSAPP');
    } else if (screen === 'WHATSAPP') {
      if (!whatsapp || whatsapp.length < 9) {
        toast.error('Please enter a valid WhatsApp number.');
        return;
      }
      setScreen('DESCRIPTION');
    } else if (screen === 'DESCRIPTION') {
      setScreen('LOGO_UPLOAD');
    } else if (screen === 'LOGO_UPLOAD') {
      setScreen('BANNER_UPLOAD');
    } else if (screen === 'BANNER_UPLOAD') {
      setScreen('CREATE_ACCOUNT');
    }
  };

  const handleBack = () => {
    if (screen === 'SIGN_IN') {
      setScreen('WELCOME');
      return;
    }
    const idx = CREATION_STEPS.indexOf(screen);
    if (idx === 0) {
      setScreen('WELCOME');
    } else if (idx > 0) {
      setScreen(CREATION_STEPS[idx - 1]);
    }
  };

  // Login handler
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (authErr) throw authErr;
      if (!authData.user) throw new Error('Could not retrieve credentials.');

      // Fetch potential existing shop
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', authData.user.id)
        .maybeSingle();

      if (shopData) {
        localStorage.setItem('threadzw_onboarding_complete', 'true');
        localStorage.setItem('threadzw_logged_in', 'true');
        setShop(shopData);
        setHasShop(true);
        await refreshShop();
        toast.success('Signed in successfully.');
        setAppStage('dashboard');
      } else {
        toast.info('Session active. Let\'s build your shop name.');
        setScreen('SHOP_NAME');
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Registration + Creation handler
  const handleSignUpAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setScreen('BUILDING');
    setCreationProgress(10);
    setCreationStatus('Creating profile...');

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (authErr) {
        if (authErr.message.toLowerCase().includes('already registered') || authErr.message.toLowerCase().includes('already exists')) {
          throw new Error('This email is already registered. Go back to Sign In.');
        }
        throw authErr;
      }

      // Automatically sign in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (signInErr) throw signInErr;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Retrying active user session.');
      }

      setCreationProgress(30);
      setCreationStatus('Configuring profiles...');
      await supabase.from('profiles').upsert({
        id: user.id,
        display_name: shopName || 'ThreadZW Merchant',
        email: user.email || email,
        whatsapp_number: whatsapp,
        onboarding_complete: true
      });

      setCreationProgress(50);
      setCreationStatus('Generating custom brand handle...');
      const uniqueSlug = await generateUniqueSlug(shopName);
      const trialEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3-day trial standard
      const categoryLabel = selectedCategory === 'Formal' ? 'Luxury' : selectedCategory;

      const storeData = {
        owner_id: user.id,
        name: shopName,
        handle: uniqueSlug,
        slug: uniqueSlug,
        categories: [categoryLabel],
        location: selectedCity,
        whatsapp_number: whatsapp,
        description: description.trim() || `Premium curation of ${selectedCategory.toLowerCase()} items sourced in ${selectedCity}.`,
        plan: 'shop',
        subscription_status: 'trial',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEnds.toISOString(),
        is_live: true
      };

      const { data: shopData, error: shopErr } = await supabase
        .from('shops')
        .upsert(storeData, { onConflict: 'owner_id' })
        .select()
        .single();

      if (shopErr) throw shopErr;
      const realShopId = shopData.id;

      setCreationProgress(75);
      setCreationStatus('Uploading assets...');

      // Logo Upload
      if (logoFile) {
        try {
          const ext = logoFile.name.split('.').pop();
          const filePath = `${realShopId}/logo_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('shop-avatars')
            .upload(filePath, logoFile, { upsert: true });
          
          if (!uploadErr) {
            const { data: logoPub } = supabase.storage.from('shop-avatars').getPublicUrl(filePath);
            await supabase.from('shops').update({ logo_url: logoPub.publicUrl }).eq('id', realShopId);
          }
        } catch (logoErr) {
          console.error('Logo upload issue (continuing):', logoErr);
        }
      }

      // Banner Upload
      if (bannerFile) {
        try {
          const ext = bannerFile.name.split('.').pop();
          const filePath = `${realShopId}/banner_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('shop-avatars')
            .upload(filePath, bannerFile, { upsert: true });
          
          if (!uploadErr) {
            const { data: bannerPub } = supabase.storage.from('shop-avatars').getPublicUrl(filePath);
            await supabase.from('shops').update({ banner_url: bannerPub.publicUrl }).eq('id', realShopId);
          }
        } catch (bannerErr) {
          console.error('Banner upload issue (continuing):', bannerErr);
        }
      }

      setCreationProgress(90);
      setCreationStatus('Launching catalog...');

      // Inject 3 mock products
      const itemsToInsert = categoryMockProducts[selectedCategory] || categoryMockProducts['Sneakers'];
      for (const item of itemsToInsert) {
        await supabase.from('products').insert({
          shop_id: realShopId,
          owner_id: user.id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          images: [item.image],
          category: categoryLabel,
          condition: 'New',
          sizes: [{ size: 'M', quantity: 10 }, { size: 'L', quantity: 10 }],
          is_published: true,
          status: 'active',
          total_stock: 20
        });
      }

      setCreationProgress(100);
      setCreationStatus('Done!');

      // Onboarding state preservation
      localStorage.setItem('threadzw_onboarding_complete', 'true');
      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
      localStorage.setItem('threadzw_shop_onboarding_first_time', 'done');

      setShop(shopData);
      setHasShop(true);
      setShopLoading(false);
      await refreshShop();

      toast.success('Your clothing store is live.');
      setAppStage('dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete building shop.');
      setScreen('CREATE_ACCOUNT');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div id="threadzw-onboarding-pure-dark-container" className="fixed inset-0 bg-black text-white flex flex-col font-sans select-none overflow-hidden z-[45]">
      
      {/* 2px Neon Green Top Progress Bar */}
      {isCreationScreen && (
        <div className="w-full h-[2px] bg-zinc-950 relative z-50">
          <div 
            style={{ width: `${getStepProgress()}%` }} 
            className="h-full bg-[#25D366] transition-all duration-300 ease-out"
          />
        </div>
      )}

      {/* Modern Back Nav Header */}
      {screen !== 'WELCOME' && screen !== 'BUILDING' && (
        <header className="h-20 px-6 flex items-center justify-between shrink-0 z-40 bg-black">
          <button 
            onClick={handleBack}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-white active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
          
          <span className="text-sm font-black tracking-tighter text-white select-none">
            ThreadZW<span className="text-[#25D366]">.</span>
          </span>
        </header>
      )}

      {/* Main Spacious Content */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg space-y-10">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full"
            >

              {/* WELCOME */}
              {screen === 'WELCOME' && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <span className="text-sm font-bold tracking-widest text-[#25D366] uppercase">ThreadZW</span>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white">
                      Zimbabwe's professional clothing store builder.
                    </h1>
                    <p className="text-zinc-500 text-base md:text-lg font-medium leading-relaxed max-w-md pt-2">
                      Build a premium storefront. Share your custom link. Receive verified orders directly on WhatsApp.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <button
                      onClick={() => setScreen('SHOP_NAME')}
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer shadow-lg shadow-[#25D366]/5 active:scale-[0.98]"
                    >
                      Create Store
                    </button>
                    <button
                      onClick={() => setScreen('SIGN_IN')}
                      className="w-full bg-transparent hover:bg-zinc-900/40 text-white font-bold text-base py-4 rounded-full transition-all cursor-pointer border border-zinc-800"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* SIGN IN */}
              {screen === 'SIGN_IN' && (
                <form onSubmit={handleSignInSubmit} className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Sign In</h2>
                    <p className="text-zinc-500 text-sm">Access your active dashboard coordinates.</p>
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="space-y-1">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 px-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-700"
                      />
                    </div>

                    <div className="space-y-1 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 pr-10 pl-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 bottom-4 text-zinc-500 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] disabled:opacity-50 text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                  </button>
                </form>
              )}

              {/* SHOP_NAME */}
              {screen === 'SHOP_NAME' && (
                <div className="space-y-8">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    What is your shop called?
                  </h2>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Harare Sneaker Hub"
                      className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-2xl md:text-3xl py-4 px-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-800"
                    />
                    {shopName && (
                      <p className="text-sm text-zinc-500 font-medium">
                        URL preview: <span className="text-[#25D366] font-bold">threadzw.com/{generateSlug(shopName)}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* CATEGORY */}
              {screen === 'CATEGORY' && (
                <div className="space-y-8">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    What do you sell?
                  </h2>

                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {([
                      { id: 'Sneakers', label: 'Sneakers' },
                      { id: 'Thrift', label: 'Thrift Store' },
                      { id: 'Streetwear', label: 'Streetwear' },
                      { id: 'Formal', label: 'Luxury & Formal' }
                    ] as const).map((cat) => {
                      const isSel = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`py-4 px-5 rounded-2xl border text-sm font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSel 
                              ? 'bg-zinc-950 border-[#25D366] text-[#25D366]' 
                              : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                          }`}
                        >
                          <span>{cat.label}</span>
                          {isSel && <Check className="w-4 h-4 text-[#25D366] stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* CITY */}
              {screen === 'CITY' && (
                <div className="space-y-8">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    Where is your store based?
                  </h2>

                  <div className="relative pt-2">
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-2xl py-4 px-0 outline-none appearance-none cursor-pointer transition-colors"
                    >
                      {ZIM_CITIES.map((city) => (
                        <option key={city} value={city} className="bg-black text-white">{city}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* WHATSAPP */}
              {screen === 'WHATSAPP' && (
                <div className="space-y-8">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    What is your WhatsApp number?
                  </h2>

                  <div className="space-y-4">
                    <input
                      type="tel"
                      autoFocus
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 0776223144"
                      className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-2xl md:text-3xl py-4 px-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-800 font-mono"
                    />
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* INSTAGRAM */}
              {screen === 'INSTAGRAM' && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Optional</span>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                      What is your Instagram handle?
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      autoFocus
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="e.g. harare_sneakers"
                      className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-2xl md:text-3xl py-4 px-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-800"
                    />
                  </div>

                  <div className="space-y-3 mt-6">
                    <button
                      onClick={handleNext}
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => {
                        setInstagram('');
                        setScreen('DESCRIPTION');
                      }}
                      className="w-full text-zinc-500 hover:text-white font-bold text-sm py-2 transition-all cursor-pointer text-center"
                    >
                      Skip Step
                    </button>
                  </div>
                </div>
              )}

              {/* DESCRIPTION */}
              {screen === 'DESCRIPTION' && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Optional</span>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                      Write a short description of your shop
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      autoFocus
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Premium streetwear sourced globally."
                      className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 px-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-800"
                    />
                  </div>

                  <div className="space-y-3 mt-6">
                    <button
                      onClick={handleNext}
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => {
                        setDescription('');
                        setScreen('LOGO_UPLOAD');
                      }}
                      className="w-full text-zinc-500 hover:text-white font-bold text-sm py-2 transition-all cursor-pointer text-center"
                    >
                      Skip Step
                    </button>
                  </div>
                </div>
              )}

              {/* LOGO_UPLOAD */}
              {screen === 'LOGO_UPLOAD' && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Optional</span>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                      Upload your shop logo
                    </h2>
                  </div>

                  <div className="flex flex-col items-center justify-center pt-2">
                    <div 
                      onClick={() => logoInputRef.current?.click()}
                      className="w-28 h-28 rounded-full border border-dashed border-zinc-800 hover:border-[#25D366] bg-transparent flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
                    >
                      {logoPreview ? (
                        <>
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-1">
                          <Camera className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Browse</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      onChange={handleLogoChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  <div className="space-y-3 mt-6">
                    <button
                      onClick={handleNext}
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                        setScreen('BANNER_UPLOAD');
                      }}
                      className="w-full text-zinc-500 hover:text-white font-bold text-sm py-2 transition-all cursor-pointer text-center"
                    >
                      Skip Step
                    </button>
                  </div>
                </div>
              )}

              {/* BANNER_UPLOAD */}
              {screen === 'BANNER_UPLOAD' && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Optional</span>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                      Upload your store cover
                    </h2>
                  </div>

                  <div className="pt-2">
                    <div 
                      onClick={() => bannerInputRef.current?.click()}
                      className="w-full h-32 rounded-2xl border border-dashed border-zinc-800 hover:border-[#25D366] bg-transparent flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
                    >
                      {bannerPreview ? (
                        <>
                          <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <ImageIcon className="w-5 h-5 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-1.5">
                          <ImageIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Browse Cover Banner</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={bannerInputRef} 
                      onChange={handleBannerChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  <div className="space-y-3 mt-6">
                    <button
                      onClick={handleNext}
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => {
                        setBannerFile(null);
                        setBannerPreview(null);
                        setScreen('CREATE_ACCOUNT');
                      }}
                      className="w-full text-zinc-500 hover:text-white font-bold text-sm py-2 transition-all cursor-pointer text-center"
                    >
                      Skip Step
                    </button>
                  </div>
                </div>
              )}

              {/* CREATE_ACCOUNT */}
              {screen === 'CREATE_ACCOUNT' && (
                <form onSubmit={handleSignUpAndCreate} className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Secure your store</h2>
                    <p className="text-zinc-500 text-sm">Enter credentials to establish your private shop login access.</p>
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="space-y-1">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 px-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-700"
                      />
                    </div>

                    <div className="space-y-1 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create Password"
                        className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 pr-10 pl-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 bottom-4 text-zinc-500 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="space-y-1 relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat Password"
                        className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-[#25D366] text-white text-xl py-4 pr-10 pl-0 outline-none transition-colors caret-[#25D366] placeholder-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-0 bottom-4 text-zinc-500 hover:text-white cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-base py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
                  >
                    Build My Shop
                  </button>
                </form>
              )}

              {/* BUILDING */}
              {screen === 'BUILDING' && (
                <div className="space-y-8 text-center py-10">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-zinc-900 border-t-[#25D366] animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white tracking-tight">Launching your shop</h3>
                    <p className="text-zinc-500 text-sm font-medium animate-pulse">{creationStatus}</p>
                  </div>

                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${creationProgress}%` }}
                      className="h-full bg-[#25D366] transition-all duration-300 ease-out"
                    />
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
          
        </div>
      </main>

    </div>
  );
};
