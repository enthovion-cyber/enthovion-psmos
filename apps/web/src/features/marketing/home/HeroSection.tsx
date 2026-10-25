'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Radio,
  Clock,
  Activity
} from 'lucide-react';
import { StartTrialButton } from '../cta/StartTrialButton';
import { ContactSalesButton } from '../cta/ContactSalesButton';
import { HeroPlatformPreview } from './HeroPlatformPreview';

export function HeroSection() {
  return (
    <section id="overview" className="relative isolate overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pb-32 transition-colors">
      {/* High-Tech Ambient Grid & Animated Glowing Atmosphere */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Crisp subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.20] dark:opacity-[0.16]"
          style={{
            backgroundImage: `radial-gradient(var(--psm-line) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient Animated Gradient Orbs */}
        <div className="absolute -top-24 left-1/4 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-[var(--psm-primary)]/20 to-amber-500/10 blur-[120px] pointer-events-none animate-[psm-pulse-glow_7s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-1/6 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-blue-500/15 to-teal-500/10 blur-[130px] pointer-events-none animate-[psm-pulse-glow_9s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[var(--psm-bg)] to-transparent pointer-events-none" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Top Content Block with Refined Typography */}
        <div className="max-w-4xl">
          {/* Animated High-Tech Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--psm-primary)]/30 bg-[var(--psm-surface)]/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--psm-primary)] shadow-sm backdrop-blur-md transition-all hover:border-[var(--psm-primary)] hover:shadow-md cursor-pointer">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--psm-primary)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--psm-primary)]" />
            </span>
            <Layers size={13} className="text-[var(--psm-primary)]" />
            <span className="text-[11px] font-bold">Process Safety Management Operating System</span>
          </div>

          {/* Premium Refined Headline (Balanced Weight & Animated Flowing Gradient) */}
          <h1 className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--psm-text)] leading-[1.12]">
            Process Safety Workflows, Platform Controls, and{' '}
            <span className="inline-block font-extrabold bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 bg-clip-text text-transparent psm-animated-gradient drop-shadow-xs">
              Audit-Ready Evidence.
            </span>
          </h1>

          {/* Clean, Readable Subtitle with Proper Weight */}
          <p className="mt-5 text-sm sm:text-base lg:text-lg leading-relaxed text-[var(--psm-muted)] max-w-2xl font-normal">
            Connect MOC, PSSR, HAZOP, LOPA, Incident Investigation, and Field Permitting into one unified operating system. Engineered for zero blind spots across hazardous chemical, refining, and energy facilities.
          </p>

          {/* Dual Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <StartTrialButton className="min-h-11 px-6 text-xs sm:text-sm font-bold shadow-lg shadow-[var(--action-primary)]/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl" />
            <ContactSalesButton className="min-h-11 px-6 text-xs sm:text-sm font-semibold rounded-xl" />
          </div>

          {/* Subtle Reassurance Points */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[var(--psm-muted)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>Full 14-Day Free Trial (No Credit Card)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>Multi-Site Scope Isolation</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>OSHA 1910.119 & IEC 61511 Audit-Ready</span>
            </span>
          </div>
        </div>

        {/* Full-Width Interactive Hero Platform Preview Container */}
        <div className="mt-12 sm:mt-14">
          <div className="relative mx-auto max-w-7xl">
            {/* Luminous Glow Ring */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-[var(--psm-primary)]/20 via-sky-500/15 to-emerald-500/20 blur-2xl opacity-70 -z-10" />
            <HeroPlatformPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
