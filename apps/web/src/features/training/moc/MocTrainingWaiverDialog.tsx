'use client';

import { useState } from 'react';
import { useMocTrainingMutations } from '../hooks/useMocTrainingMutations';
import { validateMocTrainingWaiver } from '../schemas/moc-training-waiver.schema';
import { TrainingButton, formatTrainingError } from '../shared/TrainingUi';

export function MocTrainingWaiverDialog({ blockerId, onClose }: { blockerId: string; onClose?: () => void }) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const mutations = useMocTrainingMutations();
  async function submit() {
    const nextErrors = validateMocTrainingWaiver(values);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    await mutations.requestWaiver.mutateAsync({ blockerId, payload: values });
    onClose?.();
  }
  return <div className="space-y-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="text-base font-semibold">Request Waiver</h2><textarea className="min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm" placeholder="Waiver reason" value={values.waiverReason ?? ''} onChange={(event) => setValues({ ...values, waiverReason: event.target.value })} /><textarea className="min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm" placeholder="Risk acceptance basis" value={values.riskAcceptanceBasis ?? ''} onChange={(event) => setValues({ ...values, riskAcceptanceBasis: event.target.value })} />{errors.length ? <p className="text-sm text-danger">Missing: {errors.join(', ')}</p> : null}{mutations.requestWaiver.error ? <p className="text-sm text-danger">{formatTrainingError(mutations.requestWaiver.error)}</p> : null}<div className="flex gap-2"><TrainingButton onClick={submit} disabled={mutations.requestWaiver.isPending}>Submit Waiver</TrainingButton><TrainingButton onClick={onClose} variant="secondary">Cancel</TrainingButton></div></div>;
}
