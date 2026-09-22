import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

const TUTORIAL_KEY = 'threadzw_dashboard_tutorial_seen_v3';

const slides = [
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_0000000018cc81f484c84af953e86338.png',
    title: 'YOUR SHOP. ONE LINK.',
    description: 'Share your ThreadZW link on WhatsApp, Instagram, TikTok or anywhere your customers find you.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_00000000e54c8246b0ef327984326b75.png',
    title: 'ADD YOUR PRODUCTS',
    description: 'Add your products with photos, prices and details so customers can browse your collection.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_00000000ad7c81f4a9ca283392e8bd37.png',
    title: 'ADD SHOP DIRECTIONS',
    description: 'Add your shop location so customers can easily find you in person.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_00000000b04081f4bf35206b09da3e46.png',
    title: 'MAKE IT YOUR BRAND',
    description: 'Add your logo and banner to make your ThreadZW storefront feel like your brand.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/file_000000007a7881f4a37067f6e6393557.png',
    title: 'KNOW YOUR NUMBERS',
    description: 'Use your analytics to see visitors, customer interest and how your shop is performing.'
  }
];

interface DashboardTutorialProps {
  userId?: string;
}

export const DashboardTutorial: React.FC<DashboardTutorialProps> = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (!localStorage.getItem(TUTORIAL_KEY)) setOpen(true);
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    setImageFailed(false);
  }, [slide]);

  const close = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setOpen(false);
  };

  const next = () => {
    if (slide < slides.length - 1) {
      setSlide((current) => current + 1);
    } else {
      close();
    }
  };

  const previous = () => setSlide((current) => Math.max(0, current - 1));

  if (!open) return null;

  const current = slides[slide];
  const isLast = slide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/85 p-3 sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ThreadZW dashboard tutorial"
        className="relative flex h-[min(90vh,760px)] w-full max-w-[420px] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#111111] text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#111111] px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#39FF88]">ThreadZW</p>
            <p className="mt-0.5 text-xs font-semibold text-white/60">Quick setup guide</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close tutorial"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={17} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-[#181818]">
          {!imageFailed ? (
            <img
              key={current.image}
              src={current.image}
              alt={current.title}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
              draggable={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-white/10" />
                <p className="text-sm font-bold text-white">Tutorial image unavailable</p>
                <p className="mt-1 text-xs leading-5 text-white/50">Check that the tutorial files are public in Supabase Storage.</p>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/75 px-3 py-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to tutorial slide ${index + 1}`}
                onClick={() => setSlide(index)}
                className={`h-1.5 rounded-full transition-all ${index === slide ? 'w-6 bg-[#39FF88]' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-[#111111] px-5 pb-5 pt-4 sm:px-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39FF88]">
                {slide + 1} / {slides.length}
              </p>
              <button type="button" onClick={close} className="text-xs font-bold text-white/40 hover:text-white/70">
                Skip tutorial
              </button>
            </div>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-white sm:text-2xl">{current.title}</h2>
            <p className="mt-1.5 text-xs leading-5 text-white/55 sm:text-sm">{current.description}</p>
          </div>

          <div className="flex gap-2">
            {slide > 0 && (
              <button
                type="button"
                onClick={previous}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
                aria-label="Previous tutorial slide"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <button
              type="button"
              onClick={next}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#39FF88] px-5 text-sm font-black text-[#07130c] shadow-lg shadow-emerald-950/30 transition hover:bg-[#55ff9a] active:scale-[0.99]"
            >
              {isLast ? 'Get started' : 'Next'}
              {!isLast && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
