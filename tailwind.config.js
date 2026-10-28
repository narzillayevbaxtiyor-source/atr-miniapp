/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#0d0a07', 900: '#14100c', 800: '#1e1812', 700: '#271f17', 600: '#3a2f23' },
        gold: { 300: '#e8d4a2', 400: '#d7b36a', 500: '#c9a45c', 600: '#b78c3f' },
        sand: { 100: '#f3ebdd', 400: '#a39683' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0) rotate(-3deg)' }, '50%': { transform: 'translateY(-10px) rotate(3deg)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { float: 'float 5s ease-in-out infinite' },
    },
  },
  plugins: [],
};
