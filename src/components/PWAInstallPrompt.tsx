import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'threadzw_pwa_install_dismissed_at_v3';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const TUTORIAL_SEEN_KEY = 'threadzw_dashboard_tutorial_v2_seen';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isDashboardRoute() {
  return window.location.pathname.toLowerCase().replace(/\/$/, '') === '/dashboard';
}

function tutorialHasFinished() {
  return localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
}

export const PWAInstallPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [tutorialFinished, setTutorialFinished] = useState(tutorialHasFinished);

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
      const finished = tutorialHasFinished();
      setTutorialFinished(finished);

      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || '0');
      const dismissedRecently = dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;

      // The install overlay is only for the main dashboard, after the setup
      // tutorial, and only when the browser supplied a real install prompt.
      setShow(
        isDashboardRoute() &&
        !isStandalone() &&
        finished &&
        Boolean(installEvent) &&
        !dismissedRecently
      );
    };

    checkVisibility();
    const interval = window.setInterval(checkVisibility, 250);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.clearInterval(interval);
    };
  }, [installEvent]);

  useEffect(() => {
    if (!tutorialFinished) return;
    // Re-check immediately when the tutorial is closed/skipped.
    const timer = window.setTimeout(() => {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || '0');
      const dismissedRecently = dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
      setShow(
        isDashboardRoute() &&
        !isStandalone() &&
        Boolean(installEvent) &&
        !dismissedRecently
      );
    }, 50);
    return () => window.clearTimeout(timer);
  }, [tutorialFinished, installEvent]);

  if (!show || !installEvent) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    const event = installEvent;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === 'dismissed') {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      }
    } finally {
      setInstallEvent(null);
      setShow(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 px-4 pb-5 sm:items-center sm:pb-0">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Install ThreadZW"
        className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-5 text-zinc-950 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
      >
        <button
          type="button"
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

        <button
          type="button"
          onClick={install}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#CCFF00] text-sm font-black text-black transition hover:opacity-90 active:scale-[0.99]"
        >
          <Download size={17} />
          Install ThreadZW
        </button>

        <button
          type="button"
          onClick={dismiss}
          className="mt-3 h-10 w-full text-xs font-semibold text-zinc-400 transition hover:text-zinc-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};
