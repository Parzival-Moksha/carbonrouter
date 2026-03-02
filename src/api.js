const API = '/api';

export async function checkHealth() {
  try {
    const res = await fetch(`${API}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveProfile(answers) {
  const res = await fetch(`${API}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Save failed (${res.status})`);
  }
  return await res.json();
}

export async function getMatches(profileId, limit = 5) {
  const res = await fetch(`${API}/matches/${profileId}?limit=${limit}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Match query failed (${res.status})`);
  }
  return await res.json();
}
