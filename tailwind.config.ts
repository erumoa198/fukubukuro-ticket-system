import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ローズゴールド / ゴールド系のアクセントカラー
        'rose-gold': {
          50: '#fdf8f6',
          100: '#f9ebe5',
          200: '#f3d7cc',
          300: '#e9b8a6',
          400: '#dc9178',
          500: '#c97d66',
          600: '#b76a54',
          700: '#9a5745',
          800: '#7f4a3c',
          900: '#6a4035',
        },
        'gold': {
          50: '#fdfbf3',
          100: '#faf4dc',
          200: '#f4e7b8',
          300: '#ecd58a',
          400: '#e2bd5c',
          500: '#d4a338',
          600: '#bf8a2c',
          700: '#9f6d25',
          800: '#825624',
          900: '#6b4721',
        },
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
        serif: ['Noto Serif JP', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
