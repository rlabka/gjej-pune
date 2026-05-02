/** @type {import('tailwindcss').Config} */
// Design tokens mirror apps/web/src/app/globals.css (Tailwind 4 @theme inline).
// We redefine them here in Tailwind 3 syntax because NativeWind v4 targets TW 3.
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        foreground: '#333333',
        primary: {
          DEFAULT: '#F5C400',
          foreground: '#162C66',
        },
        secondary: {
          DEFAULT: '#162C66',
          foreground: '#FFFFFF',
        },
        accent: '#F5C400',
        'neutral-bg': '#F7F7F7',
        muted: '#6B7280',
        border: '#E5E7EB',
        danger: '#DC2626',
        success: '#16A34A',
      },
      borderRadius: {
        DEFAULT: '0.75rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
