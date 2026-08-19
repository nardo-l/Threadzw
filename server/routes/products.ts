import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

router.post('/create', async (req, res) => {
  console.log('[PRODUCT_CREATE] request received');
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[PRODUCT_CREATE ERROR] Missing authorization header');
      return res.status(401).json({ success: false, error: 'AUTHENTICATION_REQUIRED', message: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.log('[PRODUCT_CREATE ERROR] Invalid or expired session:', userError?.message);
      return res.status(401).json({ success: false, error: 'AUTHENTICATION_REQUIRED', message: 'Invalid or expired session' });
    }

    const profileId = user.id;
    console.log('[PRODUCT_CREATE] authenticated user:', profileId);

    const { shopId, productPayload } = req.body;

    if (!shopId || !productPayload) {
      console.log('[PRODUCT_CREATE ERROR] Missing shopId or productPayload');
      return res.status(400).json({ success: false, error: 'MISSING_PARAMETERS', message: 'Missing shopId or productPayload' });
    }

    // 1. Verify shop belongs to user (owner_id)
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, plan, plan_type, page_type, owner_id')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError || !shop) {
      console.log('[PRODUCT_CREATE ERROR] Shop not found or error:', shopError?.message);
      return res.status(404).json({ success: false, error: 'SHOP_NOT_FOUND', message: 'Shop not found' });
    }

    if (shop.owner_id !== profileId) {
      console.log('[PRODUCT_CREATE ERROR] Unauthorized shop access. Shop owner:', shop.owner_id, 'User:', profileId);
      return res.status(403).json({ success: false, error: 'UNAUTHORIZED_SHOP_ACCESS', message: 'Unauthorized shop access' });
    }
    console.log('[PRODUCT_CREATE] shop resolved:', shopId);

    // 2. Query profile subscription_status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', profileId)
      .maybeSingle();

    const isSubscriptionActive = profile?.subscription_status === 'active' || shop.plan === 'premium' || shop.plan === 'pro' || shop.plan_type === 'pro';

    // 3. Determine category and active product limits
    const pageType = (shop.page_type || 'clothing').toLowerCase();
    const isClothing = pageType === 'clothing' || pageType === 'storefront';
    
    // Clothing Free: 2 active products; Clothing Pro: Unlimited; General: Free only
    if (isClothing && !isSubscriptionActive) {
      const { count: activeCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('is_published', true);

      if (countError) {
        console.error('[PRODUCT_CREATE ERROR] Error counting active products:', countError);
      }

      const activeProductCount = activeCount || 0;
      console.log('[PRODUCT_CREATE] active clothing product count resolved:', activeProductCount);

      if (activeProductCount >= 2) {
        console.log('[PRODUCT_CREATE] limit check blocked (Clothing Free limit 2 reached):', activeProductCount);
        return res.status(403).json({
          success: false,
          error: 'PRODUCT_LIMIT_REACHED',
          upgradeRequired: true,
          limit: 2,
          count: activeProductCount,
          message: "You've reached the 2-product limit on the Free plan. Upgrade to Clothing Pro to add unlimited products."
        });
      }
    }
    console.log('[PRODUCT_CREATE] limit check passed (allowed)');

    // 5. Product validation & sanitization
    if (!productPayload.name || typeof productPayload.price !== 'number') {
      console.log('[PRODUCT_CREATE ERROR] Invalid product payload:', productPayload);
      return res.status(400).json({ success: false, error: 'INVALID_PRODUCT_DATA', message: 'Product name and valid price are required' });
    }
    console.log('[PRODUCT_CREATE] product validation passed');

    // 6. Database insert started
    console.log('[PRODUCT_CREATE] database insert started');
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        ...productPayload,
        shop_id: shopId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('[PRODUCT_CREATE ERROR] database insert failed:', insertError);
      return res.status(400).json({
        success: false,
        error: 'PRODUCT_INSERT_FAILED',
        message: insertError.message,
        details: insertError.details || insertError.hint
      });
    }
    console.log('[PRODUCT_CREATE] database insert succeeded:', newProduct?.id);

    // 7. Insert inventory items safely
    if (newProduct?.id && productPayload.sizes && Array.isArray(productPayload.sizes)) {
      try {
        for (const size of productPayload.sizes) {
          await supabase
            .from('inventory')
            .upsert({
              product_id: newProduct.id,
              size: size.size,
              stock_count: size.quantity
            });
        }
      } catch (invErr: any) {
        console.warn('[PRODUCT_CREATE WARNING] Inventory upsert non-fatal error:', invErr?.message);
      }
    }

    return res.json({ success: true, product: newProduct });
  } catch (err: any) {
    console.error('[PRODUCT_CREATE ERROR] Unhandled exception:', err);
    return res.status(500).json({
      success: false,
      error: 'PRODUCT_CREATE_FAILED',
      message: err.message || 'A server error occurred while creating the product.'
    });
  }
});

export default router;
