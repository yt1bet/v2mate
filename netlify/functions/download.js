exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const params = event.queryStringParameters || {};
  const { url, quality, format } = params;

  if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'URL required' }) };

  const RAPIDAPI_KEY = 'a0b99323a3msh3eec61168f0207dp1abf8ejsn1b6383ed2360';

  // Extract YouTube video ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  const videoId = ytMatch ? ytMatch[1] : null;

  // ─── INSTAGRAM ───────────────────────────────────────────
  if (!videoId) {
    try {
      // Use Cobalt for Instagram
      const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ url, vQuality: 'max' }),
        signal: AbortSignal.timeout(15000)
      });
      const cobaltData = await cobaltRes.json();
      if (cobaltData.url || cobaltData.urls) {
        const dlUrl = cobaltData.url || cobaltData.urls;
        return { statusCode: 200, headers, body: JSON.stringify({ downloadUrl: dlUrl }) };
      }
    } catch (e) {}
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not process Instagram URL' }) };
  }

  // ─── MP3 ──────────────────────────────────────────────────
  if (format === 'mp3') {
    try {
      const res = await fetch(
        `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
            'x-rapidapi-key': RAPIDAPI_KEY
          },
          signal: AbortSignal.timeout(30000)
        }
      );
      const data = await res.json();
      // MP3 API sometimes needs polling — handle both instant and delayed
      if (data.link) {
        return { statusCode: 200, headers, body: JSON.stringify({ downloadUrl: data.link }) };
      }
      if (data.status === 'processing') {
        // Poll up to 10 times with 2s delay
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const poll = await fetch(
            `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
            {
              headers: {
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
              }
            }
          );
          const pollData = await poll.json();
          if (pollData.link) {
            return { statusCode: 200, headers, body: JSON.stringify({ downloadUrl: pollData.link }) };
          }
        }
      }
      throw new Error('MP3 link not returned');
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'MP3 conversion failed. Try again.' }) };
    }
  }

  // ─── MP4 ──────────────────────────────────────────────────
  // Map quality string to height
  const heightMap = { '360p': 360, '480p': 480, '720p': 720, '1080p': 1080 };
  const targetHeight = heightMap[quality] || 720;

  // Try YTStream first
  try {
    const res = await fetch(
      `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        },
        signal: AbortSignal.timeout(15000)
      }
    );
    const data = await res.json();

    if (data.formats && Array.isArray(data.formats)) {
      // Find best match for requested quality
      const mp4Formats = data.formats.filter(f =>
        f.mimeType && f.mimeType.includes('video/mp4') && f.url
      );

      // Sort by height, pick closest to target
      mp4Formats.sort((a, b) => Math.abs((a.height || 0) - targetHeight) - Math.abs((b.height || 0) - targetHeight));

      if (mp4Formats.length > 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ downloadUrl: mp4Formats[0].url })
        };
      }

      // Fallback: any URL from formats
      const anyFormat = data.formats.find(f => f.url);
      if (anyFormat) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ downloadUrl: anyFormat.url })
        };
      }
    }

    throw new Error('No formats found');
  } catch (e) {}

  // Fallback: Cobalt for MP4
  try {
    const qualityNum = quality ? quality.replace('p', '') : '720';
    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ url, vQuality: qualityNum }),
      signal: AbortSignal.timeout(15000)
    });
    const cobaltData = await cobaltRes.json();
    if (cobaltData.url) {
      return { statusCode: 200, headers, body: JSON.stringify({ downloadUrl: cobaltData.url }) };
    }
  } catch (e) {}

  return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not get download link. Try another quality.' }) };
};
