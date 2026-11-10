// Builds the provider list: the 8 hand-profiled exchange houses from seed.js, plus every other exchange bureau
// and major bank found in OpenStreetMap (src/data/osm-uae.json, built by scripts/build-osm-data.mjs).
// Real OSM branches replace the placeholder coordinates of the seeded providers.
import { PROVIDERS as SEED, AREAS } from './seed.js';
import osm from './osm-uae.json';

export const OSM_META = { fetchedAt: osm.fetchedAt, source: osm.source, total: osm.items.length };

// ---- brand grouping -------------------------------------------------------------------------------------------
// [test on the lower-cased raw name, key, display name]. Order matters: first match wins.
const ALIASES = [
  [/ansari|الأنصاري/, 'alansari', 'Al Ansari Exchange'],
  [/lulu|لولو/, 'lulu', 'LuLu Exchange'],
  [/rostamani|الرستماني/, 'rostamani', 'Al Rostamani International Exchange'],
  [/fardan|الفردان/, 'alfardan', 'Al Fardan Exchange'],
  [/sharaf|شرف/, 'sharaf', 'Sharaf Exchange'],
  [/wall ?street/, 'wallstreet', 'Wall Street Exchange'],
  [/dahab|الذهب/, 'aldahab', 'Al Dahab Exchange'],
  [/joyalukkas/, 'joyalukkas', 'Joyalukkas Exchange'],
  [/uae ?x?change|unimoni|مركز الإمارات العربية المتحدة للصرافة/, 'uaeexchange', 'UAE Exchange'],
  [/orient exchange|orient international/, 'orient', 'Orient Exchange'],
  [/travelex/, 'travelex', 'Travelex'],
  [/\blari\b/, 'lari', 'Lari Exchange'],
  [/ghurair/, 'alghurair', 'Al Ghurair Exchange'],
  [/ahalia/, 'ahalia', 'Al Ahalia Exchange'],
  [/emirates islamic/, 'emiratesislamic', 'Emirates Islamic'],
  [/emirates ?nbd|^enbd$|^nbd$/, 'enbd', 'Emirates NBD'],
  [/first abu dhabi|\bfab\b|national bank of abu dhabi|\bnbad\b|first gulf|\bfgb\b/, 'fab', 'First Abu Dhabi Bank (FAB)'],
  [/abu dhabi islamic|\badib\b/, 'adib', 'Abu Dhabi Islamic Bank (ADIB)'],
  [/abu dhabi commercial|\badcb\b/, 'adcb', 'ADCB'],
  [/dubai islamic|\bdib\b|بنك دبي الإسلامي/, 'dib', 'Dubai Islamic Bank'],
  [/mashreq|المشرق/, 'mashreq', 'Mashreq Bank'],
  [/rak ?bank|ras al khaimah national/, 'rakbank', 'RAKBANK'],
  [/commercial bank of dubai|\bcbd\b/, 'cbd', 'Commercial Bank of Dubai'],
  [/sharjah islamic/, 'sib', 'Sharjah Islamic Bank'],
  [/\bhsbc\b/, 'hsbc', 'HSBC'],
  [/standard chartered/, 'scb', 'Standard Chartered'],
  [/citibank|\bciti\b/, 'citi', 'Citibank'],
  [/union national/, 'unb', 'Union National Bank'],
  [/united arab bank/, 'uab', 'United Arab Bank'],
  [/al hilal/, 'alhilal', 'Al Hilal Bank'],
  [/national bank of fujairah|\bnbf\b/, 'nbf', 'National Bank of Fujairah'],
  [/invest ?bank/, 'investbank', 'Invest Bank'],
  [/ajman bank/, 'ajmanbank', 'Ajman Bank'],
  [/bank of baroda/, 'bob', 'Bank of Baroda'],
];
const hasLatin = (s) => /[a-z]/i.test(s);
const STOP = /\b(exchange|xchange|international|intl|co|llc|est|l\.l\.c|money|transfer|branch|the|and|bank)\b/g;

function identify(item) {
  const raw = [item.br, item.n].filter(Boolean).map((x) => x.toLowerCase());
  for (const r of raw) for (const [re, key, name] of ALIASES) if (re.test(r)) return { key, name, known: true };
  const nm = [item.br, item.n].find((x) => x && hasLatin(x));
  if (!nm) return null; // unnamed, or only an Arabic name we can't map
  const key = nm.toLowerCase().replace(STOP, '').replace(/[^a-z0-9]/g, '');
  return key.length >= 3 ? { key: `x-${key}`, name: nm.trim(), known: false } : null;
}

// ---- helpers ---------------------------------------------------------------------------------------------------
const NEIGHBOURHOODS = AREAS.filter((a) => a.kind === 'area');
const rad = (d) => (d * Math.PI) / 180;
const distKm = ([la1, lo1], [la2, lo2]) => 6371 * 2 * Math.asin(Math.sqrt(Math.sin(rad(la2 - la1) / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(rad(lo2 - lo1) / 2) ** 2));

function areaFor(item) {
  let best = null;
  for (const a of NEIGHBOURHOODS) {
    const d = distKm(a.center, [item.la, item.lo]);
    if (a.emirate === item.em && d < 3.5 && (!best || d < best.d)) best = { id: a.id, d };
  }
  return best?.id ?? (item.sb && hasLatin(item.sb) ? item.sb : item.em);
}

/** Best-effort read of an OSM opening_hours string: the first HH:MM-HH:MM range, or 24/7. Null when absent/unreadable. */
export function parseHours(oh) {
  if (!oh) return null;
  if (/24\s*\/\s*7/.test(oh)) return ['00:00', '24:00'];
  const m = oh.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const pad = (h, mi) => `${String(h).padStart(2, '0')}:${mi}`;
  const to = pad(m[3], m[4]);
  return [pad(m[1], m[2]), to === '00:00' ? '24:00' : to];
}

const initials = (name) => {
  const w = name.replace(/\(.*?\)/g, '').split(/[\s-]+/).filter((x) => hasLatin(x) && !/^(al|the|of|bank|exchange)$/i.test(x));
  return ((w[0]?.[0] ?? name[0]) + (w[1]?.[0] ?? w[0]?.[1] ?? '')).toUpperCase();
};
function hueFor(key) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 360;
  const s = 0.55, l = 0.3, k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `#${[f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

// ---- build ----------------------------------------------------------------------------------------------------
const groups = new Map();
for (const item of osm.items) {
  const id = identify(item);
  if (!id) continue;
  const g = groups.get(id.key) ?? { ...id, type: item.k === 'b' ? 'bank' : 'exchange', items: [] };
  g.items.push(item);
  groups.set(id.key, g);
}

const toBranch = (item, key, i) => ({
  id: `${key}-${i}`,
  area: areaFor(item),
  emirate: item.em,
  lat: item.la,
  lng: item.lo,
  address: item.ad || '', // OSM often has no street address; the card then shows the area and coordinates only
  hours: parseHours(item.oh),
  osmName: item.n || undefined,
});

const seedKeys = { alansari: 'alansari', alfardan: 'alfardan', lulu: 'lulu', joyalukkas: 'joyalukkas', rostamani: 'rostamani', sharaf: 'sharaf', wallstreet: 'wallstreet', aldahab: 'aldahab' };
const used = new Set();

const profiled = SEED.map((p) => {
  const g = groups.get(seedKeys[p.id]);
  used.add(seedKeys[p.id]);
  return {
    ...p, type: 'exchange', spreadBasis: 'profile', source: g ? 'osm' : 'seed',
    branches: g ? g.items.map((it, i) => toBranch(it, p.id, i)) : p.branches,
  };
});

const MIN_BANK_BRANCHES = 3; // only established retail banks; one-off bank offices would clutter the list
const discovered = [...groups.values()]
  .filter((g) => !used.has(g.key) && (g.type === 'exchange' || g.items.length >= MIN_BANK_BRANCHES))
  .map((g) => ({
    id: `osm-${g.key}`, name: g.name, mark: initials(g.name), hue: hueFor(g.key), type: g.type,
    rating: null, reviewCount: null, // no ratings are invented; connect Google Places to fill these in
    // No published spreads exist for these, so they all use one category average (banks typically charge more than bureaus).
    margin: g.type === 'bank' ? 1.8 : 0.65, fee: { bank: g.type === 'bank' ? 25 : 12 }, bias: {}, spreadBasis: 'category', source: 'osm',
    branches: g.items.map((it, i) => toBranch(it, `osm-${g.key}`, i)),
    reviews: [],
  }));

export const PROVIDERS = [...profiled, ...discovered.sort((a, b) => b.branches.length - a.branches.length)];
