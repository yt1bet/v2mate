const RAILWAY_URL = 'https://yt1bet-backend-production-3719.up.railway.app';

export default async function handler(req, res) {
  const { url, format } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });
  try {
    const railwayRes = await fetch(`${RAILWAY_URL}/transcript?url=${encodeURIComponent(url)}&format=${format || 'plain'}`);
    const text = await railwayRes.text();
    if (!railwayRes.ok) {
      return res.status(railwayRes.status).json(JSON.parse(text));
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed' });
  }
}
