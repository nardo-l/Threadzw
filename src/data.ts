export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  shopName: string;
  category: string;
  badge?: 'NEW' | 'HOT' | 'AFFILIATE';
  rating: number;
  reviews: number;
  description: string;
  colors: string[];
  sizes: string[];
  imageEmoji: string;
}

export interface Shop {
  id: string;
  name: string;
  avatar: string;
  productCount: number;
  rating: number;
  location: string;
  categories: string[];
  isNew?: boolean;
}

export interface Nominee {
  id: string;
  username: string;
  tagline: string;
  votes: number;
  likes: number;
  imageEmoji: string;
  isLeader?: boolean;
  stats: {
    drip: number;
    fit: number;
    swag: number;
  };
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Air Force 1 Low "HRE Edition"',
    price: 120,
    originalPrice: 150,
    shopName: 'SoleKing HRE',
    category: 'Sneakers',
    badge: 'HOT',
    rating: 4.8,
    reviews: 124,
    description: 'The classic silhouette updated with premium materials for the Harare streets.',
    colors: ['#ffffff', '#000000', '#f72585'],
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
    imageEmoji: '👟',
  },
  {
    id: '2',
    name: 'Essentials Fear of God Tee',
    price: 45,
    originalPrice: 60,
    shopName: 'UrbanThread ZW',
    category: 'Clothing',
    badge: 'NEW',
    rating: 4.5,
    reviews: 89,
    description: 'Minimalist design meets maximum comfort. A staple for any wardrobe.',
    colors: ['#f5f5dc', '#000000', '#808080'],
    sizes: ['S', 'M', 'L', 'XL'],
    imageEmoji: '👕',
  },
  {
    id: '3',
    name: 'Vintage 90s Levi Denim',
    price: 35,
    shopName: 'Thrift Club Harare',
    category: 'Thrift',
    badge: 'AFFILIATE',
    rating: 4.9,
    reviews: 45,
    description: 'Authentic vintage denim sourced locally. Each piece is unique.',
    colors: ['#4682b4', '#000080'],
    sizes: ['W32 L32', 'W34 L32'],
    imageEmoji: '👖',
  },
  {
    id: '4',
    name: 'Samsung Galaxy S24 Ultra',
    price: 1100,
    originalPrice: 1250,
    shopName: 'TechDeals HRE',
    category: 'Electronics',
    badge: 'HOT',
    rating: 4.7,
    reviews: 230,
    description: 'The latest flagship from Samsung. Unmatched performance and camera.',
    colors: ['#000000', '#808080', '#4b0082'],
    sizes: ['256GB', '512GB'],
    imageEmoji: '📱',
  },
];

export const MOCK_SHOPS: Shop[] = [
  {
    id: 's1',
    name: 'SoleKing HRE',
    avatar: '👑',
    productCount: 145,
    rating: 4.8,
    location: 'Avondale, Harare',
    categories: ['Sneakers', 'Accessories'],
  },
  {
    id: 's2',
    name: 'Thrift Club Harare',
    avatar: '♻️',
    productCount: 320,
    rating: 4.9,
    location: 'CBD, Harare',
    categories: ['Thrift', 'Vintage'],
    isNew: true,
  },
  {
    id: 's3',
    name: 'UrbanThread ZW',
    avatar: '🧵',
    productCount: 88,
    rating: 4.5,
    location: 'Borrowdale, Harare',
    categories: ['Clothing', 'Streetwear'],
  },
];

export const MOCK_NOMINEES: Nominee[] = [
  {
    id: 'n1',
    username: 'Tinashe_Drip',
    tagline: 'The Vintage King',
    votes: 1240,
    likes: 4500,
    imageEmoji: '🕺',
    isLeader: true,
    stats: { drip: 95, fit: 88, swag: 92 },
  },
  {
    id: 'n2',
    username: 'Ruvimbo_Styles',
    tagline: 'CBD Stepper',
    votes: 980,
    likes: 3200,
    imageEmoji: '💃',
    stats: { drip: 85, fit: 95, swag: 80 },
  },
  {
    id: 'n3',
    username: 'Kuda_Vibes',
    tagline: 'Harare Hypebeast',
    votes: 850,
    likes: 2100,
    imageEmoji: '🕶️',
    stats: { drip: 90, fit: 75, swag: 98 },
  },
  {
    id: 'n4',
    username: 'Farai_Fits',
    tagline: 'Minimalist Master',
    votes: 720,
    likes: 1800,
    imageEmoji: '🧥',
    stats: { drip: 70, fit: 98, swag: 75 },
  },
];
