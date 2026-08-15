require('dotenv').config({ path: '.env.example' });
console.log('ENV KEYS:', Object.keys(process.env));
console.log('SUPABASE URL:', process.env.VITE_SUPABASE_URL);
