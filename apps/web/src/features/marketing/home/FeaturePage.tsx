'use client';

import { AiIndustrialSection } from './AiIndustrialSection';
import { FeatureGridSection } from './FeatureGridSection';
import { ModulesSection } from './ModulesSection';
import { SecuritySection } from './SecuritySection';
import { WorkflowSection } from './WorkflowSection';
import { StartTrialButton } from '../cta/StartTrialButton';
import { ContactSalesButton } from '../cta/ContactSalesButton';
import { Layers } from 'lucide-react';

export function FeaturePage() {
  return (
    <main>
      <section className="relative isolate overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-[var(--psm-line)] bg-[var(--psm-surface)] transition-colors">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(249,115,22,0.14),transparent),linear-gradient(180deg,var(--psm-bg),var(--psm-surface))]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--psm-primary)]/30 bg-[var(--psm-primary)]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--psm-primary)]">
              <Layers size={13} />
              <span>Full Platform Capabilities</span>
            </div>
            <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--psm-text)] leading-[1.12]">
              Process Safety Workflows, Platform Controls, and{' '}
              <span className="inline-block font-extrabold bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 bg-clip-text text-transparent psm-animated-gradient">
                Audit-Ready Evidence.
              </span>
            </h1>
            <p className="mt-4 text-sm sm:text-base lg:text-lg leading-relaxed text-[var(--psm-muted)] font-normal">
              Explore how Enthovion PSM OS coordinates engineering reviews, field permitting, hazard assessments, and asset integrity tracking in one unified operating system.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <StartTrialButton className="min-h-11 px-6 text-xs sm:text-sm font-bold shadow-md rounded-xl" />
              <ContactSalesButton className="min-h-11 px-6 text-xs sm:text-sm font-semibold rounded-xl" />
            </div>
          </div>
        </div>
      </section>
      <FeatureGridSection />
      <ModulesSection />
      <AiIndustrialSection />
      <WorkflowSection />
      <SecuritySection />
    </main>
  );
}
