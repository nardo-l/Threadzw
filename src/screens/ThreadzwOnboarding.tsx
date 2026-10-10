import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Instagram,
  Loader2,
  MapPin,
  MessageCircle,
  Sparkles,
  Store,
  Users,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useShopContext } from '../context/ShopContext';

const TOTAL_STEPS = 9;
const WEEKLY_SHOPS_JOINED = 167;

const CITIES = ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Masvingo', 'Other'];

const DISCOVERY_OPTIONS = [
  { id: 'whatsapp', title: 'WhatsApp messages', note: 'Customers DM me for prices and photos', icon: MessageCircle },
  { id: 'social', title: 'Instagram / TikTok', note: 'Customers find me on social media', icon: Instagram },
  { id: 'walkin', title: 'Walk-in / word of mouth', note: 'People know my physical location', icon: Store },
  { id: 'none', title: "I don't have an online presence", note: 'There is no easy way to find me online yet', icon: MapPin },
];

const PHASES: Record<number, string> = {
  1: 'PHASE 1 • THE PROBLEM',
  2: 'PHASE 1 • THE PROBLEM',
  3: 'PHASE 2 • YOUR BRAND',
  4: 'PHASE 3 • SHOP CREATION',
  5: 'PHASE 3 • SHOP CREATION',
  6: 'PHASE 3 • SHOP CREATION',
  7: 'PHASE 3 • SHOP CREATION',
  8: 'PHASE 3 • SHOP CREATION',
  9: 'PHASE 4 • YOUR ACCOUNT',
};

const Button = ({
  children,
  onClick,
  disabled = false,
  secondary = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      'flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black uppercase tracking-[0.06em]',
      'transition-all active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40',
      secondary
        ? 'border border-zinc-700 bg-[#111413] text-white hover:border-zinc-500'
        : 'bg-[#C6FF00] text-black shadow-[0_8px_30px_rgba(198,255,0,0.08)] hover:bg-[#d4ff3b]',
    ].join(' ')}
  >
    {children}
  </button>
);

const Field = (
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    valid?: boolean;
    error?: string;
  },
) => {
  const { label, valid, error, className, ...inputProps } = props;

  return (
    <div className="space-y-2">
      {label && (
        <label className="px-1 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...inputProps}
          className={[
            'h-14 w-full rounded-2xl border bg-[#111413] px-4 text-base font-semibold text-white outline-none',
            'placeholder:text-zinc-600 transition-colors',
            error
              ? 'border-red-500/70 focus:border-red-400'
              : valid
                ? 'border-[#C6FF00]'
                : 'border-zinc-700 focus:border-[#C6FF00]',
            valid || error ? 'pr-12' : '',
            className || '',
          ].join(' ')}
        />
        {valid && !error && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C6FF00]">
            <Check size={18} strokeWidth={3} />
          </span>
        )}
      </div>
      {error && <p className="px-1 text-xs font-semibold text-red-400">{error}</p>}
    </div>
  );
};

const SocialProof = () => (
  <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101211] px-4 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C6FF00] text-black">
      <Users size={17} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-black text-white">Trusted by clothing sellers in Zimbabwe</p>
      <p className="mt-0.5 text-[10px] text-zinc-500">{WEEKLY_SHOPS_JOINED} shops joined this week • Free to start • No coding required</p>
    </div>
    <Sparkles size={14} className="ml-auto shrink-0 text-[#C6FF00]" />
  </div>
);

const SelectionCard = ({
  selected,
  onClick,
  icon: Icon,
  title,
  note,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  note: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={[
      'w-full rounded-2xl border p-4 text-left transition-all',
      selected
        ? 'border-[#C6FF00] bg-[#151b0d] shadow-[0_0_0_1px_rgba(198,255,0,.18)]'
        : 'border-zinc-800 bg-[#111413] hover:border-zinc-700',
    ].join(' ')}
  >
    <div className="flex items-center gap-3">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-[#C6FF00] text-black' : 'bg-[#1b1e1c] text-zinc-300'}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-black text-white">{title}</div>
        <div className="mt-0.5 text-[11px] leading-4 text-zinc-500">{note}</div>
      </div>
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-[#C6FF00] bg-[#C6FF00] text-black' : 'border-zinc-600 text-transparent'}`}>
        <Check size={14} strokeWidth={3} />
      </div>
    </div>
  </button>
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

  const slug = useMemo(
    () => shopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    [shopName],
  );

  const go = (next: number) => {
    setError('');
    setStep(Math.max(1, Math.min(TOTAL_STEPS, next)));
  };

  const phoneDigits = phone.replace(/\D/g, '');
  const validShopName = shopName.trim().length >= 2;
  const validPhone = phoneDigits.length >= 9;
  const validEmail = email.trim().includes('@') && email.trim().includes('.');
  const validPassword = password.length >= 6;

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').replace(/^263/, '');
    const limited = digits.slice(0, 9);
    const groups = [limited.slice(0, 2), limited.slice(2, 5), limited.slice(5, 9)].filter(Boolean);
    setPhone(`+263 ${groups.join(' ')}`);
  };

  const createAccountAndShop = async () => {
    if (!ownerName.trim()) return setError('Tell us your name.');
    if (!validEmail) return setError('Enter a valid email address.');
    if (!validPassword) return setError('Use at least 6 characters for your password.');
    if (!validShopName) return setError('Enter your shop name.');
    if (!city) return setError('Choose your shop location.');
    if (!validPhone) return setError('Enter your WhatsApp number.');

    setLoading(true);
    setError('');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { full_name: ownerName.trim(), phone_number: phone.trim() } },
      });

      const alreadyRegistered =
        signUpError?.message?.toLowerCase().includes('already registered') ||
        signUpError?.message?.toLowerCase().includes('already exists') ||
        (data?.user &&
          !data.session &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0);

      if (alreadyRegistered) {
        setError('EMAIL_ALREADY_EXISTS');
        return;
      }

      if (signUpError) throw signUpError;

      const user = data.user;

      if (!data.session) {
        if (!user) throw new Error('Your account could not be created.');
        throw new Error('ACCOUNT_CONFIRMATION_REQUIRED');
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
        },
      });

      if (shopError) throw shopError;
      if (!shopId) throw new Error('Your shop could not be created.');

      localStorage.removeItem('threadzw_onboarding_step');
      localStorage.setItem('threadzw_onboarding_completed', 'true');
      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('supabase_logged_in_user_id', user.id);
      localStorage.setItem('threadzw_shop_id', shopId);

      await refreshShop();
      toast.success('Your 3-day unlimited trial has started. Let’s build your storefront.');
      navigate('/dashboard', { replace: true });
    } catch (e: any) {
      const raw = String(e?.message || '').toLowerCase();
      if (raw.includes('already registered') || raw.includes('already exists')) {
        setError('EMAIL_ALREADY_EXISTS');
      } else if (raw === 'account_confirmation_required') {
        setError(
          'Your account was created, but email confirmation is required before we can finish your shop setup. Check your inbox and then sign in.',
        );
      } else {
        setError(e?.message || 'Could not finish your ThreadZW setup.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleDiscovery = (id: string) => {
    setDiscovery(current =>
      id === 'none'
        ? current.includes('none')
          ? []
          : ['none']
        : [...current.filter(item => item !== 'none'), ...(current.includes(id) ? [] : [id])],
    );
  };

  const renderProgress = () => (
    <div className="space-y-2.5" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
      <div className="flex items-end justify-between">
        <span className="text-[11px] font-black tracking-wide text-white">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
          {Math.round((step / TOTAL_STEPS) * 100)}%
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <div
            key={index}
            className={[
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              index < step - 1 ? 'bg-[#7d9900]' : index === step - 1 ? 'bg-[#C6FF00]' : 'bg-[#303330]',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );

  const renderError = () =>
    error ? (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-red-500/35 bg-red-500/10 p-4"
      >
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-red-300">
              {error === 'EMAIL_ALREADY_EXISTS' ? 'Email already in use' : 'We couldn’t finish your signup'}
            </p>
            <p className="mt-1 text-xs leading-5 text-red-200/70">
              {error === 'EMAIL_ALREADY_EXISTS'
                ? 'An account with this email already exists on ThreadZW. Try logging in instead.'
                : error}
            </p>
          </div>
        </div>
        {error === 'EMAIL_ALREADY_EXISTS' && (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 w-full rounded-xl bg-[#C6FF00] py-2.5 text-xs font-black text-black"
          >
            Go to Log In
          </button>
        )}
      </motion.div>
    ) : null;

  const renderStep = () => {
    if (step === 1) {
      return (
        <>
          <div className="flex h-20 w-20 -rotate-3 items-center justify-center rounded-[26px] bg-[#C6FF00] text-4xl font-black text-black shadow-[7px_7px_0_#252824]">
            TZ
          </div>
          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-[#C6FF00]">WELCOME TO THREADZW</p>
          <h1 className="mt-3 text-[2.75rem] font-black leading-[0.93] tracking-tight">
            Turn your clothing business into a real online shop.
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-zinc-400">
            Answer a few quick questions and we’ll help get your ThreadZW storefront ready.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              ['Free to start', 'Get online in minutes'],
              ['No coding required', 'Just answer a few questions'],
              ['Orders on WhatsApp', 'Simple and familiar'],
            ].map(([title, note]) => (
              <div key={title} className="rounded-2xl border border-zinc-800 bg-[#101211] px-4 py-3.5">
                <p className="text-xs font-black text-white">{title}</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-500">{note}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <SocialProof />
          </div>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <h1 className="text-[2.65rem] font-black leading-[0.94] tracking-tight">
            Stop sending product photos one by one.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
            Give customers one place to browse your products, prices and shop details.
          </p>

          <div className="mt-7 space-y-2 rounded-[1.5rem] border border-zinc-800 bg-[#101211] p-3">
            {['How much is this dress?', 'Do you have it in black?', 'Can I see more pictures?', 'Where are you located?'].map((text, i) => (
              <div key={text} className="flex items-center gap-3 rounded-2xl bg-[#1a1d1b] px-4 py-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-black">C</div>
                <span className="flex-1 text-xs font-semibold text-zinc-200">{text}</span>
                <span className="text-[9px] text-zinc-600">10:{24 + i}</span>
              </div>
            ))}
            <div className="rounded-2xl bg-[#C6FF00] px-4 py-3 text-xs font-black text-black">
              It’s available! How do I order?
            </div>
          </div>

          <div className="mt-5">
            <SocialProof />
          </div>
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <h1 className="text-[2.65rem] font-black leading-[0.94] tracking-tight">
            One link for your whole business.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
            Share one storefront across WhatsApp, Instagram and TikTok.
          </p>

          <div className="mt-7 space-y-2">
            {[
              ['TikTok', 'Drive traffic from TikTok'],
              ['Instagram', 'Share with your followers'],
              ['Facebook', 'Reach more customers'],
            ].map(([title, note], index) => (
              <div
                key={title}
                className={[
                  'flex items-center gap-3 rounded-2xl border p-4',
                  index === 1 ? 'border-[#C6FF00] bg-[#151b0d]' : 'border-zinc-800 bg-[#111413]',
                ].join(' ')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20231f] text-sm font-black">
                  {title[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="text-[10px] text-zinc-500">{note}</p>
                </div>
                {index === 1 && <Check size={18} className="text-[#C6FF00]" />}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-[#101211] px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">YOUR THREADZW LINK</p>
            <p className="mt-1 text-sm font-black text-white">threadzw.shop/yourshop</p>
          </div>
        </>
      );
    }

    if (step === 4) {
      return (
        <>
          <h1 className="text-[2.65rem] font-black leading-[0.94] tracking-tight">What’s your shop called?</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
            This is the name customers will see on your ThreadZW storefront.
          </p>

          <div className="mt-7">
            <Field
              label="Shop name"
              autoFocus
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              placeholder="Nulla Streetwear"
              maxLength={60}
              valid={validShopName}
              error={shopName.length > 0 && !validShopName ? 'Use at least 2 characters.' : undefined}
              autoComplete="organization"
            />
          </div>

          {validShopName && (
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-[#101211] p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">PREVIEW</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C6FF00] text-xs font-black text-black">TZ</div>
                <div>
                  <p className="text-sm font-black text-white">{shopName.trim()}</p>
                  <p className="text-[10px] text-zinc-500">threadzw.shop/{slug || 'yourshop'}</p>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }

    if (step === 5) {
      return (
        <>
          <h1 className="text-[2.65rem] font-black leading-[0.94] tracking-tight">How do customers find your products right now?</h1>
          <p className="mt-5 text-sm leading-6 text-zinc-400">Select all that apply. You can change this later.</p>

          <div className="mt-6 space-y-2.5">
            {DISCOVERY_OPTIONS.map(option => {
              const Icon = option.icon;
              const selected = discovery.includes(option.id);
              return (
                <SelectionCard
                  key={option.id}
                  selected={selected}
                  onClick={() => toggleDiscovery(option.id)}
                  icon={Icon}
                  title={option.title}
                  note={option.note}
                />
              );
            })}
          </div>
        </>
      );
    }

    if (step === 6) {
      return (
        <>
          <h1 className="text-[2.65rem] font-black leading-[0.94] tracking-tight">Where is your shop based?</h1>
          <p className="mt-5 text-sm leading-6 text-zinc-400">
            Choose the city customers should see when they want to visit you.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {CITIES.map(item => {
              const selected = city === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCity(item)}
                  aria-pressed={selected}
                  className={[
                    'min-h-14 rounded-2xl border px-4 text-left text-sm font-black transition-all',
                    selected ? 'border-[#C6FF00] bg-[#151b0d] text-white' : 'border-zinc-800 bg-[#111413] text-zinc-300',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-between gap-2">
                    {item}
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-[#C6FF00] bg-[#C6FF00] text-black' : 'border-zinc-700 text-transparent'}`}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      );
    }

    if (step === 7) {
      return (
        <>
          <h1 className="text-[2.65rem] font-black leading-[0.94] tracking-tight">Where should customer orders go?</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
            We’ll open WhatsApp with a ready-to-send order message.
          </p>

          <div className="mt-7">
            <Field
              label="WhatsApp number"
              value={phone}
              onChange={e => formatPhone(e.target.value)}
              placeholder="+263 77 123 4567"
              inputMode="tel"
              type="tel"
              autoComplete="tel"
              valid={validPhone}
              error={phone.trim() !== '+263' && !validPhone ? 'Enter a valid Zimbabwe WhatsApp number.' : undefined}
            />
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-zinc-800 bg-[#101211] p-4">
            <MessageCircle size={18} className="mt-0.5 shrink-0 text-[#C6FF00]" />
            <p className="text-xs leading-5 text-zinc-400">Your number is used for customer orders and questions.</p>
          </div>
        </>
      );
    }

    if (step === 8) {
      return (
        <>
          <h1 className="text-[2.65rem] font-black leading-[0.94] tracking-tight">Tell customers a little about your shop.</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
            Add a short description customers will remember.
          </p>

          <div className="mt-7 space-y-2">
            <label className="px-1 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">Shop description</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="We make clean everyday streetwear in Bulawayo..."
              maxLength={240}
              className="min-h-40 w-full resize-none rounded-2xl border border-zinc-700 bg-[#111413] px-4 py-4 text-base font-semibold text-white outline-none placeholder:text-zinc-600 transition-colors focus:border-[#C6FF00]"
            />
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-zinc-600">Optional</span>
              <span className="text-[10px] text-zinc-600">{bio.length}/240</span>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <h1 className="text-[2.65rem] font-black leading-[0.94] tracking-tight">Almost there. Create your account.</h1>
        <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
          Your shop details are ready. Create your owner account and we’ll take you straight to your ThreadZW setup.
        </p>

        <div className="mt-7 space-y-4">
          <Field
            label="Your name"
            autoFocus
            value={ownerName}
            onChange={e => setOwnerName(e.target.value)}
            placeholder="What should we call you?"
            autoComplete="name"
            valid={ownerName.trim().length >= 2}
          />
          <Field
            label="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            inputMode="email"
            autoComplete="email"
            valid={validEmail}
            error={email.length > 0 && !validEmail ? 'Enter a valid email address.' : undefined}
          />
          <div className="relative">
            <Field
              label="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              valid={validPassword}
              error={password.length > 0 && !validPassword ? 'Use at least 6 characters.' : undefined}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(value => !value)}
              className="absolute right-2 top-[31px] rounded-xl p-2.5 text-zinc-500 hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>

        {renderError()}

        <div className="mt-5">
          <SocialProof />
        </div>
      </>
    );
  };

  const getPrimaryAction = () => {
    if (step === 1) return { label: 'LET’S BUILD YOUR SHOP', onClick: () => go(2), disabled: false };
    if (step === 2) return { label: 'CONTINUE', onClick: () => go(3), disabled: false };
    if (step === 3) return { label: 'CONTINUE', onClick: () => go(4), disabled: false };
    if (step === 4) return { label: 'CONTINUE', onClick: () => go(5), disabled: !validShopName };
    if (step === 5) return { label: 'CONTINUE', onClick: () => go(6), disabled: discovery.length === 0 };
    if (step === 6) return { label: 'CONTINUE', onClick: () => go(7), disabled: !city };
    if (step === 7) return { label: 'CONTINUE', onClick: () => go(8), disabled: !validPhone };
    if (step === 8) return { label: 'CONTINUE TO SIGN UP', onClick: () => go(9), disabled: false };
    return { label: loading ? 'STARTING YOUR TRIAL…' : 'START MY 3-DAY FREE TRIAL', onClick: createAccountAndShop, disabled: loading };
  };

  const primary = getPrimaryAction();

  return (
    <div className="fixed inset-0 z-[45] overflow-hidden bg-[#070807] font-sans text-white">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <header className="shrink-0 border-b border-zinc-900/80 bg-[#070807]/95 px-5 pb-4 pt-5 backdrop-blur-md">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => (step > 1 ? go(step - 1) : navigate('/'))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-[#111413] text-white transition hover:border-zinc-600"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>

            <span className="text-lg font-black tracking-tight text-[#C6FF00]">ThreadZW</span>

            <span className="w-16 text-right text-[10px] font-black text-zinc-400">
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>

          {renderProgress()}
          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{PHASES[step]}</p>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.18 }}
              className="flex min-h-full flex-col px-5 py-7"
            >
              <div className="pb-8">{renderStep()}</div>

              <div className="mt-auto border-t border-zinc-900 pt-5">
                <Button disabled={primary.disabled} onClick={primary.onClick}>
                  {loading ? <Loader2 size={17} className="animate-spin" /> : null}
                  {primary.label}
                  {!loading && <ArrowRight size={17} />}
                </Button>

                {step === 5 && (
                  <button type="button" onClick={() => go(6)} className="mt-2 h-10 w-full text-xs font-bold text-zinc-500 hover:text-white">
                    Skip for now
                  </button>
                )}

                {step === 8 && (
                  <p className="mt-3 text-center text-[10px] font-semibold text-zinc-600">
                    You can edit your shop description later.
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
