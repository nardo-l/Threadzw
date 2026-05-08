import React, { useState } from 'react';
import { ArrowLeft, Instagram, Link as LinkIcon, Check, Send, AlertCircle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../App';

export const BestDresserEntryView: React.FC = () => {
  const t = useTheme();
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
    <div className="fixed inset-0 z-50 flex flex-col pt-safe overflow-y-auto" style={{ background: t.bg_primary }}>
      {/* Header */}
      <div 
        className="px-5 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-30 border-b"
        style={{ background: `${t.bg_primary}CC`, borderColor: t.border_secondary }}
      >
        <button onClick={() => setCommunityScreen('bestDresser')}>
          <ArrowLeft style={{ color: t.text_primary }} size={24} />
        </button>
        <h1 className="font-bold text-[16px]" style={{ color: t.text_primary }}>Enter Contest</h1>
        <div className="w-6" />
      </div>

      <div className="px-6 py-8">
        <div className="mb-8 text-center">
           <div className="w-20 h-20 bg-linear-to-br from-[#9B27AF] to-[#FF2D78] rounded-[24px] mx-auto flex items-center justify-center shadow-lg transform rotate-3">
              <Instagram size={40} className="text-white" />
           </div>
           <h2 className="text-[24px] font-black mt-6 tracking-tight" style={{ color: t.text_primary }}>Submit Your Fit</h2>
           <p className="text-[15px] mt-2" style={{ color: t.text_tertiary }}>Enter the April 2026 contest</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* IG Handle */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: t.text_tertiary }}>
              INSTAGRAM HANDLE
            </label>
            <div className="relative group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: t.accent }}>@</div>
               <input 
                 type="text"
                 value={handle}
                 onChange={(e) => setHandle(e.target.value)}
                 placeholder="your.handle"
                 className="w-full h-[56px] border rounded-[16px] pl-9 pr-4 font-medium outline-none transition-all"
                 style={{ 
                   background: t.bg_secondary, 
                   borderColor: t.border_secondary, 
                   color: t.text_primary 
                 }}
               />
            </div>
          </div>

          {/* Post Link */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: t.text_tertiary }}>
              LINK TO INSTAGRAM POST
            </label>
            <div className="relative group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.amber }}>
                  <LinkIcon size={18} />
               </div>
               <input 
                 type="url"
                 value={link}
                 onChange={(e) => setLink(e.target.value)}
                 placeholder="https://instagram.com/p/..."
                 className="w-full h-[56px] border rounded-[16px] pl-11 pr-4 font-medium outline-none transition-all"
                 style={{ 
                   background: t.bg_secondary, 
                   borderColor: t.border_secondary, 
                   color: t.text_primary 
                 }}
               />
            </div>
            <p className="text-[11px] mt-2" style={{ color: t.text_tertiary }}>
               Tip: Go to your post, tap ... and select "Copy Link"
            </p>
          </div>

          {/* Checklist */}
          <div className="mt-8 p-5 border rounded-[20px] space-y-4" style={{ background: t.bg_card, borderColor: t.border_secondary }}>
             <h3 className="font-bold text-[14px]" style={{ color: t.text_primary }}>Contest Rules</h3>
             {[
               "Photo is clear & high quality",
               "You are tagging @threadzw",
               "Your account is public",
             ].map((rule, i) => (
                <div key={i} className="flex gap-3 items-center">
                   <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${t.accent}1A` }}>
                      <Check size={12} style={{ color: t.accent }} />
                   </div>
                   <span className="text-[13px]" style={{ color: t.text_secondary }}>{rule}</span>
                </div>
             ))}

             <button 
                type="button"
                onClick={() => setCheckedRules(!checkedRules)}
                className="mt-4 flex items-center gap-3 group"
             >
                <div className={`
                   w-6 h-6 rounded-[6px] border-2 flex items-center justify-center transition-all
                   ${checkedRules ? 'border-transparent' : ''}
                `}
                style={{ 
                  background: checkedRules ? t.accent : 'transparent',
                  borderColor: checkedRules ? t.accent : t.border_subtle
                }}
                >
                   {checkedRules && <Check size={16} className="text-white" />}
                </div>
                <span className={`text-[13px] text-left leading-tight ${checkedRules ? 'font-medium' : ''}`} style={{ color: checkedRules ? t.text_primary : t.text_tertiary }}>
                  I confirm my entry meets all the rules and guidelines for this month.
                </span>
             </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-[#ef44441a] p-4 rounded-[12px] border border-[#ef444433]" style={{ color: t.red }}>
               <AlertCircle size={18} />
               <span className="text-[13px] font-medium">{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`
              w-full h-[64px] rounded-full font-bold text-[16px] flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all
            `}
            style={{ 
              background: isLoading ? t.bg_secondary : t.gradient,
              color: isLoading ? t.text_tertiary : 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
               <>
                 <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${t.text_tertiary}33`, borderTopColor: t.text_tertiary }} />
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

        <p className="mt-8 text-[11px] text-center leading-relaxed max-w-[240px] mx-auto" style={{ color: t.text_tertiary }}>
           Entries are reviewed by our team manually. You will be notified if you are nominated for the bracket.
        </p>
      </div>
    </div>
  );
};
