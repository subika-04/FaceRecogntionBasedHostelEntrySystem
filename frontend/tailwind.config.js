/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Signal" palette: a vibrant AI-product identity (indigo -> violet
        // -> pink) replacing the earlier muted "Access Ledger" navy/brass
        // system per direct design-direction sign-off. Token *names* are
        // kept identical to the previous system (ink, paper, brass,
        // verified, caution, denied, slate, brand) so every one of the ~70
        // existing component files that already reference e.g. `bg-brass-500`
        // or `text-ink` repaint correctly with zero per-file edits -- only
        // the hex values underneath change. See DESIGN_SYSTEM.md.
        ink: {
          DEFAULT: '#1E1B4B', // primary structural text color (indigo-950)
          light: '#312C6B',
        },
        paper: '#F6F5FD', // faint indigo-tinted page background
        brass: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#4F46E5', // primary action / signature accent color (indigo-600)
          600: '#4338CA',
          700: '#3730A3',
          800: '#312E81',
          900: '#272654',
        },
        verified: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          400: '#34D399',
          500: '#10B981', // MATCHED / success
          600: '#059669',
          700: '#047857',
          800: '#065F46',
        },
        caution: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B', // LOW_CONFIDENCE
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
        },
        denied: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          400: '#F87171',
          500: '#EF4444', // UNKNOWN / failure / destructive
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
        },
        slate: {
          50: '#F8F8FC',
          100: '#EEEDF9',
          200: '#DEDCF3',
          300: '#C3C0E4',
          400: '#9B98C4',
          500: '#6E6A9E',
          600: '#544F81',
          700: '#3D3966',
          800: '#2B2851',
          900: '#1E1B4B',
        },
        // Kept for any not-yet-migrated component still referencing the old
        // token names -- maps onto the new palette so nothing breaks visually
        // mid-migration.
        surface: '#F6F5FD',
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
          800: '#312E81',
        },
        // New accent used sparingly for gradients/highlights (pink end of
        // the indigo -> violet -> pink signature gradient).
        accent: {
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #EC4899 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 55%, #FCE7F3 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        // The signature motion: a slow scan-line sweep across the camera
        // viewport during face capture/verification -- a literal reference
        // to what the system is actually doing (scanning a face embedding),
        // not decorative motion. See ScanFrame.jsx.
        'scan-sweep': {
          '0%': { transform: 'translateY(-2%)', opacity: '0.15' },
          '50%': { opacity: '0.9' },
          '100%': { transform: 'translateY(102%)', opacity: '0.15' },
        },
      },
      animation: {
        'scan-sweep': 'scan-sweep 2.4s ease-in-out infinite',
      },
      boxShadow: {
        card: '0 1px 2px rgba(79, 70, 229, 0.06), 0 4px 16px rgba(79, 70, 229, 0.08)',
        glow: '0 8px 24px rgba(79, 70, 229, 0.25)',
      },
    },
  },
  plugins: [],
}
