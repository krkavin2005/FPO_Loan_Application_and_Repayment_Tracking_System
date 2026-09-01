/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f8f3',
          100: '#e1f0e4',
          200: '#c5e2cd',
          300: '#99cdab',
          400: '#68b180',
          500: '#449660', // AgriLend green
          600: '#337a4e',
          700: '#2b6240',
          800: '#254e35',
          900: '#1f412d',
          950: '#102419',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
