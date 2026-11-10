import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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

export default defineConfig({ plugins: [react()], server: { proxy: yahoo }, preview: { proxy: yahoo } });
