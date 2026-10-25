'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { GetStartedButton } from '../cta/GetStartedButton';
import { MarketingMobileMenu } from './MarketingMobileMenu';
import { MarketingBrand } from './MarketingBrand';
import { MarketingThemeToggle } from './MarketingThemeToggle';
import { navItems } from './marketing-nav';

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] dark:border-white/[0.06] bg-[var(--psm-surface)]/85 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-[72px] sm:h-[80px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <MarketingBrand />

        <nav className="hidden items-center gap-1 xl:gap-2 lg:flex">
          {navItems.map((item) => (
            <div key={item.label} className="group relative">
              <Link
                href={item.href}
                className="rounded-xl px-3 py-1.5 text-xs xl:text-sm font-semibold text-[var(--psm-muted)] transition hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]"
              >
                {item.label}
              </Link>
              {item.items?.length ? (
                <div className="invisible absolute left-0 top-11 w-72 translate-y-2 rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 z-50">
                  {item.items.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className="block rounded-xl p-2.5 hover:bg-[var(--psm-surface-2)] transition"
                    >
                      <span className="block text-xs font-bold text-[var(--psm-text)]">{child.label}</span>
                      {child.description ? (
                        <span className="mt-0.5 block text-[11px] leading-tight text-[var(--psm-muted)]">
                          {child.description}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        {/* Clean, spacious action area on the right */}
        <div className="hidden items-center gap-3.5 lg:flex">
          <MarketingThemeToggle />
          <Link
            href="/login"
            className="rounded-xl px-3 py-1.5 text-xs xl:text-sm font-bold text-[var(--psm-muted)] hover:text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition"
          >
            Sign In
          </Link>
          <GetStartedButton className="min-w-28 min-h-10 px-4 text-xs font-bold shadow-sm rounded-xl" />
        </div>

        {/* Mobile hamburger menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <MarketingThemeToggle />
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--psm-line)] text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
      <MarketingMobileMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
