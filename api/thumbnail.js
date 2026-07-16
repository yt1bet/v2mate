// api/thumbnail.js — Vercel serverless function
// Routes thumbnail downloads through Railway backend
const RAILWAY_URL = 'https://yt1bet-backend-production-3719.up.railway.app';

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });
  try {
    // Just return the Railway streaming URL — frontend fetches it directly
    const railwayUrl = `${RAILWAY_URL}/thumbnail?url=${encodeURIComponent(url)}`;
    return res.status(200).json({ streamUrl: railwayUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed' });
  }
}
