import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase.ts'

serve(async (req: Request) => {
  try {
    const supabase = createServiceClient()
    const payload = await req.json()
    console.log('ZuriPay webhook received:', payload)

    const status = payload.status?.toLowerCase()
    const metadata = payload.metadata || {}
    const { subscription_id, payment_id, shop_id, user_id } = metadata

    if (!payment_id) {
      console.error('No payment_id in webhook metadata')
      return new Response('OK', { status: 200 })
    }

    // Update payment status
    await supabase.from('payments').update({
      status: status === 'paid' || status === 'success' ? 'paid' : 'failed',
      zuripay_transaction_id: payload.id || payload.transaction_id,
      webhook_received_at: new Date().toISOString(),
    }).eq('id', payment_id)

    if (status === 'paid' || status === 'success' || status === 'completed') {
      // Activate subscription
      await supabase.from('subscriptions').update({
        payment_status: 'paid',
      }).eq('id', subscription_id)

      // Set shop live
      await supabase.from('shops').update({
        is_live: true,
        subscription_id,
      }).eq('id', shop_id)

      // Notify owner
      const { data: shop } = await supabase
        .from('shops').select('name').eq('id', shop_id).single()

      await supabase.from('notifications').insert({
        user_id,
        type: 'announcement',
        title: 'EcoCash payment confirmed',
        body: `${shop?.name || 'Your shop'} is now live on Thread ZW!`,
        data: { payment_id, subscription_id },
        is_read: false,
      })
    }

    // ZuriPay expects 200 OK
    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('zuripay-webhook error:', error)
    return new Response('Error', { status: 500 })
  }
})
