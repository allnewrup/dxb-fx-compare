import { CURRENCIES } from '../data/seed.js';

const POPULAR = [...CURRENCIES.map((c) => c.code), 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'TRY', 'EGP', 'KWD', 'QAR', 'OMR', 'BHD', 'LKR', 'BDT', 'NPR', 'THB', 'MYR', 'SGD', 'RUB', 'ZAR', 'KRW', 'IDR', 'NGN', 'KES'];

let names, regions;
try { names = new Intl.DisplayNames(['en'], { type: 'currency' }); regions = new Intl.DisplayNames(['en'], { type: 'region' }); } catch { /* older browsers: fall back to codes */ }

/** Flag from the currency code's country prefix (USD -> US). Codes that aren't a country get a globe. */
export function flagFor(code) {
  if (code === 'EUR') return '\u{1F1EA}\u{1F1FA}';
  const cc = code.slice(0, 2);
  let valid = false;
  try { valid = !!regions && regions.of(cc) !== cc && !code.startsWith('X'); } catch { valid = false; }
  return valid ? String.fromCodePoint(...[...cc].map((ch) => 127397 + ch.charCodeAt(0))) : '\u{1F310}';
}

export function currencyName(code) {
  try { return names?.of(code) ?? code; } catch { return code; }
}

/** Option lists for the currency selectors: popular first, then everything else A to Z by name. */
export function currencyGroups(codes) {
  const have = new Set(codes);
  const mk = (code) => ({ code, name: currencyName(code), flag: flagFor(code) });
  const popular = POPULAR.filter((c) => have.has(c)).map(mk);
  const seen = new Set(popular.map((c) => c.code));
  const rest = codes.filter((c) => !seen.has(c)).map(mk).sort((a, b) => a.name.localeCompare(b.name));
  return { popular, rest };
}
