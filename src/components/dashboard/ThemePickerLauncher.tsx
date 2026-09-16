import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Palette, Sparkles, WandSparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { STOREFRONT_THEMES } from '../../config/storefrontThemes';

interface Props { shop: any; }

const THEME_BUCKET = 'sample themes';
const THEME_IMAGES: Record<string, string> = {
  'editorial-noir': '01_Editorial_Noir.png',
  'soft-studio': '02_Soft_Studio.png',
  'gallery-minimal': '03_Gallery_Minimal.png',
  'street-archive': '04_Street_Archive.png',
  'cobalt-club': '05_Cobalt_Club.png',
  'sage-atelier': '06_Sage_Atelier.png',
  'cherry-pop': '07_Cherry_Pop.png',
  'earth-utility': '08_Earth_Utility.png',
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

async function loadThemeImages(): Promise<Record<string, string>> {
  const storage = supabase.storage.from(THEME_BUCKET);
  const result: Record<string, string> = {};

  // First try the exact paths directly. This works when the bucket is private,
  // because the signed URL is generated for the logged-in dashboard user.
  await Promise.all(
    STOREFRONT_THEMES.map(async theme => {
      const filename = THEME_IMAGES[theme.id];
      if (!filename) return;
      try {
        const { data } = await storage.createSignedUrl(filename, 60 * 60);
        if (data?.signedUrl) result[theme.id] = data.signedUrl;
      } catch (error) {
        console.warn(`Could not create signed URL for ${filename}`, error);
      }
    })
  );

  // If the uploaded filenames differ, discover the actual objects and match them
  // to the theme name. This also handles spaces, hyphens and underscores.
  try {
    const { data: files, error } = await storage.list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (!error && files?.length) {
      for (const theme of STOREFRONT_THEMES) {
        if (result[theme.id]) continue;
        const expected = normalize(THEME_IMAGES[theme.id] || '');
        const themeName = normalize(theme.name);
        const match = files.find(file => {
          const name = normalize(file.name);
          return name === expected || name.includes(themeName) || themeName.includes(name.replace(/\.(png|jpg|jpeg|webp)$/i, ''));
        });
        if (match?.name) {
          const { data } = await storage.createSignedUrl(match.name, 60 * 60);
          if (data?.signedUrl) result[theme.id] = data.signedUrl;
        }
      }
    }
  } catch (error) {
    console.warn('Could not list theme preview images', error);
  }

  // Final fallback for public buckets.
  for (const theme of STOREFRONT_THEMES) {
    if (result[theme.id]) continue;
    const filename = THEME_IMAGES[theme.id];
    if (filename) result[theme.id] = storage.getPublicUrl(filename).data.publicUrl;
  }

  return result;
}

export const ThemePickerLauncher: React.FC<Props> = ({ shop }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [themeImages, setThemeImages] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState(shop?.page_config?.theme_id || STOREFRONT_THEMES[0].id);
  const carouselRef = useRef<HTMLDivElement>(null);

  const selectedIndex = useMemo(() => Math.max(0, STOREFRONT_THEMES.findIndex(theme => theme.id === selectedId)), [selectedId]);
  const selectedTheme = STOREFRONT_THEMES[selectedIndex] || STOREFRONT_THEMES[0];

  useEffect(() => {
    if (!open) return;
    const current = shop?.page_config?.theme_id || STOREFRONT_THEMES[0].id;
    const index = Math.max(0, STOREFRONT_THEMES.findIndex(theme => theme.id === current));
    setSelectedId(STOREFRONT_THEMES[index].id);
    let cancelled = false;
    setLoadingImages(true);
    setFailedImages({});
    loadThemeImages().then(images => {
      if (!cancelled) setThemeImages(images);
    }).catch(error => console.error('Theme preview images failed to load:', error)).finally(() => {
      if (!cancelled) setLoadingImages(false);
    });
    requestAnimationFrame(() => {
      const slide = carouselRef.current?.querySelector<HTMLElement>(`[data-theme-index="${index}"]`);
      slide?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    });
    return () => { cancelled = true; };
  }, [open, shop?.page_config?.theme_id]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  const scrollToIndex = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, STOREFRONT_THEMES.length - 1));
    setSelectedId(STOREFRONT_THEMES[safeIndex].id);
    const slide = carouselRef.current?.querySelector<HTMLElement>(`[data-theme-index="${safeIndex}"]`);
    slide?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const handleCarouselScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const slides = Array.from(container.querySelectorAll<HTMLElement>('[data-theme-index]'));
    if (!slides.length) return;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(center - slideCenter);
      if (distance < closestDistance) { closestDistance = distance; closestIndex = index; }
    });
    const theme = STOREFRONT_THEMES[closestIndex];
    if (theme && theme.id !== selectedId) setSelectedId(theme.id);
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

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="group relative w-full overflow-hidden rounded-2xl border border-black bg-white p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[.99]">
        <div className="absolute -right-7 -top-8 h-24 w-24 rotate-12 rounded-3xl bg-[#CCFF00] opacity-80" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 -rotate-3 items-center justify-center rounded-xl bg-zinc-950 text-[#CCFF00]"><Palette size={20} /></div>
            <div className="min-w-0">
              <div className="mb-1"><span className="inline-flex -rotate-2 items-center gap-1 rounded-md bg-[#CCFF00] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-black"><Sparkles size={9} /> New</span></div>
              <h3 className="truncate text-sm font-black text-zinc-950">Choose your storefront theme</h3>
              <p className="mt-0.5 text-[11px] text-zinc-500">Swipe through the designs and choose your look.</p>
            </div>
          </div>
          <span className="shrink-0 -rotate-2 rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-black uppercase text-white group-hover:bg-[#CCFF00] group-hover:text-black">Choose →</span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] overflow-hidden text-[#10204b]" style={{ background: 'linear-gradient(180deg, #f7faff 0%, #eef4ff 100%)' }} role="dialog" aria-modal="true" aria-label="Choose storefront theme">
          <div className="mx-auto flex h-full w-full max-w-[520px] flex-col">
            <header className="relative flex shrink-0 items-center justify-between px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
              <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#10204b] shadow-[0_5px_18px_rgba(54,88,150,.12)] ring-1 ring-[#dfe8fa] transition-transform active:scale-95" aria-label="Close theme picker"><ArrowLeft size={21} strokeWidth={2.2} /></button>
              <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center sm:top-5"><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#2457ff]">Storefront themes</p><h2 className="mt-0.5 whitespace-nowrap text-[19px] font-black tracking-[-.03em] text-[#10204b] sm:text-[21px]">Choose your look</h2></div>
              <div className="flex h-11 min-w-[51px] items-center justify-center rounded-2xl bg-white px-3 text-[11px] font-black text-[#18346f] shadow-[0_5px_18px_rgba(54,88,150,.12)] ring-1 ring-[#dfe8fa]">{selectedIndex + 1}/{STOREFRONT_THEMES.length}</div>
            </header>

            <div className="shrink-0 px-5 pt-1 sm:px-7 sm:pt-2">
              <p className="mx-auto mb-3 max-w-[340px] text-center text-[11px] font-medium leading-4 text-[#6376a3] sm:text-xs">Swipe through the themes and find the perfect style for your storefront.</p>
              <div className="flex gap-2" aria-label="Theme progress">
                {STOREFRONT_THEMES.map((theme, index) => <button key={theme.id} type="button" onClick={() => scrollToIndex(index)} aria-label={`View ${theme.name}`} className="h-1.5 flex-1 rounded-full transition-all duration-200" style={{ background: selectedId === theme.id ? theme.accent : '#c6d3eb', transform: selectedId === theme.id ? 'scaleY(1.35)' : undefined, boxShadow: selectedId === theme.id ? `0 2px 8px ${theme.accent}35` : undefined }} />)}
              </div>
            </div>

            <div ref={carouselRef} onScroll={handleCarouselScroll} className="mt-3 flex min-h-0 flex-1 snap-x snap-mandatory items-center gap-4 overflow-x-auto overscroll-x-contain px-[11%] py-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollPaddingInline: '11%' }}>
              {STOREFRONT_THEMES.map((theme, index) => {
                const imageUrl = themeImages[theme.id];
                const isSelected = selectedId === theme.id;
                const imageFailed = failedImages[theme.id];
                return (
                  <section key={theme.id} data-theme-index={index} className="flex min-w-[78%] snap-center flex-col items-center justify-center">
                    <button type="button" onClick={() => scrollToIndex(index)} aria-label={`Select ${theme.name}`} className="relative block min-h-[280px] w-full overflow-hidden rounded-[24px] bg-white text-left transition-all duration-300" style={{ border: `2px solid ${isSelected ? theme.accent : '#d6e0f2'}`, boxShadow: isSelected ? `0 18px 45px ${theme.accent}30, 0 5px 16px rgba(45,72,120,.10)` : '0 10px 28px rgba(45,72,120,.10)', transform: isSelected ? 'translateY(-2px)' : 'scale(.985)' }}>
                      {imageUrl && !imageFailed ? (
                        <img src={imageUrl} alt={`${theme.name} storefront theme preview`} className="block h-auto max-h-[48vh] min-h-[280px] w-full object-contain" draggable={false} loading={Math.abs(index - selectedIndex) <= 1 ? 'eager' : 'lazy'} onError={() => setFailedImages(current => ({ ...current, [theme.id]: true }))} />
                      ) : (
                        <div className="flex min-h-[280px] w-full flex-col items-center justify-center px-8 text-center" style={{ background: theme.background, color: theme.text }}>
                          {loadingImages ? <div className="animate-pulse text-sm font-bold">Loading preview…</div> : <><div className="mb-3 h-12 w-12 rounded-full" style={{ background: theme.accent }} /><div className="text-lg font-black">{theme.name}</div><div className="mt-1 text-xs" style={{ color: theme.muted }}>Preview image unavailable</div></>}
                        </div>
                      )}
                      {isSelected && <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-lg ring-4 ring-white/40" style={{ background: theme.accent, color: theme.accentText || '#fff' }}><Check size={18} strokeWidth={3} /></span>}
                    </button>
                  </section>
                );
              })}
            </div>

            <div className="shrink-0 px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-1 sm:px-7 sm:pb-6">
              <div className="mb-3 text-center"><h3 className="text-[19px] font-black tracking-[-.025em] text-[#10204b]">{selectedTheme.name}</h3><p className="mt-0.5 text-[12px] font-medium text-[#6a7ba5]">{selectedTheme.description.split('.')[0]}.</p></div>
              <div className="mb-3 flex items-center justify-center gap-1.5" aria-label="Current theme">{STOREFRONT_THEMES.map((theme, index) => <button key={theme.id} type="button" onClick={() => scrollToIndex(index)} aria-label={`Go to ${theme.name}`} className="h-2.5 w-2.5 rounded-full transition-all duration-200" style={{ background: selectedId === theme.id ? theme.accent : '#c8d5eb', transform: selectedId === theme.id ? 'scale(1.18)' : undefined }} />)}</div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <button type="button" onClick={() => scrollToIndex(selectedIndex - 1)} disabled={selectedIndex === 0} className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-bold text-[#35558f] shadow-[0_5px_18px_rgba(54,88,150,.10)] ring-1 ring-[#dfe8fa] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous theme"><ChevronLeft size={18} /><span className="hidden sm:inline">Previous</span></button>
                <p className="text-center text-[9px] font-semibold text-[#7283a8] sm:text-[10px]">Swipe left or right to preview themes</p>
                <button type="button" onClick={() => scrollToIndex(selectedIndex + 1)} disabled={selectedIndex === STOREFRONT_THEMES.length - 1} className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-bold text-[#35558f] shadow-[0_5px_18px_rgba(54,88,150,.10)] ring-1 ring-[#dfe8fa] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next theme"><span className="hidden sm:inline">Next</span><ChevronRight size={18} /></button>
              </div>
              <button type="button" onClick={saveTheme} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black uppercase tracking-[.04em] text-white shadow-[0_10px_24px_rgba(36,87,255,.25)] transition-all active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60" style={{ background: selectedTheme.accent }}><WandSparkles size={15} strokeWidth={2.5} />{saving ? 'Saving theme…' : `Use ${selectedTheme.name}`}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
