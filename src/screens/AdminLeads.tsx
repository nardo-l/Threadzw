import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Search, 
  MessageCircle, 
  ExternalLink, 
  MoreVertical, 
  CheckCircle, 
  Clock, 
  XCircle,
  BarChart3,
  Users,
  MapPin,
  Tag,
  Store,
  ChevronRight,
  ChevronLeft,
  Instagram,
  Palette,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

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

export const AdminLeads: React.FC = () => {
  const [leads, setLeads] = useState<ShopLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'built'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<ShopLead | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'branding'>('leads');
  
  // Branding state
  const [bannerUrl, setBannerUrl] = useState('');
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    if (activeTab === 'leads') fetchLeads();
    fetchBranding();
  }, [filter, activeTab]);

  const fetchBranding = async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'shop_banner_image_url').single();
    if (data) setBannerUrl(data.value);
  };

  const saveBranding = async () => {
    setSavingBranding(true);
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'shop_banner_image_url', value: bannerUrl });
    
    if (error) toast.error("Failed to save branding");
    else toast.success("Branding updated");
    setSavingBranding(false);
  };

  const fetchLeads = async () => {
    setLoading(true);
    let query = supabase.from('shop_leads').select('*').order('created_at', { ascending: false });
    
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to fetch leads");
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: ShopLead['status']) => {
    const { error } = await supabase
      .from('shop_leads')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Marked as ${status}`);
      fetchLeads();
      if (selectedLead?.id === id) {
        setSelectedLead({ ...selectedLead, status });
      }
    }
  };

  const filteredLeads = leads.filter(l => 
    l.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.town?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    built: leads.filter(l => l.status === 'built').length,
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
                  className="w-full bg-[#111] border border-[#222] rounded-xl p-4 pl-12 text-white focus:border-[#FF2D78] outline-none transition-all"
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
                  {savingBranding ? <div className="spinner-20 border-t-white" /> : <><Save size={18} /> Save Branding</>}
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
              className="fixed top-0 right-0 w-full max-w-[450px] h-full bg-elevated z-[101] shadow-2xl flex flex-col border-l border-white/10"
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
                  <p className="text-primary font-bold text-lg">{selectedLead.contact_name}</p>
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
                  <DetailItem icon={<BarChart3 size={16} />} label="Stock Volume" value={`${selectedLead.product_count} items`} />
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
                      Mark as Built 🏪
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => {
                    const message = `Hi ${selectedLead.contact_name}! I'm Jack from thread. I received your request for ${selectedLead.business_name}. Let's get started!`;
                    window.open(`https://wa.me/${selectedLead.whatsapp_number}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2"
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
        isSelected ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10 hover:border-white/20'
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
          <MapPin size={10} className="text-primary" /> {lead.town}
        </div>
        <div className="flex items-center gap-1">
          <Tag size={10} className="text-primary" /> {lead.category}
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
    <div className="p-2 bg-white/5 rounded-lg text-primary shrink-0 h-fit mt-1">
      {icon}
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{label}</span>
      {isLink ? (
        <a href={link} target="_blank" rel="noreferrer" className="text-sm font-bold text-white flex items-center gap-1 hover:text-primary underline decoration-primary/30">
          {value} <ExternalLink size={10} />
        </a>
      ) : (
        <p className="text-sm font-bold text-white leading-relaxed">{value}</p>
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
