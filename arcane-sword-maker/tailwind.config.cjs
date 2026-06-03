/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: require('tailwindcss/colors').slate,
        gray: require('tailwindcss/colors').gray,
        neutral: require('tailwindcss/colors').neutral,
        zinc: Object.fromEntries(Object.entries(require('tailwindcss/colors').zinc).filter(([k]) => Number(k) <= 400)),
        stone: Object.fromEntries(Object.entries(require('tailwindcss/colors').stone).filter(([k]) => Number(k) <= 400)),
        taupe: Object.fromEntries(Object.entries(require('tailwindcss/colors').taupe || {}).filter(([k]) => Number(k) <= 400)),
        mauve: Object.fromEntries(Object.entries(require('tailwindcss/colors').mauve || {}).filter(([k]) => Number(k) <= 400)),
        mist: Object.fromEntries(Object.entries(require('tailwindcss/colors').mist || {}).filter(([k]) => Number(k) <= 400)),
        olive: Object.fromEntries(Object.entries(require('tailwindcss/colors').olive || {}).filter(([k]) => Number(k) <= 400)),
      },
    },
  },
  plugins: [],
}
