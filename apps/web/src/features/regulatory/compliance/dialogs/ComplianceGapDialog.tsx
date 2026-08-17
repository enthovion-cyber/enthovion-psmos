'use client';

import { useState } from 'react';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';
import { useRegulatoryComplianceMutations } from '../../hooks/useRegulatoryComplianceMutations';

export function ComplianceGapDialog({ defaults, disabledReason, gapTypes = [], severities = [] }: { defaults?: Record<string, unknown>; disabledReason?: string | null; gapTypes?: string[]; severities?: string[] }) {
  const [form, setForm] = useState<Record<string, unknown>>({ gapType: '', gapTitle: '', severity: 'Medium', ...defaults });
  const mutations = useRegulatoryComplianceMutations();
  const missing = disabledReason ?? (!form.gapType ? 'Gap type is required.' : !form.gapTitle ? 'Gap title is required.' : !form.severity ? 'Severity is required.' : null);
  return (
    <RegulatoryCard title="Compliance Gap" subtitle="Create a backend-owned compliance gap tied to the selected assessment/source/scope." action={<RegulatoryButton disabled={Boolean(missing) || mutations.createGap.isPending} title={missing ?? 'Create compliance gap.'} onClick={() => mutations.createGap.mutate(form)}>{mutations.createGap.isPending ? 'Saving...' : 'Create Gap'}</RegulatoryButton>}>
      <div className="grid gap-3 md:grid-cols-2">
        <RegulatoryField label="Gap type"><select className={regulatoryInputClass()} value={String(form.gapType ?? '')} onChange={(event) => setForm((value) => ({ ...value, gapType: event.target.value }))}><option value="">Select type</option>{gapTypes.map((type) => <option key={type}>{type}</option>)}</select></RegulatoryField>
        <RegulatoryField label="Severity"><select className={regulatoryInputClass()} value={String(form.severity ?? '')} onChange={(event) => setForm((value) => ({ ...value, severity: event.target.value }))}>{severities.map((severity) => <option key={severity}>{severity}</option>)}</select></RegulatoryField>
        <RegulatoryField label="Gap title"><input className={regulatoryInputClass()} value={String(form.gapTitle ?? '')} onChange={(event) => setForm((value) => ({ ...value, gapTitle: event.target.value }))} /></RegulatoryField>
        <RegulatoryField label="Due date"><input type="datetime-local" className={regulatoryInputClass()} value={String(form.dueDate ?? '')} onChange={(event) => setForm((value) => ({ ...value, dueDate: event.target.value }))} /></RegulatoryField>
        <RegulatoryField label="Gap description"><textarea className={regulatoryInputClass()} value={String(form.gapDescription ?? '')} onChange={(event) => setForm((value) => ({ ...value, gapDescription: event.target.value }))} /></RegulatoryField>
        <RegulatoryField label="Recommended fix"><textarea className={regulatoryInputClass()} value={String(form.recommendedFix ?? '')} onChange={(event) => setForm((value) => ({ ...value, recommendedFix: event.target.value }))} /></RegulatoryField>
      </div>
      {missing ? <p className="mt-3 text-sm text-danger">{missing}</p> : null}
    </RegulatoryCard>
  );
}
