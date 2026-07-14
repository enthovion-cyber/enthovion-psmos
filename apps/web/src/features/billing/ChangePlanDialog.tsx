'use client';

import { useState } from 'react';
import { usePlans } from './hooks/usePlans';
import { useBillingMutations } from './hooks/useBillingMutations';
import { validateChangePlan } from './schemas/change-plan.schema';

export function ChangePlanDialog({ disabled, reason }: { disabled?: boolean; reason?: string }) {
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState('');
  const plans = usePlans();
  const mutations = useBillingMutations();
  async function save() {
    const errors = validateChangePlan({ planId });
    if (errors.length) return window.alert(errors.join(' '));
    await mutations.changePlan.mutateAsync({ planId, reason: 'Changed from billing UI' });
    setOpen(false);
  }
  return (
    <>
      <button className="psm-button psm-button-primary" disabled={disabled} title={disabled ? reason : 'Change plan'} onClick={() => setOpen(true)}>Change plan</button>
      {open ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="psm-panel w-full max-w-md rounded-xl p-5"><h3 className="text-lg font-semibold">Change plan</h3><select className="psm-input mt-4 w-full px-3" value={planId} onChange={(event) => setPlanId(event.target.value)}><option value="">Select backend plan</option>{(plans.data ?? []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select><div className="mt-4 flex justify-end gap-2"><button className="psm-button" onClick={() => setOpen(false)}>Close</button><button className="psm-button psm-button-primary" disabled={mutations.changePlan.isPending} onClick={() => void save()}>Save</button></div></div></div> : null}
    </>
  );
}
