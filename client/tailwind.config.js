/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#020610',
          900: '#040B1C',
          800: '#080F25',
          700: '#0D1530',
          600: '#12203D',
        },
        teal: { glow: '#00E5CC' },
        gold: { glow: '#FFB800' },
      },
      animation: {
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float-plane': 'floatPlane 8s ease-in-out infinite',
        'marquee': 'marquee 40s linear infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,229,204,0.3), 0 0 40px rgba(0,229,204,0.1)' },
          '50%':       { boxShadow: '0 0 40px rgba(0,229,204,0.7), 0 0 80px rgba(0,229,204,0.25)' },
        },
        floatPlane: {
          '0%, 100%': { transform: 'translateY(0px) rotate(-8deg)' },
          '50%':       { transform: 'translateY(-18px) rotate(-8deg)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.5' },
          '50%':       { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
