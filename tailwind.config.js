/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#64BC44',
          greenDark: '#4A9038',
          dark: '#0F1E0A',
          darker: '#0A1509',
        },
        ink: {
          900: '#1A1A1A',
          700: '#3D3D3D',
          500: '#6B6B6B',
          300: '#A3A3A3',
          100: '#E5E5E5',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F6F7',
          border: '#E2E4E5',
        },
        status: {
          approved: '#2E9E4F',
          pending: '#C0392B',
          review: '#D98A1F',
        },
      },
      fontFamily: {
        sans: ['"Open Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

