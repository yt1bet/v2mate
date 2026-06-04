exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { url, quality, type } = JSON.parse(event.body || '{}');
  if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };

  const instances = [
    'https://cobalt.api.onrender.com',
    'https://cobalt.urduhack.com',
    'https://co.wuk.sh',
  ];

  const body = { url };
  if (type === 'mp3') {
    body.downloadMode = 'audio';
    body.audioFormat = 'mp3';
  } else {
    body.downloadMode = 'auto';
    body.videoQuality = quality || '720';
  }

  let lastError = 'All instances failed';

  for (const instance of instances) {
    try {
      const cobaltRes = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'yt1bet/1.0 (+https://yt1bet.netlify.app)',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      if (!cobaltRes.ok) continue;
      const data = await cobaltRes.json();

      if (data.status === 'error') {
        lastError = data.error?.code || 'Download failed';
        continue;
      }

      const downloadUrl = data.url || data.picker?.[0]?.url;
      if (downloadUrl) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ downloadUrl }),
        };
      }
    } catch (err) {
      lastError = err.message;
      continue;
    }
  }

  return { statusCode: 500, body: JSON.stringify({ error: lastError }) };
};
