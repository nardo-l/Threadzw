import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Shop {
  id: string;
  name: string;
  owner_id: string;
  handle: string;
  categories: string[];
  category?: string; // Legacy support
  description: string;
  location: string;
  area?: string; // Legacy support
  whatsapp: string;
  instagram?: string;
  is_online_only: boolean;
  delivery_info?: string;
  logo_url?: string;
  avatar_url?: string; // Legacy support
  banner_url?: string;
  is_verified: boolean;
  is_live: boolean;
  trial_ends_at?: string;
  subscription_status?: string; // 'trial' | 'pending_payment' | 'active' | 'expired'
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
  timestamp?: string; // Changed to string to match parseISO typical input
  userName?: string;
  userHandle?: string;
  isVerified?: boolean;
  text?: string;
  userVote?: string | number;
  helpfulCount?: number;
  unhelpfulCount?: number;
  sellerResponse?: {
    timestamp: string;
    text: string;
  };
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
  shopIsOnlineOnly?: boolean;
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
  
  // Missing properties from legacy/extended features
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
  reviews: any; // Can be Record<string, Review[]> or Review[] depending on usage, linter says any[] | Review[]
  addReview: (shopId: string, review: any) => Promise<any>;
  voteReview: (shopId: string, reviewId: string, delta: any) => void;
  addSellerResponse: (shopId: string, reviewId: string, response: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [userShop, setUserShop] = useState<Shop | null>(null);
  
  const [sellerFlowState, setSellerFlowState] = useState<InventoryContextType['sellerFlowState']>(() => {
    return localStorage.getItem('seller_flow_state') as any || null;
  });

  const [userData, setUserData] = useState<UserData>({
    name: '',
    hasShop: false,
    isShopLive: false,
  });

  const [shopFormData, setShopFormData] = useState(() => {
    const saved = localStorage.getItem('shop_form_data');
    return saved ? JSON.parse(saved) : {};
  });

  const fetchLockRef = useRef(false);

  const refreshInventory = useCallback(async () => {
    if (!user?.id) return;
    if (fetchLockRef.current) return;
    fetchLockRef.current = true;
    
    try {
      const { data: shopData } = await supabase.from('shops').select('*').eq('owner_id', user.id).maybeSingle();
      if (shopData) {
        setUserShop(shopData);
        setUserData({
          name: profile?.display_name || '',
          hasShop: true,
          isShopLive: shopData.is_live,
          shopId: shopData.id,
          shopName: shopData.name,
          shopHandle: shopData.handle,
          shopLogo: shopData.logo_url,
          shopArea: shopData.location,
          shopWhatsApp: shopData.whatsapp,
          shopIsVerified: shopData.is_verified,
        });

        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false });
          
        if (productsData) {
          // Filter out soft-deleted products
          setProducts(productsData.filter(p => p.status !== 'deleted'));
        }
      } else {
        setSellerFlowState('seller_onboarding');
      }
    } catch (err) {
      console.error('Inventory Sync Error:', err);
    } finally {
      setLoading(false);
      fetchLockRef.current = false;
    }
  }, [user, profile]);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  useEffect(() => {
    if (sellerFlowState) localStorage.setItem('seller_flow_state', sellerFlowState);
  }, [sellerFlowState]);

  useEffect(() => {
    localStorage.setItem('shop_form_data', JSON.stringify(shopFormData));
  }, [shopFormData]);

  const addProduct = async (productData: any) => {
    if (!userShop) return;
    const { data, error } = await supabase.from('products').insert({
      ...productData,
      shop_id: userShop.id,
      owner_id: user.id,
    }).select().single();
    if (!error) refreshInventory();
    return data;
  };

  const updateProduct = async (id: string, data: any) => {
    const { error } = await supabase.from('products').update(data).eq('id', id);
    if (!error) {
      refreshInventory();
      return true;
    }
    return false;
  };

  const deleteProduct = async (id: string) => {
    // 1. Optimistic delete: immediately remove from local state
    const previousProducts = [...products];
    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      // 2. Clear from Supabase (perform soft delete status = 'deleted' AND hard delete for safety)
      const { error: softError } = await supabase
        .from('products')
        .update({ status: 'deleted' })
        .eq('id', id);

      const { error: hardError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (softError && hardError) {
        throw softError || hardError;
      }

      // 3. Trigger background sync after success
      setTimeout(() => {
        refreshInventory();
      }, 500);

      return true;
    } catch (err) {
      console.error('Failed to delete product on server:', err);
      // Rollback state if server fails
      setProducts(previousProducts);
      return false;
    }
  };

  const increaseShopViewCount = async (shopId: string) => {
    await supabase.rpc('increment_shop_view_count', { shop_id: shopId });
  };

  const updateStock = async (productId: string, size: string, quantity: number) => {
    // Basic implementation for stock decrement during manual sale
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newSizes = product.sizes.map(s => s.size === size ? { ...s, quantity: Math.max(0, s.quantity - quantity) } : s);
    const newTotal = newSizes.reduce((acc, s) => acc + s.quantity, 0);
    await updateProduct(productId, { sizes: newSizes, total_stock: newTotal });
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
  const [reviews, setReviews] = useState<any>({}); // Changed to object to match ShopProfile usage

  const { signOut: authSignOut, sessionExpired: authExpired } = useAuth();

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
    
    sessionExpired: authExpired,
    setSessionExpired: () => {}, // Handled by AuthContext
    logout: authSignOut,
    isAuthenticated: !!user,
    setIsAuthenticated: () => {},
    showAuthPrompt,
    setShowAuthPrompt,
    authPromptMessage,
    storiesViewerOpen,
    setStoriesViewerOpen: (v: boolean, sid?: string) => { setStoriesViewerOpen(v); if (sid) setCurrentStoryShopId(sid); },
    currentStoryShopId,
    markStoryAsSeen: () => {},
    stories: [],
    setOnboardingComplete: () => {},
    postStory: async () => true,
    cart,
    removeFromCart: (pid: string, sz: string) => setCart(prev => prev.filter(item => !(item.product.id === pid && item.selectedSize === sz))),
    updateCartQuantity: (pid: string, sz: string, d: number) => setCart(prev => prev.map(item => (item.product.id === pid && item.selectedSize === sz) ? { ...item, quantity: Math.max(1, item.quantity + d) } : item)),
    clearCart: () => setCart([]),
    isShopOpen: () => true,
    createOrder: async () => ({ id: 'mock-order-id' }),
    followers: [],
    addRecentlyViewed: () => {},
    increaseViewCount: () => {},
    reviews,
    addReview: async (sid: string, r: any) => { const newR = { ...r, id: Math.random().toString(), timestamp: new Date().toISOString(), created_at: new Date().toISOString(), helpfulCount: 0, unhelpfulCount: 0 }; setReviews((prev: any) => ({ ...prev, [sid]: [newR, ...(prev[sid] || [])] })); return newR; },
    voteReview: (sid: string, id: string, type: any) => setReviews((prev: any) => ({ ...prev, [sid]: (prev[sid] || []).map((r: any) => { if (r.id === id) { const isSame = r.userVote === type; return { ...r, userVote: isSame ? null : type, helpfulCount: type === 'helpful' ? (isSame ? r.helpfulCount - 1 : r.helpfulCount + 1) : r.helpfulCount, unhelpfulCount: type === 'unhelpful' ? (isSame ? r.unhelpfulCount - 1 : r.unhelpfulCount + 1) : r.unhelpfulCount }; } return r; }) })),
    addSellerResponse: (sid: string, id: string, s: string) => setReviews((prev: any) => ({ ...prev, [sid]: (prev[sid] || []).map((r: any) => r.id === id ? { ...r, sellerResponse: { text: s, timestamp: new Date().toISOString() } } : r) })),

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
    toggleLike: (id: string) => setLikedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]),
    toggleSave: (id: string) => setSavedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]),
    toggleFollow: (id: string) => setFollowing(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]),
  }), [
    products, shops, loading, userShop, userData, sellerFlowState, 
    buyerFlowState, communityScreen, currentShopId, currentProductId, 
    shopFormData, likedProductIds, savedProductIds, following, 
    showAuthPrompt, authPromptMessage, storiesViewerOpen, currentStoryShopId, cart, reviews,
    authExpired, authSignOut, user, refreshInventory
  ]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};
