import React from 'react';
import { motion } from 'motion/react';
import { useInventory } from '../../context/InventoryContext';

interface PendingCodeViewProps {
  myShop: any;
  onActivated: () => void;
}

export const PendingCodeView: React.FC<PendingCodeViewProps> = ({ myShop, onActivated }) => {
  const { setSellerFlowState } = useInventory();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-8 text-center">
      <div className="mb-10 relative">
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-[#FF2D78] blur-[40px] rounded-full opacity-20"
        />
        <span className="text-[72px] relative z-10">⏳</span>
      </div>

      <h1 className="text-white text-[28px] font-bold mb-4 leading-tight">
        Payment Submitted
      </h1>
      
      <p className="text-[#888] text-[16px] leading-[1.6] mb-10 max-w-[280px]">
        We're verifying your payment. Your access code will be sent to WhatsApp within 2 hours.
      </p>

      <div className="w-full space-y-4 max-w-[300px]">
        <button 
          onClick={() => setSellerFlowState('enter_code')}
          className="w-full h-14 bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold rounded-full text-[15px] shadow-lg"
        >
          I have my code →
        </button>
        
        <button 
          onClick={() => window.open('https://wa.me/263789113734', '_blank')}
          className="w-full h-14 bg-[#111] border border-[#222] text-[#888] font-bold rounded-full text-[15px]"
        >
          Message Admin on WhatsApp
        </button>
      </div>

      <div className="mt-12 p-5 bg-[#111] rounded-[16px] border border-[#222] w-full max-w-[300px]">
         <div className="flex justify-between items-center text-[12px] mb-3">
            <span className="text-[#888]">Shop Status:</span>
            <span className="text-[#FF2D78] font-bold px-2 py-0.5 bg-[#FF2D781A] rounded-full">Pending Verification</span>
         </div>
         <div className="flex justify-between items-center text-[12px]">
            <span className="text-[#888]">Plan:</span>
            <span className="text-white font-bold">Thread ZW Shop</span>
         </div>
      </div>
    </div>
  );
};
