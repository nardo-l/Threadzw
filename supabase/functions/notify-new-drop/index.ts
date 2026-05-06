import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { productId, shopId } = await req.json()

    if (!productId || !shopId) {
      throw new Error('Missing productId or shopId')
    }

    const supabase = createServiceClient()

    // 2. Fetch product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price, images')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      throw new Error(`Product not found: ${productError?.message}`)
    }

    // 3. Fetch shop details
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, handle')
      .eq('id', shopId)
      .single()

    if (shopError || !shop) {
      throw new Error(`Shop not found: ${shopError?.message}`)
    }

    // 4. Fetch all followers
    const { data: followers, error: followersError } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('shop_id', shopId)

    if (followersError) {
      throw new Error(`Error fetching followers: ${followersError.message}`)
    }

    // 5. If no followers exist
    if (!followers || followers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No followers', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Prepare and insert notifications
    const notifications = followers.map((follower) => ({
      user_id: follower.follower_id,
      type: 'new_drop',
      title: `${shop.name} just dropped something new`,
      body: `${product.name} — $${product.price}`,
      data: {
        product_id: productId,
        shop_id: shopId,
        shop_name: shop.name,
        shop_handle: shop.handle,
        product_name: product.name,
        product_price: product.price,
        product_image: product.images?.[0] || null,
      },
      is_read: false,
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      throw new Error(`Error inserting notifications: ${insertError.message}`)
    }

    // 7. Return success
    return new Response(
      JSON.stringify({ message: 'Notifications sent', count: notifications.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('notify-new-drop error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
