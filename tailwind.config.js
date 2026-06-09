/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Vercel-style design tokens
        background: 'var(--bg-page)',
        surface: 'var(--bg-surface)',
        hover: 'var(--bg-hover)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        destructive: 'var(--destructive)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
}
