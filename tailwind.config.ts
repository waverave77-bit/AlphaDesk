import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        brand: {
          DEFAULT: '#f97316', // orange-500
          dark: '#ea580c',    // orange-600
          light: '#fb923c',   // orange-400
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', '"Arial Black"', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'Menlo', 'monospace'],
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'ticker-left': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-33.333%)' } },
        'ticker-right': { '0%': { transform: 'translateX(-33.333%)' }, '100%': { transform: 'translateX(0)' } },
        'scan-sweep': { '0%': { transform: 'translateY(-10%)' }, '100%': { transform: 'translateY(110vh)' } },
        'blob-float': { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(3%,-4%) scale(1.08)' } },
        'blink-cursor': { '0%,49%': { opacity: '1' }, '50%,100%': { opacity: '0' } },
        'flicker-glow': { '0%,100%': { opacity: '1' }, '92%': { opacity: '1' }, '93%': { opacity: '0.4' }, '94%': { opacity: '1' }, '96%': { opacity: '0.6' }, '97%': { opacity: '1' } },
        'gauge-fill': { from: { width: '0%' }, to: { width: 'var(--fill, 0%)' } },
        'radar-spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        'tile-in': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.97)', filter: 'blur(2px)' },
          '60%': { opacity: '1', transform: 'translateY(-2px) scale(1.005)', filter: 'blur(0)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'ticker-left': 'ticker-left var(--ticker-speed, 40s) linear infinite',
        'ticker-right': 'ticker-right var(--ticker-speed, 50s) linear infinite',
        'scan-sweep': 'scan-sweep 6s linear infinite',
        'blob-float': 'blob-float 12s ease-in-out infinite',
        'blink-cursor': 'blink-cursor 1s step-end infinite',
        'flicker-glow': 'flicker-glow 4s ease-in-out infinite',
        'gauge-fill': 'gauge-fill 1.2s cubic-bezier(0.16,1,0.3,1) forwards',
        'radar-spin': 'radar-spin 7s linear infinite',
        'tile-in': 'tile-in 0.5s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
