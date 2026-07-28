// src/components/AIAssistantModal.tsx

import React, { useState } from 'react';
import { Sparkles, X, Send, ArrowRight, HelpCircle, Bot, Loader2, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; text: string; actions?: Array<{ label: string; route: string }> }>>([
    {
      role: 'assistant',
      text: "Hello! I am your ThreadZW Merchant Assistant. How can I help you optimize your storefront or answer platform questions today?",
      actions: [
        { label: 'Add Product', route: '/add-product' },
        { label: 'Storefront Link', route: 'copy' }
      ]
    }
  ]);

  if (!isOpen) return null;

  const quickQuestions = [
    "How do I add a new product?",
    "Why isn't my storefront visible?",
    "How do I share my store link?",
    "How does the 7-day trial work?"
  ];

  const handleSend = async (qText?: string) => {
    const textToSend = qText || query;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    if (!qText) setQuery('');

    setConversation(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();

      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || "I can assist with adding products, setting up your domain, and receiving WhatsApp orders.",
          actions: data.suggestedActions || []
        }
      ]);
    } catch (err) {
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "To add products, tap 'Add Product' on your dashboard. To share your shop, copy your store link and share it on WhatsApp or Instagram.",
          actions: [{ label: 'Dashboard', route: '/dashboard' }]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (route: string) => {
    onClose();
    if (route === 'copy') {
      const el = document.getElementById('walkthrough-copy-link');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      navigate('/dashboard');
    } else {
      navigate(route);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white p-4 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#25D366] to-emerald-400 flex items-center justify-center text-black shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">ThreadZW AI Assistant</h3>
              <p className="text-[10px] text-zinc-400 font-medium">Merchant Productivity & Support</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Questions Chips */}
        <div className="bg-zinc-50 border-b border-zinc-100 p-3 px-4 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] font-semibold bg-white border border-zinc-200/80 hover:border-zinc-400 text-zinc-700 px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-all active:scale-95 shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 shrink-0 mt-0.5">
                  <Bot size={14} />
                </div>
              )}
              <div className={`max-w-[82%] space-y-2`}>
                <div
                  className={`p-3.5 rounded-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-black text-white rounded-br-xs font-medium'
                      : 'bg-zinc-100 text-zinc-800 rounded-bl-xs border border-zinc-200/60'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Suggested Action Buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleActionClick(act.route)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#1da851] hover:bg-[#25D366]/20 text-[11px] font-bold rounded-xl transition-colors cursor-pointer border border-[#25D366]/20"
                      >
                        <Compass size={12} />
                        {act.label}
                        <ArrowRight size={10} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center text-zinc-400 text-xs italic">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500">
                <Loader2 size={14} className="animate-spin" />
              </div>
              ThreadZW AI is thinking...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-zinc-100 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about ThreadZW..."
              className="flex-1 bg-zinc-100 border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="w-10 h-10 rounded-xl bg-black text-white hover:bg-zinc-800 disabled:opacity-40 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
