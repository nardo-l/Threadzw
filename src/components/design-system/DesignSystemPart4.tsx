// src/components/design-system/DesignSystemPart4.tsx

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
  Car,
  ShoppingBag,
  Sliders,
  Sparkles
} from 'lucide-react';
import { RealisticPhoneFrame } from './screens/RealisticPhoneFrame';
import { Screen13StorePreview } from './screens/Screen13StorePreview';
import { Screen14EditStore } from './screens/Screen14EditStore';
import { Screen15OrdersManagement } from './screens/Screen15OrdersManagement';
import { Screen16CarSalesHome } from './screens/Screen16CarSalesHome';
import { toast } from 'sonner';

type ViewTab = 'mockups' | 'interactive' | 'specs';

export const DesignSystemPart4: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ViewTab>('mockups');
  const [zoomLevel, setZoomLevel] = useState<number>(0.92);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Interactive Prototype State
  const [interactiveStep, setInteractiveStep] = useState<number>(13);

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
                PART 4 OF 20
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">
              SELL MORE. STRESS LESS. • Screens 13 to 16: Store Preview, Edit Store, Orders Management & Vehicle Dealership Home
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
              onClick={() => navigate('/design-system-part-3')}
              className="px-2.5 py-1 rounded-lg text-zinc-600 hover:text-black transition-colors cursor-pointer"
            >
              Part 3 (9–12)
            </button>
            <button
              className="px-2.5 py-1 rounded-lg bg-black text-[#C6FF00] shadow-xs cursor-default"
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
        {/* TAB 1: STUDIO KEYNOTE 4-UP MOCKUP PRESENTATION (SCREENS 13-16) */}
        {/* ======================================================== */}
        {activeTab === 'mockups' && (
          <div className="space-y-6">
            {/* Viewport Floating Controls */}
            <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-2xl px-5 py-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF00] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  Master Showcase Canvas — Part 4
                </span>
                <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                  • 4K Studio Presentation (Screens 13, 14, 15, 16)
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
                {/* SCREEN 13: STORE PREVIEW */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen13StorePreview 
                      onEditStore={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(14);
                      }}
                      onOpenStore={() => {
                        toast.success('Launching live merchant storefront in new tab');
                      }}
                      onBack={() => {
                        toast.info('Back to store dashboard');
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description matching reference image */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      13
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Store Preview Screen
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        See exactly how your store looks to customers
                      </p>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------- */}
                {/* SCREEN 14: EDIT STORE */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen14EditStore 
                      onBack={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(13);
                      }}
                      onSaveChanges={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(15);
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description matching reference image */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      14
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Edit Store Screen
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        Update your store details, branding and settings
                      </p>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------- */}
                {/* SCREEN 15: ORDERS MANAGEMENT */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen15OrdersManagement 
                      onBack={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(14);
                      }}
                      onViewAllOrders={() => {
                        toast.success('Viewing complete orders fulfillment ledger');
                      }}
                      onSelectOrder={(o) => {
                        toast.info(`Selected Order ${o.orderNumber}`);
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description matching reference image */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      15
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Orders Management Screen
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        View and manage all customer orders in one place
                      </p>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------- */}
                {/* SCREEN 16: STORE HOME (CAR SALES) */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen16CarSalesHome 
                      onChatWhatsApp={() => {
                        toast.success('Connecting to dealership on WhatsApp');
                      }}
                      onSelectVehicle={(v) => {
                        toast.info(`Inspecting vehicle: ${v.name} (${v.price})`);
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description matching reference image */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      16
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Store Home (Car Sales)
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        A professional car sales store homepage built to convert
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
                {[13, 14, 15, 16].map(s => (
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
                {interactiveStep === 13 && 'Screen 13: Store Preview (Live In-App Customer View)'}
                {interactiveStep === 14 && 'Screen 14: Edit Store (Metadata, WhatsApp, Bio & Logo)'}
                {interactiveStep === 15 && 'Screen 15: Orders Management (Customer Order Ledger)'}
                {interactiveStep === 16 && 'Screen 16: Store Home Car Sales (Dealership Frontpage)'}
              </div>

              <button
                onClick={() => setInteractiveStep(13)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-bold text-zinc-600 hover:text-black cursor-pointer"
              >
                Restart Walkthrough
              </button>
            </div>

            {/* Single Interactive Phone Frame */}
            <div className="flex justify-center py-6">
              <RealisticPhoneFrame currentTime="9:41">
                {interactiveStep === 13 && (
                  <Screen13StorePreview 
                    onEditStore={() => setInteractiveStep(14)}
                    onOpenStore={() => {
                      toast.success('Opening live customer storefront');
                    }}
                    onBack={() => setInteractiveStep(16)}
                    interactive={true}
                  />
                )}
                {interactiveStep === 14 && (
                  <Screen14EditStore 
                    onBack={() => setInteractiveStep(13)}
                    onSaveChanges={() => {
                      setInteractiveStep(15);
                    }}
                    interactive={true}
                  />
                )}
                {interactiveStep === 15 && (
                  <Screen15OrdersManagement 
                    onBack={() => setInteractiveStep(14)}
                    onViewAllOrders={() => {
                      setInteractiveStep(16);
                    }}
                    onSelectOrder={(o) => {
                      toast.success(`Managing Order ${o.orderNumber}`);
                    }}
                    interactive={true}
                  />
                )}
                {interactiveStep === 16 && (
                  <Screen16CarSalesHome 
                    onChatWhatsApp={() => {
                      toast.success('Initiating WhatsApp negotiation chat');
                    }}
                    onSelectVehicle={(v) => {
                      toast.info(`Vehicle: ${v.name} (${v.price})`);
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
                Typography Scale & Hierarchy (Part 4)
              </h2>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-xs">
                
                <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-2xl font-black text-black tracking-tight">
                    This is how your store looks.
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">H1 Display / 26px Black</span>
                </div>

                <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-2xl font-black text-black tracking-tight">
                    Store details
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">H1 Form / 26px Black</span>
                </div>

                <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-2xl font-black text-black tracking-tight">
                    Manage orders easily.
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">H1 Section / 26px Black</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-2xl font-black text-black tracking-tight">
                    Quality Cars. Trusted Deals.
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">H1 Dealership Hero / 22px White</span>
                </div>

              </div>
            </div>

            {/* Part 4 Architectural Directives */}
            <div className="space-y-3">
              <h2 className="text-base font-black uppercase tracking-tight text-black">
                Part 4 Component Directives
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Sliders size={14} className="text-[#C6FF00] stroke-[3]" />
                    Merchant Customization & Order Fulfillment
                  </h3>
                  <ul className="text-xs text-zinc-600 space-y-1.5 leading-relaxed font-medium">
                    <li>• Real-time in-app preview rendering live customer experience with dual action controls.</li>
                    <li>• Clean form controls for store name, category dropdown, verified WhatsApp number, and bio description.</li>
                    <li>• Tabbed order management with distinct status chips (<code className="bg-amber-50 text-amber-800 px-1 py-0.5 rounded font-mono">Pending</code>, <code className="bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded font-mono">Completed</code>).</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Car size={14} className="text-black" />
                    Automotive Dealership Ecosystem
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                    Specialized vehicle sales homepage architecture featuring high-contrast dark hero photography, instant WhatsApp deal negotiation, quick category filtering (SUVs, Sedans, Hatchbacks, Trucks), and automotive spec chips (Diesel/Petrol, Automatic).
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
