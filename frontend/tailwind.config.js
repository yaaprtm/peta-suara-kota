/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme Colors
        navy: {
          DEFAULT: '#1E3A5F',
          50: '#F0F5FA',
          100: '#E1EBF5',
          200: '#C3D7EC',
          300: '#94B8DC',
          400: '#5A91C5',
          500: '#1E3A5F',
          600: '#183151',
          700: '#132640',
          800: '#0F1D30',
          900: '#0A1320',
        },
        orange: {
          DEFAULT: '#F5A524',
          50: '#FFF9ED',
          100: '#FEF2D6',
          200: '#FDE4AB',
          300: '#FBD175',
          400: '#F8B943',
          500: '#F5A524',
          600: '#DB8912',
          700: '#B5680E',
          800: '#915013',
          900: '#764213',
        },
        ink: {
          DEFAULT: '#10213A',
          dim: '#4A5B73',
          muted: '#7C8BA1',
          subtle: '#94A3B8',
          border: '#E2E8F0',
        },
        base: '#FFFFFF',
        surface: '#FFFFFF',
        canvas: '#F8FAFC',
        card: '#FFFFFF',

        // Urgency Colors
        urgency: {
          kritis: '#DC2626',
          tinggi: '#EA580C',
          sedang: '#F5A524',
          rendah: '#10B981',
        },

        // Category identity
        cat: {
          infrastruktur: '#1E3A5F',
          kebersihan: '#059669',
          keamanan: '#7C3AED',
          banjir: '#0284C7',
          lainnya: '#4A5B73',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Inter"', 'sans-serif'],
        mono: ['"Courier Prime"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(16, 33, 58, 0.06), 0 1px 2px -1px rgba(16, 33, 58, 0.04)',
        elevated: '0 4px 6px -1px rgba(16, 33, 58, 0.08), 0 2px 4px -2px rgba(16, 33, 58, 0.05)',
        modal: '0 20px 25px -5px rgba(16, 33, 58, 0.12), 0 8px 10px -6px rgba(16, 33, 58, 0.08)',
      },
    },
  },
  plugins: [],
};
