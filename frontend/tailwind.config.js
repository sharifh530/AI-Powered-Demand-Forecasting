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
        graphite: {
          800: '#232933',
          850: '#1F252D',
          900: '#1A1F26',
          950: '#12161B',
        },
        paper: {
          DEFAULT: '#E9E6DD',
          dim: '#B4B0A4',
          muted: '#8E8B82',
        },
        signal: {
          amber: '#E2A33D',
          amberDim: '#8A6626',
        },
        status: {
          critical: '#D3564A',
          warning: '#D9B23C',
          healthy: '#6E9B7B',
        },
        hairline: '#2C333D',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Archivo', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
