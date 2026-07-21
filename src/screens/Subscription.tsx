import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    // Simulate upgrade process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    toast.success('Subscription upgraded successfully!');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center">
      <button onClick={() => navigate(-1)} className="self-start flex items-center gap-2 text-zinc-500 mb-8">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm w-full max-w-sm text-center">
        <h2 className="text-3xl font-black uppercase tracking-tight">ThreadZW Pro</h2>
        <p className="text-4xl font-black mt-4">$1<span className="text-xl text-zinc-500 font-bold">/month</span></p>

        <div className="text-left mt-8 space-y-4">
          {[
            'Unlimited products',
            'Online storefront',
            'WhatsApp ordering',
            'Continue receiving orders after your trial'
          ].map(benefit => (
            <div key={benefit} className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              <Check size={16} className="text-[#25D366] shrink-0" />
              {benefit}
            </div>
          ))}
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full mt-8 h-14 bg-black text-white font-extrabold text-sm uppercase tracking-wider rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer hover:bg-zinc-800"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Upgrade for $1/month'}
        </button>
      </div>
    </div>
  );
};
