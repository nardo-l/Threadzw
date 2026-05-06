import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { plan, billingCycle, shopId, userId } = await req.json()
    const supabase = createServiceClient()

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + 28)

    // Create active subscription (no payment needed)
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        shop_id: shopId,
        owner_id: userId,
        plan,
        billing_cycle: billingCycle,
        status: 'active',
        amount_paid: 0,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_method: 'free',
        payment_status: 'paid',
        is_first_month: true,
      })
      .select()
      .single()

    if (error) throw error

    // Set shop live
    await supabase.from('shops').update({
      is_live: true,
      subscription_id: subscription.id,
    }).eq('id', shopId)

    const { data: shop } = await supabase
      .from('shops').select('name').eq('id', shopId).single()

    // Notify owner
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'announcement',
      title: 'Your shop is live!',
      body: `${shop?.name || 'Your shop'} is now live on Thread ZW. Free until ${periodEnd.toLocaleDateString('en-ZW', { day: 'numeric', month: 'long' })}.`,
      data: { subscription_id: subscription.id },
      is_read: false,
    })

    return new Response(
      JSON.stringify({ success: true, subscription }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('activate-free-subscription error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
