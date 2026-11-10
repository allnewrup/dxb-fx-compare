import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { fmtNum, directionsUrl } from '../lib/pricing.js';
import places from '../data/map-places.json';

// Map languages. Place labels are drawn by us (browser text, so every script renders properly) over a base map
// with all of its own text removed. Names come from real OpenStreetMap / Wikidata data only; a place without a
// name in the chosen language falls back to English. 'osm' is the full OpenFreeMap style with street names.
const MAP_LANGS = [
  { code: 'en', label: 'English' }, { code: 'ar', label: 'العربية · Arabic' }, { code: 'bn', label: 'বাংলা · Bengali' },
  { code: 'ta', label: 'தமிழ் · Tamil' }, { code: 'ml', label: 'മലയാളം · Malayalam' }, { code: 'hi', label: 'हिन्दी · Hindi' },
  { code: 'ur', label: 'اردو · Urdu' }, { code: 'osm', label: 'Standard map · street names (local language)' },
];
const LANG_NAME = { en: 'English', ar: 'Arabic', bn: 'Bengali', ta: 'Tamil', ml: 'Malayalam', hi: 'Hindi', ur: 'Urdu' };
const LABEL_MIN_ZOOM = { 1: 0, 2: 8, 3: 11, 4: 11, 5: 13 };
const FONT = { 1: 16, 2: 14, 3: 12.5, 4: 12, 5: 11.5 };
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const UAE_CENTER = [54.8, 24.85]; // [lng, lat]
const TAG_W = 84, TAG_H = 34; // tag size incl. pointer, used for grouping overlapping tags

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function initialLang() {
  try {
    const saved = localStorage.getItem('dd-map-lang');
    if (saved && MAP_LANGS.some((l) => l.code === saved)) return saved;
  } catch { /* storage unavailable */ }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2).toLowerCase();
  return MAP_LANGS.some((l) => l.code === nav && l.code !== 'osm') ? nav : 'en';
}

let styleCache;
async function baseStyle(lang) {
  styleCache ??= fetch(STYLE_URL).then((r) => { if (!r.ok) throw new Error(`style ${r.status}`); return r.json(); });
  const style = structuredClone(await styleCache);
  if (lang !== 'osm') style.layers = style.layers.filter((l) => l.type !== 'symbol'); // no text, no icons: we draw the labels
  return style;
}

/** Group pins whose tags would overlap at the current zoom. Positions are never nudged: a group is shown as a count bubble. */
function group(map, pins, selectedId, nearRank) {
  const groups = [];
  for (const pin of pins) {
    const pt = map.project([pin.b.lng, pin.b.lat]);
    const keep = pin.b.id === selectedId || nearRank[pin.b.id];
    const g = keep ? null : groups.find((c) => !c.fixed && Math.abs(c.pt.x - pt.x) < TAG_W && Math.abs(c.pt.y - pt.y) < TAG_H);
    if (g) g.members.push(pin);
    else groups.push({ pt, members: [pin], fixed: !!keep });
  }
  return groups;
}

const tagHtml = (t, cls, rank) => `<div class="rate-tag ${cls}">${rank ? `<span class="rk">${rank}</span>` : ''}<span class="mk" style="background:${t.p.hue}">${esc(t.p.mark)}</span><span class="rt">${t.rate.toFixed(t.digits)}</span></div>`;

function boundsOf(points) { // points: [lng, lat][]
  const b = new maplibregl.LngLatBounds(points[0], points[0]);
  points.forEach((p) => b.extend(p));
  return b;
}

export default function MapPanel({ pins, selectedId, onSelect, bestId, selected, user, nearIds = [] }) {
  const el = useRef(null);
  const map = useRef(null);
  const fitKey = useRef('');
  const tagMarkers = useRef([]);
  const labelMarkers = useRef([]);
  const userMarker = useRef(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [zoom, setZoom] = useState(0);
  const [view, setView] = useState('');
  const [gOpen, setGOpen] = useState(false);
  const [lang, setLang] = useState(initialLang);
  const langRef = useRef(lang);
  const nearRank = Object.fromEntries(nearIds.map((id, i) => [id, i + 1]));
  const nearKey = nearIds.join('|');
  const chooseLang = (code) => { setLang(code); try { localStorage.setItem('dd-map-lang', code); } catch { /* ignore */ } };

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let m;
    (async () => {
      try {
        const style = await baseStyle(langRef.current);
        if (cancelled) return;
        m = new maplibregl.Map({
          container: el.current, style, center: UAE_CENTER, zoom: 7, maxZoom: 19, attributionControl: false, dragRotate: false, pitchWithRotate: false,
        });
        m.__standard = langRef.current === 'osm';
        m.touchZoomRotate.disableRotation();
        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
        m.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
        m.on('load', () => { if (!cancelled) { map.current = m; setReady(true); setZoom(m.getZoom()); } });
        m.on('zoomend', () => setZoom(m.getZoom()));
        m.on('moveend', () => setView(`${m.getZoom().toFixed(2)}|${m.getBounds().toArray().join(',')}`));
      } catch (e) {
        if (!cancelled) setMapError('The map could not load. Check your connection and reload.');
      }
    })();
    return () => { cancelled = true; tagMarkers.current.forEach((x) => x.remove()); labelMarkers.current.forEach((x) => x.remove()); m?.remove(); map.current = null; };
  }, []);

  // Switch between the text-free base (labels drawn by us) and the full standard style.
  useEffect(() => {
    langRef.current = lang;
    const m = map.current;
    if (!m) return;
    const wantStandard = lang === 'osm';
    if (m.__standard === wantStandard) return;
    m.__standard = wantStandard;
    baseStyle(lang).then((s) => m.setStyle(s)).catch(() => setMapError('The map style could not load.'));
  }, [lang, ready]);

  // Zoom to the visible branches whenever the set of branches changes (not on every rate refresh).
  useEffect(() => {
    const m = map.current;
    if (!m || !pins.length) return;
    const key = pins.map((x) => x.b.id).sort().join('|');
    if (key === fitKey.current) return;
    fitKey.current = key;
    m.fitBounds(boundsOf(pins.map((x) => [x.b.lng, x.b.lat])), { padding: 40, maxZoom: 15, animate: false });
  }, [pins, ready]);

  // Fly to a branch picked from a card.
  useEffect(() => {
    const m = map.current;
    if (!m || !selected) return;
    m.easeTo({ center: [selected.b.lng, selected.b.lat], zoom: Math.max(m.getZoom(), 15) });
  }, [selectedId, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rate tags: each tip sits on the branch's exact coordinate. Overlapping tags become a count bubble.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tagMarkers.current.forEach((x) => x.remove());
    tagMarkers.current = [];
    const add = (node, lngLat, anchor, offset, z, title) => {
      node.style.zIndex = z;
      if (title) node.title = title;
      tagMarkers.current.push(new maplibregl.Marker({ element: node, anchor, offset }).setLngLat(lngLat).addTo(m));
    };
    for (const g of group(m, pins, selectedId, nearRank)) {
      if (g.members.length === 1) {
        const t = g.members[0];
        const rank = nearRank[t.b.id];
        const cls = `${t.b.id === selectedId ? 'sel' : ''} ${t.p.id === bestId ? 'best' : ''} ${rank ? 'near' : ''}`;
        const node = document.createElement('div');
        node.className = 'rate-wrap';
        node.innerHTML = tagHtml(t, cls, rank);
        node.setAttribute('role', 'button');
        node.tabIndex = 0;
        node.setAttribute('aria-label', `${t.p.name}, ${t.b.area}, rate ${t.rate.toFixed(t.digits)}`);
        node.addEventListener('click', () => onSelect(t.p.id, t.b.id));
        node.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && onSelect(t.p.id, t.b.id));
        add(node, [t.b.lng, t.b.lat], 'bottom', [0, -8], t.b.id === selectedId ? 1000 : rank ? 800 : t.p.id === bestId ? 500 : 10,
          `${t.p.name}, ${t.b.area}: ${t.rate.toFixed(t.digits)}${rank ? ` (#${rank} nearest to you)` : ''}`);
      } else {
        const bounds = boundsOf(g.members.map((t) => [t.b.lng, t.b.lat]));
        const node = document.createElement('div');
        node.className = 'rate-cluster';
        node.textContent = String(g.members.length);
        node.addEventListener('click', () => m.fitBounds(bounds, { padding: 60, maxZoom: 17 }));
        add(node, bounds.getCenter(), 'center', [0, 0], 20, `${g.members.length} branches here. Click to zoom in.`);
      }
    }
  }, [pins, selectedId, bestId, zoom, onSelect, nearKey, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Place labels in the chosen language (cities, towns and districts; the standard map has its own street names).
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    labelMarkers.current.forEach((x) => x.remove());
    labelMarkers.current = [];
    if (lang === 'osm') return;
    const z = m.getZoom(), bounds = m.getBounds();
    const pad = 0.15 * Math.max(bounds.getEast() - bounds.getWest(), bounds.getNorth() - bounds.getSouth());
    const inView = (it) => it.lo > bounds.getWest() - pad && it.lo < bounds.getEast() + pad && it.la > bounds.getSouth() - pad && it.la < bounds.getNorth() + pad;
    const cands = places.items.filter((it) => z >= LABEL_MIN_ZOOM[it.r] && inView(it)).sort((a, b) => a.r - b.r);
    const boxes = [];
    for (const it of cands) {
      if (labelMarkers.current.length >= 160) break;
      const text = it.n[lang] || it.n.en || it.n.ar;
      if (!text) continue;
      const fs = FONT[it.r], pt = m.project([it.lo, it.la]);
      const w = text.length * fs * 0.64 + 10, h = fs + 8;
      const box = [pt.x - w / 2, pt.y - h / 2, pt.x + w / 2, pt.y + h / 2];
      if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
      boxes.push(box);
      const node = document.createElement('div');
      node.className = `place-label r${it.r}`;
      node.style.zIndex = 1;
      node.innerHTML = `<span dir="auto" lang="${it.n[lang] ? lang : 'en'}">${esc(text)}</span>`;
      labelMarkers.current.push(new maplibregl.Marker({ element: node, anchor: 'center' }).setLngLat([it.lo, it.la]).addTo(m));
    }
  }, [lang, view, zoom, ready]);

  // "You are here" marker, then frame the user together with the nearest branches.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    userMarker.current?.remove();
    userMarker.current = null;
    if (!user) return;
    const node = document.createElement('div');
    node.className = 'user-dot';
    node.title = 'You are here';
    node.style.zIndex = 2000;
    userMarker.current = new maplibregl.Marker({ element: node, anchor: 'center' }).setLngLat([user.lng, user.lat]).addTo(m);
    const pts = [[user.lng, user.lat], ...pins.filter((x) => nearRank[x.b.id]).map((x) => [x.b.lng, x.b.lat])];
    m.fitBounds(boundsOf(pts), { padding: 50, maxZoom: 15 });
  }, [user, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const src = selected ? `https://www.google.com/maps?q=${selected.b.lat},${selected.b.lng}&z=16&hl=${lang === 'osm' ? 'en' : lang}&output=embed` : null;

  return (
    <div className="panel flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">Branch map</h2>
        <label className="flex items-center gap-2">
          <span className="label">Map language</span>
          <select id="mapLang" className="field !w-auto max-w-[12.5rem] !py-1.5 text-sm" value={lang} onChange={(e) => chooseLang(e.target.value)}>
            {MAP_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </label>
      </div>

      <div className="well relative overflow-hidden !rounded-xl p-0">
        <div ref={el} className="h-[480px] w-full" role="region" aria-label="Map of filtered exchange branches with rate tags" />
        {mapError && <p className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 bg-white/90 p-4 text-center text-sm text-[#a3261b]" role="alert">{mapError}</p>}
        {!ready && !mapError && <p className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 p-4 text-center text-sm text-steel-600">Loading map…</p>}
        {pins.length === 0 && <p className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 bg-white/85 p-4 text-center text-sm text-steel-600">No branches match the current filters.</p>}
      </div>

      <p className="text-xs text-steel-600">
        {lang === 'osm'
          ? 'Standard map: street and place names appear in each place\'s local language.'
          : lang === 'en' ? 'Place names in English (cities, towns and districts).'
            : `${LANG_NAME[lang]} names exist for ${places.coverage[lang].toLocaleString('en-AE')} of ${places.total.toLocaleString('en-AE')} places on this map. Others are shown in English.`}
      </p>
      <p className="text-xs text-steel-600">
        {pins.length} branch{pins.length === 1 ? '' : 'es'} shown · each tag's pointer marks the branch location and shows the rate for your transaction.{user ? ' Green numbered tags are the branches nearest to you.' : ''} Blue circles group tags that overlap, so click one to zoom in.
      </p>

      {selected && (
        <div className="well flex flex-col gap-1 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="font-display text-lg tracking-wide">{selected.p.name}</strong>
            <span className="font-mono text-sm font-semibold">{fmtNum(selected.rate, selected.digits)}</span>
          </div>
          <p className="text-sm text-steel-600">{selected.b.area === selected.b.emirate ? selected.b.emirate : `${selected.b.area}, ${selected.b.emirate}`}{selected.b.address ? ` · ${selected.b.address}` : ''}</p>
          <a className="btn btn-primary btn-sm mt-1 self-start" href={directionsUrl(selected.b, selected.p)} target="_blank" rel="noreferrer">Get directions ↗</a>
        </div>
      )}

      {/* Google Maps: a button that opens in place and minimizes back into a button. */}
      {!gOpen ? (
        <button type="button" className="btn self-start" onClick={() => setGOpen(true)} aria-expanded="false" aria-controls="gmap-panel">
          Open Google Maps
        </button>
      ) : (
        <div id="gmap-panel" className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-base font-bold uppercase tracking-wide">Google Maps</span>
            <button type="button" className="btn btn-sm" onClick={() => setGOpen(false)} aria-expanded="true" aria-controls="gmap-panel">Minimize ▾</button>
          </div>
          <div className="well overflow-hidden !rounded-xl p-0" style={{ aspectRatio: '4 / 3' }}>
            {src ? (
              <iframe title="Google Maps branch location" src={src} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            ) : <p className="p-4 text-sm text-steel-600">Pick a branch (click a rate tag or "View on map") to see it on Google Maps.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
