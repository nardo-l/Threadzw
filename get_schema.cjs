require('dotenv').config({ path: '.env.example' });

async function get() {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/`;
  const res = await fetch(url, { headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }});
  const json = await res.json();
  if (json.definitions && json.definitions.profiles) {
    console.log('Profiles keys:', Object.keys(json.definitions.profiles.properties));
  } else {
    console.log('Definitions keys:', json.definitions ? Object.keys(json.definitions) : json);
  }
}
get();
