import { put } from '@vercel/blob'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const data = req.body
    if (!data || !data.characterSheet) {
      return res.status(400).json({ error: 'Missing characterSheet' })
    }

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const record = { ...data, id, savedAt: new Date().toISOString() }
    const filename = `profiles/${id}.json`

    const blob = await put(filename, JSON.stringify(record, null, 2), {
      contentType: 'application/json',
      access: 'public',
    })

    return res.status(200).json({ ok: true, id, url: blob.url })
  } catch (err) {
    console.error('save-profile error:', err)
    return res.status(500).json({ error: err.message })
  }
}
