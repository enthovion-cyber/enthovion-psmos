'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { StartTrialButton } from '../cta/StartTrialButton';
import { GetStartedButton } from '../cta/GetStartedButton';
import { navItems } from './marketing-nav';

export function MarketingMobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm lg:hidden">
      <aside className="ml-auto flex h-full w-full max-w-sm flex-col border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="font-black">Enthovion PSM OS</div>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--psm-line)]" onClick={onClose} aria-label="Close marketing menu">
            <X size={18} />
          </button>
        </div>
        <nav className="mt-5 flex-1 space-y-4 overflow-auto">
          {navItems.map((item) => (
            <section key={item.label}>
              <Link href={item.href} onClick={onClose} className="block rounded-lg bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-bold">{item.label}</Link>
              {item.items?.length ? (
                <div className="mt-2 grid gap-1 pl-2">
                  {item.items.map((child) => <Link key={child.label} href={child.href} onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">{child.label}</Link>)}
                </div>
              ) : null}
            </section>
          ))}
        </nav>
        <div className="mt-4 grid gap-2 border-t border-[var(--psm-line)] pt-4">
          <StartTrialButton className="w-full" />
          <GetStartedButton className="w-full" />
          <Link href="/login" onClick={onClose} className="psm-button psm-button-secondary w-full">Login</Link>
        </div>
      </aside>
    </div>
  );
}
