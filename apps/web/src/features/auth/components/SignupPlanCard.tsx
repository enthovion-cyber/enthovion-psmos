import type { SignupPlan } from '../types/signup-plan.types';

export function SignupPlanCard({ plan, busy, onTrial, onCheckout }: { plan: SignupPlan; busy?: boolean; onTrial: () => void; onCheckout: () => void }) {
  const monthly = plan.prices?.find((price) => price.billing_interval === 'monthly' && price.status === 'active');
  const priceLabel = monthly ? new Intl.NumberFormat(undefined, { style: 'currency', currency: monthly.currency }).format(monthly.amount_cents / 100) : plan.plan_type === 'enterprise' ? 'Contact sales' : 'Configured by admin';
  const isTrial = plan.plan_type === 'trial' || plan.code === 'trial';
  return (
    <article className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="text-sm uppercase tracking-wide text-[var(--psm-muted)]">{plan.plan_type}</div>
      <h2 className="mt-2 text-xl font-semibold">{plan.name}</h2>
      <p className="mt-2 min-h-12 text-sm text-[var(--psm-muted)]">{plan.description ?? 'Plan details are managed by billing configuration.'}</p>
      <div className="mt-4 text-2xl font-semibold">{isTrial ? `${plan.trial_days ?? 14} day trial` : priceLabel}</div>
      <button className={isTrial ? 'psm-button psm-button-primary mt-5 w-full' : 'psm-button psm-button-secondary mt-5 w-full'} disabled={busy} type="button" onClick={isTrial ? onTrial : onCheckout}>
        {busy ? 'Working...' : isTrial ? 'Start trial' : plan.plan_type === 'enterprise' ? 'Request enterprise' : 'Continue'}
      </button>
    </article>
  );
}
