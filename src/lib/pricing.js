import { AREAS } from '../data/seed.js';

/** Cross rate: units of `to` per 1 `from`, derived from a per-AED mid-market table. */
export const midRate = (mid, from, to) => mid[to] / mid[from];

/**
 * Provider quote for a pair.
 *  - "sell" side: the customer hands over BASE and receives TARGET (rate is lower than mid).
 *  - "buy"  side: the customer buys BASE with TARGET (rate is higher than mid).
 * Bank transfers narrow the margin and add a flat fee (in AED, converted to the base).
 */
export function quote(provider, mid, base, target, channel) {
  const m = midRate(mid, base, target);
  const bias = (provider.bias[target] ?? 0) + (provider.bias[base] ?? 0) * 0.5;
  const channelAdj = channel === 'bank' ? -0.2 : 0;
  const pct = Math.max(0.15, provider.margin + bias + channelAdj) / 100;
  const feeAed = channel === 'bank' ? provider.fee.bank : 0;
  const feeBase = feeAed * (mid[base] / mid.AED);
  return { mid: m, sellRate: m * (1 - pct), buyRate: m * (1 + pct), feeBase, marginPct: pct * 100 };
}

/** Converted figure for the chosen mode. `sell` => you receive, `buy` => you pay. */
export function convert(q, amount, mode) {
  if (mode === 'sell') return Math.max(0, amount - q.feeBase) * q.sellRate;
  return amount * q.buyRate + q.feeBase * q.buyRate;
}

export const fmtNum = (v, d = 2) =>
  new Intl.NumberFormat('en-AE', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);

export const rateDigits = (r) => (r >= 100 ? 2 : r >= 10 ? 3 : 4);

export function isOpenNow(branch, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
  const h = +parts.find((p) => p.type === 'hour').value % 24;
  const mi = +parts.find((p) => p.type === 'minute').value;
  const cur = h * 60 + mi;
  const [fh, fm] = branch.hours[0].split(':').map(Number);
  const [th, tm] = branch.hours[1].split(':').map(Number);
  return cur >= fh * 60 + fm && cur < th * 60 + tm;
}

export const hoursLabel = (b) => (b.hours[0] === '00:00' && b.hours[1] === '24:00' ? 'Open 24 hours' : `${b.hours[0]} – ${b.hours[1]}`);

export function areaMatches(branch, areaId) {
  const a = AREAS.find((x) => x.id === areaId);
  if (!a || areaId === 'all') return true;
  if (areaId === 'dubai') return branch.emirate === 'Dubai';
  if (areaId === 'abudhabi') return branch.emirate === 'Abu Dhabi';
  return branch.area === areaId;
}

/** Haversine distance in km. */
export function km([la1, lo1], [la2, lo2]) {
  const r = (d) => (d * Math.PI) / 180;
  const a = Math.sin(r(la2 - la1) / 2) ** 2 + Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(r(lo2 - lo1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export const directionsUrl = (b, p) =>
  `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&destination_place_id=&travelmode=driving&query=${encodeURIComponent(p.name)}`;
export const mapsUrl = (b, p) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${b.area} ${b.emirate}`)}`;
export const reviewsUrl = (p) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} UAE reviews`)}`;

export function relTime(daysAgo) {
  if (daysAgo < 7) return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
  if (daysAgo < 30) return `${Math.round(daysAgo / 7)} weeks ago`;
  return `${Math.round(daysAgo / 30)} month${Math.round(daysAgo / 30) === 1 ? '' : 's'} ago`;
}
