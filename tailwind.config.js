/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Vert profond du sac du logo -> couleur de marque principale (nav, boutons primaires)
        forest: {
          50: '#eaf3ec',
          100: '#cfe4d4',
          200: '#a3cbae',
          300: '#6fac81',
          400: '#3d8759',
          500: '#1f6b3e',
          600: '#155232',
          700: '#123f28', // brand core
          800: '#0e2f1e',
          900: '#0a2116',
        },
        // Vert vif du degrade du sac -> accents, etats actifs
        leaf: {
          400: '#8ed15a',
          500: '#6cb936', // brand accent
          600: '#549a26',
        },
        // Jaune de l'ampoule + eclairage de la boutique -> CTA, mise en avant des montants
        gold: {
          300: '#f7d878',
          400: '#f0c04a',
          500: '#e8ab2e', // brand cta
          600: '#c98d1c',
        },
        // Noir chaud des etageres de la boutique -> fonds sombres, sidebar
        charcoal: {
          800: '#22241f',
          900: '#181913',
          950: '#101109',
        },
        cream: '#faf8f2',
        ink: '#16231b',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'ui-rounded', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,17,9,0.06), 0 8px 24px -12px rgba(16,17,9,0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
