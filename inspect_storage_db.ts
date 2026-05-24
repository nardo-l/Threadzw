import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log("Missing Supabase credentials in env.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log("Querying storage.objects via RPC/REST sql query...");
  // Let's call storage.objects if RLS / permissions allow, or just do a general query
  const { data: objects, error } = await supabase
    .from('objects')
    .select('*')
    .range(0, 100);

  if (error) {
    console.error("Direct objects query failed:", error);
    // Let's try listing files via bucket listing for all buckets
    console.log("Using storage.listBuckets & listing everything...");
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log("Buckets:", buckets);
    if (buckets) {
      for (const bucket of buckets) {
        console.log(`Listing bucket: ${bucket.name}`);
        const { data: files } = await supabase.storage.from(bucket.name).list('', { limit: 100 });
        console.log(`Files in bucket ${bucket.name}:`, files);
      }
    }
  } else {
    console.log("All objects in storage.objects:");
    console.log(JSON.stringify(objects, null, 2));
  }
}

run();
