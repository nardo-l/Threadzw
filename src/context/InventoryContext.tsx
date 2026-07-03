import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
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
  getShopRating: (shopId: string) => { score: string; count: number };
  getProductRating: (productId: string) => { score: string; count: number };
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);

  const [shops, setShops] = useState<Shop[]>([]);
  const [userShop, setUserShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);

  const [sellerFlowState, setSellerFlowState] = useState<InventoryContextType['sellerFlowState']>(() => {
    return (localStorage.getItem('seller_flow_state') as any) || 'dashboard';
  });

  const [userData, setUserData] = useState<UserData>({
    name: 'Seller',
    hasShop: false,
    isShopLive: false,
    shopId: null,
    shopName: '',
    shopHandle: '',
    shopLogo: null,
    shopArea: 'Harare',
    shopWhatsApp: '',
    shopIsVerified: false,
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
    if (!user) {
      setUserShop(null);
      return;
    }
    try {
      console.log('[InventoryContext Diagnostic] Querying shop for user ID:', user.id);
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[InventoryContext Diagnostic] Error while fetching user shop:', error);
        throw error;
      }

      if (data) {
        console.log('[InventoryContext Diagnostic] Shop entry found in database:', data);
        setUserShop(data);
        setUserData(prev => ({
          ...prev,
          hasShop: true,
          isShopLive: data.is_live,
          shopId: data.id,
          shopName: data.name,
          shopHandle: data.handle,
          shopLogo: data.logo_url || null,
          shopWhatsApp: data.whatsapp,
          shopArea: data.location || 'Harare',
          shopIsVerified: data.is_verified || false
        }));
      } else {
        console.log('[InventoryContext Diagnostic] No shop entry found in database for user:', user.id);
        setUserShop(null);
        setUserData(prev => ({
          ...prev,
          hasShop: false,
          isShopLive: false,
          shopId: null,
          shopName: '',
          shopHandle: '',
          shopLogo: null,
          shopWhatsApp: '',
          shopIsVerified: false
        }));
      }
    } catch (err: any) {
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
          // Filter out dummy/mock shops if any of non-UUID format
          const realShops = data.filter(s => {
            const idLower = (s.id || '').toLowerCase();
            const handleLower = (s.handle || '').toLowerCase();
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idLower);
            return isUUID && idLower !== 'demo-shop' && idLower !== 'shop-001' && handleLower !== 'demo';
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
  const [reviews, setReviews] = useState<any>(() => {
    const cached = localStorage.getItem('threadzw_reviews_v1');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached reviews, using seeds', e);
      }
    }
    return {
      "mock-1": [
        {
          id: "rev-1-1",
          userName: "Takunda M.",
          userHandle: "@takunda_m",
          rating: 5,
          text: "Top-tier quality print! Usually prints peel off after three washes but this puff-print is extremely thick and holds up perfectly.",
          timestamp: "2026-05-28T14:30:00Z",
          created_at: "2026-05-28T14:30:00Z",
          helpfulCount: 14,
          unhelpfulCount: 1,
          isVerified: true,
          product_id: "seed_prod_1",
          images: []
        },
        {
          id: "rev-1-2",
          userName: "Sihle N.",
          userHandle: "@sihle_streetwear",
          rating: 4,
          text: "Oversized fit is perfect. Recommending to order normal size for that streetwear aesthetic drape.",
          timestamp: "2026-06-02T09:15:00Z",
          created_at: "2026-06-02T09:15:00Z",
          helpfulCount: 8,
          unhelpfulCount: 0,
          isVerified: true,
          product_id: "seed_prod_1",
          images: []
        }
      ],
      "mock-2": [
        {
          id: "rev-2-1",
          userName: "Farai Z.",
          userHandle: "@farai_z",
          rating: 5,
          text: "Genuinely heavy cotton, thick fabric keeps you warm. Easily superior to imports. The premium hood lining is so cozy.",
          timestamp: "2026-04-15T18:45:00Z",
          created_at: "2026-04-15T18:45:00Z",
          helpfulCount: 22,
          unhelpfulCount: 2,
          isVerified: true,
          product_id: "seed_prod_2",
          images: [],
          sellerResponse: {
            text: "Thank you so much Farai! We source our heavy-weight cotton locally in Harare to support our communities. Glad you love the premium interior feel!",
            timestamp: "2026-04-16T10:00:00Z"
          }
        },
        {
          id: "rev-2-2",
          userName: "Amara C.",
          userHandle: "@amara_codes",
          rating: 5,
          text: "Perfect embroidery. Zimbabwe streetwear is rising! Will buy again next winter.",
          timestamp: "2026-05-20T11:20:00Z",
          created_at: "2026-05-20T11:20:00Z",
          helpfulCount: 9,
          unhelpfulCount: 0,
          isVerified: true,
          product_id: "seed_prod_2",
          images: []
        }
      ],
      "mock-4": [
        {
          id: "rev-4-1",
          userName: "Kuda B.",
          userHandle: "@kuda_kicks",
          rating: 5,
          text: "The lime green sole details make these stand out completely. Super soft leather, walk around in Bulawayo all day without pain.",
          timestamp: "2026-06-04T16:00:00Z",
          created_at: "2026-06-04T16:00:00Z",
          helpfulCount: 5,
          unhelpfulCount: 1,
          isVerified: true,
          product_id: "seed_prod_4",
          images: []
        }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('threadzw_reviews_v1', JSON.stringify(reviews));
  }, [reviews]);

  // Load and sync reviews from Supabase database in an offline-resilient manner
  useEffect(() => {
    const fetchReviewsFromSupabase = async () => {
      try {
        const { data, error } = await supabase.from('reviews').select('*');
        if (error) {
          console.warn("Supabase fetch reviews returned error, using local/seeds:", error);
          return;
        }
        if (data && data.length > 0) {
          setReviews((prev: any) => {
            const merged = { ...prev };
            data.forEach((row: any) => {
              const shopId = row.shop_id || 'seed_shop';
              if (!merged[shopId]) {
                merged[shopId] = [];
              }
              const formatted = {
                id: row.id,
                product_id: row.product_id,
                rating: row.rating,
                text: row.comment || row.text || '',
                userName: row.user_name || 'Anonymous',
                userHandle: row.user_handle || '@anonymous',
                isVerified: !!row.is_verified,
                helpfulCount: row.helpful_count || 0,
                unhelpfulCount: row.unhelpful_count || 0,
                created_at: row.created_at,
                reply: row.reply || null,
                images: row.images || [],
                badges: row.badges || [],
                sellerResponse: row.reply ? { text: row.reply, timestamp: row.reply_created_at || row.created_at } : undefined
              };
              // Filter out existing reviews with the same ID
              merged[shopId] = merged[shopId].filter((r: any) => r.id !== row.id);
              merged[shopId].push(formatted);
            });
            return merged;
          });
        }
      } catch (e) {
        console.warn("Failed to fetch reviews from Supabase:", e);
      }
    };
    fetchReviewsFromSupabase();
  }, [user]);

  const getShopRating = useCallback((shopId: string) => {
    const shopReviews = reviews[shopId] || [];
    if (shopReviews.length > 0) {
      const sum = shopReviews.reduce((acc: number, r: any) => acc + r.rating, 0);
      return {
        score: (sum / shopReviews.length).toFixed(1),
        count: shopReviews.length
      };
    }
    let sum = 0;
    const cleanId = shopId || 'seed_shop';
    for (let i = 0; i < cleanId.length; i++) {
      sum += cleanId.charCodeAt(i);
    }
    const score = 4.4 + (sum % 7) * 0.1;
    const count = 15 + (sum % 170);
    return {
      score: score.toFixed(1),
      count
    };
  }, [reviews]);

  const getProductRating = useCallback((productId: string) => {
    let prodReviews: any[] = [];
    Object.values(reviews).forEach((shopRevList: any) => {
      if (Array.isArray(shopRevList)) {
        const matching = shopRevList.filter((r: any) => r.product_id === productId || r.productId === productId);
        prodReviews.push(...matching);
      }
    });

    if (prodReviews.length > 0) {
      const sum = prodReviews.reduce((acc: number, r: any) => acc + r.rating, 0);
      return {
        score: (sum / prodReviews.length).toFixed(1),
        count: prodReviews.length
      };
    }

    let sum = 0;
    const cleanId = productId || 'seed_prod';
    for (let i = 0; i < cleanId.length; i++) {
      sum += cleanId.charCodeAt(i);
    }
    const score = 4.5 + (sum % 6) * 0.1;
    const count = 3 + (sum % 22);
    return {
      score: score.toFixed(1),
      count
    };
  }, [reviews]);

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
      const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
      const newR = {
        ...r,
        id: newId,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        helpfulCount: 0,
        unhelpfulCount: 0,
      };

      // 1. Instantly update local state for real-time responsiveness
      setReviews((prev: any) => {
        const list = prev[sid] || [];
        const filtered = list.filter((x: any) => x.id !== newId);
        return { ...prev, [sid]: [newR, ...filtered] };
      });

      // 2. Persist asynchronously to Supabase
      try {
        const pName = products.find(p => p.id === r.product_id)?.name || 'your product';
        const reviewRow = {
          id: newId,
          shop_id: sid,
          user_id: user?.id || null,
          rating: r.rating,
          comment: r.text || '',
          product_id: r.product_id || null,
          user_name: r.userName || 'Anonymous',
          user_handle: r.userHandle || '@anonymous',
          is_verified: !!r.isVerified,
          helpful_count: 0,
          unhelpful_count: 0,
          reply: null,
          images: r.images || [],
          badges: r.badges || []
        };
        
        const { error } = await supabase.from('reviews').insert([reviewRow]);
        if (error) {
          console.warn("Supabase review insert failed, retaining locally:", error);
        } else {
          console.log("Review saved to Supabase successfully!");
          
          // Insert review photos if present
          if (r.images && r.images.length > 0) {
            const photoRows = r.images.map((img: string) => ({
              review_id: newId,
              image_url: img
            }));
            const { error: photoError } = await supabase.from('review_photos').insert(photoRows);
            if (photoError) console.warn("Could not insert review photos into Supabase:", photoError);
          }

          // Insert badges into reviewer_badges if present
          if (r.badges && r.badges.length > 0 && user?.id) {
            const badgeRows = r.badges.map((b: string) => ({
              user_id: user.id,
              badge_type: b
            }));
            const { error: badgeError } = await supabase.from('reviewer_badges').insert(badgeRows);
            if (badgeError) console.warn("Could not insert reviewer badges into Supabase:", badgeError);
          }

          // Trigger review notifications (Milestones or Score Alerts)
          try {
            const currentReviewsCount = (reviews[sid] || []).length + 1;
            let notificationType: 'new_review' | 'five_star' | 'one_star_alert' | 'milestone_50' | 'milestone_100' | 'rating_drop' | null = null;
            let notificationTitle = "";
            let notificationBody = "";

            if (r.rating === 5) {
              notificationType = 'five_star';
              notificationTitle = "⭐ New 5-Star Review!";
              notificationBody = `${r.userName} left a 5-star review for ${pName}: "${r.text.slice(0, 45)}..."`;
            } else if (r.rating === 1) {
              notificationType = 'one_star_alert';
              notificationTitle = "⚠️ New 1-Star Review Alert";
              notificationBody = `${r.userName} left a 1-star review: "${r.text.slice(0, 45)}..."`;
            } else {
              notificationType = 'new_review';
              notificationTitle = "💬 New Customer Review";
              notificationBody = `${r.userName} left a ${r.rating}-star review: "${r.text.slice(0, 45)}..."`;
            }

            if (currentReviewsCount === 50) {
              notificationType = 'milestone_50';
              notificationTitle = "🏆 Landmark Achieved: 50 Reviews!";
              notificationBody = "Your boutique has accumulated 50 customer reviews! You've unlocked the Elite Boutique trust banner.";
            } else if (currentReviewsCount === 100) {
              notificationType = 'milestone_100';
              notificationTitle = "👑 Milestone Unlocked: 100 Reviews!";
              notificationBody = "Incredible! 100 customer reviews registered. You are officially an industry-leading seller on ThreadZW.";
            }

            if (notificationType) {
              // Insert into custom review_notifications table
              const { error: notifErr } = await supabase.from('review_notifications').insert([{
                shop_id: sid,
                type: notificationType,
                title: notificationTitle,
                body: notificationBody,
                data: { review_id: newId, rating: r.rating, userName: r.userName }
              }]);
              if (notifErr) console.warn("Could not save review notification:", notifErr);
              
              // Also add to standard notifications table if user is available
              if (user?.id) {
                const { error: globalNotifErr } = await supabase.from('notifications').insert([{
                  user_id: user.id,
                  type: 'announcement',
                  title: notificationTitle,
                  body: notificationBody,
                  data: { review_id: newId, rating: r.rating, shop_id: sid }
                }]);
                if (globalNotifErr) console.warn("Could not save global notification:", globalNotifErr);
              }
            }
          } catch (notifException) {
            console.warn("Error processing notifications:", notifException);
          }
        }
      } catch (err) {
        console.warn("Failed to write review to Supabase:", err);
      }

      return newR;
    },
    voteReview: (sid: string, id: string, type: any) => {
      // 1. Instantly update local state
      setReviews((prev: any) => {
        let isSame = false;
        const list = (prev[sid] || []).map((r: any) => {
          if (r.id === id) {
            isSame = r.userVote === type;
            return {
              ...r,
              userVote: isSame ? null : type,
              helpfulCount: type === 'helpful' ? (isSame ? r.helpfulCount - 1 : r.helpfulCount + 1) : r.helpfulCount,
              unhelpfulCount: type === 'unhelpful' ? (isSame ? r.unhelpfulCount - 1 : r.unhelpfulCount + 1) : r.unhelpfulCount,
            };
          }
          return r;
        });

        // 2. Persist asynchronously in background IIFE
        (async () => {
          try {
            const finalVote = isSame ? null : type;
            
            if (user?.id) {
              if (finalVote) {
                const { error: rxError } = await supabase.from('review_reactions').upsert([{
                  review_id: id,
                  user_id: user.id,
                  reaction_type: finalVote
                }], { onConflict: 'review_id,user_id' });
                if (rxError) console.warn("Supabase reaction upsert failed:", rxError);
              } else {
                const { error: rxDeleteError } = await supabase.from('review_reactions')
                  .delete()
                  .eq('review_id', id)
                  .eq('user_id', user.id);
                if (rxDeleteError) console.warn("Supabase reaction delete failed:", rxDeleteError);
              }
            }

            const targetReview = list.find((r: any) => r.id === id);
            if (targetReview) {
              const { error: updError } = await supabase.from('reviews')
                .update({
                  helpful_count: targetReview.helpfulCount,
                  unhelpful_count: targetReview.unhelpfulCount
                })
                .eq('id', id);
              if (updError) console.warn("Supabase reviews count update failed:", updError);
            }
          } catch (e) {
            console.warn("Failed to sync reaction to database:", e);
          }
        })();

        return { ...prev, [sid]: list };
      });
    },
    addSellerResponse: (sid: string, id: string, s: string) => {
      // 1. Instantly update local state
      setReviews((prev: any) => {
        const list = (prev[sid] || []).map((r: any) => {
          if (r.id === id) {
            if (!s) {
              const updated = { ...r };
              delete updated.sellerResponse;
              delete updated.reply;
              return updated;
            }
            return { 
              ...r, 
              reply: s,
              sellerResponse: { text: s, timestamp: new Date().toISOString() } 
            };
          }
          return r;
        });

        // 2. Persist asynchronously in background IIFE
        (async () => {
          try {
            const { error: revUpdateErr } = await supabase.from('reviews')
              .update({
                reply: s || null,
                reply_created_at: s ? new Date().toISOString() : null
              })
              .eq('id', id);
            if (revUpdateErr) console.warn("Supabase reviews table reply update failed:", revUpdateErr);

            if (s) {
              const { error: replyUpsertErr } = await supabase.from('merchant_replies').upsert([{
                review_id: id,
                shop_id: sid,
                reply_text: s,
                created_at: new Date().toISOString()
              }], { onConflict: 'review_id' });
              if (replyUpsertErr) console.warn("Supabase merchant_replies upsert failed:", replyUpsertErr);
            } else {
              const { error: replyDeleteErr } = await supabase.from('merchant_replies')
                .delete()
                .eq('review_id', id);
              if (replyDeleteErr) console.warn("Supabase merchant_replies delete failed:", replyDeleteErr);
            }
          } catch (e) {
            console.warn("Failed to sync merchant reply to database:", e);
          }
        })();

        return { ...prev, [sid]: list };
      });
    },
    getShopRating,
    getProductRating,
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
