/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
        fontFamily: {
          roboto: ['Roboto', 'sans-serif'],
          lora: ['Lora', 'serif'],
        },
        colors: {
          primary: '#436E6C',
          accent: '#B6D5C8',
          soft: '#F5F9F8',
          soft2: '#FFFFFF',
          dark: '#22223B',
          stone: '#A0AEC0',
        },
      },
    },
    plugins: [
      require('tailwindcss-animate'),
      require('@tailwindcss/forms'),
    ],
  }