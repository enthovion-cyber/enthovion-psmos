'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { RequiredTrainingContext, RequiredTrainingDetailResponse } from '../types/required-training.types';
import { validateRequiredTrainingIdentity } from '../schemas/required-training.schema';
import { TrainingButton, TrainingCard, TrainingErrorState } from '../shared/TrainingUi';

const steps = ['Training Identity', 'Scope / Applicability', 'Content Outline', 'Delivery / Frequency', 'Evidence / Verification', 'Links / Dependencies', 'Matrix & Competency Sync', 'Review & Save'];

export function RequiredTrainingForm({ context, initial, isSaving, error, onSubmit }: { context?: RequiredTrainingContext | undefined; initial?: RequiredTrainingDetailResponse | undefined; isSaving?: boolean | undefined; error?: unknown; onSubmit: (data: Record<string, unknown>) => void }) {
  const item = initial?.item;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, any>>({
    trainingTitle: item?.training_title ?? '',
    trainingCode: item?.training_code ?? '',
    trainingCategory: item?.training_category ?? '',
    trainingType: item?.training_type ?? '',
    description: item?.description ?? '',
    objective: item?.objective ?? '',
    targetAudience: item?.target_audience ?? '',
    ownerUserId: item?.owner_user_id ?? '',
    ownerRole: item?.owner_role ?? '',
    reviewerUserId: item?.reviewer_user_id ?? '',
    siteId: item?.site_id ?? context?.selectedSiteId ?? '',
    version: item?.version ?? '1.0',
    effectiveDate: item?.effective_date ?? '',
    nextReviewDate: item?.next_review_date ?? '',
    criticality: item?.criticality ?? 'Standard',
    safetyCritical: item?.safety_critical ?? false,
    psmCritical: item?.psm_critical ?? false,
    ptwCritical: item?.ptw_critical ?? false,
    mocCritical: item?.moc_critical ?? false,
    pssrCritical: item?.pssr_critical ?? false,
    deliveryMethod: item?.delivery_method ?? '',
    recurrenceType: item?.recurrence_type ?? 'One-Time',
    recurrenceIntervalDays: item?.recurrence_interval_days ?? '',
    notes: item?.notes ?? '',
    contentSections: initial?.content?.length ? initial.content : [{ sectionTitle: '', summary: '', learningOutcome: '', required: true }],
    scopes: initial?.applicability ?? [],
    deliveryRules: initial?.deliveryRules ?? {},
    evidenceRules: initial?.evidenceRules ?? { evidenceRequired: true, acceptedEvidenceTypes: [], primaryEvidenceType: '' },
    links: initial?.links ?? [],
    matrixLinks: initial?.matrixLinks ?? [],
    competencyLinks: initial?.competencyLinks ?? [],
    documents: initial?.documents ?? [],
    changeReason: ''
  });
  const errors = useMemo(() => validateRequiredTrainingIdentity(form), [form]);
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const nextDisabledReason = step === 0 && errors.length ? `Missing required fields: ${errors.join(', ')}` : '';
  const submitDisabledReason = errors.length ? `Cannot save until ${errors.join(', ')} are complete.` : isSaving ? 'Save is already in progress.' : '';
  return (
    <div className="space-y-4">
      {error ? <TrainingErrorState message={error} /> : null}
      <div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
        {steps.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${step === index ? 'bg-primary text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{index + 1}. {label}</button>)}
      </div>
      {step === 0 ? <IdentityStep form={form} set={set} context={context} /> : null}
      {step === 1 ? <ScopeStep form={form} set={set} context={context} /> : null}
      {step === 2 ? <ContentStep form={form} set={set} /> : null}
      {step === 3 ? <DeliveryStep form={form} set={set} context={context} /> : null}
      {step === 4 ? <EvidenceStep form={form} set={set} context={context} /> : null}
      {step === 5 ? <LinksStep form={form} set={set} context={context} /> : null}
      {step === 6 ? <SyncStep form={form} context={context} /> : null}
      {step === 7 ? <ReviewStep form={form} errors={errors} context={context} /> : null}
      <div className="flex flex-wrap justify-between gap-2">
        <TrainingButton variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} title="Already on the first step">Back</TrainingButton>
        <div className="flex gap-2">
          <TrainingButton variant="secondary" href="/training-competency/required-training/library">Cancel</TrainingButton>
          {step < steps.length - 1 ? <TrainingButton onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={Boolean(nextDisabledReason)} title={nextDisabledReason}>Next</TrainingButton> : null}
          <TrainingButton onClick={() => onSubmit(form)} disabled={Boolean(submitDisabledReason)} title={submitDisabledReason}>{isSaving ? 'Saving...' : 'Save Required Training'}</TrainingButton>
        </div>
      </div>
    </div>
  );
}

function IdentityStep({ form, set, context }: StepProps) {
  return <TrainingCard title="Training Identity"><div className="grid gap-3 md:grid-cols-2"><Field label="Training title" value={form.trainingTitle} onChange={(v) => set('trainingTitle', v)} required /><Field label="Training code" value={form.trainingCode} onChange={(v) => set('trainingCode', v)} required /><Select label="Category" value={form.trainingCategory} values={context?.lookups.trainingCategories ?? []} onChange={(v) => set('trainingCategory', v)} required /><Select label="Type" value={form.trainingType} values={context?.lookups.trainingTypes ?? []} onChange={(v) => set('trainingType', v)} required /><Field label="Objective" value={form.objective} onChange={(v) => set('objective', v)} /><Field label="Target audience" value={form.targetAudience} onChange={(v) => set('targetAudience', v)} /><Select label="Owner" value={form.ownerUserId} values={(context?.users ?? []).map((u) => ({ value: u.id, label: `${u.displayName ?? u.email} / ${u.title ?? u.department ?? 'User'}` }))} onChange={(v) => set('ownerUserId', v)} /><Field label="Owner role" value={form.ownerRole} onChange={(v) => set('ownerRole', v)} /><Field label="Version" value={form.version} onChange={(v) => set('version', v)} /><Field label="Effective date" type="date" value={form.effectiveDate} onChange={(v) => set('effectiveDate', v)} /><Field label="Next review date" type="date" value={form.nextReviewDate} onChange={(v) => set('nextReviewDate', v)} /><Select label="Criticality" value={form.criticality} values={context?.lookups.criticalities ?? []} onChange={(v) => set('criticality', v)} /></div><textarea className="mt-3 min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Description, assumptions, exclusions, and notes" value={form.description} onChange={(e) => set('description', e.target.value)} /><ToggleRow form={form} set={set} keys={['safetyCritical', 'psmCritical', 'ptwCritical', 'mocCritical', 'pssrCritical']} /></TrainingCard>;
}

function ScopeStep({ form, set, context }: StepProps) {
  return <TrainingCard title="Scope / Applicability" subtitle="Apply to company, site, department, unit, area, equipment, worker type, job role, competency profile, PTW role, SOP, PSI, MOC or PSSR trigger."><div className="grid gap-3 md:grid-cols-3"><Select label="Site" value={form.siteId} values={(context?.sites ?? []).map((s) => ({ value: s.id, label: `${s.name ?? s.id} ${s.code ? `(${s.code})` : ''}` }))} onChange={(v) => set('siteId', v)} /><Field label="Department ID" value={form.departmentId} onChange={(v) => set('departmentId', v)} /><Field label="Unit ID" value={form.unitId} onChange={(v) => set('unitId', v)} /><Field label="Area ID" value={form.areaId} onChange={(v) => set('areaId', v)} /><Field label="Equipment ID" value={form.equipmentId} onChange={(v) => set('equipmentId', v)} /><Field label="Worker / employer type" value={form.workerTypeFilter} onChange={(v) => set('workerTypeFilter', v)} /><Field label="Job role" value={form.jobRoleFilter} onChange={(v) => set('jobRoleFilter', v)} /><Field label="PTW role" value={form.ptwRoleFilter} onChange={(v) => set('ptwRoleFilter', v)} /><Field label="SOP / PSI / MOC / PSSR trigger" value={form.scopeTrigger} onChange={(v) => set('scopeTrigger', v)} /></div></TrainingCard>;
}

function ContentStep({ form, set }: StepProps) {
  const section = form.contentSections?.[0] ?? {};
  const update = (key: string, value: any) => set('contentSections', [{ ...section, [key]: value }]);
  return <TrainingCard title="Content Outline"><div className="grid gap-3 md:grid-cols-2"><Field label="Section title" value={section.sectionTitle ?? section.section_title ?? ''} onChange={(v) => update('sectionTitle', v)} /><Field label="Learning outcome" value={section.learningOutcome ?? section.learning_outcome ?? ''} onChange={(v) => update('learningOutcome', v)} /><Field label="Linked SOP" value={section.linkedSopId ?? section.linked_sop_id ?? ''} onChange={(v) => update('linkedSopId', v)} /><Field label="Linked PSI / hazard" value={section.linkedPsiModule ?? section.linked_psi_module ?? ''} onChange={(v) => update('linkedPsiModule', v)} /></div><textarea className="mt-3 min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Section summary, hazards, controls, skills, practical demonstration and localization notes" value={section.summary ?? ''} onChange={(e) => update('summary', e.target.value)} /></TrainingCard>;
}

function DeliveryStep({ form, set, context }: StepProps) {
  return <TrainingCard title="Delivery / Frequency"><div className="grid gap-3 md:grid-cols-3"><Select label="Delivery method" value={form.deliveryMethod} values={context?.lookups.deliveryMethods ?? []} onChange={(v) => set('deliveryMethod', v)} /><Select label="Recurrence" value={form.recurrenceType} values={context?.lookups.recurrenceTypes ?? []} onChange={(v) => set('recurrenceType', v)} /><Field label="Renewal interval days" type="number" value={form.recurrenceIntervalDays} onChange={(v) => set('recurrenceIntervalDays', v)} /><Field label="Grace period days" type="number" value={form.deliveryRules?.grace_period_days ?? ''} onChange={(v) => set('deliveryRules', { ...form.deliveryRules, gracePeriodDays: Number(v) || undefined })} /><Field label="Expiry warning days" type="number" value={form.deliveryRules?.expiry_warning_days ?? ''} onChange={(v) => set('deliveryRules', { ...form.deliveryRules, expiryWarningDays: Number(v) || undefined })} /><Field label="Initial due rule" value={form.deliveryRules?.initial_due_rule ?? ''} onChange={(v) => set('deliveryRules', { ...form.deliveryRules, initialDueRule: v })} /></div><ToggleRow form={form.deliveryRules ?? {}} set={(key, value) => set('deliveryRules', { ...form.deliveryRules, [key]: value })} keys={['instructorRequired', 'selfPacedAllowed', 'externalProviderAllowed', 'requiredBeforeSiteAccess', 'requiredBeforeUnitAccess', 'requiredBeforePtwRole', 'requiredBeforeMocImplementation', 'requiredBeforePssrStartup', 'requalificationAfterIncident', 'requalificationAfterSopChange', 'requalificationAfterPsiChange', 'requalificationAfterMoc']} /></TrainingCard>;
}

function EvidenceStep({ form, set, context }: StepProps) {
  const rules = form.evidenceRules ?? {};
  const update = (key: string, value: any) => set('evidenceRules', { ...rules, [key]: value });
  return <TrainingCard title="Evidence / Verification"><div className="grid gap-3 md:grid-cols-3"><Select label="Primary evidence type" value={rules.primaryEvidenceType ?? rules.primary_evidence_type ?? ''} values={context?.lookups.evidenceTypes ?? []} onChange={(v) => update('primaryEvidenceType', v)} /><Field label="Minimum score" type="number" value={rules.minimum_score ?? rules.minimumScore ?? ''} onChange={(v) => update('minimumScore', Number(v) || undefined)} /><Field label="Evidence validity days" type="number" value={rules.evidence_validity_days ?? rules.evidenceValidityDays ?? ''} onChange={(v) => update('evidenceValidityDays', Number(v) || undefined)} /><Field label="Verification role" value={rules.verification_role ?? rules.verificationRole ?? ''} onChange={(v) => update('verificationRole', v)} /><Field label="Max attempts" type="number" value={rules.max_attempts ?? rules.maxAttempts ?? ''} onChange={(v) => update('maxAttempts', Number(v) || undefined)} /></div><ToggleRow form={rules} set={update} keys={['evidenceRequired', 'attendanceRequired', 'certificateRequired', 'assessmentRequired', 'sopAcknowledgementRequired', 'practicalDemonstrationRequired', 'supervisorSignoffRequired', 'hseVerificationRequired', 'externalCertificateAllowed', 'documentEvidenceRequired', 'verificationRequired', 'approvalRequired', 'eSignatureRequired', 'retakeRequiredOnFail']} /></TrainingCard>;
}

function LinksStep({ form, set, context }: StepProps) {
  return <TrainingCard title="Links / Dependencies" subtitle="Link SOP, PSI, PTW, MOC, PSSR, HAZOP, incidents, audit findings, equipment, controlled documents, matrix and competency records."><div className="grid gap-3 md:grid-cols-3"><Select label="Link type" value={form.linkType ?? ''} values={context?.lookups.linkTypes ?? []} onChange={(v) => set('linkType', v)} /><Field label="Linked record ID" value={form.linkedRecordId ?? ''} onChange={(v) => set('linkedRecordId', v)} /><Field label="Linked record title" value={form.linkedRecordTitle ?? ''} onChange={(v) => set('linkedRecordTitle', v)} /><Select label="Controlled document" value={form.documentId ?? ''} values={(context?.documents ?? []).map((d) => ({ value: d.id, label: `${d.number ?? d.id} / ${d.title}` }))} onChange={(v) => set('documentId', v)} /><Select label="Matrix rule" value={form.matrixRuleId ?? ''} values={(context?.matrixRules ?? []).map((r) => ({ value: r.id, label: `${r.rule_code ?? r.id} / ${r.rule_title}` }))} onChange={(v) => set('matrixRuleId', v)} /><Select label="Competency profile" value={form.competencyProfileId ?? ''} values={(context?.competencyProfiles ?? []).map((p) => ({ value: p.id, label: `${p.profile_code ?? p.id} / ${p.profile_title}` }))} onChange={(v) => set('competencyProfileId', v)} /></div></TrainingCard>;
}

function SyncStep({ form, context }: { form: Record<string, any>; context?: RequiredTrainingContext | undefined }) {
  return <TrainingCard title="Matrix & Competency Sync" subtitle="Backend sync creates or links matrix and competency references; it does not use frontend-only status."><div className="grid gap-3 md:grid-cols-3"><Info label="Selected matrix rule" value={form.matrixRuleId || 'Not selected'} /><Info label="Selected competency profile" value={form.competencyProfileId || 'Not selected'} /><Info label="Available matrix rules" value={context?.matrixRules?.length ?? 0} /><Info label="Available competency profiles" value={context?.competencyProfiles?.length ?? 0} /><Info label="Sync status" value="Calculated after save by backend" /></div></TrainingCard>;
}

function ReviewStep({ form, errors, context }: { form: Record<string, any>; errors: string[]; context?: RequiredTrainingContext | undefined }) {
  return <TrainingCard title="Review & Save" subtitle="Review complete identity, scope, content, evidence, links, matrix/competency sync, missing data and blockers before saving."><div className="grid gap-3 md:grid-cols-3"><Info label="Training" value={`${form.trainingCode || 'Missing code'} / ${form.trainingTitle || 'Missing title'}`} /><Info label="Category / Type" value={`${form.trainingCategory || 'Missing'} / ${form.trainingType || 'Missing'}`} /><Info label="Critical flags" value={['safetyCritical', 'psmCritical', 'ptwCritical', 'mocCritical', 'pssrCritical'].filter((key) => form[key]).join(', ') || 'None'} /><Info label="Owner" value={form.ownerUserId || form.ownerRole || 'Missing owner'} /><Info label="Evidence" value={form.evidenceRules?.primaryEvidenceType || 'Missing policy'} /><Info label="Documents" value={form.documentId ? 'Document selected' : 'No document selected'} /><Info label="Matrix" value={form.matrixRuleId || 'Not selected'} /><Info label="Competency" value={form.competencyProfileId || 'Not selected'} /><Info label="Site scope" value={(context?.sites ?? []).find((s) => s.id === form.siteId)?.name ?? form.siteId ?? 'Company/shared'} /></div>{errors.length ? <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">Missing required data: {errors.join(', ')}</div> : null}</TrainingCard>;
}

type StepProps = { form: Record<string, any>; set: (key: string, value: any) => void; context?: RequiredTrainingContext | undefined };

function Field({ label, value, onChange, type = 'text', required }: { label: string; value?: any; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block text-sm font-semibold">{label}{required ? ' *' : ''}<input type={type} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, values, onChange, required }: { label: string; value?: string; values: Array<string | { value: string; label: string }>; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block text-sm font-semibold">{label}{required ? ' *' : ''}<select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={value ?? ''} onChange={(e) => onChange(e.target.value)}><option value="">Select</option>{values.map((v) => typeof v === 'string' ? <option key={v} value={v}>{v}</option> : <option key={v.value} value={v.value}>{v.label}</option>)}</select></label>;
}

function ToggleRow({ form, set, keys }: { form: Record<string, any>; set: (key: string, value: boolean) => void; keys: string[] }) {
  return <div className="mt-4 grid gap-2 md:grid-cols-3">{keys.map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)} />{key.replace(/[A-Z]/g, ' $&')}</label>)}</div>;
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}
