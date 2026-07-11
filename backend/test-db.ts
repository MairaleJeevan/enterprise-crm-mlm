import { Pool } from 'pg';

async function test() {
  const localUrl = "postgresql://postgres:Jayshree%40123@localhost:5432/postgres?schema=enterprise";
  console.log('Testing connection to local database at:', localUrl);
  const pool = new Pool({ connectionString: localUrl });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connection to local PostgreSQL successful with Jayshree@123!', res.rows);
  } catch (err: any) {
    console.error('❌ Local PostgreSQL connection failed:', err.message);
  } finally {
    await pool.end();
  }
}
test();
