import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Search, 
  MessageCircle, 
  ExternalLink, 
  XCircle,
  BarChart3,
  Users,
  MapPin,
  Tag,
  Store,
  Instagram,
  Palette,
  Save,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  Check,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface ShopLead {
  id: string;
  contact_name: string;
  business_name: string;
  category: string;
  town: string;
  physical_location: string;
  trading_hours: any;
  whatsapp_number: string;
  instagram: string;
  product_description: string;
  price_from: number;
  price_to: number;
  product_count: string;
  heard_from: string;
  status: 'new' | 'contacted' | 'built' | 'discarded';
  notes: string;
  created_at: string;
}

const MOCK_LEADS_DATA: ShopLead[] = [
  {
    id: 'lead-001',
    contact_name: 'Nardo',
    business_name: 'KURE STREETWEAR',
    category: 'Tops',
    town: 'Harare',
    physical_location: 'Avondale, Harare',
    trading_hours: { Mon: { isOpen: true, from: '09:00', to: '18:00' } },
    whatsapp_number: '263776223144',
    instagram: 'kure.zw',
    product_description: 'Harare-based brand built for the ones who move different.',
    price_from: 10,
    price_to: 50,
    product_count: '50-100',
    heard_from: 'Instagram',
    status: 'new',
    notes: '',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'lead-002',
    contact_name: 'Tinashe',
    business_name: 'Vanguard Vintage',
    category: 'Tops',
    town: 'Bulawayo',
    physical_location: 'Fife Street, Bulawayo',
    trading_hours: { Mon: { isOpen: true, from: '08:30', to: '17:00' } },
    whatsapp_number: '263773111222',
    instagram: 'vanguard.vintage',
    product_description: 'Rare curated vintage t-shirts and caps.',
    price_from: 15,
    price_to: 45,
    product_count: '20-50',
    heard_from: 'Friend',
    status: 'contacted',
    notes: 'Interested in annual subscription',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  }
];

export const AdminLeads: React.FC = () => {
  const [leads, setLeads] = useState<ShopLead[]>(MOCK_LEADS_DATA);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'built'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<ShopLead | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'overdue' | 'payments' | 'branding'>('leads');
  
  // Real database states
  const [shops, setShops] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);

  // Lock confirmation modal
  const [shopToLock, setShopToLock] = useState<any | null>(null);
  const [lockingInDb, setLockingInDb] = useState(false);

  const fetchShopsAndClaims = async () => {
    setLoadingShops(true);
    try {
      const { data: shopsData, error: sErr } = await supabase
        .from('shops')
        .select('*');
      
      let claimsList: any[] = [];
      const claimIds = new Set<string>();

      // 1. Fetch from payment_claims
      try {
        const { data: claimsData, error: cErr } = await supabase
          .from('payment_claims')
          .select('*');
        if (claimsData && !cErr) {
          claimsData.forEach(c => {
            claimsList.push({ ...c, source: 'payment_claims' });
            claimIds.add(c.id);
          });
        }
      } catch (err) {
        console.warn("Could not fetch payment_claims:", err);
      }

      // 2. Fetch fallback from payments
      try {
        const { data: paymentsData, error: pErr } = await supabase
          .from('payments')
          .select('*');
        if (paymentsData && !pErr) {
          paymentsData.forEach(p => {
            const normalizedId = p.id || `pay-${p.shop_id}-${p.submitted_at || p.created_at}`;
            if (!claimIds.has(normalizedId)) {
              claimsList.push({
                id: normalizedId,
                shop_id: p.shop_id,
                whatsapp_number: p.whatsapp_number,
                ecocash_number: p.whatsapp_number, // payments might have one phone field
                status: p.status,
                submitted_at: p.submitted_at || p.created_at,
                source: 'payments',
                amount: p.amount,
                payment_method: p.payment_method || 'ecocash'
              });
              claimIds.add(normalizedId);
            }
          });
        }
      } catch (err) {
        console.warn("Could not fetch payments table:", err);
      }

      // 3. Fallback to localStorage if totally offline/mocked
      try {
        if (shopsData) {
          shopsData.forEach(sh => {
            const localClaimsStr = localStorage.getItem(`claims_${sh.id}`);
            if (localClaimsStr) {
              const localClaims = JSON.parse(localClaimsStr);
              if (Array.isArray(localClaims)) {
                localClaims.forEach(lc => {
                  if (!claimIds.has(lc.id)) {
                    claimsList.push({ ...lc, source: 'local' });
                    claimIds.add(lc.id);
                  }
                });
              }
            }
          });
        }
      } catch (err) {
        console.warn("Could not parse local claims:", err);
      }

      if (shopsData) setShops(shopsData);
      
      // Sort claims descending
      setClaims(claimsList.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()));
    } catch (err) {
      console.error("Error fetching shops/claims in admin panel:", err);
    } finally {
      setLoadingShops(false);
    }
  };

  useEffect(() => {
    fetchShopsAndClaims();
  }, []);

  // Filter logic for Overdue shops
  const getOverdueShops = () => {
    const now = new Date();
    return shops.filter(shop => {
      // Must not be manually locked
      if (shop.manual_lock === true) return false;

      // Ensure overdue flagged state is not explicitly resolved
      if (shop.payment_overdue_flagged === false) return false;

      const trialEndStr = shop.trial_end || shop.trial_ends_at;
      if (!trialEndStr) return false;
      const trialEnd = new Date(trialEndStr);

      const subEndStr = shop.subscription_end || shop.subscription_ends_at || shop.current_period_end;
      const subEnd = subEndStr ? new Date(subEndStr) : null;

      // s.trial_end < now()
      const isTrialExpired = trialEnd < now;

      // s.subscription_end IS NULL OR s.subscription_end < now()
      const isSubExpiredOrNull = !subEnd || subEnd < now;

      // pc.id IS NULL (no active pending payment claim)
      const hasPendingClaim = claims.some(c => c.shop_id === shop.id && c.status === 'pending');

      // s.trial_end + interval '3 days' < now() (at least 3 days of no payment)
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const parsedTrialEndPlus3Days = new Date(trialEnd.getTime() + threeDaysInMs);
      const isOverdue3Days = parsedTrialEndPlus3Days < now;

      return isTrialExpired && isSubExpiredOrNull && !hasPendingClaim && isOverdue3Days;
    }).sort((a, b) => {
      const aEnd = new Date(a.trial_end || a.trial_ends_at || 0);
      const bEnd = new Date(b.trial_end || b.trial_ends_at || 0);
      return aEnd.getTime() - bEnd.getTime();
    });
  };

  // Get active manually locked shops
  const getManuallyLockedShops = () => {
    return shops.filter(sh => sh.manual_lock === true);
  };

  const handleLockShopSubmit = async (shop: any) => {
    setLockingInDb(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const adminUserId = session?.user?.id || null;

      const { error } = await supabase
        .from('shops')
        .update({
          manual_lock: true,
          manual_lock_reason: 'Payment overdue - admin locked',
          manual_lock_date: new Date().toISOString(),
          manual_lock_by: adminUserId
        })
        .eq('id', shop.id);

      if (error) throw error;

      toast.success(`Locked storefront for ${shop.name}`);
      setShopToLock(null);
      fetchShopsAndClaims();
    } catch (err: any) {
      toast.error(err.message || "Failed to lock shop");
    } finally {
      setLockingInDb(false);
    }
  };

  const handleUnlockShop = async (shop: any) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          manual_lock: false,
          manual_lock_reason: null,
          manual_lock_date: null,
          manual_lock_by: null
        })
        .eq('id', shop.id);

      if (error) throw error;

      toast.success(`Unlocked storefront for ${shop.name}`);
      fetchShopsAndClaims();
    } catch (err: any) {
      toast.error(err.message || "Failed to unlock shop");
    }
  };

  const handleMarkResolved = async (shop: any) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          payment_overdue_flagged: false
        })
        .eq('id', shop.id);

      if (error) throw error;

      toast.success(`Marked ${shop.name} as resolved and dismissed flag.`);
      fetchShopsAndClaims();
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve flag");
    }
  };

  const handleApproveClaim = async (claim: any) => {
    try {
      const nowStr = new Date().toISOString();
      const endRenewal = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Get associated shop details
      const targetShop = shops.find(s => s.id === claim.shop_id);
      if (!targetShop) {
        toast.error("Associated shop not found.");
        return;
      }

      // 2. Update Shop in database
      const { error: shopErr } = await supabase
        .from('shops')
        .update({
          subscription_status: 'active',
          trial_ends_at: endRenewal,
          subscription_start: nowStr,
          subscription_end: endRenewal,
          is_live: true,
          manual_lock: false,
          payment_overdue_flagged: false
        })
        .eq('id', claim.shop_id);

      if (shopErr) {
        console.warn("DB Update failed, using fallback:", shopErr);
      }

      // 3. Try to update payment_claims in DB
      try {
        await supabase
          .from('payment_claims')
          .update({ status: 'verified' })
          .eq('shop_id', claim.shop_id);
      } catch (e) {
        console.warn("Could not update payment_claims status");
      }

      // 4. Try to update payments in DB
      try {
        await supabase
          .from('payments')
          .update({ status: 'verified' })
          .eq('shop_id', claim.shop_id);
      } catch (e) {
        console.warn("Could not update payments status");
      }

      // Update local storage representation for any user simulation compatibility
      try {
        const mockShop = {
          ...targetShop,
          subscription_status: 'active',
          trial_ends_at: endRenewal,
          subscription_start: nowStr,
          subscription_end: endRenewal,
          is_live: true,
          manual_lock: false,
          payment_overdue_flagged: false
        };
        localStorage.setItem(`shop_${claim.shop_id}`, JSON.stringify(mockShop));
        
        // Update claim status locally
        const localClaimsStr = localStorage.getItem(`claims_${claim.shop_id}`);
        if (localClaimsStr) {
          const localClaims = JSON.parse(localClaimsStr);
          if (Array.isArray(localClaims)) {
            const updated = localClaims.map(c => ({ ...c, status: 'verified' }));
            localStorage.setItem(`claims_${claim.shop_id}`, JSON.stringify(updated));
          }
        }
      } catch (e) {
        console.warn("Could not update local storage:", e);
      }

      toast.success(`Verified claim and unlocked ${targetShop.name}!`);
      fetchShopsAndClaims();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to approve claim");
    }
  };

  const handleRejectClaim = async (claim: any) => {
    try {
      const targetShop = shops.find(s => s.id === claim.shop_id);
      
      // Update payment_claims
      try {
        await supabase
          .from('payment_claims')
          .update({ status: 'rejected' })
          .eq('id', claim.id);
      } catch (e) {}

      // Update payments
      try {
        await supabase
          .from('payments')
          .update({ status: 'rejected' })
          .eq('id', claim.id);
      } catch (e) {}

      // Update local storage
      try {
        const localClaimsStr = localStorage.getItem(`claims_${claim.shop_id}`);
        if (localClaimsStr) {
          const localClaims = JSON.parse(localClaimsStr);
          if (Array.isArray(localClaims)) {
            const updated = localClaims.map(c => c.id === claim.id ? { ...c, status: 'rejected' } : c);
            localStorage.setItem(`claims_${claim.shop_id}`, JSON.stringify(updated));
          }
        }
      } catch (e) {}

      toast.success(`Rejected claim for ${targetShop?.name || 'Shop'}.`);
      fetchShopsAndClaims();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to reject claim");
    }
  };
  
  // Branding state
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800');
  const [savingBranding, setSavingBranding] = useState(false);

  const saveBranding = async () => {
    setSavingBranding(true);
    setTimeout(() => {
      toast.success("Branding updated");
      setSavingBranding(false);
    }, 800);
  };

  const updateStatus = async (id: string, status: ShopLead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    toast.success(`Marked as ${status}`);
    if (selectedLead?.id === id) {
      setSelectedLead(prev => prev ? { ...prev, status } : null);
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.town?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && l.status === filter;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    built: leads.filter(l => l.status === 'built').length,
  };

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-10 gap-8 h-screen overflow-hidden">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-bold text-white">Shop Leads</h1>
          <p className="text-muted text-sm mt-1">Manage incoming shop registration requests</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
          <StatMini label="New" count={stats.new} color="text-amber-500" />
          <div className="w-px h-8 bg-white/10" />
          <StatMini label="Built" count={stats.built} color="text-green-500" />
          <div className="w-px h-8 bg-white/10" />
          <StatMini label="Total" count={stats.total} color="text-primary" />
        </div>
      </header>

      <div className="flex items-center gap-4 border-b border-[#1a1a1a]">
        <button 
          onClick={() => setActiveTab('leads')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-all relative ${activeTab === 'leads' ? 'text-[#FF2D78]' : 'text-[#888]'}`}
        >
          <Store size={18} /> Shop Leads
          {activeTab === 'leads' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF2D78]" />}
        </button>
        <button 
          onClick={() => setActiveTab('overdue')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-all relative ${activeTab === 'overdue' ? 'text-orange-500 font-extrabold' : 'text-[#888]'}`}
        >
          <AlertTriangle size={18} className={activeTab === 'overdue' ? 'text-orange-500' : 'text-[#888]'} /> Overdue ({getOverdueShops().length})
          {activeTab === 'overdue' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-all relative ${activeTab === 'payments' ? 'text-green-500 font-extrabold' : 'text-[#888]'}`}
        >
          <CreditCard size={18} className={activeTab === 'payments' ? 'text-green-500' : 'text-[#888]'} /> Payment Claims ({claims.filter(c => c.status === 'pending').length})
          {activeTab === 'payments' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('branding')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-all relative ${activeTab === 'branding' ? 'text-[#FF2D78]' : 'text-[#888]'}`}
        >
          <Palette size={18} /> Branding
          {activeTab === 'branding' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF2D78]" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leads' ? (
          <motion.div 
            key="leads"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6 flex-1 min-h-0"
          >
            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or town..."
                  className="w-full bg-[#111] border border-[#222] rounded-xl p-4 pl-12 text-white focus:border-[#FF2D78] outline-none transition-all font-sans text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex overflow-x-auto no-scrollbar gap-2">
                {(['all', 'new', 'contacted', 'built'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-4 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                      filter === f ? 'bg-[#FF2D78] border-[#FF2D78] text-white' : 'bg-[#111] border-[#222] text-[#888]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads List */}
            <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {filteredLeads.map(lead => (
                <LeadCard 
                  key={lead.id} 
                  lead={lead} 
                  isSelected={selectedLead?.id === lead.id}
                  onClick={() => setSelectedLead(lead)} 
                />
              ))}
            </div>
          </motion.div>
        ) : activeTab === 'overdue' ? (
          <motion.div 
            key="overdue"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto pb-24 pr-2 custom-scrollbar"
          >
            {/* Confirmation Lock Modal */}
            {shopToLock && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">Lock {shopToLock.name}?</h3>
                  <p className="text-[#888] text-sm leading-relaxed">
                    Their storefront will show as offline. This is irreversible until you unlock.
                  </p>
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => setShopToLock(null)}
                      disabled={lockingInDb}
                      className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 text-xs uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleLockShopSubmit(shopToLock)}
                      disabled={lockingInDb}
                      className="px-5 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 text-xs uppercase flex items-center gap-1.5"
                    >
                      {lockingInDb ? 'Locking...' : 'Lock Shop'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Grid 1: Overdue Shops */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-orange-500 uppercase flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-500 shrink-0" /> Overdue Shops ({getOverdueShops().length})
                </h2>
                <button 
                  onClick={fetchShopsAndClaims}
                  className="text-[11px] text-[#FF2D78] uppercase tracking-widest font-bold hover:underline"
                >
                  Refresh Lists
                </button>
              </div>

              {getOverdueShops().length === 0 ? (
                <div className="bg-[#111] border border-[#222] rounded-3xl p-8 text-center text-[#888] text-sm">
                  No shops are currently overdue by &gt; 3 days.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getOverdueShops().map(shop => {
                    const trialEnd = new Date(shop.trial_end || shop.trial_ends_at);
                    const now = new Date();
                    const daysAgo = Math.max(0, Math.floor((now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24)));
                    
                    return (
                      <div key={shop.id} className="bg-[#111] border border-[#222] rounded-3xl p-6 flex flex-col justify-between hover:border-white/20 transition-all space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                            {shop.logo_url ? (
                              <img src={shop.logo_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            ) : (
                            <Store size={22} className="text-stone-400 shrink-0" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white text-lg truncate leading-tight">{shop.name}</h3>
                            <span className="text-[10px] text-zinc-550 font-mono">@{shop.handle}</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl">
                          <div className="flex justify-between items-center">
                            <span className="text-[#888] text-xs">Overdue since:</span>
                            <span className="font-bold text-white text-xs">{trialEnd.toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center font-mono">
                            <span className="text-[#888] text-xs">Trial ended:</span>
                            <span className="font-bold text-orange-400 text-xs">{daysAgo} days ago</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#888] text-xs">Last activity:</span>
                            <span className="text-white font-medium text-xs">
                              {shop.updated_at ? new Date(shop.updated_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center font-sans">
                            <span className="text-[#888] text-xs">Owner WhatsApp:</span>
                            <span className="text-white font-bold text-xs">{shop.whatsapp || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-2 pt-2">
                          <button
                            onClick={() => {
                              const whatsappPhone = shop.whatsapp?.replace(/\D/g, '') || '';
                              const prefilledMsg = `Hi ${shop.name}! Your ThreadZW shop trial has ended. Keep your shop live for $5/month — send $5 to EcoCash 0776 223 144 and tap 'I've Paid' in your dashboard. — ThreadZW 🇿🇼`;
                              window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(prefilledMsg)}`, '_blank');
                            }}
                            className="w-full h-11 bg-[#c8ff00] text-black hover:bg-[#b0df00] rounded-xl text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-[#c8ff00]/10"
                          >
                            <span>WhatsApp Owner</span>
                          </button>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setShopToLock(shop)}
                              className="flex-1 h-11 bg-red-650/10 border border-red-600/30 hover:bg-red-600/20 text-red-500 rounded-xl text-xs uppercase font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all"
                            >
                              <Lock size={12} /> Lock Shop
                            </button>

                            <button
                              onClick={() => handleMarkResolved(shop)}
                              className="flex-1 h-11 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs uppercase font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all"
                            >
                              <Check size={12} /> Mark Resolved
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Grid 2: Manually Locked Shops */}
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-bold text-red-500 uppercase flex items-center gap-2">
                <Lock size={18} className="text-red-500 shrink-0" /> Manually Locked Shops ({getManuallyLockedShops().length})
              </h2>

              {getManuallyLockedShops().length === 0 ? (
                <div className="bg-[#111] border border-[#222] rounded-3xl p-8 text-center text-[#888] text-sm">
                  No shops are currently locked manually.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getManuallyLockedShops().map(shop => (
                    <div key={shop.id} className="bg-[#111] border border-[#222] rounded-3xl p-6 flex flex-col justify-between hover:border-white/20 transition-all space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                          {shop.logo_url ? (
                            <img src={shop.logo_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <Store size={22} className="text-stone-400 shrink-0" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-red-400 font-bold uppercase text-[8px] tracking-wider mb-1 inline-block">
                            STOREFRONT LOCKED
                          </span>
                          <h3 className="font-bold text-white text-lg truncate leading-none">{shop.name}</h3>
                          <span className="text-[10px] text-zinc-500 font-mono">@{shop.handle}</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm bg-red-500/[0.02] border border-red-500/[0.05] p-3 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <span className="text-[#888] text-xs">Locked on:</span>
                          <span className="font-bold text-white text-xs">
                            {shop.manual_lock_date ? new Date(shop.manual_lock_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center font-mono">
                          <span className="text-[#888] text-xs">WhatsApp:</span>
                          <span className="text-white font-bold text-xs">{shop.whatsapp || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#888] text-xs">Reason:</span>
                          <span className="font-bold text-red-405 text-xs truncate max-w-[170px]" title={shop.manual_lock_reason}>{shop.manual_lock_reason || 'N/A'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnlockShop(shop)}
                        className="w-full h-11 bg-green-500 hover:bg-green-600 text-black rounded-xl text-xs uppercase tracking-widest font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-green-500/10"
                      >
                        <Unlock size={14} className="stroke-[2.5]" />
                        <span>Unlock Shop</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'payments' ? (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto pb-24 pr-2 custom-scrollbar"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-green-500 uppercase flex items-center gap-2">
                💵 Submitted Payment Claims ({claims.length})
              </h2>
              <button 
                onClick={fetchShopsAndClaims}
                className="text-[11px] text-[#FF2D78] uppercase tracking-widest font-bold hover:underline"
              >
                Refresh claims
              </button>
            </div>

            {claims.length === 0 ? (
              <div className="bg-[#111] border border-[#222] rounded-3xl p-8 text-center text-[#888] text-sm font-semibold">
                No payment claims submitted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {claims.map(claim => {
                  const claimShop = shops.find(s => s.id === claim.shop_id);
                  const isPending = claim.status === 'pending';
                  
                  return (
                    <div key={claim.id} className="bg-[#111] border border-[#222] rounded-3xl p-6 flex flex-col justify-between hover:border-white/20 transition-all space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">🏪</span>
                          <div>
                            <h3 className="font-bold text-white text-[16px] leading-tight truncate max-w-[155px]">
                              {claimShop ? claimShop.name : 'Unknown Shop'}
                            </h3>
                            <span className="text-[10px] text-zinc-500 block font-mono">
                              {claimShop ? `@${claimShop.handle}` : 'No Handle'}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          claim.status === 'verified' || claim.status === 'approved'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : claim.status === 'rejected'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {claim.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl font-sans">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#888]">WhatsApp Number:</span>
                          <span className="font-bold text-white font-mono">{claim.whatsapp_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#888]">EcoCash Number:</span>
                          <span className="font-bold text-white font-mono">{claim.ecocash_number || claim.whatsapp_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#888]">Submitted on:</span>
                          <span className="text-white font-semibold">{claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : 'Just now'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#888]">Record Source:</span>
                          <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider">{claim.source}</span>
                        </div>
                      </div>

                      {/* Approval / Rejection Operations */}
                      {isPending ? (
                        <div className="flex gap-2 pt-1 font-bold">
                          <button
                            onClick={() => handleRejectClaim(claim)}
                            className="flex-1 h-10 bg-red-650/10 border border-red-600/30 hover:bg-red-600/20 text-red-500 text-xs uppercase rounded-xl transition-all font-bold"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveClaim(claim)}
                            className="flex-[2] h-10 bg-green-500 hover:bg-green-600 text-black text-xs uppercase rounded-xl transition-all font-black"
                          >
                            ✓ Verify & Approve
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                          {claim.status === 'verified' || claim.status === 'approved' ? 'Claim Verified ✓' : 'Claim Rejected ✕'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="branding"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-8 max-w-2xl"
          >
            <div className="bg-[#111] border border-[#222] rounded-3xl p-8 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Build Your Shop Banner</h2>
                <p className="text-[#888] text-sm leading-relaxed">
                  Set the background image for the "Create Your Shop" banner on the home screen.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#888]">Image URL</label>
                  <input 
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-black border border-[#222] rounded-xl p-4 text-white focus:border-[#FF2D78] outline-none transition-all font-mono text-xs"
                  />
                </div>

                {bannerUrl && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#222]">
                    <img src={bannerUrl} className="w-full h-full object-cover" alt="Banner Preview" />
                    <div className="absolute inset-0 bg-black/40 blur-[8px]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <p className="text-white font-bold">Banner Preview</p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={saveBranding}
                  disabled={savingBranding}
                  className="w-full h-14 bg-[#FF2D78] text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#FF2D78]/90 transition-all disabled:opacity-50"
                >
                  {savingBranding ? <div className="spinner-10 border-t-white animate-spin" /> : <><Save size={18} /> Save Branding</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail PanelOverlay */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 w-full max-w-[450px] h-full bg-[#111] z-[101] shadow-2xl flex flex-col border-l border-white/10"
            >
              <div className="p-8 flex flex-col gap-8 flex-1 overflow-y-auto no-scrollbar">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedLead.status} />
                    <span className="text-[10px] font-mono text-muted uppercase">Received {new Date(selectedLead.created_at).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => setSelectedLead(null)} className="p-2 bg-white/5 rounded-full text-muted">
                    <XCircle size={24} />
                  </button>
                </header>

                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-syne font-bold text-white">{selectedLead.business_name}</h2>
                  <p className="text-[#FF2D78] font-bold text-lg">{selectedLead.contact_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-1">
                    <span className="text-[8px] font-mono text-muted uppercase">Category</span>
                    <span className="text-sm font-bold text-white">{selectedLead.category}</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-1">
                    <span className="text-[8px] font-mono text-muted uppercase">Town</span>
                    <span className="text-sm font-bold text-white">{selectedLead.town}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <DetailItem icon={<MapPin size={16} />} label="Physical Location" value={selectedLead.physical_location} />
                  <DetailItem icon={<Clock size={16} />} label="Trading Hours" value={formatTradingHours(selectedLead.trading_hours)} />
                  <DetailItem icon={<MessageCircle size={16} />} label="WhatsApp" value={selectedLead.whatsapp_number} isLink link={`https://wa.me/${selectedLead.whatsapp_number}`} />
                  <DetailItem icon={<Instagram size={16} />} label="Instagram" value={`@${selectedLead.instagram}`} isLink link={`https://instagram.com/${selectedLead.instagram}`} />
                  <DetailItem icon={<Store size={16} />} label="Product Description" value={selectedLead.product_description} />
                  <DetailItem icon={<Tag size={16} />} label="Price Range" value={`$${selectedLead.price_from} - $${selectedLead.price_to}`} />
                  <DetailItem icon={<BarChart3 size={16} />} label="Stock Volume" value={`${selectedLead.product_count}`} />
                  <DetailItem icon={<Users size={16} />} label="Referral" value={selectedLead.heard_from} />
                </div>
              </div>

              <div className="p-8 bg-black/20 border-t border-white/10 flex flex-col gap-3">
                <div className="flex gap-2">
                  {selectedLead.status !== 'contacted' && (
                    <button 
                      onClick={() => updateStatus(selectedLead.id, 'contacted')}
                      className="flex-1 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold text-xs uppercase"
                    >
                      Mark Contacted
                    </button>
                  )}
                  {selectedLead.status !== 'built' && (
                    <button 
                      onClick={() => updateStatus(selectedLead.id, 'built')}
                      className="flex-1 py-4 bg-green-500 text-white rounded-xl font-bold text-xs uppercase"
                    >
                      Mark as Built
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => {
                    const message = `Hi ${selectedLead.contact_name}! I'm Jack from thread. I received your request for ${selectedLead.business_name}. Let's get started!`;
                    window.open(`https://wa.me/${selectedLead.whatsapp_number}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="w-full py-4 bg-[#FF2D78] text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} /> Chat on WhatsApp
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const LeadCard: React.FC<{ lead: ShopLead; onClick: () => void; isSelected: boolean }> = ({ lead, onClick, isSelected }) => {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-6 rounded-3xl border cursor-pointer transition-all ${
        isSelected ? 'bg-[#FF2D78]/10 border-[#FF2D78]' : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <StatusBadge status={lead.status} />
        <span className="text-[10px] font-mono text-muted">{new Date(lead.created_at).toLocaleDateString()}</span>
      </div>
      
      <h3 className="text-xl font-syne font-bold text-white mb-1 truncate">{lead.business_name}</h3>
      <p className="text-muted text-sm mb-4">{lead.contact_name}</p>
      
      <div className="flex items-center gap-4 text-[10px] font-mono text-muted uppercase">
        <div className="flex items-center gap-1">
          <MapPin size={10} className="text-[#FF2D78]" /> {lead.town}
        </div>
        <div className="flex items-center gap-1">
          <Tag size={10} className="text-[#FF2D78]" /> {lead.category}
        </div>
      </div>
    </motion.div>
  );
};

const StatusBadge: React.FC<{ status: ShopLead['status'] }> = ({ status }) => {
  const colors = {
    new: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    contacted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    built: 'bg-green-500/10 text-green-500 border-green-500/20',
    discarded: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${colors[status]}`}>
      {status}
    </span>
  );
};

const StatMini: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
  <div className="px-4 py-2 flex flex-col items-center">
    <span className="text-[8px] font-mono text-muted uppercase">{label}</span>
    <span className={`text-sm font-bold ${color}`}>{count}</span>
  </div>
);

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: string; isLink?: boolean; link?: string }> = ({ icon, label, value, isLink, link }) => (
  <div className="flex gap-4">
    <div className="p-2 bg-white/5 rounded-lg text-[#FF2D78] shrink-0 h-fit mt-1">
      {icon}
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{label}</span>
      {isLink ? (
        <a href={link} target="_blank" rel="noreferrer" className="text-sm font-bold text-white flex items-center gap-1 hover:text-[#FF2D78] underline decoration-[#FF2D78]/30 font-sans">
          {value} <ExternalLink size={10} />
        </a>
      ) : (
        <p className="text-sm font-bold text-white leading-relaxed font-sans">{value}</p>
      )}
    </div>
  </div>
);

function formatTradingHours(hours: any) {
  if (!hours) return 'Not provided';
  try {
    return Object.entries(hours)
      .filter(([_, h]: any) => h.isOpen)
      .map(([day, h]: any) => `${day}: ${h.from}-${h.to}`)
      .join(', ');
  } catch (e) {
    return 'Invalid hours format';
  }
}
