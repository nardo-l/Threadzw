import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, HelpCircle, BookOpen, MessageCircle, PlayCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

interface Guide {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'buying' | 'selling' | 'profile' | 'community';
}

export const HowToUse: React.FC = () => {
  const navigate = useNavigate();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const { data, error } = await supabase
          .from('how_to_use_guides')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setGuides(data || []);
      } catch (err) {
        console.error('Error fetching guides:', err);
        // Fallback guides if table doesn't exist yet or fails
        setGuides([
          { id: '1', title: 'How to Buy', description: 'Everything you need to know about purchasing drip.', content: '', category: 'buying' },
          { id: '2', title: 'Start Selling', description: 'Launch your shop and start earning.', content: '', category: 'selling' },
          { id: '3', title: 'Verification', description: 'How to get blue checked on Thread.', content: '', category: 'profile' },
          { id: '4', title: 'Best Dresser Contest', description: 'Participate and win prizes.', content: '', category: 'community' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-black font-sans">
      <header className="p-8 pt-12 flex flex-col gap-6 shrink-0 z-10 sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">How to Use Thread</h1>
          <div className="w-6" />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search for guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 bg-[#111] border border-[#222] rounded-full pl-12 pr-6 text-sm text-white placeholder-[#444] focus:border-[#FF2D78] transition-all outline-none"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={`guide-shimmer-${i}`} className="w-full h-32 bg-[#111] rounded-2xl animate-pulse" />
            ))
          ) : filteredGuides.length > 0 ? (
            filteredGuides.map((guide, idx) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-[#111] border border-[#222] p-5 rounded-[24px] hover:border-[#FF2D78]/20 transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF2D7810] flex items-center justify-center text-[#FF2D78] group-hover:bg-[#FF2D78] group-hover:text-white transition-all">
                      {guide.category === 'buying' ? <BookOpen size={24} /> : 
                       guide.category === 'selling' ? <PlayCircle size={24} /> : 
                       guide.category === 'profile' ? <HelpCircle size={24} /> : 
                       <MessageCircle size={24} />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[17px] font-bold text-white group-hover:text-[#FF2D78] transition-colors">{guide.title}</h3>
                      <p className="text-xs text-[#888] leading-relaxed">{guide.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#333] mt-1" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
              <HelpCircle size={48} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">No guides found</p>
            </div>
          )}
        </div>

        <div className="mt-12 p-8 rounded-[32px] bg-[#111] border border-[#222] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageCircle size={80} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 relative z-10">Stuck? Chat with us.</h3>
          <p className="text-sm text-[#888] mb-6 relative z-10">Our support team is live on WhatsApp to help you move your drip or find what you need.</p>
          <a 
            href="https://wa.me/263771234567" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white font-bold rounded-full text-sm shadow-xl shadow-[#25D366]/20 active:scale-95 transition-all relative z-10"
          >
            <MessageCircle size={18} />
            Support on WhatsApp
          </a>
        </div>

        <p className="text-center text-[10px] text-[#333] font-bold uppercase tracking-widest py-10 mt-8">
          Thread ZW Manual • v2.0
        </p>
      </main>
    </div>
  );
};
