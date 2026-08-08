import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const EmptyFeedDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const features = [
    {
      emoji: '🏆',
      title: 'Best Dresser of the Month',
      desc: 'Compete monthly. Tag @threadzw on Instagram. Win $30.',
      action: () => navigate('/best-dresser'),
      cta: 'See the Bracket',
      colour: '#e8c97a',
    },
    {
      emoji: '🔥',
      title: 'How Fly Are You?',
      desc: 'Take the quiz. Get your personality. Share it to Instagram Stories.',
      action: () => navigate('/quiz'),
      cta: 'Find Out',
      colour: '#f72585',
    },
    {
      emoji: '🏪',
      title: 'Browse Shops',
      desc: 'Discover clothing brands, thrift shops, and sneaker stores near you.',
      action: () => navigate('/shops'),
      cta: 'Browse Shops',
      colour: '#60a5fa',
    },
    {
      emoji: '📦',
      title: 'Open Your Shop',
      desc: 'List your products in 2 minutes. Reach thousands of buyers.',
      action: () => navigate('/shop-centre'),
      cta: 'Open a Shop',
      colour: '#4ade80',
    },
  ];

  return (
    <div className="px-4 py-6">
      {/* Welcome heading */}
      <div className="mb-6">
        <p className="text-[#888888] text-sm font-mono">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
        </p>
        <h1 className="text-white text-2xl font-syne font-bold leading-tight mt-1">
          Thread ZW is just getting started.
        </h1>
        <p className="text-[#888888] text-sm mt-2 leading-relaxed">
          No products yet — but here's what you can do right now.
        </p>
      </div>

      {/* Feature cards */}
      <div className="flex flex-col gap-3">
        {features.map((feature, i) => (
          <div
            key={`feature-card-${i}`}
            onClick={feature.action}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 cursor-pointer active:scale-95 transition-transform"
            style={{ borderLeftColor: feature.colour, borderLeftWidth: 3 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${feature.colour}15` }}
              >
                {feature.emoji}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-syne font-bold text-sm">
                  {feature.title}
                </h3>
                <p className="text-[#888888] text-xs mt-0.5 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
              <div
                className="text-[10px] font-mono px-3 py-1.5 rounded-full flex-shrink-0 uppercase font-bold"
                style={{
                  backgroundColor: `${feature.colour}15`,
                  color: feature.colour,
                  border: `1px solid ${feature.colour}30`
                }}
              >
                {feature.cta}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary — check back note */}
      <div className="mt-6 bg-[#111111] rounded-2xl p-4 border border-[#2a2a2a]">
        <p className="text-[#888888] text-xs text-center leading-relaxed">
          Products appear here as sellers list them.
          <br />
          Be the first to open a shop.
        </p>
        <button
          onClick={() => navigate('/shop-centre')}
          className="w-full mt-3 bg-[#f72585] text-white font-syne font-bold text-sm py-3 rounded-xl shadow-lg shadow-primary/20"
        >
          Open Your Shop
        </button>
      </div>
    </div>
  );
};
