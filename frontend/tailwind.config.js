/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#FAF7F2',
          card: '#FFFFFF',
          border: '#E5E7EB',
          text: '#1F2937',
          muted: '#6B7280',
        },
        gold: {
          50: '#FDF8F2',
          100: '#FBF0E3',
          200: '#F5DEBF',
          500: '#C28A4A',
          600: '#B07A3B',
          700: '#94632A',
        }
      }
    },
  },
  plugins: [],
}
