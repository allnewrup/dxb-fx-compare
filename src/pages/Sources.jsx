import React from 'react';
import PageShell, { H2, P, UL, A, Note, Table } from './PageShell.jsx';
import { Link } from '../lib/router.jsx';
import { PAGES, SITE } from '../data/site.js';
import { ageLabel } from '../lib/pricing.js';

const me = PAGES.find((p) => p.path === '/sources');
/* global __OSM_FETCHED__, __PLACES_FETCHED__, __BUILD_TIME__ */
export const fmtUae = (d) => new Date(d).toLocaleString('en-AE', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' UAE time';
export const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'long', year: 'numeric' });

const DESCRIBE = {
  yahoo: { what: 'Minute-level spot quotes for the major currencies (USD, EUR, GBP, INR, PHP, PKR, SAR against the dirham)', cadence: 'Live, to the minute, while markets are open', link: 'https://finance.yahoo.com', note: 'Unofficial public endpoint, reached through our own server because browsers cannot call it directly.' },
  ecb: { what: 'European Central Bank euro reference rates for about 30 currencies, via the Frankfurter service', cadence: 'Once per working day, around 16:00 CET', link: 'https://www.frankfurter.app', note: 'Reference rates; not updated at weekends or ECB holidays.' },
  erapi: { what: 'Daily reference rates for about 160 currencies', cadence: 'Once per day', link: 'https://www.exchangerate-api.com', note: 'Free open-access tier; requires attribution.' },
  fawaz: { what: 'Community-maintained daily rates for 300+ currencies', cadence: 'Once per day', link: 'https://github.com/fawazahmed0/exchange-api', note: 'Open data served from a public CDN.' },
};

export default function Sources({ data }) {
  const status = data.sourceStatus ?? [];
  const exchange = data.providers.filter((p) => p.type === 'exchange').length;
  const banks = data.providers.length - exchange;
  const branches = data.providers.reduce((a, p) => a + p.branches.length, 0);
  return (
    <PageShell path={me.path} title={me.title} desc={me.desc}>
      <P>{SITE.name} combines live market rates with a snapshot of branch data. This page lists every source and shows when each was last updated. For how the numbers are combined, read the <Link to="/methodology" className="font-semibold text-sky underline underline-offset-2">methodology</Link>.</P>

      <H2>Market exchange rates: live status</H2>
      {data.updatedAt ? (
        <P>Your browser last fetched rates at <strong className="text-ink">{fmtUae(data.updatedAt)}</strong>. The page refreshes them every 60 seconds while it is open. "Quote as of" is the time the source itself published its dirham quote, which for daily sources can be many hours earlier.</P>
      ) : (
        <Note><strong>Live rates have not loaded in this session.</strong> The page is showing a built-in offline sample table. Reload to try again.</Note>
      )}
      {status.length > 0 && (
        <Table
          head={['Source', 'This session', 'Quote as of', 'Age']}
          rows={status.map((s) => [
            s.label,
            s.ok ? <span className="font-semibold text-go">Reachable</span> : <span className="font-semibold text-[#a3261b]">Unavailable</span>,
            s.asOf ? fmtUae(s.asOf) : '—',
            s.asOf ? ageLabel(new Date(s.asOf)) : '—',
          ])}
        />
      )}

      <H2>Market-rate sources</H2>
      <Table
        head={['Source', 'What it provides', 'Update rhythm', 'Notes']}
        rows={['yahoo', 'ecb', 'erapi', 'fawaz'].map((id) => {
          const d = DESCRIBE[id];
          const label = status.find((s) => s.id === id)?.label ?? id;
          return [<A key={id} href={d.link}>{label}</A>, d.what, d.cadence, d.note];
        })}
      />
      <P>All four are queried each time, cross-checked, and a source whose quote disagrees with the others is discarded. The page shows which sources agreed for the pair you are viewing.</P>

      <H2>Exchange houses, banks and branches</H2>
      <Table
        head={['Dataset', 'Source', 'Extracted', 'Contents']}
        rows={[
          ['Providers, branches, addresses, hours', <A key="o" href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</A>, fmtUae(__OSM_FETCHED__), `${exchange} exchange houses and ${banks} banks, ${branches.toLocaleString('en')} branches, collected through the Overpass API. Licence: ODbL.`],
          ['Place names on the map in other languages', <span key="w">OpenStreetMap and <A href="https://www.wikidata.org">Wikidata</A> (CC0)</span>, fmtUae(__PLACES_FETCHED__), 'City, town and district names in Arabic, Bengali, Tamil, Malayalam, Hindi and Urdu where they exist. Missing names fall back to English.'],
          ['Map background', <A key="f" href="https://openfreemap.org">OpenFreeMap</A>, 'Live', 'Vector map tiles from OpenStreetMap data, loaded by your browser when the map opens.'],
        ]}
      />
      <P>Branch data is a snapshot, refreshed when we rebuild it, not a live feed. A branch may have opened, closed, moved or changed its hours since. Banks are listed only for brands with three or more branches.</P>

      <H2>Ratings and reviews</H2>
      <Note>Ratings and review texts for the first eight exchange houses are a <strong>pre-loaded illustrative sample, not live Google data</strong>. All other providers have no rating. For current ratings use the Google Maps link on each card.</Note>

      <H2>Provider spreads and fees</H2>
      <P>Provider spreads and bank-transfer fees are modelled by {SITE.name}, not collected from the providers; see "Where the spreads come from" in the <Link to="/methodology" className="font-semibold text-sky underline underline-offset-2">methodology</Link>.</P>

      <H2>Other services the site uses</H2>
      <UL>
        <li><A href="https://fonts.google.com">Google Fonts</A> for typefaces.</li>
        <li><A href="https://www.anthropic.com">Anthropic's Claude</A> for the optional Ask Xchange assistant.</li>
        <li><A href="https://vercel.com">Vercel</A> for hosting.</li>
        <li>Directions and "Google Maps" links open Google Maps in a new tab; nothing is sent to Google until you click.</li>
      </UL>

      <H2>This site</H2>
      <P>Current version built {fmtUae(__BUILD_TIME__)}. Spot a source that is stale or wrong? <Link to="/contact" className="font-semibold text-sky underline underline-offset-2">Tell us</Link>.</P>
    </PageShell>
  );
}
