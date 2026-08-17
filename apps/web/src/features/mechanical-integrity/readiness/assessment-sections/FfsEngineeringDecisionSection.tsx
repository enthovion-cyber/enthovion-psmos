'use client';

import { KeyValueGrid, SectionCard } from '../../safeguards/SafeguardUiPrimitives';

type Props = {
  form: Record<string, any>;
  decisions?: string[] | undefined;
  onChange: (key: string, value: unknown) => void;
};

export function FfsEngineeringDecisionSection({ form, decisions, onChange }: Props) {
  return (
    <SectionCard title="4. FFS / Engineering Decision" description="Document the proposed decision, FFS need, technical basis, and risk acceptance. The backend still controls final approval rules.">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold">Proposed decision
          <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.proposedDecision} onChange={(event) => onChange('proposedDecision', event.target.value)}>
            <option value="">Use backend recommendation</option>
            {(decisions ?? []).map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold">
          <input type="checkbox" checked={Boolean(form.ffsRequired)} onChange={(event) => onChange('ffsRequired', event.target.checked)} /> FFS / engineering assessment required
        </label>
        <label className="text-sm font-semibold md:col-span-2">FFS assessment reference
          <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.ffsAssessmentReference} onChange={(event) => onChange('ffsAssessmentReference', event.target.value)} />
        </label>
        <label className="text-sm font-semibold md:col-span-2">Engineering justification
          <textarea rows={3} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.engineeringJustification} onChange={(event) => onChange('engineeringJustification', event.target.value)} />
        </label>
        <label className="text-sm font-semibold md:col-span-2">Technical basis
          <textarea rows={3} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.technicalBasis} onChange={(event) => onChange('technicalBasis', event.target.value)} />
        </label>
        <label className="text-sm font-semibold md:col-span-2">Risk acceptance statement
          <textarea rows={3} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.riskAcceptanceStatement} onChange={(event) => onChange('riskAcceptanceStatement', event.target.value)} />
        </label>
      </div>
      <div className="mt-4">
        <KeyValueGrid items={[
          ['Fit for Service approval rule', 'No open unwaived critical/startup blockers'],
          ['Fit with Restrictions rule', 'Active restriction with owner and expiry required'],
          ['Not Fit rule', 'Engineering justification or reason required']
        ]} />
      </div>
    </SectionCard>
  );
}
