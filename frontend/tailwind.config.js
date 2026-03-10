/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#030508',
        panel:   '#080d14',
        panel2:  '#0c1420',
        border:  '#0f3a5a',
        accent:  '#00d4ff',
        danger:  '#ff3c5a',
        success: '#00ff88',
        warn:    '#ffaa00',
      },
      fontFamily: {
        mono:  ['"Share Tech Mono"', 'monospace'],
        hud:   ['"Exo 2"', 'sans-serif'],
        body:  ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        glow:       '0 0 20px rgba(0,212,255,0.3)',
        'glow-red': '0 0 20px rgba(255,60,90,0.3)',
        'glow-grn': '0 0 20px rgba(0,255,136,0.3)',
      },
    },
  },
  plugins: [],
}
