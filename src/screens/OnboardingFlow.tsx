import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Check, Camera, Image as ImageIcon, Search, MessageSquare, 
  Eye, EyeOff, ShoppingBag, Smartphone, Store, Clock, Flame, Send,
  ArrowRight, Lock, AlertCircle, TrendingUp, CheckCircle2, Package,
  DollarSign, BarChart2, MapPin, Tag, Trophy, AlertTriangle, RefreshCw, HelpCircle, Shirt, Briefcase, Gem, Sparkles,
  X, MessageCircle, Unlock, Share2, PlusCircle, ExternalLink, ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { mapError } from '../lib/utils';
import { useGlobalCategories } from '../hooks/useGlobalCategories';
import { getAppHost, getAbsoluteShopUrl } from '../utils/shopUrl';

// WhatsApp icon SVG
const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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

const categoryRecommendations: Record<string, { emoji: string; heading: string; text: string }[]> = {
  Sneakers: [
    {
      emoji: "👟",
      heading: "🔥 Premium Sneaker Collections",
      text: "Shop exclusive sneakers, limited releases and stylish streetwear."
    },
    {
      emoji: "🔥",
      heading: "Drip & Sole Harare 👟🇿🇼",
      text: "Zimbabwe's premier sneaker plug. Authentic kicks and rare colorways sourced globally."
    },
    {
      emoji: "⚡",
      heading: "Sneaker Drop ZW 👟💎",
      text: "High-quality sneaker drops, direct-to-your-door shipping, and 24/7 WhatsApp customer care."
    }
  ],
  Thrift: [
    {
      emoji: "🧥",
      heading: "Curated Thrift Finds",
      text: "Unique vintage and thrift collections sourced for fashion lovers."
    },
    {
      emoji: "💎",
      heading: "Vintage Treasures ZW 🧥✨",
      text: "One-of-a-kind thrift fits, curated leather jackets, retro denim, and classic style in Harare."
    },
    {
      emoji: "♻️",
      heading: "Eco-Conscious Thrift 🧥🌿",
      text: "Affordable premium secondhand style. Bringing you sustainable curated fashion."
    }
  ],
  Electronics: [
    {
      emoji: "📱",
      heading: "📱 Trusted Electronics Store",
      text: "Affordable gadgets and accessories from trusted suppliers."
    },
    {
      emoji: "⚡",
      heading: "NextGen Tech ZW 📱🔋",
      text: "Original apple/android devices, premium phone cases, charger cables and fast Harare courier."
    },
    {
      emoji: "🎧",
      heading: "Gadget Hub Harare 🎧📡",
      text: "Premium audio gear, smart watches, power banks, and certified electronic accessories."
    }
  ],
  Fashion: [
    {
      emoji: "👕",
      heading: "👕 Modern Fashion Collections",
      text: "Trendy clothing and accessories for every style."
    },
    {
      emoji: "👗",
      heading: "Zim Designer Closet 👕👑",
      text: "Premium tailored clothing, trendy accessories, and high-street fashion curated for you."
    },
    {
      emoji: "⚜️",
      heading: "Classy Fits Harare 👗💎",
      text: "Premium apparel, custom styling tips, and top-tier streetwear selections."
    }
  ]
};

const recommendations = [
  ...categoryRecommendations.Sneakers,
  ...categoryRecommendations.Thrift,
  ...categoryRecommendations.Electronics,
  ...categoryRecommendations.Fashion
];

interface OnboardingFlowProps {
  setAppStage: (stage: 'landing' | 'paywall' | 'building' | 'dashboard' | 'admin' | 'shop' | 'product') => void;
  setPaywallScreen?: (screen: number) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ 
  setAppStage
}) => {
  const { categories: globalCategories } = useGlobalCategories();
  const [screen, setScreen] = useState(1);

  // Phase 3 & 4 data states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signingUp, setSigningUp] = useState(false);

  // Shop setup states
  const [shopName, setShopName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'Sneakers' | 'Thrift' | 'Electronics' | 'Fashion'>('Sneakers');
  const [activeRecommendationIndex, setActiveRecommendationIndex] = useState(0);
  const [isDraggingRecommendation, setIsDraggingRecommendation] = useState(false);
  const [textareaKey, setTextareaKey] = useState(0);

  // Recommendation Carousel Auto-scroll effect
  useEffect(() => {
    if (isDraggingRecommendation || screen !== 23) return;
    const interval = setInterval(() => {
      setActiveRecommendationIndex((prev) => (prev + 1) % recommendations.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isDraggingRecommendation, screen]);

  // First product states
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);

  // Final success links
  const [finalShopSlug, setFinalShopSlug] = useState('');
  const [finalShopId, setFinalShopId] = useState('');
  const [finalShopUrl, setFinalShopUrl] = useState('');

  // Building screen states
  const [loadProgress, setLoadProgress] = useState(0);
  const [visibleChecks, setVisibleChecks] = useState<number[]>([]);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const productImgInputRef = useRef<HTMLInputElement>(null);
  const shopRecordRef = useRef<any>(null);

  // Back button control
  const handleBack = () => {
    if (screen === 1 || screen === 26) return;
    setScreen(prev => prev - 1);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleProductImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImageFile(file);
      setProductImagePreview(URL.createObjectURL(file));
    }
  };

  // Sign up account handler (Screen 19)
  const handleSignUpSubmit = async () => {
    if (signingUp) return;
    if (!email.trim() || !email.includes('@')) {
      toast.error('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSigningUp(true);
    try {
      // Create user auth record in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password
      });

      let activeUserId = '';
      if (authError) {
        if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already exists')) {
          const { data: sData, error: sErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password
          });
          if (sErr) {
            throw new Error('This email is already registered. Please check credentials or sign in.');
          }
          activeUserId = sData.user?.id || '';
        } else {
          throw authError;
        }
      } else {
        // Sign in explicitly to establish session
        try {
          const { data: sData, error: sErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password
          });
          if (!sErr && sData.user) {
            activeUserId = sData.user.id;
          } else {
            activeUserId = authData.user?.id || '';
          }
        } catch (_) {
          activeUserId = authData.user?.id || '';
        }
      }

      if (!activeUserId) {
        throw new Error('Could not establish secure login session.');
      }

      // Success, move to Success Account Creation screen
      localStorage.setItem('supabase_logged_in_user_id', activeUserId);
      localStorage.setItem('threadzw_owner_email', email.trim().toLowerCase());
      localStorage.setItem('threadzw_logged_in', 'true');
      setScreen(20);
    } catch (err: any) {
      console.error("SHOP CREATION FAILED");
      console.error(err);
      console.error(JSON.stringify(err, null, 2));
      toast.error(mapError(err));
    } finally {
      setSigningUp(false);
    }
  };

  // Final database construction (triggered in screen 26 building animation)
  const executeShopBuilding = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        throw new Error('User session not found.');
      }

      // 1. Create Profile record
      await supabase.from('profiles').upsert({
        id: userId,
        display_name: shopName || 'ThreadZW Merchant',
        email: email.trim().toLowerCase(),
        whatsapp_number: whatsapp || '0776223144',
        onboarding_complete: true
      });

      // 2. Create shop record first to get the database store ID (realShopId)
      const trialEnds = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
      const generatedSlug = await generateUniqueSlug(shopName || 'My Shop');

      const user = sessionData?.session?.user;
      const storeData = {
        owner_id: userId,
        name: shopName || 'My Shop',
        handle: generatedSlug,
        slug: generatedSlug,
        categories: [productCategory || 'Clothing'],
        location: 'Harare',
        whatsapp_number: whatsapp || '0776223144',
        description: description || 'Premium clothing boutique',
        plan: 'shop',
        subscription_status: 'trial',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEnds.toISOString(),
        is_live: true
      };

      console.log("========== SHOP CREATION START ==========");
      console.log("AUTH USER:", user);
      console.log("AUTH USER ID:", user?.id);
      console.log("STORE DATA:", storeData);
      console.log("========================================");

      const { data, error } = await supabase
        .from('shops')
        .upsert(storeData, { onConflict: 'owner_id' })
        .select()
        .single();

      console.log("SHOP UPSERT DATA:", data);
      console.log("SHOP UPSERT ERROR:", error);

      const shopRecord = data;
      const insertError = error;

      if (insertError) {
        console.error("SHOP INSERT FAILED:", insertError);
        throw insertError;
      }
      if (!shopRecord) throw new Error('Database did not return the inserted shop record.');

      shopRecordRef.current = shopRecord;

      const realShopId = shopRecord.id;
      const generatedUrl = `/shop/${realShopId}`;
      const urlId = realShopId;

      // Forensic logging
      console.log("URL SHOP ID:", realShopId);
      console.log("DB SHOP ID:", shopRecord.id);
      console.log("OWNER ID:", shopRecord.owner_id);

      // Debugging logs
      console.log("Auth User ID:\n" + userId);
      console.log("Store ID:\n" + realShopId);
      console.log("Generated URL:\n" + generatedUrl);
      console.log('Generated URL ID:', urlId);
      console.log('Database Store ID:', realShopId);
      console.log('Match Result:', urlId === realShopId ? 'MATCHED' : 'MISMATCH');

      if (urlId !== realShopId) {
        throw new Error(`Validation failed: URL ID (${urlId}) does not match database store ID (${realShopId})!`);
      }

      // 3. Upload logo to shop-avatars bucket if selected, using realShopId as folder
      let finalLogoUrl = null;
      if (logoFile) {
        try {
          const ext = logoFile.name.split('.').pop();
          const filePath = `${realShopId}/logo_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('shop-avatars')
            .upload(filePath, logoFile, { upsert: true });
          
          if (!uploadErr) {
            const { data: logoPub } = supabase.storage.from('shop-avatars').getPublicUrl(filePath);
            finalLogoUrl = logoPub.publicUrl;
            
            // Update shop record with the uploaded logo URL
            await supabase
              .from('shops')
              .update({ logo_url: finalLogoUrl })
              .eq('id', realShopId);
          }
        } catch (logoErr) {
          console.error('Logo upload error:', logoErr);
        }
      }

      // 4. Upload first product image if selected, using realShopId as folder
      let finalProductImageUrl = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80';
      if (productImageFile) {
        try {
          const ext = productImageFile.name.split('.').pop();
          const filePath = `${realShopId}/product_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('product-images')
            .upload(filePath, productImageFile, { upsert: true });
          
          if (!uploadErr) {
            const { data: imgPub } = supabase.storage.from('product-images').getPublicUrl(filePath);
            finalProductImageUrl = imgPub.publicUrl;
          }
        } catch (imgErr) {
          console.error('Product image upload error:', imgErr);
        }
      }

      // 5. Create product record
      if (productName.trim()) {
        const shopId = realShopId;
        console.log("PRODUCT SHOP ID:", shopId);
        console.log("PRODUCT OWNER ID:", user?.id);

        if (!realShopId || String(realShopId).startsWith('local-shop-') || realShopId === '55555555-5555-5555-5555-555555555555') {
          throw new Error("Cannot create product: No active, valid shop found for your profile.");
        }

        const { error: prodError } = await supabase.from('products').insert({
          shop_id: realShopId,
          owner_id: userId,
          name: productName,
          description: `First release from ${shopName}. Ready for orders.`,
          price: parseFloat(productPrice) || 15,
          images: [finalProductImageUrl],
          category: productCategory || 'Clothing',
          condition: 'New',
          sizes: [{ size: 'M', quantity: 10 }, { size: 'L', quantity: 10 }],
          is_published: true,
          status: 'active',
          total_stock: 20
        });

        if (prodError) {
          console.error('Product insert error:', prodError);
        }
      }

      // Record verified values for state
      setFinalShopId(realShopId);
      setFinalShopSlug(generatedSlug);
      setFinalShopUrl(generatedUrl);

      // Sync local storage caches with the real database record to make sure IDs match perfectly
      try {
        localStorage.setItem(`shop_${userId}`, JSON.stringify(shopRecord));
        localStorage.setItem('threadzw_shop', JSON.stringify(shopRecord));
      } catch (cacheErr) {
        console.warn('Error saving shop to localStorage:', cacheErr);
      }

      // Complete validation and login state
      localStorage.setItem('threadzw_onboarding_complete', 'true');
      localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
      localStorage.setItem('threadzw_shop_onboarding_first_time', 'done');

    } catch (err: any) {
      console.error("SHOP CREATION FAILED");
      console.error(err);
      console.error(JSON.stringify(err, null, 2));
      toast.error(err?.message || 'Failed to create shop');
      throw err;
    }
  };

  // Building Progress bar animation
  useEffect(() => {
    if (screen === 26) {
      setLoadProgress(0);
      setVisibleChecks([]);
      executeShopBuilding();

      const interval = setInterval(() => {
        setLoadProgress(p => {
          if (p >= 100) return 100;
          return p + 2.5;
        });
      }, 100);

      const timers = [
        setTimeout(() => setVisibleChecks(v => [...v, 0]), 800),
        setTimeout(() => setVisibleChecks(v => [...v, 1]), 1600),
        setTimeout(() => setVisibleChecks(v => [...v, 2]), 2400),
        setTimeout(() => setVisibleChecks(v => [...v, 3]), 3200),
        setTimeout(() => {
          console.log("shopRecordRef:", shopRecordRef.current);
          console.log("finalShopId:", finalShopId);
          console.log("realShopId:", shopRecordRef.current?.id);

          if (shopRecordRef.current?.id) {
            setScreen(27); // To final live success screen!
          } else {
            toast.error('Shop creation failed');
          }
        }, 4200)
      ];

      return () => {
        clearInterval(interval);
        timers.forEach(clearTimeout);
      };
    }
  }, [screen]);

  // Overall onboarding progress percentage calculated by screen index
  const progressPercent = Math.round((screen / 27) * 100);

  // Suggestions for categories
  const displayCategories = globalCategories && globalCategories.length > 0 
    ? globalCategories 
    : [
        { id: '1', name: 'Streetwear' },
        { id: '2', name: 'Thrift' },
        { id: '3', name: 'Luxury' },
        { id: '4', name: 'Sportswear' },
        { id: '5', name: 'Vintage' },
        { id: '6', name: 'Accessories' }
      ];

  // Dynamic onboarding progress tracker
  const getProgressDetails = (s: number) => {
    if (s < 19) {
      const percentage = Math.round((s / 18) * 100);
      const blocks = Math.round(percentage / 10);
      const ascii = '█'.repeat(blocks) + '░'.repeat(10 - blocks);
      return {
        label: `Intro ${s}/18`,
        bar: `${ascii} ${percentage}%`,
        percent: percentage
      };
    }
    
    // Interactive setup screens mapping to Steps 1 to 5
    let stepText = "Step 1 of 5";
    let percent = 20;
    if (s === 19 || s === 20) {
      stepText = "Step 1 of 5";
      percent = 20;
    } else if (s === 21) {
      stepText = "Step 2 of 5";
      percent = 40;
    } else if (s === 22) {
      stepText = "Step 2 of 5";
      percent = 50;
    } else if (s === 23) {
      stepText = "Step 3 of 5";
      percent = 60;
    } else if (s === 24) {
      stepText = "Step 4 of 5";
      percent = 80;
    } else if (s === 25) {
      stepText = "Step 5 of 5";
      percent = 100;
    } else {
      stepText = "Step 5 of 5";
      percent = 100;
    }
    const blocks = Math.round(percent / 10);
    const ascii = '█'.repeat(blocks) + '░'.repeat(10 - blocks);
    return {
      label: stepText,
      bar: `${ascii} ${percent}%`,
      percent
    };
  };

  const { label: stepLabel, bar: asciiBar, percent: stepPercent } = getProgressDetails(screen);

  return (
    <div id="threadzw-onboarding-container" className="fixed inset-0 bg-[#000000] text-white flex flex-col font-sans select-none overflow-hidden z-[45]">
      
      {/* Dynamic Top Progress Bar */}
      <div className="w-full h-1 bg-[#111111] relative z-50">
        <div 
          style={{ width: `${stepPercent}%` }} 
          className="h-full bg-[#C6FF00] transition-all duration-500 ease-out shadow-sm shadow-[#C6FF00]/50" 
        />
      </div>

      {/* Header Bar */}
      {screen > 1 && screen !== 26 && screen !== 27 && (
        <div className="h-14 px-4 flex items-center justify-between shrink-0 z-50 border-b border-[rgba(255,255,255,0.08)] bg-[#111111]/90 backdrop-blur-md">
          <button 
            onClick={handleBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#111111] border border-[rgba(255,255,255,0.08)] text-white hover:bg-[#000000] active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center justify-center leading-none text-center">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider font-mono">{stepLabel}</span>
            <span className="text-[10px] text-[#C6FF00] font-black font-mono tracking-widest mt-0.5">{asciiBar}</span>
          </div>

          <span className="text-sm font-black tracking-tight text-white">
            THREADZW<span className="text-[#C6FF00]">.</span>
          </span>
        </div>
      )}

      {/* Content wrapper */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col justify-center max-w-md mx-auto w-full px-6 py-6">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full flex-1 flex flex-col justify-between"
          >
            
            {/* -------------------- PHASE 1: PROBLEM IDENTIFICATION -------------------- */}
            
            {/* Screen 1: WhatsApp Pain point */}
            {screen === 1 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="text-center pt-6">
                  <span className="text-xl font-black tracking-tight text-white block mb-6">
                    THREADZW<span className="text-[#C6FF00]">.</span>
                  </span>
                  <h1 className="text-3xl font-bold tracking-tight text-white leading-tight mb-6">
                    Still selling clothes through <span className="text-[#25D366]">WhatsApp</span> screenshots?
                  </h1>
                </div>

                <div className="my-8">
                  <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] p-5 shadow-lg relative overflow-hidden max-w-xs mx-auto">
                    <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                      <span className="text-[9px] font-bold text-[#25D366] font-mono">1 NEW ENQUIRY</span>
                    </div>
                    <div className="flex items-start gap-3 mt-2 text-left">
                      <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0 font-bold text-sm">💬</div>
                      <div>
                        <h4 className="font-extrabold text-white text-xs leading-none mb-1">Customer Inquiry</h4>
                        <p className="text-[#9ca3af] text-xs italic leading-tight">"Is this available? Send more pictures please..."</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-center text-[#6b7280] text-xs font-semibold leading-relaxed">
                    The endless back-and-forth screenshots are costing you time and sales. Let's fix it.
                  </p>
                  <button 
                    onClick={() => setScreen(2)}
                    className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#C6FF00]/15"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}

            {/* Screen 2: Repetitive questions */}
            {screen === 2 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-4 text-center">
                    Customers keep asking questions you've already answered?
                  </h1>
                </div>

                <div className="my-6 space-y-3">
                  {[
                    { q: "How much?", delay: 0.1 },
                    { q: "Do you have size M?", delay: 0.3 },
                    { q: "What is your location?", delay: 0.5 }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: item.delay }}
                      className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-4.5 text-left text-sm font-semibold text-white flex items-center gap-3.5 shadow-subtle"
                    >
                      <span className="text-[#EF4444] text-lg font-mono">❓</span>
                      <span>"{item.q}"</span>
                    </motion.div>
                  ))}
                </div>

                <button 
                  onClick={() => setScreen(3)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Yes, always ➔</span>
                </button>
              </div>
            )}

            {/* Screen 3: Repeating Questions representation */}
            {screen === 3 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="text-center space-y-1">
                  <h1 className="text-3xl font-black tracking-tight leading-none text-white mb-2">
                    "How much?"
                  </h1>
                  <h1 className="text-3xl font-bold tracking-tight leading-none text-[#9ca3af] mb-2">
                    "Do you have size M?"
                  </h1>
                  <h1 className="text-2xl font-medium tracking-tight leading-none text-[#9ca3af]">
                    "What's your location?"
                  </h1>
                </div>

                <div className="my-6 bg-red-500/5 border border-red-500/10 rounded-[28px] p-5 text-center max-w-xs mx-auto">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <p className="text-white text-xs font-semibold leading-relaxed">
                    Answering the exact same details 20 times a day isn't running a clothing business. It's an unpaid customer support role.
                  </p>
                </div>

                <button 
                  onClick={() => setScreen(4)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue &rarr;</span>
                </button>
              </div>
            )}

            {/* Screen 4: TikTok dropoff */}
            {screen === 4 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2 text-center">
                    You post products on TikTok...
                  </h1>
                  <p className="text-center text-[#9ca3af] text-sm font-semibold">But customers have nowhere to browse.</p>
                </div>

                <div className="my-6 relative bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] p-5 max-w-xs mx-auto h-40 flex flex-col justify-center items-center overflow-hidden shadow-subtle">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 blur-xl" />
                  <Smartphone className="w-12 h-12 text-[#6b7280] mb-2 relative z-10" />
                  <span className="text-[11px] font-black uppercase text-red-500 relative z-10 tracking-widest">🚫 NO WEBSITE LINK</span>
                </div>

                <button 
                  onClick={() => setScreen(5)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>That's true ➔</span>
                </button>
              </div>
            )}

            {/* Screen 5: Zimbabwean stats */}
            {screen === 5 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-4">
                    Most Zimbabwean clothing brands lose sales...
                  </h1>
                </div>

                <div className="my-6 bg-[#C6FF00]/10 border border-[rgba(255,255,255,0.08)] rounded-[28px] p-6 text-center max-w-sm mx-auto space-y-4 shadow-subtle">
                  <TrendingUp className="w-12 h-12 text-[#C6FF00] mx-auto" />
                  <p className="text-white text-base leading-snug font-bold">
                    ...because customers cannot browse full collections easily and get prices immediately.
                  </p>
                  <p className="text-[#6b7280] text-[11px] font-semibold">
                    Buyers expect instant catalogs. If they have to DM for a price, 67% will leave.
                  </p>
                </div>

                <button 
                  onClick={() => setScreen(6)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue ➔</span>
                </button>
              </div>
            )}

            {/* Screen 6: Messy WhatsApp Screenshot Mock */}
            {screen === 6 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2 text-center">
                    Messy chat screenshots.
                  </h1>
                  <p className="text-center text-[#6b7280] text-xs font-semibold">How orders get lost in the noise.</p>
                </div>

                <div className="my-4 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] p-5 space-y-2.5 max-w-xs mx-auto text-xs font-sans text-left shadow-subtle">
                  <div className="flex justify-start">
                    <div className="bg-[#f3f4f6] text-white p-2.5 rounded-[28px] rounded-tl-none max-w-[80%] border border-[rgba(255,255,255,0.08)]">
                      Is this hoodie still available?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#e8fbf0] text-[#0f5132] p-2.5 rounded-[28px] rounded-tr-none max-w-[80%] border border-[#d1e7dd]">
                      Yes! Available in Size L & XL. 35 USD.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-[#f3f4f6] text-white p-2.5 rounded-[28px] rounded-tl-none max-w-[80%] border border-[rgba(255,255,255,0.08)]">
                      Can you deliver to Avondale?
                    </div>
                  </div>
                  <div className="text-center text-[10px] text-[#9ca3af] font-semibold my-1">
                    3 hours later... (no reply)
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(7)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>I've had this happen ➔</span>
                </button>
              </div>
            )}

            {/* Screen 7: Customer left representation */}
            {screen === 7 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2">
                    A customer left.
                  </h1>
                  <p className="text-[#6b7280] text-xs font-bold">They didn't have time to wait for a reply.</p>
                </div>

                <div className="my-6 bg-red-500/5 border border-red-500/10 rounded-[28px] p-6 text-center max-w-xs mx-auto space-y-2">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto font-black text-lg">✗</div>
                  <h4 className="font-extrabold text-white text-sm">Sale Abandoned</h4>
                  <p className="text-[#9ca3af] text-xs font-medium leading-relaxed">
                    Zimbabwean shoppers buy on impulse. If you don't answer in 5 minutes, they look elsewhere.
                  </p>
                </div>

                <button 
                  onClick={() => setScreen(8)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>How do we fix this? ➔</span>
                </button>
              </div>
            )}

            {/* Screen 8: Transition to Solution */}
            {screen === 8 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="text-center pt-8">
                  <h1 className="text-3xl font-bold tracking-tight leading-snug text-white mb-4">
                    Your products deserve a real storefront.
                  </h1>
                  <p className="text-[#9ca3af] text-sm font-medium px-4">
                    Give your clothing brand a premium home. Show prices, stock, and collect inquiries instantly.
                  </p>
                </div>

                <div className="my-8 flex justify-center">
                  <div className="w-24 h-24 bg-[#C6FF00]/10 border-2 border-dashed border-[#C6FF00]/30 rounded-3xl flex items-center justify-center text-[#C6FF00] shadow-subtle">
                    <Store className="w-12 h-12" />
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(9)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF00]/15"
                >
                  <span>Show me how →</span>
                </button>
              </div>
            )}


            {/* -------------------- PHASE 2: SOLUTION DEMONSTRATION -------------------- */}
            
            {/* Screen 9: Send Link instead */}
            {screen === 9 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="text-center">
                  <span className="text-xs font-black uppercase tracking-wider text-[#C6FF00] mb-2 block">
                    The ThreadZW Solution
                  </span>
                  <h1 className="text-3xl font-bold tracking-tight leading-none text-white mb-3">
                    Imagine sending one link instead.
                  </h1>
                </div>

                <div className="my-6">
                  <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] p-5 text-left font-sans text-xs space-y-2 max-w-xs mx-auto shadow-subtle">
                    <span className="text-[10px] font-black uppercase text-[#25D366] block">AUTO REPLY</span>
                    <p className="text-[#9ca3af] leading-relaxed italic">
                      "Hey! Thanks for inquiring. Check out our full new collection, real-time sizes, and instant pricing here: <span className="text-[#C6FF00] font-black underline">threadzw.co/kure</span> 🚀"
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(10)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>That's beautiful ➔</span>
                </button>
              </div>
            )}

            {/* Screen 10: Storefront Mockup */}
            {screen === 10 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2">
                    A beautiful storefront mockup.
                  </h1>
                  <p className="text-[#6b7280] text-xs font-bold">Your own custom branded digital boutique.</p>
                </div>

                <div className="my-4 border border-[rgba(255,255,255,0.08)] rounded-[28px] bg-[#111111] p-4.5 text-left space-y-3.5 max-w-xs mx-auto scale-95 shadow-lg relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] font-black flex items-center justify-center text-xs border border-[rgba(255,255,255,0.08)]">
                      KR
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-xs leading-none">KURE STREETWEAR</h4>
                      <p className="text-[#6b7280] text-[10px] mt-0.5 leading-none">Harare, ZW</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#000000] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-2 text-center">
                      <div className="h-16 bg-zinc-200 rounded-lg mb-1.5" />
                      <p className="font-extrabold text-white text-[10px] truncate">Graphic Tee</p>
                      <p className="text-[#C6FF00] font-mono text-[10px] font-black mt-0.5">$15 USD</p>
                    </div>
                    <div className="bg-[#000000] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-2 text-center">
                      <div className="h-16 bg-zinc-200 rounded-lg mb-1.5" />
                      <p className="font-extrabold text-white text-[10px] truncate">Cargo Pants</p>
                      <p className="text-[#C6FF00] font-mono text-[10px] font-black mt-0.5">$35 USD</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(11)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue ➔</span>
                </button>
              </div>
            )}

            {/* Screen 11: Customer Browses Self */}
            {screen === 11 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2 text-center">
                    Customers browse products themselves.
                  </h1>
                  <p className="text-center text-[#6b7280] text-xs font-bold">They filter by size, categories, or collections instantly.</p>
                </div>

                <div className="my-6 space-y-2 max-w-xs mx-auto w-full">
                  <div className="flex gap-2 justify-center">
                    <span className="bg-[#C6FF00] text-black text-[10px] font-bold px-3 py-1.5 rounded-full">All Items</span>
                    <span className="bg-[#111111] border border-[rgba(255,255,255,0.08)] text-[#9ca3af] text-[10px] font-bold px-3 py-1.5 rounded-full">Hoodies</span>
                    <span className="bg-[#111111] border border-[rgba(255,255,255,0.08)] text-[#9ca3af] text-[10px] font-bold px-3 py-1.5 rounded-full">Tees</span>
                  </div>
                  <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-3.5 flex justify-between items-center text-xs font-bold text-[#9ca3af] shadow-subtle">
                    <span>Filter: Size M</span>
                    <span className="text-[#C6FF00]">3 found</span>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(12)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Nice ➔</span>
                </button>
              </div>
            )}

            {/* Screen 12: Professional Profile */}
            {screen === 12 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2 text-center">
                    Professional brand profile.
                  </h1>
                  <p className="text-center text-[#6b7280] text-xs font-bold">Build instant buyer trust in Zimbabwe.</p>
                </div>

                <div className="my-6 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] p-5 space-y-3.5 max-w-xs mx-auto text-left relative overflow-hidden shadow-subtle">
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#C6FF00]/10 text-[#C6FF00] px-2 py-0.5 rounded text-[9px] font-black uppercase border border-[#C6FF00]/10">
                    <Check className="w-3 h-3 stroke-[3]" /> VERIFIED
                  </div>
                  <div className="w-12 h-12 rounded-full bg-zinc-100 border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#C6FF00] font-black text-sm shadow-inner">
                    KURE
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">Kure Streetwear</h4>
                    <p className="text-[#C6FF00] text-[10px] font-bold mt-0.5">@kure &bull; Harare, Zim</p>
                    <p className="text-[#9ca3af] text-[10px] mt-1.5 leading-snug font-medium">Curated high-quality vintage streetwear drops every Friday at 12 PM.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(13)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue ➔</span>
                </button>
              </div>
            )}

            {/* Screen 13: Product Pages */}
            {screen === 13 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2 text-center">
                    Product pages.
                  </h1>
                  <p className="text-center text-[#6b7280] text-xs font-bold">Show details, multiple pictures, and sizing scales.</p>
                </div>

                <div className="my-4 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] p-4.5 max-w-xs mx-auto text-left space-y-3 shadow-subtle">
                  <div className="h-28 bg-[#000000] border border-[rgba(255,255,255,0.08)] rounded-[24px] flex items-center justify-center text-[#6b7280]/20">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-white text-xs">Heavyweight Vintage Hoodie</h4>
                    <span className="text-[#C6FF00] font-mono text-xs font-black">$35 USD</span>
                  </div>
                  <div className="flex gap-1.5">
                    {['S', 'M', 'L', 'XL'].map(s => (
                      <span key={s} className={`text-[10px] font-bold px-2.5 py-1 rounded border ${s === 'M' ? 'border-[#C6FF00] text-[#C6FF00] bg-[#C6FF00]/10' : 'border-[rgba(255,255,255,0.08)] text-[#6b7280]'}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(14)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue ➔</span>
                </button>
              </div>
            )}

            {/* Screen 14: WhatsApp Inquiry Button */}
            {screen === 14 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2 text-center">
                    WhatsApp Inquiry Button.
                  </h1>
                  <p className="text-center text-[#6b7280] text-xs font-bold">Instantly collects pre-filled orders right to your chat.</p>
                </div>

                <div className="my-6 space-y-3 max-w-xs mx-auto w-full">
                  <div className="bg-[#25D366] text-white p-4.5 rounded-[24px] flex items-center justify-center gap-2 font-bold text-sm uppercase shadow-md shadow-[#25D366]/10 animate-pulse">
                    <WhatsAppIcon size={18} />
                    <span>Inquire via WhatsApp</span>
                  </div>
                  <div className="bg-[#000000] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-3 text-center text-[10px] text-[#9ca3af] font-semibold leading-normal">
                    Pre-fills in user chat:<br/>
                    <span className="text-[#C6FF00] font-bold">"Hi! I want to order 'Vintage Tee' (Size M, $15) from your ThreadZW store!"</span>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(15)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>That's perfect ➔</span>
                </button>
              </div>
            )}

            {/* Screen 15: Share on TikTok */}
            {screen === 15 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2 text-center">
                    Share on TikTok.
                  </h1>
                  <p className="text-center text-[#6b7280] text-xs font-bold">Put your store link directly in your video descriptions or bio.</p>
                </div>

                <div className="my-6 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] p-4.5 max-w-xs mx-auto text-left flex items-center gap-3 shadow-subtle">
                  <div className="w-10 h-10 rounded-full bg-[#0a0a0a] flex items-center justify-center text-white font-bold shrink-0 shadow-sm">🎵</div>
                  <div className="text-xs">
                    <h5 className="font-extrabold text-white">TikTok Bio Link</h5>
                    <p className="text-[#C6FF00] mt-0.5 font-bold font-mono">threadzw.co/kure</p>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(16)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue ➔</span>
                </button>
              </div>
            )}

            {/* Screen 16: Share on Instagram */}
            {screen === 16 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2 text-center">
                    Share on Instagram.
                  </h1>
                  <p className="text-center text-[#6b7280] text-xs font-bold">Add the storefront link in your bio or share to stories.</p>
                </div>

                <div className="my-6 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] p-4.5 max-w-xs mx-auto text-left flex items-center gap-3 shadow-subtle">
                  <div className="w-10 h-10 rounded-full bg-[#0a0a0a] flex items-center justify-center text-white font-bold shrink-0 shadow-sm">📸</div>
                  <div className="text-xs">
                    <h5 className="font-extrabold text-white">Instagram Profile</h5>
                    <p className="text-[#C6FF00] mt-0.5 font-bold font-mono">🔗 threadzw.co/kure</p>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(17)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue ➔</span>
                </button>
              </div>
            )}

            {/* Screen 17: Premium on every phone */}
            {screen === 17 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2">
                    Looks premium on every phone.
                  </h1>
                  <p className="text-[#6b7280] text-xs font-bold">Optimized for lightning-fast speeds in Zimbabwe.</p>
                </div>

                <div className="my-6 bg-[#C6FF00]/10 border border-[rgba(255,255,255,0.08)] rounded-[28px] p-5 text-center max-w-xs mx-auto shadow-subtle">
                  <Smartphone className="w-12 h-12 text-[#C6FF00] mx-auto mb-3 animate-pulse" />
                  <p className="text-white text-xs font-semibold leading-snug">
                    Designed to use minimal mobile data. Works incredibly fast on Econet and NetOne.
                  </p>
                </div>

                <button 
                  onClick={() => setScreen(18)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue ➔</span>
                </button>
              </div>
            )}

            {/* Screen 18: Ready in minutes */}
            {screen === 18 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="text-center pt-8">
                  <h1 className="text-3.5xl font-bold tracking-tight leading-snug text-white mb-4">
                    Your online shop. Ready in minutes.
                  </h1>
                  <p className="text-[#9ca3af] text-sm font-medium px-4">
                    Launch your clothing brand storefront today. Zero code needed. Built for Zimbabwe.
                  </p>
                </div>

                <div className="my-8 flex justify-center">
                  <div className="w-24 h-24 bg-[#C6FF00]/10 border border-[rgba(255,255,255,0.08)] rounded-full flex items-center justify-center text-[#C6FF00] animate-pulse">
                    <Sparkles className="w-12 h-12" />
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(19)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF00]/15"
                >
                  <span>Create My Shop →</span>
                </button>
              </div>
            )}


            {/* -------------------- PHASE 3: SIGN UP (2 SCREENS) -------------------- */}
            
            {/* Screen 19: Sign Up fields */}
            {screen === 19 && (
              <div className="flex-1 flex flex-col justify-between py-6">
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-2.5xl font-bold tracking-tight leading-none text-white">
                      Create Your Account
                    </h2>
                    <p className="text-[#6b7280] text-xs font-semibold mt-1.5">Get active instantly &bull; Free trial</p>
                  </div>

                  <div className="space-y-4 text-left">
                    <div>
                      <label className="text-[#9ca3af] text-[10px] tracking-wider uppercase font-extrabold block mb-1.5">Email address</label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. kurebrand@gmail.com"
                        className="w-full bg-[#111111] border-2 border-[rgba(255,255,255,0.08)] rounded-[24px] px-4 py-3.5 text-sm focus:border-[#C6FF00] focus:outline-none focus:ring-1 focus:ring-[#C6FF00] transition-colors text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[#9ca3af] text-[10px] tracking-wider uppercase font-extrabold block mb-1.5">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full bg-[#111111] border-2 border-[rgba(255,255,255,0.08)] rounded-[24px] pl-4 pr-11 py-3.5 text-sm focus:border-[#C6FF00] focus:outline-none focus:ring-1 focus:ring-[#C6FF00] transition-colors text-white font-medium"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  disabled={!email.trim() || password.length < 6 || signingUp}
                  onClick={handleSignUpSubmit}
                  className={`w-full h-14 font-bold text-base rounded-[24px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    email.trim() && password.length >= 6 && !signingUp
                      ? 'bg-[#C6FF00] text-black shadow-[#C6FF00]/10'
                      : 'bg-[#e5e7eb] text-[#9ca3af] pointer-events-none'
                  }`}
                >
                  {signingUp ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <span>Continue &rarr;</span>
                  )}
                </button>
              </div>
            )}

            {/* Screen 20: Sign Up Success */}
            {screen === 20 && (
              <div className="flex-1 flex flex-col justify-between py-6 text-center">
                <div className="pt-10 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-500 mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10 stroke-[2]" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight leading-none text-white">
                    Success!
                  </h1>
                  <p className="text-[#9ca3af] text-sm font-semibold px-6 leading-relaxed">
                    Account created successfully. Let's customize your live brand storefront.
                  </p>
                </div>

                <button 
                  onClick={() => setScreen(21)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF00]/15"
                >
                  <span>Let's build your shop →</span>
                </button>
              </div>
            )}


            {/* -------------------- PHASE 4: SHOP BUILDING (7 SCREENS) -------------------- */}
            
            {/* Screen 21: Shop Name */}
            {screen === 21 && (
              <div className="flex-1 flex flex-col justify-between py-6 text-left">
                <div className="space-y-4 pt-4">
                  <span className="text-[10px] font-black tracking-widest text-[#C6FF00] uppercase block">STEP 1 OF 5</span>
                  <h2 className="text-2.5xl font-bold tracking-tight leading-none text-white mb-2">
                    What is your Shop Name?
                  </h2>
                  <p className="text-[#9ca3af] text-xs font-semibold leading-relaxed">Choose a clean brand name (e.g. Kure, Threadz, HeavyWeight).</p>
                  
                  <input 
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Kure Streetwear"
                    maxLength={30}
                    className="w-full bg-[#111111] border-2 border-[rgba(255,255,255,0.08)] rounded-[24px] px-4 py-3.5 text-base font-bold text-white focus:border-[#C6FF00] focus:outline-none transition-colors"
                  />
                </div>

                <button 
                  disabled={!shopName.trim()}
                  onClick={() => setScreen(22)}
                  className={`w-full h-14 font-bold text-base rounded-[24px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    shopName.trim() ? 'bg-[#C6FF00] text-black shadow-lg shadow-[#C6FF00]/10' : 'bg-[#e5e7eb] text-[#9ca3af] pointer-events-none'
                  }`}
                >
                  <span>Next Step ➔</span>
                </button>
              </div>
            )}

            {/* Screen 22: Upload Logo */}
            {screen === 22 && (
              <div className="flex-1 flex flex-col justify-between py-6 text-left">
                <div className="space-y-5 pt-4 flex flex-col items-center text-center">
                  <div className="w-full">
                    <span className="text-[10px] font-black tracking-widest text-[#C6FF00] uppercase block mb-1">STEP 2 OF 5</span>
                    <h2 className="text-2.5xl font-bold tracking-tight leading-none text-white mb-2">
                      Upload Logo
                    </h2>
                    <p className="text-[#9ca3af] text-xs font-semibold leading-relaxed">Add your brand's avatar or profile icon.</p>
                  </div>

                  <input 
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="w-32 h-32 rounded-full border-2 border-dashed border-[rgba(255,255,255,0.08)] hover:border-[#C6FF00]/40 bg-[#111111] flex flex-col items-center justify-center overflow-hidden transition-colors cursor-pointer group relative shadow-subtle"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover animate-fade-in" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-[#6b7280]/60 group-hover:text-[#C6FF00] transition-colors">
                        <Camera className="w-8 h-8" />
                        <span className="text-[9px] font-black uppercase">Click to Select</span>
                      </div>
                    )}
                  </button>
                </div>

                <button 
                  onClick={() => setScreen(23)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF00]/10"
                >
                  <span>{logoPreview ? 'Next Step ➔' : 'Skip & Continue ➔'}</span>
                </button>
              </div>
            )}

            {/* Screen 23: Description */}
            {screen === 23 && (
              <div className="flex-1 flex flex-col justify-between py-6 text-left">
                <div className="space-y-4 pt-4">
                  <span className="text-[10px] font-black tracking-widest text-[#C6FF00] uppercase block">STEP 3 OF 5</span>
                  <h2 className="text-2.5xl font-bold tracking-tight leading-none text-white mb-2">
                    Write Description
                  </h2>
                  <p className="text-[#9ca3af] text-xs font-semibold leading-relaxed">Tell customers what makes your shop premium.</p>

                  <motion.div
                    key={textareaKey}
                    initial={{ opacity: 0.85, y: 3, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="relative"
                  >
                    <textarea 
                      value={description}
                      onChange={(e) => {
                        if (e.target.value.length <= 120) {
                          setDescription(e.target.value);
                        }
                      }}
                      placeholder="e.g. Harare's premium clothing store. Weekly drops of curated vintage and streetwear fits."
                      rows={3}
                      className="w-full bg-[#111111] border-2 border-[rgba(255,255,255,0.08)] rounded-[24px] p-4 text-white text-sm focus:border-[#C6FF00] focus:outline-none transition-colors resize-none mb-1.5 font-medium"
                    />
                    <span className="absolute bottom-3.5 right-3 text-[10px] font-bold text-[#6b7280]/60 font-mono">
                      {description.length}/120
                    </span>
                  </motion.div>

                  {/* Scrolling Recommendations Carousel */}
                  <div className="space-y-3 pt-1">
                    <style>{`
                      @keyframes onboardingMarquee {
                        0% { transform: translate3d(0, 0, 0); }
                        100% { transform: translate3d(-33.333%, 0, 0); }
                      }
                      .onboarding-marquee-track {
                        display: flex;
                        width: max-content;
                        animation: onboardingMarquee 16s linear infinite;
                      }
                      .onboarding-marquee-track:hover {
                        animation-play-state: paused;
                      }
                    `}</style>

                    <span className="text-[#6b7280] text-[9px] font-black uppercase tracking-wider block">TAP CARD TO AUTO-FILL BY CATEGORY</span>
                    
                    {/* Category Tabs Selector */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 select-none">
                      {(['Sneakers', 'Thrift', 'Electronics', 'Fashion'] as const).map((tab) => {
                        const isActive = selectedCategoryTab === tab;
                        const label = tab === 'Sneakers' ? '👟 Sneakers' : tab === 'Thrift' ? '🧥 Thrift' : tab === 'Electronics' ? '📱 Tech' : '👕 Fashion';
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => {
                              setSelectedCategoryTab(tab);
                              const firstRec = categoryRecommendations[tab]?.[0];
                              if (firstRec) {
                                setDescription(firstRec.text);
                                setTextareaKey(prev => prev + 1);
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                              isActive 
                                ? 'bg-[#C6FF00] text-black border-[#C6FF00]' 
                                : 'bg-[#111111] text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative w-full overflow-hidden py-1">
                      {/* Left and right fade gradients */}
                      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#000000] to-transparent z-10 pointer-events-none" />
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#000000] to-transparent z-10 pointer-events-none" />

                      <div className="w-full overflow-hidden">
                        <div className="onboarding-marquee-track gap-3.5">
                          {(() => {
                            const currentRecs = categoryRecommendations[selectedCategoryTab] || categoryRecommendations.Sneakers;
                            // Triplicated set to guarantee perfect continuous loop translation
                            const triplicatedRecs = [...currentRecs, ...currentRecs, ...currentRecs];
                            return triplicatedRecs.map((rec, idx) => {
                              const isSelected = description === rec.text;
                              return (
                                <div 
                                  key={`${rec.heading}-${idx}`} 
                                  className="shrink-0"
                                >
                                  <div 
                                    onClick={() => {
                                      setDescription(rec.text);
                                      setTextareaKey(prev => prev + 1);
                                    }}
                                    className={`w-[200px] h-[135px] bg-[#111111] hover:bg-[#151515] rounded-[20px] p-4 flex flex-col justify-between text-left transition-all duration-300 cursor-pointer select-none relative shadow-xl border-2 ${
                                      isSelected ? 'border-[#C6FF00]' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.2)]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xl">
                                        {rec.emoji}
                                      </span>
                                      {isSelected && (
                                        <span className="w-2 h-2 rounded-full bg-[#C6FF00]" />
                                      )}
                                    </div>
                                    <div className="space-y-0.5">
                                      <h4 className="text-[#C6FF00] font-black text-[10px] uppercase tracking-wider leading-snug line-clamp-1">
                                        {rec.heading}
                                      </h4>
                                      <p className="text-white text-[10px] leading-relaxed font-semibold line-clamp-2">
                                        {rec.text}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Elegant ━━━ ━ ━ ━ Line pagination indicators */}
                      <div className="flex justify-center gap-1.5 mt-3 select-none">
                        {(() => {
                          const currentRecs = categoryRecommendations[selectedCategoryTab] || categoryRecommendations.Sneakers;
                          return currentRecs.map((rec, idx) => {
                            const isSelected = description === rec.text;
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setDescription(rec.text);
                                  setTextareaKey(prev => prev + 1);
                                }}
                                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                                  isSelected ? 'w-8 bg-[#C6FF00]' : 'w-2 bg-zinc-800'
                                }`}
                                aria-label={`Select recommendation ${idx + 1}`}
                              />
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setScreen(24)}
                  className="w-full h-14 bg-[#C6FF00] text-black font-bold text-base rounded-[24px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF00]/10 mt-4"
                >
                  <span>Next Step ➔</span>
                </button>
              </div>
            )}

            {/* Screen 24: WhatsApp Number */}
            {screen === 24 && (
              <div className="flex-1 flex flex-col justify-between py-6 text-left">
                <div className="space-y-4 pt-4">
                  <span className="text-[10px] font-black tracking-widest text-[#C6FF00] uppercase block">STEP 4 OF 5</span>
                  <h2 className="text-2.5xl font-bold tracking-tight leading-none text-white mb-2">
                    WhatsApp Number
                  </h2>
                  <p className="text-[#9ca3af] text-xs font-semibold leading-relaxed">Where should buyers send their instant order inquiries?</p>

                  <div className="flex rounded-[24px] overflow-hidden border-2 border-[rgba(255,255,255,0.08)] bg-[#111111] focus-within:border-[#C6FF00] transition-colors">
                    <span className="font-mono text-base font-black px-4 bg-[#0a0a0a] text-[#6b7280] flex items-center border-r border-[rgba(255,255,255,0.08)] select-none text-[15px]">
                      +263
                    </span>
                    <input 
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="776223144"
                      className="flex-1 px-4 py-3.5 bg-transparent border-none text-white text-base font-bold font-mono focus:outline-none"
                    />
                  </div>

                  {whatsapp.length >= 8 && (
                    <div className="bg-[#e8fbf0] border border-[#d1e7dd] text-[#0f5132] p-3 rounded-[24px] flex items-center justify-center gap-2 font-bold text-xs uppercase animate-fade-in shadow-subtle">
                      <WhatsAppIcon size={14} /> 
                      <span>Inquiries directed to: +263 {whatsapp}</span>
                    </div>
                  )}
                </div>

                <button 
                  disabled={whatsapp.length < 8}
                  onClick={() => setScreen(25)}
                  className={`w-full h-14 font-bold text-base rounded-[24px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    whatsapp.length >= 8 ? 'bg-[#C6FF00] text-black shadow-lg shadow-[#C6FF00]/10' : 'bg-[#e5e7eb] text-[#9ca3af] pointer-events-none'
                  }`}
                >
                  <span>Next Step ➔</span>
                </button>
              </div>
            )}

            {/* Screen 25: Upload First Product */}
            {screen === 25 && (
              <div className="flex-1 flex flex-col justify-between py-2 text-left">
                <div className="space-y-3 pt-3 overflow-y-auto no-scrollbar max-h-[460px]">
                  <span className="text-[10px] font-black tracking-widest text-[#C6FF00] uppercase block">STEP 5 OF 5</span>
                  <h2 className="text-2xl font-bold tracking-tight leading-none text-white">
                    Upload First Product
                  </h2>
                  <p className="text-[#9ca3af] text-xs font-semibold leading-none mb-2">Launch your shop with an active item ready to sell.</p>

                  <div className="space-y-2.5 text-xs">
                    {/* Image picker */}
                    <input 
                      type="file"
                      ref={productImgInputRef}
                      onChange={handleProductImgUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => productImgInputRef.current?.click()}
                      className="w-full h-24 bg-[#111111] border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-[24px] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group hover:border-[#C6FF00]/30 shadow-subtle"
                    >
                      {productImagePreview ? (
                        <img src={productImagePreview} alt="Product Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-[#6b7280]/60 group-hover:text-[#C6FF00] transition-colors">
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-[9px] font-black uppercase">Upload Product Photo</span>
                        </div>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Name */}
                      <div>
                        <label className="text-[#9ca3af] text-[9px] font-extrabold uppercase tracking-wider block mb-1">Product Name</label>
                        <input 
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="e.g. Heavyweight Tee"
                          className="w-full bg-[#111111] border-2 border-[rgba(255,255,255,0.08)] rounded-[24px] px-3 py-2.5 text-xs font-semibold focus:border-[#C6FF00] focus:outline-none text-white"
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="text-[#9ca3af] text-[9px] font-extrabold uppercase tracking-wider block mb-1">Price (USD)</label>
                        <input 
                          type="number"
                          value={productPrice}
                          onChange={(e) => setProductPrice(e.target.value)}
                          placeholder="e.g. 15"
                          className="w-full bg-[#111111] border-2 border-[rgba(255,255,255,0.08)] rounded-[24px] px-3 py-2.5 text-xs font-semibold font-mono focus:border-[#C6FF00] focus:outline-none text-white"
                        />
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="text-[#9ca3af] text-[9px] font-extrabold uppercase tracking-wider block mb-1.5">Category</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {displayCategories.map(cat => {
                          const isSelected = productCategory === cat.name;
                          return (
                            <button
                              type="button"
                              key={cat.id || cat.name}
                              onClick={() => setProductCategory(cat.name)}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-center border transition-colors cursor-pointer truncate ${
                                isSelected 
                                  ? 'bg-[#C6FF00]/10 border-[#C6FF00] text-[#C6FF00]' 
                                  : 'bg-[#111111] border-[rgba(255,255,255,0.08)] text-[#9ca3af] hover:bg-[#000000]'
                              }`}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  disabled={!productName.trim() || !productPrice.trim() || !productCategory || !productImagePreview}
                  onClick={() => setScreen(26)}
                  className={`w-full h-14 font-bold text-base rounded-[24px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2 ${
                    productName.trim() && productPrice.trim() && productCategory && productImagePreview
                      ? 'bg-[#C6FF00] text-black shadow-[#C6FF00]/10'
                      : 'bg-[#e5e7eb] text-[#9ca3af] pointer-events-none'
                  }`}
                >
                  <span>Launch Live Store 🚀</span>
                </button>
              </div>
            )}

            {/* Screen 26: Building shop countdown */}
            {screen === 26 && (
              <div className="flex-1 flex flex-col justify-between fixed inset-0 bg-[#000000] z-50 text-center select-none overflow-hidden pb-8 pt-8 px-6 font-sans">
                <div className="flex justify-center pt-8">
                  <span className="text-xl font-extrabold tracking-tight text-white">
                    THREADZW<span className="text-[#C6FF00]">.</span>
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center space-y-12 shrink-0">
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.45, 0.15] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute w-36 h-36 rounded-full bg-[#C6FF00] -left-6 -top-6"
                    />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                      className="absolute w-32 h-32 rounded-full border-2 border-dashed border-[#C6FF00] -left-4 -top-4"
                    />
                    <div className="relative w-24 h-24 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-full flex items-center justify-center text-[#C6FF00] shadow-xl">
                      <Store className="w-11 h-11" />
                    </div>
                  </div>

                  <div className="w-full max-w-[280px] space-y-3.5 text-left pl-3 text-sm">
                    {[
                      "Registering your merchant profile...",
                      "Uploading and preparing your logo...",
                      "Creating first product listing...",
                      "Launching your live storefront URL..."
                    ].map((item, idx) => {
                      const complete = visibleChecks.includes(idx);
                      return (
                        <div key={item} className="h-6">
                          {complete && (
                            <motion.div 
                              initial={{ opacity: 0, x: -8 }} 
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-3"
                            >
                              <span className="text-[#C6FF00] font-black text-base">✓</span>
                              <span className="text-white font-extrabold text-sm">{item}</span>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[#6b7280] text-xs font-semibold leading-none">Assembling your digital boutique...</p>
                </div>

                <div className="w-full h-1 bg-[#e5e7eb] relative mt-auto">
                  <div style={{ width: `${loadProgress}%` }} className="h-full bg-[#C6FF00] transition-all" />
                </div>
              </div>
            )}

            {/* Screen 27: Success live shop! */}
            {screen === 27 && (
              <div className="flex-1 flex flex-col justify-between py-6 text-center">
                <div className="pt-6 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/20 flex items-center justify-center text-[#C6FF00] mx-auto animate-bounce">
                    <CheckCircle2 className="w-12 h-12 stroke-[1.5]" />
                  </div>
                  
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight leading-none text-white">
                      🎉 Your shop is live!
                    </h1>
                    <p className="text-[#6b7280] text-xs font-semibold mt-1.5">You are officially ready for digital business</p>
                  </div>

                  {/* URL display card */}
                  <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[28px] p-4 max-w-sm mx-auto space-y-2 shadow-subtle">
                    <span className="text-[#6b7280] text-[9px] font-black uppercase tracking-wider block">YOUR STORE LINK</span>
                    <div className="flex items-center gap-2 bg-[#C6FF00]/10 rounded-[24px] px-3.5 py-3 border border-[#C6FF00]/10 select-all">
                      <span className="text-[#C6FF00] font-mono text-xs font-bold truncate flex-1 text-left">
                        {finalShopUrl || `https://threadzw.co/shop/${finalShopId}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom button choices */}
                <div className="space-y-3 pt-6 shrink-0">
                  <a 
                    href={`/shop/${finalShopId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-13 bg-[#C6FF00] text-black font-bold text-sm uppercase rounded-[24px] flex items-center justify-center gap-2 cursor-pointer shadow-md hover:opacity-95 transition-all"
                  >
                    <ExternalLink className="w-4.5 h-4.5" />
                    <span>View Shop</span>
                  </a>

                  <button 
                    onClick={() => {
                      const url = finalShopUrl || `https://threadzw.co/shop/${finalShopId}`;
                      if (navigator.share) {
                        navigator.share({
                          title: shopName,
                          text: `Check out our digital storefront collection on ThreadZW!`,
                          url: url
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(url);
                        toast.success('Store link copied to clipboard!');
                      }
                    }}
                    className="w-full h-13 bg-[#111111] border border-[rgba(255,255,255,0.08)] text-white font-bold text-sm uppercase rounded-[24px] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#000000] transition-all"
                  >
                    <Share2 className="w-4.5 h-4.5" />
                    <span>Share Shop</span>
                  </button>

                  <button 
                    onClick={() => {
                      toast.success("Welcome to your Merchant Workspace!");
                      setAppStage('dashboard');
                    }}
                    className="w-full h-13 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] text-[#9ca3af] font-bold text-sm uppercase rounded-[24px] flex items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all"
                  >
                    <PlusCircle className="w-4.5 h-4.5" />
                    <span>Add More Products</span>
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>

    </div>
  );
};
