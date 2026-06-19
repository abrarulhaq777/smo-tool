/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // obsidian black
        foreground: '#f4f4f5',
        card: {
          DEFAULT: 'rgba(24, 24, 27, 0.65)',
          border: 'rgba(39, 39, 42, 0.4)',
        },
        primary: {
          DEFAULT: '#6366f1', // Indigo
          hover: '#4f46e5',
          glow: 'rgba(99, 102, 241, 0.15)',
        },
        secondary: {
          DEFAULT: '#a855f7', // Violet
          hover: '#9333ea',
          glow: 'rgba(168, 85, 247, 0.15)',
        },
        accent: {
          DEFAULT: '#06b6d4', // Cyan
          hover: '#0891b2',
        },
        muted: {
          DEFAULT: '#71717a',
          foreground: '#a1a1aa',
        },
        success: '#10b981',
        warning: '#f59e0b',
        destructive: '#ef4444',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
