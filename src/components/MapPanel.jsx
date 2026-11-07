import React, { useMemo } from 'react';
import { fmtNum, directionsUrl } from '../lib/pricing.js';

const W = 640, H = 600;
const UAE_VIEW = { c: [24.85, 54.8], lat: 1.4 };

// Rough, hand-drawn Arabian Gulf shoreline between Abu Dhabi and Dubai (lng, lat).
const COAST = [[53.6, 24.22], [54.1, 24.3], [54.3, 24.39], [54.52, 24.42], [54.65, 24.52], [54.8, 24.68], [54.95, 24.8], [55.0, 24.88], [55.1, 25.02], [55.15, 25.09], [55.25, 25.2], [55.3, 25.28], [55.5, 25.52], [56.0, 25.6]];
const ISLAND = [[54.28, 24.455], [54.34, 24.505], [54.44, 24.535], [54.53, 24.48], [54.46, 24.425], [54.33, 24.425]];
const CITIES = [{ n: 'Dubai', ll: [25.205, 55.27] }, { n: 'Abu Dhabi', ll: [24.5, 54.4] }];

// Fit the view to the visible pins so every filter combination fills the map.
function fitView(pins) {
  if (!pins.length) return UAE_VIEW;
  const lats = pins.map((x) => x.b.lat), lngs = pins.map((x) => x.b.lng);
  const minLa = Math.min(...lats), maxLa = Math.max(...lats), minLo = Math.min(...lngs), maxLo = Math.max(...lngs);
  const cLat = (minLa + maxLa) / 2, cLng = (minLo + maxLo) / 2;
  const latNeeded = (maxLa - minLa) * 1.45;
  const lngNeeded = ((maxLo - minLo) * Math.cos((cLat * Math.PI) / 180) * 1.45) / (W / H);
  return { c: [cLat, cLng], lat: Math.max(0.07, latNeeded, lngNeeded) };
}

function makeProj(v) {
  const lngSpan = (v.lat * (W / H)) / Math.cos((v.c[0] * Math.PI) / 180);
  return ([lng, lat]) => [((lng - (v.c[1] - lngSpan / 2)) / lngSpan) * W, ((v.c[0] + v.lat / 2 - lat) / v.lat) * H];
}

export default function MapPanel({ pins, selectedId, onSelect, areaId, mode, onMode, bestId, selected }) {
  const proj = useMemo(() => makeProj(fitView(pins)), [pins]);

  const tags = useMemo(() => {
    const sc = pins.length > 14 ? 0.78 : 1;
    const TW = 80 * sc, TH = 24 * sc;
    const items = pins.map((pin) => {
      const [x, y] = proj([pin.b.lng, pin.b.lat]);
      return { ...pin, sc, ax: x, ay: y, x, y: y - 26 * sc };
    });
    for (let it = 0; it < 220; it += 1) {
      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const a = items[i], b = items[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const ox = TW - Math.abs(dx), oy = TH + 3 - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            if (oy < ox) { const m = (oy / 2) * (dy >= 0 ? 1 : -1) || oy / 2; a.y -= m; b.y += m; }
            else { const m = (ox / 2) * (dx >= 0 ? 1 : -1) || ox / 2; a.x -= m; b.x += m; }
          }
        }
      }
      items.forEach((t) => { t.x = Math.min(W - TW / 2 - 4, Math.max(TW / 2 + 4, t.x)); t.y = Math.min(H - 22, Math.max(TH, t.y)); });
    }
    return items;
  }, [pins, proj]);

  const land = `M${COAST.map((c) => proj(c).join(',')).join(' L')} L${proj([57, 24.0]).join(',')} L${proj([53.6, 24.0]).join(',')} Z`;
  const island = `M${ISLAND.map((c) => proj(c).join(',')).join(' L')} Z`;
  const coastLine = `M${COAST.map((c) => proj(c).join(',')).join(' L')}`;
  const src = selected ? `https://www.google.com/maps?q=${selected.b.lat},${selected.b.lng}&z=16&output=embed` : null;

  return (
    <div className="panel flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">Branch map</h2>
        <div className="flex gap-1.5" role="group" aria-label="Map type">
          <button type="button" className="key" aria-pressed={mode === 'rates'} onClick={() => onMode('rates')}>Rate pins</button>
          <button type="button" className="key" aria-pressed={mode === 'google'} onClick={() => onMode('google')}>Google Maps</button>
        </div>
      </div>

      {mode === 'rates' ? (
        <div className="well overflow-hidden !rounded-xl p-0">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Map of filtered exchange branches with rate tags">
            <defs>
              <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fc2db" /><stop offset="1" stopColor="#7fa9c9" /></linearGradient>
              <pattern id="grid" width="64" height="52" patternUnits="userSpaceOnUse"><path d="M64 0H0V52" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1" /></pattern>
              <filter id="tagsh" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" floodOpacity=".4" /></filter>
            </defs>
            <rect width={W} height={H} fill="url(#sea)" />
            <rect width={W} height={H} fill="url(#grid)" />
            <path d={land} fill="#dfe4d6" />
            <path d={island} fill="#dfe4d6" stroke="#b9c3ae" strokeWidth="1.5" />
            <path d={coastLine} fill="none" stroke="#b9c3ae" strokeWidth="2" />
            <text x={W * 0.1} y={H * 0.2} fill="#42708f" fontFamily="Barlow Condensed, sans-serif" fontSize="15" letterSpacing="4" opacity=".8">ARABIAN GULF</text>
            {CITIES.map((c) => { const [x, y] = proj(c.ll); return <text key={c.n} x={x + 60} y={y + 70} fill="#58626e" fontFamily="Barlow Condensed, sans-serif" fontSize="17" fontWeight="600" letterSpacing="2.5">{c.n.toUpperCase()}</text>; })}

            {tags.map((t) => (<g key={`l${t.b.id}`}><line x1={t.ax} y1={t.ay} x2={t.x} y2={t.y + 12 * t.sc} stroke="#1b232b" strokeOpacity=".45" strokeWidth="1" /><circle cx={t.ax} cy={t.ay} r="3" fill={t.p.hue} stroke="#fff" strokeWidth="1.2" /></g>))}
            {[...tags].sort((a, b) => (a.b.id === selectedId) - (b.b.id === selectedId)).map((t) => {
              const sel = t.b.id === selectedId;
              const best = t.p.id === bestId;
              return (
                <g
                  key={t.b.id} role="button" tabIndex={0} aria-label={`${t.p.name}, ${t.b.area}, rate ${t.rate.toFixed(t.digits)}`}
                  transform={`translate(${t.x - 40 * t.sc},${t.y}) scale(${t.sc * (sel ? 1.12 : 1)})`} style={{ cursor: 'pointer' }}
                  onClick={() => onSelect(t.p.id, t.b.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(t.p.id, t.b.id)}
                  filter="url(#tagsh)"
                >
                  <rect width="80" height="24" rx="7" fill="#fbfcfd" stroke={sel ? '#0b5fd8' : best ? '#cfa539' : '#8d97a3'} strokeWidth={sel ? 2.5 : best ? 2 : 1} />
                  <rect width="24" height="24" rx="7" fill={t.p.hue} />
                  <rect x="12" width="12" height="24" fill={t.p.hue} />
                  <text x="12" y="16" textAnchor="middle" fontFamily="Barlow Condensed, sans-serif" fontSize="12" fontWeight="700" fill="#fff">{t.p.mark}</text>
                  <text x="53" y="16.5" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="12.5" fontWeight="600" fill="#1b232b">{t.rate.toFixed(t.digits)}</text>
                </g>
              );
            })}
          </svg>
          {pins.length === 0 && <p className="p-4 text-center text-sm text-steel-600">No branches match the current filters.</p>}
        </div>
      ) : (
        <div className="well overflow-hidden !rounded-xl p-0" style={{ aspectRatio: `${W} / ${H}` }}>
          {src ? (
            <iframe title="Google Maps branch location" src={src} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          ) : <p className="p-4 text-sm">Pick a branch to view it on Google Maps.</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-steel-600">
        <span>{pins.length} branch{pins.length === 1 ? '' : 'es'} shown · tags show the rate for your transaction. Pin positions are approximate.</span>
      </div>

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
    </div>
  );
}
