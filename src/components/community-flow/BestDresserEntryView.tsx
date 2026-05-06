import React, { useState } from 'react';
import { ArrowLeft, Instagram, Link as LinkIcon, Check, Send, AlertCircle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const BestDresserEntryView: React.FC = () => {
  const { setCommunityScreen } = useInventory();
  const { user } = useAuth();
  const [handle, setHandle] = useState('');
  const [link, setLink] = useState('');
  const [checkedRules, setCheckedRules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle || !link || !checkedRules) {
      setError('Please fill in all fields and accept the rules.');
      return;
    }

    if (!user) {
      setError('You must be signed in to enter.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error: submitError } = await supabase
        .from('best_dresser_entries')
        .insert({
          user_id: user.id,
          instagram_handle: handle,
          post_url: link,
          month: 'April',
          year: 2026,
          status: 'pending'
        });

      if (submitError) throw submitError;

      setCommunityScreen('entrySuccess');
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col pt-safe overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <button onClick={() => setCommunityScreen('bestDresser')}>
          <ArrowLeft className="text-white" size={24} />
        </button>
        <h1 className="text-white font-bold text-[16px]">Enter Contest</h1>
        <div className="w-6" />
      </div>

      <div className="px-6 py-8">
        <div className="mb-8 text-center">
           <div className="w-20 h-20 bg-linear-to-br from-[#9B27AF] to-[#FF2D78] rounded-[24px] mx-auto flex items-center justify-center shadow-lg transform rotate-3">
              <Instagram size={40} className="text-white" />
           </div>
           <h2 className="text-white text-[24px] font-black mt-6 tracking-tight">Submit Your Fit</h2>
           <p className="text-[#888] text-[15px] mt-2">Enter the April 2026 contest</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* IG Handle */}
          <div>
            <label className="text-[#888] text-[11px] font-bold uppercase tracking-widest mb-2 block">
              INSTAGRAM HANDLE
            </label>
            <div className="relative group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF2D78] font-bold">@</div>
               <input 
                 type="text"
                 value={handle}
                 onChange={(e) => setHandle(e.target.value)}
                 placeholder="your.handle"
                 className="w-full h-[56px] bg-[#111] border border-[#222] rounded-[16px] pl-9 pr-4 text-white font-medium focus:border-[#FF2D78] focus:ring-1 focus:ring-[#FF2D78] outline-none transition-all"
               />
            </div>
          </div>

          {/* Post Link */}
          <div>
            <label className="text-[#888] text-[11px] font-bold uppercase tracking-widest mb-2 block">
              LINK TO INSTAGRAM POST
            </label>
            <div className="relative group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f59e0b]">
                  <LinkIcon size={18} />
               </div>
               <input 
                 type="url"
                 value={link}
                 onChange={(e) => setLink(e.target.value)}
                 placeholder="https://instagram.com/p/..."
                 className="w-full h-[56px] bg-[#111] border border-[#222] rounded-[16px] pl-11 pr-4 text-white font-medium focus:border-[#FF2D78] focus:ring-1 focus:ring-[#FF2D78] outline-none transition-all"
               />
            </div>
            <p className="text-[#555] text-[11px] mt-2">
               Tip: Go to your post, tap ... and select "Copy Link"
            </p>
          </div>

          {/* Checklist */}
          <div className="mt-8 p-5 bg-[#111] border border-[#222] rounded-[20px] space-y-4">
             <h3 className="text-white font-bold text-[14px]">Contest Rules</h3>
             {[
               "Photo is clear & high quality",
               "You are tagging @threadzw",
               "Your account is public",
             ].map((rule, i) => (
                <div key={i} className="flex gap-3 items-center">
                   <div className="w-5 h-5 rounded-full bg-[#FF2D781A] flex items-center justify-center shrink-0">
                      <Check size={12} className="text-[#FF2D78]" />
                   </div>
                   <span className="text-[#888] text-[13px]">{rule}</span>
                </div>
             ))}

             <button 
                type="button"
                onClick={() => setCheckedRules(!checkedRules)}
                className="mt-4 flex items-center gap-3 group"
             >
                <div className={`
                   w-6 h-6 rounded-[6px] border-2 flex items-center justify-center transition-all
                   ${checkedRules ? 'bg-[#FF2D78] border-[#FF2D78]' : 'bg-transparent border-[#333] group-hover:border-[#444]'}
                `}>
                   {checkedRules && <Check size={16} className="text-white" />}
                </div>
                <span className={`text-[13px] text-left leading-tight ${checkedRules ? 'text-white font-medium' : 'text-[#888]'}`}>
                  I confirm my entry meets all the rules and guidelines for this month.
                </span>
             </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[#ef4444] bg-[#ef44441a] p-4 rounded-[12px] border border-[#ef444433]">
               <AlertCircle size={18} />
               <span className="text-[13px] font-medium">{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`
              w-full h-[64px] rounded-full font-bold text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all
              ${isLoading ? 'bg-[#222] cursor-not-allowed' : 'bg-linear-to-r from-[#9B27AF] to-[#FF2D78] text-white hover:brightness-110'}
            `}
          >
            {isLoading ? (
               <>
                 <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                 <span>Submitting...</span>
               </>
            ) : (
               <>
                 <span>Submit Entry</span>
                 <Send size={18} />
               </>
            )}
          </button>
        </form>

        <p className="mt-8 text-[#555] text-[11px] text-center leading-relaxed max-w-[240px] mx-auto">
           Entries are reviewed by our team manually. You will be notified if you are nominated for the bracket.
        </p>
      </div>
    </div>
  );
};
