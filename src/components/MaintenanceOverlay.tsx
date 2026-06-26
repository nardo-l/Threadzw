import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface MaintenanceOverlayProps {
  onUnlock?: () => void;
}

const TrafficConeSVG = () => (
  <svg viewBox="0 0 120 120" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Base of the cone */}
    <path d="M20 95C20 92.24 22.24 90 25 90H95C97.76 90 100 92.24 100 95V97C100 99.76 97.76 102 95 102H25C22.24 102 20 99.76 20 97V95Z" fill="#121214" stroke="#C6FF00" strokeWidth="2" />
    <path d="M28 94H92" stroke="#C6FF00" strokeWidth="4" strokeLinecap="round" />
    {/* Body of the cone */}
    <path d="M46 90L53.5 24C53.75 21.5 55.8 19.5 58.4 19.5H61.6C64.2 19.5 66.25 21.5 66.5 24L74 90H46Z" fill="#121214" stroke="#C6FF00" strokeWidth="2.5" strokeLinejoin="round" />
    {/* White reflective stripes on the body */}
    <path d="M49.5 55H70.5L71.8 66H48.2L49.5 55Z" fill="#FFFFFF" opacity="0.95" />
    <path d="M51.8 32H68.2L69.1 41H50.9L51.8 32Z" fill="#FFFFFF" opacity="0.95" />
    {/* Neon accent stripes */}
    <path d="M47.2 78H72.8L73.5 84H46.5L47.2 78Z" fill="#C6FF00" />
  </svg>
);

export function MaintenanceOverlay({ onUnlock }: MaintenanceOverlayProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem('threadzw_admin_unlocked') === 'true';
  });

  // Prevent scrolling when locked
  useEffect(() => {
    if (!isUnlocked) {
      document.body.style.overflow = 'hidden';
      // Fallback: apply pointer-events none to a parent wrap if needed,
      // but standard fixed overlay with high z-index is perfect.
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isUnlocked]);

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.trim();
    
    // Check custom environment variable with fallback to simply_nardoe
    const correctPassword = import.meta.env.VITE_ADMIN_MAINTENANCE_PASSWORD || 'simply_nardoe';

    if (cleanPassword === correctPassword) {
      localStorage.setItem('threadzw_admin_unlocked', 'true');
      setIsUnlocked(true);
      setError('');
      if (onUnlock) onUnlock();
    } else {
      setError('Incorrect password.');
    }
  };

  if (isUnlocked) {
    return null;
  }

  return (
    <div id="maintenance-overlay" className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-xl overflow-y-auto p-4 md:p-6 select-none">
      <div className="w-full max-w-xl my-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center text-center space-y-6"
        >
          {/* Header traffic cone icon with glowing neon border */}
          <div className="relative p-1 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-[0_0_25px_rgba(198,255,0,0.15)] flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl border border-[#C6FF00]/40 opacity-70 animate-pulse"></div>
            <div className="p-3 bg-zinc-950/90 rounded-xl flex items-center justify-center">
              <TrafficConeSVG />
            </div>
          </div>

          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300">
            <span>🛠️</span>
            <span>We're making ThreadZW even better</span>
          </div>

          {/* Headline Display Typography */}
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Big updates.
            </h1>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Better experience.
            </h1>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#C6FF00] leading-tight relative inline-block">
              Coming soon.
              <span className="absolute bottom-1 left-0 w-full h-[3px] bg-[#C6FF00] rounded-full"></span>
            </h1>
          </div>

          {/* Subheading */}
          <p className="text-sm md:text-base text-zinc-400 font-medium max-w-md leading-relaxed px-2">
            We're fixing bugs, improving performance, and adding new features to give every Zimbabwean fashion business the best experience possible.
          </p>

          {/* Highlighted Temporary Maintenance Card */}
          <div className="w-full bg-zinc-950/50 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 md:p-6 text-left space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm uppercase tracking-wider pl-1">
              <span>🚧</span>
              <span>Temporary Maintenance</span>
            </div>
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed pl-1">
              ThreadZW is temporarily unavailable while we polish the platform. We're working hard to make your experience seamless and will be back soon.
            </p>
          </div>

          {/* Stay Updated / WhatsApp Card with glassmorphism */}
          <div className="w-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 md:p-6 text-left space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-[#C6FF00]">🔔</span> Stay Updated
              </h3>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                Follow our official WhatsApp Channel to receive launch updates, new features, and be the first to know when ThreadZW is back online.
              </p>
            </div>

            <a 
              href="https://whatsapp.com/channel/0029VbChKRgHQbRwhpTyMj3Q"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2.5 w-full bg-[#C6FF00] hover:bg-[#b0e500] text-zinc-950 font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(198,255,0,0.25)] hover:shadow-[0_4px_25px_rgba(198,255,0,0.4)]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.198 1.451 4.82 1.452 5.482 0 9.944-4.461 9.947-9.948a9.856 9.856 0 00-2.92-7.073 9.85 9.85 0 00-7.051-2.915c-5.488 0-9.949 4.463-9.952 9.953-.001 1.761.47 3.479 1.365 4.975l-1.01 3.69 3.799-.984zM16.14 13.62c-.3-.15-1.774-.875-2.049-.975s-.475-.15-.675.15-.775.975-.95 1.175-.35.225-.65.075c-.3-.15-1.267-.467-2.413-1.491-.892-.796-1.494-1.78-1.669-2.08-.175-.3-.018-.463.132-.612.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5s.05-.375-.025-.525-.675-1.625-.925-2.225c-.244-.589-.491-.51-.675-.52-.174-.01-.374-.012-.574-.012s-.525.075-.8.375c-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.11 4.524.714.31 1.27.494 1.705.633.718.227 1.37.195 1.887.118.575-.085 1.775-.725 2.025-1.425s.25-1.3.175-1.425c-.075-.125-.275-.2-.575-.35z"/>
              </svg>
              <span>Follow WhatsApp Channel</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <div className="text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                Click to open in WhatsApp
              </span>
            </div>
          </div>

          {/* Subtle Divider & Admin Access Form */}
          <div className="w-full space-y-4 pt-2">
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] flex-1 bg-zinc-800"></div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Admin Access
              </span>
              <div className="h-[1px] flex-1 bg-zinc-800"></div>
            </div>

            <form onSubmit={handleAccess} className="flex gap-2 max-w-sm mx-auto w-full">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#C6FF00]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                className="bg-zinc-950 border border-[#C6FF00] hover:bg-[#C6FF00] text-[#C6FF00] hover:text-zinc-950 font-bold px-5 py-3 rounded-xl text-sm transition-all duration-300"
              >
                Access
              </button>
            </form>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-1.5 text-xs text-rose-500 font-bold"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <p className="text-[11px] text-zinc-500 text-center font-medium">
              Admin access is restricted.
            </p>
          </div>

          {/* Bottom Patience Card */}
          <div className="w-full max-w-sm bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-4 flex items-center gap-3 text-left">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-400 font-bold leading-tight">
                Thanks for your patience and support.
              </p>
              <p className="text-[11px] text-emerald-400/90 font-semibold mt-0.5">
                Something amazing is on the way! 💚
              </p>
            </div>
          </div>

          {/* Footer copyright */}
          <span className="text-[10px] text-zinc-600 font-medium tracking-wider uppercase pt-2">
            © {new Date().getFullYear()} ThreadZW. All rights reserved.
          </span>
        </motion.div>
      </div>
    </div>
  );
}
