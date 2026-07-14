import type { SubscriptionPlan } from './types/plan.types';
import { PlanCard } from './PlanCard';

export function PlanComparisonTable({ plans, currentPlanId }: { plans: SubscriptionPlan[]; currentPlanId?: string | null }) {
  if (!plans.length) return <div className="psm-panel rounded-xl p-6 text-sm text-[var(--psm-muted)]">No active billing plans are configured.</div>;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} {...(currentPlanId ? { currentPlanId } : {})} />)}</div>;
}
