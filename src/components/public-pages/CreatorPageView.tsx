import React from 'react';
import { Page } from '../../types';
import { Sparkles, MessageCircle } from 'lucide-react';
import { ShopLogo } from '../ui/ShopImage';

interface CreatorPageViewProps {
  page: Page;
}

export const CreatorPageView: React.FC<CreatorPageViewProps> = ({ page }) => {
  const whatsappNumber = page.whatsapp_number;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-[#141414] border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-6">
        
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Creator Page
        </div>

        {/* Profile Avatar / Logo */}
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/30 bg-zinc-900 flex items-center justify-center shadow-lg">
          <ShopLogo url={page.logo_url} name={page.name} className="w-full h-full object-cover" />
        </div>

        {/* Title & Category */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">{page.name}</h1>
          <p className="text-xs text-purple-400 font-medium uppercase tracking-wider">{page.category || 'Digital Creator'}</p>
        </div>

        {/* Bio */}
        {page.description && (
          <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">
            {page.description}
          </p>
        )}

        {/* Status Box */}
        <div className="w-full p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/90 text-left space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
            <span>Creator Bio Link Hub</span>
            <span className="text-amber-400 font-mono text-[10px] uppercase bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">Coming Soon</span>
          </div>
          <p className="text-xs text-zinc-400 leading-normal">
            Creator link-in-bio stack, digital downloads, and tip jar features will be available in Phase 3.
          </p>
        </div>

        {/* Contact Button */}
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-black" />
            Connect on WhatsApp
          </a>
        )}

      </div>
    </div>
  );
};
