'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryEvidenceLookups } from '../hooks/useRegulatoryEvidenceLookups';
import { useRegulatoryEvidenceMutations } from '../hooks/useRegulatoryEvidenceMutations';

export function RegulatoryEvidenceLinkFormPage() {
  const router = useRouter();
  const lookups = useRegulatoryEvidenceLookups();
  const mutations = useRegulatoryEvidenceMutations();
  const [form, setForm] = useState<Record<string, unknown>>({ sourceType: 'Manual External Reference', sourceModule: 'Regulatory Evidence', evidenceType: 'Document', evidenceStatus: 'Draft', reviewStatus: 'Not Submitted', restricted: false });
  const [error, setError] = useState<unknown>(null);
  const saving = mutations.createLink.isPending;
  const update = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  async function submit() {
    setError(null);
    try {
      const row = await mutations.createLink.mutateAsync(form);
      router.push(`/regulatory/evidence/links/${row.id}`);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <RegulatoryLayout current="Evidence">
      <div className="space-y-5">
        <RegulatoryHeader title="Link Evidence" subtitle="Create a controlled evidence link using real Document Control, storage, module record, audit evidence, or policy-allowed external reference metadata." action={<RegulatoryButton disabled={saving} title={saving ? 'Saving evidence link...' : undefined} onClick={submit}>{saving ? 'Saving...' : 'Save Evidence Link'}</RegulatoryButton>} />
        {error ? <RegulatoryErrorState message={error} /> : null}
        <RegulatoryCard title="Evidence Identity">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Evidence title" value={form.evidenceTitle} onChange={(value) => update('evidenceTitle', value)} required />
            <Select label="Evidence type" value={form.evidenceType} options={lookups.data?.evidenceTypes} onChange={(value) => update('evidenceType', value)} />
            <Select label="Evidence status" value={form.evidenceStatus} options={lookups.data?.evidenceStatuses} onChange={(value) => update('evidenceStatus', value)} />
            <Select label="Review status" value={form.reviewStatus} options={lookups.data?.evidenceReviewStatuses} onChange={(value) => update('reviewStatus', value)} />
            <Field label="Requirement ID" value={form.evidenceRequirementId} onChange={(value) => update('evidenceRequirementId', value)} />
            <Field label="Regulatory item ID" value={form.regulatoryItemId} onChange={(value) => update('regulatoryItemId', value)} />
            <Field label="Obligation ID" value={form.obligationId} onChange={(value) => update('obligationId', value)} />
            <Select label="Source type" value={form.sourceType} options={lookups.data?.evidenceSourceTypes} onChange={(value) => update('sourceType', value)} />
          </div>
        </RegulatoryCard>
        <RegulatoryCard title="Evidence Source / Controlled Reference">
          <div className="grid gap-3 md:grid-cols-2">
            <Select label="Source module" value={form.sourceModule} options={lookups.data?.evidenceSourceModules} onChange={(value) => update('sourceModule', value)} />
            <Field label="Source record ID" value={form.sourceRecordId} onChange={(value) => update('sourceRecordId', value)} helper="Use the real module record ID for evidence from Audit, MOC, PSSR, HAZOP, LOPA, MI, PSI, Training, PTW, or similar source." />
            <Field label="Document Control ID" value={form.documentId} onChange={(value) => update('documentId', value)} />
            <Field label="Document version/revision" value={form.documentVersion} onChange={(value) => update('documentVersion', value)} />
            <Field label="Storage file ID" value={form.storageFileId} onChange={(value) => update('storageFileId', value)} />
            <Field label="Audit evidence ID" value={form.auditEvidenceId} onChange={(value) => update('auditEvidenceId', value)} />
            <Field label="External reference URL" value={form.externalReferenceUrl} onChange={(value) => update('externalReferenceUrl', value)} />
            <Field label="External reference description" value={form.externalReferenceDescription} onChange={(value) => update('externalReferenceDescription', value)} />
          </div>
        </RegulatoryCard>
        <RegulatoryCard title="Review / Retention / Access">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Effective date" type="datetime-local" value={form.effectiveDate} onChange={(value) => update('effectiveDate', value)} />
            <Field label="Expiry date" type="datetime-local" value={form.expiryDate} onChange={(value) => update('expiryDate', value)} />
            <Field label="Review date" type="datetime-local" value={form.reviewDate} onChange={(value) => update('reviewDate', value)} />
            <Select label="Confidentiality" value={form.confidentialityLevel} options={lookups.data?.evidenceConfidentialityLevels} onChange={(value) => update('confidentialityLevel', value)} />
            <RegulatoryField label="Restricted evidence"><label className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm"><input type="checkbox" checked={Boolean(form.restricted)} onChange={(event) => update('restricted', event.target.checked)} /> Restricted / controlled access</label></RegulatoryField>
            <Field label="Restricted reason" value={form.restrictedReason} onChange={(value) => update('restrictedReason', value)} />
            <Field label="Notes" value={form.notes} onChange={(value) => update('notes', value)} />
          </div>
        </RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}

function Field({ label, value, onChange, helper, type = 'text', required }: { label: string; value: unknown; onChange: (value: string) => void; helper?: string | undefined; type?: string; required?: boolean }) {
  return <RegulatoryField label={`${label}${required ? ' *' : ''}`} helper={helper}><input className={regulatoryInputClass()} type={type} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></RegulatoryField>;
}

function Select({ label, value, options, onChange }: { label: string; value: unknown; options?: string[] | undefined; onChange: (value: string) => void }) {
  return <RegulatoryField label={label}><select className={regulatoryInputClass()} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}><option value="">Select</option>{(options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select></RegulatoryField>;
}
