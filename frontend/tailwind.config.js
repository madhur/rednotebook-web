/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        journal: {
          red: '#c0392b',
          'red-dark': '#922b21',
        }
      }
    },
  },
  plugins: [],
}
