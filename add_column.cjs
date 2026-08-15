require('dotenv').config({ path: '.env.example' });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

async function run() {
  if (!connectionString) {
    console.log('No DATABASE_URL found in env');
    return;
  }
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_prompted BOOLEAN DEFAULT FALSE;');
    console.log('Successfully added notifications_prompted column to profiles.');
  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    await pool.end();
  }
}
run();
