// src/components/design-system/screens/Screen16CarSalesHome.tsx

import React, { useState } from 'react';
import { 
  Menu as MenuIcon, 
  ShoppingBag, 
  Search, 
  Car, 
  Truck, 
  PlusCircle, 
  Heart, 
  User, 
  Fuel, 
  Settings2,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface VehicleItem {
  id: string;
  name: string;
  year: number;
  price: string;
  fuel: string;
  transmission: string;
  image: string;
  category: 'suv' | 'sedan' | 'hatchback' | 'truck';
}

interface Screen16CarSalesHomeProps {
  onSelectVehicle?: (vehicle: VehicleItem) => void;
  onChatWhatsApp?: () => void;
  interactive?: boolean;
}

const VEHICLES: VehicleItem[] = [
  {
    id: '1',
    name: 'Toyota Hilux 2022',
    year: 2022,
    price: '$28,500',
    fuel: 'Diesel',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=400&q=80',
    category: 'truck'
  },
  {
    id: '2',
    name: 'BMW 3 Series 2019',
    year: 2019,
    price: '$22,000',
    fuel: 'Petrol',
    transmission: 'Automatic',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=400&q=80',
    category: 'sedan'
  }
];

export const Screen16CarSalesHome: React.FC<Screen16CarSalesHomeProps> = ({
  onSelectVehicle,
  onChatWhatsApp,
  interactive = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'suv' | 'sedan' | 'hatchback' | 'truck'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'cars' | 'sell' | 'favorites' | 'profile'>('home');

  const handleWhatsApp = () => {
    toast.success('Opening WhatsApp to chat with Auto Vault Motors dealership...');
    onChatWhatsApp?.();
  };

  return (
    <div className="flex-1 flex flex-col justify-between select-none font-sans text-black -mx-1">
      
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between pt-1 px-1">
        <button 
          className={`p-1 text-black hover:bg-zinc-100 rounded-lg transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => interactive && toast.info('Opened Dealership Menu')}
        >
          <MenuIcon size={18} className="stroke-[2.5]" />
        </button>

        {/* Center Logo */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-black tracking-widest text-black uppercase leading-none">
            AUTO VAULT
          </span>
          <span className="text-[7px] font-extrabold tracking-wider text-zinc-500 uppercase mt-0.5">
            MOTORS
          </span>
        </div>

        <button 
          className={`p-1 text-black hover:bg-zinc-100 rounded-lg transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => interactive && toast.info('Viewing Inquiries Cart')}
        >
          <ShoppingBag size={18} className="stroke-[2]" />
        </button>
      </div>

      {/* 2. Hero Vehicle Banner */}
      <div className="px-1 pt-1.5 pb-1">
        <div className="w-full h-36 rounded-2xl overflow-hidden relative shadow-sm bg-black">
          {/* Background SUV photo */}
          <img
            src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80"
            alt="Auto Vault Dealership Hero"
            className="w-full h-full object-cover opacity-85"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Dark Vignette Overlay for Typography Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Hero Content */}
          <div className="absolute inset-x-3 bottom-3 text-white space-y-1.5 z-10">
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight tracking-tight text-white drop-shadow-sm">
                Quality Cars.<br />Trusted Deals.
              </h2>
              <p className="text-[10px] text-zinc-300 font-medium mt-0.5">
                Find your next ride.
              </p>
            </div>

            {/* Lime Chat on WhatsApp Button */}
            <div>
              <button
                onClick={handleWhatsApp}
                className={`inline-flex items-center gap-1.5 bg-[#C6FF00] hover:bg-[#b5eb00] text-black px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-transform active:scale-95 ${
                  interactive ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                <span>Chat on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="px-1 py-1">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => interactive && setSearchQuery(e.target.value)}
            disabled={!interactive}
            placeholder="Search cars..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-black focus:outline-none focus:border-black shadow-2xs"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      {/* 4. Vehicle Category Icons Row */}
      <div className="px-1 py-1">
        <div className="flex items-center justify-between gap-1 text-center">
          
          {/* All Cars */}
          <div 
            onClick={() => interactive && setSelectedCategory('all')}
            className={`flex flex-col items-center gap-1 ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#C6FF00] text-black shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}>
              <Car size={16} className="stroke-[2.5]" />
            </div>
            <span className="text-[9px] font-bold text-black">All Cars</span>
          </div>

          {/* SUVs */}
          <div 
            onClick={() => interactive && setSelectedCategory('suv')}
            className={`flex flex-col items-center gap-1 ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              selectedCategory === 'suv'
                ? 'bg-[#C6FF00] text-black shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}>
              <Car size={16} className="stroke-[2]" />
            </div>
            <span className="text-[9px] font-medium text-zinc-600">SUVs</span>
          </div>

          {/* Sedans */}
          <div 
            onClick={() => interactive && setSelectedCategory('sedan')}
            className={`flex flex-col items-center gap-1 ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              selectedCategory === 'sedan'
                ? 'bg-[#C6FF00] text-black shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}>
              <Car size={16} className="stroke-[2]" />
            </div>
            <span className="text-[9px] font-medium text-zinc-600">Sedans</span>
          </div>

          {/* Hatchbacks */}
          <div 
            onClick={() => interactive && setSelectedCategory('hatchback')}
            className={`flex flex-col items-center gap-1 ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              selectedCategory === 'hatchback'
                ? 'bg-[#C6FF00] text-black shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}>
              <Car size={16} className="stroke-[2]" />
            </div>
            <span className="text-[9px] font-medium text-zinc-600">Hatchbacks</span>
          </div>

          {/* Trucks */}
          <div 
            onClick={() => interactive && setSelectedCategory('truck')}
            className={`flex flex-col items-center gap-1 ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              selectedCategory === 'truck'
                ? 'bg-[#C6FF00] text-black shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}>
              <Truck size={16} className="stroke-[2]" />
            </div>
            <span className="text-[9px] font-medium text-zinc-600">Trucks</span>
          </div>

        </div>
      </div>

      {/* 5. Featured Vehicles 2-Column Grid */}
      <div className="px-1 py-1 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-black">
            Featured Cars
          </span>
          <span className="text-[10px] font-bold text-[#84cc00] cursor-pointer hover:underline">
            View all
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {VEHICLES.map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => {
                if (interactive) {
                  toast.info(`Inspecting specs for ${vehicle.name}`);
                  onSelectVehicle?.(vehicle);
                }
              }}
              className={`bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs space-y-1.5 p-1.5 transition-all hover:border-zinc-300 ${
                interactive ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
              }`}
            >
              {/* Vehicle Image */}
              <div className="w-full h-18 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Vehicle Details */}
              <div className="space-y-0.5 px-0.5">
                <h4 className="text-[10px] font-black text-black truncate leading-tight">
                  {vehicle.name}
                </h4>
                <p className="text-[11px] font-black text-black">
                  {vehicle.price}
                </p>

                {/* Specs Chips */}
                <div className="flex items-center gap-1.5 text-[8px] text-zinc-500 font-semibold pt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Fuel size={9} />
                    {vehicle.fuel}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Settings2 size={9} />
                    {vehicle.transmission}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Customer Dealership Bottom Navigation Bar */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between px-3 text-zinc-400">
        
        {/* Home */}
        <button
          onClick={() => interactive && setActiveBottomTab('home')}
          className={`flex flex-col items-center gap-0.5 ${
            activeBottomTab === 'home' ? 'text-black' : 'hover:text-black'
          }`}
        >
          <div className="w-5 h-5 rounded-md bg-[#C6FF00] flex items-center justify-center text-black shadow-2xs">
            <Car size={13} className="stroke-[2.5]" />
          </div>
          <span className="text-[8px] font-bold text-black">Home</span>
        </button>

        {/* Cars */}
        <button
          onClick={() => interactive && setActiveBottomTab('cars')}
          className={`flex flex-col items-center gap-0.5 ${
            activeBottomTab === 'cars' ? 'text-black' : 'hover:text-black'
          }`}
        >
          <Car size={14} />
          <span className="text-[8px] font-medium">Cars</span>
        </button>

        {/* Sell Car */}
        <button
          onClick={() => interactive && setActiveBottomTab('sell')}
          className={`flex flex-col items-center gap-0.5 ${
            activeBottomTab === 'sell' ? 'text-black' : 'hover:text-black'
          }`}
        >
          <PlusCircle size={15} />
          <span className="text-[8px] font-medium">Sell Car</span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => interactive && setActiveBottomTab('favorites')}
          className={`flex flex-col items-center gap-0.5 ${
            activeBottomTab === 'favorites' ? 'text-black' : 'hover:text-black'
          }`}
        >
          <Heart size={14} />
          <span className="text-[8px] font-medium">Favorites</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => interactive && setActiveBottomTab('profile')}
          className={`flex flex-col items-center gap-0.5 ${
            activeBottomTab === 'profile' ? 'text-black' : 'hover:text-black'
          }`}
        >
          <User size={14} />
          <span className="text-[8px] font-medium">Profile</span>
        </button>

      </div>

    </div>
  );
};
