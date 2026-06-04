exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'URL required' }) };

  // Extract video ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  const videoId = ytMatch ? ytMatch[1] : null;

  if (!videoId) {
    // Instagram Reels — return basic info, no thumbnail API needed
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: 'Instagram Reel',
        thumbnail: '',
        platform: 'instagram'
      })
    };
  }

  // YouTube thumbnail is always available free — no API call needed
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  // Fetch title via YTStream API
  try {
    const res = await fetch(
      `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com',
          'x-rapidapi-key': 'a0b99323a3msh3eec61168f0207dp1abf8ejsn1b6383ed2360'
        },
        signal: AbortSignal.timeout(10000)
      }
    );
    const data = await res.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: data.title || 'YouTube Video',
        thumbnail,
        videoId,
        platform: 'youtube'
      })
    };
  } catch (e) {
    // Even if title fetch fails, return thumbnail — better than full error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: 'YouTube Video',
        thumbnail,
        videoId,
        platform: 'youtube'
      })
    };
  }
};
