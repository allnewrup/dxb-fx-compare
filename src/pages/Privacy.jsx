import React from 'react';
import PageShell, { H2, H3, P, UL, A, Note, Table, operatorPhrase } from './PageShell.jsx';
import { Link } from '../lib/router.jsx';
import { PAGES, SITE } from '../data/site.js';

const me = PAGES.find((p) => p.path === '/privacy');

export default function Privacy() {
  return (
    <PageShell path={me.path} title={me.title} desc={me.desc} updated={SITE.legalUpdated}>
      <P>This policy explains what happens to information when you use {SITE.name} at {SITE.url}. The short version: there are no accounts, no advertising and no analytics trackers, we do not keep a database about you, and your location stays in your browser. Some third-party services do receive requests from your browser, and they are listed below.</P>

      <H2>Who is responsible</H2>
      <P>{SITE.name} is run by {operatorPhrase()}. Contact: <A href={`mailto:${SITE.email}`}>{SITE.email}</A>.</P>

      <H2>What we collect</H2>
      <UL>
        <li><strong className="text-ink">Nothing you have to give us.</strong> There is no sign-up, no login and no form. We do not ask for your name, email, passport, Emirates ID or payment details, and you should not type them into the chat.</li>
        <li><strong className="text-ink">Cookies:</strong> {SITE.name} does not set cookies and has no advertising or analytics scripts.</li>
        <li><strong className="text-ink">Browser storage on your device:</strong> the map language you choose (kept in <code className="rounded bg-steel-200 px-1 font-mono text-[13px] text-ink">localStorage</code>), and, if you use the assistant, the conversation for that browser tab (kept in <code className="rounded bg-steel-200 px-1 font-mono text-[13px] text-ink">sessionStorage</code>, cleared when the tab closes or when you press "New chat"). This stays on your device and is never uploaded.</li>
        <li><strong className="text-ink">Server logs.</strong> Our hosting provider, Vercel, records standard technical request data such as IP address, time, requested address and browser type when you load the site or call its functions, for security and operation. We do not use these logs to identify or profile you. Vercel's own privacy policy governs them.</li>
        <li><strong className="text-ink">Chat usage counts.</strong> When the assistant runs, our server function logs only technical figures: the number of tokens used, how the reply ended, and error types. It does not log what you wrote or what the assistant answered.</li>
      </UL>

      <H2>Your location</H2>
      <P>If you press "Use my location", your browser asks for permission and, if you agree, gives the page your coordinates. They are used in your browser only, to sort branches by distance and to show your position on the map. They are <strong className="text-ink">not sent to our server</strong> and are <strong className="text-ink">never given to the assistant</strong>: it only receives distances such as "0.3 km". Choose "Clear" or reload the page to forget them, and withdraw permission in your browser's site settings at any time.</P>

      <H2>The AI assistant (Ask Xchange)</H2>
      <UL>
        <li>When you send a message, your browser sends the conversation, plus the current search settings (currencies, amount, filters), to our server function, which forwards it to <strong className="text-ink">Anthropic</strong> to generate the reply with its Claude model. Tool results from the page, such as provider names, rates and distances, are included in that conversation.</li>
        <li>Anthropic processes this to provide the answer and handles it under its own terms and privacy policy, including its retention rules. See <A href="https://www.anthropic.com/legal/privacy">anthropic.com/legal/privacy</A>.</li>
        <li>We do not store the conversation on our servers. Please <strong className="text-ink">do not include personal or financial details</strong> in the chat, and do not rely on it for anything private.</li>
        <li>The assistant is optional. If you never open it, none of this happens.</li>
      </UL>

      <H2>Third parties that receive requests from your browser</H2>
      <P>Loading a web page means your browser contacts other servers directly. Each of them can see your IP address and standard request headers (such as browser type), as with any website. We do not send them anything else.</P>
      <Table
        head={['Service', 'Why', 'When']}
        rows={[
          ['Google Fonts (fonts.googleapis.com, fonts.gstatic.com)', 'Typefaces', 'Every page load'],
          ['open.er-api.com, api.exchangerate-api.com, api.frankfurter.dev, cdn.jsdelivr.net and latest.currency-api.pages.dev', 'Market exchange rates', 'On load and every 60 seconds while the page is open'],
          ['tiles.openfreemap.org', 'Map background', 'When the map opens'],
          ['Vercel (our host) and, through our server, Yahoo Finance', 'Serving the site; one live-rate feed. Yahoo Finance is called by our server, so it sees our server, not you.', 'Every page load and refresh'],
          ['Anthropic', 'Assistant replies', 'Only when you send a chat message'],
          ['Google Maps (google.com/maps)', 'Directions and "Google Maps" links', 'Only if you click one; it opens in a new tab under Google\'s own privacy policy'],
        ]}
      />

      <H2>How we use information</H2>
      <P>Only to run the service: to show rates and branches, to answer assistant questions, to keep the site secure (for example limiting excessive requests to the chat), and to reply if you email us. We do not sell information, share it for advertising, or build profiles.</P>

      <H2>Email</H2>
      <P>If you email {SITE.email}, we use your address and message only to read and answer it, and keep it as long as needed for that. Ask us to delete it at any time.</P>

      <H2>Your choices and rights</H2>
      <UL>
        <li>Clear the map language and chat by clearing site data in your browser, or press "New chat".</li>
        <li>Deny or withdraw location permission in your browser.</li>
        <li>Skip the assistant and nothing is sent to Anthropic.</li>
        <li>Because we do not keep a database of visitors, there is usually nothing for us to look up. If you believe we hold information about you, or you want an email deleted, write to <A href={`mailto:${SITE.email}`}>{SITE.email}</A> and we will help, as far as the law that applies to you provides.</li>
      </UL>

      <H3>Children</H3>
      <P>{SITE.name} is a general-audience tool about money exchange and is not directed at children. We do not knowingly collect information from children.</P>

      <H2>Security</H2>
      <P>The site is served over HTTPS. The assistant's access key is kept on the server and never sent to your browser. No system is perfectly secure, so we cannot guarantee absolute security.</P>

      <H2>Changes</H2>
      <P>If we change this policy, we will update the date at the top. If we add anything that uses more of your information, such as advertising or analytics, we will describe it here first. See also our <Link to="/terms" className="font-semibold text-sky underline underline-offset-2">Terms of Service</Link>.</P>
      <Note>Questions about this policy? <A href={`mailto:${SITE.email}`}>{SITE.email}</A></Note>
    </PageShell>
  );
}
