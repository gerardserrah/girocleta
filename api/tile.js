const https = require('https');

const MAPTILER_KEY = process.env.MAPTILER_API_KEY || 'O7VbOY3zrXxBupgrQtdE';

module.exports = async (req, res) => {
  const { style, z, x, y } = req.query;

  if (!z || !x || !y) {
    return res.status(400).send('Missing tile coordinates: z, x, y are required');
  }

  // Determine MapTiler style: dataviz-v4-dark vs dataviz-v4
  const isDark = style === 'dark' || style === 'dataviz-v4-dark';
  const targetStyle = isDark ? 'dataviz-v4-dark' : 'dataviz-v4';
  const tileUrl = `https://api.maptiler.com/maps/${targetStyle}/256/${z}/${x}/${y}.png?key=${MAPTILER_KEY}`;

  try {
    if (typeof fetch === 'function') {
      const response = await fetch(tileUrl, {
        headers: {
          'Referer': 'https://www.maptiler.com/',
          'User-Agent': 'Mozilla/5.0 (compatible; Girocleta/1.0)'
        }
      });

      if (!response.ok) {
        return res.status(response.status).send(`MapTiler tile error: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(Buffer.from(buffer));
    }

    // Node fallback without global fetch
    https.get(tileUrl, {
      headers: {
        'Referer': 'https://www.maptiler.com/',
        'User-Agent': 'Mozilla/5.0 (compatible; Girocleta/1.0)'
      }
    }, (upstreamRes) => {
      if (upstreamRes.statusCode !== 200) {
        res.status(upstreamRes.statusCode).send('Tile fetch failed');
        return;
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      upstreamRes.pipe(res);
    }).on('error', (err) => {
      res.status(500).send(err.message);
    });

  } catch (error) {
    console.error('Tile proxy failure:', error);
    return res.status(500).send('Tile proxy internal error');
  }
};
