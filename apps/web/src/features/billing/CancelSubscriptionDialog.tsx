'use client';

import { useState } from 'react';
import { useBillingMutations } from './hooks/useBillingMutations';
import { validateCancelSubscription } from './schemas/cancel-subscription.schema';

export function CancelSubscriptionDialog({ disabled, reason }: { disabled?: boolean; reason?: string }) {
  const [open, setOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const mutations = useBillingMutations();
  async function save() {
    const errors = validateCancelSubscription({ reason: cancelReason });
    if (errors.length) return window.alert(errors.join(' '));
    await mutations.cancel.mutateAsync({ reason: cancelReason, cancelAtPeriodEnd: true });
    setOpen(false);
  }
  return <>{<button className="psm-button" disabled={disabled} title={disabled ? reason : 'Cancel at period end'} onClick={() => setOpen(true)}>Cancel</button>}{open ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="psm-panel w-full max-w-md rounded-xl p-5"><h3 className="text-lg font-semibold">Cancel subscription</h3><textarea className="psm-input mt-4 min-h-24 w-full p-3" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Reason required" /><div className="mt-4 flex justify-end gap-2"><button className="psm-button" onClick={() => setOpen(false)}>Close</button><button className="psm-button psm-button-danger" onClick={() => void save()}>Cancel at period end</button></div></div></div> : null}</>;
}
