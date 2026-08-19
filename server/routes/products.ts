import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/products/create
 * Creates a new product while strictly validating merchant subscription plan quotas.
 */
router.post('/create', async (req, res) => {
  console.log('[PRODUCT_CREATE] Incoming product creation request received');
  try {
    // 1. Authorization validation
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.warn('[PRODUCT_CREATE_AUTH_ERROR] Missing authorization header');
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication header is required to create products.'
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      console.warn('[PRODUCT_CREATE_AUTH_ERROR] Empty bearer token supplied');
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Invalid authorization token format.'
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.warn('[PRODUCT_CREATE_AUTH_ERROR] Invalid or expired session token:', userError?.message);
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Your session has expired. Please sign in again.'
      });
    }

    const profileId = user.id;
    console.log(`[PRODUCT_CREATE] Authenticated user profile: ${profileId}`);

    // 2. Request payload validation
    const { shopId, productPayload } = req.body || {};

    if (!shopId || typeof shopId !== 'string') {
      console.warn('[PRODUCT_CREATE_VALIDATION_ERROR] Missing or invalid shopId parameter');
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMETERS',
        message: 'A valid shopId is required to create a product.'
      });
    }

    if (!productPayload || typeof productPayload !== 'object') {
      console.warn('[PRODUCT_CREATE_VALIDATION_ERROR] Missing or invalid productPayload parameter');
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMETERS',
        message: 'Product payload details are required.'
      });
    }

    // 3. Verify shop existence and ownership
    console.log(`[PRODUCT_CREATE] Verifying shop ownership for shopId: ${shopId}`);
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, plan, plan_type, page_type, owner_id, subscription_status')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError) {
      console.error(`[PRODUCT_CREATE_ERROR] Database error during shop lookup: ${shopError.message}`);
      return res.status(404).json({
        success: false,
        error: 'SHOP_NOT_FOUND',
        message: 'An error occurred while finding your shop details.'
      });
    }

    if (!shop) {
      console.warn(`[PRODUCT_CREATE_ERROR] Shop not found in database: ${shopId}`);
      return res.status(404).json({
        success: false,
        error: 'SHOP_NOT_FOUND',
        message: 'Shop not found. Please complete your shop setup first.'
      });
    }

    if (shop.owner_id !== profileId) {
      console.warn(`[PRODUCT_CREATE_FORBIDDEN] Ownership mismatch: shop.owner_id=${shop.owner_id}, profileId=${profileId}`);
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED_SHOP_ACCESS',
        message: 'You do not have permission to add products to this shop.'
      });
    }

    // 4. Resolve Authoritative Subscription & Plan Status
    const rawShopPlan = (shop.plan || shop.plan_type || 'free').toLowerCase().trim();
    const isShopPro = rawShopPlan === 'pro' || rawShopPlan === 'premium' || shop.subscription_status === 'active';

    // Also check profiles subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, active_until')
      .eq('id', profileId)
      .maybeSingle();

    const isProfilePro = profile?.subscription_status === 'active';

    // Also check subscriptions table for active pro plan
    const { data: activeSub } = await supabase
      .from('subscriptions')
      .select('id, status, plan, current_period_end')
      .eq('shop_id', shopId)
      .in('status', ['active', 'grace_period'])
      .maybeSingle();

    const isSubPro = !!activeSub && (activeSub.status === 'active' || activeSub.status === 'grace_period');

    const isProPlan = isShopPro || isProfilePro || isSubPro;

    const pageType = (shop.page_type || 'clothing').toLowerCase().trim();
    const isClothingCategory = pageType === 'clothing' || pageType === 'storefront' || pageType === 'apparel' || pageType === 'fashion';

    console.log(`[PRODUCT_VALIDATION] Shop: ${shop.id} (${shop.name || 'Untitled'}), Category: ${pageType}, IsPro: ${isProPlan} (ShopPlan: ${rawShopPlan}, ProfileSub: ${profile?.subscription_status}, SubTable: ${activeSub?.status || 'none'})`);

    // 5. Product Quota Enforcement Logic
    // Clothing Free Plan: Maximum 2 active products
    // Clothing Pro Plan: Unlimited products
    if (isClothingCategory && !isProPlan) {
      const FREE_PRODUCT_LIMIT = 2;

      console.log(`[PRODUCT_VALIDATION] Counting active products for Free clothing shop ${shopId}...`);
      
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
        console.error('[PRODUCT_VALIDATION_ERROR] Error querying active product count:', countError.message);
      }

      const currentActiveCount = typeof activeCount === 'number' ? activeCount : 0;
      console.log(`[PRODUCT_VALIDATION] Free Clothing Shop: ${currentActiveCount}/${FREE_PRODUCT_LIMIT} active products`);

      if (currentActiveCount >= FREE_PRODUCT_LIMIT) {
        console.warn(`[PRODUCT_VALIDATION_BLOCKED] Product creation BLOCKED. Shop ${shopId} reached Free limit (${currentActiveCount}/${FREE_PRODUCT_LIMIT}). Returning HTTP 403.`);
        return res.status(403).json({
          success: false,
          error: 'PRODUCT_LIMIT_REACHED',
          code: 'PRODUCT_LIMIT_REACHED',
          upgradeRequired: true,
          limit: FREE_PRODUCT_LIMIT,
          count: currentActiveCount,
          message: 'You have reached the maximum number of products allowed on your current plan. Upgrade to Pro to add more products.'
        });
      }

      console.log(`[PRODUCT_VALIDATION_PASSED] Free quota check passed (${currentActiveCount}/${FREE_PRODUCT_LIMIT} used). Proceeding with insertion.`);
    } else if (isProPlan) {
      console.log(`[PRODUCT_VALIDATION_PASSED] Pro subscription active for shop ${shopId}. Unlimited product publishing allowed.`);
    } else {
      console.log(`[PRODUCT_VALIDATION_PASSED] Shop category ${pageType} standard publishing allowed.`);
    }

    // 6. Product Data Validation & Sanitization
    const trimmedName = typeof productPayload.name === 'string' ? productPayload.name.trim() : '';
    const numericPrice = typeof productPayload.price === 'number' ? productPayload.price : parseFloat(productPayload.price);

    if (!trimmedName || trimmedName.length < 2) {
      console.warn('[PRODUCT_CREATE_VALIDATION_ERROR] Invalid product name supplied:', trimmedName);
      return res.status(400).json({
        success: false,
        error: 'INVALID_PRODUCT_DATA',
        message: 'Product name must be at least 2 characters long.'
      });
    }

    if (isNaN(numericPrice) || numericPrice < 0) {
      console.warn('[PRODUCT_CREATE_VALIDATION_ERROR] Invalid product price supplied:', productPayload.price);
      return res.status(400).json({
        success: false,
        error: 'INVALID_PRODUCT_DATA',
        message: 'A valid numeric product price is required.'
      });
    }

    // 7. Database Insert Execution
    console.log(`[PRODUCT_CREATE] Executing database insert for product "${trimmedName}" in shop ${shopId}...`);
    
    const insertPayload = {
      ...productPayload,
      name: trimmedName,
      price: numericPrice,
      shop_id: shopId,
      is_published: productPayload.is_published !== undefined ? Boolean(productPayload.is_published) : true,
      status: productPayload.status || 'active',
      created_at: new Date().toISOString()
    };

    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error('[PRODUCT_CREATE_DB_ERROR] Database insertion failed:', insertError);

      // Gracefully catch PostgreSQL trigger quota exceptions (check_violation or custom error message)
      const isQuotaViolation = 
        insertError.code === '23514' || 
        insertError.message?.toLowerCase().includes('limit reached') ||
        insertError.message?.toLowerCase().includes('plan limit') ||
        insertError.message?.toLowerCase().includes('quota') ||
        insertError.details?.toLowerCase().includes('limit reached');

      if (isQuotaViolation) {
        console.warn(`[PRODUCT_CREATE_TRIGGER_INTERCEPT] Database quota trigger intercepted. Returning structured HTTP 403.`);
        return res.status(403).json({
          success: false,
          error: 'PRODUCT_LIMIT_REACHED',
          code: 'PRODUCT_LIMIT_REACHED',
          upgradeRequired: true,
          limit: 2,
          message: 'You have reached the maximum number of products allowed on your current plan. Upgrade to Pro to add more products.'
        });
      }

      return res.status(400).json({
        success: false,
        error: 'PRODUCT_INSERT_FAILED',
        message: insertError.message || 'Failed to insert product record into database.',
        details: insertError.details || insertError.hint
      });
    }

    console.log(`[PRODUCT_CREATE_SUCCESS] Successfully created product ${newProduct?.id} ("${newProduct?.name}") for shop ${shopId}`);

    // 8. Safely Synchronize Inventory Variants (non-blocking)
    if (newProduct?.id && productPayload.sizes && Array.isArray(productPayload.sizes) && productPayload.sizes.length > 0) {
      try {
        console.log(`[PRODUCT_CREATE] Synchronizing ${productPayload.sizes.length} inventory variants...`);
        for (const size of productPayload.sizes) {
          if (size && size.size) {
            await supabase
              .from('inventory')
              .upsert({
                product_id: newProduct.id,
                size: String(size.size),
                stock_count: typeof size.quantity === 'number' ? size.quantity : (parseInt(size.quantity, 10) || 0)
              });
          }
        }
      } catch (invErr: any) {
        console.warn('[PRODUCT_CREATE_WARNING] Inventory variant upsert non-fatal note:', invErr?.message);
      }
    }

    return res.status(200).json({
      success: true,
      product: newProduct,
      message: 'Product published successfully'
    });

  } catch (err: any) {
    console.error('[PRODUCT_CREATE_UNCAUGHT_EXCEPTION] Unhandled error during product creation:', err);
    return res.status(500).json({
      success: false,
      error: 'PRODUCT_CREATE_FAILED',
      message: err?.message || 'An unexpected server error occurred while publishing the product.'
    });
  }
});

export default router;
