const https = require('https');

function fetchUrl(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 15000;
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query && req.query.url;
  if (!url) return res.status(400).json({ error: 'URL required' });

  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  const videoId = ytMatch ? ytMatch[1] : null;

  if (!videoId) {
    return res.status(200).json({ title: 'Instagram Reel', thumbnail: '', platform: 'instagram' });
  }

  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const data = await fetchUrl(
      `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`,
      {
        headers: {
          'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com',
          'x-rapidapi-key': 'a0b99323a3msh3eec61168f0207dp1abf8ejsn1b6383ed2360'
        },
        timeout: 12000
      }
    );
    return res.status(200).json({
      title: data.title || 'YouTube Video',
      thumbnail,
      videoId,
      platform: 'youtube'
    });
  } catch (e) {
    return res.status(200).json({
      title: 'YouTube Video',
      thumbnail,
      videoId,
      platform: 'youtube'
    });
  }
};
