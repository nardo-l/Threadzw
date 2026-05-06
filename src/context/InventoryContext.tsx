import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { SaleLog, MOCK_NOMINEES } from '../data/mockData';
export interface Shop {
  id: string;
  name: string;
  owner_id: string;
  handle: string;
  categories: string[];
  description: string;
  location: string;
  whatsapp: string;
  instagram?: string;
  is_online_only: boolean;
  delivery_info?: string;
  logo_url?: string;
  banner_url?: string;
  rating: number;
  product_count: number;
  follower_count: number;
  is_verified: boolean;
  is_live: boolean;
  trial_ends_at?: string;
  subscription_status?: string;
  plan?: string;
  created_at: string;
  updated_at: string;
  // UI Compatibility fields (may not be in DB but needed for UI)
  landmark?: string;
  directions?: string;
  trading_hours?: any;
  trading_hours_json?: any;
  area?: string;
  category?: string;
  town?: string;
  avatar_url?: string;
}

export interface Product {
  id: string;
  shop_id: string;
  owner_id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  images: string[];
  sizes: { size: string; quantity: number }[];
  total_stock: number;
  category: string;
  condition?: string;
  status?: string;
  is_published: boolean;
  colours?: { name: string; hex: string }[];
  view_count: number;
  like_count: number;
  save_count: number;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  shop_id: string;
  owner_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  content?: string;
  product_id?: string;
  expires_at: string;
  created_at: string;
  shop?: {
    name: string;
    avatar_url: string;
  };
}

import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { getShopState } from '../lib/shopUtils';

interface UserData {
  name: string;
  handle?: string;
  avatarUrl?: string;
  role: 'user';
  personality: string;
  styles: string[];
  styleTags?: string[];
  brands: string[];
  hasShop: boolean;
  isShopLive: boolean;
  shopName?: string;
  shopHandle?: string;
  shopLogoUrl?: string;
  shopBannerUrl?: string;
  shopCategory?: string;
  shopDescription?: string;
  shopArea?: string;
  shopLandmark?: string;
  shopDirections?: string;
  shopTradingHours?: Record<string, any>;
  shopIsOnlineOnly?: boolean;
  shopDeliveryInfo?: string;
  shopWhatsApp?: string;
  shopInstagram?: string;
  shopIsVerified?: boolean;
}

export interface Review {
  id: string;
  shopId: string;
  userName: string;
  userHandle: string;
  rating: number;
  text: string;
  timestamp: string;
  isVerified: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  userVote?: 'helpful' | 'unhelpful';
  sellerResponse?: {
    text: string;
    timestamp: string;
  };
}

export interface Follower {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  followedAt: string;
}

export interface CartItem {
  productId: string;
  shopId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  imageEmoji: string;
  shopName: string;
}

export interface Notification {
  id: string;
  type: 'new_drop' | 'price_drop' | 'best_dresser_round' | 'best_dresser_nominated' | 'new_shop' | 'smart_restock' | 'low_stock';
  title: string;
  subtitle: string;
  timestamp: string;
  read: boolean;
  shopName?: string;
  productName?: string;
  price?: number;
  oldPrice?: number;
  imageEmoji?: string;
  shopEmoji?: string;
  area?: string;
  category?: string;
  count?: number;
  size?: string;
  days?: number;
}

interface InventoryContextType {
  products: Product[];
  shops: Shop[];
  nominees: any[];
  sales: SaleLog[];
  likedProductIds: string[];
  savedProductIds: string[];
  cart: CartItem[];
  notifications: Notification[];
  stories: Story[];
  onboardingComplete: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  userShop: Shop | null;
  sessionExpired: boolean;
  userData: UserData;
  storiesSeen: Record<string, boolean>;
  storiesViewerOpen: boolean;
  currentStoryShopId: string | null;
  subscriptionData: {
    plan: string;
    status: 'Active' | 'Cancelled' | 'Trial';
    renewalDate: string;
    billingCycle: 'monthly' | 'annual';
    memberSince: string;
    billingHistory: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      status: 'Paid';
    }>;
  };
  following: string[];
  reviews: Record<string, Review[]>;
  followers: Record<string, Follower[]>;
  recentlyViewed: string[];
  shopLaunched: boolean;
  shopDraft: any;
  selectedPlan: string | null;
  billingCycle: 'monthly' | 'annual';
  sellerFlowState: 'seller_onboarding' | 'setup_form' | 'trial_activation' | 'live' | 'paywall' | 'pending_code' | 'enter_code' | 'add_product' | 'dashboard' | 'edit_shop' | 'edit_product' | 'payment_received' | null;
  shopFormData: {
    name: string;
    handle: string;
    category: string;
    description: string;
    town: string;
    directions: string;
    tradingHours: string;
    tradingHoursJson: any | null;
    bannerFile: File | null;
    avatarFile: File | null;
    bannerPreview: string | null;
    avatarPreview: string | null;
    whatsapp: string;
    instagram: string;
  };
  setShopFormData: (data: Partial<InventoryContextType['shopFormData']>) => void;
  unreadNotificationCount: number;
  buyerFlowState: 'onboarding' | 'home' | 'shopProfile' | 'productDetail' | 'wishlist' | 'bestDresser' | 'bestDresserEntry' | 'quiz' | 'quizResult' | 'notifications' | 'search' | 'shops';
  communityScreen: 'hub' | 'quiz' | 'quizResult' | 'bestDresser' | 'bestDresserEntry' | 'entrySuccess' | 'bracket' | 'hallOfFame';
  currentShopId: string | null;
  currentProductId: string | null;
  setBuyerFlowState: (state: InventoryContextType['buyerFlowState']) => void;
  setCommunityScreen: (screen: InventoryContextType['communityScreen']) => void;
  setCurrentShopId: (id: string | null) => void;
  setCurrentProductId: (id: string | null) => void;
  setSellerFlowState: (state: InventoryContextType['sellerFlowState']) => void;
  addProduct: (productData: Omit<Product, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'view_count' | 'like_count' | 'save_count'>) => Promise<Product | undefined>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  postStory: (story: Omit<Story, 'id' | 'created_at' | 'expires_at' | 'owner_id'>) => Promise<boolean>;
  recordSale: (sale: Omit<SaleLog, 'id' | 'timestamp'>) => void;
  updateStock: (productId: string, size: string, quantityChange: number) => void;
  toggleLike: (productId: string) => void;
  toggleSave: (productId: string) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateCartQuantity: (productId: string, size: string, delta: number) => void;
  clearCart: () => void;
  createOrder: (shopId: string, items: CartItem[], totalPrice: number) => Promise<boolean>;
  setOnboardingComplete: (complete: boolean) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setSessionExpired: (expired: boolean) => void;
  logout: () => void;
  updateUserData: (data: Partial<UserData>) => void;
  setStoriesViewerOpen: (open: boolean, shopId?: string | null) => void;
  updateSubscription: (data: Partial<InventoryContextType['subscriptionData']>) => void;
  setBillingCycle: (val: 'monthly' | 'annual') => void;
  setShopLaunched: (val: boolean) => void;
  setShopDraft: (val: any) => void;
  setSelectedPlan: (val: string | null) => void;
  increaseViewCount: (productId: string) => Promise<void>;
  increaseShopViewCount: (shopId: string) => Promise<void>;
  markStoryAsSeen: (shopId: string) => void;
  isShopOpen: (shopName: string) => boolean;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  toggleFollow: (shopId: string) => void;
  addReview: (shopId: string, review: Omit<Review, 'id' | 'timestamp' | 'helpfulCount' | 'unhelpfulCount'>) => void;
  voteReview: (shopId: string, reviewId: string, vote: 'helpful' | 'unhelpful') => void;
  addSellerResponse: (shopId: string, reviewId: string, text: string) => void;
  addRecentlyViewed: (productId: string) => void;
  refreshInventory: () => Promise<void>;
  loadExistingShop: () => Promise<Shop | null>;
  handleOpenShopCentre: (navigate: any) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session, user, profile, isGuest } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [nominees, setNominees] = useState<any[]>(MOCK_NOMINEES);

  const refreshInventory = useCallback(async () => {
    try {
      const { data: shopsData } = await supabase.from('shops').select('*').eq('is_live', true);
      const { data: productsData } = await supabase.from('products')
        .select('*')
        .eq('is_published', true)
        .eq('status', 'active');
      
      if (shopsData) setShops(shopsData as any);
      if (productsData) setProducts(productsData as any);
    } catch (error) {
      console.error('Error refreshing inventory data:', error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Safety timeout to ensure loading never gets stuck
      const safetyTimeout = setTimeout(() => {
        setLoading(false);
      }, 5000);

      try {
        await refreshInventory();

        // Fetch all reviews
        const { data: reviewsData } = await supabase.from('reviews').select('*');
        if (reviewsData) {
          const groupedReviews: Record<string, Review[]> = {};
          reviewsData.forEach((r: any) => {
            if (!groupedReviews[r.shop_id]) groupedReviews[r.shop_id] = [];
            groupedReviews[r.shop_id].push({
              id: r.id,
              shopId: r.shop_id,
              userName: 'User', // Would join with profiles in real app
              userHandle: 'user',
              rating: r.rating,
              text: r.comment || '',
              timestamp: r.created_at,
              isVerified: true,
              helpfulCount: 0,
              unhelpfulCount: 0
            });
          });
          setReviews(groupedReviews);
        }
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };
    fetchData();
  }, [refreshInventory]);

  const fetchStories = useCallback(async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          shop_id,
          name,
          images,
          created_at,
          shop:shops(id, name, avatar_url)
        `)
        .eq('is_published', true)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setStories(data.map((p: any) => ({
          id: `story-${p.id}`,
          shop_id: p.shop_id,
          owner_id: '',
          media_url: p.images?.[0] || '',
          media_type: 'image',
          content: `New drop: ${p.name}!`,
          product_id: p.id,
          expires_at: new Date(new Date(p.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: p.created_at,
          shop: {
            name: p.shop?.name || 'Shop',
            avatar_url: p.shop?.avatar_url || ''
          }
        })));
      }
    } catch (err) {
      console.error('Error fetching derived stories:', err);
    }
  }, []);

  useEffect(() => {
    fetchStories();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStories, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStories]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setFollowing([]);
        setLikedProductIds([]);
        setSavedProductIds([]);
        setUserShop(null);
        return;
      }

      try {
        // Fetch User Shop
        const { data: shopData } = await supabase
          .from('shops')
          .select('*')
          .eq('owner_id', user.id)
          .single();
        if (shopData) {
          setUserShop(shopData as any);
        }

        // Fetch Follows
        const { data: followsData } = await supabase
          .from('follows')
          .select('shop_id')
          .eq('follower_id', user.id);
        if (followsData) setFollowing(followsData.map(f => f.shop_id));

        // Fetch Likes
        const { data: likesData } = await supabase
          .from('likes')
          .select('product_id')
          .eq('user_id', user.id);
        if (likesData) setLikedProductIds(likesData.map(l => l.product_id));

        // Fetch Saves
        const { data: savesData } = await supabase
          .from('saves')
          .select('product_id')
          .eq('user_id', user.id);
        if (savesData) setSavedProductIds(savesData.map(s => s.product_id));

      } catch (error) {
        console.error('Error fetching user social data:', error);
      }
    };
    fetchUserData();
  }, [user]);
  const [sales, setSales] = useState<SaleLog[]>([]);
  const [likedProductIds, setLikedProductIds] = useState<string[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [userShop, setUserShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [followers, setFollowers] = useState<Record<string, Follower[]>>({});
  
  const [sessionExpired, setSessionExpiredState] = useState(false);
  const [buyerFlowState, setBuyerFlowStateState] = useState<InventoryContextType['buyerFlowState']>('home');
  const [onboardingCompleteState, setOnboardingCompleteState] = useState<boolean>(true);

  // We removed onboarding correction logic from here as it's now handled in App.tsx
  // to prevent infinite redirect loops.

  useEffect(() => {
    if (profile || userShop) {
      setUserData(prev => {
        const updated = {
          ...prev,
          name: profile?.display_name || prev.name,
          handle: profile?.handle || prev.handle,
          avatarUrl: profile?.avatar_url || prev.avatarUrl,
          hasShop: !!userShop,
          isShopLive: userShop?.is_live || false,
          shopName: userShop?.name || prev.shopName,
          shopHandle: userShop?.handle || prev.shopHandle,
          shopLogoUrl: userShop?.logo_url || prev.shopLogoUrl,
          shopBannerUrl: userShop?.banner_url || prev.shopBannerUrl,
          shopCategory: userShop?.categories?.[0] || prev.shopCategory,
          shopDescription: userShop?.description || prev.shopDescription,
          shopArea: userShop?.location || prev.shopArea,
          shopWhatsApp: userShop?.whatsapp || prev.shopWhatsApp,
          shopInstagram: userShop?.instagram || prev.shopInstagram,
          shopIsVerified: userShop?.is_verified || false,
        };
        localStorage.setItem('userData', JSON.stringify(updated));
        return updated;
      });
    }
  }, [profile, userShop]);

  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : {
      name: '',
      handle: '',
      avatarUrl: '',
      role: 'user',
      personality: '',
      styles: [],
      brands: [],
      hasShop: false,
      isShopLive: false,
    };
  });
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentlyViewed');
    return saved ? JSON.parse(saved) : [];
  });
  const [storiesSeen, setStoriesSeen] = useState<Record<string, boolean>>({});
  const [storiesViewerOpen, setStoriesViewerOpenState] = useState(false);
  const [currentStoryShopId, setCurrentStoryShopId] = useState<string | null>(null);

  const [shopLaunched, setShopLaunchedState] = useState(() => localStorage.getItem('shopLaunched') === 'true');
  const [shopDraft, setShopDraftState] = useState(() => {
    const saved = localStorage.getItem('thread_shop_draft');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedPlan, setSelectedPlanState] = useState(() => localStorage.getItem('selectedPlan'));
  const [billingCycle, setBillingCycleState] = useState<'monthly' | 'annual'>(() => {
    const saved = localStorage.getItem('billingCycle');
    return (saved as 'monthly' | 'annual') || 'monthly';
  });
  const [sellerFlowState, setSellerFlowStateState] = useState<InventoryContextType['sellerFlowState']>(() => {
    const saved = localStorage.getItem('sellerFlowState');
    return (saved as InventoryContextType['sellerFlowState']) || null;
  });
  const [shopFormData, setShopFormDataState] = useState<InventoryContextType['shopFormData']>(() => {
    const saved = localStorage.getItem('thread_shop_form_data');
    return saved ? JSON.parse(saved) : {
      name: '',
      handle: '',
      category: '',
      description: '',
      town: localStorage.getItem('thread_user_town') || '',
      directions: '',
      tradingHours: '',
      tradingHoursJson: null,
      bannerFile: null,
      avatarFile: null,
      bannerPreview: null,
      avatarPreview: null,
      whatsapp: '',
      instagram: ''
    };
  });

  const setShopFormData = useCallback((data: Partial<InventoryContextType['shopFormData']>) => {
    setShopFormDataState(prev => {
      const updated = { ...prev, ...data };
      // Exclude File objects from storage as they can't be stringified accurately
      const { bannerFile, avatarFile, ...toStore } = updated;
      localStorage.setItem('thread_shop_form_data', JSON.stringify(toStore));
      return updated;
    });
  }, []);
  const [communityScreen, setCommunityScreen] = useState<InventoryContextType['communityScreen']>(() => {
    const saved = localStorage.getItem('communityScreen');
    return (saved as InventoryContextType['communityScreen']) || 'hub';
  });
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  
  const [subscriptionData, setSubscriptionData] = useState<InventoryContextType['subscriptionData']>(() => {
    const saved = localStorage.getItem('subscriptionData');
    return saved ? JSON.parse(saved) : {
      plan: 'Thread ZW Shop',
      status: 'Active',
      renewalDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      billingCycle: 'monthly',
      memberSince: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      billingHistory: [
        { id: '1', date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), description: 'Trial Activation', amount: 0.00, status: 'Paid' }
      ]
    };
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.rpc('get_unread_notifications_count', { user_id_param: user.id });
      if (!error) setUnreadNotificationCount(data || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setUnreadNotificationCount(0);
      return;
    }

    fetchUnreadCount();

    const channel = supabase
      .channel('notifications_count_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) {
          setNotifications(data.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            subtitle: n.body,
            timestamp: new Date(n.created_at).toLocaleDateString(),
            read: n.read,
            ...n.metadata
          })));
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
  }, [user]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'view_count' | 'like_count' | 'save_count'>) => {
    if (!user) throw new Error('You must be logged in to add a product');
    
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          owner_id: user.id,
          is_published: true,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding product:', error);
        throw error;
      }

      if (data) {
        const newProduct = data as Product;
        setProducts(prev => [newProduct, ...prev]);
        
        // Update local shop product count
        setShops(prev => prev.map(s => s.id === newProduct.shop_id ? { ...s, product_count: (s.product_count || 0) + 1 } : s));
        
        // Also notify
        const shop = shops.find(s => s.id === newProduct.shop_id);
        setNotifications(prev => [{
          id: Date.now().toString(),
          type: 'new_drop',
          title: 'New Drop!',
          subtitle: `${newProduct.name} just landed at ${shop?.name || 'a new shop'}`,
          timestamp: 'Just now',
          read: false,
          productName: newProduct.name,
          shopName: shop?.name || 'Unknown Shop'
        }, ...prev]);
        
        return newProduct;
      }
    } catch (err) {
      console.error('Error in addProduct context function:', err);
      throw err;
    }
  }, [user, shops]);
  
  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    if (!user) throw new Error('You must be logged in to update a product');
    
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating product:', error);
        throw error;
      }

      if (data) {
        const updatedProduct = data as Product;
        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error in updateProduct context function:', err);
      return false;
    }
  }, [user]);

  const deleteProduct = useCallback(async (productId: string) => {
    if (!user) throw new Error('You must be logged in to delete a product');
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'deleted', is_published: false })
        .eq('id', productId)
        .eq('owner_id', user.id); // Ensure ownership

      if (error) {
        console.error('Supabase error deleting product:', error);
        throw error;
      }

      // Update local state
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      // Update shop product count locally if possible
      const productToDelete = products.find(p => p.id === productId);
      if (productToDelete) {
        setShops(prev => prev.map(s => s.id === productToDelete.shop_id ? { ...s, product_count: Math.max(0, (s.product_count || 0) - 1) } : s));
      }

      return true;
    } catch (err) {
      console.error('Error in deleteProduct context function:', err);
      return false;
    }
  }, [user, products, shops]);

  const postStory = useCallback(async (storyData: Omit<Story, 'id' | 'created_at' | 'expires_at' | 'owner_id'>) => {
    if (!user) return false;
    try {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          ...storyData,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        await fetchStories();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error posting story:', err);
      return false;
    }
  }, [user, fetchStories]);

  const recordSale = useCallback((sale: Omit<SaleLog, 'id' | 'timestamp'>) => {
    const newSale = {
      ...sale,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setSales(prev => [newSale, ...prev]);
  }, []);

  const updateStock = useCallback((productId: string, soldSize: string, soldQuantity: number) => {
    setProducts(prev =>
      prev.map(product => {
        if (product.id !== productId) {
          return product
        }
        
        // Parse sizes safely
        let sizes = []
        try {
          if (Array.isArray(product.sizes)) {
            sizes = product.sizes
          } else if (typeof product.sizes === 'string') {
            sizes = JSON.parse(product.sizes || '[]')
          } else if (product.sizes) {
            sizes = product.sizes
          }
        } catch {
          sizes = []
        }
        
        // Update the sold size
        const updatedSizes = sizes.map((s: any) => {
          const sizeKey = s.size || s.name || ''
          if (sizeKey === soldSize) {
            return {
              ...s,
              quantity: Math.max(0, (s.quantity || 0) - soldQuantity)
            }
          }
          return s
        })
        
        // Recalculate total
        const newTotal = updatedSizes.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0)
        
        console.log(
          'Stock update for',
          product.name + ':',
          'was', product.total_stock,
          'now', newTotal,
          'sizes:', updatedSizes
        )
        
        return {
          ...product,
          sizes: updatedSizes,
          total_stock: newTotal
        }
      })
    )
  }, []);

  const toggleLike = useCallback(async (productId: string) => {
    if (!user) return;
    const isLiked = likedProductIds.includes(productId);
    
    try {
      if (isLiked) {
        setLikedProductIds(prev => prev.filter(id => id !== productId));
        await supabase.from('likes').delete().match({ user_id: user.id, product_id: productId });
      } else {
        setLikedProductIds(prev => [...prev, productId]);
        await supabase.from('likes').insert({ user_id: user.id, product_id: productId });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [user, likedProductIds]);

  const toggleSave = useCallback(async (productId: string) => {
    if (!user) return;
    const isSaved = savedProductIds.includes(productId);
    
    try {
      if (isSaved) {
        setSavedProductIds(prev => prev.filter(id => id !== productId));
        await supabase.from('saves').delete().match({ user_id: user.id, product_id: productId });
      } else {
        setSavedProductIds(prev => [...prev, productId]);
        await supabase.from('saves').insert({ user_id: user.id, product_id: productId });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  }, [user, savedProductIds]);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.size === item.size);
      if (existing) {
        return prev.map(i => i.productId === item.productId && i.size === item.size ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, size: string) => {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.size === size)));
  }, []);

  const updateCartQuantity = useCallback((productId: string, size: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId === productId && i.size === size) {
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    }));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const createOrder = useCallback(async (shopId: string, items: CartItem[], totalPrice: number) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.from('orders').insert({
        buyer_id: user.id,
        shop_id: shopId,
        items: items,
        total_price: totalPrice,
        status: 'pending'
      }).select().single();

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating order:', error);
      return false;
    }
  }, [user]);

  const setOnboardingComplete = useCallback((complete: boolean) => {
    setOnboardingCompleteState(complete);
    if (complete) {
      localStorage.setItem('onboardingComplete', 'true');
    } else {
      localStorage.removeItem('onboardingComplete');
    }
  }, []);

  const setIsAuthenticated = useCallback((auth: boolean) => {
    // Relying on session now
  }, []);

  const setSessionExpired = useCallback((expired: boolean) => {
    setSessionExpiredState(expired);
  }, []);

  const logout = useCallback(() => {
    setUserShop(null);
    setUserData({
      name: '',
      role: 'user',
      personality: '',
      styles: [],
      brands: [],
      hasShop: false,
      isShopLive: false,
    });
    localStorage.removeItem('userData');
  }, []);

  const updateUserData = useCallback((data: Partial<UserData>) => {
    setUserData(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('userData', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markStoryAsSeen = useCallback((shopId: string) => {
    setStoriesSeen(prev => ({ ...prev, [shopId]: true }));
  }, []);

  const isShopOpen = useCallback((shopName: string) => {
    const shop = shops.find(s => s.name === shopName);
    if (!shop || shop.is_online_only) return true;

    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[now.getDay()];
    const hours = shop.trading_hours?.[dayName];

    if (!hours || hours.closed) return false;

    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    
    const openTime = new Date(now);
    openTime.setHours(openH, openM, 0);
    
    const closeTime = new Date(now);
    closeTime.setHours(closeH, closeM, 0);

    return now >= openTime && now <= closeTime;
  }, [shops]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const toggleFollow = useCallback(async (shopId: string) => {
    if (!user) return;
    const isFollowing = following.includes(shopId);
    
    try {
      if (isFollowing) {
        setFollowing(prev => prev.filter(id => id !== shopId));
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, follower_count: Math.max(0, (s.follower_count || 0) - 1) } : s));
        await supabase.from('follows').delete().match({ follower_id: user.id, shop_id: shopId });
      } else {
        setFollowing(prev => [...prev, shopId]);
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, follower_count: (s.follower_count || 0) + 1 } : s));
        await supabase.from('follows').insert({ follower_id: user.id, shop_id: shopId });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }, [user, following]);

  const addReview = useCallback(async (shopId: string, reviewData: Omit<Review, 'id' | 'timestamp' | 'helpfulCount' | 'unhelpfulCount'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.from('reviews').insert({
        shop_id: shopId,
        user_id: user.id,
        rating: reviewData.rating,
        comment: reviewData.text
      }).select().single();

      if (data) {
        const newReview: Review = {
          ...reviewData,
          id: data.id,
          timestamp: data.created_at,
          helpfulCount: 0,
          unhelpfulCount: 0
        };
        setReviews(prev => ({
          ...prev,
          [shopId]: [newReview, ...(prev[shopId] || [])]
        }));
      }
    } catch (error) {
      console.error('Error adding review:', error);
    }
  }, [user]);

  const voteReview = useCallback((shopId: string, reviewId: string, vote: 'helpful' | 'unhelpful') => {
    setReviews(prev => {
      const shopReviews = prev[shopId] || [];
      return {
        ...prev,
        [shopId]: shopReviews.map(r => {
          if (r.id === reviewId) {
            const isSameVote = r.userVote === vote;
            let newHelpful = r.helpfulCount;
            let newUnhelpful = r.unhelpfulCount;
            let newUserVote: 'helpful' | 'unhelpful' | undefined = vote;

            if (isSameVote) {
              if (vote === 'helpful') newHelpful--;
              else newUnhelpful--;
              newUserVote = undefined;
            } else {
              if (r.userVote === 'helpful') newHelpful--;
              if (r.userVote === 'unhelpful') newUnhelpful--;
              if (vote === 'helpful') newHelpful++;
              else newUnhelpful++;
            }
            return { ...r, helpfulCount: newHelpful, unhelpfulCount: newUnhelpful, userVote: newUserVote };
          }
          return r;
        })
      };
    });
  }, []);

  const addSellerResponse = useCallback((shopId: string, reviewId: string, text: string) => {
    const response = { text, timestamp: new Date().toISOString() };
    setReviews(prev => ({
      ...prev,
      [shopId]: (prev[shopId] || []).map(r => 
        r.id === reviewId ? { ...r, sellerResponse: response } : r
      )
    }));
  }, []);

  const addRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== productId);
      const updated = [productId, ...filtered].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Debug stock state helper
  useEffect(() => {
    (window as any).debugStockState = async () => {
      if (!userShop?.id) {
        console.log('No shop found for debug.');
        return;
      }
      
      console.log('--- DEBUG: SHOP STOCK STATE ---');
      console.log('Shop ID:', userShop.id);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, total_stock, sizes, view_count')
        .eq('shop_id', userShop.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Debug fetch error:', error);
      } else {
        console.table(data?.map(p => ({
          Name: p.name,
          ID: p.id,
          Stock: p.total_stock,
          Sizes: JSON.stringify(p.sizes)
        })));
      }
      
      const { data: oData } = await supabase
        .from('orders')
        .select('id, product_id, size, quantity, sale_price, created_at')
        .eq('shop_id', userShop.id)
        .order('created_at', { ascending: false });
        
      if (oData) {
        console.log('Recent Orders:');
        console.table(oData.slice(0, 5));
      }
    };
  }, [userShop]);


  const setStoriesViewerOpen = useCallback((open: boolean, shopId: string | null = null) => {
    setStoriesViewerOpenState(open);
    setCurrentStoryShopId(shopId);
  }, []);

  const updateSubscription = useCallback((data: Partial<InventoryContextType['subscriptionData']>) => {
    setSubscriptionData(prev => ({ ...prev, ...data }));
  }, []);

  const setShopLaunched = useCallback((val: boolean) => {
    setShopLaunchedState(val);
    localStorage.setItem('shopLaunched', String(val));
  }, []);

  const setShopDraft = useCallback((val: any) => {
    setShopDraftState(val);
    localStorage.setItem('thread_shop_draft', JSON.stringify(val));
  }, []);

  const setSelectedPlan = useCallback((val: string | null) => {
    setSelectedPlanState(val);
    if (val) localStorage.setItem('selectedPlan', val);
    else localStorage.removeItem('selectedPlan');
  }, []);

  const increaseViewCount = useCallback(async (productId: string) => {
    try {
      await supabase.rpc('increment_product_view_count', { product_id: productId });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, view_count: (p.view_count || 0) + 1 } : p));
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  }, []);

  const increaseShopViewCount = useCallback(async (shopId: string) => {
    try {
      await supabase.rpc('increment_shop_view_count', { shop_id: shopId });
      // setShops(prev => prev.map(s => s.id === shopId ? { ...s, product_count: s.product_count } : s)); 
    } catch (err) {
      console.error('Error incrementing shop view count:', err);
    }
  }, []);

  const setBillingCycle = useCallback((val: 'monthly' | 'annual') => {
    setBillingCycleState(val);
    localStorage.setItem('billingCycle', val);
  }, []);

  const setSellerFlowState = useCallback((val: InventoryContextType['sellerFlowState']) => {
    setSellerFlowStateState(val);
    localStorage.setItem('sellerFlowState', val);
  }, []);

  const setBuyerFlowState = useCallback((val: InventoryContextType['buyerFlowState']) => {
    setBuyerFlowStateState(val);
    localStorage.setItem('buyerFlowState', val);
  }, []);

  const handleSetCommunityScreen = useCallback((val: InventoryContextType['communityScreen']) => {
    setCommunityScreen(val);
    localStorage.setItem('communityScreen', val);
  }, []);

  const loadExistingShop = useCallback(async () => {
    if (!user?.id) return null;
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const foundShop = data as Shop;
        setUserShop(foundShop);
        return foundShop;
      }
      return null;
    } catch (err) {
      console.error('Error loading existing shop:', err);
      return null;
    }
  }, [user]);

  const handleOpenShopCentre = useCallback(async (navigate: any) => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }

    try {
      const existingShop = await loadExistingShop();
      
      if (!existingShop) {
        // No shop, start onboarding
        const onboardingDone = localStorage.getItem('thread_shop_onboarding_done') === 'true';
        setSellerFlowState(onboardingDone ? 'setup_form' : 'seller_onboarding');
        navigate('/shop-centre');
        return;
      }

      // Shop exists, determine state
      const state = getShopState(existingShop);

      switch (state) {
        case 'no_shop':
          setSellerFlowState('seller_onboarding');
          break;
        case 'trial_active':
        case 'trial_paid_pending_code':
        case 'subscription_active':
          setSellerFlowState('live');
          break;
        case 'expired_no_payment':
        case 'subscription_expired':
          setSellerFlowState('paywall');
          break;
        case 'expired_paid_pending_code':
          setSellerFlowState('payment_received');
          break;
        default:
          setSellerFlowState('live');
      }

      navigate('/shop-centre');

    } catch (err) {
      console.error('Error in handleOpenShopCentre:', err);
      navigate('/shop-centre');
    }
  }, [user, loadExistingShop, setSellerFlowState]);

  const contextValue = useMemo(() => ({
    products, shops, nominees, sales, likedProductIds, savedProductIds, cart, notifications,
    stories,
    onboardingComplete: onboardingCompleteState || profile?.onboarding_complete || false,
    isAuthenticated: !!session,
    loading, userShop, userData, storiesSeen,
    following, reviews, followers, recentlyViewed, shopLaunched, shopDraft,
    selectedPlan, billingCycle, sellerFlowState, buyerFlowState, communityScreen, currentShopId, currentProductId,
    storiesViewerOpen, currentStoryShopId, subscriptionData, shopFormData, unreadNotificationCount,
    addProduct, updateProduct, deleteProduct, postStory, recordSale, updateStock, toggleLike, toggleSave, addToCart, removeFromCart,
    updateCartQuantity, clearCart, createOrder, setOnboardingComplete, setIsAuthenticated, sessionExpired,
    setSessionExpired, logout, updateUserData, setStoriesViewerOpen, updateSubscription,
    setBillingCycle, setSellerFlowState, setBuyerFlowState, setCommunityScreen: handleSetCommunityScreen, setCurrentShopId, setCurrentProductId,
    setShopLaunched, setShopDraft, setSelectedPlan, increaseViewCount, increaseShopViewCount, markStoryAsSeen,
    isShopOpen, markNotificationAsRead, markAllNotificationsAsRead, toggleFollow,
    addReview, voteReview, addSellerResponse, addRecentlyViewed, setShopFormData, refreshInventory,
    loadExistingShop, handleOpenShopCentre
  }), [
    products, shops, nominees, sales, likedProductIds, savedProductIds, cart, notifications,
    stories,
    onboardingCompleteState, profile?.onboarding_complete, session, loading, userShop, userData, storiesSeen,
    following, reviews, followers, recentlyViewed, shopLaunched, shopDraft,
    selectedPlan, billingCycle, sellerFlowState, buyerFlowState, communityScreen, currentShopId, currentProductId,
    storiesViewerOpen, currentStoryShopId, subscriptionData, shopFormData, unreadNotificationCount,
    addProduct, updateProduct, deleteProduct, postStory, recordSale, updateStock, toggleLike, toggleSave, addToCart, removeFromCart,
    updateCartQuantity, clearCart, createOrder, setOnboardingComplete, setIsAuthenticated, sessionExpired,
    setSessionExpired, logout, updateUserData, setStoriesViewerOpen, updateSubscription,
    setBillingCycle, setSellerFlowState, setBuyerFlowState, handleSetCommunityScreen, setCurrentShopId, setCurrentProductId,
    setShopLaunched, setShopDraft, setSelectedPlan, increaseViewCount, increaseShopViewCount, markStoryAsSeen,
    isShopOpen, markNotificationAsRead, markAllNotificationsAsRead, toggleFollow,
    addReview, voteReview, addSellerResponse, addRecentlyViewed, setShopFormData, refreshInventory,
    loadExistingShop, handleOpenShopCentre
  ]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
