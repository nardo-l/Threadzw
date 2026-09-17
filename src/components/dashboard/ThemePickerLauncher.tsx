import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Palette, Sparkles, WandSparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { STOREFRONT_THEMES } from '../../config/storefrontThemes';

interface Props { shop: any; }

const THEME_IMAGE_URLS: Record<string, string> = {
  'editorial-noir': 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/sample%20themes/01_Editorial_Noir.png',
  'soft-studio': 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/sample%20themes/02_Soft_Studio.png',
  'gallery-minimal': 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/sample%20themes/03_Gallery_Minimal.png',
  'street-archive': 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/sample%20themes/04_Street_Archive.png',
  'cobalt-club': 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/sample%20themes/05_Cobalt_Club.png',
  'sage-atelier': 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/sample%20themes/06_Sage_Atelier.png',
  'cherry-pop': 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/sample%20themes/07_Cherry_Pop.png',
  'earth-utility': 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/sample%20themes/08_Earth_Utility.png',
};

export const ThemePickerLauncher: React.FC<Props> = ({ shop }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState(shop?.page_config?.theme_id || STOREFRONT_THEMES[0].id);
  const carouselRef = useRef<HTMLDivElement>(null);

  const selectedIndex = useMemo(
    () => Math.max(0, STOREFRONT_THEMES.findIndex(theme => theme.id === selectedId)),
    [selectedId]
  );
  const selectedTheme = STOREFRONT_THEMES[selectedIndex] || STOREFRONT_THEMES[0];

  useEffect(() => {
    if (!open) return;
    const current = shop?.page_config?.theme_id || STOREFRONT_THEMES[0].id;
    const index = Math.max(0, STOREFRONT_THEMES.findIndex(theme => theme.id === current));
    setSelectedId(STOREFRONT_THEMES[index].id);
    setFailedImages({});

    requestAnimationFrame(() => {
      carouselRef.current
        ?.querySelector<HTMLElement>(`[data-theme-index="${index}"]`)
        ?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    });
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
    carouselRef.current
      ?.querySelector<HTMLElement>(`[data-theme-index="${safeIndex}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const handleCarouselScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const slides = Array.from(container.querySelectorAll<HTMLElement>('[data-theme-index]'));
    if (!slides.length) return;

    const center = container.scrollLeft + container.clientWidth / 2;
    const closestIndex = slides.reduce((nearest, slide, index) => {
      const nearestDistance = Math.abs(center - (slides[nearest].offsetLeft + slides[nearest].offsetWidth / 2));
      const distance = Math.abs(center - (slide.offsetLeft + slide.offsetWidth / 2));
      return distance < nearestDistance ? index : nearest;
    }, 0);

    const theme = STOREFRONT_THEMES[closestIndex];
    if (theme && theme.id !== selectedId) setSelectedId(theme.id);
  };

  const saveTheme = async () => {
    if (!shop?.id || saving) return;
    setSaving(true);

    try {
      const existing = shop.page_config && typeof shop.page_config === 'object' ? shop.page_config : {};
      const { error } = await supabase
        .from('shops')
        .update({ page_config: { ...existing, theme_id: selectedId } })
        .eq('id', shop.id);
      if (error) throw error;

      const { data: saved, error: verifyError } = await supabase
        .from('shops')
        .select('page_config')
        .eq('id', shop.id)
        .maybeSingle();
      if (verifyError) throw verifyError;
      if (saved?.page_config?.theme_id !== selectedId) throw new Error('Theme selection was not persisted.');

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full overflow-hidden rounded-2xl border border-black bg-white p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[.99]"
      >
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
        <div
          className="fixed inset-0 z-[100] overflow-hidden text-[#10204b]"
          style={{ background: 'linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Choose storefront theme"
        >
          <style>{`
            .theme-picker-carousel { scrollbar-width: none; -ms-overflow-style: none; }
            .theme-picker-carousel::-webkit-scrollbar { display: none; }
          `}</style>
          <div className="mx-auto flex h-full w-full max-w-[720px] flex-col">
            <header className="relative flex shrink-0 items-center justify-between px-4 pb-3 pt-4 sm:px-8 sm:pb-5 sm:pt-6">
              <button type="button" onClick={() => setOpen(false)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#10204b] shadow-[0_7px_22px_rgba(54,88,150,.13)] ring-1 ring-[#e2eafb] sm:h-16 sm:w-16" aria-label="Close theme picker"><ArrowLeft size={25} strokeWidth={2.3} /></button>
              <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center sm:top-6">
                <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#1d55f5] sm:text-[13px]">Storefront themes</p>
                <h2 className="mt-0.5 whitespace-nowrap text-[20px] font-black tracking-[-.04em] text-[#10204b] sm:text-[31px]">Choose your look</h2>
              </div>
              <div className="flex h-12 min-w-[56px] items-center justify-center rounded-2xl bg-white px-3 text-[12px] font-black text-[#18346f] shadow-[0_7px_22px_rgba(54,88,150,.13)] ring-1 ring-[#e2eafb] sm:h-16 sm:min-w-[78px] sm:text-[16px]">{selectedIndex + 1}/{STOREFRONT_THEMES.length}</div>
            </header>

            <div className="shrink-0 px-5 pt-1 sm:px-12">
              <p className="mx-auto mb-4 max-w-[460px] text-center text-[12px] font-medium leading-5 text-[#5871ad] sm:text-[18px] sm:leading-7">Swipe through the themes and find the perfect style for your storefront.</p>
              <div className="flex gap-2.5 sm:gap-4" aria-label="Theme progress">
                {STOREFRONT_THEMES.map((theme, index) => (
                  <button key={theme.id} type="button" onClick={() => scrollToIndex(index)} aria-label={`View ${theme.name}`} className="h-1.5 flex-1 rounded-full transition-all duration-200 sm:h-2.5" style={{ background: selectedId === theme.id ? '#1d55f5' : '#b8c9e9', transform: selectedId === theme.id ? 'scaleY(1.3)' : undefined }} />
                ))}
              </div>
            </div>

            <div ref={carouselRef} onScroll={handleCarouselScroll} className="theme-picker-carousel mt-3 flex min-h-0 flex-1 snap-x snap-mandatory items-center gap-4 overflow-x-auto overscroll-x-contain px-[10%] py-2 sm:mt-5 sm:gap-7" style={{ WebkitOverflowScrolling: 'touch', scrollPaddingInline: '10%' }}>
              {STOREFRONT_THEMES.map((theme, index) => {
                const imageFailed = failedImages[theme.id];
                const isSelected = selectedId === theme.id;

                return (
                  <section key={theme.id} data-theme-index={index} className="flex min-w-[80%] snap-center flex-col items-center justify-center sm:min-w-[76%]">
                    <button
                      type="button"
                      onClick={() => scrollToIndex(index)}
                      aria-label={`Select ${theme.name}`}
                      className="relative block min-h-[300px] w-full overflow-hidden rounded-[25px] bg-white text-left transition-all duration-300 sm:min-h-[380px] sm:rounded-[34px]"
                      style={{ border: `2px solid ${isSelected ? '#1d55f5' : '#d6e0f2'}`, boxShadow: isSelected ? '0 20px 50px rgba(29,85,245,.28), 0 6px 18px rgba(45,72,120,.10)' : '0 10px 28px rgba(45,72,120,.10)', transform: isSelected ? 'scale(1)' : 'scale(.94)' }}
                    >
                      {!imageFailed ? (
                        <img
                          src={THEME_IMAGE_URLS[theme.id]}
                          alt={`${theme.name} storefront theme preview`}
                          className="block h-auto min-h-[300px] w-full object-contain sm:min-h-[380px]"
                          style={{ maxHeight: '58vh', opacity: 1 }}
                          draggable={false}
                          loading={Math.abs(index - selectedIndex) <= 1 ? 'eager' : 'lazy'}
                          onError={() => setFailedImages(current => ({ ...current, [theme.id]: true }))}
                        />
                      ) : (
                        <div className="flex min-h-[300px] w-full flex-col items-center justify-center px-8 text-center sm:min-h-[380px]" style={{ background: theme.background, color: theme.text }}>
                          <div className="mb-3 h-12 w-12 rounded-full" style={{ background: theme.accent }} />
                          <div className="text-lg font-black">{theme.name}</div>
                          <div className="mt-1 text-xs" style={{ color: theme.muted }}>Preview image unavailable</div>
                        </div>
                      )}
                    </button>
                  </section>
                );
              })}
            </div>

            <div className="shrink-0 px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-1 sm:px-8 sm:pb-8">
              <div className="mb-3 text-center sm:mb-5">
                <h3 className="text-[20px] font-black tracking-[-.03em] text-[#10204b] sm:text-[28px]">{selectedTheme.name}</h3>
                <p className="mt-0.5 text-[12px] font-medium text-[#6a7ba5] sm:text-[17px]">{selectedTheme.description.split('.')[0]}.</p>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
                <button type="button" onClick={() => scrollToIndex(selectedIndex - 1)} disabled={selectedIndex === 0} className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-3 text-xs font-bold text-[#35558f] shadow-[0_5px_18px_rgba(54,88,150,.10)] ring-1 ring-[#dfe8fa] disabled:cursor-not-allowed disabled:opacity-40 sm:h-14 sm:px-5 sm:text-base" aria-label="Previous theme"><ChevronLeft size={21} /><span>Previous</span></button>
                <button type="button" onClick={() => scrollToIndex(selectedIndex + 1)} disabled={selectedIndex === STOREFRONT_THEMES.length - 1} className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-3 text-xs font-bold text-[#35558f] shadow-[0_5px_18px_rgba(54,88,150,.10)] ring-1 ring-[#dfe8fa] disabled:cursor-not-allowed disabled:opacity-40 sm:h-14 sm:px-5 sm:text-base" aria-label="Next theme"><span>Next</span><ChevronRight size={21} /></button>
              </div>
              <button type="button" onClick={saveTheme} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1d55f5] py-3.5 text-xs font-black uppercase tracking-[.04em] text-white shadow-[0_10px_24px_rgba(29,85,245,.25)] transition-all active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-[22px] sm:py-5 sm:text-[17px]" aria-label={saving ? 'Saving theme' : 'Use this theme'}><WandSparkles size={18} strokeWidth={2.6} />{saving ? 'Saving theme…' : 'Use this theme'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
