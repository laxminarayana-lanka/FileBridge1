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
        google: {
          teal: '#004d61',
          'teal-dark': '#003947',
          'teal-light': '#c2e7ff',
          'teal-hover': '#003e4e',
          blue: '#1a73e8',
          'blue-dark': '#0b57d0',
          'blue-container': '#d3e3fd',
          'blue-surface': '#f0f4f9',
          surface: '#f8fafd',
          'surface-variant': '#e9eef6',
          'on-surface': '#1f2937',
          'on-surface-variant': '#475569',
          border: '#e2e8f0',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffe',
          300: '#7cc5fd',
          400: '#36a7fa',
          500: '#0c87eb',
          600: '#006bc8',
          700: '#0155a3',
          800: '#054986',
          900: '#0a3d6f',
          950: '#06274a',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
      },
      keyframes: {
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      }
    },
  },
  plugins: [],
}
