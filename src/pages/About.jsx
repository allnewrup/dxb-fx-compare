import React from 'react';
import PageShell, { H2, P, UL, A, operatorPhrase } from './PageShell.jsx';
import { Link } from '../lib/router.jsx';
import { PAGES, SITE } from '../data/site.js';

const me = PAGES.find((p) => p.path === '/about');

export default function About({ data }) {
  const n = data.providers.length;
  const branches = data.providers.reduce((a, p) => a + p.branches.length, 0);
  return (
    <PageShell path={me.path} title={me.title} desc={me.desc}>
      <P>{SITE.name} helps people in the United Arab Emirates, and visitors arriving in it, see what they could get for their money before they walk into an exchange house or bank. Pick the currency you have and the one you need, and the page shows an estimated amount at each provider, the nearest branches, opening hours where they are known, and directions.</P>

      <H2>Who it is for</H2>
      <UL>
        <li><strong className="text-ink">Visitors</strong> changing foreign cash into dirhams.</li>
        <li><strong className="text-ink">Residents</strong> sending dirhams home or buying foreign currency to travel.</li>
        <li>Anyone who wants to compare several providers in one place instead of visiting each website or branch.</li>
      </UL>

      <H2>What you will find</H2>
      <UL>
        <li>{n.toLocaleString('en')} exchange houses and banks with {branches.toLocaleString('en')} branches across all seven emirates, plus an interactive map in seven languages.</li>
        <li>Market rates cross-checked across several independent public feeds, for every major world currency. See <Link to="/sources" className="font-semibold text-sky underline underline-offset-2">data sources and update times</Link>.</li>
        <li>An optional AI assistant, Ask Xchange, that can set up a search for you and explain the result.</li>
      </UL>

      <H2>What {SITE.name} is not</H2>
      <UL>
        <li>It is <strong className="text-ink">not an exchange house, bank or money transfer service</strong>. It cannot exchange or send money, and it never handles your funds.</li>
        <li>It is <strong className="text-ink">not affiliated with, endorsed by or paid by</strong> any provider listed.</li>
        <li>The provider rates it shows are <strong className="text-ink">estimates, not counter rates</strong>. Exchange houses do not publish live rates, so the final rate and any fees are set at the counter. The <Link to="/methodology" className="font-semibold text-sky underline underline-offset-2">methodology</Link> explains exactly how an estimate is made and where it can be wrong.</li>
        <li>It is not financial advice and it does not predict exchange rates.</li>
      </UL>

      <H2>Independence</H2>
      <P>The order of the results is decided by the numbers alone: the best total for the direction you chose, or whichever sort you pick. No provider can pay to be listed, ranked higher or removed. {SITE.name} currently shows no advertising and no affiliate links. If that ever changes, this page and the privacy policy will say so.</P>

      <H2>Who runs it</H2>
      <P>{SITE.name} is run by {operatorPhrase()}. You can reach us at <A href={`mailto:${SITE.email}`}>{SITE.email}</A> or through the <Link to="/contact" className="font-semibold text-sky underline underline-offset-2">contact page</Link>.</P>

      <H2>Found a mistake?</H2>
      <P>Branch details come from OpenStreetMap, which anyone can improve at <A href="https://www.openstreetmap.org">openstreetmap.org</A>. For anything else, a wrong rate calculation, a missing provider or a provider that wants its information corrected, please <Link to="/contact" className="font-semibold text-sky underline underline-offset-2">get in touch</Link>.</P>
    </PageShell>
  );
}
