import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  body: any;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (data: any) => VercelResponse;
  send: (body: any) => VercelResponse;
}

const youtubeCache = new Map<string, string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for API routes on Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const qParam = req.query?.q;
    const q = (Array.isArray(qParam) ? qParam[0] : qParam || '').trim();

    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter q' });
    }

    if (youtubeCache.has(q)) {
      return res.json({ youtubeId: youtubeCache.get(q) });
    }

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to query YouTube' });
    }

    const html = await response.text();
    const matches = html.match(/watch\?v=([a-zA-Z0-9_-]{11})/g);
    if (matches && matches.length > 0) {
      const idMatch = matches[0].replace('watch?v=', '');
      youtubeCache.set(q, idMatch);
      return res.json({ youtubeId: idMatch });
    }

    return res.status(404).json({ error: 'No video found' });
  } catch (err: any) {
    console.error('Error in Vercel /api/resolve-youtube:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
