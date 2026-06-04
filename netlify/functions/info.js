exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { url } = JSON.parse(event.body || '{}');
  if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };

  try {
    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ url, filenamePattern: 'basic' }),
    });

    const data = await cobaltRes.json();

    if (data.status === 'error') {
      return { statusCode: 400, body: JSON.stringify({ error: data.error?.code || 'Failed to fetch video' }) };
    }

    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
    const videoId = ytMatch ? ytMatch[1] : null;
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'success', title: data.meta?.title || 'Video', thumbnail, url }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
