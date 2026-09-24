import React from 'react';
import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC<{ storefront?: boolean }> = ({ storefront = false }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] px-5 py-8 font-sans text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-between">
        <header className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-xl font-black tracking-tight">
            THREAD<span className="text-[#C6FF00]">ZW</span>
          </button>
          <button onClick={() => navigate('/')} aria-label="Back home" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Home size={17} />
          </button>
        </header>

        <main className="py-12">
          <div className="relative mb-9 flex h-52 items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-[#0d0d0d]">
            <div className="absolute h-36 w-36 rounded-full border-[2px] border-[#C6FF00]/70" />
            <div className="absolute h-44 w-44 rounded-full border border-[#C6FF00]/20 rotate-12" />
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#C6FF00]/10 blur-2xl" />
            <div className="relative text-center">
              <div className="text-[88px] font-black leading-none tracking-[-.08em] text-white">404</div>
              <div className="mx-auto mt-1 h-1.5 w-24 rounded-full bg-[#C6FF00]" />
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#C6FF00]">THREADZW // OFF TRACK</p>
          <h1 className="mt-3 text-4xl font-black leading-[.94] tracking-tight">
            Looks like you went <span className="text-[#C6FF00]">off track.</span>
          </h1>
          <p className="mt-5 text-sm leading-6 text-zinc-400">
            {storefront
              ? 'That storefront link does not exist, may have been removed, or is no longer public.'
              : 'The page you are looking for does not exist or may have been moved.'}
          </p>

          <div className="mt-8 grid gap-2">
            <button onClick={() => navigate('/')} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#C6FF00] px-5 text-sm font-black text-black transition hover:bg-[#d6ff33]">
              Back to Home <ArrowLeft size={17} className="rotate-180" />
            </button>
            {storefront && (
              <button onClick={() => navigate('/shops')} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-bold text-white transition hover:bg-white/10">
                <SearchX size={17} /> Explore shops
              </button>
            )}
          </div>
        </main>

        <footer className="pb-2 text-center text-[10px] font-bold uppercase tracking-[.18em] text-zinc-700">
          Shop. Share. Discover. <span className="text-[#C6FF00]">ThreadZW.</span>
        </footer>
      </div>
    </div>
  );
};
