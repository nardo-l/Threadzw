import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  Link2,
  MapPin,
  Menu,
  MessageCircle,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  X,
} from 'lucide-react';
import { trackLandingPageView } from '../lib/analytics';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onStartFree: () => void;
  onLoginSuccess: () => void;
}

const DEFAULT_DEMO_SHOPS = [
  { id: 'urbankicks', name: 'Urban Kicks HRE', slug: 'urbankicks', category: 'Sneakers', banner_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=700&q=80', logo_url: null, location: 'Harare CBD' },
  { id: 'vintageplug', name: 'Vintage Plug BYO', slug: 'vintageplug', category: 'Thrift & Vintage', banner_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=700&q=80', logo_url: null, location: 'Bulawayo' },
  { id: 'dripdistrict', name: 'Drip District', slug: 'dripdistrict', category: 'Drip & Streetwear', banner_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=80', logo_url: null, location: 'Avondale' },
  { id: 'sneakercorner', name: 'Sneaker Corner', slug: 'sneakercorner', category: 'Sneakers', banner_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80', logo_url: null, location: 'Harare' },
];

const HERO_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=85',
  'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=400&q=85',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=85',
  'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=400&q=85',
];

const FAQS = [
  { question: 'Do I need a website or coding experience?', answer: 'No. ThreadZW gives you a ready-to-share shop link, product catalogue, and WhatsApp ordering flow without code.' },
  { question: 'Can customers order through WhatsApp?', answer: 'Yes. Customers choose the colour, size, and quantity, then ThreadZW prepares the order message for your WhatsApp.' },
  { question: 'What can I do on the free plan?', answer: 'You can create a clothing storefront and list unlimited products. The free allowance protects 50 unique visitors and 10 customer-interest actions over your shop’s lifetime.' },
  { question: 'Can I add my logo, directions, and banner later?', answer: 'Yes. Your shop can launch with the essentials. Branding, directions, notifications, and extra profile details remain available from your dashboard checklist.' },
];

const Logo = () => (
  <div className="flex items-center gap-0.5" aria-label="ThreadZW">
    <span className="text-[1.35rem] font-black tracking-[-0.07em] text-white sm:text-2xl">THREAD</span>
    <span className="text-[1.35rem] font-black tracking-[-0.07em] text-[#C6FF00] sm:text-2xl">ZW</span>
  </div>
);

const PhoneFrame = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative overflow-hidden rounded-[2rem] border-[6px] border-zinc-800 bg-black shadow-[0_25px_70px_rgba(0,0,0,0.55)] ${className}`}>
    <div className="absolute left-1/2 top-2 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-black/90" />
    <div className="h-full overflow-hidden rounded-[1.5rem] bg-white">{children}</div>
  </div>
);

const MiniStatus = () => <div className="flex items-center justify-between px-3 pt-2 text-[7px] font-bold text-zinc-500"><span>9:41</span><span>● ◒ ▮</span></div>;

const LinkInBioPhone = () => (
  <PhoneFrame className="h-[350px] w-[190px] sm:h-[410px] sm:w-[220px]">
    <div className="flex h-full flex-col items-center bg-[#f7f7f4] px-3 pb-4 pt-1">
      <MiniStatus />
      <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-black text-[#C6FF00]">T</div>
      <p className="mt-2 text-[12px] font-black text-black">THREADZW</p>
      <p className="text-center text-[7px] text-zinc-500">Zimbabwean streetwear & everyday fits.</p>
      <div className="mt-3 flex gap-2 text-[9px] text-zinc-700"><span>◎</span><span>◉</span><span>♪</span><span>▶</span></div>
      <div className="mt-4 w-full space-y-2">
        <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#C6FF00] py-2 text-[8px] font-black text-black"><MessageCircle size={11} /> Chat on WhatsApp</div>
        <div className="flex items-center justify-center gap-1.5 rounded-full border border-zinc-300 bg-white py-2 text-[8px] font-black text-black"><Store size={11} /> Visit my shop</div>
      </div>
      <div className="mt-auto w-full rounded-xl bg-white p-2 shadow-sm">
        <div className="flex items-center justify-between"><span className="text-[7px] font-black text-zinc-800">NEW DROP</span><span className="text-[7px] text-zinc-400">4 items</span></div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">{HERO_PRODUCT_IMAGES.slice(0, 4).map((src) => <img key={src} src={src} alt="Clothing product" className="h-12 w-full rounded-lg object-cover" />)}</div>
      </div>
      <p className="mt-2 text-[6px] font-bold text-zinc-400">Powered by <span className="text-zinc-700">THREAD<span className="text-[#83a900]">ZW</span></span></p>
    </div>
  </PhoneFrame>
);

const StorefrontPhone = () => (
  <PhoneFrame className="h-[385px] w-[205px] sm:h-[445px] sm:w-[240px]">
    <div className="h-full bg-[#fafafa] pb-3">
      <MiniStatus />
      <div className="mt-4 flex items-center justify-between px-3"><Menu size={13} /><span className="text-[10px] font-black">ThreadZW Streetwear</span><ShoppingBag size={13} /></div>
      <div className="mt-3 flex gap-1 overflow-hidden px-3 text-[7px] font-bold text-zinc-500"><span className="rounded-full bg-[#C6FF00] px-2 py-1 text-black">All</span><span className="rounded-full bg-white px-2 py-1">T-Shirts</span><span className="rounded-full bg-white px-2 py-1">Hoodies</span><span className="rounded-full bg-white px-2 py-1">Caps</span></div>
      <div className="mt-3 grid grid-cols-2 gap-2 px-3">{HERO_PRODUCT_IMAGES.map((src, index) => <div key={src} className="rounded-xl bg-white p-1.5 shadow-sm"><img src={src} alt="Clothing product" className="h-24 w-full rounded-lg object-cover" /><p className="mt-1 truncate text-[7px] font-black text-zinc-800">{['ZW Pride Tee', 'Classic Hoodie', 'Cargo Pants', 'Bucket Hat'][index]}</p><p className="text-[7px] text-zinc-500">${[20, 35, 40, 15][index]}.00</p><div className="mt-1 flex gap-0.5"><span className="h-2 w-2 rounded-full bg-black" /><span className="h-2 w-2 rounded-full bg-red-500" /><span className="h-2 w-2 rounded-full bg-green-600" /></div></div>)}</div>
      <div className="mx-3 mt-3 flex items-center justify-center gap-1 rounded-full bg-[#C6FF00] py-2 text-[8px] font-black text-black"><MessageCircle size={11} /> Order on WhatsApp</div>
    </div>
  </PhoneFrame>
);

const OrderPhone = () => (
  <PhoneFrame className="h-[385px] w-[205px] sm:h-[445px] sm:w-[240px]">
    <div className="h-full bg-white px-3 pb-3">
      <MiniStatus />
      <div className="mt-5 flex items-center gap-2 text-[10px] font-black"><ArrowRight size={13} className="rotate-180" /> Order on WhatsApp</div>
      <div className="mt-4 flex gap-2 rounded-xl bg-zinc-50 p-2"><img src={HERO_PRODUCT_IMAGES[0]} alt="ZW Pride Tee" className="h-12 w-12 rounded-lg object-cover" /><div><p className="text-[8px] font-black">ZW Pride Tee</p><p className="text-[8px] text-zinc-500">$20.00</p></div></div>
      <p className="mt-4 text-[8px] font-black">Colour</p><div className="mt-1 flex gap-1.5"><span className="h-5 w-5 rounded-full border-2 border-black bg-black ring-2 ring-[#C6FF00] ring-offset-1" /><span className="h-5 w-5 rounded-full bg-white ring-1 ring-zinc-300" /><span className="h-5 w-5 rounded-full bg-red-600" /><span className="h-5 w-5 rounded-full bg-green-700" /></div>
      <p className="mt-4 text-[8px] font-black">Size</p><div className="mt-1 grid grid-cols-4 gap-1"><span className="rounded-md border border-zinc-200 py-1 text-center text-[7px]">S</span><span className="rounded-md bg-black py-1 text-center text-[7px] font-black text-white">M</span><span className="rounded-md border border-zinc-200 py-1 text-center text-[7px]">L</span><span className="rounded-md border border-zinc-200 py-1 text-center text-[7px]">XL</span></div>
      <p className="mt-4 text-[8px] font-black">Quantity</p><div className="mt-1 flex w-20 items-center justify-between rounded-md border border-zinc-200 px-2 py-1 text-[8px]"><span>−</span><span className="font-black">1</span><span>+</span></div>
      <div className="mt-4 rounded-xl bg-[#f4f8e7] p-2"><p className="text-[7px] font-black text-zinc-700">Your WhatsApp message</p><p className="mt-1 text-[6px] leading-relaxed text-zinc-500">Hi, I’d like to order:<br />ZW Pride Tee<br />Colour: Black<br />Size: M<br />Quantity: 1</p></div>
      <div className="mt-3 flex items-center justify-center gap-1 rounded-full bg-[#C6FF00] py-2 text-[8px] font-black text-black"><Send size={10} /> Send on WhatsApp</div>
    </div>
  </PhoneFrame>
);

const StepCard = ({ index, label, title, children, tone = 'light' }: { index: string; label: string; title: string; children: React.ReactNode; tone?: 'light' | 'lime' }) => (
  <motion.article whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className={`relative overflow-hidden rounded-[2rem] p-5 sm:p-7 ${tone === 'lime' ? 'bg-[#C6FF00] text-black' : 'bg-[#f5f4ee] text-black'}`}>
    <div className="mb-6 flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-black text-[#C6FF00]">{index}</span><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{label}</span></div>
    <div className="mb-8 min-h-[350px]">{children}</div>
    <h3 className="max-w-[14rem] text-2xl font-black leading-[0.95] tracking-tight sm:text-3xl">{title}</h3>
  </motion.article>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree }) => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dbShops, setDbShops] = useState<any[]>([]);
  const [dbShopsCount, setDbShopsCount] = useState(0);

  useEffect(() => { trackLandingPageView(); }, []);

  useEffect(() => {
    let active = true;
    const loadShops = async () => {
      try {
        const { data, count } = await supabase.from('shops').select('id, name, slug, logo_url, banner_url, city, location, category', { count: 'exact' }).eq('is_active', true).order('created_at', { ascending: false }).limit(8);
        if (active && data?.length) { setDbShops(data); setDbShopsCount(count || data.length); }
      } catch (error) { console.warn('Landing shops unavailable:', error); }
    };
    loadShops();
    return () => { active = false; };
  }, []);

  const displayShops = useMemo(() => {
    const result = [...dbShops];
    DEFAULT_DEMO_SHOPS.forEach(shop => { if (result.length < 4 && !result.some(item => item.slug === shop.slug)) result.push(shop); });
    return result.slice(0, 4);
  }, [dbShops]);

  const trustedNames = useMemo(() => {
    const names = dbShops.map(shop => shop.name).filter(Boolean);
    const fallbacks = ['Urban Kicks', 'Drip District', 'Vintage Plug', 'ZW Street', 'House of ZW', 'Street Select'];
    fallbacks.forEach(name => { if (names.length < 6 && !names.includes(name)) names.push(name); });
    return names.slice(0, 6);
  }, [dbShops]);

  const scrollTo = (id: string) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070807] font-sans text-white selection:bg-[#C6FF00] selection:text-black">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070807]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer"><Logo /></button>
          <nav className="hidden items-center gap-8 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 md:flex"><button onClick={() => scrollTo('story')} className="transition hover:text-white">How it works</button><button onClick={() => scrollTo('examples')} className="transition hover:text-white">Live shops</button><button onClick={() => scrollTo('pricing')} className="transition hover:text-white">Pricing</button><button onClick={() => scrollTo('faq')} className="transition hover:text-white">FAQ</button></nav>
          <div className="hidden items-center gap-3 sm:flex"><button onClick={() => navigate('/login')} className="px-3 py-2 text-xs font-black uppercase tracking-wider text-zinc-300 transition hover:text-white">Log in</button><button onClick={onStartFree} className="rounded-full bg-[#C6FF00] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:scale-105 hover:bg-[#b8ee00]">Create your shop</button></div>
          <button onClick={() => setMenuOpen(value => !value)} className="rounded-full border border-white/10 p-2 sm:hidden" aria-label="Open menu">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
        {menuOpen && <div className="border-t border-white/10 px-5 py-4 sm:hidden"><div className="grid gap-3 text-sm font-bold text-zinc-300"><button onClick={() => scrollTo('story')} className="text-left">How it works</button><button onClick={() => scrollTo('examples')} className="text-left">Live shops</button><button onClick={() => scrollTo('pricing')} className="text-left">Pricing</button><button onClick={() => scrollTo('faq')} className="text-left">FAQ</button><button onClick={() => navigate('/login')} className="mt-2 rounded-xl border border-white/15 px-4 py-3 text-left">Log in</button><button onClick={onStartFree} className="rounded-xl bg-[#C6FF00] px-4 py-3 text-left font-black text-black">Create your shop</button></div></div>}
      </header>

      <main>
        <section className="relative isolate overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[#C6FF00]/10 blur-[140px]" />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:4rem_4rem] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
          <div className="mx-auto max-w-5xl text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C6FF00]/25 bg-[#C6FF00]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#C6FF00]"><Sparkles size={13} /> Built for Zimbabwean clothing sellers</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mx-auto max-w-5xl text-5xl font-black leading-[0.93] tracking-[-0.07em] sm:text-7xl lg:text-[6.7rem]">Your brand.<br />One link. <span className="text-[#C6FF00]">More orders.</span></motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">Give customers one place to discover your clothes, browse your storefront, and order on WhatsApp.</motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"><button onClick={onStartFree} className="flex w-full items-center justify-between gap-8 rounded-full bg-[#C6FF00] px-6 py-4 text-sm font-black text-black transition hover:scale-105 hover:bg-[#b8ee00] sm:w-auto"><span>Create my free shop</span><ArrowRight size={18} /></button><button onClick={() => scrollTo('story')} className="flex items-center gap-2 text-sm font-bold text-white underline decoration-[#C6FF00] decoration-2 underline-offset-8">See how it works <ChevronRight size={16} className="text-[#C6FF00]" /></button></motion.div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-zinc-500 sm:gap-7"><span className="flex items-center gap-1.5"><Check size={14} className="text-[#C6FF00]" /> Free to start</span><span className="flex items-center gap-1.5"><Check size={14} className="text-[#C6FF00]" /> No coding</span><span className="flex items-center gap-1.5"><Check size={14} className="text-[#C6FF00]" /> Orders on WhatsApp</span></div>
          </div>
          <div className="mx-auto mt-16 max-w-6xl rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-3 shadow-2xl sm:mt-20 sm:p-5"><div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0e100e] px-4 pb-4 pt-5 sm:px-8 sm:pb-8"><div className="mb-6 flex items-center justify-between text-zinc-600"><div className="h-2 w-20 rounded-full bg-white/10" /><div className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#C6FF00]" /><span className="h-1.5 w-1.5 rounded-full bg-white/20" /><span className="h-1.5 w-1.5 rounded-full bg-white/20" /></div></div><div className="grid items-center gap-7 lg:grid-cols-[1fr_auto_1fr]"><div className="hidden text-right lg:block"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#C6FF00]">One link for your brand</p><p className="mt-2 text-2xl font-black">Your whole brand,<br />in one place.</p><p className="mt-3 text-sm text-zinc-500">Share it in your bio, status, and every conversation.</p></div><div className="flex justify-center"><LinkInBioPhone /></div><div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-left"><div className="flex gap-3"><Link2 size={18} className="mt-0.5 shrink-0 text-[#C6FF00]" /><div><p className="text-xs font-black text-white">Share one link anywhere</p><p className="mt-1 text-[11px] leading-relaxed text-zinc-500">Instagram, TikTok, WhatsApp Status.</p></div></div><div className="flex gap-3"><Store size={18} className="mt-0.5 shrink-0 text-[#C6FF00]" /><div><p className="text-xs font-black text-white">Send customers to your shop</p><p className="mt-1 text-[11px] leading-relaxed text-zinc-500">No more scattered product posts.</p></div></div></div></div></div></div>
        </section>

        <section id="story" className="bg-[#f1f0e9] px-5 py-20 text-black sm:px-8 sm:py-28"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#7d9900]">The ThreadZW flow</p><h2 className="mt-3 max-w-xl text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-6xl">One link.<br />Three steps to a sale.</h2></div><p className="max-w-sm text-sm leading-relaxed text-zinc-500">Your customers already use WhatsApp. Give them a better place to discover your drop and decide what they want.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-3"><StepCard index="1" label="Your link" title="One link for your brand"><div className="flex justify-center"><LinkInBioPhone /></div></StepCard><StepCard index="2" label="Your storefront" title="A shop customers can browse" tone="lime"><div className="flex justify-center"><StorefrontPhone /></div></StepCard><StepCard index="3" label="Your orders" title="Orders start on WhatsApp"><div className="flex justify-center"><OrderPhone /></div></StepCard></div><div className="mt-8 hidden items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 lg:flex"><span>Share one link</span><ArrowRight size={17} className="text-[#9cc500]" /><span>Customers browse</span><ArrowRight size={17} className="text-[#9cc500]" /><span>Customers order</span></div></div></section>

        <section id="examples" className="bg-[#070807] px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#C6FF00]">Live on ThreadZW</p><h2 className="mt-3 max-w-xl text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-6xl">Built for the<br />local drip scene.</h2></div><button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-sm font-black text-white underline decoration-[#C6FF00] decoration-2 underline-offset-8">Browse all shops <ArrowRight size={16} className="text-[#C6FF00]" /></button></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{displayShops.map((shop, index) => <motion.button key={shop.id || shop.slug || index} whileHover={{ y: -5 }} onClick={() => navigate(`/shop/${shop.slug}`)} className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] text-left"><div className="relative h-52 overflow-hidden"><img src={shop.banner_url || HERO_PRODUCT_IMAGES[index]} alt={shop.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-[10px] font-bold text-white"><MapPin size={12} className="text-[#C6FF00]" />{shop.city || shop.location || 'Zimbabwe'}</div></div><div className="p-4"><p className="truncate text-base font-black text-white">{shop.name}</p><p className="mt-1 text-xs text-zinc-500">{shop.category || 'Clothing & fashion'}</p></div></motion.button>)}</div><div className="mt-12 flex flex-col items-start justify-between gap-5 border-y border-white/10 py-6 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="flex -space-x-2">{['#C6FF00', '#f5d0a9', '#8ea3b8', '#e9a3c5', '#b4b4b4'].map((color, index) => <div key={color} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#070807] text-[9px] font-black text-black" style={{ backgroundColor: color }}>{['R', 'T', 'M', 'S', 'D'][index]}</div>)}</div><div><p className="text-sm font-black">Built for Zimbabwean clothing sellers</p><p className="mt-1 text-xs text-zinc-500">{dbShopsCount > 0 ? `${dbShopsCount}+ shops already on ThreadZW` : 'Put your brand in one place.'}</p></div></div><div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">{trustedNames.map(name => <span key={name}>{name}</span>)}</div></div></div></section>

        <section id="pricing" className="bg-[#f1f0e9] px-5 py-20 text-black sm:px-8 sm:py-28"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#7d9900]">Start free</p><h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-6xl">Build the catalogue.<br />Share the link.<br /><span className="text-[#8caf00]">Grow from there.</span></h2><p className="mt-6 max-w-md text-sm leading-relaxed text-zinc-500">Start with the essentials and complete your profile when you are ready. Your products stay unlimited on the free clothing plan.</p><button onClick={onStartFree} className="mt-8 flex items-center gap-7 rounded-full bg-black px-6 py-4 text-sm font-black text-white transition hover:scale-105">Create my free shop <ArrowRight size={18} className="text-[#C6FF00]" /></button></div><div className="rounded-[2rem] bg-black p-5 text-white shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#C6FF00]">Clothing free</p><h3 className="mt-2 text-3xl font-black">Start at $0</h3><p className="mt-1 text-sm text-zinc-500">No credit card required.</p></div><div className="rounded-full bg-[#C6FF00] p-3 text-black"><Star size={19} fill="currentColor" /></div></div><div className="my-7 h-px bg-white/10" /><div className="space-y-4 text-sm font-bold"><p className="flex items-center gap-3"><Check size={17} className="text-[#C6FF00]" /> Unlimited products</p><p className="flex items-center gap-3"><Check size={17} className="text-[#C6FF00]" /> Your own shareable shop link</p><p className="flex items-center gap-3"><Check size={17} className="text-[#C6FF00]" /> Orders prepared for WhatsApp</p><p className="flex items-center gap-3"><Check size={17} className="text-[#C6FF00]" /> Built-in colour, size, and quantity flow</p></div><div className="mt-7 rounded-2xl border border-[#C6FF00]/20 bg-[#C6FF00]/10 p-4"><p className="text-xs font-black text-[#C6FF00]">Customer access allowance</p><p className="mt-1 text-xs leading-relaxed text-zinc-400">50 unique visitors and 10 customer-interest actions over your shop’s lifetime.</p></div></div></div></section>

        <section id="faq" className="bg-[#070807] px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-4xl"><div className="text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#C6FF00]">Questions</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Keep it simple.</h2></div><div className="mt-12 divide-y divide-white/10 border-y border-white/10">{FAQS.map((faq, index) => <div key={faq.question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-black sm:text-base"><span>{faq.question}</span><ChevronDown size={18} className={`shrink-0 text-[#C6FF00] transition ${openFaq === index ? 'rotate-180' : ''}`} /></button>{openFaq === index && <p className="max-w-2xl pb-5 pr-8 text-sm leading-relaxed text-zinc-500">{faq.answer}</p>}</div>)}</div></div></section>

        <section className="bg-[#C6FF00] px-5 py-20 text-black sm:px-8 sm:py-28"><div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-black/60">Your next customer is already on WhatsApp.</p><h2 className="mt-3 max-w-2xl text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-7xl">Give them a better place to shop.</h2></div><button onClick={onStartFree} className="flex shrink-0 items-center gap-8 rounded-full bg-black px-6 py-4 text-sm font-black text-white transition hover:scale-105">Launch your shop <ArrowRight size={18} className="text-[#C6FF00]" /></button></div></section>
      </main>

      <footer className="border-t border-white/10 bg-[#070807] px-5 py-7 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs text-zinc-500 sm:flex-row sm:items-center"><Logo /><p>Shopfronts for Zimbabwean fashion.</p><p>© {new Date().getFullYear()} ThreadZW</p></div></footer>
    </div>
  );
};
