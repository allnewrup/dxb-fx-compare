import React from 'react';
import { EMIRATES } from '../data/seed.js';

const RATINGS = [0, 4.0, 4.3, 4.5];

export default function Sidebar({ s, set }) {
  return (
    <aside aria-label="Filters" className="panel flex flex-col gap-5 p-3 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide">Filters</h2>

      <fieldset>
        <legend className="label mb-2">Type</legend>
        <div className="grid grid-cols-1 gap-2">
          {[['all', 'All'], ['exchange', 'Exchange houses'], ['bank', 'Banks']].map(([v, l]) => (
            <button key={v} type="button" className="key" aria-pressed={s.type === v} onClick={() => set({ type: v })}>{l}</button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-2">Minimum Google rating</legend>
        <div className="grid grid-cols-1 gap-2">
          {RATINGS.map((r) => (
            <button key={r} type="button" className="key" aria-pressed={s.minRating === r} onClick={() => set({ minRating: r })}>
              {r === 0 ? 'Any' : `${r.toFixed(1)}+ ★`}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <span className="label mb-2 block">Availability</span>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="openNow" className="text-sm font-semibold">Open now</label>
          <button id="openNow" type="button" role="switch" aria-checked={s.openNow} onClick={() => set({ openNow: !s.openNow })} className="switch" />
        </div>
        <p className="mt-1.5 text-xs text-steel-500">Uses UAE time (GST).</p>
      </div>

      <fieldset>
        <legend className="label mb-2">Emirate</legend>
        {EMIRATES.map((em) => (
          <label key={em} className="mb-2 flex cursor-pointer items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox" className="peer sr-only" checked={s.emirates[em]}
              onChange={(e) => set({ emirates: { ...s.emirates, [em]: e.target.checked } })}
            />
            <span className="well flex h-6 w-6 items-center justify-center !rounded-md text-sky peer-checked:[&>svg]:opacity-100 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-sky-light">
              <svg width="16" height="16" viewBox="0 0 20 20" className="opacity-0" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
            </span>
            {em}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="sortSel" className="label mb-2 block">Sort by</label>
        <select id="sortSel" className="field" value={s.sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="rate">Best rate</option>
          <option value="high">Rate: high to low</option>
          <option value="low">Rate: low to high</option>
          <option value="rating">Top rated</option>
          <option value="near">Closest</option>
        </select>
      </div>

      <button type="button" className="btn btn-sm mt-auto" onClick={() => set({ query: '', minRating: 0, openNow: false, emirates: Object.fromEntries(EMIRATES.map((e) => [e, true])), type: 'all', sort: 'rate', areaId: 'all' })}>
        Reset filters
      </button>
    </aside>
  );
}
