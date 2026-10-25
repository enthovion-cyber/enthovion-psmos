'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export function AuthThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button type="button" onClick={toggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'} title={isDark ? 'Light theme' : 'Dark theme'} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border-interactive)] bg-[var(--psm-surface)] px-3 text-sm font-semibold text-[var(--psm-text)] shadow-sm transition hover:border-[var(--psm-primary)]">
      {isDark ? <Sun size={17} className="text-[var(--psm-primary)]" /> : <Moon size={17} className="text-[var(--brand-navy)]" />}
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
