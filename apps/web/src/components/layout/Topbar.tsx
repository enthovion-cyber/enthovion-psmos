'use client';

import { CircleHelp, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { CompanySwitcher } from '@/features/workspace/switcher/CompanySwitcher';
import { WorkspaceSiteSwitcher } from '@/features/workspace/switcher/SiteSwitcher';
import { NotificationBell } from './NotificationBell';

export function Topbar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--psm-line)] bg-[color-mix(in_srgb,var(--psm-bg)_88%,transparent)] px-4 py-3 pl-16 backdrop-blur-xl lg:pl-5">
      <button type="button" onClick={onSearchOpen} className="hidden h-10 min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 text-left text-sm text-[var(--psm-muted)] shadow-sm transition hover:border-info/50 hover:text-[var(--psm-text)] md:flex">
        <Search size={17} />
        Search equipment, documents, actions, workflows...
        <span className="ml-auto rounded border border-[var(--psm-line)] px-1.5 py-0.5 text-xs">Ctrl K</span>
      </button>
      <CompanySwitcher />
      <WorkspaceSiteSwitcher />
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button onClick={onSearchOpen} className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-muted)] hover:text-[var(--psm-text)] md:hidden" aria-label="Open global search">
          <Search size={18} />
        </button>
        <NotificationBell />
        <button className="hidden h-10 w-10 place-items-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-muted)] hover:text-[var(--psm-text)] sm:grid" aria-label="Help">
          <CircleHelp size={18} />
        </button>
        <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-muted)] hover:text-[var(--psm-text)]" aria-label="Toggle theme">
          <ThemeIcon size={18} />
        </button>
      </div>
    </header>
  );
}
