import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Dedicated Supabase client for create-v2
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * POST /api/products/create-v2
 * Clean, lightweight product insertion endpoint.
 */
router.post('/create-v2', async (req: Request, res: Response) => {
  console.log('[CREATE_V2] Request received for /api/products/create-v2');
  try {
    // 1. Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[CREATE_V2_AUTH_ERROR] Missing or invalid Authorization header');
      return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn('[CREATE_V2_AUTH_ERROR] Auth token verification failed:', authError?.message);
      return res.status(401).json({ success: false, error: 'Unauthorized: Session invalid or expired', details: authError?.message });
    }

    const userId = user.id;
    console.log(`[CREATE_V2] Authenticated user ID: ${userId}`);

    // 2. Body Payload
    const { shopId, productPayload } = req.body || {};
    if (!shopId || !productPayload) {
      console.warn('[CREATE_V2_VALIDATION_ERROR] Missing shopId or productPayload');
      return res.status(400).json({ success: false, error: 'shopId and productPayload are required' });
    }

    // 3. Verify Shop Ownership
    console.log(`[CREATE_V2] Verifying shop ownership for shopId: ${shopId}...`);
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, owner_id, name')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError) {
      console.error('[CREATE_V2_DB_ERROR] Shop lookup query failed:', shopError);
      return res.status(500).json({ success: false, error: 'Database error during shop verification', details: shopError });
    }

    if (!shop) {
      console.warn(`[CREATE_V2_NOT_FOUND] Shop ${shopId} not found in database`);
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    if (shop.owner_id !== userId) {
      console.warn(`[CREATE_V2_FORBIDDEN] Ownership mismatch. Shop owner: ${shop.owner_id}, Requester: ${userId}`);
      return res.status(403).json({ success: false, error: 'Forbidden: You do not own this shop' });
    }

    console.log(`[CREATE_V2] Shop verified: "${shop.name}" (${shop.id}) owned by ${userId}`);

    // 4. Insert Product into Database
    const insertData: any = {
      shop_id: shopId,
      name: productPayload.name || 'Untitled Product',
      price: typeof productPayload.price === 'number' ? productPayload.price : (parseFloat(productPayload.price) || 0),
      category: productPayload.category || null,
      description: productPayload.description || null,
      images: Array.isArray(productPayload.images) ? productPayload.images : [],
      image_url: productPayload.image_url || (Array.isArray(productPayload.images) ? productPayload.images[0] : null),
      sizes: Array.isArray(productPayload.sizes) ? productPayload.sizes : [],
      colours: Array.isArray(productPayload.colours) ? productPayload.colours : (Array.isArray(productPayload.colors) ? productPayload.colors : []),
      stock: typeof productPayload.stock === 'number' ? productPayload.stock : (parseInt(productPayload.stock, 10) || 0),
      total_stock: typeof productPayload.total_stock === 'number' ? productPayload.total_stock : (parseInt(productPayload.total_stock, 10) || 0),
      is_published: productPayload.is_published !== undefined ? Boolean(productPayload.is_published) : true,
      status: productPayload.status || 'active',
      is_featured: Boolean(productPayload.is_featured),
      created_at: new Date().toISOString()
    };

    console.log('[CREATE_V2] Inserting product record into products table...');
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[CREATE_V2_DB_ERROR] Failed to insert product:', insertError);
      return res.status(400).json({ success: false, error: 'Database insert failed', dbError: insertError });
    }

    console.log(`[CREATE_V2_SUCCESS] Product created successfully with ID: ${newProduct?.id}`);

    // 5. Non-blocking inventory synchronization
    if (newProduct?.id && Array.isArray(insertData.sizes) && insertData.sizes.length > 0) {
      try {
        for (const s of insertData.sizes) {
          if (s && s.size) {
            await supabase.from('inventory').upsert({
              product_id: newProduct.id,
              size: String(s.size),
              stock_count: typeof s.quantity === 'number' ? s.quantity : (parseInt(s.quantity, 10) || 0)
            });
          }
        }
      } catch (invErr) {
        console.warn('[CREATE_V2_INVENTORY_WARN] Non-fatal inventory upsert issue:', invErr);
      }
    }

    return res.status(200).json({
      success: true,
      version: 'v2',
      product: newProduct,
      message: 'Product created successfully via v2 endpoint'
    });

  } catch (err: any) {
    console.error('[CREATE_V2_UNCAUGHT_ERROR] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error in create-v2',
      stack: err?.stack
    });
  }
});

export default router;
