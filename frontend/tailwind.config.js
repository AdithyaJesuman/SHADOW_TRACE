/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#080b11',
        darkBgSubtle: '#0d131f',
        cardBg: '#121826',
        cardBgHover: '#182133',
        cardBorder: 'rgba(255, 255, 255, 0.07)',
        sidebarBg: '#0a0e17',
        
        // Brand & Accent Colors
        neonCyan: '#06b6d4',
        neonPink: '#ec4899',
        neonPurple: '#8b5cf6',
        cyberBlue: '#3b82f6',
        cyberEmerald: '#10b981',
        cyberRose: '#f43f5e',
        cyberAmber: '#f59e0b',
        
        // Text hierarchy
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        textSubtle: '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.3)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.3)',
        'glow-purple': '0 0 20px -3px rgba(139, 92, 246, 0.3)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [],
}

