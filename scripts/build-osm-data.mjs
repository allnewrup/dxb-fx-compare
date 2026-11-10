// Fetches real exchange bureaus and bank branches in the UAE from OpenStreetMap (Overpass API) and writes
// src/data/osm-uae.json. Run with: node scripts/build-osm-data.mjs
// Data © OpenStreetMap contributors, ODbL. Be polite to the public Overpass server: this script spaces its requests.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

// Progress is cached so an interrupted run resumes instead of hammering the public server again.
const CACHE = new URL('./.osm-cache.json', import.meta.url);
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : { emirates: {} };
const save = () => writeFileSync(CACHE, JSON.stringify(cache));

const EP = 'https://overpass-api.de/api/interpreter';
const UA = 'dirham-desk-data-build (github.com/allnewrup/dxb-fx-compare)';
// Abu Dhabi's boundary is too large for the public server, so it is the default for anything outside the six below.
const EMIRATES = { Ajman: 3766482, Dubai: 3766483, Fujairah: 3766484, 'Ras Al Khaimah': 3766485, Sharjah: 3766486, 'Umm Al Quwain': 3766487 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(ql) {
  for (let i = 1; i <= 4; i += 1) {
    const res = await fetch(EP, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(ql)}` });
    if (res.ok) return res.json();
    console.log(`  Overpass ${res.status}, retrying in ${i * 20}s`);
    await sleep(i * 20000);
  }
  throw new Error('Overpass kept failing');
}

const SEL = 'nwr["amenity"~"^(bureau_de_change|bank)$"]';
if (!cache.all) {
  cache.all = await overpass(`[out:json][timeout:120];area["ISO3166-1"="AE"][admin_level=2]->.u;(${SEL}(area.u););out center tags;`);
  save();
}
const all = cache.all;
console.log('elements:', all.elements.length);

const emirateOf = new Map();
for (const [name, rel] of Object.entries(EMIRATES)) {
  if (!cache.emirates[name]) {
    await sleep(10000);
    const r = await overpass(`[out:json][timeout:120];area(${3600000000 + rel})->.a;(${SEL}(area.a););out ids;`);
    cache.emirates[name] = r.elements.map((e) => `${e.type}/${e.id}`);
    save();
  }
  cache.emirates[name].forEach((k) => emirateOf.set(k, name));
  console.log(name, cache.emirates[name].length);
}

const T = (t, k) => (t[k] || '').trim();
const out = [];
for (const e of all.elements) {
  const t = e.tags || {};
  const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
  if (la == null || lo == null) continue;
  const emirate = emirateOf.get(`${e.type}/${e.id}`) ?? 'Abu Dhabi';
  const street = [T(t, 'addr:housenumber'), T(t, 'addr:street')].filter(Boolean).join(' ');
  out.push({
    k: t.amenity === 'bank' ? 'b' : 'x',
    n: T(t, 'name:en') || T(t, 'name'),
    br: T(t, 'brand:en') || T(t, 'brand') || T(t, 'operator'),
    la: +la.toFixed(5), lo: +lo.toFixed(5), em: emirate,
    sb: T(t, 'addr:suburb') || T(t, 'addr:neighbourhood') || T(t, 'addr:district') || T(t, 'addr:city'),
    ad: [street, T(t, 'addr:place')].filter(Boolean).join(', '),
    oh: T(t, 'opening_hours'),
  });
}
writeFileSync(new URL('../src/data/osm-uae.json', import.meta.url), JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'OpenStreetMap contributors (ODbL), via Overpass API', items: out }));
console.log('wrote', out.length, 'branches');
