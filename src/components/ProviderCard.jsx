import React from 'react';
import { Mark, Stars, FlipRate, Pill, Icon } from './ui.jsx';
import { fmtNum, rateDigits, ageLabel, isOpenNow, hoursLabel, directionsUrl, mapsUrl } from '../lib/pricing.js';

function estimateLabel(quotedAt, live) {
  if (!live || !quotedAt) return 'Estimate · offline sample rates';
  return `Estimate · market quote ${ageLabel(quotedAt)} old`;
}

export default function ProviderCard({ row, s, quotedAt, live, distKm, selected, onMap, onReviews, compared, compareDisabled, onCompare, badges, savings, activeBranchId, onPickBranch }) {
  const { provider: p, branch: b, branches, q, total } = row;
  const d = rateDigits(Math.max(q.sellRate, q.buyRate));
  const open = isOpenNow(b);
  const active = s.mode === 'sell' ? 'sell' : 'buy';
  const verb = s.mode === 'sell' ? 'You receive' : 'You pay';
  const cur = s.to;
  // What the spread (plus any fee) costs versus converting at the mid-market rate.
  const midTotal = s.amount * q.mid;
  const spreadCost = Math.abs(midTotal - total);
  const spreadPct = midTotal ? (spreadCost / midTotal) * 100 : 0;

  return (
    <article
      className={`panel relative overflow-hidden transition-shadow ${selected ? 'ring-2 ring-sky-light' : ''}`}
      aria-label={p.name}
    >
      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(250px,290px)] md:p-5">
        {/* Identity + branch */}
        <div className="flex min-w-0 flex-col gap-3">
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((x) => <span key={x.text} className={x.cls}>{x.text}</span>)}
            </div>
          )}
          <div className="flex items-start gap-3">
            <Mark provider={p} />
            <div className="min-w-0">
              <h3 className="font-display text-[22px] font-bold leading-tight tracking-wide">{p.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <Stars value={p.rating} />
                <span className="font-semibold">{p.rating.toFixed(1)} ★</span>
                <span className="text-steel-500">({p.reviewCount.toLocaleString('en-AE')} Google reviews)</span>
              </div>
            </div>
          </div>

          <div className="well flex flex-col gap-2 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Icon.pin className="text-sky" />
              <span className="font-semibold">{b.area}, {b.emirate}</span>
              <Pill tone={open ? 'go' : 'off'}>{open ? 'Open now' : 'Closed'}</Pill>
              {distKm != null && <span className="rounded-full bg-sky px-2 py-0.5 text-xs font-semibold text-white">{distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`} from you</span>}
            </div>
            <p className="text-sm text-steel-600">{b.address} · {hoursLabel(b)}</p>
            {branches.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-steel-500">{branches.length} branches</span>
                {branches.slice(0, 6).map((br) => (
                  <button
                    key={br.id} type="button" onClick={() => onPickBranch(p.id, br.id)}
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold shadow-well ${br.id === b.id ? 'bg-sky text-white' : 'bg-steel-200 text-steel-600 hover:bg-steel-300'}`}
                    aria-pressed={br.id === b.id}
                  >{br.area}</button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-sm" onClick={() => onMap(p.id, b.id)}><Icon.pin /> View on map</button>
            <button type="button" className="btn btn-sm" onClick={() => onReviews(p.id)}>Read Google reviews</button>
            <a className="btn btn-sm" href={directionsUrl(b, p)} target="_blank" rel="noreferrer"><Icon.nav /> Get directions</a>
            <a className="text-sm font-semibold text-sky underline-offset-2 hover:underline" href={mapsUrl(b, p)} target="_blank" rel="noreferrer">Google Maps ↗</a>
          </div>
        </div>

        {/* Rate board */}
        <div className="flex min-w-0 flex-col gap-2">
          <div className="board p-3">
            <div className="mb-2 flex items-center justify-between font-display text-[12px] font-semibold uppercase tracking-[.16em] text-steel-400">
              <span>Estimated · 1 {s.from} =</span><span>{s.to}</span>
            </div>
            <div className={`mb-2 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 ${active === 'sell' ? 'bg-white/10 ring-1 ring-led/60' : ''}`}>
              <span className="font-display text-sm font-bold uppercase tracking-wider text-steel-300">Sell {s.from}</span>
              <FlipRate value={q.sellRate} digits={d} size="text-xl" />
            </div>
            <div className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 ${active === 'buy' ? 'bg-white/10 ring-1 ring-led/60' : ''}`}>
              <span className="font-display text-sm font-bold uppercase tracking-wider text-steel-300">Buy {s.from}</span>
              <FlipRate value={q.buyRate} digits={d} size="text-xl" />
            </div>
          </div>

          <div className="well px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="label">{verb}</span>
              <span className="font-mono text-xl font-semibold tabular-nums">{fmtNum(total)} <span className="text-sm text-steel-500">{cur}</span></span>
            </div>
            <div className="mt-0.5 flex flex-wrap justify-between gap-x-2 text-xs text-steel-500">
              <span>{s.channel === 'bank' ? `Transfer fee ${s.from} ${fmtNum(q.feeBase)}` : 'Cash · no fee'}</span>
              {spreadCost > 0.005 && <span>{fmtNum(spreadCost)} {s.to} ({spreadPct.toFixed(2)}%) {s.mode === 'sell' ? 'below' : 'above'} mid-market</span>}
              {savings > 0.005 && <span className="font-semibold text-go">{s.mode === 'sell' ? '+' : '−'}{fmtNum(savings)} {s.to} {s.mode === 'sell' ? 'vs. lowest' : 'vs. priciest'}</span>}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-steel-500">
            <span>{estimateLabel(quotedAt, live)}</span>
            <label className={`flex items-center gap-2 text-sm font-semibold text-ink ${compareDisabled && !compared ? 'opacity-50' : 'cursor-pointer'}`}>
              <input type="checkbox" className="peer sr-only" checked={compared} disabled={compareDisabled && !compared} onChange={() => onCompare(p.id)} />
              <span className="well flex h-6 w-6 items-center justify-center !rounded-md text-sky peer-checked:[&>svg]:opacity-100 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-sky-light">
                <svg width="16" height="16" viewBox="0 0 20 20" className="opacity-0" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
              </span>
              Compare side-by-side
            </label>
          </div>
        </div>
      </div>
    </article>
  );
}
