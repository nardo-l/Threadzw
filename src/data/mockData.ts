export interface ProductVariant {
  size: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  shopName: string;
  category: string;
  badge?: 'NEW' | 'HOT' | 'AFFILIATE';
  imageEmoji: string;
  images: string[];
  rating: number;
  reviews: number;
  description: string;
  colors: string[];
  variants: ProductVariant[];
  likes: number;
  saves: number;
  condition?: string;
  isFeatured?: boolean;
}

export interface SaleLog {
  id: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  actualPrice: number;
  timestamp: number;
  type: 'online' | 'in-store';
}

export interface TradingHours {
  open: string; // e.g. "08:00"
  close: string; // e.g. "18:00"
  closed?: boolean;
}

export interface Shop {
  id: string;
  name: string;
  avatar: string;
  bannerUrl?: string;
  logoUrl?: string;
  productCount: number;
  rating: number;
  location: string; // Area name
  landmark: string; // Short summary
  directions?: string; // Long text
  whatsappNumber: string;
  isOnlineOnly?: boolean;
  deliveryInfo?: string;
  tradingHours: Record<string, TradingHours>; // Mon-Sun
  categories: string[];
}

export interface Nominee {
  id: string;
  name: string;
  handle: string;
  personality: string;
  votes: number;
  status: 'In' | 'Eliminated';
  imageEmoji: string;
}

export const MOCK_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'SoleKing HRE',
    avatar: 'https://picsum.photos/seed/soleking/200/200',
    bannerUrl: 'https://picsum.photos/seed/soleking-banner/1200/400',
    productCount: 42,
    rating: 4.8,
    location: 'Harare CBD',
    landmark: 'Joina City, 2nd Floor',
    whatsappNumber: '0771234567',
    tradingHours: {
      Mon: { open: '09:00', close: '18:00' },
      Tue: { open: '09:00', close: '18:00' },
      Wed: { open: '09:00', close: '18:00' },
      Thu: { open: '09:00', close: '18:00' },
      Fri: { open: '09:00', close: '19:00' },
      Sat: { open: '09:00', close: '16:00' },
      Sun: { open: '10:00', close: '14:00', closed: true },
    },
    categories: ['Sneakers', 'Clothing']
  },
  {
    id: 'shop-2',
    name: 'Thrift Lab',
    avatar: 'https://picsum.photos/seed/thriftlab/200/200',
    bannerUrl: 'https://picsum.photos/seed/thriftlab-banner/1200/400',
    productCount: 156,
    rating: 4.5,
    location: 'Avondale',
    landmark: 'Avondale Shops, Near Food Court',
    whatsappNumber: '0781234567',
    tradingHours: {
      Mon: { open: '08:30', close: '17:30' },
      Tue: { open: '08:30', close: '17:30' },
      Wed: { open: '08:30', close: '17:30' },
      Thu: { open: '08:30', close: '17:30' },
      Fri: { open: '08:30', close: '17:30' },
      Sat: { open: '08:30', close: '14:30' },
      Sun: { open: '09:00', close: '13:00', closed: true },
    },
    categories: ['Thrift', 'Vintage']
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Air Jordan 4 "Military Black"',
    price: 280,
    originalPrice: 320,
    shopName: 'SoleKing HRE',
    category: 'Sneakers',
    badge: 'HOT',
    imageEmoji: '👟',
    images: [
      'https://picsum.photos/seed/aj4/800/800',
      'https://picsum.photos/seed/aj4-alt/800/800'
    ],
    rating: 4.9,
    reviews: 124,
    description: 'The Jordan 4 Retro Military Black features a white leather upper with black and light grey overlays. Traditional TPU wings and mesh panels ensure breathability and lockdown.',
    colors: ['White', 'Black', 'Grey'],
    variants: [
      { size: 'UK 7', quantity: 2 },
      { size: 'UK 8', quantity: 5 },
      { size: 'UK 9', quantity: 3 },
      { size: 'UK 10', quantity: 0 }
    ],
    likes: 1205,
    saves: 450,
    condition: 'New'
  },
  {
    id: 'p2',
    name: 'Vintage Carhartt Jacket',
    price: 85,
    shopName: 'Thrift Lab',
    category: 'Clothing',
    badge: 'NEW',
    imageEmoji: '🧥',
    images: [
      'https://picsum.photos/seed/carhartt/800/800'
    ],
    rating: 4.2,
    reviews: 15,
    description: 'Authentic 90s era Carhartt Detroit jacket. Distressed canvas with original patina. Perfect layering piece for the chill.',
    colors: ['Tan', 'Brown'],
    variants: [
      { size: 'Large', quantity: 1 }
    ],
    likes: 340,
    saves: 88,
    condition: 'Used - Excellent'
  },
  {
    id: 'p3',
    name: 'Yeezy Slide "Onyx"',
    price: 110,
    originalPrice: 140,
    shopName: 'SoleKing HRE',
    category: 'Sneakers',
    imageEmoji: '🩴',
    images: [
      'https://picsum.photos/seed/yeezy/800/800'
    ],
    rating: 4.7,
    reviews: 89,
    description: 'The YEEZY SLIDE features injected EVA foam to provide lightweight durability, while the soft top layer in the footbed offers immediate step in comfort.',
    colors: ['Onyx'],
    variants: [
      { size: 'UK 7', quantity: 10 },
      { size: 'UK 8', quantity: 12 },
      { size: 'UK 9', quantity: 15 }
    ],
    likes: 890,
    saves: 210,
    condition: 'New'
  }
];

export const MOCK_NOMINEES: Nominee[] = [
  { id: 'n1', name: 'Takudzwa M.', handle: '@tk_drip', personality: 'The Nonchalant', votes: 1240, status: 'In', imageEmoji: '🕺' },
  { id: 'n2', name: 'Ruvimbo G.', handle: '@ruv_vogue', personality: 'The Creative', votes: 980, status: 'In', imageEmoji: '💃' },
  { id: 'n3', name: 'Sean K.', handle: '@sean_sk', personality: 'The Hustler', votes: 850, status: 'Eliminated', imageEmoji: '🕴️' }
];

export const PERSONALITY_RESULTS = [
  { id: 'nonchalant', type: 'The Nonchalant', icon: '😶', description: 'Unbothered. Drips quietly. Doesn\'t need validation. You literally just throw this on, and somehow it works.', stats: { drip: 92, fit: 88, sauciness: 95 } },
  { id: 'chill', type: 'The Chill One', icon: '😎', description: 'Effortless style. Never overdressed, never under. You prioritize comfort but you always look clean.', stats: { drip: 85, fit: 95, sauciness: 80 } },
  { id: 'party', type: 'Life of the Party', icon: '🔥', description: 'Loud fits. First noticed in every room. No apologies. You are the moment, every single time.', stats: { drip: 95, fit: 80, sauciness: 98 } },
  { id: 'hustler', type: 'The Hustler', icon: '💼', description: 'Clean and calculated. Style means business. You look like money even when the account says otherwise.', stats: { drip: 90, fit: 92, sauciness: 88 } },
  { id: 'ghost', type: 'The Ghost', icon: '👻', description: 'Rare sightings. But when they show up, they go crazy. You disappear for months then drop a fit that stops the internet.', stats: { drip: 98, fit: 85, sauciness: 92 } },
  { id: 'creative', type: 'The Creative', icon: '🎨', description: 'Experimental. Mixes things nobody else would even try. You don\'t follow trends, you break them.', stats: { drip: 88, fit: 90, sauciness: 96 } },
];

export const ANSWER_MAP: Record<string, Record<string, string>> = {
  q1: { a: 'nonchalant', b: 'party', c: 'hustler', d: 'creative' },
  q2: { a: 'chill', b: 'hustler', c: 'party', d: 'creative' },
  q3: { a: 'nonchalant', b: 'hustler', c: 'party', d: 'creative' },
  q4: { a: 'ghost', b: 'party', c: 'hustler', d: 'creative' },
  q5: { a: 'nonchalant', b: 'chill', c: 'hustler', d: 'creative' },
  q6: { a: 'creative', b: 'chill', c: 'ghost', d: 'hustler' },
  q7: { a: 'party', b: 'chill', c: 'nonchalant', d: 'creative' },
  q8: { a: 'nonchalant', b: 'chill', c: 'hustler', d: 'ghost' },
  q9: { a: 'hustler', b: 'party', c: 'chill', d: 'creative' },
  q10: { a: 'party', b: 'creative', c: 'nonchalant', d: 'ghost' }
};

export const QUIZ_QUESTIONS = [
  { 
    question: "You're heading out to valid a CBD weekend linkup. What are you copping?", 
    options: ["Vintage Oversized Tee", "Fresh White AF1s", "Local Brand Tracksuit", "Cargos and a Hoodie"] 
  },
  { 
    question: "Pick your Harare energy right now:", 
    options: ["Avondale Vibes", "CBD Hustle", "Borrowdale Village", "Highfield Energy"] 
  },
  { 
    question: "Your go-to artist on the speakers?", 
    options: ["Winky D", "Holy Ten", "Burna Boy", "Saintfloew"] 
  },
  { 
    question: "Friday night — how are you stepping?", 
    options: ["All black everything", "Loud colours & chains", "Clean and minimalist", "Vintage thrifted heat"] 
  },
  { 
    question: "Someone's wearing the same fit as you. Reaction?", 
    options: ["Unbothered (I still look better)", "Dap them up (Good taste)", "Lowkey annoyed", "Time for a quick change"] 
  },
  { 
    question: "Where's the best thrift in HRE?", 
    options: ["Mupedzanhamo", "Avondale Flea Market", "The Thrift Lab", "CBD Street Vendors"] 
  },
  { 
    question: "Pick a footwear vibe:", 
    options: ["Jordan 4s", "Yeezy Slides", "Timberlands", "Classic Vans"] 
  },
  { 
    question: "Getting dressed takes you:", 
    options: ["5 mins (No capping)", "20 mins", "45 mins", "However long it takes"] 
  },
  { 
    question: "What's the goal for the fit?", 
    options: ["Respect & Status", "Attention", "Comfort First", "Artistic Expression"] 
  },
  { 
    question: "You just copped some fire heat. What's next?", 
    options: ["Straight to the Gram", "Wait for a special event", "Rock it quietly", "Tell the close circle only"] 
  }
];
