import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing Supabase credentials. ' +
    'Check AI Studio secrets: ' +
    'VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY'
  )
} else {
  console.log(
    'Supabase credentials loaded ✓',
    SUPABASE_URL.substring(0, 30)
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  }
})
