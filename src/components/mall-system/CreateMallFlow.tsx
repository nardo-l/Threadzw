import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ArrowRight, Camera, Image as ImageIcon, MapPin, Check, Sparkles, Building, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export const CreateMallFlow: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    town: '',
    description: '',
    bannerUrl: '',
    logoUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [createdMall, setCreatedMall] = useState<any>(null);

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data, error } = await supabase
        .from('malls')
        .insert({
          name: formData.name,
          town: formData.town,
          description: formData.description,
          owner_id: session?.user?.id,
          invite_code: inviteCode
        })
        .select()
        .single();
      
      if (error) throw error;
      setCreatedMall(data);
      setStep(5); // Success step
    } catch (err: any) {
      toast.error('Failed to create mall');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyInvite = () => {
    if (createdMall?.invite_code) {
      navigator.clipboard.writeText(createdMall.invite_code);
      toast.success('Invite code copied!');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F8F8F8] z-[1000] flex flex-col font-sans">
      {/* Header */}
      <header className="px-5 py-6 flex items-center justify-between">
        <button 
          onClick={() => step > 1 && step < 5 ? setStep(step - 1) : navigate('/malls')}
          className="w-10 h-10 rounded-full bg-white border border-[#EFEFEF] flex items-center justify-center text-[#111]"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
           <span className="text-[12px] font-bold text-[#AAA] tracking-widest uppercase">
             {step < 5 ? `Step ${step}/${totalSteps}` : 'Success'}
           </span>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-7 pt-6 pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                 <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                    <Building size={24} />
                 </div>
                 <h1 className="text-[#111] font-bold text-[32px] leading-tight tracking-tight">Name your Collective</h1>
                 <p className="text-[#888] text-[15px] mt-2">Pick a distinctive name that represents your fashion mall.</p>
              </div>
              
              <div className="space-y-2">
                 <input 
                  autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Harare Streetwear Hub"
                  className="w-full bg-transparent border-b-[2.5px] border-[#EFEFEF] py-4 text-[#111] text-[24px] font-bold focus:border-[#C6FF00] outline-none transition-all"
                 />
              </div>
            </motion.div>
          )}

          {step === 2 && (
             <motion.div 
               key="step2"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-8"
             >
                <div>
                  <h1 className="text-[#111] font-bold text-[32px] leading-tight tracking-tight">Where is it located?</h1>
                  <p className="text-[#888] text-[15px] mt-2">Target shoppers in a specific town.</p>
                </div>
                
                <div className="space-y-3">
                   {['Harare', 'Bulawayo', 'Mutare', 'Gweru'].map(town => (
                     <button
                      key={town}
                      onClick={() => setFormData({ ...formData, town })}
                      className={`
                        w-full bg-white border-2 rounded-[22px] p-5 flex items-center justify-between transition-all
                        ${formData.town === town ? 'border-[#C6FF00] bg-[#C6FF00]-50/10' : 'border-[#EFEFEF]'}
                      `}
                     >
                        <div className="flex items-center gap-3">
                           <MapPin size={18} className={formData.town === town ? 'text-[#C6FF00]' : 'text-[#888]'} />
                           <span className="text-[#111] font-bold">{town}</span>
                        </div>
                        {formData.town === town && <Check size={18} className="text-[#C6FF00]" strokeWidth={4} />}
                     </button>
                   ))}
                </div>
             </motion.div>
          )}

          {step === 3 && (
             <motion.div 
               key="step3"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-8"
             >
                <div>
                  <h1 className="text-[#111] font-bold text-[32px] leading-tight tracking-tight">Add more detail</h1>
                  <p className="text-[#888] text-[15px] mt-2">What makes this collective special?</p>
                </div>
                
                <textarea 
                  autoFocus
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your mall..."
                  className="w-full bg-transparent py-4 text-[#111] text-[18px] font-medium outline-none min-h-[140px] resize-none"
                />
             </motion.div>
          )}

          {step === 4 && (
             <motion.div 
               key="step4"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-8"
             >
                <div>
                  <h1 className="text-[#111] font-bold text-[32px] leading-tight tracking-tight">Final appearance</h1>
                  <p className="text-[#888] text-[15px] mt-2">Add a logo and banner to make it professional.</p>
                </div>
                
                <div className="space-y-6">
                   <div className="w-[100px] h-[100px] rounded-[30px] bg-white border-2 border-dashed border-[#EFEFEF] flex flex-col items-center justify-center text-[#CCC] cursor-pointer">
                      <Camera size={24} />
                      <span className="text-[10px] font-bold uppercase mt-1">Logo</span>
                   </div>
                   <div className="w-full aspect-[16/9] rounded-[32px] bg-white border-2 border-dashed border-[#EFEFEF] flex flex-col items-center justify-center text-[#CCC] cursor-pointer">
                      <ImageIcon size={32} />
                      <span className="text-[14px] font-bold uppercase mt-2">Banner Image</span>
                   </div>
                </div>
             </motion.div>
          )}

          {step === 5 && (
             <motion.div 
               key="step5"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex flex-col items-center text-center pt-10"
             >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-8 animate-bounce">
                   <Check size={40} strokeWidth={4} />
                </div>
                <h1 className="text-[#111] font-bold text-[32px] leading-tight mb-2">{formData.name} is Created!</h1>
                <p className="text-[#888] text-[15px]">Your fashion collective is now live on ThreadZW.</p>
                
                <div className="mt-12 w-full bg-white border border-[#EFEFEF] rounded-3xl p-6 shadow-sm">
                   <p className="text-[#888] text-[11px] font-bold uppercase tracking-widest mb-4">Mall Invite Code</p>
                   <div className="flex items-center justify-between bg-[#F8F8F8] rounded-2xl p-4">
                      <span className="text-[#111] font-mono text-[24px] font-black tracking-widest">{createdMall?.invite_code}</span>
                      <button 
                        onClick={copyInvite}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#111] shadow-sm active:scale-90"
                      >
                         <Copy size={18} />
                      </button>
                   </div>
                   <p className="text-[#888] text-[12px] mt-4 leading-relaxed">
                     Share this code with other shop owners in {formData.town} so they can apply to join your mall.
                   </p>
                </div>
                
                <button 
                  onClick={() => navigate(`/mall/${createdMall.id}`)}
                  className="w-full h-14 bg-[#111] text-white rounded-full font-bold text-[16px] mt-12 shadow-xl active:scale-95 transition-all"
                >
                  Enter Mall Dashboard →
                </button>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Continue button */}
      {step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 pb-12 bg-linear-to-t from-[#F8F8F8] to-transparent pointer-events-none flex justify-center">
          <button
            onClick={step === totalSteps ? handleCreate : handleNext}
            disabled={
              loading ||
              (step === 1 && !formData.name) ||
              (step === 2 && !formData.town)
            }
            className={`
              w-full h-14 rounded-full font-bold text-[16px] transition-all pointer-events-auto
              flex items-center justify-center gap-2 active:scale-[0.98]
              ${loading ? 'bg-[#EFEFEF] text-[#AAAAAA]' : 'bg-[#111] text-white shadow-xl shadow-black/10'}
            `}
          >
            {loading ? <div className="w-5 h-5 border-2 border-[#111] border-t-transparent rounded-full animate-spin" /> : 
              step === totalSteps ? 'Create Collective ✨' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  );
};
