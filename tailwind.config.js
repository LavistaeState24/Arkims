/** @type {import('tailwindcss').Config} */
module.exports = {
     content: ["./*.html", "./components/**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        pine: { 950: '#01473f', 800: '#01473f', 700: '#01473f', 500: '#01473f', 100: '#E4EFE7' },
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
