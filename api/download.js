const https = require('https');

function fetchUrl(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 20000;
    const req = https.get(urlStr, { headers: options.headers || {} }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ json: JSON.parse(data), status: res.statusCode }); }
        catch(e) { resolve({ json: null, raw: data, status: res.statusCode }); }
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
        try { resolve({ json: JSON.parse(data), status: res.statusCode }); }
        catch(e) { resolve({ json: null, raw: data, status: res.statusCode }); }
      });
    });
    req.on('error', reject);
    setTimeout(() => { req.destroy(); reject(new Error('Timeout')); }, timeout);
    req.write(bodyStr);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, quality, format } = req.query || {};
  if (!url) return res.status(400).json({ error: 'URL required' });

  const RAPIDAPI_KEY = 'a0b99323a3msh3eec61168f0207dp1abf8ejsn1b6383ed2360';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  const videoId = ytMatch ? ytMatch[1] : null;

  // Instagram
  if (!videoId) {
    try {
      const r = await postUrl('https://api.cobalt.tools/api/json', { url, vQuality: 'max' }, { timeout: 15000 });
      if (r.json && r.json.url) return res.status(200).json({ downloadUrl: r.json.url });
    } catch(e) {}
    return res.status(500).json({ error: 'Could not process Instagram URL' });
  }

  // MP3
  if (format === 'mp3') {
    // Try 1: Spicy-Laika — reserved_file is permanent
    try {
      const r = await fetchUrl(
        `https://youtube-mp3-audio-video-downloader.p.rapidapi.com/get_mp3_download_link/${videoId}?quality=high&wait_until_the_file_is_ready=false`,
        { headers: { 'x-rapidapi-host': 'youtube-mp3-audio-video-downloader.p.rapidapi.com', 'x-rapidapi-key': RAPIDAPI_KEY }, timeout: 15000 }
      );
      if (r.json) {
        const link = r.json.reserved_file || r.json.file || r.json.url || r.json.link;
        if (link) return res.status(200).json({ downloadUrl: link });
      }
    } catch(e) {}

    // Try 2: Cobalt audio
    try {
      const r = await postUrl('https://api.cobalt.tools/api/json', { url, isAudioOnly: true, aFormat: 'mp3' }, { timeout: 12000 });
      if (r.json && r.json.url) return res.status(200).json({ downloadUrl: r.json.url });
    } catch(e) {}

    // Try 3: youtube-mp36
    try {
      const r = await fetchUrl(
        `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
        { headers: { 'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com', 'x-rapidapi-key': RAPIDAPI_KEY }, timeout: 12000 }
      );
      if (r.json && r.json.link) return res.status(200).json({ downloadUrl: r.json.link });
    } catch(e) {}

    return res.status(500).json({ error: 'MP3 conversion failed. Please try again.' });
  }

  // MP4 — Cobalt FIRST (works on mobile), YTStream fallback
  const qualityNum = quality ? quality.replace('p', '') : '720';

  // Try 1: Cobalt — clean links, works on mobile
  try {
    const r = await postUrl(
      'https://api.cobalt.tools/api/json',
      { url, vQuality: qualityNum },
      { timeout: 12000 }
    );
    if (r.json && r.json.url) return res.status(200).json({ downloadUrl: r.json.url });
  } catch(e) {}

  // Try 2: YTStream fallback
  const heightMap = { '360': 360, '480': 480, '720': 720, '1080': 1080 };
  const targetHeight = heightMap[qualityNum] || 720;
  try {
    const r = await fetchUrl(
      `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`,
      { headers: { 'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com', 'x-rapidapi-key': RAPIDAPI_KEY }, timeout: 12000 }
    );
    if (r.json && r.json.formats && Array.isArray(r.json.formats)) {
      const mp4s = r.json.formats.filter(f => f.mimeType && f.mimeType.includes('video/mp4') && f.url);
      mp4s.sort((a, b) => Math.abs((a.height || 0) - targetHeight) - Math.abs((b.height || 0) - targetHeight));
      if (mp4s.length > 0) return res.status(200).json({ downloadUrl: mp4s[0].url });
      const any = r.json.formats.find(f => f.url);
      if (any) return res.status(200).json({ downloadUrl: any.url });
    }
  } catch(e) {}

  return res.status(500).json({ error: 'Could not get download link. Try another quality.' });
};
