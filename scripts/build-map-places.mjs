// Builds src/data/map-places.json: UAE place names (cities, towns, districts) with names in the map languages.
// Names come ONLY from OpenStreetMap `name:xx` tags and Wikidata labels. Nothing is machine-translated or invented.
// Run with: node scripts/build-map-places.mjs   (data © OpenStreetMap contributors ODbL; Wikidata is CC0)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const LANGS = ['en', 'ar', 'bn', 'ta', 'ml', 'hi', 'ur'];
const UA = 'dirham-desk-data-build (github.com/allnewrup/dxb-fx-compare)';
const CACHE = new URL('./.places-cache.json', import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(ql) {
  for (let i = 1; i <= 4; i += 1) {
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(ql)}` });
    if (res.ok) return res.json();
    console.log(`  Overpass ${res.status}, retrying in ${i * 20}s`);
    await sleep(i * 20000);
  }
  throw new Error('Overpass kept failing');
}

let osm;
if (existsSync(CACHE)) osm = JSON.parse(readFileSync(CACHE, 'utf8'));
else {
  osm = await overpass('[out:json][timeout:90];area["ISO3166-1"="AE"][admin_level=2]->.u;(node["place"~"^(city|town|suburb|village|neighbourhood|island)$"]["name"](area.u););out tags center;');
  writeFileSync(CACHE, JSON.stringify(osm));
}
console.log('places from OSM:', osm.elements.length);

// Wikidata labels for places that carry a wikidata tag.
const qids = [...new Set(osm.elements.map((e) => e.tags.wikidata).filter((q) => /^Q\d+$/.test(q || '')))];
const wd = {};
for (let i = 0; i < qids.length; i += 50) {
  const batch = qids.slice(i, i + 50);
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join('|')}&props=labels&languages=${LANGS.join('|')}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Wikidata ${res.status}`);
  const j = await res.json();
  for (const [id, ent] of Object.entries(j.entities ?? {})) wd[id] = Object.fromEntries(Object.entries(ent.labels ?? {}).map(([l, v]) => [l, v.value]));
  await sleep(1000);
}
console.log('wikidata entities with labels:', Object.keys(wd).length);

const RANK = { city: 1, town: 2, island: 3, suburb: 3, village: 4, neighbourhood: 5 };
const hasLatin = (s) => /[a-z]/i.test(s);
const items = [];
for (const e of osm.elements) {
  const t = e.tags;
  const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
  if (la == null || lo == null) continue;
  const names = {};
  for (const l of LANGS) {
    const v = (t[`name:${l}`] || wd[t.wikidata]?.[l] || '').trim();
    if (v) names[l] = v;
  }
  if (!names.en && t.name && hasLatin(t.name)) names.en = t.name.trim(); // local name that is already Latin script
  if (!Object.keys(names).length && t.name) names.ar = t.name.trim();   // otherwise the local (Arabic) name
  if (!Object.keys(names).length) continue;
  items.push({ la: +la.toFixed(4), lo: +lo.toFixed(4), r: RANK[t.place] ?? 5, n: names });
}
const coverage = Object.fromEntries(LANGS.map((l) => [l, items.filter((i) => i.n[l]).length]));
console.log('coverage', coverage, 'of', items.length);
writeFileSync(new URL('../src/data/map-places.json', import.meta.url), JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'OpenStreetMap contributors (ODbL) and Wikidata (CC0)', total: items.length, coverage, items }));
