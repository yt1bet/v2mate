const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

const YT_DLP_PATH = path.join(__dirname, 'yt-dlp');

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) => {
      https.get(u, res => {
        if (res.statusCode === 301 || res.statusCode === 302) return get(res.headers.location);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    };
    get(url);
  });
}

async function ensureYtDlp() {
  if (fs.existsSync(YT_DLP_PATH)) { fs.chmodSync(YT_DLP_PATH, '755'); return; }
  console.log('Downloading yt-dlp...');
  await downloadFile('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp', YT_DLP_PATH);
  fs.chmodSync(YT_DLP_PATH, '755');
  console.log('yt-dlp ready!');
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    execFile(YT_DLP_PATH, args, { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout.trim());
    });
  });
}

app.get('/', (req, res) => res.json({ status: 'ok', service: 'yt1bet-api' }));

app.post('/info', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const output = await runYtDlp(['--dump-json', '--no-playlist', '--no-warnings', url]);
    const data = JSON.parse(output);
    return res.json({ title: data.title, thumbnail: data.thumbnail });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

app.post('/download', async (req, res) => {
  const { url, quality, type } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    let format;
    if (type === 'mp3') {
      format = 'bestaudio[ext=m4a]/bestaudio/best';
    } else {
      const q = quality || '720';
      format = `best[height<=${q}][ext=mp4]/best[height<=${q}]/best`;
    }
    const output = await runYtDlp(['--get-url', '--format', format, '--no-playlist', '--no-warnings', url]);
    const downloadUrl = output.split('\n').filter(Boolean)[0];
    if (!downloadUrl) return res.status(400).json({ error: 'No download URL found' });
    return res.json({ downloadUrl });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get download URL' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try { await ensureYtDlp(); } catch (e) { console.error('yt-dlp download failed:', e); }
});
