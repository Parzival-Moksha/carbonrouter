const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OPENAI_BASE = 'https://api.openai.com/v1';

export async function getEmbedding(text) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('No API key. Set OPENROUTER_API_KEY or OPENAI_API_KEY in .env');
  }

  const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const baseUrl = isOpenRouter ? OPENROUTER_BASE : OPENAI_BASE;
  const defaultModel = isOpenRouter ? 'openai/text-embedding-3-small' : 'text-embedding-3-small';
  const model = process.env.EMBEDDING_MODEL || defaultModel;

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(isOpenRouter ? { 'HTTP-Referer': 'https://carbonrouter.dev' } : {}),
    },
    body: JSON.stringify({ model, input: text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}
