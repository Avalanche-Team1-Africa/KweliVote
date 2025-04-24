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
      boxShadow: {
        'soft-sm': '0 2px 6px rgba(0, 0, 0, 0.05)',
        'soft': '0 4px 12px rgba(0, 0, 0, 0.07)',
        'soft-md': '0 6px 16px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 24px rgba(37, 99, 235, 0.1)',
        'soft-xl': '0 12px 32px rgba(37, 99, 235, 0.12)',
        'soft-2xl': '0 16px 48px rgba(37, 99, 235, 0.15)',
        'soft-inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
