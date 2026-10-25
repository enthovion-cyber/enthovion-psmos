'use client';

import Link from 'next/link';
import { MarketingBrand } from './MarketingBrand';
import { CheckCircle2, ShieldCheck, Radio } from 'lucide-react';

type FooterColumn = {
  title: string;
  links: Array<[label: string, href: string]>;
};

const columns: FooterColumn[] = [
  {
    title: 'Platform Architecture',
    links: [
      ['System Overview', '/'],
      ['All Features', '/features'],
      ['10 Core Elements', '/#modules'],
      ['Pricing & Licensing', '/pricing'],
      ['Security & Architecture', '/security']
    ]
  },
  {
    title: 'PSM Elements',
    links: [
      ['Management of Change (MOC)', '/features#moc'],
      ['Pre-Startup Safety Review (PSSR)', '/features#pssr'],
      ['HAZOP & PHA Studies', '/features#hazop'],
      ['LOPA & SIL Determination', '/features#lopa'],
      ['Incident Investigation & RCA', '/features#incidents'],
      ['Mechanical Integrity (MI)', '/features#mi'],
      ['Permit to Work (PTW)', '/features#ptw'],
      ['Document Control & PSI', '/features#documents']
    ]
  },
  {
    title: 'Sector Solutions',
    links: [
      ['Chemical Manufacturing', '/solutions#chemical'],
      ['Petrochemical & Refining', '/solutions#oil-gas'],
      ['Fertilizer & Ammonia', '/solutions#fertilizer'],
      ['Clean Energy & Utilities', '/solutions#utilities'],
      ['EHS & Safety Leadership', '/solutions#ehs'],
      ['Process Safety Engineers', '/solutions#engineers']
    ]
  },
  {
    title: 'Governance & Trust',
    links: [
      ['Privacy Policy', '/#privacy'],
      ['Terms of Service', '/#terms'],
      ['Security Controls', '/security'],
      ['21 CFR Part 11 Audit Trail', '/security#audit'],
      ['Data Processing Addendum', '/#data-processing'],
      ['Contact Engineering Team', '/contact']
    ]
  }
];

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-black/[0.06] dark:border-white/[0.06] bg-[var(--psm-surface)]/80 backdrop-blur-md transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div className="space-y-4">
            <MarketingBrand />
            <p className="max-w-sm text-xs sm:text-sm leading-relaxed text-[var(--psm-muted)] font-normal">
              The AI-assisted Process Safety Management Operating System engineered for hazardous chemical, energy, refining, and mission-critical industrial facilities.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>All Systems Operational • SOC 2 Certified</span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2 text-xs font-medium text-[var(--psm-muted)]">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-500" /> OSHA 1910.119
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-500" /> CCPS RBPS
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-500" /> IEC 61511 (SIL)
              </span>
            </div>
          </div>

          <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-text)]">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-xs font-medium text-[var(--psm-muted)] transition hover:text-[var(--psm-primary)] hover:underline"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/[0.05] dark:border-white/[0.05] pt-6 text-xs text-[var(--psm-muted)] sm:flex-row font-normal">
          <div>
            © {new Date().getFullYear()} Enthovion PSM OS. All rights reserved. Industrial Process Safety Software.
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-blue-500" /> Multi-Tenant Scope Partitioning
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
