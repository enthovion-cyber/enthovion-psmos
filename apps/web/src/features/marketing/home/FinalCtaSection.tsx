'use client';

import { StartTrialButton } from '../cta/StartTrialButton';
import { ContactSalesButton } from '../cta/ContactSalesButton';
import { ShieldCheck, CheckCircle2, ArrowRight, Radio, Sparkles } from 'lucide-react';

export function FinalCtaSection() {
  return (
    <section className="relative px-4 py-20 sm:px-6 lg:px-8 bg-[var(--psm-bg)] transition-colors overflow-hidden">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-[var(--psm-primary)]/30 bg-gradient-to-br from-[var(--psm-surface)] via-[var(--psm-surface-2)]/80 to-[var(--psm-surface)] p-8 sm:p-12 lg:p-16 shadow-2xl">
        {/* Decorative Floating Glowing Orbs */}
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[var(--psm-primary)]/15 blur-3xl pointer-events-none animate-[psm-pulse-glow_8s_ease-in-out_infinite]" />
        <div className="absolute -left-24 -bottom-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none animate-[psm-pulse-glow_10s_ease-in-out_infinite_reverse]" />

        {/* Ambient subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--psm-line) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Ready for Industrial Process Safety Operations</span>
          </div>

          <h2 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight text-[var(--psm-text)] leading-tight">
            Deploy an Audit-Proof{' '}
            <span className="bg-gradient-to-r from-[var(--psm-primary)] to-amber-500 bg-clip-text text-transparent">
              Process Safety Operating System
            </span>{' '}
            in Minutes.
          </h2>

          <p className="mt-4 text-sm sm:text-base lg:text-lg leading-relaxed text-[var(--psm-muted)] font-normal">
            Create your company workspace, register sites and equipment units, invite your multi-disciplinary team, and test live MOC, PSSR, HAZOP, and PTW workflows completely free for 14 days.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <StartTrialButton className="min-h-12 px-7 text-xs sm:text-sm font-bold shadow-xl shadow-[var(--action-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl" />
            <ContactSalesButton className="min-h-12 px-7 text-xs sm:text-sm font-semibold rounded-xl" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[var(--psm-muted)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>No credit card required for trial</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Instant multi-site provisioning</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Full access to all 10 PSM elements</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
