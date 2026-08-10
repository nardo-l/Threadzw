import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MessageCircle, HelpCircle, Bug, Sparkles, 
  ChevronDown, ChevronUp, CheckCircle, Send 
} from 'lucide-react';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { toast } from 'sonner';

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  { q: 'How does ThreadZW pricing work?', a: 'ThreadZW provides a limited free tier allowing merchants to launch their storefront completely free with up to 3 product listings and WhatsApp ordering, with zero recurring subscription fees.' },
  { q: 'How do customers contact me from my storefront?', a: 'When a customer browses and selects products on your storefront, they click "Checkout." ThreadZW automates their cart draft and instantly redirects them to your configured WhatsApp number to complete payment.' },
  { q: 'Can I upload custom banners and logos?', a: 'Yes! Go to Settings -> Shop Settings to upload your custom store brand logo and banner images, or modify them under the Branding section.' },
  { q: 'How is product stock handled?', a: 'Under the Products list, when recording a sale or manual checkout, our inventory system automatically decrements physical stock count sizes. If an item total stock hits zero, it shows as Sold Out.' },
];

export const Support: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Bug report states
  const [type, setType] = useState<'bug' | 'feature'>('bug');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) {
      toast.error('Description is required');
      return;
    }

    setSubmitting(true);
    // Mimic real submit
    setTimeout(() => {
      setDesc('');
      toast.success(type === 'bug' ? 'Incident report sent. We will review it shortly!' : 'Feature suggestion logged! Thank you for helping shape ThreadZW.');
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white pb-32 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4 border-b border-white/[0.02] flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400">
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#bef715] uppercase font-black font-mono">Merchant Resource</span>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">Help & Support</h1>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">

        {/* WHATSAPP SUPPORT GATEWAY */}
        <div className="bg-gradient-to-br from-zinc-900 to-[#111115] border border-white/[0.05] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#bef715]/5 rounded-bl-full filter blur-xl opacity-40" />
          <div className="w-10 h-10 rounded-xl bg-[#bef715]/10 text-[#bef715] flex items-center justify-center mb-3.5">
            <MessageCircle size={20} />
          </div>
          <h3 className="font-extrabold text-base text-white">Direct WhatsApp Assistance</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Need custom guidance or setting up payment terminals? DM our live developer operations desk directly.
          </p>
          <a
            href="https://wa.me/263776223144?text=Hi%20ThreadZW%20Support!%20I%20am%20a%20merchant%20and%20I%20need%20help%20with%20my%20store%20dashboard..."
            target="_blank"
            rel="noreferrer"
            className="mt-4 w-full h-11 bg-[#bef715] hover:bg-[#a9db10] text-black rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <MessageCircle size={15} />
            <span>Chat support (Zimbabwe)</span>
          </a>
        </div>

        {/* ACCORDION FAQS */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 px-1 flex items-center gap-1.5">
            <HelpCircle size={14} className="text-zinc-500" />
            Frequently Asked Questions
          </h3>

          <div className="space-y-2">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-[#111115] border border-white/[0.05] rounded-xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 flex items-center justify-between text-left gap-4"
                  >
                    <span className="text-sm font-semibold text-white leading-snug">{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                  </button>
                  
                  {isOpen && (
                    <div className="px-4 pb-4.5 text-xs text-zinc-400 leading-relaxed border-t border-white/[0.02] pt-3.5 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FEEDBACK & TICKETS FORM */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 px-1 flex items-center gap-1.5">
            <Bug size={14} className="text-zinc-500" />
            Report Bug / Request Feature
          </h3>

          <form onSubmit={handleRequest} className="bg-[#111115] border border-white/[0.05] rounded-2xl p-5 space-y-4">
            
            {/* Segments switcher */}
            <div className="grid grid-cols-2 gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setType('bug')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  type === 'bug' 
                    ? 'bg-[#bef715] text-black font-extrabold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Report Incident
              </button>
              <button
                type="button"
                onClick={() => setType('feature')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  type === 'feature' 
                    ? 'bg-[#bef715] text-black font-extrabold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Request Feature
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-extrabold block">
                {type === 'bug' ? 'Describe the issue' : 'Describe your suggestion'}
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                className="w-full bg-black/25 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#bef715] placeholder-zinc-700"
                placeholder={type === 'bug' ? 'e.g., The analytics page shows $0.00 even though I recorded sales...' : 'e.g., I would love to be able to sort categories by rank drag-and-drop...'}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <>
                  <Send size={12} />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>

          </form>
        </div>

        <div className="text-center pt-8">
          <p className="text-[10.5px] font-mono font-bold text-zinc-500 tracking-wider">ThreadZW Terminal Assistance Node</p>
          <p className="text-[9px] text-[#A1A1AA]/20 font-mono mt-1 uppercase">Harare Digital Operations Desk • Zim-2026</p>
        </div>

      </div>

      <BottomNavBar />
    </div>
  );
};
