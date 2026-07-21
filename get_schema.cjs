require('dotenv').config({ path: '.env.example' });

async function get() {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/`;
  const res = await fetch(url, { headers: { 'apikey': process.env.VITE_SUPABASE_ANON_KEY }});
  const json = await res.json();
  if (json.definitions && json.definitions.profiles) {
    console.log('Profiles keys:', Object.keys(json.definitions.profiles.properties));
  } else {
    console.log(json);
  }
}
get();
