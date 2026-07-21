import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.storage.createBucket('shops', { public: true });
  if (error) console.error("Error creating shops bucket:", error);
  else console.log("shops bucket created!");
  
  const { data: d2, error: e2 } = await supabase.storage.createBucket('product-images', { public: true });
  if (e2) console.error("Error creating product-images:", e2);
  else console.log("product-images created");

  const { data: d3, error: e3 } = await supabase.storage.createBucket('shop-avatars', { public: true });
  if (e3) console.error("Error creating shop-avatars:", e3);
  else console.log("shop-avatars created");

  const { data: d4, error: e4 } = await supabase.storage.createBucket('shop-banners', { public: true });
  if (e4) console.error("Error creating shop-banners:", e4);
  else console.log("shop-banners created");

  const { data: d5, error: e5 } = await supabase.storage.createBucket('shop-images', { public: true });
  if (e5) console.error("Error creating shop-images:", e5);
  else console.log("shop-images created");
}
run();
