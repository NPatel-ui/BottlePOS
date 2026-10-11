/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bright, airy light theme surfaces
        bg: {
          DEFAULT: '#f8fafc',  // Slate 50
          raised: '#ffffff',   // White
          elevated: '#ffffff', // White
          overlay: '#f1f5f9',  // Slate 100
        },
        // Text hierarchy
        label: {
          primary: '#0f172a',   // Slate 900
          secondary: '#475569', // Slate 600
          tertiary: '#94a3b8',  // Slate 400
          quaternary: '#cbd5e1',// Slate 300
        },
        // Accent (Brand new vibrant Sky Blue)
        accent: {
          DEFAULT: '#0ea5e9', // Sky 500
          hover: '#38bdf8',   // Sky 400
          subtle: '#e0f2fe',  // Sky 100
          glow: 'rgba(14, 165, 233, 0.4)',
        },
        // Mappings for existing app classes
        background: '#f8fafc',
        surface: '#ffffff',
        surfaceHover: '#f1f5f9',
        border: '#e2e8f0', // Slate 200
        borderFocus: '#0ea5e9',
        textMain: '#0f172a',
        textMuted: '#64748b', // Slate 500
        primary: '#0ea5e9',
        primaryHover: '#0284c7', // Sky 600
        primaryText: '#ffffff',
        danger: '#ef4444',
        success: '#10b981',
        
        // Semantic
        red: { DEFAULT: '#ef4444', subtle: '#fee2e2' },
        orange: { DEFAULT: '#f97316', subtle: '#ffedd5' },
        green: { DEFAULT: '#10b981', subtle: '#d1fae5' },
        yellow: { DEFAULT: '#eab308', subtle: '#fef9c3' },
        // Separators
        separator: '#e2e8f0',
        separatorLight: '#f1f5f9',
      },
      borderRadius: {
        'apple': '16px',
        'apple-lg': '24px',
        'apple-xl': '32px',
        'apple-2xl': '40px',
      },
      boxShadow: {
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        'floating': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'button': '0 4px 6px -1px rgba(14, 165, 233, 0.2), 0 2px 4px -2px rgba(14, 165, 233, 0.2)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-accent': 'linear-gradient(to right, #0ea5e9, #3b82f6)', // Sky to Blue
      }
    },
  },
  plugins: [],
}
