import { Router, Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const router = Router();

// Lazy Supabase client initialization to prevent module-load crashes in serverless functions
let cachedSupabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!cachedSupabase) {
    const supabaseUrl = 
      process.env.VITE_SUPABASE_URL || 
      process.env.SUPABASE_URL || 
      'https://placeholder.supabase.co';
      
    const supabaseKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.VITE_SUPABASE_ANON_KEY || 
      process.env.SUPABASE_ANON_KEY || 
      process.env.SUPABASE_KEY || 
      'placeholder-key';

    console.log(`[SUPABASE_INIT] Initializing Supabase client. URL: ${supabaseUrl ? supabaseUrl.substring(0, 25) + '...' : 'EMPTY'}, HasServiceRoleKey: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
    
    cachedSupabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return cachedSupabase;
}

/**
 * Handles product creation with rigorous 10-step diagnostic logging and granular error tracking.
 */
const handleProductCreation = async (req: Request, res: Response) => {
  const requestStartTime = Date.now();
  const FILE_NAME = 'server/routes/products.ts';

  // =========================================================================
  // 1. LOG ROUTE ENTRY
  // =========================================================================
  console.log('================================================================');
  console.log(`[1/10] ROUTE_ENTRY: Received ${req.method} ${req.originalUrl || req.url} at ${new Date().toISOString()}`);
  console.log(`[1/10] ROUTE_ENTRY_HEADERS:`, {
    host: req.headers.host,
    contentType: req.headers['content-type'],
    hasAuthHeader: !!req.headers.authorization,
    userAgent: req.headers['user-agent']
  });
  console.log('================================================================');

  let supabase: SupabaseClient;
  try {
    supabase = getSupabase();
  } catch (initErr: any) {
    console.error(`[1/10] SUPABASE_INIT_ERROR in ${FILE_NAME}:`, initErr);
    return res.status(500).json({
      success: false,
      step: '1_ROUTE_ENTRY_CLIENT_INIT',
      file: FILE_NAME,
      line: 38,
      error: {
        name: initErr?.name,
        message: initErr?.message,
        stack: initErr?.stack
      }
    });
  }

  // =========================================================================
  // 2. AUTHENTICATION & LOG AUTHENTICATION SUCCESS
  // =========================================================================
  let profileId: string;
  let userEmail: string;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.warn(`[2/10] AUTH_FAILED in ${FILE_NAME}: Missing Authorization header`);
      return res.status(401).json({
        success: false,
        step: '2_AUTHENTICATION',
        file: FILE_NAME,
        line: 67,
        error: {
          name: 'AuthenticationError',
          message: 'Authorization header is missing. Please sign in.',
          code: 'AUTH_HEADER_MISSING'
        }
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      console.warn(`[2/10] AUTH_FAILED in ${FILE_NAME}: Bearer token empty`);
      return res.status(401).json({
        success: false,
        step: '2_AUTHENTICATION',
        file: FILE_NAME,
        line: 82,
        error: {
          name: 'AuthenticationError',
          message: 'Bearer authentication token is empty.',
          code: 'AUTH_TOKEN_EMPTY'
        }
      });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.warn(`[2/10] AUTH_FAILED in ${FILE_NAME}: Invalid user token`, userError);
      return res.status(401).json({
        success: false,
        step: '2_AUTHENTICATION',
        file: FILE_NAME,
        line: 97,
        error: {
          name: userError?.name || 'AuthVerificationError',
          message: userError?.message || 'Session expired or invalid token',
          status: userError?.status,
          stack: userError?.stack
        }
      });
    }

    profileId = userData.user.id;
    userEmail = userData.user.email || 'N/A';

    console.log(`[2/10] AUTHENTICATION_SUCCESS in ${FILE_NAME}:`, {
      profileId,
      userEmail,
      aud: userData.user.aud,
      role: userData.user.role
    });
  } catch (authException: any) {
    console.error(`[2/10] AUTH_EXCEPTION in ${FILE_NAME}:`, authException);
    return res.status(500).json({
      success: false,
      step: '2_AUTHENTICATION',
      file: FILE_NAME,
      line: 122,
      error: {
        name: authException?.name,
        message: authException?.message,
        stack: authException?.stack
      }
    });
  }

  // =========================================================================
  // 3. LOG REQUEST PAYLOAD
  // =========================================================================
  const { shopId, productPayload } = req.body || {};

  console.log(`[3/10] REQUEST_PAYLOAD in ${FILE_NAME}:`, {
    receivedShopId: shopId,
    hasProductPayload: !!productPayload,
    payloadType: typeof productPayload,
    productName: productPayload?.name,
    productPrice: productPayload?.price,
    productCategory: productPayload?.category,
    imagesCount: Array.isArray(productPayload?.images) ? productPayload.images.length : 0,
    sizesCount: Array.isArray(productPayload?.sizes) ? productPayload.sizes.length : 0,
    colorsCount: Array.isArray(productPayload?.colours || productPayload?.colors) ? (productPayload.colours || productPayload.colors).length : 0,
    isPublished: productPayload?.is_published,
    status: productPayload?.status
  });

  if (!shopId || typeof shopId !== 'string' || shopId.trim() === '') {
    console.warn(`[3/10] PAYLOAD_VALIDATION_ERROR in ${FILE_NAME}: Invalid shopId`);
    return res.status(400).json({
      success: false,
      step: '3_REQUEST_PAYLOAD_VALIDATION',
      file: FILE_NAME,
      line: 154,
      error: {
        name: 'ValidationError',
        message: 'shopId is required and must be a non-empty string.',
        receivedShopId: shopId ?? null
      }
    });
  }

  if (shopId.startsWith('local-shop-') || shopId === '55555555-5555-5555-5555-555555555555') {
    console.warn(`[3/10] PAYLOAD_VALIDATION_ERROR in ${FILE_NAME}: Temporary/local shopId rejected: ${shopId}`);
    return res.status(400).json({
      success: false,
      step: '3_REQUEST_PAYLOAD_VALIDATION',
      file: FILE_NAME,
      line: 168,
      error: {
        name: 'ValidationError',
        message: 'Cannot create products under a temporary local shop. Please complete store setup first.',
        receivedShopId: shopId
      }
    });
  }

  if (!productPayload || typeof productPayload !== 'object' || Array.isArray(productPayload)) {
    console.warn(`[3/10] PAYLOAD_VALIDATION_ERROR in ${FILE_NAME}: Invalid productPayload object`);
    return res.status(400).json({
      success: false,
      step: '3_REQUEST_PAYLOAD_VALIDATION',
      file: FILE_NAME,
      line: 182,
      error: {
        name: 'ValidationError',
        message: 'productPayload must be an object containing product properties.'
      }
    });
  }

  // =========================================================================
  // 4. SHOP LOOKUP & LOG SHOP LOOKUP RESULT
  // =========================================================================
  let shop: any = null;
  try {
    console.log(`[4/10] SHOP_LOOKUP_START in ${FILE_NAME}: Querying shopId "${shopId}"...`);
    const { data, error: shopError } = await supabase
      .from('shops')
      .select('id, name, slug, plan, plan_type, page_type, owner_id, subscription_status, payment_status')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError) {
      console.error(`[4/10] SHOP_LOOKUP_DB_ERROR in ${FILE_NAME}:`, shopError);
      return res.status(500).json({
        success: false,
        step: '4_SHOP_LOOKUP',
        file: FILE_NAME,
        line: 207,
        error: {
          name: 'PostgrestError',
          code: shopError.code,
          message: shopError.message,
          details: shopError.details,
          hint: shopError.hint
        }
      });
    }

    shop = data;

    console.log(`[4/10] SHOP_LOOKUP_RESULT in ${FILE_NAME}:`, {
      shopFound: !!shop,
      shopId: shop?.id,
      shopName: shop?.name,
      shopSlug: shop?.slug,
      shopOwnerId: shop?.owner_id,
      shopPageType: shop?.page_type,
      shopPlan: shop?.plan,
      shopPlanType: shop?.plan_type,
      shopSubscriptionStatus: shop?.subscription_status
    });

    if (!shop) {
      console.warn(`[4/10] SHOP_LOOKUP_NULL in ${FILE_NAME}: No shop record found for shopId "${shopId}"`);
      return res.status(404).json({
        success: false,
        step: '4_SHOP_LOOKUP',
        file: FILE_NAME,
        line: 238,
        error: {
          name: 'NotFoundError',
          message: `No shop found matching ID "${shopId}". Please verify your store configuration.`,
          shopId
        }
      });
    }

    if (shop.owner_id !== profileId) {
      console.warn(`[4/10] SHOP_OWNERSHIP_MISMATCH in ${FILE_NAME}: shop.owner_id (${shop.owner_id}) !== authenticated profileId (${profileId})`);
      return res.status(403).json({
        success: false,
        step: '4_SHOP_LOOKUP',
        file: FILE_NAME,
        line: 252,
        error: {
          name: 'ForbiddenError',
          message: 'You do not have permission to publish products to this shop because you are not the registered owner.',
          shopId: shop.id,
          shopOwnerId: shop.owner_id,
          requesterProfileId: profileId
        }
      });
    }
  } catch (shopException: any) {
    console.error(`[4/10] SHOP_LOOKUP_EXCEPTION in ${FILE_NAME}:`, shopException);
    return res.status(500).json({
      success: false,
      step: '4_SHOP_LOOKUP',
      file: FILE_NAME,
      line: 268,
      error: {
        name: shopException?.name,
        message: shopException?.message,
        stack: shopException?.stack
      }
    });
  }

  // =========================================================================
  // 5. PLAN RESOLUTION & LOG PLAN RESOLUTION
  // =========================================================================
  let isProPlan = false;
  let pageType = 'clothing';
  let isClothingCategory = true;

  try {
    const rawShopPlan = (shop.plan || shop.plan_type || 'free').toLowerCase().trim();
    const isShopMarkedPro = rawShopPlan === 'pro' || rawShopPlan === 'premium' || shop.subscription_status === 'active';

    const { data: profileRecord, error: profileErr } = await supabase
      .from('profiles')
      .select('id, subscription_status, active_until')
      .eq('id', profileId)
      .maybeSingle();

    if (profileErr) {
      console.warn(`[5/10] PROFILE_CHECK_WARN in ${FILE_NAME}:`, profileErr.message);
    }

    const isProfileMarkedPro = profileRecord?.subscription_status === 'active';

    const { data: activeSubRecord, error: subErr } = await supabase
      .from('subscriptions')
      .select('id, status, plan, current_period_end, category')
      .eq('shop_id', shopId)
      .in('status', ['active', 'grace_period'])
      .maybeSingle();

    if (subErr) {
      console.warn(`[5/10] SUBSCRIPTION_CHECK_WARN in ${FILE_NAME}:`, subErr.message);
    }

    const isSubscriptionTablePro = !!activeSubRecord && (activeSubRecord.status === 'active' || activeSubRecord.status === 'grace_period');
    isProPlan = isShopMarkedPro || isProfileMarkedPro || isSubscriptionTablePro;

    pageType = (shop.page_type || 'clothing').toLowerCase().trim();
    isClothingCategory = pageType === 'clothing' || pageType === 'storefront' || pageType === 'apparel' || pageType === 'fashion';

    console.log(`[5/10] PLAN_RESOLUTION in ${FILE_NAME}:`, {
      pageType,
      isClothingCategory,
      isProPlan,
      breakdown: {
        rawShopPlan,
        isShopMarkedPro,
        profileStatus: profileRecord?.subscription_status || 'none',
        isProfileMarkedPro,
        subscriptionTableStatus: activeSubRecord?.status || 'none',
        isSubscriptionTablePro
      }
    });
  } catch (planException: any) {
    console.error(`[5/10] PLAN_RESOLUTION_EXCEPTION in ${FILE_NAME}:`, planException);
    return res.status(500).json({
      success: false,
      step: '5_PLAN_RESOLUTION',
      file: FILE_NAME,
      line: 335,
      error: {
        name: planException?.name,
        message: planException?.message,
        stack: planException?.stack
      }
    });
  }

  // =========================================================================
  // 6. PRODUCT LIMIT VALIDATION & LOG PRODUCT LIMIT VALIDATION
  // =========================================================================
  try {
    if (isClothingCategory && !isProPlan) {
      const FREE_PRODUCT_LIMIT = 2;

      const { count: activeCount, error: countError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('is_published', true)
        .neq('status', 'draft')
        .neq('status', 'archived')
        .neq('status', 'paused')
        .neq('status', 'deleted');

      if (countError) {
        console.error(`[6/10] COUNT_QUERY_ERROR in ${FILE_NAME}:`, countError);
      }

      const currentActiveCount = typeof activeCount === 'number' ? activeCount : 0;

      console.log(`[6/10] PRODUCT_LIMIT_VALIDATION in ${FILE_NAME}:`, {
        category: 'Clothing (Free Plan)',
        currentActiveCount,
        limit: FREE_PRODUCT_LIMIT,
        canAdd: currentActiveCount < FREE_PRODUCT_LIMIT
      });

      if (currentActiveCount >= FREE_PRODUCT_LIMIT) {
        console.warn(`[6/10] PRODUCT_LIMIT_EXCEEDED in ${FILE_NAME}: Shop ${shopId} reached 2-product limit. Returning HTTP 403.`);
        return res.status(403).json({
          success: false,
          step: '6_PRODUCT_LIMIT_VALIDATION',
          file: FILE_NAME,
          line: 377,
          error: {
            name: 'QuotaExceededError',
            code: 'PRODUCT_LIMIT_REACHED',
            message: 'You have reached the maximum number of products allowed on your current plan. Upgrade to Pro to add more products.',
            limit: FREE_PRODUCT_LIMIT,
            count: currentActiveCount,
            upgradeRequired: true
          }
        });
      }
      console.log(`[6/10] PRODUCT_LIMIT_VALIDATION_PASSED: Free quota check passed (${currentActiveCount}/${FREE_PRODUCT_LIMIT} active products).`);
    } else if (isProPlan) {
      console.log(`[6/10] PRODUCT_LIMIT_VALIDATION_PASSED: Pro merchant detected. Unlimited products allowed.`);
    } else {
      console.log(`[6/10] PRODUCT_LIMIT_VALIDATION_PASSED: Category "${pageType}" standard publishing allowed.`);
    }
  } catch (quotaException: any) {
    console.error(`[6/10] QUOTA_VALIDATION_EXCEPTION in ${FILE_NAME}:`, quotaException);
    return res.status(500).json({
      success: false,
      step: '6_PRODUCT_LIMIT_VALIDATION',
      file: FILE_NAME,
      line: 400,
      error: {
        name: quotaException?.name,
        message: quotaException?.message,
        stack: quotaException?.stack
      }
    });
  }

  // =========================================================================
  // 7. PREPARE & LOG INSERT PAYLOAD
  // =========================================================================
  let insertPayload: any;
  try {
    const rawName = productPayload.name;
    const rawPrice = productPayload.price;

    if (typeof rawName !== 'string' || rawName.trim().length === 0) {
      console.warn(`[7/10] FIELD_VALIDATION_ERROR in ${FILE_NAME}: Name empty`);
      return res.status(400).json({
        success: false,
        step: '7_INSERT_PAYLOAD_PREPARATION',
        file: FILE_NAME,
        line: 421,
        error: {
          name: 'ValidationError',
          message: 'Product name is required and cannot be empty.',
          receivedName: rawName
        }
      });
    }

    const trimmedName = rawName.trim();
    if (trimmedName.length < 2) {
      console.warn(`[7/10] FIELD_VALIDATION_ERROR in ${FILE_NAME}: Name too short`);
      return res.status(400).json({
        success: false,
        step: '7_INSERT_PAYLOAD_PREPARATION',
        file: FILE_NAME,
        line: 436,
        error: {
          name: 'ValidationError',
          message: 'Product name must be at least 2 characters long.',
          receivedName: trimmedName
        }
      });
    }

    const numericPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice);
    if (isNaN(numericPrice) || numericPrice < 0) {
      console.warn(`[7/10] FIELD_VALIDATION_ERROR in ${FILE_NAME}: Invalid price ${rawPrice}`);
      return res.status(400).json({
        success: false,
        step: '7_INSERT_PAYLOAD_PREPARATION',
        file: FILE_NAME,
        line: 451,
        error: {
          name: 'ValidationError',
          message: 'Product price must be a valid positive number.',
          receivedPrice: rawPrice
        }
      });
    }

    const imagesArray = Array.isArray(productPayload.images) 
      ? productPayload.images.filter((img: any) => typeof img === 'string' && img.trim() !== '')
      : [];

    const primaryImageUrl = productPayload.image_url || imagesArray[0] || null;

    const sizesArray = Array.isArray(productPayload.sizes) 
      ? productPayload.sizes 
      : [];

    const coloursArray = Array.isArray(productPayload.colours)
      ? productPayload.colours
      : (Array.isArray(productPayload.colors) ? productPayload.colors : []);

    const numericStock = typeof productPayload.stock === 'number' 
      ? productPayload.stock 
      : (parseInt(productPayload.stock, 10) || 0);

    const numericTotalStock = typeof productPayload.total_stock === 'number'
      ? productPayload.total_stock
      : numericStock;

    insertPayload = {
      shop_id: shopId,
      name: trimmedName,
      price: numericPrice,
      category: typeof productPayload.category === 'string' ? productPayload.category.trim() : null,
      description: typeof productPayload.description === 'string' ? productPayload.description.trim() : null,
      images: imagesArray,
      image_url: primaryImageUrl,
      sizes: sizesArray,
      stock: numericStock,
      total_stock: numericTotalStock,
      colours: coloursArray,
      is_published: productPayload.is_published !== undefined ? Boolean(productPayload.is_published) : true,
      status: productPayload.status || 'active',
      is_featured: Boolean(productPayload.is_featured),
      created_at: new Date().toISOString()
    };

    console.log(`[7/10] INSERT_PAYLOAD in ${FILE_NAME}:`);
    console.log(JSON.stringify(insertPayload, null, 2));
  } catch (payloadPrepException: any) {
    console.error(`[7/10] PAYLOAD_PREP_EXCEPTION in ${FILE_NAME}:`, payloadPrepException);
    return res.status(500).json({
      success: false,
      step: '7_INSERT_PAYLOAD_PREPARATION',
      file: FILE_NAME,
      line: 509,
      error: {
        name: payloadPrepException?.name,
        message: payloadPrepException?.message,
        stack: payloadPrepException?.stack
      }
    });
  }

  // =========================================================================
  // 8. LOG DATABASE INSERT START
  // =========================================================================
  console.log(`[8/10] DATABASE_INSERT_START in ${FILE_NAME}: Executing supabase.from('products').insert() for shopId "${shopId}"...`);

  let newProduct: any = null;
  let insertError: any = null;

  try {
    const result = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

    newProduct = result.data;
    insertError = result.error;
  } catch (insertException: any) {
    console.error(`[8/10] DATABASE_INSERT_EXCEPTION_THROWN in ${FILE_NAME}:`, insertException);
    return res.status(500).json({
      success: false,
      step: '8_DATABASE_INSERT_EXECUTION',
      file: FILE_NAME,
      line: 539,
      error: {
        name: insertException?.name,
        message: insertException?.message,
        stack: insertException?.stack
      }
    });
  }

  // Inspect Database Insert Failure
  if (insertError) {
    console.error(`[8/10] DATABASE_INSERT_ERROR in ${FILE_NAME}:`, insertError);

    const errorCode = insertError.code || 'UNKNOWN';
    const errorMessage = insertError.message || '';
    const errorDetails = insertError.details || '';
    const errorHint = insertError.hint || '';

    // Check Trigger Quota Check Violation
    const isQuotaViolation = 
      errorCode === '23514' || 
      errorMessage.toLowerCase().includes('limit reached') ||
      errorMessage.toLowerCase().includes('plan limit') ||
      errorMessage.toLowerCase().includes('quota') ||
      errorDetails.toLowerCase().includes('limit reached');

    if (isQuotaViolation) {
      console.warn(`[8/10] TRIGGER_QUOTA_INTERCEPTED in ${FILE_NAME}: Intercepted PostgreSQL trigger quota error. Returning HTTP 403.`);
      return res.status(403).json({
        success: false,
        step: '8_DATABASE_INSERT_EXECUTION',
        file: FILE_NAME,
        line: 571,
        error: {
          name: 'QuotaExceededError',
          code: 'PRODUCT_LIMIT_REACHED',
          message: 'You have reached the maximum number of products allowed on your current plan. Upgrade to Pro to add more products.',
          limit: 2,
          upgradeRequired: true,
          dbError: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails,
            hint: errorHint
          }
        }
      });
    }

    // Check RLS Policy Violation
    if (errorCode === '42501' || errorMessage.toLowerCase().includes('row-level security') || errorMessage.toLowerCase().includes('permission denied')) {
      console.error(`[8/10] RLS_POLICY_VIOLATION in ${FILE_NAME}: Database write blocked by RLS`);
      return res.status(403).json({
        success: false,
        step: '8_DATABASE_INSERT_EXECUTION',
        file: FILE_NAME,
        line: 596,
        error: {
          name: 'RlsPolicyViolationError',
          code: errorCode,
          message: 'Database permission denied (Row-Level Security policy). Please check database write permissions.',
          dbError: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails,
            hint: errorHint
          }
        }
      });
    }

    // Check Foreign Key Violation
    if (errorCode === '23503' || errorMessage.toLowerCase().includes('foreign key')) {
      console.error(`[8/10] FOREIGN_KEY_VIOLATION in ${FILE_NAME}: Shop does not exist in foreign key table`);
      return res.status(400).json({
        success: false,
        step: '8_DATABASE_INSERT_EXECUTION',
        file: FILE_NAME,
        line: 618,
        error: {
          name: 'ForeignKeyViolationError',
          code: errorCode,
          message: `The referenced shop (${shopId}) does not exist in the database foreign key table.`,
          dbError: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails,
            hint: errorHint
          }
        }
      });
    }

    // Check Null Constraint Violation
    if (errorCode === '23502' || errorMessage.toLowerCase().includes('null value in column')) {
      console.error(`[8/10] NOT_NULL_VIOLATION in ${FILE_NAME}: Required field was null`);
      return res.status(400).json({
        success: false,
        step: '8_DATABASE_INSERT_EXECUTION',
        file: FILE_NAME,
        line: 639,
        error: {
          name: 'NotNullConstraintViolationError',
          code: errorCode,
          message: `A required field in the products table was null: ${errorMessage}`,
          dbError: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails,
            hint: errorHint
          }
        }
      });
    }

    // Fallback Generic DB Insert Error
    return res.status(400).json({
      success: false,
      step: '8_DATABASE_INSERT_EXECUTION',
      file: FILE_NAME,
      line: 657,
      error: {
        name: 'DatabaseInsertError',
        code: errorCode,
        message: errorMessage || 'Failed to insert product record into database.',
        dbError: {
          code: errorCode,
          message: errorMessage,
          details: errorDetails,
          hint: errorHint
        }
      }
    });
  }

  // =========================================================================
  // 9. LOG DATABASE INSERT SUCCESS
  // =========================================================================
  console.log(`[9/10] DATABASE_INSERT_SUCCESS in ${FILE_NAME}:`, {
    productId: newProduct?.id,
    productName: newProduct?.name,
    shopId: newProduct?.shop_id,
    price: newProduct?.price,
    stock: newProduct?.stock,
    isPublished: newProduct?.is_published,
    status: newProduct?.status,
    createdAt: newProduct?.created_at
  });

  // Optional: Non-blocking Inventory variant upsert
  if (newProduct?.id && Array.isArray(insertPayload.sizes) && insertPayload.sizes.length > 0) {
    try {
      console.log(`[9/10] INVENTORY_SYNC_START in ${FILE_NAME}: Upserting ${insertPayload.sizes.length} inventory variants...`);
      for (const sizeObj of insertPayload.sizes) {
        if (sizeObj && sizeObj.size) {
          const stockQty = typeof sizeObj.quantity === 'number' 
            ? sizeObj.quantity 
            : (parseInt(sizeObj.quantity, 10) || 0);

          await supabase
            .from('inventory')
            .upsert({
              product_id: newProduct.id,
              size: String(sizeObj.size),
              stock_count: stockQty
            });
        }
      }
      console.log(`[9/10] INVENTORY_SYNC_SUCCESS in ${FILE_NAME}: Inventory variants updated.`);
    } catch (invErr: any) {
      console.warn(`[9/10] INVENTORY_SYNC_WARN in ${FILE_NAME}:`, invErr?.message);
    }
  }

  // =========================================================================
  // 10. LOG RESPONSE RETURN
  // =========================================================================
  const totalDurationMs = Date.now() - requestStartTime;
  console.log('================================================================');
  console.log(`[10/10] RESPONSE_RETURN: Returning HTTP 200 (duration: ${totalDurationMs}ms) for product ${newProduct?.id}`);
  console.log('================================================================');

  return res.status(200).json({
    success: true,
    step: '10_RESPONSE_RETURN',
    file: FILE_NAME,
    durationMs: totalDurationMs,
    product: newProduct,
    message: 'Product published successfully'
  });
};

// Register for both POST /create and POST /
router.post('/create', handleProductCreation);
router.post('/', handleProductCreation);

export default router;
