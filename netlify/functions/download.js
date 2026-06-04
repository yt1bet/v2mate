const https = require('https');

function fetchUrl(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 20000;
    const req = https.get(urlStr, { headers: options.headers || {} }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    setTimeout(() => { req.destroy(); reject(new Error('Timeout')); }, timeout);
  });
}

function postUrl(urlStr, body, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 20000;
    const bodyStr = JSON.stringify(body);
    const urlObj = new URL(urlStr);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    setTimeout(() => { req.destroy(); reject(new Error('Timeout')); }, timeout);
    req.write(bodyStr);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const params = event.queryStringParameters || {};
  const { url, quality, format } = params;
  if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'URL required' }) };

  const RAPIDAPI_KEY = 'a0b99323a3msh3eec61168f0207dp1abf8ejsn1b6383ed2360';

  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  const videoId = ytMatch ? ytMatch[1] : null;

  // Instagram
  if (!videoId) {
    try {
      const cobaltData = await postUrl('https://api.cobalt.tools/api/json', { url, vQuality: 'max' }, { timeout: 15000 });
      if (cobaltData.url) return { statusCode: 200, headers, body: JSON.stringify({ downloadUrl: cobaltData.url }) };
    } catch(e) {}
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not process Instagram URL' }) };
  }

  // MP3
  if (format === 'mp3') {
    try {
      const data = await fetchUrl(
        `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
        { headers: { 'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com', 'x-rapidapi-key': RAPIDAPI_KEY }, timeout: 30000 }
      );
      if (data.link) return { statusCode: 200, headers, body: JSON.stringify({ downloadUrl: data.link }) };
      // Poll if processing
      if (data.status === 'processing') {
        for (let i = 0; i < 8; i++) {
          await new Promise(r => setTimeout(r, 2500));
          const poll = await fetchUrl(
            `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
            { headers: { 'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com', 'x-rapidapi-key': RAPIDAPI_KEY } }
          );
          if (poll.link) return { statusCode: 200, headers, body: JSON.stringify({ downloadUrl: poll.link }) };
        }
      }
    } catch(e) {}
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'MP3 conversion failed. Try again.' }) };
  }

  // MP4 via YTStream
  const heightMap = { '360p': 360, '480p': 480, '720p': 720, '1080p': 1080 };
  const targetHeight = heightMap[quality] || 720;

  try {
    const data = await fetchUrl(
      `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`,
      { headers: { 'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com', 'x-rapidapi-key': RAPIDAPI_KEY }, timeout: 15000 }
    );

    if (data.formats && Array.isArray(data.formats)) {
      const mp4Formats = data.formats.filter(f => f.mimeType && f.mimeType.includes('video/mp4') && f.url);
      mp4Formats.sort((a, b) => Math.abs((a.height || 0) - targetHeight) - Math.abs((b.height || 0) - targetHeight));
      if (mp4Formats.length > 0) return { statusCode: 200, headers, body: JSON.stringify({ downloadUrl: mp4Formats[0].url }) };
      const anyFormat = data.formats.find(f => f.url);
      if (anyFormat) return { statusCode: 200, headers, body: JSON.stringify({ downloadUrl: anyFormat.url }) };
    }
  } catch(e) {}

  // Cobalt fallback
  try {
    const qualityNum = quality ? quality.replace('p', '') : '720';
    const cobaltData = await postUrl('https://api.cobalt.tools/api/json', { url, vQuality: qualityNum }, { timeout: 15000 });
    if (cobaltData.url) return { statusCode: 200, headers, body: JSON.stringify({ downloadUrl: cobaltData.url }) };
  } catch(e) {}

  return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not get download link. Try another quality.' }) };
};
