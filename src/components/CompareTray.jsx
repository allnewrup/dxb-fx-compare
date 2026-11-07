import React from 'react';
import { Mark, Stars, Icon } from './ui.jsx';
import { fmtNum, rateDigits, hoursLabel } from '../lib/pricing.js';

export default function CompareTray({ rows, s, onRemove, onClear }) {
  const verb = s.mode === 'sell' ? 'You receive' : 'You pay';
  const better = s.mode === 'sell' ? Math.max : Math.min;
  const bestTotal = better(...rows.map((r) => r.total));
  const bestRating = Math.max(...rows.map((r) => r.provider.rating));
  const cell = 'px-3 py-2 align-top';
  const rate = (r) => (s.mode === 'sell' ? r.q.sellRate : r.q.buyRate);
  const lines = [
    ['Rate board', (r) => <span className="font-mono">{rate(r).toFixed(rateDigits(rate(r)))}</span>],
    [verb, (r) => <strong className={`font-mono ${r.total === bestTotal ? 'text-go' : ''}`}>{fmtNum(r.total)} {s.to}{r.total === bestTotal ? ' ✓' : ''}</strong>],
    ['Fee', (r) => (s.channel === 'bank' ? `${s.from} ${fmtNum(r.q.feeBase)}` : 'None (cash)')],
    ['Google rating', (r) => <span className={r.provider.rating === bestRating ? 'font-semibold text-go' : ''}>{r.provider.rating.toFixed(1)} ★ · {r.provider.reviewCount.toLocaleString('en-AE')}</span>],
    ['Branches', (r) => `${r.branches.length} in view`],
    ['Nearest branch', (r) => `${r.branch.area}, ${r.branch.emirate}`],
    ['Hours', (r) => hoursLabel(r.branch)],
  ];
  return (
    <section aria-label="Side-by-side comparison" className="fixed inset-x-0 bottom-0 z-30 px-2 pb-2 pt-0 sm:px-4" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))' }}>
      <div className="panel mx-auto max-w-6xl border-t-2 !border-white !bg-steel-100 p-3 shadow-[0_-12px_30px_rgba(20,30,40,.3)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">Comparing {rows.length} providers · {s.from} → {s.to}</h2>
          <button type="button" className="btn btn-sm" onClick={onClear}><Icon.close width="14" height="14" /> Clear</button>
        </div>
        <div className="max-h-[42vh] overflow-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className={`${cell} sticky left-0 bg-steel-100`} />
                {rows.map((r) => (
                  <th key={r.provider.id} className={`${cell} min-w-[150px]`}>
                    <div className="flex items-center gap-2">
                      <Mark provider={r.provider} size={32} />
                      <span className="font-display text-base font-bold leading-tight tracking-wide">{r.provider.name}</span>
                      <button type="button" aria-label={`Remove ${r.provider.name}`} className="ml-auto text-steel-500 hover:text-ink" onClick={() => onRemove(r.provider.id)}><Icon.close width="14" height="14" /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map(([label, fn]) => (
                <tr key={label} className="even:bg-white/40">
                  <th scope="row" className={`${cell} label sticky left-0 bg-steel-100 font-display`}>{label}</th>
                  {rows.map((r) => <td key={r.provider.id} className={cell}>{fn(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
