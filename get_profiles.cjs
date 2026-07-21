const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.example' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { error } = await supabase.from('profiles').upsert({ id: '00000000-0000-0000-0000-000000000000', handle: 'Test' });
  console.log('Error handle:', error);
  const { error: e2 } = await supabase.from('profiles').upsert({ id: '00000000-0000-0000-0000-000000000000', display_name: 'Test' });
  console.log('Error display_name:', e2);
  const { error: e3 } = await supabase.from('profiles').upsert({ id: '00000000-0000-0000-0000-000000000000', username: 'Test' });
  console.log('Error username:', e3);
}
check();
