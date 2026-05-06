import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { transactionId, pollUrl, paymentId } = await req.json()

    const supabase = createServiceClient()
    const zuripayKey = Deno.env.get('ZURIPAY_SECRET_KEY')!
    const zuripayUrl = Deno.env.get('ZURIPAY_API_URL')!

    // Poll ZuriPay for payment status
    const url = pollUrl || `${zuripayUrl}/v1/payments/${transactionId}`
    const pollResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${zuripayKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!pollResponse.ok) {
      throw new Error(`Poll failed: ${pollResponse.status}`)
    }

    const pollData = await pollResponse.json()
    console.log('Poll response:', pollData)

    // Map ZuriPay status to our status
    const status = pollData.status?.toLowerCase()
    let ourStatus = 'processing'

    if (status === 'paid' || status === 'success' || status === 'completed') {
      ourStatus = 'paid'
    } else if (status === 'failed' || status === 'cancelled' || status === 'rejected') {
      ourStatus = 'failed'
    }

    // Update payment record
    await supabase.from('payments').update({
      status: ourStatus,
      ...(ourStatus === 'paid' && { webhook_received_at: new Date().toISOString() }),
    }).eq('id', paymentId)

    // If paid -- activate subscription and shop
    if (ourStatus === 'paid') {
      // Get payment details
      const { data: payment } = await supabase
        .from('payments')
        .select('subscription_id, shop_id, owner_id')
        .eq('id', paymentId)
        .single()

      if (payment) {
        // Activate subscription
        await supabase.from('subscriptions').update({
          payment_status: 'paid',
        }).eq('id', payment.subscription_id)

        // Set shop live
        await supabase.from('shops').update({
          is_live: true,
          subscription_id: payment.subscription_id,
        }).eq('id', payment.shop_id)

        // Fetch shop for notification
        const { data: shop } = await supabase
          .from('shops')
          .select('name')
          .eq('id', payment.shop_id)
          .single()

        // Notify owner
        await supabase.from('notifications').insert({
          user_id: payment.owner_id,
          type: 'announcement',
          title: 'Payment confirmed via EcoCash',
          body: `${shop?.name || 'Your shop'} is now live on Thread ZW!`,
          data: {
            payment_id: paymentId,
            subscription_id: payment.subscription_id,
          },
          is_read: false,
        })

        // Get subscription details for response
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('id', payment.subscription_id)
          .single()

        return new Response(
          JSON.stringify({ status: 'paid', subscription: sub }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ status: ourStatus, raw: pollData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('poll-ecocash-payment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
