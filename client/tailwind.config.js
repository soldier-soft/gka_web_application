/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            50: '#f0f5fa',
            100: '#dbe7f4',
            200: '#b8d2eb',
            300: '#87b4de',
            400: '#5290cd',
            500: '#2f72bc',
            600: '#21599f',
            700: '#1b4781',
            800: '#193c6b',
            900: '#0F1E36', // Primary luxury navy
            950: '#091222', // Deep dark navy
          },
          gold: {
            50: '#fbf8eb',
            100: '#f5eecc',
            200: '#ebdc99',
            300: '#dec35f',
            400: '#d3ab33',
            500: '#C59A27', // Premium gold accent
            600: '#a77c1d',
            700: '#855d1a',
            800: '#6f4b1c',
            900: '#5e3f1d',
          },
          teal: {
            50: '#effaf8',
            100: '#d7f2ee',
            200: '#b2e5df',
            300: '#7fd0c7',
            400: '#4fb4ab',
            500: '#0d9488', // Teal accent
            600: '#14766f',
            700: '#145f5a',
            800: '#144c49',
            900: '#15403e',
          },
          slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'premium': '0 10px 30px -10px rgba(15, 30, 54, 0.12)',
        'glow-gold': '0 0 20px rgba(197, 154, 39, 0.25)',
      }
    },
  },
  plugins: [],
}
