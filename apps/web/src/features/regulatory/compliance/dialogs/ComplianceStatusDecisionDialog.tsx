'use client';

import { useState } from 'react';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';
import { useRegulatoryComplianceMutations } from '../../hooks/useRegulatoryComplianceMutations';

export function ComplianceStatusDecisionDialog({ assessmentId, disabledReason, statuses = [] }: { assessmentId: string; disabledReason?: string | null; statuses?: string[] | undefined }) {
  const [form, setForm] = useState({ complianceStatus: '', statusRationale: '', decisionBasis: '', manualDeclaration: false, manualDeclarationReason: '' });
  const mutations = useRegulatoryComplianceMutations();
  const missing = disabledReason ?? (!form.complianceStatus ? 'Compliance status is required.' : !form.statusRationale ? 'Compliance status rationale is required.' : null);
  return (
    <RegulatoryCard title="Compliance Status Decision" subtitle="Backend validates readiness, rationale, manual declaration policy, review requirement, audit, and history." action={<RegulatoryButton disabled={Boolean(missing) || mutations.changeStatus.isPending} title={missing ?? 'Save compliance status decision.'} onClick={() => mutations.changeStatus.mutate({ assessmentId, data: form })}>{mutations.changeStatus.isPending ? 'Saving...' : 'Save Decision'}</RegulatoryButton>}>
      <div className="grid gap-3 md:grid-cols-2">
        <RegulatoryField label="Compliance status"><select className={regulatoryInputClass()} value={form.complianceStatus} onChange={(event) => setForm((value) => ({ ...value, complianceStatus: event.target.value }))}><option value="">Select status</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></RegulatoryField>
        <RegulatoryField label="Decision basis"><input className={regulatoryInputClass()} value={form.decisionBasis} onChange={(event) => setForm((value) => ({ ...value, decisionBasis: event.target.value }))} /></RegulatoryField>
        <RegulatoryField label="Status rationale"><textarea className={regulatoryInputClass()} value={form.statusRationale} onChange={(event) => setForm((value) => ({ ...value, statusRationale: event.target.value }))} /></RegulatoryField>
        <RegulatoryField label="Manual declaration reason"><textarea className={regulatoryInputClass()} value={form.manualDeclarationReason} onChange={(event) => setForm((value) => ({ ...value, manualDeclarationReason: event.target.value }))} /></RegulatoryField>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--psm-fg)]"><input type="checkbox" checked={form.manualDeclaration} onChange={(event) => setForm((value) => ({ ...value, manualDeclaration: event.target.checked }))} /> Manual declaration</label>
      </div>
      {missing ? <p className="mt-3 text-sm text-danger">{missing}</p> : null}
    </RegulatoryCard>
  );
}
