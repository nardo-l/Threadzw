import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  MoreVertical, 
  Plus, 
  Share2, 
  Maximize2,
  Sparkles,
  Trash2,
  Download,
  Shirt,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

// --- Constants ---
const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  caps: ['Facecaps', 'Beanies', 'Bucket Hats'],
  tops: ['Shirts', 'Tees', 'Polos'],
  hoodies: ['Pullover', 'Zip-Up'],
  pants: ['Trousers', 'Jeans', 'Shorts'],
  shoes: ['Sneakers', 'Boots'],
  accessories: ['Chains', 'Jewelry', 'Watches']
};

const CATEGORY_ORDER = ['caps', 'tops', 'hoodies', 'pants', 'shoes', 'accessories'];

// --- Types ---
interface ClothingItem {
  id: string;
  category_id: string;
  name: string;
  brand: string;
  image_url: string;
  style_tags?: string[];
  clothing_categories?: {
    name: string;
    display_name: string;
  };
}

interface ClothingCategory {
  id: string;
  name: string;
  display_name: string;
}

interface CanvasItems {
  [categoryName: string]: ClothingItem | null;
}

export const BuildAFitView: React.FC = () => {
  const { session } = useAuth();
  const { setBuyerFlowState } = useInventory();
  
  // States
  const [categories, setCategories] = useState<ClothingCategory[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<{ [key: string]: ClothingItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [canvasItems, setCanvasItems] = useState<CanvasItems>({
    caps: null,
    tops: null,
    hoodies: null,
    pants: null,
    shoes: null,
    accessories: null
  });

  const [activeCategory, setActiveCategory] = useState('caps');
  const [showOptions, setShowOptions] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [savedBuild, setSavedBuild] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: cats, error: catErr } = await supabase
          .from('clothing_categories')
          .select('*')
          .eq('is_active', true);
        
        if (catErr) throw catErr;

        const sortedCats = (cats || []).sort((a, b) => {
          const idxA = CATEGORY_ORDER.indexOf(a.name);
          const idxB = CATEGORY_ORDER.indexOf(b.name);
          return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });
        setCategories(sortedCats);

        const { data: items, error: itemErr } = await supabase
          .from('clothing_items')
          .select(`
            *,
            clothing_categories (
              id, name, display_name
            )
          `)
          .eq('is_active', true);
        
        if (itemErr) throw itemErr;

        const grouped: { [key: string]: ClothingItem[] } = {};
        (items || []).forEach(item => {
          const catName = item.clothing_categories?.name || 'other';
          if (!grouped[catName]) grouped[catName] = [];
          grouped[catName].push(item);
        });
        setItemsByCategory(grouped);

      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Failed to load pieces');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleItem = (categoryName: string, item: ClothingItem) => {
    setCanvasItems(prev => ({
      ...prev,
      [categoryName]: prev[categoryName]?.id === item.id ? null : item
    }));
  };

  const clearCanvas = () => {
    setCanvasItems({
      caps: null,
      tops: null,
      hoodies: null,
      pants: null,
      shoes: null,
      accessories: null
    });
    toast.success('Workspace cleared');
  };

  const randomizeFit = () => {
    const newCanvas: CanvasItems = {};
    CATEGORY_ORDER.forEach(cat => {
      const catItems = itemsByCategory[cat] || [];
      newCanvas[cat] = catItems.length
        ? catItems[Math.floor(Math.random() * catItems.length)]
        : null;
    });
    setCanvasItems(newCanvas);
    toast('Fresh fit generated 🎲');
  };

  const selectedCount = Object.values(canvasItems).filter(Boolean).length;

  const handleSaveOutfit = async () => {
    if (selectedCount === 0) {
      toast.error('Add items to your canvas');
      return;
    }
    if (!session?.user?.id) {
      toast.error('Sign in to save pieces');
      return;
    }

    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      const shareEl = document.getElementById('fit-share-card');
      if (!shareEl) throw new Error('Preview not found');

      const canvas = await html2canvas(shareEl, {
        scale: 3,
        backgroundColor: '#FFFFFF',
        useCORS: true,
        logging: false
      });

      const imageData = canvas.toDataURL('image/png');
      const parts = imageData.split(',');
      const byteCharacters = atob(parts[1]);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      const blob = new Blob(byteArrays, { type: 'image/png' });
      
      const fileName = `${session.user.id}/outfit_${Date.now()}.png`;
      await supabase.storage.from('outfit-builds').upload(fileName, blob);
      const { data: urlData } = supabase.storage.from('outfit-builds').getPublicUrl(fileName);

      const { data: build, error: dbErr } = await supabase
        .from('outfit_builds')
        .insert({
          user_id: session.user.id,
          title: 'Premium Moodboard',
          canvas_items: canvasItems,
          thumbnail_url: urlData.publicUrl,
          is_public: true
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      setSavedBuild(build);
      setShowSaveSheet(true);
    } catch (err: any) {
      console.error(err);
      toast.error('Could not export moodboard');
    } finally {
      setSaving(false);
    }
  };

  const handlePostToFeed = async () => {
    if (!savedBuild || !session?.user?.id) return;
    setPosting(true);
    try {
      const { error } = await supabase.from('fashion_posts').insert({
        user_id: session.user.id,
        caption: 'Moodboard concept. #ThreadZW #Editorial #Culture',
        images: [savedBuild.thumbnail_url],
        post_type: 'build_a_fit',
        town: localStorage.getItem('thread_user_town') || 'Harare',
        is_active: true
      });
      if (error) throw error;
      toast.success('Editorial posted!');
      setShowSaveSheet(false);
      setBuyerFlowState('feed');
    } catch (err: any) {
      toast.error('Failed to publish');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col font-sans overflow-hidden">
      {/* Immersive Header */}
      <header className="px-6 h-24 flex items-center justify-between z-50 bg-[#0A0A0A] border-b border-white/5">
        <button onClick={() => setBuyerFlowState('home')} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10 active:scale-95 transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 mb-1">Creative Suite</span>
          <h1 className="text-[17px] font-bold tracking-tight uppercase">Build-A-Fit</h1>
        </div>
        <button onClick={() => setShowOptions(true)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10 active:scale-95 transition-all">
          <MoreVertical size={24} />
        </button>
      </header>

      {/* Main Canvas - Studio Style */}
      <div className="flex-1 relative overflow-hidden px-6 py-6">
        <div className="w-full h-full bg-[#111111] rounded-[48px] relative overflow-hidden group border border-white/5">
          {/* Precise Grid Background */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div id="fit-share-card" className="absolute inset-0 p-12 flex flex-col items-center justify-center bg-[#111111]">
            <AnimatePresence mode="popLayout">
              <div className="flex flex-wrap items-center justify-center gap-12 max-w-full">
                {CATEGORY_ORDER.map(cat => canvasItems[cat] && (
                  <motion.div
                    key={cat}
                    layoutId={`canvas-${cat}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group/piece"
                  >
                    <img 
                      src={canvasItems[cat]?.image_url} 
                      className={`h-[180px] w-auto object-contain transition-transform duration-700 hover:scale-105 ${cat === 'caps' ? 'h-[110px]' : cat === 'shoes' ? 'h-[150px]' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={() => toggleItem(cat, canvasItems[cat]!)}
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover/piece:opacity-100 transition-all shadow-lg active:scale-90"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {selectedCount === 0 && (
              <div className="flex flex-col items-center opacity-10">
                <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-6">
                   <Shirt size={64} strokeWidth={1.5} />
                </div>
                <p className="font-bold text-[13px] tracking-[0.3em] uppercase">Add pieces to start</p>
              </div>
            )}
          </div>

          {/* Floating Action Menu */}
          <div className="absolute bottom-10 right-10 flex flex-col gap-5">
            <button 
               onClick={randomizeFit}
               className="w-16 h-16 rounded-[24px] bg-white text-black flex items-center justify-center shadow-xl hover:shadow-2xl active:scale-90 transition-all"
            >
               <Sparkles size={28} className="text-[#FF5FA2]" />
            </button>
            <button 
               onClick={handleSaveOutfit}
               disabled={saving}
               className="w-16 h-16 rounded-[24px] bg-[#FF5FA2] text-white flex items-center justify-center shadow-xl hover:shadow-2xl active:scale-95 transition-all disabled:opacity-50"
            >
               {saving ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={32} strokeWidth={3} />}
            </button>
          </div>
        </div>
      </div>

      {/* Selection Library */}
      <div className="h-[360px] bg-[#111111] px-8 pt-10 pb-16 z-40 border-t border-white/5">
         <div className="flex items-center justify-between mb-10 overflow-x-auto no-scrollbar pb-2">
            <div className="flex gap-8">
               {CATEGORY_ORDER.map(cat => (
                 <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[13px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeCategory === cat ? 'text-white' : 'text-white/20'}`}
                 >
                   {cat}
                   {activeCategory === cat && (
                     <motion.div layoutId="cat-indicator" className="absolute -bottom-2 left-0 right-0 h-1 bg-[#FF5FA2] rounded-full" />
                   )}
                 </button>
               ))}
            </div>
         </div>

         <div className="flex items-end gap-10 overflow-x-auto no-scrollbar pb-6 min-h-[160px]">
            {loading ? (
              <div className="flex gap-8">
                {[1,2,3,4].map(i => <div key={`library-pulse-${i}`} className="w-[140px] h-[160px] bg-white/5 rounded-3xl animate-pulse" />)}
              </div>
            ) : (
              itemsByCategory[activeCategory]?.map(item => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleItem(activeCategory, item)}
                  className={`shrink-0 w-[160px] relative transition-all duration-300 group  ${canvasItems[activeCategory]?.id === item.id ? 'opacity-30' : 'opacity-100'}`}
                >
                  <img src={item.image_url} className="w-full h-auto object-contain transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                  {canvasItems[activeCategory]?.id === item.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="bg-white text-black p-3 rounded-full shadow-lg">
                          <Check size={20} strokeWidth={3} />
                       </div>
                    </div>
                  )}
                </motion.button>
              ))
            )}
            {!loading && (!itemsByCategory[activeCategory] || itemsByCategory[activeCategory].length === 0) && (
              <div className="w-full py-10 text-center">
                 <p className="text-[#CCCCCC] text-[11px] font-bold tracking-[0.2em] uppercase italic">Inventory clearing... new drops soon</p>
              </div>
            )}
         </div>
      </div>

      {/* Transitions & Overlays */}
      <AnimatePresence>
        {showOptions && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOptions(false)} className="absolute inset-0 bg-[#111111]/40 backdrop-blur-md" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-[440px] bg-white rounded-t-[48px] p-10 pb-16 shadow-2xl border border-[#EFEFEF]">
              <div className="w-12 h-1.5 bg-[#EFEFEF] rounded-full mx-auto mb-10" />
              <div className="space-y-4">
                <button onClick={() => { handleSaveOutfit(); setShowOptions(false); }} className="w-full h-18 bg-[#F5F5F5] rounded-3xl flex items-center px-8 gap-5 text-[#111111] font-bold active:scale-[0.98] transition-all">
                   <div className="w-12 h-12 rounded-2xl bg-white border border-[#EFEFEF] flex items-center justify-center text-[#FF2D78] shadow-sm"><Sparkles size={24} /></div>
                   <span className="text-[17px] tracking-tight">Export Editorial</span>
                </button>
                <button onClick={() => { clearCanvas(); setShowOptions(false); }} className="w-full h-18 bg-[#F5F5F5] rounded-3xl flex items-center px-8 gap-5 text-[#FF2D78] font-bold active:scale-[0.98] transition-all">
                   <div className="w-12 h-12 rounded-2xl bg-white border border-[#EFEFEF] flex items-center justify-center"><Trash2 size={24} /></div>
                   <span className="text-[17px] tracking-tight text-red-500">Clear Studio Workspace</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSaveSheet && savedBuild && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSaveSheet(false)} className="absolute inset-0 bg-[#111111]/60 backdrop-blur-xl" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-[480px] bg-white rounded-t-[56px] p-12 pb-20 shadow-2xl text-center border border-[#EFEFEF]">
              <div className="w-14 h-1.5 bg-[#EFEFEF] rounded-full mx-auto mb-12" />
              
              <div className="w-full aspect-[4/5] bg-white rounded-[40px] mx-auto overflow-hidden relative shadow-2xl border border-[#EFEFEF] p-10 mb-12">
                <img src={savedBuild.thumbnail_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              
              <h2 className="text-[34px] font-bold tracking-tighter text-[#111111] mb-4">Moodboard Captured</h2>
              <p className="text-[#888888] text-[15px] leading-relaxed mb-12 px-8 font-medium">Your creative vision has been rendered and is ready for the culture.</p>
              
              <div className="grid grid-cols-2 gap-5">
                 <button 
                  onClick={handlePostToFeed}
                  disabled={posting}
                  className="h-18 bg-[#FF2D78] text-white rounded-[28px] font-bold text-[15px] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-pink-500/20"
                 >
                   {posting ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <span>PUBLISH TO FEED</span>}
                 </button>
                 <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = savedBuild.thumbnail_url;
                    link.download = 'moodboard.png';
                    link.click();
                  }}
                  className="h-18 bg-[#F5F5F5] text-[#111111] rounded-[28px] font-bold text-[15px] active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   <Download size={24} />
                   <span>SAVE TO STUDIO</span>
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Helper Components ---

const CategorySection = ({ category, items, activeSub, onSubClick, selectedItem, onItemSelect }: any) => {
  const filteredItems = useMemo(() => {
    if (!activeSub || activeSub === 'All') return items;
    // For demo/prototype, we'll try to find items with the style tag or just show all if none match
    const matching = items.filter((i: any) => i.style_tags?.includes(activeSub));
    return matching.length > 0 ? matching : items;
  }, [items, activeSub]);

  const subcats = CATEGORY_SUBCATEGORIES[category.name] || ['All'];

  return (
    <section className="bg-white mb-2 py-6 overflow-hidden">
      <div className="px-5 mb-3">
        <span className="block text-[#AAAAAA] text-[11px] uppercase tracking-[2.5px] font-medium mb-1">
          {category.display_name}
        </span>
        
        <div className="flex items-baseline overflow-x-auto no-scrollbar gap-4 pr-5">
          {subcats.map(sub => (
            <button
              key={sub}
              onClick={() => onSubClick(sub)}
              className="shrink-0 transition-all duration-300"
              style={{
                fontSize: activeSub === sub ? 28 : 22,
                fontWeight: activeSub === sub ? '800' : '700',
                color: activeSub === sub ? '#111111' : '#CCCCCC',
                letterSpacing: '-0.5px',
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                lineHeight: 1.1
              }}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-1.5 overflow-x-auto no-scrollbar px-5 mt-4 min-h-[140px]">
        {items.length === 0 ? (
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={`empty-pulse-${i}`} className="w-[110px] h-[130px] bg-[#F8F8F8] border-[1.5px] border-dashed border-[#E0E0E0] rounded-xl flex flex-col items-center justify-center shrink-0">
                <span className="text-2xl mb-1 opacity-20">📦</span>
                <span className="text-[#CCC] text-[10px] font-bold">Coming soon</span>
              </div>
            ))}
          </div>
        ) : (
          filteredItems.map((item: any) => (
            <ItemComponent 
              key={item.id}
              item={item}
              category={category.name}
              isSelected={selectedItem?.id === item.id}
              onClick={() => onItemSelect(item)}
            />
          ))
        )}
      </div>
    </section>
  );
};

const ItemComponent = ({ item, category, isSelected, onClick }: any) => {
  const width = category === 'tops' || category === 'hoodies' ? '130px' : 
                category === 'pants' ? '110px' :
                category === 'shoes' ? '120px' :
                category === 'caps' ? '100px' : '90px';

  return (
    <div className="relative shrink-0 flex flex-col items-center" style={{ width }}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="w-full h-auto cursor-pointer relative"
      >
        <img 
          src={item.image_url} 
          className="w-full h-auto object-contain transition-all duration-300"
          style={{
            filter: isSelected ? 'drop-shadow(0 8px 20px rgba(255,95,162,0.45))' : 'brightness(1)',
          }}
          alt="" 
        />
        {isSelected && (
          <motion.div 
            layoutId="selection-dot"
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#FF5FA2] rounded-full shadow-sm"
          />
        )}
      </motion.button>
    </div>
  );
};

const Modal = ({ children, onClose, title }: any) => (
  <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
    />
    <motion.div 
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      className="relative w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-12 shadow-2xl"
    >
      <div className="w-12 h-1.5 bg-[#EFEFEF] rounded-full mx-auto mb-8" />
      {title && <h2 className="text-xl font-bold text-[#111111] mb-6 tracking-tight">{title}</h2>}
      {children}
    </motion.div>
  </div>
);

const SuccessSheet = ({ build, onShare, onPost, posting, onClose }: any) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="relative w-full max-w-[430px] bg-white rounded-t-[36px] p-6 pb-12 text-center"
      >
        <div className="w-12 h-1.5 bg-[#EFEFEF] rounded-full mx-auto mb-8" />
        
        <div className="w-[200px] h-[240px] bg-[#F2F2F2] rounded-3xl mx-auto shadow-2xl overflow-hidden border border-[#EEE] relative">
          <img src={build.thumbnail_url} className="w-full h-full object-contain p-2" alt="" />
        </div>
        
        <h3 className="text-2xl font-bold text-[#111111] mt-6 tracking-tight">Fit Saved! 🔥</h3>
        
        <div className="mt-8 flex flex-col gap-3">
          <button 
            onClick={onPost}
            disabled={posting}
            className="w-full h-14 rounded-full bg-linear-to-r from-[#FF5FA2] to-[#FF2D78] text-white font-bold text-[14px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {posting ? (
               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>🔥 POST TO FEED</span>
            )}
          </button>

          <button 
            onClick={onShare}
            className="w-full h-12 rounded-full bg-[#F2F2F2] text-[#111111] font-bold text-[14px] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            <span>SHARE IMAGE</span>
          </button>

          <button onClick={onClose} className="text-[#888] text-[13px] font-medium pt-3 block w-full hover:text-black transition-colors">
            Close & Back
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SkeletonSections = () => (
  <div className="space-y-2">
    {[1, 2, 3].map(i => (
      <div key={`skeleton-sec-${i}`} className="bg-white p-6">
        <div className="w-16 h-2.5 bg-[#F8F8F8] rounded animate-pulse mb-3" />
        <div className="w-48 h-8 bg-[#F8F8F8] rounded animate-pulse mb-6" />
        <div className="flex gap-2 items-end">
          {[1, 2, 3].map(j => (
            <div key={`skeleton-item-${i}-${j}`} className="w-[110px] h-[130px] bg-[#F8F8F8] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const SheetOption = ({ icon, label, onClick, className = '' }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-[#F8F8F8] active:scale-[0.98] transition-all text-[#111111] font-bold text-sm ${className}`}
  >
    <span className="text-xl">{icon}</span>
    <span className="tracking-tight">{label}</span>
  </button>
);
