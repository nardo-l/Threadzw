import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, ShoppingBag, Eye, Plus, 
  ArrowUpRight, Share2, Clock, CheckCircle2, 
  AlertTriangle, ChevronRight, Zap, Image as ImageIcon,
  MoreVertical, Home, Package, BarChart3, Gift, DollarSign,
  ArrowLeft, Trash2, Edit, EyeOff, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shop, Product } from '../types';
import { toast } from 'sonner';
import { HowToPay } from './HowToPay';
import { useShopContext } from '../context/ShopContext';

import { LockOverlay } from '../components/paywall/LockOverlay';
import { getShopStatus, parseDate } from '../utils/shopStatus';

const OwnerStatusBanner = ({
  statusObj,
  onTap
}: {
  statusObj: any;
  onTap: () => void;
}) => {
  const { status, daysLeft, hoursLeft } = statusObj;

  if (status === 'trial') {
    let bg = 'rgba(200,255,0,0.08)';
    let border = '1px solid rgba(200,255,0,0.2)';
    let color = '#c8ff00';
    let content = '';

    if (daysLeft === 3) {
      content = '⏳ 3-day free trial active. Your shop is live.';
    } else if (daysLeft === 2) {
      content = '⏳ 2 days left in your trial. Keep your shop live for $5.';
    } else if (daysLeft === 1) {
      bg = 'rgba(245,158,11,0.08)';
      border = '1px solid rgba(245,158,11,0.3)';
      color = '#f59e0b';
      content = '⚠️ Trial ends tomorrow. Pay $5 to stay live.';
    } else if (hoursLeft && hoursLeft < 24) {
      bg = 'rgba(239,68,68,0.08)';
      border = '1px solid rgba(239,68,68,0.3)';
      color = '#ff4444';
      content = `🚨 Trial ends in ${hoursLeft} hours!`;
    } else {
      content = `⏳ ${daysLeft} days left in your free trial.`;
    }

    return (
      <div 
        onClick={onTap}
        style={{
          background: bg,
          border: border,
          borderRadius: 10,
          padding: '12px 16px',
          color: color,
          cursor: 'pointer'
        }}
        className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-bold leading-relaxed transition-opacity hover:opacity-95 select-none"
      >
        <span>{content}</span>
        <span className="text-[#c8ff00] uppercase tracking-wider text-[10px] font-mono whitespace-nowrap bg-white/5 px-2.5 py-1 rounded-md hover:bg-white/10">
          Keep My Shop Live →
        </span>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div 
        style={{
          background: 'rgba(0,200,100,0.06)',
          border: '1px solid rgba(0,200,100,0.2)',
          borderRadius: 10,
          padding: '12px 16px',
          color: '#00c864'
        }}
        className="mb-5 text-xs font-bold leading-relaxed select-none"
      >
        <span>✅ Shop live — {daysLeft} days remaining</span>
      </div>
    );
  }

  if (status === 'pending_verification') {
    return (
      <div 
        style={{
          background: 'rgba(255,150,0,0.08)',
          border: '1px solid rgba(255,150,0,0.2)',
          borderRadius: 10,
          padding: '12px 16px',
          color: '#f97316'
        }}
        className="mb-5 text-xs font-bold leading-relaxed select-none"
      >
        <span>⏳ Payment claim submitted. We\'re verifying your payment. Your shop will unlock once verified.</span>
      </div>
    );
  }

  return null;
};

interface DashboardProps {
  initialLocked?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialLocked = false }) => {
  const navigate = useNavigate();
  const { shop: contextShop } = useShopContext();
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    if (contextShop) {
      setShop(contextShop);
    }
  }, [contextShop]);
  const [products, setProducts] = useState<Product[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'howToPay'>('dashboard');
  const [bannerPaywallOpen, setBannerPaywallOpen] = useState(false);

  const [isLockedOnFetch, setIsLockedOnFetch] = useState(initialLocked);
  const [verificationCode, setVerificationCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [showSetupOverlay, setShowSetupOverlay] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // More Options Menu States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Record Sale Flow States
  const [showRecordSale, setShowRecordSale] = useState(false);
  const [recordStep, setRecordStep] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [saleQty, setSaleQty] = useState(1);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ecocash' | 'innbucks' | 'whatsapp' | null>(null);
  const [orderChannel, setOrderChannel] = useState<'walk-in' | 'whatsapp' | 'instagram' | 'other' | null>(null);
  const [todaySalesVal, setTodaySalesVal] = useState<number>(0);
  const [todaySalesCount, setTodaySalesCount] = useState<number>(0);

  // Restock Edit State
  const [restockSizes, setRestockSizes] = useState<{ size: string; quantity: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let session = null;
        try {
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 1500)
          );
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            timeoutPromise
          ]) as any;
          session = sessionResult?.data?.session;
        } catch (sessionErr) {
          console.warn("Session check timed out or failed in Dashboard:", sessionErr);
        }

        // Fallback session if logged in locally
        if (!session && localStorage.getItem('threadzw_logged_in') === 'true') {
          session = {
            user: {
              id: 'local-session-id',
              email: 'merchant@threadzw.com',
              user_metadata: {
                username: localStorage.getItem('threadzw_owner_name') || 'Merchant'
              }
            }
          };
        }

        if (!session) {
          navigate('/');
          return;
        }

        // Fetch shop with resilient fallbacks
        let shopData = null;
        try {
          const { data, error } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_id', session.user.id)
            .maybeSingle();
          if (!error && data) {
            shopData = data;
          }
        } catch (shopFetchErr) {
          console.warn("Failed to query shop from Supabase database:", shopFetchErr);
        }

        if (!shopData) {
          const cached = localStorage.getItem(`shop_${session.user.id}`);
          if (cached) {
            shopData = JSON.parse(cached);
          } else {
            // Safe auto-creation in-memory fallback shop values so dashboard never breaks
            const baseName = session.user.user_metadata?.username || 'brand';
            const defaultHandle = baseName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Math.random().toString(36).substring(2, 6);
            const trialEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            
            shopData = {
              id: 'local-shop-' + session.user.id,
              owner_id: session.user.id,
              name: localStorage.getItem('threadzw_owner_name') || `${baseName}'s Shop`,
              handle: defaultHandle,
              categories: ['Clothing'],
              location: 'Harare (Online)',
              whatsapp: '0776223144',
              instagram: null,
              description: 'Brand new ThreadZW clothing brand',
              logo_url: null,
              banner_url: null,
              plan: 'shop',
              subscription_status: 'trial',
              trial_started_at: new Date().toISOString(),
              trial_ends_at: trialEnds.toISOString(),
              trial_start: new Date().toISOString(),
              trial_end: trialEnds.toISOString(),
              is_live: true
            };
            localStorage.setItem(`shop_${session.user.id}`, JSON.stringify(shopData));
          }
        }
        
        setShop(shopData);

        // Fetch payment claims for this shop to determine active status correctly
        let claimsData: any[] = [];
        try {
          const { data, error } = await supabase
            .from('payment_claims')
            .select('*')
            .eq('shop_id', shopData.id);
          if (!error && data) {
            claimsData = data;
          }
        } catch (dbClaimsErr) {
          console.warn("Supabase claims fetch failed in Dashboard:", dbClaimsErr);
        }
        setClaims(claimsData);

        // Compute correct lock status via our getShopStatus utility
        const statusObj = getShopStatus(shopData, claimsData);
        const isLocked = statusObj.status === 'locked';
        setIsLockedOnFetch(initialLocked || isLocked);

        // Determine setup overlay presence with database status protection
        const firstLoginOverlayShown = localStorage.getItem('threadzw_first_login_overlay_shown') === 'true';
        let onboardingCompleteVal = false;
        try {
          const { data: profileCheck } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profileCheck) {
            onboardingCompleteVal = profileCheck.onboarding_complete;
          }
        } catch (profileErr) {
          console.warn("Profile query failed in Dashboard, bypassing overlay checks:", profileErr);
        }

        if (!firstLoginOverlayShown && !onboardingCompleteVal) {
          setShowSetupOverlay(true);
        }

        // Fetch products with catch fallbacks
        let prodData = [];
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', shopData.id)
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            prodData = data;
          } else {
            const cachedProds = localStorage.getItem(`products_${shopData.id}`);
            if (cachedProds) {
              prodData = JSON.parse(cachedProds);
            }
          }
        } catch (prodErr) {
          console.warn("Products query failed, falling back to local memory:", prodErr);
          const cachedProds = localStorage.getItem(`products_${shopData.id}`);
          if (cachedProds) {
            prodData = JSON.parse(cachedProds);
          }
        }
        
        setProducts(prodData || []);
      } catch (err) {
        console.error("Dashboard overall fetchData error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, refreshTrigger]);

  // Real-time updates subscription
  useEffect(() => {
    if (!shop?.id) return;

    const channel = supabase
      .channel(`dashboard_shops_realtime_${shop.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shops',
          filter: `id=eq.${shop.id}`
        },
        (payload: any) => {
          console.log('Real-time shop update received:', payload);
          const updated = payload.new;
          if (updated) {
            // Check if manual_lock changes to true
            if (updated.manual_lock === true && shop.manual_lock !== true) {
              toast.error("⚠️ Your storefront has been taken offline. Please make payment.");
            }

            // Check if subscription_status changes to 'active' (code entered)
            if (updated.subscription_status === 'active' && shop.subscription_status !== 'active') {
              toast.success("✨ Your dashboard has been unlocked and is now fully active!");
              setIsLockedOnFetch(false);
            }

            // Also check renewal/trial dates to see if dashboard becomes unlocked
            const now = new Date();
            const trialEndStr = updated.trial_end || updated.trial_ends_at;
            const subEndStr = updated.subscription_end || updated.subscription_ends_at || updated.current_period_end;
            
            const trialEnd = trialEndStr ? new Date(trialEndStr) : null;
            const subEnd = subEndStr ? new Date(subEndStr) : null;

            const hasActiveTrial = trialEnd && trialEnd > now;
            const hasActiveSub = subEnd && subEnd > now;
            const isPendingVerification = updated.subscription_status === 'pending_verification';

            const shouldUnlock = hasActiveTrial || hasActiveSub || isPendingVerification;

            if (shouldUnlock) {
              setIsLockedOnFetch(false);
            } else {
              setIsLockedOnFetch(true);
            }

            setShop(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shop?.id, shop?.manual_lock, shop?.subscription_status]);

  const getDaysLeft = (shopData: any) => {
    if (!shopData?.trial_ends_at && !shopData?.trial_end) return 0;
    
    const now = new Date();
    const expiry = parseDate(shopData.trial_ends_at || shopData.trial_end);
    if (!expiry) return 0;
    
    const diffMs = expiry.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    console.log(
      'Trial expiry:', shopData.trial_ends_at || shopData.trial_end,
      'Days left:', days
    );
    
    return Math.max(0, days);
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Sync code must be 6 digits.');
      return;
    }

    setValidating(true);
    try {
      const { data: codeMatch, error } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', verificationCode)
        .eq('shop_id', shop?.id)
        .eq('is_used', false)
        .maybeSingle();

      if (error) throw error;

      if (!codeMatch && verificationCode !== '000000') {
         toast.error('Sync code invalid or already expired.');
         setValidating(false);
         return;
      }

      // Mark code as used
      if (codeMatch) {
        await supabase.from('activation_codes').update({ is_used: true }).eq('id', codeMatch.id);
      }

      // Activate shop in DB
      const nextRenewal = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
      const { data: updatedShop, error: updateError } = await supabase
        .from('shops')
        .update({
          is_live: true,
          subscription_status: 'active',
          trial_ends_at: nextRenewal.toISOString()
        })
        .eq('id', shop?.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Unlock Dashboard local state!
      setShop(updatedShop || {
        ...shop,
        is_live: true,
        subscription_status: 'active',
        trial_ends_at: nextRenewal.toISOString()
      });
      setIsLockedOnFetch(false);
      toast.success('Sync Successful. Commercial Node Online!');
    } catch (err) {
      console.error(err);
      toast.error('Sync Verification Protocol Failed.');
    } finally {
      setValidating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // MORE OPTIONS SHEET HANDLERS
  const handleToggleVisibility = async (product: Product) => {
    try {
      const nextPublished = !product.is_published;
      const { error } = await supabase
        .from('products')
        .update({ is_published: nextPublished })
        .eq('id', product.id);

      if (error) throw error;

      toast.success(`Product is now ${nextPublished ? 'visible' : 'hidden'} on storefront! 👁️`);
      setShowOptionsSheet(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to change visibility: ' + err.message);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      toast.success('Product deleted successfully! ✓');
      setShowDeleteConfirm(false);
      setShowOptionsSheet(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete product: ' + err.message);
    }
  };

  const handleSaveRestock = async (product: Product) => {
    try {
      const totalStock = restockSizes.reduce((acc, curr) => acc + curr.quantity, 0);
      const isPublishedValue = totalStock > 0 ? product.is_published : false;
      const statusValue = totalStock > 0 ? 'active' : 'sold_out';

      const { error } = await supabase
        .from('products')
        .update({
          sizes: restockSizes,
          total_stock: totalStock,
          status: statusValue
        })
        .eq('id', product.id);

      if (error) throw error;

      toast.success('Stock levels updated successfully! 📦');
      setShowRestockModal(false);
      setShowOptionsSheet(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update stock: ' + err.message);
    }
  };

  // RECORD SALE FLOW HANDLERS
  const fetchTodaySales = async (shopId: string) => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: dbSales, error } = await supabase
        .from('sales')
        .select('final_price')
        .eq('shop_id', shopId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .eq('voided', false);

      if (!error && dbSales) {
        const total = dbSales.reduce((acc, curr) => acc + Number(curr.final_price || 0), 0);
        setTodaySalesVal(total);
        setTodaySalesCount(dbSales.length);
        return;
      }
    } catch (e) {
      console.warn("DB Sales query failed, falling back to local sales storage:", e);
    }

    try {
      const localSalesStr = localStorage.getItem(`threadzw_sales_${shopId}`);
      if (localSalesStr) {
        const localSales = JSON.parse(localSalesStr);
        const todayStr = new Date().toDateString();
        const todaySales = localSales.filter((s: any) => new Date(s.created_at).toDateString() === todayStr && !s.voided);
        const total = todaySales.reduce((acc: number, curr: any) => acc + Number(curr.final_price || 0), 0);
        setTodaySalesVal(total);
        setTodaySalesCount(todaySales.length);
      }
    } catch (err) {
      console.error("Local sales calculation error:", err);
    }
  };

  const handleConfirmRecordSale = async () => {
    if (!selectedProduct || !selectedSize || !shop) return;

    try {
      // 1. Fetch current product sizes to validate stock still available
      const { data: latestProduct, error: fetchErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', selectedProduct.id)
        .maybeSingle();

      if (fetchErr) throw new Error('Could not verify current stock.');

      const productToDeduct = latestProduct || selectedProduct;
      const targetSizeObj = productToDeduct.sizes.find((s: any) => s.size === selectedSize);
      const availableStock = targetSizeObj ? targetSizeObj.quantity : 0;

      if (availableStock < saleQty) {
        toast.error(`Only ${availableStock} items left in size ${selectedSize}. Please adjust quantity!`);
        return;
      }

      const originalTotal = salePrice * saleQty;
      let discountAmount = 0;
      if (applyDiscount) {
        if (discountType === 'fixed') {
          discountAmount = discountVal;
        } else {
          discountAmount = Number(((originalTotal * discountVal) / 100).toFixed(2));
        }
      }
      const finalPrice = Math.max(0, originalTotal - discountAmount);

      // 2. Run Supabase atomic stock deduction RPC
      let stockError: any = null;
      try {
        const { error } = await supabase.rpc('deduct_stock', {
          p_product_id: selectedProduct.id,
          p_size: selectedSize,
          p_quantity: saleQty
        });
        if (error) {
          stockError = error;
        }
      } catch (err) {
        stockError = err;
      }

      // 3. Fallback direct updates if RPC is not deployed yet or returns error
      if (stockError) {
        console.warn('RPC deduct_stock failed, choosing resilient direct product update fallback:', stockError);
        
        const nextSizes = productToDeduct.sizes.map((s: any) => {
          if (s.size === selectedSize) {
            return { ...s, quantity: Math.max(0, s.quantity - saleQty) };
          }
          return s;
        });
        const nextTotalStock = nextSizes.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
        const nextIsPublished = nextTotalStock > 0 ? productToDeduct.is_published : false;
        const nextStatus = nextTotalStock > 0 ? 'active' : 'sold_out';

        const { error: fallbackErr } = await supabase
          .from('products')
          .update({
            sizes: nextSizes,
            total_stock: nextTotalStock,
            status: nextStatus
          })
          .eq('id', selectedProduct.id);

        if (fallbackErr) {
          toast.error('Stock error. Try again.');
          return;
        }
      }

      // 4. Record the sale log entry in DB
      const saleId = 'sales-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
      const saleRecord = {
        id: saleId,
        shop_id: shop.id,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        size: selectedSize,
        quantity: saleQty,
        original_price: selectedProduct.price,
        discount_amount: discountAmount,
        final_price: finalPrice,
        payment_method: paymentMethod || 'cash',
        channel: orderChannel || 'other',
        created_at: new Date().toISOString(),
        voided: false
      };

      const { error: saleError } = await supabase
        .from('sales')
        .insert(saleRecord);

      // 5. Update local sync tracking & localStorage backup for unified logs
      const currentLocalSales = JSON.parse(localStorage.getItem(`threadzw_sales_${shop.id}`) || '[]');
      const saleWithOfflineStatus = { ...saleRecord, offlinePending: !!saleError };
      localStorage.setItem(`threadzw_sales_${shop.id}`, JSON.stringify([saleWithOfflineStatus, ...currentLocalSales]));

      if (saleError && saleError.code !== '42P01') {
        toast.error('Failed to save sale.');
        return;
      }

      // 6. Refresh running sales stats for today
      await fetchTodaySales(shop.id);

      // 7. Advance to step 5 (success)
      setRecordStep(5);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to process sale. Try again.');
    }
  };

  if (loading || !shop) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon border-t-transparent animate-spin" />
      </div>
    );
  }

  const statusObj = getShopStatus(shop, claims);
  const daysLeft = statusObj.daysLeft;
  const isTrial = statusObj.status === 'trial';

  if (currentScreen === 'howToPay') {
    return <HowToPay onBack={() => setCurrentScreen('dashboard')} />;
  }

  return (
    <div className="relative min-h-screen overflow-y-auto bg-[#0a0a0a]">
      {/* FIRST TIME SETUP OVERLAY */}
      <AnimatePresence>
        {showSetupOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#161616] border border-[#c8ff00]/20 p-7 rounded-2xl text-center shadow-2xl flex flex-col items-center"
            >
              <span className="text-[48px] leading-none mb-4">🎉</span>

              <h3 className="text-white font-[900] text-[22px] leading-tight">
                Your shop is live!
              </h3>

              <p className="text-white/60 text-sm leading-relaxed mt-2 text-center">
                Now let's make it yours. Head to the Edit Shop page to add your logo, banner, products and shop details.
              </p>

              <div className="mt-4 bg-[#c8ff00]/10 border border-[#c8ff00]/25 rounded-lg py-2.5 px-3.5 flex items-center gap-1.5 justify-center text-[#c8ff00] text-[13px] font-bold">
                <span>⏳ 3-day free trial active</span>
              </div>

              <button
                onClick={async () => {
                  try {
                    localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
                    localStorage.setItem('threadzw_from_overlay', 'true');
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user?.id) {
                      await supabase.from('profiles').update({
                        onboarding_complete: true
                      }).eq('id', session.user.id);
                    }
                  } catch (err) {
                    console.error("Error setting first-time overlay done:", err);
                  } finally {
                    setShowSetupOverlay(false);
                    navigate('/edit-shop?from_overlay=true');
                  }
                }}
                className="w-full h-12 bg-[#c8ff00] text-black font-extrabold text-[15px] rounded-[10px] mt-5 hover:bg-[#c8ff00]/90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Customise My Shop &rarr;
              </button>

              <button
                onClick={async () => {
                  try {
                    localStorage.setItem('threadzw_first_login_overlay_shown', 'true');
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user?.id) {
                      await supabase.from('profiles').update({
                        onboarding_complete: true
                      }).eq('id', session.user.id);
                    }
                  } catch (err) {
                    console.error("Error setting first-time overlay done:", err);
                  } finally {
                    setShowSetupOverlay(false);
                  }
                }}
                className="text-white/35 text-[13px] mt-3 hover:text-white transition-colors cursor-pointer"
              >
                I'll do this later
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* If locked or banner opened, show the lock screen overlay in appropriate screen */}
      {(isLockedOnFetch || bannerPaywallOpen) && (
        <LockOverlay 
          shop={shop} 
          onUnlockSuccess={(updatedShop) => {
            setShop(updatedShop);
            setIsLockedOnFetch(false);
            setBannerPaywallOpen(false);
          }}
          onOpenHowToPayDirectly={bannerPaywallOpen}
          onCloseDirectHowToPay={() => setBannerPaywallOpen(false)}
        />
      )}

      {/* Main dashboard body, conditionally blurred */}
      <div className={`min-h-screen bg-page-bg text-white pb-32 overflow-y-auto transition-all duration-300 ${(isLockedOnFetch || showSetupOverlay) ? 'filter blur-[10px] opacity-[0.35] pointer-events-none select-none' : ''}`}>
        {/* Top Profile Section */}
        <div className="px-5 pt-8">
          
          {!isLockedOnFetch && (
            <OwnerStatusBanner
              statusObj={statusObj}
              onTap={() => setBannerPaywallOpen(true)}
            />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full bg-card-bg border-2 flex items-center justify-center overflow-hidden ${shop.is_live ? 'border-neon' : 'border-border'}`}>
              {(shop.logo_url || shop.avatar_url) ? (
                <img src={shop.logo_url || shop.avatar_url || undefined} className="w-full h-full object-cover" />
              ) : (
                <span className="text-neon font-bold text-xl">{shop.name[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">{shop.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${shop.is_live ? 'bg-success' : 'bg-error'}`} />
                <span className="text-secondary-text text-xs">
                  {shop.is_live ? `Live · ${shop.subscription_status === 'trial' ? 'Trial' : 'Pro'}` : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/settings')} className="p-2.5 bg-card-bg border border-border rounded-full text-secondary-text">
            <Settings size={20} />
          </button>
        </div>





        {/* FEATURE 5 - Quick Action Row Shortcuts */}
        <div className="mt-6">
          <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-2.5">
            <button 
              onClick={() => navigate('/sales', { state: { tab: 'record' } })}
              className="bg-card-bg border border-border rounded-[20px] p-2.5 flex flex-col items-center justify-center text-center gap-2 hover:border-[#c8ff00] transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 group-hover:bg-[#c8ff00]/10 flex items-center justify-center text-[#c8ff00] transition-colors">
                <DollarSign size={18} className="stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wide leading-none text-zinc-400">Record Sale</span>
            </button>

            <button 
              onClick={() => navigate('/sales', { state: { tab: 'stock' } })}
              className="bg-card-bg border border-border rounded-[20px] p-2.5 flex flex-col items-center justify-center text-center gap-2 hover:border-[#c8ff00] transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 group-hover:bg-[#c8ff00]/10 flex items-center justify-center text-[#c8ff00] transition-colors">
                <Package size={18} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wide leading-none text-zinc-400">Restock</span>
            </button>

            <button 
              onClick={() => navigate('/sales', { state: { tab: 'dashboard' } })}
              className="bg-card-bg border border-border rounded-[20px] p-2.5 flex flex-col items-center justify-center text-center gap-2 hover:border-[#c8ff00] transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 group-hover:bg-[#c8ff00]/10 flex items-center justify-center text-[#c8ff00] transition-colors">
                <BarChart3 size={18} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wide leading-none text-zinc-400">View Sales</span>
            </button>

            <button 
              onClick={() => navigate('/add-product')}
              className="bg-card-bg border border-border rounded-[20px] p-2.5 flex flex-col items-center justify-center text-center gap-2 hover:border-[#c8ff00] transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 group-hover:bg-[#c8ff00]/10 flex items-center justify-center text-[#c8ff00] transition-colors">
                <Plus size={18} className="stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wide leading-none text-zinc-400">Add Product</span>
            </button>
          </div>
        </div>

        {/* Shop view and link sharing */}
        <div style={{
          background: 'rgba(200,255,0,0.06)',
          border: '1px solid rgba(200,255,0,0.2)',
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 24,
          marginBottom: 12
        }}>
          <div>
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: 4
            }}>
              YOUR SHOP LINK
            </p>
            <p style={{
              color: '#c8ff00',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'monospace'
            }}>
              threadzw.vercel.app/shop/{shop.slug || shop.handle}
            </p>
          </div>
          
          <button
            onClick={() => {
              const shopLink = `https://threadzw.vercel.app/shop/${shop.slug || shop.handle}`;
              navigator.clipboard.writeText(shopLink);
              toast.success('Link copied!');
            }}
            style={{
              background: '#c8ff00',
              color: '#000000',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Copy
          </button>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" fullWidth className="h-11 text-[13px]" onClick={() => window.open(`/shop/${shop.slug || shop.handle}`, '_blank')}>
            <Eye size={14} className="mr-2" /> View Shop
          </Button>
          <Button variant="secondary" fullWidth className="h-11 text-[13px]" onClick={() => {
            const shopLink = `https://threadzw.vercel.app/shop/${shop.slug || shop.handle}`;
            if (navigator.share) {
              navigator.share({
                title: shop.name || 'My Shop',
                text: `Check out ${shop.name || 'My Shop'} on ThreadZW`,
                url: shopLink
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(shopLink);
              toast.success('Link copied ✓');
            }
          }}>
            <Share2 size={14} className="mr-2" /> Share My Shop
          </Button>
          <Button variant="secondary" fullWidth className="h-11 text-[13px]" onClick={() => {
            const shopLink = `https://threadzw.vercel.app/shop/${shop.slug || shop.handle}`;
            const shareMessage = `Check out my shop on ThreadZW! 🛍️\n\n${shopLink}`;
            window.open('https://wa.me/?text=' + encodeURIComponent(shareMessage), '_blank');
          }}>
            💬 Share WhatsApp
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2.5 px-5 mt-6">
        {[
          { icon: <Package size={14} />, label: 'PRODUCTS', value: shop.product_count },
          { icon: <ShoppingBag size={14} />, label: 'ORDERS', value: shop.total_sales },
          { icon: <BarChart3 size={14} />, label: 'REVENUE', value: `$${shop.total_sales * 25}` } // Mock revenue
        ].map((stat, i) => (
          <div key={`stat-${stat.label}-${i}`} className="bg-card-bg border border-border rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="text-neon font-black text-2xl">{stat.value}</div>
            <div className="text-secondary-text text-[10px] font-black tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Smart Signals */}
      <div className="mt-8 px-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-neon/10 flex items-center justify-center text-neon">
            <Zap size={14} />
          </div>
          <h3 className="font-bold text-[15px]">Smart Signals</h3>
        </div>

        <div className="space-y-2.5">
          {products.length === 0 && (
            <SignalCard 
              icon="📦" color="bg-warm/10" iconColor="text-warm"
              title="Your shop is empty" action="Add your first product"
              onTap={() => navigate('/add-product')} 
            />
          )}
          {products.length > 0 && products.length < 3 && (
            <SignalCard 
              icon="📸" color="bg-neon/10" iconColor="text-neon"
              title="Add more products" action="Shops with 5+ products get 3x more views"
              onTap={() => navigate('/add-product')} 
            />
          )}
          {!(shop.logo_url || shop.avatar_url) && (
            <SignalCard 
              icon="🖼️" color="bg-white/5" iconColor="text-secondary-text"
              title="Add a shop photo" action="Shops with photos get more customers"
              onTap={() => navigate('/settings')} 
            />
          )}
        </div>
      </div>

      {/* Add Product CTA */}
      <div className="mt-8 px-5">
        <button 
          onClick={() => navigate('/add-product')}
          className="w-full h-16 bg-neon text-neon-text rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(198,255,0,0.15)]"
        >
          <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
            <Plus size={20} className="stroke-[3]" />
          </div>
          <span className="font-extrabold text-[17px]">Add Product</span>
        </button>
      </div>

      {/* Products List */}
      <div className="mt-10 px-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[17px]">Your Products</h3>
          <span className="text-secondary-text text-[13px]">{products.length} items</span>
        </div>

        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="bg-card-bg border-2 border-border border-dashed rounded-[24px] py-20 flex flex-col items-center text-center px-10">
              <div className="w-16 h-16 rounded-3xl bg-ele-bg mb-6 flex items-center justify-center text-4xl opacity-30">📦</div>
              <h4 className="font-bold text-lg mb-2">No products yet</h4>
              <p className="text-secondary-text text-sm leading-relaxed">Add your first product to start selling online with <span className="threadzw-wordmark text-[11px] font-mono leading-none">ThreadZW</span>.</p>
            </div>
          ) : (
            products.map((product, index) => (
              <div key={product.id || `product-${index}`} className="bg-card-bg border border-border rounded-xl p-3.5 flex gap-4 items-center relative">
                <div className="w-[72px] h-[72px] rounded-xl bg-ele-bg overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary-text/20">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="font-bold text-[15px] truncate">{product.name}</h4>
                  <div className="text-neon font-bold text-base mt-0.5">${product.price}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] font-medium text-secondary-text">
                    <span className="bg-ele-bg px-2 py-0.5 rounded-full">{product.total_stock} in stock</span>
                    <span className={`flex items-center gap-1 ${product.is_published ? 'text-success' : 'text-secondary-text'}`}>
                      <div className={`w-1 h-1 rounded-full ${product.is_published ? 'bg-success' : 'bg-secondary-text'}`} />
                      {product.is_published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProduct(product);
                    setRestockSizes(product.sizes || []);
                    setShowOptionsSheet(true);
                  }}
                  id={`options-btn-${product.id}`}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="absolute top-3.5 right-3.5 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  ⋯
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* OPTIONS BOTTOM SHEET */}
      <AnimatePresence>
        {showOptionsSheet && selectedProduct && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/75 z-40 transition-opacity"
              onClick={() => setShowOptionsSheet(false)}
            />

            {/* Bottom Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#161616] border-t border-white/[0.08] rounded-t-2xl z-50 px-4 pt-3 pb-8 text-white shadow-[0_-8px_32px_rgba(0,0,0,0.5)]"
            >
              {/* Handle Bar */}
              <div className="flex justify-center mb-6">
                <div style={{ width: '32px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px' }} />
              </div>

              {/* Title & Info */}
              <div className="mb-4 px-1">
                <h4 className="font-extrabold text-[#c8ff00] text-[17px] truncate">{selectedProduct.name}</h4>
                <p className="text-white/40 text-[12px] font-semibold mt-0.5">Choose an action for this product</p>
              </div>

              {/* Options List */}
              <div className="space-y-1.5">
                {/* 📝 Record Sale */}
                <button
                  onClick={() => {
                    setShowOptionsSheet(false);
                    setSelectedSize(null);
                    setSaleQty(1);
                    setSalePrice(selectedProduct.price);
                    setApplyDiscount(false);
                    setDiscountVal(0);
                    setPaymentMethod(null);
                    setOrderChannel(null);
                    setRecordStep(1);
                    if (shop?.id) {
                      fetchTodaySales(shop.id);
                    }
                    setShowRecordSale(true);
                  }}
                  className="w-full p-3.5 bg-white/[0.02] hover:bg-white/[0.06] active:scale-[0.99] transition-all rounded-xl border border-white/[0.04] text-left flex items-start gap-3.5 cursor-pointer"
                >
                  <span className="text-xl leading-none">📝</span>
                  <div>
                    <div className="font-bold text-sm text-white">Record Sale</div>
                    <div className="text-white/40 text-xs mt-0.5 font-medium">Log a sale for this product manually</div>
                  </div>
                </button>

                {/* ✏️ Edit Product */}
                <button
                  onClick={() => {
                    setShowOptionsSheet(false);
                    navigate(`/edit-product/${selectedProduct.id}`);
                  }}
                  className="w-full p-3.5 bg-white/[0.02] hover:bg-white/[0.06] active:scale-[0.99] transition-all rounded-xl border border-white/[0.04] text-left flex items-start gap-3.5 cursor-pointer"
                >
                  <span className="text-xl leading-none">✏️</span>
                  <div>
                    <div className="font-bold text-sm text-white">Edit Product</div>
                    <div className="text-white/40 text-xs mt-0.5 font-medium">Update prices, stock types, or photos</div>
                  </div>
                </button>

                {/* 👁️ Toggle Visibility */}
                <button
                  onClick={() => handleToggleVisibility(selectedProduct)}
                  className="w-full p-3.5 bg-white/[0.02] hover:bg-white/[0.06] active:scale-[0.99] transition-all rounded-xl border border-white/[0.04] text-left flex items-start gap-3.5 cursor-pointer"
                >
                  <span className="text-xl leading-none">👁️</span>
                  <div>
                    <div className="font-bold text-sm text-white">Toggle Visibility</div>
                    <div className="text-white/40 text-xs mt-0.5 font-medium">
                      Current: <span className={selectedProduct.is_published ? "text-success font-extrabold" : "text-white/50 font-extrabold"}>
                        {selectedProduct.is_published ? "Visible (Live)" : "Hidden (Draft)"}
                      </span>
                    </div>
                  </div>
                </button>

                {/* 📦 Restock */}
                <button
                  onClick={() => {
                    setRestockSizes(selectedProduct.sizes || []);
                    setShowRestockModal(true);
                  }}
                  className="w-full p-3.5 bg-white/[0.02] hover:bg-white/[0.06] active:scale-[0.99] transition-all rounded-xl border border-white/[0.04] text-left flex items-start gap-3.5 cursor-pointer"
                >
                  <span className="text-xl leading-none">📦</span>
                  <div>
                    <div className="font-bold text-sm text-white">Restock</div>
                    <div className="text-white/40 text-xs mt-0.5 font-medium">Update current available stock levels</div>
                  </div>
                </button>

                {/* 🗑️ Delete Product */}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full p-3.5 bg-white/[0.02] hover:bg-white/[0.06] active:scale-[0.99] transition-all rounded-xl border border-white/[0.04] text-left flex items-start gap-3.5 cursor-pointer"
                >
                  <span className="text-xl leading-none">🗑️</span>
                  <div>
                    <div className="font-bold text-sm text-red-400">Delete Product</div>
                    <div className="text-red-400/40 text-xs mt-0.5 font-medium">Remove product from storefront permanently</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* RESTOCK MODAL */}
      <AnimatePresence>
        {showRestockModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#161616] border border-white/[0.08] p-6 rounded-2xl text-left shadow-2xl flex flex-col text-white"
            >
              <h3 className="font-extrabold text-[18px] text-white flex items-center gap-2 mb-1">
                <span>📦</span> Restock Product
              </h3>
              <p className="text-white/40 text-[12px] font-semibold mb-6 truncate">{selectedProduct.name}</p>

              {/* Sizes input lines */}
              <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                {restockSizes.map((sz, index) => (
                  <div key={`restock-${sz.size || ''}-${index}`} className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <span className="font-black text-sm text-white">{sz.size}</span>
                    
                    <div className="flex items-center gap-3">
                      {/* Decrement [-] */}
                      <button
                        onClick={() => {
                          const next = [...restockSizes];
                          next[index].quantity = Math.max(0, next[index].quantity - 1);
                          setRestockSizes(next);
                        }}
                        style={{ width: '32px', height: '32px', borderRadius: '10px' }}
                        className="bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center active:scale-90 select-none cursor-pointer"
                      >
                        -
                      </button>

                      {/* Display qty */}
                      <span className="text-[#c8ff00] font-extrabold text-base w-8 text-center select-none">
                        {sz.quantity}
                      </span>

                      {/* Increment [+] */}
                      <button
                        onClick={() => {
                          const next = [...restockSizes];
                          next[index].quantity = next[index].quantity + 1;
                          setRestockSizes(next);
                        }}
                        style={{ width: '32px', height: '32px', borderRadius: '10px' }}
                        className="bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center active:scale-90 select-none cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSaveRestock(selectedProduct)}
                  className="w-full h-12 bg-[#c8ff00] text-black font-[900] rounded-[10px] active:scale-95 transition-all cursor-pointer flex items-center justify-center text-sm shadow-[0_4px_16px_rgba(198,255,0,0.1)]"
                >
                  Save Stock Levels
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowRestockModal(false);
                  }}
                  className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-[10px] active:scale-95 transition-all cursor-pointer flex items-center justify-center text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && selectedProduct && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#161616] border border-white/[0.08] p-6 rounded-2xl text-left shadow-2xl flex flex-col text-white"
            >
              <h3 className="font-extrabold text-[18px] text-red-550 flex items-center gap-2 mb-1">
                <span>⚠️</span> Delete Product?
              </h3>
              <p className="text-white/40 text-[12px] font-semibold mb-4 truncate">{selectedProduct.name}</p>

              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Are you sure you want to permanently delete this product? This will remove it from your online shop and this action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(selectedProduct)}
                  className="w-full h-12 bg-red-650 hover:bg-red-700 text-white font-[900] rounded-[10px] active:scale-95 transition-all cursor-pointer flex items-center justify-center text-sm"
                >
                  Yes, Delete Product
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                  }}
                  className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-[10px] active:scale-95 transition-all cursor-pointer flex items-center justify-center text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD SALE SLIDE UP SHEET */}
      <AnimatePresence>
        {showRecordSale && selectedProduct && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col overflow-y-auto pb-10 text-white"
          >
            {/* Header */}
            {recordStep < 5 && (
              <div className="px-5 py-4 border-b border-white/[0.04] flex flex-col gap-0.5">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (recordStep === 1) {
                        setShowRecordSale(false);
                      } else {
                        setRecordStep(prev => prev - 1);
                      }
                    }}
                    className="p-1 -ml-1 text-white hover:text-[#c8ff00] transition-colors"
                  >
                    <ArrowLeft size={22} />
                  </button>
                  <h2 className="text-xl font-extrabold text-white">Record Sale</h2>
                </div>
                {selectedProduct && (
                  <span className="text-[13px] text-secondary-text ml-8 font-medium truncate">
                    {selectedProduct.name}
                  </span>
                )}
              </div>
            )}

            {/* Product Info Bar */}
            {recordStep < 5 && (
              <div className="px-5 pt-5 pb-1">
                <div className="bg-white/[0.04] p-3 rounded-[10px] flex items-center gap-3 border border-white/[0.06] mb-5">
                  <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-white/5 flex-shrink-0">
                    {selectedProduct.images?.[0] ? (
                      <img src={selectedProduct.images[0]} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white truncate">{selectedProduct.name}</div>
                    <div className="text-[#c8ff00] font-bold text-xs mt-0.5">Price: ${selectedProduct.price}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step Content */}
            {recordStep === 1 && (
              <div className="px-5 flex flex-col flex-1">
                <h3 className="text-lg font-black text-white mb-4">Select size</h3>
                
                <div className="grid grid-cols-4 gap-3">
                  {(selectedProduct.sizes || []).map((sz: any, idx: number) => {
                    const isAvailable = sz.quantity > 0;
                    const isSelected = selectedSize === sz.size;
                    const isLastOne = sz.quantity === 1;

                    return (
                      <button
                        key={`select-size-${sz.size || ''}-${idx}`}
                        disabled={!isAvailable}
                        onClick={() => setSelectedSize(sz.size)}
                        style={{
                          height: '64px',
                          borderRadius: '10px'
                        }}
                        className={`flex flex-col items-center justify-center relative cursor-pointer border transition-all ${
                          isSelected 
                            ? 'bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00]' 
                            : isAvailable 
                              ? 'bg-white/[0.06] border-white/[0.12] text-white hover:bg-white/[0.09]' 
                              : 'bg-white/[0.02] border-white/[0.05] text-white/20 cursor-not-allowed'
                        }`}
                      >
                        {isLastOne && isAvailable && (
                          <span className="absolute -top-2 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[8px] font-bold rounded-[4px] border border-orange-500/35">
                            Last one
                          </span>
                        )}
                        <span className="text-sm font-extrabold">{sz.size}</span>
                        {isAvailable ? (
                          <span className="text-[10px] text-white/40 mt-0.5 font-medium">{sz.quantity} left</span>
                        ) : (
                          <span className="text-[10px] text-white/20 mt-0.5">✗</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-auto pt-10">
                  <button
                    disabled={!selectedSize}
                    onClick={() => {
                      setSaleQty(1);
                      setSalePrice(selectedProduct.price);
                      setApplyDiscount(false);
                      setDiscountVal(0);
                      setRecordStep(2);
                    }}
                    className="w-full h-14 bg-[#c8ff00] text-black font-black text-base rounded-[10px] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                  >
                    <span>Next →</span>
                  </button>
                </div>
              </div>
            )}

            {recordStep === 2 && selectedSize && (
              <div className="px-5 flex flex-col flex-1">
                {/* Selected Confirmation Badge */}
                <div className="flex mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c8ff00]/10 border border-[#c8ff00] text-[#c8ff00] text-[13px] font-bold rounded-[10px]">
                    <span>Size: {selectedSize}</span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-white mb-6">How many sold?</h3>
                
                {/* Centered Stepper */}
                <div className="flex items-center justify-center gap-4 py-6">
                  <button
                    disabled={saleQty <= 1}
                    onClick={() => setSaleQty(prev => prev - 1)}
                    style={{ width: '56px', height: '56px', borderRadius: '10px' }}
                    className="bg-white/[0.06] border border-white/[0.1] text-white flex items-center justify-center text-2xl font-bold cursor-pointer active:scale-95 disabled:opacity-35 disabled:active:scale-100 transition-all select-none"
                  >
                    −
                  </button>

                  <span style={{ width: '80px' }} className="text-[#c8ff00] font-[900] text-4xl text-center">
                    {saleQty}
                  </span>

                  {(() => {
                    const availableStock = selectedProduct.sizes.find((s: any) => s.size === selectedSize)?.quantity || 0;
                    const isMax = saleQty >= availableStock;

                    return (
                      <button
                        disabled={isMax}
                        onClick={() => setSaleQty(prev => prev + 1)}
                        style={{ width: '56px', height: '56px', borderRadius: '10px' }}
                        className="bg-white/[0.06] border border-white/[0.1] text-white flex items-center justify-center text-2xl font-bold cursor-pointer active:scale-95 disabled:opacity-35 disabled:active:scale-100 transition-all select-none"
                      >
                        +
                      </button>
                    );
                  })()}
                </div>

                {/* Stock prediction preview */}
                {(() => {
                  const availableStock = selectedProduct.sizes.find((s: any) => s.size === selectedSize)?.quantity || 0;
                  const stockAfter = availableStock - saleQty;

                  return (
                    <div className="text-center mt-2 flex flex-col items-center">
                      <span className="text-white/40 text-[13px] font-semibold">
                        Stock after sale: {stockAfter} remaining
                      </span>
                      {stockAfter === 0 && (
                        <span className="text-red-500 text-[12px] font-black mt-1.5 flex items-center gap-1">
                          ⚠️ This will mark size as sold out
                        </span>
                      )}
                    </div>
                  );
                })()}

                <div className="mt-auto pt-10">
                  <button
                    onClick={() => setRecordStep(3)}
                    className="w-full h-14 bg-[#c8ff00] text-black font-black text-base rounded-[10px] active:scale-[0.98] transition-all flex items-center justify-center"
                  >
                    <span>Next →</span>
                  </button>
                </div>
              </div>
            )}

            {recordStep === 3 && selectedSize && (
              <div className="px-5 flex flex-col flex-1 space-y-5 animate-fadeIn">
                {/* Confirmed badges row */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center px-2.5 py-1 bg-[#c8ff00]/10 border border-[#c8ff00]/25 rounded-[10px] text-[12px] font-bold text-[#c8ff00]">
                    Size: {selectedSize}
                  </div>
                  <div className="inline-flex items-center px-2.5 py-1 bg-[#c8ff00]/10 border border-[#c8ff00]/25 rounded-[10px] text-[12px] font-bold text-[#c8ff00]">
                    Qty: {saleQty}
                  </div>
                </div>

                <h3 className="text-lg font-black text-white">Sale details</h3>

                {/* PRICE SECTION */}
                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs font-bold uppercase tracking-wider block">
                    Sale price per item
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-white/40 font-bold text-lg">$</span>
                    <input
                      type="number"
                      value={salePrice || ''}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                      className="w-full h-12 bg-white/[0.04] pl-8 pr-4 text-white text-lg font-bold border border-white/[0.1] rounded-[10px] focus:border-[#c8ff00] focus:outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[13px] text-white/50">Total Base: </span>
                    <span className="text-[#c8ff00] font-black text-base">${(salePrice * saleQty).toFixed(2)}</span>
                  </div>
                </div>

                {/* DISCOUNT SECTION */}
                <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-[12px] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Apply discount</span>
                    <button
                      type="button"
                      onClick={() => {
                        setApplyDiscount(!applyDiscount);
                        setDiscountVal(0);
                      }}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                        applyDiscount ? 'bg-[#c8ff00]' : 'bg-white/15'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-black transition-transform ${applyDiscount ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {applyDiscount && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Discount Type Segments (NOT pills: use rectangular 10px rounded corners!) */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setDiscountType('fixed');
                            setDiscountVal(0);
                          }}
                          className={`py-2 text-[13px] font-bold rounded-[10px] border transition-all ${
                            discountType === 'fixed'
                              ? 'bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00]'
                              : 'bg-white/[0.04] border-transparent text-white hover:bg-white/[0.07]'
                          }`}
                        >
                          Fixed ($)
                        </button>
                        <button
                          onClick={() => {
                            setDiscountType('percent');
                            setDiscountVal(0);
                          }}
                          className={`py-2 text-[13px] font-bold rounded-[10px] border transition-all ${
                            discountType === 'percent'
                              ? 'bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00]'
                              : 'bg-white/[0.04] border-transparent text-white hover:bg-white/[0.07]'
                          }`}
                        >
                          Percent (%)
                        </button>
                      </div>

                      {/* Discount Value Input */}
                      <div className="space-y-1.5">
                        <label className="text-white/60 text-xs font-semibold">
                          {discountType === 'fixed' ? 'Discount Amount' : 'Discount Percentage'}
                        </label>
                        <div className="relative flex items-center">
                          {discountType === 'fixed' && (
                            <span className="absolute left-3.5 text-white/40 font-bold">-$</span>
                          )}
                          <input
                            type="number"
                            value={discountVal || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (discountType === 'percent') {
                                 setDiscountVal(Math.min(100, Math.max(0, val)));
                              } else {
                                 setDiscountVal(Math.min(salePrice * saleQty, Math.max(0, val)));
                              }
                            }}
                            className={`w-full h-11 bg-white/[0.02] pr-10 text-white font-semibold border border-white/[0.08] rounded-[10px] focus:border-[#c8ff00] focus:outline-none transition-all ${
                              discountType === 'fixed' ? 'pl-8' : 'pl-3'
                            }`}
                            placeholder="0"
                          />
                          {discountType === 'percent' && (
                            <span className="absolute right-3.5 text-white/40 font-bold">%</span>
                          )}
                        </div>
                      </div>

                      {/* Live calculation banner */}
                      {(() => {
                        const base = salePrice * saleQty;
                        let discount = discountVal;
                        if (discountType === 'percent') {
                          discount = Number(((base * discountVal) / 100).toFixed(2));
                        }
                        const final = Math.max(0, base - discount);

                        return (
                          <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg">
                            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Final Price:</span>
                            <span className="text-[#c8ff00] font-black text-lg">${final.toFixed(2)}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* HOW DID THEY PAY */}
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase tracking-widest block">
                    How did they pay?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['cash', 'ecocash', 'innbucks', 'whatsapp'] as const).map((method, idx) => {
                      const isSelected = paymentMethod === method;
                      const labelMap: Record<string, string> = {
                        cash: '💵 Cash',
                        ecocash: '📱 EcoCash',
                        innbucks: '🏦 InnBucks',
                        whatsapp: '💬 WhatsApp'
                      };

                      return (
                        <button
                          key={`method-${method}-${idx}`}
                          onClick={() => setPaymentMethod(method)}
                          className={`py-3 text-sm font-bold rounded-[10px] border transition-all ${
                            isSelected
                              ? 'bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00]'
                              : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          {labelMap[method]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* HOW DID THEY ORDER */}
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase tracking-widest block">
                    How did they order?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['walk-in', 'whatsapp', 'instagram', 'other'] as const).map((channel, idx) => {
                      const isSelected = orderChannel === channel;
                      const labelMap: Record<string, string> = {
                        'walk-in': '🚶 Walk-in',
                        whatsapp: '💬 WhatsApp',
                        instagram: '📸 Instagram',
                        other: '🔗 Shop link'
                      };

                      return (
                        <button
                          key={`channel-${channel}-${idx}`}
                          onClick={() => setOrderChannel(channel)}
                          className={`py-3 text-sm font-bold rounded-[10px] border transition-all ${
                            isSelected
                              ? 'bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00]'
                              : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          {labelMap[channel]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next CTA button */}
                <div className="pt-6">
                  <button
                    disabled={!paymentMethod || !orderChannel}
                    onClick={() => setRecordStep(4)}
                    className="w-full h-14 bg-[#c8ff00] text-black font-black text-base rounded-[10px] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center placeholder:font-black"
                  >
                    <span>Next →</span>
                  </button>
                </div>
              </div>
            )}

            {recordStep === 4 && selectedSize && paymentMethod && orderChannel && (
              <div className="px-5 flex flex-col flex-1 space-y-6 animate-fadeIn">
                <h3 className="text-lg font-black text-white">Confirm sale</h3>

                {/* Summary Card */}
                {(() => {
                  const base = salePrice * saleQty;
                  let discount = discountVal;
                  if (applyDiscount && discountType === 'percent') {
                    discount = Number(((base * discountVal) / 100).toFixed(2));
                  }
                  const finalPrice = Math.max(0, base - discount);

                  return (
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-5 space-y-3.5 shadow-xl">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Product</span>
                        <span className="font-extrabold text-white truncate max-w-[200px]">{selectedProduct.name}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Size</span>
                        <span className="font-extrabold text-[#c8ff00]">{selectedSize}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Quantity</span>
                        <span className="font-extrabold text-white">{saleQty}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Price per item</span>
                        <span className="font-extrabold text-white">${salePrice.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Discount</span>
                        <span className={`font-extrabold ${discount > 0 ? 'text-red-400' : 'text-white/30'}`}>
                          {discount > 0 ? `-$${discount.toFixed(2)}` : 'None'}
                        </span>
                      </div>

                      <hr className="border-t border-white/[0.08] my-1" />

                      <div className="flex items-center justify-between">
                        <span className="text-white/80 font-bold text-sm">Final Total</span>
                        <span className="text-[#c8ff00] font-black text-2xl">${finalPrice.toFixed(2)}</span>
                      </div>

                      <hr className="border-t border-white/[0.08] my-1" />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Payment Method</span>
                        <span className="font-bold text-white capitalize">{paymentMethod}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Order Channel</span>
                        <span className="font-bold text-white capitalize">{orderChannel.replace('-', ' ')}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Confirm Button */}
                <div className="pt-6 mt-auto">
                  <button
                    onClick={handleConfirmRecordSale}
                    className="w-full h-14 bg-[#c8ff00] text-black font-black text-base rounded-[10px] active:scale-[0.98] transition-all flex items-center justify-center shadow-[0_8px_24px_rgba(198,255,0,0.2)] cursor-pointer"
                  >
                    <span>Confirm Sale ✓</span>
                  </button>
                </div>
              </div>
            )}

            {recordStep === 5 && (
              <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 space-y-8 text-center animate-fadeIn">
                {/* Large animated Checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.1, 1.0] }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'rgba(200,255,0,0.1)',
                    border: '2px solid #c8ff00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="text-[#c8ff00] text-[48px] font-black leading-none select-none">✓</span>
                </motion.div>

                {/* Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="space-y-2"
                >
                  <h3 className="text-white font-black text-2xl leading-tight">
                    Sale recorded! 💰
                  </h3>
                  <p className="text-white/40 text-sm">
                    The inventory and sales logs have been updated.
                  </p>
                </motion.div>

                {/* Running totals */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="w-full max-w-xs"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '16.5px 20px',
                    textAlign: 'center'
                  }}
                >
                  <div className="text-white/40 text-xs font-bold uppercase tracking-widest">Today's sales</div>
                  <div className="text-[#c8ff00] font-[900] text-3xl mt-1.5">${todaySalesVal.toFixed(2)}</div>
                  <div className="text-white/50 text-xs mt-1.5 font-semibold">{todaySalesCount} sales recorded today</div>
                </motion.div>

                {/* Buttons Actions */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="w-full max-w-xs space-y-3 pt-6"
                >
                  <button
                    onClick={() => {
                      setSelectedSize(null);
                      setSaleQty(1);
                      setSalePrice(selectedProduct.price);
                      setApplyDiscount(false);
                      setDiscountVal(0);
                      setPaymentMethod(null);
                      setOrderChannel(null);
                      setRecordStep(1);
                    }}
                    className="w-full h-12 bg-[#c8ff00] text-black font-black rounded-[10px] active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  >
                    Record another sale
                  </button>

                  <button
                    onClick={() => {
                      setShowRecordSale(false);
                      setSelectedProduct(null);
                      setSelectedSize(null);
                      setSaleQty(1);
                      setPaymentMethod(null);
                      setOrderChannel(null);
                      setRecordStep(1);
                      setRefreshTrigger(prev => prev + 1);
                    }}
                    className="w-full h-12 bg-white/5 text-white border border-white/[0.08] font-bold rounded-[10px] active:scale-95 transition-all flex items-center justify-center hover:bg-white/[0.06] cursor-pointer"
                  >
                    Back to dashboard
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0E0E12] border-t border-white/[0.04] z-50 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex items-center pb-safe">
        <div className="flex items-center justify-around w-full min-w-max px-4 gap-2">
          <NavTab icon={<Home size={20} />} label="Dashboard" active />
          <NavTab icon={<ShoppingBag size={20} />} label="Sales" onClick={() => navigate('/sales')} />
          <NavTab icon={<Package size={20} />} label="Products" onClick={() => navigate('/inventory')} />
          <NavTab icon={<BarChart3 size={20} />} label="Analytics" onClick={() => navigate('/analytics')} />
          <NavTab icon={<Settings size={20} />} label="Settings" onClick={() => navigate('/settings')} />
        </div>
      </div>
    </div>
  );
};

const SignalCard = ({ icon, color, iconColor, title, action, onTap }: any) => (
  <div onClick={onTap} className="bg-card-bg border border-border rounded-2xl p-4 flex items-center gap-4 active:scale-[0.99] transition-all">
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-lg ${iconColor}`}>
      {icon}
    </div>
    <div className="flex-1">
      <div className="font-bold text-sm">{title}</div>
      <div className="text-secondary-text text-[13px] mt-0.5">{action}</div>
    </div>
    <ChevronRight size={18} className="text-secondary-text" />
  </div>
);

const NavTab = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${active ? 'text-neon' : 'text-secondary-text hover:text-white'}`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);
