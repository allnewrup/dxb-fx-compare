import React, { useEffect, useRef } from 'react';
import { PAGES, SITE } from '../data/site.js';
import { Link, usePageMeta } from '../lib/router.jsx';

export const H2 = ({ children, id }) => <h2 id={id} className="mt-7 scroll-mt-4 font-display text-2xl font-bold uppercase tracking-wide text-ink first:mt-0">{children}</h2>;
export const H3 = ({ children }) => <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-ink">{children}</h3>;
export const P = ({ children, className = '' }) => <p className={`mt-2 ${className}`}>{children}</p>;
export const UL = ({ children }) => <ul className="mt-2 list-disc space-y-1.5 pl-5">{children}</ul>;
export const A = ({ href, children }) => <a className="font-semibold text-sky underline underline-offset-2 hover:text-sky-dark" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>{children}</a>;
export const Note = ({ children }) => <div className="mt-3 rounded-lg border border-brass-400 bg-brass-200/60 px-3 py-2 text-brass-600">{children}</div>;
export const Table = ({ head, rows }) => (
  <div className="mt-3 overflow-x-auto">
    <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-sm">
      <thead><tr>{head.map((h) => <th key={h} scope="col" className="border-b-2 border-steel-300 px-3 py-2 font-display text-xs font-semibold uppercase tracking-[.14em] text-steel-600">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="align-top odd:bg-white/50">{r.map((c, j) => (j === 0 ? <th key={j} scope="row" className="px-3 py-2 font-semibold text-ink">{c}</th> : <td key={j} className="px-3 py-2">{c}</td>))}</tr>)}</tbody>
    </table>
  </div>
);

/** Who runs the site, as one phrase. */
export const operatorPhrase = () => (SITE.operator ? SITE.operator : `${SITE.name}, an independent project`);

export function SiteNav({ current, className = '' }) {
  return (
    <nav aria-label="Site information" className={className}>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {PAGES.map((p) => (
          <li key={p.path}><Link to={p.path} aria-current={current === p.path ? 'page' : undefined} className={`text-sm font-semibold underline-offset-2 hover:underline ${current === p.path ? 'text-ink' : 'text-sky'}`}>{p.label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}

/** Frame for the information pages: brand header, page navigation, a readable column, and the footer. */
export default function PageShell({ path, title, desc, updated, children }) {
  usePageMeta(title, desc, path);
  const h1 = useRef(null);
  useEffect(() => { h1.current?.focus({ preventScroll: true }); }, [path]);
  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-10 pt-4 sm:px-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <span className="badge-gold !rounded-xl !px-3 !py-1.5 !text-2xl">AED</span>
          <span>
            <span className="block font-display text-3xl font-bold uppercase leading-none tracking-wide text-ink">{SITE.name}</span>
            <span className="text-sm text-steel-600">← Back to the rate comparison</span>
          </span>
        </Link>
        <SiteNav current={path} />
      </header>
      <main className="panel p-5 text-[15px] leading-relaxed text-steel-600 sm:p-7">
        <h1 ref={h1} tabIndex={-1} className="font-display text-4xl font-bold uppercase leading-tight tracking-wide text-ink outline-none">{title}</h1>
        {updated && <p className="mt-1 text-sm text-steel-500">Last updated: {updated}</p>}
        <div className="mt-3">{children}</div>
      </main>
      <footer className="mt-5 space-y-2 text-xs text-steel-600">
        <SiteNav current={path} />
        <p>© {new Date().getFullYear()} {SITE.name}. Independent comparison tool. Not an exchange house and not affiliated with the providers listed. Contact: <a className="font-semibold text-sky underline-offset-2 hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
      </footer>
    </div>
  );
}
