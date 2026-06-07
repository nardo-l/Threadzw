import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders 
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const {
      shop_id,
      payment_provider,
      payment_reference,
      payment_amount,
      billing_days,
      // NARDOPAY INTEGRATION POINT:
      // NardoPay webhook will send:
      // provider_payment_id
      // provider_session_id
      // signature (for verification)
    } = body

    if (!shop_id || !payment_provider) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields' 
        }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // NARDOPAY INTEGRATION POINT:
    // Verify webhook signature here:
    // const isValid = verifyNardoPaySignature(
    //   body,
    //   req.headers.get('x-nardopay-signature'),
    //   Deno.env.get('NARDOPAY_WEBHOOK_SECRET')
    // )
    // if (!isValid) return unauthorized

    // Get admin user if manual activation
    let adminId = null
    const authHeader = 
      req.headers.get('Authorization')
    
    if (authHeader) {
      const { data: { user } } = 
        await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        )
      if (user) adminId = user.id
    }

    // Activate subscription
    const { data, error } = await supabase
      .rpc('activate_subscription', {
        p_shop_id: shop_id,
        p_payment_provider: payment_provider,
        p_payment_reference: 
          payment_reference || null,
        p_payment_amount: 
          payment_amount || 7.00,
        p_billing_days: billing_days || 28,
        p_admin_id: adminId
      })

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
