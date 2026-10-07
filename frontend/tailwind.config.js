/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          blue: '#22a6fe',
          'blue-hover': '#1395ea',
          orange: '#f25b2a',
          'orange-hover': '#e14a19',
          input: '#edf2fc',
          'input-border': '#3b82f6',
          bg: '#eceef2',
          card: '#fafbfe',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'game-btn': '0 8px 20px -4px rgba(34, 166, 254, 0.45)',
        'card-soft': '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
