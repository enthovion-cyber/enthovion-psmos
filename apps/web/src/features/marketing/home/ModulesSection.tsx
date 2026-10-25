'use client';

import Link from 'next/link';
import { ArrowRight, Shield, CheckCircle2, GitBranch, ClipboardCheck, FileSearch, ShieldCheck, Siren, Wrench, HardHat, FileText, UsersRound, BookOpenCheck } from 'lucide-react';
import { modules } from './marketing-content';

export function ModulesSection() {
  const standards: Record<string, string> = {
    'MOC': 'OSHA 1910.119(l)',
    'PSSR': 'OSHA 1910.119(i)',
    'HAZOP/PHA': 'OSHA 1910.119(e)',
    'LOPA/SIL': 'IEC 61511 / ISA 84',
    'Incident Investigation': 'OSHA 1910.119(m)',
    'Mechanical Integrity': 'OSHA 1910.119(j) • API',
    'PTW / Control of Work': 'OSHA 1910.119(k) • NFPA',
    'Document Control': 'OSHA 1910.119(d) • PSI',
    'Training': 'OSHA 1910.119(g)',
    'Audit & Reports': 'OSHA 1910.119(o) • CCPS'
  };

  return (
    <section id="modules" className="relative bg-[var(--psm-surface)]/70 backdrop-blur-md px-4 py-20 sm:px-6 lg:px-8 border-y border-black/[0.06] dark:border-white/[0.06] transition-colors">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Shield size={13} />
              <span>10 Core PSM Elements Connected</span>
            </div>

            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--psm-text)] leading-[1.14]">
              The Records That Control Process Safety Risk,{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                Fully Integrated.
              </span>
            </h2>

            <p className="mt-4 text-sm sm:text-base lg:text-lg leading-relaxed text-[var(--psm-muted)] font-normal">
              No more data silos. When an MOC is initiated, required HAZOP deviations, PSSR checklist gates, PTW field permits, and mechanical inspection actions trigger automatically.
            </p>
          </div>

          <Link
            href="/features"
            className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface-2)] px-4 text-xs sm:text-sm font-bold text-[var(--psm-text)] hover:border-[var(--psm-primary)] hover:text-[var(--psm-primary)] transition"
          >
            <span>Explore Element Specs</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* 10 Elements Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => {
            const standardCode = standards[module.title] || 'PSM Standard';
            const elementNum = `ELEMENT ${String(index + 1).padStart(2, '0')}`;
            return (
              <Link
                id={module.href.split('#')[1]}
                key={module.title}
                href={module.href}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-bg)]/80 p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[var(--psm-primary)]/50 hover:shadow-xl"
              >
                {/* Subtle hover gradient shimmer */}
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-[var(--psm-primary)]/10 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface)] text-[var(--psm-primary)] shadow-2xs transition-transform group-hover:scale-105 group-hover:bg-[var(--psm-primary)] group-hover:text-white">
                      <module.icon size={20} />
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-mono font-bold text-[var(--psm-muted)]">
                        {elementNum}
                      </span>
                      <span className="mt-0.5 inline-block rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        {standardCode}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-[var(--psm-text)] group-hover:text-[var(--psm-primary)] transition leading-snug">
                    {module.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--psm-muted)] font-normal">
                    {module.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between text-xs font-semibold text-[var(--psm-primary)]">
                  <span>{module.status}</span>
                  <div className="flex items-center gap-1 transition-transform group-hover:translate-x-1">
                    <span className="text-[11px]">View module</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
