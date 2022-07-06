/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.astro', './src/**/*.tsx', './src/**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        base: 'Inter'
      }
    }
  }
}
