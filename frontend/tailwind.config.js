/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Civic Newspaper Design Tokens
        paper: '#F4EEDF',
        'paper-bg': '#F4EEDF',
        'paper-white': '#FAF6EE',
        'paper-card': '#FAF6EE',
        'paper-kraft': '#E8D9B5',
        ink: '#1E1B16',
        'ink-dim': '#5E584E',
        'ink-muted': '#8E8679',
        'border-paper': '#CFC4AB',
        'border-subtle': '#E2D9C5',

        // Severity (Red is ONLY for severity)
        'severity-critical': '#C0392B',
        'severity-high': '#D9822B',
        kritis: '#C0392B',
        tinggi: '#D9822B',

        // Category Identity Colors (Muted)
        'cat-infrastruktur': '#3E5C76',
        'cat-kebersihan': '#5E7C4A',
        'cat-keamanan': '#5B3F6E',
        'cat-banjir': '#2A7F86',
        'cat-lainnya': '#8A7F70',

        // Legacy / accent tokens
        'board-bg': '#F4EEDF',
        'stamp-red': '#C0392B',
        'mustard': '#C9972F',
        'paper-blue': '#E1EAF0',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        serif: ['"Fraunces"', 'serif'],
        wordmark: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"Courier Prime"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
      },
      boxShadow: {
        // Physical subtle borders & flat depth without digital glow slop
        'paper-flat': '0 0 0 1px #2B2822',
      },
    },
  },
  plugins: [],
};
