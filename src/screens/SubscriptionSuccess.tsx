import React, { useEffect, useState } from 'react';
import { Check, Clock, PackagePlus, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../hooks/useShop';
import { subscriptionClient } from '../services/subscriptionClient';

export const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop, refreshShop } = useShop();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(true);

  const checkStatus = async () => {
    if (!user || !shop?.id) return;
    try {
      const status = await subscriptionClient.getStatus(shop.id);
      setPending(status.plan !== 'premium');
    } catch {
      // Keep the safe pending state if status cannot be checked.
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user || !shop?.id) { if (mounted) setLoading(false); return; }
      try {
        const status = await subscriptionClient.getStatus(shop.id);
        if (mounted) setPending(status.plan !== 'premium');
      } catch { /* keep pending */ }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user?.id, shop?.id]);

  const refresh = async () => {
    await refreshShop();
    await checkStatus();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-7 text-center shadow-sm">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${pending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
          {pending ? <Clock size={40} /> : <Check size={40} />}
        </div>
        <h1 className="text-2xl font-black mt-5">{pending ? 'Payment Submitted' : 'Premium Activated'}</h1>
        <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
          {pending
            ? 'Your $9 once-off NardoPay payment has been submitted. ThreadZW will activate Premium after the payment is manually verified.'
            : 'Your $9 once-off payment has been verified. Your shop is now on Premium.'}
        </p>

        {pending && (
          <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-left">
            <p className="text-xs font-bold text-amber-950">While we verify your payment</p>
            <p className="text-xs text-amber-800 mt-1">You can add up to <strong>9 products</strong>. Once approved, Premium gives you unlimited products and your shop can go live.</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {pending && <button onClick={refresh} className="w-full py-3 rounded-xl bg-zinc-950 text-white text-xs font-black uppercase">Refresh verification status</button>}
          <button onClick={() => navigate('/add-product')} className="w-full py-3 rounded-xl bg-[#C6FF00] text-zinc-950 text-xs font-black uppercase flex items-center justify-center gap-2"><PackagePlus size={16} /> Add Product</button>
          <button onClick={() => navigate('/dashboard')} className="w-full py-3 rounded-xl border border-zinc-200 text-zinc-800 text-xs font-bold uppercase flex items-center justify-center gap-2"><Store size={16} /> Dashboard</button>
        </div>
        {loading && <p className="text-[10px] text-zinc-400 mt-4">Checking your payment status…</p>}
      </div>
    </div>
  );
};
