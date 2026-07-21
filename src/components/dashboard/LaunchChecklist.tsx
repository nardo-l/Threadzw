import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, ShoppingBag, MapPin, FileText, Share2 } from 'lucide-react';

export const LaunchChecklist: React.FC = () => {
  const navigate = useNavigate();

  const items = [
    { label: 'Add first product', icon: ShoppingBag, path: '/add-product' },
    { label: 'Set shop location', icon: MapPin, path: '/settings' },
    { label: 'Add shop description', icon: FileText, path: '/settings' },
    { label: 'Share shop link', icon: Share2, path: '/dashboard' },
  ];

  return (
    <div className="bg-zinc-950 rounded-3xl p-6 text-white space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-tight">Launch Checklist</h3>
        <span className="text-[10px] font-mono text-[#C6FF00]">0/4 COMPLETED</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <item.icon size={16} className="text-zinc-500 group-hover:text-[#C6FF00]" />
              <span className="text-xs font-bold">{item.label}</span>
            </div>
            <ChevronRight size={16} className="text-zinc-600" />
          </button>
        ))}
      </div>
    </div>
  );
};
