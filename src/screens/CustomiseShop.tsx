import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, Store } from 'lucide-react';
import { useShopContext } from '../context/ShopContext';
import { isShopViewOnly } from '../config/plans';
import { ThemePickerLauncher } from '../components/dashboard/ThemePickerLauncher';
import { WhyShopWithUsManager } from '../components/dashboard/WhyShopWithUsManager';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';

export const CustomiseShop: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useShopContext();
  const viewOnly = isShopViewOnly(shop);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28 font-sans text-[#111]">
      <header className="sticky top-0 z-30 mx-auto flex max-w-4xl items-center gap-3 border-b border-zinc-200/70 bg-[#F8F9FA]/95 px-4 py-4 backdrop-blur-md">
        <button type="button" onClick={() => navigate('/dashboard')} aria-label="Back to dashboard" className="rounded-xl p-2 transition hover:bg-zinc-200">
          <ArrowLeft size={20} />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CCFF00] text-black"><Store size={20} /></div>
        <div><h1 className="text-lg font-black tracking-tight">Customise Shop</h1><p className="text-[11px] text-zinc-500">Make your storefront feel like your brand.</p></div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-5">
        <section className="rounded-2xl border border-zinc-200/70 bg-white p-5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-[#85B800]"><Palette size={14} /> Storefront appearance</div>
          <h2 className="mt-2 text-base font-black">Choose your style</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">Pick a theme that matches your brand. Your choice is saved to your shop.</p>
          {viewOnly ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">Theme editing is paused while your shop is in view-only mode. Restore Pro access to customise your storefront.</div>
          ) : (
            <div className="mt-4"><ThemePickerLauncher shop={shop} /></div>
          )}
        </section>

        {!viewOnly && <WhyShopWithUsManager />}

        {viewOnly && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-sm font-black text-amber-950">Storefront cards are temporarily locked</h2><p className="mt-1 text-xs leading-relaxed text-amber-900">Your existing cards are preserved. Restore Pro access to edit them again.</p><button onClick={() => navigate('/subscription')} className="mt-3 rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-black text-white">View subscription</button></section>}
      </main>
      <BottomNavBar />
    </div>
  );
};
