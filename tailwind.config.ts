import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#CC2222',
          'red-light': '#F9E9E9',
          'red-mid': '#E05555',
          black: '#111111',
        },
        modality: {
          online:     { DEFAULT: '#111111', bg: '#E8E8E8' },
          presencial: { DEFAULT: '#CC2222', bg: '#F9E9E9' },
          domicilio:  { DEFAULT: '#1A5FA8', bg: '#E8F0F9' },
          hibrida:    { DEFAULT: '#6B3FA0', bg: '#F0EAF9' },
        },
        status: {
          pending:    { DEFAULT: '#B38000', bg: '#FFF8E0' },
          confirmed:  { DEFAULT: '#2A7A2A', bg: '#E8F5E8' },
          cancelled:  { DEFAULT: '#888888', bg: '#F0F0F0' },
          rescheduled:{ DEFAULT: '#C47000', bg: '#FFF3E0' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
