import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CreditCard, Lock, ShieldCheck, Sparkles, Store, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TOTAL_STEPS = 4;

const featureList = [
  'Add up to 3 products for free',
  'Get your own custom storefront',
  'Share one link on WhatsApp, Instagram & TikTok',
  'Unlimited products after Pro activation',
  'Premium storefront tools & analytics',
];

const PhaseLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{children}</p>
);

const PrimaryButton: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-14 w-full items-center justify-between rounded-2xl bg-[#C6FF00] px-5 text-sm font-black uppercase tracking-[0.06em] text-black shadow-[0_8px_30px_rgba(198,255,0,0.08)] transition hover:bg-[#d4ff3b] active:scale-[.99]"
  >
    {children}
  </button>
);

const Progress = ({ step }: { step: number }) => (
  <div className="space-y-2.5">
    <div className="flex items-end justify-between">
      <span className="text-[11px] font-black text-white">Step {step} of {TOTAL_STEPS}</span>
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
        {Math.round((step / TOTAL_STEPS) * 100)}%
      </span>
    </div>
    <div className="flex gap-1.5">
      {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 flex-1 rounded-full transition-all ${index < step - 1 ? 'bg-[#7d9900]' : index === step - 1 ? 'bg-[#C6FF00]' : 'bg-[#303330]'}`}
        />
      ))}
    </div>
  </div>
);

export const OnboardingPaywall: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const goNext = () => setStep(current => Math.min(TOTAL_STEPS, current + 1));
  const goBack = () => setStep(current => Math.max(1, current - 1));

  return (
    <main className="fixed inset-0 z-[60] overflow-hidden bg-[#070807] text-white">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <header className="shrink-0 border-b border-zinc-900/80 bg-[#070807]/95 px-5 pb-4 pt-5 backdrop-blur-md">
          <div className="mb-5 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-[#111413] text-white transition hover:border-zinc-600"
                aria-label="Previous screen"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-[#111413] text-white"
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="text-lg font-black tracking-tight text-[#C6FF00]">ThreadZW</div>
            <span className="w-16 text-right text-[10px] font-black text-zinc-400">Step {step} of {TOTAL_STEPS}</span>
          </div>
          <Progress step={step} />
          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {step <= 2 ? 'PHASE 5 • YOUR PLAN' : 'PHASE 5 • GETTING STARTED'}
          </p>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-7">
          {step === 1 && (
            <div className="flex min-h-full flex-col">
              <div>
                <PhaseLabel>YOUR STORE IS READY</PhaseLabel>
                <h1 className="mt-4 text-[2.65rem] font-black leading-[0.94] tracking-tight">
                  Your shop is ready to <span className="text-[#C6FF00]">start free.</span>
                </h1>
                <p className="mt-5 text-sm leading-6 text-zinc-400">
                  Start with the free plan and get your storefront live. Upgrade when your shop grows.
                </p>

                <div className="mt-7 rounded-[1.75rem] border border-zinc-800 bg-[#101211] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C6FF00] text-black"><Store size={20} /></div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">THREADZW</p>
                      <p className="text-sm font-black">Your online storefront</p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {['YOUR BRAND', 'PRODUCTS', 'YOUR LINK', 'WHATSAPP'].map(label => (
                      <div key={label} className="rounded-2xl border border-zinc-800 bg-[#171a18] p-4">
                        <div className="mb-5 h-2 w-12 rounded-full bg-zinc-700" />
                        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-300">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <PrimaryButton onClick={goNext}>See my free plan <ArrowRight size={18} /></PrimaryButton>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex min-h-full flex-col">
              <div>
                <PhaseLabel>FREE PLAN</PhaseLabel>
                <h1 className="mt-4 text-[2.65rem] font-black leading-[0.94] tracking-tight">
                  Start free. <span className="text-[#C6FF00]">Grow when you’re ready.</span>
                </h1>
                <p className="mt-5 text-sm leading-6 text-zinc-400">
                  Start free with up to 3 products. Upgrade later when you need unlimited products.
                </p>

                <div className="mt-7 rounded-[1.75rem] border-2 border-[#C6FF00] bg-[#101211] p-5 shadow-[0_0_35px_rgba(198,255,0,0.05)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex rounded-full bg-[#C6FF00] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-black">RECOMMENDED</span>
                      <h2 className="mt-4 text-2xl font-black">ThreadZW Free</h2>
                      <p className="mt-1 text-xs text-zinc-500">Everything you need to start selling.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-black">$0</span>
                      <span className="block text-[10px] font-bold text-zinc-500">up to 3 products</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                    {featureList.map(feature => (
                      <div key={feature} className="flex items-start gap-3 text-sm font-semibold text-zinc-200">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C6FF00] text-black">
                          <Check size={12} strokeWidth={3} />
                        </span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 text-[10px] font-bold text-zinc-400">
                    <Check size={14} className="text-[#C6FF00]" /> No card required for the free plan.
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <PrimaryButton onClick={goNext}>How payment works <ArrowRight size={18} /></PrimaryButton>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex min-h-full flex-col">
              <div>
                <PhaseLabel>SIMPLE & SECURE</PhaseLabel>
                <h1 className="mt-4 text-[2.65rem] font-black leading-[0.94] tracking-tight">
                  Upgrade when <span className="text-[#C6FF00]">your shop grows.</span>
                </h1>
                <p className="mt-5 text-sm leading-6 text-zinc-400">
                  Your free plan includes up to 3 products. When you’re ready, pay $9 once-off through NardoPay to unlock unlimited products.
                </p>

                <div className="mt-7 space-y-3">
                  <InfoRow number="01" icon={<CreditCard size={19} />} title="Pay $9 once-off when you’re ready" text="Use the secure NardoPay checkout when you want to activate Pro." />
                  <InfoRow number="02" icon={<ShieldCheck size={19} />} title="Payment is verified" text="Your payment is checked before Pro access is activated." />
                  <InfoRow number="03" icon={<Zap size={19} />} title="Unlimited products" text="Once verified, your shop can add unlimited products." />
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101211] p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C6FF00] text-black"><Lock size={19} /></div>
                  <div>
                    <p className="text-xs font-black">Powered by NardoPay</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">Free plan first · then $9 once-off</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <PrimaryButton onClick={goNext}>See my dashboard <ArrowRight size={18} /></PrimaryButton>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex min-h-full flex-col">
              <div>
                <PhaseLabel>YOUR NEXT STEP</PhaseLabel>
                <h1 className="mt-4 text-[2.7rem] font-black leading-[0.94] tracking-tight">
                  Your shop is <span className="text-[#C6FF00]">ready to go.</span>
                </h1>
                <p className="mt-5 text-sm leading-6 text-zinc-400">
                  Start free with up to 3 products. You can customise your storefront, add products and upgrade when your shop grows.
                </p>

                <div className="mt-7 overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-[#101211]">
                  <div className="border-b border-zinc-800 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">THREADZW FREE</p>
                        <h2 className="mt-1 text-xl font-black">Ready to start selling</h2>
                      </div>
                      <Sparkles className="text-[#C6FF00]" size={22} />
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                      <span className="text-5xl font-black">$0</span>
                      <span className="pb-1 text-xs font-bold text-zinc-500">FREE PLAN</span>
                    </div>
                  </div>
                  <div className="space-y-3 p-5 text-sm">
                    {['Customise your storefront', 'Choose a ThreadZW theme', 'Share your shop link', 'Add up to 3 products for free'].map(item => (
                      <div key={item} className="flex items-center gap-3 font-semibold text-zinc-200">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C6FF00] text-black"><Check size={13} /></span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex h-14 w-full items-center justify-between rounded-2xl bg-[#C6FF00] px-5 text-sm font-black uppercase tracking-[0.06em] text-black shadow-[0_8px_30px_rgba(198,255,0,0.08)] transition hover:bg-[#d4ff3b] active:scale-[.99]"
                >
                  <span>OPEN MY DASHBOARD</span>
                  <ArrowRight size={20} />
                </button>
                <p className="mt-3 text-center text-[10px] font-semibold leading-5 text-zinc-600">
                  No card required. Upgrade to Pro for $9 once-off when you need unlimited products.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

const InfoRow: React.FC<{ number: string; icon: React.ReactNode; title: string; text: string }> = ({ number, icon, title, text }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-[#101211] p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C6FF00] text-black">{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black text-zinc-600">{number}</span>
        <p className="text-sm font-black text-white">{title}</p>
      </div>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p>
    </div>
  </div>
);
