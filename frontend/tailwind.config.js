/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#1a1d27',
        cardBg: '#252836',
        sidebarBg: '#1f222e',
        neonPink: '#f320b9',
        neonCyan: '#25c6e5',
        neonPurple: '#9b51e0',
        textMuted: '#a0a3bd',
      }
    },
  },
  plugins: [],
}
