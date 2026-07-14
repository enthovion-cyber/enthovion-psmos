'use client';

import Link from 'next/link';
import { Menu, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { StartTrialButton } from '../cta/StartTrialButton';
import { GetStartedButton } from '../cta/GetStartedButton';
import { MarketingMobileMenu } from './MarketingMobileMenu';
import { navItems } from './marketing-nav';

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[color-mix(in_srgb,var(--psm-line)_70%,transparent)] bg-[color-mix(in_srgb,var(--psm-surface)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Enthovion PSM OS home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-950/20">
            <ShieldCheck size={21} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black tracking-tight sm:text-base">Enthovion PSM OS</span>
            <span className="block truncate text-[11px] font-semibold text-[var(--psm-muted)]">AI-assisted process safety</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <div key={item.label} className="group relative">
              <Link href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--psm-muted)] transition hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]">{item.label}</Link>
              {item.items?.length ? (
                <div className="invisible absolute left-0 top-10 w-72 translate-y-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 opacity-0 shadow-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.items.map((child) => (
                    <Link key={child.label} href={child.href} className="block rounded-lg p-3 hover:bg-[var(--psm-surface-2)]">
                      <span className="block text-sm font-bold">{child.label}</span>
                      {child.description ? <span className="mt-1 block text-xs leading-5 text-[var(--psm-muted)]">{child.description}</span> : null}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-bold text-[var(--psm-muted)] hover:text-[var(--psm-text)]">Login</Link>
          <StartTrialButton />
          <GetStartedButton className="min-w-28" />
        </div>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--psm-line)] lg:hidden" onClick={() => setOpen(true)} aria-label="Open marketing menu">
          <Menu size={19} />
        </button>
      </div>
      <MarketingMobileMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
