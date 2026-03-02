import 'dotenv/config';
import express from 'express';
import { pool } from './db.js';
import { getEmbedding } from './embed.js';

const app = express();
app.use(express.json());

// Layer 2 question IDs (semantic vibe free-text)
const LAYER2_IDS = [18, 19, 20, 21, 22, 23, 24];

// Same trait mapping as frontend — keep in sync with App.jsx
const QUESTION_TO_TRAIT = {
  8: 'builder_visionary', 9: 'speed_quality', 10: 'risk', 11: 'chaos',
  12: 'social', 13: 'decisions', 14: 'focus', 15: 'conflict',
  16: 'learning', 17: 'exploit',
};

function deriveTraits(answers) {
  const traits = {};
  for (const [qId, key] of Object.entries(QUESTION_TO_TRAIT)) {
    if (answers[qId] !== undefined) traits[key] = answers[qId];
  }
  return traits;
}

function buildVibeText(answers) {
  return LAYER2_IDS
    .filter(id => answers[id] && String(answers[id]).trim())
    .map(id => String(answers[id]).trim())
    .join('\n\n');
}

// ── Health check ─────────────────────────────────

app.get('/api/health', async (_req, res) => {
  const checks = { api: true, db: false, embeddings: false };

  try {
    await pool.query('SELECT 1');
    checks.db = true;
  } catch {}

  checks.embeddings = !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);

  res.json({ status: 'ok', version: '0.0.4', checks });
});

// ── Save profile + embed ─────────────────────────

app.post('/api/profile', async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers object required' });
    }

    const traits = deriveTraits(answers);
    const vibeText = buildVibeText(answers);

    // Generate embedding if we have vibe text + an API key
    let vibeEmbedding = null;
    let embedded = false;
    if (vibeText && (process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY)) {
      try {
        vibeEmbedding = await getEmbedding(vibeText);
        embedded = true;
      } catch (err) {
        console.error('embedding failed (saving profile without):', err.message);
      }
    }

    const result = await pool.query(
      `INSERT INTO profiles (answers, traits, vibe_text, vibe_embedding)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [
        JSON.stringify(answers),
        JSON.stringify(traits),
        vibeText || null,
        vibeEmbedding ? `[${vibeEmbedding.join(',')}]` : null,
      ]
    );

    res.json({
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
      embedded,
      trait_count: Object.keys(traits).length,
      vibe_length: vibeText?.length || 0,
    });
  } catch (err) {
    console.error('POST /api/profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Find matches ─────────────────────────────────

app.get('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 5, 50);

    const profile = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
    if (!profile.rows.length) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const p = profile.rows[0];

    if (!p.vibe_embedding) {
      return res.json({
        profile_id: id,
        matches: [],
        message: 'No embedding — fill out Layer 2 semantic vibe questions first',
      });
    }

    // Cosine similarity via pgvector <=> operator
    const matches = await pool.query(
      `SELECT id, traits, vibe_text,
              1 - (vibe_embedding <=> $1) as vibe_similarity
       FROM profiles
       WHERE id != $2 AND vibe_embedding IS NOT NULL
       ORDER BY vibe_embedding <=> $1
       LIMIT $3`,
      [p.vibe_embedding, id, limit]
    );

    res.json({
      profile_id: id,
      matches: matches.rows.map(m => ({
        id: m.id,
        traits: m.traits,
        vibe_similarity: Math.round(m.vibe_similarity * 1000) / 1000,
        vibe_preview: m.vibe_text?.slice(0, 200),
      })),
    });
  } catch (err) {
    console.error('GET /api/matches error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const hasKey = process.env.OPENROUTER_API_KEY ? 'OpenRouter' : process.env.OPENAI_API_KEY ? 'OpenAI' : '✗ no key';
  const hasDb = process.env.DATABASE_URL ? '✓ configured' : '✗ no DATABASE_URL';
  console.log(`\n  carbonrouter server · v0.0.4 · :${PORT}`);
  console.log(`  embeddings: ${hasKey}`);
  console.log(`  database:   ${hasDb}\n`);
});
