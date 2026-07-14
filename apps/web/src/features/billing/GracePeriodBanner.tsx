import type { CompanySubscription } from './types/subscription.types';

export function GracePeriodBanner({ subscription }: { subscription?: CompanySubscription | null }) {
  if (subscription?.access_mode !== 'grace') return null;
  return <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">Grace mode is active. Create/export actions may be limited while read access is preserved.</div>;
}
