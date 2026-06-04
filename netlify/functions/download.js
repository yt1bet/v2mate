exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { url, quality, type } = JSON.parse(event.body || '{}');
  if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };
  try {
    const res = await fetch('https://yt1bet-api-production.up.railway.app/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, quality, type }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return { statusCode: 500, body: JSON.stringify({ error: 'Backend failed' }) };
    const contentType = res.headers.get('content-type') || 'video/mp4';
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="yt1bet.${type === 'mp3' ? 'mp3' : 'mp4'}"`,
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed' }) };
  }
};
