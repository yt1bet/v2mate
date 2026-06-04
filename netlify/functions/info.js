exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { url } = JSON.parse(event.body || '{}');
  if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };

  // Try multiple public cobalt instances
  const instances = [
    'https://cobalt.api.onrender.com',
    'https://cobalt.urduhack.com',
    'https://co.wuk.sh',
  ];

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
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(8000),
      });

      if (!cobaltRes.ok) continue;
      const data = await cobaltRes.json();

      if (data.status === 'error') {
        lastError = data.error?.code || 'Failed to fetch video';
        continue;
      }

      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
      const videoId = ytMatch ? ytMatch[1] : null;
      const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'success',
          title: data.filename || 'Video',
          thumbnail,
          url,
        }),
      };
    } catch (err) {
      lastError = err.message;
      continue;
    }
  }

  return { statusCode: 500, body: JSON.stringify({ error: lastError }) };
};
