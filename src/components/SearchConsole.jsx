import React from 'react';
import { CURRENCIES, AREAS } from '../data/seed.js';
import { Switch, Icon } from './ui.jsx';

export default function SearchConsole({ s, set, onRefresh, refreshing }) {
  const pick = (key, other) => (e) => {
    const v = e.target.value;
    if (v === s[other]) set({ from: s.to, to: s.from });
    else set({ [key]: v });
  };
  return (
    <section aria-label="Search console" className="panel p-3 md:p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[auto_minmax(150px,1fr)_auto_minmax(170px,1fr)_auto] xl:items-end">
        {/* Currency pair */}
        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-1">
          <label className="min-w-0 flex-1 xl:w-40">
            <span className="label">From</span>
            <select id="from" className="field mt-1" value={s.from} onChange={pick('from', 'to')}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code} · {c.name}</option>)}
            </select>
          </label>
          <button type="button" className="btn h-[42px] w-[46px] shrink-0 !px-0" onClick={() => set({ from: s.to, to: s.from })} aria-label="Swap currencies">
            <Icon.swap />
          </button>
          <label className="min-w-0 flex-1 xl:w-40">
            <span className="label">To</span>
            <select id="to" className="field mt-1" value={s.to} onChange={pick('to', 'from')}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code} · {c.name}</option>)}
            </select>
          </label>
        </div>

        {/* Amount */}
        <label className="min-w-0">
          <span className="label">Amount to exchange</span>
          <div className="well mt-1 flex items-center gap-2 px-3 py-1.5">
            <span className="font-mono text-sm font-semibold text-steel-500">{s.from}</span>
            <input
              id="amount" inputMode="decimal" className="w-full min-w-0 bg-transparent text-right font-mono text-lg font-semibold outline-none"
              value={s.amountText}
              onChange={(e) => {
                const t = e.target.value.replace(/[^0-9.]/g, '');
                set({ amountText: t, amount: parseFloat(t) || 0 });
              }}
            />
          </div>
        </label>

        {/* Transaction type */}
        <div className="min-w-0">
          <span className="label">Transaction</span>
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Switch id="mode" checked={s.mode === 'buy'} onChange={(v) => set({ mode: v ? 'buy' : 'sell' })} off={`Sell ${s.from}`} on={`Buy ${s.from}`} />
            <Switch id="channel" checked={s.channel === 'bank'} onChange={(v) => set({ channel: v ? 'bank' : 'cash' })} off="Cash" on="Bank transfer" />
          </div>
        </div>

        {/* Area */}
        <label className="min-w-0">
          <span className="label">Emirate / area</span>
          <select id="area" className="field mt-1" value={s.areaId} onChange={(e) => set({ areaId: e.target.value })}>
            <optgroup label="Emirate">
              {AREAS.slice(0, 3).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </optgroup>
            <optgroup label="Dubai neighbourhoods">
              {AREAS.slice(3, 7).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </optgroup>
            <optgroup label="Abu Dhabi neighbourhoods">
              {AREAS.slice(7).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </optgroup>
          </select>
        </label>

        <button type="button" className="btn btn-primary h-[42px] md:col-span-2 xl:col-span-1" onClick={onRefresh} disabled={refreshing}>
          <Icon.refresh className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Fetching…' : 'Refresh live web rates'}
        </button>
      </div>
    </section>
  );
}
