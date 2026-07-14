import type { PublicPlan } from '../types/public-plan.types';
import { BuyPlanButton } from '../cta/BuyPlanButton';
import { ContactSalesButton } from '../cta/ContactSalesButton';
import { StartTrialButton } from '../cta/StartTrialButton';
import { PricingFeatureList } from './PricingFeatureList';

export function PricingCard({ plan }: { plan: PublicPlan }) {
  const isTrial = plan.code === 'trial' || plan.ctaType === 'trial';
  const isEnterprise = plan.code === 'enterprise' || plan.ctaType === 'contact_sales';
  return (
    <article className={`relative flex min-h-full flex-col rounded-3xl border p-6 shadow-[var(--psm-shadow-soft)] ${plan.highlighted ? 'border-blue-400 bg-blue-600 text-white' : 'border-[var(--psm-line)] bg-[var(--psm-surface)]'}`}>
      {plan.highlighted ? <span className="absolute right-5 top-5 rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white">Most Popular</span> : null}
      <h3 className="pr-24 text-2xl font-black">{plan.name}</h3>
      <p className={`mt-2 min-h-12 text-sm leading-6 ${plan.highlighted ? 'text-blue-50' : 'text-[var(--psm-muted)]'}`}>{plan.description}</p>
      <div className="mt-5">
        <span className="text-3xl font-black">{plan.priceDisplay ?? (isTrial ? 'Free' : isEnterprise ? 'Custom' : 'For small teams')}</span>
      </div>
      <div className="mt-5">
        {isTrial ? <StartTrialButton className="w-full" /> : isEnterprise ? <ContactSalesButton className="w-full" /> : <BuyPlanButton planCode={plan.code} label={`Buy ${plan.name}`} className="w-full" />}
      </div>
      <div className={plan.highlighted ? '[&_li]:text-blue-50' : ''}>
        <PricingFeatureList features={plan.features} />
      </div>
      {isTrial ? <p className={`mt-5 text-xs font-bold ${plan.highlighted ? 'text-blue-50' : 'text-[var(--psm-muted)]'}`}>No credit card required. Trial is 14 days.</p> : null}
      {!isTrial && !isEnterprise ? <p className={`mt-5 text-xs font-bold ${plan.highlighted ? 'text-blue-50' : 'text-[var(--psm-muted)]'}`}>Paid checkout redirects to secure provider checkout after signup/workspace setup.</p> : null}
    </article>
  );
}
