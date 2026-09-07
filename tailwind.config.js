/** @type {import('tailwindcss').Config} */
module.exports = {
     content: ["./*.html", "./components/**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        pine: { 950: '#0E2A1C', 800: '#153A26', 700: '#1F5C3C', 500: '#2F8F5B', 100: '#E4EFE7' },
        sand: { 600: '#B9853A', 500: '#CB9A4E', 100: '#F4E9D8' },
        paper: '#F5F6F1',
        ink: { DEFAULT: '#16201B', soft: '#4B564E' },
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
