import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify this is called by Supabase cron
    // or with service role
    const authHeader = 
      req.headers.get('Authorization')
    
    const expectedKey = 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (authHeader !== `Bearer ${expectedKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .rpc('expire_subscriptions')

    if (error) throw error

    console.log('Expiry check complete:', data)

    return new Response(
      JSON.stringify({
        success: true,
        result: data
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json' 
        }
      }
    )

  } catch (err) {
    console.error('Expiry check failed:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
})
