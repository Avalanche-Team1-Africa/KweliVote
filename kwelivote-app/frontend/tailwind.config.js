/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kweli-primary': '#2563eb',    // Blue similar to KweliVote logo
        'kweli-secondary': '#1e40af',  // Darker blue for hover states
        'kweli-accent': '#60a5fa',     // Light blue for accents
        'kweli-light': '#f0f9ff',      // Very light blue for backgrounds
        'kweli-dark': '#1e3a8a',       // Very dark blue for text
      },
    },
  },
  plugins: [],
}
