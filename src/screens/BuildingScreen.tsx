import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface BuildingScreenProps {
  shopData: {
    ownerName: string;
    name: string;
    category: string;
    town: string;
    whatsapp: string;
    description: string;
    instagram: string;
    priceRange: string;
    productEstimate: string;
  };
  logoFile: File | null;
  bannerFile: File | null;
  setMyShop: (shop: any) => void;
  setAppStage: (stage: 'paywall' | 'onboarding' | 'building' | 'reveal' | 'dashboard' | null) => void;
}

const CHECKLIST_ITEMS = [
  "Reserving your shop URL...",
  "Configuring database links...",
  "Creating security access...",
  "Building your custom domain...",
  "Finalizing live setup..."
];

export const BuildingScreen: React.FC<BuildingScreenProps> = ({
  shopData,
  logoFile,
  bannerFile,
  setMyShop,
  setAppStage
}) => {
  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [activeItemProgress, setActiveItemProgress] = useState(0);
  const [isDbFailed, setIsDbFailed] = useState(false);
  const [dbErrorMsg, setDbErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  const savedShopRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 1. Core Supabase Database Upload & Insert Trigger
  useEffect(() => {
    let active = true;

    const handleBuildShop = async () => {
      try {
        console.log('Building shop in database trigger initialized. RetryCount:', retryCount);
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession?.user?.id) {
          throw new Error('User session not recovered. Please sign in.');
        }

        // Upload logo (non-blocking)
        let avatarUrl = null;
        if (logoFile) {
          try {
            const ext = logoFile.name.split('.').pop();
            const path = `${currentSession.user.id}/logo_${Date.now()}.${ext}`;
            
            const { error: logoError } = await supabase.storage
              .from('shop-avatars')
              .upload(path, logoFile, {
                upsert: true,
                contentType: logoFile.type
              });
            
            if (!logoError) {
              const { data: urlData } = supabase.storage
                .from('shop-avatars')
                .getPublicUrl(path);
              avatarUrl = urlData.publicUrl;
              console.log('Logo uploaded to buckets:', avatarUrl);
            } else {
              console.error('Logo upload error:', logoError);
            }
          } catch (err) {
            console.error('Logo upload failed (non-blocking):', err);
          }
        }

        // Upload banner (non-blocking)
        let bannerUrl = null;
        if (bannerFile) {
          try {
            const ext = bannerFile.name.split('.').pop();
            const path = `${currentSession.user.id}/banner_${Date.now()}.${ext}`;
            
            const { error: bannerError } = await supabase.storage
              .from('shop-banners')
              .upload(path, bannerFile, {
                upsert: true,
                contentType: bannerFile.type
              });
            
            if (!bannerError) {
              const { data: urlData } = supabase.storage
                .from('shop-banners')
                .getPublicUrl(path);
              bannerUrl = urlData.publicUrl;
              console.log('Banner uploaded to buckets:', bannerUrl);
            } else {
              console.error('Banner upload error:', bannerError);
            }
          } catch (err) {
            console.error('Banner upload failed (non-blocking):', err);
          }
        }

        // Generate unique handle
        const baseHandle = (shopData.name || 'shop')
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 16);

        const handle = baseHandle + '_' + Date.now().toString(36).slice(-4);

        // Create shop — this CAN throw because without a shop the reveal screen won't work
        console.log('Upserting shops record...');
        const { data: shop, error: shopError } = await supabase
          .from('shops')
          .upsert({
            owner_id: currentSession.user.id,
            name: shopData.name || 'My Shop',
            handle: handle,
            category: shopData.category || null,
            town: shopData.town || null,
            whatsapp: shopData.whatsapp || null,
            instagram: shopData.instagram || null,
            description: shopData.description || null,
            avatar_url: avatarUrl,
            banner_url: bannerUrl,
            plan: 'shop',
            subscription_status: 'trial',
            trial_started_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            is_live: true
          }, { onConflict: 'owner_id' })
          .select()
          .single();

        if (shopError) {
          console.error('Shop creation failed:', shopError);
          throw shopError;
        }

        console.log('New shop generated in Supabase:', shop.id);

        // Update Profiles onboarding status and info — non-blocking
        // If this fails the shop still exists so we continue
        try {
          await supabase
            .from('profiles')
            .update({
              display_name: shopData.ownerName || null,
              town: shopData.town || null,
              whatsapp_number: shopData.whatsapp || null,
              onboarding_complete: true
              // NO updated_at here
            })
            .eq('id', currentSession.user.id);

          console.log('Profile updated ✓');
        } catch (profileErr) {
          console.error('Profile update failed (non-blocking):', profileErr);
        }

        if (active && isMountedRef.current) {
          savedShopRef.current = shop;
        }

      } catch (err: any) {
        console.error('Build shop exception caught:', err?.message || err, err);
        if (active && isMountedRef.current) {
          setIsDbFailed(true);
          // Friendly text on screen:
          setDbErrorMsg(err?.message || 'Database error occurred');
        }
      }
    };

    handleBuildShop();

    return () => {
      active = false;
    };
  }, [shopData, logoFile, bannerFile, retryCount]);

  // 2. Incremental Checklist and Progress animation loop (1.5s per item)
  useEffect(() => {
    let animFrame: number;
    let lastTime = performance.now();
    const duration = 1500; // 1.5 seconds per item

    const tick = (now: number) => {
      if (!isMountedRef.current) return;
      if (isDbFailed) return;

      const elapsed = now - lastTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setActiveItemProgress(progress);

      if (elapsed >= duration) {
        // Complete current item
        setCompletedItems((prev) => [...prev, activeItemIdx]);
        
        if (activeItemIdx < CHECKLIST_ITEMS.length - 1) {
          // Increment item
          setActiveItemIdx((prev) => prev + 1);
          setActiveItemProgress(0);
          lastTime = performance.now();
          animFrame = requestAnimationFrame(tick);
        } else {
          // Last item completed -> verify database save availability
          const checkReady = setInterval(() => {
            if (isDbFailed) {
              clearInterval(checkReady);
              return;
            }
            if (savedShopRef.current) {
              clearInterval(checkReady);
              console.log('Checklist animation and DB write successful! Redirecting to stage 4 reveal...');
              setMyShop(savedShopRef.current);
              setAppStage('reveal');
            }
          }, 300);
        }
      } else {
        animFrame = requestAnimationFrame(tick);
      }
    };

    animFrame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [activeItemIdx, isDbFailed, setMyShop, setAppStage]);

  if (isDbFailed) {
    return (
      <div className="bg-[#0B0B0B] min-h-screen text-white flex flex-col items-center justify-center p-10 px-6 text-center select-none font-sans">
        {/* Red circle 80px centered */}
        <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center mb-6">
          <span className="text-[36px] select-none text-red-500">⚠️</span>
        </div>
        
        {/* "Setup interrupted" heading */}
        <h2 className="text-[#FFFFFF] font-bold text-[28px] text-center mt-6 tracking-tight">
          Setup interrupted
        </h2>
        
        {/* Subtitle / friendly message */}
        <p className="text-[#A1A1AA] text-[15px] text-center mt-3 leading-relaxed max-w-[280px]">
          Something went wrong while building your shop. Your account has been created — tap below to try again.
        </p>

        {/* Technical detail box (development environments of AIS) */}
        {(process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) && dbErrorMsg && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-[10px] p-3 px-3.5 mt-4 max-w-[300px] w-full text-left">
            <span className="text-[#A1A1AA] text-[11px] font-mono break-all leading-relaxed">
              {dbErrorMsg}
            </span>
          </div>
        )}

        {/* "Retry Setup" button */}
        <button
          onClick={() => {
            setDbErrorMsg('');
            setIsDbFailed(false);
            setActiveItemIdx(0);
            setCompletedItems([]);
            setActiveItemProgress(0);
            setRetryCount((prev) => prev + 1);
          }}
          className="mt-7 bg-[#151515] hover:bg-[#1D1D1D] active:scale-[0.98] border border-[#2A2A2A] rounded-full w-full max-w-xs h-[52px] flex items-center justify-center gap-2.5 transition ease-out duration-150 cursor-pointer"
        >
          <span className="text-[#FFFFFF] text-[18px]">↺</span>
          <span className="text-[#FFFFFF] font-bold text-[14px] uppercase tracking-wider">
            RETRY SETUP
          </span>
        </button>

        {/* "Contact Support" button */}
        <button
          onClick={() => {
            window.open(
              'https://wa.me/263776223144' +
              '?text=' +
              encodeURIComponent(
                'Hi ThreadZW, I need help with my shop setup.'
              )
            );
          }}
          className="mt-3 text-[#A1A1AA] text-[13px] underline hover:text-white transition bg-transparent border-0 cursor-pointer"
        >
          Contact Support
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0B0B] min-h-screen text-white flex flex-col justify-center items-center p-6 select-none font-sans">
      <div className="w-full max-w-sm flex flex-col items-start space-y-10">
        
        {/* TOP STATUS LOGO HEADER */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-pulse">⚡</span>
            <h1 className="text-white font-black text-[28px] tracking-tight leading-none">
              Creating your shop...
            </h1>
          </div>
          <p className="text-[#A1A1AA] text-xs">
            Please wait. We are wiring up your real database and saving assets.
          </p>
        </div>

        {/* SEQUENTIAL CHECKLIST GRID */}
        <div className="w-full space-y-6">
          {CHECKLIST_ITEMS.map((item, idx) => {
            const isCompleted = completedItems.includes(idx);
            const isActive = activeItemIdx === idx;
            const isPending = idx > activeItemIdx;

            return (
              <div
                key={idx}
                className="flex items-center gap-4 transition-all duration-300"
                style={{ opacity: isPending ? 0.35 : 1 }}
              >
                {/* SVG CIRCLE LOADER */}
                <div className="relative w-7 h-7 flex-shrink-0 flex items-center justify-center">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-[#C6FF00] flex items-center justify-center text-black shadow-lg shadow-[#C6FF00]/10">
                      <Check className="w-4.5 h-4.5 stroke-[3.5]" />
                    </div>
                  ) : isActive ? (
                    <>
                      <svg className="w-7 h-7 transform -rotate-90">
                        <circle
                          cx="14"
                          cy="14"
                          r="11"
                          fill="none"
                          stroke="#1A1A1A"
                          strokeWidth="2.5"
                        />
                        <motion.circle
                          cx="14"
                          cy="14"
                          r="11"
                          fill="none"
                          stroke="#C6FF00"
                          strokeWidth="2.5"
                          strokeDasharray={2 * Math.PI * 11}
                          strokeDashoffset={2 * Math.PI * 11 - (activeItemProgress / 100) * (2 * Math.PI * 11)}
                        />
                      </svg>
                      {/* Inner dot */}
                      <div className="absolute w-2 h-2 rounded-full bg-[#C6FF00]" />
                    </>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-stone-800" />
                  )}
                </div>

                <span className={`text-[15px] font-medium leading-none ${
                  isCompleted ? 'text-stone-500 line-through' : isActive ? 'text-white font-bold' : 'text-stone-700'
                }`}>
                  {item}
                </span>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
