/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs "Chez Mon Ami" extraites du logo
        primary: {
          DEFAULT: '#1a4d2e', // Vert foncé principal
          dark: '#0d3b1f',    // Vert très foncé (palmier)
          light: '#2d6b3f',   // Vert clair
        },
        secondary: {
          DEFAULT: '#c85a3e', // Terracotta (escalier)
          light: '#d97a62',   // Terracotta clair
        },
        accent: {
          DEFAULT: '#ff6b35', // Orange (panier e-commerce)
          light: '#ff8c5a',   // Orange clair
        },
        neutral: {
          cream: '#f5e6d3',   // Beige/Crème (fond arche)
          sand: '#e8d4bc',    // Sable
        },
        animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        backgroundImage: {
          'promo-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'featured-gradient': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        },
        
      },
    },
  },
  plugins: [
  function({ addUtilities }) {
    addUtilities({
      '.scrollbar-hide': {
        '-ms-overflow-style': 'none',
        'scrollbar-width': 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }
    })
  }
],
};