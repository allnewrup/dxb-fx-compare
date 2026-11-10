// Pre-loaded dataset so the UI is fully interactive on first render.
// Everything here is an *indicative snapshot*: provider ratings, branch pins and reviews
// are illustrative and must be replaced by live Google Places / Maps results through
// fxDataService (see src/services/fxDataService.js) before being treated as factual.

export const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'PKR', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
];

// Offline fallback only (rates as of 6 Nov 2026). Replaced by live quotes on load: see fxDataService.
export const SEED_MID_PER_AED = {
  AED: 1, USD: 0.27227, EUR: 0.24433, GBP: 0.20386, INR: 25.57, PHP: 17.16, PKR: 75.30, SAR: 1.0219,
};

export const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

// kind: 'all' | 'emirate' | 'area' (neighbourhood). Neighbourhood centres also assign each branch its area label.
export const AREAS = [
  { id: 'all', label: 'All UAE', emirate: null, kind: 'all', center: [24.9, 54.9] },
  { id: 'dubai', label: 'Dubai only', emirate: 'Dubai', kind: 'emirate', center: [25.2, 55.27] },
  { id: 'abudhabi', label: 'Abu Dhabi only', emirate: 'Abu Dhabi', kind: 'emirate', center: [24.45, 54.4] },
  { id: 'sharjah', label: 'Sharjah only', emirate: 'Sharjah', kind: 'emirate', center: [25.34, 55.41] },
  { id: 'ajman', label: 'Ajman only', emirate: 'Ajman', kind: 'emirate', center: [25.41, 55.44] },
  { id: 'rak', label: 'Ras Al Khaimah only', emirate: 'Ras Al Khaimah', kind: 'emirate', center: [25.79, 55.94] },
  { id: 'fujairah', label: 'Fujairah only', emirate: 'Fujairah', kind: 'emirate', center: [25.12, 56.33] },
  { id: 'uaq', label: 'Umm Al Quwain only', emirate: 'Umm Al Quwain', kind: 'emirate', center: [25.56, 55.55] },
  { id: 'Deira', label: 'Deira', emirate: 'Dubai', kind: 'area', center: [25.2713, 55.304] },
  { id: 'Bur Dubai', label: 'Bur Dubai', emirate: 'Dubai', kind: 'area', center: [25.2535, 55.297] },
  { id: 'Marina', label: 'Marina', emirate: 'Dubai', kind: 'area', center: [25.0773, 55.1389] },
  { id: 'Downtown', label: 'Downtown', emirate: 'Dubai', kind: 'area', center: [25.1985, 55.2796] },
  { id: 'Corniche', label: 'Corniche', emirate: 'Abu Dhabi', kind: 'area', center: [24.48, 54.35] },
  { id: 'Mussafah', label: 'Mussafah', emirate: 'Abu Dhabi', kind: 'area', center: [24.347, 54.5] },
];

const PLACE = {
  Deira: { emirate: 'Dubai', ll: [25.2713, 55.304], addr: 'Naif Road, Deira' },
  'Bur Dubai': { emirate: 'Dubai', ll: [25.2535, 55.297], addr: 'Al Fahidi Street, Bur Dubai' },
  Marina: { emirate: 'Dubai', ll: [25.0773, 55.1389], addr: 'Marina Walk, Dubai Marina' },
  Downtown: { emirate: 'Dubai', ll: [25.1985, 55.2796], addr: 'Financial Centre Rd, Downtown Dubai' },
  Corniche: { emirate: 'Abu Dhabi', ll: [24.48, 54.35], addr: 'Corniche Road West, Abu Dhabi' },
  Mussafah: { emirate: 'Abu Dhabi', ll: [24.347, 54.5], addr: 'Mussafah Industrial Area, Abu Dhabi' },
};

let n = 0;
// Small deterministic offsets keep pins of different providers from stacking exactly.
const branch = (provider, area, hours = ['08:30', '22:00'], tag = '') => {
  const p = PLACE[area];
  n += 1;
  const dx = (((n * 37) % 11) - 5) * 0.0011;
  const dy = (((n * 53) % 11) - 5) * 0.0011;
  return {
    id: `${provider}-${area.replace(/\s/g, '')}-${n}`,
    area,
    emirate: p.emirate,
    lat: +(p.ll[0] + dx).toFixed(5),
    lng: +(p.ll[1] + dy).toFixed(5),
    address: tag ? `${tag}, ${p.addr}` : p.addr,
    hours,
  };
};

const D = ['08:30', '22:00'];
const L = ['09:00', '23:30'];
const A = ['00:00', '24:00'];

export const PROVIDERS = [
  {
    id: 'alansari', name: 'Al Ansari Exchange', mark: 'AA', hue: '#b3202a',
    rating: 4.5, reviewCount: 21480,
    margin: 0.55, fee: { bank: 12 }, bias: { INR: -0.1, PKR: 0.1, PHP: 0.05 },
    branches: [branch('alansari', 'Deira', D, 'Al Ansari Branch'), branch('alansari', 'Bur Dubai', L), branch('alansari', 'Downtown', L, 'Dubai Mall'),
      branch('alansari', 'Marina', D), branch('alansari', 'Corniche', D), branch('alansari', 'Mussafah', D), branch('alansari', 'Deira', A, 'Airport Road')],
    reviews: [
      { name: 'Rahul M.', stars: 5, branch: 'Deira', daysAgo: 6, text: 'Queue moved quickly and the rate matched what was shown on the board. Staff counted the cash twice in front of me.' },
      { name: 'Joanna P.', stars: 4, branch: 'Downtown', daysAgo: 19, text: 'Good PHP rate on a weekday. Gets busy around the evening, so go before 5pm.' },
      { name: 'Imran S.', stars: 5, branch: 'Mussafah', daysAgo: 41, text: 'Sent money home without any issue, transfer reached in minutes. Clear receipt.' },
    ],
  },
  {
    id: 'alfardan', name: 'Al Fardan Exchange', mark: 'AF', hue: '#7a1d58',
    rating: 4.6, reviewCount: 9320,
    margin: 0.62, fee: { bank: 15 }, bias: { USD: -0.12, EUR: -0.1, GBP: -0.08 },
    branches: [branch('alfardan', 'Bur Dubai', D), branch('alfardan', 'Downtown', L, 'Emirates Towers'), branch('alfardan', 'Marina', D), branch('alfardan', 'Corniche', D, 'Hamdan Street')],
    reviews: [
      { name: 'Sarah K.', stars: 5, branch: 'Downtown', daysAgo: 3, text: 'Best EUR rate I found within walking distance. Very polite staff and no hidden commission.' },
      { name: 'Mohammed A.', stars: 4, branch: 'Bur Dubai', daysAgo: 27, text: 'Reliable and quiet. The GBP rate was a little lower than the online average but fair.' },
      { name: 'Priya N.', stars: 5, branch: 'Corniche', daysAgo: 55, text: 'Easy parking and quick service for a large USD exchange.' },
    ],
  },
  {
    id: 'lulu', name: 'LuLu Exchange', mark: 'LU', hue: '#0e7c4a',
    rating: 4.4, reviewCount: 17250,
    margin: 0.5, fee: { bank: 10 }, bias: { INR: -0.14, PKR: -0.08, PHP: -0.06, SAR: 0.05 },
    branches: [branch('lulu', 'Deira', L), branch('lulu', 'Bur Dubai', L, 'Karama Centre'), branch('lulu', 'Marina', L), branch('lulu', 'Corniche', L, 'Electra Street'),
      branch('lulu', 'Mussafah', L), branch('lulu', 'Downtown', L)],
    reviews: [
      { name: 'Anil T.', stars: 5, branch: 'Deira', daysAgo: 2, text: 'Consistently the strongest INR rate for me. Open late, which helps after work.' },
      { name: 'Fatima R.', stars: 4, branch: 'Mussafah', daysAgo: 14, text: 'Long wait on Friday afternoon, but the rate made up for it.' },
      { name: 'Dennis C.', stars: 4, branch: 'Marina', daysAgo: 33, text: 'App transfer and branch pickup both worked fine. Staff explained the fee clearly.' },
    ],
  },
  {
    id: 'joyalukkas', name: 'Joyalukkas Exchange', mark: 'JL', hue: '#a8761a',
    rating: 4.3, reviewCount: 6140,
    margin: 0.7, fee: { bank: 14 }, bias: { INR: -0.05, PHP: 0.1, PKR: 0.15 },
    branches: [branch('joyalukkas', 'Deira', D, 'Gold Souk'), branch('joyalukkas', 'Bur Dubai', D, 'Meena Bazaar'), branch('joyalukkas', 'Corniche', D)],
    reviews: [
      { name: 'Suresh B.', stars: 5, branch: 'Bur Dubai', daysAgo: 9, text: 'Friendly team and a decent INR rate. I combine this with a trip to the souk.' },
      { name: 'Aisha H.', stars: 4, branch: 'Deira', daysAgo: 38, text: 'Fine for small amounts. Larger amounts got a slightly better rate when I asked.' },
      { name: 'Mark L.', stars: 3, branch: 'Corniche', daysAgo: 70, text: 'Slow counter that day, otherwise no complaints.' },
    ],
  },
  {
    id: 'rostamani', name: 'Al Rostamani International Exchange', mark: 'AR', hue: '#143f7a',
    rating: 4.4, reviewCount: 8870,
    margin: 0.58, fee: { bank: 15 }, bias: { USD: -0.05, SAR: -0.1, GBP: -0.04 },
    branches: [branch('rostamani', 'Downtown', L, 'Dubai Mall Lower Ground'), branch('rostamani', 'Deira', D), branch('rostamani', 'Marina', L), branch('rostamani', 'Corniche', D)],
    reviews: [
      { name: 'Hannah W.', stars: 5, branch: 'Downtown', daysAgo: 5, text: 'Convenient inside the mall and the USD rate was competitive. Done in five minutes.' },
      { name: 'Omar F.', stars: 4, branch: 'Deira', daysAgo: 22, text: 'Good SAR rate. Paperwork was minimal with an Emirates ID.' },
      { name: 'Lina G.', stars: 4, branch: 'Marina', daysAgo: 61, text: 'Clean branch, helpful staff. Rate changes during the day, so check before you go.' },
    ],
  },
  {
    id: 'sharaf', name: 'Sharaf Exchange', mark: 'SX', hue: '#c25a10',
    rating: 4.5, reviewCount: 7610,
    margin: 0.6, fee: { bank: 12 }, bias: { PHP: -0.12, PKR: -0.05, EUR: 0.05 },
    branches: [branch('sharaf', 'Bur Dubai', L), branch('sharaf', 'Deira', D), branch('sharaf', 'Marina', D), branch('sharaf', 'Mussafah', D), branch('sharaf', 'Corniche', D, 'Madinat Zayed')],
    reviews: [
      { name: 'Grace D.', stars: 5, branch: 'Bur Dubai', daysAgo: 4, text: 'PHP rate was the best of the three places I compared. Teller was patient with my questions.' },
      { name: 'Bilal Z.', stars: 4, branch: 'Mussafah', daysAgo: 30, text: 'Handy for workers in the industrial area. Open when we finish shift.' },
      { name: 'Elena V.', stars: 5, branch: 'Marina', daysAgo: 48, text: 'Quick, clear, and the receipt showed the rate and fee separately.' },
    ],
  },
  {
    id: 'wallstreet', name: 'Wall Street Exchange', mark: 'WS', hue: '#1c2c49',
    rating: 4.2, reviewCount: 11930,
    margin: 0.66, fee: { bank: 16 }, bias: { USD: -0.1, INR: 0.08, EUR: -0.06 },
    branches: [branch('wallstreet', 'Deira', L, 'Al Rigga'), branch('wallstreet', 'Bur Dubai', L), branch('wallstreet', 'Downtown', L), branch('wallstreet', 'Corniche', L), branch('wallstreet', 'Mussafah', D)],
    reviews: [
      { name: 'Vikram J.', stars: 4, branch: 'Deira', daysAgo: 8, text: 'Reasonable USD rate, helpful for larger transfers. Token system keeps the queue orderly.' },
      { name: 'Chloe B.', stars: 4, branch: 'Downtown', daysAgo: 24, text: 'Fast service on a weekday morning. EUR rate was near the mid-market figure.' },
      { name: 'Nadeem Q.', stars: 3, branch: 'Mussafah', daysAgo: 52, text: 'Okay rate but I waited about 20 minutes.' },
    ],
  },
  {
    id: 'aldahab', name: 'Al Dahab Exchange', mark: 'AD', hue: '#6b4a12',
    rating: 4.1, reviewCount: 2380,
    margin: 0.8, fee: { bank: 10 }, bias: { PKR: -0.18, INR: 0.02, PHP: 0.12 },
    branches: [branch('aldahab', 'Deira', D, 'Baniyas Square'), branch('aldahab', 'Bur Dubai', D), branch('aldahab', 'Mussafah', D)],
    reviews: [
      { name: 'Tariq M.', stars: 5, branch: 'Deira', daysAgo: 11, text: 'Strong PKR rate and no fuss. A small shop, so bring your ID and be ready to wait at peak times.' },
      { name: 'Reem S.', stars: 4, branch: 'Bur Dubai', daysAgo: 36, text: 'Honest staff. Rate was lower for small notes, which they explained.' },
      { name: 'George P.', stars: 3, branch: 'Mussafah', daysAgo: 80, text: 'Limited currencies in stock, call ahead for large amounts.' },
    ],
  },
];
