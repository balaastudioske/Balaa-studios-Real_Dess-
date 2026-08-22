module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f8fafc', 900: '#0f172a', 950: '#020617',
          800: '#1e2937', 700: '#334159', 400: '#94a3b0',
          300: '#94a3b0', 200: '#e2e8f0', 100: '#f1f5f9',
        },
        purple: {
          300: '#c4b5ff', 400: '#a78bfa',
          500: '#a87dfa', 600: '#9333ea',
        },
      },
    },
  },
  plugins: [],
}