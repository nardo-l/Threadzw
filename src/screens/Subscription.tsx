import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, ExternalLink, Loader2, RefreshCw, Shirt, Car } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../hooks/useShop';
import { toast } from 'sonner';
import { getEntitlements, isPro, resolveSellerCategory, PLANS_CONFIG } from '../config/plans';
import { subscriptionClient, THREADZW_NARDOPAY_MONTHLY_LINK, SubscriptionStatusResponse } from '../services/subscriptionClient';

export const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop, refreshShop, loading: shopLoading } = useShop();
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const category = resolveSellerCategory(shop?.page_type);
  const pro = isPro(shop);
  const entitlements = getEntitlements(shop);
  const plan = PLANS_CONFIG[category] || PLANS_CONFIG.clothing;
  const pending = status?.paymentVerificationStatus === 'pending' || status?.status === 'pending';

  const loadStatus = async () => {
    if (!user || !shop?.id) return;
    setLoading(true);
    try {
      setStatus(await subscriptionClient.getStatus(shop.id));
    } catch (error: any) {
      console.warn('[SUBSCRIPTION] status:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user && shop?.id) loadStatus(); }, [user, shop?.id]);

  const startPayment = async () => {
    if (!shop?.id) return toast.error('Shop details could not be loaded.');
    setPaying(true);
    try {
      const result = await subscriptionClient.createPaymentLink(shop.id);
      toast.info('Your account is now awaiting payment verification.');
      window.location.assign(result.url || THREADZW_NARDOPAY_MONTHLY_LINK);
    } catch (error: any) {
      toast.error(error?.message || 'Could not start payment');
      setPaying(false);
    }
  };

  const refresh = async () => {
    await refreshShop();
    await loadStatus();
  };

  if (loading || shopLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8 font-sans">
      <div className="w-full max-w-xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-xs font-bold text-zinc-600 mb-6">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200 text-zinc-800 text-[10px] font-bold tracking-wider mb-2">
            {category === 'vehicles' ? <Car size={12} /> : <Shirt size={12} />} {category.toUpperCase()} MERCHANT
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Storefront Plans</h1>
          <p className="text-xs text-zinc-500 mt-1">Grow your ThreadZW storefront with Pro.</p>
        </div>

        {pending && !pro && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-5">
            <div className="flex gap-3">
              <Clock className="text-amber-600 shrink-0" size={20} />
              <div>
                <h2 className="text-sm font-black text-amber-950">PAYMENT AWAITING VERIFICATION</h2>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Thanks for paying. We are manually verifying your NardoPay payment. While we verify it, you can add up to <strong>9 products</strong>.
                </p>
                <button onClick={refresh} className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-600 text-white text-[11px] font-bold">
                  <RefreshCw size={13} /> Refresh status
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-3xl border-2 border-zinc-900 shadow-sm mb-4">
          <div className="flex items-start justify-between">
            <div><span className="text-[10px] font-black uppercase bg-[#C6FF00] px-3 py-1 rounded-full">{pro ? 'Active' : 'Current plan'}</span><h2 className="text-xl font-black uppercase mt-2">Free Storefront</h2></div>
            <div className="text-right"><span className="text-2xl font-black">$0</span><span className="block text-xs text-zinc-400">Forever</span></div>
          </div>
          <div className="mt-4 pt-4 border-t space-y-2 text-xs font-semibold text-zinc-700">
            <div className="flex gap-2"><Check size={14} /> Up to 3 active products</div>
            <div className="flex gap-2"><Check size={14} /> WhatsApp customer interests</div>
            <div className="flex gap-2"><Check size={14} /> Basic storefront tools</div>
            {pending && !pro && <div className="flex gap-2 text-amber-700"><Clock size={14} /> Temporary limit: up to 9 products while payment is verified</div>}
          </div>
        </div>

        <div className="bg-zinc-950 text-white p-6 rounded-3xl border border-zinc-800">
          <div className="flex items-start justify-between">
            <div><span className="text-[10px] font-black uppercase bg-[#C6FF00] text-zinc-900 px-3 py-1 rounded-full">Growth Tier</span><h2 className="text-xl font-black uppercase mt-2">ThreadZW Pro</h2></div>
            <div className="text-right"><span className="text-2xl font-black text-[#C6FF00]">${plan.premium.price}</span><span className="block text-xs text-zinc-400">/month</span></div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2 text-xs font-semibold text-zinc-200">
            {plan.premium.features.map(feature => <div key={feature} className="flex gap-2"><Check size={14} className="text-[#C6FF00] shrink-0" /> {feature}</div>)}
          </div>
          {!pro && !pending && (
            <button onClick={startPayment} disabled={paying} className="w-full mt-5 py-3.5 rounded-xl bg-[#C6FF00] text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2">
              {paying ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />} Subscribe — $1.59/month
            </button>
          )}
          {pending && !pro && <div className="mt-5 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-center text-xs font-bold text-amber-200">Payment submitted — awaiting manual verification</div>}
          {pro && <div className="mt-5 p-3 rounded-xl bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-center text-xs font-black text-[#C6FF00]">PRO ACTIVE</div>}
        </div>

        <p className="text-center text-[11px] text-zinc-500 mt-5">Payments are processed securely by NardoPay. Pro is activated manually after payment verification.</p>
      </div>
    </div>
  );
};
