import type { CompanySubscription } from './types/subscription.types';

export function PaymentFailedBanner({ subscription }: { subscription?: CompanySubscription | null }) {
  if (!subscription || !['past_due','unpaid'].includes(subscription.status)) return null;
  return <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">Payment issue detected. Billing admins can update payment details; normal users do not see payment details.</div>;
}
