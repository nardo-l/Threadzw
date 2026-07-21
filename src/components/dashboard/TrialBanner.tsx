import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../hooks/useShop';

export const TrialBanner = () => {
  const navigate = useNavigate();
  const { shop } = useShop();

  if (!shop?.trial_ends_at) return null;

  const trialEnds = new Date(shop.trial_ends_at);
  const now = new Date();
  const diffTime = trialEnds.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return (
      <div className="bg-red-500 text-white p-3 text-center font-semibold text-sm">
        Your free trial has ended. <span className="underline cursor-pointer ml-2" onClick={() => navigate('/subscription')}>Upgrade now to continue</span>
      </div>
    );
  }

  return (
    <div className="bg-[#bef715] text-zinc-900 p-3 text-center font-semibold text-sm">
      🚀 Welcome! You have {diffDays} {diffDays === 1 ? 'day' : 'days'} left on your free trial. <span className="underline cursor-pointer ml-2" onClick={() => navigate('/subscription')}>Upgrade now</span>
    </div>
  );
};
