exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { url, quality, type } = JSON.parse(event.body || '{}');
  if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };
  try {
    const ext = type === 'mp3' ? 'mp3' : 'mp4';
    const downloadUrl = `https://yt1bet-api-production.up.railway.app/download?url=${encodeURIComponent(url)}&quality=${quality}&type=${type}`;
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ downloadUrl }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed' }) };
  }
};
