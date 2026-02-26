/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: '#D4A843', light: '#F2D98B', dark: '#A67C2E' },
        emerald: { DEFAULT: '#1B6B4A', dark: '#0F4A32', deep: '#0A3524' },
        night: { DEFAULT: '#0D1117', light: '#161B22', card: '#1C2230', border: '#2A3140' },
      },
      fontFamily: {
        serif: ['DM Serif Display', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
