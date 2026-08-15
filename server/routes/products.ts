import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

router.post('/create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const profileId = user.id;
    const { shopId, productPayload } = req.body;

    if (!shopId || !productPayload) {
      return res.status(400).json({ error: 'Missing shopId or productPayload' });
    }

    // 1. Verify shop belongs to user (owner_id)
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, plan, plan_type, owner_id')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError || !shop || shop.owner_id !== profileId) {
      return res.status(403).json({ error: 'Unauthorized shop access' });
    }

    // 2. Query profile subscription_status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', profileId)
      .maybeSingle();

    const isSubscriptionActive = profile?.subscription_status === 'active' || shop.plan === 'premium' || shop.plan_type === 'premium';

    // 3. Query products count for shop_id
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);

    if (countError) {
      console.error('Error counting products:', countError);
    }

    const productCount = count || 0;

    // 4. Enforce product limit check server-side
    if (productCount >= 3 && !isSubscriptionActive) {
      return res.status(403).json({
        error: 'PRODUCT_LIMIT_REACHED',
        upgradeRequired: true,
        message: 'Free plan allows up to 3 products. Upgrade to Pro Plan to unlock unlimited products!'
      });
    }

    // 5. Insert product
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
      throw insertError;
    }

    // 6. Insert inventory items if provided
    if (newProduct?.id && productPayload.sizes && Array.isArray(productPayload.sizes)) {
      for (const size of productPayload.sizes) {
        await supabase
          .from('inventory')
          .upsert({
            product_id: newProduct.id,
            size: size.size,
            stock_count: size.quantity
          });
      }
    }

    // 7. Increment shop product count via RPC
    await supabase.rpc('increment_shop_product_count', { shop_id: shopId });

    return res.json({ success: true, product: newProduct });
  } catch (err: any) {
    console.error('Error in /api/products/create:', err);
    return res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

export default router;
