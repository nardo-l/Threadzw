import React from 'react';
import { motion } from 'motion/react';
import { useInventory } from '../../context/InventoryContext';

export const NoShopView: React.FC = () => {
  const { setSellerFlowState } = useInventory();

  const features = [
    { icon: '⚡', title: 'Up in 2 minutes', body: 'Create your shop, add products, and go live fast.' },
    { icon: '📊', title: 'Track everything', body: 'Sales, views, stock levels and smart alerts.' },
    { icon: '💬', title: 'WhatsApp-first', body: 'Buyers contact you directly. No middleman.' },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-[100px]">
      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center">
        <h1 className="text-white font-bold text-[18px]">Shop Centre</h1>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center pt-10 px-5 text-center">
        <div className="w-20 h-20 bg-[#1a1a1a] rounded-[20px] flex items-center justify-center text-[40px] shadow-lg">
          📦
        </div>
        <h2 className="text-white font-bold text-[24px] mt-4">Open Your Shop</h2>
        <p className="text-[#888888] text-[14px] mt-2 max-w-[280px]">
          Join Zimbabwe's fashion marketplace. List your products and reach thousands of buyers.
        </p>
      </div>

      {/* Features */}
      <div className="mt-8 flex flex-col gap-[10px] px-5">
        {features.map((f, i) => (
          <div 
            key={i}
            className="bg-[#111111] border border-[#222222] rounded-[14px] p-4 flex items-center"
          >
            <div className="w-10 h-10 bg-[#1a1a1a] rounded-[12px] flex items-center justify-center text-[32px]">
              {f.icon}
            </div>
            <div className="ml-3.5">
              <div className="text-white font-bold text-[14px]">{f.title}</div>
              <div className="text-[#888888] text-[13px]">{f.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Trial Info */}
      <div className="mt-6 mx-5 p-4 rounded-[14px] bg-linear-to-br from-[#9B27AF1A] to-[#FF2D781A] border border-[#FF2D7833] flex items-center gap-4">
        <div className="text-[24px]">🎁</div>
        <div className="flex flex-col">
          <div className="text-white font-bold text-[14px]">20 days free</div>
          <div className="text-[#888888] text-[12px]">No payment needed to start. Choose a plan after your trial ends.</div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 px-5">
        <button 
          onClick={() => setSellerFlowState('seller_onboarding')}
          className="w-full h-14 rounded-full bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold text-[16px] shadow-lg active:scale-[0.98] transition-transform"
        >
          Open Your Shop — Free
        </button>
      </div>
    </div>
  );
};
