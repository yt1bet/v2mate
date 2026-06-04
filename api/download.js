const https = require('https');
const http = require('http');

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Proxy a remote file directly to the client — forces download on mobile
function proxyDownload(remoteUrl, filename, res) {
  return new Promise((resolve, reject) => {
    const lib = remoteUrl.startsWith('https') ? https : http;
    lib.get(remoteUrl, (stream) => {
      if (stream.statusCode === 301 || stream.statusCode === 302) {
        // Follow redirect
        proxyDownload(stream.headers.location, filename, res).then(resolve).catch(reject);
        return;
      }
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', stream.headers['content-type'] || 'application/octet-stream');
      if (stream.headers['content-length']) {
        res.setHeader('Content-Length', stream.headers['content-length']);
      }
      stream.pipe(res);
      stream.on('end', resolve);
      stream.on('error', reject);
    }).on('error', reject);
  });
}

// ── MP4 via Cobalt (primary — works on mobile & desktop) ──────────────────
async function getMp4Cobalt(videoUrl, quality) {
  const qualityMap = { '1080p': '1080', '720p': '720', '480p': '480', '360p': '360' };
  const q = qualityMap[quality] || '720';

  const result = await fetchJson('https://cobalt.tools/api/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ url: videoUrl, vQuality: q, isAudioOnly: false }),
  });

  if (result.status === 200 && result.body && result.body.url) {
    return result.body.url;
  }
  return null;
}

// ── MP4 via YTStream RapidAPI (fallback) ─────────────────────────────────
async function getMp4YTStream(videoId, quality) {
  const qualityMap = { '1080p': '1080', '720p': '720', '480p': '480', '360p': '360' };
  const q = qualityMap[quality] || '720';

  const result = await fetchJson(
    `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '5c798cfea6msh0568dcc85f3c7b2p172c88jsn1b4ef25f32b6',
        'X-RapidAPI-Host': 'ytstream-download-youtube-videos.p.rapidapi.com',
      },
    }
  );

  if (result.status === 200 && result.body && result.body.url) {
    const urls = result.body.url;
    return urls[q] || urls['720'] || urls['480'] || Object.values(urls)[0] || null;
  }
  return null;
}

// ── MP3 via Spicy-Laika API ───────────────────────────────────────────────
async function getMp3SpicyLaika(videoId) {
  const result = await fetchJson(
    `https://youtube-mp3-audio-video-downloader.p.rapidapi.com/get_mp3_download_link/${videoId}?quality=medium&wait_until_the_file_is_ready=false`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '5c798cfea6msh0568dcc85f3c7b2p172c88jsn1b4ef25f32b6',
        'X-RapidAPI-Host': 'youtube-mp3-audio-video-downloader.p.rapidapi.com',
      },
    }
  );

  if (result.status !== 200 || !result.body) return null;

  // reserved_file = permanent link, always prefer it
  if (result.body.reserved_file) return result.body.reserved_file;
  if (result.body.file) return result.body.file;

  // Not ready yet — wait 4s and retry once
  await new Promise(r => setTimeout(r, 4000));

  const poll = await fetchJson(
    `https://youtube-mp3-audio-video-downloader.p.rapidapi.com/get_mp3_download_link/${videoId}?quality=medium&wait_until_the_file_is_ready=false`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '5c798cfea6msh0568dcc85f3c7b2p172c88jsn1b4ef25f32b6',
        'X-RapidAPI-Host': 'youtube-mp3-audio-video-downloader.p.rapidapi.com',
      },
    }
  );

  if (poll.status === 200 && poll.body) {
    if (poll.body.reserved_file) return poll.body.reserved_file;
    if (poll.body.file) return poll.body.file;
  }

  return null;
}

// ── Main handler ─────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, format, quality, proxy } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  // Extract video ID
  let videoId = null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.slice(1).split('?')[0];
    } else if (u.pathname.startsWith('/shorts/')) {
      videoId = u.pathname.split('/shorts/')[1].split('?')[0];
    } else {
      videoId = u.searchParams.get('v');
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  if (!videoId) return res.status(400).json({ error: 'Could not extract video ID' });

  // ── PROXY MODE: stream file directly to client (forces download on mobile)
  if (proxy === '1' && req.query.fileUrl) {
    try {
      const ext = format === 'mp3' ? 'mp3' : 'mp4';
      await proxyDownload(req.query.fileUrl, `video.${ext}`, res);
      return;
    } catch (err) {
      return res.status(500).json({ error: 'Proxy failed: ' + err.message });
    }
  }

  try {
    if (format === 'mp3') {
      const mp3Url = await getMp3SpicyLaika(videoId);
      if (mp3Url) {
        // Proxy it through Vercel so mobile gets a real download
        try {
          await proxyDownload(mp3Url, `${videoId}.mp3`, res);
        } catch (e) {
          // If proxy fails (large file timeout), return the URL directly as fallback
          return res.status(200).json({ downloadUrl: mp3Url, videoId });
        }
        return;
      }
      return res.status(500).json({ error: 'MP3 conversion failed. Please try again.' });

    } else {
      // MP4 — Cobalt first (mobile-safe), YTStream fallback
      let mp4Url = await getMp4Cobalt(url, quality || '720p');
      if (!mp4Url) {
        mp4Url = await getMp4YTStream(videoId, quality || '720p');
      }

      if (mp4Url) {
        // Return URL to frontend — frontend opens it
        // Cobalt URLs work on mobile natively
        return res.status(200).json({ downloadUrl: mp4Url, videoId });
      }
      return res.status(500).json({ error: 'Video download failed. Try a different quality.' });
    }
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
