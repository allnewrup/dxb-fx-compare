import React from 'react';
import PageShell, { H2, H3, P, UL, Note, Table } from './PageShell.jsx';
import { Link } from '../lib/router.jsx';
import { PAGES, SITE } from '../data/site.js';

const me = PAGES.find((p) => p.path === '/methodology');
const code = 'rounded bg-steel-200 px-1.5 py-0.5 font-mono text-[13px] text-ink';

export default function Methodology() {
  return (
    <PageShell path={me.path} title={me.title} desc={me.desc}>
      <P>{SITE.name} shows an <strong className="text-ink">estimate</strong> of what you would get at each provider. This page explains every step, so you can judge how far to trust a number. In one sentence: <em>we take the market rate, cross-checked across several feeds, and apply a typical spread for each provider.</em> We do not read live prices from any exchange house.</P>

      <H2>Step 1: the market (mid-market) rate</H2>
      <P>The mid-market rate is the "real" rate between two currencies, halfway between what banks buy and sell at. We collect it from four independent public sources (listed with update times on the <Link to="/sources" className="font-semibold text-sky underline underline-offset-2">sources page</Link>) and cross-check them for every currency:</P>
      <UL>
        <li>Each source's quote is converted to units of that currency per 1 US dollar, with the time it was published.</li>
        <li><strong className="text-ink">Outliers are discarded.</strong> When three or more sources quote a currency, a quote is kept only if at least one other source agrees with it. "Agrees" means within 0.25%, plus an allowance for genuine market movement between quotes taken at different times (0.2% per square-root hour of difference, capped at 1.5%). A live spot quote can therefore differ more from a daily fix taken hours earlier than from one taken at the same moment.</li>
        <li><strong className="text-ink">The freshest surviving quote wins.</strong> Ties go to the more precise source (live spot, then ECB, then open.er-api.com, then fawazahmed0).</li>
        <li>Every rate is expressed against the dirham (AED), and any pair is a cross rate: <code className={code}>rate(from→to) = AED-rate(to) ÷ AED-rate(from)</code>.</li>
        <li>The page shows which source won, how many agreed, which were discarded, and how old the quote is. For currencies that only have a daily reference rate (most of them outside the major pairs), it says so and the rate can be many hours old. If a quote is older than 30 minutes and is not a daily rate, the page warns you.</li>
        <li>If no live source can be reached, the page falls back to a built-in sample table and labels it <em>Offline sample</em>.</li>
      </UL>
      <P>The page asks for fresh rates when it loads and then every 60 seconds. The sources themselves update at their own pace: some every minute, some once a day.</P>

      <H2>Step 2: each provider's estimate</H2>
      <P>A provider's rate is the market rate moved against you by that provider's <strong className="text-ink">spread</strong>, which is how exchange houses and banks earn money on a transaction:</P>
      <UL>
        <li>Selling currency to a provider (you receive less than the market rate): <code className={code}>sell rate = mid × (1 − spread)</code></li>
        <li>Buying currency from a provider (you pay more than the market rate): <code className={code}>buy rate = mid × (1 + spread)</code></li>
        <li><code className={code}>spread = provider margin + currency adjustment</code>, never below 0.15%.</li>
        <li><strong className="text-ink">Bank transfer</strong> mode lowers the spread by 0.2 percentage points and adds a flat fee in dirhams (converted to your currency). <strong className="text-ink">Cash</strong> mode has no fee.</li>
        <li>The amount you receive (when selling) is <code className={code}>(amount − fee) × sell rate</code>. The amount you pay (when buying) is <code className={code}>amount × buy rate + fee × buy rate</code>.</li>
      </UL>
      <H3>Worked example (illustrative numbers)</H3>
      <P>Market rate 3.6700 AED per US dollar and a provider spread of 0.55%. You sell 1,000 USD for cash: sell rate = 3.6700 × (1 − 0.0055) = 3.6498, so you receive about 3,649.82 AED. At a 1.8% spread the same 1,000 USD gives about 3,603.94 AED, a difference of roughly 46 AED.</P>

      <H2>Where the spreads come from</H2>
      <P>This is the least certain part, so we are plain about it:</P>
      <Table
        head={['Providers', 'Spread used', 'Basis']}
        rows={[
          ['Eight well-known exchange houses', '0.50% to 0.80%, with small per-currency adjustments, and a bank-transfer fee of AED 10 to 16', 'Our own modelling of typical retail spreads. Not measured from any provider\'s counter and not supplied by the providers. The page marks these as a provider-specific typical spread.'],
          ['All other exchange houses', '0.65%, bank-transfer fee AED 12', 'One category average. The page marks these as a category-average spread. It cannot tell one of them from another.'],
          ['Banks', '1.8%, bank-transfer fee AED 25', 'One category average: banks typically charge a wider spread than exchange bureaus.'],
        ]}
      />
      <Note><strong>What this means for you:</strong> the <em>ranking</em> among the eight profiled exchange houses reflects our assumptions, not live prices. Differences between providers in the category-average group are zero by construction, so treat the list as "who is near you and roughly how banks and bureaus compare", not as a guarantee of who is cheapest today. Always check the board or app of the provider before you transact.</Note>
      <P>We do not model promotions, loyalty rates, large-amount negotiated rates, card fees, taxes (such as VAT on fees), or the extra checks that can apply to large amounts. Real counter rates change during the day.</P>

      <H2>Step 3: ranking</H2>
      <UL>
        <li><strong className="text-ink">Best rate</strong> sorts by the amount that matters to you: the most you would receive when selling, or the least you would pay when buying, after the fee. <strong className="text-ink">Rate: high to low</strong> and <strong className="text-ink">low to high</strong> sort the same total in either direction.</li>
        <li><strong className="text-ink">Closest</strong> sorts by straight-line distance to your location or to the centre of the area you chose.</li>
        <li>Nothing is promoted, sponsored or paid for. Badges ("Best rate", "Most branches") are computed from the current results.</li>
      </UL>

      <H2>Providers, branches and hours</H2>
      <UL>
        <li>Providers and branches come from <strong className="text-ink">OpenStreetMap</strong>: every place tagged as a currency exchange bureau or a bank in the UAE. Branches of the same brand are grouped by name. Banks are listed only when a brand has three or more branches, so one-off bank offices do not crowd the list. A bank branch may not offer currency exchange, so confirm before you go.</li>
        <li>Opening hours are read from OpenStreetMap's <code className={code}>opening_hours</code> tag when it exists: the first time range, or 24/7. Anything we cannot read is shown as "Hours not listed". "Open now" uses UAE time (GST, UTC+4) and excludes branches whose hours are unknown. Hours can be out of date and ignore public holidays and Ramadan hours.</li>
        <li>Distance is straight-line (as the crow flies), not driving distance. Use the directions link for the real route.</li>
        <li>OpenStreetMap is edited by volunteers, so it can be incomplete or wrong in places.</li>
      </UL>

      <H2>Ratings and reviews</H2>
      <P>{SITE.name} does <strong className="text-ink">not show ratings or reviews</strong>, because it has no live, licensed source for them and will not invent any. Each provider card has a "Reviews on Google" link that opens the current ratings and reviews on Google Maps.</P>

      <H2>The AI assistant</H2>
      <P>Ask Xchange does not calculate anything itself. It operates the page through tools and reads back the same numbers shown above, so its figures match the page. Like any AI it can misunderstand a request or phrase something badly, so check the numbers on the page. See the <Link to="/privacy" className="font-semibold text-sky underline underline-offset-2">Privacy Policy</Link> for how chat messages are handled.</P>

      <H2>Known limits</H2>
      <UL>
        <li>Estimates, not offers. No provider has agreed to honour any figure shown here.</li>
        <li>Market rates for some currencies come from a once-a-day reference, so they can lag the real market.</li>
        <li>The free Yahoo Finance endpoint we use for live quotes is unofficial and can change or stop without notice; the other three sources then take over.</li>
        <li>Branch data is a snapshot, refreshed when we rebuild it (the date is on the <Link to="/sources" className="font-semibold text-sky underline underline-offset-2">sources page</Link>).</li>
      </UL>
      <P>Spotted something that does not add up? Tell us on the <Link to="/contact" className="font-semibold text-sky underline underline-offset-2">contact page</Link>.</P>
    </PageShell>
  );
}
