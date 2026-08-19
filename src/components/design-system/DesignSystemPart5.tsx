// src/components/design-system/DesignSystemPart5.tsx

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
  Star,
  Camera,
  Building2,
  Sparkles
} from 'lucide-react';
import { RealisticPhoneFrame } from './screens/RealisticPhoneFrame';
import { Screen17VehicleDetails } from './screens/Screen17VehicleDetails';
import { Screen18VehicleGallery } from './screens/Screen18VehicleGallery';
import { Screen19CustomerReviews } from './screens/Screen19CustomerReviews';
import { Screen20DealershipInfo } from './screens/Screen20DealershipInfo';
import { toast } from 'sonner';

type ViewTab = 'mockups' | 'interactive' | 'specs';

export const DesignSystemPart5: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ViewTab>('mockups');
  const [zoomLevel, setZoomLevel] = useState<number>(0.92);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Interactive Prototype State
  const [interactiveStep, setInteractiveStep] = useState<number>(17);

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
                PART 5 OF 20
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">
              SELL MORE. STRESS LESS. • Screens 17 to 20: Vehicle Details, Photo Gallery, Customer Reviews & Dealership Profile
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* 5-Part Quick Switcher */}
          <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-xl text-xs font-bold mr-2">
            <button
              onClick={() => navigate('/design-system-part-1')}
              className="px-2 py-1 rounded-lg text-zinc-600 hover:text-black transition-colors cursor-pointer"
            >
              Part 1 (1–4)
            </button>
            <button
              onClick={() => navigate('/design-system-part-2')}
              className="px-2 py-1 rounded-lg text-zinc-600 hover:text-black transition-colors cursor-pointer"
            >
              Part 2 (5–8)
            </button>
            <button
              onClick={() => navigate('/design-system-part-3')}
              className="px-2 py-1 rounded-lg text-zinc-600 hover:text-black transition-colors cursor-pointer"
            >
              Part 3 (9–12)
            </button>
            <button
              onClick={() => navigate('/design-system-part-4')}
              className="px-2 py-1 rounded-lg text-zinc-600 hover:text-black transition-colors cursor-pointer"
            >
              Part 4 (13–16)
            </button>
            <button
              className="px-2 py-1 rounded-lg bg-black text-[#C6FF00] shadow-xs cursor-default"
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
              <span>Tokens & Specs</span>
            </button>
          </div>

          {/* Zoom & View Options */}
          {activeTab === 'mockups' && (
            <div className="hidden sm:flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/60 text-xs">
              <button
                onClick={() => handleZoom(-0.05)}
                className="p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="px-1.5 font-mono text-[11px] font-bold text-zinc-600 min-w-9 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.05)}
                className="p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={() => setZoomLevel(0.92)}
                className="p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-700 cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-700 cursor-pointer ml-1"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>
          )}

          <button
            onClick={() => navigate('/landing')}
            className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-black hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Exit</span>
            <ExternalLink size={11} />
          </button>
        </div>
      </header>

      {/* 2. TAB 1: 4-UP KEYNOTE PRESENTATION CANVAS */}
      {activeTab === 'mockups' && (
        <main className="py-8 px-4 sm:px-8 max-w-400 mx-auto overflow-x-auto">
          
          {/* Top Banner / Breadcrumb */}
          <div className="mb-8 text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-xs font-extrabold text-zinc-800 uppercase tracking-wider shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#C6FF00] animate-pulse" />
              Automotive Dealership Ecosystem (Part 5 • Screens 17–20)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              Vehicle Marketplace & Dealership Experience
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-2xl mx-auto">
              Automotive buyer evaluation journey: detailed vehicle specs, high-res showroom photography, social proof customer reviews, and verified dealership profile.
            </p>
          </div>

          {/* The 4-Phone Layout in Apple Keynote Grid */}
          <div 
            className="flex items-start justify-center gap-6 lg:gap-8 min-w-[1240px] pb-12 transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoomLevel})` }}
          >

            {/* SCREEN 17: VEHICLE DETAILS */}
            <div className="flex flex-col items-center gap-5 w-[305px]">
              <RealisticPhoneFrame>
                <Screen17VehicleDetails 
                  interactive={true}
                  onViewMorePhotos={() => setActiveTab('interactive')}
                />
              </RealisticPhoneFrame>

              {/* Caption Card */}
              <div className="flex items-start gap-2.5 px-2 text-left w-full">
                <span className="w-6 h-6 rounded-full bg-[#C6FF00] text-black text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  17
                </span>
                <div>
                  <h4 className="text-sm font-black text-black tracking-tight">
                    Product Details
                  </h4>
                  <p className="text-xs text-zinc-500 font-medium leading-snug">
                    Detailed information that builds trust and drives action
                  </p>
                </div>
              </div>
            </div>

            {/* SCREEN 18: VEHICLE GALLERY */}
            <div className="flex flex-col items-center gap-5 w-[305px]">
              <RealisticPhoneFrame>
                <Screen18VehicleGallery 
                  interactive={true}
                />
              </RealisticPhoneFrame>

              {/* Caption Card */}
              <div className="flex items-start gap-2.5 px-2 text-left w-full">
                <span className="w-6 h-6 rounded-full bg-[#C6FF00] text-black text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  18
                </span>
                <div>
                  <h4 className="text-sm font-black text-black tracking-tight">
                    More Photos
                  </h4>
                  <p className="text-xs text-zinc-500 font-medium leading-snug">
                    High quality images that help customers make decisions
                  </p>
                </div>
              </div>
            </div>

            {/* SCREEN 19: CUSTOMER REVIEWS */}
            <div className="flex flex-col items-center gap-5 w-[305px]">
              <RealisticPhoneFrame>
                <Screen19CustomerReviews 
                  interactive={true}
                />
              </RealisticPhoneFrame>

              {/* Caption Card */}
              <div className="flex items-start gap-2.5 px-2 text-left w-full">
                <span className="w-6 h-6 rounded-full bg-[#C6FF00] text-black text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  19
                </span>
                <div>
                  <h4 className="text-sm font-black text-black tracking-tight">
                    Reviews Screen
                  </h4>
                  <p className="text-xs text-zinc-500 font-medium leading-snug">
                    Social proof that increases confidence and conversions
                  </p>
                </div>
              </div>
            </div>

            {/* SCREEN 20: DEALERSHIP INFORMATION */}
            <div className="flex flex-col items-center gap-5 w-[305px]">
              <RealisticPhoneFrame>
                <Screen20DealershipInfo 
                  interactive={true}
                />
              </RealisticPhoneFrame>

              {/* Caption Card */}
              <div className="flex items-start gap-2.5 px-2 text-left w-full">
                <span className="w-6 h-6 rounded-full bg-[#C6FF00] text-black text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  20
                </span>
                <div>
                  <h4 className="text-sm font-black text-black tracking-tight leading-tight">
                    Store Information (Car Sales)
                  </h4>
                  <p className="text-xs text-zinc-500 font-medium leading-snug">
                    Adds credibility and helps customers find and contact the dealership
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Screen Navigation Footer */}
          <div className="mt-4 p-4 rounded-2xl bg-white border border-zinc-200/80 flex flex-wrap items-center justify-between gap-4 max-w-5xl mx-auto shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black text-[#C6FF00] flex items-center justify-center font-black text-xs">
                ZW
              </div>
              <div>
                <h4 className="text-xs font-black text-black uppercase">
                  ThreadZW Vehicle Marketplace Suite
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Screens 17–20 complete the automotive dealership customer experience.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/design-system-part-4')}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-black transition-colors cursor-pointer"
              >
                ← View Part 4 (Screens 13–16)
              </button>
              <button
                onClick={() => setActiveTab('interactive')}
                className="px-3.5 py-1.5 rounded-xl bg-[#C6FF00] hover:bg-[#b5eb00] text-black text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                Try Interactive Prototype →
              </button>
            </div>
          </div>
        </main>
      )}

      {/* 3. TAB 2: LIVE WALKTHROUGH & INTERACTIVE PROTOTYPE */}
      {activeTab === 'interactive' && (
        <main className="py-8 px-4 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Interactive Prototype Phone Frame */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="mb-3 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-black text-[#C6FF00] text-[10px] font-black uppercase">
                  Active Screen {interactiveStep}
                </span>
                <span className="text-xs font-bold text-zinc-500">
                  {interactiveStep === 17 && 'Vehicle Details (Hilux 2022)'}
                  {interactiveStep === 18 && 'Photo Gallery (6 Angles)'}
                  {interactiveStep === 19 && 'Customer Reviews & Social Proof'}
                  {interactiveStep === 20 && 'Auto Vault Motors Storefront'}
                </span>
              </div>

              <RealisticPhoneFrame>
                {interactiveStep === 17 && (
                  <Screen17VehicleDetails
                    interactive={true}
                    onBack={() => setInteractiveStep(20)}
                    onViewMorePhotos={() => setInteractiveStep(18)}
                    onCallDealer={() => toast.info('Calling Auto Vault Motors at +263 77 345 6789')}
                    onChatWhatsApp={() => toast.success('Opened WhatsApp chat inquiry')}
                  />
                )}
                {interactiveStep === 18 && (
                  <Screen18VehicleGallery
                    interactive={true}
                    onBack={() => setInteractiveStep(17)}
                    onChatInquire={() => setInteractiveStep(19)}
                  />
                )}
                {interactiveStep === 19 && (
                  <Screen19CustomerReviews
                    interactive={true}
                    onBack={() => setInteractiveStep(18)}
                    onWriteReview={() => toast.success('Review submission modal opened!')}
                  />
                )}
                {interactiveStep === 20 && (
                  <Screen20DealershipInfo
                    interactive={true}
                    onBack={() => setInteractiveStep(17)}
                    onGetDirections={() => toast.success('Opening Google Maps route')}
                  />
                )}
              </RealisticPhoneFrame>
            </div>

            {/* Right Column: Step-by-Step Flow Controls & Documentation */}
            <div className="md:col-span-7 space-y-5">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-black tracking-tight flex items-center gap-2">
                    <Car size={18} className="text-black" />
                    Interactive Step Selector
                  </h3>
                  <span className="text-xs font-bold text-zinc-400">Step {interactiveStep - 16} of 4</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setInteractiveStep(17)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      interactiveStep === 17
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                        interactiveStep === 17 ? 'bg-[#C6FF00] text-black font-black' : 'bg-zinc-100 text-black'
                      }`}>17</span>
                      Vehicle Details
                    </div>
                    <p className={`text-[11px] mt-1 font-medium ${interactiveStep === 17 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      Specifications, pricing, condition & WhatsApp actions
                    </p>
                  </button>

                  <button
                    onClick={() => setInteractiveStep(18)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      interactiveStep === 18
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                        interactiveStep === 18 ? 'bg-[#C6FF00] text-black font-black' : 'bg-zinc-100 text-black'
                      }`}>18</span>
                      More Photos Gallery
                    </div>
                    <p className={`text-[11px] mt-1 font-medium ${interactiveStep === 18 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      High-resolution 6-angle vehicle photography grid
                    </p>
                  </button>

                  <button
                    onClick={() => setInteractiveStep(19)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      interactiveStep === 19
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                        interactiveStep === 19 ? 'bg-[#C6FF00] text-black font-black' : 'bg-zinc-100 text-black'
                      }`}>19</span>
                      Reviews & Ratings
                    </div>
                    <p className={`text-[11px] mt-1 font-medium ${interactiveStep === 19 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      4.8 score breakdown, star charts & verified testimonials
                    </p>
                  </button>

                  <button
                    onClick={() => setInteractiveStep(20)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      interactiveStep === 20
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                        interactiveStep === 20 ? 'bg-[#C6FF00] text-black font-black' : 'bg-zinc-100 text-black'
                      }`}>20</span>
                      Dealership Information
                    </div>
                    <p className={`text-[11px] mt-1 font-medium ${interactiveStep === 20 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      Storefront profile, opening hours, directions & socials
                    </p>
                  </button>
                </div>
              </div>

              {/* Detailed Breakdown for the active step */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#84cc00]" />
                  UX Specifications For Screen {interactiveStep}
                </h4>

                {interactiveStep === 17 && (
                  <div className="space-y-2 text-xs text-zinc-600">
                    <p><strong>1. Buyer Decision Architecture:</strong> High-impact vehicle imagery, prominent pricing ($28,500), inventory badge, and technical specs (Diesel, Auto, 4x4, 62k km).</p>
                    <p><strong>2. WhatsApp Commerce:</strong> Fast dealer connection via <code>CALL DEALER</code> and primary electric lime <code>CHAT ON WHATSAPP</code> button.</p>
                  </div>
                )}

                {interactiveStep === 18 && (
                  <div className="space-y-2 text-xs text-zinc-600">
                    <p><strong>1. Dealership Grade Imagery:</strong> Exterior rear hero shot followed by 6 responsive sub-angles (dashboard, leather seats, grille, side, rear, engine).</p>
                    <p><strong>2. Inquire CTA:</strong> Persistent bottom action to immediately open WhatsApp dialog with vehicle reference ID.</p>
                  </div>
                )}

                {interactiveStep === 19 && (
                  <div className="space-y-2 text-xs text-zinc-600">
                    <p><strong>1. Social Proof Engine:</strong> Aggregated 4.8 / 5.0 score with weighted star frequency distribution bars.</p>
                    <p><strong>2. Verified Testimonials:</strong> Chronological buyer feedback detailing vehicle condition, dealer professionalism, and delivery speed.</p>
                  </div>
                )}

                {interactiveStep === 20 && (
                  <div className="space-y-2 text-xs text-zinc-600">
                    <p><strong>1. Dealership Credibility:</strong> Showroom photography, verified dealer checkmark, physical Bulawayo address, and operating hours.</p>
                    <p><strong>2. Multi-Channel Contact:</strong> Direct navigation route generation, telephone/WhatsApp hotline, and verified social media handles.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* 4. TAB 3: DESIGN TOKENS & AUTOMOTIVE SPECS */}
      {activeTab === 'specs' && (
        <main className="py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-black tracking-tight">
              Design Tokens & Automotive Architecture
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Standardized variables for the ThreadZW vehicle marketplace ecosystem.
            </p>
          </div>

          {/* Color Palette Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-black uppercase tracking-wider">
              Color Palette
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <div 
                onClick={() => copyColor('#C6FF00', 'Lime Accent')}
                className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-full h-16 rounded-xl bg-[#C6FF00] mb-3 flex items-center justify-center font-mono font-black text-black text-xs shadow-inner">
                  #C6FF00
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-black">Electric Lime</h4>
                    <p className="text-[10px] text-zinc-500">Primary CTA & Badges</p>
                  </div>
                  <Copy size={12} className="text-zinc-400 group-hover:text-black" />
                </div>
              </div>

              <div 
                onClick={() => copyColor('#000000', 'Pure Black')}
                className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-full h-16 rounded-xl bg-black mb-3 flex items-center justify-center font-mono font-black text-white text-xs">
                  #000000
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-black">Pure Black</h4>
                    <p className="text-[10px] text-zinc-500">Headings & Primary Text</p>
                  </div>
                  <Copy size={12} className="text-zinc-400 group-hover:text-black" />
                </div>
              </div>

              <div 
                onClick={() => copyColor('#FFFFFF', 'Pure White')}
                className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-full h-16 rounded-xl bg-white border border-zinc-200 mb-3 flex items-center justify-center font-mono font-black text-zinc-700 text-xs">
                  #FFFFFF
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-black">Pure White</h4>
                    <p className="text-[10px] text-zinc-500">Canvas & Card Surface</p>
                  </div>
                  <Copy size={12} className="text-zinc-400 group-hover:text-black" />
                </div>
              </div>

              <div 
                onClick={() => copyColor('#E4E4E7', 'Zinc Border')}
                className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-full h-16 rounded-xl bg-[#E4E4E7] mb-3 flex items-center justify-center font-mono font-black text-zinc-700 text-xs">
                  #E4E4E7
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-black">Zinc Border</h4>
                    <p className="text-[10px] text-zinc-500">Subtle Card Dividers</p>
                  </div>
                  <Copy size={12} className="text-zinc-400 group-hover:text-black" />
                </div>
              </div>

            </div>
          </div>

          {/* Typography & Spacing Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-black text-black uppercase tracking-wider">
                Typography Hierarchy
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-baseline border-b border-zinc-100 pb-1.5">
                  <span className="font-black text-lg">Toyota Hilux 2022</span>
                  <span className="font-mono text-zinc-400 text-[10px]">18px / 800 (Title)</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-zinc-100 pb-1.5">
                  <span className="font-extrabold text-sm">$28,500</span>
                  <span className="font-mono text-zinc-400 text-[10px]">14px / 800 (Price)</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-zinc-100 pb-1.5">
                  <span className="font-bold text-xs uppercase tracking-wider">CHAT ON WHATSAPP</span>
                  <span className="font-mono text-zinc-400 text-[10px]">11px / 900 (CTA)</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-zinc-600 text-xs">Diesel • Automatic • 4x4</span>
                  <span className="font-mono text-zinc-400 text-[10px]">10px / 600 (Specs)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-black text-black uppercase tracking-wider">
                Automotive Guidelines
              </h4>
              <ul className="space-y-2 text-xs text-zinc-600">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-[#84cc00] mt-0.5 shrink-0" />
                  <span><strong>Visual Transparency:</strong> Show multi-angle photography, odometer readouts, and service history disclosure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-[#84cc00] mt-0.5 shrink-0" />
                  <span><strong>Zero Friction Inquiries:</strong> Dual action buttons for phone calls and direct WhatsApp messaging with prefilled vehicle details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-[#84cc00] mt-0.5 shrink-0" />
                  <span><strong>Social Proof:</strong> Star ratings, review breakdown charts, and verified customer testimonials.</span>
                </li>
              </ul>
            </div>
          </div>

        </main>
      )}

    </div>
  );
};
