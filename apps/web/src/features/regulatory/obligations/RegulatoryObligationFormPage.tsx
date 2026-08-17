'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryRegister } from '../hooks/useRegulatoryRegister';
import { useRegulatoryObligation, useRegulatoryObligationLookups, useRegulatoryObligationMutations } from '../hooks/useRegulatoryObligations';
import { regulatoryObligationSchema } from '../schemas/regulatory-obligation.schema';
import { RegulatoryObligationFormWizard } from './RegulatoryObligationFormWizard';

const steps = ['Parent Requirement', 'Obligation Identity', 'Scope / Applicability', 'Category / Criticality', 'Frequency / Due Dates', 'Ownership / Review', 'Evidence Expectations', 'Module Mapping', 'Compliance Status Foundation', 'Links Foundation', 'Review & Save'];

export function RegulatoryObligationFormPage({ obligationId, regulationId }: { obligationId?: string; regulationId?: string }) {
  const router = useRouter();
  const detail = useRegulatoryObligation(obligationId);
  const parentItems = useRegulatoryRegister({ limit: 200, sort: 'updated_at.desc' });
  const lookups = useRegulatoryObligationLookups();
  const mutations = useRegulatoryObligationMutations();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const initial = detail.data?.obligation;
  const [form, setForm] = useState<Record<string, unknown>>({ regulatoryItemId: regulationId ?? '', obligationStatus: 'Draft', applicabilityStatus: 'Inherited From Parent', complianceStatus: 'Not Assessed', criticality: 'Medium', evidenceRequired: false });
  const merged = useMemo(() => initial ? {
    regulatoryItemId: initial.regulatory_item_id,
    obligationTitle: initial.obligation_title,
    obligationType: initial.obligation_type,
    obligationReference: initial.obligation_reference,
    shortSummary: initial.short_summary,
    requirementSummary: initial.requirement_summary,
    category: initial.category,
    criticality: initial.criticality,
    riskBasis: initial.risk_basis,
    siteId: initial.site_id,
    unitId: initial.unit_id,
    areaId: initial.area_id,
    equipmentId: initial.equipment_id,
    applicabilityStatus: initial.applicability_status,
    applicabilityRationale: initial.applicability_rationale,
    frequency: initial.frequency,
    dueDate: initial.due_date,
    nextDueDate: initial.next_due_date,
    triggerEvent: initial.trigger_event,
    ownerUserId: initial.owner_user_id,
    reviewerUserId: initial.reviewer_user_id,
    reviewFrequency: initial.review_frequency,
    nextReviewDate: initial.next_review_date,
    evidenceRequired: initial.evidence_required,
    relatedPsmElement: initial.related_psm_element,
    relatedModule: initial.related_module,
    complianceStatus: initial.compliance_status,
    statusRationale: initial.status_rationale,
    notes: initial.notes,
    ...form
  } : form, [form, initial]);
  const update = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const option = (value: string) => <option key={value} value={value}>{value}</option>;
  const savePayload = async (saveAsActive = false) => {
    setError(null);
    const payload = { ...merged, saveAsActive };
    const parsed = regulatoryObligationSchema.safeParse(payload);
    if (!parsed.success && saveAsActive) {
      setError(parsed.error.issues.map((issue) => issue.message).join(' '));
      return;
    }
    try {
      const result = obligationId ? await mutations.update.mutateAsync({ id: obligationId, data: payload }) : await mutations.create.mutateAsync(payload);
      router.push(`/regulatory/obligations/${result.obligation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save regulatory obligation.');
    }
  };
  const submit = async (event: FormEvent, saveAsActive = false) => {
    event.preventDefault();
    await savePayload(saveAsActive);
  };
  if (obligationId && detail.isLoading) return <RegulatoryLayout current="Obligations"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (detail.isError) return <RegulatoryLayout current="Obligations"><RegulatoryErrorState message={detail.error} onRetry={() => detail.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Obligations">
      <form className="space-y-5" onSubmit={(event) => submit(event, false)}>
        <RegulatoryHeader title={obligationId ? 'Edit Obligation' : 'Create Obligation'} subtitle="11-step Phase 3 obligation breakdown wizard: parent, identity, scope, criticality, due cycle, owners, evidence, module mapping, status, links, and review." />
        <RegulatoryObligationFormWizard steps={steps} currentStep={step} onStepChange={setStep}>
          {error ? <RegulatoryCard title="Validation / Save Error" subtitle={error}><p className="text-sm text-[var(--psm-muted)]">Draft save can be partial. Active save follows backend company/site policy.</p></RegulatoryCard> : null}
          <RegulatoryCard title={steps[step]}>
          <div className="grid gap-4 md:grid-cols-2">
            {step === 0 ? <>
              <RegulatoryField label="Parent regulatory register item" helper="Required. Obligation inherits parent scope/applicability unless narrowed with reason."><select className={regulatoryInputClass()} value={String(merged.regulatoryItemId ?? '')} onChange={(event) => update('regulatoryItemId', event.target.value)}><option value="">Select parent</option>{parentItems.data?.rows?.map((item) => <option key={item.id} value={item.id}>{item.requirement_code} - {item.requirement_title}</option>)}</select></RegulatoryField>
              <RegulatoryField label="Parent summary"><textarea className={regulatoryInputClass()} readOnly value={parentItems.data?.rows?.find((item) => item.id === merged.regulatoryItemId)?.short_summary ?? 'Select a parent requirement to preview status, scope, criticality, owner, and dates.'} /></RegulatoryField>
            </> : null}
            {step === 1 ? <>
              <RegulatoryField label="Obligation title"><input className={regulatoryInputClass()} value={String(merged.obligationTitle ?? '')} onChange={(event) => update('obligationTitle', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Obligation type"><select className={regulatoryInputClass()} value={String(merged.obligationType ?? '')} onChange={(event) => update('obligationType', event.target.value)}><option value="">Select type</option>{lookups.data?.obligationTypes?.map(option)}</select></RegulatoryField>
              <RegulatoryField label="Obligation reference / clause"><input className={regulatoryInputClass()} value={String(merged.obligationReference ?? '')} onChange={(event) => update('obligationReference', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Short summary"><textarea className={regulatoryInputClass()} value={String(merged.shortSummary ?? '')} onChange={(event) => update('shortSummary', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Requirement summary"><textarea className={regulatoryInputClass()} value={String(merged.requirementSummary ?? '')} onChange={(event) => update('requirementSummary', event.target.value)} /></RegulatoryField>
            </> : null}
            {step === 2 ? <>
              <RegulatoryField label="Site ID"><input className={regulatoryInputClass()} value={String(merged.siteId ?? '')} onChange={(event) => update('siteId', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Unit ID"><input className={regulatoryInputClass()} value={String(merged.unitId ?? '')} onChange={(event) => update('unitId', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Area ID"><input className={regulatoryInputClass()} value={String(merged.areaId ?? '')} onChange={(event) => update('areaId', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Equipment ID"><input className={regulatoryInputClass()} value={String(merged.equipmentId ?? '')} onChange={(event) => update('equipmentId', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Applicability status"><select className={regulatoryInputClass()} value={String(merged.applicabilityStatus ?? '')} onChange={(event) => update('applicabilityStatus', event.target.value)}>{['Inherited From Parent', 'Not Assessed', 'Applicable', 'Partially Applicable', 'Not Applicable', 'Applicability Review Required', 'Stale Applicability'].map(option)}</select></RegulatoryField>
              <RegulatoryField label="Applicability rationale / included-excluded scope"><textarea className={regulatoryInputClass()} value={String(merged.applicabilityRationale ?? '')} onChange={(event) => update('applicabilityRationale', event.target.value)} /></RegulatoryField>
            </> : null}
            {step === 3 ? <>
              <RegulatoryField label="Category"><select className={regulatoryInputClass()} value={String(merged.category ?? '')} onChange={(event) => update('category', event.target.value)}><option value="">Select category</option>{lookups.data?.obligationCategories?.map(option)}</select></RegulatoryField>
              <RegulatoryField label="Criticality"><select className={regulatoryInputClass()} value={String(merged.criticality ?? '')} onChange={(event) => update('criticality', event.target.value)}><option value="">Select criticality</option>{lookups.data?.criticalityLevels?.map(option)}</select></RegulatoryField>
              <RegulatoryField label="Related PSM element"><input className={regulatoryInputClass()} value={String(merged.relatedPsmElement ?? '')} onChange={(event) => update('relatedPsmElement', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Risk basis"><textarea className={regulatoryInputClass()} value={String(merged.riskBasis ?? '')} onChange={(event) => update('riskBasis', event.target.value)} /></RegulatoryField>
            </> : null}
            {step === 4 ? <>
              <RegulatoryField label="Frequency"><select className={regulatoryInputClass()} value={String(merged.frequency ?? '')} onChange={(event) => update('frequency', event.target.value)}><option value="">Select frequency</option>{lookups.data?.obligationFrequencies?.map(option)}</select></RegulatoryField>
              <RegulatoryField label="Due date"><input type="date" className={regulatoryInputClass()} value={String(merged.dueDate ?? '').slice(0, 10)} onChange={(event) => update('dueDate', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Next due date"><input type="date" className={regulatoryInputClass()} value={String(merged.nextDueDate ?? '').slice(0, 10)} onChange={(event) => update('nextDueDate', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Trigger event"><select className={regulatoryInputClass()} value={String(merged.triggerEvent ?? '')} onChange={(event) => update('triggerEvent', event.target.value)}><option value="">No trigger</option>{lookups.data?.obligationTriggerEvents?.map(option)}</select></RegulatoryField>
            </> : null}
            {step === 5 ? <>
              <RegulatoryField label="Obligation owner user ID"><input className={regulatoryInputClass()} value={String(merged.ownerUserId ?? '')} onChange={(event) => update('ownerUserId', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Reviewer user ID"><input className={regulatoryInputClass()} value={String(merged.reviewerUserId ?? '')} onChange={(event) => update('reviewerUserId', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Review frequency"><select className={regulatoryInputClass()} value={String(merged.reviewFrequency ?? '')} onChange={(event) => update('reviewFrequency', event.target.value)}><option value="">Not set</option>{lookups.data?.obligationFrequencies?.map(option)}</select></RegulatoryField>
              <RegulatoryField label="Next review date"><input type="date" className={regulatoryInputClass()} value={String(merged.nextReviewDate ?? '').slice(0, 10)} onChange={(event) => update('nextReviewDate', event.target.value)} /></RegulatoryField>
            </> : null}
            {step === 6 ? <>
              <RegulatoryField label="Evidence required"><select className={regulatoryInputClass()} value={String(Boolean(merged.evidenceRequired))} onChange={(event) => update('evidenceRequired', event.target.value === 'true')}><option value="false">No</option><option value="true">Yes</option></select></RegulatoryField>
              <RegulatoryField label="Evidence type expected"><input className={regulatoryInputClass()} value={String(merged.evidenceTypeExpected ?? '')} onChange={(event) => update('evidenceTypeExpected', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Evidence description / acceptance criteria"><textarea className={regulatoryInputClass()} value={String(merged.evidenceDescription ?? '')} onChange={(event) => update('evidenceDescription', event.target.value)} /></RegulatoryField>
            </> : null}
            {step === 7 ? <>
              <RegulatoryField label="Related module"><select className={regulatoryInputClass()} value={String(merged.relatedModule ?? '')} onChange={(event) => update('relatedModule', event.target.value)}><option value="">Not mapped</option>{lookups.data?.linkModules?.map(option)}</select></RegulatoryField>
              <RegulatoryField label="Mapping rationale / control safeguard foundation"><textarea className={regulatoryInputClass()} value={String(merged.mappingRationale ?? '')} onChange={(event) => update('mappingRationale', event.target.value)} /></RegulatoryField>
            </> : null}
            {step === 8 ? <>
              <RegulatoryField label="Compliance status foundation"><select className={regulatoryInputClass()} value={String(merged.complianceStatus ?? '')} onChange={(event) => update('complianceStatus', event.target.value)}>{lookups.data?.complianceStatuses?.map(option)}</select></RegulatoryField>
              <RegulatoryField label="Status rationale / evidence summary / gap summary"><textarea className={regulatoryInputClass()} value={String(merged.statusRationale ?? '')} onChange={(event) => update('statusRationale', event.target.value)} /></RegulatoryField>
            </> : null}
            {step === 9 ? <>
              <RegulatoryField label="Links foundation note"><textarea className={regulatoryInputClass()} value={String(merged.notes ?? '')} onChange={(event) => update('notes', event.target.value)} placeholder="Foundation-only links to audit, evidence, action, document control, PSI, MOC, PSSR, Training, MI, Incident, PTW, reports, or review." /></RegulatoryField>
            </> : null}
            {step === 10 ? <div className="md:col-span-2"><pre className="max-h-[420px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(merged, null, 2)}</pre></div> : null}
          </div>
          </RegulatoryCard>
        </RegulatoryObligationFormWizard>
        <div className="sticky bottom-3 flex flex-wrap justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-lg">
          <RegulatoryButton variant="secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(value - 1, 0))}>Back</RegulatoryButton>
          <div className="flex flex-wrap gap-2">
            <RegulatoryButton variant="secondary" type="submit" disabled={mutations.create.isPending || mutations.update.isPending} title="Draft can save partial information.">Save Draft</RegulatoryButton>
            {step < steps.length - 1 ? <RegulatoryButton onClick={() => setStep((value) => Math.min(value + 1, steps.length - 1))}>Next</RegulatoryButton> : <RegulatoryButton onClick={() => void savePayload(true)} disabled={mutations.create.isPending || mutations.update.isPending} title="Active save is backend-validated against company/site settings.">Save Active</RegulatoryButton>}
          </div>
        </div>
      </form>
    </RegulatoryLayout>
  );
}
