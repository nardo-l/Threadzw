import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CreditCard, Lock, Package, ShieldCheck, Sparkles, Store, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TOTAL_STEPS = 4;

const featureList = [
  'Add your first product',
  'Get your own custom storefront',
  'Share one link on WhatsApp, Instagram & TikTok',
  'Unlimited products after the trial',
  'Premium storefront tools & analytics',
];

export const OnboardingPaywall: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const goNext = () => setStep(current => Math.min(TOTAL_STEPS, current + 1));
  const goBack = () => setStep(current => Math.max(1, current - 1));

  return (
    <main className="fixed inset-0 z-[60] overflow-hidden bg-[#f7f5ef] text-zinc-950">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <header className="shrink-0 px-5 pb-4 pt-5">
          <div className="mb-5 flex items-center justify-between">
            {step > 1 ? (
              <button type="button" onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white" aria-label="Previous screen">
                <ArrowLeft size={18} />
              </button>
            ) : <div className="w-10" />}
            <div className="text-lg font-black tracking-tight">THREAD<span className="text-[#F05A00]">ZW</span></div>
            <span className="w-10 text-right text-[10px] font-black text-zinc-400">{step}/{TOTAL_STEPS}</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <div key={index} className={`h-1.5 flex-1 rounded-full transition-all ${index < step ? 'bg-[#F05A00]' : 'bg-zinc-200'}`} />
            ))}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
          {step === 1 && (
            <div className="flex min-h-full flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F05A00]">YOUR STORE IS READY</p>
              <h1 className="mt-4 text-[2.65rem] font-black leading-[0.94] tracking-tight">
                Turn your brand into a <span className="text-[#F05A00]">real online store.</span>
              </h1>
              <p className="mt-5 text-base leading-7 text-zinc-600">
                You've done the setup. Start your free 3-day Pro trial and add up to 3 products before deciding to pay.
              </p>

              <div className="relative mt-8 overflow-hidden rounded-[2rem] bg-zinc-950 p-5 text-white shadow-xl">
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#F05A00]/20" />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F05A00]"><Store size={20} /></div>
                    <span className="text-xs font-black uppercase tracking-widest">Your ThreadZW storefront</span>
                  </div>
                  <div className="mt-7 grid grid-cols-2 gap-2">
                    {['YOUR BRAND', 'NEW DROP', 'PRODUCTS', 'WHATSAPP'].map((label, index) => (
                      <div key={label} className={`rounded-2xl p-4 ${index === 1 ? 'bg-[#F05A00] text-white' : 'bg-white/10 text-zinc-200'}`}>
                        <div className="mb-6 h-2 w-12 rounded-full bg-current opacity-30" />
                        <p className="text-[9px] font-black uppercase tracking-wider">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <PrimaryButton onClick={goNext}>See what you get <ArrowRight size={18} /></PrimaryButton>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex min-h-full flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F05A00]">PRO PLAN</p>
              <h1 className="mt-4 text-[2.65rem] font-black leading-[0.94] tracking-tight">
                Try Pro free. <span className="text-[#F05A00]">Then grow without limits.</span>
              </h1>
              <p className="mt-5 text-base leading-7 text-zinc-600">
                Start with a free 3-day trial. Add up to 3 products and test your storefront. After the trial, Pro is $9 once-off with no monthly renewal.
              </p>

              <div className="mt-7 rounded-[2rem] border-2 border-[#F05A00] bg-zinc-950 p-5 text-white shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-[#F05A00] px-3 py-1 text-[9px] font-black uppercase tracking-wider">3-DAY FREE TRIAL</span>
                    <h2 className="mt-4 text-2xl font-black">ThreadZW Pro</h2>
                    <p className="mt-1 text-xs text-zinc-400">Everything you need to sell.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black">$0</span>
                    <span className="block text-[10px] font-bold text-zinc-500">for 3 days</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                  {featureList.map(feature => (
                    <div key={feature} className="flex items-center gap-3 text-sm font-semibold">
                      <Check size={16} className="shrink-0 text-[#F05A00]" /> {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-7">
                <PrimaryButton onClick={goNext}>How payment works <ArrowRight size={18} /></PrimaryButton>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex min-h-full flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F05A00]">SIMPLE & SECURE</p>
              <h1 className="mt-4 text-[2.65rem] font-black leading-[0.94] tracking-tight">
                Here's exactly <span className="text-[#F05A00]">what happens.</span>
              </h1>
              <p className="mt-5 text-base leading-7 text-zinc-600">
                Your free trial starts immediately. After 3 days, pay $9 once-off through NardoPay to keep Pro and unlock unlimited products.
              </p>

              <div className="mt-7 space-y-3">
                <InfoRow number="01" icon={<CreditCard size={19} />} title="Pay $9 once-off after your trial" text="You'll use the secure NardoPay checkout when you're ready to activate Pro." />
                <InfoRow number="02" icon={<ShieldCheck size={19} />} title="Payment is verified" text="Your payment is sent for verification. Your shop is not activated just because you reach the payment page." />
                <InfoRow number="03" icon={<Zap size={19} />} title="Pro is activated" text="During your trial, add up to 3 products. After paying $9 once-off and verification, your shop gets unlimited products." />
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-[#F05A00]"><Lock size={19} /></div>
                <div>
                  <p className="text-xs font-black">Powered by NardoPay</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">3-day free trial · then $9 once-off</p>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <PrimaryButton onClick={goNext}>See my dashboard <ArrowRight size={18} /></PrimaryButton>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex min-h-full flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F05A00]">YOUR NEXT STEP</p>
              <h1 className="mt-4 text-[2.7rem] font-black leading-[0.94] tracking-tight">
                Your store is <span className="text-[#F05A00]">ready to try.</span>
              </h1>
              <p className="mt-5 text-base leading-7 text-zinc-600">
                Start your free 3-day trial, customise your shop, choose a storefront theme and add up to 3 products. After the trial, pay $9 once-off to keep Pro.
              </p>

              <div className="mt-7 overflow-hidden rounded-[2rem] bg-zinc-950 text-white shadow-xl">
                <div className="border-b border-white/10 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">THREADZW PRO</p>
                      <h2 className="mt-1 text-xl font-black">3-day free trial</h2>
                    </div>
                    <Sparkles className="text-[#F05A00]" size={22} />
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <span className="text-5xl font-black">$0</span>
                    <span className="pb-1 text-xs font-bold text-zinc-400">USD · once-off</span>
                  </div>
                </div>
                <div className="space-y-3 p-5 text-sm">
                  {['Customise your storefront', 'Choose from your ThreadZW themes', 'See your store before paying', 'Add up to 3 products during your trial'].map(item => (
                    <div key={item} className="flex items-center gap-3 font-semibold">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F05A00]"><Check size={13} /></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-7">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex w-full items-center justify-between rounded-2xl bg-[#F05A00] px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-900/20 transition active:scale-[.99]"
                >
                  <span>START YOUR FREE TRIAL</span>
                  <ArrowRight size={20} />
                </button>
                <p className="mt-3 text-center text-[10px] font-semibold text-zinc-500">
                  Start free for 3 days. Then pay $9 once-off to keep Pro.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

const PrimaryButton: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-black text-white transition active:scale-[.99]">
    {children}
  </button>
);

const InfoRow: React.FC<{ number: string; icon: React.ReactNode; title: string; text: string }> = ({ number, icon, title, text }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F05A00]/10 text-[#F05A00]">{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2"><span className="text-[9px] font-black text-zinc-400">{number}</span><p className="text-sm font-black">{title}</p></div>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p>
    </div>
  </div>
);