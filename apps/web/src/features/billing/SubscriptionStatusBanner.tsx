import type { BillingOverview } from './types/billing.types';

export function SubscriptionStatusBanner({ overview }: { overview: BillingOverview }) {
  const mode = overview.accessMode;
  if (mode === 'full') return null;
  const label = mode === 'warning' ? 'Billing warning' : mode === 'grace' ? 'Grace period active' : mode === 'read_only' ? 'Read-only billing mode' : 'Company access locked';
  const tone = mode === 'locked' || mode === 'read_only' ? 'border-danger/40 bg-danger/10 text-danger' : 'border-warning/40 bg-warning/10 text-warning';
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tone}`}>{label}. Existing safety records remain protected according to company billing policy.</div>;
}
