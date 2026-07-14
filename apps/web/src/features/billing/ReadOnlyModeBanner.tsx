import type { CompanySubscription } from './types/subscription.types';

export function ReadOnlyModeBanner({ subscription }: { subscription?: CompanySubscription | null }) {
  if (subscription?.access_mode !== 'read_only') return null;
  return <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">Read-only billing mode. Existing records are readable, but create/edit/export actions are blocked by policy.</div>;
}
