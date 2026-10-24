import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ImagePlus, LoaderCircle, LockKeyhole, Sparkles, Upload, X } from 'lucide-react';

type Step = 'brief' | 'loading' | 'signup' | 'results';
const inspirations = [
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85',
  'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=85',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=85',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=700&q=85',
  'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=700&q=85',
];
const structures = [
  { title: 'The scroll-stopper', label: '01 · HOOK', copy: 'THE PIECE YOUR ROTATION IS MISSING', image: inspirations[0] },
  { title: 'Show the details', label: '02 · DETAILS', copy: 'THE FIT. THE FINISH. EVERY DETAIL.', image: inspirations[1] },
  { title: 'Style it your way', label: '03 · STYLING', copy: 'ONE PIECE. MORE WAYS TO WEAR IT.', image: inspirations[2] },
  { title: 'Make it yours', label: '04 · VALUE', copy: 'YOUR NEXT EVERYDAY ESSENTIAL.', image: inspirations[3] },
  { title: 'The call to action', label: '05 · CTA', copy: 'READY TO UPGRADE YOUR ROTATION?', image: inspirations[4] },
];

export const CarouselStudio: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('brief');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('Streetwear');
  const [audience, setAudience] = useState('Young adults (16–30)');
  const [tone, setTone] = useState('Confident & bold');
  const [goal, setGoal] = useState('Sell more');
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [paywall, setPaywall] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const loadingLabels = ['Reading your product photo', 'Finding visual style inspiration', 'Choosing a hook from the library', 'Building your carousel structure'];
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);
  const onFile = (next?: File) => {
    if (!next) return;
    if (!next.type.startsWith('image/')) return;
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };
  const start = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !shopName.trim()) return;
    try { sessionStorage.setItem('threadzw_carousel_draft', JSON.stringify({ shopName, category, audience, tone, goal, product, price, notes })); } catch {}
    setStep('loading');
    setLoadingIndex(0);
    let tick = 0;
    timer.current = window.setInterval(() => {
      tick += 1;
      setLoadingIndex(Math.min(3, tick));
      if (tick >= 5) {
        if (timer.current) window.clearInterval(timer.current);
        timer.current = undefined;
        setStep('signup');
      }
    }, 1000) as unknown as number;
  };
  const signup = () => {
    try { sessionStorage.setItem('threadzw_carousel_after_signup', 'results'); } catch {}
    navigate('/signup?next=carousel');
  };
  const card = 'rounded-2xl border border-[#E3E2EA] bg-white shadow-[0_5px_24px_rgba(36,36,75,.045)]';
  const field = 'mt-2 w-full rounded-xl border border-[#E3E2EA] bg-white px-3.5 py-3 text-sm text-[#24244B] outline-none transition placeholder:text-[#9898A8] focus:border-[#5146D8] focus:ring-4 focus:ring-[#5146D8]/10';
  const primary = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#5146D8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4237C4] disabled:cursor-not-allowed disabled:opacity-40';
  return <div className="min-h-screen bg-[#F7F6F2] text-[#24244B]">
    <header className="sticky top-0 z-20 border-b border-[#E3E2EA] bg-[#F7F6F2]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button onClick={() => navigate('/')} className="text-xl font-black tracking-tight">thread<span className="text-[#5146D8]">zw</span><span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-[.18em] text-[#686A7A]">studio</span></button>
        <div className="flex items-center gap-3"><button onClick={() => navigate('/login')} className="text-sm font-semibold text-[#686A7A] hover:text-[#24244B]">Log in</button><span className="hidden rounded-full bg-[#F0EFFA] px-3 py-1.5 text-xs font-bold text-[#5146D8] sm:inline-flex"><Sparkles size={13} className="mr-1.5"/> AI carousel maker</span></div>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-12">
      {step === 'brief' && <div className="grid items-start gap-8 lg:grid-cols-[1fr_.8fr] lg:gap-12">
        <section className="pt-2 sm:pt-7"><span className="inline-flex items-center gap-2 rounded-full border border-[#E3E2EA] bg-white px-3 py-1.5 text-xs font-bold text-[#5146D8]"><Sparkles size={14}/> Made for fashion sellers</span>
          <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.04] tracking-[-.055em] sm:text-6xl">Turn one product photo into a <span className="text-[#5146D8]">carousel that sells.</span></h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#686A7A]">Tell us about your drip shop. We’ll shape a scroll-stopping hook, visual direction and ready-to-edit carousel concept around your product.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-[#686A7A]"><span className="rounded-full bg-white px-3 py-2">01 · Upload a product</span><span className="rounded-full bg-white px-3 py-2">02 · Tell us your vibe</span><span className="rounded-full bg-white px-3 py-2">03 · Preview your concept</span></div>
          <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">{structures.slice(0,3).map((s,i)=><div key={s.label} className="overflow-hidden rounded-xl border border-[#E3E2EA] bg-white p-1.5"><div className="relative aspect-[4/5] overflow-hidden rounded-lg"><img src={s.image} alt="" className="h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"/><p className="absolute bottom-2 left-2 right-2 text-[9px] font-black leading-tight text-white">{s.copy}</p></div><p className="px-1 pb-1 pt-2 text-[10px] font-bold text-[#686A7A]">SLIDE 0{i+1}</p></div>)}</div>
          <p className="mt-4 text-xs text-[#858596]">A quick preview first. Create an account to unlock your results.</p>
        </section>
        <form onSubmit={start} className={card+' p-4 sm:p-6'}>
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#5146D8]">Start creating</p><h2 className="mt-1 text-xl font-extrabold">Tell us about your drip</h2></div><span className="rounded-xl bg-[#F0EFFA] p-3 text-[#5146D8]"><ImagePlus size={21}/></span></div>
          <label className="block text-sm font-bold">Upload a product photo <span className="text-[#C45151]">*</span></label>
          <label className="mt-2 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#BDBBD0] bg-[#FAFAF8] text-center transition hover:border-[#5146D8] hover:bg-[#F8F7FF]">
            {preview ? <div className="relative w-full"><img src={preview} alt="Product preview" className="h-52 w-full object-contain p-3"/><span className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-[#686A7A]"><X size={14}/></span></div> : <div className="px-6 py-8"><Upload size={26} className="mx-auto text-[#5146D8]"/><p className="mt-3 text-sm font-bold">Choose a clear product photo</p><p className="mt-1 text-xs text-[#858596]">Jersey, sneakers, hoodie, outfit or new stock</p></div>}
            <input type="file" accept="image/*" className="sr-only" onChange={e=>onFile(e.target.files?.[0])}/>
          </label>
          {preview && <button type="button" onClick={()=>{setFile(null);setPreview('')}} className="mt-2 text-xs font-bold text-[#686A7A]">Remove photo</button>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">Shop / brand name *<input required className={field} value={shopName} onChange={e=>setShopName(e.target.value)} placeholder="e.g. DripZone"/></label>
            <label className="block text-sm font-bold">Fashion category<select className={field} value={category} onChange={e=>setCategory(e.target.value)}>{['Streetwear','Jerseys','Sneakers','Thrift & vintage','Ladies fashion','Casual wear','Mixed drip'].map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="block text-sm font-bold">Who do you sell to?<select className={field} value={audience} onChange={e=>setAudience(e.target.value)}>{['Young adults (16–30)','Students','Sneaker collectors','Football fans','Working professionals','Everyone'].map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="block text-sm font-bold">Brand personality<select className={field} value={tone} onChange={e=>setTone(e.target.value)}>{['Confident & bold','Minimal & premium','Playful & energetic','Luxury streetwear','Everyday & relatable'].map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="block text-sm font-bold">Main goal<select className={field} value={goal} onChange={e=>setGoal(e.target.value)}>{['Sell more','Get more enquiries','Increase engagement','Grow brand awareness'].map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="block text-sm font-bold">Product name (optional)<input className={field} value={product} onChange={e=>setProduct(e.target.value)} placeholder="e.g. Liverpool home jersey"/></label>
            <label className="block text-sm font-bold">Price (optional)<input className={field} value={price} onChange={e=>setPrice(e.target.value)} placeholder="e.g. $25"/></label>
            <label className="block text-sm font-bold sm:col-span-2">Anything else to know? <textarea className={field+' min-h-20 resize-y'} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Colours, sizes, location, unique details or your usual customer…"/></label>
          </div>
          <button type="submit" disabled={!file||!shopName.trim()} className={primary+' mt-5 w-full'}>Build my carousel <ArrowRight size={17}/></button>
          <p className="mt-3 text-center text-[11px] leading-5 text-[#858596]">Your photo is used to prepare your preview. You can review before paying.</p>
        </form>
      </div>}
      {step === 'loading' && <div className="mx-auto max-w-xl py-14 text-center sm:py-24"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EFFA] text-[#5146D8]"><LoaderCircle size={30} className="animate-spin"/></div><p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-[#5146D8]">Building your concept</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your product has potential.</h1><p className="mt-3 text-sm text-[#686A7A]">Putting together a direction for {shopName}…</p><div className="mx-auto mt-8 max-w-sm space-y-3 text-left">{loadingLabels.map((label,i)=><div key={label} className={'flex items-center gap-3 rounded-xl border p-3 text-sm '+(i<=loadingIndex?'border-[#DCD8FB] bg-white':'border-[#E3E2EA] bg-transparent text-[#9898A8]')}>{i<loadingIndex?<Check size={17} className="text-[#5146D8]"/>:i===loadingIndex?<LoaderCircle size={17} className="animate-spin text-[#5146D8]"/>:<span className="h-4 w-4 rounded-full border border-[#C8C7D5]"/>}<span className="font-semibold">{label}</span></div>)}</div><p className="mt-6 text-xs text-[#858596]">Usually takes a few seconds.</p></div>}
      {step === 'signup' && <div className="mx-auto max-w-2xl py-10 text-center sm:py-20"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E9F6ED] text-[#25834A]"><Check size={30}/></span><p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-[#5146D8]">Your preview is ready</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Your carousel is waiting.</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#686A7A]">We’ve prepared the direction for <strong>{product||shopName}</strong>. Create your free account to open your carousel preview, edit the slides and keep your work saved.</p><div className="mx-auto mt-7 grid max-w-lg grid-cols-2 gap-3 text-left">{structures.slice(0,4).map((s,i)=><div key={s.label} className="relative overflow-hidden rounded-xl border border-[#E3E2EA] bg-white"><img src={s.image} alt="" className="aspect-[4/5] w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/><p className="absolute bottom-3 left-3 right-3 text-xs font-black text-white">{s.copy}</p><span className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[9px] font-black">{i+1}/5</span></div>)}</div><button onClick={signup} className={primary+' mt-7 w-full max-w-sm'}>Sign up to see my carousel <ArrowRight size={17}/></button><p className="mt-4 text-xs text-[#858596]">Already have an account? <button onClick={()=>navigate('/login?next=carousel')} className="font-bold text-[#5146D8]">Log in</button></p></div>}
      {step === 'results' && <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#5146D8]">Your carousel concept</p><h1 className="mt-2 text-3xl font-black">Made for {shopName}.</h1><p className="mt-2 text-sm text-[#686A7A]">Five-slide structure · Hook-led · Built around your product brief</p></div><button onClick={()=>setPaywall(true)} className={primary}><LockKeyhole size={16}/> Download carousel</button></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{structures.map((s,i)=><article key={s.label} className={card+' overflow-hidden'}><div className="relative aspect-[4/5] overflow-hidden"><img src={i===0&&preview?preview:s.image} alt="" className="h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent"/><span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-[#24244B]">{s.label}</span><p className="absolute bottom-4 left-4 right-4 text-lg font-black leading-tight text-white">{s.copy}</p></div><div className="p-4"><p className="text-sm font-bold">{s.title}</p><p className="mt-1 text-xs text-[#686A7A]">{i===0?'Hook library pick':i===1?'Product details':'Carousel preset'} · {category}</p></div></article>)}</div>{paywall&&<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#24244B]/60 p-4 backdrop-blur-sm"><div className={card+' relative w-full max-w-md p-6 sm:p-8'}><button onClick={()=>setPaywall(false)} aria-label="Close paywall" className="absolute right-4 top-4 rounded-lg p-2 text-[#686A7A]"><X size={18}/></button><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EFFA] text-[#5146D8]"><LockKeyhole size={22}/></span><h2 className="mt-5 text-2xl font-black">Unlock your downloads</h2><p className="mt-2 text-sm leading-6 text-[#686A7A]">Your carousel concept is ready. Upgrade to download finished slides and create more content for your shop.</p><div className="mt-5 rounded-xl bg-[#F7F6F2] p-4"><div className="flex items-center justify-between"><span className="text-sm font-bold">ThreadZW Creator</span><span className="text-lg font-black">$5<span className="text-xs font-semibold text-[#686A7A]">/month</span></span></div><p className="mt-1 text-xs text-[#686A7A]">30 AI generations each month</p></div><button onClick={()=>navigate('/subscription')} className={primary+' mt-5 w-full'}>View plans & unlock <ArrowRight size={17}/></button><button onClick={()=>setPaywall(false)} className="mt-3 w-full py-2 text-sm font-semibold text-[#686A7A]">Not now</button></div></div>}</div>}
      <footer className="mt-12 border-t border-[#E3E2EA] py-6 text-center text-xs text-[#858596]">ThreadZW Studio · Built for Zimbabwean fashion sellers</footer>
    </main>
  </div>;
};
