/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original dark theme colors
        'dark-bg': '#0f0f0f', // Very dark background
        'nav-bg': '#1a1a1a', // Navigation background
        'card-bg': '#1f1f1f', // Card/element background
        'text-primary': '#e5e5e5', // Primary text
        'text-secondary': '#a0a0a0', // Secondary text
        'accent-gray': '#374151', // Subtle accent
        'hover-gray': '#2a2a2a', // Hover states
        
        // Extended dark theme for auth pages
        'dark-primary': '#0f0f0f', // Primary dark background
        'dark-secondary': '#1a1a1a', // Secondary dark background
        'dark-accent': '#374151', // Dark accent borders
        'accent-primary': '#6366f1', // Primary accent (indigo)
        'accent-secondary': '#4f46e5', // Secondary accent (darker indigo)
      },
    },
  },
  plugins: [],
}

export default config;