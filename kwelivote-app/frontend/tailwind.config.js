/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E4A8F', // Dark blue from KweliVote logo
          light: '#4B72C2',
        },
        secondary: {
          DEFAULT: '#E84C3D', // Red from KweliVote logo
          light: '#F1746C',
        },
        neutral: {
          DEFAULT: '#F5F5F5',
          dark: '#333333',
        }
      },
    },
  },
  plugins: [],
}