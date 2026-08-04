/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#f4ecd8', 2: '#eee2c6', 3: '#e7d8b6' },
        ink: { DEFAULT: '#2b2620', soft: '#5b5147', faint: '#8a7c69' },
        cinnabar: '#9e2b25',
        'cinnabar-soft': '#b8472f',
        gold: '#b08d57',
        rule: '#cdbfa3'
      },
      fontFamily: {
        kai: ['"STKaiti"', '"KaiTi"', '"KaiTi SC"', 'serif'],
        song: ['"Noto Serif SC"', '"Songti SC"', '"STSong"', '"SimSun"', 'serif']
      },
      boxShadow: {
        soft: '0 4px 14px rgba(43,38,32,0.18)'
      },
      maxWidth: {
        wrap: '1080px'
      }
    }
  },
  plugins: []
};
