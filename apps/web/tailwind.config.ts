import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: 'var(--psm-surface)',
        panel2: 'var(--psm-surface-2)',
        line: 'var(--psm-line)',
        primary: 'var(--psm-primary)',
        brand: 'var(--brand-navy)',
        action: 'var(--action-primary)',
        canvas: 'var(--bg-canvas)',
        ai: 'var(--ai-primary)',
        success: 'var(--psm-success)',
        warning: 'var(--psm-warning)',
        danger: 'var(--psm-danger)',
        info: 'var(--psm-info)',
        progress: 'var(--status-progress)',
        draft: 'var(--status-draft)'
      },
      boxShadow: {
        psm: '0 18px 60px rgba(0,0,0,.35)'
      }
    }
  },
  plugins: []
};

export default config;
