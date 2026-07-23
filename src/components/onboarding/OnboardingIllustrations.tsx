import React from 'react';

// 3D Floating Storefront Illustration for Screen 1
export const Storefront3DIllustration: React.FC = () => (
  <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
    {/* Soft Ambient Shadow & Glow */}
    <div className="absolute bottom-1 w-52 h-10 bg-[#C6FF00]/15 blur-2xl rounded-full" />
    
    <svg viewBox="0 0 320 260" className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]">
      <defs>
        <linearGradient id="awningLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D2FF00" />
          <stop offset="100%" stopColor="#A0DB00" />
        </linearGradient>
        <linearGradient id="darkFacadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1C1C20" />
          <stop offset="100%" stopColor="#0A0A0C" />
        </linearGradient>
      </defs>

      {/* Floating 3D Cubes (Animated) */}
      <g className="animate-pulse" style={{ animationDuration: '3.5s' }}>
        {/* Top-left floating cube */}
        <polygon points="48,58 64,49 80,58 64,67" fill="#D2FF00" />
        <polygon points="48,58 64,67 64,83 48,74" fill="#A0DB00" />
        <polygon points="64,67 80,58 80,74 64,83" fill="#7AA800" />
      </g>

      <g className="animate-pulse" style={{ animationDuration: '4.5s' }}>
        {/* Bottom-right floating cube */}
        <polygon points="252,148 268,139 284,148 268,157" fill="#D2FF00" />
        <polygon points="252,148 268,157 268,173 252,164" fill="#A0DB00" />
        <polygon points="268,157 284,148 284,164 268,173" fill="#7AA800" />
      </g>

      <g className="animate-pulse" style={{ animationDuration: '5s' }}>
        {/* Small top-right roof cube */}
        <polygon points="220,50 232,43 244,50 232,57" fill="#2A2A30" />
        <polygon points="220,50 232,57 232,69 220,62" fill="#18181C" />
        <polygon points="232,57 244,50 244,62 232,69" fill="#121215" />
      </g>

      {/* Isometric Base Stand */}
      <polygon points="160,205 270,162 160,119 50,162" fill="#18181C" />
      <polygon points="50,162 160,205 160,222 50,179" fill="#0A0A0D" />
      <polygon points="160,205 270,162 270,179 160,222" fill="#121215" />

      {/* Middle Base Step */}
      <polygon points="160,192 250,157 160,122 70,157" fill="#222228" />
      <polygon points="70,157 160,192 160,202 70,167" fill="#0E0E12" />
      <polygon points="160,192 250,157 250,167 160,202" fill="#16161A" />

      {/* Main Black Storefront Building */}
      <polygon points="160,172 235,142 160,112 85,142" fill="#282830" />
      <polygon points="85,142 160,172 160,105 85,75" fill="url(#darkFacadeGrad)" />
      <polygon points="160,172 235,142 235,75 160,105" fill="#1A1A20" />

      {/* Glowing Store Window / Doorway */}
      <polygon points="102,135 150,154 150,112 102,93" fill="#08080A" />
      <polygon points="106,133 146,149 146,114 106,98" fill="#C6FF00" opacity="0.18" />
      <polygon points="112,130 142,142 142,118 112,106" fill="#C6FF00" opacity="0.35" />

      {/* 3D Awning (Neon Green & Black Stripes) */}
      <polygon points="75,85 160,118 245,85 160,52" fill="url(#awningLimeGrad)" />
      
      {/* Dark Awning Stripes */}
      <polygon points="75,85 96,93 117,68 96,60" fill="#121216" />
      <polygon points="117,101 138,109 159,84 138,76" fill="#121216" />
      <polygon points="159,118 180,110 201,85 180,93" fill="#121216" />
      <polygon points="201,102 222,94 243,69 222,77" fill="#121216" />

      {/* Awning Front Drop */}
      <polygon points="75,85 160,118 160,127 75,94" fill="#A0DB00" />
      <polygon points="160,118 245,85 245,94 160,127" fill="#7AA800" />
    </svg>
  </div>
);

// 3D Floating Shop Sign Illustration for Screen 2
export const ShopSign3DIllustration: React.FC<{ shopName?: string }> = ({ shopName }) => {
  const displayName = (shopName && shopName.trim().length > 0) 
    ? shopName.trim().toUpperCase() 
    : 'NULLA';

  return (
    <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
      {/* Soft Ambient Glow */}
      <div className="absolute bottom-2 w-48 h-8 bg-[#C6FF00]/15 blur-2xl rounded-full" />

      <svg viewBox="0 0 320 250" className="w-full h-full drop-shadow-[0_22px_40px_rgba(0,0,0,0.95)]">
        {/* Hanging Chains */}
        <line x1="95" y1="0" x2="95" y2="55" stroke="#3F3F46" strokeWidth="4" strokeDasharray="5,4" />
        <line x1="225" y1="0" x2="225" y2="55" stroke="#3F3F46" strokeWidth="4" strokeDasharray="5,4" />
        <circle cx="95" cy="55" r="7" fill="#18181B" stroke="#52525B" strokeWidth="2.5" />
        <circle cx="225" cy="55" r="7" fill="#18181B" stroke="#52525B" strokeWidth="2.5" />

        {/* 3D Sign Board Back Extrusion */}
        <rect x="46" y="58" width="228" height="138" rx="22" fill="#0A0A0C" />
        <rect x="42" y="54" width="228" height="138" rx="22" fill="#16161A" stroke="#27272A" strokeWidth="2.5" />

        {/* Inner Bevel Plate */}
        <rect x="52" y="64" width="208" height="118" rx="16" fill="#0E0E11" />

        {/* 3D Neon Lime Text */}
        <text 
          x="156" 
          y="142" 
          textAnchor="middle" 
          fill="#C6FF00" 
          fontSize={displayName.length > 8 ? '28' : '44'} 
          fontWeight="900" 
          fontFamily="sans-serif"
          letterSpacing="2"
          style={{ 
            filter: 'drop-shadow(2px 4px 0px #638500)',
            textTransform: 'uppercase'
          }}
        >
          {displayName.length > 12 ? displayName.substring(0, 10) + '...' : displayName}
        </text>

        {/* Floating Edit Pencil Badge (Bottom-Right) */}
        <g transform="translate(228, 150)">
          <circle cx="22" cy="22" r="23" fill="#000000" />
          <circle cx="22" cy="22" r="21" fill="#141418" stroke="#3F3F46" strokeWidth="2" />
          {/* Pencil Icon */}
          <path d="M14 27L26 15L28 17L16 29L13 30L14 27Z" fill="#C6FF00" />
          <path d="M24 13L27 16" stroke="#C6FF00" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

// 3D Floating Social Icons Orbit Illustration for Screen 3
export const SocialOrbit3DIllustration: React.FC = () => (
  <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
    {/* Soft Ambient Glow */}
    <div className="absolute inset-0 m-auto w-44 h-44 bg-[#C6FF00]/10 blur-3xl rounded-full" />

    <svg viewBox="0 0 320 250" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="igGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>

      {/* Orbit Rings (Dotted Ellipses) */}
      <ellipse cx="160" cy="125" rx="135" ry="72" fill="none" stroke="#27272A" strokeWidth="2" strokeDasharray="5 7" />

      {/* Orbit Particles */}
      <circle cx="30" cy="125" r="4.5" fill="#C6FF00" />
      <circle cx="290" cy="125" r="4.5" fill="#C6FF00" />
      <circle cx="235" cy="62" r="3" fill="#C6FF00" opacity="0.8" />

      {/* 1. Instagram Badge (Top Left) */}
      <g transform="translate(55, 30)">
        <rect x="0" y="0" width="58" height="58" rx="18" fill="url(#igGrad2)" />
        <rect x="13" y="13" width="32" height="32" rx="10" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />
        <circle cx="29" cy="29" r="8" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />
        <circle cx="37" cy="21" r="2.5" fill="#FFFFFF" />
      </g>

      {/* 2. TikTok Badge (Top Right) */}
      <g transform="translate(200, 25)">
        <rect x="0" y="0" width="54" height="54" rx="16" fill="#141418" stroke="#27272A" strokeWidth="2" />
        {/* TikTok Musical Note */}
        <path d="M31 16C33 19 36 20 39 20V25C36 25 34 24 31 22V32C31 37 27 40 22 40C17 40 14 36 14 32C14 27 18 23 23 23V28C21 28 19 30 19 32C19 34 21 35 23 35C25 35 26 34 26 31V16H31Z" fill="#25F4EE" />
        <path d="M29 18C31 21 34 22 37 22V23C34 23 32 22 29 20V30C29 35 25 38 20 38C15 38 12 34 12 30C12 25 16 21 21 21V23C19 23 17 25 17 27C17 29 19 30 21 30C23 30 24 29 24 26V18H29Z" fill="#FE2C55" />
      </g>

      {/* 3. WhatsApp Badge (Bottom Right) */}
      <g transform="translate(195, 140)">
        <rect x="0" y="0" width="56" height="56" rx="18" fill="#25D366" />
        <path d="M28 14C20.3 14 14 20.3 14 28C14 30.8 14.8 33.4 16.2 35.5L14.5 41.5L20.8 39.8C22.9 41.1 25.4 42 28 42C35.7 42 42 35.7 42 28C42 20.3 35.7 14 28 14ZM34.7 33.6C34.4 34.4 33.2 35.1 32.3 35.2C31.7 35.3 30.9 35.4 28 34.2C24.3 32.7 21.9 28.9 21.7 28.6C21.5 28.4 20 26.4 20 24.3C20 22.2 21.1 21.2 21.5 20.7C21.8 20.4 22.3 20.3 22.8 20.3C23 20.3 23.2 20.3 23.4 20.3C23.9 20.3 24.1 20.4 24.4 21C24.7 21.8 25.4 23.6 25.5 23.8C25.6 24 25.6 24.2 25.5 24.4C25.4 24.6 25.3 24.8 25.1 25C24.9 25.2 24.7 25.4 24.5 25.7C24.3 25.9 24.1 26.1 24.3 26.5C24.5 26.9 25.3 28.2 26.5 29.2C28 30.5 29.2 30.9 29.6 31.1C30 31.3 30.2 31.2 30.4 31C30.7 30.7 31.5 29.7 31.8 29.2C32.1 28.7 32.4 28.8 32.8 28.9C33.2 29 35.5 30.1 35.9 30.3C36.3 30.5 36.6 30.6 36.7 30.8C36.8 31.1 36.8 32.3 34.7 33.6Z" fill="#FFFFFF" />
      </g>

      {/* 4. Friend/Referral Badge (Bottom Left) */}
      <g transform="translate(65, 142)">
        <rect x="0" y="0" width="50" height="50" rx="16" fill="#141418" stroke="#27272A" strokeWidth="2" />
        <circle cx="25" cy="20" r="7.5" fill="#E4E4E7" />
        <path d="M13 37C13 31 18.5 29 25 29C31.5 29 37 31 37 37" fill="#E4E4E7" />
      </g>
    </svg>
  </div>
);

// 3D Floating Product Catalog Illustration for Screen 4
export const ProductCatalog3DIllustration: React.FC = () => (
  <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
    {/* Soft Ambient Glow */}
    <div className="absolute inset-0 m-auto w-48 h-32 bg-[#C6FF00]/10 blur-3xl rounded-full" />

    <svg viewBox="0 0 320 250" className="w-full h-full drop-shadow-2xl">
      {/* Dark Platforms */}
      <polygon points="160,195 240,160 160,125 80,160" fill="#121215" stroke="#222226" strokeWidth="1.5" />
      <polygon points="80,160 160,195 160,205 80,170" fill="#0A0A0C" />
      <polygon points="160,195 240,160 240,170 160,205" fill="#15151A" />

      {/* Floating Hoodie (Center) */}
      <g transform="translate(115, 45)">
        <path d="M45 15 C35 5, 55 5, 45 15 Z" fill="#18181C" />
        <path d="M20 20 L45 10 L70 20 L80 40 L68 45 L65 85 L25 85 L22 45 L10 40 Z" fill="#1C1C22" stroke="#2D2D35" strokeWidth="2" />
        <path d="M35 45 L55 45 L52 75 L38 75 Z" fill="#121215" stroke="#222226" strokeWidth="1" />
        {/* Drawstrings with neon tips */}
        <line x1="40" y1="20" x2="38" y2="35" stroke="#C6FF00" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="20" x2="52" y2="35" stroke="#C6FF00" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Floating Sneaker (Top-Left) */}
      <g transform="translate(35, 30)">
        <path d="M10 35 Q 25 15, 55 20 Q 65 30, 70 38 L 10 38 Z" fill="#18181C" stroke="#2A2A30" strokeWidth="2" />
        <path d="M10 38 L 70 38 L 68 45 L 8 45 Z" fill="#FFFFFF" />
        <line x1="28" y1="25" x2="48" y2="22" stroke="#C6FF00" strokeWidth="3" strokeLinecap="round" />
        <path d="M25 28 C 35 24, 45 28, 55 35" fill="none" stroke="#C6FF00" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Floating Cap (Top-Right) */}
      <g transform="translate(205, 35)">
        <path d="M15 30 C 15 12, 45 12, 45 30 Z" fill="#18181C" stroke="#2A2A30" strokeWidth="2" />
        <path d="M10 30 Q 30 33, 55 32 L 45 38 Q 20 38, 5 35 Z" fill="#C6FF00" />
      </g>

      {/* Floating Chain (Mid-Left) */}
      <g transform="translate(45, 100)">
        <path d="M10 10 Q 30 45, 50 10" fill="none" stroke="#D4D4D8" strokeWidth="3" strokeDasharray="4 3" />
        <polygon points="30,35 38,47 22,47" fill="#E4E4E7" stroke="#FFFFFF" strokeWidth="1" />
      </g>

      {/* Floating Perfume Bottle (Mid-Right) */}
      <g transform="translate(210, 95)">
        <rect x="12" y="18" width="32" height="42" rx="6" fill="#141418" stroke="#3F3F46" strokeWidth="2" />
        <rect x="22" y="8" width="12" height="10" rx="2" fill="#C6FF00" />
        <rect x="18" y="30" width="20" height="18" fill="#09090B" />
        <text x="28" y="42" textAnchor="middle" fill="#E4E4E7" fontSize="7" fontWeight="bold">NOIR</text>
      </g>

      {/* Folded Shirts (Bottom-Right) */}
      <g transform="translate(150, 140)">
        <rect x="10" y="10" width="50" height="12" rx="3" fill="#C6FF00" />
        <rect x="10" y="20" width="50" height="12" rx="3" fill="#1E1E24" stroke="#2A2A32" strokeWidth="1.5" />
      </g>
    </svg>
  </div>
);

// 3D Floating Safe Vault Illustration for Screen 5
export const SafeVault3DIllustration: React.FC = () => (
  <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
    {/* Soft Ambient Glow */}
    <div className="absolute inset-0 m-auto w-48 h-32 bg-[#C6FF00]/15 blur-3xl rounded-full" />

    <svg viewBox="0 0 320 250" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
      {/* Base Platform */}
      <polygon points="160,205 250,170 160,135 70,170" fill="#141418" />
      <polygon points="70,170 160,205 160,215 70,180" fill="#0A0A0C" />
      <polygon points="160,205 250,170 250,180 160,215" fill="#18181D" />

      {/* 3D Safe Body */}
      <rect x="90" y="60" width="140" height="120" rx="20" fill="#18181C" stroke="#27272A" strokeWidth="3" />
      <rect x="102" y="72" width="116" height="96" rx="14" fill="#0E0E11" />

      {/* Combination Dial Outer */}
      <circle cx="160" cy="120" r="32" fill="#1A1A20" stroke="#3F3F46" strokeWidth="4" />
      <circle cx="160" cy="120" r="24" fill="#0A0A0C" stroke="#C6FF00" strokeWidth="3" />

      {/* Dial Spokes */}
      <line x1="160" y1="102" x2="160" y2="108" stroke="#C6FF00" strokeWidth="3" strokeLinecap="round" />
      <line x1="160" y1="132" x2="160" y2="138" stroke="#C6FF00" strokeWidth="3" strokeLinecap="round" />
      <line x1="142" y1="120" x2="148" y2="120" stroke="#C6FF00" strokeWidth="3" strokeLinecap="round" />
      <line x1="172" y1="120" x2="178" y2="120" stroke="#C6FF00" strokeWidth="3" strokeLinecap="round" />

      {/* Safe Door Handle */}
      <circle cx="160" cy="120" r="8" fill="#C6FF00" />

      {/* Floating Shield Lock Badge (Front Right) */}
      <g transform="translate(205, 105)">
        {/* Shield Outer */}
        <path d="M30 5 L55 15 C55 38, 30 50, 30 50 C30 50, 5 38, 5 15 Z" fill="#18181C" stroke="#C6FF00" strokeWidth="3" />
        {/* Lock Icon */}
        <rect x="20" y="25" width="20" height="15" rx="3" fill="#C6FF00" />
        <path d="M24 25 V20 C24 16.5, 36 16.5, 36 20 V25" fill="none" stroke="#C6FF00" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  </div>
);

// 3D Floating Mail Account Illustration for Screen 6
export const MailAccount3DIllustration: React.FC = () => (
  <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
    {/* Soft Ambient Glow */}
    <div className="absolute inset-0 m-auto w-48 h-32 bg-[#C6FF00]/15 blur-3xl rounded-full" />

    <svg viewBox="0 0 320 250" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
      {/* Envelope Back Body */}
      <rect x="60" y="65" width="200" height="135" rx="20" fill="#121215" stroke="#27272A" strokeWidth="3" />

      {/* Floating Letter with Neon @ Symbol */}
      <g transform="translate(90, 35)">
        <rect x="0" y="0" width="140" height="100" rx="14" fill="#1C1C22" stroke="#3F3F46" strokeWidth="2" />
        {/* @ Sign */}
        <text x="70" y="68" textAnchor="middle" fill="#C6FF00" fontSize="52" fontWeight="900" fontFamily="sans-serif">@</text>
      </g>

      {/* Envelope Flap Fold Overlay */}
      <path d="M60 85 L160 150 L260 85" fill="none" stroke="#2A2A32" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 195 L130 135" stroke="#222228" strokeWidth="3" />
      <path d="M260 195 L190 135" stroke="#222228" strokeWidth="3" />

      {/* Floating Shield Badge with Checkmark */}
      <g transform="translate(205, 115)">
        <path d="M30 5 L55 15 C55 38, 30 50, 30 50 C30 50, 5 38, 5 15 Z" fill="#141418" stroke="#C6FF00" strokeWidth="3" />
        {/* Checkmark */}
        <path d="M19 26 L27 34 L41 18" fill="none" stroke="#C6FF00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  </div>
);

// 3D Floating Hoodie surrounded by Fashion Icons Illustration for Screen 8
export const HoodieFashion3DIllustration: React.FC = () => (
  <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
    {/* Soft Ambient Glow */}
    <div className="absolute inset-0 m-auto w-48 h-32 bg-[#C6FF00]/15 blur-3xl rounded-full" />

    <svg viewBox="0 0 320 250" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
      {/* Dark Isometric Base */}
      <polygon points="160,205 250,170 160,135 70,170" fill="#141418" stroke="#222228" strokeWidth="1.5" />
      <polygon points="70,170 160,205 160,215 70,180" fill="#0A0A0C" />
      <polygon points="160,205 250,170 250,180 160,215" fill="#18181D" />

      {/* Center 3D Dark Hoodie */}
      <g transform="translate(115, 38)">
        <path d="M45 15 C35 5, 55 5, 45 15 Z" fill="#18181C" />
        <path d="M20 20 L45 10 L70 20 L82 42 L68 46 L65 90 L25 90 L22 46 L8 42 Z" fill="#1C1C22" stroke="#2D2D35" strokeWidth="2.5" />
        <path d="M35 48 L55 48 L52 80 L38 80 Z" fill="#121215" stroke="#222226" strokeWidth="1" />
        <rect x="42" y="30" width="6" height="4" rx="1" fill="#C6FF00" />
        {/* Drawstrings with neon tips */}
        <line x1="40" y1="20" x2="38" y2="38" stroke="#C6FF00" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="20" x2="52" y2="38" stroke="#C6FF00" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Floating Fashion Icon Badge 1 (Smiley / Streetwear - Top Left) */}
      <g transform="translate(38, 25)">
        <rect x="0" y="0" width="46" height="46" rx="14" fill="#141418" stroke="#27272A" strokeWidth="2" />
        <circle cx="23" cy="23" r="12" fill="none" stroke="#C6FF00" strokeWidth="2.5" />
        <circle cx="18" cy="19" r="2" fill="#C6FF00" />
        <circle cx="28" cy="19" r="2" fill="#C6FF00" />
        <path d="M17 26 Q 23 32, 29 26" fill="none" stroke="#C6FF00" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Floating Fashion Icon Badge 2 (Diamond - Top Right) */}
      <g transform="translate(235, 30)">
        <rect x="0" y="0" width="44" height="44" rx="14" fill="#141418" stroke="#27272A" strokeWidth="2" />
        <polygon points="22,12 32,20 22,32 12,20" fill="none" stroke="#C6FF00" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="12" y1="20" x2="32" y2="20" stroke="#C6FF00" strokeWidth="1.5" />
      </g>

      {/* Floating Cap Badge (Mid-Left) */}
      <g transform="translate(30, 95)">
        <rect x="0" y="0" width="42" height="42" rx="12" fill="#141418" stroke="#27272A" strokeWidth="2" />
        <path d="M12 25 C 12 15, 30 15, 30 25 Z" fill="#1C1C22" stroke="#3F3F46" strokeWidth="1.5" />
        <path d="M8 25 Q 21 28, 34 26 L 28 30 Q 14 30, 4 28 Z" fill="#C6FF00" />
      </g>

      {/* Floating Sneaker Badge (Mid-Right) */}
      <g transform="translate(245, 95)">
        <rect x="0" y="0" width="44" height="44" rx="12" fill="#141418" stroke="#27272A" strokeWidth="2" />
        <path d="M10 26 Q 18 16, 34 20 Q 38 25, 38 28 L 10 28 Z" fill="#1C1C22" stroke="#3F3F46" strokeWidth="1.5" />
        <path d="M10 28 L 38 28 L 36 32 L 8 32 Z" fill="#FFFFFF" />
        <line x1="20" y1="20" x2="30" y2="18" stroke="#C6FF00" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Floating Bag Badge (Bottom Left) */}
      <g transform="translate(60, 155)">
        <rect x="0" y="0" width="40" height="40" rx="12" fill="#141418" stroke="#27272A" strokeWidth="2" />
        <rect x="11" y="16" width="18" height="16" rx="3" fill="none" stroke="#C6FF00" strokeWidth="2" />
        <path d="M15 16 V12 C15 9.5, 25 9.5, 25 12 V16" fill="none" stroke="#C6FF00" strokeWidth="2" />
      </g>

      {/* Floating Sparkle Badge (Bottom Right) */}
      <g transform="translate(215, 155)">
        <rect x="0" y="0" width="40" height="40" rx="12" fill="#141418" stroke="#27272A" strokeWidth="2" />
        <path d="M20 10 Q 20 20, 30 20 Q 20 20, 20 30 Q 20 20, 10 20 Q 20 20, 20 10 Z" fill="#C6FF00" />
      </g>
    </svg>
  </div>
);

// 3D Floating Zimbabwe Map with Glowing Location Pin Illustration for Screen 9
export const ZimbabweMap3DIllustration: React.FC = () => (
  <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
    {/* Soft Ambient Glow under Map */}
    <div className="absolute inset-0 m-auto w-48 h-36 bg-[#C6FF00]/15 blur-3xl rounded-full" />

    <svg viewBox="0 0 320 250" className="w-full h-full drop-shadow-[0_25px_40px_rgba(0,0,0,0.95)]">
      {/* 3D Map Base Plate (Isometric Zimbabwe Contour Silhouette) */}
      <g transform="translate(45, 40)">
        {/* Bottom Shadow Plate */}
        <path 
          d="M70 15 L140 10 L190 40 L210 90 L180 140 L120 155 L60 145 L20 100 L25 50 Z" 
          fill="#0A0A0D" 
          transform="translate(0, 18)"
        />
        {/* Side Extrusion Edge */}
        <path 
          d="M20 100 L60 145 L120 155 L180 140 L210 90 L210 105 L180 155 L120 170 L60 160 L20 115 Z" 
          fill="#16161B" 
        />
        {/* Top Metallic Map Surface */}
        <path 
          d="M70 15 L140 10 L190 40 L210 90 L180 140 L120 155 L60 145 L20 100 L25 50 Z" 
          fill="#1A1A22" 
          stroke="#2C2C36" 
          strokeWidth="2" 
        />

        {/* Map Grid / Province Borders */}
        <path d="M70 15 L120 80 L180 140" stroke="#252530" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M140 10 L120 80 L60 145" stroke="#252530" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M25 50 L120 80 L210 90" stroke="#252530" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Pulsating Target Rings around Pin Location */}
        <ellipse cx="115" cy="85" rx="35" ry="18" fill="none" stroke="#C6FF00" strokeWidth="1" opacity="0.3" />
        <ellipse cx="115" cy="85" rx="22" ry="11" fill="none" stroke="#C6FF00" strokeWidth="1.5" opacity="0.6" />
        <ellipse cx="115" cy="85" rx="10" ry="5" fill="#C6FF00" opacity="0.8" />

        {/* 3D Glowing Neon Location Pin */}
        <g transform="translate(115, 85)">
          {/* Pin Shadow */}
          <ellipse cx="0" cy="2" rx="8" ry="4" fill="#000000" opacity="0.8" />
          
          {/* Pin Stem and Head */}
          <g transform="translate(0, -42)">
            {/* 3D Pin Body */}
            <path 
              d="M0 0 C-16 -16, -16 -34, 0 -34 C16 -34, 16 -16, 0 0 Z" 
              fill="#C6FF00" 
              style={{ filter: 'drop-shadow(0 0 12px rgba(198,255,0,0.6))' }}
            />
            {/* Inner Pin Dot */}
            <circle cx="0" cy="-20" r="6" fill="#000000" />
          </g>
        </g>
      </g>
    </svg>
  </div>
);

// 3D Floating Logo Card with Upload Icon Illustration for Screen 10
export const LogoUpload3DIllustration: React.FC = () => (
  <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
    {/* Soft Ambient Glow */}
    <div className="absolute inset-0 m-auto w-48 h-32 bg-[#C6FF00]/15 blur-3xl rounded-full" />

    <svg viewBox="0 0 320 250" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
      {/* Floating 3D Cubes */}
      <g className="animate-pulse" style={{ animationDuration: '3s' }}>
        <polygon points="40,70 54,62 68,70 54,78" fill="#C6FF00" />
        <polygon points="40,70 54,78 54,92 40,84" fill="#9ECD00" />
        <polygon points="54,78 68,70 68,84 54,92" fill="#7FA400" />
      </g>
      <g className="animate-pulse" style={{ animationDuration: '4s' }}>
        <polygon points="260,150 272,143 284,150 272,157" fill="#C6FF00" />
        <polygon points="260,150 272,157 272,169 260,162" fill="#9ECD00" />
        <polygon points="272,157 284,150 284,162 272,169" fill="#7FA400" />
      </g>

      {/* Floating Dark 3D Logo Card */}
      <g transform="translate(85, 35)">
        <rect x="0" y="0" width="150" height="150" rx="28" fill="#141418" stroke="#2B2B33" strokeWidth="3" />
        <rect x="10" y="10" width="130" height="130" rx="22" fill="#0E0E12" />

        {/* Center Neon Shopping Bag / Logo Icon */}
        <g transform="translate(42, 38)">
          <path d="M12 24 L54 24 L48 64 L18 64 Z" fill="none" stroke="#C6FF00" strokeWidth="4" strokeLinejoin="round" />
          <path d="M22 24 C22 12, 44 12, 44 24" fill="none" stroke="#C6FF00" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Plus Badge at Corner */}
        <g transform="translate(108, 108)">
          <circle cx="18" cy="18" r="18" fill="#0A0A0C" />
          <circle cx="18" cy="18" r="15" fill="#1A1A20" stroke="#C6FF00" strokeWidth="2.5" />
          <line x1="18" y1="10" x2="18" y2="26" stroke="#C6FF00" strokeWidth="3" strokeLinecap="round" />
          <line x1="10" y1="18" x2="26" y2="18" stroke="#C6FF00" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  </div>
);

// 3D Floating Storefront Banner Illustration for Screen 11
export const BannerUpload3DIllustration: React.FC = () => (
  <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
    {/* Soft Ambient Glow */}
    <div className="absolute inset-0 m-auto w-52 h-28 bg-[#C6FF00]/15 blur-3xl rounded-full" />

    <svg viewBox="0 0 320 250" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
      {/* Floating 3D Cubes */}
      <polygon points="35,130 47,123 59,130 47,137" fill="#C6FF00" />
      <polygon points="35,130 47,137 47,149 35,142" fill="#9ECD00" />
      <polygon points="47,137 59,130 59,142 47,149" fill="#7FA400" />

      {/* Floating Banner Frame */}
      <g transform="translate(35, 45)">
        {/* Back Frame Shadow */}
        <rect x="0" y="0" width="250" height="135" rx="20" fill="#141418" stroke="#2B2B33" strokeWidth="3" />
        <rect x="8" y="8" width="234" height="119" rx="14" fill="#0A0A0D" />

        {/* Store Name on Banner */}
        <text x="24" y="32" fill="#C6FF00" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">ThreadZW.</text>

        {/* Clothing Rack & Hoodies Graphic inside Banner */}
        <line x1="45" y1="48" x2="205" y2="48" stroke="#3F3F46" strokeWidth="2.5" />
        <line x1="55" y1="48" x2="55" y2="105" stroke="#3F3F46" strokeWidth="2.5" />
        <line x1="195" y1="48" x2="195" y2="105" stroke="#3F3F46" strokeWidth="2.5" />

        {/* Hanging Hoodies Silhouettes */}
        {[80, 110, 140, 170].map((xPos, idx) => (
          <g key={idx} transform={`translate(${xPos}, 50)`}>
            <line x1="10" y1="0" x2="10" y2="8" stroke="#71717A" strokeWidth="1.5" />
            <path d="M2 10 L18 10 L22 20 L18 22 L17 45 L3 45 L2 22 L-2 20 Z" fill={idx === 1 ? '#1C1C22' : '#141418'} stroke="#2D2D35" strokeWidth="1" />
          </g>
        ))}

        {/* Edit / Upload Corner Badge */}
        <g transform="translate(205, 90)">
          <circle cx="18" cy="18" r="18" fill="#000000" />
          <circle cx="18" cy="18" r="15" fill="#1A1A20" stroke="#C6FF00" strokeWidth="2" />
          <path d="M18 24 V12 M13 17 L18 12 L23 17" fill="none" stroke="#C6FF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  </div>
);

// 3D Floating Storefront Smartphone / Launch Ready Illustration for Screen 12
export const ShopReady3DIllustration: React.FC = () => (
  <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center my-2 select-none pointer-events-none">
    {/* Soft Ambient Glow */}
    <div className="absolute inset-0 m-auto w-52 h-36 bg-[#C6FF00]/20 blur-3xl rounded-full" />

    <svg viewBox="0 0 320 250" className="w-full h-full drop-shadow-[0_25px_40px_rgba(0,0,0,0.95)]">
      {/* Base Stand */}
      <polygon points="160,215 270,172 160,129 50,172" fill="#141418" stroke="#222228" strokeWidth="1.5" />
      <polygon points="50,172 160,215 160,225 50,182" fill="#0A0A0C" />
      <polygon points="160,215 270,172 270,182 160,225" fill="#18181D" />

      {/* Floating 3D Display Monitor / Phone displaying Storefront */}
      <g transform="translate(60, 30)">
        <rect x="0" y="0" width="200" height="135" rx="18" fill="#18181C" stroke="#2B2B33" strokeWidth="3" />
        <rect x="8" y="8" width="184" height="119" rx="12" fill="#09090C" />

        {/* Storefront Header */}
        <text x="20" y="28" fill="#E4E4E7" fontSize="10" fontWeight="bold">NULLA</text>
        <text x="20" y="52" fill="#C6FF00" fontSize="22" fontWeight="900" fontFamily="sans-serif" letterSpacing="2">NULLA</text>
        <text x="20" y="64" fill="#A1A1AA" fontSize="8" fontWeight="600" letterSpacing="1">CLOTHING</text>

        {/* Navigation pills */}
        <g transform="translate(20, 75)">
          <rect x="0" y="0" width="28" height="10" rx="5" fill="#C6FF00" />
          <text x="14" y="7" textAnchor="middle" fill="#000000" fontSize="6" fontWeight="bold">Home</text>
          
          <rect x="32" y="0" width="28" height="10" rx="5" fill="#1A1A20" />
          <text x="46" y="7" textAnchor="middle" fill="#71717A" fontSize="6" fontWeight="bold">Shop</text>
          
          <rect x="64" y="0" width="38" height="10" rx="5" fill="#1A1A20" />
          <text x="83" y="7" textAnchor="middle" fill="#71717A" fontSize="6" fontWeight="bold">Collections</text>
        </g>

        {/* Clothes rack mockup */}
        <g transform="translate(20, 92)">
          <rect x="0" y="0" width="160" height="2" fill="#27272A" />
          {[15, 45, 75, 105, 135].map((xPos, idx) => (
            <rect key={idx} x={xPos} y="2" width="12" height="22" rx="2" fill={idx === 0 ? '#C6FF00' : '#1C1C22'} />
          ))}
        </g>
      </g>

      {/* 3D Glowing Green Success Checkmark Badge (Top Right) */}
      <g transform="translate(225, 20)">
        <circle cx="28" cy="28" r="28" fill="#141418" />
        <circle cx="28" cy="28" r="24" fill="#C6FF00" style={{ filter: 'drop-shadow(0 0 16px rgba(198,255,0,0.6))' }} />
        {/* Checkmark */}
        <path d="M18 28 L25 35 L38 21" fill="none" stroke="#000000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  </div>
);



