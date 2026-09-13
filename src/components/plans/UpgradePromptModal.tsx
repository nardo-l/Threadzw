import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, X, ShieldAlert, ArrowRight, Layers, Car, ShoppingBag } from 'lucide-react';
import { Shop, SellerCategory } from '../../types';
import { resolveSellerCategory } from '../../config/sellerCategories';

export type UpgradeTriggerReason = 'product_limit'|'usage_quota'|'vehicle_limit'|'image_limit'|'template_locked'|'analytics_locked'|'branding_locked';
interface UpgradePromptModalProps { isOpen:boolean; onClose:()=>void; shop?:Shop|null; category?:SellerCategory; reason?:UpgradeTriggerReason; customTitle?:string; customMessage?:string; }

export const UpgradePromptModal:React.FC<UpgradePromptModalProps>=({isOpen,onClose,shop,category:propCategory,reason='product_limit',customTitle,customMessage})=>{
 const navigate=useNavigate(); if(!isOpen)return null;
 const category=propCategory||resolveSellerCategory(shop?.page_type); const isVehicle=category==='vehicles';
 let title=customTitle||''; let message=customMessage||''; let icon=<Sparkles className="w-6 h-6 text-black"/>;
 if(!title){
  if(reason==='product_limit'){title='Make your shop live';message='Subscribe for $9 once-off to start adding products. Your shop moves to payment pending before NardoPay, and you can add up to 9 products while we verify your payment.';icon=<ShoppingBag className="w-6 h-6 text-black"/>;}
  else if(reason==='usage_quota'){title='Subscribe to add products';message='Your free shop is ready. Subscribe for $9 once-off to start adding products and make your shop live.';icon=<ShieldAlert className="w-6 h-6 text-black"/>;}
  else if(reason==='vehicle_limit'){title="You've reached the vehicle limit";message='Upgrade to Vehicle Premium to list more active vehicles.';icon=<Car className="w-6 h-6 text-black"/>;}
  else if(reason==='image_limit'){title='Maximum Photo Limit Reached';message=isVehicle?'Free vehicle listings support up to 8 photos.':'Free product listings support up to 5 photos.';icon=<Layers className="w-6 h-6 text-black"/>;}
  else {title='Unlock Premium Features';message='Get unlimited products and premium storefront features with a $9 once-off payment.';}
 }
 const handleUpgrade=()=>{onClose();navigate('/subscription');};
 const price=isVehicle?'$30':'$9'; const period=isVehicle?'/year':'once-off';
 return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
  <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 relative space-y-5" role="dialog" aria-modal="true">
   <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100" aria-label="Close dialog"><X size={20}/></button>
   <div className="flex items-start gap-4 pr-8"><div className="w-12 h-12 rounded-2xl bg-[#CCFF00] flex items-center justify-center shrink-0">{icon}</div><div><div className="inline-flex px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-900 text-[10px] font-extrabold uppercase tracking-wide mb-1.5">{isVehicle?'Vehicle Premium':'ThreadZW Premium'}</div><h3 className="text-lg sm:text-xl font-black text-zinc-950">{title}</h3></div></div>
   <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">{message}</p>
   <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3"><div className="flex items-baseline justify-between border-b border-zinc-200 pb-3"><div><div className="text-xs font-bold">{isVehicle?'Vehicle Premium':'ThreadZW Premium'}</div><div className="text-[11px] text-zinc-500">{isVehicle?'Digital showroom':'Unlimited products after approval'}</div></div><div><span className="text-xl font-black">{price}</span><span className="text-xs text-zinc-500 font-bold ml-1">{period}</span></div></div>
    <div className="space-y-2 text-xs text-zinc-800">{[isVehicle?'Up to 20 active showroom vehicles':'Unlimited active products after approval',isVehicle?'$30/year':'$9 USD once-off via NardoPay','Your payment is reviewed before the shop goes live','No monthly renewal'].map(x=><div key={x} className="flex items-center gap-2.5"><span className="w-4 h-4 rounded-full bg-[#CCFF00] flex items-center justify-center shrink-0"><Check size={10}/></span>{x}</div>)}</div></div>
   <div className="flex flex-col sm:flex-row gap-2.5 pt-2"><button onClick={handleUpgrade} className="w-full py-3.5 px-5 bg-[#CCFF00] text-black font-extrabold text-xs uppercase rounded-xl flex items-center justify-center gap-2">Subscribe — {price} {period}<ArrowRight size={15}/></button><button onClick={onClose} className="py-3.5 px-5 text-zinc-500 text-xs font-bold">Not now</button></div>
  </div>
 </div>;
};
