// src/components/design-system/screens/Screen15OrdersManagement.tsx

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Home, 
  Tag, 
  PlusCircle, 
  BarChart2, 
  Menu as MenuIcon 
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  orderNumber: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  itemsCount: number;
  totalPrice: string;
  phone: string;
  time: string;
  image: string;
}

interface Screen15OrdersManagementProps {
  onBack?: () => void;
  onViewAllOrders?: () => void;
  onSelectOrder?: (order: OrderItem) => void;
  interactive?: boolean;
}

const ORDERS_LIST: OrderItem[] = [
  {
    id: '1',
    orderNumber: '#1024',
    status: 'Pending',
    itemsCount: 2,
    totalPrice: '$59.98',
    phone: '+263 78 456 7890',
    time: 'Today, 10:30 AM',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '2',
    orderNumber: '#1023',
    status: 'Completed',
    itemsCount: 1,
    totalPrice: '$29.99',
    phone: '+263 71 345 6789',
    time: 'Yesterday, 3:15 PM',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '3',
    orderNumber: '#1022',
    status: 'Pending',
    itemsCount: 3,
    totalPrice: '$89.97',
    phone: '+263 77 234 5678',
    time: 'Yesterday, 11:45 AM',
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '4',
    orderNumber: '#1021',
    status: 'Completed',
    itemsCount: 1,
    totalPrice: '$39.99',
    phone: '+263 73 987 6543',
    time: '2 days ago',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80'
  }
];

export const Screen15OrdersManagement: React.FC<Screen15OrdersManagementProps> = ({
  onBack,
  onViewAllOrders,
  onSelectOrder,
  interactive = false
}) => {
  const [activeTab, setActiveTab] = useState<'All Orders' | 'Pending' | 'Completed' | 'Cancelled'>('All Orders');

  const filteredOrders = ORDERS_LIST.filter(order => {
    if (activeTab === 'All Orders') return true;
    return order.status === activeTab;
  });

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1">
      
      {/* Top Header Bar */}
      <div className="flex items-center gap-2 pt-1 px-1">
        <button
          onClick={onBack}
          className={`p-1 -ml-1 rounded-full text-black hover:bg-zinc-100 transition-colors ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <ArrowLeft size={16} className="stroke-[2.5]" />
        </button>
        <span className="text-xs font-bold text-black tracking-tight">
          Orders
        </span>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-1.5 px-1 py-1 overflow-x-auto no-scrollbar">
        {(['All Orders', 'Pending', 'Completed', 'Cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => interactive && setActiveTab(tab)}
            className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#C6FF00] text-black shadow-2xs'
                : 'text-zinc-500 hover:text-black font-medium'
            } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Headline & Subtext */}
      <div className="py-1 px-1 space-y-0.5">
        <h1 className="text-2xl sm:text-[26px] font-black text-black tracking-tight leading-tight">
          Manage orders<br />easily.
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Track, manage and fulfill customer orders.
        </p>
      </div>

      {/* Order Cards List */}
      <div className="space-y-2 px-1 my-auto py-1">
        {filteredOrders.slice(0, 4).map((order) => (
          <div
            key={order.id}
            onClick={() => {
              if (interactive) {
                toast.info(`Opened details for Order ${order.orderNumber}`);
                onSelectOrder?.(order);
              }
            }}
            className={`w-full bg-white border border-zinc-200 rounded-2xl p-2.5 flex items-center justify-between shadow-2xs transition-all hover:border-zinc-300 ${
              interactive ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {/* Product thumbnail */}
              <div className="w-11 h-11 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 shrink-0 flex items-center justify-center">
                <img
                  src={order.image}
                  alt={order.orderNumber}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Order Info */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-black">
                    {order.orderNumber}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold">
                    {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'} • {order.totalPrice}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-medium">
                  <svg className="w-2.5 h-2.5 text-emerald-600 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  <span>{order.phone}</span>
                </div>

                <p className="text-[9px] text-zinc-400 font-medium">
                  {order.time}
                </p>
              </div>
            </div>

            {/* Status Chip & Trailing Chevron */}
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-tight ${
                  order.status === 'Pending'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200/60'
                    : order.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                    : 'bg-rose-100 text-rose-800 border border-rose-200/60'
                }`}
              >
                {order.status}
              </span>
              <ChevronRight size={14} className="text-zinc-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Primary CTA Button */}
      <div className="pt-2 px-1">
        <button
          onClick={onViewAllOrders}
          className={`w-full bg-[#C6FF00] hover:bg-[#b5eb00] active:scale-[0.98] text-black font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
            interactive ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <span className="font-extrabold tracking-wide">VIEW ALL ORDERS</span>
        </button>
      </div>

      {/* Bottom App Navigation Bar */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between px-3 text-zinc-400">
        <div className="flex flex-col items-center hover:text-black">
          <Home size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <Tag size={16} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <PlusCircle size={17} />
        </div>
        <div className="flex flex-col items-center hover:text-black">
          <BarChart2 size={16} />
        </div>
        <div className="flex flex-col items-center text-black">
          <div className="w-6 h-6 rounded-md bg-[#C6FF00] flex items-center justify-center text-black shadow-2xs">
            <MenuIcon size={14} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

    </div>
  );
};
