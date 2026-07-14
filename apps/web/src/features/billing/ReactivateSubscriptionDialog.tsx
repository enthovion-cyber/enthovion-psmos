'use client';

import { useBillingMutations } from './hooks/useBillingMutations';

export function ReactivateSubscriptionDialog({ disabled, reason }: { disabled?: boolean; reason?: string }) {
  const mutations = useBillingMutations();
  return <button className="psm-button" disabled={disabled || mutations.reactivate.isPending} title={disabled ? reason : 'Reactivate subscription'} onClick={() => void mutations.reactivate.mutateAsync()}>Reactivate</button>;
}
