import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, MessageCircle, Store, Shirt, ShoppingBag, Copy, ExternalLink, AlertCircle, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useShopContext } from '../context/ShopContext';
import { uploadImage } from '../utils/uploadImage';

const TOTAL_STEPS = 6;
const CITIES = ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Masvingo', 'Other'];
const CATEGORIES = [
  { name: 'Clothing', image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=600&q=80', hint: 'Everyday style & streetwear' },
  { name: 'Shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', hint: 'Sneakers & footwear' },
  { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80', hint: 'Bags, jewellery & more' },
  { name: 'Other', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80', hint: 'Something different' },
];

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
  const [shopHandle, setShopHandle] = useState(localStorage.getItem('threadzw_onboarding_handle') || '');
  const [handleTouched, setHandleTouched] = useState(Boolean(localStorage.getItem('threadzw_onboarding_handle')));
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
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

  const slug = useMemo(() => (shopHandle || shopName).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), [shopName, shopHandle]);

  useEffect(() => {
    if (!handleTouched) setShopHandle(shopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }, [shopName, handleTouched]);

  useEffect(() => {
    const candidate = slug;
    if (candidate.length < 3) { setHandleStatus('idle'); return; }
    setHandleStatus('checking');
    const timer = window.setTimeout(async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc('is_shop_slug_available', { p_slug: candidate });
        if (rpcError) throw rpcError;
        setHandleStatus(data ? 'available' : 'taken');
      } catch {
        setHandleStatus('error');
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [slug]);
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
    localStorage.setItem('threadzw_onboarding_handle', shopHandle);
    localStorage.setItem('threadzw_onboarding_phone', phone);
  }, [category, city, shopName, shopHandle, phone]);

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
      let logoUrl: string | null = null;
      if (avatarFile) {
        logoUrl = await uploadImage({ supabase, file: avatarFile, bucket: 'shop-avatars', folder: 'shop-avatar', userId: data.user.id });
      }
      const shopCategory = category === 'Clothing' ? 'clothing' : 'general';
      const { data: newShopId, error: shopError } = await supabase.rpc('create_shop_from_onboarding', {
        p_shop: {
          name: shopName.trim(), slug: slug || `shop-${Date.now().toString(36)}`,
          description: `${shopName.trim()} storefront on ThreadZW.`, bio: null,
          whatsapp_number: phone.trim(), city: selectedCity, page_type: shopCategory,
          categories: [category], logo_url: logoUrl,
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
      <section className="relative -mx-5 -mt-6 mb-6 min-h-[390px] overflow-hidden rounded-b-[2rem] bg-zinc-950 text-white">
        <img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=85" alt="Contemporary streetwear fashion" className="absolute inset-0 h-full w-full object-cover object-center opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
        <div className="relative flex min-h-[390px] flex-col justify-between p-6">
          <div className="flex items-center justify-between"><span className="text-xl font-black tracking-tight">Thread<span className="text-[#C6FF00]">ZW</span></span><button type="button" onClick={() => { setError(''); go(2); }} className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">Skip intro</button></div>
          <div className="pb-2"><p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-[#C6FF00]">Sell · Grow · Zimbabwe</p><h1 className="max-w-xs text-4xl font-black leading-[1.03] tracking-tight">Turn your style into <span className="text-[#C6FF00]">sales.</span></h1><p className="mt-4 max-w-sm text-sm leading-6 text-white/85">Create a beautiful online shop, showcase your products and help more customers discover your brand.</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full border border-white/25 bg-white/10 px-3 py-2">Your own storefront</span><span className="rounded-full border border-white/25 bg-white/10 px-3 py-2">WhatsApp orders</span></div></div>
        </div>
      </section>
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">Create your ThreadZW account</h2>
      <p className="mt-2 text-sm leading-5 text-zinc-500">Start building your shop in a few simple steps.</p>
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
      <div className="mt-5 grid grid-cols-2 gap-3">{CATEGORIES.map(item => <button key={item.name} type="button" onClick={() => setCategory(item.name)} aria-pressed={category === item.name} className={`group relative min-h-44 overflow-hidden rounded-2xl border text-left transition ${category === item.name ? 'border-[#C6FF00] ring-2 ring-[#C6FF00]' : 'border-zinc-200'}`}><img src={item.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5"/><span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full ${category === item.name ? 'bg-[#C6FF00] text-zinc-950' : 'border border-white/70 bg-black/20 text-transparent'}`}><Check size={14}/></span><span className="absolute inset-x-3 bottom-3 text-white"><span className="block text-base font-extrabold">{item.name}</span><span className="mt-0.5 block text-[11px] leading-4 text-white/80">{item.hint}</span></span></button>)}</div>
      <div className="mt-6"><label className="block space-y-2"><span className="text-xs font-semibold">City</span><select value={city} onChange={e => setCity(e.target.value)} className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"><option value="">Choose your city</option>{CITIES.map(c => <option key={c}>{c}</option>)}</select></label>{city === 'Other' && <div className="mt-3"><Field label="Your city or town" value={otherCity} onChange={e => setOtherCity(e.target.value)} placeholder="Enter city or town" /></div>}</div>
      <p className="mt-4 text-xs text-zinc-500">You can update your shop details later in your dashboard.</p>
    </>;
    if (step === 3) return <>
      <h1 className="text-3xl font-extrabold tracking-tight">Create your shop</h1><p className="mt-2 text-sm text-zinc-500">Add the details customers will use to recognise your shop and contact you.</p>
      <div className="mt-5 space-y-4"><div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 bg-white p-5"><input id="threadzw-shop-avatar" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { setError('Choose a JPG, PNG or WebP image.'); return; } if (file.size > 12 * 1024 * 1024) { setError('Choose an image smaller than 12MB.'); return; } setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); setError(''); }} /><label htmlFor="threadzw-shop-avatar" className="group flex cursor-pointer flex-col items-center gap-2"><span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-zinc-500">{avatarPreview ? <img src={avatarPreview} alt="Shop logo preview" className="h-full w-full object-cover"/> : <Camera size={25}/>}</span><span className="text-sm font-bold">{avatarFile ? 'Change shop photo' : 'Add shop photo'}</span><span className="text-xs text-zinc-500">Optional · JPG, PNG or WebP</span></label></div><Field label="Shop name" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Your shop name" autoComplete="organization" maxLength={60}/><Field label="WhatsApp order number" value={phone} onChange={e => formatPhone(e.target.value)} placeholder="+263 77 123 4567" inputMode="tel" type="tel" autoComplete="tel"/>
      <div className="space-y-3"><Field label="Shop username / handle" value={shopHandle} onChange={e => { setHandleTouched(true); setShopHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')); }} placeholder="your-shop-name" autoComplete="off" maxLength={40}/><div className="flex items-center gap-2 text-xs">{handleStatus === 'checking' && <><Loader2 size={13} className="animate-spin"/><span className="text-zinc-500">Checking availability…</span></>}{handleStatus === 'available' && <><Check size={13} className="text-emerald-600"/><span className="text-emerald-700">This username is available</span></>}{handleStatus === 'taken' && <><AlertCircle size={13} className="text-red-600"/><span className="text-red-700">This username is already taken</span></>}{handleStatus === 'error' && <span className="text-zinc-500">Availability check unavailable; we’ll confirm when saving.</span>}{handleStatus === 'idle' && <span className="text-zinc-500">Use at least 3 letters or numbers.</span>}</div><div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><p className="text-[11px] font-semibold text-zinc-500">YOUR STOREFRONT LINK</p><p className="mt-1 break-all text-sm font-semibold">{slug ? `${window.location.origin}/${slug}` : 'Your link will be based on your username'}</p><p className="mt-1 text-xs text-zinc-500">Your final link is confirmed after your shop is saved.</p></div></div></div>
      {renderError}
    </>;
    if (step === 4) return <>
      <section className="relative -mx-5 -mt-6 mb-5 min-h-[250px] overflow-hidden bg-zinc-950 text-white">
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85" alt="Fashion boutique shopping" className="absolute inset-0 h-full w-full object-cover opacity-65"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/5"/>
        <div className="relative flex min-h-[250px] flex-col justify-end p-5"><span className="mb-3 w-fit rounded-full bg-[#C6FF00] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-zinc-950">3 days on us</span><h1 className="max-w-xs text-3xl font-black leading-tight">Your shop. Your style. Your next sale.</h1><p className="mt-2 max-w-sm text-sm leading-5 text-white/85">Explore everything ThreadZW can do for your business.</p></div>
      </section>
      <h2 className="text-xl font-extrabold tracking-tight">Your free trial starts now</h2><p className="mt-1 text-sm text-zinc-500">No payment required to get started.</p>
      <div className="mt-4 space-y-3">{[{title:'Your own storefront',desc:'A shareable shop link for your brand',icon:<Store size={19}/>},{title:'Unlimited products',desc:'Add photos, prices, sizes and stock during your trial',icon:<ShoppingBag size={19}/>},{title:'WhatsApp enquiries',desc:'Let customers contact you directly',icon:<MessageCircle size={19}/>}].map(item => <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0FBD0] text-zinc-900">{item.icon}</span><span><span className="block text-sm font-bold">{item.title}</span><span className="mt-0.5 block text-xs leading-4 text-zinc-500">{item.desc}</span></span><Check size={17} className="ml-auto shrink-0 text-lime-700"/></div>)}</div>
      <div className="mt-4 rounded-2xl bg-zinc-100 p-4"><p className="text-sm font-bold">After your 3-day trial</p><p className="mt-1 text-sm leading-5 text-zinc-600">ThreadZW Pro is $1.59/month. Your storefront remains viewable, while editing is paused until payment is verified.</p></div>
      {renderError}
    </>;
    if (step === 5) return <>
      <h1 className="text-3xl font-extrabold tracking-tight">Add your products</h1><p className="mt-2 text-sm text-zinc-500">Your shop is created. Add products with photos, prices, and stock using ThreadZW’s product editor.</p>
      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-100"><ShoppingBag size={20}/></div><div className="flex-1"><p className="font-bold">Product details and photos</p><p className="mt-1 text-xs text-zinc-500">Use the existing product editor to save and publish products.</p></div></div><div className="mt-4"><Button onClick={() => { localStorage.setItem('threadzw_onboarding_return_to_ready', 'true'); navigate('/add-product'); }}>Open product editor <ArrowRight size={16}/></Button></div></div>
      <p className="mt-4 text-xs leading-5 text-zinc-500">You can also add products later from your dashboard. Product setup is optional for now.</p>
    </>;
    const realUrl = shopUrl || (shop?.slug ? `${window.location.origin}/${shop.slug}` : '');
    return <>
      <h1 className="text-2xl font-extrabold tracking-tight">Preview your storefront</h1>
      <p className="mt-1 text-sm text-zinc-500">This is how customers can recognise and contact your shop.</p>
      <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative h-28 bg-zinc-900"><img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80" alt="" className="h-full w-full object-cover opacity-65"/><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/></div>
        <div className="px-4 pb-4"><div className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-zinc-100 text-zinc-600">{avatarPreview ? <img src={avatarPreview} alt="" className="h-full w-full object-cover"/> : <Store size={25}/>}</div><h2 className="mt-2 text-lg font-extrabold">{shopName || shop?.name || 'Your shop name'}</h2><p className="text-xs text-zinc-500">@{shopSlug || slug || 'your-shop'} · {selectedCity || shop?.city || 'Zimbabwe'}</p><span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#F0FBD0] px-3 py-2 text-xs font-bold"><MessageCircle size={14}/> WhatsApp enquiries</span><div className="mt-4 grid grid-cols-2 gap-2"><div className="h-20 rounded-xl bg-zinc-100 p-3"><Shirt size={17} className="text-zinc-400"/><p className="mt-2 text-[10px] text-zinc-500">Your products appear here</p></div><div className="h-20 rounded-xl bg-zinc-100 p-3"><ShoppingBag size={17} className="text-zinc-400"/><p className="mt-2 text-[10px] text-zinc-500">Add products to get started</p></div></div></div>
      </div>
      <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-lime-100 text-lime-700"><Check size={28}/></div>
      <h1 className="mt-3 text-center text-2xl font-extrabold tracking-tight">Your shop is ready!</h1>
      <p className="mt-2 text-center text-sm text-zinc-500">Share your storefront and invite customers to browse products and contact you on WhatsApp.</p>
      {realUrl ? <div className="mt-5 rounded-xl border border-zinc-200 p-3"><p className="break-all text-sm font-semibold">{realUrl}</p><div className="mt-3 grid grid-cols-2 gap-2"><Button secondary onClick={copyLink}><Copy size={15}/>{copied ? 'Copied' : 'Copy link'}</Button><Button secondary onClick={() => window.open(realUrl, '_blank', 'noopener,noreferrer')}><ExternalLink size={15}/>Visit shop</Button></div><Button onClick={() => { const message = encodeURIComponent(`Check out my ThreadZW shop: ${realUrl}`); window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer'); }}><MessageCircle size={16}/>Share on WhatsApp</Button></div> : <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Your shop link is not available yet. Please open your dashboard to confirm your shop was saved.</div>}
      <div className="mt-4"><Button onClick={() => { localStorage.removeItem('threadzw_onboarding_step'); localStorage.removeItem('threadzw_onboarding_return_to_ready'); navigate('/dashboard', { replace: true }); }}>Go to dashboard <ArrowRight size={16}/></Button></div>
    </>;
  };

  const next = async () => {
    setError('');
    if (step === 2 && (!selectedCity || (city === 'Other' && !otherCity.trim()))) { setError('Choose or enter your city to continue.'); return; }
    if (step === 3) {
      if (shopHandle.trim().length < 3) { setError('Choose a username with at least 3 characters.'); return; }
      if (handleStatus === 'taken') { setError('That shop username is already taken. Try another one.'); return; }
      await createAccountAndShop(); return;
    }
    if (step === 4) { go(5); return; }
    if (step === 5) { go(6); return; }
    if (step < TOTAL_STEPS) go(step + 1);
  };

  return <div className="fixed inset-0 z-[45] overflow-y-auto bg-[#F8F7F1] font-sans text-zinc-950">
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-[#F8F7F1] shadow-sm">
      <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-[#F8F7F1]/95 px-5 pb-4 pt-4 backdrop-blur">
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
