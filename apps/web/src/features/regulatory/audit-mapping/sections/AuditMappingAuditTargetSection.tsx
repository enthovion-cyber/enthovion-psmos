import { RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';

export function AuditMappingAuditTargetSection({ form, setForm, targetTypes }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; targetTypes?: string[] | undefined }) {
  return (
    <RegulatoryCard title="Audit Target" subtitle="Link audit-side assurance records without duplicating audit module ownership.">
      <div className="grid gap-4 md:grid-cols-2">
        <RegulatoryField label="Audit target type"><select className={regulatoryInputClass()} value={form.auditTargetType ?? 'Audit Checklist'} onChange={(event) => setForm({ auditTargetType: event.target.value })}>{(targetTypes?.length ? targetTypes : ['Audit Program', 'Audit Plan', 'Audit Checklist', 'Audit Execution', 'Audit Finding', 'Audit CAPA', 'Audit Evidence', 'Audit Score', 'Foundation Placeholder']).map((item) => <option key={item}>{item}</option>)}</select></RegulatoryField>
        <RegulatoryField label="Audit target ID" helper="Use the exact audit program, plan, checklist, finding, CAPA, evidence, or score run ID."><input className={regulatoryInputClass()} value={form.auditTargetId ?? ''} onChange={(event) => setForm({ auditTargetId: event.target.value })} /></RegulatoryField>
        <RegulatoryField label="Site ID"><input className={regulatoryInputClass()} value={form.siteId ?? ''} onChange={(event) => setForm({ siteId: event.target.value })} /></RegulatoryField>
        <RegulatoryField label="Unit / area / equipment scope"><input className={regulatoryInputClass()} value={form.scopeReference ?? ''} onChange={(event) => setForm({ scopeReference: event.target.value })} /></RegulatoryField>
      </div>
    </RegulatoryCard>
  );
}
