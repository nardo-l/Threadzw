import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Instagram, Loader2, MapPin, MessageCircle, Sparkles, Store, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useShopContext } from '../context/ShopContext';

const TOTAL_STEPS = 9;
const WEEKLY_SHOPS_JOINED = 167;
const CITIES = ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Masvingo', 'Other'];
const DISCOVERY_OPTIONS = [
  { id: 'whatsapp', title: 'WhatsApp messages', note: 'They DM me for prices and photos', icon: MessageCircle },
  { id: 'social', title: 'Instagram / TikTok', note: 'They find me on social media', icon: Instagram },
  { id: 'walkin', title: 'Walk-in / word of mouth', note: 'People know my physical location', icon: Store },
  { id: 'none', title: "I don't have online presence", note: 'Currently no easy way to find me online', icon: MapPin },
];

const Button = ({ children, onClick, disabled = false, secondary = false }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; secondary?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black tracking-wide transition active:scale-[.99] disabled:opacity-40 ${secondary ? 'border border-zinc-700 bg-[#141414] text-white' : 'bg-[#C6FF00] text-black'}`}>{children}</button>
);

const Field = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`h-14 w-full rounded-2xl border border-zinc-700 bg-[#141414] px-4 text-base font-semibold text-white outline-none placeholder:text-zinc-500 focus:border-[#C6FF00] ${props.className || ''}`} />
);

const SocialProof = () => (
  <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101211] px-4 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C6FF00] text-black"><Users size={17} /></div>
    <div>
      <p className="text-xs font-black text-white">{WEEKLY_SHOPS_JOINED} shops joined this week</p>
      <p className="mt-0.5 text-[10px] text-zinc-500">Zimbabwean brands are building their storefronts.</p>
    </div>
    <Sparkles size={14} className="ml-auto shrink-0 text-[#C6FF00]" />
  </div>
);

export const ThreadzwOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { refreshShop } = useShopContext();
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState('');
  const [discovery, setDiscovery] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('+263 ');
  const [bio, setBio] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const slug = useMemo(() => shopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), [shopName]);
  const go = (next: number) => { setError(''); setStep(Math.max(1, Math.min(TOTAL_STEPS, next))); };

  const createAccountAndShop = async () => {
    if (!ownerName.trim()) return setError('Tell us your name.');
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Use at least 6 characters for your password.');
    if (!shopName.trim()) return setError('Enter your shop name.');
    if (!city) return setError('Choose your shop location.');
    if (phone.replace(/\D/g, '').length < 9) return setError('Enter your WhatsApp number.');

    setLoading(true); setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: ownerName.trim(), phone_number: phone.trim() } }
      });

      let user = data.user;
      if (signUpError?.message.toLowerCase().includes('already registered')) {
        const signedIn = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (signedIn.error) throw signedIn.error;
        user = signedIn.data.user;
      } else if (signUpError) {
        throw signUpError;
      } else if (!data.session) {
        const signedIn = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (signedIn.error) throw signedIn.error;
        user = signedIn.data.user;
      }

      if (!user) throw new Error('Your account could not be created.');

      const { data: shopId, error: shopError } = await supabase.rpc('create_shop_from_onboarding', {
        p_shop: {
          name: shopName.trim(),
          slug: slug || `shop-${Date.now().toString(36)}`,
          description: bio.trim() || `${shopName.trim()} official storefront on ThreadZW.`,
          bio: bio.trim() || null,
          whatsapp_number: phone.trim(),
          city,
        }
      });
      if (shopError) throw shopError;
      if (!shopId) throw new Error('Your shop could not be created.');

      localStorage.removeItem('threadzw_onboarding_step');
      localStorage.setItem('threadzw_onboarding_completed', 'true');
      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('supabase_logged_in_user_id', user.id);
      localStorage.setItem('threadzw_shop_id', shopId);

      // Refresh the shared shop state before navigating. This prevents App.tsx from
      // seeing a momentary hasShop=false and sending the new user back to onboarding.
      await refreshShop();

      toast.success('Your shop is ready. Let’s get you started.');
      navigate('/onboarding/paywall', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Could not finish your ThreadZW setup.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDiscovery = (id: string) => setDiscovery(current => id === 'none' ? (current.includes('none') ? [] : ['none']) : [...current.filter(item => item !== 'none'), ...(current.includes(id) ? [] : [id])]);
  const renderProgress = () => <div className="flex items-center gap-1.5" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>{Array.from({ length: TOTAL_STEPS }).map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-[#C6FF00]' : 'bg-zinc-800'}`} />)}</div>;

  const renderStep = () => {
    if (step === 1) return <div className="space-y-7"><div className="flex h-20 w-20 -rotate-3 items-center justify-center rounded-[28px] bg-[#C6FF00] text-4xl font-black text-black shadow-[8px_8px_0_#ffffff]">TZ</div><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#C6FF00]">WELCOME TO THREADZW</p><h1 className="mt-3 text-5xl font-black leading-[.9]">Hello 👋</h1><p className="mt-5 text-lg leading-relaxed text-zinc-300">Let's get your clothing business a home on the internet.</p></div><div className="rounded-3xl border border-zinc-800 bg-[#101211] p-5"><p className="text-sm font-black">We'll ask you a few quick questions.</p><p className="mt-2 text-xs leading-relaxed text-zinc-500">Your shop name, location and WhatsApp number are all we need to get started.</p></div><SocialProof /><Button onClick={() => go(2)}>Let's build your shop <ArrowRight size={17} /></Button></div>;
    if (step === 2) return <div className="space-y-7"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">PHASE 1: THE PROBLEM</p><h1 className="text-4xl font-black leading-[.98]">Stop sending your product photos one by one.</h1><p className="text-sm leading-relaxed text-zinc-400">Give customers one place to browse your products, prices and shop details.</p><div className="space-y-2 rounded-3xl bg-[#101211] p-4">{['How much?', 'Do you have black?', 'Send more pictures.', 'Where are you located?'].map((text, i) => <div key={text} className="rounded-2xl bg-[#1a1d1b] px-4 py-3 text-sm font-semibold"><span className="mr-3 text-green-400">◉</span>{text}<span className="float-right text-[10px] text-zinc-600">10:{24 + i}</span></div>)}<div className="rounded-2xl bg-[#C6FF00] px-4 py-3 text-sm font-black text-black">🔗 threadzw.shop/yourshop <span className="float-right">10:30</span></div></div><SocialProof /><Button onClick={() => go(3)}>Continue <ArrowRight size={16} /></Button></div>;
    if (step === 3) return <div className="space-y-7"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">PHASE 2: ONE LINK</p><h1 className="text-4xl font-black leading-[.98]">One link for your whole business.</h1><p className="text-sm leading-relaxed text-zinc-400">Add it to your TikTok, Instagram and Facebook bio—or send it when customers ask what you sell.</p><div className="grid grid-cols-3 gap-2">{['TikTok', 'Instagram', 'Facebook'].map(item => <div key={item} className="rounded-2xl border border-lime-900/80 bg-[#101211] p-4 text-center text-xs font-black">{item}<span className="mt-1 block text-[9px] text-zinc-500">Bio link</span></div>)}</div><div className="rounded-2xl bg-[#C6FF00] px-4 py-4 text-center text-sm font-black text-black">🔗 threadzw.shop/yourshop</div><SocialProof /><Button onClick={() => go(4)}>Create my shop <ArrowRight size={16} /></Button></div>;
    if (step === 4) return <div className="space-y-7"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">PHASE 3: SHOP CREATION</p><h1 className="text-4xl font-black leading-[.98]">What's your shop called?</h1><Field autoFocus value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Byo streetwear" maxLength={60} /><p className="text-xs text-zinc-500">This is the name customers will see on your ThreadZW shop.</p><Button disabled={!shopName.trim()} onClick={() => go(5)}>Continue <ArrowRight size={16} /></Button></div>;
    if (step === 5) return <div className="space-y-6"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">PHASE 3: SHOP CREATION</p><h1 className="text-4xl font-black leading-[.98]">How do customers find your products right now?</h1><p className="text-xs text-zinc-500">Select all that apply:</p><div className="space-y-2">{DISCOVERY_OPTIONS.map(option => { const Icon = option.icon; const selected = discovery.includes(option.id); return <button key={option.id} type="button" onClick={() => toggleDiscovery(option.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-[#C6FF00] bg-[#151a10]' : 'border-zinc-800 bg-[#141414]'}`}><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900"><Icon size={19} /></div><div className="flex-1"><div className="text-sm font-black">{option.title}</div><div className="mt-0.5 text-[11px] text-zinc-500">{option.note}</div></div>{selected && <Check size={18} className="text-[#C6FF00]" />}</div></button>; })}</div><Button onClick={() => go(6)}>Continue <ArrowRight size={16} /></Button></div>;
    if (step === 6) return <div className="space-y-7"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">PHASE 3: SHOP CREATION</p><h1 className="text-4xl font-black leading-[.98]">Where is your shop based?</h1><p className="text-sm text-zinc-400">Choose the city customers should see when they want to visit you.</p><div className="grid grid-cols-2 gap-2">{CITIES.map(item => <button key={item} type="button" onClick={() => setCity(item)} className={`rounded-2xl border px-4 py-4 text-left text-sm font-black ${city === item ? 'border-[#C6FF00] bg-[#151a10] text-white' : 'border-zinc-800 bg-[#141414] text-zinc-300'}`}>{item}</button>)}</div><Button disabled={!city} onClick={() => go(7)}>Continue <ArrowRight size={16} /></Button></div>;
    if (step === 7) return <div className="space-y-7"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">PHASE 3: SHOP CREATION</p><h1 className="text-4xl font-black leading-[.98]">What number should customers use to order?</h1><p className="text-sm text-zinc-400">We'll use this WhatsApp number for customer orders and questions.</p><Field value={phone} onChange={e => setPhone(e.target.value)} placeholder="+263 77 123 4567" inputMode="tel" /><Button disabled={phone.replace(/\D/g, '').length < 9} onClick={() => go(8)}>Continue <ArrowRight size={16} /></Button></div>;
    if (step === 8) return <div className="space-y-7"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">PHASE 3: SHOP CREATION</p><h1 className="text-4xl font-black leading-[.98]">Tell customers a little about your shop.</h1><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="What do you sell? What makes your shop different?" maxLength={240} className="min-h-36 w-full rounded-2xl border border-zinc-700 bg-[#141414] px-4 py-4 text-base font-semibold text-white outline-none placeholder:text-zinc-500 focus:border-[#C6FF00]" /><p className="text-xs text-zinc-600">Optional · {bio.length}/240</p><Button onClick={() => go(9)}>Continue to sign up <ArrowRight size={16} /></Button></div>;
    return <div className="space-y-6"><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">PHASE 4: YOUR ACCOUNT</p><h1 className="text-4xl font-black leading-[.98]">Almost there. Let's create your account.</h1><p className="text-sm text-zinc-400">Your shop details are ready. Create your owner account and we'll take you straight to your dashboard.</p><div className="space-y-3"><Field autoFocus value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="What should we call you?" autoComplete="name" /><Field value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" /><div className="relative"><Field value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="pr-12" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></div>{error && <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs font-semibold text-red-300">{error}</div>}<SocialProof /><Button disabled={loading} onClick={createAccountAndShop}>{loading ? <><Loader2 size={17} className="animate-spin" /> Creating your shop...</> : <>Create my ThreadZW shop <ArrowRight size={16} /></>}</Button><p className="text-center text-[10px] text-zinc-600">By continuing, you agree to ThreadZW's terms and privacy policy.</p></div>;
  };

  return <div className="fixed inset-0 z-[45] overflow-hidden bg-[#070707] font-sans text-white"><div className="mx-auto flex h-full max-w-md flex-col"><header className="shrink-0 px-5 pb-4 pt-5"><div className="mb-5 flex items-center justify-between"><button type="button" onClick={() => step > 1 ? go(step - 1) : navigate('/')} className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-[#111]"><ArrowLeft size={18} /></button><span className="text-lg font-black tracking-tight text-[#C6FF00]">ThreadZW</span><span className="w-10 text-right text-[10px] font-bold text-zinc-500">{step}/{TOTAL_STEPS}</span></div>{renderProgress()}</header><main className="flex-1 overflow-y-auto px-5 py-5"><AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: .18 }} className="pb-10">{renderStep()}</motion.div></AnimatePresence></main></div></div>;
};