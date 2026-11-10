import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { AREAS } from './data/seed.js';
import { getSnapshot, refreshLiveRates, enrichFromGoogle } from './services/fxDataService.js';
import { quote, convert, areaMatches, isOpenNow, km, fmtNum, rateDigits, ageLabel, guessHomeCurrency, emiratesForArea, areaForEmirates } from './lib/pricing.js';
import SearchConsole from './components/SearchConsole.jsx';
import Sidebar from './components/Sidebar.jsx';
import SortTabs from './components/SortTabs.jsx';
import ProviderCard from './components/ProviderCard.jsx';
import MapPanel from './components/MapPanel.jsx';
import ReviewsDrawer from './components/ReviewsDrawer.jsx';
import CompareTray from './components/CompareTray.jsx';
import { QrBadge, QrModal } from './components/QrBadge.jsx';

const BADGE = {
  rate: { text: '★ Best rate', cls: 'badge-gold' },
  rating: { text: 'Top rated', cls: 'badge-steel' },
  branches: { text: 'Most branches', cls: 'badge-copper' },
};

export default function App() {
  const [data, setData] = useState(getSnapshot);
  const [s, setS] = useState(() => {
    const home = guessHomeCurrency(); // visitors start as "foreign cash -> AED"; UAE locales keep AED -> INR
    return {
    from: home ?? 'AED', to: home ? 'AED' : 'INR', amount: 5000, amountText: '5000', mode: 'sell', channel: 'cash', areaId: 'all',
    minRating: 0, openNow: false, emirates: { Dubai: true, 'Abu Dhabi': true }, sort: 'rate',
    };
  });
  const set = useCallback((patch) => setS((p) => {
    const next = { ...p, ...patch };
    // One source of truth for location: the area dropdown and the emirate ticks always agree.
    if ('areaId' in patch && !('emirates' in patch)) next.emirates = emiratesForArea(patch.areaId);
    else if ('emirates' in patch && !('areaId' in patch)) next.areaId = areaForEmirates(patch.emirates, p.areaId);
    return next;
  }), []);
  const [compare, setCompare] = useState([]);
  const [picked, setPicked] = useState({});
  const [sel, setSel] = useState(null); // {pid, bid}
  const [panel, setPanel] = useState('map');
  const [mapMode, setMapMode] = useState('rates');
  const [reviewPid, setReviewPid] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState({ tone: 'info', text: 'Fetching live market rates…' });
  const panelRef = useRef(null);

  const fmtTime = (d) => d.toLocaleString('en-AE', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  const providersRef = useRef(data.providers);
  providersRef.current = data.providers;

  const refresh = useCallback(async (silent = false) => {
    setRefreshing(true);
    try {
      const live = await refreshLiveRates();
      const enriched = await enrichFromGoogle(providersRef.current);
      setData((d) => ({ ...d, providers: enriched.providers, mid: live.mid, updatedAt: live.updatedAt, quotedAt: live.quotedAt, quoteTimes: live.quoteTimes, liveHost: live.host, source: { ...d.source, rates: live.host, places: enriched.enriched ? 'google' : 'seed' } }));
      setStatus({ tone: 'ok', text: `Market rate from ${live.host}, fetched ${fmtTime(live.updatedAt)} (UAE time).` });
    } catch (e) {
      setStatus({ tone: 'err', text: silent ? `${e.message} Retrying every minute.` : e.message });
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Pull live rates on load, then keep them fresh every 60 seconds.
  useEffect(() => {
    refresh(true);
    const id = setInterval(() => refresh(true), 60000);
    return () => clearInterval(id);
  }, [refresh]);

  const area = AREAS.find((a) => a.id === s.areaId);

  // Timestamp of the market quote behind THIS pair (oldest of the two currencies, since both feed the cross rate).
  const pairQuotedAt = useMemo(() => {
    const times = data.quoteTimes ? [s.from, s.to].map((c) => data.quoteTimes[c]).filter(Boolean) : [];
    return times.length ? new Date(Math.min(...times.map((d) => d.getTime()))) : data.quotedAt;
  }, [data.quoteTimes, data.quotedAt, s.from, s.to]);
  const quoteAgeMin = pairQuotedAt ? (Date.now() - pairQuotedAt.getTime()) / 60000 : 0;
  const quoteStale = quoteAgeMin > 30;

  // ---- derive rows -------------------------------------------------------
  const rows = useMemo(() => {
    const out = [];
    for (const p of data.providers) {
      if (p.rating < s.minRating) continue;
      const branches = p.branches.filter((b) => s.emirates[b.emirate] && areaMatches(b, s.areaId) && (!s.openNow || isOpenNow(b)));
      if (!branches.length) continue;
      const withDist = branches.map((b) => ({ b, d: km(area.center, [b.lat, b.lng]) })).sort((x, y) => x.d - y.d);
      const branch = branches.find((b) => b.id === picked[p.id]) ?? withDist[0].b;
      const q = quote(p, data.mid, s.from, s.to, s.channel);
      out.push({ provider: p, branches, branch, nearestKm: withDist[0].d, q, total: convert(q, s.amount, s.mode) });
    }
    return out;
  }, [data, s, picked, area]);

  const specificArea = !['all', 'dubai', 'abudhabi'].includes(s.areaId);
  const sorted = useMemo(() => {
    const r = [...rows];
    if (s.sort === 'rate') r.sort((a, b) => (s.mode === 'sell' ? b.total - a.total : a.total - b.total));
    else if (s.sort === 'rating') r.sort((a, b) => b.provider.rating - a.provider.rating || b.provider.reviewCount - a.provider.reviewCount);
    else r.sort((a, b) => (specificArea ? a.nearestKm - b.nearestKm : b.branches.length - a.branches.length) || b.provider.rating - a.provider.rating);
    return r;
  }, [rows, s.sort, s.mode, specificArea]);

  const stats = useMemo(() => {
    if (!rows.length) return null;
    const totals = rows.map((r) => r.total);
    const bestRate = rows.reduce((a, b) => ((s.mode === 'sell' ? b.total > a.total : b.total < a.total) ? b : a));
    const topRated = rows.reduce((a, b) => (b.provider.rating > a.provider.rating ? b : a));
    const mostBr = rows.reduce((a, b) => (b.branches.length > a.branches.length ? b : a));
    const closest = rows.reduce((a, b) => (b.nearestKm < a.nearestKm ? b : a));
    return { min: Math.min(...totals), max: Math.max(...totals), bestRate, topRated, mostBr, closest };
  }, [rows, s.mode]);

  const summary = stats ? {
    rate: { value: `${fmtNum(stats.bestRate.total)} ${s.to}`, sub: stats.bestRate.provider.name },
    rating: { value: `${stats.topRated.provider.rating.toFixed(1)} ★ on Google`, sub: stats.topRated.provider.name },
    near: specificArea
      ? { value: `${stats.closest.nearestKm.toFixed(1)} km from ${area.label}`, sub: stats.closest.provider.name }
      : { value: `${stats.mostBr.branches.length} branches`, sub: stats.mostBr.provider.name },
  } : { rate: { value: '—', sub: '' }, rating: { value: '—', sub: '' }, near: { value: '—', sub: '' } };

  const pins = useMemo(() => rows.flatMap((r) => r.branches.map((b) => {
    const rate = s.mode === 'sell' ? r.q.sellRate : r.q.buyRate;
    return { p: r.provider, b, rate, digits: rateDigits(Math.max(r.q.sellRate, r.q.buyRate)) };
  })), [rows, s.mode]);
  const selected = pins.find((x) => x.p.id === sel?.pid && x.b.id === sel?.bid) ?? null;

  const onMap = (pid, bid) => {
    setSel({ pid, bid }); setPanel('map');
    if (window.innerWidth < 1024) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const onReviews = (pid) => {
    setReviewPid(pid); setPanel('reviews');
    if (window.innerWidth < 1024) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const toggleCompare = (id) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 4 ? [...c, id] : c));
  // Drop selections that the filters have hidden.
  useEffect(() => { setCompare((c) => c.filter((id) => rows.some((r) => r.provider.id === id))); }, [rows]);
  const compareRows = compare.map((id) => rows.find((r) => r.provider.id === id)).filter(Boolean);

  const badgeFor = (r) => {
    if (!stats) return [];
    const b = [];
    if (r === stats.bestRate) b.push(BADGE.rate);
    if (r === stats.topRated) b.push(BADGE.rating);
    if (r === stats.mostBr && r.branches.length > 1) b.push(BADGE.branches);
    return b;
  };

  const toneCls = { info: 'text-steel-600', ok: 'text-go', err: 'text-[#a3261b]' }[status.tone];

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-4 sm:px-6" style={{ paddingBottom: compareRows.length >= 2 ? '22rem' : '2.5rem' }}>
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="badge-gold !rounded-xl !px-3 !py-1.5 !text-2xl">AED</span>
          <div>
            <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-wide">Dirham Desk</h1>
            <p className="text-sm text-steel-600">Compare money exchange rates across Dubai &amp; Abu Dhabi</p>
          </div>
        </div>
        <QrBadge onOpen={() => setQrOpen(true)} />
      </header>

      <div className="mb-2 flex flex-wrap items-center gap-2" role="group" aria-label="Quick setup">
        <span className="label">I am</span>
        <button type="button" className="key" aria-pressed={s.to === 'AED' && s.mode === 'sell'} onClick={() => set({ from: guessHomeCurrency() ?? 'USD', to: 'AED', mode: 'sell' })}>Visiting: foreign cash → AED</button>
        <button type="button" className="key" aria-pressed={s.from === 'AED' && s.mode === 'sell'} onClick={() => set({ from: 'AED', to: s.to === 'AED' ? 'INR' : s.to, mode: 'sell' })}>Living here: sending AED home</button>
      </div>

      <SearchConsole s={s} set={set} onRefresh={() => refresh(false)} refreshing={refreshing} />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="board flex items-center gap-3 px-3 py-1.5" aria-label="Market mid rate">
          <span className="font-display text-xs font-semibold uppercase tracking-[.16em] text-steel-400">{data.liveHost ? 'Live market' : 'Offline sample'}</span>
          <span className="font-mono text-sm font-semibold text-led">1 {s.from} = {(data.mid[s.to] / data.mid[s.from]).toFixed(rateDigits(data.mid[s.to] / data.mid[s.from]))} {s.to}</span>
          {pairQuotedAt && <span className={`text-xs ${quoteStale ? 'font-semibold text-led' : 'text-steel-400'}`}>quote {fmtTime(pairQuotedAt)} · {ageLabel(pairQuotedAt)} old</span>}
        </div>
        <p className={`min-w-0 flex-1 text-sm ${toneCls}`} role="status" aria-live="polite">{status.text}</p>
      </div>

      {quoteStale && (
        <p className="mt-2 rounded-lg border border-brass-400 bg-brass-200/60 px-3 py-2 text-sm text-brass-600" role="alert">
          <strong>The market quote for {s.from}/{s.to} is {ageLabel(pairQuotedAt)} old.</strong> Currency markets may be closed (weekends) or the feed may be delayed, so treat the numbers below as rough guides.
        </p>
      )}

      <div className="mt-2 rounded-lg border border-steel-300 bg-white/60 px-3 py-2 text-sm text-steel-600">
        <strong className="text-ink">These are estimates, not counter rates.</strong> Each provider's figure is the market rate plus that provider's typical spread. Exchange houses don't publish live rates, so the final rate and fees are set at the counter.
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_minmax(0,440px)]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Sidebar s={s} set={set} />
        </div>

        <main className="flex min-w-0 flex-col gap-3" aria-label="Results">
          <SortTabs sort={s.sort} set={set} summary={summary} />
          <p className="px-1 text-sm text-steel-600">
            {sorted.length} provider{sorted.length === 1 ? '' : 's'} · {fmtNum(s.amount, 0)} {s.from} to {s.to} · {s.mode === 'sell' ? 'selling' : 'buying'} {s.from} · {s.channel === 'bank' ? 'bank transfer' : 'cash'}
          </p>
          {sorted.length === 0 && (
            <div className="panel p-8 text-center">
              <p className="font-display text-xl font-bold uppercase">No exchange houses match</p>
              <p className="mt-1 text-sm text-steel-600">Loosen the rating, open-now or emirate filters to see more.</p>
            </div>
          )}
          {sorted.map((r) => (
            <ProviderCard
              key={r.provider.id} row={r} s={s} quotedAt={pairQuotedAt} live={!!data.liveHost}
              selected={sel?.pid === r.provider.id}
              badges={badgeFor(r)}
              savings={stats ? (s.mode === 'sell' ? r.total - stats.min : stats.max - r.total) : 0}
              compared={compare.includes(r.provider.id)} compareDisabled={compare.length >= 4}
              onCompare={toggleCompare} onMap={onMap} onReviews={onReviews}
              onPickBranch={(pid, bid) => { setPicked((x) => ({ ...x, [pid]: bid })); setSel({ pid, bid }); }}
            />
          ))}
          {compare.length === 1 && <p className="text-center text-sm text-steel-600">Select at least one more provider to open the side-by-side tray (up to 4).</p>}
        </main>

        <div ref={panelRef} className="min-w-0 lg:col-span-2 xl:col-span-1 xl:sticky xl:top-4 xl:self-start">
          <div className="mb-2 flex gap-2" role="tablist" aria-label="Side panel">
            <button role="tab" type="button" className="key" aria-selected={panel === 'map'} onClick={() => setPanel('map')}>Map</button>
            <button role="tab" type="button" className="key" aria-selected={panel === 'reviews'} onClick={() => setPanel('reviews')}>Google reviews</button>
          </div>
          {panel === 'map' ? (
            <MapPanel pins={pins} selectedId={sel?.bid} selected={selected} onSelect={onMap} areaId={s.areaId} mode={mapMode} onMode={setMapMode} bestId={stats?.bestRate.provider.id} />
          ) : (
            <ReviewsDrawer provider={data.providers.find((p) => p.id === reviewPid)} onClose={() => setPanel('map')} />
          )}
        </div>
      </div>

      <section aria-label="What to bring" className="panel mt-6 p-4 text-sm leading-relaxed text-steel-600">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-ink">What to bring</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong className="text-ink">Photo ID.</strong> Exchange houses in the UAE ask for your passport (visitors) or Emirates ID (residents) for every transaction.</li>
          <li><strong className="text-ink">Cash vs. card.</strong> Cash gets the board rate with no fee here; bank transfers add a flat fee but a tighter spread. Some branches take cards, so ask first.</li>
          <li><strong className="text-ink">Limits.</strong> Larger amounts can trigger extra ID or source-of-funds checks. Ask the branch before you travel with a large sum.</li>
          <li><strong className="text-ink">Opening hours.</strong> The hours shown are typical sample hours, so confirm them with Google Maps or the branch.</li>
        </ul>
      </section>

      <footer className="mt-6 space-y-2 text-xs leading-relaxed text-steel-600">
        <p><strong className="text-ink">About Dirham Desk.</strong> Dirham Desk is an independent comparison tool. It is not an exchange house, it can't exchange money for you, and it is not affiliated with the providers listed.</p>
        <p>Indicative rates only. Market rates come from a public feed (Yahoo Finance FX spot) when you load or refresh the page. Provider rates are modelled from each exchange house's typical spread, and ratings, review counts, pins and reviews are a pre-loaded sample. Confirm the final rate and fee at the counter or in the provider's app before you transact.</p>
      </footer>

      {compareRows.length >= 2 && <CompareTray rows={compareRows} s={s} onRemove={toggleCompare} onClear={() => setCompare([])} />}
      {qrOpen && <QrModal onClose={() => setQrOpen(false)} />}
    </div>
  );
}
