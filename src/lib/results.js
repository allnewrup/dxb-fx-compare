// Pure result logic shared by the page and the chat assistant, so both always see the same numbers.
import { AREAS } from '../data/seed.js';
import { quote, convert, areaMatches, isOpenNow, km, emiratesForArea, areaForEmirates } from './pricing.js';

/** Merge a patch into the search state, keeping the area dropdown and the emirate ticks in agreement. */
export function applyPatch(prev, patch) {
  const next = { ...prev, ...patch };
  if ('areaId' in patch && !('emirates' in patch)) next.emirates = emiratesForArea(patch.areaId);
  else if ('emirates' in patch && !('areaId' in patch)) next.areaId = areaForEmirates(patch.emirates, prev.areaId);
  return next;
}

/** Where distances are measured from: the visitor's position when known, otherwise the chosen area's centre. */
export function originFor(s, userLoc) {
  if (userLoc) return [userLoc.lat, userLoc.lng];
  return (AREAS.find((a) => a.id === s.areaId) ?? AREAS[0]).center;
}

export const queryTokens = (query) => query.toLowerCase().split(/\s+/).filter(Boolean);

/** One row per provider that has at least one branch matching the filters, with its quote and total. */
export function deriveRows(data, s, picked, origin) {
  const tokens = queryTokens(s.query);
  const out = [];
  for (const p of data.providers) {
    if (s.type !== 'all' && p.type !== s.type) continue;
    if ((p.rating ?? 0) < s.minRating) continue;
    const branches = p.branches.filter((b) => s.emirates[b.emirate] && areaMatches(b, s.areaId) && (!s.openNow || isOpenNow(b) === true)
      && tokens.every((tk) => `${p.name} ${p.type === 'bank' ? 'bank' : 'exchange bureau'} ${b.area} ${b.emirate} ${b.address}`.toLowerCase().includes(tk)));
    if (!branches.length) continue;
    const withDist = branches.map((b) => ({ b, d: km(origin, [b.lat, b.lng]) })).sort((x, y) => x.d - y.d);
    const branch = branches.find((b) => b.id === picked[p.id]) ?? withDist[0].b;
    const q = quote(p, data.mid, s.from, s.to, s.channel);
    out.push({ provider: p, branches: withDist.map((x) => x.b), branch, nearestKm: withDist[0].d, q, total: convert(q, s.amount, s.mode) });
  }
  return out;
}

/** True when distance is meaningful for ordering: a real position, or a neighbourhood / smaller emirate. */
export const isSpecificArea = (s, userLoc) => !!userLoc || !['all', 'dubai', 'abudhabi'].includes(s.areaId);

export function sortRows(rows, s, specificArea) {
  const r = [...rows];
  if (s.sort === 'high') r.sort((a, b) => b.total - a.total);
  else if (s.sort === 'low') r.sort((a, b) => a.total - b.total);
  else if (s.sort === 'rate') r.sort((a, b) => (s.mode === 'sell' ? b.total - a.total : a.total - b.total));
  else if (s.sort === 'rating') r.sort((a, b) => (b.provider.rating ?? -1) - (a.provider.rating ?? -1) || (b.provider.reviewCount ?? 0) - (a.provider.reviewCount ?? 0));
  else r.sort((a, b) => (specificArea ? a.nearestKm - b.nearestKm : b.branches.length - a.branches.length) || (b.provider.rating ?? -1) - (a.provider.rating ?? -1));
  return r;
}

/** Where this pair's market rate came from and how many feeds agreed. */
export function pairNoteFor(data, from, to) {
  const infos = [from, to].map((c) => data.sourceInfo?.[c]).filter(Boolean);
  if (!infos.length) return '';
  const label = { yahoo: 'Yahoo Finance FX spot', ecb: 'ECB', erapi: 'open.er-api.com', fawaz: 'fawazahmed0' };
  const names = [...new Set(infos.map((i) => label[i.source]))].join(' + ');
  const weakest = infos.reduce((a, b) => (b.agree < a.agree || (b.agree === a.agree && b.total < a.total) ? b : a)); // the leg with least agreement
  const { agree, total } = weakest;
  const out = [...new Set(infos.flatMap((i) => i.rejected))].map((id) => label[id]);
  return `${from}/${to}: ${names}${total > 1 ? `, ${agree} of ${total} sources agree` : ', single source'}${out.length ? ` (${out.join(', ')} discarded as an outlier)` : ''}.`;
}
