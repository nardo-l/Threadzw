import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Copy, ExternalLink, ImagePlus, Loader2,
  Bell, MessageCircle, Instagram, Music2, MoreHorizontal, Pencil,
  Store, BarChart3, Heart, ShoppingBag, Link2, Upload, Share2, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../utils/uploadImage';
import { useShopContext } from '../context/ShopContext';

const GREEN = '#C6FF00';
const CITIES = ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Masvingo', 'Other'];

const Progress = ({ step }: { step: number }) => (
  <div className="flex items-center gap-1.5 w-36" aria-label={`Step ${step} of 10`}>
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'bg-[#C6FF00]' : 'bg-zinc-200'}`} />
    ))}
  </div>
);

const Button = ({
  children, onClick, dark = false, disabled = false, secondary = false
}: {
  children: React.ReactNode; onClick?: () => void; dark?: boolean; disabled?: boolean; secondary?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 font-black transition active:scale-[0.99] disabled:opacity-50 ${secondary ? 'border border-zinc-200 bg-white text-black' : dark ? 'bg-black text-white' : 'bg-[#C6FF00] text-black'}`}
  >
    {children}
  </button>
);

export const ThreadzwOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { shop, refreshShop } = useShopContext();

  const [step, setStep] = useState<number>(() => {
    const saved = Number(localStorage.getItem('threadzw_onboarding_step') || '1');
    return saved >= 1 && saved <= 10 ? saved : 1;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAccountForm, setShowAccountForm] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+263 ');
  const [password, setPassword] = useState('');

  const [shopName, setShopName] = useState(shop?.name || '');
  const [city, setCity] = useState(shop?.city || '');
  const [bio, setBio] = useState(shop?.description || '');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(shop?.logo_url || '');

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState('');
  const [shopId, setShopId] = useState<string | null>(shop?.id || null);
  const [shopLink, setShopLink] = useState('');

  useEffect(() => {
    localStorage.setItem('threadzw_onboarding_step', String(step));
  }, [step]);

  useEffect(() => {
    if (shop?.id) {
      setShopId(shop.id);
      setShopName(shop.name || '');
      setCity(shop.city || '');
      setBio(shop.description || '');
      setLogoPreview(shop.logo_url || '');
      if (shop.slug) setShopLink(`${window.location.origin}/${shop.slug}`);
    }
  }, [shop]);

  const slug = useMemo(
    () => shopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    [shopName]
  );

  const go = (next: number) => {
    setError('');
    setStep(Math.max(1, Math.min(10, next)));
  };

  const getUser = async () => {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) throw new Error('Please log in again to continue.');
    return data.user;
  };

  const createAccount = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address.');
    if (phone.replace(/\\D/g, '').length < 9) return setError('Enter your WhatsApp number.');
    if (password.length < 6) return setError('Use a password with at least 6 characters.');
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: shopName.trim() || 'Shop Owner', phone_number: phone.trim() } }
      });
      let user = data.user;
      if (signUpError?.message.toLowerCase().includes('already registered')) {
        const signedIn = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signedIn.error) throw signedIn.error;
        user = signedIn.data.user;
      } else if (signUpError) {
        throw signUpError;
      } else if (!data.session) {
        const signedIn = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signedIn.error) throw signedIn.error;
        user = signedIn.data.user;
      }
      if (!user) throw new Error('Your account could not be created.');
      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('supabase_logged_in_user_id', user.id);
      setShowAccountForm(false);
      toast.success('Account created');
      go(2);
    } catch (e: any) {
      setError(e?.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  const saveShop = async () => {
    setError('');
    if (shopName.trim().length < 2) return setError('Enter your shop name.');
    if (!city) return setError('Choose your city or area.');
    setLoading(true);
    try {
      const user = await getUser();
      const existing = shopId || (await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle()).data?.id;
      const payload = {
        name: shopName.trim(),
        slug: slug || `shop-${Date.now().toString(36)}`,
        category: 'Streetwear & Fashion',
        description: bio.trim() || `${shopName.trim()} official storefront on ThreadZW.`,
        whatsapp_number: phone.trim(),
        city,
        location: city,
        is_active: true,
        page_type: 'clothing',
        plan: 'free',
        premium_status: 'inactive',
        product_limit: null
      };
      let id = existing;
      if (id) {
        const { error: updateError } = await supabase.from('shops').update(payload).eq('id', id);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('shops').insert({ ...payload, owner_id: user.id }).select('id, slug').single();
        if (insertError) throw insertError;
        id = inserted.id;
      }
      setShopId(id || null);
      setShopLink(`${window.location.origin}/${payload.slug}`);
      await refreshShop();
      toast.success('Your shop is ready');
      go(3);
    } catch (e: any) {
      setError(e?.message || 'Could not save your shop.');
    } finally {
      setLoading(false);
    }
  };

  const selectLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const saveIdentity = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await getUser();
      const id = shopId || shop?.id;
      if (!id) throw new Error('Your shop is not ready yet.');
      let logoUrl = logoPreview && !logoPreview.startsWith('data:') ? logoPreview : null;
      if (logoFile) {
        logoUrl = await uploadImage({
          supabase, file: logoFile, bucket: 'shop-avatars', folder: 'logo', userId: id || user.id
        });
      }
      const { error: updateError } = await supabase.from('shops').update({
        name: shopName.trim(), description: bio.trim() || `${shopName.trim()} official storefront on ThreadZW.`, logo_url: logoUrl
      }).eq('id', id);
      if (updateError) throw updateError;
      await refreshShop();
      toast.success('Shop identity saved');
      go(4);
    } catch (e: any) {
      setError(e?.message || 'Could not save your shop identity.');
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductFile(file);
    const reader = new FileReader();
    reader.onload = () => setProductPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const saveProduct = async () => {
    setError('');
    if (!productFile) return setError('Add one clear product photo.');
    if (productName.trim().length < 2) return setError('Enter a product name.');
    if (!price || Number(price) <= 0) return setError('Enter a valid price.');
    setLoading(true);
    try {
      const user = await getUser();
      const id = shopId || shop?.id;
      if (!id) throw new Error('Your shop is not ready yet.');
      const imageUrl = await uploadImage({
        supabase, file: productFile, bucket: 'product-images', folder: 'product', userId: id
      });
      const { error: productError } = await supabase.from('products').insert({
        shop_id: id,
        name: productName.trim(),
        price: Number(price),
        stock: 1,
        total_stock: 1,
        category: 'Clothing',
        description: '',
        images: [imageUrl],
        image_url: imageUrl,
        sizes: [],
        colours: [],
        is_published: true,
        status: 'active'
      });
      if (productError) throw productError;
      await refreshShop();
      toast.success('Your first product is live');
      go(5);
    } catch (e: any) {
      setError(e?.message || 'Could not publish your product.');
    } finally {
      setLoading(false);
    }
  };

  const share = async () => {
    const link = shopLink || (shop?.slug ? `${window.location.origin}/${shop.slug}` : '');
    if (!link) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: shopName, text: `Check out ${shopName} on ThreadZW`, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success('Shop link copied');
      }
    } catch {}
  };

  const copyLink = async () => {
    if (!shopLink) return;
    await navigator.clipboard.writeText(shopLink);
    toast.success('Shop link copied');
  };

  const enableNotifications = async () => {
    setLoading(true);
    try {
      if (!('Notification' in window)) {
        toast.error('Notifications are not supported in this browser.');
      } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') toast.success('Notifications enabled');
        else toast.info('You can enable notifications later from Settings.');
      }
      go(10);
    } catch {
      go(10);
    } finally {
      setLoading(false);
    }
  };

  const complete = () => {
    localStorage.removeItem('threadzw_onboarding_step');
    localStorage.setItem('threadzw_onboarding_completed', 'true');
    navigate('/dashboard', { replace: true });
  };

  const checklist = [
    { label: 'Shop name', done: !!shopName },
    { label: 'Shop description', done: !!bio },
    { label: 'First product', done: true },
    { label: 'Shop logo', done: !!logoPreview },
    { label: 'Set your location', done: !!city },
    { label: 'Customize your theme', done: false }
  ];
  const progress = Math.round((checklist.filter(x => x.done).length / checklist.length) * 100);

  return (
    <main className="min-h-screen bg-white text-black font-sans">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black tracking-tight">THREAD<span className="text-[#C6FF00]">ZW</span></div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sell more. Stress less.</div>
          </div>
          {step < 10 && <Progress step={step} />}
        </header>

        <AnimatePresence mode="wait">
          <motion.section key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.18 }} className="flex flex-1 flex-col pt-10">
            {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

            {step === 1 && (
              <div className="flex flex-1 flex-col">
                <div className="pt-8">
                  <h1 className="text-[3.25rem] font-black leading-[0.98] tracking-tight">Launch your<br />clothing store<br />in under<br /><span className="text-[#C6FF00]">60 seconds.</span></h1>
                  <p className="mt-5 text-sm leading-relaxed text-zinc-500">No coding. No website builders.<br />Just your brand.</p>
                </div>
                <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-zinc-100 bg-zinc-50">
                  <div className="grid grid-cols-2 gap-3 p-3">
                    <div className="h-32 rounded-2xl bg-gradient-to-br from-blue-100 to-white p-2 rotate-[-4deg] shadow-sm"><div className="h-full rounded-xl bg-blue-200/60" /></div>
                    <div className="h-32 rounded-2xl bg-gradient-to-br from-red-50 to-white p-2 rotate-[4deg] shadow-sm"><div className="h-full rounded-xl bg-red-100/70" /></div>
                  </div>
                </div>
                {!showAccountForm ? (
                  <div className="mt-auto space-y-3 pt-8">
                    <Button onClick={() => setShowAccountForm(true)}><span>GET STARTED</span><ArrowRight size={20} /></Button>
                    <button onClick={() => navigate('/login')} className="w-full py-2 text-xs font-bold text-zinc-500">Already have an account? <span className="text-black underline">Log in</span></button>
                  </div>
                ) : (
                  <div className="mt-auto space-y-3 pt-7">
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" />
                    <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+263 77 123 4567" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" />
                    <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password · 6+ characters" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" />
                    <Button onClick={createAccount} disabled={loading}><span>{loading ? 'CREATING...' : 'CREATE MY SHOP'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</Button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-1 flex-col">
                <button onClick={() => go(1)} className="mb-8 flex w-fit items-center gap-2 text-sm font-bold text-zinc-500"><ArrowLeft size={17} /> Back</button>
                <div className="text-center pt-4">
                  <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#C6FF00] bg-[#C6FF00]/20"><Store size={28} /></div>
                  <h1 className="text-4xl font-black leading-tight">What's your<br />shop name?</h1>
                  <p className="mt-3 text-sm text-zinc-500">This will be the name customers see.</p>
                </div>
                <div className="mt-10">
                  <input autoFocus value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Drip by Leo" className="w-full rounded-2xl border border-zinc-200 px-4 py-5 text-base font-semibold outline-none focus:border-black" />
                  <div className="mt-4"><select value={city} onChange={e => setCity(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold outline-none focus:border-black"><option value="">Where are you based?</option>{CITIES.map(c => <option key={c}>{c}</option>)}</select></div>
                </div>
                <div className="mt-auto pt-8"><Button onClick={saveShop} disabled={loading} dark><span>{loading ? 'SAVING...' : 'CONTINUE'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</Button></div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-1 flex-col">
                <button onClick={() => go(2)} className="mb-8 flex w-fit items-center gap-2 text-sm font-bold text-zinc-500"><ArrowLeft size={17} /> Back</button>
                <h1 className="text-4xl font-black leading-tight">Let's make<br />it yours.</h1>
                <p className="mt-3 text-sm text-zinc-500">Add your logo and a short description. You can skip the logo for now.</p>
                <div className="mt-8 space-y-5">
                  <label className="mx-auto block w-fit cursor-pointer">
                    {logoPreview ? <img src={logoPreview} alt="Shop logo" className="h-32 w-32 rounded-full object-cover border-4 border-black" /> : <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 border-dashed border-zinc-300 bg-zinc-50"><Upload size={25} /><span className="mt-2 text-[10px] font-black uppercase">Add logo</span></div>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectLogo} className="sr-only" />
                  </label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Premium streetwear and accessories. New drops every week." className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" />
                </div>
                <div className="mt-auto space-y-3 pt-8"><button onClick={saveIdentity} disabled={loading} className="flex w-full items-center justify-between rounded-2xl bg-[#C6FF00] px-5 py-4 font-black disabled:opacity-50"><span>{loading ? 'SAVING...' : 'CONTINUE'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</button><button onClick={saveIdentity} className="w-full py-2 text-xs font-black uppercase text-zinc-400">Skip logo for now</button></div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-1 flex-col">
                <button onClick={() => go(3)} className="mb-8 flex w-fit items-center gap-2 text-sm font-bold text-zinc-500"><ArrowLeft size={17} /> Back</button>
                <h1 className="text-4xl font-black leading-tight">Add your<br />first product.</h1>
                <p className="mt-3 text-sm text-zinc-500">One product is enough to launch. You can add more later.</p>
                <div className="mt-8 space-y-5">
                  <label className="block cursor-pointer">{productPreview ? <img src={productPreview} alt="Product preview" className="h-48 w-full rounded-[1.75rem] object-cover" /> : <div className="flex h-48 flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-zinc-300 bg-zinc-50"><ImagePlus size={30} /><span className="mt-2 text-sm font-black">Add product photo</span><span className="mt-1 text-xs text-zinc-400">JPG, PNG or WebP</span></div>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectProduct} className="sr-only" /></label>
                  <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Product name · e.g. Black Cross Hoodie" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" />
                  <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span><input value={price} onChange={e => setPrice(e.target.value)} type="number" min="0" placeholder="Price in USD" className="w-full rounded-2xl border border-zinc-200 px-8 py-4 text-sm font-semibold outline-none focus:border-black" /></div>
                </div>
                <div className="mt-auto pt-8"><Button onClick={saveProduct} disabled={loading}><span>{loading ? 'PUBLISHING...' : 'ADD PRODUCT'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</Button></div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-center pt-2"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C6FF00]"><Check size={34} strokeWidth={3} /></div></div>
                <div className="mt-7 text-center"><h1 className="text-4xl font-black leading-tight">Your shop<br />is live!</h1><p className="mt-3 text-sm text-zinc-500">Your first product is published and ready for customers.</p></div>
                <div className="mt-7 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 p-3 text-white">
                  <div className="rounded-2xl bg-white overflow-hidden">
                    <div className="bg-black px-4 py-4 text-center font-black">{shopName || 'YOUR SHOP'}</div>
                    {productPreview ? <img src={productPreview} alt="" className="h-44 w-full object-cover" /> : <div className="h-44 bg-zinc-100" />}
                    <div className="p-4"><div className="font-black">{productName || 'Your first product'}</div><div className="mt-1 text-sm text-zinc-500">$ {price || '0.00'}</div></div>
                  </div>
                </div>
                <div className="mt-auto pt-7"><Button onClick={() => go(6)}><span>CONTINUE</span><ArrowRight size={20} /></Button></div>
              </div>
            )}

            {step === 6 && (
              <div className="flex flex-1 flex-col">
                <h1 className="text-4xl font-black leading-tight">Welcome to<br />your dashboard 👋</h1>
                <p className="mt-3 text-sm text-zinc-500">This is where you'll manage your shop, products, orders and customers.</p>
                <div className="mt-8 rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                  <div className="bg-black p-4 text-white"><div className="text-sm font-black">{shopName || 'Drip by Leo'}</div><div className="mt-1 text-xs text-[#C6FF00]">View shop ↗</div></div>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3">{[['Visitors','0'],['Products','1'],['Customer interests','0'],['Orders','0']].map(([a,b]) => <div key={a} className="rounded-2xl bg-white p-3"><div className="text-[10px] text-zinc-400">{a}</div><div className="mt-1 text-xl font-black">{b}</div></div>)}</div>
                  <div className="space-y-2 bg-white p-3">{[['Products',ShoppingBag],['Orders',ShoppingBag],['Customer interests',Heart],['Analytics',BarChart3]].map(([label,Icon]) => <div key={String(label)} className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3"><Icon size={16}/><span className="text-xs font-bold">{String(label)}</span><ArrowRight className="ml-auto" size={14}/></div>)}</div>
                </div>
                <div className="mt-auto pt-6"><Button onClick={() => go(7)}><span>CONTINUE</span><ArrowRight size={20} /></Button></div>
              </div>
            )}

            {step === 7 && (
              <div className="flex flex-1 flex-col">
                <h1 className="text-4xl font-black leading-tight">Let's complete<br />your shop.</h1>
                <p className="mt-3 text-sm text-zinc-500">A few optional details can make your storefront look more professional.</p>
                <div className="mt-7 rounded-3xl border border-zinc-200 p-5"><div className="flex items-center justify-between"><span className="font-black">Your shop progress</span><span className="text-sm font-black text-[#779900]">{progress}% complete</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-[#C6FF00]" style={{ width: `${progress}%` }} /></div><div className="mt-5 space-y-1">{checklist.map(item => <div key={item.label} className="flex items-center gap-3 py-2 text-sm"><div className={`flex h-7 w-7 items-center justify-center rounded-full ${item.done ? 'bg-[#C6FF00]' : 'border border-zinc-200'}`}>{item.done ? <Check size={15} /> : null}</div><span className={item.done ? 'font-semibold' : 'text-zinc-500'}>{item.label}</span>{!item.done && <ArrowRight className="ml-auto text-zinc-300" size={15} />}</div>)}</div></div>
                <div className="mt-auto pt-6"><Button onClick={() => go(8)}><span>COMPLETE MY SHOP</span><ArrowRight size={20} /></Button></div>
              </div>
            )}

            {step === 8 && (
              <div className="flex flex-1 flex-col">
                <h1 className="text-4xl font-black leading-tight">Share your shop.<br />Start selling.</h1>
                <p className="mt-3 text-sm text-zinc-500">Your shop link is the key to new customers. Share it anywhere.</p>
                <div className="mt-9 rounded-2xl border border-zinc-200 p-4"><div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Your shop link</div><div className="mt-2 flex items-center gap-2"><Link2 size={17} className="text-zinc-400" /><span className="flex-1 truncate text-sm font-bold">{shopLink || `${window.location.origin}/${slug || 'your-shop'}`}</span><button onClick={copyLink} className="rounded-xl bg-zinc-100 p-2"><Copy size={16} /></button></div></div>
                <div className="mt-8"><div className="text-xs font-black">Share your shop</div><div className="mt-4 grid grid-cols-4 gap-3"><button onClick={share} className="flex flex-col items-center gap-2"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white"><MessageCircle size={22} /></span><span className="text-[10px] font-bold">WhatsApp</span></button><button onClick={share} className="flex flex-col items-center gap-2"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white"><Instagram size={21} /></span><span className="text-[10px] font-bold">Instagram</span></button><button onClick={share} className="flex flex-col items-center gap-2"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white"><Music2 size={21} /></span><span className="text-[10px] font-bold">TikTok</span></button><button onClick={share} className="flex flex-col items-center gap-2"><span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200"><MoreHorizontal size={21} /></span><span className="text-[10px] font-bold">More</span></button></div></div>
                <div className="mt-6 rounded-2xl bg-[#C6FF00]/20 p-4 text-xs font-semibold leading-relaxed">💡 Add your shop link to your WhatsApp status, Instagram bio, TikTok bio or anywhere your audience is.</div>
                <div className="mt-auto pt-6"><Button onClick={() => go(9)}><span>CONTINUE</span><ArrowRight size={20} /></Button></div>
              </div>
            )}

            {step === 9 && (
              <div className="flex flex-1 flex-col justify-center text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#C6FF00]"><Bell size={55} /></div>
                <h1 className="mt-8 text-4xl font-black leading-tight">Stay in the loop.</h1>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">Turn on notifications so you never miss orders or customer messages.</p>
                <div className="mt-9 space-y-5 text-left">{[['New orders & interests','Get notified when customers show interest or place orders.',MessageCircle],['Shop performance','Know when your shop is getting visitors and attention.',BarChart3],['Tips & updates','Get useful tips to grow your clothing brand.',ShoppingBag]].map(([title,desc,Icon]) => <div key={String(title)} className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100"><Icon size={18}/></div><div><div className="text-sm font-black">{String(title)}</div><div className="mt-1 text-xs leading-relaxed text-zinc-500">{String(desc)}</div></div></div>)}</div>
                <div className="mt-auto pt-8 space-y-2"><Button onClick={enableNotifications} disabled={loading}><span>{loading ? 'ENABLING...' : 'ENABLE NOTIFICATIONS'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <Bell size={19} />}</Button><button onClick={() => go(10)} className="w-full py-3 text-xs font-black uppercase text-zinc-400">Maybe later</button></div>
              </div>
            )}

            {step === 10 && (
              <div className="flex flex-1 flex-col justify-center text-center">
                <div className="relative mx-auto"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#C6FF00]"><Check size={43} strokeWidth={3} /></div><span className="absolute -right-4 -top-2 text-xl">✦</span><span className="absolute -left-4 top-2 text-lg">✦</span></div>
                <h1 className="mt-8 text-4xl font-black leading-tight">You're all set!</h1>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">Your shop is ready. It's time to build your brand and grow your business.</p>
                <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-200 text-left">
                  <div className="bg-white p-4"><div className="text-sm font-black">{shopName || 'Drip by Leo'}</div><div className="mt-1 text-xs text-zinc-400">{shopLink || 'threadzw.com/your-shop'}</div></div>
                  <div className="bg-black p-4"><div className="mb-4 flex items-center justify-between text-white"><span className="font-black">{shopName || 'YOUR SHOP'}</span><Eye size={16}/></div>{productPreview ? <img src={productPreview} alt="" className="h-40 w-full rounded-xl object-cover" /> : <div className="h-40 rounded-xl bg-zinc-800" />}</div>
                </div>
                <div className="mt-auto pt-7 space-y-3"><Button onClick={complete}><span>GO TO DASHBOARD</span><ArrowRight size={20} /></Button><button onClick={() => navigate(shopLink || '/')} className="flex w-full items-center justify-center gap-2 py-3 text-sm font-black"><ExternalLink size={16}/> VIEW MY SHOP</button></div>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>
    </main>
  );
};
