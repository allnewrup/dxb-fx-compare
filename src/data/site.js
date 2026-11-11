// Public business information, used by the About, Contact, Privacy and Terms pages and the footer.
// Edit here; every page picks it up.
export const SITE = {
  name: 'Xchange Desk',
  url: 'https://dxb-fx-compare.vercel.app',
  email: 'xchangedesk@gmail.com',
  // Legal name of the person or company that runs the site, shown on About, Contact, Privacy and Terms ("run by <operator>"). Leave '' to say "an independent business".
  operator: '',
  // Date the Privacy Policy and Terms were last changed. Update it whenever you change their text.
  legalUpdated: '11 November 2026',
};

export const PAGES = [
  { path: '/about', label: 'About', title: 'About Xchange Desk', desc: 'What Xchange Desk is, who it is for, what it is not, and how it stays independent.' },
  { path: '/methodology', label: 'Methodology', title: 'How Xchange Desk calculates rates', desc: 'How market rates are cross-checked and how each exchange house and bank estimate is calculated, with formulas and limits.' },
  { path: '/sources', label: 'Data sources', title: 'Data sources and update times', desc: 'Every data source Xchange Desk uses, what each provides, and when each was last updated.' },
  { path: '/contact', label: 'Contact', title: 'Contact Xchange Desk', desc: 'How to reach Xchange Desk for corrections, provider requests, feedback or privacy questions.' },
  { path: '/privacy', label: 'Privacy Policy', title: 'Privacy Policy', desc: 'What data Xchange Desk handles, which third parties receive requests from your browser, and your choices.' },
  { path: '/terms', label: 'Terms of Service', title: 'Terms of Service', desc: 'The terms for using Xchange Desk: information only, estimated rates, no warranty, acceptable use.' },
];
