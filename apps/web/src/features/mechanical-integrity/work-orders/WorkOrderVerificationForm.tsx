'use client';

import { useState } from 'react';
import { validateWorkOrderVerification } from '../schemas/work-order-verification.schema';
import { useWorkOrderMutations } from '../hooks/useWorkOrders';
import { PrimaryButton, SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { Check, Input, Select } from './sections/WorkOrderFields';

export function WorkOrderVerificationForm({ workOrderId }: { workOrderId: string }) {
  const [values, setValues] = useState<Record<string, any>>({ verificationResult: 'Accepted' });
  const [error, setError] = useState<string | null>(null);
  const mutations = useWorkOrderMutations(workOrderId);
  const change = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    const missing = validateWorkOrderVerification(values);
    if (missing.length) return setError(`Missing required fields: ${missing.join(', ')}`);
    setError(null);
    await mutations.verify.mutateAsync(values);
  };
  return <SectionCard title="Verification / Closure" description="Technical verification, evidence, equipment restored, deficiency corrected, temporary controls removed, and readiness cleared.">{error ? <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}<div className="grid gap-3 md:grid-cols-2"><Input value={values.verificationMethod} onChange={(value) => change('verificationMethod', value)} placeholder="Verification method" /><Select value={values.verificationResult} onChange={(value) => change('verificationResult', value)} options={['Accepted','Rejected','Rework Required','Engineering Review Required']} /><Input type="date" value={values.verificationDate} onChange={(value) => change('verificationDate', value)} /><Input value={values.evidenceDocumentId} onChange={(value) => change('evidenceDocumentId', value)} placeholder="Evidence document ID" /><Input value={values.linkedTestRecordId} onChange={(value) => change('linkedTestRecordId', value)} placeholder="Linked test record" /><Input value={values.linkedInspectionRecordId} onChange={(value) => change('linkedInspectionRecordId', value)} placeholder="Linked inspection record" /></div><div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">{(['equipmentRestored','deficiencyCorrected','temporaryControlsRemoved','readinessImpactCleared','startupBlockerCleared'] as string[]).map((key) => <Check key={key} label={key.replace(/([A-Z])/g, ' $1')} checked={values[key]} onChange={(value) => change(key, value)} />)}</div><div className="mt-3"><Input value={values.closureNotes} onChange={(value) => change('closureNotes', value)} placeholder="Closure notes" /></div><div className="mt-4"><PrimaryButton onClick={submit} disabled={mutations.verify.isPending}>Verify Work</PrimaryButton></div></SectionCard>;
}
