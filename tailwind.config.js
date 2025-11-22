/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'Arial', 'sans-serif'],
      },
      colors: {
        // Beyond the Keys Brand Colors - פלטת צבעי המותג
        'btk': {
          'navy': '#0A1A2F',        // Navy Blue - צבע בסיס
          'gold': '#D4AF37',        // Gold - צבע דגש מרכזי
          'bronze': '#B08A2E',      // Deep Gold/Bronze - ברונזה עמוקה
          'silver': '#C0C0C0',      // Silver - הסדרה הפסיכולוגית
          'dark-gray': '#313131',   // Dark Gray - טקסט משני
          'light-gray': '#E8E8E8',  // Light Gray - רקעי עבודה
        },
      },
    },
  },
  plugins: [],
}
