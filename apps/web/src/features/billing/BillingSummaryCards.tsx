import type { BillingOverview } from './types/billing.types';

export function BillingSummaryCards({ overview }: { overview: BillingOverview }) {
  const cards = [
    ['Current plan', overview.plan?.name ?? 'Not configured'],
    ['Subscription status', overview.status],
    ['Access mode', overview.accessMode],
    ['Renewal date', overview.subscription?.current_period_end ? new Date(overview.subscription.current_period_end).toLocaleDateString() : 'Not set'],
    ['Enabled modules', String(overview.enabledModules.length)],
    ['Disabled modules', String(overview.disabledModules.length)]
  ];
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{cards.map(([label, value]) => <div key={label} className="psm-panel rounded-xl p-4"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-2 text-lg font-semibold capitalize">{value}</div></div>)}</div>;
}
