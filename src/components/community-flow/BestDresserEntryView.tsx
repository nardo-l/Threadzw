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

  const ACCENT_COLOR = '#C6FF00';

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
    <div className="fixed inset-0 z-50 flex flex-col pt-safe overflow-y-auto bg-[#F5F5F5]">
      {/* Header */}
      <div 
        className="px-5 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-30 bg-[#F5F5F5]/80"
      >
        <button onClick={() => setCommunityScreen('bestDresser')}>
          <ArrowLeft className="text-[#111111]" size={24} />
        </button>
        <h1 className="font-bold text-[16px] text-[#111111]">Enter Contest</h1>
        <div className="w-6" />
      </div>

      <div className="px-6 py-8">
        <div className="mb-8 text-center">
           <div className="w-20 h-20 bg-gradient-to-br from-[#9B27AF] to-[#C6FF00] rounded-[24px] mx-auto flex items-center justify-center shadow-lg transform rotate-3">
              <Instagram size={40} className="text-white" />
           </div>
           <h2 className="text-[28px] font-bold mt-6 tracking-tight text-[#111111]">Submit Your Fit</h2>
           <p className="text-[15px] mt-2 text-[#888888]">Enter the April 2026 contest</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* IG Handle */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block text-[#888888]">
              INSTAGRAM HANDLE
            </label>
            <div className="relative group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#C6FF00]">@</div>
               <input 
                 type="text"
                 value={handle}
                 onChange={(e) => setHandle(e.target.value)}
                 placeholder="your.handle"
                 className="w-full h-[56px] border border-[#EFEFEF] rounded-[16px] pl-9 pr-4 font-medium outline-none transition-all bg-white text-[#111111] focus:border-[#C6FF00] shadow-sm"
               />
            </div>
          </div>

          {/* Post Link */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block text-[#888888]">
              LINK TO INSTAGRAM POST
            </label>
            <div className="relative group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC107]">
                  <LinkIcon size={18} />
               </div>
               <input 
                 type="url"
                 value={link}
                 onChange={(e) => setLink(e.target.value)}
                 placeholder="https://instagram.com/p/..."
                 className="w-full h-[56px] border border-[#EFEFEF] rounded-[16px] pl-11 pr-4 font-medium outline-none transition-all bg-white text-[#111111] focus:border-[#C6FF00] shadow-sm"
               />
            </div>
            <p className="text-[11px] mt-2 text-[#888888]">
               Tip: Go to your post, tap ... and select "Copy Link"
            </p>
          </div>

          {/* Checklist */}
          <div className="mt-8 p-6 border border-[#EFEFEF] rounded-[24px] space-y-4 bg-white shadow-sm">
             <h3 className="font-bold text-[14px] text-[#111111]">Contest Rules</h3>
             {[
               "Photo is clear & high quality",
               "You are tagging @threadzw",
               "Your account is public",
             ].map((rule, i) => (
                <div key={`contest-rule-${i}`} className="flex gap-3 items-center">
                   <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#C6FF00]/10">
                      <Check size={12} className="text-[#C6FF00]" />
                   </div>
                   <span className="text-[13px] text-[#888888]">{rule}</span>
                </div>
             ))}

             <button 
                type="button"
                onClick={() => setCheckedRules(!checkedRules)}
                className="mt-4 flex items-center gap-3 group"
             >
                <div className={`
                   w-6 h-6 rounded-[8px] border-2 flex items-center justify-center transition-all
                   ${checkedRules ? 'border-transparent' : 'border-[#EFEFEF]'}
                `}
                style={{ 
                  background: checkedRules ? ACCENT_COLOR : 'transparent',
                  borderColor: checkedRules ? ACCENT_COLOR : '#EFEFEF'
                }}
                >
                   {checkedRules && <Check size={16} className="text-white" />}
                </div>
                <span className={`text-[13px] text-left leading-tight ${checkedRules ? 'font-medium text-[#111111]' : 'text-[#888888]'}`}>
                  I confirm my entry meets all the rules and guidelines for this month.
                </span>
             </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 p-4 rounded-[16px] border border-red-100 text-red-600">
               <AlertCircle size={18} />
               <span className="text-[13px] font-medium">{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`
              w-full h-[64px] rounded-full font-bold text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all
              ${isLoading ? 'bg-white border border-[#EFEFEF] text-[#888888] cursor-not-allowed' : 'bg-gradient-to-br from-[#9B27AF] to-[#C6FF00] text-white cursor-pointer'}
            `}
          >
            {isLoading ? (
               <>
                 <div className="w-5 h-5 border-2 rounded-full animate-spin border-[#888888]/30 border-t-[#888888]" />
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

        <p className="mt-8 text-[11px] text-center leading-relaxed max-w-[240px] mx-auto text-[#888888]">
           Entries are reviewed by our team manually. You will be notified if you are nominated for the bracket.
        </p>
      </div>
    </div>
  );
};
