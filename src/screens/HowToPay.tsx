// THREADZW PRICING: $5/month | 3-day trial — do not change without updating all instances
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface HowToPayProps {
  onBack: () => void;
}

export const HowToPay: React.FC<HowToPayProps> = ({ onBack }) => {
  const handleCopyNumber = () => {
    navigator.clipboard.writeText('0789113734');
    toast.success('Number copied ✓');
  };

  const handleSupportClick = () => {
    window.open(
      'https://wa.me/263789113734' +
      '?text=' +
      encodeURIComponent(
        'Hi ThreadZW! I paid my $5 subscription but haven\'t received my unlock code yet. My WhatsApp number is: '
      ),
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col font-sans">
      {/* Top Bar */}
      <div className="h-56 bg-[#0B0B0B] border-b border-[#151515] px-5 flex items-center gap-14 shrink-0">
        <button 
          onClick={onBack}
          className="text-white hover:opacity-85 transition-all text-[22px] flex items-center justify-center cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="text-white font-bold text-lg select-none">How to Pay</span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24 space-y-4">
        
        {/* Header Card */}
        <div className="bg-[#151515] border border-[#2A2A2A] rounded-[20px] p-5 flex items-center gap-14">
          <div className="w-[56px] h-[56px] rounded-full bg-[#C6FF00]/10 border-[1.5px] border-[#C6FF00]/30 flex items-center justify-center shrink-0">
            <span className="text-[28px] leading-none">💸</span>
          </div>
          <div>
            {/* THREADZW PRICING: $5/month | 3-day trial — do not change without updating all instances */}
            <h2 className="text-white font-bold text-lg">Activate your store — $5/month</h2>
            <p className="text-[#A1A1AA] text-sm mt-1 leading-[1.5]">
              Pay $5/month via EcoCash or InnBucks to keep your shop live.
            </p>
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-[#151515] border-[1.5px] border-[#C6FF00] rounded-[20px] p-5">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[#A1A1AA] text-[13px] block">Monthly subscription</span>
              <span className="text-white font-bold text-2xl mt-1 block">$5.00 USD</span>
            </div>
            <div className="text-right">
              <span className="text-[#A1A1AA] text-[10px] uppercase tracking-wider block">Send To</span>
              <span className="text-[#C6FF00] font-bold text-xl monospace mt-1 block">0789 113 734</span>
            </div>
          </div>

          <button
            onClick={handleCopyNumber}
            className="w-full mt-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl h-11 flex items-center justify-center gap-2 text-white font-bold text-sm hover:bg-neutral-850 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>📋</span>
            <span>Copy Number</span>
          </button>
        </div>

        {/* Important Reference Note */}
        <div className="bg-[#FF7A00]/8 border border-[#FF7A00]/20 rounded-2xl p-3.5 px-4 flex gap-3 items-start">
          <span className="text-base mt-[1px]">⚠️</span>
          <p className="text-[#FF7A00] text-sm font-bold leading-relaxed">
            Use your WhatsApp number as the payment reference/reason so we can identify your payment.
          </p>
        </div>

        {/* Method 1: USSD */}
        <div>
          <div className="text-[#A1A1AA] text-[11px] font-bold uppercase tracking-wider mb-2.5">
            Method 1
          </div>

          <div className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-4 flex items-center gap-3 mb-2.5">
            <div className="w-10 h-10 rounded-full bg-[#C6FF00]/8 border border-[#C6FF00]/20 flex items-center justify-center shrink-0">
              <span className="text-[#C6FF00] font-bold text-[11px] font-mono leading-none">*151#</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-[15px]">Via USSD Code</h3>
              <p className="text-[#A1A1AA] text-xs mt-0.5">Works on any phone — no internet needed</p>
            </div>
          </div>

          <div className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-5 space-y-4">
            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">1</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Dial *151#</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Open your phone's dialler and dial *151#</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">2</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Enter your EcoCash PIN</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Type your 4 or 5 digit EcoCash PIN when prompted</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">3</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Select Send Money</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Choose option 2 or find Send Money in the menu</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">4</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Select 'To Registered User'</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Choose this option since ThreadZW has EcoCash registered</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">5</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Enter the number</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Type: 0789 113 734 (ThreadZW payment number)</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">6</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Enter the amount</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Type 5 for $5.00 USD</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">7</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Add your WhatsApp as reference</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">When asked for a reason/note enter your WhatsApp number so we can match your payment</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">8</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Confirm and approve</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Double-check all details then approve the transaction</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">9</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Wait for SMS confirmation</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">You'll receive an SMS from EcoCash confirming the payment. Screenshot and keep it safe.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Method 2: App */}
        <div className="pt-2">
          <div className="text-[#A1A1AA] text-[11px] font-bold uppercase tracking-wider mb-2.5">
            Method 2
          </div>

          <div className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-4 flex items-center gap-3 mb-2.5">
            <div className="w-10 h-10 rounded-full bg-[#C6FF00]/8 border border-[#C6FF00]/20 flex items-center justify-center text-lg shrink-0">
              📱
            </div>
            <div>
              <h3 className="text-white font-bold text-[15px]">Via EcoCash App</h3>
              <p className="text-[#A1A1AA] text-xs mt-0.5">Faster if you have the app</p>
            </div>
          </div>

          <div className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-5 space-y-4">
            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">1</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Open EcoCash App</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Launch the EcoCash app on your phone</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">2</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Go to Transact</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Tap the Transact option on the home screen</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">3</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Tap Send Money</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Select Send Money from the transaction options</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">4</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Enter the number</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Type or select 0789 113 734 as the recipient</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">5</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Enter $5 as the amount</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Type 5 for the $5 monthly subscription fee</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">6</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Add reference</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">In the note or reason field enter your WhatsApp number</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">7</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Confirm and pay</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Review all details carefully then enter your PIN or use biometrics to approve</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-[#0B0B0B] font-bold text-[13px] flex items-center justify-center shrink-0 select-none">8</div>
              <div>
                <h4 className="text-white font-bold text-[14px]">Screenshot confirmation</h4>
                <p className="text-[#A1A1AA] text-[13px] mt-1 leading-[1.5]">Save the payment confirmation — you may need it if there are any issues</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Tips Card */}
        <div className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-5 space-y-3.5">
          <h3 className="text-white font-bold text-base">💡 Important Tips</h3>
          
          <div className="flex gap-2.5 items-start">
            <span className="text-[#C6FF00] font-bold text-base leading-none shrink-0">•</span>
            <p className="text-[#A1A1AA] text-sm leading-[1.5]">
              Always double-check the number 0789 113 734 before confirming — typos cannot be automatically reversed.
            </p>
          </div>

          <div className="flex gap-2.5 items-start">
            <span className="text-[#C6FF00] font-bold text-base leading-none shrink-0">•</span>
            <p className="text-[#A1A1AA] text-sm leading-[1.5]">
              Never share your EcoCash PIN or OTP with anyone, including ThreadZW staff.
            </p>
          </div>

          <div className="flex gap-2.5 items-start">
            <span className="text-[#C6FF00] font-bold text-base leading-none shrink-0">•</span>
            <p className="text-[#A1A1AA] text-sm leading-[1.5]">
              If you send money to the wrong number, call EcoCash support on 114 immediately. Reversals are only possible before withdrawal.
            </p>
          </div>

          <div className="flex gap-2.5 items-start">
            <span className="text-[#C6FF00] font-bold text-base leading-none shrink-0">•</span>
            <p className="text-[#A1A1AA] text-sm leading-[1.5]">
              Payments are usually verified within 2-4 hours during 8am–8pm Zimbabwe time.
            </p>
          </div>

          <div className="flex gap-2.5 items-start">
            <span className="text-[#C6FF00] font-bold text-base leading-none shrink-0">•</span>
            <p className="text-[#A1A1AA] text-sm leading-[1.5]">
              After paying, tap 'I Paid' in the app and enter your WhatsApp number so our team can send your unlock code.
            </p>
          </div>
        </div>

        {/* After Paying Card */}
        <div className="bg-[#22C55E]/6 border border-[#22C55E]/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-[#22C55E] font-bold text-base">✅ After Paying</h3>

          <div className="flex gap-3.5 items-start">
            <div className="w-[22px] h-[22px] rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] font-bold text-xs flex items-center justify-center shrink-0 select-none">1</div>
            <div>
              <h4 className="text-white font-bold text-[14px]">Go to the payment screen</h4>
              <p className="text-[#A1A1AA] text-[13px] mt-0.5 leading-[1.5]">Tap 'Activate Shop' or 'I Paid' in the app</p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="w-[22px] h-[22px] rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] font-bold text-xs flex items-center justify-center shrink-0 select-none">2</div>
            <div>
              <h4 className="text-white font-bold text-[14px]">Enter your WhatsApp number</h4>
              <p className="text-[#A1A1AA] text-[13px] mt-0.5 leading-[1.5]">The same number you used as the payment reference</p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="w-[22px] h-[22px] rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] font-bold text-xs flex items-center justify-center shrink-0 select-none">3</div>
            <div>
              <h4 className="text-white font-bold text-[14px]">Tap 'I Paid'</h4>
              <p className="text-[#A1A1AA] text-[13px] mt-0.5 leading-[1.5]">Our team will verify and send your 6-character unlock code on WhatsApp</p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="w-[22px] h-[22px] rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] font-bold text-xs flex items-center justify-center shrink-0 select-none">4</div>
            <div>
              <h4 className="text-white font-bold text-[14px]">Enter your unlock code</h4>
              <p className="text-[#A1A1AA] text-[13px] mt-0.5 leading-[1.5]">Type the 6-character code in the app to activate your shop</p>
            </div>
          </div>
        </div>

        {/* Support Card */}
        <div className="bg-[#151515] border border-[#2A2A2A] rounded-2xl p-5">
          <h3 className="text-white font-bold text-base">Need help?</h3>
          <p className="text-[#A1A1AA] text-sm mt-1.5 leading-[1.5]">
            If you've paid and haven't received your code after 4 hours contact us on WhatsApp.
          </p>

          <button
            onClick={handleSupportClick}
            className="w-full mt-3.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] transition-all text-white font-bold text-sm h-12 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>💬</span>
            <span>Contact Support on WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};
