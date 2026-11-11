import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Dates baked into the build so the Sources page can show when each static dataset was extracted.
const fetchedAt = (f) => JSON.parse(readFileSync(new URL(`./src/data/${f}`, import.meta.url), 'utf8')).fetchedAt;
const define = {
  __OSM_FETCHED__: JSON.stringify(fetchedAt('osm-uae.json')),
  __PLACES_FETCHED__: JSON.stringify(fetchedAt('map-places.json')),
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
};

// Browsers can't call Yahoo Finance directly (no CORS headers, needs a User-Agent),
// so the dev and preview servers forward /api/yahoo/* to it. A production deploy needs
// an equivalent route on its own server.
const yahoo = {
  '/api/yahoo': {
    target: 'https://query1.finance.yahoo.com',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/api\/yahoo/, ''),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; xchange-desk)' },
  },
};

// Serves api/chat.js (the assistant's relay) in `npm run dev`, the same file Vercel runs in production.
// Reads ANTHROPIC_API_KEY from .env.local; the key stays on the server and is never sent to the browser.
const chatApi = () => ({
  name: 'dev-api-chat',
  configureServer(server) {
    const env = loadEnv(server.config.mode, process.cwd(), '');
    for (const k of Object.keys(env)) if (/^(ANTHROPIC_|CHAT_)/.test(k) && process.env[k] === undefined) process.env[k] = env[k];
    server.middlewares.use('/api/chat', async (req, res) => {
      res.status = (c) => { res.statusCode = c; return res; };
      res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
      const chunks = [];
      for await (const c of req) chunks.push(c);
      try { req.body = JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'); } catch { req.body = null; }
      try {
        const mod = await server.ssrLoadModule('/api/chat.js');
        await mod.default(req, res);
      } catch (e) {
        server.config.logger.error(String(e?.stack ?? e));
        if (!res.headersSent) res.status(500).json({ error: 'upstream' }); else res.end();
      }
    });
  },
});

export default defineConfig({ define, plugins: [react(), chatApi()], server: { proxy: yahoo }, preview: { proxy: yahoo } });
