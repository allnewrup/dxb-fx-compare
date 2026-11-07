import React, { useState } from 'react';
import { Mark, Stars } from './ui.jsx';
import { relTime, reviewsUrl } from '../lib/pricing.js';

export default function ReviewsDrawer({ provider: p, onClose }) {
  const [branchFilter, setBranchFilter] = useState('all');
  if (!p) return (
    <div className="panel p-5 text-sm text-steel-600">Choose “Read Google reviews” on any provider to see its reviews here.</div>
  );
  const branches = [...new Set(p.reviews.map((r) => r.branch))];
  const list = p.reviews.filter((r) => branchFilter === 'all' || r.branch === branchFilter);
  const sample = !p.reviews.some((r) => r.verified);
  return (
    <div className="panel flex flex-col gap-3 p-4" aria-label={`Google reviews for ${p.name}`}>
      <div className="flex items-start gap-3">
        <Mark provider={p} size={44} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold leading-tight tracking-wide">{p.name}</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono text-lg font-semibold">{p.rating.toFixed(1)}</span>
            <Stars value={p.rating} size={16} />
            <span className="text-steel-500">{p.reviewCount.toLocaleString('en-AE')} reviews</span>
          </div>
        </div>
        <button type="button" className="btn btn-sm" onClick={onClose}>Back to map</button>
      </div>

      {sample && (
        <p className="well p-2.5 text-xs text-steel-600">
          These are sample reviews written for this demo, not text copied from Google. Connect the Places proxy in <code className="font-mono">fxDataService</code> to show real ones.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button type="button" className="key" aria-pressed={branchFilter === 'all'} onClick={() => setBranchFilter('all')}>All branches</button>
        {branches.map((b) => <button key={b} type="button" className="key" aria-pressed={branchFilter === b} onClick={() => setBranchFilter(b)}>{b}</button>)}
      </div>

      <ul className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
        {list.map((r, i) => (
          <li key={i} className="well p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{r.name}</span>
              <span className="text-xs text-steel-500">{relTime(r.daysAgo)}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2"><Stars value={r.stars} /><span className="chip">{r.branch} branch</span></div>
            <p className="mt-2 text-sm leading-relaxed">{r.text}</p>
          </li>
        ))}
      </ul>
      <a className="btn btn-primary btn-sm self-start" href={reviewsUrl(p)} target="_blank" rel="noreferrer">See all reviews on Google Maps ↗</a>
    </div>
  );
}
