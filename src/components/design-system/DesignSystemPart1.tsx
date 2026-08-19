// src/components/design-system/DesignSystemPart1.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Smartphone, 
  Layers, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ArrowRight, 
  Check, 
  Copy, 
  Eye, 
  ExternalLink,
  Code2,
  Info
} from 'lucide-react';
import { RealisticPhoneFrame } from './screens/RealisticPhoneFrame';
import { Screen1Welcome } from './screens/Screen1Welcome';
import { Screen2BusinessType, BusinessTypeId } from './screens/Screen2BusinessType';
import { Screen3SuccessPrediction } from './screens/Screen3SuccessPrediction';
import { Screen4ShopSetup } from './screens/Screen4ShopSetup';
import { toast } from 'sonner';

type ViewTab = 'mockups' | 'interactive' | 'specs';

export const DesignSystemPart1: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ViewTab>('mockups');
  const [zoomLevel, setZoomLevel] = useState<number>(0.92);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Interactive Prototype State
  const [interactiveStep, setInteractiveStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<BusinessTypeId>('sneakers');
  const [storeName, setStoreName] = useState('Urban Vault');
  const [whatsappNumber, setWhatsappNumber] = useState('+263 77 123 4567');
  const [city, setCity] = useState('Bulawayo');
  const [description, setDescription] = useState('Premium streetwear, sneaker plug and urban vintage fashion in Zimbabwe.');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
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
                PART 1 OF 20
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">
              SELL MORE. STRESS LESS. • 4-Screen Onboarding & Merchant Foundation
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* 5-Part Quick Switcher */}
          <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-xl text-xs font-bold mr-2">
            <button
              className="px-2.5 py-1 rounded-lg bg-black text-[#C6FF00] shadow-xs cursor-default"
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
            <span>Test Live Onboarding</span>
            <ExternalLink size={12} className="text-[#C6FF00]" />
          </button>
        </div>
      </header>

      {/* 2. MAIN VIEW AREA */}
      <main className="p-4 sm:p-8 max-w-[1680px] mx-auto">
        
        {/* ======================================================== */}
        {/* TAB 1: STUDIO KEYNOTE 4-UP MOCKUP PRESENTATION */}
        {/* ======================================================== */}
        {activeTab === 'mockups' && (
          <div className="space-y-6">
            {/* Viewport Floating Controls */}
            <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-2xl px-5 py-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF00] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  Master Showcase Canvas
                </span>
                <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                  • High-Resolution Hardware Mockups (4-Up Sequence)
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
                {/* SCREEN 1: WELCOME SCREEN */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen1Welcome 
                      onGetStarted={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(2);
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      1
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Welcome Screen
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        High impact intro with clear value proposition
                      </p>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------- */}
                {/* SCREEN 2: BUSINESS TYPE SELECTION */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen2BusinessType 
                      selectedType="sneakers"
                      onSelectType={(t) => setSelectedType(t)}
                      onBack={() => setInteractiveStep(1)}
                      onContinue={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(3);
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      2
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Business Type Selection
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        Choose your business type to continue
                      </p>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------- */}
                {/* SCREEN 3: SUCCESS PREDICTION */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen3SuccessPrediction 
                      progressPercentage={0}
                      onBack={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(2);
                      }}
                      onSetUpStore={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(4);
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      3
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Success Prediction
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        Simple checklist to help you complete your setup
                      </p>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------- */}
                {/* SCREEN 4: SHOP SETUP */}
                {/* ------------------------------------------- */}
                <div className="flex flex-col items-center space-y-4 w-[340px] sm:w-[355px]">
                  <RealisticPhoneFrame currentTime="9:41">
                    <Screen4ShopSetup 
                      storeName="Urban Vault"
                      whatsappNumber="+263 77 123 4567"
                      city="Bulawayo"
                      description="Premium streetwear and sneaker plug."
                      onBack={() => {
                        setActiveTab('interactive');
                        setInteractiveStep(3);
                      }}
                      onCreateStore={() => {
                        toast.success('Store creation initialized!');
                        navigate('/onboarding');
                      }}
                      interactive={true}
                    />
                  </RealisticPhoneFrame>

                  {/* Caption & Description */}
                  <div className="flex items-start gap-3 w-full px-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                      4
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-black tracking-tight">
                        Shop Setup
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                        Quick information to create your store
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
                {[1, 2, 3, 4].map(s => (
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
                {interactiveStep === 1 && 'Screen 1: Welcome Screen'}
                {interactiveStep === 2 && 'Screen 2: Business Type Selection (Step 1 of 4)'}
                {interactiveStep === 3 && 'Screen 3: Success Prediction (Step 2 of 4)'}
                {interactiveStep === 4 && 'Screen 4: Shop Setup (Step 3 of 4)'}
              </div>

              <button
                onClick={() => setInteractiveStep(1)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-bold text-zinc-600 hover:text-black cursor-pointer"
              >
                Restart Walkthrough
              </button>
            </div>

            {/* Single Interactive Phone Frame */}
            <div className="flex justify-center py-6">
              <RealisticPhoneFrame currentTime="9:41">
                {interactiveStep === 1 && (
                  <Screen1Welcome 
                    onGetStarted={() => setInteractiveStep(2)}
                    interactive={true}
                  />
                )}
                {interactiveStep === 2 && (
                  <Screen2BusinessType 
                    selectedType={selectedType}
                    onSelectType={(t) => setSelectedType(t)}
                    onBack={() => setInteractiveStep(1)}
                    onContinue={() => setInteractiveStep(3)}
                    interactive={true}
                  />
                )}
                {interactiveStep === 3 && (
                  <Screen3SuccessPrediction 
                    progressPercentage={0}
                    onBack={() => setInteractiveStep(2)}
                    onSetUpStore={() => setInteractiveStep(4)}
                    interactive={true}
                  />
                )}
                {interactiveStep === 4 && (
                  <Screen4ShopSetup 
                    storeName={storeName}
                    onStoreNameChange={setStoreName}
                    whatsappNumber={whatsappNumber}
                    onWhatsappNumberChange={setWhatsappNumber}
                    city={city}
                    onCityChange={setCity}
                    description={description}
                    onDescriptionChange={setDescription}
                    logoPreview={logoPreview}
                    onLogoUpload={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLogoPreview(URL.createObjectURL(file));
                    }}
                    onBack={() => setInteractiveStep(3)}
                    onCreateStore={() => {
                      toast.success(`🎉 Store "${storeName || 'Urban Vault'}" created on ThreadZW!`);
                      navigate('/onboarding');
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
                    <span className="text-xs font-bold text-black block">Primary Typography</span>
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
                    <span className="text-xs font-bold text-black block">Lime Accent (CTAs & Highlights)</span>
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
                Typography Scale & Hierarchy
              </h2>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-xs">
                
                <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-3xl font-black text-black tracking-tight leading-tight">
                    Launch your clothing store in under <span className="text-[#C6FF00]">60 seconds.</span>
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">H1 Display / 34px Bold / Tracking -0.02em</span>
                </div>

                <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-2xl font-black text-black tracking-tight">
                    What do you sell?
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">H2 Section / 26px Black</span>
                </div>

                <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-700">
                    No coding. No website builders. Just your brand.
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">Body / 14px Semibold</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-zinc-400">
                    SELL MORE. STRESS LESS.
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">Tagline / 10px Extrabold Wide</span>
                </div>

              </div>
            </div>

            {/* Design System Rules Matrix */}
            <div className="space-y-3">
              <h2 className="text-base font-black uppercase tracking-tight text-black">
                Design System Architectural Directives
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Check size={14} className="text-[#C6FF00] stroke-[3]" />
                    Approved Component Conventions
                  </h3>
                  <ul className="text-xs text-zinc-600 space-y-1.5 leading-relaxed font-medium">
                    <li>• Full-width CTA buttons in <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-black">#C6FF00</code> with black text and right arrow.</li>
                    <li>• 4-segment segmented progress bar at the top with active segments in lime green.</li>
                    <li>• Soft shadows and large rounded corners (<code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-black">rounded-2xl</code>).</li>
                    <li>• Real streetwear and sneaker photography (no gradients, no illustrations).</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Info size={14} className="text-black" />
                    Marketplace Target Domain
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                    Tailored specifically for Zimbabwean clothing brands, sneaker stores, thrift shops, and fashion boutiques across Harare, Bulawayo, and nationwide.
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
