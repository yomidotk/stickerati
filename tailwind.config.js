/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'straw-hat': '#f7e1b5',
        'pirate-red': '#d13030',
        'ocean-blue': '#1e3a8a',
      }
    },
  },
  plugins: [],
}
