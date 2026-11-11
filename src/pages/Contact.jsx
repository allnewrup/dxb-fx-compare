import React from 'react';
import PageShell, { H2, P, UL, A, Note, operatorPhrase } from './PageShell.jsx';
import { Link } from '../lib/router.jsx';
import { PAGES, SITE } from '../data/site.js';

const me = PAGES.find((p) => p.path === '/contact');

export default function Contact() {
  return (
    <PageShell path={me.path} title={me.title} desc={me.desc}>
      <P>The quickest way to reach {SITE.name} is email.</P>
      <p className="mt-3 rounded-xl border border-steel-300 bg-white/70 px-4 py-3 text-lg">
        <span className="label mr-2">Email</span>
        <a className="font-mono font-semibold text-sky underline underline-offset-2 hover:text-sky-dark" href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </p>
      <P>We read every message. We cannot promise a reply time, and we cannot reply to questions about a transaction: {SITE.name} is a comparison tool, so it has no access to anyone's exchange or transfer. For that, contact the exchange house or bank directly.</P>

      <H2>What to write to us about</H2>
      <UL>
        <li><strong className="text-ink">A wrong or missing branch, address or opening hours.</strong> These come from OpenStreetMap. Tell us which provider and branch and we will check; you can also fix it at the source on <A href="https://www.openstreetmap.org">openstreetmap.org</A>, and the correction reaches {SITE.name} the next time we refresh that data.</li>
        <li><strong className="text-ink">A rate that looks wrong.</strong> Include the currency pair, the amount, the provider, and the time you saw it. Remember that provider figures are estimates; see the <Link to="/methodology" className="font-semibold text-sky underline underline-offset-2">methodology</Link>.</li>
        <li><strong className="text-ink">Providers.</strong> If you run an exchange house or bank and want your details corrected or your listing removed, write from an address at your company's domain so we can confirm it is you. Listings cannot be bought and corrections are free.</li>
        <li><strong className="text-ink">Privacy requests.</strong> See the <Link to="/privacy" className="font-semibold text-sky underline underline-offset-2">Privacy Policy</Link>.</li>
        <li><strong className="text-ink">Bugs and ideas.</strong> Tell us your browser and device, and what you expected to happen.</li>
      </UL>

      <Note><strong>Please do not send passport numbers, Emirates ID numbers, card or bank details, or other sensitive personal information by email.</strong> We never need them.</Note>

      <H2>Who you are writing to</H2>
      <P>{SITE.name} is run by {operatorPhrase()}.</P>
    </PageShell>
  );
}
