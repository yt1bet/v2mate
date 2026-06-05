const RAILWAY_URL = process.env.RAILWAY_URL || 'https://yt1bet-backend-production.up.railway.app';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, format, quality } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    let endpoint = `${RAILWAY_URL}/download?url=${encodeURIComponent(url)}&format=${format || 'mp4'}`;
    if (quality) endpoint += `&quality=${quality}`;

    // Pipe Railway response directly to client
    const https = require('https');
    const http = require('http');
    const lib = endpoint.startsWith('https') ? https : http;

    const railwayReq = lib.get(endpoint, (railwayRes) => {
      // Copy all headers from Railway
      res.writeHead(railwayRes.statusCode, {
        'Content-Type': railwayRes.headers['content-type'] || 'application/octet-stream',
        'Content-Disposition': railwayRes.headers['content-disposition'] || 'attachment',
        'Access-Control-Allow-Origin': '*',
        ...(railwayRes.headers['content-length'] ? { 'Content-Length': railwayRes.headers['content-length'] } : {})
      });
      railwayRes.pipe(res);
    });

    railwayReq.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Railway connection failed: ' + err.message });
      }
    });

    railwayReq.setTimeout(180000, () => {
      railwayReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ error: 'Download timeout. Try a lower quality.' });
      }
    });

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error: ' + err.message });
    }
  }
};
