/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Peta Suara Kota Design Tokens
        ink: '#2B2822',
        'paper-white': '#FAF6EE',
        'paper-kraft': '#E8D9B5',
        'paper-blue': '#D9E2E0',
        'stamp-red': '#B23327',
        mustard: '#C9972F',
        'muted-teal': '#4A7A6E',
        'board-bg': '#241F1B',

        // Urgency token aliases
        kritis: '#B23327',
        tinggi: '#C9972F',
        sedang: '#C9972F',
        rendah: '#4A7A6E',
      },
      fontFamily: {
        wordmark: ['"Caveat"', 'cursive'],
        handwriting: ['"Caveat"', 'cursive'],   // alias — same as wordmark
        mono: ['"Courier Prime"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        // Physical subtle borders & flat depth without digital glow slop
        'paper-flat': '0 0 0 1px #2B2822',
      },
    },
  },
  plugins: [],
};
