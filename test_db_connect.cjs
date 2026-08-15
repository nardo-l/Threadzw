require('dotenv').config({ path: '.env.example' });
const { Pool } = require('pg');

// Try common connection string formats for Supabase
const url = process.env.VITE_SUPABASE_URL; // https://zuashdquiorcwvyvqucm.supabase.co
const ref = url ? url.replace('https://', '').replace('.supabase.co', '') : '';
const connectionStrings = [
  process.env.DATABASE_URL,
  process.env.SUPABASE_DB_URL,
  `postgres://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.${ref}.supabase.co:5432/postgres`,
  `postgres://postgres.zuashdquiorcwvyvqucm:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-eu-central-1.pooler.supabase.co:6543/postgres`
].filter(Boolean);

async function tryConnect() {
  for (const cs of connectionStrings) {
    console.log('Trying connection string:', cs.replace(/:[^:@]+@/, ':****@'));
    const pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 3000 });
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT NOW()');
      console.log('Connected successfully!', res.rows[0]);
      await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_prompted BOOLEAN DEFAULT FALSE;');
      console.log('Added notifications_prompted column successfully!');
      client.release();
      await pool.end();
      return;
    } catch (err) {
      console.log('Failed:', err.message);
      try { await pool.end(); } catch(e){}
    }
  }
  console.log('All connection string attempts failed.');
}
tryConnect();
