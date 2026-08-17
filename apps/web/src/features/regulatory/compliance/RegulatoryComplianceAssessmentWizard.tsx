'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState } from '../shared/RegulatoryUi';
import { useRegulatoryComplianceLookups } from '../hooks/useRegulatoryComplianceLookups';
import { useRegulatoryComplianceMutations } from '../hooks/useRegulatoryComplianceMutations';
import { ComplianceActionFoundationSection } from './ComplianceActionFoundationSection';
import { ComplianceCriteriaSection } from './ComplianceCriteriaSection';
import { ComplianceEvidenceReadinessSection } from './ComplianceEvidenceReadinessSection';
import { ComplianceGapIdentificationSection } from './ComplianceGapIdentificationSection';
import { ComplianceScopeApplicabilitySection } from './ComplianceScopeApplicabilitySection';
import { ComplianceSourceSelectionSection } from './ComplianceSourceSelectionSection';
import { ComplianceStatusDecisionSection } from './ComplianceStatusDecisionSection';

const steps = ['Source Selection', 'Scope / Applicability', 'Evidence Readiness', 'Compliance Criteria', 'Gap Identification', 'Status Decision', 'Action Foundation', 'Review & Save'];

export function RegulatoryComplianceAssessmentWizard({ initial }: { initial?: Record<string, unknown> | undefined }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, unknown>>({ sourceType: 'Regulatory Item', complianceStatus: 'Not Assessed', evidenceReadinessStatus: 'Not Assessed', criteriaStatus: 'Not Checked', gapStatus: 'Not Assessed', ...initial });
  const [validation, setValidation] = useState<string | null>(null);
  const lookups = useRegulatoryComplianceLookups();
  const mutations = useRegulatoryComplianceMutations();
  const currentMissing = useMemo(() => validateStep(step, form), [step, form]);
  const saving = mutations.create.isPending;
  const next = () => {
    const missing = validateStep(step, form);
    if (missing) return setValidation(missing);
    setValidation(null);
    setStep((value) => Math.min(value + 1, steps.length - 1));
  };
  const save = async () => {
    const missing = validateStep(steps.length - 1, form);
    if (missing) return setValidation(missing);
    setValidation(null);
    const detail = await mutations.create.mutateAsync(form);
    router.push(`/regulatory/compliance-status/assessments/${detail.assessment.id}`);
  };
  const sectionProps = { form, setForm, lookups: lookups.data };
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">{steps.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${step === index ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{index + 1}. {label}</button>)}</div>
      {mutations.create.error ? <RegulatoryErrorState message={mutations.create.error} /> : null}
      {validation ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{validation}</div> : null}
      <RegulatoryCard title={steps[step]} subtitle="Backend validation, permission checks, site isolation, audit, and regulatory compliance history are enforced when saved.">
        {step === 0 ? <ComplianceSourceSelectionSection {...sectionProps} /> : null}
        {step === 1 ? <ComplianceScopeApplicabilitySection form={form} setForm={setForm} /> : null}
        {step === 2 ? <ComplianceEvidenceReadinessSection {...sectionProps} /> : null}
        {step === 3 ? <ComplianceCriteriaSection {...sectionProps} /> : null}
        {step === 4 ? <ComplianceGapIdentificationSection form={form} setForm={setForm} /> : null}
        {step === 5 ? <ComplianceStatusDecisionSection {...sectionProps} /> : null}
        {step === 6 ? <ComplianceActionFoundationSection form={form} setForm={setForm} /> : null}
        {step === 7 ? <Review form={form} /> : null}
      </RegulatoryCard>
      <div className="flex flex-wrap justify-between gap-3"><RegulatoryButton variant="secondary" disabled={step === 0} title={step === 0 ? 'Already on the first step.' : 'Go back.'} onClick={() => setStep((value) => Math.max(value - 1, 0))}>Back</RegulatoryButton><div className="flex gap-2"><RegulatoryButton variant="secondary" title={currentMissing ?? 'Save draft data as a compliance assessment.'} disabled={saving || Boolean(currentMissing)} onClick={save}>Save Assessment</RegulatoryButton>{step < steps.length - 1 ? <RegulatoryButton title={currentMissing ?? 'Continue to the next step.'} disabled={Boolean(currentMissing)} onClick={next}>Next</RegulatoryButton> : <RegulatoryButton disabled={saving || Boolean(currentMissing)} title={currentMissing ?? 'Create and open assessment.'} onClick={save}>{saving ? 'Saving...' : 'Create & Open'}</RegulatoryButton>}</div></div>
    </div>
  );
}

function Review({ form }: { form: Record<string, unknown> }) {
  return <div className="grid gap-2 text-sm">{Object.entries(form).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => <div key={key} className="flex justify-between gap-3 rounded-lg bg-[var(--psm-surface-2)] px-3 py-2"><span className="font-semibold text-[var(--psm-muted)]">{key}</span><span className="text-right text-[var(--psm-fg)]">{String(value)}</span></div>)}</div>;
}

function validateStep(step: number, form: Record<string, unknown>) {
  if (step === 0 && !String(form.sourceRecordId ?? '').trim()) return 'Source record ID is required.';
  if (step === 0 && !String(form.assessmentTitle ?? '').trim()) return 'Assessment title is required.';
  if (step >= 5 && ['Compliant Foundation', 'Partially Compliant Foundation', 'Non-Compliant Foundation'].includes(String(form.complianceStatus ?? '')) && !String(form.statusRationale ?? '').trim()) return 'Compliance status rationale is required.';
  if (Boolean(form.manualDeclaration) && !String(form.manualDeclarationReason ?? '').trim()) return 'Manual declaration requires a reason.';
  return null;
}
