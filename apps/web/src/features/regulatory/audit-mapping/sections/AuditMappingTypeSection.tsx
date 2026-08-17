import { RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';

export function AuditMappingTypeSection({ form, setForm, mappingTypes }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; mappingTypes?: string[] | undefined }) {
  return (
    <RegulatoryCard title="Mapping Type / Rationale" subtitle="Backend stores rationale, mapping type, ownership, review, due date, restricted evidence, and stale state.">
      <div className="grid gap-4 md:grid-cols-2">
        <RegulatoryField label="Mapping title"><input className={regulatoryInputClass()} value={form.mappingTitle ?? ''} onChange={(event) => setForm({ mappingTitle: event.target.value })} /></RegulatoryField>
        <RegulatoryField label="Mapping type"><select className={regulatoryInputClass()} value={form.mappingType ?? 'Manual Foundation Mapping'} onChange={(event) => setForm({ mappingType: event.target.value })}>{(mappingTypes?.length ? mappingTypes : ['Direct Audit Coverage', 'Checklist Coverage', 'Evidence-Based Coverage', 'Finding-Based Coverage', 'CAPA-Based Coverage', 'Score-Based Coverage', 'Manual Foundation Mapping']).map((item) => <option key={item}>{item}</option>)}</select></RegulatoryField>
        <RegulatoryField label="Owner user ID"><input className={regulatoryInputClass()} value={form.ownerUserId ?? ''} onChange={(event) => setForm({ ownerUserId: event.target.value })} /></RegulatoryField>
        <RegulatoryField label="Reviewer user ID"><input className={regulatoryInputClass()} value={form.reviewerUserId ?? ''} onChange={(event) => setForm({ reviewerUserId: event.target.value })} /></RegulatoryField>
        <RegulatoryField label="Due date"><input type="date" className={regulatoryInputClass()} value={form.dueDate ?? ''} onChange={(event) => setForm({ dueDate: event.target.value })} /></RegulatoryField>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={Boolean(form.restrictedAuditEvidence)} onChange={(event) => setForm({ restrictedAuditEvidence: event.target.checked })} /> Restricted audit evidence</label>
        <RegulatoryField label="Mapping rationale" helper="Required. Explain why this audit target satisfies the regulatory obligation."><textarea className={regulatoryInputClass()} rows={4} value={form.mappingRationale ?? ''} onChange={(event) => setForm({ mappingRationale: event.target.value })} /></RegulatoryField>
      </div>
    </RegulatoryCard>
  );
}
