/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B5E3C",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#F5A623",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#2D6CDF",
          foreground: "#ffffff",
        },
        success: "#2E9E5B",
        warning: "#E8A33D",
        danger: "#D64545",
        background: "#f8fafc", // slate-50
        foreground: "#0f172a", // slate-900
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        muted: {
          DEFAULT: "#f1f5f9", // slate-100
          foreground: "#64748b", // slate-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Sora', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
      },
    },
  },
  plugins: [],
}
