'use client';

import { TrainingCard } from '../../../shared/TrainingUi';
import { Field, SectionProps, Select } from './SessionIdentitySection';

const bools = ['attendanceRequired', 'evidenceDocumentRequired', 'assessmentRequired', 'certificateRequired', 'sopAcknowledgementRequired', 'practicalDemonstrationRequired', 'supervisorSignoffRequired', 'hseVerificationRequired', 'instructorVerificationRequired', 'approvalRequired', 'eSignatureRequired'];

export function SessionEvidenceVerificationSection({ form, update, context }: SectionProps) {
  const rules = form.evidenceRules ?? {};
  const setRule = (key: string, value: any) => update({ evidenceRules: { ...rules, [key]: value } });
  return (
    <TrainingCard title="6. Evidence / Verification Rules" subtitle="Defaults should come from Required Training Library; safety-critical overrides require backend permission and reason.">
      <div className="grid gap-3 md:grid-cols-3">{bools.map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><input type="checkbox" checked={Boolean(rules[key])} onChange={(e) => setRule(key, e.currentTarget.checked)} />{label(key)}</label>)}</div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field label="Minimum attendance duration / percentage" value={rules.minimumAttendance} onChange={(v) => setRule('minimumAttendance', v)} />
        <Field label="Completion expiry rule" value={rules.completionExpiryRule} onChange={(v) => setRule('completionExpiryRule', v)} />
        <Select label="Verification role" value={rules.verificationRole ?? ''} options={context?.users?.map((u: any) => ({ value: u.id, label: u.displayName ?? u.email }))} onChange={(v) => setRule('verificationRole', v)} />
      </div>
      <textarea className="mt-4 min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Evidence / verification notes" value={rules.notes ?? ''} onChange={(e) => setRule('notes', e.currentTarget.value)} />
    </TrainingCard>
  );
}

function label(value: string) {
  return value.replace(/[A-Z]/g, (m) => ` ${m}`).replace(/^./, (m) => m.toUpperCase());
}
