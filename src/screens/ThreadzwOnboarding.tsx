import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Bell, Check, Copy, ExternalLink, ImagePlus,
  Instagram, Loader2, MoreHorizontal, Music2, Share2, Store, Upload,
  User, Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../utils/uploadImage';
import { useShopContext } from '../context/ShopContext';

const GREEN = '#C6FF00';
const TOTAL_STEPS = 10;
const CITIES = ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Masvingo', 'Other'];
const REFERRALS = [
  { id: 'Instagram', icon: Instagram },
  { id: 'TikTok', icon: Music2 },
  { id: 'Friend / Family', icon: User },
  { id: 'YouTube', icon: Youtube },
  { id: 'WhatsApp', icon: Share2 },
  { id: 'Other', icon: MoreHorizontal },
];

const Progress = ({ step }: { step: number }) => (
  <div className="flex items-center gap-1.5" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <div key={i} className={`h-1.5 w-4 rounded-full transition-all duration-300 sm:w-5 ${i < step ? 'bg-[#C6FF00]' : 'bg-zinc-200'}`} />
    ))}
  </div>
);

const PrimaryButton = ({
  children, onClick, disabled = false, dark = false
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; dark?: boolean;
}) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-black tracking-wide transition active:scale-[0.99] disabled:opacity-50 ${dark ? 'bg-black text-white' : 'bg-[#C6FF00] text-black'}`}>
    {children}
  </button>
);

const Field = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props}
    className={`w-full rounded-2xl border border-zinc-700 bg-[#141414] px-4 py-4 text-base font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-[#C6FF00] focus:ring-2 focus:ring-[#C6FF00]/30 ${props.className || ''}`} />
);

export const ThreadzwOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { shop, refreshShop } = useShopContext();

  const [step, setStep] = useState(() => {
    const saved = Number(localStorage.getItem('threadzw_onboarding_step') || '1');
    return saved >= 1 && saved <= TOTAL_STEPS ? saved : 1;
  });
  const [name, setName] = useState(() => localStorage.getItem('threadzw_onboarding_name') || '');
  const [referral, setReferral] = useState(() => localStorage.getItem('threadzw_onboarding_referral') || '');
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
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('threadzw_selected_theme') || 'editorial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { localStorage.setItem('threadzw_onboarding_step', String(step)); }, [step]);
  useEffect(() => {
    if (!shop) return;
    setShopId(shop.id);
    if (!shopName) setShopName(shop.name || '');
    if (!city) setCity(shop.city || '');
    setBio(shop.description || '');
    setLogoPreview(shop.logo_url || '');
    if (shop.slug) setShopLink(`${window.location.origin}/${shop.slug}`);
  }, [shop]);

  const slug = useMemo(() =>
    shopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    [shopName]
  );

  const go = (next: number) => {
    setError('');
    setStep(Math.max(1, Math.min(TOTAL_STEPS, next)));
  };

  const getUser = async () => {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) throw new Error('Please log in again to continue.');
    return data.user;
  };

  const createAccount = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address.');
    if (phone.replace(/\D/g, '').length < 9) return setError('Enter your WhatsApp number.');
    if (password.length < 6) return setError('Use at least 6 characters for your password.');
    setLoading(true);
    try {
      const metadata = {
        full_name: name.trim() || 'Shop Owner',
        phone_number: phone.trim(),
        threadzw_referral: referral || 'Not specified',
      };
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(), password, options: { data: metadata }
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
      toast.success('Account created');
      go(5);
    } catch (e: any) {
      setError(e?.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  const saveShop = async () => {
    if (shopName.trim().length < 2) return setError('Enter your shop name.');
    if (!city) return setError('Choose your city or area.');
    if (phone.replace(/\D/g, '').length < 9) return setError('Enter your WhatsApp number.');
    setLoading(true); setError('');
    try {
      const user = await getUser();
      const existing = shopId || (await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle()).data?.id;
      const payload = {
        name: shopName.trim(),
        slug: slug || `shop-${Date.now().toString(36)}`,
        category: 'Streetwear & Fashion',
        description: bio.trim() || `${shopName.trim()} official storefront on ThreadZW.`,
        whatsapp_number: phone.trim(),
        city, location: city, is_active: true, page_type: 'clothing',
        plan: 'free', premium_status: 'inactive', product_limit: 9
      };
      let id = existing;
      if (id) {
        const { error: updateError } = await supabase.from('shops').update(payload).eq('id', id);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase.from('shops')
          .insert({ ...payload, owner_id: user.id }).select('id, slug').single();
        if (insertError) throw insertError;
        id = inserted.id;
      }
      setShopId(id || null);
      setShopLink(`${window.location.origin}/${payload.slug}`);
      await refreshShop();
      toast.success('Shop details saved');
      go(6);
    } catch (e: any) {
      setError(e?.message || 'Could not save your shop.');
    } finally { setLoading(false); }
  };

  const saveTheme = async () => {
    const id = shopId || shop?.id;
    if (!id) return setError('Save your shop details before choosing a theme.');
    setLoading(true); setError('');
    try {
      const { error: updateError } = await supabase.from('shops').update({ template_id: selectedTheme }).eq('id', id);
      if (updateError) throw updateError;
      localStorage.setItem('threadzw_selected_theme', selectedTheme);
      await refreshShop();
      toast.success('Storefront style selected');
      go(7);
    } catch (e: any) {
      setError(e?.message || 'Could not save your storefront style.');
    } finally { setLoading(false); }
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
    setLoading(true); setError('');
    try {
      const user = await getUser();
      const id = shopId || shop?.id;
      if (!id) throw new Error('Your shop is not ready yet.');
      let logoUrl = logoPreview && !logoPreview.startsWith('data:') ? logoPreview : null;
      if (logoFile) logoUrl = await uploadImage({ supabase, file: logoFile, bucket: 'shop-avatars', folder: 'logo', userId: id || user.id });
      const { error: updateError } = await supabase.from('shops').update({
        name: shopName.trim(), description: bio.trim() || `${shopName.trim()} official storefront on ThreadZW.`,
        logo_url: logoUrl
      }).eq('id', id);
      if (updateError) throw updateError;
      await refreshShop();
      toast.success('Brand saved');
      go(7);
    } catch (e: any) {
      setError(e?.message || 'Could not save your brand.');
    } finally { setLoading(false); }
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
    if (!productFile) return setError('Add one clear product photo.');
    if (productName.trim().length < 2) return setError('Enter a product name.');
    if (!price || Number(price) <= 0) return setError('Enter a valid price.');
    setLoading(true); setError('');
    try {
      const id = shopId || shop?.id;
      if (!id) throw new Error('Your shop is not ready yet.');
      const imageUrl = await uploadImage({ supabase, file: productFile, bucket: 'product-images', folder: 'product', userId: id });
      const { error: productError } = await supabase.from('products').insert({
        shop_id: id, name: productName.trim(), price: Number(price), stock: 1, total_stock: 1,
        category: 'Clothing', description: '', images: [imageUrl], image_url: imageUrl,
        sizes: [], colours: [], is_published: true, status: 'active'
      });
      if (productError) throw productError;
      await refreshShop();
      toast.success('Your first product is live');
      go(8);
    } catch (e: any) {
      setError(e?.message || 'Could not publish your product.');
    } finally { setLoading(false); }
  };

  const copyLink = async () => {
    if (!shopLink) return;
    await navigator.clipboard.writeText(shopLink);
    toast.success('Shop link copied');
  };

  const share = async () => {
    if (!shopLink) return;
    try {
      if (navigator.share) await navigator.share({ title: shopName, text: `Check out ${shopName} on ThreadZW`, url: shopLink });
      else await copyLink();
    } catch {}
  };

  const finish = () => {
    localStorage.removeItem('threadzw_onboarding_step');
    localStorage.setItem('threadzw_onboarding_completed', 'true');
    localStorage.removeItem('threadzw_onboarding_name');
    localStorage.removeItem('threadzw_onboarding_referral');
    navigate('/dashboard', { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-5 bg-[#050505]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-black tracking-tight text-[#C6FF00]">THREAD<span className="text-white">ZW</span></div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sell more. Stress less.</div>
          </div>
          <Progress step={step} />
        </header>

        <AnimatePresence mode="wait">
          <motion.section key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }} className="flex flex-1 flex-col pt-10">
            {step > 1 && (
              <button onClick={() => go(step - 1)} className="mb-7 flex w-fit items-center gap-2 text-sm font-bold text-zinc-500">
                <ArrowLeft size={17} /> Back
              </button>
            )}
            {error && <div className="mb-5 rounded-2xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm font-semibold text-red-300">{error}</div>}

            {step === 1 && (
              <div className="flex flex-1 flex-col">
                <div className="pt-6">
                  <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C6FF00]"><Store size={30} /></div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">THE PROBLEM</p>
                  <h1 className="mt-4 text-[3.15rem] font-black leading-[0.96] tracking-tight">Stop sending<br />product photos<br />one by one.</h1>
                  <p className="mt-5 max-w-xs text-sm leading-6 text-zinc-500">Give customers one place to browse your products, prices and shop details.</p>
                </div>
                <div className="mt-auto space-y-3 pt-10">
                  <div className="space-y-2 rounded-2xl bg-[#141414] p-4 text-sm font-semibold text-zinc-300"><div>“How much?”</div><div>“Do you have black?”</div><div>“Send more pictures.”</div></div>
                  <PrimaryButton onClick={() => go(2)}><span>SEE HOW IT WORKS</span><ArrowRight size={20} /></PrimaryButton>
                  <button onClick={() => navigate('/login')} className="w-full py-2 text-xs font-bold text-zinc-500">Already have an account? <span className="text-[#C6FF00] underline">Log in</span></button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-1 flex-col">
                <div className="pt-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">ONE LINK</p><h1 className="mt-4 text-4xl font-black leading-tight">One link for your whole business.</h1><p className="mt-4 text-sm leading-6 text-zinc-500">Add it to your TikTok, Instagram and Facebook bio—or send it when customers ask what you sell.</p></div>
                <div className="mt-10 rounded-2xl border-2 border-[#C6FF00] bg-black p-5 text-center text-lg font-black text-[#C6FF00]">threadzw.shop/yourshop</div>
                <div className="mt-auto pt-8"><PrimaryButton onClick={() => go(3)}><span>CONTINUE</span><ArrowRight size={20} /></PrimaryButton></div>
              </div>
            )}
            {step === 3 && (
              <div className="flex flex-1 flex-col">
                <div className="pt-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">YOUR CUSTOMERS</p><h1 className="mt-4 text-4xl font-black leading-tight">Browse, order, or visit your shop.</h1><p className="mt-4 text-sm leading-6 text-zinc-500">Customers can see your products and prices, order on WhatsApp, or get directions to you.</p></div>
                <div className="mt-8 space-y-3"><div className="rounded-2xl bg-[#141414] p-4 font-black">Browse your catalog</div><div className="rounded-2xl bg-[#141414] p-4 font-black">Order on WhatsApp</div><div className="rounded-2xl bg-[#141414] p-4 font-black">Visit the shop</div></div>
                <div className="mt-auto pt-7"><PrimaryButton onClick={() => go(4)}><span>CREATE MY SHOP</span><ArrowRight size={20} /></PrimaryButton></div>
              </div>
            )}
            {step === 4 && (
              <div className="flex flex-1 flex-col">
                <div className="pt-5">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C6FF00]"><Store size={26} /></div>
                  <h1 className="text-4xl font-black leading-tight">Create your<br />ThreadZW account.</h1>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">Your shop details come next. We just need an account to save everything securely.</p>
                </div>
                <div className="mt-7 space-y-3">
                  <Field autoFocus type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
                  <Field type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+263 77 123 4567" />
                  <Field type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password · 6+ characters" />
                  <p className="px-1 text-xs text-zinc-400">We'll use your email to help you access your shop later.</p>
                </div>
                <div className="mt-auto pt-7">
                  <PrimaryButton disabled={loading} onClick={createAccount}><span>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</PrimaryButton>
                  <button onClick={() => navigate('/login')} className="mt-4 w-full text-center text-xs font-bold text-zinc-500">Already have an account? <span className="text-[#C6FF00] underline">Log in</span></button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-1 flex-col">
                <h1 className="text-4xl font-black leading-tight">Tell us about<br />your shop.</h1>
                <p className="mt-3 text-sm text-zinc-500">These details appear on your storefront.</p>
                <div className="mt-8 space-y-4">
                  <Field autoFocus value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Shop name · e.g. Drip by Leo" />
                  <select value={city} onChange={e => setCity(e.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-[#141414] px-4 py-4 text-base font-semibold outline-none focus:border-black"><option value="">Where are you based?</option>{CITIES.map(c => <option key={c}>{c}</option>)}</select>
                  <Field value={phone} onChange={e => setPhone(e.target.value)} placeholder="+263 77 123 4567" type="tel" />
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="A short description of your brand (optional)" className="w-full resize-none rounded-2xl border border-zinc-700 bg-[#141414] px-4 py-4 text-sm font-semibold text-white outline-none placeholder:text-zinc-500 focus:border-[#C6FF00]" />
                </div>
                <div className="mt-auto pt-7"><PrimaryButton disabled={loading} onClick={saveShop}><span>{loading ? 'SAVING...' : 'CONTINUE'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</PrimaryButton></div>
              </div>
            )}

            {step === 6 && (
              <div className="flex flex-1 flex-col">
                <div className="pt-2"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">MAKE IT YOURS</p><h1 className="mt-4 text-4xl font-black leading-tight">Choose a look that feels like your business.</h1><p className="mt-3 text-sm leading-6 text-zinc-500">Every style is built to help customers browse and buy.</p></div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[['editorial','Editorial','Big visuals and story-led shopping'],['bento','Bento','Everything at a glance'],['catalog','Catalog','Fast product browsing'],['poster','Street Poster','Bold drops and big CTAs'],['luxury','Luxury','Premium and spacious'],['social','Social Feed','Content-led shopping'],['market','Map & Market','Local discovery'],['story','Lookbook','Brand story and proof']].map(([id,title,desc]) => (
                    <button key={id} type="button" onClick={() => setSelectedTheme(id)} className={`rounded-2xl border p-3 text-left transition ${selectedTheme === id ? 'border-[#C6FF00] bg-[#141414] text-white ring-2 ring-[#C6FF00]' : 'border-zinc-700 bg-[#141414] text-white'}`}>
                      <div className={`mb-3 h-14 rounded-xl ${selectedTheme === id ? 'bg-[#C6FF00]' : 'bg-zinc-700'} ${id === 'editorial' ? 'rounded-none' : id === 'poster' ? 'rotate-2' : id === 'luxury' ? 'rounded-full' : ''}`} />
                      <div className="text-sm font-black">{title}</div><div className={`mt-1 text-[10px] leading-tight ${selectedTheme === id ? 'text-zinc-300' : 'text-zinc-500'}`}>{desc}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-auto pt-6"><PrimaryButton disabled={loading} onClick={saveTheme}><span>{loading ? 'SAVING STYLE...' : 'USE THIS STYLE'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</PrimaryButton></div>
              </div>
            )}
            {step === 7 && (
              <div className="flex flex-1 flex-col">
                <h1 className="text-4xl font-black leading-tight">Add your<br />first product.</h1>
                <p className="mt-3 text-sm text-zinc-500">One product is enough to get your store live.</p>
                <div className="mt-7 space-y-4">
                  <label className="block cursor-pointer">
                    {productPreview ? <img src={productPreview} alt="Product preview" className="h-52 w-full rounded-3xl object-cover" /> :
                      <div className="flex h-52 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-700 bg-[#141414]"><Upload size={28} /><span className="mt-2 text-xs font-black uppercase">Add product photo</span></div>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectProduct} className="sr-only" />
                  </label>
                  <Field value={productName} onChange={e => setProductName(e.target.value)} placeholder="Product name" />
                  <Field value={price} onChange={e => setPrice(e.target.value)} placeholder="Price · e.g. 25" inputMode="decimal" />
                </div>
                <div className="mt-auto pt-7"><PrimaryButton disabled={loading} onClick={saveProduct}><span>{loading ? 'PUBLISHING...' : 'PUBLISH PRODUCT'}</span>{loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}</PrimaryButton></div>
              </div>
            )}

            {step === 8 && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[#C6FF00]"><Check size={38} strokeWidth={3} /></div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">You're live</p>
                <h1 className="mt-3 text-5xl font-black leading-none">Your shop<br />is live.</h1>
                <p className="mt-5 max-w-xs text-sm leading-6 text-zinc-500">Your first product is published and customers can start discovering your store.</p>
                {shopLink && <button onClick={() => window.open(shopLink, '_blank')} className="mt-7 flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-xs font-bold"><ExternalLink size={14} /> Preview shop</button>}
                <div className="mt-auto w-full pt-8"><PrimaryButton onClick={() => go(9)}><span>KEEP GOING</span><ArrowRight size={20} /></PrimaryButton></div>
              </div>
            )}

            {step === 9 && (
              <div className="flex flex-1 flex-col">
                <div className="pt-5">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C6FF00]"><Share2 size={26} /></div>
                  <h1 className="text-4xl font-black leading-tight">Share your shop.<br />Start selling.</h1>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">Send your link to Instagram, WhatsApp, TikTok or anyone who needs your drip.</p>
                </div>
                <div className="mt-8 rounded-2xl border border-zinc-700 bg-[#141414] p-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">Your shop link</p>
                  <p className="truncate text-sm font-bold">{shopLink || 'Your shop link is ready'}</p>
                </div>
                <div className="mt-auto space-y-3 pt-8">
                  <PrimaryButton onClick={share}><span>SHARE MY SHOP</span><Share2 size={19} /></PrimaryButton>
                  <button onClick={copyLink} className="flex w-full items-center justify-center gap-2 py-2 text-xs font-black uppercase text-zinc-500"><Copy size={14} /> Copy link</button>
                  <button onClick={() => go(10)} className="w-full py-2 text-xs font-bold text-zinc-400">I'll do this later</button>
                </div>
              </div>
            )}

            {step === 10 && (
              <div className="flex flex-1 flex-col">
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-black text-[#C6FF00]"><Bell size={34} /></div>
                  <h1 className="text-4xl font-black leading-tight">You're all set,<br />{name || 'shop owner'}.</h1>
                  <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500">Your ThreadZW store is ready. We'll keep you updated about new orders and important shop activity.</p>
                </div>
                <div className="space-y-3 pt-8">
                  <PrimaryButton onClick={async () => {
                    if ('Notification' in window) {
                      try { await Notification.requestPermission(); } catch {}
                    }
                    finish();
                  }}><span>GO TO MY DASHBOARD</span><ArrowRight size={20} /></PrimaryButton>
                  <button onClick={finish} className="w-full py-2 text-xs font-bold text-zinc-400">Enable notifications later</button>
                </div>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>
    </main>
  );
};

export default ThreadzwOnboarding;
