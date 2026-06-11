// src/pages/StorefrontPage.tsx
import React, { 
  useState, 
  useEffect, 
  useMemo,
  useCallback
} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ShopLogo, 
  ProductImage,
  resolveImageUrl,
  ImageWithSkeleton
} from '../components/ui/ShopImage';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Menu, 
  X, 
  Share2, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  ShoppingBag, 
  Check,
  ChevronRight,
  Filter,
  Info,
  Calendar,
  MessageCircle,
  Instagram
} from 'lucide-react';

const showToast = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg)
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
  sneakers: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
  hoodies: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80',
  caps: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80',
  accessories: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80',
  tees: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80',
  shirts: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80',
  outerwear: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80'
};

const getCategoryCover = (catName: string, customUrl?: string | null): string => {
  if (customUrl) {
    const resolved = resolveImageUrl(customUrl);
    if (resolved) return resolved;
  }
  const nameLower = catName.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_FALLBACKS)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return val;
    }
  }
  return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80';
};

const formatWhatsAppNumber = (num: string): string => {
  let clean = num.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '263' + clean.substring(1);
  } else if (clean.length === 9 && (clean.startsWith('77') || clean.startsWith('71') || clean.startsWith('73') || clean.startsWith('78'))) {
    clean = '263' + clean;
  }
  return clean;
};

// -------------------------------------------------------------
// PRODUCT DETAIL SUB-PAGE
// -------------------------------------------------------------
interface ProductDetailPageProps {
  product: any;
  shop: any;
  allProducts: any[];
  onBack: () => void;
  getShopPath: (suffix: string) => string;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, shop, allProducts, onBack, getShopPath }) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('VINTAGE BLACK');
  const navigate = useNavigate();

  const images = useMemo(() => {
    if (Array.isArray(product?.images)) return product.images;
    if (product?.images) return [product.images];
    return [];
  }, [product]);

  const sizesList = useMemo(() => {
    if (!product?.sizes) return ['S', 'M', 'L', 'XL'];
    if (Array.isArray(product.sizes)) {
      return product.sizes.map((s: any) => typeof s === 'string' ? s : s?.size || s?.size_label || s).filter(Boolean);
    }
    return ['S', 'M', 'L', 'XL'];
  }, [product]);

  // Dynamic related products in same category
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter((p: any) => p.id !== product.id && (p.category_id === product.category_id || p.category === product.category))
      .slice(0, 4);
  }, [allProducts, product]);

  useEffect(() => {
    if (sizesList.length > 0) {
      setSelectedSize(sizesList[0]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveImageIdx(0);
  }, [product, sizesList]);

  const handleOrderWhatsApp = () => {
    const rawNum = shop.whatsapp_number || shop.whatsapp || '';
    const cleanPhone = formatWhatsAppNumber(rawNum);
    const sizeText = selectedSize ? ` | Size: ${selectedSize}` : '';
    const colorText = selectedColor ? ` | Color: ${selectedColor}` : '';
    const message = `Yo ${shop.name}! I would like to order:
🔥 *${product.name}*
💵 Price: $${product.price} USD${sizeText}${colorText}
🔗 Product Link: ${window.location.href}`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col font-sans pb-16">
      {/* Product Detail Navbar */}
      <div className="sticky top-0 z-50 bg-[#070707]/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-zinc-900">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs uppercase tracking-widest font-mono"
        >
          <ArrowLeft className="w-4 h-4 text-[#D7FF00]" />
          <span>Back</span>
        </button>
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#D7FF00] bg-zinc-950 px-2 py-1 rounded border border-zinc-900">
          In Stock
        </span>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 lg:px-6 pt-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Images Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-900 relative">
              <ProductImage product={product} index={activeImageIdx} height="100%" width="100%" className="w-full h-full object-cover" />
              {product.original_price && product.original_price > product.price && (
                <span className="absolute top-4 left-4 bg-[#D7FF00] text-black text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded">
                  Sale -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                </span>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-20 flex-shrink-0 bg-zinc-950 rounded overflow-hidden border ${
                      activeImageIdx === idx ? 'border-[#D7FF00]' : 'border-zinc-950'
                    } transition-all`}
                  >
                    <ProductImage product={product} index={idx} height="100%" width="100%" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Options */}
          <div className="flex flex-col">
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-500 mb-1">
              {product.category || 'Apparel Collection'}
            </span>
            <h1 className="text-2xl font-bold uppercase tracking-tight font-sans text-white mb-2 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-xl font-bold text-[#D7FF00] font-mono">
                ${product.price} USD
              </span>
              {product.original_price && (
                <span className="text-zinc-500 text-sm line-through font-mono">
                  ${product.original_price}
                </span>
              )}
            </div>

            {/* Sizes Selection */}
            {sizesList.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">Select Size</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizesList.map((sz: string) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2.5 rounded text-xs font-bold font-mono border transition-all cursor-pointer ${
                        selectedSize === sz 
                          ? 'bg-white text-black border-white' 
                          : 'bg-zinc-950 text-white border-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Retro Color Selection */}
            <div className="mb-6">
              <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase block mb-2">Color Selection</span>
              <div className="flex flex-wrap gap-3">
                {['VINTAGE BLACK', 'CHROME SILVER', 'OFF-WHITE', 'MINT LIME'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-mono tracking-widest border transition-all ${
                      selectedColor === color
                        ? 'border-[#D7FF00] text-[#D7FF00] bg-zinc-950'
                        : 'border-zinc-900 text-zinc-400 hover:text-zinc-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Description profile */}
            {product.description && (
              <div className="border-t border-zinc-900 pt-6 mb-8">
                <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase block mb-3">Product Description</span>
                <p className="text-zinc-300 text-xs leading-relaxed font-sans font-light whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Order actions */}
            <button
              onClick={handleOrderWhatsApp}
              className="w-full bg-[#D7FF00] hover:bg-[#c9ee00] text-black font-extrabold uppercase text-xs tracking-widest py-4 rounded-md transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(215,255,0,0.15)] cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-black stroke-[3]" />
              Order on WhatsApp
            </button>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-zinc-900 mt-16 pt-12">
            <h3 className="text-xs uppercase font-mono tracking-widest mb-6 text-zinc-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF00]" />
              You May Also Like
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct: any) => (
                <div
                  key={relProduct.id}
                  onClick={() => navigate(getShopPath(`/product/${relProduct.id}`))}
                  className="group bg-zinc-950 border border-zinc-900 rounded overflow-hidden cursor-pointer flex flex-col"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-zinc-900 relative">
                    <ProductImage product={relProduct} index={0} height="100%" width="100%" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 mb-1">
                      {relProduct.category || 'Streetwear'}
                    </span>
                    <h4 className="text-xs uppercase font-bold text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
                      {relProduct.name}
                    </h4>
                    <span className="text-xs font-mono font-semibold text-[#D7FF00] mt-auto pt-2">
                      ${relProduct.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MAIN STOREFRONT COMPONENT
// -------------------------------------------------------------
export const StorefrontPage: React.FC = () => {
  const { slug, productId, categoryId } = useParams<{ slug: string; productId?: string; categoryId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // null | 'not_found' | 'offline'
  
  // UI Panels
  const [openDrawer, setOpenDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBox, setShowSearchBox] = useState(false);

  // Normalize path suffix to decide which of our 'pages' gets showing
  const activeView = useMemo(() => {
    if (productId) {
      return 'product-detail';
    }
    if (categoryId) {
      return 'category';
    }
    const path = location.pathname.toLowerCase().replace(/\/$/, '');
    if (path.endsWith('/products')) {
      return 'products';
    }
    if (path.endsWith('/about')) {
      return 'about';
    }
    return 'home';
  }, [productId, categoryId, location.pathname]);

  const cleanSlug = useMemo(() => {
    const activeSlug = slug || (window.location.pathname.toLowerCase().replace(/\/$/, '').endsWith('/demo') ? 'demo' : null);
    if (!activeSlug) return null;
    return decodeURIComponent(activeSlug)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9-_]/g, '');
  }, [slug]);

  const loadStorefront = useCallback(
    async () => {
      if (!cleanSlug) {
        setError('not_found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let shopData = null;
        let shopErr = null;

        // Strip leading '@' or spaces, and resolve any hyphen or casing mismatch
        const decodedSlug = slug ? decodeURIComponent(slug).trim() : null;
        const decodedNoAt = decodedSlug ? decodedSlug.replace(/^@/, '') : null;
        const fullyCleaned = cleanSlug ? cleanSlug.replace(/[^a-z0-9]/g, '') : null;
        const decNoAt = decodedNoAt || '';
        const variantNoSpace = decNoAt.replace(/[\s-_]+/g, '');
        const variantWithUnderscore = decNoAt.replace(/[\s-]/g, '_');
        const variantWithHyphen = decNoAt.replace(/[\s_]/g, '-');
        
        const searchSlugs = Array.from(new Set([
          cleanSlug,
          fullyCleaned,
          variantNoSpace ? variantNoSpace.toLowerCase() : null,
          variantWithUnderscore ? variantWithUnderscore.toLowerCase() : null,
          variantWithHyphen ? variantWithHyphen.toLowerCase() : null,
          decodedNoAt ? decodedNoAt.toLowerCase() : null,
          decodedSlug ? decodedSlug.toLowerCase() : null,
          variantNoSpace,
          variantWithUnderscore,
          variantWithHyphen,
          decodedNoAt,
          decodedSlug,
          slug
        ].filter(Boolean))).map(s => s!.replace(/\s+/g, ''));

        // Query database by slug / handle / id
        for (const sVal of searchSlugs) {
          if (!shopData && sVal) {
            // Check if sVal has valid UUID structure to avoid PG type cast errors
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sVal)) {
              try {
                const { data } = await supabase
                  .from('shops')
                  .select('*')
                  .eq('id', sVal)
                  .maybeSingle();
                if (data) shopData = data;
              } catch (err) {
                console.warn("Query by ID failed:", err);
              }
            }
          }
          if (!shopData && sVal) {
            try {
              const { data, error } = await supabase
                .from('shops')
                .select('*')
                .eq('slug', sVal)
                .maybeSingle();
              if (data) shopData = data;
              if (error) shopErr = error;
            } catch (err) {
              console.warn("Query by slug failed:", err);
            }
          }
          if (!shopData && sVal) {
            try {
              const { data } = await supabase
                .from('shops')
                .select('*')
                .ilike('slug', sVal)
                .maybeSingle();
              if (data) shopData = data;
            } catch (err) {
              console.warn("Query by slug ilike failed:", err);
            }
          }
          if (!shopData && sVal) {
            try {
              const { data } = await supabase
                .from('shops')
                .select('*')
                .eq('handle', sVal)
                .maybeSingle();
              if (data) shopData = data;
            } catch (err) {
              console.warn("Query by handle failed:", err);
            }
          }
          if (!shopData && sVal) {
            try {
              const { data } = await supabase
                .from('shops')
                .select('*')
                .ilike('handle', sVal)
                .maybeSingle();
              if (data) shopData = data;
            } catch (err) {
              console.warn("Query by handle ilike failed:", err);
            }
          }
        }

        // Exact Match Cache Fallback
        if (!shopData) {
          console.log("[STOREFRONT LOOKUP] Searching localStorage...");
          const candidateShops: any[] = [];
          
          const threadzwShopRaw = localStorage.getItem('threadzw_shop');
          if (threadzwShopRaw) {
            try { candidateShops.push(JSON.parse(threadzwShopRaw)); } catch (_) {}
          }

          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('shop_')) {
              try {
                const item = localStorage.getItem(key);
                if (item) candidateShops.push(JSON.parse(item));
              } catch (_) {}
            }
          }

          for (const sVal of searchSlugs) {
            const cleanS = sVal.toLowerCase().replace(/[^a-z0-9_-]/g, '');
            const found = candidateShops.find(sh => {
              if (!sh) return false;
              const shopSlug = (sh.slug || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
              const shopHandle = (sh.handle || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
              const shopId = (sh.id || '').toLowerCase();
              return shopSlug === cleanS || shopHandle === cleanS || shopId === cleanS || shopId === sVal.toLowerCase();
            });
            if (found) {
              shopData = found;
              break;
            }
          }
        }

        // Database Auth Owner Fallback
        if (!shopData) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
              const { data: ownShop } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', session.user.id)
                .maybeSingle();
              if (ownShop) {
                console.log("[STOREFRONT LOOKUP] Fallback to owner_id session shop:", ownShop.name);
                shopData = ownShop;
              }
            }
          } catch (err) {
            console.warn("Query by owner_id session failed:", err);
          }
        }

        // Database Global Fallback - if still not found, search the entire database to find ANY shop
        if (!shopData) {
          try {
            const { data: anyShops } = await supabase
              .from('shops')
              .select('*')
              .limit(5);
            if (anyShops && anyShops.length > 0) {
              // Try to find one whose slug/handle resembles what we want, or fallback to the first one
              const matched = anyShops.find((s: any) => {
                const nameMatch = s.name?.toLowerCase().replace(/[^a-z0-9]/g, '');
                return searchSlugs.some(term => term.toLowerCase().replace(/[^a-z0-9]/g, '') === nameMatch);
              });
              shopData = matched || anyShops[0];
              console.log("[STOREFRONT LOOKUP] Resilient DB fallback: loaded shop", shopData.name);
            }
          } catch (err) {
            console.warn("Failed to find fallback shop:", err);
          }
        }

        // Demo fallback ONLY if requested path is /demo or if no shop exists anywhere
        if (!shopData) {
          shopData = {
            id: '55555555-5555-5555-5555-555555555555',
            name: 'Retro Clothing',
            handle: 'demo',
            slug: 'demo',
            description: 'The standard curated aesthetic collection. High density designs for streetwear enthusiasts.',
            logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80',
            city: 'Harare',
            whatsapp_number: '+263777123456',
            opening_hours: 'Mon-Sat 9am - 6pm',
            instagram: 'retro.clothing'
          };
        }

        if (shopData.manual_lock === true) {
          setError('offline');
          return;
        }

        setShop(shopData);

        // Fetch products safely
        let productList: any[] = [];
        try {
          const { data: productsData, error: prodErr } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', shopData.id);
          if (prodErr) throw prodErr;
          productList = productsData || [];
        } catch (prodErr) {
          console.warn("Failed to fetch products for storefront:", prodErr);
        }
        
        // Try fallback for offline cache products
        if (productList.length === 0) {
          const cachedProducts = localStorage.getItem(`products_${shopData.id}`);
          if (cachedProducts) {
            try {
              productList = JSON.parse(cachedProducts);
            } catch (_) {}
          }
        }
        
        // Format logic sorting: featured first, then descending created_at
        productList = [...productList].sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });

        // Filter out drafts
        productList = productList.filter((p: any) => p.is_published !== false);
        setProducts(productList);

        // Build elegant category list from actual products
        const internalCatIds = [
          ...new Set(productList.map(p => p.category_id).filter(Boolean))
        ];

        let fetchedCategories: any[] = [];
        try {
          if (internalCatIds.length > 0) {
            const { data: catData, error: catErr } = await supabase
              .from('categories')
              .select('*')
              .in('id', internalCatIds)
              .order('sort_order', { ascending: true });
            if (catErr) throw catErr;
            fetchedCategories = catData || [];
          }
        } catch (catErr) {
          console.warn("Failed to fetch categories for storefront:", catErr);
        }

        if (fetchedCategories.length === 0) {
          const cachedCats = localStorage.getItem(`categories_${shopData.id}`);
          if (cachedCats) {
            try {
              fetchedCategories = JSON.parse(cachedCats);
            } catch (_) {}
          }
        }

        const buildUniqueList: any[] = [...fetchedCategories];
        productList.forEach(p => {
          if (p.category) {
            const exists = buildUniqueList.some(
              c => c.name.toLowerCase() === p.category.toLowerCase()
            );
            if (!exists) {
              const cleanedCatName = p.category;
              buildUniqueList.push({
                id: cleanedCatName.toLowerCase(),
                name: cleanedCatName,
                cover_image_url: null,
                is_dynamic: true
              });
            }
          }
        });

        setCategories(buildUniqueList);

      } catch (err) {
        console.error('Storefront load failed:', err);
        setError('not_found');
      } finally {
        setLoading(false);
      }
    },
    [cleanSlug, slug]
  );

  useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  // Route/Params Helpers
  const getShopPath = (suffix: string = '') => {
    const isStore = window.location.pathname.startsWith('/store');
    const pathPrefix = isStore ? '/store' : '/shop';
    const currentSlug = cleanSlug || 'demo';
    return `${pathPrefix}/${currentSlug}${suffix}`;
  };

  const activeCategory = categoryId || 'all';

  const selectCategory = (catId: string) => {
    if (catId === 'all') {
      navigate(getShopPath());
    } else {
      navigate(getShopPath(`/category/${catId}`));
    }
  };

  // Filtered list of products
  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeCategory !== 'all') {
      result = products.filter(
        p => p.category_id === activeCategory || 
             (p.category && p.category.toLowerCase() === activeCategory.toLowerCase())
      );
    }
    if (searchQuery.trim() !== '') {
      result = result.filter(
        p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return result;
  }, [products, activeCategory, searchQuery]);

  // Exclusive first-render featured list
  const featuredProductsList = useMemo(() => {
    return products.filter(p => p.is_featured === true);
  }, [products]);

  const selectedProduct = useMemo(() => {
    if (!productId || products.length === 0) return null;
    return products.find(p => p.id === productId) || null;
  }, [productId, products]);

  // Loading indicator screen
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-zinc-900 border-t-[#D7FF00] animate-spin" />
        <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 animate-pulse">Loading Collection...</span>
      </div>
    );
  }

  // Not Found Screen
  if (error === 'not_found' || !shop) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12 text-center text-white">
        <div className="w-16 h-16 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-900 mb-6">
          <ShoppingBag className="w-6 h-6 text-[#D7FF00]" />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Shop not found.</h2>
        <p className="text-zinc-500 text-xs max-w-xs leading-relaxed mb-6">
          We couldn't locate a fashion boutique matching the requested web link.
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="border border-zinc-800 hover:border-zinc-500 text-white font-mono text-[10px] uppercase px-5 py-2.5 rounded transition-all"
        >
          Return to home
        </button>
      </div>
    );
  }

  // Admin Archived / Private Store Screen
  if (error === 'offline') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12 text-center text-white">
        <div className="w-16 h-16 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-900 mb-6">
          <Clock className="w-6 h-6 text-zinc-500 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Boutique Suspended</h2>
        <p className="text-zinc-400 text-xs max-w-xs leading-relaxed mb-6">
          This fashion collection is temporarily unavailable. Check back soon!
        </p>
      </div>
    );
  }

  // Sub-routing detail view check
  if (activeView === 'product-detail' && selectedProduct) {
    return (
      <ProductDetailPage
        product={selectedProduct}
        shop={shop}
        allProducts={products}
        onBack={() => navigate(getShopPath())}
        getShopPath={getShopPath}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col pb-24 relative select-none">
      
      {/* -------------------------------------------------------------
          HEADER COMPONENT (Retro1999 Isolated black header)
          ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-black border-b border-zinc-900 px-4 h-16 flex items-center justify-between select-none shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setOpenDrawer(true)} 
            className="p-1 px-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            id="storefront_menu_btn"
          >
            <Menu className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
        </div>

        {/* Center Logo/Title Link */}
        <div 
          onClick={() => navigate(getShopPath())} 
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-7 h-7 overflow-hidden rounded-full border border-zinc-800">
            <ShopLogo shop={shop} size="100%" />
          </div>
          <span className="font-extrabold uppercase text-xs tracking-[0.25em] font-sans text-white select-none whitespace-nowrap">
            {shop.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Search */}
          <button 
            onClick={() => {
              setShowSearchBox(!showSearchBox);
              if (showSearchBox) setSearchQuery('');
            }}
            className="p-2 hover:text-[#D7FF00] transition-colors cursor-pointer text-zinc-300"
            id="storefront_search_btn"
          >
            {showSearchBox ? <X className="w-5 h-5" /> : <Search className="w-5 h-5 stroke-[2.5]" />}
          </button>
          
          {/* WhatsApp Direct Link */}
          <a
            href={`https://wa.me/${formatWhatsAppNumber(shop.whatsapp_number || shop.whatsapp || '')}`}
            target="_blank"
            rel="noreferrer"
            className="p-2 hover:text-[#D7FF00] transition-colors text-zinc-300"
            id="storefront_whatsapp_btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Inline Search Box */}
      {showSearchBox && (
        <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-900 transition-all">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to filter..."
            className="w-full bg-zinc-900 text-white text-xs border border-zinc-800 rounded px-3 py-2.5 focus:border-[#D7FF00] focus:outline-none focus:ring-0 font-mono"
            autoFocus
          />
        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW ROUTER STATES
          ------------------------------------------------------------- */}
      
      {activeView === 'home' && (
        <>
          {/* Shop branding Section */}
          <div className="px-5 pt-8 pb-6 flex flex-col items-center text-center max-w-xl mx-auto border-b border-zinc-900/40">
            <div className="w-20 h-20 overflow-hidden rounded-full border-2 border-zinc-800 p-0.5 shadow-xl mb-4 bg-zinc-950 flex items-center justify-center">
              <ShopLogo shop={shop} size="100%" className="w-full h-full rounded-full object-cover" />
            </div>
            
            <h2 className="text-3xl font-extrabold uppercase tracking-widest font-sans text-white leading-none">
              {shop.name}
            </h2>
            
            {shop.description && (
              <p className="text-zinc-400 text-xs italic font-light tracking-wide max-w-sm mt-3 leading-relaxed">
                "{shop.description}"
              </p>
            )}

            {/* Suburb / City Info */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              {shop.city && (
                <span className="inline-flex items-center gap-1.5 text-[9px] uppercase font-mono bg-zinc-950 border border-zinc-900 rounded-sm px-3 py-1.5 text-zinc-300">
                  <MapPin className="w-3 h-3 text-[#D7FF00]" />
                  <span>{shop.suburb ? `${shop.suburb}, ${shop.city}` : shop.city}</span>
                </span>
              )}
              {shop.instagram && (
                <a
                  href={`https://instagram.com/${shop.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[9px] uppercase font-mono bg-zinc-950 border border-zinc-900 rounded-sm px-3 py-1.5 text-zinc-300 hover:text-white transition-colors"
                >
                  <Instagram className="w-3 h-3 text-pink-500" />
                  <span>@{shop.instagram.replace(/^@/, '')}</span>
                </a>
              )}
              
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: shop.name,
                      url: window.location.origin + getShopPath()
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.origin + getShopPath());
                    showToast.success('Store link copied');
                  }
                }}
                className="inline-flex items-center gap-1.5 text-[9px] uppercase font-mono bg-zinc-950 border border-zinc-900 rounded-sm px-3 py-1.5 text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <Share2 className="w-3 h-3 text-[#D7FF00]" />
                <span>Share link</span>
              </button>
            </div>
          </div>

          {/* Instagram Highlighting Categories Circular Slider */}
          {categories.length > 0 && (
            <div className="py-6 bg-zinc-950/20 select-none">
              <span className="text-[10px] uppercase font-mono tracking-widest px-5 text-zinc-500 block mb-4">
                Explore Categories
              </span>
              <div className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-none">
                {/* All highlight circle */}
                <button 
                  onClick={() => selectCategory('all')}
                  className="flex flex-col items-center gap-2 select-none flex-shrink-0 cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all bg-zinc-900 ${
                    activeCategory === 'all' ? 'border-[#D7FF00]' : 'border-zinc-800'
                  }`}>
                    <div className="w-11 h-11 bg-zinc-950 rounded-full flex items-center justify-center">
                      <ShoppingBag className={`w-4 h-4 ${activeCategory === 'all' ? 'text-[#D7FF00]' : 'text-zinc-500'}`} />
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase font-mono transition-colors text-center max-w-[64px] truncate ${
                    activeCategory === 'all' ? 'text-[#D7FF00] font-bold' : 'text-zinc-400'
                  }`}>
                    All
                  </span>
                </button>

                {categories.map((cat: any) => {
                  const isSelected = activeCategory === cat.id || activeCategory.toLowerCase() === cat.name.toLowerCase();
                  const coverImage = getCategoryCover(cat.name, cat.cover_image_url);

                  return (
                    <button
                      key={cat.id}
                      onClick={() => selectCategory(cat.id)}
                      className="flex flex-col items-center gap-2 select-none flex-shrink-0 cursor-pointer"
                    >
                      <div className={`w-14 h-14 rounded-full overflow-hidden border-2 p-0.5 transition-all bg-zinc-950 ${
                        isSelected ? 'border-[#D7FF00]' : 'border-zinc-800'
                      }`}>
                        <ImageWithSkeleton
                          src={coverImage}
                          alt={cat.name}
                          skeletonType="product"
                          className="w-full h-full rounded-full object-cover grayscale brightness-90 hover:grayscale-0 transition-all"
                          style={{ borderRadius: '9999px' }}
                        />
                      </div>
                      <span className={`text-[9px] uppercase font-mono transition-colors text-center max-w-[64px] truncate ${
                        isSelected ? 'text-[#D7FF00] font-bold' : 'text-zinc-400'
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exclusive Featured carousel */}
          {featuredProductsList.length > 0 && searchQuery === '' && (
            <div className="px-4 py-6 border-b border-zinc-900/40">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                <h3 className="text-xs uppercase font-mono tracking-widest text-[#D7FF00]">
                  Featured curation
                </h3>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                {featuredProductsList.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(getShopPath(`/product/${product.id}`))}
                    className="w-56 flex-shrink-0 bg-zinc-950 border border-zinc-900 rounded overflow-hidden cursor-pointer shadow-lg group hover:border-[#D7FF00] transition-all"
                  >
                    <div className="aspect-[3/4] w-full bg-zinc-900 overflow-hidden relative">
                      <ProductImage product={product} index={0} height="100%" width="100%" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                      {product.original_price && (
                        <span className="absolute top-2 left-2 bg-[#D7FF00] text-black text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded">
                          Sale
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">
                          {product.category || 'Apparel'}
                        </span>
                        <h4 className="text-xs font-bold uppercase truncate text-zinc-200 group-hover:text-white transition-colors mt-0.5">
                          {product.name}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-mono font-black text-[#D7FF00]">
                          ${product.price}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 border border-zinc-800 rounded px-2 py-0.5">
                          View
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Catalog grid */}
          <div className="px-4 py-6 max-w-2xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-zinc-900/50">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#D7FF00]" />
                <h2 className="text-xs uppercase font-mono tracking-widest text-zinc-300">
                  Curated Catalog
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {filteredProducts.length} Items Listed
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 px-4 border border-dashed border-zinc-900 rounded-lg">
                <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">
                  No matching pieces found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 select-none">
                {filteredProducts.map((product) => {
                  const discount = product.original_price && product.original_price > product.price 
                    ? Math.round(((product.original_price - product.price) / product.original_price) * 100) 
                    : 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate(getShopPath(`/product/${product.id}`))}
                      className="group flex flex-col cursor-pointer bg-zinc-950/20 border border-zinc-900 rounded overflow-hidden hover:border-zinc-750 transition-all duration-300"
                    >
                      {/* Frame image 3:4 */}
                      <div className="aspect-[3/4] bg-zinc-950 w-full overflow-hidden relative">
                        <ProductImage product={product} index={0} height="100%" width="100%" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                        
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 bg-[#D7FF00] text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-zinc-900">
                            -{discount}% OFF
                          </span>
                        )}
                      </div>

                      {/* Info details */}
                      <div className="p-3.5 flex flex-col flex-grow select-none bg-zinc-950/40">
                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono mb-1">
                          {product.category || 'Apparel'}
                        </span>
                        <h3 className="text-xs uppercase font-extrabold text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-2 pt-1 border-t border-zinc-900/60 mt-auto select-none">
                          <span className="text-xs font-mono font-extrabold text-[#D7FF00]">
                            ${product.price}
                          </span>
                          {product.original_price && (
                            <span className="text-[10px] text-zinc-500 line-through font-mono">
                              ${product.original_price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeView === 'products' && (
        <div className="px-4 py-8 max-w-2xl mx-auto w-full flex-1">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
            <h1 className="text-xl font-bold uppercase tracking-wider font-sans">
              All Products
            </h1>
            <span className="text-xs font-mono text-zinc-500">
              {filteredProducts.length} pieces
            </span>
          </div>

          {/* Compact visual search query input */}
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog pieces..."
              className="w-full bg-zinc-950 text-white text-xs border border-zinc-800 rounded px-4 py-3 focus:border-[#D7FF00] focus:outline-none focus:ring-0 font-mono"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 px-4 border border-dashed border-zinc-900 rounded-lg">
              <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">
                No items match search criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 select-none">
              {filteredProducts.map((product) => {
                const discount = product.original_price && product.original_price > product.price 
                  ? Math.round(((product.original_price - product.price) / product.original_price) * 100) 
                  : 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(getShopPath(`/product/${product.id}`))}
                    className="group flex flex-col cursor-pointer bg-zinc-950/20 border border-zinc-900 rounded overflow-hidden hover:border-zinc-750 transition-all duration-300"
                  >
                    <div className="aspect-[3/4] bg-zinc-950 w-full overflow-hidden relative">
                      <ProductImage product={product} index={0} height="100%" width="100%" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-[#D7FF00] text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-zinc-900">
                          -{discount}%
                        </span>
                      )}
                    </div>
                    <div className="p-3.5 flex flex-col flex-grow bg-zinc-950/40">
                      <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono mb-1">
                        {product.category || 'Streetwear'}
                      </span>
                      <h3 className="text-xs uppercase font-extrabold text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 pt-1 border-t border-zinc-900/60 mt-auto">
                        <span className="text-xs font-mono font-extrabold text-[#D7FF00]">
                          ${product.price}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === 'category' && (
        <div className="px-4 py-8 max-w-2xl mx-auto w-full flex-1">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
            <button
              onClick={() => navigate(getShopPath())}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors uppercase tracking-wider font-mono text-[10px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </button>
            <h1 className="text-base font-bold uppercase tracking-wider font-sans text-[#D7FF00]">
              {activeCategory} Collection
            </h1>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 px-4 border border-dashed border-zinc-900 rounded-lg">
              <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">
                No pieces loaded under this collection yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 select-none">
              {filteredProducts.map((product) => {
                const discount = product.original_price && product.original_price > product.price 
                  ? Math.round(((product.original_price - product.price) / product.original_price) * 100) 
                  : 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(getShopPath(`/product/${product.id}`))}
                    className="group flex flex-col cursor-pointer bg-zinc-950/20 border border-zinc-900 rounded overflow-hidden hover:border-zinc-750 transition-all duration-300"
                  >
                    <div className="aspect-[3/4] bg-zinc-950 w-full overflow-hidden relative">
                      <ProductImage product={product} index={0} height="100%" width="100%" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-[#D7FF00] text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-zinc-900">
                          -{discount}%
                        </span>
                      )}
                    </div>
                    <div className="p-3.5 flex flex-col flex-grow bg-zinc-950/40">
                      <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono mb-1">
                        {product.category || 'Collection'}
                      </span>
                      <h3 className="text-xs uppercase font-extrabold text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 pt-1 border-t border-zinc-900/60 mt-auto">
                        <span className="text-xs font-mono font-extrabold text-[#D7FF00]">
                          ${product.price}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === 'about' && (
        <div className="px-4 py-8 max-w-md mx-auto w-full flex-1">
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-800 p-0.5 bg-black mb-3">
                <ShopLogo shop={shop} size="100%" className="w-full h-full rounded-full object-cover" />
              </div>
              <h1 className="text-xl font-bold uppercase tracking-wider">{shop.name}</h1>
              <span className="text-[10px] uppercase font-mono text-zinc-500">Curated Boutique Profile</span>
            </div>

            {shop.description && (
              <div className="pt-4 border-t border-zinc-900">
                <span className="text-[9px] uppercase font-mono text-zinc-500 block mb-1">About our store</span>
                <p className="text-zinc-300 text-xs italic tracking-wide leading-relaxed">
                  "{shop.description}"
                </p>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <span className="text-[9px] uppercase font-mono text-zinc-500 block mb-1.5">Collection metadata</span>

              {shop.city && (
                <div className="flex items-start gap-3 text-xs">
                  <MapPin className="w-4 h-4 text-[#D7FF00] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-zinc-400 block font-mono text-[10px] uppercase">Location</span>
                    <span className="text-white font-medium">{shop.suburb ? `${shop.suburb}, ${shop.city}` : shop.city}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 text-xs">
                <Clock className="w-4 h-4 text-[#D7FF00] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-zinc-400 block font-mono text-[10px] uppercase">Opening Hours</span>
                  <span className="text-white font-medium">{(shop.opening_hours || 'Mon-Sat 9am - 6pm')}</span>
                </div>
              </div>

              {(shop.whatsapp_number || shop.whatsapp) && (
                <div className="flex items-start gap-3 text-xs">
                  <MessageCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-zinc-400 block font-mono text-[10px] uppercase">WhatsApp Ordering Contact</span>
                    <a 
                      href={`https://wa.me/${formatWhatsAppNumber(shop.whatsapp_number || shop.whatsapp || '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline font-mono"
                    >
                      {shop.whatsapp_number || shop.whatsapp}
                    </a>
                  </div>
                </div>
              )}

              {shop.instagram && (
                <div className="flex items-start gap-3 text-xs">
                  <Instagram className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-zinc-400 block font-mono text-[10px] uppercase">Instagram Profile</span>
                    <a 
                      href={`https://instagram.com/${shop.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-400 hover:underline"
                    >
                      @{shop.instagram.replace(/^@/, '')}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-zinc-900 text-center">
              <button
                onClick={() => navigate(getShopPath())}
                className="inline-flex items-center gap-2 bg-[#D7FF00] hover:bg-[#c3e800] text-black font-extrabold uppercase text-[10px] tracking-wider py-3 px-6 rounded transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Visit Runway</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          NAVIGATION SLIDE DRAWER COMPONENT
          ------------------------------------------------------------- */}
      <AnimatePresence>
        {openDrawer && (
          <>
            {/* Backdrop layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenDrawer(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Main drawer body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-black z-50 px-6 py-8 border-r border-zinc-900 flex flex-col justify-between shadow-2xl"
            >
              <div>
                <div className="flex justify-between items-center mb-10">
                  <span className="text-xs font-bold uppercase tracking-widest font-mono text-[#D7FF00]">
                    Boutique Menu
                  </span>
                  <button 
                    onClick={() => setOpenDrawer(false)}
                    className="p-1 hover:text-zinc-300 transition-colors cursor-pointer text-zinc-500"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Shop Home block */}
                  <button 
                    onClick={() => {
                      navigate(getShopPath());
                      setOpenDrawer(false);
                    }}
                    className={`w-full text-left text-xs uppercase tracking-widest font-extrabold pb-3 border-b border-zinc-900 block ${
                      activeView === 'home' ? 'text-[#D7FF00]' : 'text-white hover:text-[#D7FF00]'
                    } transition-colors cursor-pointer`}
                  >
                    Shop home
                  </button>

                  {/* Shop Products Page */}
                  <button 
                    onClick={() => {
                      navigate(getShopPath('/products'));
                      setOpenDrawer(false);
                    }}
                    className={`w-full text-left text-xs uppercase tracking-widest font-extrabold pb-3 border-b border-zinc-900 block ${
                      activeView === 'products' ? 'text-[#D7FF00]' : 'text-white hover:text-[#D7FF00]'
                    } transition-colors cursor-pointer`}
                  >
                    Catalog pieces
                  </button>

                  {/* Shop About Page */}
                  <button 
                    onClick={() => {
                      navigate(getShopPath('/about'));
                      setOpenDrawer(false);
                    }}
                    className={`w-full text-left text-xs uppercase tracking-widest font-extrabold pb-3 border-b border-zinc-900 block ${
                      activeView === 'about' ? 'text-[#D7FF00]' : 'text-white hover:text-[#D7FF00]'
                    } transition-colors cursor-pointer`}
                  >
                    About Store
                  </button>

                  {/* Highlights Categories lists */}
                  {categories.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block mb-3.5">
                        Categories
                      </span>
                      <div className="space-y-3">
                        {categories.map((cat: any) => {
                          const isSel = activeCategory === cat.id || activeCategory.toLowerCase() === cat.name.toLowerCase();
                          return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                selectCategory(cat.id);
                                setOpenDrawer(false);
                              }}
                              className={`w-full text-left font-mono text-[10px] uppercase tracking-widest flex items-center justify-between pb-1 ${
                                isSel ? 'text-[#D7FF00] font-bold' : 'text-zinc-300 hover:text-white'
                              } transition-colors`}
                            >
                              <span>{cat.name}</span>
                              <ChevronRight className={`w-3.5 h-3.5 ${isSel ? 'text-[#D7FF00]' : 'text-zinc-700'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer bottom info */}
              <div className="border-t border-zinc-900 pt-6">
                <span className="text-[8px] uppercase font-mono tracking-widest text-[#D7FF00] block mb-2">Powered by Digital Boutique</span>
                <span className="text-[9px] uppercase font-mono text-zinc-500 block">Open: {(shop?.opening_hours || 'Mon-Sat 9am - 6pm')}</span>
                <span className="text-[10px] uppercase font-mono text-zinc-300 block mt-1">Loc: {shop?.city}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
