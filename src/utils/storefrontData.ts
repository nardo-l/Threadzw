// Fallback mock stores, directions, reviews, and preset templates for ThreadZW Storefront

export interface MockProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  category_id?: string;
  description: string;
  images: string[];
  sizes: string[];
  colours: string[];
  is_featured: boolean;
  tag: string;
  status: 'active' | 'sold_out' | 'paused' | 'deleted';
}

export const DEFAULT_MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "mock-1",
    name: "TWDZW Graphic Oversized Tee",
    price: 25.00,
    original_price: 32.00,
    category: "T-Shirts",
    description: "ThreadZW classic brand oversized graphic tee. Made in Zimbabwe from 100% heavy cotton (240GSM). Featuring dynamic front custom embroidery and high-definition puff-print designs.",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=500&q=80"
    ],
    sizes: ["S", "M", "L", "XL"],
    colours: ["Black", "White", "Beige"],
    is_featured: true,
    tag: "Best Seller",
    status: "active"
  },
  {
    id: "mock-2",
    name: "Core Streetwear Heavy Hoodie",
    price: 45.00,
    category: "Hoodies",
    description: "Premium heavy-brushed fleece hoodie. Dual lined hood, front pouch pocket, elastic cuffs, and minimalist embroidery. Pre-shrunk for the absolute streetwear drape.",
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=500&q=80"
    ],
    sizes: ["M", "L", "XL"],
    colours: ["Charcoal", "Navy", "Khaki"],
    is_featured: true,
    tag: "New Drop",
    status: "active"
  },
  {
    id: "mock-3",
    name: "TWDZW Utility Cargo Pants",
    price: 35.00,
    original_price: 42.00,
    category: "Bottoms",
    description: "Adjustable straps Utility Cargos in active heavy twill cotton. Tactical buckles, deep side utility pockets, and adjustable toggle ankles.",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=500&q=80"
    ],
    sizes: ["30", "32", "34", "36"],
    colours: ["Khaki", "Black", "Olive"],
    is_featured: false,
    tag: "None",
    status: "active"
  },
  {
    id: "mock-4",
    name: "Thread Retro Court Sneakers",
    price: 65.00,
    original_price: 80.00,
    category: "Footwear",
    description: "Re-imagined low-top court sneakers. Premium vegan leather, comfortable padded tongue with custom retro stitch labels, and high grip lime-green outsole accents.",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80"
    ],
    sizes: ["UK 7", "UK 8", "UK 9", "UK 10"],
    colours: ["White", "Beige"],
    is_featured: true,
    tag: "Trending",
    status: "active"
  },
  {
    id: "mock-5",
    name: "Signature Streetwear Cap",
    price: 15.00,
    category: "Caps & Hats",
    description: "Adjustable 6-panel unstructured strapback dad cap. Detailed logo embroidery front, curved brim, buckle adjustable clasp, and brass eyelets.",
    images: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=500&q=80"
    ],
    sizes: ["One Size"],
    colours: ["Black", "White", "Navy"],
    is_featured: false,
    tag: "None",
    status: "active"
  }
];

export const DEFAULT_MOCK_CATEGORIES = [
  { id: 'all', name: 'All', count: 12 },
  { id: 'tshirts', name: 'T-Shirts', count: 45 },
  { id: 'hoodies', name: 'Hoodies', count: 32 },
  { id: 'bottoms', name: 'Bottoms', count: 28 },
  { id: 'footwear', name: 'Footwear', count: 18 },
  { id: 'caps', name: 'Caps & Hats', count: 22 },
  { id: 'accessories', name: 'Accessories', count: 15 }
];

export const MOCK_REVIEWS_PRESETS: Record<string, {name: string, rating: number, text: string, date: string}[]> = {
  "mock-1": [
    { name: "Takunda M.", rating: 5, text: "Top-tier quality print! Usually prints peel off after three washes but this puff-print is extremely thick and holds up perfectly.", date: "May 28, 2026" },
    { name: "Sihle N.", rating: 4, text: "Oversized fit is perfect. Recommending to order normal size for that streetwear aesthetic drape.", date: "June 02, 2026" }
  ],
  "mock-2": [
    { name: "Farai Z.", rating: 5, text: "Genuinely heavy cotton, thick fabric keeps you warm. Easily superior to imports. The premium hood lining is so cozy.", date: "April 15, 2026" },
    { name: "Amara C.", rating: 5, text: "Perfect embroidery. Zimbabwe streetwear is rising! Will buy again next winter.", date: "May 20, 2026" }
  ],
  "mock-4": [
    { name: "Kuda B.", rating: 5, text: "The lime green sole details make these stand out completely. Super soft leather, walk around in Harare all day without pain.", date: "June 04, 2026" }
  ]
};

export const getZimbabweDirections = (location: string, shopName: string): { address: string, landmark: string, stepByStep: string } => {
  const isHarare = location?.toLowerCase().includes('harare') || !location;
  if (isHarare) {
    return {
      address: "Century Plaza, First Floor, Room 12, Harare, Zimbabwe",
      landmark: "Opposite Joina City, right next to Zimpost main entry.",
      stepByStep: `🚶‍♂️ From Harare Town House (Julius Nyerere Way):\n1. Walk down Julius Nyerere Way toward Joina City.\n2. Cross Jason Moyo Avenue. Pass the Chicken Inn on your left.\n3. Directly opposite the main Joina City pedestrian crossing, locate Century Plaza Palace.\n4. Walk through the main doors, take the stairs or elevator to the 1st Floor.\n5. Turn left; ${shopName} is located at Shop 12.`
    };
  } else {
    return {
      address: "Fife Street Centre, Suite 4, Bulawayo, Zimbabwe",
      landmark: "Opposite TM Hyper, next to Nando's corner.",
      stepByStep: `🚶‍♂️ From Bulawayo Centre (City Hall):\n1. Walk down 11th Avenue heading toward TM Hyper.\n2. Cross Robert Mugabe Way.\n3. Turn right into Fife Street. Pass the Nando's corner on your left.\n4. We are located in the Fife Street Retail Centre, Suite 4 (Ground Floor).\n5. Look for the ${shopName} glowing brand label logo on the door.`
    };
  }
};

export const WHATSAPP_MESSAGE_TEMPLATES = [
  { id: "available", title: "Check availability", text: "Hi! Is this item still available in stock?" },
  { id: "sizes", title: "Inquire sizes", text: "Hi! What exact sizing fits are available? I am interested in ordering." },
  { id: "delivery", title: "Delivery options", text: "Do you offer door delivery or courier to other cities (Harare/Bulawayo/Mutare)?" },
  { id: "reserve", title: "Reserve item", text: "Hi! Can I reserve this item for 24 hours to collect physically at your shop?" }
];

const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff3b30',
  blue: '#007aff',
  green: '#34c759',
  yellow: '#ffcc00',
  grey: '#8e8e93',
  gray: '#8e8e93',
  brown: '#a25621',
  pink: '#ff2d55',
  purple: '#5856d6',
  orange: '#ff9500',
  beige: '#f5f5dc',
  cream: '#fffdd0',
  khaki: '#f0e68c',
  navy: '#000080',
  charcoal: '#36454f',
  olive: '#3b3f30'
};

export const getColorHex = (colorName: string) => {
  const normalized = colorName.trim().toLowerCase();
  return COLOR_MAP[normalized] || normalized;
};
