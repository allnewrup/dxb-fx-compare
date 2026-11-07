import React from 'react';

export function Stars({ value, size = 14 }) {
  return (
    <span className="inline-flex items-center" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
            <defs>
              <linearGradient id={`s${i}-${Math.round(value * 10)}-${size}`}>
                <stop offset={`${fill * 100}%`} stopColor="#e0a500" />
                <stop offset={`${fill * 100}%`} stopColor="#c3c9d0" />
              </linearGradient>
            </defs>
            <path d="M10 1.5l2.6 5.5 6 .8-4.4 4.2 1.1 6L10 15l-5.3 3 1.1-6L1.4 7.8l6-.8z" fill={`url(#s${i}-${Math.round(value * 10)}-${size})`} />
          </svg>
        );
      })}
    </span>
  );
}

/** Two-position slide switch with the labels on either side, like a rocker on a till. */
export function Switch({ id, checked, onChange, off, on }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-semibold ${!checked ? 'text-ink' : 'text-steel-500'}`}>{off}</span>
      <button id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="switch" aria-label={`${off} or ${on}`} />
      <span className={`text-sm font-semibold ${checked ? 'text-ink' : 'text-steel-500'}`}>{on}</span>
    </div>
  );
}

/** Monogram plate that stands in for a provider logo. */
export function Mark({ provider, size = 48 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl border-t border-white/50 font-display font-bold tracking-wider text-white shadow-raised"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(160deg, ${provider.hue}, #000 190%)`, textShadow: '0 -1px 0 rgba(0,0,0,.4)' }}
      aria-hidden="true"
    >
      {provider.mark}
    </span>
  );
}

/** Split-flap style readout: every digit sits on its own hinged tile. */
export function FlipRate({ value, digits = 4, size = 'text-2xl' }) {
  const s = value.toFixed(digits);
  return (
    <span className={`inline-flex items-center ${size}`} aria-label={s}>
      {s.split('').map((ch, i) =>
        ch === '.' ? <span key={i} className="flip-sep">.</span> : <span key={i} className="flip-digit" aria-hidden="true">{ch}</span>
      )}
    </span>
  );
}

export function Pill({ tone = 'go', children }) {
  const tones = {
    go: 'bg-[#d3efe2] text-[#0b5a40]',
    off: 'bg-steel-200 text-steel-600',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold shadow-well ${tones[tone]}`}><span className={`h-1.5 w-1.5 rounded-full ${tone === 'go' ? 'bg-go' : 'bg-steel-400'}`} />{children}</span>;
}

export const Icon = {
  swap: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /></svg>),
  pin: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 119.5 9 2.5 2.5 0 0112 11.5z" /></svg>),
  refresh: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" /></svg>),
  nav: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M3 11l18-8-8 18-2-8z" /></svg>),
  qr: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" /></svg>),
  close: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" {...p}><path d="M5 5l14 14M19 5L5 19" /></svg>),
};
