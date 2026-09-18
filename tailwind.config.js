module.exports = {
  content: ["./*.html", "./components/**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        pine: {
          950: '#1d4b48', // Darkest background (Deep Teal/Pine)
          800: '#235956', // Very dark pine
          700: '#2c6d69', // Dark pine
          500: '#3e8f8a', // Mid-tone pine
          100: '#E6EFF8'  // Light background tint
        }, sand: { 600: '#cf9a55', 500: '#c89f53', 400: '#e4be7a', 100: '#F9F4E8' },
        paper: '#F5F6F1',
        darkBg: '#1d4b48',
        LightBg: '#fefce8',
        // ink: { DEFAULT: '#022f6a', soft: '#4B564E' },
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