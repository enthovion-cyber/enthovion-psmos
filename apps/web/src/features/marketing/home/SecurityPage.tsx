'use client';

import { SecuritySection } from './SecuritySection';
import { ShieldCheck, Lock } from 'lucide-react';
import { StartTrialButton } from '../cta/StartTrialButton';
import { ContactSalesButton } from '../cta/ContactSalesButton';

export function SecurityPage() {
  return (
    <main>
      <section className="relative isolate overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-[var(--psm-line)] bg-[var(--psm-surface)] transition-colors">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(14,165,233,0.12),transparent),linear-gradient(180deg,var(--psm-bg),var(--psm-surface))]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
              <Lock size={13} />
              <span>Enterprise Industrial Security</span>
            </div>
            <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--psm-text)] leading-tight">
              Company/Site Isolation, RBAC, and Tamper-Evident Audit Trails.
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--psm-muted)]">
              Enthovion PSM OS ensures sensitive chemical safety records, process hazard analyses, equipment failure investigations, and electronic sign-offs remain strictly partitioned and audit-ready.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <StartTrialButton className="min-h-11 px-5 text-xs font-black shadow-md" />
              <ContactSalesButton className="min-h-11 px-5 text-xs font-bold" />
            </div>
          </div>
        </div>
      </section>
      <SecuritySection />
    </main>
  );
}
