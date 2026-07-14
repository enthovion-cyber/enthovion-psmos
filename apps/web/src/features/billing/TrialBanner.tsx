import type { CompanySubscription } from './types/subscription.types';

export function TrialBanner({ subscription }: { subscription?: CompanySubscription | null }) {
  if (subscription?.status !== 'trialing') return null;
  return <div className="rounded-xl border border-info/40 bg-info/10 px-4 py-3 text-sm text-info">Trial active until {subscription.trial_end ? new Date(subscription.trial_end).toLocaleDateString() : 'the configured trial end date'}.</div>;
}
