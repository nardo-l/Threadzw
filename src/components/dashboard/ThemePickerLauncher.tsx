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
const images = [blackShorts, nullaTee, pinkZipup, shadowHoodie, capriTrackPants, zombieZipup];

function ThemePreview({ theme, index, selected }: { theme: StorefrontThemeDefinition; index: number; selected: boolean }) {
  const imageA = images[index % images.length];
  const imageB = images[(index + 2) % images.length];
  const imageC = images[(index + 4) % images.length];
  const dark = theme.mode === 'dark';
  const layouts = ['editorial', 'soft', 'gallery', 'street', 'cobalt', 'sage', 'cherry', 'earth'];
  const layout = layouts[index];

  return (
    <div className="w-full max-w-[350px]" style={{ filter: selected ? 'none' : 'saturate(.88)' }}>
      <div className="overflow-hidden border-2 shadow-2xl" style={{ background: theme.background, color: theme.text, borderColor: selected ? theme.accent : theme.border, borderRadius: theme.radius, boxShadow: selected ? `0 24px 60px ${theme.accent}45` : `0 18px 45px ${theme.accent}18` }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2"><div className="h-7 w-7 overflow-hidden" style={{ background: theme.surfaceAlt, borderRadius: theme.buttonRadius }}><img src={imageC} className="h-full w-full object-cover" alt="" /></div><b className="text-[10px] tracking-[.18em]">YOUR BRAND</b></div>
          <span className="text-[9px] font-bold" style={{ color: theme.muted }}>MENU</span>
        </div>

        <div className="p-3">
          {layout === 'editorial' && <><div className="grid grid-cols-[1.3fr_.7fr] gap-2"><div className="relative aspect-[4/5] overflow-hidden" style={{ borderRadius: theme.radius }}><img src={imageA} className="h-full w-full object-cover" alt=""/><div className="absolute bottom-3 left-3 text-white"><b className="text-[8px] uppercase">New collection</b><div className="text-2xl font-black">NOIR</div></div></div><div className="flex flex-col gap-2"><img src={imageB} className="h-2/3 w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/><div className="flex flex-1 items-end p-2 text-xs font-black" style={{ background: theme.text, color: theme.background, borderRadius: theme.radius }}>SHOP ALL →</div></div></div></>}
          {layout === 'soft' && <><div className="p-5" style={{ background: theme.surfaceAlt, borderRadius: theme.radius }}><span className="text-[8px] font-black uppercase tracking-widest" style={{ color: theme.accent }}>THE STUDIO EDIT</span><div className="mt-1 text-2xl font-black leading-tight">Made for<br/>everyday.</div><div className="mt-4 inline-block px-4 py-2 text-[8px] font-black text-white" style={{ background: theme.accent, borderRadius: theme.buttonRadius }}>EXPLORE</div></div><div className="mt-2 grid grid-cols-2 gap-2"><img src={imageA} className="aspect-[4/5] w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/><img src={imageB} className="aspect-[4/5] w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/></div></>}
          {layout === 'gallery' && <><div className="mb-3 flex items-end justify-between"><div><span className="text-[8px] uppercase tracking-widest" style={{ color: theme.muted }}>COLLECTION 04</span><div className="text-xl font-black">Objects / 04</div></div><span className="text-[8px] font-bold">VIEW ALL</span></div><div className="grid grid-cols-2 gap-2"><img src={imageA} className="row-span-2 aspect-[3/4] h-full w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/><img src={imageB} className="aspect-square w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/><img src={imageC} className="aspect-square w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/></div></>}
          {layout === 'street' && <><div className="relative overflow-hidden" style={{ background: '#080809', borderRadius: theme.radius }}><img src={imageA} className="h-44 w-full object-cover opacity-80" alt=""/><div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"/><div className="absolute bottom-3 left-3 text-white"><span className="text-[8px] font-black" style={{ color: theme.accent }}>DROP 09</span><div className="text-3xl font-black leading-none">STREET<br/>ARCHIVE</div></div></div><div className="mt-2 flex items-center justify-between p-3" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}><b className="text-xs">001 — 2026</b><b style={{ color: theme.accent }}>SHOP DROP</b></div></>}
          {layout === 'cobalt' && <><div className="p-5 text-white" style={{ background: theme.accent, borderRadius: theme.radius }}><span className="text-[8px] font-black uppercase tracking-widest">COBALT CLUB</span><div className="mt-2 text-3xl font-black">WEAR<br/>LOUD.</div><div className="mt-4 inline-block bg-white px-4 py-2 text-[8px] font-black" style={{ color: theme.accent, borderRadius: theme.buttonRadius }}>SHOP NOW</div></div><div className="mt-2 grid grid-cols-2 gap-2"><img src={imageA} className="aspect-[4/5] w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/><img src={imageB} className="aspect-[4/5] w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/></div></>}
          {layout === 'sage' && <><div className="pb-3 text-center"><span className="text-[8px] uppercase tracking-[.3em]" style={{ color: theme.accent }}>SAGE ATELIER</span><div className="mt-1 text-2xl font-black">Quietly<br/>distinct.</div></div><div className="overflow-hidden" style={{ background: theme.surface, borderRadius: theme.radius }}><img src={imageA} className="aspect-[4/5] w-full object-cover" alt=""/><div className="p-3 text-xs font-black">THE EVERYDAY JACKET <span className="float-right">$64</span></div></div></>}
          {layout === 'cherry' && <><div className="relative overflow-hidden p-5 text-white" style={{ background: theme.accent, borderRadius: theme.radius }}><span className="text-[8px] font-black uppercase">NEW SEASON</span><div className="mt-4 text-4xl font-black leading-none">CHERRY<br/>POP!</div><div className="absolute -bottom-8 -right-5 h-28 w-28 rounded-full bg-white/20"/></div><div className="mt-2 grid grid-cols-2 gap-2"><img src={imageA} className="aspect-[4/5] w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/><img src={imageB} className="aspect-[4/5] w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/></div></>}
          {layout === 'earth' && <><div className="grid grid-cols-[.85fr_1.15fr] gap-2"><div className="flex flex-col justify-between p-3" style={{ background: theme.accent, color: '#f8f5ec', borderRadius: theme.radius }}><span className="text-[8px] font-black">EARTH / 01</span><b className="text-2xl leading-none">UTILITY<br/>GOODS</b><span className="text-[8px] font-bold">BUILT TO WEAR</span></div><img src={imageA} className="aspect-[3/4] w-full object-cover" style={{ borderRadius: theme.radius }} alt=""/></div><div className="mt-2 p-3" style={{ background: theme.surfaceAlt, borderRadius: theme.radius }}><span className="text-[8px] font-black uppercase">FIELD NOTES</span><div className="mt-2 text-sm font-bold">Functional pieces for everyday movement.</div></div></>}
        </div>

        <div className="flex items-center justify-between px-4 py-3" style={{ background: theme.surface, borderTop: `1px solid ${theme.border}` }}><div><b className="block text-[9px]">{theme.name}</b><span className="text-[8px]" style={{ color: theme.muted }}>{theme.description}</span></div><div className="flex h-8 w-8 items-center justify-center" style={{ background: selected ? theme.accent : theme.surfaceAlt, color: selected ? '#fff' : theme.text, borderRadius: theme.buttonRadius }}>{selected ? <Check size={14}/> : <Palette size={14}/>}</div></div>
      </div>
      <div className="mt-3 flex justify-center gap-2">{[theme.background, theme.surfaceAlt, theme.accent, theme.text].map(c => <span key={c} className="h-7 w-7 border border-black/10" style={{ background: c, borderRadius: theme.buttonRadius }}/>)}</div>
    </div>
  );
}

export const ThemePickerLauncher: React.FC<Props> = ({ shop }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(shop?.page_config?.theme_id || STOREFRONT_THEMES[0].id);
  const carouselRef = useRef<HTMLDivElement>(null);
  const selectedIndex = useMemo(() => Math.max(0, STOREFRONT_THEMES.findIndex(t => t.id === selectedId)), [selectedId]);
  const selectedTheme = STOREFRONT_THEMES[selectedIndex] || STOREFRONT_THEMES[0];

  useEffect(() => {
    if (!open) return;
    const current = shop?.page_config?.theme_id || STOREFRONT_THEMES[0].id;
    setSelectedId(current);
    requestAnimationFrame(() => {
      const index = Math.max(0, STOREFRONT_THEMES.findIndex(t => t.id === current));
      carouselRef.current?.scrollTo({ left: index * (carouselRef.current?.clientWidth || 1), behavior: 'auto' });
    });
  }, [open, shop?.page_config?.theme_id]);

  const scrollToIndex = (index: number) => {
    const safe = (index + STOREFRONT_THEMES.length) % STOREFRONT_THEMES.length;
    setSelectedId(STOREFRONT_THEMES[safe].id);
    carouselRef.current?.scrollTo({ left: safe * (carouselRef.current?.clientWidth || 1), behavior: 'smooth' });
  };

  const saveTheme = async () => {
    if (!shop?.id || saving) return;
    setSaving(true);
    try {
      const existing = shop.page_config && typeof shop.page_config === 'object' ? shop.page_config : {};
      const nextConfig = { ...existing, theme_id: selectedId };
      const { error } = await supabase.from('shops').update({ page_config: nextConfig }).eq('id', shop.id);
      if (error) throw error;
      const { data: saved, error: verifyError } = await supabase.from('shops').select('page_config').eq('id', shop.id).maybeSingle();
      if (verifyError) throw verifyError;
      if (saved?.page_config?.theme_id !== selectedId) throw new Error('Theme selection was not persisted.');
      toast.success(`${selectedTheme.name} is now your storefront theme.`);
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Theme save failed:', error);
      toast.error('Could not save your theme. Please try again.');
    } finally { setSaving(false); }
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="group relative w-full overflow-hidden rounded-2xl border border-black bg-white p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[.99]">
      <div className="absolute -right-7 -top-8 h-24 w-24 rotate-12 rounded-3xl bg-[#CCFF00] opacity-80"/>
      <div className="relative flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 -rotate-3 items-center justify-center rounded-xl bg-zinc-950 text-[#CCFF00]"><Palette size={20}/></div><div className="min-w-0"><div className="mb-1"><span className="inline-flex -rotate-2 items-center gap-1 rounded-md bg-[#CCFF00] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-black"><Sparkles size={9}/> New</span></div><h3 className="truncate text-sm font-black text-zinc-950">Choose your storefront theme</h3><p className="mt-0.5 text-[11px] text-zinc-500">Give your storefront a completely different look.</p></div></div><span className="shrink-0 -rotate-2 rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-black uppercase text-white group-hover:bg-[#CCFF00] group-hover:text-black">Choose →</span></div>
    </button>

    {open && <div className="fixed inset-0 z-[100] text-zinc-950" style={{ background: selectedTheme.background }} role="dialog" aria-modal="true" aria-label="Choose storefront theme">
      <div className="mx-auto flex h-full w-full max-w-lg flex-col">
        <header className="flex items-center justify-between border-b px-5 py-4" style={{ background: selectedTheme.surface, borderColor: selectedTheme.border }}><button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center shadow-sm" style={{ background: selectedTheme.surfaceAlt, color: selectedTheme.text, borderRadius: selectedTheme.buttonRadius }}><ArrowLeft size={18}/></button><div className="text-center"><p className="text-[9px] font-black uppercase tracking-[.22em]" style={{ color: selectedTheme.accent }}>Storefront themes</p><h2 className="text-base font-black" style={{ color: selectedTheme.text }}>Choose your look</h2></div><div className="text-right text-[10px] font-black" style={{ color: selectedTheme.muted }}>{selectedIndex + 1}/{STOREFRONT_THEMES.length}</div></header>
        <div className="px-5 pt-4"><div className="flex gap-1.5">{STOREFRONT_THEMES.map((theme, i) => <button key={theme.id} type="button" onClick={() => scrollToIndex(i)} className={`h-2 flex-1 transition-all ${selectedId === theme.id ? 'scale-y-125' : 'opacity-30'}`} style={{ background: theme.accent, borderRadius: theme.buttonRadius }}/>)}</div></div>
        <div ref={carouselRef} className="mt-3 flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-hide" onScroll={e => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)); if (STOREFRONT_THEMES[i]) setSelectedId(STOREFRONT_THEMES[i].id); }}>
          {STOREFRONT_THEMES.map((theme, i) => <div key={theme.id} className="flex min-w-full snap-center flex-col items-center justify-center overflow-y-auto px-5 pb-4"><ThemePreview theme={theme} index={i} selected={selectedId === theme.id}/><div className="mt-3 w-full max-w-[350px]"><h3 className="text-xl font-black" style={{ color: theme.text }}>{theme.name}</h3><p className="mt-1 text-xs leading-relaxed" style={{ color: theme.muted }}>{theme.description}</p></div></div>)}
        </div>
        <div className="flex items-center justify-between border-t px-5 py-4" style={{ background: selectedTheme.surface, borderColor: selectedTheme.border }}><button type="button" onClick={() => scrollToIndex(selectedIndex - 1)} className="flex h-11 w-11 items-center justify-center shadow-sm" style={{ background: selectedTheme.surfaceAlt, color: selectedTheme.text, borderRadius: selectedTheme.buttonRadius }}><ChevronLeft size={18}/></button><button type="button" disabled={saving} onClick={saveTheme} className="mx-3 h-12 flex-1 text-sm font-black text-white shadow-lg disabled:opacity-60" style={{ background: selectedTheme.accent, borderRadius: selectedTheme.buttonRadius }}>{saving ? 'Saving…' : `Use ${selectedTheme.name}`}</button><button type="button" onClick={() => scrollToIndex(selectedIndex + 1)} className="flex h-11 w-11 items-center justify-center shadow-sm" style={{ background: selectedTheme.surfaceAlt, color: selectedTheme.text, borderRadius: selectedTheme.buttonRadius }}><ChevronRight size={18}/></button></div>
      </div>
    </div>}
  </>;
};
