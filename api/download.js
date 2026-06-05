// api/download.js — Vercel serverless function
// Routes all downloads through Railway yt-dlp backend

const RAILWAY_URL = 'https://yt1bet-backend-production.up.railway.app';

export default async function handler(req, res) {
  const { url, format, quality } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    // For MP3 and MP4 — just return the Railway streaming URL
    // Frontend will hit Railway directly for the file stream
    const railwayUrl = `${RAILWAY_URL}/download?url=${encodeURIComponent(url)}&format=${format || 'mp4'}&quality=${quality || '720p'}`;

    // Return the Railway URL — frontend fetches it directly
    return res.status(200).json({ streamUrl: railwayUrl });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed' });
  }
}
