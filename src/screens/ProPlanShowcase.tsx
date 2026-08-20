import React from 'react';
import { 
  Lock, 
  Check, 
  AlertCircle, 
  Clock, 
  ArrowLeft, 
  X, 
  Infinity as InfinityIcon, 
  CreditCard, 
  ShieldCheck, 
  HelpCircle, 
  RefreshCw, 
  Home, 
  Package, 
  ShoppingBag, 
  Store, 
  Menu,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProPlanShowcase() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 text-lime-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> ThreadZW Pro Architecture
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Pro Plan Upgrade Flow — 4 Mobile Screens</h1>
            <p className="text-slate-400 mt-1 max-w-2xl">
              Production-ready mobile UI/UX mockup designed for Zimbabwean clothing sellers with NardoPay manual monthly payments.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors border border-slate-700 flex items-center gap-2"
          >
            ← Back to App Dashboard
          </button>
        </div>

        {/* 4 Screens Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-start justify-items-center">
          
          {/* SCREEN A: Upgrade Prompt */}
          <div className="flex flex-col items-center w-full max-w-[340px]">
            <div className="text-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-lime-400 bg-lime-500/10 px-2.5 py-1 rounded-md">
                A. Upgrade Prompt
              </span>
              <p className="text-xs text-slate-400 mt-1">Shown when seller tries to add their 4th product</p>
            </div>

            {/* Phone Frame */}
            <div className="w-[340px] h-[710px] bg-white text-slate-900 rounded-[40px] shadow-2xl border-[8px] border-slate-800 relative overflow-hidden flex flex-col justify-between font-sans select-none">
              
              {/* Products Background Content (Blurred/Dimmed) */}
              <div className="absolute inset-0 bg-slate-100 opacity-60 filter blur-[1px] p-4 flex flex-col pointer-events-none">
                <div className="flex justify-between items-center mb-4 mt-2">
                  <h2 className="text-lg font-bold text-slate-900">Products</h2>
                  <div className="bg-black text-white text-xs px-3 py-1.5 rounded-lg font-medium">+ Add Product</div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Overlay */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-end z-20">
                <div className="bg-white w-full rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92%] overflow-y-auto">
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-lime-100 flex items-center justify-center text-lime-800">
                      <Lock className="w-5 h-5" />
                    </div>
                    <button className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">You’ve reached your free limit</h3>
                  <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">
                    Free shops can have up to 9 products. Upgrade to Pro to add <span className="font-semibold text-slate-900">unlimited products</span> and grow your shop.
                  </p>

                  {/* Comparison Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Free Plan</span>
                        <div className="text-2xl font-black text-slate-900 mt-1">9</div>
                        <div className="text-[11px] text-slate-600">products</div>
                      </div>
                      <div className="mt-3 space-y-1 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Up to 9 products</div>
                        <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Basic storefront</div>
                      </div>
                    </div>

                    <div className="bg-lime-50 rounded-2xl p-3 border-2 border-lime-400 flex flex-col justify-between relative shadow-xs">
                      <span className="absolute -top-2.5 right-3 bg-lime-500 text-slate-900 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                        Pro
                      </span>
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-lime-800">Pro Plan</span>
                        <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1">
                          <InfinityIcon className="w-6 h-6 text-lime-700" />
                        </div>
                        <div className="text-[11px] font-medium text-lime-900">Unlimited products</div>
                      </div>
                      <div className="mt-3 space-y-1 pt-2 border-t border-lime-200 text-[11px] text-lime-800">
                        <div className="flex items-center gap-1"><Check className="w-3 h-3 text-lime-700" /> Unlimited products</div>
                        <div className="flex items-center gap-1"><Check className="w-3 h-3 text-lime-700" /> Everything in Free</div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Manual Notice */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3 mb-4">
                    <Info className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-900">$1.59 / month</span> • Pay manually each month — no automatic renewal.
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="space-y-2">
                    <button className="w-full py-3.5 bg-black hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2">
                      Upgrade — $1.59 / month
                    </button>
                    <button className="w-full py-2.5 bg-transparent hover:bg-slate-100 text-slate-600 font-medium rounded-xl text-xs transition-colors">
                      Maybe later
                    </button>
                  </div>

                </div>
              </div>

              {/* Bottom Mobile Nav */}
              <div className="bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center text-[10px] text-slate-400 z-10">
                <div className="flex flex-col items-center gap-0.5"><Home className="w-4 h-4" /><span>Dashboard</span></div>
                <div className="flex flex-col items-center gap-0.5 text-lime-600 font-bold"><Package className="w-4 h-4" /><span>Products</span></div>
                <div className="flex flex-col items-center gap-0.5"><ShoppingBag className="w-4 h-4" /><span>Orders</span></div>
                <div className="flex flex-col items-center gap-0.5"><Store className="w-4 h-4" /><span>Store</span></div>
                <div className="flex flex-col items-center gap-0.5"><Menu className="w-4 h-4" /><span>More</span></div>
              </div>

            </div>
          </div>


          {/* SCREEN B: Pro Checkout */}
          <div className="flex flex-col items-center w-full max-w-[340px]">
            <div className="text-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-lime-400 bg-lime-500/10 px-2.5 py-1 rounded-md">
                B. Checkout Screen
              </span>
              <p className="text-xs text-slate-400 mt-1">Seller completes payment via NardoPay widget</p>
            </div>

            {/* Phone Frame */}
            <div className="w-[340px] h-[710px] bg-slate-50 text-slate-900 rounded-[40px] shadow-2xl border-[8px] border-slate-800 relative overflow-hidden flex flex-col justify-between font-sans select-none">
              
              {/* Header */}
              <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center gap-3">
                <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-bold text-slate-900">Upgrade to Pro</h2>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Pro Plan Card */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold">
                      👑
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Pro Plan</h3>
                      <div className="text-sm font-semibold text-lime-600">$1.59 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Unlock unlimited products for your shop</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center">
                    <InfinityIcon className="w-6 h-6" />
                  </div>
                </div>

                {/* What you'll unlock */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">What you'll unlock</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check className="w-3.5 h-3.5" /></div>
                      <span>Unlimited products — add as many items as you need</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check className="w-3.5 h-3.5" /></div>
                      <span>Keep your existing products & order history</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check className="w-3.5 h-3.5" /></div>
                      <span>Pro access for 30 days</span>
                    </div>
                  </div>
                </div>

                {/* Manual monthly payment notice */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-900">Manual monthly payment</h5>
                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                      Your Pro access lasts for one month. You’ll need to pay again when it expires — no surprise auto-renewals.
                    </p>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment method</h4>
                  <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 text-center shadow-xs">
                    <div className="text-xs text-slate-500 mb-2">Secure payment powered by</div>
                    <div className="text-lg font-black tracking-tight text-slate-900 mb-3">nardaPay</div>
                    <div className="flex justify-center items-center gap-2">
                      <span className="px-2.5 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-700">VISA</span>
                      <span className="px-2.5 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-700">Mastercard</span>
                      <span className="px-2.5 py-1 bg-emerald-50 rounded text-[10px] font-bold text-emerald-700">Ecocash</span>
                      <span className="px-2.5 py-1 bg-orange-50 rounded text-[10px] font-bold text-orange-700">Innbucks</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer reassurance & CTA */}
              <div className="bg-white border-t border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Secure payment • Pro activates instantly</span>
                </div>
                <button className="w-full py-3.5 bg-black hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98">
                  Pay $1.59 with NardoPay
                </button>
              </div>

            </div>
          </div>


          {/* SCREEN C: Confirming Upgrade */}
          <div className="flex flex-col items-center w-full max-w-[340px]">
            <div className="text-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-lime-400 bg-lime-500/10 px-2.5 py-1 rounded-md">
                C. Confirming Upgrade
              </span>
              <p className="text-xs text-slate-400 mt-1">Shown right after payment while we confirm activation</p>
            </div>

            {/* Phone Frame */}
            <div className="w-[340px] h-[710px] bg-slate-50 text-slate-900 rounded-[40px] shadow-2xl border-[8px] border-slate-800 relative overflow-hidden flex flex-col justify-between font-sans select-none">
              
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                
                {/* Circular Loader */}
                <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-lime-500 border-t-transparent animate-spin"></div>
                  <div className="w-16 h-16 rounded-full bg-lime-100 text-lime-800 flex items-center justify-center shadow-inner">
                    <Lock className="w-7 h-7 text-lime-700" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Confirming your upgrade...</h3>
                <p className="text-xs text-slate-600 max-w-[260px] leading-relaxed mb-8">
                  We’ve received your payment and are confirming your Pro access. This usually takes a moment.
                </p>

                {/* Vertical Status Tracker */}
                <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 text-left space-y-4 mb-6 shadow-xs">
                  
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Payment received</div>
                      <div className="text-[10px] text-slate-500">Transaction verified successfully</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-lime-400 text-slate-900 flex items-center justify-center text-xs font-bold animate-pulse">↻</div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Activating Pro</div>
                      <div className="text-[10px] text-lime-600 font-medium">In progress...</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700">Unlimited products</div>
                      <div className="text-[10px] text-slate-400">Pending activation</div>
                    </div>
                  </div>

                </div>

                {/* Bottom Information Card */}
                <div className="w-full bg-amber-50 rounded-2xl p-3.5 border border-amber-200 text-left flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle className="w-3 h-3" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-amber-900">This is taking a little longer?</h5>
                    <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                      You don't need to pay again. We're still checking your payment.
                    </p>
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="bg-white border-t border-slate-200 p-4">
                <button className="w-full py-3.5 bg-black hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Check again
                </button>
              </div>

            </div>
          </div>


          {/* SCREEN D: Renewal / Expiry */}
          <div className="flex flex-col items-center w-full max-w-[340px]">
            <div className="text-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-lime-400 bg-lime-500/10 px-2.5 py-1 rounded-md">
                D. Renewal / Expiry Screen
              </span>
              <p className="text-xs text-slate-400 mt-1">Management screen showing expiry warning & expired states</p>
            </div>

            {/* Phone Frame */}
            <div className="w-[340px] h-[710px] bg-slate-50 text-slate-900 rounded-[40px] shadow-2xl border-[8px] border-slate-800 relative overflow-hidden flex flex-col justify-between font-sans select-none">
              
              {/* Header */}
              <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center gap-3">
                <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-bold text-slate-900">Pro Plan</h2>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Top Warning Card (Expires in 3 days) */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-xs relative overflow-hidden">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-900 text-sm">Expires in 3 days</h3>
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                        Renew now to keep unlimited products on your shop without interruption.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 bg-black hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-xs">
                      Renew Pro — $1.59
                    </button>
                    <button className="px-3 py-2.5 bg-amber-100/60 hover:bg-amber-100 text-amber-900 font-medium rounded-xl text-xs">
                      Remind later
                    </button>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 my-2"></div>

                {/* Expired State */}
                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-rose-900 text-sm">Your Pro Plan has expired</h3>
                      <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                        Your shop is back on the Free Plan.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-rose-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Current plan</span>
                      <span className="font-bold text-slate-900">Free Plan</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Product usage</span>
                      <span className="font-extrabold text-rose-600">9 / 9 products</span>
                    </div>
                    <div className="bg-rose-50 p-2 rounded-lg text-[10px] text-rose-800 font-medium flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Free trial allows up to 9 products. Upgrade to Pro to add unlimited products.</span>
                    </div>
                  </div>
                </div>

                {/* Pro Plan Card */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-lime-700 bg-lime-100 px-2 py-0.5 rounded">Pro Access</span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">Unlimited products</h4>
                      <div className="text-xs text-slate-500">$1.59 / month</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center">
                      <InfinityIcon className="w-6 h-6" />
                    </div>
                  </div>
                  <button className="w-full py-3 bg-black hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-md">
                    Renew Pro — $1.59
                  </button>
                </div>

              </div>

              {/* Bottom Mobile Nav */}
              <div className="bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center text-[10px] text-slate-400">
                <div className="flex flex-col items-center gap-0.5"><Home className="w-4 h-4" /><span>Dashboard</span></div>
                <div className="flex flex-col items-center gap-0.5"><Package className="w-4 h-4" /><span>Products</span></div>
                <div className="flex flex-col items-center gap-0.5"><ShoppingBag className="w-4 h-4" /><span>Orders</span></div>
                <div className="flex flex-col items-center gap-0.5"><Store className="w-4 h-4" /><span>Store</span></div>
                <div className="flex flex-col items-center gap-0.5 text-lime-600 font-bold"><Menu className="w-4 h-4" /><span>More</span></div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
