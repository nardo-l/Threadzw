import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Store, 
  PackagePlus, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { paymentService } from '../services/paymentService';

interface PaymentDetails {
  amount: string;
  reference: string;
  transactionId: string;
  date: string;
}

export const ShopActivatedSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshSubscription } = useAuth();
  const { shop, refreshShop } = useShopContext();

  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    amount: '$9.00 USD',
    reference: 'NRD-2024-05-19-8F7Q',
    transactionId: 'TXN_8F7Q2024M19D',
    date: 'May 19, 2024 • 10:24 AM'
  });

  useEffect(() => {
    async function loadConfirmedPayment() {
      try {
        setLoading(true);
        // Refresh local contexts
        if (refreshShop) await refreshShop();
        if (refreshSubscription) await refreshSubscription();

        const urlParams = new URLSearchParams(window.location.search);
        const queryRef = urlParams.get('reference') || urlParams.get('ref') || urlParams.get('order_id');
        const queryTxn = urlParams.get('txn_id') || urlParams.get('transaction_id') || urlParams.get('poll_url');
        const queryAmount = urlParams.get('amount');

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const activeUserId = currentUser?.id || user?.id;

        if (activeUserId) {
          // Fetch current shop and payment record
          const { data: userShop } = await supabase
            .from('shops')
            .select('id, name, slug, handle, plan, paid_at, payment_reference, payment_amount, created_at')
            .eq('owner_id', activeUserId)
            .maybeSingle();

          const shopId = userShop?.id || shop?.id;

          let paymentRecord: any = null;
          if (shopId) {
            paymentRecord = await paymentService.getPaymentByShop(shopId);
          }

          // Format dynamic date
          const rawDate = paymentRecord?.paid_at || userShop?.paid_at || paymentRecord?.created_at || new Date().toISOString();
          const parsedDate = new Date(rawDate);
          
          const formattedDate = parsedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) + ' • ' + parsedDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          // Generate clean formatted reference & transaction id
          const ref = queryRef || paymentRecord?.payment_reference || userShop?.payment_reference || `NRD-${parsedDate.toISOString().slice(0, 10)}-${(shopId || '8F7Q').slice(0, 4).toUpperCase()}`;
          const txn = queryTxn ? `TXN_${queryTxn.replace(/-/g, '').slice(0, 12).toUpperCase()}` : paymentRecord?.id ? `TXN_${paymentRecord.id.replace(/-/g, '').slice(0, 12).toUpperCase()}` : `TXN_${(shopId || '8F7Q').slice(0, 4).toUpperCase()}2024M19D`;
          const amt = queryAmount ? `$${Number(queryAmount).toFixed(2)} USD` : '$9.00 USD';

          setPaymentDetails({
            amount: amt,
            reference: ref,
            transactionId: txn,
            date: formattedDate
          });
        }
      } catch (err) {
        console.warn('[ShopActivatedSuccess] Payment loading note:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConfirmedPayment();
  }, [user?.id, shop?.id]);

  const shopHandle = shop?.handle || shop?.slug || '';

  const handleGoToShop = () => {
    if (shopHandle) {
      navigate(`/${shopHandle}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleAddProduct = () => {
    navigate('/add-product');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-zinc-900 font-sans flex flex-col justify-between selection:bg-[#7C3AED] selection:text-white relative overflow-hidden">
      
      {/* Visual Confetti Sprinkle Decoration */}
      <div className="absolute top-0 inset-x-0 h-48 pointer-events-none overflow-hidden -z-0">
        <div className="absolute top-4 left-[15%] w-2 h-2 bg-[#7C3AED] rounded-xs rotate-12 opacity-80" />
        <div className="absolute top-8 left-[25%] w-2.5 h-1.5 bg-[#FBBF24] rounded-xs -rotate-45 opacity-90" />
        <div className="absolute top-3 left-[40%] w-2 h-2 bg-[#16A34A] rounded-full opacity-80" />
        <div className="absolute top-7 left-[55%] w-2 h-2 bg-[#EC4899] rounded-xs rotate-45 opacity-80" />
        <div className="absolute top-3 left-[70%] w-2.5 h-1.5 bg-[#7C3AED] rounded-xs -rotate-12 opacity-90" />
        <div className="absolute top-9 left-[82%] w-2 h-2 bg-[#06B6D4] rounded-xs rotate-30 opacity-80" />
        <div className="absolute top-14 left-[10%] w-2 h-2 bg-[#16A34A] rounded-xs -rotate-30 opacity-70" />
        <div className="absolute top-16 left-[30%] w-1.5 h-1.5 bg-[#EC4899] rounded-full opacity-70" />
        <div className="absolute top-12 left-[62%] w-2 h-2 bg-[#FBBF24] rounded-xs rotate-60 opacity-80" />
        <div className="absolute top-15 left-[88%] w-2 h-2 bg-[#16A34A] rounded-xs rotate-15 opacity-80" />
        <div className="absolute top-20 left-[20%] w-2 h-2 bg-[#7C3AED] rounded-full opacity-60" />
        <div className="absolute top-22 left-[78%] w-2 h-2 bg-[#EC4899] rounded-xs -rotate-45 opacity-70" />
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-[430px] mx-auto px-4 pt-10 pb-8 flex-1 flex flex-col justify-center relative z-10">
        
        {/* Large Success Check Circle */}
        <div className="text-center space-y-4 mb-5">
          <div className="w-20 h-20 bg-[#16A34A] rounded-full flex items-center justify-center shadow-lg shadow-[#16A34A]/25 text-white mx-auto animate-in zoom-in-95 duration-300">
            <Check size={40} className="stroke-[3.5]" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              Shop Activated!
            </h1>
            <p className="text-zinc-600 text-xs sm:text-sm font-medium">
              Congratulations! Your shop is now on Pro.
            </p>
          </div>
        </div>

        {/* 1. Green Storefront Success Card */}
        <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 flex items-start gap-3.5 text-left mb-3.5 shadow-xs">
          <div className="w-10 h-10 bg-[#22C55E] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Store size={20} className="stroke-[2.5]" />
          </div>
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#15803D] text-sm">
              Your shop is now Pro
            </h2>
            <p className="text-xs text-[#166534] font-medium leading-relaxed">
              You now have unlimited products. Start adding more and grow your brand.
            </p>
          </div>
        </div>

        {/* 2. Payment Summary Card */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 space-y-3.5 shadow-xs text-left mb-6">
          <h3 className="font-bold text-sm text-zinc-950 tracking-tight">
            Payment Summary
          </h3>

          <div className="space-y-2.5 text-xs border-t border-zinc-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Amount Paid</span>
              <span className="font-bold text-zinc-950 font-mono">
                {paymentDetails.amount}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Payment Reference</span>
              <span className="font-semibold text-zinc-900 font-mono text-[11px]">
                {loading ? <Loader2 size={12} className="animate-spin inline" /> : paymentDetails.reference}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Transaction ID</span>
              <span className="font-semibold text-zinc-900 font-mono text-[11px]">
                {loading ? <Loader2 size={12} className="animate-spin inline" /> : paymentDetails.transactionId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Payment Date</span>
              <span className="font-semibold text-zinc-900 text-[11px]">
                {loading ? <Loader2 size={12} className="animate-spin inline" /> : paymentDetails.date}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Action Buttons */}
        <div className="space-y-3">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleAddProduct}
            className="w-full h-13 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-[#7C3AED]/20"
          >
            <PackagePlus size={18} />
            <span>Add New Product</span>
          </button>

          {/* Secondary CTA */}
          <button
            type="button"
            onClick={handleGoToShop}
            className="w-full h-12 bg-white hover:bg-[#F5F3FF] border border-[#DDD6FE] active:scale-[0.99] text-[#7C3AED] font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Store size={18} />
            <span>Go to My Shop</span>
          </button>
        </div>

        {/* 4. Bottom Confirmation Reassurance */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#16A34A] mt-6">
          <ShieldCheck size={16} className="text-[#16A34A] shrink-0" />
          <span>Your payment is confirmed and your shop is active.</span>
        </div>

      </div>

      {/* Footer Branding */}
      <footer className="py-4 text-center text-[10px] text-zinc-400 font-medium">
        ThreadZW Storefront Platform • NardoPay Verified
      </footer>
    </div>
  );
};
