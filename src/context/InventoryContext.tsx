import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { mockShop, mockProducts } from '../data/mockData';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export interface Shop {
  id: string;
  name: string;
  owner_id: string;
  handle: string;
  slug?: string;
  categories: string[];
  category?: string;
  description: string;
  location: string;
  whatsapp: string;
  instagram?: string;
  is_online_only: boolean;
  delivery_info?: string;
  logo_url?: string;
  avatar_url?: string;
  banner_url?: string;
  is_verified: boolean;
  is_live: boolean;
  trial_ends_at?: string;
  subscription_status?: string;
  plan?: string;
  created_at: string;
  updated_at: string;
  view_count?: number;
  share_count?: number;
  product_count?: number;
  follower_count?: number;
  landmark?: string;
  directions?: string;
  town?: string;
  area?: string;
}

export interface Product {
  id: string;
  shop_id: string;
  owner_id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  sizes: { size: string; quantity: number }[];
  total_stock: number;
  category: string;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  display_name: string;
  created_at: string;
  upvotes?: number;
  seller_response?: string;
  timestamp?: string;
  userName?: string;
  userHandle?: string;
  isVerified?: boolean;
  text?: string;
  userVote?: string | null;
  helpfulCount?: number;
  unhelpfulCount?: number;
  sellerResponse?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  shopName?: string;
  price?: number;
  name?: string;
  size?: string;
  shopId?: string;
  productId?: string;
  imageEmoji?: string;
}

interface UserData {
  name: string;
  handle?: string;
  hasShop: boolean;
  isShopLive: boolean;
  shopId?: string;
  shopName?: string;
  shopHandle?: string;
  shopLogo?: string;
  shopArea?: string;
  shopWhatsApp?: string;
  shopIsVerified?: boolean;
  personality?: string;
}

interface InventoryContextType {
  products: Product[];
  shops: Shop[];
  loading: boolean;
  userShop: Shop | null;
  userData: UserData;
  sellerFlowState: 'seller_onboarding' | 'setup_form' | 'live' | 'paywall' | 'enter_code' | 'payment_received' | 'add_product' | 'edit_shop' | 'dashboard' | null;
  buyerFlowState: 'home' | 'shops' | 'mall' | 'community' | 'profile' | 'product_detail' | 'shop_detail' | 'story' | 'search' | 'wishlist' | 'notifications' | 'onboarding' | 'quiz' | 'quiz_result' | 'bestDresser' | 'bestDresserEntry' | 'quizResult' | 'feed' | 'musify' | 'events' | 'build-a-fit' | 'shopProfile' | 'productDetail';
  communityScreen: 'hub' | 'best_dresser' | 'bracket' | 'coming_soon' | 'hall_of_fame' | 'entry_success' | 'bestDresser' | 'bestDresserEntry' | 'entrySuccess' | 'hallOfFame' | 'quiz' | 'quizResult';
  currentShopId: string | null;
  currentProductId: string | null;
  shopFormData: any;
  setShopFormData: (data: any) => void;
  setSellerFlowState: (state: InventoryContextType['sellerFlowState']) => void;
  setBuyerFlowState: (state: InventoryContextType['buyerFlowState']) => void;
  setCommunityScreen: (screen: InventoryContextType['communityScreen']) => void;
  setCurrentShopId: (id: string | null) => void;
  setCurrentProductId: (id: string | null) => void;
  updateUserData: (data: Partial<UserData>) => void;
  refreshInventory: () => Promise<void>;
  addProduct: (data: any) => Promise<any>;
  updateProduct: (id: string, data: any) => Promise<any>;
  deleteProduct: (id: string) => Promise<any>;
  increaseShopViewCount: (id: string) => Promise<void>;
  updateStock: (productId: string, size: string, quantity: number) => void;
  toggleLike: (productId: string) => void;
  toggleSave: (productId: string) => void;
  toggleFollow: (shopId: string) => void;
  likedProductIds: string[];
  savedProductIds: string[];
  following: string[];
  unreadNotificationCount: number;
  sessionExpired: boolean;
  setSessionExpired: (val: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  showAuthPrompt: boolean;
  setShowAuthPrompt: (val: boolean) => void;
  authPromptMessage: string;
  storiesViewerOpen: boolean;
  setStoriesViewerOpen: (val: boolean, shopId?: string) => void;
  currentStoryShopId: string | null;
  markStoryAsSeen: (shopId: string, storyId?: string) => void;
  stories: any[];
  setOnboardingComplete: (val: boolean) => void;
  postStory: (data: any) => Promise<boolean>;
  cart: CartItem[];
  removeFromCart: (productId: string, size: string) => void;
  updateCartQuantity: (productId: string, size: string, delta: number) => void;
  clearCart: () => void;
  isShopOpen: (shop: any) => boolean;
  createOrder: (shopId: string, items: any[], subtotal: number) => Promise<any>;
  followers: any[];
  addRecentlyViewed: (productId: string) => void;
  increaseViewCount: (productId: string) => void;
  reviews: any;
  addReview: (shopId: string, review: any) => Promise<any>;
  voteReview: (shopId: string, reviewId: string, delta: any) => void;
  addSellerResponse: (shopId: string, reviewId: string, response: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Transform mock products to match context Product interface
  const initialProducts: Product[] = useMemo(() => {
    return mockProducts.map((p) => {
      const sizesArray = Object.entries(p.stock || {}).map(([size, quantity]) => ({
        size,
        quantity: quantity as number,
      }));
      const totalStock = sizesArray.reduce((sum, item) => sum + item.quantity, 0);
      return {
        id: p.id,
        shop_id: 'shop-001',
        owner_id: 'user-001',
        name: p.name,
        description: p.description,
        price: p.price,
        images: p.images,
        sizes: sizesArray,
        total_stock: totalStock,
        category: p.category,
        is_published: p.visible,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
  }, []);

  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Transform mock shop to match context Shop interface
  const initialShop: Shop = useMemo(() => {
    return {
      id: mockShop.id,
      name: mockShop.name,
      owner_id: 'user-001',
      handle: 'kure',
      categories: ['Streetwear', 'Tops', 'Bottoms'],
      description: mockShop.tagline || mockShop.about,
      location: mockShop.location,
      whatsapp: mockShop.whatsapp_number,
      instagram: mockShop.instagram,
      is_online_only: false,
      logo_url: mockShop.logo_url,
      banner_url: mockShop.banner_url,
      is_verified: true,
      is_live: true,
      subscription_status: 'trial',
      trial_ends_at: mockShop.trial_end,
      trial_start: mockShop.trial_start || new Date().toISOString(),
      trial_end: mockShop.trial_end,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, []);

  const [shops, setShops] = useState<Shop[]>([initialShop]);
  const [userShop, setUserShop] = useState<Shop | null>(initialShop);
  const [loading, setLoading] = useState(false);

  const [sellerFlowState, setSellerFlowState] = useState<InventoryContextType['sellerFlowState']>(() => {
    return (localStorage.getItem('seller_flow_state') as any) || 'dashboard';
  });

  const [userData, setUserData] = useState<UserData>({
    name: 'Nardo',
    hasShop: true,
    isShopLive: true,
    shopId: 'shop-001',
    shopName: 'KURE STREETWEAR',
    shopHandle: 'kure',
    shopLogo: mockShop.logo_url,
    shopArea: 'Avondale',
    shopWhatsApp: mockShop.whatsapp_number,
    shopIsVerified: true,
  });

  const [shopFormData, setShopFormData] = useState(() => {
    return {
      ownerName: 'Nardo',
      name: 'KURE STREETWEAR',
      category: 'Streetwear',
      town: 'Harare',
      whatsapp: '263776223144',
      description: 'Built for the ones chasing more.',
      instagram: '@kure.zw',
      priceRange: '10-50',
      productEstimate: '50-100',
    };
  });

  const refreshInventory = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setUserShop(data);
        setUserData(prev => ({
          ...prev,
          shopId: data.id,
          shopName: data.name,
          shopHandle: data.handle,
          shopLogo: data.logo_url || data.avatar_url || null,
          shopWhatsApp: data.whatsapp,
        }));
      }
    } catch (err) {
      console.warn("Failed to refresh shop in InventoryContext:", err);
    }
  }, [user]);

  // Sync / fetch real shop from Supabase when user mounts
  useEffect(() => {
    refreshInventory();
  }, [user, refreshInventory]);

  // Load registered, live shops from Supabase database to populate the global buyer lists
  useEffect(() => {
    const fetchAllLiveShops = async () => {
      try {
        const { data, error: shopsErr } = await supabase
          .from('shops')
          .select('*')
          .eq('is_live', true);

        if (!shopsErr && data) {
          // Filter out dummy/mock shops if any
          const realShops = data.filter(s => {
            const idLower = (s.id || '').toLowerCase();
            const handleLower = (s.handle || '').toLowerCase();
            const nameLower = (s.name || '').toLowerCase();
            return idLower !== 'demo-shop' && 
                   idLower !== 'shop-001' && 
                   handleLower !== 'demo' && 
                   !nameLower.includes('demo');
          });
          setShops(realShops);
        }
      } catch (err) {
        console.error("Failed to load live shops in InventoryContext:", err);
      }
    };
    fetchAllLiveShops();
  }, [user]);

  const addProduct = async (productData: any) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      shop_id: 'shop-001',
      owner_id: 'user-001',
      name: productData.name,
      description: productData.description || '',
      price: productData.price,
      images: productData.images || ['https://via.placeholder.com/400'],
      sizes: productData.sizes || [{ size: 'M', quantity: 10 }],
      total_stock: (productData.sizes || []).reduce((sum: number, s: any) => sum + s.quantity, 0),
      category: productData.category || 'Tops',
      is_published: true,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProducts(prev => [newProduct, ...prev]);
    toast.success('Product added successfully!');
    return newProduct;
  };

  const updateProduct = async (id: string, updatedData: any) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newFields = { ...p, ...updatedData };
          if (updatedData.sizes) {
            newFields.total_stock = updatedData.sizes.reduce((sum: number, s: any) => sum + s.quantity, 0);
          }
          return newFields;
        }
        return p;
      })
    );
    toast.success('Product updated!');
    return true;
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Product deleted!');
    return true;
  };

  const increaseShopViewCount = async (shopId: string) => {
    setUserShop(prev => {
      if (!prev) return prev;
      return { ...prev, view_count: (prev.view_count || 0) + 1 };
    });
  };

  const updateStock = (productId: string, size: string, quantity: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const newSizes = p.sizes.map(s => (s.size === size ? { ...s, quantity: Math.max(0, s.quantity - quantity) } : s));
          const total = newSizes.reduce((sum, item) => sum + item.quantity, 0);
          return { ...p, sizes: newSizes, total_stock: total };
        }
        return p;
      })
    );
  };

  const [buyerFlowState, setBuyerFlowState] = useState<InventoryContextType['buyerFlowState']>('home');
  const [communityScreen, setCommunityScreen] = useState<InventoryContextType['communityScreen']>('hub');
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [likedProductIds, setLikedProductIds] = useState<string[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState('');
  const [storiesViewerOpen, setStoriesViewerOpen] = useState(false);
  const [currentStoryShopId, setCurrentStoryShopId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [reviews, setReviews] = useState<any>({});

  const value = useMemo(() => ({
    products,
    shops,
    loading,
    userShop,
    userData,
    sellerFlowState,
    buyerFlowState,
    communityScreen,
    currentShopId,
    currentProductId,
    shopFormData,
    likedProductIds,
    savedProductIds,
    following,
    unreadNotificationCount: 0,
    sessionExpired: false,
    setSessionExpired: () => {},
    logout: () => {},
    isAuthenticated: true,
    setIsAuthenticated: () => {},
    showAuthPrompt,
    setShowAuthPrompt,
    authPromptMessage,
    storiesViewerOpen,
    setStoriesViewerOpen: (v: boolean, sid?: string) => {
      setStoriesViewerOpen(v);
      if (sid) setCurrentStoryShopId(sid);
    },
    currentStoryShopId,
    markStoryAsSeen: () => {},
    stories: [],
    setOnboardingComplete: () => {},
    postStory: async () => true,
    cart,
    removeFromCart: (pid: string, sz: string) =>
      setCart(prev => prev.filter(item => !(item.product.id === pid && item.selectedSize === sz))),
    updateCartQuantity: (pid: string, sz: string, d: number) =>
      setCart(prev =>
        prev.map(item =>
          item.product.id === pid && item.selectedSize === sz
            ? { ...item, quantity: Math.max(1, item.quantity + d) }
            : item
        )
      ),
    clearCart: () => setCart([]),
    isShopOpen: () => true,
    createOrder: async () => ({ id: `mock-order-${Math.floor(Math.random() * 10000)}` }),
    followers: [],
    addRecentlyViewed: () => {},
    increaseViewCount: () => {},
    reviews,
    addReview: async (sid: string, r: any) => {
      const newR = {
        ...r,
        id: Math.random().toString(),
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        helpfulCount: 0,
        unhelpfulCount: 0,
      };
      setReviews((prev: any) => ({ ...prev, [sid]: [newR, ...(prev[sid] || [])] }));
      return newR;
    },
    voteReview: (sid: string, id: string, type: any) =>
      setReviews((prev: any) => ({
        ...prev,
        [sid]: (prev[sid] || []).map((r: any) => {
          if (r.id === id) {
            const isSame = r.userVote === type;
            return {
              ...r,
              userVote: isSame ? null : type,
              helpfulCount: type === 'helpful' ? (isSame ? r.helpfulCount - 1 : r.helpfulCount + 1) : r.helpfulCount,
              unhelpfulCount: type === 'unhelpful' ? (isSame ? r.unhelpfulCount - 1 : r.unhelpfulCount + 1) : r.unhelpfulCount,
            };
          }
          return r;
        }),
      })),
    addSellerResponse: (sid: string, id: string, s: string) =>
      setReviews((prev: any) => ({
        ...prev,
        [sid]: (prev[sid] || []).map((r: any) =>
          r.id === id ? { ...r, sellerResponse: { text: s, timestamp: new Date().toISOString() } } : r
        ),
      })),
    setShopFormData,
    setSellerFlowState,
    setBuyerFlowState,
    setCommunityScreen,
    setCurrentShopId,
    setCurrentProductId,
    updateUserData: (data: Partial<UserData>) => setUserData(prev => ({ ...prev, ...data })),
    refreshInventory,
    addProduct,
    updateProduct,
    deleteProduct,
    increaseShopViewCount,
    updateStock,
    toggleLike: (id: string) => setLikedProductIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])),
    toggleSave: (id: string) => setSavedProductIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])),
    toggleFollow: (id: string) => setFollowing(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])),
  }), [
    products,
    shops,
    loading,
    userShop,
    userData,
    sellerFlowState,
    buyerFlowState,
    communityScreen,
    currentShopId,
    currentProductId,
    shopFormData,
    likedProductIds,
    savedProductIds,
    following,
    showAuthPrompt,
    authPromptMessage,
    storiesViewerOpen,
    currentStoryShopId,
    cart,
    reviews,
    refreshInventory,
  ]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within OrderProvider'); // note: matching legacy type expected string
  return context;
};
