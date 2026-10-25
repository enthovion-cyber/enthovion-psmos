'use client';

import type { PublicPlan } from '../types/public-plan.types';
import { BuyPlanButton } from '../cta/BuyPlanButton';
import { ContactSalesButton } from '../cta/ContactSalesButton';
import { StartTrialButton } from '../cta/StartTrialButton';
import { PricingFeatureList } from './PricingFeatureList';
import { CheckCircle2, Sparkles } from 'lucide-react';

export function PricingCard({ plan }: { plan: PublicPlan }) {
  const isTrial = plan.code === 'trial' || plan.ctaType === 'trial';
  const isEnterprise = plan.code === 'enterprise' || plan.ctaType === 'contact_sales';

  return (
    <article
      className={`relative flex min-h-full flex-col justify-between rounded-2xl border p-6 sm:p-7 shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        plan.highlighted
          ? 'border-[var(--psm-primary)] bg-[var(--psm-surface)] ring-2 ring-[var(--psm-primary)]/25'
          : 'border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-surface)]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-bold text-[var(--psm-text)]">{plan.name}</h3>
          {plan.highlighted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--psm-primary)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
              <Sparkles size={11} /> Most Popular
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--psm-muted)] min-h-[44px] font-normal">
          {plan.description}
        </p>

        <div className="mt-6 pb-6 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="text-3xl font-black text-[var(--psm-text)] tracking-tight">
            {plan.priceDisplay ?? (isTrial ? 'Free' : isEnterprise ? 'Custom' : 'Contact for pricing')}
          </div>
          {isTrial ? (
            <div className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              14 days full access • No credit card required
            </div>
          ) : (
            <div className="mt-1 text-xs text-[var(--psm-muted)] font-medium">
              {isEnterprise ? 'Tailored enterprise multi-site SLA & compliance' : 'Billed annually per site or operating unit'}
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] mb-3">
            What is included:
          </p>
          <PricingFeatureList features={plan.features} />
        </div>
      </div>

      <div className="mt-8 pt-4">
        {isTrial ? (
          <StartTrialButton className="w-full text-xs font-bold shadow-md rounded-xl" />
        ) : isEnterprise ? (
          <ContactSalesButton className="w-full text-xs font-semibold rounded-xl" />
        ) : (
          <BuyPlanButton
            planCode={plan.code}
            label={`Select ${plan.name}`}
            className="w-full text-xs font-bold rounded-xl"
          />
        )}
      </div>
    </article>
  );
}
