// src/components/design-system/DesignSystemPart3.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Layers, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Check, 
  Copy, 
  Eye, 
  ExternalLink,
  Info,
  Sparkles
} from 'lucide-react';
import { RealisticPhoneFrame } from './screens/RealisticPhoneFrame';
import { Screen9ProductPerformance } from './screens/Screen9ProductPerformance';
import { Screen10ShareStore } from './screens/Screen10ShareStore';
import { Screen11UpgradeScreen } from './screens/Screen11UpgradeScreen';
import { Screen12SubscriptionSuccess } from './screens/Screen12SubscriptionSuccess';
import { toast } from 'sonner';

type ViewTab = 'mockups' | 'interactive' | 'specs';

export const DesignSystemPart3: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ViewTab>('mockups');
  const [zoomLevel, setZoomLevel] = useState<number>(0.92);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Interactive Prototype State
  const [interactiveStep, setInteractiveStep] = useState<number>(9);

  const copyColor = (hex: string, label: string) => {
    navigator.clipboard.writeText(hex);
    toast.success(`Copied ${label} (${hex}) to clipboard!`);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(1.4, Math.max(0.65, parseFloat((prev + delta).toFixed(2)))));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black font-sans selection:bg-[#C6FF00] selection:text-black">
      
      {/* 1. TOP HEADER & DESIGN SYSTEM STATUS BAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-black text-xs tracking-wider">
            <span>T</span><span className="text-[#C6FF00]">ZW</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-black uppercase">
                THREADZW DESIGN SYSTEM
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#C6FF00] text-black font-extrabold text-[10px] tracking-wider uppercase">
                PART 3 OF 20
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">
              SELL MORE. STRESS LESS. • Screens 9 to 12: Product Performance, Share Store, Upgrade & Pro Success
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* 5-Part Quick Switcher */}
          <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-xl text-xs font-bold mr-2">
            <button
              onClick={() => navigate('/design-system-part-1')}
              className="px-2.5 py-1 rounded-lg text-zinc-600 hover:text-black transition-colors cursor-pointer"
            >
              Part 1 (1–4)
            </button>
            <button
              onClick={() => navigate('/design-system-part-2')}
              className="px-2.5 py-1 rounded-lg text-zinc-600 hover:text-black transition-colors cursor-pointer"
            >
              Part 2 (5–8)
            </button>
            <button
              className="px-2.5 py-1 rounded-lg bg-black text-[#C6FF00] shadow-xs cursor-default"
            >
              Part 3 (9–12)
            </button>
            <button
              onClick={() => navigate('/design-system-part-4')}
              className="px-2.5 py-1 rounded-lg text-zinc-600 hover:text-black transition-colors cursor-pointer"
            >
              Part 4 (13–16)
            </button>
            <button
              onClick={() => navigate('/design-system-part-5')}
              className="px-2.5 py-1 rounded-lg text-zinc-600 hover:text-black transition-colors cursor-pointer"
            >
              Part 5 (17–20)
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/60">
            <button
              onClick={() => setActiveTab('mockups')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'mockups'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Smartphone size={13} />
              <span>Keynote Presentation</span>
            </button>
            <button
              onClick={() => setActiveTab('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'interactive'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Eye size={13} />
              <span>Live Walkthrough</span>
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'specs'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Layers size={13} />
              <span>Specs & Tokens</span>
            </button>
          </div>

          {/* Launch Live Onboarding */}
          <button
            onClick={() => navigate('/onboarding')}
            className="px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <span>Test Live App</span>
            <ExternalLink size={12} className="text-[#C6FF00]" />
          </button>
        </div>
      </header>

      {/* 2. MAIN VIEW AREA */}
      <main className="p-4 sm:p-8 max-w-[1680px] mx-auto">
        
        {/* ======================================================== */}
        {/* TAB 1: STUDIO KEYNOTE 4-UP MOCKUP PRESENTATION (SCREENS 9-12) */}
        {/* ======================================================== */}
        {activeTab === 'mockups' && (
          <div className="space-y-6">
            {/* Viewport Floating Controls */}
            <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-2xl px-5 py-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF00] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  Master Showcase Canvas — Part 3
                </span>
                <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                  • 4K Studio Presentation (Screens 9, 10, 11, 12)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoom(-0.08)}
                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-xs font-mono font-bold text-zinc-600 px-1 min-w-[45px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(0.08)}
                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={() => setZoomLevel(0.92)}
                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer ml-1"
                  title="Reset Zoom"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
              </div>
            </div>

            {/* 4-MOCKUP STUDIO CANVAS */}
            <div className="overflow-x-auto pb-12 pt-4 px-2 no-scrollbar bg-white rounded-3xl border border-zinc-200 shadow-sm flex justify-center">
              <div 
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 xl:gap-6 min-w-max p-4 transition-all duration-300"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              >
                
                {/* ------------------------------------------- */}
                {/* SCREEN 9: PRODUCT PERFORMANCE */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen9ProductPerformance 
                      onViewAllProducts={() => {
                        toast.success('Navigating to full inventory catalog');
                      }}
                      onSelectProduct={(p) => {
                        toast.info(`Viewing deep analytics for "${p.name}"`);
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description matching reference image */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      9
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Product Performance Screen
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        See which products get the most views and clicks
                      </p>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------- */}
                {/* SCREEN 10: SHARE STORE */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen10ShareStore 
                      storeSlug="urbanvault"
                      storeName="URBAN VAULT"
                      onBack={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(9);
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description matching reference image */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      10
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Share Store Screen
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        Easy sharing options to help merchants get more traffic
                      </p>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------- */}
                {/* SCREEN 11: UPGRADE SCREEN */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen11UpgradeScreen 
                      onBack={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(10);
                      }}
                      onUpgradeToPro={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(12);
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description matching reference image */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      11
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Upgrade Screen
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        Clear pricing with Pro benefits to increase conversions
                      </p>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------- */}
                {/* SCREEN 12: SUBSCRIPTION SUCCESS SCREEN */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen12SubscriptionSuccess 
                      onGoToDashboard={() => {
                        navigate('/dashboard');
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description matching reference image */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      12
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Subscription Success Screen
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        Celebrate success and show unlocked Pro features
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LIVE INTERACTIVE WALKTHROUGH PROTOTYPE */}
        {/* ======================================================== */}
        {activeTab === 'interactive' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Step Navigation Bar */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-zinc-400">Step:</span>
                {[9, 10, 11, 12].map(s => (
                  <button
                    key={s}
                    onClick={() => setInteractiveStep(s)}
                    className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${
                      interactiveStep === s
                        ? 'bg-black text-[#C6FF00] shadow-xs'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="text-xs font-bold text-zinc-600">
                {interactiveStep === 9 && 'Screen 9: Product Performance (Ranked Inventory Insights)'}
                {interactiveStep === 10 && 'Screen 10: Share Store (Multi-Platform Distribution)'}
                {interactiveStep === 11 && 'Screen 11: Upgrade Screen (Free vs Pro Comparison)'}
                {interactiveStep === 12 && 'Screen 12: Subscription Success (Welcome to Pro 🎉)'}
              </div>

              <button
                onClick={() => setInteractiveStep(9)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-bold text-zinc-600 hover:text-black cursor-pointer"
              >
                Restart Walkthrough
              </button>
            </div>

            {/* Single Interactive Phone Frame */}
            <div className="flex justify-center py-6">
              <RealisticPhoneFrame currentTime="9:41">
                {interactiveStep === 9 && (
                  <Screen9ProductPerformance 
                    onViewAllProducts={() => setInteractiveStep(10)}
                    onSelectProduct={(p) => {
                      toast.success(`Selected "${p.name}" (${p.views} views)`);
                    }}
                    interactive={true}
                  />
                )}
                {interactiveStep === 10 && (
                  <Screen10ShareStore 
                    storeSlug="urbanvault"
                    storeName="URBAN VAULT"
                    onBack={() => setInteractiveStep(9)}
                    interactive={true}
                  />
                )}
                {interactiveStep === 11 && (
                  <Screen11UpgradeScreen 
                    onBack={() => setInteractiveStep(10)}
                    onUpgradeToPro={() => {
                      toast.success('🎉 Upgrading to Pro Plan...');
                      setInteractiveStep(12);
                    }}
                    interactive={true}
                  />
                )}
                {interactiveStep === 12 && (
                  <Screen12SubscriptionSuccess 
                    onGoToDashboard={() => {
                      toast.success('Navigating back to main merchant dashboard');
                      setInteractiveStep(9);
                    }}
                    interactive={true}
                  />
                )}
              </RealisticPhoneFrame>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DESIGN TOKENS, RULES & SPECS SHEET */}
        {/* ======================================================== */}
        {activeTab === 'specs' && (
          <div className="max-w-5xl mx-auto space-y-8 py-4">
            
            {/* Color Palette Cards */}
            <div className="space-y-3">
              <h2 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
                <span>Color Palette</span>
                <span className="text-zinc-400 font-normal text-xs">(Strict System Palette)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* White */}
                <div 
                  onClick={() => copyColor('#FFFFFF', 'Canvas White')}
                  className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all cursor-pointer space-y-3 shadow-xs"
                >
                  <div className="w-full h-16 rounded-xl border border-zinc-200 bg-white" />
                  <div>
                    <span className="text-xs font-bold text-black block">Canvas Background</span>
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mt-1">
                      <span>#FFFFFF</span>
                      <Copy size={12} />
                    </div>
                  </div>
                </div>

                {/* Black */}
                <div 
                  onClick={() => copyColor('#000000', 'Pure Black')}
                  className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all cursor-pointer space-y-3 shadow-xs"
                >
                  <div className="w-full h-16 rounded-xl bg-black" />
                  <div>
                    <span className="text-xs font-bold text-black block">Primary Typography & Shell</span>
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mt-1">
                      <span>#000000</span>
                      <Copy size={12} />
                    </div>
                  </div>
                </div>

                {/* Lime Green Accent */}
                <div 
                  onClick={() => copyColor('#C6FF00', 'Lime Green Accent')}
                  className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all cursor-pointer space-y-3 shadow-xs"
                >
                  <div className="w-full h-16 rounded-xl bg-[#C6FF00] shadow-inner" />
                  <div>
                    <span className="text-xs font-bold text-black block">Lime Accent (CTAs, Badges & Highlights)</span>
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mt-1">
                      <span>#C6FF00</span>
                      <Copy size={12} />
                    </div>
                  </div>
                </div>

                {/* Light Gray Borders */}
                <div 
                  onClick={() => copyColor('#E4E4E7', 'Light Gray Border')}
                  className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all cursor-pointer space-y-3 shadow-xs"
                >
                  <div className="w-full h-16 rounded-xl bg-[#E4E4E7]" />
                  <div>
                    <span className="text-xs font-bold text-black block">Borders & Inactive Tracks</span>
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mt-1">
                      <span>#E4E4E7</span>
                      <Copy size={12} />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Typography Scale */}
            <div className="space-y-3">
              <h2 className="text-base font-black uppercase tracking-tight text-black">
                Typography Scale & Hierarchy (Part 3)
              </h2>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-xs">
                
                <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-2xl font-black text-black tracking-tight">
                    See which products perform best.
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">H1 Display / 26px Black</span>
                </div>

                <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-2xl font-black text-black tracking-tight">
                    Get more eyes on your store.
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">H1 Display / 26px Black</span>
                </div>

                <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-2xl font-black text-black tracking-tight">
                    Unlock more. Sell more.
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">H1 Section / 26px Black</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-2xl font-black text-black tracking-tight">
                    Welcome to Pro! 🎉
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">H1 Celebration / 28px Black</span>
                </div>

              </div>
            </div>

            {/* Part 3 Architectural Directives */}
            <div className="space-y-3">
              <h2 className="text-base font-black uppercase tracking-tight text-black">
                Part 3 Component Directives
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Check size={14} className="text-[#C6FF00] stroke-[3]" />
                    Product Rank & Viral Distribution
                  </h3>
                  <ul className="text-xs text-zinc-600 space-y-1.5 leading-relaxed font-medium">
                    <li>• Ranked merchandise view count list with high-contrast lime numeric markers (<code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-black">1, 2, 3</code>).</li>
                    <li>• One-tap social bio copy actions for Instagram and TikTok with distinct platform emblems.</li>
                    <li>• WhatsApp merchant sharing row triggering instant chat distribution.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Sparkles size={14} className="text-black" />
                    Monetization & Upgrade Funnel
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                    Side-by-side Free vs Pro value proposition with prominent <strong>$1.59/month</strong> pricing, highlighted via lime border and <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-black">Most Popular</code> badge, transitioning directly into celebratory post-purchase state.
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
};
