import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Search, Plus, Minus, Check, ChevronRight, 
  Trash2, Filter, Share2, Clipboard, RefreshCw, AlertCircle, 
  Download, FileSpreadsheet, X, ShoppingBag, DollarSign,
  Package, TrendingUp, HelpCircle, BarChart3, AlertTriangle, Flame,
  Settings, Home
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Sale } from '../types';
import { toast } from 'sonner';

export const SalesSystem: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'record' | 'dashboard' | 'stock' | 'history'>('dashboard');

  // Load selected tab from route state if redirection occurs
  useEffect(() => {
    if (location.state && (location.state as any).tab) {
      setActiveTab((location.state as any).tab);
    }
  }, [location.state]);

  // Master databases & stats
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  // Network listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerOfflineSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sales]);

  // Read data
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      // Find user's shop
      const { data: shopData } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();
      
      if (!shopData) {
        toast.error('Could not find active shop session');
        return;
      }
      setShopId(shopData.id);

      // Fetch products
      const { data: pData, error: pError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .eq('status', 'active');
      
      if (pError) throw pError;
      setProducts(pData || []);

      // Fetch sales
      const { data: sData, error: sError } = await supabase
        .from('sales')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      if (sError) {
        // If table sales doesn't exist yet, we'll load from localStorage
        if (sError.code === '42P01') {
          console.warn('Sales table does not exist in Supabase yet. Using local mode fallback.');
          const localSales = localStorage.getItem(`threadzw_sales_${shopData.id}`);
          if (localSales) {
            setSales(JSON.parse(localSales));
          }
        } else {
          throw sError;
        }
      } else {
        // We have Supabase table connection, merge any offline/local sales
        const localSalesStr = localStorage.getItem(`threadzw_sales_${shopData.id}`);
        let finalSales = sData || [];
        if (localSalesStr) {
          const localSales = JSON.parse(localSalesStr) as Sale[];
          // Filter out ones that are already in DB (comparing IDs)
          const dbIds = new Set(finalSales.map(s => s.id));
          const unregistered = localSales.filter(s => !dbIds.has(s.id));
          if (unregistered.length > 0) {
            finalSales = [...unregistered, ...finalSales];
            // Sort by created_at descending
            finalSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          }
        }
        setSales(finalSales);
      }
    } catch (err: any) {
      console.error('Failed to load merchant sales database:', err);
      toast.error('Error listing sales/products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // Auto-trigger sync when opening the page
  useEffect(() => {
    if (shopId && isOnline) {
      triggerOfflineSync();
    }
  }, [shopId, isOnline]);

  // Synchronise outstanding local queue sales with Supabase
  const triggerOfflineSync = async () => {
    if (!isOnline || !shopId || syncing) return;
    const localSalesStr = localStorage.getItem(`threadzw_sales_${shopId}`);
    if (!localSalesStr) return;

    try {
      const localSales = JSON.parse(localSalesStr) as Sale[];
      // Filter out completed ones that are already synced (sync status can be tracked or try inserting)
      const unsynced = localSales.filter(s => (s as any).offlinePending === true);
      if (unsynced.length === 0) return;

      setSyncing(true);
      let successCount = 0;

      for (const sale of unsynced) {
        // Exclude the temp offline pending flag
        const { offlinePending, ...saleToInsert } = sale as any;
        
        const { error } = await supabase
          .from('sales')
          .insert(saleToInsert);

        if (!error) {
          successCount++;
          // Mark as synced locally
          sale.offlinePending = false;
        } else if (error.code === '42P01') {
          // Table doesn't exist, stop sync process
          console.warn('Database "sales" table missing. Sync is deferred.');
          setSyncing(false);
          return;
        }
      }

      if (successCount > 0) {
        toast.success(`Synced ${successCount} offline recorded sales to cloud ✓`);
        // Save cleaned list back to local
        localStorage.setItem(`threadzw_sales_${shopId}`, JSON.stringify(localSales));
        // Refresh master list
        fetchData();
      }
    } catch (err) {
      console.error('Background sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // State for RECORD SALE (Feature 1)
  const [saleStep, setSaleStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [saleSearch, setSaleSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  
  // Sale calculations state
  const [discountType, setDiscountType] = useState<'none' | 'fixed' | 'percentage'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ecocash' | 'innbucks' | 'whatsapp'>('cash');
  const [saleChannel, setSaleChannel] = useState<'walk-in' | 'whatsapp' | 'instagram' | 'other'>('walk-in');
  const [saleNotes, setSaleNotes] = useState('');
  const [latestRecordedSaleId, setLatestRecordedSaleId] = useState<string | null>(null);

  // Computed original price and final amount
  const itemPrice = selectedProduct ? selectedProduct.price : 0;
  const originalTotalPrice = itemPrice * saleQuantity;
  
  const discountAmount = useMemo(() => {
    if (discountType === 'fixed') {
      return Math.min(discountValue, originalTotalPrice);
    } else if (discountType === 'percentage') {
      return Math.round((originalTotalPrice * Math.min(discountValue, 100)) / 100);
    }
    return 0;
  }, [discountType, discountValue, originalTotalPrice]);

  const finalPrice = Math.max(0, originalTotalPrice - discountAmount);

  // Search filter for Step 1 Select Product
  const filteredProductsForSale = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(saleSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(saleSearch.toLowerCase())
    );
  }, [products, saleSearch]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    // Auto preset first size with stock available
    const available = product.sizes.find(s => s.quantity > 0);
    if (available) {
      setSelectedSize(available.size);
    } else {
      setSelectedSize('');
    }
    setSaleQuantity(1);
    setSaleStep(2);
  };

  const selectedSizeStock = useMemo(() => {
    if (!selectedProduct || !selectedSize) return 0;
    const sizeObj = selectedProduct.sizes.find(s => s.size === selectedSize);
    return sizeObj ? sizeObj.quantity : 0;
  }, [selectedProduct, selectedSize]);

  // Restrict step count limiters
  const handleIncreaseQty = () => {
    if (saleQuantity < selectedSizeStock) {
      setSaleQuantity(prev => prev + 1);
    } else {
      toast.error(`Maximum available stock is ${selectedSizeStock}`);
    }
  };

  const handleDecreaseQty = () => {
    if (saleQuantity > 1) {
      setSaleQuantity(prev => prev - 1);
    }
  };

  // Submit Sale Record
  const handleConfirmSale = async () => {
    if (!shopId || !selectedProduct || !selectedSize) {
      toast.error('Missing required sale metadata');
      return;
    }

    if (saleQuantity > selectedSizeStock) {
      toast.error('Insufficient inventory stock left!');
      return;
    }

    const saleId = crypto.randomUUID();
    const now = new Date();

    const newSaleRecord: Sale = {
      id: saleId,
      shop_id: shopId,
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      size: selectedSize,
      quantity: saleQuantity,
      original_price: selectedProduct.price,
      discount_amount: discountAmount,
      final_price: finalPrice,
      payment_method: paymentMethod,
      channel: saleChannel,
      notes: saleNotes.trim() || null,
      created_at: now.toISOString(),
      voided: false
    };

    // Construct next Sizes array decrementing inventory locally
    const nextSizes = selectedProduct.sizes.map(s => {
      if (s.size === selectedSize) {
        return { ...s, quantity: Math.max(0, s.quantity - saleQuantity) };
      }
      return s;
    });

    // Calculate total stock
    const nextTotalStock = nextSizes.reduce((sum, s) => sum + s.quantity, 0);
    
    // Determine product active status
    // If all sizes hit 0 stock, mark status as sold_out
    const nextStatus = nextTotalStock === 0 ? 'sold_out' : 'active';
    const nextIsPublished = nextTotalStock > 0 ? selectedProduct.is_published : false;

    // Trigger local update immediately
    // 1. Update products list in screen state for speed
    setProducts(prev => prev.map(p => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          sizes: nextSizes,
          total_stock: nextTotalStock,
          is_published: nextIsPublished
        };
      }
      return p;
    }));

    // Save sale to local state array
    setSales(prev => [newSaleRecord, ...prev]);

    // Save sale to local offline backup
    const currentLocalSales = JSON.parse(localStorage.getItem(`threadzw_sales_${shopId}`) || '[]');
    const saleWithOfflineStatus = { ...newSaleRecord, offlinePending: true };
    localStorage.setItem(`threadzw_sales_${shopId}`, JSON.stringify([saleWithOfflineStatus, ...currentLocalSales]));

    // Update Supabase Database
    try {
      // 1. Update product inventory in DB
      const { error: pUpdateError } = await supabase
        .from('products')
        .update({
          sizes: nextSizes,
          total_stock: nextTotalStock,
          is_published: nextIsPublished,
          status: nextStatus
        })
        .eq('id', selectedProduct.id);

      if (pUpdateError) throw pUpdateError;

      // 2. Insert Sale Record in Supabase sales table
      const { error: saleInsertError } = await supabase
        .from('sales')
        .insert({
          id: saleId,
          shop_id: shopId,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          size: selectedSize,
          quantity: saleQuantity,
          original_price: selectedProduct.price,
          discount_amount: discountAmount,
          final_price: finalPrice,
          payment_method: paymentMethod,
          channel: saleChannel,
          notes: saleNotes.trim() || null,
          created_at: now.toISOString(),
          voided: false
        });

      if (saleInsertError) {
        if (saleInsertError.code === '42P01') {
          // Table missing error, keep it local only
          toast.warning('No connection to sales database list. Saved locally! ✓');
        } else {
          throw saleInsertError;
        }
      } else {
        // Successfully synced immediately, remove pending online status
        const refreshedLocalSales = JSON.parse(localStorage.getItem(`threadzw_sales_${shopId}`) || '[]');
        const updatedLocal = refreshedLocalSales.map((s: any) => s.id === saleId ? { ...s, offlinePending: false } : s);
        localStorage.setItem(`threadzw_sales_${shopId}`, JSON.stringify(updatedLocal));
        toast.success('Sale successfully logged and synced with cloud! 💰');
      }

    } catch (dbErr: any) {
      console.warn('DB Write deferred / Offline mode activated:', dbErr);
      toast.info('Saved in local offline queue — will sync when connected.');
    }

    setLatestRecordedSaleId(saleId);
    setSaleStep(5);
  };

  const handleResetRecordFlow = () => {
    setSelectedProduct(null);
    setSelectedSize('');
    setSaleQuantity(1);
    setDiscountType('none');
    setDiscountValue(0);
    setPaymentMethod('cash');
    setSaleChannel('walk-in');
    setSaleNotes('');
    setSaleStep(1);
  };

  // State for STOCK MANAGEMENT (Feature 3)
  const [inventorySearch, setInventorySearch] = useState('');
  const [stockFilterTab, setStockFilterTab] = useState<'all' | 'low' | 'out'>('all');
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [restockQuantities, setRestockQuantities] = useState<{ [size: string]: number }>({});

  const handleOpenRestockModal = (product: Product) => {
    setSelectedProductForRestock(product);
    // Initialize restock inputs with 0
    const startObj: { [size: string]: number } = {};
    product.sizes.forEach(sz => {
      startObj[sz.size] = 0;
    });
    setRestockQuantities(startObj);
  };

  const handleRestockQuantityChange = (size: string, step: number) => {
    setRestockQuantities(prev => ({
      ...prev,
      [size]: Math.max(0, (prev[size] || 0) + step)
    }));
  };

  const handleSubmitRestock = async () => {
    if (!selectedProductForRestock) return;

    // Create upgraded size array adding new stock levels
    const nextSizes = selectedProductForRestock.sizes.map(s => {
      const extra = restockQuantities[s.size] || 0;
      return { ...s, quantity: s.quantity + extra };
    });

    const nextTotalStock = nextSizes.reduce((sum, s) => sum + s.quantity, 0);
    const nextStatus = nextTotalStock > 0 ? 'active' : 'sold_out';
    const nextIsPublished = nextTotalStock > 0 ? true : selectedProductForRestock.is_published;

    // Toast alert triggers if no additions were declared
    const totalAdded = Object.values(restockQuantities).reduce((s, v) => s + v, 0);
    if (totalAdded === 0) {
      toast.error('Please add quantities to at least one size.');
      return;
    }

    setProducts(prev => prev.map(p => 
      p.id === selectedProductForRestock.id 
        ? { ...p, sizes: nextSizes, total_stock: nextTotalStock, is_published: nextIsPublished }
        : p
    ));

    try {
      const { error } = await supabase
        .from('products')
        .update({
          sizes: nextSizes,
          total_stock: nextTotalStock,
          is_published: nextIsPublished,
          status: nextStatus
        })
        .eq('id', selectedProductForRestock.id);

      if (error) throw error;
      toast.success(`Successfully restocked ${selectedProductForRestock.name}! 📦`);
      setSelectedProductForRestock(null);
    } catch (err: any) {
      console.error('Failed to submit restock inventory:', err);
      toast.error('Restock API fail: ' + err.message);
    }
  };

  // State for HISTORY & DETAIL REPORT (Feature 4)
  const [historySearch, setHistorySearch] = useState('');
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<'all' | 'cash' | 'ecocash' | 'innbucks' | 'whatsapp'>('all');
  const [historyChannelFilter, setHistoryChannelFilter] = useState<'all' | 'walk-in' | 'whatsapp' | 'instagram' | 'other'>('all');
  const [historySelectedSaleDetail, setHistorySelectedSaleDetail] = useState<Sale | null>(null);
  const [showVoidConfirmationId, setShowVoidConfirmationId] = useState<string | null>(null);

  // Computations for Analytics & Dashboard stats
  const salesHistoryFiltered = useMemo(() => {
    return sales.filter(s => {
      const matchSearch = s.product_name.toLowerCase().includes(historySearch.toLowerCase());
      const matchPayment = historyPaymentFilter === 'all' || s.payment_method === historyPaymentFilter;
      const matchChannel = historyChannelFilter === 'all' || s.channel === historyChannelFilter;
      return matchSearch && matchPayment && matchChannel;
    });
  }, [sales, historySearch, historyPaymentFilter, historyChannelFilter]);

  // General dashboard calculation metrics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let todayRev = 0;
    let weekRev = 0;
    let monthRev = 0;
    let totalUnits = 0;

    const channelMap: { [key: string]: number } = { 'walk-in': 0, 'whatsapp': 0, 'instagram': 0, 'other': 0 };
    const productSalesMap: { [pName: string]: { qty: number; rev: number; img?: string } } = {};

    sales.forEach(s => {
      if (s.voided) return;

      const saleDate = new Date(s.created_at);
      const isToday = saleDate.getTime() >= today.getTime();
      const isThisWeek = saleDate.getTime() >= oneWeekAgo.getTime();
      const isThisMonth = saleDate.getTime() >= oneMonthAgo.getTime();

      if (isToday) todayRev += s.final_price;
      if (isThisWeek) weekRev += s.final_price;
      if (isThisMonth) monthRev += s.final_price;
      
      totalUnits += s.quantity;
      channelMap[s.channel] = (channelMap[s.channel] || 0) + s.final_price;

      // Group product sellers
      if (!productSalesMap[s.product_name]) {
        // Find matched product image
        const matchingProd = products.find(p => p.id === s.product_id);
        const image = matchingProd?.images?.[0];
        productSalesMap[s.product_name] = { qty: 0, rev: 0, img: image };
      }
      productSalesMap[s.product_name].qty += s.quantity;
      productSalesMap[s.product_name].rev += s.final_price;
    });

    // Best Sellers Top 3
    const bestSellers = Object.entries(productSalesMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);

    return {
      todayRevenue: todayRev,
      weekRevenue: weekRev,
      monthRevenue: monthRev,
      totalUnits,
      channelBreakdown: channelMap,
      bestSellers
    };
  }, [sales, products]);

  // Today running sales sum calculator helper for STEP 5
  const todayTotalRevenue = useMemo(() => {
    return stats.todayRevenue;
  }, [stats]);

  // Simple and Crash-Proof Custom Bar Chart helper based on Daily performance inside past 7 days
  const dailyChartData = useMemo(() => {
    const data: { [key: string]: number } = {};
    const dLabels: string[] = [];

    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateKey = d.toDateString();
      data[dateKey] = 0;
      dLabels.push(dateKey);
    }

    sales.forEach(s => {
      if (s.voided) return;
      const saleDateString = new Date(s.created_at).toDateString();
      if (data[saleDateString] !== undefined) {
        data[saleDateString] += s.final_price;
      }
    });

    return dLabels.map(key => {
      const labelStr = new Date(key).toLocaleDateString('en-US', { weekday: 'short' });
      return {
        label: labelStr,
        value: data[key]
      };
    });
  }, [sales]);

  // Weekly performance inside past 4 weeks
  const weeklyChartData = useMemo(() => {
    const data = [
      { label: 'Wk 1', value: 0 },
      { label: 'Wk 2', value: 0 },
      { label: 'Wk 3', value: 0 },
      { label: 'Wk 4', value: 0 }
    ];

    sales.forEach(s => {
      if (s.voided) return;
      const saleDate = new Date(s.created_at);
      const diffMs = Date.now() - saleDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays <= 7) data[3].value += s.final_price;
      else if (diffDays <= 14) data[2].value += s.final_price;
      else if (diffDays <= 21) data[1].value += s.final_price;
      else if (diffDays <= 28) data[0].value += s.final_price;
    });

    return data;
  }, [sales]);

  // Chart view toggle state
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly'>('daily');
  const activeChartData = chartPeriod === 'daily' ? dailyChartData : weeklyChartData;

  // Slow Movers logic: Active products with no recorded sale inside last 14 days
  const slowMovers = useMemo(() => {
    const sellerProductIds = new Set(sales.map(s => s.product_id));
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    return products.filter(p => {
      // Find if any sales are within 14 days
      const hasRecentSales = sales.some(s => s.product_id === p.id && new Date(s.created_at).getTime() >= fourteenDaysAgo);
      return !hasRecentSales;
    }).slice(0, 3);
  }, [products, sales]);

  // Low Stock state alarms <= 2 units left
  const lowStockAlerts = useMemo(() => {
    const list: { name: string; size: string; count: number; productId: string; originalProduct: Product }[] = [];
    products.forEach(p => {
      p.sizes.forEach(sz => {
        if (sz.quantity <= 2 && sz.quantity > 0) {
          list.push({
            name: p.name,
            size: sz.size,
            count: sz.quantity,
            productId: p.id,
            originalProduct: p
          });
        }
      });
    });
    return list;
  }, [products]);

  // VOID (reverse) sale processor
  const handleVoidSale = async (sale: Sale) => {
    if (syncing) return;

    // Search original product
    const originalProd = products.find(p => p.id === sale.product_id);
    if (!originalProd) {
      toast.error('Cannot locate original product schema to restore stock levels.');
      return;
    }

    try {
      // Update sizes array incrementing the quantity voided back
      const nextSizes = originalProd.sizes.map(s => {
        if (s.size === sale.size) {
          return { ...s, quantity: s.quantity + sale.quantity };
        }
        return s;
      });

      const nextTotalStock = nextSizes.reduce((sum, s) => sum + s.quantity, 0);

      // Adjust products and sales local arrays
      setProducts(prev => prev.map(p => {
        if (p.id === sale.product_id) {
          return {
            ...p,
            sizes: nextSizes,
            total_stock: nextTotalStock,
            status: 'active'
          };
        }
        return p;
      }));

      setSales(prev => prev.map(s => {
        if (s.id === sale.id) {
          return { ...s, voided: true };
        }
        return s;
      }));

      // Update local storage backup
      const currentLocals = JSON.parse(localStorage.getItem(`threadzw_sales_${shopId}`) || '[]');
      const updatedLocals = currentLocals.map((s: any) => {
        if (s.id === sale.id) {
          return { ...s, voided: true, offlinePending: isOnline ? false : true };
        }
        return s;
      });
      localStorage.setItem(`threadzw_sales_${shopId}`, JSON.stringify(updatedLocals));

      // Attempt Supabase database push
      // 1. Mark as voided inside CRM sales log
      const { error: saleError } = await supabase
        .from('sales')
        .update({ voided: true })
        .eq('id', sale.id);

      // If missing table relations, bypass gracefully
      if (saleError && saleError.code !== '42P01') throw saleError;

      // 2. Reverse inventory back on products list
      const { error: productError } = await supabase
        .from('products')
        .update({
          sizes: nextSizes,
          total_stock: nextTotalStock,
          status: 'active'
        })
        .eq('id', sale.product_id);

      if (productError) throw productError;

      toast.success('Sale successfully voided! Inventory replenished. 🔄');
      setShowVoidConfirmationId(null);
      setHistorySelectedSaleDetail(null);
    } catch (err: any) {
      console.error('Void transaction procedure abort:', err);
      toast.error('Voiding procedure failed: ' + err.message);
    }
  };

  // Export reports to clipboard CSV
  const handleExportMonthReport = () => {
    try {
      const now = new Date();
      const currentMonthIndex = now.getMonth();
      const currentYear = now.getFullYear();

      const activeMonthsSales = sales.filter(s => {
        const d = new Date(s.created_at);
        return d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear && !s.voided;
      });

      if (activeMonthsSales.length === 0) {
        toast.info('No recorded sales logged for the current month yet.');
        return;
      }

      // Format report
      let txtHead = `=== THREADZW MERCHANT REPORT — ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ===\n`;
      txtHead += `Total Sales Units: ${stats.totalUnits} items\n`;
      txtHead += `Month Total Revenue: $${stats.monthRevenue} USD\n`;
      txtHead += `Best Seller: ${stats.bestSellers[0]?.name || 'N/A'} (${stats.bestSellers[0]?.qty || 0} sold)\n\n`;

      txtHead += `--- Sales Breakdowns --- \n`;
      txtHead += `Walk-in Sales: $${stats.channelBreakdown['walk-in'] || 0}\n`;
      txtHead += `WhatsApp Sales: $${stats.channelBreakdown['whatsapp'] || 0}\n`;
      txtHead += `Instagram Sales: $${stats.channelBreakdown['instagram'] || 0}\n`;
      txtHead += `Other Sales: $${stats.channelBreakdown['other'] || 0}\n\n`;

      txtHead += `=== Raw Transactions Log ===\n`;
      txtHead += `Date,Product,Size,Qty,Price,Discount,Final,Paid via,Channel\n`;

      activeMonthsSales.forEach(s => {
        const rowD = new Date(s.created_at).toLocaleDateString();
        txtHead += `${rowD},"${s.product_name}",${s.size},${s.quantity},$${s.original_price},$${s.discount_amount},$${s.final_price},${s.payment_method.toUpperCase()},${s.channel.toUpperCase()}\n`;
      });

      navigator.clipboard.writeText(txtHead);
      toast.success('Month CSV Report compiled and Copied to Clipboard! 📋');

      // WhatsApp direct share fallback
      const waMessage = `ThreadZW Sales Report:\nTotal Revenue: $${stats.monthRevenue}\nTotal Units: ${stats.totalUnits}\nBest Seller: ${stats.bestSellers[0]?.name || 'None'}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(waMessage)}`, '_blank');
    } catch (err) {
      toast.error('Could not compile dataset export details.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32 font-sans selection:bg-[#c8ff00]/20 relative">
      
      {/* HEADER SECTION */}
      <div className="px-5 pt-7 pb-4 bg-gradient-to-b from-black/50 via-[#0a0a0a] to-[#0a0a0a] sticky top-0 z-40 backdrop-blur-md border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 border border-white/5 rounded-full bg-white/[0.03] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase leading-none">Sales Centre</h1>
              <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-wide">In-store & CRM Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="bg-amber-600/10 border border-amber-600/30 text-amber-500 font-mono text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle size={10} /> Local-Only
              </span>
            )}
            {isOnline && (
              <span className="bg-[#c8ff00]/10 border border-[#c8ff00]/30 text-[#c8ff00] font-mono text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                <Check size={10} /> Cloud Active
              </span>
            )}
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="p-2 border border-white/5 rounded-full bg-white/[0.03] text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-35"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-[#c8ff00]' : ''} />
            </button>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex items-center border border-white/5 bg-[#121215] rounded-xl p-1 mt-5 gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'record', label: '💵 Record Sale' },
            { id: 'stock', label: '📦 Stock' },
            { id: 'history', label: '📜 Log' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'record') handleResetRecordFlow();
              }}
              className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap min-w-[100px] ${
                activeTab === tab.id 
                  ? 'bg-[#c8ff00] text-black font-extrabold shadow-md scale-[1.02]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        
        {/* TAB 1: SALES DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Horizontal KPI cards */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              {[
                { title: "Today's Revenue", value: `$${stats.todayRevenue}`, desc: "Walk-in & Web" },
                { title: "This Week", value: `$${stats.weekRevenue}`, desc: "Last 7 days" },
                { title: "This Month", value: `$${stats.monthRevenue}`, desc: "Current Month" },
                { title: "Units Sold", value: `${stats.totalUnits}`, desc: "Total items cleared" }
              ].map((kpi, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/[0.03] border border-white/10 rounded-[20px] p-5 flex flex-col justify-between shrink-0 w-[145px] h-[115px] hover:border-white/15 transition-all relative overflow-hidden"
                >
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{kpi.title}</span>
                  <div>
                    <h3 className="text-2.5xl font-black text-white tracking-tight leading-none mt-1">{kpi.value}</h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 font-bold uppercase">{kpi.desc}</p>
                  </div>
                  <div className="absolute right-2.5 bottom-2 bg-[#c8ff00]/5 text-[#c8ff00]/40 text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                    $
                  </div>
                </div>
              ))}
            </div>

            {/* QUICK LAUNCH DIRECT ACTION */}
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 flex gap-3 items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm">Have a customer at checkout?</h4>
                <p className="text-xs text-zinc-500">Record cashier sale internally now</p>
              </div>
              <button 
                onClick={() => setActiveTab('record')} 
                className="px-4 py-2.5 bg-[#c8ff00] hover:bg-[#b0df00] text-black font-black text-xs uppercase tracking-widest rounded-full cursor-pointer flex items-center gap-1 shadow-lg"
              >
                + Cashier Sale
              </button>
            </div>

            {/* PERFORMANCE ANALYSIS CHART */}
            <div className="bg-white/[0.03] border border-white/10 rounded-[24px] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide">Revenue Chart</h3>
                  <p className="text-secondary-text text-xs mt-0.5">USD value processed</p>
                </div>
                <div className="flex border border-white/5 bg-black/40 rounded-lg p-0.5 gap-1">
                  <button 
                    onClick={() => setChartPeriod('daily')} 
                    className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all ${chartPeriod === 'daily' ? 'bg-[#c8ff00] text-black' : 'text-zinc-500'}`}
                  >
                    Daily
                  </button>
                  <button 
                    onClick={() => setChartPeriod('weekly')} 
                    className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all ${chartPeriod === 'weekly' ? 'bg-[#c8ff00] text-black' : 'text-zinc-500'}`}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              {/* Crash-proof beautiful interactive SVG graph */}
              <div className="h-44 flex items-end justify-between gap-1 mt-6 px-1 relative">
                {activeChartData.map((data, idx) => {
                  const maxVal = Math.max(...activeChartData.map(d => d.value), 1);
                  const heightPercent = (data.value / maxVal) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Price popup pill */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black border border-white/15 px-1.5 py-0.5 rounded text-[9px] font-bold text-[#c8ff00] whitespace-nowrap z-50 shadow-lg">
                        ${data.value}
                      </div>
                      
                      {/* Interactive Bar */}
                      <div className="w-full bg-[#1c1c1f] rounded-t-lg overflow-hidden h-32 flex items-end">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className="w-full bg-[#c8ff00] rounded-t-lg hover:brightness-110 cursor-pointer relative"
                        />
                      </div>

                      <span className="text-[10.5px] font-bold font-mono text-zinc-500 uppercase tracking-widest">{data.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CHANNEL BREAKDOWN */}
            <div className="bg-white/[0.03] border border-white/10 rounded-[24px] p-5">
              <h3 className="font-black text-sm uppercase tracking-wide mb-4">Traffic Channels</h3>
              
              <div className="space-y-3.5">
                {[
                  { label: "🚶 Walk-in customer", key: "walk-in", color: "bg-[#c8ff00]" },
                  { label: "💬 WhatsApp buyers", key: "whatsapp", color: "bg-[#25D366]" },
                  { label: "📸 Instagram tags", key: "instagram", color: "bg-[#E1306C]" },
                  { label: "📦 Other referrals", key: "other", color: "bg-zinc-400" }
                ].map((channel, i) => {
                  const amt = stats.channelBreakdown[channel.key] || 0;
                  const total = Object.values(stats.channelBreakdown).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((amt / total) * 100);

                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                        <span>{channel.label}</span>
                        <span className="font-mono text-[#c8ff00]">${amt} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-[#111] rounded-full overflow-hidden">
                        <div className={`h-full ${channel.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BEST SELLERS (TOP 3) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-md">🔥</span>
                <h3 className="font-black text-sm uppercase tracking-wider text-neutral-200">Best Sellers</h3>
              </div>

              {stats.bestSellers.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-8 text-center px-4">
                  <span className="text-xs text-zinc-500">No Sales recorded to calculate best sellers yet.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.bestSellers.map((item, idx) => (
                    <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                          {item.img ? <img src={item.img} className="w-full h-full object-cover" /> : "👕"}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-neutral-200 uppercase truncate max-w-[150px]">{item.name}</h4>
                          <p className="text-[10px] text-zinc-500 font-bold font-mono uppercase mt-0.5">{item.qty} units cleared</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <div className="text-xs font-black text-white">${item.rev}</div>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">rev</span>
                        </div>
                        {idx === 0 && <span className="text-sm">👑</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RECENT SALES FEED */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-wide">Recent Transactions</h3>
                <button onClick={() => setActiveTab('history')} className="text-[#c8ff00] font-bold text-xs uppercase tracking-wide hover:underline cursor-pointer">
                  See all Log
                </button>
              </div>

              {sales.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-12 flex flex-col items-center justify-center text-center px-6">
                  <span className="text-4xl">📈</span>
                  <h4 className="font-black text-sm mt-3 uppercase tracking-wider text-zinc-400">Zero recorded sales activity</h4>
                  <p className="text-xs text-zinc-600 mt-1 max-w-[220px]">Cashier logs will show up here after checkout confirm updates</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 no-scrollbar">
                  {sales.slice(0, 10).map((sale, i) => (
                    <div 
                      key={sale.id} 
                      onClick={() => setHistorySelectedSaleDetail(sale)}
                      className={`bg-white/[0.03] border rounded-2xl p-3.5 hover:bg-white/[0.05] transition-all flex items-center justify-between cursor-pointer ${sale.voided ? 'border-red-900/40 opacity-55 saturate-50 line-through' : 'border-white/10'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-neutral-900 border border-white/5 rounded-xl flex items-center justify-center text-sm shrink-0">
                          {sale.channel === 'walk-in' ? '🚶' : sale.channel === 'whatsapp' ? '💬' : sale.channel === 'instagram' ? '📸' : '📦'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold truncate text-neutral-200 max-w-[140px] leading-tight uppercase">{sale.product_name}</h4>
                          <span className="text-[10px] text-zinc-500 font-bold font-mono tracking-wide mt-0.5 block">
                            Size {sale.size} · {sale.payment_method.toUpperCase()} · {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right flex items-center gap-1.5 shrink-0">
                        <div>
                          <span className="text-xs font-black text-white block">${sale.final_price}</span>
                          {sale.voided ? (
                            <span className="text-[8px] bg-red-600/15 border border-red-600/35 text-red-500 font-bold uppercase rounded-full px-1.5 py-0.5 tracking-wide">Voided</span>
                          ) : (
                            <span className="text-[8px] text-zinc-500 uppercase font-mono tracking-widest">{sale.quantity > 1 ? `${sale.quantity}x` : '1 unit'}</span>
                          )}
                        </div>
                        <ChevronRight size={14} className="text-zinc-600 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: RECORD A SALE FLOW */}
        {activeTab === 'record' && (
          <div className="space-y-6">

            {/* STEP 1: CHOOSE PRODUCT */}
            {saleStep === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-extrabold text-md uppercase text-neutral-200 leading-tight">Cashier Checkout — Select Product</h3>
                  <p className="text-xs text-zinc-500">Tap product card to initiate sizes check</p>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={saleSearch}
                    onChange={(e) => setSaleSearch(e.target.value)}
                    placeholder="Search product metadata..."
                    className="w-full h-11 border border-white/5 bg-white/[0.03] text-white rounded-xl pl-10 pr-4 text-xs font-bold outline-none focus:border-[#c8ff00] transition-colors"
                  />
                </div>

                {/* PRODUCT CARDS LIST */}
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                  {filteredProductsForSale.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-14 text-center px-4">
                      <span className="text-2xl">🔍</span>
                      <h4 className="font-extrabold text-xs mt-2 uppercase tracking-wide text-zinc-500">No matching active products found</h4>
                    </div>
                  ) : (
                    filteredProductsForSale.map(prod => {
                      const totalAvailable = prod.total_stock;
                      return (
                        <div
                          key={prod.id}
                          onClick={() => totalAvailable > 0 ? handleSelectProduct(prod) : toast.error('Product is completely Out of Stock!')}
                          className={`bg-white/[0.03] border rounded-[20px] p-3 flex gap-3.5 items-center justify-between cursor-pointer hover:bg-white/[0.05] transition-all duration-200 ${prod.total_stock === 0 ? 'border-red-900/30 opacity-45' : 'border-white/10'}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-[60px] h-[60px] bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center text-lg overflow-hidden shrink-0">
                              {prod.images?.[0] ? <img src={prod.images[0]} className="w-full h-full object-cover" /> : "👕"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-neutral-200 uppercase truncate leading-snug">{prod.name}</h4>
                              <div className="text-sm font-black text-[#c8ff00] mt-0.5">${prod.price}</div>
                              
                              {/* Stock per sizes tag list */}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {prod.sizes.map((sz, i) => (
                                  <span key={i} className={`text-[8.5px] font-bold font-mono uppercase px-1.5 py-0.5 rounded ${sz.quantity === 0 ? 'bg-red-950/20 text-red-500' : 'bg-white/[0.05] text-zinc-400'}`}>
                                    {sz.size}: {sz.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {totalAvailable > 0 ? (
                              <div className="flex items-center gap-1 bg-[#c8ff00]/10 border border-[#c8ff00]/25 rounded-xl px-2.5 py-1.5 text-xs text-[#c8ff00] font-black uppercase">
                                <span>${prod.price}</span>
                                <ChevronRight size={13} className="stroke-[3]" />
                              </div>
                            ) : (
                              <span className="bg-red-950/20 border border-red-900/30 text-red-500 font-black text-[9px] uppercase tracking-wide rounded-full px-2 py-1">Sold Out</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: SIZE & QUANTITY SELECTOR */}
            {saleStep === 2 && selectedProduct && (
              <div className="space-y-5 animate-fadeIn">
                <button onClick={() => setSaleStep(1)} className="text-xs text-zinc-500 font-bold hover:text-white uppercase tracking-wide inline-flex items-center gap-1 cursor-pointer">
                  ← Back to products list
                </button>

                {/* Summary Product Box */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex gap-4 items-center">
                  <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden shrink-0">
                    {selectedProduct.images?.[0] ? <img src={selectedProduct.images[0]} className="w-full h-full object-cover" /> : "👕"}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">{selectedProduct.name}</h4>
                    <p className="text-xs text-[#c8ff00] font-black mt-1">${selectedProduct.price}</p>
                  </div>
                </div>

                {/* SELECT SIZE */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Choose Size Sold</span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.sizes.map(sz => {
                      const isOutOfStock = sz.quantity <= 0;
                      const isSelected = selectedSize === sz.size;

                      return (
                        <button
                          key={sz.size}
                          disabled={isOutOfStock}
                          onClick={() => {
                            setSelectedSize(sz.size);
                            setSaleQuantity(1);
                          }}
                          className={`h-14 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                            isOutOfStock 
                              ? 'border-white/[0.02] bg-white/[0.01] text-zinc-700 pointer-events-none' 
                              : isSelected
                                ? 'border-[#c8ff00] bg-[#c8ff00]/5 text-[#c8ff00]'
                                : 'border-white/10 bg-[#121215] text-zinc-300'
                          }`}
                        >
                          <span className="font-extrabold text-xs">{sz.size}</span>
                          <span className={`text-[9px] font-mono mt-0.5 tracking-wide uppercase ${isOutOfStock ? 'text-zinc-800' : isSelected ? 'text-[#c8ff00]/65' : 'text-zinc-500'}`}>
                            {isOutOfStock ? 'sold out' : `${sz.quantity} left`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* QUANTITY CHANGER */}
                {selectedSize && (
                  <div className="space-y-3.5 bg-white/[0.03] border border-white/5 rounded-[20px] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Specify Quantity</span>
                        {selectedSizeStock === 1 && (
                          <span className="text-[10px] text-[#c8ff00] font-black tracking-wide uppercase mt-1 animate-pulse block">★ Last one!</span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-400">Inventory limit: {selectedSizeStock}</span>
                    </div>

                    <div className="flex items-center justify-center gap-6 py-2">
                      <button 
                        onClick={handleDecreaseQty} 
                        disabled={saleQuantity <= 1}
                        className="w-11 h-11 border border-white/10 rounded-full bg-white/[0.02] text-white hover:border-[#c8ff00] transition-colors flex items-center justify-center cursor-pointer disabled:opacity-20"
                      >
                        <Minus size={16} />
                      </button>
                      
                      <span className="text-3xl font-black text-white w-12 text-center select-none">{saleQuantity}</span>

                      <button 
                        onClick={handleIncreaseQty} 
                        disabled={saleQuantity >= selectedSizeStock}
                        className="w-11 h-11 border border-white/10 rounded-full bg-white/[0.02] text-white hover:border-[#c8ff00] transition-colors flex items-center justify-center cursor-pointer disabled:opacity-20"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* DECISION POINT NEXT BUTTON */}
                <button
                  disabled={!selectedSize}
                  onClick={() => setSaleStep(3)}
                  className="w-full h-14 bg-[#c8ff00] hover:bg-[#b0df00] text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-25"
                >
                  Confirm Size & Qty <ChevronRight size={14} className="stroke-[3]" />
                </button>
              </div>
            )}

            {/* STEP 3: TRANSACTION DETAILS */}
            {saleStep === 3 && selectedProduct && (
              <div className="space-y-5 animate-fadeIn">
                <button onClick={() => setSaleStep(2)} className="text-xs text-zinc-500 font-bold hover:text-white uppercase tracking-wide inline-flex items-center gap-1 cursor-pointer">
                  ← Back to size & quantity
                </button>

                <div className="bg-[#121215] border border-white/10 rounded-[20px] p-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase block tracking-wider font-mono">Current Selection</span>
                    <h4 className="text-xs font-black uppercase text-white leading-none">{selectedProduct.name}</h4>
                    <span className="text-[10px] text-[#c8ff00] font-bold uppercase font-mono tracking-wider block mt-1">Size: {selectedSize} · Qty: {saleQuantity}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500 block uppercase font-mono font-bold">Standard price</span>
                    <span className="text-md font-black text-white">${originalTotalPrice}</span>
                  </div>
                </div>

                {/* PRICE OFFERS DISCOUNTS */}
                <div className="space-y-3.5 bg-white/[0.03] border border-white/10 p-4.5 rounded-[20px]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">Discounts / Offers</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'none', label: 'No Discount' },
                      { type: 'fixed', label: '$ Off (Fixed)' },
                      { type: 'percentage', label: '% Off (Percent)' }
                    ].map(dis => (
                      <button
                        key={dis.type}
                        onClick={() => {
                          setDiscountType(dis.type as any);
                          setDiscountValue(0);
                        }}
                        className={`py-2 px-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-colors ${
                          discountType === dis.type 
                            ? 'border-[#c8ff00] bg-[#c8ff00]/5 text-[#c8ff00]' 
                            : 'border-white/5 bg-black/40 text-zinc-500'
                        }`}
                      >
                        {dis.label}
                      </button>
                    ))}
                  </div>

                  {discountType !== 'none' && (
                    <div className="pt-2 animate-fadeIn relative">
                      <span className="absolute left-3.5 top-3.5 text-zinc-500 font-bold text-xs">{discountType === 'fixed' ? '$ Off' : '% Off'}</span>
                      <input
                        type="number"
                        min="0"
                        value={discountValue || ''}
                        onChange={(e) => setDiscountValue(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder={discountType === 'fixed' ? 'e.g. 5' : 'e.g. 15'}
                        className="w-full h-11 border border-white/5 bg-black/40 rounded-xl pl-16 pr-4 text-xs font-bold text-white focus:outline-none focus:border-[#c8ff00]"
                      />
                    </div>
                  )}
                </div>

                {/* PAYMENT TYPE PILLS */}
                <div className="space-y-3.5 bg-white/[0.03] border border-white/10 p-4.5 rounded-[20px]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">How They Paid</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cash', label: '💵 Cash (USD)' },
                      { id: 'ecocash', label: '📱 EcoCash' },
                      { id: 'innbucks', label: '🏦 InnBucks' },
                      { id: 'whatsapp', label: '💬 WhatsApp' }
                    ].map(pay => (
                      <button
                        key={pay.id}
                        onClick={() => setPaymentMethod(pay.id as any)}
                        className={`h-11 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center cursor-pointer ${
                          paymentMethod === pay.id 
                            ? 'border-[#c8ff00] bg-[#c8ff00]/5 text-[#c8ff00]' 
                            : 'border-white/5 bg-black/40 text-zinc-400'
                        }`}
                      >
                        {pay.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SALES CHANNELS */}
                <div className="space-y-3.5 bg-white/[0.03] border border-white/10 p-4.5 rounded-[20px]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">Sale referrals / Ingress</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'walk-in', label: '🚶 Walk-in Store' },
                      { id: 'whatsapp', label: '💬 WhatsApp DM' },
                      { id: 'instagram', label: '📸 Instagram' },
                      { id: 'other', label: '📦 Other channel' }
                    ].map(chn => (
                      <button
                        key={chn.id}
                        onClick={() => setSaleChannel(chn.id as any)}
                        className={`h-11 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center cursor-pointer ${
                          saleChannel === chn.id
                            ? 'border-[#c8ff00] bg-[#c8ff00]/5 text-[#c8ff00]'
                            : 'border-white/5 bg-black/40 text-zinc-400'
                        }`}
                      >
                        {chn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TRANSACTION MEMO NOTES */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Sale Notes (e.g. Customer will collect later)</span>
                  <input
                    type="text"
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    placeholder="Enter short memorandum updates..."
                    className="w-full h-11 border border-white/5 bg-white/[0.03] text-white rounded-xl px-4 text-xs font-bold outline-none focus:border-[#c8ff00]"
                  />
                </div>

                {/* TOTAL SUMMARY VALUE */}
                <div className="bg-[#121215] border border-white/10 rounded-2xl p-4.5 flex items-center justify-between">
                  <span className="text-zinc-500 text-xs font-black uppercase tracking-wide">Final price updating:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#c8ff00]">${finalPrice}</span>
                    {discountAmount > 0 && <span className="text-[10px] text-zinc-500 block font-mono">applied -$${discountAmount} discount</span>}
                  </div>
                </div>

                <button
                  onClick={() => setSaleStep(4)}
                  className="w-full h-14 bg-[#c8ff00] hover:bg-[#b0df00] text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  Confirm Sale Summary <ChevronRight size={14} className="stroke-[3]" />
                </button>
              </div>
            )}

            {/* STEP 4: INVOICE CONFIRMATION CARD */}
            {saleStep === 4 && selectedProduct && (
              <div className="space-y-5 animate-fadeIn">
                <button onClick={() => setSaleStep(3)} className="text-xs text-zinc-500 font-bold hover:text-white uppercase tracking-wide inline-flex items-center gap-1 cursor-pointer">
                  ← Back to details modifier
                </button>

                <h3 className="font-extrabold text-md uppercase text-neutral-200">Verify Cashier Receipt</h3>

                <div className="bg-[#121215] border border-white/10 rounded-[24px] p-5 space-y-4">
                  
                  {/* Item block */}
                  <div className="flex gap-4 items-center border-b border-white/[0.04] pb-4">
                    <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-lg overflow-hidden shrink-0">
                      {selectedProduct.images?.[0] ? <img src={selectedProduct.images[0]} className="w-full h-full object-cover" /> : "👕"}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase">{selectedProduct.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold font-mono tracking-wide mt-1 uppercase">
                        Size: {selectedSize} · Qty: {saleQuantity} sold
                      </p>
                    </div>
                  </div>

                  {/* Pricing summary */}
                  <div className="space-y-2 text-xs border-b border-white/[0.04] pb-4">
                    <div className="flex justify-between font-bold text-zinc-400">
                      <span>Subtotal price:</span>
                      <span>${originalTotalPrice}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between font-bold text-red-400 font-mono">
                        <span>Sale promotional discount:</span>
                        <span>-${discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm text-white pt-1">
                      <span>Total USD Cash:</span>
                      <span className="text-[#c8ff00]">${finalPrice}</span>
                    </div>
                  </div>

                  {/* Metadata tags */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-zinc-500 text-[9px] font-bold uppercase block tracking-wider font-mono">Payment method</span>
                      <span className="font-extrabold text-[#c8ff00] block mt-0.5">{paymentMethod.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[9px] font-bold uppercase block tracking-wider font-mono">Sale Channel</span>
                      <span className="font-extrabold text-white block mt-0.5">{saleChannel.toUpperCase()}</span>
                    </div>

                    {saleNotes && (
                      <div className="col-span-2 pt-1 border-t border-white/[0.02] mt-1">
                        <span className="text-zinc-500 text-[9px] font-bold uppercase block tracking-wider font-mono">Audit Memorandum notes</span>
                        <p className="text-zinc-300 font-bold text-[11px] mt-0.5">{saleNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleConfirmSale}
                  className="w-full h-15 bg-[#c8ff00] hover:bg-[#b0df00] text-black rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_8px_32px_rgba(198,255,0,0.15)]"
                >
                  Confirm Sale ✓
                </button>
              </div>
            )}

            {/* STEP 5: SUCCESS SCREEN */}
            {saleStep === 5 && (
              <div className="space-y-8 py-10 text-center flex flex-col items-center">
                <motion.div 
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-[#c8ff00]/10 border-2 border-[#c8ff00] text-[#c8ff00] flex items-center justify-center text-4xl"
                >
                  ✓
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-2.5xl font-black text-white uppercase tracking-tight">Sale recorded! 💰</h2>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Cash Register successfully modified</p>
                </div>

                <div className="bg-[#121215] border border-white/10 rounded-[20px] p-6 max-w-xs w-full">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block font-mono">Sales today cumulative total</span>
                  <p className="text-[#c8ff00] font-black text-3xl mt-1.5">${todayTotalRevenue}</p>
                  <p className="text-zinc-600 text-[9px] font-bold uppercase mt-1">Updates on CRM dashboard feed too</p>
                </div>

                <div className="space-y-2.5 w-full pt-4">
                  <button
                    onClick={handleResetRecordFlow}
                    className="w-full h-13 bg-[#c8ff00] text-black rounded-full font-black text-xs uppercase tracking-widest cursor-pointer"
                  >
                    Record Another Sale
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      handleResetRecordFlow();
                    }}
                    className="w-full h-13 border border-white/10 bg-white/[0.02] text-zinc-300 hover:text-white rounded-full font-black text-xs uppercase tracking-widest cursor-pointer"
                  >
                    Back to Sales Dashboard
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 3: STOCK MANAGEMENT */}
        {activeTab === 'stock' && (
          <div className="space-y-6">

            {/* LOW STOCK ALERTS VIEW BANNERS */}
            {lowStockAlerts.length > 0 && (
              <div className="space-y-2">
                {lowStockAlerts.slice(0, 3).map((alert, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleOpenRestockModal(alert.originalProduct)}
                    className="bg-[#c8ff00]/5 border border-[#c8ff00]/20 rounded-2xl p-4 flex gap-3.5 items-center justify-between cursor-pointer hover:bg-[#c8ff00]/10 transition-colors animate-pulse resize-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AlertCircle className="text-[#c8ff00] w-5 h-5 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white uppercase leading-none">Only {alert.count} Left in size {alert.size}</h4>
                        <p className="text-[10px] text-zinc-500 truncate uppercase tracking-widest mt-1 block">{alert.name}</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-[#c8ff00] text-black font-black uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap">Restock →</span>
                  </div>
                ))}
              </div>
            )}

            {/* STOCK CONTROLS OVERVIEW */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <h3 className="font-black text-sm uppercase tracking-wide">Brand Stock Levels</h3>
                <p className="text-secondary-text text-xs leading-none">Replenish collections from supplier boxes</p>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Filter stock by name..."
                  className="w-full h-11 border border-white/5 bg-white/[0.03] text-white rounded-xl pl-10 pr-4 text-xs font-bold outline-none focus:border-[#c8ff00]"
                />
              </div>

              {/* Badges filter tabs */}
              <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2">
                {[
                  { id: 'all', label: 'All Products' },
                  { id: 'low', label: '🟡 Low Stock (1-4)' },
                  { id: 'out', label: '🔴 Sold Out (0)' }
                ].map(badge => (
                  <button
                    key={badge.id}
                    onClick={() => setStockFilterTab(badge.id as any)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      stockFilterTab === badge.id 
                        ? 'border-[#c8ff00] bg-[#c8ff00]/10 text-[#c8ff00]' 
                        : 'border-white/5 bg-black/40 text-zinc-500'
                    }`}
                  >
                    {badge.label}
                  </button>
                ))}
              </div>

              {/* INVENTORY STOCKS LOG */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
                {products
                  .filter(p => {
                    const matchName = p.name.toLowerCase().includes(inventorySearch.toLowerCase());
                    if (stockFilterTab === 'low') {
                      return matchName && p.sizes.some(sz => sz.quantity > 0 && sz.quantity <= 4);
                    }
                    if (stockFilterTab === 'out') {
                      return matchName && p.total_stock === 0;
                    }
                    return matchName;
                  })
                  .map(prod => {
                    const stock = prod.total_stock;
                    const stockColorBadge = stock >= 5 
                      ? 'border-emerald-600/35 bg-emerald-600/10 text-emerald-400' 
                      : stock > 0 
                        ? 'border-amber-600/35 bg-amber-600/10 text-amber-500' 
                        : 'border-red-600/35 bg-red-600/10 text-red-500';

                    return (
                      <div 
                        key={prod.id} 
                        className="bg-white/[0.03] border border-white/10 rounded-[20px] p-3.5 flex gap-3.5 items-center justify-between"
                      >
                        <div className="flex gap-3 items-center min-w-0">
                          <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden shrink-0">
                            {prod.images?.[0] ? <img src={prod.images[0]} className="w-full h-full object-cover" /> : "👕"}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-neutral-200 uppercase truncate max-w-[150px] leading-tight">{prod.name}</h4>
                            
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {prod.sizes.map((sz, i) => (
                                <span key={i} className={`text-[8px] font-bold font-mono uppercase px-1.5 py-0.5 rounded ${sz.quantity === 0 ? 'bg-red-950/20 text-red-500' : sz.quantity <= 4 ? 'bg-amber-950/20 text-amber-500' : 'bg-white/[0.05] text-zinc-400'}`}>
                                  {sz.size}: {sz.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div>
                            <span className={`text-[9px] border px-2.5 py-1 rounded-full font-black uppercase tracking-wide block text-center ${stockColorBadge}`}>
                              {stock} units
                            </span>
                          </div>
                          
                          <button 
                            onClick={() => handleOpenRestockModal(prod)}
                            className="bg-white/[0.04] border border-white/5 hover:border-[#c8ff00] text-zinc-300 hover:text-[#c8ff00] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Restock
                          </button>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {/* RESTOCK DIALOG BOX */}
            <AnimatePresence>
              {selectedProductForRestock && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center pointer-events-auto">
                  <motion.div 
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    className="w-full max-w-md bg-[#121215] border-t border-white/10 rounded-t-[32px] p-6 pb-12 space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[#c8ff00] text-[10px] font-black uppercase tracking-widest italic block">BOX CONTROLS</span>
                        <h3 className="text-lg font-black text-white uppercase mt-0.5">Restock inventory</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedProductForRestock(null)} 
                        className="p-1.5 border border-white/5 bg-white/[0.03] text-zinc-400 hover:text-white rounded-full cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex gap-3.5 items-center bg-white/[0.02] border border-white/5 rounded-2xl p-3.5">
                      <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-lg overflow-hidden shrink-0">
                        {selectedProductForRestock.images?.[0] ? <img src={selectedProductForRestock.images[0]} className="w-full h-full object-cover" /> : "👕"}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase leading-none">{selectedProductForRestock.name}</h4>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono tracking-wider mt-1 block">Current stock total: {selectedProductForRestock.total_stock}</span>
                      </div>
                    </div>

                    {/* RESTOCK FORM */}
                    <div className="space-y-3.5">
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block font-mono">Specify incoming size counts</span>
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                        {selectedProductForRestock.sizes.map(sz => {
                          const quantityToAdd = restockQuantities[sz.size] || 0;
                          return (
                            <div key={sz.size} className="flex justify-between items-center bg-white/[0.01] border border-white/5 px-4 py-3 rounded-xl">
                              <div>
                                <span className="font-extrabold text-sm text-zinc-200">{sz.size}</span>
                                <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">Currently: {sz.quantity} left</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => handleRestockQuantityChange(sz.size, -1)}
                                  disabled={quantityToAdd <= 0}
                                  className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-white flex items-center justify-center cursor-pointer border border-white/5 disabled:opacity-20"
                                >
                                  <Minus size={13} />
                                </button>
                                
                                <span className="text-sm font-black text-[#c8ff00] w-6 text-center select-none">+{quantityToAdd}</span>

                                <button 
                                  onClick={() => handleRestockQuantityChange(sz.size, 1)}
                                  className="w-8 h-8 rounded-lg bg-[#c8ff00]/10 border border-[#c8ff00]/25 text-[#c8ff00] flex items-center justify-center cursor-pointer hover:bg-[#c8ff00]/20"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitRestock}
                      className="w-full h-14 bg-[#c8ff00] hover:bg-[#b0df00] text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      Update Stock Inventory ✓
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* SLOW MOVERS SECTIONS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-md">😴</span>
                <h3 className="font-black text-sm uppercase tracking-wide text-zinc-200">Slow Movers (No sales in 14+ days)</h3>
              </div>

              {slowMovers.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-8 text-center px-4">
                  <span className="text-xs text-zinc-500">All inventory products have sales activity! 🚀</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {slowMovers.map(smProd => (
                    <div key={smProd.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-4 items-center justify-between">
                      <div className="flex gap-3 items-center min-w-0">
                        <div className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden shrink-0">
                          {smProd.images?.[0] ? <img src={smProd.images[0]} className="w-full h-full object-cover" /> : "👕"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-zinc-300 uppercase truncate max-w-[150px] leading-tight">{smProd.name}</h4>
                          <span className="text-[9px] bg-red-600/15 border border-red-600/25 text-red-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide inline-block mt-1">Not moving</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-[#c8ff00] font-black uppercase tracking-wide">Discount? Offer free?</span>
                        <button 
                          onClick={() => {
                            setSelectedProduct(smProd);
                            handleSelectProduct(smProd);
                            setActiveTab('record');
                          }}
                          className="bg-[#c8ff00]/10 hover:bg-[#c8ff00]/25 text-[#c8ff00] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-md cursor-pointer inline-block"
                        >
                          Clear Sale
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: SALES TRANSACTION LOG */}
        {activeTab === 'history' && (
          <div className="space-y-6">

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-wide">Receipt CRM History</h3>
                <button 
                  onClick={handleExportMonthReport}
                  className="px-3.5 py-2 bg-[#c8ff00]/10 border border-[#c8ff00]/25 text-[#c8ff00] text-[10px] font-black uppercase tracking-wider rounded-full hover:bg-[#c8ff00]/20 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Share2 size={11} className="stroke-[3]" /> Export Month
                </button>
              </div>
              <p className="text-secondary-text text-xs leading-none">Void sales or extract historic performance CSV logs</p>
            </div>

            {/* QUERY FILTER CONSOLE */}
            <div className="bg-white/[0.03] border border-white/10 p-4.5 rounded-[24px] space-y-4">
              
              {/* SEARCH */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search receipt by product title..."
                  className="w-full h-11 border border-white/5 bg-black/40 text-white rounded-xl pl-10 pr-4 text-xs font-bold outline-none focus:border-[#c8ff00]"
                />
              </div>

              {/* PAYMENT TYPES FILTER */}
              <div className="space-y-1.5">
                <span className="text-zinc-500 text-[9px] font-bold uppercase block tracking-wider font-mono">Filter by Receipt Method</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'All Payments' },
                    { id: 'cash', label: '💵 Cash' },
                    { id: 'ecocash', label: '📱 Eco' },
                    { id: 'innbucks', label: '🏦 Inn' },
                    { id: 'whatsapp', label: '💬 WhatsApp' }
                  ].map(pType => (
                    <button
                      key={pType.id}
                      onClick={() => setHistoryPaymentFilter(pType.id as any)}
                      className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        historyPaymentFilter === pType.id 
                          ? 'border-[#c8ff00] bg-[#c8ff00]/10 text-[#c8ff00]' 
                          : 'border-white/5 bg-black/40 text-zinc-500'
                      }`}
                    >
                      {pType.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CHANNELS FILTER */}
              <div className="space-y-1.5">
                <span className="text-zinc-500 text-[9px] font-bold uppercase block tracking-wider font-mono">Filter by Sales Channel</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'All Channels' },
                    { id: 'walk-in', label: '🚶 Walk-in' },
                    { id: 'whatsapp', label: '💬 WhatsApp' },
                    { id: 'instagram', label: '📸 Insta' },
                    { id: 'other', label: '📦 Other' }
                  ].map(cType => (
                    <button
                      key={cType.id}
                      onClick={() => setHistoryChannelFilter(cType.id as any)}
                      className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        historyChannelFilter === cType.id 
                          ? 'border-[#c8ff00] bg-[#c8ff00]/10 text-[#c8ff00]' 
                          : 'border-white/5 bg-black/40 text-zinc-500'
                      }`}
                    >
                      {cType.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* RAW DATA LOG ITEMS */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 no-scrollbar">
              {salesHistoryFiltered.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-14 text-center px-4">
                  <span className="text-2xl">📋</span>
                  <h4 className="font-extrabold text-xs mt-2 uppercase tracking-wide text-zinc-500">No matching transactions logged</h4>
                </div>
              ) : (
                salesHistoryFiltered.map(sale => (
                  <div 
                    key={sale.id} 
                    onClick={() => setHistorySelectedSaleDetail(sale)}
                    className={`bg-white/[0.03] border rounded-[20px] p-4 flex items-center justify-between hover:bg-white/[0.05] transition-colors cursor-pointer ${sale.voided ? 'border-red-900/30 opacity-55 saturate-50' : 'border-white/10'}`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{sale.channel === 'walk-in' ? '🚶' : sale.channel === 'whatsapp' ? '💬' : sale.channel === 'instagram' ? '📸' : '📦'}</span>
                        <h4 className={`text-xs font-black uppercase text-neutral-200 truncate max-w-[164px] leading-tight ${sale.voided ? 'line-through text-red-400' : ''}`}>{sale.product_name}</h4>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold font-mono tracking-wide mt-1 block uppercase">
                        Size {sale.size} · {sale.payment_method.toUpperCase()} · {new Date(sale.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-1.5">
                      <div>
                        {sale.voided ? (
                          <span className="text-[9px] bg-red-600/15 border border-red-600/35 text-red-500 font-extrabold rounded-full px-2 py-0.5 uppercase tracking-wide">Voided</span>
                        ) : (
                          <span className="text-sm font-black text-[#c8ff00] block">${sale.final_price}</span>
                        )}
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mt-0.5">{sale.quantity} units</span>
                      </div>
                      <ChevronRight size={14} className="text-zinc-600" />
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

      </div>

      {/* DETAIL MODAL DRAWER */}
      <AnimatePresence>
        {historySelectedSaleDetail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center pointer-events-auto">
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="w-full max-w-md bg-[#121215] border-t border-white/10 rounded-t-[32px] p-6 pb-12 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-4">
                <div>
                  <span className="text-zinc-500 text-[10px] font-bold uppercase block tracking-wider font-mono">RECEIPT ID: #{historySelectedSaleDetail.id.substring(0, 8).toUpperCase()}</span>
                  <h3 className="text-lg font-black text-white uppercase mt-0.5">Transaction Invoice</h3>
                </div>
                <button 
                  onClick={() => {
                    setHistorySelectedSaleDetail(null);
                    setShowVoidConfirmationId(null);
                  }} 
                  className="p-1.5 border border-white/5 bg-white/[0.03] text-zinc-400 hover:text-white rounded-full cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* RECEIPT METADATA CARD */}
              <div className="space-y-4">
                
                <div className="flex gap-4 items-center">
                  <div className="w-11 h-11 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center text-lg shrink-0">
                    👚
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">{historySelectedSaleDetail.product_name}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold font-mono tracking-wide mt-1 uppercase">
                      Size {historySelectedSaleDetail.size} · {historySelectedSaleDetail.quantity} Unit cleared
                    </p>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-2.5 text-xs text-zinc-300">
                  <div className="flex justify-between font-bold text-zinc-400">
                    <span>Retail standard price:</span>
                    <span>${historySelectedSaleDetail.original_price * historySelectedSaleDetail.quantity}</span>
                  </div>
                  {historySelectedSaleDetail.discount_amount > 0 && (
                    <div className="flex justify-between font-bold text-red-400 font-mono">
                      <span>In-store discount deduction:</span>
                      <span>-${historySelectedSaleDetail.discount_amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-white text-sm pt-1 border-t border-white/[0.02]">
                    <span>Amount received (USD):</span>
                    <span className="text-[#c8ff00]">${historySelectedSaleDetail.final_price}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-zinc-500 text-[9px] font-bold uppercase block tracking-wider font-mono">Paid via</span>
                    <span className="font-extrabold text-[#c8ff00] block mt-0.5">{historySelectedSaleDetail.payment_method.toUpperCase()}</span>
                  </div>
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-zinc-500 text-[9px] font-bold uppercase block tracking-wider font-mono">Referral Channel</span>
                    <span className="font-extrabold text-white block mt-0.5">{historySelectedSaleDetail.channel.toUpperCase()}</span>
                  </div>
                  <div className="col-span-2 bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-zinc-500 text-[9px] font-bold uppercase block tracking-wider font-mono">Recorded date/time</span>
                    <span className="font-extrabold text-zinc-300 block mt-0.5">
                      {new Date(historySelectedSaleDetail.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                  {historySelectedSaleDetail.notes && (
                    <div className="col-span-2 bg-black/40 p-3 rounded-xl border border-white/5">
                      <span className="text-zinc-500 text-[9px] font-bold uppercase block tracking-wider font-mono">Cashier note update</span>
                      <p className="text-zinc-300 font-bold block mt-0.5">{historySelectedSaleDetail.notes}</p>
                    </div>
                  )}
                </div>

                {/* VOID CONTROL MODULE */}
                {!historySelectedSaleDetail.voided ? (
                  <div className="pt-2">
                    {showVoidConfirmationId !== historySelectedSaleDetail.id ? (
                      <button
                        onClick={() => setShowVoidConfirmationId(historySelectedSaleDetail.id)}
                        className="w-full h-12 bg-red-650 hover:bg-red-500 border border-red-500/20 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Trash2 size={13} /> Void / Reverse Sale
                      </button>
                    ) : (
                      <div className="space-y-2 animate-fadeIn bg-red-950/20 border border-red-900/40 p-4 rounded-2xl">
                        <div className="flex gap-2 text-red-500 font-bold text-xs uppercase tracking-wider items-center justify-center">
                          <AlertTriangle size={15} /> Yes, Initiate Reversal?
                        </div>
                        <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
                          This operation replenishes product sizing quantities inside stock sheets. Void actions are irreversible.
                        </p>
                        <div className="flex gap-2.5 pt-1">
                          <button
                            onClick={() => handleVoidSale(historySelectedSaleDetail)}
                            className="flex-1 h-10 bg-red-600 font-black text-[10px] uppercase tracking-wider text-white rounded-lg cursor-pointer"
                          >
                            Proceed
                          </button>
                          <button
                            onClick={() => setShowVoidConfirmationId(null)}
                            className="flex-1 h-10 bg-white/[0.04] border border-white/5 font-black text-[10px] uppercase tracking-wider text-zinc-400 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-950/20 border-2 border-dashed border-red-900/30 p-4 rounded-2xl text-center">
                    <span className="text-red-500 font-black text-xs uppercase tracking-widest block">🔒 Voided & Stock Replenished</span>
                    <p className="text-zinc-600 text-[10px] mt-1 leading-snug">This transaction was voided and inventory stock counts returned to products logs.</p>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER BAR FOOTER menu matching App layout */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0E0E12] border-t border-white/[0.04] z-50 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex items-center pb-safe">
        <div className="flex items-center justify-around w-full min-w-max px-4 gap-2">
          <NavTab icon={<Home size={20} />} label="Dashboard" onClick={() => navigate('/dashboard')} />
          <NavTab icon={<ShoppingBag size={20} />} label="Sales" active />
          <NavTab icon={<Package size={20} />} label="Products" onClick={() => navigate('/inventory')} />
          <NavTab icon={<BarChart3 size={20} />} label="Analytics" onClick={() => navigate('/analytics')} />
          <NavTab icon={<Settings size={20} />} label="Settings" onClick={() => navigate('/settings')} />
        </div>
      </div>

    </div>
  );
};

const NavTab = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-5 py-1.5 rounded-xl transition-all cursor-pointer ${active ? 'text-[#C6FF00]' : 'text-zinc-500 hover:text-white'}`}
  >
    {icon}
    <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{label}</span>
  </button>
);
