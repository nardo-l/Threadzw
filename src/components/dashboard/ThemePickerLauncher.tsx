import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Palette, Sparkles, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export type ThreadzwTheme = {
  id: string;
  name: string;
  description: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
};

export const THREADZW_THEMES: ThreadzwTheme[] = [
  { id: 'editorial-noir', name: 'Editorial Noir', description: 'High-fashion black & white', accent: '#111111', background: '#f5f5f3', surface: '#ffffff', text: '#111111', muted: '#737373' },
  { id: 'soft-studio', name: 'Soft Studio', description: 'Warm cream fashion editorial', accent: '#b88a62', background: '#f7f1e8', surface: '#fffaf2', text: '#2a241f', muted: '#8d8074' },
  { id: 'gallery-minimal', name: 'Gallery Minimal', description: 'Clean, quiet and premium', accent: '#6b7280', background: '#f4f5f6', surface: '#ffffff', text: '#15171a', muted: '#7b8087' },
  { id: 'street-archive', name: 'Street Archive', description: 'Dark streetwear with red', accent: '#d92d20', background: '#111111', surface: '#1b1b1b', text: '#ffffff', muted: '#a3a3a3' },
  { id: 'cobalt-club', name: 'Cobalt Club', description: 'Bold electric blue energy', accent: '#2457ff', background: '#eef3ff', surface: '#ffffff', text: '#101936', muted: '#64709a' },
  { id: 'sage-atelier', name: 'Sage Atelier', description: 'Calm natural luxury', accent: '#6f7f63', background: '#f1f3ed', surface: '#fbfcf9', text: '#20261e', muted: '#77806f' },
  { id: 'cherry-pop', name: 'Cherry Pop', description: 'Playful red and blush', accent: '#e5485d', background: '#fff0f2', surface: '#ffffff', text: '#281417', muted: '#8d686e' },
  { id: 'earth-utility', name: 'Earth Utility', description: 'Olive, stone and workwear', accent: '#6f6a45', background: '#ece9de', surface: '#f8f6ef', text: '#25251e', muted: '#777463' },
];

interface Props {
  shop: any;
}

export const ThemePickerLauncher: React.FC<Props> = ({ shop }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const currentThemeId = shop?.page_config?.theme_id || 'editorial-noir';
  const [selectedId, setSelectedId] = useState(currentThemeId);

  const selectedIndex = useMemo(() => Math.max(0, THREADZW_THEMES.findIndex(theme => theme.id === selectedId)), [selectedId]);
  const selectedTheme = THREADZW_THEMES[selectedIndex] || THREADZW_THEMES[0];

  const move = (direction: number) => {
    const next = (selectedIndex + direction + THREADZW_THEMES.length) % THREADZW_THEMES.length;
    setSelectedId(THREADZW_THEMES[next].id);
  };

  const saveTheme = async () => {
    if (!shop?.id || saving) return;
    setSaving(true);
    try {
      const existingConfig = shop.page_config && typeof shop.page_config === 'object' ? shop.page_config : {};
      const { error } = await supabase
        .from('shops')
        .update({ page_config: { ...existingConfig, theme_id: selectedId } })
        .eq('id', shop.id);

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
      <button
        type="button"
        onClick={() => { setSelectedId(currentThemeId); setOpen(true); }}
        className="group relative w-full overflow-hidden rounded-2xl border border-black bg-white p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
      >
        <div className="absolute -right-7 -top-8 h-24 w-24 rotate-12 rounded-3xl bg-[#CCFF00] opacity-80" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 -rotate-3 items-center justify-center rounded-xl bg-zinc-950 text-[#CCFF00] shadow-sm">
              <Palette size={20} />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex -rotate-2 items-center gap-1 rounded-md bg-[#CCFF00] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-black">
                  <Sparkles size={9} /> New
                </span>
              </div>
              <h3 className="truncate text-sm font-black text-zinc-950">Choose your storefront theme</h3>
              <p className="mt-0.5 text-[11px] text-zinc-500">Make your shop look like your brand.</p>
            </div>
          </div>
          <span className="shrink-0 -rotate-2 rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white transition-colors group-hover:bg-[#CCFF00] group-hover:text-black">
            Choose →
          </span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Choose storefront theme">
          <div className="w-full max-w-lg overflow-hidden rounded-t-[28px] bg-[#f7f7f5] shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Storefront design</p>
                <h2 className="text-xl font-black tracking-tight text-zinc-950">Choose your theme</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-700" aria-label="Close theme picker"><X size={18} /></button>
            </div>

            <div className="px-4 pb-5 pt-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-xs font-medium text-zinc-500">Swipe through the styles</p>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{selectedIndex + 1} / {THREADZW_THEMES.length}</span>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-[24px]">
                  <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-hide" onScroll={(event) => {
                    const element = event.currentTarget;
                    const index = Math.round(element.scrollLeft / Math.max(element.clientWidth, 1));
                    if (THREADZW_THEMES[index]) setSelectedId(THREADZW_THEMES[index].id);
                  }}>
                    {THREADZW_THEMES.map(theme => (
                      <button
                        type="button"
                        key={theme.id}
                        onClick={() => setSelectedId(theme.id)}
                        className="min-w-full snap-center p-3 text-left"
                        aria-label={`Select ${theme.name}`}
                      >
                        <div className="overflow-hidden rounded-[22px] border border-black/10 bg-white shadow-lg" style={{ background: theme.background }}>
                          <div className="p-4 pb-2" style={{ color: theme.text }}>
                            <div className="flex items-center justify-between">
                              <div className="h-2.5 w-16 rounded-full" style={{ background: theme.text }} />
                              <div className="h-7 w-7 rounded-full" style={{ background: theme.accent }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                            {[1, 2, 3, 4].map(index => (
                              <div key={index} className="aspect-[0.85] overflow-hidden rounded-xl border border-black/5" style={{ background: theme.surface }}>
                                <div className="h-[68%] w-full" style={{ background: index % 2 ? theme.accent : theme.muted, opacity: index % 2 ? 0.14 : 0.1 }} />
                                <div className="space-y-1 p-2">
                                  <div className="h-1.5 w-2/3 rounded-full" style={{ background: theme.text, opacity: 0.72 }} />
                                  <div className="h-1.5 w-1/3 rounded-full" style={{ background: theme.muted, opacity: 0.65 }} />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between border-t border-black/5 px-4 py-3" style={{ color: theme.text }}>
                            <div><p className="text-sm font-black">{theme.name}</p><p className="text-[10px]" style={{ color: theme.muted }}>{theme.description}</p></div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: theme.accent, color: theme.background }}><Check size={16} /></div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button type="button" onClick={() => move(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 shadow-md" aria-label="Previous theme"><ChevronLeft size={18} /></button>
                <button type="button" onClick={() => move(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 shadow-md" aria-label="Next theme"><ChevronRight size={18} /></button>
              </div>

              <div className="mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {THREADZW_THEMES.map(theme => (
                  <button key={theme.id} type="button" onClick={() => setSelectedId(theme.id)} className={`h-8 min-w-8 rounded-full border-2 transition-transform ${selectedId === theme.id ? 'scale-110 border-black' : 'border-white'}`} style={{ background: theme.accent }} aria-label={theme.name} />
                ))}
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={saveTheme}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-zinc-950 text-sm font-black text-white transition hover:bg-[#CCFF00] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
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
