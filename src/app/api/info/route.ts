import { NextRequest, NextResponse } from 'next/server';

// Multiple Cobalt community instances for fallback reliability
const COBALT_INSTANCES = [
  'https://cobalt.api.timelessnesses.me',
  'https://api.cobalt.tools',
  'https://cobalt.synth.zip',
];

interface CobaltResponse {
  status: string;
  url?: string;
  urls?: string[];
  pickerType?: string;
  picker?: { url: string }[];
  error?: { code: string };
}

async function tryFetch(url: string, body: object, instance: string): Promise<CobaltResponse | null> {
  try {
    const res = await fetch(`${instance}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Extract basic info from YouTube oEmbed (free, no API key)
async function getYouTubeInfo(url: string) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();

    // Extract video ID for thumbnail
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match?.[1];
    const thumbnail = videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : data.thumbnail_url;

    return {
      title: data.title || 'YouTube Video',
      thumbnail,
      author: data.author_name || '',
      duration: '',
    };
  } catch {
    return null;
  }
}

// For Instagram, we use a simple approach
async function getInstagramInfo(url: string) {
  try {
    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      return { title: 'Instagram Reel', thumbnail: '', author: 'Instagram', duration: '' };
    }
    const data = await res.json();
    return {
      title: data.title || 'Instagram Reel',
      thumbnail: data.thumbnail_url || '',
      author: data.author_name || 'Instagram',
      duration: '',
    };
  } catch {
    return { title: 'Instagram Reel', thumbnail: '', author: 'Instagram', duration: '' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
    }

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isInstagram = url.includes('instagram.com');

    if (!isYouTube && !isInstagram) {
      return NextResponse.json({ error: 'Only YouTube and Instagram URLs are supported.' }, { status: 400 });
    }

    let info = null;
    if (isYouTube) {
      info = await getYouTubeInfo(url);
    } else {
      info = await getInstagramInfo(url);
    }

    if (!info) {
      // Fallback generic info
      info = {
        title: isYouTube ? 'YouTube Video' : 'Instagram Reel',
        thumbnail: '',
        author: '',
        duration: '',
      };
    }

    return NextResponse.json(info);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch video info.' }, { status: 500 });
  }
}
