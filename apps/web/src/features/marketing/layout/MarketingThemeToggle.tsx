'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export function MarketingThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface)] text-[var(--psm-text)] shadow-xs transition hover:border-[var(--psm-primary)] hover:bg-[var(--psm-surface-2)] active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun size={18} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon size={18} className="text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
