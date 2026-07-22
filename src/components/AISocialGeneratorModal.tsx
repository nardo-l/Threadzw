// src/components/AISocialGeneratorModal.tsx

import React, { useState } from 'react';
import { Sparkles, X, Copy, Check, Share2, Instagram, Facebook, MessageSquare, Layers, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AISocialGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  products?: Array<{ name: string; price: number; category?: string }>;
}

export const AISocialGeneratorModal: React.FC<AISocialGeneratorModalProps> = ({
  isOpen,
  onClose,
  shopName,
  products = []
}) => {
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.name || '');
  const [contentType, setContentType] = useState<'instagram' | 'facebook' | 'whatsapp' | 'launch'>('instagram');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [generatedContent, setGeneratedContent] = useState<{
    caption?: string;
    statusUpdate?: string;
    hashtags?: string[];
    carouselIdeas?: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          productName: selectedProduct || 'Featured Collection',
          type: contentType
        })
      });
      const data = await res.json();
      setGeneratedContent(data);
      toast.success('Marketing content generated!');
    } catch (err) {
      toast.error('Failed to generate marketing copy');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-4 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">AI Social Post Generator</h3>
              <p className="text-[10px] text-zinc-400 font-medium">Create captions for WhatsApp & Social Media</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Select Product */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Select Product or Event
            </label>
            {products.length > 0 ? (
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-zinc-400"
              >
                <option value="">Storewide Promo / New Drop</option>
                {products.map((p, i) => (
                  <option key={i} value={p.name}>
                    {p.name} (${p.price})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                placeholder="e.g. Vintage Leather Jacket Drop"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400"
              />
            )}
          </div>

          {/* Goal Selector */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Post Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setContentType('instagram')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  contentType === 'instagram'
                    ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 font-medium'
                }`}
              >
                <Instagram size={14} className="text-purple-600 shrink-0" />
                <span className="truncate">Instagram Caption</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType('whatsapp')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  contentType === 'whatsapp'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 font-medium'
                }`}
              >
                <MessageSquare size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">WhatsApp Status</span>
              </button>
            </div>
          </div>

          {/* Generate Action Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating with Gemini...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Generate Posts with AI
              </>
            )}
          </button>

          {/* Generated Results */}
          {generatedContent && (
            <div className="space-y-3 pt-2 border-t border-zinc-200">
              {/* Instagram / Main Caption */}
              {generatedContent.caption && (
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3.5 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                      <Instagram size={12} /> Social Media Caption
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedContent.caption!, 'caption')}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-600 hover:text-black bg-white border border-zinc-200 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      {copiedKey === 'caption' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedKey === 'caption' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-800 whitespace-pre-line leading-relaxed font-sans">
                    {generatedContent.caption}
                  </p>
                </div>
              )}

              {/* WhatsApp Status Short Post */}
              {generatedContent.statusUpdate && (
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <MessageSquare size={12} /> WhatsApp Status Post
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedContent.statusUpdate!, 'status')}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      {copiedKey === 'status' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedKey === 'status' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-800 leading-relaxed font-sans">
                    {generatedContent.statusUpdate}
                  </p>
                </div>
              )}

              {/* Hashtags */}
              {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3 text-left space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Suggested Hashtags</span>
                  <div className="flex flex-wrap gap-1">
                    {generatedContent.hashtags.map((h, hIdx) => (
                      <span key={hIdx} className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Carousel Slide Ideas */}
              {generatedContent.carouselIdeas && generatedContent.carouselIdeas.length > 0 && (
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3 text-left space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <Layers size={11} /> Instagram Carousel Slide Ideas
                  </span>
                  <ul className="space-y-1 text-[11px] text-zinc-700 font-medium list-disc list-inside">
                    {generatedContent.carouselIdeas.map((idea, iIdx) => (
                      <li key={iIdx}>{idea}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
