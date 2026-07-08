import { createClient } from '@supabase/supabase-js';

// Parse and sanitize the Supabase URL
let rawUrl = (import.meta.env?.VITE_SUPABASE_URL) || "https://dxfnoswvuhqvhyofcain.supabase.co";
if (rawUrl) {
  rawUrl = rawUrl.trim();
  while (rawUrl.endsWith('/')) {
    rawUrl = rawUrl.slice(0, -1);
  }
  if (rawUrl.endsWith('/rest/v1')) {
    rawUrl = rawUrl.substring(0, rawUrl.length - 8);
  }
  while (rawUrl.endsWith('/')) {
    rawUrl = rawUrl.slice(0, -1);
  }
}
export const SUPABASE_URL = rawUrl || "https://dxfnoswvuhqvhyofcain.supabase.co";

// Parse and sanitize the Anon Key
let rawKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Zm5vc3d2dWhxdmh5b2ZjYWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTEyMTcsImV4cCI6MjA5NTQ2NzIxN30.mOysCY5vH8952VJJYMpnLgBpWSLC1kMI4yOfMgXLBtM";
if (rawKey) {
  rawKey = rawKey.trim();
}
export const SUPABASE_ANON_KEY = rawKey;

// Ensure we connect directly to the real live Supabase instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
