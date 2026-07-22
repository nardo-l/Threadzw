// src/components/AICatalogAuditBanner.tsx

import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Info, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AICatalogAuditBannerProps {
  products: any[];
  shop: any;
}

export const AICatalogAuditBanner: React.FC<AICatalogAuditBannerProps> = ({ products, shop }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{
    type: 'warning' | 'info' | 'error' | 'success';
    title: string;
    message: string;
    actionLabel?: string;
  }>>([]);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/catalog-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, shop })
      });
      const data = await res.json();
      setScore(data.score ?? 85);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      // Fallback local audit
      const missingPhotos = products.filter(p => !p.image_url && (!p.images || p.images.length === 0)).length;
      const missingDesc = products.filter(p => !p.description || p.description.trim().length < 15).length;

      const items = [];
      if (missingPhotos > 0) {
        items.push({
          type: 'warning' as const,
          title: `${missingPhotos} item(s) missing photos`,
          message: 'Clear photos increase WhatsApp order conversions by 3x.',
          actionLabel: 'Edit Products'
        });
      }
      if (missingDesc > 0) {
        items.push({
          type: 'info' as const,
          title: `${missingDesc} item(s) need detailed descriptions`,
          message: 'Use our AI description generator to fill in key details instantly.',
          actionLabel: 'Use AI Generator'
        });
      }
      if (items.length === 0) {
        items.push({
          type: 'success' as const,
          title: 'Store Catalog Optimized!',
          message: 'All your listings have photos, descriptions, and active prices.',
          actionLabel: 'Add Product'
        });
      }
      setScore(Math.max(30, 100 - ((missingPhotos + missingDesc) * 12)));
      setSuggestions(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      runAudit();
    }
  }, [products.length]);

  if (products.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-zinc-900 to-black text-white border border-zinc-800 rounded-3xl p-5 shadow-xs space-y-3.5 text-left">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#25D366] to-emerald-400 flex items-center justify-center text-black shadow-xs font-bold">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-300">
              AI Smart Catalog Assistant
            </h3>
            <p className="text-[10px] text-zinc-400 font-medium">Store Readiness & Product Health</p>
          </div>
        </div>

        {/* Score Pill */}
        {score !== null && (
          <div className="flex items-center gap-2 bg-zinc-800/90 border border-zinc-700/80 px-3 py-1 rounded-full">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Health Score:</span>
            <span className={`text-xs font-black ${score >= 80 ? 'text-[#25D366]' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {score}/100
            </span>
          </div>
        )}
      </div>

      {/* Suggestions List */}
      <div className="space-y-2">
        {suggestions.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-3 bg-zinc-800/50 border border-zinc-800 p-3 rounded-2xl text-xs"
          >
            <div className="flex items-start gap-2.5">
              {item.type === 'warning' || item.type === 'error' ? (
                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              ) : item.type === 'success' ? (
                <CheckCircle2 size={15} className="text-[#25D366] shrink-0 mt-0.5" />
              ) : (
                <Info size={15} className="text-sky-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-white text-xs">{item.title}</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{item.message}</p>
              </div>
            </div>

            {item.actionLabel && (
              <button
                onClick={() => {
                  if (item.actionLabel === 'Add Product') navigate('/add-product');
                  else navigate('/inventory');
                }}
                className="shrink-0 text-[11px] font-bold text-[#25D366] hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                {item.actionLabel}
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold pt-1">
        <span>Updated real-time with Gemini AI</span>
        <button
          onClick={runAudit}
          disabled={loading}
          className="hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Re-audit catalog
        </button>
      </div>
    </div>
  );
};
