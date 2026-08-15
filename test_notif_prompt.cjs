require('dotenv').config({ path: '.env.example' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (data && data[0]) {
    console.log('Profiles columns:', Object.keys(data[0]));
    if (!('notifications_prompted' in data[0])) {
      console.log('notifications_prompted column missing!');
    } else {
      console.log('notifications_prompted column exists.');
    }
  } else {
    console.log('Error or no rows:', error);
  }
}
test();
