import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const {
      ecocashNumber,
      amount,
      plan,
      billingCycle,
      shopId,
      isFirstPeriod,
      userId,
    } = await req.json()

    const supabase = createServiceClient()
    const zuripayKey = Deno.env.get('ZURIPAY_SECRET_KEY')!
    const zuripayUrl = Deno.env.get('ZURIPAY_API_URL')!

    // Generate unique reference
    const reference = `TZW-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Create pending subscription record first
    const now = new Date()
    const periodEnd = new Date(now)
    if (billingCycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setDate(periodEnd.getDate() + 28)
    }

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        shop_id: shopId,
        owner_id: userId,
        plan,
        billing_cycle: billingCycle,
        status: 'active', // Will be confirmed by webhook
        amount_paid: amount,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        paynow_reference: reference,
        payment_method: 'ecocash',
        ecocash_number: ecocashNumber,
        payment_status: 'pending',
        is_first_month: isFirstPeriod,
      })
      .select()
      .single()

    if (subError) throw subError

    // Create payment record
    const { data: payment, error: payError } = await supabase
      .from('payments')
      .insert({
        subscription_id: subscription.id,
        shop_id: shopId,
        owner_id: userId,
        amount,
        payment_method: 'ecocash',
        ecocash_number: ecocashNumber,
        status: 'pending',
        plan,
        billing_cycle: billingCycle,
        is_first_period: isFirstPeriod,
        paynow_reference: reference,
      })
      .select()
      .single()

    if (payError) throw payError

    // Initiate EcoCash payment via ZuriPay
    const zuripayResponse = await fetch(`${zuripayUrl}/v1/payments/ecocash`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zuripayKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'USD',
        phone: ecocashNumber,
        reference: reference,
        description: `Thread ZW ${plan === 'solo' ? 'Solo Store' : 'Full Shop'} - ${billingCycle}`,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/zuripay-webhook`,
        metadata: {
          subscription_id: subscription.id,
          payment_id: payment.id,
          shop_id: shopId,
          user_id: userId,
          plan,
          billing_cycle: billingCycle,
        }
      }),
    })

    if (!zuripayResponse.ok) {
      const errBody = await zuripayResponse.text()
      console.error('ZuriPay error:', zuripayResponse.status, errBody)

      // Clean up pending records
      await supabase.from('payments').delete().eq('id', payment.id)
      await supabase.from('subscriptions').delete().eq('id', subscription.id)
      throw new Error(`ZuriPay error: ${zuripayResponse.status}`)
    }

    const zuripayData = await zuripayResponse.json()
    console.log('ZuriPay response:', zuripayData)

    // Update payment with ZuriPay transaction ID
    await supabase.from('payments').update({
      zuripay_transaction_id: zuripayData.id || zuripayData.transaction_id,
      zuripay_poll_url: zuripayData.poll_url,
      status: 'processing',
    }).eq('id', payment.id)

    await supabase.from('subscriptions').update({
      zuripay_transaction_id: zuripayData.id || zuripayData.transaction_id,
      zuripay_poll_url: zuripayData.poll_url,
      payment_status: 'processing',
    }).eq('id', subscription.id)

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: zuripayData.id || zuripayData.transaction_id,
        pollUrl: zuripayData.poll_url,
        paymentId: payment.id,
        subscriptionId: subscription.id,
        reference,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('initiate-ecocash-payment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
