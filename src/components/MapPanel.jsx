import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fmtNum, directionsUrl } from '../lib/pricing.js';

const UAE_CENTER = [24.85, 54.8];
const TAG_W = 84, TAG_H = 34; // tag size incl. pointer, used for grouping overlapping tags

/** Group pins whose tags would overlap at this zoom. Positions are never nudged: a group is shown as a count bubble. */
function group(map, pins, selectedId) {
  const z = map.getZoom();
  const groups = [];
  for (const pin of pins) {
    const pt = map.project([pin.b.lat, pin.b.lng], z);
    const g = pin.b.id === selectedId ? null : groups.find((c) => !c.fixed && Math.abs(c.pt.x - pt.x) < TAG_W && Math.abs(c.pt.y - pt.y) < TAG_H);
    if (g) g.members.push(pin);
    else groups.push({ pt, members: [pin], fixed: pin.b.id === selectedId });
  }
  return groups;
}

const tagHtml = (t, cls) => `<div class="rate-tag ${cls}"><span class="mk" style="background:${t.p.hue}">${t.p.mark}</span><span class="rt">${t.rate.toFixed(t.digits)}</span></div>`;

export default function MapPanel({ pins, selectedId, onSelect, bestId, selected }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const fitKey = useRef('');
  const [zoom, setZoom] = useState(0);
  const [gOpen, setGOpen] = useState(false);

  // Create the map once.
  useEffect(() => {
    const m = L.map(el.current, { center: UAE_CENTER, zoom: 8, zoomControl: true, scrollWheelZoom: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    m.on('zoomend', () => setZoom(m.getZoom()));
    map.current = m;
    setZoom(m.getZoom());
    return () => { m.remove(); map.current = null; };
  }, []);

  // Zoom to the visible branches whenever the set of branches changes (not on every rate refresh).
  useEffect(() => {
    const m = map.current;
    if (!m || !pins.length) return;
    const key = pins.map((x) => x.b.id).sort().join('|');
    if (key === fitKey.current) return;
    fitKey.current = key;
    m.fitBounds(L.latLngBounds(pins.map((x) => [x.b.lat, x.b.lng])), { padding: [40, 40], maxZoom: 15, animate: false });
  }, [pins]);

  // Fly to a branch picked from a card.
  useEffect(() => {
    const m = map.current;
    if (!m || !selected) return;
    m.setView([selected.b.lat, selected.b.lng], Math.max(m.getZoom(), 15), { animate: true });
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw tags: each tip sits on the branch's exact coordinate.
  useEffect(() => {
    const m = map.current, lg = layer.current;
    if (!m || !lg) return;
    lg.clearLayers();
    for (const g of group(m, pins, selectedId)) {
      if (g.members.length === 1) {
        const t = g.members[0];
        const cls = `${t.b.id === selectedId ? 'sel' : ''} ${t.p.id === bestId ? 'best' : ''}`;
        L.marker([t.b.lat, t.b.lng], {
          icon: L.divIcon({ className: 'rate-tag-icon', html: tagHtml(t, cls), iconSize: [TAG_W, 26], iconAnchor: [TAG_W / 2, TAG_H - 2] }),
          zIndexOffset: t.b.id === selectedId ? 1000 : t.p.id === bestId ? 500 : 0,
          title: `${t.p.name}, ${t.b.area}: ${t.rate.toFixed(t.digits)}`,
        }).on('click', () => onSelect(t.p.id, t.b.id)).addTo(lg);
      } else {
        const ll = L.latLngBounds(g.members.map((t) => [t.b.lat, t.b.lng]));
        L.marker(ll.getCenter(), {
          icon: L.divIcon({ className: 'rate-tag-icon', html: `<div class="rate-cluster">${g.members.length}</div>`, iconSize: [38, 38], iconAnchor: [19, 19] }),
          title: `${g.members.length} branches here. Click to zoom in.`,
        }).on('click', () => m.fitBounds(ll, { padding: [60, 60], maxZoom: 17 })).addTo(lg);
      }
    }
  }, [pins, selectedId, bestId, zoom, onSelect]);

  const src = selected ? `https://www.google.com/maps?q=${selected.b.lat},${selected.b.lng}&z=16&output=embed` : null;

  return (
    <div className="panel flex flex-col gap-3 p-3">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide">Branch map</h2>

      <div className="well relative overflow-hidden !rounded-xl p-0">
        <div ref={el} className="h-[480px] w-full" role="region" aria-label="Map of filtered exchange branches with rate tags" />
        {pins.length === 0 && <p className="absolute inset-x-0 top-1/2 z-[500] -translate-y-1/2 bg-white/85 p-4 text-center text-sm text-steel-600">No branches match the current filters.</p>}
      </div>

      <p className="text-xs text-steel-600">
        {pins.length} branch{pins.length === 1 ? '' : 'es'} shown · each tag's pointer marks the branch location and shows the rate for your transaction. Blue circles group tags that overlap, so click one to zoom in.
      </p>

      {selected && (
        <div className="well flex flex-col gap-1 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="font-display text-lg tracking-wide">{selected.p.name}</strong>
            <span className="font-mono text-sm font-semibold">{fmtNum(selected.rate, selected.digits)}</span>
          </div>
          <p className="text-sm text-steel-600">{selected.b.area}, {selected.b.emirate} · {selected.b.address}</p>
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
