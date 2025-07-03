/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-gray': '#f3f4f6',
        'custom-blue': '#3b82f6',
      },
    },
  },
  plugins: [],
}

export default config;