/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0B0F19',
          elevated: '#121826',
          soft: '#E8ECF4',
          text: '#F4F6FA',
          muted: '#8B93A8',
        },
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderColor: {
        glass: 'rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'coin-spin': 'coinSpin3d 1.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        coinSpin3d: {
          '0%': {
            transform: 'rotateY(0deg) translateZ(0)',
            filter: 'brightness(1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
          },
          '25%': {
            transform: 'rotateY(360deg) translateZ(12px)',
            filter: 'brightness(1.15)',
            boxShadow: '0 16px 28px rgba(251,191,36,0.25)',
          },
          '50%': {
            transform: 'rotateY(720deg) translateZ(4px)',
            filter: 'brightness(0.95)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
          },
          '75%': {
            transform: 'rotateY(1080deg) translateZ(10px)',
            filter: 'brightness(1.1)',
            boxShadow: '0 14px 26px rgba(251,191,36,0.2)',
          },
          '100%': {
            transform: 'rotateY(1440deg) translateZ(0)',
            filter: 'brightness(1)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
          },
        },
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};
