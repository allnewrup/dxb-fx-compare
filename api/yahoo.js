// Production equivalent of the Vite dev proxy: forwards /api/yahoo/* to Yahoo Finance.
export default async function handler(req, res) {
  const path = String(req.query.path || '');
  if (!/^v\d+\/finance\/chart\/[A-Z0-9=.\-^]+$/i.test(path)) {
    res.status(400).json({ error: 'bad path' });
    return;
  }
  const qs = new URLSearchParams(req.query);
  qs.delete('path');
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/${path}?${qs}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; xchange-desk)' },
    });
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(r.status).setHeader('Content-Type', 'application/json').send(await r.text());
  } catch {
    res.status(502).json({ error: 'upstream failed' });
  }
}
