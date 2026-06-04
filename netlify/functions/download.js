exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { url, quality, type } = JSON.parse(event.body || '{}');
  if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };

  try {
    const body = { url, filenamePattern: 'basic' };

    if (type === 'mp3') {
      body.downloadMode = 'audio';
      body.audioFormat = 'mp3';
    } else {
      body.downloadMode = 'auto';
      body.videoQuality = quality || '720';
    }

    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await cobaltRes.json();

    if (data.status === 'error') {
      return { statusCode: 400, body: JSON.stringify({ error: data.error?.code || 'Download failed' }) };
    }

    if (data.status === 'redirect' || data.status === 'stream') {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ downloadUrl: data.url }) };
    }

    if (data.status === 'picker') {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ downloadUrl: data.picker?.[0]?.url || data.url }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Could not get download link' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
