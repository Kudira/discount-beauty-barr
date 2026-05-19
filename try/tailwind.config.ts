import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream:      'var(--cream)',
        'cream-dark': 'var(--cream-dark)',
        nude:       'var(--nude)',
        'nude-dark': 'var(--nude-dark)',
        blush:      'var(--blush)',
        'blush-light': 'var(--blush-light)',
        'blush-dark': 'var(--blush-dark)',
        rose:       'var(--rose)',
        'rose-dark': 'var(--rose-dark)',
        mauve:      'var(--mauve)',
        charcoal:   'var(--charcoal)',
        'warm-grey': 'var(--warm-grey)',
        'light-grey': 'var(--light-grey)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body:    ['Jost', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
