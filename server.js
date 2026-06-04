const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Get video info
app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ url, filenamePattern: 'basic' }),
    });

    const data = await cobaltRes.json();

    if (data.status === 'error') {
      return res.status(400).json({ error: data.error?.code || 'Failed to fetch video info' });
    }

    // Extract video ID for YouTube thumbnail
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
    const videoId = ytMatch ? ytMatch[1] : null;
    const thumbnail = videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;

    return res.json({
      status: 'success',
      title: data.meta?.title || 'Video',
      thumbnail,
      url,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// API: Download
app.post('/api/download', async (req, res) => {
  const { url, quality, type } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const body = {
      url,
      filenamePattern: 'basic',
    };

    if (type === 'mp3') {
      body.downloadMode = 'audio';
      body.audioFormat = 'mp3';
    } else {
      body.downloadMode = 'auto';
      body.videoQuality = quality || '720';
    }

    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await cobaltRes.json();

    if (data.status === 'error') {
      return res.status(400).json({ error: data.error?.code || 'Download failed' });
    }

    if (data.status === 'redirect' || data.status === 'stream') {
      return res.json({ downloadUrl: data.url });
    }

    if (data.status === 'picker') {
      return res.json({ downloadUrl: data.picker?.[0]?.url || data.url });
    }

    return res.status(400).json({ error: 'Could not get download link' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// All other routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`yt1bet running on port ${PORT}`));
