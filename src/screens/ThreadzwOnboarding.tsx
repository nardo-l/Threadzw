import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, MessageCircle, Store, Shirt, ShoppingBag, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useShopContext } from '../context/ShopContext';

const TOTAL_STEPS = 6;
const CITIES = ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Masvingo', 'Other'];
const CATEGORIES = ['Clothing', 'Shoes', 'Accessories', 'Other'];

const Button = ({ children, onClick, disabled = false, secondary = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; secondary?: boolean;
}) => <button type="button" onClick={onClick} disabled={disabled} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50 ${secondary ? 'border border-zinc-200 bg-white text-zinc-900' : 'bg-[#C6FF00] text-zinc-950 hover:bg-[#d5ff45]'}`}>{children}</button>;

const Field = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => {
  const { label, className, ...rest } = props;
  return <label className="block space-y-1.5"><span className="text-xs font-semibold text-zinc-800">{label}</span><input {...rest} className={`h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-lime-500 ${className || ''}`} /></label>;
};

export const ThreadzwOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { refreshShop, shop } = useShopContext();
  const [step, setStep] = useState(() => {
    const saved = Number(localStorage.getItem('threadzw_onboarding_step') || 1);
    return Number.isFinite(saved) && saved >= 1 && saved <= TOTAL_STEPS ? saved : 1;
  });
  const [category, setCategory] = useState(localStorage.getItem('threadzw_onboarding_category') || 'Clothing');
  const [city, setCity] = useState(localStorage.getItem('threadzw_onboarding_city') || '');
  const [otherCity, setOtherCity] = useState('');
  const [shopName, setShopName] = useState(localStorage.getItem('threadzw_onboarding_shop_name') || '');
  const [phone, setPhone] = useState(localStorage.getItem('threadzw_onboarding_phone') || '+263 ');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdShopId, setCreatedShopId] = useState(localStorage.getItem('threadzw_onboarding_shop_id') || '');
  const [shopSlug, setShopSlug] = useState(localStorage.getItem('threadzw_onboarding_shop_slug') || '');
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => shopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), [shopName]);
  const selectedCity = city === 'Other' ? otherCity.trim() : city;
  const phoneDigits = phone.replace(/\D/g, '').replace(/^263/, '');
  const validPhone = phoneDigits.length >= 8 && phoneDigits.length <= 9;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validPassword = password.length >= 6;
  const shopUrl = shopSlug ? `${window.location.origin}/${shopSlug}` : '';

  useEffect(() => { localStorage.setItem('threadzw_onboarding_step', String(step)); }, [step]);
  useEffect(() => {
    localStorage.setItem('threadzw_onboarding_category', category);
    localStorage.setItem('threadzw_onboarding_city', city);
    localStorage.setItem('threadzw_onboarding_shop_name', shopName);
    localStorage.setItem('threadzw_onboarding_phone', phone);
  }, [category, city, shopName, phone]);

  const go = (next: number) => { setError(''); setStep(Math.max(1, Math.min(TOTAL_STEPS, next))); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').replace(/^263/, '').slice(0, 9);
    setPhone('+263 ' + [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 9)].filter(Boolean).join(' '));
  };

  const createAccountAndShop = async () => {
    if (!ownerName.trim()) return setError('Enter your name to continue.');
    if (!validEmail) return setError('Enter a valid email address.');
    if (!validPassword) return setError('Use a password with at least 6 characters.');
    if (shopName.trim().length < 2) return setError('Enter a shop name with at least 2 characters.');
    if (!selectedCity) return setError('Choose your city or enter it under Other.');
    if (!validPhone) return setError('Enter a valid Zimbabwe WhatsApp number.');
    setLoading(true); setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), password,
        options: { data: { full_name: ownerName.trim(), phone_number: phone.trim() } },
      });
      const alreadyRegistered = signUpError?.message?.toLowerCase().includes('already registered') ||
        signUpError?.message?.toLowerCase().includes('already exists') ||
        (!!data.user && !data.session && Array.isArray(data.user.identities) && data.user.identities.length === 0);
      if (alreadyRegistered) throw new Error('An account with this email already exists. Sign in instead.');
      if (signUpError) throw signUpError;
      if (!data.session || !data.user) throw new Error('Your account was created, but email confirmation is required. Confirm your email, then sign in to finish creating your shop.');
      const shopCategory = category === 'Clothing' ? 'clothing' : 'general';
      const { data: newShopId, error: shopError } = await supabase.rpc('create_shop_from_onboarding', {
        p_shop: {
          name: shopName.trim(), slug: slug || `shop-${Date.now().toString(36)}`,
          description: `${shopName.trim()} storefront on ThreadZW.`, bio: null,
          whatsapp_number: phone.trim(), city: selectedCity, page_type: shopCategory,
        },
      });
      if (shopError) throw shopError;
      if (!newShopId) throw new Error('Your account was created, but the shop was not returned by the server. Please sign in and try again.');
      setCreatedShopId(String(newShopId));
      const { data: savedShop } = await supabase.from('shops').select('slug').eq('id', newShopId).maybeSingle();
      const savedSlug = savedShop?.slug || slug;
      setShopSlug(savedSlug);
      localStorage.setItem('threadzw_onboarding_shop_id', String(newShopId));
      localStorage.setItem('threadzw_onboarding_shop_slug', savedSlug);
      localStorage.setItem('threadzw_onboarding_completed', 'true');
      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('supabase_logged_in_user_id', data.user.id);
      await refreshShop();
      toast.success('Your shop has been created and your 3-day unlimited trial has started.');
      go(4);
    } catch (e: any) {
      setError(e?.message || 'We could not create your account and shop. Please try again.');
    } finally { setLoading(false); }
  };

  const signInWithGoogle = async () => {
    setLoading(true); setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
    } catch (e: any) { setError(e?.message || 'Google sign-in is unavailable right now.'); setLoading(false); }
  };

  const copyLink = async () => {
    if (!shopUrl) return;
    try { await navigator.clipboard.writeText(shopUrl); setCopied(true); toast.success('Shop link copied.'); }
    catch { toast.error('Could not copy the link. You can select and copy it manually.'); }
  };

  const renderError = error ? <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" /><span>{error}</span></div> : null;

  const renderStep = () => {
    if (step === 1) return <>
      <div className="flex h-14 w-14 -rotate-3 items-center justify-center rounded-2xl bg-[#C6FF00] text-xl font-black">TZ</div>
      <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight">Create your ThreadZW shop</h1>
      <p className="mt-2 text-sm leading-5 text-zinc-500">One link for your products and WhatsApp orders.</p>
      <div className="mt-6 space-y-4">
        <Field label="Your name" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Your name" autoComplete="name" />
        <Field label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        <label className="block space-y-1.5"><span className="text-xs font-semibold text-zinc-800">Password</span><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 6 characters" className="h-12 w-full rounded-xl border border-zinc-200 px-3 pr-12 text-sm outline-none focus:border-lime-500" /><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-2 rounded-lg p-2 text-zinc-500">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        {renderError}
        <Button onClick={() => { setError(''); if (!ownerName.trim() || !validEmail || !validPassword) { setError('Enter your name, a valid email, and a password of at least 6 characters.'); return; } go(2); }}>Continue with email <ArrowRight size={16} /></Button>
        <div className="flex items-center gap-3 text-xs text-zinc-400"><span className="h-px flex-1 bg-zinc-200" />or<span className="h-px flex-1 bg-zinc-200" /></div>
        <Button secondary onClick={signInWithGoogle} disabled={loading}><span className="font-bold text-blue-600">G</span> Continue with Google</Button>
        <p className="text-center text-xs text-zinc-500">Already have an account? <button onClick={() => navigate('/login')} className="font-bold text-zinc-900 underline">Sign in</button></p>
      </div>
    </>;
    if (step === 2) return <>
      <h1 className="text-3xl font-extrabold tracking-tight">Getting started</h1>
      <p className="mt-2 text-sm text-zinc-500">What do you sell? Choose the category that best describes your shop.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">{CATEGORIES.map(item => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`flex min-h-20 items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold ${category === item ? 'border-lime-400 bg-lime-50' : 'border-zinc-200 bg-white'}`}><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${category === item ? 'bg-[#C6FF00]' : 'bg-zinc-100'}`}>{item === 'Clothing' ? <Shirt size={17}/> : <ShoppingBag size={17}/>}</span>{item}{category === item && <Check size={16} className="ml-auto" />}</button>)}</div>
      <div className="mt-6"><label className="block space-y-2"><span className="text-xs font-semibold">City</span><select value={city} onChange={e => setCity(e.target.value)} className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"><option value="">Choose your city</option>{CITIES.map(c => <option key={c}>{c}</option>)}</select></label>{city === 'Other' && <div className="mt-3"><Field label="Your city or town" value={otherCity} onChange={e => setOtherCity(e.target.value)} placeholder="Enter city or town" /></div>}</div>
      <p className="mt-4 text-xs text-zinc-500">You can update your shop details later in your dashboard.</p>
    </>;
    if (step === 3) return <>
      <h1 className="text-3xl font-extrabold tracking-tight">Create your shop</h1><p className="mt-2 text-sm text-zinc-500">Add the details customers will use to recognise your shop and contact you.</p>
      <div className="mt-5 space-y-4"><Field label="Shop name" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Your shop name" autoComplete="organization" maxLength={60}/><Field label="WhatsApp order number" value={phone} onChange={e => formatPhone(e.target.value)} placeholder="+263 77 123 4567" inputMode="tel" type="tel" autoComplete="tel"/>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><p className="text-[11px] font-semibold text-zinc-500">SHOP LINK PREVIEW</p><p className="mt-1 break-all text-sm font-semibold">{slug ? `${window.location.origin}/${slug}` : 'Your link will be based on your shop name'}</p><p className="mt-1 text-xs text-zinc-500">The final link is confirmed after your shop is saved.</p></div></div>
      {renderError}
    </>;
    if (step === 4) return <>
      <h1 className="text-3xl font-extrabold tracking-tight">Start your free trial</h1><p className="mt-2 text-sm text-zinc-500">Get your shop online and add products. You can decide about payment after your trial.</p>
      <div className="mt-5 rounded-2xl border border-zinc-200 p-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-100"><Store size={22}/></div><div><p className="font-bold">3-day unlimited trial</p><p className="text-sm text-zinc-500">No payment required to start</p></div></div><ul className="mt-5 space-y-3 text-sm">{['Create and share your storefront','Add unlimited products during the trial','Receive customer enquiries and orders through WhatsApp'].map(t => <li key={t} className="flex gap-2"><Check size={17} className="shrink-0 text-lime-600"/>{t}</li>)}</ul><div className="mt-5 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">After the trial, ThreadZW Pro is $1.59/month. Your shop stays online in view-only mode until payment is verified.</div></div>
      {renderError}
    </>;
    if (step === 5) return <>
      <h1 className="text-3xl font-extrabold tracking-tight">Add your products</h1><p className="mt-2 text-sm text-zinc-500">Your shop is created. Add products with photos, prices, and stock using ThreadZW’s product editor.</p>
      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-100"><ShoppingBag size={20}/></div><div className="flex-1"><p className="font-bold">Product details and photos</p><p className="mt-1 text-xs text-zinc-500">Use the existing product editor to save and publish products.</p></div></div><div className="mt-4"><Button onClick={() => { localStorage.setItem('threadzw_onboarding_return_to_ready', 'true'); navigate('/add-product'); }}>Open product editor <ArrowRight size={16}/></Button></div></div>
      <p className="mt-4 text-xs leading-5 text-zinc-500">You can also add products later from your dashboard. Product setup is optional for now.</p>
    </>;
    const realUrl = shopUrl || (shop?.slug ? `${window.location.origin}/${shop.slug}` : '');
    return <>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime-100 text-lime-700"><Check size={28}/></div>
      <h1 className="mt-4 text-center text-3xl font-extrabold tracking-tight">Your shop is ready!</h1>
      <p className="mt-2 text-center text-sm text-zinc-500">Share your storefront and invite customers to browse products and contact you on WhatsApp.</p>
      {realUrl ? <div className="mt-5 rounded-xl border border-zinc-200 p-3"><p className="break-all text-sm font-semibold">{realUrl}</p><div className="mt-3 grid grid-cols-2 gap-2"><Button secondary onClick={copyLink}><Copy size={15}/>{copied ? 'Copied' : 'Copy link'}</Button><Button secondary onClick={() => window.open(realUrl, '_blank', 'noopener,noreferrer')}><ExternalLink size={15}/>Visit shop</Button></div><Button onClick={() => { const message = encodeURIComponent(`Check out my ThreadZW shop: ${realUrl}`); window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer'); }}><MessageCircle size={16}/>Share on WhatsApp</Button></div> : <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Your shop link is not available yet. Please open your dashboard to confirm your shop was saved.</div>}
      <div className="mt-4"><Button onClick={() => { localStorage.removeItem('threadzw_onboarding_step'); localStorage.removeItem('threadzw_onboarding_return_to_ready'); navigate('/dashboard', { replace: true }); }}>Go to dashboard <ArrowRight size={16}/></Button></div>
    </>;
  };

  const next = async () => {
    setError('');
    if (step === 2 && (!selectedCity || (city === 'Other' && !otherCity.trim()))) { setError('Choose or enter your city to continue.'); return; }
    if (step === 3) { await createAccountAndShop(); return; }
    if (step === 4) { go(5); return; }
    if (step === 5) { go(6); return; }
    if (step < TOTAL_STEPS) go(step + 1);
  };

  return <div className="fixed inset-0 z-[45] overflow-y-auto bg-[#FAFBF8] font-sans text-zinc-950">
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-white shadow-sm">
      <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/95 px-5 pb-4 pt-4 backdrop-blur">
        <div className="mb-4 flex items-center justify-between"><button type="button" onClick={() => step > 1 ? go(step - 1) : navigate('/')} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white"><ArrowLeft size={17}/></button><span className="text-lg font-black tracking-tight">Thread<span className="text-lime-600">ZW</span></span><span className="text-xs font-medium text-zinc-500">{step} / {TOTAL_STEPS}</span></div>
        <div className="flex gap-1.5" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>{Array.from({length: TOTAL_STEPS}, (_,i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-[#C6FF00]' : 'bg-zinc-200'}`}/>)}</div>
      </header>
      <main className="flex flex-1 flex-col px-5 py-6">
        <AnimatePresence mode="wait"><motion.div key={step} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}} transition={{duration:.16}} className="flex flex-1 flex-col">
          <div className="flex-1">{renderStep()}</div>
          {step !== 1 && step !== 6 && <div className="mt-5">{renderError}</div>}
          {step !== 1 && step !== 6 && <div className="mt-5"><Button onClick={next} disabled={loading}>{loading ? <Loader2 size={17} className="animate-spin"/> : null}{step === 3 ? 'Create shop' : step === 4 ? 'Continue with trial' : 'Continue'} <ArrowRight size={16}/></Button></div>}
          {step === 5 && <button type="button" onClick={() => go(6)} className="mt-3 min-h-10 text-sm font-medium text-zinc-500 underline">I’ll do this later</button>}
          {step === 6 && <div className="mt-auto pt-5"><Button onClick={() => { localStorage.removeItem('threadzw_onboarding_step'); navigate('/dashboard', {replace:true}); }}>Go to dashboard <ArrowRight size={16}/></Button></div>}
        </motion.div></AnimatePresence>
      </main>
    </div>
  </div>;
};
