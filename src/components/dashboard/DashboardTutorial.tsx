import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

const TUTORIAL_KEY = 'threadzw_dashboard_tutorial_seen_v1';

const slides = [
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/tutorial/01-your-threadzw-link.png',
    title: 'YOUR SHOP. ONE LINK.',
    description: 'Share your ThreadZW link on WhatsApp, Instagram, TikTok or anywhere your customers find you.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/tutorial/02-add-your-products.png',
    title: 'ADD YOUR PRODUCTS',
    description: 'Add your products with photos, prices and details so customers can browse your collection.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/tutorial/03-add-shop-directions.png',
    title: 'ADD SHOP DIRECTIONS',
    description: 'Add your shop location so customers can easily find you in person.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/tutorial/04-logo-and-banner.png',
    title: 'MAKE IT YOUR BRAND',
    description: 'Add your logo and banner to make your ThreadZW storefront feel like your brand.'
  },
  {
    image: 'https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/tutorial/05-your-analytics.png',
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

  useEffect(() => {
    if (!userId) return;
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) setOpen(true);
  }, [userId]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const close = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setOpen(false);
  };

  const next = () => {
    if (slide === slides.length - 1) {
      close();
      return;
    }
    setSlide((current) => current + 1);
  };

  const previous = () => {
    setSlide((current) => Math.max(0, current - 1));
  };

  if (!open) return null;

  const current = slides[slide];
  const isLast = slide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ThreadZW dashboard tutorial"
        className="relative flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close tutorial"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black"
        >
          <X size={18} />
        </button>

        <div className="relative bg-[#F7F7F5]">
          <img
            src={current.image}
            alt={current.title}
            className="block aspect-[4/5] w-full object-cover"
            loading={slide === 0 ? 'eager' : 'lazy'}
            draggable={false}
          />
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1.5 backdrop-blur-sm">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to tutorial slide ${index + 1}`}
                onClick={() => setSlide(index)}
                className={`h-1.5 rounded-full transition-all ${index === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F05A00]">
              {slide + 1} / {slides.length}
            </p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-zinc-950">
              {current.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {current.description}
            </p>
          </div>

          <div className="mt-auto flex items-center gap-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50"
            >
              Skip
            </button>

            {slide > 0 && (
              <button
                type="button"
                onClick={previous}
                aria-label="Previous tutorial slide"
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-900 transition hover:bg-zinc-50"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <button
              type="button"
              onClick={next}
              className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3.5 text-sm font-black text-white transition hover:bg-zinc-800 active:scale-[0.99]"
            >
              {isLast ? 'Get started' : 'Next'}
              {isLast ? null : <ArrowRight size={17} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
