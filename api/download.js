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

function proxyDownload(remoteUrl, filename, res) {
  return new Promise((resolve, reject) => {
    const lib = remoteUrl.startsWith('https') ? https : http;
    lib.get(remoteUrl, (stream) => {
      if (stream.statusCode === 301 || stream.statusCode === 302) {
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

// Cobalt — handles both MP4 and MP3, works on mobile, no API key needed
async function cobaltFetch(videoUrl, audioOnly, quality) {
  const qualityMap = { '1080p': '1080', '720p': '720', '480p': '480', '360p': '360' };
  const q = qualityMap[quality] || '720';

  // Try multiple Cobalt instances in case one is down
  const instances = [
    'https://cobalt.tools/api/json',
    'https://co.wuk.sh/api/json',
  ];

  for (const endpoint of instances) {
    try {
      const result = await fetchJson(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          url: videoUrl,
          vQuality: q,
          isAudioOnly: audioOnly,
          aFormat: audioOnly ? 'mp3' : undefined,
        }),
      });

      if (result.status === 200 && result.body && result.body.url) {
        return result.body.url;
      }
    } catch (e) {
      // try next instance
    }
  }
  return null;
}

// YTStream fallback for MP4 only
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

// Spicy-Laika MP3 as last resort fallback
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
  return result.body.reserved_file || result.body.file || null;
}

// ── Main handler ──────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, format, quality } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

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

  try {
    if (format === 'mp3') {
      // Try Cobalt audio first (most reliable, free, no key)
      let mp3Url = await cobaltFetch(url, true, '720p');

      // Fallback: Spicy-Laika
      if (!mp3Url) {
        mp3Url = await getMp3SpicyLaika(videoId);
      }

      if (mp3Url) {
        // Proxy through Vercel — forces real download on mobile
        try {
          await proxyDownload(mp3Url, `${videoId}.mp3`, res);
        } catch (e) {
          return res.status(200).json({ downloadUrl: mp3Url, videoId });
        }
        return;
      }
      return res.status(500).json({ error: 'MP3 conversion failed. Please try again.' });

    } else {
      // MP4 — Cobalt first (mobile-safe), YTStream fallback
      let mp4Url = await cobaltFetch(url, false, quality || '720p');
      if (!mp4Url) {
        mp4Url = await getMp4YTStream(videoId, quality || '720p');
      }

      if (mp4Url) {
        return res.status(200).json({ downloadUrl: mp4Url, videoId });
      }
      return res.status(500).json({ error: 'Video download failed. Try a different quality.' });
    }
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
