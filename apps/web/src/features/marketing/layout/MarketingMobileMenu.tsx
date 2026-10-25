'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { GetStartedButton } from '../cta/GetStartedButton';
import { MarketingBrand } from './MarketingBrand';
import { MarketingThemeToggle } from './MarketingThemeToggle';
import { navItems } from './marketing-nav';

export function MarketingMobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in">
      <aside className="ml-auto flex h-full w-full max-w-sm flex-col border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-2xl transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--psm-line)]">
          <MarketingBrand compact />
          <div className="flex items-center gap-2">
            <MarketingThemeToggle />
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--psm-line)] text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
              onClick={onClose}
              aria-label="Close marketing menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
          {navItems.map((item) => (
            <section key={item.label}>
              <Link
                href={item.href}
                onClick={onClose}
                className="block rounded-xl bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-bold text-[var(--psm-text)]"
              >
                {item.label}
              </Link>
              {item.items?.length ? (
                <div className="mt-1.5 grid gap-1 pl-2">
                  {item.items.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      onClick={onClose}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </nav>

        <div className="mt-4 grid gap-2.5 border-t border-[var(--psm-line)] pt-4">
          <GetStartedButton className="w-full text-xs font-black shadow-sm" />
          <Link
            href="/login"
            onClick={onClose}
            className="psm-button psm-button-secondary w-full text-xs font-bold"
          >
            Sign In to Workspace
          </Link>
        </div>
      </aside>
    </div>
  );
}
