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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-3 py-3 backdrop-blur-sm sm:px-6 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Choose storefront theme"
        >
          <style>{`
            .theme-picker-carousel { scrollbar-width: none; -ms-overflow-style: none; }
            .theme-picker-carousel::-webkit-scrollbar { display: none; }
          `}</style>

          <div className="relative flex h-[min(94vh,860px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[38px] border-[7px] border-zinc-900 bg-[#faf9f5] shadow-[0_30px_100px_rgba(0,0,0,.5)]">
            <div className="pointer-events-none absolute left-1/2 top-1.5 z-30 h-6 w-28 -translate-x-1/2 rounded-full bg-black" />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <header className="relative flex items-center justify-between px-5 pb-2 pt-8">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-900 transition hover:bg-zinc-100 active:scale-95"
                  aria-label="Close theme picker"
                >
                  <ArrowLeft size={24} strokeWidth={2.4} />
                </button>

                <div className="absolute left-1/2 top-8 -translate-x-1/2">
                  <div className="text-[20px] font-black tracking-[-.06em] text-zinc-950">
                    THREAD<span className="text-[#C6FF00]">ZW</span>
                  </div>
                </div>

                <div className="flex h-9 min-w-[48px] items-center justify-center rounded-full bg-zinc-100 px-3 text-[11px] font-black text-zinc-600">
                  {selectedIndex + 1} / {STOREFRONT_THEMES.length}
                </div>
              </header>

              <section className="px-5 pt-3">
                <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#7fa500]">Storefront design</p>
                <h1 className="mt-1 text-[29px] font-black tracking-[-.055em] text-zinc-950">Choose Theme</h1>
                <p className="mt-1 max-w-[350px] text-[12px] leading-[1.45] text-zinc-500">
                  Give your storefront a fresh new look. Swipe through the themes and find the one that fits your style.
                </p>
              </section>

              <section className="mt-4">
                <div
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  className="theme-picker-carousel flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-8 py-1"
                  style={{ WebkitOverflowScrolling: 'touch', scrollPaddingInline: '32px' }}
                >
                  {STOREFRONT_THEMES.map((theme, index) => {
                    const imageFailed = failedImages[theme.id];
                    const isSelected = selectedId === theme.id;

                    return (
                      <button
                        key={theme.id}
                        type="button"
                        data-theme-index={index}
                        onClick={() => scrollToIndex(index)}
                        aria-label={`Select ${theme.name}`}
                        className="relative min-w-[calc(100%-32px)] snap-center overflow-hidden rounded-[25px] bg-white text-left"
                        style={{
                          border: `2px solid ${isSelected ? '#C6FF00' : '#e4e4df'}`,
                          boxShadow: isSelected ? '0 14px 34px rgba(0,0,0,.14)' : '0 8px 24px rgba(0,0,0,.07)',
                        }}
                      >
                        {!imageFailed ? (
                          <img
                            src={THEME_IMAGE_URLS[theme.id]}
                            alt={`${theme.name} storefront theme preview`}
                            className="block h-[305px] w-full object-contain bg-white"
                            draggable={false}
                            loading={Math.abs(index - selectedIndex) <= 1 ? 'eager' : 'lazy'}
                            onError={() => setFailedImages(current => ({ ...current, [theme.id]: true }))}
                          />
                        ) : (
                          <div
                            className="flex h-[305px] flex-col items-center justify-center px-8 text-center"
                            style={{ background: theme.background, color: theme.text }}
                          >
                            <div className="mb-3 h-12 w-12 rounded-full" style={{ background: theme.accent }} />
                            <div className="text-lg font-black">{theme.name}</div>
                            <div className="mt-1 text-xs" style={{ color: theme.muted }}>Preview image unavailable</div>
                          </div>
                        )}

                        {isSelected && (
                          <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#C6FF00] text-black shadow-lg">
                            <span className="text-lg font-black">✓</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5">
                  {STOREFRONT_THEMES.map((theme, index) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => scrollToIndex(index)}
                      aria-label={`View ${theme.name}`}
                      className={`h-1.5 rounded-full transition-all ${selectedId === theme.id ? 'w-6 bg-[#C6FF00]' : 'w-1.5 bg-zinc-300'}`}
                    />
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between px-5">
                  <button
                    type="button"
                    onClick={() => scrollToIndex(selectedIndex - 1)}
                    disabled={selectedIndex === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm disabled:opacity-25"
                    aria-label="Previous theme"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="text-center">
                    <h2 className="text-[17px] font-black tracking-[-.025em] text-zinc-950">{selectedTheme.name}</h2>
                    <p className="mt-0.5 max-w-[250px] text-[10px] leading-4 text-zinc-500">
                      {selectedTheme.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollToIndex(selectedIndex + 1)}
                    disabled={selectedIndex === STOREFRONT_THEMES.length - 1}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm disabled:opacity-25"
                    aria-label="Next theme"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </section>

              <section className="px-5 pb-3 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-400">All themes</p>
                    <p className="mt-0.5 text-[11px] font-medium text-zinc-500">Tap a preview to select it</p>
                  </div>
                  <span className="rounded-full bg-[#ecffb0] px-2.5 py-1 text-[9px] font-black text-[#5c7800]">8 STYLES</span>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {STOREFRONT_THEMES.map((theme, index) => {
                    const imageFailed = failedImages[theme.id];
                    const isSelected = selectedId === theme.id;

                    return (
                      <button
                        key={`thumb-${theme.id}`}
                        type="button"
                        onClick={() => scrollToIndex(index)}
                        className="group text-left"
                        aria-label={`Select ${theme.name}`}
                      >
                        <div
                          className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white transition-transform group-active:scale-95"
                          style={{
                            border: `2px solid ${isSelected ? '#C6FF00' : '#e5e5e0'}`,
                            boxShadow: isSelected ? '0 5px 16px rgba(198,255,0,.24)' : 'none',
                          }}
                        >
                          {!imageFailed ? (
                            <img
                              src={THEME_IMAGE_URLS[theme.id]}
                              alt=""
                              className="h-full w-full object-cover object-top"
                              draggable={false}
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center" style={{ background: theme.background }}>
                              <span className="h-5 w-5 rounded-full" style={{ background: theme.accent }} />
                            </div>
                          )}

                          {isSelected && (
                            <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C6FF00] text-[11px] font-black text-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 truncate text-[9px] font-bold text-zinc-700">{theme.name}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="shrink-0 border-t border-zinc-200 bg-[#faf9f5] px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                onClick={saveTheme}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C6FF00] py-3.5 text-sm font-black text-black shadow-[0_8px_24px_rgba(198,255,0,.25)] transition hover:bg-[#b8f000] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={saving ? 'Saving theme' : 'Save theme'}
              >
                <WandSparkles size={17} strokeWidth={2.7} />
                {saving ? 'Saving theme…' : 'Save Theme'}
                {!saving && <ChevronRight size={18} strokeWidth={2.8} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
