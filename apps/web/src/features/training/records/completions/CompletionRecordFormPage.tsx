'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../../shared/TrainingUi';
import { trainingRecordsService } from '../../services/training-records.service';
import { useTrainingCompletionMutations } from '../../hooks/useTrainingCompletionMutations';
import { useTrainingCompletionRecord } from '../../hooks/useTrainingCompletionRecords';
import { TrainingRecordsHeader } from '../TrainingRecordsHeader';

export function CompletionRecordFormPage({ recordId }: { recordId?: string }) {
  const router = useRouter();
  const context = useQuery({ queryKey: ['training-records', 'context'], queryFn: () => trainingRecordsService.context() });
  const existing = useTrainingCompletionRecord(recordId ?? '');
  const mutations = useTrainingCompletionMutations(recordId);
  const [form, setForm] = useState<Record<string, any>>({ completionStatus: 'Completed', attendanceStatus: 'Present', verificationStatus: 'Pending Verification', approvalStatus: 'Not Required' });
  useEffect(() => {
    if (existing.data?.record) setForm({ ...existing.data.record });
  }, [existing.data]);
  if (context.isLoading || (recordId && existing.isLoading)) return <TrainingLoadingState />;
  if (context.isError) return <TrainingErrorState message={context.error} onRetry={() => context.refetch()} />;
  const save = () => {
    const mutation = recordId ? mutations.createRecord : mutations.createRecord;
    const payload = { ...form, manualEntry: true };
    if (recordId) {
      trainingRecordsService.updateRecord(recordId, payload).then((saved) => router.push(`/training-competency/training-records/records/${saved.record.id}`)).catch(() => undefined);
    } else {
      mutation.mutate(payload, { onSuccess: (saved) => router.push(`/training-competency/training-records/records/${saved.record.id}`) });
    }
  };
  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));
  const missing = !form.workerId && !form.worker_id ? 'Worker is required.' : !form.trainingItemId && !form.training_item_id ? 'Required training item is required.' : '';
  return (
    <div className="space-y-5">
      <TrainingRecordsHeader title={recordId ? 'Edit Completion Record' : 'Manual Completion Record'} />
      <TrainingCard title="Record Identity / Worker / Training">
        <div className="grid gap-3 md:grid-cols-3">
          <Select label="Worker" value={form.workerId ?? form.worker_id ?? ''} values={(context.data?.workers ?? []).map((w) => ({ value: w.id, label: `${w.display_name ?? w.full_name ?? w.name ?? w.id} / ${w.job_title ?? w.department ?? 'Worker'}` }))} onChange={(v) => set('workerId', v)} />
          <Select label="Required training" value={form.trainingItemId ?? form.training_item_id ?? ''} values={(context.data?.requiredTraining ?? []).map((t) => ({ value: t.id, label: `${t.training_code ?? t.id} / ${t.training_title ?? t.title}` }))} onChange={(v) => set('trainingItemId', v)} />
          <Field label="Training version" value={form.trainingItemVersion ?? form.training_item_version ?? ''} onChange={(v) => set('trainingItemVersion', v)} />
          <Field label="Completion date" type="date" value={form.completionDate ?? form.completion_date ?? ''} onChange={(v) => set('completionDate', v)} />
          <Field label="Expiry date" type="date" value={form.expiryDate ?? form.expiry_date ?? ''} onChange={(v) => set('expiryDate', v)} />
          <Field label="Score" type="number" value={form.score ?? ''} onChange={(v) => set('score', Number(v) || undefined)} />
          <Select label="Completion status" value={form.completionStatus ?? form.completion_status ?? ''} values={['Completed', 'Failed', 'Incomplete', 'Expired', 'Superseded']} onChange={(v) => set('completionStatus', v)} />
          <Select label="Attendance status" value={form.attendanceStatus ?? form.attendance_status ?? ''} values={['Present', 'Absent', 'Partial', 'Excused', 'Not Required']} onChange={(v) => set('attendanceStatus', v)} />
          <Select label="Evidence status" value={form.evidenceStatus ?? form.evidence_status ?? ''} values={['Not Required', 'Missing', 'Linked', 'Verified', 'Rejected']} onChange={(v) => set('evidenceStatus', v)} />
        </div>
        <textarea className="mt-3 min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Manual completion basis, assessor notes, correction reason, evidence reference, and approval notes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
        {missing ? <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{missing}</p> : null}
        <div className="mt-4"><TrainingButton onClick={save} disabled={Boolean(missing) || mutations.createRecord.isPending} title={missing || (mutations.createRecord.isPending ? 'Record save is already running.' : 'Save manual completion record through backend workflow.')}>{mutations.createRecord.isPending ? 'Saving...' : 'Save Record'}</TrainingButton></div>
        {mutations.createRecord.error ? <div className="mt-3"><TrainingErrorState message={mutations.createRecord.error} /></div> : null}
      </TrainingCard>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (value: string) => void; type?: string }) {
  return <label className="block text-sm font-semibold">{label}<input type={type} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, values, onChange }: { label: string; value: string; values: Array<string | { value: string; label: string }>; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold">{label}<select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value ?? ''} onChange={(e) => onChange(e.target.value)}><option value="">Select</option>{values.map((option) => typeof option === 'string' ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
