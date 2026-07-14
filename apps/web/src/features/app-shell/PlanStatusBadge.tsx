import type { SidebarProfileResponse } from './types/sidebar-profile.types';

export function PlanStatusBadge({ billing }: { billing: SidebarProfileResponse['billing'] | undefined }) {
  if (!billing?.visible) return null;
  const warning = ['past_due', 'unpaid', 'locked', 'read_only'].includes(String(billing.status ?? ''));
  const label = billing.trialDaysLeft !== undefined
    ? `${billing.planName ?? 'Trial'} · ${billing.trialDaysLeft} days left`
    : billing.planName ?? billing.status ?? 'Plan';
  return (
    <span className={warning ? 'rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning' : 'rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success'}>
      {warning ? 'Payment attention needed' : label}
    </span>
  );
}
