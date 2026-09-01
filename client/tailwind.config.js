/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary purple palette (matches Serenity image) ──
        purple: {
          50:  '#f5f0fb',
          100: '#ede5f7',
          200: '#d9ccef',
          300: '#bea8e3',
          400: '#9f7dd4',
          500: '#8057c4',
          600: '#6b3fb0',
          700: '#572f96',
          800: '#3d1f6e',   // primary dark
          900: '#2a1349',
        },
        lavender: {
          50:  '#f8f5ff',
          100: '#f0eaff',
          200: '#e2d5ff',
          300: '#c9b3f5',
          400: '#a888e8',
          500: '#8b62d9',
        },
        cream: {
          50:  '#fdfcfa',
          100: '#faf7f4',
          200: '#f4ede6',
          300: '#ecddd4',
        },
        // Keep for backward compat
        teal: {
          50:  '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4',
          500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
          800: '#0D6E6E', 900: '#134e4a',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft':   '0 2px 20px rgba(107, 63, 176, 0.08)',
        'purple': '0 8px 32px rgba(107, 63, 176, 0.25)',
        'card':   '0 1px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
