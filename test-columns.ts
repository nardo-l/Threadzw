import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://dxfnoswvuhqvhyofcain.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Zm5vc3d2dWhxdmh5b2ZjYWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTEyMTcsImV4cCI6MjA5NTQ2NzIxN30.mOysCY5vH8952VJJYMpnLgBpWSLC1kMI4yOfMgXLBtM";

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
