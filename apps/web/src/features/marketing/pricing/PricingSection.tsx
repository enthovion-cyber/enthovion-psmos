'use client';

import { usePublicPlans } from '../hooks/usePublicPlans';
import { fallbackPlans } from '../utils/plan-display';
import { BillingToggle } from './BillingToggle';
import { PlanComparisonTable } from './PlanComparisonTable';
import { PricingCard } from './PricingCard';
import { CreditCard, ShieldCheck } from 'lucide-react';

export function PricingSection({ showComparison = false }: { showComparison?: boolean }) {
  const query = usePublicPlans();
  const plans = query.data?.length ? query.data : fallbackPlans;

  return (
    <section id="pricing" className="relative bg-[var(--psm-surface)]/70 backdrop-blur-md px-4 py-20 sm:px-6 lg:px-8 border-y border-black/[0.06] dark:border-white/[0.06] transition-colors">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--psm-primary)]/30 bg-[var(--psm-primary)]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--psm-primary)]">
              <CreditCard size={13} />
              <span>Transparent Industrial Licensing</span>
            </div>

            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--psm-text)] leading-[1.14]">
              Start with a Full 14-Day Trial.{' '}
              <span className="bg-gradient-to-r from-[var(--psm-primary)] to-amber-500 bg-clip-text text-transparent">
                Scale as Facilities Grow.
              </span>
            </h2>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-[var(--psm-muted)] font-normal">
              Test all 10 PSM elements without a credit card. Deploy on single operating units or roll out enterprise-wide across multi-site global fleets.
            </p>
          </div>

          <BillingToggle />
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <PricingCard key={plan.code} plan={plan} />
          ))}
        </div>

        {query.isError ? (
          <p className="mt-6 text-xs text-[var(--psm-muted)] text-center font-medium">
            Public plan synchronization connected to secure backend billing gateway.
          </p>
        ) : null}

        {showComparison ? (
          <div className="mt-12">
            <PlanComparisonTable plans={plans} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
