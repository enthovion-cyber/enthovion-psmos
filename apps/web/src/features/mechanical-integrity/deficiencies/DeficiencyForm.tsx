'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MiDeficiencyDetailResponse, MiDeficiencyLookups } from '../types/deficiency.types';
import { validateDeficiencyDraft } from '../schemas/deficiency.schema';
import { useDeficiencyMutations } from '../hooks/useDeficiencies';
import { ActionButton, PrimaryButton, SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { CorrectiveLinksSection, DeficiencyDetailsSection, DeficiencyRiskReadinessSection, DeficiencySourceSection, TemporaryControlsSection } from './DeficiencyFormSections';

export function DeficiencyForm({ detail, lookups, preset = {} }: { detail?: MiDeficiencyDetailResponse | undefined; lookups?: MiDeficiencyLookups | undefined; preset?: Record<string, unknown> }) {
  const router = useRouter();
  const row = detail?.deficiency;
  const [values, setValues] = useState<Record<string, any>>({
    equipmentId: row?.equipment_id ?? preset.equipmentId ?? '',
    sourceModule: row?.source_module ?? preset.sourceModule ?? '',
    sourceRecordId: row?.source_record_id ?? preset.sourceRecordId ?? '',
    title: row?.title ?? '',
    description: row?.description ?? '',
    deficiencyType: row?.deficiency_type ?? '',
    locationDescription: row?.location_description ?? row?.deficiency_location ?? '',
    sourceSummary: (row as any)?.source_summary ?? '',
    evidenceDocumentId: (row as any)?.evidence_document_id ?? '',
    observedCondition: row?.observed_condition ?? '',
    requiredCondition: row?.required_condition ?? '',
    severity: row?.severity ?? '',
    riskLevel: row?.risk_level ?? '',
    startupBlocker: row?.startup_blocker ?? false,
    operationAllowed: row?.operation_allowed ?? false,
    operationRestrictions: row?.operation_restrictions ?? row?.operating_restrictions ?? '',
    ffsRequired: row?.ffs_required ?? false,
    engineeringReviewRequired: row?.engineering_review_required ?? false,
    mocRequired: row?.moc_required ?? false,
    mocSuggested: row?.moc_suggested ?? false,
    pssrImpact: row?.pssr_impact ?? false,
    lopaSilImpact: row?.lopa_sil_impact ?? false,
    temporaryControlRequired: row?.temporary_control_required ?? false,
    reportedBy: row?.reported_by ?? '',
    ownerUserId: row?.owner_user_id ?? '',
    targetClosureDate: row?.target_closure_date ?? '',
    dueDate: row?.due_date ?? ''
  });
  const [error, setError] = useState<string | null>(null);
  const mutations = useDeficiencyMutations(row?.id);
  const change = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const save = async () => {
    const missing = validateDeficiencyDraft(values);
    if (missing.length) {
      setError(`Missing required fields: ${missing.join(', ')}`);
      return;
    }
    setError(null);
    const result = row?.id ? await mutations.update.mutateAsync(values) : await mutations.create.mutateAsync(values);
    router.push(`/mechanical-integrity/deficiencies/${result.deficiency.id}`);
  };
  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      {error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div> : null}
      <SectionCard title="1. Source & Equipment" description="Source module, source record, equipment, CML/TML, safeguard, and source result summary."><DeficiencySourceSection values={values} lookups={lookups} onChange={change} /></SectionCard>
      <SectionCard title="2. Deficiency Details" description="Condition, type, location, evidence basis, immediate action, reporter, and discovery details."><DeficiencyDetailsSection values={values} lookups={lookups} onChange={change} /></SectionCard>
      <SectionCard title="3. Severity / Risk / Readiness" description="Backend remains source of truth for company/site isolation and readiness impact persistence."><DeficiencyRiskReadinessSection values={values} lookups={lookups} onChange={change} /></SectionCard>
      <SectionCard title="4. Temporary Controls" description="Temporary controls require owner and expiry when used."><TemporaryControlsSection values={values} lookups={lookups} onChange={change} /></SectionCard>
      <SectionCard title="5. Corrective Action Links" description="Link actions, work orders, MOC, inspection, PM, calibration, proof tests, impairments, and documents."><CorrectiveLinksSection values={values} lookups={lookups} onChange={change} /></SectionCard>
      <SectionCard title="6. Review & Submit" description="Save as draft, then submit from detail when ready.">
        <div className="flex flex-wrap gap-2">
          <PrimaryButton type="submit" disabled={mutations.create.isPending || mutations.update.isPending} title="Saving deficiency">Save Deficiency</PrimaryButton>
          <ActionButton onClick={() => router.push('/mechanical-integrity/deficiencies')}>Cancel</ActionButton>
        </div>
      </SectionCard>
    </form>
  );
}
