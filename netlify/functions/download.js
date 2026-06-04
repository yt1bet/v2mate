exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { url, quality, type } = JSON.parse(event.body || '{}');
  if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };
  try {
    const res = await fetch('https://yt1bet-api-production.up.railway.app/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, quality, type }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json();
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ downloadUrl: data.downloadUrl }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to reach backend' }) };
  }
};
