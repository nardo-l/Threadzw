import { Router } from 'express';
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
 * POST /api/products/create
 * Creates a new product with comprehensive step-by-step validation, logging, and error tracking.
 */
router.post('/create', async (req, res) => {
  const requestStartTime = Date.now();
  console.log('================================================================');
  console.log(`[PRODUCT_CREATE_FLOW_START] Incoming request at ${new Date().toISOString()}`);
  console.log('================================================================');

  try {
    const supabase = getSupabase();

    // =========================================================================
    // STEP 1: AUTHENTICATION
    // =========================================================================
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.warn('[STEP 1: AUTH_FAILED] Missing Authorization header in request');
      return res.status(401).json({
        success: false,
        step: 'AUTHENTICATION',
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authorization header is missing. Please sign in.'
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      console.warn('[STEP 1: AUTH_FAILED] Bearer token is empty');
      return res.status(401).json({
        success: false,
        step: 'AUTHENTICATION',
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Bearer authentication token is empty.'
      });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.warn('[STEP 1: AUTH_FAILED] Supabase token verification failed:', {
        errorMessage: userError?.message,
        errorStatus: userError?.status,
        name: userError?.name
      });
      return res.status(401).json({
        success: false,
        step: 'AUTHENTICATION',
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Your session has expired or is invalid. Please sign in again.',
        details: userError?.message
      });
    }

    const authenticatedUser = userData.user;
    const profileId = authenticatedUser.id;
    const userEmail = authenticatedUser.email || 'N/A';

    console.log('[STEP 1: AUTHENTICATION_SUCCESS]', {
      profileId,
      userEmail,
      aud: authenticatedUser.aud,
      role: authenticatedUser.role
    });

    // =========================================================================
    // STEP 2: REQUEST PAYLOAD & PARAMETER INSPECTION
    // =========================================================================
    const { shopId, productPayload } = req.body || {};

    console.log('[STEP 2: PAYLOAD_INSPECTION]', {
      receivedShopId: shopId,
      hasProductPayload: !!productPayload,
      payloadType: typeof productPayload,
      productName: productPayload?.name,
      productPrice: productPayload?.price,
      productCategory: productPayload?.category
    });

    // Check: shopId undefined or null
    if (!shopId || typeof shopId !== 'string' || shopId.trim() === '') {
      console.warn('[STEP 2: VALIDATION_FAILED] shopId is undefined, null, or empty string:', shopId);
      return res.status(400).json({
        success: false,
        step: 'PAYLOAD_VALIDATION',
        error: 'INVALID_SHOP_ID',
        message: 'shopId is required and must be a valid non-empty string.',
        receivedShopId: shopId ?? null
      });
    }

    // Check: mock or local shop ID
    if (shopId.startsWith('local-shop-') || shopId === '55555555-5555-5555-5555-555555555555') {
      console.warn('[STEP 2: VALIDATION_FAILED] Mock or local shopId provided:', shopId);
      return res.status(400).json({
        success: false,
        step: 'PAYLOAD_VALIDATION',
        error: 'INVALID_SHOP_ID',
        message: 'Cannot create products under a temporary or local shop. Please complete your store setup first.',
        receivedShopId: shopId
      });
    }

    // Check: productPayload missing or malformed
    if (!productPayload || typeof productPayload !== 'object' || Array.isArray(productPayload)) {
      console.warn('[STEP 2: VALIDATION_FAILED] productPayload is missing or not an object');
      return res.status(400).json({
        success: false,
        step: 'PAYLOAD_VALIDATION',
        error: 'INVALID_PAYLOAD',
        message: 'productPayload must be a valid object containing product attributes.'
      });
    }

    // =========================================================================
    // STEP 3: SHOP LOOKUP & PROFILE OWNERSHIP INSPECTION
    // =========================================================================
    console.log(`[STEP 3: SHOP_LOOKUP_START] Querying shop by ID: ${shopId}...`);
    
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, slug, plan, plan_type, page_type, owner_id, subscription_status, payment_status')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError) {
      console.error('[STEP 3: SHOP_LOOKUP_DB_ERROR] Database query error finding shop:', {
        code: shopError.code,
        message: shopError.message,
        details: shopError.details,
        hint: shopError.hint
      });
      return res.status(500).json({
        success: false,
        step: 'SHOP_LOOKUP',
        error: 'SHOP_LOOKUP_FAILED',
        message: 'A database error occurred while querying your shop details.',
        dbError: {
          code: shopError.code,
          message: shopError.message,
          details: shopError.details,
          hint: shopError.hint
        }
      });
    }

    // Inspect: shop == null
    if (!shop) {
      console.warn(`[STEP 3: SHOP_LOOKUP_FAILED] shop is null for shopId: ${shopId}`);
      return res.status(404).json({
        success: false,
        step: 'SHOP_LOOKUP',
        error: 'SHOP_NOT_FOUND',
        message: `No shop found matching ID "${shopId}". Please verify your store configuration.`,
        shopId
      });
    }

    // Inspect: profile ownership mismatch
    if (shop.owner_id !== profileId) {
      console.warn('[STEP 3: OWNERSHIP_MISMATCH_FORBIDDEN]', {
        shopId: shop.id,
        shopOwnerId: shop.owner_id,
        authenticatedProfileId: profileId
      });
      return res.status(403).json({
        success: false,
        step: 'SHOP_LOOKUP',
        error: 'UNAUTHORIZED_SHOP_ACCESS',
        message: 'You do not have permission to publish products to this shop because you are not the registered owner.',
        shopId: shop.id,
        shopOwnerId: shop.owner_id,
        requesterProfileId: profileId
      });
    }

    console.log('[STEP 3: SHOP_LOOKUP_SUCCESS]', {
      shopId: shop.id,
      shopName: shop.name,
      shopSlug: shop.slug,
      shopOwnerId: shop.owner_id,
      shopPageType: shop.page_type,
      shopPlan: shop.plan,
      shopPlanType: shop.plan_type,
      shopSubscriptionStatus: shop.subscription_status
    });

    // =========================================================================
    // STEP 4: PLAN & SUBSCRIPTION RESOLUTION
    // =========================================================================
    console.log('[STEP 4: PLAN_RESOLUTION_START] Resolving authoritative plan status...');

    const rawShopPlan = (shop.plan || shop.plan_type || 'free').toLowerCase().trim();
    const isShopMarkedPro = rawShopPlan === 'pro' || rawShopPlan === 'premium' || shop.subscription_status === 'active';

    // Check profiles subscription status
    const { data: profileRecord, error: profileErr } = await supabase
      .from('profiles')
      .select('id, subscription_status, active_until')
      .eq('id', profileId)
      .maybeSingle();

    if (profileErr) {
      console.warn('[STEP 4: PROFILE_SUB_CHECK_WARNING] Could not check profiles table:', profileErr.message);
    }

    const isProfileMarkedPro = profileRecord?.subscription_status === 'active';

    // Check subscriptions table for active or grace period
    const { data: activeSubRecord, error: subErr } = await supabase
      .from('subscriptions')
      .select('id, status, plan, current_period_end, category')
      .eq('shop_id', shopId)
      .in('status', ['active', 'grace_period'])
      .maybeSingle();

    if (subErr) {
      console.warn('[STEP 4: SUBSCRIPTION_CHECK_WARNING] Could not check subscriptions table:', subErr.message);
    }

    const isSubscriptionTablePro = !!activeSubRecord && (activeSubRecord.status === 'active' || activeSubRecord.status === 'grace_period');

    const isProPlan = isShopMarkedPro || isProfileMarkedPro || isSubscriptionTablePro;

    const pageType = (shop.page_type || 'clothing').toLowerCase().trim();
    const isClothingCategory = pageType === 'clothing' || pageType === 'storefront' || pageType === 'apparel' || pageType === 'fashion';

    console.log('[STEP 4: PLAN_RESOLUTION_SUCCESS]', {
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

    // =========================================================================
    // STEP 5: PRODUCT COUNT & QUOTA VALIDATION
    // =========================================================================
    console.log('[STEP 5: PRODUCT_COUNT_VALIDATION_START] Validating product quota limits...');

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
        console.error('[STEP 5: COUNT_QUERY_ERROR]', {
          code: countError.code,
          message: countError.message,
          details: countError.details
        });
      }

      const currentActiveCount = typeof activeCount === 'number' ? activeCount : 0;

      console.log('[STEP 5: PRODUCT_COUNT_VALIDATION_RESULT]', {
        category: 'Clothing (Free Plan)',
        currentActiveCount,
        limit: FREE_PRODUCT_LIMIT,
        canAdd: currentActiveCount < FREE_PRODUCT_LIMIT
      });

      if (currentActiveCount >= FREE_PRODUCT_LIMIT) {
        console.warn(`[STEP 5: QUOTA_LIMIT_EXCEEDED] Shop ${shopId} reached 2-product limit. Returning HTTP 403.`);
        return res.status(403).json({
          success: false,
          step: 'PRODUCT_COUNT_VALIDATION',
          error: 'PRODUCT_LIMIT_REACHED',
          code: 'PRODUCT_LIMIT_REACHED',
          upgradeRequired: true,
          limit: FREE_PRODUCT_LIMIT,
          count: currentActiveCount,
          message: 'You have reached the maximum number of products allowed on your current plan. Upgrade to Pro to add more products.'
        });
      }

      console.log(`[STEP 5: QUOTA_PASSED] Free quota check passed (${currentActiveCount}/${FREE_PRODUCT_LIMIT} active products).`);
    } else if (isProPlan) {
      console.log('[STEP 5: QUOTA_PASSED] Pro merchant detected. Unlimited products allowed.');
    } else {
      console.log(`[STEP 5: QUOTA_PASSED] Category ${pageType} standard publishing allowed.`);
    }

    // =========================================================================
    // STEP 6: FIELD VALIDATION & SANITIZATION
    // =========================================================================
    console.log('[STEP 6: FIELD_VALIDATION_START] Inspecting and sanitizing insert fields...');

    const rawName = productPayload.name;
    const rawPrice = productPayload.price;

    // Inspect: null constraint or invalid field values
    if (typeof rawName !== 'string' || rawName.trim().length === 0) {
      console.warn('[STEP 6: INVALID_FIELD] Invalid product name:', rawName);
      return res.status(400).json({
        success: false,
        step: 'FIELD_VALIDATION',
        error: 'INVALID_PRODUCT_DATA',
        message: 'Product name is required and cannot be empty.',
        receivedName: rawName
      });
    }

    const trimmedName = rawName.trim();
    if (trimmedName.length < 2) {
      console.warn('[STEP 6: INVALID_FIELD] Product name too short:', trimmedName);
      return res.status(400).json({
        success: false,
        step: 'FIELD_VALIDATION',
        error: 'INVALID_PRODUCT_DATA',
        message: 'Product name must be at least 2 characters long.',
        receivedName: trimmedName
      });
    }

    const numericPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice);
    if (isNaN(numericPrice) || numericPrice < 0) {
      console.warn('[STEP 6: INVALID_FIELD] Invalid price value:', rawPrice);
      return res.status(400).json({
        success: false,
        step: 'FIELD_VALIDATION',
        error: 'INVALID_PRODUCT_DATA',
        message: 'Product price must be a valid positive number.',
        receivedPrice: rawPrice
      });
    }

    // Prepare clean array values
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

    // Assemble final sanitized insert payload
    const insertPayload = {
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

    console.log('[STEP 6: SANITIZED_INSERT_PAYLOAD_PREPARED]');
    console.log(JSON.stringify(insertPayload, null, 2));

    // =========================================================================
    // STEP 7: PRODUCT DATABASE INSERT EXECUTION (WITH DETAILED ERROR INSPECTION)
    // =========================================================================
    console.log(`[STEP 7: DB_INSERT_START] Inserting product record for shop: ${shopId}...`);

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
      console.error('[STEP 7: DB_INSERT_EXCEPTION_THROWN] Supabase client threw an unexpected exception:', insertException);
      return res.status(500).json({
        success: false,
        step: 'PRODUCT_INSERT',
        error: 'INSERT_EXCEPTION',
        message: 'An unexpected exception occurred during database insertion.',
        exception: {
          name: insertException?.name,
          message: insertException?.message,
          stack: insertException?.stack
        }
      });
    }

    if (insertError) {
      console.error('[STEP 7: DB_INSERT_FAILED] Database returned error object:');
      console.error(JSON.stringify(insertError, null, 2));

      const errorCode = insertError.code || 'UNKNOWN';
      const errorMessage = insertError.message || '';
      const errorDetails = insertError.details || '';
      const errorHint = insertError.hint || '';

      // Check 1: PostgreSQL Trigger Quota Check Violation
      const isQuotaViolation = 
        errorCode === '23514' || 
        errorMessage.toLowerCase().includes('limit reached') ||
        errorMessage.toLowerCase().includes('plan limit') ||
        errorMessage.toLowerCase().includes('quota') ||
        errorDetails.toLowerCase().includes('limit reached');

      if (isQuotaViolation) {
        console.warn('[STEP 7: TRIGGER_QUOTA_INTERCEPTED] Intercepted trigger check violation. Returning HTTP 403.');
        return res.status(403).json({
          success: false,
          step: 'PRODUCT_INSERT',
          error: 'PRODUCT_LIMIT_REACHED',
          code: 'PRODUCT_LIMIT_REACHED',
          upgradeRequired: true,
          limit: 2,
          message: 'You have reached the maximum number of products allowed on your current plan. Upgrade to Pro to add more products.',
          dbError: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails,
            hint: errorHint
          }
        });
      }

      // Check 2: Row Level Security (RLS) Policy Violation
      if (errorCode === '42501' || errorMessage.toLowerCase().includes('row-level security') || errorMessage.toLowerCase().includes('permission denied')) {
        console.error('[STEP 7: RLS_VIOLATION] Row Level Security policy blocked product insertion:', insertError);
        return res.status(403).json({
          success: false,
          step: 'PRODUCT_INSERT',
          error: 'RLS_POLICY_VIOLATION',
          message: 'Database permission denied (Row-Level Security policy). Please check database write permissions for products.',
          dbError: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails,
            hint: errorHint
          }
        });
      }

      // Check 3: Foreign Key Violation (e.g. invalid shop_id)
      if (errorCode === '23503' || errorMessage.toLowerCase().includes('foreign key')) {
        console.error('[STEP 7: FOREIGN_KEY_VIOLATION] Foreign key constraint violated:', insertError);
        return res.status(400).json({
          success: false,
          step: 'PRODUCT_INSERT',
          error: 'FOREIGN_KEY_VIOLATION',
          message: `The referenced shop (${shopId}) does not exist in the database foreign key table.`,
          dbError: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails,
            hint: errorHint
          }
        });
      }

      // Check 4: Null Constraint Violation
      if (errorCode === '23502' || errorMessage.toLowerCase().includes('null value in column')) {
        console.error('[STEP 7: NOT_NULL_VIOLATION] Null constraint violated:', insertError);
        return res.status(400).json({
          success: false,
          step: 'PRODUCT_INSERT',
          error: 'NOT_NULL_CONSTRAINT_VIOLATION',
          message: `A required field in the products table was null: ${errorMessage}`,
          dbError: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails,
            hint: errorHint
          }
        });
      }

      // Fallback Database Insert Error (Structured, never crash)
      return res.status(400).json({
        success: false,
        step: 'PRODUCT_INSERT',
        error: 'PRODUCT_INSERT_FAILED',
        message: errorMessage || 'Failed to insert product record into database.',
        dbError: {
          code: errorCode,
          message: errorMessage,
          details: errorDetails,
          hint: errorHint
        }
      });
    }

    console.log('[STEP 7: PRODUCT_INSERT_SUCCESS]', {
      productId: newProduct?.id,
      productName: newProduct?.name,
      shopId: newProduct?.shop_id,
      price: newProduct?.price,
      stock: newProduct?.stock,
      isPublished: newProduct?.is_published,
      durationMs: Date.now() - requestStartTime
    });

    // =========================================================================
    // STEP 8: INVENTORY VARIANTS SYNCHRONIZATION (SAFE & NON-FATAL)
    // =========================================================================
    if (newProduct?.id && Array.isArray(sizesArray) && sizesArray.length > 0) {
      console.log(`[STEP 8: INVENTORY_SYNC_START] Upserting ${sizesArray.length} inventory variants for product ${newProduct.id}...`);
      try {
        for (const sizeObj of sizesArray) {
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
        console.log('[STEP 8: INVENTORY_SYNC_SUCCESS] Inventory variants updated successfully.');
      } catch (invErr: any) {
        console.warn('[STEP 8: INVENTORY_SYNC_WARNING] Inventory variant upsert non-fatal note:', invErr?.message);
      }
    }

    console.log('================================================================');
    console.log(`[PRODUCT_CREATE_FLOW_COMPLETE] Total duration: ${Date.now() - requestStartTime}ms`);
    console.log('================================================================');

    return res.status(200).json({
      success: true,
      step: 'COMPLETED',
      product: newProduct,
      message: 'Product published successfully'
    });

  } catch (uncaughtErr: any) {
    console.error('[UNCAUGHT_TOP_LEVEL_EXCEPTION] Fatal error caught in /api/products/create handler:', uncaughtErr);
    return res.status(500).json({
      success: false,
      step: 'UNHANDLED_EXCEPTION',
      error: 'SERVER_INTERNAL_ERROR',
      message: uncaughtErr?.message || 'An unexpected internal error occurred on the server.',
      exception: {
        name: uncaughtErr?.name,
        message: uncaughtErr?.message,
        stack: uncaughtErr?.stack
      }
    });
  }
});

export default router;
