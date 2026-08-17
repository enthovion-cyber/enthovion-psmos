'use client';

import { useState } from 'react';
import { validateWorkOrderExecution } from '../schemas/work-order-execution.schema';
import { useWorkOrderMutations } from '../hooks/useWorkOrders';
import { PrimaryButton, SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { Input, Select } from './sections/WorkOrderFields';

export function WorkOrderExecutionForm({ workOrderId }: { workOrderId: string }) {
  const [values, setValues] = useState<Record<string, any>>({ result: 'Completed successfully' });
  const [error, setError] = useState<string | null>(null);
  const mutations = useWorkOrderMutations(workOrderId);
  const change = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    const missing = validateWorkOrderExecution(values);
    if (missing.length) return setError(`Missing required fields: ${missing.join(', ')}`);
    setError(null);
    await mutations.complete.mutateAsync(values);
  };
  return <SectionCard title="Execution Workflow" description="Actual work performed, parts used, measurements, findings, completion notes, result, and evidence.">{error ? <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}<div className="grid gap-3 md:grid-cols-2"><Input value={values.actualWorkPerformed} onChange={(value) => change('actualWorkPerformed', value)} placeholder="Actual work performed" /><Input value={values.partsUsedJson} onChange={(value) => change('partsUsedJson', value)} placeholder="Parts used JSON/reference" /><Input value={values.measurementsJson} onChange={(value) => change('measurementsJson', value)} placeholder="Measurements/readings" /><Input value={values.problemsFound} onChange={(value) => change('problemsFound', value)} placeholder="Problems found" /><Input value={values.additionalFindings} onChange={(value) => change('additionalFindings', value)} placeholder="Additional findings" /><Input value={values.completionNotes} onChange={(value) => change('completionNotes', value)} placeholder="Completion notes" /><Select value={values.result} onChange={(value) => change('result', value)} options={['Completed successfully','Completed with follow-up','Temporary repair completed','Permanent repair completed','Partially completed','Failed','Could not complete','Engineering review required']} /><Input value={values.evidenceDocumentId} onChange={(value) => change('evidenceDocumentId', value)} placeholder="Evidence document ID" /></div><div className="mt-4"><PrimaryButton onClick={submit} disabled={mutations.complete.isPending}>Complete Work</PrimaryButton></div></SectionCard>;
}
