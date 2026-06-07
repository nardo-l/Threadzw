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

    // Verify admin
    const authHeader = 
      req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const { data: { user } } = 
      await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      )

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      )
    }

    const body = await req.json()
    const { action, shop_id, reason } = body

    let result

    switch (action) {
      case 'activate':
        result = await supabase.rpc(
          'activate_subscription',
          {
            p_shop_id: shop_id,
            p_payment_provider: 'manual',
            p_payment_reference: 
              body.payment_reference,
            p_payment_amount: 7.00,
            p_billing_days: 28,
            p_admin_id: user.id
          }
        )
        break

      case 'suspend':
        result = await supabase.rpc(
          'suspend_shop',
          {
            p_shop_id: shop_id,
            p_admin_id: user.id,
            p_reason: reason
          }
        )
        break

      case 'unsuspend':
        result = await supabase.rpc(
          'unsuspend_shop',
          {
            p_shop_id: shop_id,
            p_admin_id: user.id
          }
        )
        break

      case 'extend_trial':
        const days = body.days || 7
        
        // Fetch current trial_end_date to calculate extension
        const { data: shopToExtend, error: fetchError } = await supabase
          .from('shops')
          .select('trial_end_date')
          .eq('id', shop_id)
          .single();
          
        if (fetchError || !shopToExtend) {
          throw fetchError || new Error('Shop not found');
        }
        
        const currentTrialEndDate = new Date(shopToExtend.trial_end_date || new Date());
        currentTrialEndDate.setDate(currentTrialEndDate.getDate() + days);
        
        const { error: extendError } = await supabase
          .from('shops')
          .update({
            trial_end_date: currentTrialEndDate.toISOString()
          })
          .eq('id', shop_id)
        
        result = { 
          data: { success: !extendError }, 
          error: extendError 
        }
        break

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action' 
          }),
          { status: 400 }
        )
    }

    if (result.error) throw result.error

    return new Response(
      JSON.stringify(result.data),
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
