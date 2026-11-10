/**
 * fxDataService — the single adapter between the UI and every data source.
 *
 * Pipeline (each step is replaceable without touching components):
 *   1. getSnapshot()        pre-loaded, offline-safe seed (providers, branches, reviews, mid rates)
 *   2. refreshLiveRates()   pulls public mid-market rates from four independent feeds, cross-checks them
 *                           (uncorroborated quotes discarded, freshest survivor wins) and records provenance. Provider
 *                           quotes are then computed from the mid rate plus each provider's spread profile.
 *   3. enrichFromGoogle()   hook for Google Places (ratings, review counts, reviews, coordinates).
 *                           Needs a Places API key and a server-side proxy; see the notes below.
 *
 * What is and is not "live": the mid-market rate is consensus of public rate feeds.
 * Provider boards are not publicly machine-readable, so provider rates are modelled
 * (mid ± spread) and labelled as such in the UI.
 */
import { SEED_MID_PER_AED, CURRENCIES } from '../data/seed.js';
import { PROVIDERS } from '../data/providers.js';

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
    dailyCodes: [],
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
 * Market-rate sources. Each one is normalised to units of <ccy> per 1 USD, with a timestamp per currency.
 * They are cross-checked against each other in buildConsensus(): outliers are discarded and the freshest
 * surviving quote wins, so one stale or wrong feed can't poison the numbers.
 */
const SOURCES = [
  { id: 'yahoo', label: 'Yahoo Finance FX spot', kind: 'spot', priority: 0 },
  { id: 'ecb', label: 'ECB via Frankfurter', kind: 'daily', priority: 1 },
  { id: 'erapi', label: 'open.er-api.com', kind: 'daily', priority: 2 },
  { id: 'fawaz', label: 'fawazahmed0 currency-api', kind: 'daily', priority: 3 },
];
const SRC = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
// A quote is discarded when no other source is within 0.25% of it plus an allowance for genuine market
// movement between quotes taken at different times (0.2% per sqrt-hour, capped at 1.5%). Same-time quotes get the tight
// band; a live spot quote compared with a daily fix taken 5-20 hours earlier gets room to have moved.
const BASE_TOLERANCE = 0.0025, DRIFT_PER_SQRT_HOUR = 0.002, MAX_TOLERANCE = 0.015;

const okNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Minute-level spot quotes for the major currencies, through the /api/yahoo proxy. */
async function fromYahoo() {
  const codes = CURRENCIES.map((c) => c.code).filter((c) => c !== 'USD');
  const quotes = await Promise.all(
    codes.map(async (code) => {
      const j = await fetchJson(`/api/yahoo/v8/finance/chart/USD${code}=X?interval=1m&range=1d`);
      const m = j?.chart?.result?.[0]?.meta;
      if (!m || !okNum(m.regularMarketPrice)) throw new Error(`No quote for USD${code}`);
      return [code, m.regularMarketPrice, new Date(m.regularMarketTime * 1000)];
    })
  );
  const perUsd = { USD: 1 }, times = {};
  for (const [code, price, ts] of quotes) { perUsd[code] = price; times[code] = ts; }
  times.USD = times.AED ?? new Date(Math.max(...Object.values(times).map((d) => d.getTime())));
  return { id: 'yahoo', perUsd, times };
}

/** Daily reference rates for ~160 currencies. */
async function fromErApi() {
  let lastErr;
  for (const url of RATE_ENDPOINTS.map((u) => u.replace('/AED', '/USD'))) {
    try {
      const j = await fetchJson(url);
      if (!j.rates) throw new Error('No rates in response');
      const ts = j.time_last_update_unix ? new Date(j.time_last_update_unix * 1000) : new Date();
      const perUsd = {}, times = {};
      for (const [c, v] of Object.entries(j.rates)) if (/^[A-Z]{3}$/.test(c) && okNum(v)) { perUsd[c] = v; times[c] = ts; }
      return { id: 'erapi', perUsd, times };
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

/** European Central Bank reference rates (about 30 currencies), published each working day around 16:00 CET. */
async function fromEcb() {
  const j = await fetchJson('https://api.frankfurter.dev/v1/latest?base=USD');
  if (!j.rates || !j.date) throw new Error('No ECB rates');
  const ts = new Date(`${j.date}T15:00:00Z`);
  const perUsd = { USD: 1 }, times = { USD: ts };
  for (const [c, v] of Object.entries(j.rates)) if (okNum(v)) { perUsd[c] = v; times[c] = ts; }
  return { id: 'ecb', perUsd, times };
}

/** Community-maintained daily rates for 300+ currencies. */
async function fromFawaz() {
  let lastErr;
  for (const url of ['https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', 'https://latest.currency-api.pages.dev/v1/currencies/usd.json']) {
    try {
      const j = await fetchJson(url);
      if (!j.usd || !j.date) throw new Error('No rates in response');
      const ts = new Date(`${j.date}T00:00:00Z`);
      const perUsd = {}, times = {};
      for (const [c, v] of Object.entries(j.usd)) if (/^[a-z]{3}$/.test(c) && okNum(v)) { perUsd[c.toUpperCase()] = v; times[c.toUpperCase()] = ts; }
      return { id: 'fawaz', perUsd, times };
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

/**
 * For every currency: gather each source's quote, drop outliers (when 3+ sources quote it), then take the
 * freshest remaining quote, with ties broken by source priority. Returns per-currency provenance too.
 */
export function buildConsensus(results) {
  const codes = new Set(results.flatMap((r) => Object.keys(r.perUsd)));
  const perUsd = {}, time = {}, info = {};
  for (const code of codes) {
    const cands = results.filter((r) => okNum(r.perUsd[code])).map((r) => ({ id: r.id, v: r.perUsd[code], t: r.times[code] ?? new Date(0) }));
    // keep currencies that two sources agree exist (drops crypto/metals only one feed carries), or any spot-quoted one
    if (cands.length < 2 && !cands.some((c) => c.id === 'yahoo')) continue;
    let kept = cands;
    if (cands.length >= 3) {
      // Keep a quote only if at least one other source corroborates it. One bad feed can't pull the others out with it.
      kept = cands.filter((c) => cands.some((o) => {
        if (o === c) return false;
        const gapH = Math.abs(c.t - o.t) / 36e5;
        const tol = Math.min(MAX_TOLERANCE, BASE_TOLERANCE + DRIFT_PER_SQRT_HOUR * Math.sqrt(gapH));
        return Math.abs(c.v - o.v) / Math.min(c.v, o.v) <= tol;
      }));
    }
    kept.sort((a, b) => b.t - a.t || SRC[a.id].priority - SRC[b.id].priority);
    const best = kept[0];
    perUsd[code] = best.v; time[code] = best.t;
    info[code] = { source: best.id, agree: kept.length, total: cands.length, rejected: cands.filter((c) => !kept.includes(c)).map((c) => c.id) };
  }
  return { perUsd, time, info };
}

export async function refreshLiveRates() {
  const settled = await Promise.allSettled([fromYahoo(), fromEcb(), fromErApi(), fromFawaz()]);
  const results = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value);
  if (!results.length || !results.some((r) => okNum(r.perUsd.AED))) {
    const why = settled.find((s) => s.status === 'rejected')?.reason?.message ?? 'network error';
    throw new Error(`Live rates unavailable (${why}). Showing the last known rates.`);
  }
  const { perUsd, time, info } = buildConsensus(results);
  if (!okNum(perUsd.AED)) throw new Error('Live rates unavailable (no AED quote). Showing the last known rates.');
  const mid = {}, quoteTimes = {}, sourceInfo = {}, daily = [];
  for (const code of Object.keys(perUsd)) {
    mid[code] = perUsd[code] / perUsd.AED; // units per 1 AED
    quoteTimes[code] = new Date(Math.min(time[code].getTime(), time.AED.getTime())); // the AED leg matters to every pair
    sourceInfo[code] = info[code];
    if (SRC[info[code].source].kind === 'daily') daily.push(code);
  }
  const used = results.map((r) => SRC[r.id].label);
  const quotedAt = new Date(Math.min(...['USD', 'EUR', 'GBP', 'INR'].filter((c) => quoteTimes[c]).map((c) => quoteTimes[c].getTime())));
  return {
    mid, quoteTimes, sourceInfo, dailyCodes: daily, updatedAt: new Date(), quotedAt,
    host: used.join(', '), sourcesUsed: used, sourcesTried: SOURCES.length,
  };
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
