'use client';

import { usePublicPlans } from '../hooks/usePublicPlans';
import { fallbackPlans } from '../utils/plan-display';
import { BillingToggle } from './BillingToggle';
import { PlanComparisonTable } from './PlanComparisonTable';
import { PricingCard } from './PricingCard';

export function PricingSection({ showComparison = false }: { showComparison?: boolean }) {
  const query = usePublicPlans();
  const plans = query.data?.length ? query.data : fallbackPlans;
  return (
    <section id="pricing" className="bg-[var(--psm-surface)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">Pricing</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-normal">Start with a no-card 14-day trial. Upgrade when your workspace is ready.</h2>
            <p className="mt-4 text-sm text-[var(--psm-muted)]">Pricing is loaded from the backend public plan API when configured. No credit card data is collected inside this app.</p>
          </div>
          <BillingToggle />
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {plans.map((plan) => <PricingCard key={plan.code} plan={plan} />)}
        </div>
        {query.isError ? <p className="mt-4 text-xs text-[var(--psm-muted)]">Backend pricing API is unavailable, so replaceable public fallback display is shown.</p> : null}
        {showComparison ? <div className="mt-8"><PlanComparisonTable plans={plans} /></div> : null}
      </div>
    </section>
  );
}
