'use client';

import { useState } from 'react';
import type { TrainingCertificate } from '../types/certification.types';
import { TrainingButton, TrainingCard, formatTrainingError } from '../shared/TrainingUi';

type FormState = Record<string, string | boolean>;

export function CertificateForm({ initial, onSubmit, saving }: { initial?: Partial<TrainingCertificate> | undefined; onSubmit: (values: Record<string, unknown>) => Promise<void>; saving?: boolean }) {
  const [form, setForm] = useState<FormState>({
    workerId: initial?.worker_id ?? '',
    certificateTitle: initial?.certificate_title ?? '',
    certificateCategory: initial?.certificate_category ?? 'Required Training Certificate',
    certificateNumber: initial?.certificate_number ?? '',
    issuerProvider: initial?.issuer_provider ?? '',
    issueDate: initial?.issue_date ?? '',
    expiryDate: initial?.expiry_date ?? '',
    noExpiry: Boolean(initial?.no_expiry),
    renewalRequired: Boolean(initial?.renewal_required),
    safetyCritical: Boolean(initial?.safety_critical),
    psmCritical: Boolean(initial?.psm_critical),
    ptwCritical: Boolean(initial?.ptw_critical),
    mocCritical: Boolean(initial?.moc_critical),
    pssrCritical: Boolean(initial?.pssr_critical),
    trainingItemId: initial?.training_item_id ?? '',
    completionRecordId: initial?.completion_record_id ?? '',
    competencyRequirementId: initial?.competency_requirement_id ?? '',
    notes: ''
  });
  const [error, setError] = useState<string | null>(null);
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    setError(null);
    if (!String(form.workerId).trim()) return setError('Worker is required.');
    if (!String(form.certificateTitle).trim()) return setError('Certificate title is required.');
    try { await onSubmit(form); } catch (err) { setError(formatTrainingError(err)); }
  };
  return (
    <TrainingCard title="Certificate record" subtitle="Evidence is linked through Document Control; file content is not stored in this form.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Worker ID" value={String(form.workerId)} onChange={(value) => update('workerId', value)} required />
        <Field label="Certificate title" value={String(form.certificateTitle)} onChange={(value) => update('certificateTitle', value)} required />
        <Field label="Category" value={String(form.certificateCategory)} onChange={(value) => update('certificateCategory', value)} />
        <Field label="Certificate number" value={String(form.certificateNumber)} onChange={(value) => update('certificateNumber', value)} />
        <Field label="Issuer/provider" value={String(form.issuerProvider)} onChange={(value) => update('issuerProvider', value)} />
        <Field label="Issue date" type="date" value={String(form.issueDate)} onChange={(value) => update('issueDate', value)} />
        <Field label="Expiry date" type="date" value={String(form.expiryDate)} onChange={(value) => update('expiryDate', value)} />
        <Field label="Required Training ID" value={String(form.trainingItemId)} onChange={(value) => update('trainingItemId', value)} />
        <Field label="Completion Record ID" value={String(form.completionRecordId)} onChange={(value) => update('completionRecordId', value)} />
        <Field label="Competency Requirement ID" value={String(form.competencyRequirementId)} onChange={(value) => update('competencyRequirementId', value)} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {['noExpiry', 'renewalRequired', 'safetyCritical', 'psmCritical', 'ptwCritical', 'mocCritical', 'pssrCritical'].map((key) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => update(key, event.target.checked)} /> {key.replace(/([A-Z])/g, ' $1')}</label>)}
      </div>
      {error ? <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-5 flex justify-end"><TrainingButton onClick={submit} disabled={saving} title={saving ? 'Saving certificate...' : undefined}>{saving ? 'Saving...' : 'Save Certificate'}</TrainingButton></div>
    </TrainingCard>
  );
}

function Field({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="text-sm font-medium">{label}{required ? ' *' : ''}<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
