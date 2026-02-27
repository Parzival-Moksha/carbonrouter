import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dims = process.env.EMBEDDING_DIMENSIONS || 1536;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('running migrations...\n');

    // pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('  ✓ pgvector extension');

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('  ✓ uuid-ossp extension');

    // profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        answers JSONB NOT NULL,
        traits JSONB NOT NULL DEFAULT '{}',
        vibe_text TEXT,
        vibe_embedding vector(${dims}),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log(`  ✓ profiles table (embedding dims: ${dims})`);

    // For small datasets (<1000) sequential scan is fine.
    // Add HNSW index when you have real users:
    // CREATE INDEX ON profiles USING hnsw (vibe_embedding vector_cosine_ops);

    console.log('\nmigrations complete. ready for routing.\n');
  } catch (err) {
    console.error('\nmigration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
