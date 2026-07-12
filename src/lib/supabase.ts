import { createClient } from '@supabase/supabase-js';

// Parse and sanitize the Supabase URL
let rawUrl = (import.meta.env?.VITE_SUPABASE_URL) || "";
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
export const SUPABASE_URL = rawUrl;

// Parse and sanitize the Anon Key
let rawKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY) || "";
if (rawKey) {
  rawKey = rawKey.trim();
}
export const SUPABASE_ANON_KEY = rawKey;

// Ensure we connect directly to the real live Supabase instance
export const supabase = createClient(
  SUPABASE_URL || "https://placeholder-please-configure-supabase-url.supabase.co", 
  SUPABASE_ANON_KEY || "placeholder-please-configure-supabase-anon-key"
);
