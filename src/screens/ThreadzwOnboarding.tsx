import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Bell, Check, ChevronRight, Copy, ExternalLink,
  Instagram, Loader2, MapPin, MessageCircle, Music2, Search, Share2, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useShopContext } from '../context/ShopContext';

const GREEN = '#C6FF00';
const TOTAL_STEPS = 11;
const CITIES = ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Masvingo', 'Other'];

const THEMES = [
  { id: 'editorial', name: 'Editorial Magazine', note: 'Big visuals and story-led shopping', shape: 'rounded-none' },
  { id: 'bento', name: 'Bento Commerce', note: 'Everything at a glance', shape: 'rounded-2xl' },
  { id: 'catalog', name: 'Product-first Catalog', note: 'Fast product browsing', shape: 'rounded-md' },
  { id: 'poster', name: 'Street Poster', note: 'Bold drops and big CTAs', shape: 'skew-y-2' },
  { id: 'luxury', name: 'Luxury Boutique', note: 'Premium and spacious', shape: 'rounded-full' },
  { id: 'social', name: 'Social Feed Shop', note: 'Content-led shopping', shape: 'rounded-xl' },
  { id: 'market', name: 'Map & Market', note: 'Local discovery', shape: 'rounded-lg' },
  { id: 'story', name: 'Story-led Shop', note: 'Brand story and proof', shape: 'rounded-3xl' },
];

const Progress = ({ step }: { step: number }) => (
  <div className="flex items-center gap-1" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
    {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
      <div key={index} className={`h-1 w-4 rounded-full transition-all ${index < step ? 'bg-[#C6FF00]' : 'bg-zinc-800'}`} />
    ))}
  </div>
);

const Button = ({ children, onClick, disabled = false, secondary = false }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; secondary?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-black tracking-wide transition active:scale-[0.99] disabled:opacity-40 ${secondary ? 'border border-zinc-700 bg-[#141414] text-white' : 'bg-[#C6FF00] text-black'}`}>
    {children}
  </button>
);

const Field = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full rounded-2xl border border-zinc-700 bg-[#141414] px-4 py-4 text-base font-semibold text-white outline-none placeholder:text-zinc-500 focus:border-[#C6FF00] ${props.className || ''}`} />
);

export const ThreadzwOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { shop, refreshShop } = useShopContext();
  const [step, setStep] = useState(() => {
    const saved = Number(localStorage.getItem('threadzw_onboarding_step') || '1');
    return saved >= 1 && saved <= TOTAL_STEPS ? saved : 1;
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+263 ');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState(shop?.name || '');
  const [city, setCity] = useState(shop?.city || '');
  const [bio, setBio] = useState(shop?.description || '');
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('threadzw_selected_theme') || 'editorial');
  const [shopId, setShopId] = useState<string | null>(shop?.id || null);
  const [shopLink, setShopLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { localStorage.setItem('threadzw_onboarding_step', String(step)); }, [step]);
  useEffect(() => {
    if (!shop) return;
    setShopId(shop.id);
    if (!shopName) setShopName(shop.name || '');
    if (!city) setCity(shop.city || '');
    if (!bio) setBio(shop.description || '');
    if (shop.slug) setShopLink(`${window.location.origin}/${shop.slug}`);
  }, [shop]);

  const slug = useMemo(() => shopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), [shopName]);
  const go = (next: number) => { setError(''); setStep(Math.max(1, Math.min(TOTAL_STEPS, next))); };
  const getUser = async () => {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) throw new Error('Please log in again to continue.');
    return data.user;
  };

  const createAccount = async () => {
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address.');
    if (phone.replace(/\D/g, '').length < 9) return setError('Enter your WhatsApp number.');
    if (password.length < 6) return setError('Use at least 6 characters for your password.');
    setLoading(true); setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() || 'Shop Owner', phone_number: phone.trim() } } });
      let user = data.user;
      if (signUpError?.message.toLowerCase().includes('already registered')) {
        const signedIn = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signedIn.error) throw signedIn.error;
        user = signedIn.data.user;
      } else if (signUpError) throw signUpError;
      else if (!data.session) {
        const signedIn = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signedIn.error) throw signedIn.error;
        user = signedIn.data.user;
      }
      if (!user) throw new Error('Your account could not be created.');
      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('supabase_logged_in_user_id', user.id);
      toast.success('Account created');
      go(6);
    } catch (e: any) { setError(e?.message || 'Could not create your account.'); }
    finally { setLoading(false); }
  };

  const saveShop = async () => {
    if (shopName.trim().length < 2) return setError('Enter your shop name.');
    if (!city) return setError('Choose your city or area.');
    if (phone.replace(/\D/g, '').length < 9) return setError('Enter your WhatsApp number.');
    setLoading(true); setError('');
    try {
      const user = await getUser();
      const existing = shopId || (await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle()).data?.id;
      const payload = { name: shopName.trim(), slug: slug || `shop-${Date.now().toString(36)}`, category: 'Streetwear & Fashion', description: bio.trim() || `${shopName.trim()} official storefront on ThreadZW.`, whatsapp_number: phone.trim(), city, location: city, is_active: true, page_type: 'clothing', plan: 'free', premium_status: 'inactive', product_limit: 9 };
      let id = existing;
      if (id) { const { error: updateError } = await supabase.from('shops').update(payload).eq('id', id); if (updateError) throw updateError; }
      else { const { data: inserted, error: insertError } = await supabase.from('shops').insert({ ...payload, owner_id: user.id }).select('id, slug').single(); if (insertError) throw insertError; id = inserted.id; }
      setShopId(id || null); setShopLink(`${window.location.origin}/${payload.slug}`); await refreshShop(); toast.success('Shop details saved'); go(7);
    } catch (e: any) { setError(e?.message || 'Could not save your shop.'); }
    finally { setLoading(false); }
  };

  const saveTheme = async () => {
    const id = shopId || shop?.id;
    if (!id) return setError('Save your shop details before choosing a theme.');
    setLoading(true); setError('');
    try {
      const { error: updateError } = await supabase.from('shops').update({ template_id: selectedTheme }).eq('id', id);
      if (updateError) throw updateError;
      localStorage.setItem('threadzw_selected_theme', selectedTheme);
      await refreshShop(); toast.success('Storefront style selected'); go(8);
    } catch (e: any) { setError(e?.message || 'Could not save your storefront style.'); }
    finally { setLoading(false); }
  };

  const finish = () => {
    localStorage.removeItem('threadzw_onboarding_step');
    localStorage.setItem('threadzw_onboarding_completed', 'true');
    navigate('/dashboard', { replace: true });
  };

  const renderHeader = () => (
    <header className="flex items-start justify-between gap-4">
      <div><div className="text-2xl font-black tracking-tight text-[#C6FF00]">THREAD<span className="text-white">ZW</span></div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Your shop. One link.</div></div>
      <Progress step={step} />
    </header>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#050505] px-6 py-5">
        {renderHeader()}
        <AnimatePresence mode="wait">
          <motion.section key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.18 }} className="flex flex-1 flex-col pt-10">
            {step > 1 && <button onClick={() => go(step - 1)} className="mb-6 flex w-fit items-center gap-2 text-sm font-bold text-zinc-500"><ArrowLeft size={17} /> Back</button>}
            {error && <div className="mb-5 rounded-2xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm font-semibold text-red-300">{error}</div>}

            {step === 1 && <div className="flex flex-1 flex-col"><div className="pt-3"><div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C6FF00] text-black"><MessageCircle size={27} /><span className="sr-only">Problem</span></div><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">PHASE 1: THE PROBLEM</p><h1 className="mt-4 text-[3.1rem] font-black leading-[0.96] tracking-tight">Stop sending product photos one by one.</h1><p className="mt-5 text-sm leading-6 text-zinc-400">Give customers one place to browse your products, prices and shop details.</p></div><div className="mt-auto space-y-3 pt-8"><div className="space-y-2 rounded-2xl bg-[#141414] p-4 text-sm font-semibold text-zinc-300"><div>“How much?”</div><div>“Do you have black?”</div><div>“Send more pictures.”</div></div><Button onClick={() => go(2)}><span>SEE HOW IT WORKS</span><ArrowRight size={20} /></Button></div></div>}

            {step === 2 && <div className="flex flex-1 flex-col"><div className="pt-3"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">PHASE 2: ONE LINK</p><h1 className="mt-4 text-4xl font-black leading-tight">One link for your whole business.</h1><p className="mt-4 text-sm leading-6 text-zinc-400">Add it to your TikTok, Instagram and Facebook bio—or send it when customers ask what you sell.</p></div><div className="mt-10 space-y-3"><div className="grid grid-cols-3 gap-2"><div className="rounded-xl border border-zinc-700 bg-[#141414] p-3 text-center"><Music2 className="mx-auto text-white" size={22} /><span className="mt-2 block text-[10px] font-bold">TikTok</span></div><div className="rounded-xl border border-zinc-700 bg-[#141414] p-3 text-center"><Instagram className="mx-auto text-white" size={22} /><span className="mt-2 block text-[10px] font-bold">Instagram</span></div><div className="rounded-xl border border-zinc-700 bg-[#141414] p-3 text-center"><Share2 className="mx-auto text-white" size={22} /><span className="mt-2 block text-[10px] font-bold">Facebook</span></div></div><div className="rounded-2xl border-2 border-[#C6FF00] bg-[#141414] p-5 text-center text-lg font-black text-[#C6FF00]">threadzw.shop/yourshop</div></div><div className="mt-auto pt-8"><Button onClick={() => go(3)}><span>CONTINUE</span><ArrowRight size={20} /></Button></div></div>}

            {step === 3 && <div className="flex flex-1 flex-col"><div className="pt-3"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">PHASE 3: YOUR STORE</p><h1 className="mt-4 text-4xl font-black leading-tight">Customers see your products before they ask.</h1><p className="mt-4 text-sm leading-6 text-zinc-400">They can browse your catalogue, check prices, view details and choose what they want.</p></div><div className="mt-8 rounded-2xl bg-[#141414] p-4"><div className="mb-4 flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-[#C6FF00]" /><div><div className="font-black">Your storefront</div><div className="text-xs text-zinc-500">Products, prices and details</div></div><Search className="ml-auto text-zinc-500" size={18} /></div><div className="grid grid-cols-2 gap-2"><div className="h-24 rounded-xl bg-zinc-800" /><div className="h-24 rounded-xl bg-zinc-700" /><div className="h-24 rounded-xl bg-zinc-700" /><div className="h-24 rounded-xl bg-zinc-800" /></div><div className="mt-4 rounded-xl bg-[#C6FF00] py-3 text-center text-sm font-black text-black">BROWSE CATALOG →</div></div><div className="mt-auto pt-7"><Button onClick={() => go(4)}><span>CONTINUE</span><ArrowRight size={20} /></Button></div></div>}

            {step === 4 && <div className="flex flex-1 flex-col"><div className="pt-3"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">PHASE 4: HOW TO BUY</p><h1 className="mt-4 text-4xl font-black leading-tight">Customers choose how to buy.</h1><p className="mt-4 text-sm leading-6 text-zinc-400">They can order directly on WhatsApp or get directions to visit your shop.</p></div><div className="mt-8 space-y-3"><div className="rounded-2xl bg-[#141414] p-5"><MessageCircle className="mb-3 text-[#C6FF00]" size={25} /><div className="font-black">Order on WhatsApp</div><div className="mt-1 text-xs text-zinc-500">Chat, ask questions and place the order.</div></div><div className="rounded-2xl bg-[#141414] p-5"><MapPin className="mb-3 text-[#C6FF00]" size={25} /><div className="font-black">Visit the shop</div><div className="mt-1 text-xs text-zinc-500">Show your location and opening hours.</div></div></div><div className="mt-auto pt-7"><Button onClick={() => go(5)}><span>CREATE MY SHOP</span><ArrowRight size={20} /></Button></div></div>}

            {step === 5 && <div className="flex flex-1 flex-col"><div className="pt-3"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C6FF00] text-black"><Store size={27} /></div><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">YOUR ACCOUNT</p><h1 className="mt-4 text-4xl font-black leading-tight">Save your shop and keep building.</h1><p className="mt-4 text-sm leading-6 text-zinc-400">Create an account so your storefront preview and settings are saved securely.</p></div><div className="mt-7 space-y-3"><Field autoFocus type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" /><Field type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp number · +263" /><Field type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password · 6+ characters" /></div><div className="mt-auto pt-7"><Button disabled={loading} onClick={createAccount}><span>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</Button><button onClick={() => navigate('/login')} className="mt-4 w-full text-center text-xs font-bold text-zinc-500">Already have an account? <span className="text-[#C6FF00] underline">Log in</span></button></div></div>}

            {step === 6 && <div className="flex flex-1 flex-col"><div className="pt-3"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">YOUR BUSINESS</p><h1 className="mt-4 text-4xl font-black leading-tight">What’s your shop called?</h1><p className="mt-4 text-sm leading-6 text-zinc-400">This is the name customers will see on your ThreadZW storefront.</p></div><div className="mt-8 space-y-4"><Field autoFocus value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Shop name · e.g. Byo streetwear" /><select value={city} onChange={e => setCity(e.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-[#141414] px-4 py-4 text-base font-semibold text-white outline-none focus:border-[#C6FF00]"><option value="">Where are you based?</option>{CITIES.map(item => <option key={item}>{item}</option>)}</select><Field value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp number · +263" /><textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="A short description of your brand (optional)" className="w-full resize-none rounded-2xl border border-zinc-700 bg-[#141414] px-4 py-4 text-sm font-semibold text-white outline-none placeholder:text-zinc-500 focus:border-[#C6FF00]" /></div><div className="mt-auto pt-7"><Button disabled={loading} onClick={saveShop}><span>{loading ? 'SAVING...' : 'CONTINUE'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</Button></div></div>}

            {step === 7 && <div className="flex flex-1 flex-col"><div className="pt-3"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">MAKE IT YOURS</p><h1 className="mt-4 text-4xl font-black leading-tight">Choose a look that feels like your business.</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Eight different storefront designs. All built to help customers browse and buy.</p></div><div className="mt-6 grid grid-cols-2 gap-3">{THEMES.map(theme => <button key={theme.id} type="button" onClick={() => setSelectedTheme(theme.id)} className={`rounded-2xl border p-3 text-left transition ${selectedTheme === theme.id ? 'border-[#C6FF00] bg-[#141414] ring-2 ring-[#C6FF00]' : 'border-zinc-700 bg-[#141414]'}`}><div className={`mb-3 h-14 bg-zinc-700 ${theme.shape} ${selectedTheme === theme.id ? 'bg-[#C6FF00]' : ''}`} /><div className="text-sm font-black">{theme.name}</div><div className="mt-1 text-[10px] leading-tight text-zinc-500">{theme.note}</div></button>)}</div><div className="mt-auto pt-6"><Button disabled={loading} onClick={saveTheme}><span>{loading ? 'SAVING STYLE...' : 'USE THIS STYLE'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</Button></div></div>}

            {step === 8 && <div className="flex flex-1 flex-col"><div className="pt-3"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">YOUR PREVIEW</p><h1 className="mt-4 text-4xl font-black leading-tight">Your storefront is taking shape.</h1><p className="mt-3 text-sm leading-6 text-zinc-400">This is a private preview. Sample products show you how your shop will look.</p></div><div className="mt-7 overflow-hidden rounded-3xl border border-zinc-700 bg-white text-black"><div className="bg-[#C6FF00] py-2 text-center text-[9px] font-black uppercase tracking-widest">Powered by ThreadZW</div><div className="p-4"><div className="flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-zinc-200" /><div><div className="font-black">{shopName || 'Your Shop'}</div><div className="text-xs text-zinc-500">Zimbabwe store link</div></div></div><div className="mt-4 h-28 rounded-2xl bg-zinc-200" /><div className="mt-4 text-xl font-black">Your products, all in one place.</div><div className="mt-3 grid grid-cols-2 gap-2"><div className="h-20 rounded-xl bg-zinc-200" /><div className="h-20 rounded-xl bg-zinc-300" /></div><div className="mt-4 rounded-full bg-[#C6FF00] py-3 text-center text-xs font-black">BROWSE CATALOG →</div></div></div><div className="mt-auto pt-7"><Button onClick={() => go(9)}><span>PREVIEW STOREFRONT</span><ExternalLink size={19} /></Button></div></div>}

            {step === 9 && <div className="flex flex-1 flex-col"><div className="pt-3"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">READY TO GO LIVE</p><h1 className="mt-4 text-4xl font-black leading-tight">Your shop is ready.</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Activate it to replace the sample products with your own and start sharing your link.</p></div><div className="mt-8 space-y-3"><div className="flex items-center gap-3 rounded-2xl bg-[#141414] p-4"><Check className="text-[#C6FF00]" /><span className="text-sm font-bold">Private storefront preview</span></div><div className="flex items-center gap-3 rounded-2xl bg-[#141414] p-4"><Check className="text-[#C6FF00]" /><span className="text-sm font-bold">Choose your storefront design</span></div><div className="flex items-center gap-3 rounded-2xl bg-[#141414] p-4"><Check className="text-[#C6FF00]" /><span className="text-sm font-bold">Ready for WhatsApp orders</span></div></div><div className="mt-auto pt-7"><Button onClick={() => go(10)}><span>ACTIVATE MY STOREFRONT</span><ArrowRight size={20} /></Button></div></div>}

            {step === 10 && <div className="flex flex-1 flex-col"><div className="pt-3"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">CHOOSE YOUR PLAN</p><h1 className="mt-4 text-4xl font-black leading-tight">Put your shop online.</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Choose the plan that works for your business.</p></div><div className="mt-7 space-y-3"><div className="rounded-2xl border-2 border-[#C6FF00] bg-[#141414] p-5"><div className="flex items-center justify-between"><div><div className="text-2xl font-black">$1 <span className="text-sm text-zinc-400">/ month</span></div><div className="mt-1 text-xs text-zinc-500">Flexible monthly plan · cancel anytime</div></div><div className="rounded-full bg-[#C6FF00] px-3 py-1 text-[10px] font-black text-black">FLEXIBLE</div></div></div><div className="rounded-2xl border border-zinc-700 bg-[#141414] p-5"><div className="flex items-center justify-between"><div><div className="text-2xl font-black">$9 <span className="text-sm text-zinc-400">once-off</span></div><div className="mt-1 text-xs text-zinc-500">One payment · best for long-term use</div></div><div className="rounded-full bg-[#C6FF00] px-3 py-1 text-[10px] font-black text-black">POPULAR</div></div></div></div><div className="mt-auto pt-7"><Button onClick={() => navigate('/paywall')}><span>CONTINUE TO PAYMENT</span><ArrowRight size={20} /></Button><button onClick={finish} className="mt-4 w-full py-2 text-xs font-bold text-zinc-500">Keep my private preview</button></div></div>}

            {step === 11 && <div className="flex flex-1 flex-col items-center justify-center text-center"><div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[#C6FF00] text-black"><Bell size={34} /></div><h1 className="text-4xl font-black leading-tight">You’re ready to sell.</h1><p className="mt-4 max-w-xs text-sm leading-6 text-zinc-400">Your ThreadZW storefront is ready. Share one link and let customers browse, order on WhatsApp or visit your shop.</p><div className="mt-auto w-full pt-8"><Button onClick={finish}><span>GO TO MY DASHBOARD</span><ArrowRight size={20} /></Button></div></div>}
          </motion.section>
        </AnimatePresence>
      </div>
    </main>
  );
};

export default ThreadzwOnboarding;
