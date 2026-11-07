/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1b232b',
        steel: { 50: '#f3f5f7', 100: '#e7eaee', 200: '#d6dbe1', 300: '#bcc3cc', 400: '#9aa3ae', 500: '#77828f', 600: '#58626e' },
        board: '#12161a',
        led: '#ffb81c',
        sky: { DEFAULT: '#0b5fd8', dark: '#0847a6', light: '#3d86f0' },
        brass: { 200: '#f4e2a4', 300: '#e6c767', 400: '#cfa539', 500: '#a9801c', 600: '#7c5a0e' },
        go: '#12805c',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        raised: '0 1px 0 rgba(255,255,255,.7) inset, 0 -2px 0 rgba(0,0,0,.12) inset, 0 1px 1px rgba(20,30,40,.25), 0 3px 6px rgba(20,30,40,.18), 0 8px 16px -4px rgba(20,30,40,.2)',
        pressed: '0 2px 5px rgba(20,30,40,.35) inset, 0 1px 0 rgba(255,255,255,.6)',
        well: 'inset 0 2px 4px rgba(20,30,40,.28), inset 0 -1px 0 rgba(255,255,255,.8)',
        panel: '0 1px 0 rgba(255,255,255,.85) inset, 0 0 0 1px rgba(20,30,40,.12), 0 2px 3px rgba(20,30,40,.12), 0 12px 24px -8px rgba(20,30,40,.28)',
        boardin: 'inset 0 3px 8px rgba(0,0,0,.8), inset 0 0 0 1px rgba(255,255,255,.06), 0 1px 0 rgba(255,255,255,.7)',
      },
    },
  },
  plugins: [],
};
