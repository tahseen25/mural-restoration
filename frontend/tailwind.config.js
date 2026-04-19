/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink:   { DEFAULT: '#0f0e0b', 50: '#f7f6f2', 100: '#edeae0', 200: '#d8d2c0', 300: '#bdb38e', 400: '#a08f64', 500: '#8a7650', 600: '#6f5d3e', 700: '#574832', 800: '#3d3325', 900: '#261f16', 950: '#0f0e0b' },
        ochre: { DEFAULT: '#c8822a', 50: '#fdf6ec', 100: '#fae9cc', 200: '#f4ce94', 300: '#edb055', 400: '#e6922e', 500: '#c8822a', 600: '#a66020', 700: '#834819', 800: '#623516', 900: '#462615' },
        sage:  { DEFAULT: '#6b7f5a', 50: '#f4f6f1', 100: '#e5eade', 200: '#ccd5c0', 300: '#a9bb96', 400: '#859e6d', 500: '#6b7f5a', 600: '#536347', 700: '#404d37', 800: '#303929', 900: '#232a1e' },
        clay:  { DEFAULT: '#b54e2d', 50: '#fdf3ef', 100: '#fbe3d9', 200: '#f6c3ad', 300: '#ef9977', 400: '#e56f45', 500: '#b54e2d', 600: '#943d23', 700: '#722e1b', 800: '#542214', 900: '#3b180e' },
        cream: '#faf7f2',
      },
      backgroundImage: {
        'paper': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'warm': '0 4px 24px rgba(15,14,11,0.12)',
        'warm-lg': '0 8px 48px rgba(15,14,11,0.18)',
      },
    },
  },
  plugins: [],
};
