import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Verify connection on import
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});
