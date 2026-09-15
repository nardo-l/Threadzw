import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Palette, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { STOREFRONT_THEMES, StorefrontThemeDefinition } from '../../config/storefrontThemes';

import blackShorts from '../../assets/images/black_shorts_1782042289615.jpg';
import capriTrackPants from '../../assets/images/capri_track_pants_1782042219426.jpg';
import nullaTee from '../../assets/images/nulla_tee_1782042238188.jpg';
import pinkZipup from '../../assets/images/pink_zipup_1782042274499.jpg';
import shadowHoodie from '../../assets/images/shadow_hoodie_1782042202597.jpg';
import zombieZipup from '../../assets/images/zombie_zipup_1782042256634.jpg';

interface Props { shop: any; }
const previewProducts = [blackShorts, nullaTee, pinkZipup, shadowHoodie, capriTrackPants, zombieZipup];
const previewLabels = ['NEW DROP', 'FEATURED', 'COLLECTION', 'LATEST'];

function Preview({ theme, selected }: { theme: StorefrontThemeDefinition; selected: boolean }) {
  const productIndex = STOREFRONT_THEMES.findIndex(item => item.id === theme.id);
  const productA = previewProducts[productIndex % previewProducts.length];
  const productB = previewProducts[(productIndex + 2) % previewProducts.length];
  const productC = previewProducts[(productIndex + 4) % previewProducts.length];
  const layout = {
    'editorial-noir': 'editorial', 'soft-studio': 'soft', 'gallery-minimal': 'gallery', 'street-archive': 'street',
    'cobalt-club': 'cobalt', 'sage-atelier': 'sage', 'cherry-pop': 'cherry', 'earth-utility': 'earth'
  }[theme.id];

  return (
    <div className="relative mx-auto w-full max-w-[330px] overflow-hidden border shadow-2xl transition-all duration-300" style={{ background: theme.background, color: theme.text, borderColor: selected ? theme.accent : theme.border, borderRadius: theme.radius, boxShadow: selected ? `0 18px 50px ${theme.accent}30` : undefined }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-2"><div className="h-7 w-7 overflow-hidden rounded-full" style={{ background: theme.surfaceAlt }}><img src={productC} alt="" className="h-full w-full object-cover" /></div><span className="text-[10px] font-black uppercase tracking-[0.15em]">THREADZW</span></div>
        <span className="text-[9px] font-semibold" style={{ color: theme.muted }}>SHOP</span>
      </div>

      {layout === 'editorial' && <div className="p-3"><div className="grid grid-cols-[1.35fr_.65fr] gap-2"><div className="relative aspect-[4/5] overflow-hidden" style={{ borderRadius: theme.radius }}><img src={productA} alt="" className="h-full w-full object-cover" /><div className="absolute bottom-3 left-3 text-white"><p className="text-[9px] font-black uppercase">New collection</p><p className="text-lg font-black leading-none">NOIR</p></div></div><div className="grid gap-2"><img src={productB} alt="" className="h-full min-h-0 w-full object-cover" style={{ borderRadius: theme.radius }} /><div className="flex items-end p-2" style={{ background: theme.text, color: theme.background, borderRadius: theme.radius }}><span className="text-[9px] font-black uppercase">Shop all →</span></div></div></div><div className="mt-3 grid grid-cols-2 gap-2"><img src={productC} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: theme.radius }} /><div className="flex items-end p-3" style={{ background: theme.surfaceAlt, borderRadius: theme.radius }}><span className="text-xl font-black">FORM</span></div></div></div>}

      {layout === 'soft' && <div className="p-4"><div className="mb-3 rounded-[24px] p-4" style={{ background: theme.surfaceAlt }}><span className="text-[8px] font-black uppercase tracking-widest" style={{ color: theme.accent }}>The studio edit</span><h3 className="mt-1 text-xl font-black">Made for<br />everyday.</h3><button className="mt-3 px-3 py-1.5 text-[8px] font-black" style={{ background: theme.accent, color: '#fff', borderRadius: theme.buttonRadius }}>EXPLORE</button></div><div className="grid grid-cols-2 gap-2"><div className="overflow-hidden rounded-[22px] bg-white"><img src={productA} alt="" className="aspect-[4/5] w-full object-cover" /><div className="p-2 text-[9px] font-bold">Essential Tee<br /><span style={{ color: theme.muted }}>$25</span></div></div><div className="overflow-hidden rounded-[22px] bg-white"><img src={productB} alt="" className="aspect-[4/5] w-full object-cover" /><div className="p-2 text-[9px] font-bold">Studio Pants<br /><span style={{ color: theme.muted }}>$39</span></div></div></div></div>}

      {layout === 'gallery' && <div className="p-3"><div className="mb-3 flex items-end justify-between"><div><p className="text-[8px] uppercase tracking-widest" style={{ color: theme.muted }}>Collection 04</p><h3 className="text-xl font-black">Objects / 04</h3></div><span className="text-[9px]">VIEW ALL →</span></div><div className="grid grid-cols-2 gap-2"><img src={productA} alt="" className="row-span-2 aspect-[3/4] h-full w-full object-cover" style={{ borderRadius: theme.radius }} /><div><img src={productB} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: theme.radius }} /><p className="mt-1 text-[8px] font-bold">UTILITY / 01</p></div><div><img src={productC} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: theme.radius }} /><p className="mt-1 text-[8px] font-bold">FORM / 02</p></div></div></div>}

      {layout === 'street' && <div style={{ background: '#080809' }}><div className="relative h-44 overflow-hidden"><img src={productA} alt="" className="h-full w-full object-cover opacity-85" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" /><div className="absolute bottom-3 left-3"><p className="text-[9px] font-black uppercase" style={{ color: theme.accent }}>DROP 09</p><h3 className="text-2xl font-black text-white">STREET<br />ARCHIVE</h3></div></div><div className="grid grid-cols-2 gap-px bg-white/10"><img src={productB} alt="" className="aspect-square w-full object-cover" /><div className="flex flex-col justify-between p-3 text-white"><span className="text-[9px] font-black">001 — 2026</span><span className="text-3xl font-black" style={{ color: theme.accent }}>RED.</span><button className="w-full py-2 text-[8px] font-black text-white" style={{ background: theme.accent }}>SHOP DROP</button></div></div></div>}

      {layout === 'cobalt' && <div className="p-3"><div className="rounded-[20px] p-4 text-white" style={{ background: theme.accent }}><p className="text-[8px] font-black uppercase tracking-widest">Cobalt club</p><h3 className="mt-2 text-2xl font-black">WEAR<br />LOUD.</h3><button className="mt-3 rounded-full bg-white px-4 py-2 text-[8px] font-black" style={{ color: theme.accent }}>SHOP NOW</button></div><div className="mt-3 flex gap-2 overflow-hidden"><img src={productA} alt="" className="aspect-[4/5] w-[48%] shrink-0 object-cover" style={{ borderRadius: theme.radius }} /><img src={productB} alt="" className="aspect-[4/5] w-[48%] shrink-0 object-cover" style={{ borderRadius: theme.radius }} /></div></div>}

      {layout === 'sage' && <div className="p-4"><div className="mb-4 text-center"><p className="text-[8px] uppercase tracking-[0.25em]" style={{ color: theme.accent }}>Sage Atelier</p><h3 className="mt-1 text-2xl font-black">Quietly<br />distinct.</h3></div><div className="overflow-hidden" style={{ borderRadius: theme.radius, background: theme.surface }}><img src={productA} alt="" className="aspect-[4/5] w-full object-cover" /><div className="flex items-center justify-between p-3"><div><p className="text-[9px] font-black">THE EVERYDAY JACKET</p><p className="text-[8px]" style={{ color: theme.muted }}>Olive / 01</p></div><span className="text-[9px] font-black">$64</span></div></div></div>}

      {layout === 'cherry' && <div className="p-3"><div className="relative overflow-hidden rounded-[26px] p-4" style={{ background: theme.accent, color: '#fff' }}><span className="text-[8px] font-black uppercase">New season</span><h3 className="mt-5 text-3xl font-black leading-none">CHERRY<br />POP!</h3><div className="absolute -bottom-5 -right-5 h-28 w-28 rounded-full bg-white/20" /></div><div className="mt-3 grid grid-cols-2 gap-2"><div className="overflow-hidden rounded-[22px] bg-white"><img src={productA} alt="" className="aspect-[4/5] w-full object-cover" /><p className="p-2 text-[9px] font-black">POP TEE</p></div><div className="overflow-hidden rounded-[22px] bg-white"><img src={productB} alt="" className="aspect-[4/5] w-full object-cover" /><p className="p-2 text-[9px] font-black">ZIP HOODIE</p></div></div></div>}

      {layout === 'earth' && <div className="p-3"><div className="grid grid-cols-[.8fr_1.2fr] gap-2"><div className="flex flex-col justify-between p-3" style={{ background: theme.accent, color: '#f8f5ec', borderRadius: theme.radius }}><span className="text-[8px] font-black">EARTH / 01</span><span className="text-2xl font-black">UTILITY<br />GOODS</span><span className="text-[8px] font-bold">BUILT TO WEAR</span></div><img src={productA} alt="" className="aspect-[3/4] w-full object-cover" style={{ borderRadius: theme.radius }} /></div><div className="mt-2 grid grid-cols-2 gap-2"><img src={productB} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: theme.radius }} /><div className="p-3" style={{ background: theme.surfaceAlt, borderRadius: theme.radius }}><span className="text-[8px] font-black uppercase">Field notes</span><p className="mt-2 text-[11px] font-bold leading-tight">Functional pieces for everyday movement.</p><span className="mt-4 block text-[8px] font-black">EXPLORE →</span></div></div></div>}

      <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: theme.border, background: theme.surface }}><div><p className="text-[9px] font-black">{theme.name}</p><p className="text-[8px]" style={{ color: theme.muted }}>{previewLabels[productIndex % previewLabels.length]} • YOUR STORE</p></div><div className="flex h-7 w-7 items-center justify-center" style={{ background: selected ? theme.accent : theme.surfaceAlt, color: selected ? '#fff' : theme.text, borderRadius: theme.buttonRadius }}><Check size={14} /></div></div>
    </div>
  );
}

export const ThemePickerLauncher: React.FC<Props> = ({ shop }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(shop?.page_config?.theme_id || STOREFRONT_THEMES[0].id);
  const carouselRef = useRef<HTMLDivElement>(null);
  const selectedIndex = useMemo(() => Math.max(0, STOREFRONT_THEMES.findIndex(theme => theme.id === selectedId)), [selectedId]);
  const selectedTheme = STOREFRONT_THEMES[selectedIndex] || STOREFRONT_THEMES[0];

  useEffect(() => {
    if (!open) return;
    const current = shop?.page_config?.theme_id || STOREFRONT_THEMES[0].id;
    setSelectedId(current);
    requestAnimationFrame(() => carouselRef.current?.scrollTo({ left: Math.max(0, STOREFRONT_THEMES.findIndex(t => t.id === current)) * (carouselRef.current?.clientWidth || 1), behavior: 'auto' }));
  }, [open, shop?.page_config?.theme_id]);

  const scrollToIndex = (index: number) => {
    const safeIndex = (index + STOREFRONT_THEMES.length) % STOREFRONT_THEMES.length;
    setSelectedId(STOREFRONT_THEMES[safeIndex].id);
    carouselRef.current?.scrollTo({ left: safeIndex * (carouselRef.current?.clientWidth || 1), behavior: 'smooth' });
  };

  const saveTheme = async () => {
    if (!shop?.id || saving) return;
    setSaving(true);
    try {
      const existingConfig = shop.page_config && typeof shop.page_config === 'object' ? shop.page_config : {};
      const { error } = await supabase.from('shops').update({ page_config: { ...existingConfig, theme_id: selectedId } }).eq('id', shop.id);
      if (error) throw error;
      toast.success(`${selectedTheme.name} is now your storefront theme.`);
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Theme save failed:', error);
      toast.error('Could not save your theme. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="group relative w-full overflow-hidden rounded-2xl border border-black bg-white p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[0.99]">
        <div className="absolute -right-7 -top-8 h-24 w-24 rotate-12 rounded-3xl bg-[#CCFF00] opacity-80" />
        <div className="relative flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 -rotate-3 items-center justify-center rounded-xl bg-zinc-950 text-[#CCFF00]"><Palette size={20} /></div><div className="min-w-0"><div className="mb-1 flex items-center gap-2"><span className="inline-flex -rotate-2 items-center gap-1 rounded-md bg-[#CCFF00] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-black"><Sparkles size={9} /> New</span></div><h3 className="truncate text-sm font-black text-zinc-950">Choose your storefront theme</h3><p className="mt-0.5 text-[11px] text-zinc-500">See your shop in a completely different style.</p></div></div><span className="shrink-0 -rotate-2 rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white transition-colors group-hover:bg-[#CCFF00] group-hover:text-black">Choose →</span></div>
      </button>

      {open && <div className="fixed inset-0 z-[100] bg-[#f4f4f1] text-zinc-950" role="dialog" aria-modal="true" aria-label="Choose storefront theme"><div className="mx-auto flex h-full w-full max-w-lg flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-[#f4f4f1] px-5 py-4"><button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm" aria-label="Back"><ArrowLeft size={18} /></button><div className="text-center"><p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">Storefront</p><h2 className="text-base font-black">Choose your theme</h2></div><div className="w-10 text-right text-[10px] font-black text-zinc-400">{selectedIndex + 1}/{STOREFRONT_THEMES.length}</div></header>
        <div className="px-5 pt-5"><div className="flex gap-1.5">{STOREFRONT_THEMES.map((theme, index) => <button key={theme.id} type="button" onClick={() => scrollToIndex(index)} className={`h-1.5 flex-1 rounded-full transition-all ${selectedId === theme.id ? 'scale-y-125' : 'opacity-35'}`} style={{ background: theme.accent }} aria-label={`Go to ${theme.name}`} />)}</div></div>
        <div ref={carouselRef} className="mt-4 flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-hide" onScroll={event => { const element = event.currentTarget; const index = Math.round(element.scrollLeft / Math.max(element.clientWidth, 1)); if (STOREFRONT_THEMES[index]) setSelectedId(STOREFRONT_THEMES[index].id); }}>
          {STOREFRONT_THEMES.map(theme => <div key={theme.id} className="flex min-w-full snap-center flex-col items-center justify-center px-5 pb-4"><Preview theme={theme} selected={selectedId === theme.id} /><div className="mt-5 w-full max-w-[330px] text-left"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black tracking-tight">{theme.name}</h3><p className="mt-1 text-xs leading-relaxed text-zinc-500">{theme.description}</p></div><div className="flex shrink-0 gap-1.5">{[theme.accent, theme.surfaceAlt, theme.background].map(color => <span key={color} className="h-6 w-6 rounded-full border border-black/10" style={{ background: color }} />)}</div></div></div></div>)}
        </div>
        <div className="flex items-center justify-between border-t border-zinc-200 bg-[#f4f4f1] px-5 py-4"><button type="button" onClick={() => scrollToIndex(selectedIndex - 1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm"><ChevronLeft size={18} /></button><button type="button" disabled={saving} onClick={saveTheme} className="h-12 flex-1 mx-3 rounded-2xl bg-zinc-950 text-sm font-black text-white shadow-lg transition hover:bg-zinc-800 disabled:opacity-60">{saving ? 'Saving…' : `Use ${selectedTheme.name}`}</button><button type="button" onClick={() => scrollToIndex(selectedIndex + 1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm"><ChevronRight size={18} /></button></div>
      </div></div>}
    </>
  );
};
