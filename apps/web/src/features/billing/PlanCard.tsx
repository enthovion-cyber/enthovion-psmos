'use client';

import type { SubscriptionPlan } from './types/plan.types';
import { useBillingMutations } from './hooks/useBillingMutations';

export function PlanCard({ plan, currentPlanId }: { plan: SubscriptionPlan; currentPlanId?: string | null }) {
  const mutations = useBillingMutations();
  const price = plan.prices?.find((item) => item.status === 'active');
  const isCurrent = currentPlanId === plan.id;
  async function checkout() {
    const result = await mutations.checkout.mutateAsync({ planId: plan.id, ...(price?.id ? { priceId: price.id } : {}), successUrl: '/settings/billing/success', cancelUrl: '/settings/billing/cancelled' });
    window.location.href = result.checkoutUrl;
  }
  return (
    <div className="psm-panel flex h-full flex-col rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{plan.description}</p>
        </div>
        {isCurrent ? <span className="rounded-full bg-success/15 px-2 py-1 text-xs text-success">Current</span> : null}
      </div>
      <div className="mt-4 text-2xl font-semibold">{price ? `${price.currency} ${(price.amount_cents / 100).toLocaleString()}` : 'Custom'}<span className="text-sm font-normal text-[var(--psm-muted)]">/{price?.billing_interval ?? 'contract'}</span></div>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-[var(--psm-muted)]">
        {(plan.entitlements ?? []).slice(0, 8).map((item) => <li key={item.id}>{item.enabled ? 'Included' : 'Not included'}: {item.entitlement_key}</li>)}
      </ul>
      <button className="psm-button psm-button-primary mt-4 w-full" disabled={isCurrent || mutations.checkout.isPending} onClick={() => void checkout()} title={isCurrent ? 'Already on this plan.' : 'Checkout uses backend-verified plan and price.'}>{isCurrent ? 'Current plan' : 'Checkout'}</button>
    </div>
  );
}
