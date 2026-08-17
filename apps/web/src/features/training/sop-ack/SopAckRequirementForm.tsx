'use client';

import { useMemo, useState } from 'react';
import { TrainingBadge, TrainingButton, TrainingCard } from '../shared/TrainingUi';
import type { SopAckRequirementDetail } from '../types/sop-acknowledgement.types';
import { validateSopAckRequirement } from '../schemas/sop-ack-requirement.schema';

type Props = {
  initial?: SopAckRequirementDetail | null;
  saving?: boolean;
  onSubmit: (values: Record<string, any>) => void;
};

const STEPS = [
  'Identity',
  'SOP / Document Version',
  'Applicability & Workers',
  'Due / Re-Acknowledgement',
  'Evidence / E-Sign / Assessment',
  'Blocking & Safety Impact',
  'Matrix / Competency Links',
  'Review & Activate'
];

export function SopAckRequirementForm({ initial, saving, onSubmit }: Props) {
  const seed: Record<string, any> = initial?.requirement ?? {};
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({
    requirement_title: seed.requirement_title ?? '',
    requirement_code: seed.requirement_code ?? '',
    description: seed.description ?? '',
    requirement_source: seed.requirement_source ?? 'Document Control',
    owner_user_id: seed.owner_user_id ?? '',
    reviewer_user_id: seed.reviewer_user_id ?? '',
    site_id: seed.site_id ?? '',
    sop_id: seed.sop_id ?? '',
    document_id: seed.document_id ?? '',
    sop_title: seed.sop_title ?? '',
    document_number: seed.document_number ?? '',
    required_version: seed.required_version ?? '',
    revision_number: seed.revision_number ?? '',
    current_version_policy: seed.current_version_policy ?? 'Current approved version only',
    document_status: seed.document_status ?? '',
    document_owner: seed.document_owner ?? '',
    effective_date: seed.effective_date ?? '',
    next_review_due: seed.next_review_due ?? '',
    applicability: '',
    assignment_source: 'Applicability rule',
    due_days_after_assignment: 14,
    reacknowledgement_required_on_revision: true,
    reacknowledgement_due_days: 14,
    expiry_months: '',
    acknowledgement_method: 'Worker confirmation',
    esignature_required: false,
    assessment_required: false,
    verification_required: false,
    passing_score: '',
    evidence_required: true,
    safety_critical: Boolean(seed.safety_critical),
    psm_critical: Boolean(seed.psm_critical),
    ptw_critical: Boolean(seed.ptw_critical),
    moc_critical: Boolean(seed.moc_critical),
    pssr_critical: Boolean(seed.pssr_critical),
    blocks_ptw_authorization: Boolean(seed.blocks_ptw_authorization),
    blocks_moc_implementation: Boolean(seed.blocks_moc_implementation),
    blocks_pssr_startup: Boolean(seed.blocks_pssr_startup),
    blocks_safety_critical_work: Boolean(seed.blocks_safety_critical_work),
    waiver_allowed: Boolean(seed.waiver_allowed),
    sync_to_matrix: seed.sync_to_matrix ?? true,
    sync_to_competency: seed.sync_to_competency ?? true,
    training_item_id: '',
    competency_profile_id: '',
    notes: seed.notes ?? ''
  });
  const errors = useMemo(() => validateSopAckRequirement(values), [values]);
  const set = (key: string, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }));
  const stepBlocked = step < 7 && errors.length > 0 && step < 2;
  const disabledReason = errors.join(', ');

  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (!errors.length) onSubmit(values); }}>
      <TrainingCard title="Requirement Builder" subtitle="Eight-step builder for SOP/document acknowledgement rules, version policy, applicability, blockers, evidence, matrix and competency links.">
        <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
          {STEPS.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${index === step ? 'border-primary bg-primary text-white' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{index + 1}. {label}</button>)}
        </div>
      </TrainingCard>
      {step === 0 ? <SopAckRequirementIdentitySection values={values} set={set} /> : null}
      {step === 1 ? <SopDocumentVersionSection values={values} set={set} /> : null}
      {step === 2 ? <SopApplicabilityWorkersSection values={values} set={set} /> : null}
      {step === 3 ? <SopDueReacknowledgementRulesSection values={values} set={set} /> : null}
      {step === 4 ? <SopEvidenceEsignAssessmentSection values={values} set={set} /> : null}
      {step === 5 ? <SopBlockingSafetyImpactSection values={values} set={set} /> : null}
      {step === 6 ? <SopMatrixCompetencyLinksSection values={values} set={set} /> : null}
      {step === 7 ? <ReviewStep values={values} errors={errors} /> : null}
      <div className="flex flex-wrap justify-between gap-3">
        <TrainingButton variant="secondary" disabled={step === 0} title="Already on the first step." onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</TrainingButton>
        <div className="flex flex-wrap gap-2">
          <TrainingButton variant="secondary" disabled={saving} title="Saves the current requirement as draft/inactive through the backend." type="submit">Save Draft</TrainingButton>
          {step < 7 ? <TrainingButton disabled={stepBlocked} title={stepBlocked ? disabledReason : 'Continue to the next SOP acknowledgement requirement section.'} onClick={() => setStep((s) => Math.min(7, s + 1))}>Next</TrainingButton> : <TrainingButton disabled={saving || errors.length > 0} title={errors.length ? disabledReason : 'Create or update this backend SOP acknowledgement requirement.'} type="submit">{saving ? 'Saving...' : 'Save Requirement'}</TrainingButton>}
        </div>
      </div>
    </form>
  );
}

function TextField({ label, value, onChange, type = 'text', helper }: { label: string; value: any; onChange: (value: string) => void; type?: string; helper?: string }) {
  return <label className="block text-sm font-semibold">{label}<input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />{helper ? <span className="mt-1 block text-xs font-normal text-[var(--psm-muted)]">{helper}</span> : null}</label>;
}

function SelectField({ label, value, onChange, options, helper }: { label: string; value: any; onChange: (value: string) => void; options: string[]; helper?: string }) {
  return <label className="block text-sm font-semibold">{label}<select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{helper ? <span className="mt-1 block text-xs font-normal text-[var(--psm-muted)]">{helper}</span> : null}</label>;
}

function ToggleField({ label, checked, onChange, helper }: { label: string; checked: boolean; onChange: (value: boolean) => void; helper?: string }) {
  return <label className="flex items-start gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm font-semibold"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1" /><span>{label}{helper ? <span className="mt-1 block text-xs font-normal text-[var(--psm-muted)]">{helper}</span> : null}</span></label>;
}

export function SopAckRequirementIdentitySection({ values, set }: { values: Record<string, any>; set: (key: string, value: unknown) => void }) {
  return <TrainingCard title="Identity" subtitle="Requirement identity, source, owner/reviewer and review dates."><div className="grid gap-4 md:grid-cols-2"><TextField label="Requirement title" value={values.requirement_title} onChange={(v) => set('requirement_title', v)} /><TextField label="Requirement code" value={values.requirement_code} onChange={(v) => set('requirement_code', v)} helper="Leave blank if numbering is generated by backend policy." /><SelectField label="Requirement source" value={values.requirement_source} onChange={(v) => set('requirement_source', v)} options={['SOP Library', 'Document Control', 'Training Matrix', 'Competency Profile', 'PTW Role', 'MOC', 'PSSR', 'PSI Hazard', 'Manual']} /><TextField label="Owner user ID" value={values.owner_user_id} onChange={(v) => set('owner_user_id', v)} /><TextField label="Reviewer user ID" value={values.reviewer_user_id} onChange={(v) => set('reviewer_user_id', v)} /><TextField label="Effective date" type="date" value={values.effective_date} onChange={(v) => set('effective_date', v)} /><TextField label="Next review due" type="date" value={values.next_review_due} onChange={(v) => set('next_review_due', v)} /><TextField label="Description / purpose" value={values.description} onChange={(v) => set('description', v)} /></div></TrainingCard>;
}

export function SopDocumentVersionSection({ values, set }: { values: Record<string, any>; set: (key: string, value: unknown) => void }) {
  return <TrainingCard title="SOP / Document Version" subtitle="References the exact controlled SOP or Document Control version."><div className="grid gap-4 md:grid-cols-2"><TextField label="SOP ID" value={values.sop_id} onChange={(v) => set('sop_id', v)} /><TextField label="Document ID" value={values.document_id} onChange={(v) => set('document_id', v)} /><TextField label="SOP title" value={values.sop_title} onChange={(v) => set('sop_title', v)} /><TextField label="Document number" value={values.document_number} onChange={(v) => set('document_number', v)} /><TextField label="Required version" value={values.required_version} onChange={(v) => set('required_version', v)} /><TextField label="Revision number" value={values.revision_number} onChange={(v) => set('revision_number', v)} /><SelectField label="Current version policy" value={values.current_version_policy} onChange={(v) => set('current_version_policy', v)} options={['Current approved version only', 'Allow superseded with reason', 'Re-acknowledge on major revision', 'Re-acknowledge on any revision']} /><TextField label="Document owner" value={values.document_owner} onChange={(v) => set('document_owner', v)} /></div></TrainingCard>;
}

export function SopApplicabilityWorkersSection({ values, set }: { values: Record<string, any>; set: (key: string, value: unknown) => void }) {
  return <TrainingCard title="Applicability & Workers" subtitle="Rules can target site, unit, area, department, worker type, employer, contractor company, job role, competency profile, equipment, PTW role or matrix source."><div className="grid gap-4 md:grid-cols-2"><TextField label="Site ID" value={values.site_id} onChange={(v) => set('site_id', v)} /><TextField label="Applicability rule / scope" value={values.applicability} onChange={(v) => set('applicability', v)} helper="Describe the exact scope if a structured selector is not available." /><SelectField label="Assignment source" value={values.assignment_source} onChange={(v) => set('assignment_source', v)} options={['Applicability rule', 'Training Matrix', 'Competency Profile', 'Required Training', 'PTW Role', 'MOC', 'PSSR', 'Safety Critical Work', 'Manual']} /></div></TrainingCard>;
}

export function SopDueReacknowledgementRulesSection({ values, set }: { values: Record<string, any>; set: (key: string, value: unknown) => void }) {
  return <TrainingCard title="Due / Re-Acknowledgement Rules" subtitle="Backend evaluates due dates, expiries and SOP revision impacts."><div className="grid gap-4 md:grid-cols-2"><TextField label="Due days after assignment" type="number" value={values.due_days_after_assignment} onChange={(v) => set('due_days_after_assignment', v)} /><TextField label="Re-acknowledgement due days" type="number" value={values.reacknowledgement_due_days} onChange={(v) => set('reacknowledgement_due_days', v)} /><TextField label="Expiry months" type="number" value={values.expiry_months} onChange={(v) => set('expiry_months', v)} /><ToggleField label="Re-acknowledgement required on SOP revision" checked={Boolean(values.reacknowledgement_required_on_revision)} onChange={(v) => set('reacknowledgement_required_on_revision', v)} /></div></TrainingCard>;
}

export function SopEvidenceEsignAssessmentSection({ values, set }: { values: Record<string, any>; set: (key: string, value: unknown) => void }) {
  return <TrainingCard title="Evidence / E-Sign / Assessment" subtitle="Acknowledgement can require e-signature, quiz/assessment, uploaded evidence and verifier review."><div className="grid gap-4 md:grid-cols-2"><SelectField label="Acknowledgement method" value={values.acknowledgement_method} onChange={(v) => set('acknowledgement_method', v)} options={['Worker confirmation', 'Universal E-Signature', 'Supervisor attestation', 'Quiz + acknowledgement', 'Classroom acknowledgement', 'Bulk imported evidence']} /><TextField label="Passing score" type="number" value={values.passing_score} onChange={(v) => set('passing_score', v)} /><ToggleField label="E-signature required" checked={Boolean(values.esignature_required)} onChange={(v) => set('esignature_required', v)} /><ToggleField label="Assessment required" checked={Boolean(values.assessment_required)} onChange={(v) => set('assessment_required', v)} /><ToggleField label="Verification required" checked={Boolean(values.verification_required)} onChange={(v) => set('verification_required', v)} /><ToggleField label="Evidence required" checked={Boolean(values.evidence_required)} onChange={(v) => set('evidence_required', v)} /></div></TrainingCard>;
}

export function SopBlockingSafetyImpactSection({ values, set }: { values: Record<string, any>; set: (key: string, value: unknown) => void }) {
  const toggles = ['safety_critical', 'psm_critical', 'ptw_critical', 'moc_critical', 'pssr_critical', 'blocks_ptw_authorization', 'blocks_moc_implementation', 'blocks_pssr_startup', 'blocks_safety_critical_work', 'waiver_allowed'];
  return <TrainingCard title="Blocking & Safety Impact" subtitle="Configured blockers feed PTW, MOC, PSSR, safety-critical work readiness and waivers."><div className="grid gap-3 md:grid-cols-2">{toggles.map((key) => <ToggleField key={key} label={key.replaceAll('_', ' ')} checked={Boolean(values[key])} onChange={(v) => set(key, v)} />)}</div></TrainingCard>;
}

export function SopMatrixCompetencyLinksSection({ values, set }: { values: Record<string, any>; set: (key: string, value: unknown) => void }) {
  return <TrainingCard title="Matrix / Competency / Training Links" subtitle="SOP acknowledgement evidence can satisfy linked Required Training, Matrix and Competency items only after backend validation passes."><div className="grid gap-4 md:grid-cols-2"><TextField label="Linked training item ID" value={values.training_item_id} onChange={(v) => set('training_item_id', v)} /><TextField label="Competency profile ID" value={values.competency_profile_id} onChange={(v) => set('competency_profile_id', v)} /><ToggleField label="Sync to Training Matrix" checked={Boolean(values.sync_to_matrix)} onChange={(v) => set('sync_to_matrix', v)} /><ToggleField label="Sync to Competency Profile" checked={Boolean(values.sync_to_competency)} onChange={(v) => set('sync_to_competency', v)} /><TextField label="Notes" value={values.notes} onChange={(v) => set('notes', v)} /></div></TrainingCard>;
}

function ReviewStep({ values, errors }: { values: Record<string, any>; errors: string[] }) {
  return <TrainingCard title="Review & Activate" subtitle="Review all configured scope, version, due, evidence, blocker and sync rules before saving."><div className="space-y-4">{errors.length ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning"><strong>Missing required data:</strong> {errors.join(', ')}</div> : <TrainingBadge tone="good">Ready to save</TrainingBadge>}<dl className="grid gap-3 md:grid-cols-3">{Object.entries(values).map(([key, value]) => <div key={key} className="rounded-lg bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">{key.replaceAll('_', ' ')}</dt><dd className="mt-1 break-words text-sm font-semibold">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value || '-')}</dd></div>)}</dl></div></TrainingCard>;
}
