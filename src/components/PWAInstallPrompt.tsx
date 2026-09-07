import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'threadzw_pwa_install_dismissed_at';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isDashboardRoute() {
  const path = window.location.pathname.toLowerCase();
  return path === '/dashboard' ||
    path === '/inventory' ||
    path === '/analytics' ||
    path === '/notifications' ||
    path === '/settings' ||
    path === '/edit-shop' ||
    path === '/edit-profile' ||
    path === '/add-product' ||
    path.startsWith('/edit-product') ||
    path === '/add-vehicle' ||
    path.startsWith('/edit-vehicle');
}

export const PWAInstallPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstallEvent(null);
      setShow(false);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    const checkVisibility = () => {
      const standalone = isStandalone();
      const onIOS = isIOS();
      setIos(onIOS);

      if (standalone || !isDashboardRoute()) {
        setShow(false);
        return;
      }

      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || '0');
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) {
        setShow(false);
        return;
      }

      if (installEvent || onIOS) {
        setShow(true);
      }
    };

    checkVisibility();
    const interval = window.setInterval(checkVisibility, 500);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.clearInterval(interval);
    };
  }, [installEvent]);

  if (!show || (!installEvent && !ios)) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    setShow(false);
    if (choice.outcome === 'dismissed') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 px-4 pb-5 sm:items-center sm:pb-0">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-5 text-zinc-950 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={dismiss}
          aria-label="Close install prompt"
          className="absolute right-4 top-4 rounded-full bg-zinc-100 p-2 text-zinc-500 transition hover:bg-zinc-200"
        >
          <X size={16} />
        </button>

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CCFF00] text-black shadow-sm">
          <Download size={26} strokeWidth={2.5} />
        </div>

        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">ThreadZW</p>
        <h2 className="pr-8 text-xl font-bold tracking-tight">Install ThreadZW</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Add ThreadZW to your device for a faster, app-like experience. Your account and shop stay connected to the same ThreadZW web app.
        </p>

        {ios ? (
          <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-xs leading-5 text-zinc-600">
            <p className="font-semibold text-zinc-900">On iPhone or iPad</p>
            <p className="mt-1 flex items-center gap-1.5">Tap <Share size={14} /> <strong>Share</strong>, then choose <strong>Add to Home Screen</strong> <PlusSquare size={14} />.</p>
          </div>
        ) : (
          <button
            onClick={install}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#CCFF00] text-sm font-bold text-black transition hover:opacity-90 active:scale-[0.99]"
          >
            <Download size={17} />
            Install ThreadZW
          </button>
        )}

        <button
          onClick={dismiss}
          className="mt-3 h-10 w-full text-xs font-semibold text-zinc-400 transition hover:text-zinc-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};
