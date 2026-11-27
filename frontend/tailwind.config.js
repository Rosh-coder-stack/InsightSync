/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0A0A0A',
        surface: '#141414',
        borderSubtle: '#262626',
        accentAmber: '#F59E0B',
        textPrimary: '#EDEDED',
        textMuted: '#888888',
      },
    },
  },
  plugins: [],
}
