'use client';

import { securityItems } from './marketing-content';
import { Lock, ShieldCheck, KeyRound, Server, FileLock2, Award, CheckCircle2 } from 'lucide-react';

export function SecuritySection() {
  return (
    <section id="security" className="relative px-4 py-20 sm:px-6 lg:px-8 bg-[var(--psm-bg)] transition-colors">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--psm-primary)]/30 bg-[var(--psm-primary)]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--psm-primary)]">
            <Lock size={13} />
            <span>Industrial Cybersecurity & Governance</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--psm-text)] leading-[1.14]">
            Enterprise Security Controls for{' '}
            <span className="bg-gradient-to-r from-[var(--psm-primary)] to-amber-500 bg-clip-text text-transparent">
              Regulated Industrial Facilities.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base lg:text-lg leading-relaxed text-[var(--psm-muted)] font-normal">
            Chemical, pharmaceutical, and energy facilities require unwavering data isolation and audit trails. Enthovion PSM OS guarantees multi-tenant partition, encrypted storage, and regulatory readiness.
          </p>
        </div>

        {/* 6 Security Cards Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {securityItems.map((item) => (
            <div
              key={item.title}
              className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface)] p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[var(--psm-primary)]/50 hover:shadow-xl"
            >
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface-2)] text-[var(--psm-primary)] shadow-2xs transition-transform group-hover:scale-105">
                  <item.icon size={20} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-[var(--psm-text)] leading-snug">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--psm-muted)] font-normal">
                  {item.text}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                <span>Enterprise Enforced</span>
              </div>
            </div>
          ))}
        </div>

        {/* 21 CFR Part 11 Banner */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface)]/80 backdrop-blur-sm p-6 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Award size={22} />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--psm-text)]">
                21 CFR Part 11 &amp; EU Annex 11 Electronic Records Compliance
              </div>
              <div className="text-xs text-[var(--psm-muted)] font-medium mt-0.5">
                Includes signer manifestation, reason for signature, user biometric / credentials check, and tamper-evident SHA-256 cryptographic hashes.
              </div>
            </div>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-2xs">
            Audit-Proof Architecture
          </span>
        </div>
      </div>
    </section>
  );
}
