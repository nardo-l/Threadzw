import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, MapPin, MessageCircle, Store, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../utils/uploadImage';
import { useShopContext } from '../context/ShopContext';
import { toast } from 'sonner';

const CITIES = ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Masvingo', 'Other'];
const COLOURS = ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Brown'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One size'];

const Progress = ({ step }: { step: number }) => (
  <div className="flex items-center gap-1.5 w-40" aria-label={`Step ${step} of 5`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className={`h-1.5 flex-1 rounded-full transition-colors ${index < step ? 'bg-[#C6FF00]' : 'bg-zinc-200'}`} />
    ))}
  </div>
);

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-black uppercase tracking-wider text-zinc-700">{label}</label>
    {children}
    {hint && <p className="text-xs text-zinc-400">{hint}</p>}
  </div>
);

export const QuickOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { refreshShop } = useShopContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+263 ');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [shopId, setShopId] = useState<string | null>(null);

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [colour, setColour] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('10');

  const slug = useMemo(() => shopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), [shopName]);

  const next = () => { setError(''); setStep(current => Math.min(5, current + 1)); };
  const back = () => { setError(''); setStep(current => Math.max(1, current - 1)); };

  const handleAccount = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address.');
    if (phone.replace(/\D/g, '').length < 9) return setError('Enter the WhatsApp number customers should use for orders.');
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
      if (!user) throw new Error('Your account could not be created. Please try again.');
      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('supabase_logged_in_user_id', user.id);
      toast.success('Account created');
      next();
    } catch (err: any) {
      setError(err?.message || 'Could not create your account.');
    } finally { setLoading(false); }
  };

  const handleShopBasics = async () => {
    setError('');
    if (shopName.trim().length < 2) return setError('Enter your shop name.');
    if (!city) return setError('Choose the city or area where your shop is located.');
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Your session expired. Please sign in again.');
      const { data: existing } = await supabase.from('shops').select('id').eq('owner_id', userData.user.id).maybeSingle();
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
        product_limit: null,
      };
      let savedId = existing?.id;
      if (savedId) {
        const { error: updateError } = await supabase.from('shops').update(payload).eq('id', savedId);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase.from('shops').insert({ ...payload, owner_id: userData.user.id }).select('id').single();
        if (insertError) throw insertError;
        savedId = inserted.id;
      }
      setShopId(savedId || null);
      await refreshShop();
      toast.success('Shop basics saved');
      next();
    } catch (err: any) { setError(err?.message || 'Could not save your shop.'); }
    finally { setLoading(false); }
  };

  const selectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleProductBasics = () => {
    setError('');
    if (!imageFile) return setError('Add one clear product photo.');
    if (productName.trim().length < 2) return setError('Enter a product name.');
    if (!price || Number(price) <= 0) return setError('Enter a valid price in USD.');
    next();
  };

  const saveProduct = async () => {
    setError('');
    if (!colour) return setError('Choose a colour.');
    if (!size) return setError('Choose a size.');
    if (!quantity || Number(quantity) < 1) return setError('Enter available stock.');
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const targetShopId = shopId || (await supabase.from('shops').select('id').eq('owner_id', userData.user?.id).maybeSingle()).data?.id;
      if (!targetShopId || !imageFile) throw new Error('Your shop is not ready yet. Please go back and try again.');
      const imageUrl = await uploadImage({ supabase, file: imageFile, bucket: 'product-images', folder: 'product', userId: targetShopId });
      const stock = Number(quantity);
      const { error: productError } = await supabase.from('products').insert({
        shop_id: targetShopId,
        name: productName.trim(),
        price: Number(price),
        stock,
        total_stock: stock,
        category: 'Clothing',
        description: description.trim(),
        images: [imageUrl],
        image_url: imageUrl,
        sizes: [size],
        colours: [colour],
        is_published: true,
        status: 'active',
      });
      if (productError) throw productError;
      await refreshShop();
      toast.success('Your first product is live');
      next();
    } catch (err: any) { setError(err?.message || 'Could not save the product. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-[#C6FF00]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black tracking-tight">THREAD<span className="text-[#C6FF00]">ZW</span></div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sell more. Stress less.</div>
          </div>
          {step < 5 && <Progress step={step} />}
        </header>

        <AnimatePresence mode="wait">
          <motion.section key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.18 }} className="flex flex-1 flex-col pt-12">
            {step > 1 && step < 5 && <button type="button" onClick={back} className="mb-8 flex w-fit items-center gap-2 text-sm font-bold text-zinc-500"><ArrowLeft size={17} /> Back</button>}
            {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

            {step === 1 && <>
              <div className="mb-10 rounded-[2rem] bg-black p-6 text-white"><div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C6FF00] text-black"><Store size={25} /></div><p className="text-sm font-bold text-[#C6FF00]">FOR ZIMBABWEAN DRIP SHOPS</p><h1 className="mt-3 text-4xl font-black leading-[1.05]">Create your shop.<br />Start sharing today.</h1><p className="mt-4 text-sm leading-relaxed text-zinc-300">Show your clothes, let customers browse, and receive orders on WhatsApp.</p></div>
              <div className="mt-auto space-y-3"><Field label="Email address"><input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" /></Field><Field label="WhatsApp number for customer orders" hint="Customers will use this number when they want to order."><input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+263 77 123 4567" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" /></Field><Field label="Password"><input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="At least 6 characters" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" /></Field><button disabled={loading} onClick={handleAccount} className="mt-3 flex w-full items-center justify-between rounded-2xl bg-[#C6FF00] px-5 py-4 font-black disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={20} /> : <span>Create account</span>}<ArrowRight size={20} /></button></div>
            </>}

            {step === 2 && <><p className="text-sm font-black uppercase tracking-wider text-[#779900]">Step 2 · Shop basics</p><h1 className="mt-3 text-4xl font-black leading-tight">Tell us about<br />your shop.</h1><p className="mt-3 text-sm leading-relaxed text-zinc-500">Only the essentials. You can add your logo, banner, and detailed directions later.</p><div className="mt-10 space-y-5"><Field label="Shop name"><input autoFocus value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Drip Cartel" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" /></Field><Field label="Located in" hint="City or area shown on your public shop."><select value={city} onChange={e => setCity(e.target.value)} className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-semibold outline-none focus:border-black"><option value="">Choose your city</option>{CITIES.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Short shop bio · optional"><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="What makes your shop different?" rows={3} className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" /></Field><button disabled={loading} onClick={handleShopBasics} className="flex w-full items-center justify-between rounded-2xl bg-black px-5 py-4 font-black text-white disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={20} /> : <span>Save and continue</span>}<ArrowRight size={20} /></button></div></>}

            {step === 3 && <><p className="text-sm font-black uppercase tracking-wider text-[#779900]">Step 3 · First product</p><h1 className="mt-3 text-4xl font-black leading-tight">Add what you<br />are selling.</h1><p className="mt-3 text-sm leading-relaxed text-zinc-500">One product is enough to launch. You can add more from your dashboard.</p><div className="mt-8 space-y-5"><label className="block cursor-pointer">{imagePreview ? <img src={imagePreview} alt="Product preview" className="h-48 w-full rounded-[1.75rem] object-cover" /> : <div className="flex h-48 flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-500"><ImagePlus size={30} /><span className="mt-2 text-sm font-black">Add product photo</span><span className="mt-1 text-xs">JPG, PNG or WebP · uploads are optimized</span></div>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} className="sr-only" /></label><Field label="Product name"><input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Oversized Camo Tee" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Price (USD)"><input value={price} onChange={e => setPrice(e.target.value)} type="number" min="0" placeholder="0.00" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" /></Field><Field label="Description · optional"><input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" /></Field></div><button onClick={handleProductBasics} className="flex w-full items-center justify-between rounded-2xl bg-black px-5 py-4 font-black text-white"><span>Choose options</span><ArrowRight size={20} /></button></div></>}

            {step === 4 && <><p className="text-sm font-black uppercase tracking-wider text-[#779900]">Step 4 · Product options</p><h1 className="mt-3 text-4xl font-black leading-tight">Make it easy<br />to order.</h1><p className="mt-3 text-sm leading-relaxed text-zinc-500">Customers will choose these options before their WhatsApp message is prepared.</p><div className="mt-8 space-y-7"><Field label="Colour"><div className="grid grid-cols-4 gap-2">{COLOURS.map(item => <button type="button" key={item} onClick={() => setColour(item)} className={`rounded-xl border px-2 py-3 text-xs font-black ${colour === item ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white'}`}>{item}</button>)}</div></Field><Field label="Size"><div className="grid grid-cols-4 gap-2">{SIZES.map(item => <button type="button" key={item} onClick={() => setSize(item)} className={`rounded-xl border px-2 py-3 text-xs font-black ${size === item ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white'}`}>{item}</button>)}</div></Field><Field label="Available quantity"><input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="1" className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold outline-none focus:border-black" /></Field><button disabled={loading} onClick={saveProduct} className="flex w-full items-center justify-between rounded-2xl bg-[#C6FF00] px-5 py-4 font-black disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={20} /> : <span>Publish product</span>}<Check size={20} /></button></div></>}

            {step === 5 && <div className="flex flex-1 flex-col justify-center"><div className="mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#C6FF00]"><Check size={40} strokeWidth={3} /></div><p className="text-sm font-black uppercase tracking-wider text-[#779900]">You are live</p><h1 className="mt-3 text-5xl font-black leading-[0.98]">Your shop is<br />ready to share.</h1><p className="mt-5 text-base leading-relaxed text-zinc-500">Your first product is published. Add your logo, banner, detailed directions, and notifications later from the dashboard checklist.</p><div className="mt-10 space-y-3"><button onClick={() => navigate('/dashboard', { replace: true })} className="flex w-full items-center justify-between rounded-2xl bg-black px-5 py-4 font-black text-white"><span>Open my dashboard</span><ArrowRight size={20} /></button><button onClick={() => navigate('/dashboard', { replace: true })} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-5 py-4 text-sm font-black"><MessageCircle size={17} /> Share my shop next</button></div></div>}
          </motion.section>
        </AnimatePresence>
      </div>
    </main>
  );
};
