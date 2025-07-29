/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Roboto Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
};
