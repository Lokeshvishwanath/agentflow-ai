/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0f9ff', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1' },
        surface: { DEFAULT: '#0f172a', 50: '#f8fafc', 100: '#f1f5f9', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
      },
      animation: { 'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' },
    },
  },
  plugins: [],
};
