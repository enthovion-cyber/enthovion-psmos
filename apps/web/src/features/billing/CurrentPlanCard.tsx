import type { BillingOverview } from './types/billing.types';
import { ChangePlanDialog } from './ChangePlanDialog';
import { CancelSubscriptionDialog } from './CancelSubscriptionDialog';
import { ReactivateSubscriptionDialog } from './ReactivateSubscriptionDialog';

export function CurrentPlanCard({ overview }: { overview: BillingOverview }) {
  return (
    <div className="psm-panel rounded-xl p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-[var(--psm-muted)]">Current plan</div>
          <h2 className="mt-2 text-2xl font-semibold">{overview.plan?.name ?? 'No plan'}</h2>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{overview.plan?.description ?? 'No billing plan is configured for this company yet.'}</p>
          <div className="mt-3 text-sm">Status: <span className="font-semibold capitalize">{overview.status}</span> · Access: <span className="font-semibold capitalize">{overview.accessMode.replace('_', ' ')}</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ChangePlanDialog disabled={!overview.actions.canChangePlan} {...(!overview.actions.canChangePlan ? { reason: 'Plan change is blocked by current access mode.' } : {})} />
          <CancelSubscriptionDialog disabled={!overview.actions.canCancel} {...(!overview.actions.canCancel ? { reason: 'This subscription cannot be cancelled in its current state.' } : {})} />
          <ReactivateSubscriptionDialog disabled={!overview.actions.canReactivate} {...(!overview.actions.canReactivate ? { reason: 'Reactivation is only available for cancelled, scheduled, or past-due subscriptions.' } : {})} />
        </div>
      </div>
    </div>
  );
}
