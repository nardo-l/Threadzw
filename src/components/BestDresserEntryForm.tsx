import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, Instagram, Trophy, ChevronDown, ChevronUp, AlertTriangle, Loader2, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface BestDresserEntryFormProps {
  onClose: () => void;
}

export const BestDresserEntryForm: React.FC<BestDresserEntryFormProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { userData } = useInventory();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCopyHelp, setShowCopyHelp] = useState(false);

  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const storageKey = `thread_bestdresser_entry_${currentMonthYear.replace(/\s+/g, '_').toLowerCase()}`;

  const [formData, setFormData] = useState({
    displayName: userData.name || '',
    handle: '',
    postUrl: '',
    ageConfirmed: false,
    hasPosted: false,
    taggedCaption: false,
    taggedPhoto: false,
    isPublic: false,
    termsAccepted: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const existingEntry = localStorage.getItem(storageKey);
    if (existingEntry) {
      setIsSubmitted(true);
    }
  }, [storageKey]);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (formData.displayName.length < 2) newErrors.displayName = 'Name too short';
    if (!formData.handle) newErrors.handle = 'Handle required';
    if (!formData.ageConfirmed) newErrors.ageConfirmed = 'Must be 16+';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    const instagramPostRegex = /^https:\/\/(www\.)?instagram\.com\/p\/[a-zA-Z0-9_-]+\/?.*$/;
    if (!instagramPostRegex.test(formData.postUrl)) newErrors.postUrl = 'Invalid Instagram post link';
    if (!formData.hasPosted || !formData.taggedCaption || !formData.taggedPhoto || !formData.isPublic) {
      newErrors.requirements = 'All requirements must be checked';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted || !user?.id) return;
    setIsSubmitting(true);
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    try {
      const { error } = await supabase
        .from('best_dresser_entries')
        .insert({
          user_id: user.id,
          month: currentMonth,
          year: currentYear,
          instagram_handle: formData.handle,
          display_name: formData.displayName,
          post_url: formData.postUrl,
          status: 'pending'
        });

      if (error) throw error;

      localStorage.setItem(storageKey, JSON.stringify({
        ...formData,
        status: 'Under Review',
        submittedAt: new Date().toISOString()
      }));
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting nomination:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-[150] bg-gradient-to-br from-primary to-purple flex flex-col items-center justify-center p-8 text-center overflow-y-auto no-scrollbar">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="text-8xl mb-8"
        >
          🏆
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-4 mb-12"
        >
          <h2 className="text-4xl font-pacifico text-white">Entry Submitted!</h2>
          <p className="text-xl font-syne font-bold text-white">@{formData.handle || 'yourhandle'}</p>
          <p className="text-sm font-sans text-white/80 max-w-xs mx-auto">
            You're in the running for Best Dresser of the Month
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm bg-black/20 backdrop-blur-md rounded-3xl p-6 text-left flex flex-col gap-4 border border-white/10 mb-8"
        >
          <h4 className="text-[10px] font-mono text-white uppercase tracking-widest font-bold">What happens next:</h4>
          <ul className="flex flex-col gap-3">
            {[
              '1. We review your entry within 48 hours',
              '2. If selected you\'ll be notified via the app',
              '3. Voting opens on @threadzw Instagram',
              '4. Top 10 nominees featured on the app homepage',
              '5. Winner announced at end of the month'
            ].map((item, i) => (
              <li key={`success-item-${i}`} className="text-xs font-sans text-white/90 leading-relaxed">{item}</li>
            ))}
          </ul>
        </motion.div>

        <div className="w-full max-w-sm flex flex-col gap-3">
          <p className="text-sm font-sans text-white mb-2">Tell your friends to vote for you!</p>
          <button 
            onClick={() => {
              const text = `I just entered Best Dresser of the Month on Thread ZW 🏆 Follow @threadzw and vote for me! thread.zw #ThreadZW #BestDresser`;
              if (navigator.share) {
                navigator.share({ text, title: 'Best Dresser Entry' });
              } else {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
              }
            }}
            className="w-full py-4 border-2 border-white text-white font-bold rounded-pill flex items-center justify-center gap-2"
          >
            <Share2 size={18} /> Share on Instagram
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-black/40 text-white font-bold rounded-pill"
          >
            Go to Best Dresser
          </button>
        </div>

        {/* CSS Confetti */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={`confetti-${i}`}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#f72585', '#e8c97a', '#7209b7', '#ffffff'][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="p-6 flex justify-between items-center border-b border-white/5">
        <button onClick={onClose} className="p-2 text-muted hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-pacifico text-white">Enter Best Dresser</h2>
        <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{currentMonthYear}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 no-scrollbar">
        {/* Rules Card */}
        <div className="bg-elevated border-l-4 border-gold p-5 rounded-r-2xl flex flex-col gap-4">
          <div className="text-[10px] font-mono text-gold uppercase tracking-widest font-bold">📋 How to Enter</div>
          <ol className="flex flex-col gap-2">
            {[
              '1. Post a photo of your outfit on Instagram',
              '2. Tag @threadzw in both your caption and the photo',
              '3. Your post must be public — we need to verify it',
              '4. Submit the form below with your Instagram details',
              '5. We review entries and announce nominees within 48 hours'
            ].map((rule, i) => (
              <li key={`rule-item-${i}`} className="text-[13px] font-sans text-white leading-relaxed">{rule}</li>
            ))}
          </ol>
          <div className="pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-muted uppercase block mb-1">Prize:</span>
            <p className="text-[13px] font-sans text-gold font-bold">$30 Paynow cash + Thread ZW Brand Ambassador badge</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-4 relative">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-4 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />
          
          {[1, 2, 3].map(s => (
            <div key={s} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === s ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 
                step > s ? 'bg-green text-white' : 'bg-elevated text-muted border border-white/10'
              }`}>
                {step > s ? <Check size={18} /> : s}
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-tighter ${step >= s ? 'text-white' : 'text-muted'}`}>
                {s === 1 ? 'Info' : s === 2 ? 'Post' : 'Confirm'}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-syne font-bold text-white">Tell us about you</h3>
                <p className="text-sm font-sans text-muted">Your details as they'll appear if nominated</p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-muted uppercase tracking-widest ml-1">
                    Display Name <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={formData.displayName}
                      onChange={e => setFormData({ ...formData, displayName: e.target.value.slice(0, 30) })}
                      placeholder="How you want to be known"
                      className={`w-full bg-card border-2 rounded-2xl p-5 text-white outline-none transition-all ${errors.displayName ? 'border-red' : 'border-white/5 focus:border-primary'}`}
                    />
                    <span className="absolute right-5 bottom-5 text-[10px] font-mono text-muted">
                      {formData.displayName.length}/30
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-muted uppercase tracking-widest ml-1">
                    Your Instagram Handle <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-mono">@</span>
                    <input 
                      type="text"
                      value={formData.handle}
                      onChange={e => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') })}
                      placeholder="yourhandle"
                      className={`w-full bg-card border-2 rounded-2xl p-5 pl-10 text-white outline-none transition-all ${errors.handle ? 'border-red' : 'border-white/5 focus:border-primary'}`}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-muted/60 ml-1 italic">This must match the account you posted from</p>
                </div>

                <div className="flex justify-between items-center bg-card p-5 rounded-2xl border border-white/5">
                  <span className="text-sm font-sans text-white">I confirm I am 16 years or older</span>
                  <button 
                    onClick={() => setFormData({ ...formData, ageConfirmed: !formData.ageConfirmed })}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.ageConfirmed ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.ageConfirmed ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleNext}
                disabled={!formData.displayName || !formData.handle || !formData.ageConfirmed}
                className={`w-full py-5 rounded-pill font-bold text-lg transition-all mt-4 ${
                  formData.displayName && formData.handle && formData.ageConfirmed ? 
                  'bg-primary text-white shadow-lg shadow-primary/30' : 
                  'bg-white/5 text-muted cursor-not-allowed'
                }`}
              >
                Next →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-syne font-bold text-white">Show us your post</h3>
                <p className="text-sm font-sans text-muted">We need to verify your Instagram entry</p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-muted uppercase tracking-widest ml-1">
                    Instagram Post Link <span className="text-primary">*</span>
                  </label>
                  <input 
                    type="url"
                    value={formData.postUrl}
                    onChange={e => setFormData({ ...formData, postUrl: e.target.value })}
                    placeholder="https://www.instagram.com/p/..."
                    className={`w-full bg-card border-2 rounded-2xl p-5 text-white outline-none transition-all ${
                      errors.postUrl ? 'border-red' : 
                      formData.postUrl.includes('instagram.com/p/') ? 'border-green' : 'border-white/5 focus:border-primary'
                    }`}
                  />
                  <p className="text-[10px] font-mono text-muted/60 ml-1 italic">Open your Instagram post → tap ··· → Copy Link → paste here</p>
                </div>

                {/* How to copy link collapsible */}
                <div className="bg-elevated rounded-2xl overflow-hidden border border-white/5">
                  <button 
                    onClick={() => setShowCopyHelp(!showCopyHelp)}
                    className="w-full p-4 flex justify-between items-center text-primary"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold">How do I find my post link?</span>
                    {showCopyHelp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <AnimatePresence>
                    {showCopyHelp && (
                      <motion.div 
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="px-4 pb-4 overflow-hidden"
                      >
                        <ul className="flex flex-col gap-2">
                          {[
                            '1. Open Instagram and go to your post',
                            '2. Tap the ··· (three dots) at the top right of your post',
                            '3. Tap \'Copy Link\'',
                            '4. Paste it in the field above'
                          ].map((step, i) => (
                            <li key={`link-help-step-${i}`} className="text-xs font-sans text-muted leading-relaxed">{step}</li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Post Preview Card */}
                {formData.postUrl.includes('instagram.com/p/') && (
                  <div className="bg-card rounded-2xl p-4 border border-primary/30 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted">
                      <Instagram size={14} />
                      <span className="text-[10px] font-mono uppercase">Instagram Post</span>
                    </div>
                    <p className="text-xs font-mono text-primary truncate">{formData.postUrl}</p>
                    <p className="text-[10px] font-mono text-muted italic">We'll verify this post during review</p>
                  </div>
                )}

                {/* Checkboxes */}
                <div className="flex flex-col gap-4">
                  {[
                    { key: 'hasPosted', label: 'I have posted my outfit photo on Instagram' },
                    { key: 'taggedCaption', label: 'I have tagged @threadzw in my caption' },
                    { key: 'taggedPhoto', label: 'I have tagged @threadzw in the photo (people tag)' },
                    { key: 'isPublic', label: 'My Instagram account is set to Public' }
                  ].map(item => (
                    <label key={item.key} className="flex items-start gap-4 cursor-pointer group">
                      <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData[item.key as keyof typeof formData] ? 'bg-primary border-primary' : 'border-white/10 group-hover:border-primary/30'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={formData[item.key as keyof typeof formData] as boolean} 
                          onChange={() => setFormData({ ...formData, [item.key]: !formData[item.key as keyof typeof formData] })} 
                        />
                        {formData[item.key as keyof typeof formData] && <Check size={16} className="text-white" />}
                      </div>
                      <span className="text-sm font-sans text-white leading-tight">{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* Verification Note */}
                <div className="bg-elevated border-l-4 border-amber p-4 rounded-r-2xl flex flex-col gap-1">
                  <div className="text-[10px] font-mono text-amber uppercase tracking-widest font-bold">⚠ Verification</div>
                  <p className="text-xs font-sans text-muted leading-relaxed">
                    Entries that don't tag @threadzw will be automatically rejected. Make sure your post is live before submitting.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleNext}
                disabled={!formData.postUrl.includes('instagram.com/p/') || !formData.hasPosted || !formData.taggedCaption || !formData.taggedPhoto || !formData.isPublic}
                className={`w-full py-5 rounded-pill font-bold text-lg transition-all mt-4 ${
                  formData.postUrl.includes('instagram.com/p/') && formData.hasPosted && formData.taggedCaption && formData.taggedPhoto && formData.isPublic ? 
                  'bg-primary text-white shadow-lg shadow-primary/30' : 
                  'bg-white/5 text-muted cursor-not-allowed'
                }`}
              >
                Next →
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-3xl font-pacifico text-primary">Ready to enter?</h3>
              </div>

              <div className="bg-card rounded-[32px] p-6 flex flex-col gap-6 border border-white/5">
                <div className="text-[10px] font-mono text-primary uppercase tracking-widest font-bold">Your Entry</div>
                
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-muted uppercase">Name:</span>
                    <span className="text-sm font-sans text-white font-bold">{formData.displayName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-muted uppercase">Instagram:</span>
                    <span className="text-sm font-mono text-primary font-bold">@{formData.handle}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-muted uppercase">Post:</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-muted truncate max-w-[150px]">{formData.postUrl}</span>
                      <span className="bg-green/10 text-green text-[8px] font-mono font-bold px-2 py-1 rounded-pill uppercase">Verified format</span>
                    </div>
                  </div>
                  
                  <div className="h-px bg-white/5 my-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-muted uppercase">Tagged @threadzw:</span>
                    <span className="text-[10px] font-mono text-green font-bold uppercase">Confirmed ✓</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-muted uppercase">Post is public:</span>
                    <span className="text-[10px] font-mono text-green font-bold uppercase">Confirmed ✓</span>
                  </div>
                </div>
              </div>

              {/* Prize Reminder */}
              <div className="bg-elevated border border-gold/30 p-6 rounded-[32px] flex flex-col items-center gap-3 text-center">
                <span className="text-5xl">🏆</span>
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-syne font-bold text-gold">Prize: $30 Paynow + Ambassador Badge</p>
                  <p className="text-[10px] font-mono text-muted uppercase tracking-widest">Winner announced end of {currentMonthYear.split(' ')[0]}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.termsAccepted ? 'bg-primary border-primary' : 'border-white/10 group-hover:border-primary/30'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={formData.termsAccepted} 
                      onChange={() => setFormData({ ...formData, termsAccepted: !formData.termsAccepted })} 
                    />
                    {formData.termsAccepted && <Check size={16} className="text-white" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-sans text-white leading-tight">I confirm all information is accurate and my post is live on Instagram</span>
                    <span className="text-[10px] font-mono text-muted/50 uppercase tracking-tighter">False entries will be disqualified</span>
                  </div>
                </label>

                <button 
                  onClick={handleSubmit}
                  disabled={!formData.termsAccepted || isSubmitting}
                  className={`w-full py-5 rounded-pill font-bold text-lg transition-all flex items-center justify-center gap-3 mt-4 ${
                    formData.termsAccepted && !isSubmitting ? 
                    'bg-gradient-to-r from-primary to-purple text-white shadow-lg shadow-primary/30' : 
                    'bg-white/5 text-muted cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      🏆 Submit My Entry
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
