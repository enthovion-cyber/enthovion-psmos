'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReadinessLookups } from '../hooks/useReadiness';
import { useReadinessMutations } from '../hooks/useReadinessMutations';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';
import { ApprovalSubmitSection } from './assessment-sections/ApprovalSubmitSection';
import { AutoReadinessCheckSection } from './assessment-sections/AutoReadinessCheckSection';
import { BlockersWarningsReviewSection } from './assessment-sections/BlockersWarningsReviewSection';
import { EquipmentContextSection } from './assessment-sections/EquipmentContextSection';
import { FfsEngineeringDecisionSection } from './assessment-sections/FfsEngineeringDecisionSection';
import { LinkedRecordsSection } from './assessment-sections/LinkedRecordsSection';
import { RestrictionsConditionsSection } from './assessment-sections/RestrictionsConditionsSection';

const steps = [
  'Equipment Context',
  'Auto Readiness Check',
  'Blockers & Warnings',
  'FFS / Engineering',
  'Restrictions',
  'Linked Records',
  'Approval & Submit'
];

export function ReadinessAssessmentForm({ equipmentId, assessmentId, initial }: { equipmentId?: string; assessmentId?: string; initial?: Record<string, any> }) {
  const router = useRouter();
  const lookups = useReadinessLookups();
  const mutations = useReadinessMutations(assessmentId);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({
    equipmentId: equipmentId ?? initial?.equipment_id ?? '',
    assessmentReason: initial?.assessment_reason ?? 'Manual review',
    assessmentDate: initial?.assessment_date?.slice?.(0, 10) ?? new Date().toISOString().slice(0, 10),
    proposedDecision: initial?.proposed_decision ?? initial?.recommended_decision ?? '',
    assessorUserId: initial?.assessor_user_id ?? '',
    reviewerUserId: initial?.reviewer_user_id ?? '',
    engineeringJustification: initial?.engineering_justification ?? '',
    technicalBasis: initial?.technical_basis ?? '',
    riskAcceptanceStatement: initial?.risk_acceptance_statement ?? '',
    nextReviewDue: initial?.next_review_due?.slice?.(0, 10) ?? '',
    ffsRequired: Boolean(initial?.ffs_required),
    ffsAssessmentReference: initial?.ffs_assessment_reference ?? '',
    restrictionType: 'Operating Restriction',
    restrictionDescription: '',
    restrictionExpiryDate: '',
    restrictionOwnerUserId: '',
    reducedLimits: '',
    temporaryControls: '',
    linkedModule: 'PSSR',
    linkedRecordId: '',
    linkedRecordNumber: '',
    relationshipType: 'Evidence',
    assessmentReasons: lookups.data?.assessmentReasons ?? ['Manual review']
  });
  const update = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const disabledReason = !form.equipmentId ? 'Equipment is required.' : !form.assessmentReason ? 'Assessment reason is required.' : !form.assessmentDate ? 'Assessment date is required.' : '';
  const buildPayload = () => {
    const restrictions = form.restrictionDescription && form.restrictionExpiryDate ? [{
      restrictionType: form.restrictionType,
      restrictionDescription: form.restrictionDescription,
      expiryDate: form.restrictionExpiryDate,
      ownerUserId: form.restrictionOwnerUserId || undefined,
      reducedPressure: form.reducedLimits || undefined,
      temporaryControls: form.temporaryControls || undefined
    }] : [];
    const linkedRecords = form.linkedRecordId ? [{
      linkedModule: form.linkedModule,
      linkedRecordId: form.linkedRecordId,
      linkedRecordNumber: form.linkedRecordNumber || undefined,
      relationshipType: form.relationshipType || 'Evidence'
    }] : [];
    return { ...form, restrictions, linkedRecords };
  };
  const save = () => {
    setMessage(null);
    const action = assessmentId ? mutations.update.mutateAsync(buildPayload()) : mutations.create.mutateAsync(buildPayload());
    void action.then((result: any) => {
      const id = result.assessment?.id ?? result.assessment_id ?? assessmentId;
      setMessage('Readiness assessment saved.');
      if (id) router.push(`/mechanical-integrity/readiness/assessments/${id}`);
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to save readiness assessment.'));
  };
  const submit = () => {
    if (!assessmentId) return save();
    void mutations.submit.mutateAsync({ proposedDecision: form.proposedDecision || initial?.recommended_decision }).then(() => router.push(`/mechanical-integrity/readiness/assessments/${assessmentId}`));
  };
  const sectionProps = { form: { ...form, assessmentReasons: lookups.data?.assessmentReasons ?? form.assessmentReasons }, initial, onChange: update };
  const missing = [
    disabledReason,
    /Restrictions/.test(String(form.proposedDecision)) && !form.restrictionExpiryDate ? 'Fit With Restrictions requires an expiry/review date.' : '',
    form.proposedDecision === 'Not Fit for Service' && !form.engineeringJustification ? 'Not Fit for Service requires engineering justification.' : ''
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Mechanical Integrity Readiness</p>
            <h1 className="mt-1 text-2xl font-bold">{assessmentId ? 'Edit Readiness Assessment' : 'New Readiness Assessment'}</h1>
            <p className="mt-2 text-sm text-[var(--psm-muted)]">Seven-step workflow for backend-generated fitness-for-service and startup readiness decisions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={save} disabled={Boolean(disabledReason) || mutations.create.isPending || mutations.update.isPending} title={disabledReason}>{mutations.create.isPending || mutations.update.isPending ? 'Saving...' : 'Save'}</PrimaryButton>
            <ActionButton onClick={() => router.back()}>Cancel</ActionButton>
          </div>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {steps.map((label, index) => (
            <button key={label} type="button" onClick={() => setStep(index)} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${index === step ? 'border-primary bg-primary text-primary-foreground' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{index + 1}. {label}</button>
          ))}
        </div>
        {message ? <p className="mt-4 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">{message}</p> : null}
      </section>

      {step === 0 ? <EquipmentContextSection {...sectionProps} equipmentLocked={Boolean(equipmentId)} /> : null}
      {step === 1 ? <AutoReadinessCheckSection initial={initial} canRun={Boolean(assessmentId) && !disabledReason} running={mutations.runCheck.isPending} disabledReason={assessmentId ? disabledReason : 'Save the assessment before running backend readiness checks.'} onRun={() => mutations.runCheck.mutate({ reason: 'Manual run from assessment form' })} /> : null}
      {step === 2 ? <BlockersWarningsReviewSection blockers={(initial as any)?.blockers ?? []} /> : null}
      {step === 3 ? <FfsEngineeringDecisionSection form={form} decisions={lookups.data?.decisions} onChange={update} /> : null}
      {step === 4 ? <RestrictionsConditionsSection form={form} restrictions={(initial as any)?.restrictions ?? []} onChange={update} /> : null}
      {step === 5 ? <LinkedRecordsSection form={form} linkedRecords={(initial as any)?.linkedRecords ?? []} onChange={update} /> : null}
      {step === 6 ? <ApprovalSubmitSection missing={missing} saving={mutations.create.isPending || mutations.update.isPending} submitting={mutations.submit.isPending} disabledReason={disabledReason} canSubmit={Boolean(assessmentId) && !missing.length} onBack={() => router.back()} onSave={save} onSubmit={submit} /> : null}

      <div className="flex flex-wrap justify-between gap-2">
        <ActionButton onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>Back</ActionButton>
        <ActionButton onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} disabled={step === steps.length - 1}>Next</ActionButton>
      </div>
    </div>
  );
}
