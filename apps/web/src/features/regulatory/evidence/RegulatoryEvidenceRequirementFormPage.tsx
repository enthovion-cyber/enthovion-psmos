'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryEvidenceLookups } from '../hooks/useRegulatoryEvidenceLookups';
import { useRegulatoryEvidenceMutations } from '../hooks/useRegulatoryEvidenceMutations';

export function RegulatoryEvidenceRequirementFormPage() {
  const router = useRouter();
  const lookups = useRegulatoryEvidenceLookups();
  const mutations = useRegulatoryEvidenceMutations();
  const [form, setForm] = useState<Record<string, unknown>>({ sourceType: 'Manual Requirement', evidenceTypeExpected: 'Document', requirementStatus: 'Draft' });
  const [error, setError] = useState<unknown>(null);
  const saving = mutations.createRequirement.isPending;
  const update = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  async function submit() {
    setError(null);
    try {
      const row = await mutations.createRequirement.mutateAsync(form);
      router.push(`/regulatory/evidence/requirements/${row.id}`);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <RegulatoryLayout current="Evidence">
      <div className="space-y-5">
        <RegulatoryHeader title="New Evidence Requirement" subtitle="Create a backend-controlled required evidence definition. Source, site, access, owner, reviewer, retention, and confidentiality are enforced by API policy." action={<RegulatoryButton disabled={saving} title={saving ? 'Saving requirement...' : undefined} onClick={submit}>{saving ? 'Saving...' : 'Save Requirement'}</RegulatoryButton>} />
        {error ? <RegulatoryErrorState message={error} /> : null}
        <RegulatoryCard title="Requirement Identity / Source">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Requirement title" value={form.requirementTitle} onChange={(value) => update('requirementTitle', value)} required />
            <Select label="Source type" value={form.sourceType} options={lookups.data?.evidenceSourceTypes} onChange={(value) => update('sourceType', value)} />
            <Field label="Regulatory item ID" value={form.regulatoryItemId} onChange={(value) => update('regulatoryItemId', value)} helper="Use a real regulatory item ID when linking to a regulation." />
            <Field label="Obligation ID" value={form.obligationId} onChange={(value) => update('obligationId', value)} />
            <Select label="Expected evidence type" value={form.evidenceTypeExpected} options={lookups.data?.evidenceTypes} onChange={(value) => update('evidenceTypeExpected', value)} />
            <Select label="Status" value={form.requirementStatus} options={lookups.data?.evidenceRequirementStatuses} onChange={(value) => update('requirementStatus', value)} />
            <Field label="Owner user ID" value={form.evidenceOwnerUserId} onChange={(value) => update('evidenceOwnerUserId', value)} />
            <Field label="Reviewer user ID" value={form.reviewerUserId} onChange={(value) => update('reviewerUserId', value)} />
            <Field label="Due date" type="datetime-local" value={form.dueDate} onChange={(value) => update('dueDate', value)} />
            <Select label="Confidentiality" value={form.confidentialityLevel} options={lookups.data?.evidenceConfidentialityLevels} onChange={(value) => update('confidentialityLevel', value)} />
          </div>
        </RegulatoryCard>
        <RegulatoryCard title="Evidence Criteria / Retention">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Evidence description" value={form.evidenceDescription} onChange={(value) => update('evidenceDescription', value)} />
            <Field label="Evidence frequency" value={form.evidenceFrequency} onChange={(value) => update('evidenceFrequency', value)} />
            <Field label="Required document type" value={form.requiredDocumentType} onChange={(value) => update('requiredDocumentType', value)} />
            <Field label="Required record type" value={form.requiredRecordType} onChange={(value) => update('requiredRecordType', value)} />
            <Field label="Acceptance criteria" value={form.acceptanceCriteriaFoundation} onChange={(value) => update('acceptanceCriteriaFoundation', value)} />
            <Field label="Retention requirement" value={form.retentionRequirementFoundation} onChange={(value) => update('retentionRequirementFoundation', value)} />
          </div>
        </RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}

function Field({ label, value, onChange, helper, type = 'text', required }: { label: string; value: unknown; onChange: (value: string) => void; helper?: string | undefined; type?: string | undefined; required?: boolean | undefined }) {
  return <RegulatoryField label={`${label}${required ? ' *' : ''}`} helper={helper}><input className={regulatoryInputClass()} type={type} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></RegulatoryField>;
}

function Select({ label, value, options, onChange }: { label: string; value: unknown; options?: string[] | undefined; onChange: (value: string) => void }) {
  return <RegulatoryField label={label}><select className={regulatoryInputClass()} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}><option value="">Select</option>{(options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select></RegulatoryField>;
}
