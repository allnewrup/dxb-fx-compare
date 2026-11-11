// A tiny History-API router. The home page is the app itself; the information pages live at their own paths.
import React, { useEffect, useState } from 'react';
import { PAGES } from '../data/site.js';

const KNOWN = new Set(PAGES.map((p) => p.path));
const normalize = (p) => p.replace(/\/+$/, '') || '/';
const current = () => (KNOWN.has(normalize(location.pathname)) ? normalize(location.pathname) : '/');

export function navigate(to) {
  if (normalize(to) === normalize(location.pathname)) { window.scrollTo(0, 0); return; }
  history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

/** Current route: '/' (the app) or one of the information page paths. */
export function useRoute() {
  const [path, setPath] = useState(current);
  useEffect(() => {
    const on = () => setPath(current());
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  return path;
}

/** A real <a href> (crawlable, works with middle-click) that navigates without a page reload on a normal click. */
export function Link({ to, children, ...rest }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >{children}</a>
  );
}

/** Per-page <title>, description and canonical URL, restored when leaving the page. */
export function usePageMeta(title, desc, path) {
  useEffect(() => {
    const el = (sel, make) => document.head.querySelector(sel) ?? document.head.appendChild(make());
    const meta = el('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' }));
    const canon = el('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }));
    const prev = { title: document.title, desc: meta.content, href: canon.href };
    document.title = /xchange desk/i.test(title) ? title : `${title} · Xchange Desk`;
    meta.content = desc;
    canon.href = `${location.origin}${path}`;
    return () => { document.title = prev.title; meta.content = prev.desc; canon.href = prev.href; };
  }, [title, desc, path]);
}
