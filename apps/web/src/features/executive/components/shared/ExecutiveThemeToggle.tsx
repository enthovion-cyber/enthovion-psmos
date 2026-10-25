'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

interface Props {
  className?: string;
  showLabel?: boolean;
}

export function ExecutiveThemeToggle({ className = '', showLabel = true }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Current: ${isDark ? 'Dark Mode' : 'Light Mode'}. Click to switch to ${isDark ? 'Light' : 'Dark'} Mode.`}
      className={`group relative inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)] shadow-sm transition-all duration-200 hover:border-[var(--psm-primary)] hover:bg-[var(--psm-surface-2)] active:scale-95 ${className}`}
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        {isDark ? (
          <Moon className="h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:-rotate-12" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
        )}
      </div>

      {showLabel ? (
        <span className="hidden sm:inline font-medium tracking-wide">
          {isDark ? 'Dark Theme' : 'Light Theme'}
        </span>
      ) : null}

      <span
        aria-hidden="true"
        className="ml-1 inline-block h-2 w-2 rounded-full transition-colors duration-200"
        style={{ backgroundColor: isDark ? '#38bdf8' : '#f59e0b' }}
      />
    </button>
  );
}
