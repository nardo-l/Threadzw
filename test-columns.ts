import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://placeholder-please-configure-supabase-url.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("Checking columns of products table by selecting one row...");
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error("Error fetching product:", error);
  } else if (data && data.length > 0) {
    console.log("Product columns:", Object.keys(data[0]));
  } else {
    console.log("No products found in database.");
  }
}

test().catch(err => console.error(err));
