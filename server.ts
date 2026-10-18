import express from 'express';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // In-memory cache for resolved YouTube video IDs
  const youtubeCache = new Map<string, string>();

  // YouTube Resolver API: returns full YouTube video ID for any artist + title
  app.get('/api/resolve-youtube', async (req, res) => {
    try {
      const q = (req.query.q as string || '').trim();
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
      // Extract video IDs: watch?v=XXXXXXXXXXX
      const matches = html.match(/watch\?v=([a-zA-Z0-9_-]{11})/g);
      if (matches && matches.length > 0) {
        const idMatch = matches[0].replace('watch?v=', '');
        youtubeCache.set(q, idMatch);
        return res.json({ youtubeId: idMatch });
      }

      return res.status(404).json({ error: 'No video found' });
    } catch (err: any) {
      console.error('Error in /api/resolve-youtube:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Mount Vite dev server middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
