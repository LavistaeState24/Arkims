/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./components/**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        pine: { 950: '#011735', 800: '#022f6a', 700: '#022f6a', 500: '#022f6a', 100: '#E6EFF8' },
        sand: { 600: '#cf9a55', 500: '#c89f53',400:'#e4be7a', 100: '#F9F4E8' },
        paper: '#F5F6F1',
        ink: { DEFAULT: '#022f6a', soft: '#4B564E' },
        line: '#DDE3DC'
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [],
}