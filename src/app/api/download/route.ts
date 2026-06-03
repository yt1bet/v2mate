import { NextRequest, NextResponse } from 'next/server';

// Multiple Cobalt community instances — tries each until one works
const COBALT_INSTANCES = [
  'https://cobalt.api.timelessnesses.me',
  'https://cobalt.synth.zip',
  'https://api.cobalt.tools',
];

interface CobaltRequest {
  url: string;
  videoQuality?: string;
  audioFormat?: string;
  downloadMode?: string;
  filenameStyle?: string;
}

interface CobaltResponse {
  status: string;
  url?: string;
  urls?: string[];
  picker?: { url: string; type: string }[];
  error?: { code?: string; context?: { service?: string } };
}

async function callCobalt(instance: string, body: CobaltRequest): Promise<CobaltResponse | null> {
  try {
    const res = await fetch(`${instance}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return null;
    return await res.json() as CobaltResponse;
  } catch {
    return null;
  }
}

function qualityToCobalt(quality: string): string {
  // Cobalt expects "360", "480", "720", "1080", "1440", "max"
  if (quality === '1440') return '1440';
  if (quality === '1080') return '1080';
  if (quality === '720') return '720';
  if (quality === '480') return '480';
  if (quality === '360') return '360';
  return '720'; // default
}

export async function POST(req: NextRequest) {
  try {
    const { url, quality, format } = await req.json();

    if (!url || !quality || !format) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const isAudio = format === 'mp3';

    const cobaltBody: CobaltRequest = {
      url,
      filenameStyle: 'pretty',
    };

    if (isAudio) {
      cobaltBody.downloadMode = 'audio';
      cobaltBody.audioFormat = 'mp3';
    } else {
      cobaltBody.downloadMode = 'auto';
      cobaltBody.videoQuality = qualityToCobalt(quality);
    }

    // Try each Cobalt instance until one works
    let downloadUrl: string | null = null;

    for (const instance of COBALT_INSTANCES) {
      const data = await callCobalt(instance, cobaltBody);

      if (!data) continue;

      if (data.status === 'stream' && data.url) {
        downloadUrl = data.url;
        break;
      }

      if (data.status === 'redirect' && data.url) {
        downloadUrl = data.url;
        break;
      }

      if (data.status === 'tunnel' && data.url) {
        downloadUrl = data.url;
        break;
      }

      // Some instances return urls array
      if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
        downloadUrl = data.urls[0];
        break;
      }

      // Picker mode (multiple streams)
      if (data.status === 'picker' && data.picker && data.picker.length > 0) {
        downloadUrl = data.picker[0].url;
        break;
      }

      // If error from this instance, try next
      if (data.status === 'error') {
        continue;
      }
    }

    if (!downloadUrl) {
      return NextResponse.json(
        { error: 'Could not get download link. The video may be private, age-restricted, or temporarily unavailable. Try a different quality.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ downloadUrl });
  } catch {
    return NextResponse.json({ error: 'Download request failed. Please try again.' }, { status: 500 });
  }
}
