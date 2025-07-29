/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"Segoe UI Variable"', 'monospace'],
      },
      colors: {
        'intel-black': '#0d0d0d',
        'intel-gray': '#121212',
        'intel-cyan': '#00ccff',
        'intel-red': '#cc4444',
        'intel-yellow': '#e0b000',
      },
    },
  },
  plugins: [],
};
