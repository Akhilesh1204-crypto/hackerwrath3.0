import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0b1f1b',
          800: '#102a25',
          700: '#16362f',
          600: '#1e463d',
          500: '#2a5a4f',
        },
        pine: '#0f3d36',
        moss: '#1f6f5c',
        sage: {
          50: '#f2f7f2',
          100: '#e6efe7',
          200: '#cfdfd2',
          300: '#adc7b3',
          400: '#7fa88a',
        },
        sand: {
          50: '#fbf8f2',
          100: '#f6f1e7',
          200: '#ece2d1',
          300: '#ddcdb2',
          400: '#c8b190',
        },
        clay: {
          100: '#f8e8dc',
          300: '#e0a87f',
          400: '#d08a5c',
          500: '#c2703d',
          600: '#a5572a',
        },
        gold: {
          300: '#e6c784',
          400: '#d9ae5f',
          500: '#c9963f',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Iowan Old Style',
          'Palatino Linotype',
          'Palatino',
          'Book Antiqua',
          'Georgia',
          'serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11, 31, 27, 0.04), 0 12px 32px -18px rgba(11, 31, 27, 0.28)',
        lift: '0 2px 4px rgba(11, 31, 27, 0.05), 0 24px 48px -24px rgba(11, 31, 27, 0.35)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.35s ease both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
