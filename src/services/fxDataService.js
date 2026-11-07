/**
 * fxDataService — the single adapter between the UI and every data source.
 *
 * Pipeline (each step is replaceable without touching components):
 *   1. getSnapshot()        pre-loaded, offline-safe seed (providers, branches, reviews, mid rates)
 *   2. refreshLiveRates()   pulls public mid-market rates from the web. Provider quotes are then
 *                           computed from the mid rate plus each provider's spread profile.
 *   3. enrichFromGoogle()   hook for Google Places (ratings, review counts, reviews, coordinates).
 *                           Needs a Places API key and a server-side proxy; see the notes below.
 *
 * What is and is not "live": the mid-market rate is fetched from a public rate API.
 * Provider boards are not publicly machine-readable, so provider rates are modelled
 * (mid ± spread) and labelled as such in the UI.
 */
import { PROVIDERS, SEED_MID_PER_AED, CURRENCIES } from '../data/seed.js';

const RATE_ENDPOINTS = [
  'https://open.er-api.com/v6/latest/AED',
  'https://api.exchangerate-api.com/v4/latest/AED',
];

// Set VITE_PLACES_PROXY to a server route that forwards to Google Places API (New)
// "places:searchText" / "places/{id}" so the API key never reaches the browser.
const PLACES_PROXY = import.meta.env?.VITE_PLACES_PROXY;

export function getSnapshot() {
  return {
    providers: PROVIDERS,
    mid: { ...SEED_MID_PER_AED },
    updatedAt: null, // null => seed data, never fetched
    source: { rates: 'seed', places: 'seed', reviews: 'seed' },
  };
}

async function fetchJson(url, ms = 8000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Live FX market quotes. Primary: Yahoo Finance spot quotes for USD/<ccy> (minute-level,
 * via the /api/yahoo proxy), crossed through USD/AED. Fallback: open.er-api.com (daily fix).
 * Returns units of each currency per 1 AED plus the real quote timestamp.
 */
async function fromYahoo() {
  const codes = CURRENCIES.map((c) => c.code).filter((c) => c !== 'USD');
  const quotes = await Promise.all(
    codes.map(async (code) => {
      const j = await fetchJson(`/api/yahoo/v8/finance/chart/USD${code}=X?interval=1m&range=1d`);
      const m = j?.chart?.result?.[0]?.meta;
      if (!m || typeof m.regularMarketPrice !== 'number') throw new Error(`No quote for USD${code}`);
      return [code, m.regularMarketPrice, m.regularMarketTime * 1000];
    })
  );
  const usd = { USD: 1 };
  let quotedAt = Infinity;
  for (const [code, price, ts] of quotes) { usd[code] = price; quotedAt = Math.min(quotedAt, ts); }
  const mid = {};
  for (const { code } of CURRENCIES) mid[code] = usd[code] / usd.AED;
  return { mid, updatedAt: new Date(), quotedAt: new Date(quotedAt), host: 'Yahoo Finance FX spot' };
}

async function fromRateApi() {
  let lastErr;
  for (const url of RATE_ENDPOINTS) {
    try {
      const json = await fetchJson(url);
      const table = json.rates;
      if (!table) throw new Error('No rates in response');
      const mid = {};
      for (const { code } of CURRENCIES) {
        if (typeof table[code] !== 'number') throw new Error(`Missing ${code}`);
        mid[code] = table[code];
      }
      const ts = json.time_last_update_unix ? new Date(json.time_last_update_unix * 1000) : new Date();
      return { mid, updatedAt: new Date(), quotedAt: ts, host: `${new URL(url).host} (daily fix)` };
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

export async function refreshLiveRates() {
  try {
    return await fromYahoo();
  } catch (yahooErr) {
    try {
      return await fromRateApi();
    } catch (e) {
      throw new Error(`Live rates unavailable (${e?.message ?? yahooErr?.message ?? 'network error'}). Showing the last known rates.`);
    }
  }
}

/**
 * Google Places enrichment. Returns providers unchanged when no proxy is configured,
 * so the UI keeps working with the seed ratings and sample reviews.
 */
export async function enrichFromGoogle(providers) {
  if (!PLACES_PROXY) return { providers, enriched: false };
  const out = [];
  for (const p of providers) {
    try {
      const data = await fetchJson(`${PLACES_PROXY}?q=${encodeURIComponent(`${p.name} UAE`)}`);
      out.push({
        ...p,
        rating: data.rating ?? p.rating,
        reviewCount: data.userRatingCount ?? p.reviewCount,
        reviews: data.reviews?.length
          ? data.reviews.map((r) => ({
              name: r.authorAttribution?.displayName ?? 'Google user',
              stars: r.rating,
              branch: r.branch ?? 'UAE',
              daysAgo: Math.max(0, Math.round((Date.now() - new Date(r.publishTime)) / 864e5)),
              text: r.text?.text ?? '',
              verified: true,
            }))
          : p.reviews,
      });
    } catch {
      out.push(p);
    }
  }
  return { providers: out, enriched: true };
}
