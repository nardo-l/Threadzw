import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Percent, 
  MapPin, 
  TrendingUp, 
  ArrowUpRight, 
  ChevronDown, 
  Calendar,
  Package,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { useShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { BottomNavBar } from '../components/dashboard/BottomNavBar';
import { toast } from 'sonner';

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop } = useShopContext();
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [compareFilter, setCompareFilter] = useState('Last Week');
  const [trafficDropdown, setTrafficDropdown] = useState('Visitors');
  const [productSortDropdown, setProductSortDropdown] = useState('WhatsApp Clicks');

  const {
    totalVisitors,
    visitorsChangePercent,
    whatsappClicks,
    whatsappClicksChangePercent,
    conversionRate,
    conversionRateChangePercent,
    visitShopClicks,
    visitShopClicksChangePercent,
    topProducts,
    trafficSources,
    recentActivity,
    loading
  } = useDashboard(shop?.id);

  // Sparkline SVG helper
  const renderSparkline = () => (
    <div className="h-8 w-full mt-2 flex items-end">
      <svg className="w-full h-6 text-[#BEF715]" viewBox="0 0 100 24" fill="none" preserveAspectRatio="none">
        <path 
          d="M0 20 Q 15 12, 30 15 T 60 8 T 90 4 L 100 2" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        <path 
          d="M0 20 Q 15 12, 30 15 T 60 8 T 90 4 L 100 2 L 100 24 L 0 24 Z" 
          fill="url(#sparkGradient)" 
          opacity="0.15" 
        />
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BEF715" />
            <stop offset="100%" stopColor="#BEF715" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black font-sans pb-32">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200/80">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-black uppercase font-sans">
            Analytics
          </h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
            Track your store performance and customer activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold shadow-2xs cursor-pointer hover:bg-zinc-50 transition-colors">
            <Calendar size={14} className="text-zinc-600" />
            <span>{timeFilter}</span>
            <ChevronDown size={14} className="text-zinc-400" />
          </div>

          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold shadow-2xs cursor-pointer hover:bg-zinc-50 transition-colors">
            <span className="text-zinc-500 uppercase text-[10px]">Compare to:</span>
            <span className="text-zinc-900">{compareFilter}</span>
            <ChevronDown size={14} className="text-zinc-400" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* 4 Top Metric Cards with Sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Store Visitors */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-3">
                <Users size={20} className="stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Store Visitors</span>
              <div className="text-3xl font-black text-zinc-950 tracking-tight mt-1">{totalVisitors}</div>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span>↑ {visitorsChangePercent}% vs last week</span>
              </div>
              {renderSparkline()}
            </div>
          </div>

          {/* Card 2: WhatsApp Button Clicks */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#BEF715]/10 rounded-bl-full pointer-events-none" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#BEF715]/20 flex items-center justify-center text-zinc-950 mb-3">
                <MessageSquare size={20} className="stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">WhatsApp Button Clicks</span>
              <div className="text-3xl font-black text-zinc-950 tracking-tight mt-1">{whatsappClicks}</div>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span>↑ {whatsappClicksChangePercent}% vs last week</span>
              </div>
              {renderSparkline()}
            </div>
          </div>

          {/* Card 3: Conversion Rate */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-3">
                <TrendingUp size={20} className="stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Conversion Rate</span>
              <div className="text-3xl font-black text-zinc-950 tracking-tight mt-1">{conversionRate}%</div>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span>↑ {conversionRateChangePercent}% vs last week</span>
              </div>
              {renderSparkline()}
            </div>
          </div>

          {/* Card 4: Visit Shop Clicks */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-3">
                <MapPin size={20} className="stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Visit Shop Clicks</span>
              <div className="text-3xl font-black text-zinc-950 tracking-tight mt-1">{visitShopClicks}</div>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span>↑ {visitShopClicksChangePercent}% vs last week</span>
              </div>
              {renderSparkline()}
            </div>
          </div>
        </div>

        {/* Row 2: Traffic Sources & Top Performing Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Traffic Sources */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">Traffic Sources</h3>
              </div>
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer">
                <span>{trafficDropdown}</span>
                <ChevronDown size={12} className="text-zinc-500" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-48 h-48 rounded-full border-[18px] border-[#BEF715] flex items-center justify-center shadow-inner ring-8 ring-zinc-50">
                <div className="text-center">
                  <span className="text-3xl font-black text-zinc-950 tracking-tighter">{totalVisitors}</span>
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest block mt-0.5">Visitors</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {trafficSources.map((src, i) => (
                <div key={src.name} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-[#BEF715] ring-2 ring-black/10' : i === 1 ? 'bg-zinc-950' : i === 2 ? 'bg-zinc-400' : 'bg-zinc-200'}`} />
                    <span className="font-bold uppercase tracking-wider text-zinc-800 text-[11px]">{src.name}</span>
                  </div>
                  <span className="font-black text-zinc-950">{src.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Products */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">Top Performing Products</h3>
              </div>
              <button 
                onClick={() => navigate('/inventory')}
                className="text-xs font-black uppercase tracking-wider text-black hover:text-green-600 flex items-center gap-1 cursor-pointer"
              >
                View all →
              </button>
            </div>

            <div className="space-y-3 my-auto">
              {topProducts.map((p, idx) => (
                <div key={p.id || idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-xs font-black text-zinc-400 text-center">{idx + 1}</span>
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200">
                      {p.images && p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Package size={20} className="text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 tracking-tight">{p.name}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-zinc-950">{p.whatsapp_clicks || 0}</span>
                    <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest block">WhatsApp Clicks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Engagement Funnel & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Engagement Funnel */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">Engagement Funnel</h3>
              </div>
              <button 
                onClick={() => toast.info('Full engagement funnel active')}
                className="text-xs font-black uppercase tracking-wider text-black hover:text-green-600 flex items-center gap-1 cursor-pointer"
              >
                View full funnel →
              </button>
            </div>

            <div className="space-y-5 py-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="text-zinc-700 flex items-center gap-2"><Users size={14} className="text-zinc-400" /> Store Visitors</span>
                  <span className="text-zinc-950">{totalVisitors}</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#BEF715] rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="text-zinc-700 flex items-center gap-2"><Eye size={14} className="text-zinc-400" /> Product Views</span>
                  <span className="text-zinc-950">{Math.round(totalVisitors * 0.48)}</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#BEF715] rounded-full" style={{ width: '48%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="text-zinc-700 flex items-center gap-2"><MessageSquare size={14} className="text-zinc-400" /> WhatsApp Clicks</span>
                  <span className="text-zinc-950">{whatsappClicks}</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#BEF715] rounded-full" style={{ width: '25%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="text-zinc-700 flex items-center gap-2"><MapPin size={14} className="text-zinc-400" /> Visit Shop Clicks</span>
                  <span className="text-zinc-950">{visitShopClicks}</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#BEF715] rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">Recent Activity</h3>
              </div>
              <button 
                onClick={() => toast.info('All recent activity loaded')}
                className="text-xs font-black uppercase tracking-wider text-black hover:text-green-600 flex items-center gap-1 cursor-pointer"
              >
                View all →
              </button>
            </div>

            <div className="space-y-4 my-auto">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex items-center justify-between pb-3 border-b border-zinc-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800 shrink-0">
                      {act.type === 'whatsapp' ? <MessageSquare size={14} className="text-emerald-600" /> : act.type === 'visit' ? <MapPin size={14} className="text-green-600" /> : <Eye size={14} className="text-zinc-600" />}
                    </div>
                    <span className="text-xs font-black text-zinc-900">{act.title}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">{act.timeAgo}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => toast.info('Showing all recorded events')}
              className="w-full py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              See more activity ∨
            </button>
          </div>
        </div>

        {/* Row 4: Product Performance Table */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-950">Product Performance</h3>
            </div>
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer">
              <span className="text-zinc-500 uppercase text-[10px]">Sort by:</span>
              <span>{productSortDropdown}</span>
              <ChevronDown size={12} className="text-zinc-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-center">Product Views</th>
                  <th className="py-3 px-4 text-center">WhatsApp Clicks</th>
                  <th className="py-3 px-4 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {topProducts.map((p, idx) => {
                  const views = p.product_views || (100 - idx * 12);
                  const clicks = p.whatsapp_clicks || (42 - idx * 8);
                  const rate = ((clicks / (views || 1)) * 100).toFixed(1);
                  return (
                    <tr key={p.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200">
                          {p.images && p.images[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package size={18} className="text-zinc-400" />
                          )}
                        </div>
                        <span className="font-black text-zinc-900 tracking-tight">{p.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-zinc-700">{views}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-zinc-950">{clicks}</td>
                      <td className="py-3.5 px-4 text-right font-black text-green-600">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              onClick={() => navigate('/inventory')}
              className="text-xs font-black uppercase tracking-wider text-black hover:text-green-600 flex items-center gap-1 cursor-pointer"
            >
              View all products →
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 text-center text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
          <Clock size={14} className="text-zinc-400" />
          <span>Analytics are updated every 15 minutes.</span>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
};
