import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { setIsGuest } = useAuth();

  const handleBrowse = () => {
    setIsGuest(true);
    // The App component will notice isGuest is true and show the main app
  };

  return (
    <div className="min-h-screen flex flex-col pt-[60px] pb-12 bg-[#0B0B0B]">
      {/* Top Section */}
      <div className="px-7 flex flex-col items-center">
        <h1 className="threadzw-wordmark text-[32px]">
          ThreadZW
        </h1>
        
        <h2 className="text-2xl font-bold text-center mt-3 leading-tight text-white tracking-tight">
          The WhatsApp Storefront<br />for Zimbabwe.
        </h2>
        
        <p className="text-sm text-center mt-3 leading-relaxed text-[#A1A1AA] max-w-[280px]">
          Create your professional shop link, manage orders, and grow your business on WhatsApp.
        </p>
      </div>

      {/* Feature Preview Cards */}
      <div className="mt-6">
        <div className="flex overflow-x-auto no-scrollbar gap-3 px-5 py-2">
          <FeatureCard 
            emoji="🏪" 
            title="Local Shops" 
            description="Follow your favourites" 
            gradient="linear-gradient(135deg, #1a0a2a, #2a0a1a)" 
          />
          <FeatureCard 
            emoji="📦" 
            title="New Drops" 
            description="Be first to see new stock" 
            gradient="linear-gradient(135deg, #0a1a0a, #0a2a1a)" 
          />
          <FeatureCard 
            emoji="🔥" 
            title="Fashion Culture" 
            description="Quizzes, challenges, trends" 
            gradient="linear-gradient(135deg, #1a1a0a, #2a1a0a)" 
          />
        </div>
      </div>

      {/* Main Button */}
      <div className="mt-8 px-6">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleBrowse}
          className="w-full h-15 rounded-full flex items-center justify-center text-[#0B0B0B] font-black uppercase tracking-widest text-sm shadow-2xl bg-[#C6FF00] italic"
        >
          Initialize Protocol →
        </motion.button>
      </div>

      {/* Account Buttons */}
      <div className="mt-3.5 px-6 flex gap-2.5">
        <button 
          onClick={() => navigate('/auth?mode=signin')}
          className="flex-1 h-13 rounded-full font-black uppercase tracking-widest text-[10px] border flex items-center justify-center transition-all bg-[#0d0d0d] border-[#222] text-white italic"
        >
          Terminal Login
        </button>
        <button 
          onClick={() => navigate('/auth?mode=signup')}
          className="flex-1 h-13 rounded-full font-black uppercase tracking-widest text-[10px] border flex items-center justify-center transition-all bg-[#0d0d0d] border-[#222] text-white italic"
        >
          Entity Registration
        </button>
      </div>

      {/* Bottom Note */}
      <div className="mt-auto px-6 text-center">
        <p className="text-[12px] text-[#555]">
          No account needed to browse.
        </p>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ emoji: string; title: string; description: string; gradient: string }> = ({ emoji, title, description, gradient }) => (
  <div 
    className="w-[200px] h-[120px] rounded-[14px] flex-shrink-0 flex flex-col items-center justify-center p-4 border border-[#222]"
    style={{ background: gradient }}
  >
    <span className="text-2xl mb-2">{emoji}</span>
    <span className="text-white font-bold text-[14px]">{title}</span>
    <span className="text-gray-400 text-[11px] text-center mt-1">{description}</span>
  </div>
);
