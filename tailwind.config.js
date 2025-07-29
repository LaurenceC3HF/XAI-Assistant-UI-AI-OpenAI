/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    borderRadius: {
      none: '0px',
      sm: '0px',
      DEFAULT: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '9999px',
    },
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
