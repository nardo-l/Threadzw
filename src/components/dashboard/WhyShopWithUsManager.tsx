import React, { useMemo, useState } from 'react';
import { Check, ChevronRight, Lock, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useShopContext } from '../../context/ShopContext';
import { isPro } from '../../config/plans';

type WhyCard = { id: string; title: string; description: string; icon: string };
const ICONS = ['📍','🚚','⭐','🏪','💬','✨','🛍️','🔥'];
const FREE_TOTAL = 2;
const PRO_TOTAL = 6;

const getCards = (shop: any): WhyCard[] => {
  const configured = Array.isArray(shop?.page_config?.why_shop_cards) ? shop.page_config.why_shop_cards : [];
  const location = {
    id: 'location',
    title: 'Store Location',
    description: shop?.landmark || shop?.suburb || shop?.area || shop?.location || shop?.city
      ? `Located in ${shop.landmark || shop.suburb || shop.area || shop.location || shop.city}`
      : 'Add your shop location',
    icon: '📍'
  };
  const extras = configured.filter((c: WhyCard) => c?.id !== 'location').map((c: WhyCard) => ({
    id: c.id,
    title: c.title || 'Why shop with us',
    description: c.description || '',
    icon: c.icon || '✨'
  }));
  return [location, ...extras];
};

export const WhyShopWithUsManager: React.FC = () => {
  const { shop, refreshShop } = useShopContext();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<WhyCard | null>(null);
  const cards = useMemo(() => getCards(shop), [shop]);
  const pro = isPro(shop);
  const maxCards = pro ? PRO_TOTAL : FREE_TOTAL;

  const saveCards = async (nextCards: WhyCard[]) => {
    if (!shop?.id) return;
    setSaving(true);
    try {
      const currentConfig = shop.page_config || {};
      const { error } = await supabase.from('shops').update({
        page_config: { ...currentConfig, why_shop_cards: nextCards }
      }).eq('id', shop.id);
      if (error) throw error;
      await refreshShop();
      toast.success('Shop card saved');
    } catch (error: any) {
      console.error('Why Shop With Us save failed:', error);
      toast.error(error?.message || 'Could not save card');
    } finally {
      setSaving(false);
    }
  };

  const saveCard = async () => {
    if (!editing || !editing.title.trim() || !editing.description.trim()) {
      toast.error('Add a title and description first');
      return;
    }
    const next = editing.id === 'new'
      ? [...cards, { ...editing, id: `card-${Date.now()}` }]
      : cards.map(card => card.id === editing.id ? editing : card);
    await saveCards(next);
    setEditing(null);
  };

  const removeCard = async (id: string) => {
    if (id === 'location') return;
    await saveCards(cards.filter(card => card.id !== id));
  };

  if (!shop || shop.page_type !== 'clothing') return null;

  return (
    <>
      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#85B800]">Storefront</span>
            <h3 className="mt-1 text-base font-bold text-zinc-900">Why Shop With Us</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">Create the cards customers see on your storefront. Location is included by default.</p>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-black text-zinc-600">{cards.length}/{maxCards}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {cards.map(card => (
            <button key={card.id} type="button"
              onClick={() => card.id === 'location' ? toast.info('Location card is managed from your shop profile.') : setEditing(card)}
              className="group relative min-h-[150px] rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white">
              <span className="text-2xl">{card.icon}</span>
              <h4 className="mt-3 line-clamp-1 text-xs font-black text-zinc-900">{card.title}</h4>
              <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-zinc-500">{card.description}</p>
              {card.id === 'location'
                ? <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-1 text-[8px] font-black uppercase text-zinc-400 shadow-sm">Default</span>
                : <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-zinc-300 group-hover:text-black" />}
            </button>
          ))}

          {cards.length < maxCards && (
            <button type="button" onClick={() => setEditing({ id: 'new', title: '', description: '', icon: '✨' })}
              className="min-h-[150px] rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-4 text-left transition-all hover:border-[#CCFF00] hover:bg-[#fbfff0]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CCFF00] text-black"><Plus size={20} /></div>
              <h4 className="mt-4 text-xs font-black text-zinc-900">Create a card</h4>
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{pro ? 'Create up to 6 storefront cards.' : 'Free plan includes 1 extra card.'}</p>
            </button>
          )}

          {!pro && cards.length >= FREE_TOTAL && (
            <div className="min-h-[150px] rounded-2xl border border-zinc-200 bg-zinc-50 p-4 opacity-90">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 text-zinc-500"><Lock size={17} /></div>
              <h4 className="mt-4 text-xs font-black text-zinc-700">More cards with Pro</h4>
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">Pro lets you create up to 6 Why Shop With Us cards.</p>
            </div>
          )}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5">
          <div className="w-full max-w-md rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px]">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#85B800]">Storefront Card</span>
                <h3 className="mt-1 text-lg font-black">{editing.id === 'new' ? 'Create a card' : 'Edit card'}</h3>
              </div>
              <button onClick={() => setEditing(null)} className="rounded-full bg-zinc-100 p-2"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-zinc-500">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setEditing({ ...editing, icon })}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${editing.icon === icon ? 'border-[#CCFF00] bg-[#CCFF00]' : 'border-zinc-200 bg-zinc-50'}`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-zinc-500">Card title</label>
                <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. Nationwide Delivery" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm font-semibold outline-none focus:border-black" />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-zinc-500">Description</label>
                <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={4} placeholder="Tell customers why they should shop with you..." className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm font-semibold outline-none focus:border-black" />
              </div>
              <button disabled={saving} onClick={saveCard} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#CCFF00] py-3.5 text-sm font-black text-black disabled:opacity-50">
                {saving ? 'Saving...' : <><Check size={17} /> Save card</>}
              </button>
              {editing.id !== 'new' && editing.id !== 'location' && (
                <button disabled={saving} onClick={() => { setEditing(null); removeCard(editing.id); }} className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-red-600">
                  <Trash2 size={14} /> Delete card
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
