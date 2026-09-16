import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Palette, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { STOREFRONT_THEMES } from '../../config/storefrontThemes';

interface Props {
  shop: any;
}

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

function getThemeImage(themeId: string) {
  const filename = THEME_IMAGES[themeId];
  if (!filename) return '';
  return supabase.storage.from(THEME_BUCKET).getPublicUrl(filename).data.publicUrl;
}

export const ThemePickerLauncher: React.FC<Props> = ({ shop }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(
    shop?.page_config?.theme_id || STOREFRONT_THEMES[0].id
  );
  const carouselRef = useRef<HTMLDivElement>(null);

  const selectedIndex = useMemo(
    () => Math.max(0, STOREFRONT_THEMES.findIndex(theme => theme.id === selectedId)),
    [selectedId]
  );
  const selectedTheme = STOREFRONT_THEMES[selectedIndex] || STOREFRONT_THEMES[0];

  useEffect(() => {
    if (!open) return;

    const current = shop?.page_config?.theme_id || STOREFRONT_THEMES[0].id;
    setSelectedId(current);

    requestAnimationFrame(() => {
      const index = Math.max(0, STOREFRONT_THEMES.findIndex(theme => theme.id === current));
      carouselRef.current?.scrollTo({
        left: index * (carouselRef.current?.clientWidth || 1),
        behavior: 'auto',
      });
    });
  }, [open, shop?.page_config?.theme_id]);

  const scrollToIndex = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, STOREFRONT_THEMES.length - 1));
    setSelectedId(STOREFRONT_THEMES[safeIndex].id);
    carouselRef.current?.scrollTo({
      left: safeIndex * (carouselRef.current?.clientWidth || 1),
      behavior: 'smooth',
    });
  };

  const handleCarouselScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const index = Math.round(element.scrollLeft / Math.max(element.clientWidth, 1));
    const theme = STOREFRONT_THEMES[index];
    if (theme && theme.id !== selectedId) setSelectedId(theme.id);
  };

  const saveTheme = async () => {
    if (!shop?.id || saving) return;

    setSaving(true);
    try {
      const existing = shop.page_config && typeof shop.page_config === 'object'
        ? shop.page_config
        : {};
      const nextConfig = { ...existing, theme_id: selectedId };

      const { error } = await supabase
        .from('shops')
        .update({ page_config: nextConfig })
        .eq('id', shop.id);

      if (error) throw error;

      const { data: saved, error: verifyError } = await supabase
        .from('shops')
        .select('page_config')
        .eq('id', shop.id)
        .maybeSingle();

      if (verifyError) throw verifyError;
      if (saved?.page_config?.theme_id !== selectedId) {
        throw new Error('Theme selection was not persisted.');
      }

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
            <div className="flex h-11 w-11 shrink-0 -rotate-3 items-center justify-center rounded-xl bg-zinc-950 text-[#CCFF00]">
              <Palette size={20} />
            </div>
            <div className="min-w-0">
              <div className="mb-1">
                <span className="inline-flex -rotate-2 items-center gap-1 rounded-md bg-[#CCFF00] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-black">
                  <Sparkles size={9} /> New
                </span>
              </div>
              <h3 className="truncate text-sm font-black text-zinc-950">Choose your storefront theme</h3>
              <p className="mt-0.5 text-[11px] text-zinc-500">Swipe through the designs and choose your look.</p>
            </div>
          </div>
          <span className="shrink-0 -rotate-2 rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-black uppercase text-white group-hover:bg-[#CCFF00] group-hover:text-black">
            Choose →
          </span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] text-zinc-950"
          style={{ background: selectedTheme.background }}
          role="dialog"
          aria-modal="true"
          aria-label="Choose storefront theme"
        >
          <div className="mx-auto flex h-full w-full max-w-lg flex-col">
            <header
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ background: selectedTheme.surface, borderColor: selectedTheme.border }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center shadow-sm"
                style={{
                  background: selectedTheme.surfaceAlt,
                  color: selectedTheme.text,
                  borderRadius: selectedTheme.buttonRadius,
                }}
                aria-label="Close theme picker"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="text-center">
                <p
                  className="text-[9px] font-black uppercase tracking-[.22em]"
                  style={{ color: selectedTheme.accent }}
                >
                  Storefront themes
                </p>
                <h2 className="text-base font-black" style={{ color: selectedTheme.text }}>
                  Choose your look
                </h2>
              </div>

              <div className="text-right text-[10px] font-black" style={{ color: selectedTheme.muted }}>
                {selectedIndex + 1}/{STOREFRONT_THEMES.length}
              </div>
            </header>

            <div className="px-5 pt-4">
              <div className="flex gap-1.5" aria-label="Theme progress">
                {STOREFRONT_THEMES.map((theme, index) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => scrollToIndex(index)}
                    aria-label={`View ${theme.name}`}
                    className={`h-1.5 flex-1 transition-all ${selectedId === theme.id ? 'scale-y-150' : 'opacity-25'}`}
                    style={{ background: theme.accent, borderRadius: theme.buttonRadius }}
                  />
                ))}
              </div>
            </div>

            <div
              ref={carouselRef}
              className="mt-3 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-hide"
              onScroll={handleCarouselScroll}
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {STOREFRONT_THEMES.map((theme, index) => {
                const imageUrl = getThemeImage(theme.id);
                const isSelected = selectedId === theme.id;

                return (
                  <section
                    key={theme.id}
                    className="flex min-w-full snap-center flex-col items-center overflow-y-auto px-5 pb-5"
                  >
                    <div className="flex w-full flex-1 flex-col items-center justify-center py-2">
                      <div
                        className="relative w-full overflow-hidden border-2 bg-white shadow-2xl"
                        style={{
                          borderColor: isSelected ? theme.accent : theme.border,
                          borderRadius: theme.radius,
                          boxShadow: isSelected
                            ? `0 24px 60px ${theme.accent}45`
                            : `0 18px 45px ${theme.accent}18`,
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={`${theme.name} storefront theme preview`}
                          className="block h-auto max-h-[62vh] w-full object-contain"
                          draggable={false}
                          loading={index === selectedIndex ? 'eager' : 'lazy'}
                        />
                        {isSelected && (
                          <div
                            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
                            style={{ background: theme.accent, color: theme.accentText || '#fff' }}
                          >
                            <Check size={18} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className="mt-3 w-full rounded-2xl border p-4"
                      style={{
                        background: theme.surface,
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p
                            className="text-[9px] font-black uppercase tracking-[.18em]"
                            style={{ color: theme.accent }}
                          >
                            Theme {String(index + 1).padStart(2, '0')}
                          </p>
                          <h3 className="mt-1 text-lg font-black">{theme.name}</h3>
                          <p className="mt-1 text-[11px] leading-relaxed" style={{ color: theme.muted }}>
                            {theme.description}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5 pt-1">
                          {[theme.background, theme.surfaceAlt, theme.accent, theme.text].map(color => (
                            <span
                              key={color}
                              className="h-5 w-5 border border-black/10"
                              style={{ background: color, borderRadius: theme.buttonRadius }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="shrink-0 px-5 pb-5 pt-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => scrollToIndex(selectedIndex - 1)}
                  disabled={selectedIndex === 0}
                  className="flex h-10 w-10 items-center justify-center border shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    background: selectedTheme.surface,
                    borderColor: selectedTheme.border,
                    color: selectedTheme.text,
                    borderRadius: selectedTheme.buttonRadius,
                  }}
                  aria-label="Previous theme"
                >
                  <ChevronLeft size={18} />
                </button>

                <p className="text-center text-[10px] font-bold" style={{ color: selectedTheme.muted }}>
                  Swipe left or right to preview themes
                </p>

                <button
                  type="button"
                  onClick={() => scrollToIndex(selectedIndex + 1)}
                  disabled={selectedIndex === STOREFRONT_THEMES.length - 1}
                  className="flex h-10 w-10 items-center justify-center border shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    background: selectedTheme.surface,
                    borderColor: selectedTheme.border,
                    color: selectedTheme.text,
                    borderRadius: selectedTheme.buttonRadius,
                  }}
                  aria-label="Next theme"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={saveTheme}
                disabled={saving}
                className="w-full py-3.5 text-xs font-black uppercase tracking-wider shadow-lg transition-opacity disabled:opacity-60"
                style={{
                  background: selectedTheme.accent,
                  color: selectedTheme.accentText || '#fff',
                  borderRadius: selectedTheme.buttonRadius,
                }}
              >
                {saving ? 'Saving theme…' : `Use ${selectedTheme.name}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
