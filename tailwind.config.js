/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
          'gradient-rainbow': 'linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcf7f, #4d9de0)',
        },
        animation: {
          'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
          'float': 'float 6s ease-in-out infinite',
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
          'gradient-shift': {
            '0%, 100%': { 'background-position': '0% 50%' },
            '50%': { 'background-position': '100% 50%' },
          },
          'float': {
            '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
            '25%': { transform: 'translateY(-20px) translateX(10px)' },
            '50%': { transform: 'translateY(-10px) translateX(-10px)' },
            '75%': { transform: 'translateY(-30px) translateX(5px)' },
          },
        },
        backdropBlur: {
          xs: '2px',
        },
      },
    },
    plugins: [],
  }