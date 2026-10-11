/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B35',
          light: '#FF8F5E',
          dark: '#E55A2B',
          secondary: '#2EC4B6',
          accent: '#FFD166',
        },
      },
    },
  },
  plugins: [],
};
